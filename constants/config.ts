// FoodGenie App Configuration

export const config = {
  app: {
    name: 'FoodGenie',
    tagline: 'Right food. Right price. Delivered right.',
    version: '1.0.0',
  },
  
  // AI Thinking messages (rotating)
  aiThinkingMessages: [
    'Checking chef-approved kitchens…',
    'Avoiding inflated prices…',
    'Balancing taste & budget…',
    'Finding the perfect match…',
    'Analyzing your preferences…',
    'Verifying hygiene scores…',
  ],
  
  // Decision lens options
  decisionOptions: {
    dishes: {
      icon: 'restaurant',
      title: 'Dishes',
      description: 'Best dish for you right now',
      emoji: '🍽',
    },
    restaurants: {
      icon: 'storefront',
      title: 'Restaurants',
      description: 'Best kitchens near you',
      emoji: '🏪',
    },
  },
  
  // Quick action tiles
  quickActions: [
    { id: 'chat', icon: 'chat', label: 'Refine with chat', emoji: '💬' },
    { id: 'plans', icon: 'calendar-today', label: 'Meal Plans', emoji: '🍽' },
    { id: 'daily', icon: 'lunch-dining', label: 'Daily Meals', emoji: '🍱' },
    { id: 'prefs', icon: 'tune', label: 'Preferences', emoji: '⚙️' },
  ],
  
  // Chat suggestion chips
  chatChips: [
    { id: 'waffles', text: '🧇 I want waffles' },
    { id: 'personalise', text: '🥗 Personalise my meal' },
    { id: 'bulk', text: '👥 Order in bulk' },
    { id: 'same', text: '🏪 Same restaurant' },
  ],
  
  // Trust badges
  trustBadges: {
    chefScore: { icon: 'verified', label: 'Chef Score' },
    hygiene: { icon: 'health-and-safety', label: 'Hygiene Verified' },
    delivery: { icon: 'local-shipping', label: 'Fast Delivery' },
  },
  
  // Diet options
  dietOptions: [
    { id: 'veg', label: 'Vegetarian', emoji: '🥬', color: '#10B981' },
    { id: 'egg', label: 'Eggetarian', emoji: '🥚', color: '#F59E0B' },
    { id: 'nonveg', label: 'Non-Vegetarian', emoji: '🍗', color: '#EF4444' },
  ],
  
  // Spice levels
  spiceLevels: [
    { id: 'mild', label: 'Mild', emoji: '🌶️', level: 1 },
    { id: 'medium', label: 'Medium', emoji: '🌶️🌶️', level: 2 },
    { id: 'spicy', label: 'Spicy', emoji: '🌶️🌶️🌶️', level: 3 },
    { id: 'extra', label: 'Extra Hot', emoji: '🔥', level: 4 },
  ],
  
  // Meal plan categories
  mealPlanCategories: [
    { id: 'gym', title: 'Gym & Fitness', emoji: '🏋️', description: 'High protein, balanced meals' },
    { id: 'weight', title: 'Weight Management', emoji: '⚖️', description: 'BMI-based nutrition' },
    { id: 'daily', title: 'Daily Restaurant Plans', emoji: '🍱', description: 'Fixed weekly menus' },
  ],
  
  // Gym plan types
  gymPlans: [
    { id: 'gain', title: 'Muscle Gain', calories: '2500-3000', protein: '150g+' },
    { id: 'loss', title: 'Fat Loss', calories: '1500-1800', protein: '120g+' },
    { id: 'maintain', title: 'Maintenance', calories: '2000-2200', protein: '100g+' },
  ],
};

export default config;
