import { mockDishes, mockRestaurants, Dish } from './mockData';

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
}

interface ScoredDish {
  dish: Dish;
  score: number;
  reasons: string[];
  isVerified: boolean;
}

const CONFIDENCE_TIE_MARGIN = 5; // Within 5 points = tie, use verified as tiebreak

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

function scoreDish(dish: Dish, input: AIEngineInput, keywords: string[]): ScoredDish {
  let score = 50; // Base score
  const reasons: string[] = [];

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
    score -= 5; // slight penalty but not exclusion
  }
  if (input.diet === 'egg') {
    // Eggetarian can eat veg + egg dishes
    // No hard filter needed
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

  // 4. Keyword relevance
  const dishText = `${dish.name} ${dish.tags.join(' ')} ${dish.reason}`.toLowerCase();
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

  // 5. Rating quality
  if (dish.rating >= 4.7) {
    score += 8;
    reasons.push('Highly rated by diners');
  } else if (dish.rating >= 4.5) {
    score += 4;
  }

  // 6. Quick delivery bonus for "quick" keyword
  if (keywords.includes('quick')) {
    const time = parseInt(dish.deliveryTime);
    if (time <= 25) {
      score += 10;
      reasons.push('Fast delivery under 25 minutes');
    }
  }

  // 7. Healthy bonus
  if (keywords.includes('healthy') && dish.protein >= 20 && dish.calories <= 450) {
    score += 12;
    reasons.push('High protein, moderate calories');
  }

  // 8. Filling bonus
  if (keywords.includes('filling') && dish.calories >= 500) {
    score += 8;
    reasons.push('Hearty and filling meal');
  }

  // Restaurant verification check
  const restaurant = mockRestaurants.find(r => r.id === dish.restaurantId);
  const isVerified = restaurant ? restaurant.chefScore >= 85 : false;

  // Ensure at least one reason
  if (reasons.length === 0) {
    if (dish.rating >= 4.5) reasons.push('Top-rated dish from trusted kitchen');
    else reasons.push('Good match based on your preferences');
  }

  return { dish, score: Math.max(0, score), reasons, isVerified };
}

// ---- Main engine ----

export function processAIRequest(input: AIEngineInput): ConfidenceResult[] {
  const keywords = extractKeywords(input.query);
  
  // Score all dishes
  let scored = mockDishes
    .map(dish => scoreDish(dish, input, keywords))
    .filter(s => s.score > 0); // Remove hard-filtered items

  // Sort by confidence score (descending)
  scored.sort((a, b) => {
    const diff = b.score - a.score;
    // If scores are close, use verified badge as tiebreak
    if (Math.abs(diff) <= CONFIDENCE_TIE_MARGIN) {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      // If still tied, use rating
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
    estimatedTotal: item.dish.price + 30, // delivery estimate
  }));
}

// Quick mode: instant best match
export function getQuickRecommendation(input: Omit<AIEngineInput, 'query'>): ConfidenceResult | null {
  const results = processAIRequest({ ...input, query: '' });
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
  
  return messages;
}
