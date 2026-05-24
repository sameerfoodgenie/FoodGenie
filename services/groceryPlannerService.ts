/**
 * Smart Grocery Planner Service
 * Generates aggregated weekly/monthly grocery lists based on:
 * - duration (today/weekly/monthly)
 * - family size
 * - budget
 * - user dietary preferences (from user_preferences table)
 * - proper quantity calculations with buffer factors
 */

import { getSupabaseClient } from '@/template';

export interface PlanConfig {
  duration: string;
  familySize: string;
  budget: number;
  brands: string[];
  dietType?: string;
}

export interface GroceryPlanItem {
  name: string;
  totalQty: string;
  recommendedPack: string;
  numPacks: number;
  category: string;
  emoji: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  estimatedPrice: number;
  usage: string;
  leftover: string;
}

export interface GroceryPlanResult {
  items: GroceryPlanItem[];
  totalEstimatedCost: number;
  duration: string;
  familySize: string;
  budget: number;
  durationDays: number;
  bufferFactor: number;
  mealsPerDay: number;
  planSummary: {
    planType: string;
    people: string;
    durationDays: number;
    mealsCovered: string;
    bufferPercent: number;
  };
}

// ── Dietary Filters ──
const NON_VEG_ITEMS = ['chicken', 'mutton', 'fish', 'prawn', 'egg', 'meat', 'lamb', 'pork', 'beef', 'bacon', 'ham', 'sausage', 'keema', 'seekh'];
const JAIN_EXCLUDE = ['onion', 'garlic', 'potato', 'ginger', 'carrot', 'beetroot', 'radish', 'turnip', 'mushroom'];
const DAIRY_ITEMS = ['milk', 'curd', 'yogurt', 'paneer', 'butter', 'ghee', 'cheese', 'cream', 'khoya', 'mawa'];

export function isDietaryAllowed(itemName: string, dietType: string): boolean {
  const lower = itemName.toLowerCase();

  if (dietType === 'vegetarian' || dietType === 'budget' || dietType === 'healthy' || dietType === 'south_indian' || dietType === 'north_indian' || dietType === 'gujarati' || dietType === 'kids' || dietType === 'family') {
    if (NON_VEG_ITEMS.some(nv => lower.includes(nv))) return false;
  }

  if (dietType === 'jain') {
    if (NON_VEG_ITEMS.some(nv => lower.includes(nv))) return false;
    if (JAIN_EXCLUDE.some(j => lower.includes(j))) return false;
  }

  if (dietType === 'vegan') {
    if (NON_VEG_ITEMS.some(nv => lower.includes(nv))) return false;
    if (DAIRY_ITEMS.some(d => lower.includes(d))) return false;
  }

  return true;
}

// ── Fetch User Dietary Preferences ──
export async function fetchUserDietPreference(userId: string): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('user_preferences')
      .select('diet, avoid_tags, health_goal')
      .eq('user_id', userId)
      .single();

    if (data?.diet) return data.diet;
    return 'vegetarian'; // Default for Indian users
  } catch {
    return 'vegetarian';
  }
}

// ── Buffer Factors (accounts for waste, guests, extra consumption) ──
function getBufferFactor(familySize: string): number {
  switch (familySize) {
    case '1': return 1.0;
    case '2': return 1.15;
    case '3-4': return 1.30;
    case '5+': return 1.45;
    default: return 1.0;
  }
}

// ── People Count (actual number of people) ──
function getPeopleCount(familySize: string): number {
  switch (familySize) {
    case '1': return 1;
    case '2': return 2;
    case '3-4': return 3.5;
    case '5+': return 5.5;
    default: return 1;
  }
}

// ── Duration Days ──
function getDurationDays(duration: string): number {
  switch (duration) {
    case 'today': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    default: return 1;
  }
}

// ── Base Daily Grocery Per Person (grams/ml/pieces per day) ──
interface BaseItem {
  name: string;
  dailyQtyPerPerson: number; // grams or ml or pieces
  unit: 'g' | 'ml' | 'pcs';
  category: string;
  emoji: string;
  mealsUsedIn: number; // how many meals per day this is used in (affects consumption)
  purchaseFrequency: 'daily' | 'weekly' | 'monthly'; // how often bought
}

