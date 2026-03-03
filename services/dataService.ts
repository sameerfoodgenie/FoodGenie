// FoodGenie Live Data Service - Fetches from Supabase
import { getSupabaseClient } from '@/template';
import type { Dish, Restaurant } from './mockData';

function getClient() {
  return getSupabaseClient();
}

interface DBRestaurant {
  id: string;
  name: string;
  area: string | null;
  city: string;
  cuisines: string[];
  veg_type: string;
  price_band: string;
  is_verified: boolean;
  reliability_tier: string;
  google_rating: number | null;
  is_active: boolean;
}

interface DBDish {
  id: string;
  restaurant_id: string;
  name: string;
  category: string | null;
  is_veg: boolean;
  price_est: number;
  spice_level: string;
  is_active: boolean;
}

interface DBDishTag {
  dish_id: string;
  tag: string;
}

// Convert spice_level string to number
function spiceToNumber(spice: string): number {
  switch (spice) {
    case 'mild': return 1;
    case 'medium': return 2;
    case 'spicy': return 3;
    default: return 2;
  }
}

// Estimate delivery time from reliability tier
function estimateDelivery(tier: string): string {
  switch (tier) {
    case 'high': return '20-25 min';
    case 'medium': return '25-35 min';
    case 'new': return '30-40 min';
    default: return '25-35 min';
  }
}

// Price range string from price_band
function priceRangeString(band: string): string {
  switch (band) {
    case 'budget': return '₹50-200';
    case 'mid': return '₹150-350';
    case 'premium': return '₹250-500';
    default: return '₹100-400';
  }
}

// Map reliability tier to a chef score estimate
function tierToChefScore(tier: string, rating: number | null): number {
  const baseScore = tier === 'high' ? 90 : tier === 'medium' ? 82 : 75;
  const ratingBonus = rating ? Math.round((rating - 3.5) * 5) : 0;
  return Math.min(99, Math.max(60, baseScore + ratingBonus));
}

// Placeholder images based on category/cuisine
const CATEGORY_IMAGES: Record<string, any> = {
  paneer_sabzi: require('../assets/images/dish-veg-thali.png'),
  dal: require('../assets/images/dish-veg-thali.png'),
  thali: require('../assets/images/dish-veg-thali.png'),
  breads: require('../assets/images/dish-veg-thali.png'),
  rice: require('../assets/images/dish-biryani.png'),
  chinese: require('../assets/images/dish-butter-chicken.png'),
  pizza: require('../assets/images/dish-butter-chicken.png'),
  snacks: require('../assets/images/dish-butter-chicken.png'),
  dessert: require('../assets/images/dish-veg-thali.png'),
  beverage: require('../assets/images/dish-veg-thali.png'),
  healthy: require('../assets/images/dish-veg-thali.png'),
  south_indian: require('../assets/images/dish-veg-thali.png'),
};

function getDishImage(category: string | null, isVeg: boolean): any {
  if (category && CATEGORY_IMAGES[category]) {
    return CATEGORY_IMAGES[category];
  }
  return isVeg
    ? require('../assets/images/dish-veg-thali.png')
    : require('../assets/images/dish-butter-chicken.png');
}

function getRestaurantImage(vegType: string): any {
  switch (vegType) {
    case 'pure_veg': return require('../assets/images/dish-veg-thali.png');
    case 'nonveg': return require('../assets/images/dish-butter-chicken.png');
    default: return require('../assets/images/dish-biryani.png');
  }
}

