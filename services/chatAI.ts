import { Dish } from './mockData';

export interface KeywordMatch {
  keyword: string;
  category: 'dish' | 'cuisine' | 'dietary' | 'mood' | 'budget' | 'portion';
  confidence: number;
}

export interface AIResponse {
  analysis: string;
  matches: KeywordMatch[];
  suggestedDishes: Dish[];
  responseText: string;
}

// Keyword dictionary for pattern matching
const keywordPatterns: Record<string, Record<string, string[]>> = {
  dish: {
    butter: ['butter chicken', 'makhani', 'creamy'],
    biryani: ['biryani', 'rice', 'pulao'],
    thali: ['thali', 'combo', 'variety', 'complete meal'],
    paneer: ['paneer', 'cottage cheese'],
    dal: ['dal', 'lentil'],
    roti: ['roti', 'chapati', 'bread', 'naan'],
    noodles: ['noodle', 'hakka', 'chow'],
    pizza: ['pizza'],
    burger: ['burger', 'sandwich'],
    salad: ['salad', 'fresh', 'greens'],
    dosa: ['dosa', 'uttapam'],
    momos: ['momos', 'dumpling'],
  },
  cuisine: {
    indian: ['indian', 'desi', 'curry'],
    north: ['north indian', 'punjabi', 'tandoori'],
    south: ['south indian', 'dosa', 'idli', 'sambar'],
    chinese: ['chinese', 'noodles', 'manchurian', 'schezwan'],
    italian: ['italian', 'pasta', 'pizza'],
    mughlai: ['mughlai', 'biryani', 'kebab'],
  },
  dietary: {
    veg: ['veg', 'vegetarian', 'no meat', 'plant based'],
    nonveg: ['non veg', 'chicken', 'meat', 'egg', 'mutton'],
    healthy: ['healthy', 'nutritious', 'fitness', 'protein', 'low calorie', 'diet'],
    comfort: ['comfort', 'indulgent', 'rich', 'creamy'],
  },
  mood: {
    quick: ['quick', 'fast', 'hurry', 'short time'],
    hungry: ['hungry', 'starving', 'famished', 'very hungry'],
    light: ['light', 'small', 'snack', 'not too heavy'],
    heavy: ['heavy', 'filling', 'full meal', 'large'],
    spicy: ['spicy', 'hot', 'tangy', 'masala'],
    mild: ['mild', 'not spicy', 'less spicy', 'bland'],
  },
  budget: {
    cheap: ['cheap', 'affordable', 'budget', 'under 200', 'under 250', 'low price'],
    premium: ['premium', 'expensive', 'best', 'high end'],
  },
  portion: {
    bulk: ['bulk', 'group', 'many people', 'party', 'sharing'],
    single: ['one', 'solo', 'just me', 'single'],
  },
};

function analyzeKeywords(message: string): KeywordMatch[] {
  const matches: KeywordMatch[] = [];
  const lowerMessage = message.toLowerCase();

  for (const [category, subcategories] of Object.entries(keywordPatterns)) {
    for (const [key, patterns] of Object.entries(subcategories)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          matches.push({
            keyword: key,
            category: category as KeywordMatch['category'],
            confidence: pattern.length / Math.max(lowerMessage.length, 1),
          });
          break;
        }
      }
    }
  }

  return matches;
}

