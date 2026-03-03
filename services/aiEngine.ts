import { Dish, Restaurant } from './mockData';

export interface ConfidenceResult {
  dish: Dish;
  confidence: number; // 0-100 internal score (never shown to user)
  rank: 'best' | 'strong' | 'good';
  reasons: string[];
  isVerified: boolean;
  estimatedTotal: number;
}

export interface AIEngineInput {
  query: string;
  diet: 'veg' | 'egg' | 'nonveg' | null;
  budgetMin: number;
  budgetMax: number;
  spiceLevel: number;
  mode: 'quick' | 'guided';
  healthGoal?: string;
  deliveryPriority?: string;
  cuisineBias?: string[];
  avoidTags?: string[];
}

interface ScoredDish {
  dish: Dish;
  score: number;
  reasons: string[];
  isVerified: boolean;
}

const CONFIDENCE_TIE_MARGIN = 5;

// ---- Keyword extraction ----
const KEYWORDS: Record<string, string[]> = {
  biryani: ['biryani', 'rice dish', 'pulao'],
  chicken: ['chicken', 'murgh', 'tikka'],
  paneer: ['paneer', 'cottage cheese'],
  butter: ['butter', 'makhani', 'creamy'],
  dal: ['dal', 'lentil', 'daal'],
  spicy: ['spicy', 'hot', 'masala', 'mirchi', 'chilli'],
  mild: ['mild', 'less spicy', 'bland', 'light'],
  healthy: ['healthy', 'protein', 'low calorie', 'fitness', 'nutritious', 'diet'],
  quick: ['quick', 'fast', 'hurry', 'urgent'],
  comfort: ['comfort', 'homestyle', 'home style', 'ghar', 'cozy'],
  seafood: ['fish', 'prawn', 'seafood', 'coastal'],
  south: ['south indian', 'dosa', 'idli', 'sambar'],
  north: ['north indian', 'punjabi', 'tandoori', 'naan'],
  street: ['street food', 'chaat', 'pav'],
  filling: ['filling', 'heavy', 'full meal', 'hungry', 'starving'],
  light: ['light', 'snack', 'small'],
  veg: ['veg', 'vegetarian', 'no meat'],
  nonveg: ['non veg', 'meat', 'egg'],
  chinese: ['chinese', 'noodles', 'manchurian', 'schezwan', 'hakka'],
  pizza: ['pizza', 'burger', 'pasta', 'fries'],
  thali: ['thali', 'combo meal'],
  sweet: ['sweet', 'dessert', 'mithai', 'gulab', 'halwa', 'kheer'],
  under250: ['under 250', 'cheap', 'budget', 'affordable'],
};

function extractKeywords(query: string): string[] {
  const lower = query.toLowerCase();
  const matched: string[] = [];
  for (const [key, patterns] of Object.entries(KEYWORDS)) {
    if (patterns.some(p => lower.includes(p))) {
      matched.push(key);
    }
  }
  return matched;
}

// ---- Scoring ----

