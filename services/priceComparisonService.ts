import { getSupabaseClient } from '@/template';

export interface PriceEntry {
  id?: string;
  product_id: string | null;
  query_name: string;
  original_ingredient?: string;
  provider_name: string;
  brand_name: string | null;
  product_title: string | null;
  pack_size: string | null;
  price: number | null;
  mrp: number | null;
  discount_price: number | null;
  availability: boolean;
  delivery_time: string | null;
  product_url: string | null;
  image_url: string | null;
  pincode: string | null;
  last_updated?: string;
  match_score?: number;
  recipe_qty?: string;
  recommended_buy_qty?: string;
  leftover?: string;
  raw_response?: any;
}

export interface NormalizedInfo {
  original_name: string;
  normalized_name: string;
  recipe_qty: string;
  recipe_qty_value: number;
  recipe_unit: string;
  search_queries: string[];
  recommended_pack: string;
  preferred_brands: string[];
  category: string;
  substitute_names: string[];
}

export interface PriceComparison {
  itemName: string;
  prices: PriceEntry[];
  bestPrice: PriceEntry | null;
  fastestDelivery: PriceEntry | null;
  lastUpdated: string | null;
  isEstimated: boolean;
  normalized?: NormalizedInfo;
}

export interface GroceryItemInput {
  name: string;
  qty: string;
}

// Fetch price comparisons with enhanced matching
export async function fetchPriceComparisons(
  items: (string | GroceryItemInput)[],
  pincode: string = '400001',
): Promise<{ data: Record<string, PriceComparison> | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();

    // Format items with quantities for enhanced matching
    const formattedItems = items.map(item => {
      if (typeof item === 'string') return { name: item, qty: '1 pack' };
      return item;
    });

    const { data, error } = await supabase.functions.invoke('grocery-price-scraper', {
      body: { items: formattedItems, pincode },
    });

    if (error) {
      let errorMessage = error.message || 'Failed to fetch prices';
      try {
        if (error.context) {
          const text = await error.context.text();
          if (text) errorMessage = text;
        }
      } catch {}
      console.error('Price comparison error:', errorMessage);
      return { data: null, error: errorMessage };
    }

    if (!data?.success || !data?.data) {
      return { data: null, error: 'No price data returned' };
    }

    // Process enhanced results
    const comparisons: Record<string, PriceComparison> = {};

    for (const [itemName, result] of Object.entries(data.data as Record<string, { normalized: NormalizedInfo; products: PriceEntry[] }>)) {
      const products = result.products || [];
      const normalized = result.normalized;

      const validPrices = products.filter((p: PriceEntry) => p.price !== null && p.availability);
      const allPrices = products;

      // Find best price (highest match score + lowest price)
      const bestPrice = validPrices.length > 0
        ? validPrices.reduce((best: PriceEntry, curr: PriceEntry) => {
            const currEffective = curr.discount_price || curr.price || Infinity;
            const bestEffective = best.discount_price || best.price || Infinity;
            // Prefer higher match score, then lower price
            if ((curr.match_score || 0) > (best.match_score || 0) + 10) return curr;
            if (currEffective < bestEffective) return curr;
            return best;
          })
        : null;

      // Find fastest delivery
      const deliveryOrder = ['10 min', '10-15 min', '15-30 min', '30-60 min', '2-4 hrs'];
      const fastestDelivery = validPrices.length > 0
        ? validPrices.reduce((fastest: PriceEntry, curr: PriceEntry) => {
            const currIdx = deliveryOrder.findIndex(d => d === curr.delivery_time);
            const fastIdx = deliveryOrder.findIndex(d => d === fastest.delivery_time);
            return (currIdx !== -1 && (fastIdx === -1 || currIdx < fastIdx)) ? curr : fastest;
          })
        : null;

      const isEstimated = allPrices.every((p: PriceEntry) =>
        p.raw_response?.estimated === true
      );

      comparisons[itemName] = {
        itemName,
        prices: allPrices,
        bestPrice,
        fastestDelivery,
        lastUpdated: allPrices[0]?.last_updated || null,
        isEstimated,
        normalized,
      };
    }

    return { data: comparisons, error: null };
  } catch (err: any) {
    console.error('Price comparison service error:', err);
    return { data: null, error: err.message || 'Failed to fetch prices' };
  }
}

// Get cached prices directly from DB
export async function getCachedPrices(
  items: string[],
  pincode: string = '400001',
): Promise<{ data: Record<string, PriceEntry[]> | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('price_comparison')
      .select('*')
      .in('query_name', items.map(i => i.toLowerCase()))
      .eq('pincode', pincode)
      .order('last_updated', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const grouped: Record<string, PriceEntry[]> = {};
    (data || []).forEach((entry: PriceEntry) => {
      const key = entry.query_name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    return { data: grouped, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// Check if prices need refresh
export function needsRefresh(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const updated = new Date(lastUpdated).getTime();
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  return updated < thirtyMinAgo;
}

// Provider metadata for UI
export const PROVIDER_META: Record<string, { emoji: string; color: string; tagline: string }> = {
  'Zepto': { emoji: '⚡', color: '#7B2D8E', tagline: '10 min delivery' },
  'Blinkit': { emoji: '🟡', color: '#F8CB2E', tagline: '10-15 min delivery' },
  'BigBasket': { emoji: '🟢', color: '#84C225', tagline: '2-4 hrs delivery' },
  'Instamart': { emoji: '🟠', color: '#FC8019', tagline: '15-30 min delivery' },
  'Local Kirana': { emoji: '🏪', color: '#FF8C42', tagline: 'Neighborhood store' },
};

// Match score color based on confidence
export function getMatchScoreColor(score: number): string {
  if (score >= 90) return '#4ADE80';
  if (score >= 80) return '#84CC16';
  if (score >= 70) return '#F5B731';
  return '#F97316';
}

// Match score label
export function getMatchScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Match';
  if (score >= 80) return 'Good Match';
  if (score >= 70) return 'Fair Match';
  return 'Best Available';
}
