/**
 * Pantry Inventory Service
 * Manages leftover items, expiry tracking, and auto-deduction for grocery planning.
 */

import { getSupabaseClient } from '@/template';

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  remaining_quantity: string;
  remaining_value: number;
  last_purchased_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PantryItemInput {
  ingredient_name: string;
  remaining_quantity: string;
  remaining_value?: number;
  expires_at?: string;
}

// ── Fetch all pantry items for user ──
export async function fetchPantryItems(userId: string): Promise<{ data: PantryItem[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pantry_inventory')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// ── Add new pantry item ──
export async function addPantryItem(userId: string, item: PantryItemInput): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('pantry_inventory').insert({
      user_id: userId,
      ingredient_name: item.ingredient_name,
      remaining_quantity: item.remaining_quantity,
      remaining_value: item.remaining_value || 0,
      last_purchased_at: new Date().toISOString(),
      expires_at: item.expires_at || null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Update pantry item quantity ──
export async function updatePantryItem(itemId: string, updates: Partial<PantryItemInput>): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('pantry_inventory')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Mark item as used/finished (delete from pantry) ──
export async function markItemUsed(itemId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('pantry_inventory')
      .delete()
      .eq('id', itemId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Add leftover items from grocery cart ──
export async function addLeftoversFromCart(
  userId: string,
  leftovers: { name: string; quantity: string; value: number; expiresInDays?: number }[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const records = leftovers.map(item => ({
      user_id: userId,
      ingredient_name: item.name,
      remaining_quantity: item.quantity,
      remaining_value: item.value,
      last_purchased_at: new Date().toISOString(),
      expires_at: item.expiresInDays
        ? new Date(Date.now() + item.expiresInDays * 86400000).toISOString()
        : null,
    }));

    const { error } = await supabase.from('pantry_inventory').insert(records);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Get pantry deductions for grocery planning ──
// Returns a map of ingredient name -> remaining quantity in grams/ml/pcs
export async function getPantryDeductions(userId: string): Promise<Record<string, number>> {
  const { data } = await fetchPantryItems(userId);
  if (!data) return {};

  const deductions: Record<string, number> = {};
  data.forEach(item => {
    const qty = parseQuantityToGrams(item.remaining_quantity);
    if (qty > 0) {
      const key = item.ingredient_name.toLowerCase();
      deductions[key] = (deductions[key] || 0) + qty;
    }
  });

  return deductions;
}

// ── Parse quantity string to numeric value (grams/ml/pcs) ──
function parseQuantityToGrams(qtyStr: string): number {
  if (!qtyStr) return 0;
  const match = qtyStr.match(/([\d.]+)\s*(kg|g|ml|l|L|pcs|pack|bunch|dozen)?/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'g').toLowerCase();
  switch (unit) {
    case 'kg': return val * 1000;
    case 'l': return val * 1000;
    case 'dozen': return val * 12;
    default: return val;
  }
}

// ── Get expiry status ──
export function getExpiryStatus(expiresAt: string | null): 'expired' | 'expiring_soon' | 'fresh' | 'unknown' {
  if (!expiresAt) return 'unknown';
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);

  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring_soon';
  return 'fresh';
}

// ── Get days until expiry ──
export function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
}

// ── Category emoji mapping ──
export function getPantryEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (['milk'].some(v => lower.includes(v))) return '🥛';
  if (['curd', 'yogurt'].some(v => lower.includes(v))) return '🥣';
  if (['paneer', 'cheese'].some(v => lower.includes(v))) return '🧀';
  if (['butter', 'ghee'].some(v => lower.includes(v))) return '🧈';
  if (['rice'].some(v => lower.includes(v))) return '🍚';
  if (['atta', 'flour', 'wheat'].some(v => lower.includes(v))) return '🌾';
  if (['dal', 'lentil', 'chana', 'moong', 'toor'].some(v => lower.includes(v))) return '🫘';
  if (['oil', 'sunflower', 'mustard oil'].some(v => lower.includes(v))) return '🫗';
  if (['sugar'].some(v => lower.includes(v))) return '🍬';
  if (['salt'].some(v => lower.includes(v))) return '🧂';
  if (['onion'].some(v => lower.includes(v))) return '🧅';
  if (['tomato'].some(v => lower.includes(v))) return '🍅';
  if (['potato'].some(v => lower.includes(v))) return '🥔';
  if (['spinach', 'palak', 'methi'].some(v => lower.includes(v))) return '🥬';
  if (['egg'].some(v => lower.includes(v))) return '🥚';
  if (['banana'].some(v => lower.includes(v))) return '🍌';
  if (['apple'].some(v => lower.includes(v))) return '🍎';
  if (['bread'].some(v => lower.includes(v))) return '🍞';
  if (['turmeric', 'cumin', 'masala', 'chilli', 'coriander powder', 'mustard seed'].some(v => lower.includes(v))) return '🌶️';
  return '📦';
}
