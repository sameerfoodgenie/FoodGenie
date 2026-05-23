import { getSupabaseClient } from '@/template';

export interface PriceEntry {
  id: string;
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
  last_updated: string;
  raw_response: any;
}

export interface PriceComparison {
  itemName: string;
  prices: PriceEntry[];
  bestPrice: PriceEntry | null;
  fastestDelivery: PriceEntry | null;
  lastUpdated: string | null;
  isEstimated: boolean;
}

// Fetch price comparisons for grocery items
export async function fetchPriceComparisons(
  items: string[],
  pincode: string = '400001',
): Promise<{ data: Record<string, PriceComparison> | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();

    // Call the Edge Function to scrape/retrieve prices
    const { data, error } = await supabase.functions.invoke('grocery-price-scraper', {
      body: { items, pincode },
    });

    if (error) {
      // Try to get detailed error
      let errorMessage = error.message || 'Failed to fetch prices';
      try {
        if (error.context) {
          const text = await error.context.text();
          if (text) errorMessage = text;
        }
      } catch {}
      console.error('Price comparison error:', errorMessage);
      return { data: null, error: errorMessage };
    }

    if (!data?.success || !data?.data) {
      return { data: null, error: 'No price data returned' };
    }

    // Process results into PriceComparison format
    const comparisons: Record<string, PriceComparison> = {};

    for (const [itemName, prices] of Object.entries(data.data as Record<string, PriceEntry[]>)) {
      const validPrices = (prices || []).filter((p: PriceEntry) => p.price !== null && p.availability);
      const allPrices = prices || [];

      // Find best price
      const bestPrice = validPrices.length > 0
        ? validPrices.reduce((best: PriceEntry, curr: PriceEntry) =>
            (curr.discount_price || curr.price || Infinity) < (best.discount_price || best.price || Infinity) ? curr : best
          )
        : null;

      // Find fastest delivery
      const deliveryOrder = ['10 min', '10-15 min', '15-30 min', '30-60 min', '2-4 hrs'];
      const fastestDelivery = validPrices.length > 0
        ? validPrices.reduce((fastest: PriceEntry, curr: PriceEntry) => {
            const currIdx = deliveryOrder.findIndex(d => d === curr.delivery_time);
            const fastIdx = deliveryOrder.findIndex(d => d === fastest.delivery_time);
            return (currIdx !== -1 && (fastIdx === -1 || currIdx < fastIdx)) ? curr : fastest;
          })
        : null;

      // Check if results are estimated
      const isEstimated = allPrices.every((p: PriceEntry) =>
        p.raw_response?.estimated === true
      );

      comparisons[itemName] = {
        itemName,
        prices: allPrices,
        bestPrice,
        fastestDelivery,
        lastUpdated: allPrices[0]?.last_updated || null,
        isEstimated,
      };
    }

    return { data: comparisons, error: null };
  } catch (err: any) {
    console.error('Price comparison service error:', err);
    return { data: null, error: err.message || 'Failed to fetch prices' };
  }
}

// Get cached prices from database directly (faster, no Edge Function call)
export async function getCachedPrices(
  items: string[],
  pincode: string = '400001',
): Promise<{ data: Record<string, PriceEntry[]> | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('price_comparison')
      .select('*')
      .in('query_name', items.map(i => i.toLowerCase()))
      .eq('pincode', pincode)
      .order('last_updated', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    // Group by query_name
    const grouped: Record<string, PriceEntry[]> = {};
    (data || []).forEach((entry: PriceEntry) => {
      const key = entry.query_name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    return { data: grouped, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// Check if prices need refresh (older than 30 minutes)
export function needsRefresh(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const updated = new Date(lastUpdated).getTime();
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  return updated < thirtyMinAgo;
}

// Provider metadata for UI
export const PROVIDER_META: Record<string, { emoji: string; color: string; tagline: string }> = {
  'Zepto': { emoji: '⚡', color: '#7B2D8E', tagline: '10 min delivery' },
  'Blinkit': { emoji: '🟡', color: '#F8CB2E', tagline: '10-15 min delivery' },
  'BigBasket': { emoji: '🟢', color: '#84C225', tagline: '2-4 hrs delivery' },
  'Instamart': { emoji: '🟠', color: '#FC8019', tagline: '15-30 min delivery' },
  'Local Kirana': { emoji: '🏪', color: '#FF8C42', tagline: 'Neighborhood store' },
};