// Convert readable tags to display tags
function formatTags(tags: string[]): string[] {
  const displayTags: string[] = [];
  const priority = [
    'high-protein', 'healthy', 'spicy', 'less-spicy', 'jain-option',
    'street-food', 'thali', 'heavy-meal', 'light-meal', 'under-250',
    'paneer', 'chicken', 'mutton', 'biryani', 'chinese', 'south-indian',
    'north-indian', 'mughlai', 'punjabi', 'pizza', 'pasta',
  ];
  for (const p of priority) {
    if (tags.includes(p) && displayTags.length < 2) {
      const label = p
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      displayTags.push(label);
    }
  }
  if (displayTags.length === 0 && tags.length > 0) {
    const t = tags[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    displayTags.push(t);
  }
  return displayTags;
}

// Build reason string based on dish + restaurant data
function buildReason(
  dish: DBDish,
  restaurant: DBRestaurant,
  tags: string[],
): string {
  const parts: string[] = [];
  if (restaurant.is_verified) {
    parts.push('From a chef-verified kitchen');
  }
  if (dish.price_est < 250) {
    parts.push('Budget-friendly option');
  }
  if (tags.includes('high-protein')) {
    parts.push('High protein');
  }
  if (tags.includes('healthy')) {
    parts.push('Healthy choice');
  }
  if (restaurant.google_rating && restaurant.google_rating >= 4.2) {
    parts.push(`Rated ${restaurant.google_rating} on Google`);
  }
  if (parts.length === 0) {
    parts.push('Good match based on your preferences');
  }
  return parts.join('. ') + '.';
}

export interface LiveDataResult {
  dishes: Dish[];
  restaurants: Restaurant[];
}

export async function fetchLiveData(): Promise<LiveDataResult> {
  const supabase = getClient();

  // Fetch all active restaurants, dishes, and tags in parallel
  const [restResult, dishResult, tagResult] = await Promise.all([
    supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('dish_tags')
      .select('dish_id, tag'),
  ]);

  const dbRestaurants: DBRestaurant[] = restResult.data || [];
  const dbDishes: DBDish[] = dishResult.data || [];
  const dbTags: DBDishTag[] = tagResult.data || [];

  // Build tag lookup: dish_id -> tags[]
  const tagMap = new Map<string, string[]>();
  for (const t of dbTags) {
    const existing = tagMap.get(t.dish_id) || [];
    existing.push(t.tag);
    tagMap.set(t.dish_id, existing);
  }

  // Build restaurant lookup
  const restMap = new Map<string, DBRestaurant>();
  for (const r of dbRestaurants) {
    restMap.set(r.id, r);
  }

  // Convert restaurants to app Restaurant type
  const restaurants: Restaurant[] = dbRestaurants.map((r) => {
    const chefScore = tierToChefScore(r.reliability_tier, r.google_rating);
    return {
      id: r.id,
      name: r.name,
      cuisine: (r.cuisines || []).join(', ') || 'Multi-cuisine',
      image: getRestaurantImage(r.veg_type),
      chefScore,
      hygieneScore: Math.max(chefScore - 2, 70),
      rating: r.google_rating || 4.0,
      deliveryTime: estimateDelivery(r.reliability_tier),
      priceRange: priceRangeString(r.price_band),
      lastAudit: r.is_verified ? '1 week ago' : 'Pending',
      improvements: [],
      featuredDishes: [],
      // Extra fields for filtering in Explore
      _area: r.area || null,
      _vegType: r.veg_type || null,
      _priceBand: r.price_band || null,
      _reliabilityTier: r.reliability_tier || null,
      _isVerified: r.is_verified || false,
    } as Restaurant & Record<string, any>;
  });

  // Convert dishes to app Dish type
  const dishes: Dish[] = dbDishes.map((d) => {
    const rest = restMap.get(d.restaurant_id);
    const tags = tagMap.get(d.id) || [];
    const displayTags = formatTags(tags);
    const chefScore = rest ? tierToChefScore(rest.reliability_tier, rest.google_rating) : 80;

    return {
      id: d.id,
      name: d.name,
      restaurant: rest?.name || 'Unknown',
      restaurantId: d.restaurant_id,
      price: d.price_est,
      originalPrice: Math.round(d.price_est * 1.15), // ~15% higher "aggregator" price
      image: getDishImage(d.category, d.is_veg),
      rating: rest?.google_rating || 4.0,
      chefScore,
      deliveryTime: rest ? estimateDelivery(rest.reliability_tier) : '25-35 min',
      isVeg: d.is_veg,
      spiceLevel: spiceToNumber(d.spice_level),
      calories: d.is_veg ? 350 : 450, // estimated
      protein: d.is_veg ? 15 : 30, // estimated
      reason: rest ? buildReason(d, rest, tags) : 'Good match based on your preferences.',
      tags: displayTags,
      // Extra fields for search/filter (stored in _rawTags)
      _rawTags: tags,
      _category: d.category,
      _area: rest?.area || null,
      _vegType: rest?.veg_type || null,
      _priceBand: rest?.price_band || null,
      _reliabilityTier: rest?.reliability_tier || null,
      _isVerified: rest?.is_verified || false,
    } as Dish & Record<string, any>;
  });

  // Populate featuredDishes on restaurants
  for (const rest of restaurants) {
    const restDishes = dishes
      .filter((d) => d.restaurantId === rest.id)
      .slice(0, 4);
    rest.featuredDishes = restDishes.map((d) => d.id);
  }

  return { dishes, restaurants };
}
