import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const BRIGHT_DATA_API_KEY = Deno.env.get('BRIGHT_DATA_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Provider configurations
const PROVIDERS = [
  { id: 'zepto', name: 'Zepto', domain: 'zeptonow.com' },
  { id: 'blinkit', name: 'Blinkit', domain: 'blinkit.com' },
  { id: 'bigbasket', name: 'BigBasket', domain: 'bigbasket.com' },
  { id: 'instamart', name: 'Instamart', domain: 'swiggy.com/instamart' },
];

interface PackMapping {
  ingredient_name: string;
  category: string;
  common_pack_sizes: string[];
  default_pack_size: string;
  preferred_brands: string[];
  substitute_names: string[];
  unit: string;
}

interface NormalizedQuery {
  original_name: string;
  normalized_name: string;
  recipe_qty: string;
  recipe_qty_value: number;
  recipe_unit: string;
  search_queries: string[];
  recommended_pack: string;
  preferred_brands: string[];
  category: string;
  substitute_names: string[];
}

interface MatchedProduct {
  product_id: string | null;
  query_name: string;
  original_ingredient: string;
  provider_name: string;
  brand_name: string | null;
  product_title: string | null;
  pack_size: string | null;
  price: number | null;
  mrp: number | null;
  discount_price: number | null;
  availability: boolean;
  delivery_time: string | null;
  product_url: string | null;
  image_url: string | null;
  pincode: string | null;
  match_score: number;
  recipe_qty: string;
  recommended_buy_qty: string;
  leftover: string;
  raw_response: any;
}

// ── Normalization Logic ──

function parseQuantity(qtyStr: string): { value: number; unit: string } {
  const clean = qtyStr.toLowerCase().trim();
  const match = clean.match(/^([\d.]+)\s*(kg|g|ml|l|litre|liter|pcs|bunch|pack|tbsp|tsp|cup)?/i);
  if (match) {
    return { value: parseFloat(match[1]), unit: normalizeUnit(match[2] || 'g') };
  }
  return { value: 1, unit: 'pack' };
}

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    'kg': 'kg', 'g': 'g', 'gm': 'g', 'gms': 'g', 'gram': 'g', 'grams': 'g',
    'ml': 'ml', 'l': 'L', 'litre': 'L', 'liter': 'L', 'litres': 'L', 'liters': 'L',
    'pcs': 'pcs', 'pc': 'pcs', 'piece': 'pcs', 'pieces': 'pcs',
    'bunch': 'bunch', 'pack': 'pack',
    'tbsp': 'g', 'tsp': 'g', 'cup': 'g',
  };
  return map[unit.toLowerCase()] || unit;
}

function convertToBaseUnit(value: number, unit: string): { value: number; unit: string } {
  if (unit === 'kg') return { value: value * 1000, unit: 'g' };
  if (unit === 'L') return { value: value * 1000, unit: 'ml' };
  return { value, unit };
}

function parsePackSize(packStr: string): { value: number; unit: string } {
  const clean = packStr.toLowerCase().trim();
  const match = clean.match(/([\d.]+)\s*(kg|g|ml|l|litre|liter|pcs|bunch|pack)?/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = normalizeUnit(match[2] || 'g');
    return convertToBaseUnit(value, unit);
  }
  return { value: 0, unit: 'g' };
}

function findRecommendedPack(recipeQtyBase: number, recipeUnit: string, commonPacks: string[]): string {
  if (commonPacks.length === 0) return '';

  const parsedPacks = commonPacks.map(p => ({
    original: p,
    ...parsePackSize(p),
  })).filter(p => p.unit === recipeUnit || 
    (recipeUnit === 'g' && p.unit === 'g') || 
    (recipeUnit === 'ml' && p.unit === 'ml')
  );

  if (parsedPacks.length === 0) return commonPacks[Math.floor(commonPacks.length / 2)];

  // Find smallest pack that covers recipe quantity
  parsedPacks.sort((a, b) => a.value - b.value);
  const covering = parsedPacks.find(p => p.value >= recipeQtyBase);
  if (covering) return covering.original;

  // If no single pack covers it, recommend the largest
  return parsedPacks[parsedPacks.length - 1].original;
}

