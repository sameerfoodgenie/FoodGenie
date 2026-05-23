import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const BRIGHT_DATA_API_KEY = Deno.env.get('BRIGHT_DATA_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Provider configurations for Bright Data scraping
const PROVIDERS = [
  { id: 'zepto', name: 'Zepto', domain: 'zeptonow.com' },
  { id: 'blinkit', name: 'Blinkit', domain: 'blinkit.com' },
  { id: 'bigbasket', name: 'BigBasket', domain: 'bigbasket.com' },
  { id: 'instamart', name: 'Instamart', domain: 'swiggy.com/instamart' },
];

interface PriceResult {
  product_id: string | null;
  query_name: string;
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
  raw_response: any;
}

// Scrape prices from Bright Data Web Scraper API
async function scrapeProviderPrice(
  queryName: string,
  provider: typeof PROVIDERS[number],
  pincode: string,
): Promise<PriceResult | null> {
  try {
    // Use Bright Data SERP/Web Scraper API
    const searchQuery = `${queryName} grocery ${provider.name}`;
    
    const response = await fetch('https://api.brightdata.com/datasets/v3/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_id: 'gd_l1viktl72bvl7bjuj0', // Web scraper dataset
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' price ' + pincode)}`,
        format: 'json',
      }),
    });

    if (!response.ok) {
      // Fallback: Use SERP API for price discovery
      const serpResponse = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone: 'serp',
          url: `https://www.google.com/search?q=${encodeURIComponent(`${queryName} price ${provider.name} ${pincode}`)}`,
          format: 'json',
        }),
      });

      if (!serpResponse.ok) {
        console.error(`Bright Data SERP failed for ${provider.name}:`, await serpResponse.text());
        return null;
      }

      const serpData = await serpResponse.json();
      return parseSerpResult(serpData, queryName, provider, pincode);
    }

    const data = await response.json();
    return parseScrapedResult(data, queryName, provider, pincode);
  } catch (err) {
    console.error(`Error scraping ${provider.name} for ${queryName}:`, err);
    return null;
  }
}

