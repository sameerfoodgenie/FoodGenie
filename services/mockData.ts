// FoodGenie Mock Data

export interface Dish {
  id: string;
  name: string;
  restaurant: string;
  restaurantId: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  chefScore: number;
  deliveryTime: string;
  isVeg: boolean;
  spiceLevel: number;
  calories: number;
  protein: number;
  reason: string;
  tags: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  image: string;
  chefScore: number;
  hygieneScore: number;
  rating: number;
  deliveryTime: string;
  priceRange: string;
  lastAudit: string;
  improvements: string[];
  featuredDishes: string[];
}

export interface MealPlan {
  id: string;
  name: string;
  type: 'gym' | 'weight' | 'daily';
  restaurant?: string;
  restaurantId?: string;
  price: number;
  duration: string;
  meals: number;
  badges: string[];
  description: string;
  cuisine?: string;
  chefScore?: number;
}

export interface DailyMeal {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  chefScore: number;
  weeklyPrice: number;
  lunchPrice: number;
  dinnerPrice: number;
  bothPrice: number;
  menu: {
    monday: { lunch: string; dinner: string };
    tuesday: { lunch: string; dinner: string };
    wednesday: { lunch: string; dinner: string };
    thursday: { lunch: string; dinner: string };
    friday: { lunch: string; dinner: string };
  };
  isVeg: boolean;
  minOrderDays: number;
}

export interface ChatMessage {
  id: string;
  type: 'genie' | 'user';
  text: string;
  timestamp: Date;
}