const BASE_GROCERY_ITEMS: BaseItem[] = [
  // Grains & Staples (monthly purchase, daily consumption)
  { name: 'Atta (Wheat Flour)', dailyQtyPerPerson: 200, unit: 'g', category: 'Grains & Staples', emoji: '🌾', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Basmati Rice', dailyQtyPerPerson: 150, unit: 'g', category: 'Grains & Staples', emoji: '🍚', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Toor Dal', dailyQtyPerPerson: 40, unit: 'g', category: 'Grains & Staples', emoji: '🫘', mealsUsedIn: 1, purchaseFrequency: 'monthly' },
  { name: 'Moong Dal', dailyQtyPerPerson: 30, unit: 'g', category: 'Grains & Staples', emoji: '🫘', mealsUsedIn: 1, purchaseFrequency: 'monthly' },
  { name: 'Chana Dal', dailyQtyPerPerson: 20, unit: 'g', category: 'Grains & Staples', emoji: '🫘', mealsUsedIn: 1, purchaseFrequency: 'monthly' },
  { name: 'Sugar', dailyQtyPerPerson: 30, unit: 'g', category: 'Grains & Staples', emoji: '🍬', mealsUsedIn: 3, purchaseFrequency: 'monthly' },
  { name: 'Poha', dailyQtyPerPerson: 15, unit: 'g', category: 'Grains & Staples', emoji: '🥣', mealsUsedIn: 0.3, purchaseFrequency: 'monthly' },

  // Dairy (daily/weekly purchase)
  { name: 'Milk', dailyQtyPerPerson: 400, unit: 'ml', category: 'Dairy', emoji: '🥛', mealsUsedIn: 3, purchaseFrequency: 'daily' },
  { name: 'Curd', dailyQtyPerPerson: 100, unit: 'g', category: 'Dairy', emoji: '🥣', mealsUsedIn: 1, purchaseFrequency: 'weekly' },
  { name: 'Paneer', dailyQtyPerPerson: 40, unit: 'g', category: 'Dairy', emoji: '🧀', mealsUsedIn: 0.5, purchaseFrequency: 'weekly' },
  { name: 'Butter', dailyQtyPerPerson: 10, unit: 'g', category: 'Dairy', emoji: '🧈', mealsUsedIn: 1, purchaseFrequency: 'monthly' },
  { name: 'Ghee', dailyQtyPerPerson: 15, unit: 'ml', category: 'Dairy', emoji: '🧈', mealsUsedIn: 2, purchaseFrequency: 'monthly' },

  // Vegetables (2-3 times per week purchase)
  { name: 'Onions', dailyQtyPerPerson: 120, unit: 'g', category: 'Vegetables', emoji: '🧅', mealsUsedIn: 2, purchaseFrequency: 'weekly' },
  { name: 'Tomatoes', dailyQtyPerPerson: 100, unit: 'g', category: 'Vegetables', emoji: '🍅', mealsUsedIn: 2, purchaseFrequency: 'weekly' },
  { name: 'Potatoes', dailyQtyPerPerson: 80, unit: 'g', category: 'Vegetables', emoji: '🥔', mealsUsedIn: 1, purchaseFrequency: 'weekly' },
  { name: 'Green Chillies', dailyQtyPerPerson: 5, unit: 'g', category: 'Vegetables', emoji: '🌶️', mealsUsedIn: 2, purchaseFrequency: 'weekly' },
  { name: 'Coriander Leaves', dailyQtyPerPerson: 10, unit: 'g', category: 'Vegetables', emoji: '🌿', mealsUsedIn: 2, purchaseFrequency: 'weekly' },
  { name: 'Spinach', dailyQtyPerPerson: 40, unit: 'g', category: 'Vegetables', emoji: '🥬', mealsUsedIn: 0.5, purchaseFrequency: 'weekly' },
  { name: 'Capsicum', dailyQtyPerPerson: 20, unit: 'g', category: 'Vegetables', emoji: '🫑', mealsUsedIn: 0.3, purchaseFrequency: 'weekly' },
  { name: 'Cauliflower', dailyQtyPerPerson: 30, unit: 'g', category: 'Vegetables', emoji: '🥦', mealsUsedIn: 0.3, purchaseFrequency: 'weekly' },
  { name: 'Ginger', dailyQtyPerPerson: 5, unit: 'g', category: 'Vegetables', emoji: '🫚', mealsUsedIn: 2, purchaseFrequency: 'weekly' },
  { name: 'Garlic', dailyQtyPerPerson: 5, unit: 'g', category: 'Vegetables', emoji: '🧄', mealsUsedIn: 2, purchaseFrequency: 'weekly' },

  // Fruits (2-3 times per week)
  { name: 'Bananas', dailyQtyPerPerson: 1, unit: 'pcs', category: 'Fruits', emoji: '🍌', mealsUsedIn: 1, purchaseFrequency: 'weekly' },
  { name: 'Apples', dailyQtyPerPerson: 0.5, unit: 'pcs', category: 'Fruits', emoji: '🍎', mealsUsedIn: 0.5, purchaseFrequency: 'weekly' },

  // Oils & Fats (monthly purchase)
  { name: 'Sunflower Oil', dailyQtyPerPerson: 30, unit: 'ml', category: 'Oils & Fats', emoji: '🫗', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Mustard Oil', dailyQtyPerPerson: 10, unit: 'ml', category: 'Oils & Fats', emoji: '🫗', mealsUsedIn: 1, purchaseFrequency: 'monthly' },

  // Spices & Seasonings (monthly purchase, small daily usage)
  { name: 'Turmeric Powder', dailyQtyPerPerson: 3, unit: 'g', category: 'Spices & Seasonings', emoji: '🟡', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Red Chilli Powder', dailyQtyPerPerson: 3, unit: 'g', category: 'Spices & Seasonings', emoji: '🔴', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Cumin Seeds', dailyQtyPerPerson: 2, unit: 'g', category: 'Spices & Seasonings', emoji: '🟤', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Coriander Powder', dailyQtyPerPerson: 3, unit: 'g', category: 'Spices & Seasonings', emoji: '🟢', mealsUsedIn: 2, purchaseFrequency: 'monthly' },
  { name: 'Garam Masala', dailyQtyPerPerson: 2, unit: 'g', category: 'Spices & Seasonings', emoji: '🌶️', mealsUsedIn: 1, purchaseFrequency: 'monthly' },
  { name: 'Salt', dailyQtyPerPerson: 5, unit: 'g', category: 'Spices & Seasonings', emoji: '🧂', mealsUsedIn: 3, purchaseFrequency: 'monthly' },
  { name: 'Mustard Seeds', dailyQtyPerPerson: 1, unit: 'g', category: 'Spices & Seasonings', emoji: '🟡', mealsUsedIn: 1, purchaseFrequency: 'monthly' },

  // Protein (weekly purchase)
  { name: 'Eggs', dailyQtyPerPerson: 1.5, unit: 'pcs', category: 'Protein', emoji: '🥚', mealsUsedIn: 1, purchaseFrequency: 'weekly' },
];

// ── Pack Sizes with multiple pack recommendations ──
interface PackOption {
  size: string;
  sizeGrams: number; // in grams/ml/pcs
  price: number;
}

const PACK_OPTIONS: Record<string, PackOption[]> = {
  'Atta (Wheat Flour)': [
    { size: '1kg', sizeGrams: 1000, price: 48 },
    { size: '5kg', sizeGrams: 5000, price: 198 },
    { size: '10kg', sizeGrams: 10000, price: 380 },
  ],
  'Basmati Rice': [
    { size: '1kg', sizeGrams: 1000, price: 85 },
    { size: '5kg', sizeGrams: 5000, price: 399 },
    { size: '10kg', sizeGrams: 10000, price: 750 },
    { size: '25kg', sizeGrams: 25000, price: 1650 },
  ],
  'Toor Dal': [
    { size: '500g', sizeGrams: 500, price: 75 },
    { size: '1kg', sizeGrams: 1000, price: 135 },
    { size: '2kg', sizeGrams: 2000, price: 250 },
    { size: '5kg', sizeGrams: 5000, price: 580 },
  ],
  'Moong Dal': [
    { size: '500g', sizeGrams: 500, price: 65 },
    { size: '1kg', sizeGrams: 1000, price: 115 },
    { size: '2kg', sizeGrams: 2000, price: 210 },
  ],
  'Chana Dal': [
    { size: '500g', sizeGrams: 500, price: 55 },
    { size: '1kg', sizeGrams: 1000, price: 98 },
    { size: '2kg', sizeGrams: 2000, price: 180 },
  ],
  'Sugar': [
    { size: '1kg', sizeGrams: 1000, price: 45 },
    { size: '2kg', sizeGrams: 2000, price: 85 },
    { size: '5kg', sizeGrams: 5000, price: 200 },
  ],
  'Poha': [
    { size: '500g', sizeGrams: 500, price: 32 },
    { size: '1kg', sizeGrams: 1000, price: 58 },
  ],
  'Milk': [
    { size: '500ml', sizeGrams: 500, price: 28 },
    { size: '1L', sizeGrams: 1000, price: 56 },
  ],
  'Curd': [
    { size: '200g', sizeGrams: 200, price: 20 },
    { size: '400g', sizeGrams: 400, price: 35 },
    { size: '1kg', sizeGrams: 1000, price: 75 },
  ],
  'Paneer': [
    { size: '200g', sizeGrams: 200, price: 60 },
    { size: '500g', sizeGrams: 500, price: 135 },
    { size: '1kg', sizeGrams: 1000, price: 250 },
  ],
  'Butter': [
    { size: '100g', sizeGrams: 100, price: 52 },
    { size: '200g', sizeGrams: 200, price: 98 },
    { size: '500g', sizeGrams: 500, price: 235 },
  ],
  'Ghee': [
    { size: '200ml', sizeGrams: 200, price: 110 },
    { size: '500ml', sizeGrams: 500, price: 245 },
    { size: '1L', sizeGrams: 1000, price: 460 },
  ],
  'Sunflower Oil': [
    { size: '1L', sizeGrams: 1000, price: 130 },
    { size: '2L', sizeGrams: 2000, price: 249 },
    { size: '5L', sizeGrams: 5000, price: 580 },
  ],
  'Mustard Oil': [
    { size: '500ml', sizeGrams: 500, price: 75 },
    { size: '1L', sizeGrams: 1000, price: 140 },
  ],
  'Onions': [
    { size: '1kg', sizeGrams: 1000, price: 26 },
    { size: '2kg', sizeGrams: 2000, price: 52 },
    { size: '5kg', sizeGrams: 5000, price: 120 },
  ],
  'Tomatoes': [
    { size: '500g', sizeGrams: 500, price: 20 },
    { size: '1kg', sizeGrams: 1000, price: 35 },
    { size: '2kg', sizeGrams: 2000, price: 65 },
  ],
  'Potatoes': [
    { size: '1kg', sizeGrams: 1000, price: 22 },
    { size: '2kg', sizeGrams: 2000, price: 45 },
    { size: '5kg', sizeGrams: 5000, price: 100 },
  ],
  'Eggs': [
    { size: '6 pcs', sizeGrams: 6, price: 42 },
    { size: '12 pcs', sizeGrams: 12, price: 78 },
    { size: '30 pcs', sizeGrams: 30, price: 180 },
  ],
  'Turmeric Powder': [
    { size: '100g', sizeGrams: 100, price: 22 },
    { size: '200g', sizeGrams: 200, price: 38 },
    { size: '500g', sizeGrams: 500, price: 85 },
  ],
  'Red Chilli Powder': [
    { size: '100g', sizeGrams: 100, price: 25 },
    { size: '200g', sizeGrams: 200, price: 48 },
    { size: '500g', sizeGrams: 500, price: 110 },
  ],
  'Cumin Seeds': [
    { size: '50g', sizeGrams: 50, price: 18 },
    { size: '100g', sizeGrams: 100, price: 32 },
    { size: '200g', sizeGrams: 200, price: 60 },
  ],
  'Coriander Powder': [
    { size: '100g', sizeGrams: 100, price: 20 },
    { size: '200g', sizeGrams: 200, price: 36 },
    { size: '500g', sizeGrams: 500, price: 80 },
  ],
  'Garam Masala': [
    { size: '50g', sizeGrams: 50, price: 30 },
    { size: '100g', sizeGrams: 100, price: 55 },
    { size: '200g', sizeGrams: 200, price: 100 },
  ],
  'Salt': [
    { size: '1kg', sizeGrams: 1000, price: 25 },
  ],
  'Mustard Seeds': [
    { size: '50g', sizeGrams: 50, price: 12 },
    { size: '100g', sizeGrams: 100, price: 20 },
  ],
  'Bananas': [
    { size: '6 pcs', sizeGrams: 6, price: 30 },
    { size: '12 pcs', sizeGrams: 12, price: 55 },
  ],
  'Apples': [
    { size: '500g', sizeGrams: 3, price: 80 },
    { size: '1kg', sizeGrams: 6, price: 150 },
  ],
  'Green Chillies': [
    { size: '100g', sizeGrams: 100, price: 10 },
    { size: '250g', sizeGrams: 250, price: 20 },
  ],
  'Coriander Leaves': [
    { size: '1 bunch', sizeGrams: 100, price: 8 },
  ],
  'Spinach': [
    { size: '250g', sizeGrams: 250, price: 15 },
    { size: '500g', sizeGrams: 500, price: 25 },
  ],
  'Capsicum': [
    { size: '250g', sizeGrams: 250, price: 30 },
    { size: '500g', sizeGrams: 500, price: 55 },
  ],
  'Cauliflower': [
    { size: '1 pc', sizeGrams: 500, price: 30 },
  ],
  'Ginger': [
    { size: '100g', sizeGrams: 100, price: 15 },
    { size: '250g', sizeGrams: 250, price: 30 },
  ],
  'Garlic': [
    { size: '100g', sizeGrams: 100, price: 20 },
    { size: '250g', sizeGrams: 250, price: 45 },
  ],
};

// ── Optimized Pack Selection (supports multiple packs) ──
function selectOptimalPacks(itemName: string, requiredQty: number, unit: string): {
  packs: string;
  numPacks: number;
  totalPrice: number;
  totalQtyBought: number;
} {
  const options = PACK_OPTIONS[itemName];
  if (!options || options.length === 0) {
    // Fallback estimation
    const estimatedPrice = Math.ceil(requiredQty * 0.08);
    const qtyStr = unit === 'pcs' ? `${Math.ceil(requiredQty)} pcs` :
      requiredQty >= 1000 ? `${(requiredQty / 1000).toFixed(1)}kg` : `${Math.ceil(requiredQty)}g`;
    return { packs: qtyStr, numPacks: 1, totalPrice: Math.max(estimatedPrice, 20), totalQtyBought: requiredQty };
  }

  // Find the most cost-effective combination
  // Strategy: Use largest pack that fits, then fill remainder
  let remaining = requiredQty;
  let totalPrice = 0;
  let numPacks = 0;
  const packList: string[] = [];
  let totalBought = 0;

  // Sort packs by size descending
  const sorted = [...options].sort((a, b) => b.sizeGrams - a.sizeGrams);

  for (const pack of sorted) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / pack.sizeGrams);
    if (count > 0) {
      remaining -= count * pack.sizeGrams;
      totalPrice += count * pack.price;
      numPacks += count;
      totalBought += count * pack.sizeGrams;
      packList.push(`${pack.size} x ${count}`);
    }
  }

  // If still remaining, add one more of the smallest pack that covers it
  if (remaining > 0) {
    // Find smallest pack that covers remaining
    const sortedAsc = [...options].sort((a, b) => a.sizeGrams - b.sizeGrams);
    const coverPack = sortedAsc.find(p => p.sizeGrams >= remaining) || sortedAsc[sortedAsc.length - 1];
    totalPrice += coverPack.price;
    numPacks += 1;
    totalBought += coverPack.sizeGrams;
    packList.push(`${coverPack.size} x 1`);
  }

  return {
    packs: packList.join(' + '),
    numPacks,
    totalPrice,
    totalQtyBought: totalBought,
  };
}