function calculateLeftover(recipeQtyBase: number, recipeUnit: string, recommendedPack: string): string {
  const pack = parsePackSize(recommendedPack);
  if (pack.value <= recipeQtyBase || pack.unit !== recipeUnit) return '0';
  
  const leftover = pack.value - recipeQtyBase;
  if (recipeUnit === 'g') {
    return leftover >= 1000 ? `${(leftover / 1000).toFixed(1)}kg` : `${Math.round(leftover)}g`;
  }
  if (recipeUnit === 'ml') {
    return leftover >= 1000 ? `${(leftover / 1000).toFixed(1)}L` : `${Math.round(leftover)}ml`;
  }
  return `${Math.round(leftover)} ${recipeUnit}`;
}

function normalizeIngredient(
  ingredientName: string,
  recipeQty: string,
  packMappings: PackMapping[],
): NormalizedQuery {
  const cleanName = ingredientName.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '');

  // Find matching pack mapping
  const mapping = packMappings.find(m =>
    cleanName.includes(m.ingredient_name) ||
    m.substitute_names.some(s => cleanName.includes(s))
  );

  const parsed = parseQuantity(recipeQty);
  const baseQty = convertToBaseUnit(parsed.value, parsed.unit);

  let recommendedPack = '';
  let searchQueries: string[] = [];
  let preferredBrands: string[] = [];
  let category = 'Others';
  let substituteNames: string[] = [];

  if (mapping) {
    category = mapping.category;
    preferredBrands = mapping.preferred_brands;
    substituteNames = mapping.substitute_names;
    recommendedPack = findRecommendedPack(baseQty.value, baseQty.unit, mapping.common_pack_sizes);

    // Build search queries with brand + pack size combinations
    const packSizesToSearch = mapping.common_pack_sizes.filter(p => {
      const packBase = parsePackSize(p);
      return packBase.value >= baseQty.value * 0.8; // Packs within 80%+ of need
    }).slice(0, 3);

    if (packSizesToSearch.length === 0 && mapping.common_pack_sizes.length > 0) {
      packSizesToSearch.push(mapping.default_pack_size);
    }

    // Generate brand + size queries
    if (preferredBrands.length > 0) {
      preferredBrands.slice(0, 2).forEach(brand => {
        packSizesToSearch.forEach(size => {
          searchQueries.push(`${brand} ${mapping.ingredient_name} ${size}`);
        });
      });
    }

    // Generic queries
    packSizesToSearch.forEach(size => {
      searchQueries.push(`${mapping.ingredient_name} ${size}`);
    });

    // Fallback query
    searchQueries.push(`${mapping.ingredient_name} ${mapping.default_pack_size}`);
  } else {
    // No mapping found, generate basic queries
    recommendedPack = recipeQty;
    searchQueries = [cleanName, `${cleanName} pack`];
  }

  // Deduplicate
  searchQueries = [...new Set(searchQueries)].slice(0, 5);

  return {
    original_name: ingredientName,
    normalized_name: mapping?.ingredient_name || cleanName,
    recipe_qty: recipeQty,
    recipe_qty_value: baseQty.value,
    recipe_unit: baseQty.unit,
    search_queries: searchQueries,
    recommended_pack: recommendedPack || recipeQty,
    preferred_brands: preferredBrands,
    category,
    substitute_names: substituteNames,
  };
}

// ── Match Scoring ──

