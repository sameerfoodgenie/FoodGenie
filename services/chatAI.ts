import { mockDishes } from './mockData';

export interface KeywordMatch {
  keyword: string;
  category: 'dish' | 'cuisine' | 'dietary' | 'mood' | 'price' | 'time' | 'portion';
  confidence: number;
}

export interface AIResponse {
  analysis: string;
  matches: KeywordMatch[];
  suggestedDishes: typeof mockDishes;
  responseText: string;
}

// Keyword dictionary for pattern matching
const keywordPatterns = {
  // Specific dishes
  dishes: {
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

  // Cuisines
  cuisines: {
    indian: ['indian', 'desi', 'curry'],
    north: ['north indian', 'punjabi', 'tandoori'],
    south: ['south indian', 'dosa', 'idli', 'sambar'],
    chinese: ['chinese', 'noodles', 'manchurian'],
    italian: ['italian'],
    continental: ['continental', 'western'],
  },

  // Dietary preferences
  dietary: {
    veg: ['veg', 'vegetarian', 'no meat', 'plant based'],
    nonveg: ['non veg', 'chicken', 'meat', 'egg'],
    healthy: ['healthy', 'nutritious', 'fitness', 'protein', 'low calorie', 'diet'],
    comfort: ['comfort', 'indulgent', 'rich', 'creamy'],
  },

  // Mood/Context
  mood: {
    quick: ['quick', 'fast', 'hurry', 'short time'],
    hungry: ['hungry', 'starving', 'famished', 'very hungry'],
    light: ['light', 'small', 'snack', 'not too heavy'],
    heavy: ['heavy', 'filling', 'full meal', 'large'],
    spicy: ['spicy', 'hot', 'tangy', 'masala'],
    mild: ['mild', 'not spicy', 'less spicy', 'bland'],
  },

  // Budget
  budget: {
    cheap: ['cheap', 'affordable', 'budget', 'under 200', 'low price'],
    premium: ['premium', 'expensive', 'best', 'high end'],
  },

  // Portion
  portion: {
    bulk: ['bulk', 'group', 'many people', 'party', 'sharing'],
    single: ['one', 'solo', 'just me', 'single'],
  },
};

function analyzeKeywords(message: string): KeywordMatch[] {
  const matches: KeywordMatch[] = [];
  const lowerMessage = message.toLowerCase();

  // Check each category
  for (const [category, subcategories] of Object.entries(keywordPatterns)) {
    for (const [key, patterns] of Object.entries(subcategories)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          matches.push({
            keyword: key,
            category: category.slice(0, -1) as KeywordMatch['category'], // Remove 's' from category name
            confidence: pattern.length / lowerMessage.length, // Simple confidence based on pattern length
          });
        }
      }
    }
  }

  return matches;
}

function filterDishesByKeywords(matches: KeywordMatch[]): typeof mockDishes {
  if (matches.length === 0) {
    // Return top rated dishes as default
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
    filtered = filtered.filter(d => 
      dishKeywords.some(kw => 
        d.name.toLowerCase().includes(kw) || 
        d.tags.some(tag => tag.toLowerCase().includes(kw))
      )
    );
  }

  // Apply mood filters
  const moodMatches = matches.filter(m => m.category === 'mood');
  if (moodMatches.some(m => m.keyword === 'spicy')) {
    filtered = filtered.filter(d => d.spiceLevel >= 3);
  }
  if (moodMatches.some(m => m.keyword === 'mild')) {
    filtered = filtered.filter(d => d.spiceLevel <= 2);
  }
  if (moodMatches.some(m => m.keyword === 'quick')) {
    filtered = filtered.filter(d => {
      const time = parseInt(d.deliveryTime);
      return time <= 25;
    });
  }

  // Apply budget filters
  const budgetMatches = matches.filter(m => m.category === 'budget');
  if (budgetMatches.some(m => m.keyword === 'cheap')) {
    filtered = filtered.filter(d => d.price <= 250);
  }
  if (budgetMatches.some(m => m.keyword === 'premium')) {
    filtered = filtered.filter(d => d.price >= 300);
  }

  // If we filtered too aggressively, fall back to top rated
  if (filtered.length === 0) {
    filtered = [...mockDishes]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  } else {
    // Sort by chef score and rating
    filtered.sort((a, b) => {
      const scoreA = a.chefScore * 0.6 + a.rating * 10;
      const scoreB = b.chefScore * 0.6 + b.rating * 10;
      return scoreB - scoreA;
    });
  }

  // Return minimum 6 dishes
  return filtered.slice(0, Math.max(6, filtered.length));
}

function generateResponse(matches: KeywordMatch[], dishes: typeof mockDishes): string {
  const responses: { [key: string]: string[] } = {
    veg: [
      "Found some delicious vegetarian options for you!",
      "Here are chef-verified vegetarian dishes:",
      "Perfect vegetarian meals coming up:",
    ],
    nonveg: [
      "Got some amazing non-veg options!",
      "Here are protein-rich non-veg dishes:",
      "Chef-special non-veg meals for you:",
    ],
    healthy: [
      "Here are nutritious, balanced meals:",
      "Found healthy options that taste great:",
      "Protein-rich, low-calorie dishes for you:",
    ],
    spicy: [
      "Bringing the heat! Here are spicy options:",
      "Found dishes with bold, spicy flavors:",
      "For spice lovers — these pack a punch:",
    ],
    quick: [
      "Need it fast? These deliver in under 25 minutes:",
      "Quick options that don't compromise on taste:",
      "Fast delivery, great food:",
    ],
    cheap: [
      "Budget-friendly picks under ₹250:",
      "Great value meals without breaking the bank:",
      "Affordable options from trusted kitchens:",
    ],
  };

  // Find the most relevant keyword
  const topMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
  
  if (topMatch && responses[topMatch.keyword]) {
    const options = responses[topMatch.keyword];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Default responses
  const defaultResponses = [
    "Based on your preferences, here are my top picks:",
    "I've found these amazing dishes for you:",
    "Check out these chef-verified options:",
    "Here's what I recommend today:",
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function getAnalysisText(matches: KeywordMatch[]): string {
  if (matches.length === 0) {
    return "Understanding your request...";
  }

  const categories = [...new Set(matches.map(m => m.category))];
  const keywords = matches.slice(0, 3).map(m => m.keyword);

  const analyses = [
    `Looking for ${keywords.join(', ')} options...`,
    `Finding ${keywords.join(' and ')} dishes...`,
    `Checking chef-verified ${keywords[0]} meals...`,
    `Searching trusted kitchens for ${keywords.join(', ')}...`,
  ];

  return analyses[Math.floor(Math.random() * analyses.length)];
}

export function processUserMessage(message: string): AIResponse {
  // Analyze keywords
  const matches = analyzeKeywords(message);
  
  // Filter dishes based on keywords
  const suggestedDishes = filterDishesByKeywords(matches);
  
  // Generate natural response
  const responseText = generateResponse(matches, suggestedDishes);
  
  // Generate analysis text
  const analysis = getAnalysisText(matches);

  return {
    analysis,
    matches,
    suggestedDishes,
    responseText,
  };
}