function filterDishesByKeywords(matches: KeywordMatch[], allDishes: Dish[]): Dish[] {
  if (matches.length === 0) {
    return [...allDishes]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }

  let filtered = [...allDishes];

  // Apply dietary filters first
  const dietaryMatches = matches.filter(m => m.category === 'dietary');
  if (dietaryMatches.some(m => m.keyword === 'veg')) {
    filtered = filtered.filter(d => d.isVeg);
  }
  if (dietaryMatches.some(m => m.keyword === 'nonveg')) {
    filtered = filtered.filter(d => !d.isVeg);
  }
  if (dietaryMatches.some(m => m.keyword === 'healthy')) {
    const extra = filtered.filter(d => {
      const raw = (d as any)._rawTags || [];
      return raw.includes('healthy') || raw.includes('high-protein');
    });
    if (extra.length > 0) filtered = extra;
  }

  // Apply dish-specific filters
  const dishMatches = matches.filter(m => m.category === 'dish');
  if (dishMatches.length > 0) {
    const dishKeywords = dishMatches.map(m => m.keyword);
    const dishFiltered = filtered.filter(d => {
      const raw = (d as any)._rawTags || [];
      const searchText = `${d.name.toLowerCase()} ${raw.join(' ')} ${d.tags.join(' ').toLowerCase()}`;
      return dishKeywords.some(kw => searchText.includes(kw));
    });
    if (dishFiltered.length > 0) {
      filtered = dishFiltered;
    }
  }

  // Apply cuisine filters
  const cuisineMatches = matches.filter(m => m.category === 'cuisine');
  if (cuisineMatches.length > 0) {
    const cuisineKeys = cuisineMatches.map(m => m.keyword);
    const cuisineFiltered = filtered.filter(d => {
      const raw = (d as any)._rawTags || [];
      const searchText = `${d.restaurant.toLowerCase()} ${raw.join(' ')}`;
      return cuisineKeys.some(ck => {
        if (ck === 'north') return searchText.includes('north-indian') || searchText.includes('punjabi');
        if (ck === 'south') return searchText.includes('south-indian');
        if (ck === 'chinese') return searchText.includes('chinese');
        if (ck === 'mughlai') return searchText.includes('mughlai');
        return searchText.includes(ck);
      });
    });
    if (cuisineFiltered.length > 0) filtered = cuisineFiltered;
  }

  // Apply mood filters
  const moodMatches = matches.filter(m => m.category === 'mood');
  if (moodMatches.some(m => m.keyword === 'spicy')) {
    const spicyFiltered = filtered.filter(d => d.spiceLevel >= 3);
    if (spicyFiltered.length > 0) filtered = spicyFiltered;
  }
  if (moodMatches.some(m => m.keyword === 'mild')) {
    const mildFiltered = filtered.filter(d => d.spiceLevel <= 1);
    if (mildFiltered.length > 0) filtered = mildFiltered;
  }

  // Apply budget filters
  const budgetMatches = matches.filter(m => m.category === 'budget');
  if (budgetMatches.some(m => m.keyword === 'cheap')) {
    const cheapFiltered = filtered.filter(d => d.price <= 250);
    if (cheapFiltered.length > 0) filtered = cheapFiltered;
  }
  if (budgetMatches.some(m => m.keyword === 'premium')) {
    const premFiltered = filtered.filter(d => d.price >= 250);
    if (premFiltered.length > 0) filtered = premFiltered;
  }

  // Sort by chef score and rating
  filtered.sort((a, b) => {
    const scoreA = a.chefScore * 0.6 + a.rating * 10;
    const scoreB = b.chefScore * 0.6 + b.rating * 10;
    return scoreB - scoreA;
  });

  // Return minimum 6 dishes
  if (filtered.length < 6) {
    const remaining = allDishes
      .filter(d => !filtered.find(f => f.id === d.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6 - filtered.length);
    filtered = [...filtered, ...remaining];
  }

  return filtered.slice(0, Math.max(6, filtered.length));
}

function generateResponse(matches: KeywordMatch[]): string {
  const responses: Record<string, string[]> = {
    veg: [
      "Found some delicious vegetarian options for you!",
      "Here are chef-verified vegetarian dishes:",
    ],
    nonveg: [
      "Got some amazing non-veg options!",
      "Here are protein-rich non-veg dishes:",
    ],
    healthy: [
      "Here are nutritious, balanced meals:",
      "Found healthy options that taste great:",
    ],
    spicy: [
      "Bringing the heat! Here are spicy options:",
      "For spice lovers - these pack a punch:",
    ],
    quick: [
      "Need it fast? These deliver quickly:",
      "Quick options that do not compromise on taste:",
    ],
    cheap: [
      "Budget-friendly picks under 250 rupees:",
      "Great value meals without breaking the bank:",
    ],
  };

  const topMatch = [...matches].sort((a, b) => b.confidence - a.confidence)[0];

  if (topMatch && responses[topMatch.keyword]) {
    const options = responses[topMatch.keyword];
    return options[Math.floor(Math.random() * options.length)];
  }

  const defaultResponses = [
    "Based on your preferences, here are my top picks:",
    "I have found these amazing dishes for you:",
    "Check out these chef-verified options:",
    "Here is what I recommend today:",
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function getAnalysisText(matches: KeywordMatch[]): string {
  if (matches.length === 0) {
    return "Understanding your request...";
  }
  const keywords = matches.slice(0, 3).map(m => m.keyword);
  const analyses = [
    `Looking for ${keywords.join(', ')} options...`,
    `Finding ${keywords.join(' and ')} dishes...`,
    `Checking chef-verified ${keywords[0]} meals...`,
  ];
  return analyses[Math.floor(Math.random() * analyses.length)];
}

// Now accepts allDishes parameter instead of importing mockData
export function processUserMessage(message: string, allDishes?: Dish[]): AIResponse {
  const dishes = allDishes || [];
  const matches = analyzeKeywords(message);
  const suggestedDishes = filterDishesByKeywords(matches, dishes);
  const responseText = generateResponse(matches);
  const analysis = getAnalysisText(matches);

  return {
    analysis,
    matches,
    suggestedDishes,
    responseText,
  };
}
