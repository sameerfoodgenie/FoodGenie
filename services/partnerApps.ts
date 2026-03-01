import { Linking, Platform } from 'react-native';
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export interface PartnerApp {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  color: string;
  deepLink: string;
  webUrl: string;
  appScheme: string;
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
  // Default: Swiggy, Zomato on top, then ONDC, then rest
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
    // Fallback to web
    await Linking.openURL(app.webUrl);
    return true;
  } catch {
    // Final fallback
    try {
      await Linking.openURL(app.webUrl);
      return true;
    } catch {
      return false;
    }
  }
}

// ---- Supabase partner preference operations ----

export async function savePartnerPreference(
  userId: string,
  partnerId: string | null
): Promise<{ error: string | null }> {
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
  // First load current count
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