// ── Format quantity for display ──
function formatQty(qty: number, unit: string): string {
  if (unit === 'pcs') return `${Math.ceil(qty)} pcs`;
  if (unit === 'ml') {
    if (qty >= 1000) return `${(qty / 1000).toFixed(1)}L`;
    return `${Math.ceil(qty)}ml`;
  }
  if (qty >= 1000) return `${(qty / 1000).toFixed(1)}kg`;
  return `${Math.ceil(qty)}g`;
}

// ── Main Planner Function ──
export function generateSmartGroceryPlan(config: PlanConfig): GroceryPlanResult {
  const peopleCount = getPeopleCount(config.familySize);
  const bufferFactor = getBufferFactor(config.familySize);
  const durationDays = getDurationDays(config.duration);
  const dietType = config.dietType || 'vegetarian';
  const mealsPerDay = 3; // breakfast, lunch, dinner

  // Filter items by dietary preference
  const allowedItems = BASE_GROCERY_ITEMS.filter(item => isDietaryAllowed(item.name, dietType));

  const planItems: GroceryPlanItem[] = [];
  let totalCost = 0;

  allowedItems.forEach(item => {
    // Calculate total required quantity
    // Formula: dailyQty × people × days × buffer
    const totalRequired = item.dailyQtyPerPerson * peopleCount * durationDays * bufferFactor;

    // Select optimal packs
    const packResult = selectOptimalPacks(item.name, totalRequired, item.unit);

    // Calculate leftover
    const leftoverQty = packResult.totalQtyBought - totalRequired;
    const leftoverStr = leftoverQty > 10 ? formatQty(leftoverQty, item.unit) : 'Minimal';

    // Usage description
    const dailyUsage = item.dailyQtyPerPerson * peopleCount;
    const usageStr = item.purchaseFrequency === 'daily'
      ? `${formatQty(dailyUsage, item.unit)}/day`
      : item.purchaseFrequency === 'weekly'
        ? `${formatQty(dailyUsage * 7, item.unit)}/week`
        : `${formatQty(totalRequired, item.unit)} for ${durationDays} days`;

    planItems.push({
      name: item.name,
      totalQty: formatQty(totalRequired, item.unit),
      recommendedPack: packResult.packs,
      numPacks: packResult.numPacks,
      category: item.category,
      emoji: item.emoji,
      frequency: item.purchaseFrequency,
      estimatedPrice: packResult.totalPrice,
      usage: usageStr,
      leftover: leftoverStr,
    });

    totalCost += packResult.totalPrice;
  });

  // Sort by category for better organization
  const categoryOrder = ['Grains & Staples', 'Dairy', 'Vegetables', 'Fruits', 'Oils & Fats', 'Spices & Seasonings', 'Protein'];
  planItems.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category);
    const bi = categoryOrder.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return {
    items: planItems,
    totalEstimatedCost: totalCost,
    duration: config.duration,
    familySize: config.familySize,
    budget: config.budget,
    durationDays,
    bufferFactor,
    mealsPerDay,
    planSummary: {
      planType: config.duration.charAt(0).toUpperCase() + config.duration.slice(1),
      people: config.familySize === '3-4' ? '3-4 members' : config.familySize === '5+' ? '5+ members' : `${config.familySize} person${config.familySize !== '1' ? 's' : ''}`,
      durationDays,
      mealsCovered: 'Breakfast, Lunch, Dinner',
      bufferPercent: Math.round((bufferFactor - 1) * 100),
    },
  };
}

// ── Schedule Essentials Service ──
export interface ScheduleItem {
  item_name: string;
  quantity: string;
  unit: string;
  frequency: string;
  days_of_week: string[];
  time_slot: string;
  provider_preference: string;
  budget_limit: number;
  start_date: string;
  end_date?: string;
  notification_enabled: boolean;
}

export async function saveGrocerySchedules(userId: string, items: ScheduleItem[]): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const records = items.map(item => ({
      user_id: userId,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      frequency: item.frequency,
      days_of_week: item.days_of_week,
      time_slot: item.time_slot,
      provider_preference: item.provider_preference,
      budget_limit: item.budget_limit,
      start_date: item.start_date,
      end_date: item.end_date || null,
      next_order_date: item.start_date,
      notification_enabled: item.notification_enabled,
      status: 'active',
    }));

    const { error } = await supabase.from('scheduled_grocery_orders').insert(records);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchActiveSchedules(userId: string): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scheduled_grocery_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('next_order_date', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

export async function updateScheduleStatus(scheduleId: string, status: 'active' | 'paused' | 'cancelled'): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('scheduled_grocery_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', scheduleId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