function parseSerpResult(data: any, queryName: string, provider: typeof PROVIDERS[number], pincode: string): PriceResult {
  // Extract price from SERP shopping results or organic results
  const results = data?.organic || data?.shopping || [];
  const relevant = results.find((r: any) =>
    r.title?.toLowerCase().includes(queryName.toLowerCase()) ||
    r.description?.toLowerCase().includes(provider.name.toLowerCase())
  );

  let price: number | null = null;
  let productTitle: string | null = null;
  let productUrl: string | null = null;

  if (relevant) {
    productTitle = relevant.title || null;
    productUrl = relevant.link || relevant.url || null;
    // Extract price from title or snippet
    const priceMatch = (relevant.price || relevant.title || relevant.description || '').match(/₹\s*(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }
  }

  return {
    product_id: null,
    query_name: queryName,
    provider_name: provider.name,
    brand_name: null,
    product_title: productTitle,
    pack_size: null,
    price,
    mrp: null,
    discount_price: price,
    availability: price !== null,
    delivery_time: getEstimatedDelivery(provider.id),
    product_url: productUrl,
    image_url: null,
    pincode,
    raw_response: data,
  };
}

function parseScrapedResult(data: any, queryName: string, provider: typeof PROVIDERS[number], pincode: string): PriceResult {
  // Parse direct scraping result
  const item = Array.isArray(data) ? data[0] : data;

  return {
    product_id: item?.product_id || item?.id || null,
    query_name: queryName,
    provider_name: provider.name,
    brand_name: item?.brand || null,
    product_title: item?.title || item?.name || queryName,
    pack_size: item?.pack_size || item?.weight || null,
    price: item?.price ? parseFloat(item.price) : null,
    mrp: item?.mrp ? parseFloat(item.mrp) : null,
    discount_price: item?.discount_price || item?.sale_price ? parseFloat(item.discount_price || item.sale_price) : null,
    availability: item?.in_stock !== false && item?.availability !== false,
    delivery_time: item?.delivery_time || getEstimatedDelivery(provider.id),
    product_url: item?.url || item?.product_url || null,
    image_url: item?.image || item?.image_url || null,
    pincode,
    raw_response: item,
  };
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

// Generate estimated prices when Bright Data is unavailable or for Local Kirana
function generateEstimatedPrice(queryName: string, pincode: string): PriceResult[] {
  const basePrices: Record<string, number> = {
    rice: 280, wheat: 220, atta: 220, flour: 200, oil: 180, milk: 60,
    curd: 40, paneer: 80, butter: 55, ghee: 250, chicken: 200, egg: 90,
    fish: 250, mutton: 400, dal: 140, onion: 40, tomato: 30, potato: 30,
    sugar: 45, salt: 25, turmeric: 20, cumin: 30, masala: 45,
  };

  let basePrice = 50;
  const lower = queryName.toLowerCase();
  for (const [key, price] of Object.entries(basePrices)) {
    if (lower.includes(key)) {
      basePrice = price;
      break;
    }
  }

  // Generate varied prices per provider
  return PROVIDERS.map(provider => {
    const variance = 0.85 + Math.random() * 0.30; // ±15% variance
    const providerPrice = Math.round(basePrice * variance);
    const mrp = Math.round(providerPrice * 1.15);
    
    return {
      product_id: null,
      query_name: queryName,
      provider_name: provider.name,
      brand_name: null,
      product_title: queryName,
      pack_size: null,
      price: providerPrice,
      mrp,
      discount_price: providerPrice,
      availability: Math.random() > 0.1, // 90% availability
      delivery_time: getEstimatedDelivery(provider.id),
      product_url: null,
      image_url: null,
      pincode,
      raw_response: { estimated: true },
    };
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    const results: Record<string, PriceResult[]> = {};

    for (const item of items.slice(0, 20)) { // Limit to 20 items per request
      const queryName = typeof item === 'string' ? item : item.name;
      if (!queryName) continue;

      // Check if fresh prices exist in DB (less than 30 minutes old)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('price_comparison')
        .select('*')
        .eq('query_name', queryName.toLowerCase())
        .eq('pincode', pincode)
        .gte('last_updated', thirtyMinAgo);

      if (cached && cached.length >= 3) {
        // Use cached results
        results[queryName] = cached;
        continue;
      }

      // Scrape fresh prices from Bright Data
      const pricePromises = PROVIDERS.map(provider =>
        scrapeProviderPrice(queryName, provider, pincode)
      );

      const scrapeResults = await Promise.allSettled(pricePromises);
      const validResults: PriceResult[] = [];

      scrapeResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value && result.value.price !== null) {
          validResults.push(result.value);
        }
      });

      // If scraping returned insufficient results, supplement with estimates
      if (validResults.length < 2) {
        const estimated = generateEstimatedPrice(queryName, pincode);
        // Merge: keep scraped where available, fill gaps with estimates
        const existingProviders = new Set(validResults.map(r => r.provider_name));
        estimated.forEach(est => {
          if (!existingProviders.has(est.provider_name)) {
            validResults.push(est);
          }
        });
      }

      // Add Local Kirana estimate
      const kiranaBasePrice = validResults.length > 0
        ? Math.round(validResults.reduce((s, r) => s + (r.price || 0), 0) / validResults.length * 0.95)
        : Math.round(50 + Math.random() * 50);

      validResults.push({
        product_id: null,
        query_name: queryName,
        provider_name: 'Local Kirana',
        brand_name: null,
        product_title: queryName,
        pack_size: null,
        price: kiranaBasePrice,
        mrp: Math.round(kiranaBasePrice * 1.1),
        discount_price: kiranaBasePrice,
        availability: true,
        delivery_time: '30-60 min',
        product_url: null,
        image_url: null,
        pincode,
        raw_response: { estimated: true, source: 'local_kirana' },
      });

      // Upsert results to database
      const upsertData = validResults.map(r => ({
        ...r,
        query_name: queryName.toLowerCase(),
        last_updated: new Date().toISOString(),
      }));

      // Delete old entries for this item+pincode combination
      await supabase
        .from('price_comparison')
        .delete()
        .eq('query_name', queryName.toLowerCase())
        .eq('pincode', pincode);

      // Insert fresh data
      const { error: insertErr } = await supabase
        .from('price_comparison')
        .insert(upsertData);

      if (insertErr) {
        console.error('Insert error:', insertErr);
      }

      results[queryName] = validResults;
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