// Mock Dishes (20+ items)
export const mockDishes: Dish[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    restaurant: 'Punjabi Dhaba',
    restaurantId: 'r1',
    price: 280,
    originalPrice: 320,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.8,
    chefScore: 92,
    deliveryTime: '25-30 min',
    isVeg: false,
    spiceLevel: 2,
    calories: 490,
    protein: 32,
    reason: 'Matches your taste profile. Chef-verified kitchen with 92% hygiene score.',
    tags: ['Popular', 'Chef Pick'],
  },
  {
    id: '2',
    name: 'Paneer Tikka Thali',
    restaurant: 'Green Leaf Kitchen',
    restaurantId: 'r2',
    price: 220,
    originalPrice: 250,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.6,
    chefScore: 88,
    deliveryTime: '20-25 min',
    isVeg: true,
    spiceLevel: 2,
    calories: 650,
    protein: 28,
    reason: 'Balanced meal within your budget. High protein, chef-approved.',
    tags: ['Healthy', 'Value'],
  },
  {
    id: '3',
    name: 'Hyderabadi Biryani',
    restaurant: 'Biryani House',
    restaurantId: 'r3',
    price: 320,
    originalPrice: 380,
    image: require('../assets/images/dish-biryani.png'),
    rating: 4.9,
    chefScore: 95,
    deliveryTime: '30-35 min',
    isVeg: false,
    spiceLevel: 3,
    calories: 720,
    protein: 35,
    reason: 'Top-rated in your area. Authentic recipe, transparent pricing.',
    tags: ['Top Rated', 'Authentic'],
  },
  {
    id: '4',
    name: 'Dal Makhani',
    restaurant: 'Punjabi Dhaba',
    restaurantId: 'r1',
    price: 180,
    originalPrice: 200,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.7,
    chefScore: 92,
    deliveryTime: '25-30 min',
    isVeg: true,
    spiceLevel: 1,
    calories: 380,
    protein: 18,
    reason: 'Comfort food, low spice as you prefer.',
    tags: ['Comfort', 'Veg'],
  },
  {
    id: '5',
    name: 'Chicken Tikka',
    restaurant: 'Tandoor Express',
    restaurantId: 'r4',
    price: 260,
    originalPrice: 290,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.5,
    chefScore: 86,
    deliveryTime: '20-25 min',
    isVeg: false,
    spiceLevel: 2,
    calories: 320,
    protein: 42,
    reason: 'High protein, fits your fitness goals.',
    tags: ['High Protein', 'Grilled'],
  },
  {
    id: '6',
    name: 'Masala Dosa',
    restaurant: 'South Express',
    restaurantId: 'r5',
    price: 120,
    originalPrice: 140,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.4,
    chefScore: 84,
    deliveryTime: '15-20 min',
    isVeg: true,
    spiceLevel: 2,
    calories: 290,
    protein: 8,
    reason: 'Quick, budget-friendly breakfast option.',
    tags: ['Quick', 'Budget'],
  },
  {
    id: '7',
    name: 'Mutton Rogan Josh',
    restaurant: 'Kashmir Kitchen',
    restaurantId: 'r6',
    price: 380,
    originalPrice: 420,
    image: require('../assets/images/dish-biryani.png'),
    rating: 4.8,
    chefScore: 90,
    deliveryTime: '35-40 min',
    isVeg: false,
    spiceLevel: 3,
    calories: 520,
    protein: 38,
    reason: 'Premium cut, authentic Kashmiri recipe.',
    tags: ['Premium', 'Authentic'],
  },
  {
    id: '8',
    name: 'Veg Pulao',
    restaurant: 'Green Leaf Kitchen',
    restaurantId: 'r2',
    price: 160,
    originalPrice: 180,
    image: require('../assets/images/dish-biryani.png'),
    rating: 4.3,
    chefScore: 88,
    deliveryTime: '20-25 min',
    isVeg: true,
    spiceLevel: 1,
    calories: 420,
    protein: 12,
    reason: 'Light, aromatic, perfect for mild taste preference.',
    tags: ['Light', 'Aromatic'],
  },
  {
    id: '9',
    name: 'Fish Curry',
    restaurant: 'Coastal Flavors',
    restaurantId: 'r7',
    price: 340,
    originalPrice: 380,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.7,
    chefScore: 91,
    deliveryTime: '30-35 min',
    isVeg: false,
    spiceLevel: 2,
    calories: 380,
    protein: 36,
    reason: 'Fresh catch, omega-3 rich, chef special.',
    tags: ['Seafood', 'Healthy'],
  },
  {
    id: '10',
    name: 'Chole Bhature',
    restaurant: 'Punjabi Dhaba',
    restaurantId: 'r1',
    price: 150,
    originalPrice: 170,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.6,
    chefScore: 92,
    deliveryTime: '25-30 min',
    isVeg: true,
    spiceLevel: 2,
    calories: 580,
    protein: 16,
    reason: 'Classic North Indian, generous portion.',
    tags: ['Classic', 'Filling'],
  },
  {
    id: '11',
    name: 'Egg Curry',
    restaurant: 'Home Style Kitchen',
    restaurantId: 'r8',
    price: 140,
    originalPrice: 160,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.4,
    chefScore: 85,
    deliveryTime: '20-25 min',
    isVeg: false,
    spiceLevel: 2,
    calories: 320,
    protein: 22,
    reason: 'Budget-friendly protein, homestyle cooking.',
    tags: ['Budget', 'Homestyle'],
  },
  {
    id: '12',
    name: 'Palak Paneer',
    restaurant: 'Green Leaf Kitchen',
    restaurantId: 'r2',
    price: 200,
    originalPrice: 230,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.5,
    chefScore: 88,
    deliveryTime: '20-25 min',
    isVeg: true,
    spiceLevel: 1,
    calories: 340,
    protein: 24,
    reason: 'Iron-rich, great for vegetarian protein.',
    tags: ['Healthy', 'Iron Rich'],
  },
  {
    id: '13',
    name: 'Tandoori Chicken',
    restaurant: 'Tandoor Express',
    restaurantId: 'r4',
    price: 320,
    originalPrice: 360,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.7,
    chefScore: 86,
    deliveryTime: '25-30 min',
    isVeg: false,
    spiceLevel: 2,
    calories: 280,
    protein: 45,
    reason: 'Low carb, high protein, fitness-friendly.',
    tags: ['Fitness', 'Low Carb'],
  },
  {
    id: '14',
    name: 'Veg Manchurian',
    restaurant: 'Indo-Chinese Corner',
    restaurantId: 'r9',
    price: 180,
    originalPrice: 200,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.3,
    chefScore: 82,
    deliveryTime: '20-25 min',
    isVeg: true,
    spiceLevel: 2,
    calories: 380,
    protein: 10,
    reason: 'Fusion favorite, crispy and tangy.',
    tags: ['Fusion', 'Popular'],
  },
  {
    id: '15',
    name: 'Lamb Biryani',
    restaurant: 'Biryani House',
    restaurantId: 'r3',
    price: 380,
    originalPrice: 440,
    image: require('../assets/images/dish-biryani.png'),
    rating: 4.9,
    chefScore: 95,
    deliveryTime: '35-40 min',
    isVeg: false,
    spiceLevel: 3,
    calories: 780,
    protein: 42,
    reason: 'Premium lamb, slow-cooked perfection.',
    tags: ['Premium', 'Slow Cooked'],
  },
  {
    id: '16',
    name: 'Idli Sambar',
    restaurant: 'South Express',
    restaurantId: 'r5',
    price: 90,
    originalPrice: 100,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.5,
    chefScore: 84,
    deliveryTime: '15-20 min',
    isVeg: true,
    spiceLevel: 1,
    calories: 180,
    protein: 6,
    reason: 'Light breakfast, easy to digest.',
    tags: ['Light', 'Breakfast'],
  },
  {
    id: '17',
    name: 'Prawn Masala',
    restaurant: 'Coastal Flavors',
    restaurantId: 'r7',
    price: 420,
    originalPrice: 480,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.8,
    chefScore: 91,
    deliveryTime: '30-35 min',
    isVeg: false,
    spiceLevel: 3,
    calories: 340,
    protein: 38,
    reason: 'Fresh prawns, signature coastal spices.',
    tags: ['Seafood', 'Signature'],
  },
  {
    id: '18',
    name: 'Rajma Chawal',
    restaurant: 'Home Style Kitchen',
    restaurantId: 'r8',
    price: 130,
    originalPrice: 150,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.6,
    chefScore: 85,
    deliveryTime: '20-25 min',
    isVeg: true,
    spiceLevel: 1,
    calories: 480,
    protein: 18,
    reason: 'Complete meal, comfort food classic.',
    tags: ['Complete Meal', 'Comfort'],
  },
  {
    id: '19',
    name: 'Keema Pav',
    restaurant: 'Mumbai Street',
    restaurantId: 'r10',
    price: 200,
    originalPrice: 230,
    image: require('../assets/images/dish-butter-chicken.png'),
    rating: 4.5,
    chefScore: 83,
    deliveryTime: '20-25 min',
    isVeg: false,
    spiceLevel: 2,
    calories: 420,
    protein: 28,
    reason: 'Street food favorite, authentic recipe.',
    tags: ['Street Food', 'Authentic'],
  },
  {
    id: '20',
    name: 'Paneer Butter Masala',
    restaurant: 'Punjabi Dhaba',
    restaurantId: 'r1',
    price: 240,
    originalPrice: 280,
    image: require('../assets/images/dish-veg-thali.png'),
    rating: 4.7,
    chefScore: 92,
    deliveryTime: '25-30 min',
    isVeg: true,
    spiceLevel: 1,
    calories: 420,
    protein: 22,
    reason: 'Rich and creamy, crowd favorite.',
    tags: ['Rich', 'Popular'],
  },
];

