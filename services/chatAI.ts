import { mockDishes } from './mockData';

export interface KeywordMatch {
  keyword: string;
  category: 'dish' | 'cuisine' | 'dietary' | 'mood' | 'budget' | 'portion';
  confidence: number;
}

export interface AIResponse {
  analysis: string;
  matches: KeywordMatch[];
  suggestedDishes: typeof mockDishes;
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
    roti: ['roti', 'chapati', 'bread'],
    waffle: ['waffle', 'pancake', 'breakfast'],
    pasta: ['pasta', 'spaghetti', 'italian'],
    burger: ['burger', 'sandwich'],
    pizza: ['pizza'],
    salad: ['salad', 'fresh', 'greens'],
  },
  cuisine: {
    indian: ['indian', 'desi', 'curry'],
    north: ['north indian', 'punjabi', 'tandoori'],
    south: ['south indian', 'dosa', 'idli', 'sambar'],
    chinese: ['chinese', 'noodles', 'manchurian'],
    italian: ['italian'],
    continental: ['continental', 'western'],
  },
  dietary: {
    veg: ['veg', 'vegetarian', 'no meat', 'plant based'],
    nonveg: ['non veg', 'chicken', 'meat', 'egg'],
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
    cheap: ['cheap', 'affordable', 'budget', 'under 200', 'low price'],
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
          break; // Only match once per subcategory
        }
      }
    }
  }

  return matches;
}

function filterDishesByKeywords(matches: KeywordMatch[]): typeof mockDishes {
  if (matches.length === 0) {
    return [...mockDishes]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }

  let filtered = [...mockDishes];

  // Apply dietary filters first
  const dietaryMatches = matches.filter(m => m.category === 'dietary');
  if (dietaryMatches.some(m => m.keyword === 'veg')) {
    filtered = filtered.filter(d => d.isVeg);
  }
  if (dietaryMatches.some(m => m.keyword === 'nonveg')) {
    filtered = filtered.filter(d => !d.isVeg);
  }
  if (dietaryMatches.some(m => m.keyword === 'healthy')) {
    filtered = filtered.filter(d => d.protein >= 20 && d.calories <= 450);
  }

  // Apply dish-specific filters
  const dishMatches = matches.filter(m => m.category === 'dish');
  if (dishMatches.length > 0) {
    const dishKeywords = dishMatches.map(m => m.keyword);
    const dishFiltered = filtered.filter(d =>
      dishKeywords.some(kw =>
        d.name.toLowerCase().includes(kw) ||
        d.tags.some(tag => tag.toLowerCase().includes(kw))
      )
    );
    if (dishFiltered.length > 0) {
      filtered = dishFiltered;
    }
  }

  // Apply mood filters
  const moodMatches = matches.filter(m => m.category === 'mood');
  if (moodMatches.some(m => m.keyword === 'spicy')) {
    const spicyFiltered = filtered.filter(d => d.spiceLevel >= 3);
    if (spicyFiltered.length > 0) filtered = spicyFiltered;
  }
  if (moodMatches.some(m => m.keyword === 'mild')) {
    const mildFiltered = filtered.filter(d => d.spiceLevel <= 2);
    if (mildFiltered.length > 0) filtered = mildFiltered;
  }
  if (moodMatches.some(m => m.keyword === 'quick')) {
    const quickFiltered = filtered.filter(d => {
      const time = parseInt(d.deliveryTime);
      return !isNaN(time) && time <= 25;
    });
    if (quickFiltered.length > 0) filtered = quickFiltered;
  }

  // Apply budget filters
  const budgetMatches = matches.filter(m => m.category === 'budget');
  if (budgetMatches.some(m => m.keyword === 'cheap')) {
    const cheapFiltered = filtered.filter(d => d.price <= 250);
    if (cheapFiltered.length > 0) filtered = cheapFiltered;
  }
  if (budgetMatches.some(m => m.keyword === 'premium')) {
    const premFiltered = filtered.filter(d => d.price >= 300);
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
    const remaining = mockDishes
      .filter(d => !filtered.find(f => f.id === d.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6 - filtered.length);
    filtered = [...filtered, ...remaining];
  }

  return filtered.slice(0, Math.max(6, filtered.length));
}

function generateResponse(matches: KeywordMatch[], dishes: typeof mockDishes): string {
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
      "Need it fast? These deliver in under 25 minutes:",
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

export function processUserMessage(message: string): AIResponse {
  const matches = analyzeKeywords(message);
  const suggestedDishes = filterDishesByKeywords(matches);
  const responseText = generateResponse(matches, suggestedDishes);
  const analysis = getAnalysisText(matches);

  return {
    analysis,
    matches,
    suggestedDishes,
    responseText,
  };
}
