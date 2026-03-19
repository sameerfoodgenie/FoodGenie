// Meal insight generation based on dish name, source, and tags

export interface MealNutrition {
  healthScore: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  insight: string;
}

interface DishProfile {
  healthScore: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  insight: string;
}

const DISH_DATABASE: Record<string, DishProfile> = {
  'biryani': { healthScore: 62, calories: 490, protein: 28, carbs: 58, fat: 16, insight: 'Rich in protein but high carbs. Great post-workout meal.' },
  'chicken biryani': { healthScore: 62, calories: 490, protein: 28, carbs: 58, fat: 16, insight: 'Rich in protein but high carbs. Great post-workout meal.' },
  'veg biryani': { healthScore: 68, calories: 380, protein: 12, carbs: 62, fat: 10, insight: 'Lighter biryani option. Good carb source for energy.' },
  'paneer butter masala': { healthScore: 55, calories: 420, protein: 18, carbs: 32, fat: 26, insight: 'High fat from butter and cream. Moderate protein.' },
  'butter chicken': { healthScore: 58, calories: 440, protein: 30, carbs: 18, fat: 28, insight: 'Rich and creamy. High protein but watch the fat content.' },
  'dal': { healthScore: 82, calories: 220, protein: 14, carbs: 32, fat: 5, insight: 'Excellent protein source. Low fat, high fiber meal.' },
  'dal tadka': { healthScore: 80, calories: 240, protein: 14, carbs: 34, fat: 6, insight: 'Good protein and fiber. Light tempering adds minimal fat.' },
  'roti': { healthScore: 75, calories: 120, protein: 4, carbs: 22, fat: 2, insight: 'Good complex carbs. Pair with protein for a complete meal.' },
  'rice': { healthScore: 65, calories: 200, protein: 4, carbs: 44, fat: 1, insight: 'Quick energy source. Balance with protein and veggies.' },
  'dosa': { healthScore: 72, calories: 280, protein: 8, carbs: 42, fat: 10, insight: 'Fermented batter aids digestion. Moderate carb meal.' },
  'masala dosa': { healthScore: 70, calories: 320, protein: 10, carbs: 48, fat: 12, insight: 'Fermented batter aids digestion. Potato adds carbs.' },
  'idli': { healthScore: 85, calories: 160, protein: 6, carbs: 30, fat: 2, insight: 'Light, steamed, and easy to digest. Great breakfast option.' },
  'poha': { healthScore: 78, calories: 250, protein: 6, carbs: 42, fat: 6, insight: 'Light breakfast. Flattened rice with good iron content.' },
  'upma': { healthScore: 74, calories: 220, protein: 6, carbs: 38, fat: 5, insight: 'Semolina-based. Light and filling breakfast choice.' },
  'paratha': { healthScore: 58, calories: 320, protein: 8, carbs: 42, fat: 14, insight: 'Oil-cooked flatbread. Filling but watch the fat.' },
  'chole bhature': { healthScore: 42, calories: 620, protein: 16, carbs: 68, fat: 32, insight: 'High calorie comfort food. Deep-fried bhature adds fat.' },
  'pizza': { healthScore: 48, calories: 540, protein: 20, carbs: 64, fat: 22, insight: 'High carb and fat. Enjoy occasionally as a treat.' },
  'burger': { healthScore: 45, calories: 580, protein: 24, carbs: 48, fat: 30, insight: 'Processed bread and patty. High calorie indulgence.' },
  'pasta': { healthScore: 52, calories: 460, protein: 14, carbs: 62, fat: 16, insight: 'Carb-heavy meal. Add protein for better balance.' },
  'salad': { healthScore: 90, calories: 180, protein: 8, carbs: 18, fat: 8, insight: 'Low calorie, nutrient-dense. Perfect light meal.' },
  'sandwich': { healthScore: 68, calories: 340, protein: 16, carbs: 38, fat: 14, insight: 'Balanced quick meal. Choose whole grain for better nutrition.' },
  'thali': { healthScore: 78, calories: 580, protein: 22, carbs: 72, fat: 18, insight: 'Balanced meal with variety. Great nutritional spread.' },
  'veg thali': { healthScore: 78, calories: 560, protein: 20, carbs: 72, fat: 16, insight: 'Balanced vegetarian meal. Good variety of nutrients.' },
  'egg fried rice': { healthScore: 60, calories: 410, protein: 16, carbs: 56, fat: 14, insight: 'Quick energy from carbs. Add veggies for better balance.' },
  'omelette': { healthScore: 80, calories: 220, protein: 18, carbs: 4, fat: 16, insight: 'High protein breakfast. Great start to the day.' },
  'fruit bowl': { healthScore: 95, calories: 180, protein: 3, carbs: 42, fat: 1, insight: 'Excellent vitamins and fiber. Natural sugars for energy.' },
  'smoothie': { healthScore: 85, calories: 220, protein: 8, carbs: 38, fat: 4, insight: 'Nutrient-packed drink. Great for quick nutrition.' },
  'samosa': { healthScore: 38, calories: 280, protein: 6, carbs: 32, fat: 16, insight: 'Deep-fried snack. High in fat. Enjoy in moderation.' },
  'pav bhaji': { healthScore: 56, calories: 420, protein: 12, carbs: 58, fat: 16, insight: 'Butter-rich comfort food. Has veggies but high carbs.' },
  'paneer tikka': { healthScore: 72, calories: 320, protein: 22, carbs: 14, fat: 20, insight: 'Good protein from paneer. Grilled preparation is healthier.' },
  'chicken tikka': { healthScore: 78, calories: 280, protein: 32, carbs: 8, fat: 14, insight: 'High protein, low carb. Excellent fitness-friendly choice.' },
  'naan': { healthScore: 50, calories: 260, protein: 8, carbs: 42, fat: 8, insight: 'Refined flour bread. Opt for tandoori roti instead.' },
  'rajma': { healthScore: 80, calories: 280, protein: 16, carbs: 42, fat: 4, insight: 'Kidney beans are protein and fiber rich. Great combo with rice.' },
  'curd rice': { healthScore: 76, calories: 240, protein: 8, carbs: 38, fat: 6, insight: 'Probiotic-rich comfort food. Good for digestion.' },
  'maggi': { healthScore: 35, calories: 380, protein: 8, carbs: 52, fat: 16, insight: 'Processed instant noodles. Low nutrition, high sodium.' },
  'momos': { healthScore: 60, calories: 320, protein: 14, carbs: 40, fat: 12, insight: 'Steamed is healthier than fried. Decent protein content.' },
};

