import { Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getSupabaseClient } from '@/template';

function getClient() {
  return getSupabaseClient();
}

export interface PartnerApp {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  color: string;
  deepLink: string;
  webUrl: string;
  appScheme: string;
  searchDeepLink: (query: string) => string;
  searchWebUrl: (query: string) => string;
  available: boolean;
}

export const partnerApps: PartnerApp[] = [
  {
    id: 'swiggy',
    name: 'Swiggy',
    description: 'Fast delivery from top restaurants near you',
    iconEmoji: '🟠',
    color: '#FC8019',
    deepLink: 'swiggy://',
    webUrl: 'https://www.swiggy.com',
    appScheme: 'swiggy',
    searchDeepLink: (q: string) => `swiggy://search?query=${encodeURIComponent(q)}`,
    searchWebUrl: (q: string) => `https://www.swiggy.com/search?query=${encodeURIComponent(q)}`,
    available: true,
  },
  {
    id: 'zomato',
    name: 'Zomato',
    description: 'Discover and order from restaurants you love',
    iconEmoji: '🔴',
    color: '#E23744',
    deepLink: 'zomato://',
    webUrl: 'https://www.zomato.com',
    appScheme: 'zomato',
    searchDeepLink: (q: string) => `zomato://search?q=${encodeURIComponent(q)}`,
    searchWebUrl: (q: string) => `https://www.zomato.com/search?q=${encodeURIComponent(q)}`,
    available: true,
  },
  {
    id: 'ondc',
    name: 'ONDC-enabled Apps',
    description: 'Open network apps — fair prices, no platform lock-in',
    iconEmoji: '🌐',
    color: '#2563EB',
    deepLink: 'magicpin://',
    webUrl: 'https://ondc.org',
    appScheme: 'magicpin',
    searchDeepLink: (q: string) => `magicpin://search?query=${encodeURIComponent(q)}`,
    searchWebUrl: (q: string) => `https://magicpin.in/search/?q=${encodeURIComponent(q)}`,
    available: true,
  },
  {
    id: 'zepto',
    name: 'Zepto',
    description: 'Cafe and food delivery in select cities',
    iconEmoji: '⚡',
    color: '#7B2FF7',
    deepLink: 'zepto://',
    webUrl: 'https://www.zeptonow.com',
    appScheme: 'zepto',
    searchDeepLink: (q: string) => `zepto://search?query=${encodeURIComponent(q)}`,
    searchWebUrl: (q: string) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
    available: true,
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    description: 'Quick commerce food and groceries in minutes',
    iconEmoji: '💛',
    color: '#F7C948',
    deepLink: 'blinkit://',
    webUrl: 'https://blinkit.com',
    appScheme: 'blinkit',
    searchDeepLink: (q: string) => `blinkit://search?q=${encodeURIComponent(q)}`,
    searchWebUrl: (q: string) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
    available: true,
  },
  {
    id: 'bigbasket',
    name: 'BigBasket / BB Now',
    description: 'Groceries and fresh food delivered to your door',
    iconEmoji: '🟢',
    color: '#84C225',
    deepLink: 'bigbasket://',
    webUrl: 'https://www.bigbasket.com',
    appScheme: 'bigbasket',
    searchDeepLink: (q: string) => `bigbasket://search?q=${encodeURIComponent(q)}`,
    searchWebUrl: (q: string) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
    available: true,
  },
];

export function getPartnerById(id: string): PartnerApp | undefined {
  return partnerApps.find(app => app.id === id);
}

export function getSortedPartners(preferredId: string | null): PartnerApp[] {
  if (preferredId) {
    const preferred = partnerApps.find(a => a.id === preferredId);
    const rest = partnerApps.filter(a => a.id !== preferredId);
    return preferred ? [preferred, ...rest] : partnerApps;
  }
  const priority = ['swiggy', 'zomato', 'ondc'];
  return [...partnerApps].sort((a, b) => {
    const aIdx = priority.indexOf(a.id);
    const bIdx = priority.indexOf(b.id);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });
}

export async function openPartnerApp(app: PartnerApp): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      const canOpen = await Linking.canOpenURL(app.deepLink);
      if (canOpen) {
        await Linking.openURL(app.deepLink);
        return true;
      }
    }
    await Linking.openURL(app.webUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(app.webUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Open partner app with a search query for a specific restaurant + dish.
 * Tries: deep link search → web search fallback.
 */
export async function openPartnerWithSearch(
  app: PartnerApp,
  restaurantName: string,
  dishName?: string,
): Promise<boolean> {
  const query = dishName ? `${restaurantName} ${dishName}` : restaurantName;

  try {
    if (Platform.OS !== 'web') {
      const searchLink = app.searchDeepLink(query);
      const canOpen = await Linking.canOpenURL(app.deepLink);
      if (canOpen) {
        await Linking.openURL(searchLink);
        return true;
      }
    }
    await Linking.openURL(app.searchWebUrl(query));
    return true;
  } catch {
    try {
      await Linking.openURL(app.searchWebUrl(query));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Copy dish and restaurant info to clipboard for easy pasting.
 */
export async function copyDishInfo(
  restaurantName: string,
  dishName: string,
  price?: number,
): Promise<void> {
  const parts = [`${dishName} from ${restaurantName}`];
  if (price) {
    parts.push(`Approx. price: Rs.${price}`);
  }
  await Clipboard.setStringAsync(parts.join('\n'));
}

// ---- Supabase partner preference operations ----

export async function savePartnerPreference(
  userId: string,
  partnerId: string | null
): Promise<{ error: string | null }> {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        preferred_partner_app: partnerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  return { error: error?.message || null };
}

export async function recordPartnerRedirect(
  userId: string,
  partnerId: string
): Promise<{ error: string | null }> {
  const supabase = getClient();
  const { data } = await supabase
    .from('user_preferences')
    .select('partner_redirect_count')
    .eq('user_id', userId)
    .single();

  const currentCount = data?.partner_redirect_count || 0;

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        last_partner_used: partnerId,
        partner_redirect_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  return { error: error?.message || null };
}