// Mock Restaurants
export const mockRestaurants: Restaurant[] = [
  {
    id: 'r1',
    name: 'Punjabi Dhaba',
    cuisine: 'North Indian',
    image: require('../assets/images/dish-butter-chicken.png'),
    chefScore: 92,
    hygieneScore: 94,
    rating: 4.7,
    deliveryTime: '25-30 min',
    priceRange: '₹150-400',
    lastAudit: '2 weeks ago',
    improvements: ['Updated ventilation system', 'New cold storage installed'],
    featuredDishes: ['1', '4', '10', '20'],
  },
  {
    id: 'r2',
    name: 'Green Leaf Kitchen',
    cuisine: 'Pure Vegetarian',
    image: require('../assets/images/dish-veg-thali.png'),
    chefScore: 88,
    hygieneScore: 90,
    rating: 4.5,
    deliveryTime: '20-25 min',
    priceRange: '₹120-300',
    lastAudit: '1 week ago',
    improvements: ['Organic ingredients sourced locally'],
    featuredDishes: ['2', '8', '12'],
  },
  {
    id: 'r3',
    name: 'Biryani House',
    cuisine: 'Hyderabadi',
    image: require('../assets/images/dish-biryani.png'),
    chefScore: 95,
    hygieneScore: 96,
    rating: 4.9,
    deliveryTime: '30-35 min',
    priceRange: '₹250-500',
    lastAudit: '3 days ago',
    improvements: ['Premium basmati rice sourcing'],
    featuredDishes: ['3', '15'],
  },
  {
    id: 'r4',
    name: 'Tandoor Express',
    cuisine: 'Mughlai',
    image: require('../assets/images/dish-butter-chicken.png'),
    chefScore: 86,
    hygieneScore: 88,
    rating: 4.5,
    deliveryTime: '20-25 min',
    priceRange: '₹200-400',
    lastAudit: '1 week ago',
    improvements: ['New tandoor installed'],
    featuredDishes: ['5', '13'],
  },
  {
    id: 'r5',
    name: 'South Express',
    cuisine: 'South Indian',
    image: require('../assets/images/dish-veg-thali.png'),
    chefScore: 84,
    hygieneScore: 86,
    rating: 4.4,
    deliveryTime: '15-20 min',
    priceRange: '₹80-200',
    lastAudit: '2 weeks ago',
    improvements: ['Fresh coconut grinding daily'],
    featuredDishes: ['6', '16'],
  },
];

