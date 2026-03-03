// FoodGenie Reward & Share Tracking Service
import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';

function getClient() {
  return getSupabaseClient();
}

// Generate a unique session ID for guest tracking
let _sessionId: string | null = null;
export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
  return _sessionId;
}

// ── Share Event Tracking ──

export async function trackShareEvent(
  userId: string | null,
  shareType: 'vibe' | 'snap' = 'vibe',
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getClient();
    const sessionId = getSessionId();

    const { error } = await supabase.from('share_events').insert({
      user_id: userId || null,
      session_id: sessionId,
      share_type: shareType,
    });

    if (error) {
      console.log('Track share event error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.log('Track share event exception:', e?.message);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

// ── Reward Management ──

export interface UserReward {
  id: string;
  user_id: string;
  reward_type: string;
  reward_value: Record<string, any>;
  is_claimed: boolean;
  created_at: string;
  expires_at: string | null;
}

export async function claimReward(
  userId: string,
  rewardType: string,
  rewardValue: Record<string, any> = {},
  expiresInDays?: number,
): Promise<{ success: boolean; reward?: UserReward; error?: string }> {
  try {
    const supabase = getClient();

    // Check if reward of this type already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('user_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_type', rewardType)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing to claimed
      const { data, error } = await supabase
        .from('user_rewards')
        .update({ is_claimed: true, reward_value: rewardValue })
        .eq('id', existing[0].id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, reward: data as UserReward };
    }

    // Create new reward
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('user_rewards')
      .insert({
        user_id: userId,
        reward_type: rewardType,
        reward_value: rewardValue,
        is_claimed: true,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, reward: data as UserReward };
  } catch (e: any) {
    console.log('Claim reward exception:', e?.message);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function getUserRewards(userId: string): Promise<UserReward[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Get rewards error:', error.message);
      return [];
    }
    return (data || []) as UserReward[];
  } catch {
    return [];
  }
}

// ── Share Stats ──

export interface ShareStats {
  dailyCount: number;
  lifetimeCount: number;
}

export async function getShareStats(userId: string): Promise<ShareStats> {
  try {
    const supabase = getClient();

    // Lifetime count
    const { count: lifetimeCount } = await supabase
      .from('share_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Daily count (today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: dailyCount } = await supabase
      .from('share_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    return {
      dailyCount: dailyCount || 0,
      lifetimeCount: lifetimeCount || 0,
    };
  } catch {
    return { dailyCount: 0, lifetimeCount: 0 };
  }
}

// ── Link Guest Shares to User After Login ──

export async function linkGuestSharesToUser(userId: string): Promise<void> {
  try {
    const supabase = getClient();
    const sessionId = getSessionId();

    // Update share_events that have our session but no user
    await supabase
      .from('share_events')
      .update({ user_id: userId })
      .eq('session_id', sessionId)
      .is('user_id', null);
  } catch (e) {
    console.log('Link guest shares error:', e);
  }
}