function calculateMatchScore(
  product: any,
  query: NormalizedQuery,
  providerName: string,
): number {
  let score = 0;
  const productTitle = (product.product_title || product.title || product.name || '').toLowerCase();
  const productBrand = (product.brand_name || product.brand || '').toLowerCase();
  const productPackSize = (product.pack_size || product.weight || '').toLowerCase();

  // 1. Ingredient name match (40%)
  const nameTerms = query.normalized_name.split(' ');
  const nameMatchCount = nameTerms.filter(term => productTitle.includes(term)).length;
  const nameScore = (nameMatchCount / Math.max(nameTerms.length, 1)) * 40;
  score += nameScore;

  // Also check substitute names
  if (nameScore < 20) {
    const subMatch = query.substitute_names.some(sub => productTitle.includes(sub.toLowerCase()));
    if (subMatch) score += 20;
  }

  // 2. Pack size match (25%)
  if (productPackSize && query.recommended_pack) {
    const productPack = parsePackSize(productPackSize);
    const recommendedPack = parsePackSize(query.recommended_pack);
    
    if (productPack.unit === recommendedPack.unit && recommendedPack.value > 0) {
      const ratio = productPack.value / recommendedPack.value;
      if (ratio >= 0.8 && ratio <= 1.2) score += 25; // Exact match
      else if (ratio >= 0.5 && ratio <= 2.0) score += 18; // Close match
      else if (ratio > 0) score += 8; // Some size available
    } else if (productPackSize) {
      score += 5; // Has pack size info
    }
  }

  // 3. Brand match (15%)
  if (query.preferred_brands.length > 0 && productBrand) {
    const brandMatch = query.preferred_brands.some(
      b => productBrand.includes(b.toLowerCase()) || productTitle.includes(b.toLowerCase())
    );
    if (brandMatch) score += 15;
    else score += 5; // Known brand but not preferred
  } else if (productBrand) {
    score += 8; // Has brand info
  }

  // 4. Category match (10%)
  const categoryKeywords: Record<string, string[]> = {
    'Dairy': ['dairy', 'milk', 'paneer', 'curd', 'butter', 'ghee', 'cheese'],
    'Vegetables': ['vegetable', 'fresh', 'organic'],
    'Grains & Staples': ['grain', 'flour', 'atta', 'rice', 'dal', 'lentil'],
    'Spices & Seasonings': ['spice', 'masala', 'powder'],
    'Oils & Fats': ['oil', 'cooking oil', 'refined'],
    'Protein': ['meat', 'chicken', 'fish', 'egg', 'protein'],
    'Fruits': ['fruit', 'fresh'],
  };
  
  const catKeywords = categoryKeywords[query.category] || [];
  if (catKeywords.some(kw => productTitle.includes(kw))) {
    score += 10;
  } else {
    score += 3; // Default category score
  }

  // 5. Provider availability (10%)
  if (product.availability !== false && product.price) {
    score += 10;
  } else if (product.price) {
    score += 5;
  }

  return Math.min(Math.round(score), 100);
}

// ── Scraping Functions ──

async function scrapeProviderPrice(
  searchQuery: string,
  provider: typeof PROVIDERS[number],
  pincode: string,
): Promise<any | null> {
  try {
    const fullQuery = `${searchQuery} ${provider.name} grocery ${pincode}`;

    const response = await fetch('https://api.brightdata.com/datasets/v3/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_id: 'gd_l1viktl72bvl7bjuj0',
        url: `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`,
        format: 'json',
      }),
    });

    if (!response.ok) {
      // Fallback to SERP API
      const serpResponse = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone: 'serp',
          url: `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`,
          format: 'json',
        }),
      });

      if (!serpResponse.ok) {
        console.error(`Bright Data SERP failed for ${provider.name}:`, await serpResponse.text());
        return null;
      }

      return await serpResponse.json();
    }

    return await response.json();
  } catch (err) {
    console.error(`Error scraping ${provider.name}:`, err);
    return null;
  }
}

function extractProductFromResponse(
  rawData: any,
  searchQuery: string,
  provider: typeof PROVIDERS[number],
  pincode: string,
): any[] {
  const products: any[] = [];

  // Handle array response
  const items = Array.isArray(rawData) ? rawData : (rawData?.organic || rawData?.shopping || rawData?.results || [rawData]);

  items.slice(0, 5).forEach((item: any) => {
    const title = item.title || item.name || item.product_title || '';
    const priceMatch = (item.price || item.title || item.description || '').toString().match(/₹?\s*(\d+(?:\.\d{2})?)/);
    const price = item.price ? parseFloat(item.price.toString().replace(/[₹,]/g, '')) : priceMatch ? parseFloat(priceMatch[1]) : null;

    products.push({
      product_id: item.product_id || item.id || null,
      product_title: title || searchQuery,
      brand_name: item.brand || extractBrand(title),
      pack_size: item.pack_size || item.weight || item.size || extractPackSize(title),
      price,
      mrp: item.mrp ? parseFloat(item.mrp.toString().replace(/[₹,]/g, '')) : (price ? Math.round(price * 1.15) : null),
      discount_price: item.discount_price || item.sale_price ? parseFloat((item.discount_price || item.sale_price).toString().replace(/[₹,]/g, '')) : price,
      availability: item.in_stock !== false && item.availability !== false,
      delivery_time: item.delivery_time || getEstimatedDelivery(provider.id),
      product_url: item.url || item.link || item.product_url || null,
      image_url: item.image || item.image_url || item.thumbnail || null,
      provider_name: provider.name,
      pincode,
      raw_response: item,
    });
  });

  return products;
}

function extractBrand(title: string): string | null {
  const knownBrands = [
    'Amul', 'Mother Dairy', 'Gowardhan', 'Milky Mist', 'Nestle',
    'Aashirvaad', 'Fortune', 'Pillsbury', 'Tata', 'Patanjali',
    'MDH', 'Everest', 'Catch', 'India Gate', 'Daawat',
    'Licious', 'FreshToHome', 'Britannia', 'Rajdhani',
    'Figaro', 'Borges', 'Parachute', 'Saffola', 'Sundrop',
  ];
  const lower = title.toLowerCase();
  const match = knownBrands.find(b => lower.includes(b.toLowerCase()));
  return match || null;
}