function scoreDish(
  dish: Dish,
  input: AIEngineInput,
  keywords: string[],
  restaurants: Restaurant[],
): ScoredDish {
  let score = 50;
  const reasons: string[] = [];
  const extra = dish as any; // Access _rawTags, _category etc.

  // 1. Budget band filter (primary filter - massive penalty if outside)
  if (dish.price < input.budgetMin - 50) {
    score -= 10;
  } else if (dish.price > input.budgetMax + 50) {
    score -= 40;
    reasons.push('Slightly above your budget range');
  } else if (dish.price >= input.budgetMin && dish.price <= input.budgetMax) {
    score += 15;
    reasons.push('Within your budget comfort zone');
  }

  // 2. Diet filter (hard filter)
  if (input.diet === 'veg' && !dish.isVeg) {
    return { dish, score: -100, reasons: [], isVerified: false };
  }
  if (input.diet === 'nonveg' && dish.isVeg) {
    score -= 5;
  }

  // 3. Spice alignment
  const spiceDiff = Math.abs(dish.spiceLevel - input.spiceLevel);
  if (spiceDiff === 0) {
    score += 12;
    reasons.push('Perfect spice match for your taste');
  } else if (spiceDiff === 1) {
    score += 5;
  } else {
    score -= spiceDiff * 4;
  }

  // 4. Keyword relevance - use raw tags + name + category for matching
  const rawTags: string[] = extra._rawTags || [];
  const dishText = `${dish.name} ${rawTags.join(' ')} ${dish.tags.join(' ')} ${dish.reason} ${extra._category || ''}`.toLowerCase();
  let keywordHits = 0;
  for (const kw of keywords) {
    const patterns = KEYWORDS[kw] || [kw];
    if (patterns.some(p => dishText.includes(p))) {
      keywordHits++;
      score += 10;
    }
  }
  if (keywordHits > 0) {
    reasons.push(`Matches "${keywords.slice(0, 2).join(', ')}" in your request`);
  }

  // 5. Under-250 keyword bonus
  if (keywords.includes('under250') && dish.price < 250) {
    score += 12;
    reasons.push('Under ₹250 as requested');
  }

  // 6. Rating quality
  if (dish.rating >= 4.3) {
    score += 8;
    reasons.push('Highly rated on Google');
  } else if (dish.rating >= 4.0) {
    score += 4;
  }

  // 7. Quick delivery bonus
  if (keywords.includes('quick')) {
    const time = parseInt(dish.deliveryTime);
    if (time <= 25) {
      score += 10;
      reasons.push('Fast delivery under 25 minutes');
    }
  }

  // 8. Healthy bonus using raw tags
  if (keywords.includes('healthy') && rawTags.includes('healthy')) {
    score += 12;
    reasons.push('Healthy option');
  }
  if (keywords.includes('healthy') && rawTags.includes('high-protein')) {
    score += 8;
    reasons.push('High protein');
  }

  // 9. Filling bonus
  if (keywords.includes('filling') && rawTags.includes('heavy-meal')) {
    score += 8;
    reasons.push('Hearty and filling meal');
  }

  // 10. Light meal bonus
  if (keywords.includes('light') && rawTags.includes('light-meal')) {
    score += 8;
    reasons.push('Light and easy meal');
  }

  // 11. Sweet cravings
  if (keywords.includes('sweet') && (extra._category === 'dessert' || rawTags.includes('dessert'))) {
    score += 15;
    reasons.push('Sweet treat to satisfy cravings');
  }

  // 12. Health goal influence
  if (input.healthGoal === 'weight_loss' && rawTags.includes('healthy')) {
    score += 10;
    reasons.push('Supports your weight loss goal');
  }
  if (input.healthGoal === 'muscle_gain' && rawTags.includes('high-protein')) {
    score += 12;
    reasons.push('High protein for muscle gain');
  }
  if (input.healthGoal === 'balanced' && rawTags.includes('balanced-meal')) {
    score += 8;
  }

  // 13. Cuisine bias boost
  if (input.cuisineBias && input.cuisineBias.length > 0) {
    const category = (extra._category || '').toLowerCase();
    const dishCuisines = `${category} ${rawTags.join(' ')} ${dish.name}`.toLowerCase();
    for (const bias of input.cuisineBias) {
      if (dishCuisines.includes(bias.toLowerCase())) {
        score += 7;
        break;
      }
    }
  }

  // 14. Avoid tags penalty
  if (input.avoidTags && input.avoidTags.length > 0) {
    const dishAllText = `${dish.name} ${rawTags.join(' ')} ${dish.tags.join(' ')}`.toLowerCase();
    for (const avoid of input.avoidTags) {
      if (dishAllText.includes(avoid.toLowerCase())) {
        score -= 25;
        break;
      }
    }
  }

  // Restaurant verification check
  const restaurant = restaurants.find(r => r.id === dish.restaurantId);
  const isVerified = extra._isVerified || (restaurant ? restaurant.chefScore >= 85 : false);

  // Reliability tier bonus
  if (extra._reliabilityTier === 'high') {
    score += 5;
  }

  // 15. Delivery priority influence
  if (input.deliveryPriority === 'fastest') {
    const time = parseInt(dish.deliveryTime);
    if (time <= 25) score += 8;
    else if (time <= 35) score += 3;
  }
  if (input.deliveryPriority === 'most_reliable' && extra._reliabilityTier === 'high') {
    score += 10;
  }

  // Ensure at least one reason
  if (reasons.length === 0) {
    if (dish.rating >= 4.0) reasons.push('Well-rated dish from trusted kitchen');
    else reasons.push('Good match based on your preferences');
  }

  return { dish, score: Math.max(0, score), reasons, isVerified };
}

// ---- Main engine (now accepts live data) ----

export function processAIRequest(
  input: AIEngineInput,
  dishesData?: Dish[],
  restaurantsData?: Restaurant[],
): ConfidenceResult[] {
  const dishes = dishesData || [];
  const restaurants = restaurantsData || [];
  const keywords = extractKeywords(input.query);
  
  // Score all dishes
  let scored = dishes
    .map(dish => scoreDish(dish, input, keywords, restaurants))
    .filter(s => s.score > 0);

  // Sort by confidence score (descending)
  scored.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) <= CONFIDENCE_TIE_MARGIN) {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return b.dish.rating - a.dish.rating;
    }
    return diff;
  });

  // Take top 3 only
  const top3 = scored.slice(0, 3);
  const ranks: ('best' | 'strong' | 'good')[] = ['best', 'strong', 'good'];

  return top3.map((item, index) => ({
    dish: item.dish,
    confidence: item.score,
    rank: ranks[index] || 'good',
    reasons: item.reasons,
    isVerified: item.isVerified,
    estimatedTotal: item.dish.price + 30,
  }));
}

// Quick mode: instant best match
export function getQuickRecommendation(
  input: Omit<AIEngineInput, 'query'>,
  dishes?: Dish[],
  restaurants?: Restaurant[],
): ConfidenceResult | null {
  const results = processAIRequest({ ...input, query: '' }, dishes, restaurants);
  return results[0] || null;
}

// Generate analysis text for thinking screen
export function getAnalysisText(query: string): string[] {
  const keywords = extractKeywords(query);
  const messages = [
    'Checking chef-approved kitchens...',
    'Filtering by your budget range...',
    'Ranking by confidence scores...',
  ];
  
  if (keywords.includes('spicy') || keywords.includes('mild')) {
    messages.push('Matching spice preferences...');
  }
  if (keywords.includes('healthy')) {
    messages.push('Checking nutritional profiles...');
  }
  if (keywords.includes('quick')) {
    messages.push('Prioritizing fast delivery...');
  }
  if (keywords.includes('chinese')) {
    messages.push('Finding best Chinese options...');
  }
  if (keywords.includes('under250')) {
    messages.push('Filtering budget-friendly picks...');
  }
  
  return messages;
}
