// Food analysis service — simulated AI detection
// In production, this would call OnSpace AI for image recognition

export interface FoodAnalysisResult {
  name: string;
  healthScore: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  insight: string;
  tags: string[];
}

const FOOD_DATABASE: FoodAnalysisResult[] = [
  {
    name: 'Chicken Biryani',
    healthScore: 62,
    calories: 490,
    protein: 28,
    carbs: 58,
    fat: 16,
    insight: 'Rich in protein but high carbs. Great post-workout meal.',
    tags: ['rice', 'chicken', 'spices'],
  },
  {
    name: 'Paneer Butter Masala',
    healthScore: 55,
    calories: 420,
    protein: 18,
    carbs: 32,
    fat: 26,
    insight: 'High fat content from butter and cream. Moderate protein.',
    tags: ['paneer', 'gravy', 'butter'],
  },
  {
    name: 'Veg Thali',
    healthScore: 78,
    calories: 580,
    protein: 22,
    carbs: 72,
    fat: 18,
    insight: 'Balanced meal with variety. Great nutritional spread.',
    tags: ['dal', 'rice', 'roti', 'sabji'],
  },
  {
    name: 'Caesar Salad',
    healthScore: 88,
    calories: 220,
    protein: 12,
    carbs: 14,
    fat: 15,
    insight: 'Low calorie, nutrient-dense. Perfect light meal.',
    tags: ['lettuce', 'chicken', 'dressing'],
  },
  {
    name: 'Masala Dosa',
    healthScore: 70,
    calories: 320,
    protein: 10,
    carbs: 48,
    fat: 12,
    insight: 'Fermented batter aids digestion. Moderate carb meal.',
    tags: ['dosa', 'potato', 'chutney'],
  },
  {
    name: 'Grilled Chicken Wrap',
    healthScore: 82,
    calories: 380,
    protein: 32,
    carbs: 28,
    fat: 14,
    insight: 'High protein, balanced macros. Ideal for fitness goals.',
    tags: ['chicken', 'wrap', 'veggies'],
  },
  {
    name: 'Chole Bhature',
    healthScore: 42,
    calories: 620,
    protein: 16,
    carbs: 68,
    fat: 32,
    insight: 'High calorie comfort food. Deep-fried bhature adds fat.',
    tags: ['chole', 'bhature', 'fried'],
  },
  {
    name: 'Fruit Bowl',
    healthScore: 95,
    calories: 180,
    protein: 3,
    carbs: 42,
    fat: 1,
    insight: 'Excellent vitamins and fiber. Natural sugars for energy.',
    tags: ['fruits', 'fresh', 'vitamins'],
  },
  {
    name: 'Butter Chicken',
    healthScore: 58,
    calories: 440,
    protein: 30,
    carbs: 18,
    fat: 28,
    insight: 'Rich and creamy. High protein but watch the fat content.',
    tags: ['chicken', 'butter', 'cream'],
  },
  {
    name: 'Egg Fried Rice',
    healthScore: 60,
    calories: 410,
    protein: 16,
    carbs: 56,
    fat: 14,
    insight: 'Quick energy from carbs. Add veggies for better balance.',
    tags: ['rice', 'egg', 'soy'],
  },
];

export function analyzeFood(): Promise<FoodAnalysisResult> {
  return new Promise((resolve) => {
    // Simulate AI processing time
    const delay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      const randomFood = FOOD_DATABASE[Math.floor(Math.random() * FOOD_DATABASE.length)];
      // Add slight variation
      resolve({
        ...randomFood,
        calories: randomFood.calories + Math.round((Math.random() - 0.5) * 40),
        protein: randomFood.protein + Math.round((Math.random() - 0.5) * 4),
        carbs: randomFood.carbs + Math.round((Math.random() - 0.5) * 6),
        fat: randomFood.fat + Math.round((Math.random() - 0.5) * 4),
      });
    }, delay);
  });
}
