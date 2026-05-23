import { PriceComparison, PriceEntry, PROVIDER_META } from './priceComparisonService';

export interface SplitItem {
  name: string;
  qty: string;
  price: number;
  brand?: string;
}

export interface SplitProvider {
  name: string;
  emoji: string;
  color: string;
  items: SplitItem[];
  subtotal: number;
  deliveryFee: number;
  handlingCharge: number;
  discount: number;
  finalAmount: number;
  deliveryTime: string;
  minOrder: number;
}

export interface SmartSplitResult {
  providers: SplitProvider[];
  originalTotal: number;
  optimizedTotal: number;
  totalSavings: number;
  totalDeliveryFee: number;
  estimatedTime: string;
}

// Provider delivery/charge config
const PROVIDER_CONFIG: Record<string, { deliveryFee: number; minOrder: number; handling: number; discountRate: number; deliveryTime: string }> = {
  'Zepto': { deliveryFee: 0, minOrder: 99, handling: 2, discountRate: 0.05, deliveryTime: '10 min' },
  'Blinkit': { deliveryFee: 0, minOrder: 149, handling: 4, discountRate: 0.06, deliveryTime: '10-15 min' },
  'BigBasket': { deliveryFee: 0, minOrder: 200, handling: 3, discountRate: 0.07, deliveryTime: '2-4 hrs' },
  'Instamart': { deliveryFee: 15, minOrder: 149, handling: 5, discountRate: 0.04, deliveryTime: '15-30 min' },
  'Local Kirana': { deliveryFee: 0, minOrder: 0, handling: 0, discountRate: 0, deliveryTime: '30-60 min' },
};

// Category to preferred provider mapping for smart split
const CATEGORY_PROVIDER_PREFERENCE: Record<string, string[]> = {
  'Dairy': ['Blinkit', 'Zepto', 'BigBasket', 'Instamart'],
  'Vegetables': ['Local Kirana', 'BigBasket', 'Zepto', 'Blinkit'],
  'Fruits': ['Local Kirana', 'BigBasket', 'Zepto', 'Blinkit'],
  'Grains & Staples': ['BigBasket', 'Blinkit', 'Zepto', 'Local Kirana'],
  'Spices & Seasonings': ['Zepto', 'Blinkit', 'BigBasket', 'Local Kirana'],
  'Oils & Fats': ['BigBasket', 'Blinkit', 'Zepto', 'Local Kirana'],
  'Protein': ['Blinkit', 'Zepto', 'BigBasket', 'Local Kirana'],
  'Others': ['Blinkit', 'Zepto', 'BigBasket', 'Local Kirana'],
};