// Daily Meals Offerings
export const dailyMealsOfferings: DailyMeal[] = [
  {
    id: 'dm1',
    restaurantId: 'r1',
    restaurantName: 'Punjabi Dhaba',
    cuisine: 'North Indian',
    chefScore: 92,
    weeklyPrice: 2500,
    lunchPrice: 280,
    dinnerPrice: 300,
    bothPrice: 550,
    isVeg: false,
    minOrderDays: 5,
    menu: {
      monday: { lunch: 'Dal Makhani + 3 Roti + Rice', dinner: 'Butter Chicken + Naan + Raita' },
      tuesday: { lunch: 'Chole + Bhature + Pickle', dinner: 'Paneer Butter Masala + Rice + Dal' },
      wednesday: { lunch: 'Rajma Chawal + Salad', dinner: 'Chicken Curry + 3 Roti + Raita' },
      thursday: { lunch: 'Mix Veg + Dal + 4 Roti', dinner: 'Egg Curry + Rice + Pickle' },
      friday: { lunch: 'Kadhi Pakoda + Rice', dinner: 'Butter Chicken + Naan + Dal' },
    },
  },
  {
    id: 'dm2',
    restaurantId: 'r2',
    restaurantName: 'Green Leaf Kitchen',
    cuisine: 'Pure Vegetarian',
    chefScore: 88,
    weeklyPrice: 2200,
    lunchPrice: 250,
    dinnerPrice: 270,
    bothPrice: 500,
    isVeg: true,
    minOrderDays: 5,
    menu: {
      monday: { lunch: 'Palak Paneer + 4 Roti + Dal', dinner: 'Veg Pulao + Raita + Papad' },
      tuesday: { lunch: 'Aloo Gobi + Rice + Dal', dinner: 'Paneer Tikka + 3 Roti + Chutney' },
      wednesday: { lunch: 'Chana Masala + Bhature', dinner: 'Mixed Dal + Rice + Sabzi' },
      thursday: { lunch: 'Veg Biryani + Raita', dinner: 'Malai Kofta + Naan + Dal' },
      friday: { lunch: 'Dal Tadka + 4 Roti + Rice', dinner: 'Paneer Butter Masala + Pulao' },
    },
  },
  {
    id: 'dm3',
    restaurantId: 'r3',
    restaurantName: 'Biryani House',
    cuisine: 'Hyderabadi',
    chefScore: 95,
    weeklyPrice: 3200,
    lunchPrice: 350,
    dinnerPrice: 380,
    bothPrice: 700,
    isVeg: false,
    minOrderDays: 5,
    menu: {
      monday: { lunch: 'Chicken Biryani + Raita + Salan', dinner: 'Mutton Biryani + Raita + Pickle' },
      tuesday: { lunch: 'Veg Dum Biryani + Raita', dinner: 'Egg Biryani + Salan + Papad' },
      wednesday: { lunch: 'Chicken Biryani + Mirchi ka Salan', dinner: 'Keema Biryani + Raita' },
      thursday: { lunch: 'Paneer Biryani + Raita', dinner: 'Chicken Fry Piece Biryani + Salan' },
      friday: { lunch: 'Prawn Biryani + Raita', dinner: 'Mutton Dum Biryani + Pickle' },
    },
  },
  {
    id: 'dm4',
    restaurantId: 'r5',
    restaurantName: 'South Express',
    cuisine: 'South Indian',
    chefScore: 84,
    weeklyPrice: 1800,
    lunchPrice: 200,
    dinnerPrice: 220,
    bothPrice: 400,
    isVeg: true,
    minOrderDays: 5,
    menu: {
      monday: { lunch: 'Sambar Rice + Rasam + Papad', dinner: 'Dosa + Sambar + 3 Chutneys' },
      tuesday: { lunch: 'Curd Rice + Pickle + Papad', dinner: 'Idli (4) + Vada (2) + Sambar' },
      wednesday: { lunch: 'Lemon Rice + Rasam + Chips', dinner: 'Masala Dosa + Sambar + Chutney' },
      thursday: { lunch: 'Tamarind Rice + Papad + Pickle', dinner: 'Uttapam + Sambar + Coconut Chutney' },
      friday: { lunch: 'Bisi Bele Bath + Raita', dinner: 'Rava Dosa + Sambar + 2 Chutneys' },
    },
  },
  {
    id: 'dm5',
    restaurantId: 'r8',
    restaurantName: 'Home Style Kitchen',
    cuisine: 'Home Style',
    chefScore: 85,
    weeklyPrice: 2000,
    lunchPrice: 220,
    dinnerPrice: 240,
    bothPrice: 440,
    isVeg: false,
    minOrderDays: 5,
    menu: {
      monday: { lunch: 'Aloo Paratha + Curd + Pickle', dinner: 'Egg Curry + Rice + Roti' },
      tuesday: { lunch: 'Rajma Chawal + Salad', dinner: 'Chicken Curry + 3 Roti + Dal' },
      wednesday: { lunch: 'Kadhi Chawal + Papad', dinner: 'Fish Fry + Rice + Dal' },
      thursday: { lunch: 'Chole + 3 Puri + Pickle', dinner: 'Keema + 4 Roti + Raita' },
      friday: { lunch: 'Mix Veg + Dal + 4 Roti', dinner: 'Chicken Biryani + Raita' },
    },
  },
];

