/**
 * Smart Grocery Planner Service
 * Generates aggregated weekly/monthly grocery lists based on:
 * - duration (today/weekly/monthly)
 * - family size
 * - meal plan type
 * - brand preferences
 * - dietary preferences (vegetarian/vegan/jain filtering)
 */

export interface PlanConfig {
  duration: string;
  familySize: string;
  mealPlan: string;
  brands: string[];
}

export interface GroceryPlanItem {
  name: string;
  qty: string;
  category: string;
  emoji: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  estimatedPrice: number;
}

// ── Dietary Filters ──
const NON_VEG_ITEMS = ['chicken', 'mutton', 'fish', 'prawn', 'egg', 'meat', 'lamb', 'pork', 'beef', 'bacon', 'ham', 'sausage', 'keema', 'seekh'];
const JAIN_EXCLUDE = ['onion', 'garlic', 'potato', 'ginger', 'carrot', 'beetroot', 'radish', 'turnip', 'mushroom'];
const DAIRY_ITEMS = ['milk', 'curd', 'yogurt', 'paneer', 'butter', 'ghee', 'cheese', 'cream', 'khoya', 'mawa'];

export function isDietaryAllowed(itemName: string, dietType: string): boolean {
  const lower = itemName.toLowerCase();

  if (dietType === 'vegetarian' || dietType === 'budget' || dietType === 'healthy' || dietType === 'south_indian' || dietType === 'north_indian' || dietType === 'gujarati' || dietType === 'kids' || dietType === 'family') {
    // Default vegetarian filtering for Indian plans
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

// ── Family Size Multipliers ──
function getFamilyMultiplier(familySize: string): number {
  switch (familySize) {
    case '1': return 1;
    case '2': return 1.8;
    case '3-4': return 3.2;
    case '5+': return 4.5;
    default: return 1;
  }
}

// ── Duration Multiplier (for daily base quantities) ──
function getDurationDays(duration: string): number {
  switch (duration) {
    case 'today': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    default: return 1;
  }
}

// ── Base Daily Grocery Template (per person) ──
const BASE_DAILY_GROCERY: Record<string, GroceryPlanItem[]> = {
  default: [
    // Grains
    { name: 'Rice', qty: '150g', category: 'Grains & Staples', emoji: '🍚', frequency: 'daily', estimatedPrice: 12 },
    { name: 'Atta (Wheat Flour)', qty: '150g', category: 'Grains & Staples', emoji: '🌾', frequency: 'daily', estimatedPrice: 8 },
    { name: 'Toor Dal', qty: '50g', category: 'Grains & Staples', emoji: '🫘', frequency: 'daily', estimatedPrice: 8 },
    { name: 'Moong Dal', qty: '30g', category: 'Grains & Staples', emoji: '🫘', frequency: 'daily', estimatedPrice: 5 },
    // Dairy
    { name: 'Milk', qty: '500ml', category: 'Dairy', emoji: '🥛', frequency: 'daily', estimatedPrice: 28 },
    { name: 'Curd', qty: '100g', category: 'Dairy', emoji: '🥣', frequency: 'daily', estimatedPrice: 10 },
    { name: 'Paneer', qty: '50g', category: 'Dairy', emoji: '🧀', frequency: 'daily', estimatedPrice: 18 },
    { name: 'Ghee', qty: '15ml', category: 'Dairy', emoji: '🧈', frequency: 'daily', estimatedPrice: 10 },
    // Vegetables
    { name: 'Onions', qty: '150g', category: 'Vegetables', emoji: '🧅', frequency: 'daily', estimatedPrice: 5 },
    { name: 'Tomatoes', qty: '100g', category: 'Vegetables', emoji: '🍅', frequency: 'daily', estimatedPrice: 4 },
    { name: 'Potatoes', qty: '100g', category: 'Vegetables', emoji: '🥔', frequency: 'daily', estimatedPrice: 3 },
    { name: 'Green Chillies', qty: '10g', category: 'Vegetables', emoji: '🌶️', frequency: 'daily', estimatedPrice: 1 },
    { name: 'Coriander Leaves', qty: '20g', category: 'Vegetables', emoji: '🌿', frequency: 'daily', estimatedPrice: 2 },
    { name: 'Spinach', qty: '50g', category: 'Vegetables', emoji: '🥬', frequency: 'daily', estimatedPrice: 3 },
    // Oils
    { name: 'Sunflower Oil', qty: '30ml', category: 'Oils & Fats', emoji: '🫗', frequency: 'daily', estimatedPrice: 5 },
    // Spices
    { name: 'Turmeric Powder', qty: '3g', category: 'Spices & Seasonings', emoji: '🟡', frequency: 'daily', estimatedPrice: 1 },
    { name: 'Cumin Seeds', qty: '3g', category: 'Spices & Seasonings', emoji: '🟤', frequency: 'daily', estimatedPrice: 1 },
    { name: 'Red Chilli Powder', qty: '3g', category: 'Spices & Seasonings', emoji: '🔴', frequency: 'daily', estimatedPrice: 1 },
    { name: 'Salt', qty: '5g', category: 'Spices & Seasonings', emoji: '🧂', frequency: 'daily', estimatedPrice: 0.5 },
    // Fruits
    { name: 'Banana', qty: '1 pc', category: 'Fruits', emoji: '🍌', frequency: 'daily', estimatedPrice: 5 },
    // Protein
    { name: 'Eggs', qty: '2 pcs', category: 'Protein', emoji: '🥚', frequency: 'daily', estimatedPrice: 14 },
  ],
  high_protein: [
    { name: 'Paneer', qty: '100g', category: 'Dairy', emoji: '🧀', frequency: 'daily', estimatedPrice: 35 },
    { name: 'Tofu', qty: '80g', category: 'Protein', emoji: '🫘', frequency: 'daily', estimatedPrice: 20 },
    { name: 'Sprouts', qty: '50g', category: 'Protein', emoji: '🌱', frequency: 'daily', estimatedPrice: 8 },
    { name: 'Greek Yogurt', qty: '150g', category: 'Dairy', emoji: '🥣', frequency: 'daily', estimatedPrice: 25 },
    { name: 'Almonds', qty: '15g', category: 'Protein', emoji: '🌰', frequency: 'daily', estimatedPrice: 12 },
    { name: 'Peanut Butter', qty: '20g', category: 'Protein', emoji: '🥜', frequency: 'daily', estimatedPrice: 8 },
    { name: 'Chana Dal', qty: '50g', category: 'Grains & Staples', emoji: '🫘', frequency: 'daily', estimatedPrice: 6 },
    { name: 'Whey Protein', qty: '30g', category: 'Protein', emoji: '💪', frequency: 'daily', estimatedPrice: 40 },
  ],
  healthy: [
    { name: 'Brown Rice', qty: '100g', category: 'Grains & Staples', emoji: '🍚', frequency: 'daily', estimatedPrice: 10 },
    { name: 'Quinoa', qty: '30g', category: 'Grains & Staples', emoji: '🌾', frequency: 'daily', estimatedPrice: 18 },
    { name: 'Oats', qty: '50g', category: 'Grains & Staples', emoji: '🥣', frequency: 'daily', estimatedPrice: 8 },
    { name: 'Olive Oil', qty: '10ml', category: 'Oils & Fats', emoji: '🫒', frequency: 'daily', estimatedPrice: 8 },
    { name: 'Flaxseeds', qty: '10g', category: 'Protein', emoji: '🌰', frequency: 'daily', estimatedPrice: 4 },
    { name: 'Chia Seeds', qty: '10g', category: 'Protein', emoji: '🌰', frequency: 'daily', estimatedPrice: 6 },
    { name: 'Broccoli', qty: '80g', category: 'Vegetables', emoji: '🥦', frequency: 'daily', estimatedPrice: 12 },
    { name: 'Sweet Potato', qty: '100g', category: 'Vegetables', emoji: '🍠', frequency: 'daily', estimatedPrice: 5 },
    { name: 'Avocado', qty: '50g', category: 'Fruits', emoji: '🥑', frequency: 'daily', estimatedPrice: 30 },
    { name: 'Berries', qty: '50g', category: 'Fruits', emoji: '🫐', frequency: 'daily', estimatedPrice: 25 },
  ],
};

// ── Pack Size Optimizer ──
interface OptimizedItem {
  name: string;
  totalQty: string;
  recommendedPack: string;
  category: string;
  emoji: string;
  estimatedPrice: number;
  frequency: 'daily' | 'weekly' | 'monthly';
}

const PACK_SIZES: Record<string, { packs: string[]; prices: number[] }> = {
  'Rice': { packs: ['1kg', '5kg', '10kg', '25kg'], prices: [65, 280, 520, 1200] },
  'Atta (Wheat Flour)': { packs: ['1kg', '5kg', '10kg'], prices: [48, 198, 380] },
  'Toor Dal': { packs: ['500g', '1kg', '2kg', '5kg'], prices: [75, 135, 250, 580] },
  'Moong Dal': { packs: ['500g', '1kg', '2kg'], prices: [65, 115, 210] },
  'Milk': { packs: ['500ml', '1L', '5L'], prices: [28, 56, 260] },
  'Curd': { packs: ['200g', '400g', '1kg'], prices: [20, 35, 75] },
  'Paneer': { packs: ['200g', '500g', '1kg'], prices: [60, 135, 250] },
  'Ghee': { packs: ['200ml', '500ml', '1L'], prices: [110, 245, 460] },
  'Sunflower Oil': { packs: ['1L', '2L', '5L'], prices: [130, 249, 580] },
  'Onions': { packs: ['500g', '1kg', '2kg', '5kg'], prices: [15, 26, 52, 120] },
  'Tomatoes': { packs: ['500g', '1kg', '2kg'], prices: [20, 35, 65] },
  'Potatoes': { packs: ['500g', '1kg', '2kg', '5kg'], prices: [12, 22, 45, 100] },
  'Eggs': { packs: ['6 pcs', '12 pcs', '30 pcs'], prices: [42, 78, 180] },
  'Sugar': { packs: ['500g', '1kg', '2kg', '5kg'], prices: [25, 45, 85, 200] },
  'Salt': { packs: ['200g', '500g', '1kg'], prices: [10, 20, 25] },
  'Turmeric Powder': { packs: ['50g', '100g', '200g', '500g'], prices: [12, 22, 38, 85] },
  'Cumin Seeds': { packs: ['50g', '100g', '200g'], prices: [18, 32, 60] },
  'Red Chilli Powder': { packs: ['50g', '100g', '200g', '500g'], prices: [14, 25, 48, 110] },
};

function optimizePackSize(itemName: string, totalGrams: number): { pack: string; price: number } {
  const packInfo = PACK_SIZES[itemName];
  if (!packInfo) return { pack: `${Math.ceil(totalGrams)}g`, price: Math.ceil(totalGrams * 0.1) };

  // Find best pack that covers the quantity
  let bestIdx = 0;
  for (let i = 0; i < packInfo.packs.length; i++) {
    const packQty = parsePackQty(packInfo.packs[i]);
    if (packQty >= totalGrams) {
      bestIdx = i;
      break;
    }
    bestIdx = i;
  }

  return { pack: packInfo.packs[bestIdx], price: packInfo.prices[bestIdx] };
}

function parsePackQty(pack: string): number {
  const match = pack.match(/([\d.]+)\s*(kg|g|ml|l|pcs|pc)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'kg' || unit === 'l') return val * 1000;
  if (unit === 'pcs' || unit === 'pc') return val;
  return val;
}

// ── Main Planner Function ──
export function generateSmartGroceryPlan(config: PlanConfig): {
  items: OptimizedItem[];
  totalEstimatedCost: number;
  duration: string;
  familySize: string;
  mealPlan: string;
  dailyItems: OptimizedItem[];
  weeklyItems: OptimizedItem[];
  monthlyItems: OptimizedItem[];
} {
  const multiplier = getFamilyMultiplier(config.familySize);
  const days = getDurationDays(config.duration);
  const dietType = config.mealPlan;

  // Start with base items
  let baseItems = [...BASE_DAILY_GROCERY.default];

  // Add meal-plan specific items
  if (dietType === 'high_protein' && BASE_DAILY_GROCERY.high_protein) {
    baseItems = [...baseItems, ...BASE_DAILY_GROCERY.high_protein];
  }
  if (dietType === 'healthy' && BASE_DAILY_GROCERY.healthy) {
    baseItems = [...baseItems, ...BASE_DAILY_GROCERY.healthy];
  }

  // Filter by dietary preference
  baseItems = baseItems.filter(item => isDietaryAllowed(item.name, dietType));

  // Remove duplicates (merge by name)
  const merged = new Map<string, GroceryPlanItem>();
  baseItems.forEach(item => {
    if (!merged.has(item.name)) {
      merged.set(item.name, item);
    }
  });

  // Calculate total quantities and optimize
  const optimizedItems: OptimizedItem[] = [];
  let totalCost = 0;

  merged.forEach(item => {
    const dailyQtyGrams = parseQtyToGrams(item.qty);
    const totalQty = dailyQtyGrams * days * multiplier;

    const { pack, price } = optimizePackSize(item.name, totalQty);

    const frequency: 'daily' | 'weekly' | 'monthly' =
      item.category === 'Dairy' || item.category === 'Vegetables' || item.category === 'Fruits' ? 'daily' :
      item.category === 'Protein' ? 'weekly' : 'monthly';

    optimizedItems.push({
      name: item.name,
      totalQty: formatQty(totalQty, item.qty),
      recommendedPack: pack,
      category: item.category,
      emoji: item.emoji,
      estimatedPrice: price,
      frequency,
    });

    totalCost += price;
  });

  // Categorize by frequency
  const dailyItems = optimizedItems.filter(i => i.frequency === 'daily');
  const weeklyItems = optimizedItems.filter(i => i.frequency === 'weekly');
  const monthlyItems = optimizedItems.filter(i => i.frequency === 'monthly');

  return {
    items: optimizedItems,
    totalEstimatedCost: totalCost,
    duration: config.duration,
    familySize: config.familySize,
    mealPlan: config.mealPlan,
    dailyItems,
    weeklyItems,
    monthlyItems,
  };
}

function parseQtyToGrams(qty: string): number {
  const match = qty.match(/([\d.]+)\s*(kg|g|ml|l|pcs|pc)?/i);
  if (!match) return 100;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'g').toLowerCase();
  if (unit === 'kg' || unit === 'l') return val * 1000;
  if (unit === 'pcs' || unit === 'pc') return val * 50; // approximate weight per piece
  return val;
}

function formatQty(grams: number, originalUnit: string): string {
  if (originalUnit.includes('pcs') || originalUnit.includes('pc')) {
    return `${Math.ceil(grams / 50)} pcs`;
  }
  if (originalUnit.includes('ml') || originalUnit.includes('l') || originalUnit.includes('L')) {
    if (grams >= 1000) return `${(grams / 1000).toFixed(1)}L`;
    return `${Math.ceil(grams)}ml`;
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg`;
  return `${Math.ceil(grams)}g`;
}