export function calculateSmartSplit(
  items: { name: string; qty: string; price: number; category: string }[],
  priceMap: Record<string, { comparison: { prices: PriceEntry[] } | null }>,
): SmartSplitResult {
  const providerItems: Record<string, SplitItem[]> = {};
  const providerNames = Object.keys(PROVIDER_CONFIG);
  providerNames.forEach(name => { providerItems[name] = []; });

  let originalTotal = 0;

  // For each item, find the cheapest available provider considering category preference
  items.forEach(item => {
    originalTotal += item.price;
    const priceData = priceMap[item.name];
    
    if (priceData?.comparison?.prices && priceData.comparison.prices.length > 0) {
      // Find best price per provider
      const providerPrices: Record<string, { price: number; brand?: string }> = {};
      
      priceData.comparison.prices.forEach(entry => {
        if (entry.availability && entry.price) {
          const effectivePrice = entry.discount_price || entry.price;
          if (!providerPrices[entry.provider_name] || effectivePrice < providerPrices[entry.provider_name].price) {
            providerPrices[entry.provider_name] = {
              price: effectivePrice,
              brand: entry.brand_name || undefined,
            };
          }
        }
      });

      // Pick cheapest available, but prefer category-appropriate providers if price diff < 10%
      const preferences = CATEGORY_PROVIDER_PREFERENCE[item.category] || CATEGORY_PROVIDER_PREFERENCE['Others'];
      let bestProvider = '';
      let bestPrice = Infinity;

      // First pass: find absolute cheapest
      Object.entries(providerPrices).forEach(([pName, pData]) => {
        if (pData.price < bestPrice) {
          bestPrice = pData.price;
          bestProvider = pName;
        }
      });

      // Second pass: prefer category provider if within 10%
      for (const pref of preferences) {
        if (providerPrices[pref]) {
          const prefPrice = providerPrices[pref].price;
          if (prefPrice <= bestPrice * 1.10) {
            bestProvider = pref;
            bestPrice = prefPrice;
            break;
          }
        }
      }

      if (bestProvider && providerPrices[bestProvider]) {
        providerItems[bestProvider].push({
          name: item.name,
          qty: item.qty,
          price: providerPrices[bestProvider].price,
          brand: providerPrices[bestProvider].brand,
        });
      } else {
        // Fallback to Local Kirana
        providerItems['Local Kirana'].push({
          name: item.name,
          qty: item.qty,
          price: item.price,
        });
      }
    } else {
      // No price data, assign to preferred category provider
      const preferences = CATEGORY_PROVIDER_PREFERENCE[item.category] || ['Local Kirana'];
      providerItems[preferences[0]].push({
        name: item.name,
        qty: item.qty,
        price: item.price,
      });
    }
  });

  // Build provider results
  const providers: SplitProvider[] = [];
  let optimizedTotal = 0;
  let totalDeliveryFee = 0;

  providerNames.forEach(name => {
    const pItems = providerItems[name];
    if (pItems.length === 0) return;

    const config = PROVIDER_CONFIG[name];
    const meta = PROVIDER_META[name] || { emoji: '📦', color: '#6B7280', tagline: '' };
    const subtotal = pItems.reduce((s, i) => s + i.price, 0);
    const discount = Math.round(subtotal * config.discountRate);
    const deliveryFee = subtotal >= config.minOrder ? 0 : config.deliveryFee;
    const finalAmount = subtotal + deliveryFee + config.handling - discount;

    providers.push({
      name,
      emoji: meta.emoji,
      color: meta.color,
      items: pItems,
      subtotal,
      deliveryFee,
      handlingCharge: config.handling,
      discount,
      finalAmount,
      deliveryTime: config.deliveryTime,
      minOrder: config.minOrder,
    });

    optimizedTotal += finalAmount;
    totalDeliveryFee += deliveryFee;
  });

  // Sort by item count descending
  providers.sort((a, b) => b.items.length - a.items.length);

  const totalSavings = Math.max(0, originalTotal - optimizedTotal);

  return {
    providers,
    originalTotal,
    optimizedTotal,
    totalSavings,
    totalDeliveryFee,
    estimatedTime: '10 min - 4 hrs',
  };
}

// Calculate actual meal cooking cost from recipe quantities and pack prices
export function calculateMealCost(
  items: { name: string; qty: string; price: number }[],
  priceMap: Record<string, { comparison: { prices: PriceEntry[] } | null }>,
): { mealCost: number; marketCost: number; leftoverValue: number } {
  let mealCost = 0;
  let marketCost = 0;

  items.forEach(item => {
    const priceData = priceMap[item.name];
    if (priceData?.comparison?.prices && priceData.comparison.prices.length > 0) {
      const topMatch = priceData.comparison.prices[0];
      const buyPrice = topMatch.discount_price || topMatch.price || item.price;
      marketCost += buyPrice;

      // Calculate actual recipe cost based on ratio of recipe qty to buy qty
      if (topMatch.recipe_qty && topMatch.recommended_buy_qty) {
        const recipeQty = parseQtyValue(topMatch.recipe_qty);
        const buyQty = parseQtyValue(topMatch.recommended_buy_qty);
        if (buyQty > 0 && recipeQty > 0) {
          const ratio = Math.min(recipeQty / buyQty, 1);
          mealCost += Math.round(buyPrice * ratio);
        } else {
          mealCost += buyPrice;
        }
      } else {
        mealCost += buyPrice;
      }
    } else {
      marketCost += item.price;
      mealCost += item.price;
    }
  });

  const leftoverValue = Math.max(0, marketCost - mealCost);
  return { mealCost, marketCost, leftoverValue };
}

function parseQtyValue(qtyStr: string): number {
  const match = qtyStr.match(/([\d.]+)\s*(kg|g|ml|l|pcs|bunch)?/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'g').toLowerCase();
  if (unit === 'kg') return val * 1000;
  if (unit === 'l') return val * 1000;
  return val;
}

// Estimate cost per meal type
export function estimateMealCosts(
  totalMealCost: number,
  mealCount: number = 4,
): { breakfast: number; lunch: number; snack: number; dinner: number; daily: number; weekly: number; monthly: number } {
  // Approximate distribution: breakfast 15%, lunch 35%, snack 10%, dinner 40%
  const breakfast = Math.round(totalMealCost * 0.15);
  const lunch = Math.round(totalMealCost * 0.35);
  const snack = Math.round(totalMealCost * 0.10);
  const dinner = Math.round(totalMealCost * 0.40);
  const daily = breakfast + lunch + snack + dinner;
  const weekly = daily * 7;
  const monthly = daily * 30;

  return { breakfast, lunch, snack, dinner, daily, weekly, monthly };
}