// Mock Meal Plans
export const mockMealPlans: MealPlan[] = [
  {
    id: 'mp1',
    name: 'Muscle Gain Plan',
    type: 'gym',
    price: 4500,
    duration: 'Weekly',
    meals: 14,
    badges: ['Chef Monitored', 'High Protein', 'Pause Anytime'],
    description: '2500-3000 calories, 150g+ protein daily',
  },
  {
    id: 'mp2',
    name: 'Fat Loss Plan',
    type: 'gym',
    price: 3800,
    duration: 'Weekly',
    meals: 14,
    badges: ['Chef Monitored', 'Calorie Counted', 'Pause Anytime'],
    description: '1500-1800 calories, balanced macros',
  },
  {
    id: 'mp3',
    name: 'Maintenance Plan',
    type: 'gym',
    price: 4000,
    duration: 'Weekly',
    meals: 14,
    badges: ['Chef Monitored', 'Balanced', 'Pause Anytime'],
    description: '2000-2200 calories for active lifestyle',
  },
  {
    id: 'mp4',
    name: 'Punjabi Dhaba Weekly',
    type: 'daily',
    restaurant: 'Punjabi Dhaba',
    restaurantId: 'r1',
    price: 2500,
    duration: 'Weekly',
    meals: 10,
    badges: ['Fixed Menu', 'Chef Score 92', 'Mon-Fri'],
    description: 'Authentic North Indian lunch & dinner',
    cuisine: 'North Indian',
    chefScore: 92,
  },
  {
    id: 'mp5',
    name: 'Green Leaf Subscription',
    type: 'daily',
    restaurant: 'Green Leaf Kitchen',
    restaurantId: 'r2',
    price: 2200,
    duration: 'Weekly',
    meals: 10,
    badges: ['Pure Veg', 'Organic', 'Mon-Fri'],
    description: 'Healthy vegetarian meals daily',
    cuisine: 'Pure Vegetarian',
    chefScore: 88,
  },
];

// Initial chat messages
export const initialChatMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'genie',
    text: "Hi! I'm FoodGenie 🧞‍♂️\n\nTell me what you're in the mood for, and I'll find the perfect meal — no endless scrolling, just smart picks.",
    timestamp: new Date(),
  },
];

// Combo suggestions for Build My Plate
export const comboSuggestions = [
  { id: 'roti', label: '+2 Roti', price: 40 },
  { id: 'rice', label: '+Rice', price: 60 },
  { id: 'dal', label: '+Dal', price: 50 },
  { id: 'raita', label: '+Raita', price: 30 },
  { id: 'salad', label: '+Salad', price: 40 },
];

// Price comparison data
export const priceComparison = {
  dish: 'Butter Chicken',
  aggregatorPrice: 380,
  foodGeniePrice: 280,
  savings: 100,
  note: 'No ads. No discount wars. Just real prices.',
};