function extractPackSize(title: string): string | null {
  const match = title.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l|litre|liter|pcs|pc|piece)s?)/i);
  return match ? match[1] : null;
}

function getEstimatedDelivery(providerId: string): string {
  const estimates: Record<string, string> = {
    zepto: '10 min',
    blinkit: '10-15 min',
    bigbasket: '2-4 hrs',
    instamart: '15-30 min',
  };
  return estimates[providerId] || '30-60 min';
}

// Generate estimated products when scraping fails
function generateEstimatedProducts(query: NormalizedQuery, pincode: string): MatchedProduct[] {
  const basePrices: Record<string, number> = {
    paneer: 80, milk: 60, curd: 40, butter: 55, ghee: 250, cheese: 120,
    rice: 280, atta: 220, dal: 140, flour: 200, sugar: 45,
    oil: 180, onion: 40, tomato: 30, potato: 30, chicken: 200,
    egg: 90, fish: 250, bread: 45, salt: 25, turmeric: 40,
    cumin: 30, masala: 45,
  };

  let basePrice = 50;
  for (const [key, price] of Object.entries(basePrices)) {
    if (query.normalized_name.includes(key)) {
      basePrice = price;
      break;
    }
  }

  const leftover = calculateLeftover(query.recipe_qty_value, query.recipe_unit, query.recommended_pack);

  return PROVIDERS.map(provider => {
    const variance = 0.85 + Math.random() * 0.30;
    const providerPrice = Math.round(basePrice * variance);
    const brand = query.preferred_brands.length > 0
      ? query.preferred_brands[Math.floor(Math.random() * query.preferred_brands.length)]
      : null;

    return {
      product_id: null,
      query_name: query.normalized_name,
      original_ingredient: query.original_name,
      provider_name: provider.name,
      brand_name: brand,
      product_title: `${brand ? brand + ' ' : ''}${query.original_name} ${query.recommended_pack}`,
      pack_size: query.recommended_pack,
      price: providerPrice,
      mrp: Math.round(providerPrice * 1.15),
      discount_price: providerPrice,
      availability: Math.random() > 0.1,
      delivery_time: getEstimatedDelivery(provider.id),
      product_url: null,
      image_url: null,
      pincode,
      match_score: 75,
      recipe_qty: query.recipe_qty,
      recommended_buy_qty: query.recommended_pack,
      leftover,
      raw_response: { estimated: true },
    };
  });
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { items, pincode = '400001' } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load pack mappings from DB
    const { data: mappingsData } = await supabase
      .from('grocery_pack_mapping')
      .select('*');

    const packMappings: PackMapping[] = mappingsData || [];

    const results: Record<string, { normalized: NormalizedQuery; products: MatchedProduct[] }> = {};

    for (const item of items.slice(0, 20)) {
      const ingredientName = typeof item === 'string' ? item : item.name;
      const recipeQty = typeof item === 'string' ? '1 pack' : (item.qty || '1 pack');
      if (!ingredientName) continue;

      // Normalize the ingredient
      const normalized = normalizeIngredient(ingredientName, recipeQty, packMappings);

      // Check cache (30 min freshness)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('price_comparison')
        .select('*')
        .eq('query_name', normalized.normalized_name)
        .eq('pincode', pincode)
        .gte('last_updated', thirtyMinAgo);

      if (cached && cached.length >= 3) {
        // Recompute match scores on cached data
        const leftover = calculateLeftover(normalized.recipe_qty_value, normalized.recipe_unit, normalized.recommended_pack);
        const matchedProducts: MatchedProduct[] = cached.map((c: any) => ({
          ...c,
          original_ingredient: normalized.original_name,
          match_score: calculateMatchScore(c, normalized, c.provider_name),
          recipe_qty: normalized.recipe_qty,
          recommended_buy_qty: c.pack_size || normalized.recommended_pack,
          leftover,
        })).filter((p: MatchedProduct) => p.match_score >= 50); // Lower threshold for cached

        results[ingredientName] = { normalized, products: matchedProducts };
        continue;
      }

      // Scrape from Bright Data using normalized queries
      const allProducts: any[] = [];

      for (const provider of PROVIDERS) {
        // Use first 2 search queries per provider
        for (const searchQuery of normalized.search_queries.slice(0, 2)) {
          const rawData = await scrapeProviderPrice(searchQuery, provider, pincode);
          if (rawData) {
            const extracted = extractProductFromResponse(rawData, searchQuery, provider, pincode);
            allProducts.push(...extracted);
          }
        }
      }

      // Score all products
      const leftover = calculateLeftover(normalized.recipe_qty_value, normalized.recipe_unit, normalized.recommended_pack);

      let matchedProducts: MatchedProduct[] = allProducts.map(product => {
        const score = calculateMatchScore(product, normalized, product.provider_name);
        return {
          product_id: product.product_id,
          query_name: normalized.normalized_name,
          original_ingredient: normalized.original_name,
          provider_name: product.provider_name,
          brand_name: product.brand_name,
          product_title: product.product_title,
          pack_size: product.pack_size || normalized.recommended_pack,
          price: product.price,
          mrp: product.mrp,
          discount_price: product.discount_price,
          availability: product.availability,
          delivery_time: product.delivery_time,
          product_url: product.product_url,
          image_url: product.image_url,
          pincode,
          match_score: score,
          recipe_qty: normalized.recipe_qty,
          recommended_buy_qty: product.pack_size || normalized.recommended_pack,
          leftover,
          raw_response: product.raw_response,
        };
      });

      // Filter by 70% threshold, but keep at least estimated results
      matchedProducts = matchedProducts.filter(p => p.match_score >= 70);

      // Sort by match_score descending, then by price
      matchedProducts.sort((a, b) => {
        if (b.match_score !== a.match_score) return b.match_score - a.match_score;
        return (a.discount_price || a.price || Infinity) - (b.discount_price || b.price || Infinity);
      });

      // Keep best match per provider
      const bestPerProvider: Record<string, MatchedProduct> = {};
      matchedProducts.forEach(p => {
        if (!bestPerProvider[p.provider_name] || p.match_score > bestPerProvider[p.provider_name].match_score) {
          bestPerProvider[p.provider_name] = p;
        }
      });

      let finalProducts = Object.values(bestPerProvider);

      // If insufficient results, supplement with estimates
      if (finalProducts.length < 2) {
        const estimated = generateEstimatedProducts(normalized, pincode);
        const existingProviders = new Set(finalProducts.map(p => p.provider_name));
        estimated.forEach(est => {
          if (!existingProviders.has(est.provider_name)) {
            finalProducts.push(est);
          }
        });
      }

      // Add Local Kirana estimate
      const avgPrice = finalProducts.length > 0
        ? Math.round(finalProducts.reduce((s, r) => s + (r.price || 0), 0) / finalProducts.length * 0.95)
        : Math.round(50 + Math.random() * 50);

      finalProducts.push({
        product_id: null,
        query_name: normalized.normalized_name,
        original_ingredient: normalized.original_name,
        provider_name: 'Local Kirana',
        brand_name: null,
        product_title: `${normalized.original_name} ${normalized.recommended_pack}`,
        pack_size: normalized.recommended_pack,
        price: avgPrice,
        mrp: Math.round(avgPrice * 1.1),
        discount_price: avgPrice,
        availability: true,
        delivery_time: '30-60 min',
        product_url: null,
        image_url: null,
        pincode,
        match_score: 72,
        recipe_qty: normalized.recipe_qty,
        recommended_buy_qty: normalized.recommended_pack,
        leftover,
        raw_response: { estimated: true, source: 'local_kirana' },
      });

      // Save to database
      const upsertData = finalProducts.map(p => ({
        product_id: p.product_id,
        query_name: normalized.normalized_name,
        provider_name: p.provider_name,
        brand_name: p.brand_name,
        product_title: p.product_title,
        pack_size: p.pack_size,
        price: p.price,
        mrp: p.mrp,
        discount_price: p.discount_price,
        availability: p.availability,
        delivery_time: p.delivery_time,
        product_url: p.product_url,
        image_url: p.image_url,
        pincode,
        last_updated: new Date().toISOString(),
        raw_response: p.raw_response,
      }));

      await supabase
        .from('price_comparison')
        .delete()
        .eq('query_name', normalized.normalized_name)
        .eq('pincode', pincode);

      const { error: insertErr } = await supabase
        .from('price_comparison')
        .insert(upsertData);

      if (insertErr) console.error('Insert error:', insertErr);

      results[ingredientName] = { normalized, products: finalProducts };
    }

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Grocery price scraper error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