const TAG_MODIFIERS: Record<string, Partial<DishProfile>> = {
  'healthy': { healthScore: 10, calories: -50, fat: -4 },
  'high_protein': { healthScore: 5, protein: 8 },
  'oily': { healthScore: -12, fat: 8, calories: 80 },
  'cheat': { healthScore: -15, calories: 120, fat: 10 },
};

const SOURCE_MODIFIERS: Record<string, Partial<DishProfile>> = {
  'home_cooked': { healthScore: 8, calories: -40, fat: -3 },
  'restaurant': { healthScore: -3, calories: 30, fat: 3 },
  'online_order': { healthScore: -5, calories: 50, fat: 5 },
};

function findBestMatch(dishName: string): DishProfile | null {
  const lower = dishName.toLowerCase().trim();
  // Exact match
  if (DISH_DATABASE[lower]) return DISH_DATABASE[lower];
  // Partial match
  for (const [key, profile] of Object.entries(DISH_DATABASE)) {
    if (lower.includes(key) || key.includes(lower)) return profile;
  }
  // Word match
  const words = lower.split(/\s+/);
  for (const [key, profile] of Object.entries(DISH_DATABASE)) {
    for (const word of words) {
      if (word.length > 3 && key.includes(word)) return profile;
    }
  }
  return null;
}

export function getMealInsight(
  dishName: string,
  source: string,
  tags: string[],
): MealNutrition {
  const base = findBestMatch(dishName);

  let result: MealNutrition = base
    ? { ...base }
    : {
        healthScore: 65,
        calories: 380,
        protein: 16,
        carbs: 44,
        fat: 14,
        insight: 'Logged meal. Track consistently for better insights.',
      };

  // Apply source modifier
  const srcMod = SOURCE_MODIFIERS[source];
  if (srcMod) {
    result.healthScore += srcMod.healthScore || 0;
    result.calories += srcMod.calories || 0;
    result.protein += srcMod.protein || 0;
    result.carbs += srcMod.carbs || 0;
    result.fat += srcMod.fat || 0;
  }

  // Apply tag modifiers
  for (const tag of tags) {
    const mod = TAG_MODIFIERS[tag];
    if (mod) {
      result.healthScore += mod.healthScore || 0;
      result.calories += mod.calories || 0;
      result.protein += mod.protein || 0;
      result.carbs += mod.carbs || 0;
      result.fat += mod.fat || 0;
    }
  }

  // Clamp values
  result.healthScore = Math.max(10, Math.min(99, result.healthScore));
  result.calories = Math.max(50, result.calories);
  result.protein = Math.max(1, result.protein);
  result.carbs = Math.max(1, result.carbs);
  result.fat = Math.max(1, result.fat);

  // Generate insight if home cooked
  if (source === 'home_cooked' && base) {
    result.insight = 'Home-cooked ' + result.insight.charAt(0).toLowerCase() + result.insight.slice(1);
  }

  return result;
}

// Popular dish suggestions for quick selection
export const POPULAR_DISHES = [
  'Chicken Biryani', 'Paneer Butter Masala', 'Dal Tadka', 'Roti',
  'Masala Dosa', 'Idli', 'Poha', 'Omelette',
  'Veg Thali', 'Chole Bhature', 'Pizza', 'Burger',
  'Pasta', 'Salad', 'Rajma', 'Curd Rice',
  'Egg Fried Rice', 'Paratha', 'Sandwich', 'Smoothie',
  'Pav Bhaji', 'Momos', 'Samosa', 'Fruit Bowl',
  'Paneer Tikka', 'Chicken Tikka', 'Maggi', 'Upma',
  'Butter Chicken', 'Naan',
];

// Platform info for online orders
export const ORDER_PLATFORMS = [
  { id: 'zomato', name: 'Zomato', icon: 'restaurant', color: '#E23744' },
  { id: 'swiggy', name: 'Swiggy', icon: 'delivery-dining', color: '#FC8019' },
  { id: 'ondc', name: 'ONDC', icon: 'storefront', color: '#0B6FCB' },
];
