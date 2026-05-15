import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// ─── Types ───
export interface CoinWallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  meta: Record<string, any>;
  created_at: string;
}

export interface DailyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  max_streak: number;
  last_login_date: string | null;
  daily_likes_count: number;
  daily_likes_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoinReferral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_earned: number;
  balance: number;
  rank: number;
}

// ─── Earning rules ───
export const COIN_RULES = {
  post_food: { amount: 20, label: 'Posted a meal', icon: '📸' },
  share_post: { amount: 10, label: 'Shared a post', icon: '📤' },
  like_post: { amount: 1, label: 'Liked a post', icon: '❤️' },
  watch_reel: { amount: 2, label: 'Watched a reel', icon: '👀' },
  follow_creator: { amount: 5, label: 'Followed a creator', icon: '👤' },
  daily_login: { amount: 5, label: 'Daily login bonus', icon: '📅' },
  refer_user: { amount: 50, label: 'Referred a friend', icon: '🔗' },
  referral_signup: { amount: 100, label: 'Referral joined', icon: '🎉' },
  streak_bonus_3: { amount: 10, label: '3-day streak bonus', icon: '🔥' },
  streak_bonus_7: { amount: 25, label: '7-day streak bonus', icon: '🔥' },
  streak_bonus_14: { amount: 50, label: '14-day streak bonus', icon: '🔥' },
  streak_bonus_30: { amount: 100, label: '30-day streak bonus', icon: '🔥' },
  meal_plan_generated: { amount: 10, label: 'Generated meal plan', icon: '🍽️' },
  ai_chat_plan: { amount: 5, label: 'AI meal chat plan', icon: '🧠' },
  cook_booked: { amount: 15, label: 'Booked a cook', icon: '👨‍🍳' },
} as const;

export const MAX_DAILY_LIKES = 20;

// ─── Redeem categories ───
export const REDEEM_CATEGORIES = [
  {
    id: 'vouchers',
    title: 'Food Vouchers',
    icon: '🎟️',
    color: '#FFD700',
    items: [
      { id: 'v1', name: '₹50 Swiggy Voucher', coins: 500, desc: 'Valid for 30 days', image: '🛵' },
      { id: 'v2', name: '₹100 Zomato Voucher', coins: 1000, desc: 'Valid for 30 days', image: '🍽' },
      { id: 'v3', name: '₹250 Dineout Voucher', coins: 2500, desc: 'Valid for 60 days', image: '🏪' },
    ],
  },
  {
    id: 'recipe_videos',
    title: 'Recipe Video Access',
    icon: '🎬',
    color: '#818CF8',
    items: [
      { id: 'rv1', name: 'Unlock Breakfast Recipe', coins: 20, desc: 'Full breakfast recipe from master chef', image: '☀️' },
      { id: 'rv2', name: 'Unlock Lunch Recipe', coins: 30, desc: 'Full lunch recipe from master chef', image: '🍽️' },
      { id: 'rv3', name: 'Unlock Snack Recipe', coins: 15, desc: 'Full snack recipe from master chef', image: '🍿' },
      { id: 'rv4', name: 'Unlock Dinner Recipe', coins: 30, desc: 'Full dinner recipe from master chef', image: '🌙' },
    ],
  },
  {
    id: 'cook_discounts',
    title: 'Cook Booking Discounts',
    icon: '👨‍🍳',
    color: '#FF6B6B',
    items: [
      { id: 'cd1', name: '10% Cook Booking Discount', coins: 200, desc: 'Valid for one booking', image: '🏷️' },
      { id: 'cd2', name: '25% Off Weekly Booking', coins: 500, desc: 'Weekly cook plan discount', image: '📅' },
      { id: 'cd3', name: 'Free Trial Meal', coins: 100, desc: 'One free meal from any cook', image: '🍽' },
    ],
  },
  {
    id: 'grocery_coupons',
    title: 'Grocery Coupons',
    icon: '🛒',
    color: '#4ADE80',
    items: [
      { id: 'gc1', name: '₹100 Off Grocery Order', coins: 300, desc: 'Min order ₹500 on any partner', image: '🛍️' },
      { id: 'gc2', name: 'Free Delivery Coupon', coins: 150, desc: 'Zepto/Blinkit/BigBasket', image: '🚚' },
      { id: 'gc3', name: '₹250 Off Monthly Grocery', coins: 800, desc: 'Valid on orders above ₹2000', image: '💰' },
    ],
  },
  {
    id: 'live',
    title: 'Live Show Access',
    icon: '📺',
    color: '#FB923C',
    items: [
      { id: 'l1', name: 'Live Cooking Session', coins: 200, desc: 'Access one live session', image: '👨‍🍳' },
      { id: 'l2', name: 'VIP Live Pass (Week)', coins: 500, desc: 'All live sessions for 7 days', image: '⭐' },
      { id: 'l3', name: 'Monthly Live Pass', coins: 1500, desc: 'Unlimited live access', image: '🎬' },
    ],
  },
  {
    id: 'merch',
    title: 'Merchandise',
    icon: '🎁',
    color: '#A855F7',
    items: [
      { id: 'm1', name: 'FoodGenie Sticker Pack', coins: 100, desc: 'Digital sticker pack', image: '✨' },
      { id: 'm2', name: 'FoodGenie Apron', coins: 3000, desc: 'Premium cotton apron', image: '👨‍🍳' },
      { id: 'm3', name: 'Recipe Book', coins: 5000, desc: 'Top 100 creator recipes', image: '📖' },
    ],
  },
];

// ─── Service Functions ───

export async function getWallet(userId: string): Promise<{ data: CoinWallet | null; error: string | null }> {
  const { data, error } = await supabase
    .from('coin_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function ensureWallet(userId: string): Promise<{ data: CoinWallet | null; error: string | null }> {
  const existing = await getWallet(userId);
  if (existing.data) return existing;

  const { data, error } = await supabase
    .from('coin_wallets')
    .insert({ user_id: userId, balance: 0, total_earned: 0, total_spent: 0 })
    .select()
    .single();

  if (error) {
    // Race condition: wallet might have been created between check and insert
    if (error.code === '23505') return getWallet(userId);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function earnCoins(
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, any> = {},
): Promise<{ success: boolean; error: string | null }> {
  // Insert transaction
  const { error: txError } = await supabase
    .from('coin_transactions')
    .insert({ user_id: userId, type: 'earn', amount, reason, meta });

  if (txError) return { success: false, error: txError.message };

  // Update wallet
  const wallet = await ensureWallet(userId);
  if (!wallet.data) return { success: false, error: 'Failed to get wallet' };

  const { error: updateError } = await supabase
    .from('coin_wallets')
    .update({
      balance: wallet.data.balance + amount,
      total_earned: wallet.data.total_earned + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true, error: null };
}

export async function spendCoins(
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, any> = {},
): Promise<{ success: boolean; error: string | null }> {
  const wallet = await getWallet(userId);
  if (!wallet.data) return { success: false, error: 'Wallet not found' };
  if (wallet.data.balance < amount) return { success: false, error: 'Insufficient coins' };

  // Insert transaction
  const { error: txError } = await supabase
    .from('coin_transactions')
    .insert({ user_id: userId, type: 'spend', amount, reason, meta });

  if (txError) return { success: false, error: txError.message };

  // Update wallet
  const { error: updateError } = await supabase
    .from('coin_wallets')
    .update({
      balance: wallet.data.balance - amount,
      total_spent: wallet.data.total_spent + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true, error: null };
}

export async function getTransactions(
  userId: string,
  type?: 'earn' | 'spend',
  limit = 50,
): Promise<{ data: CoinTransaction[]; error: string | null }> {
  let query = supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: data || [], error: null };
}

// ─── Streak ───

export async function getStreak(userId: string): Promise<{ data: DailyStreak | null; error: string | null }> {
  const { data, error } = await supabase
    .from('coin_daily_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function ensureStreak(userId: string): Promise<{ data: DailyStreak | null; error: string | null }> {
  const existing = await getStreak(userId);
  if (existing.data) return existing;

  const { data, error } = await supabase
    .from('coin_daily_streaks')
    .insert({ user_id: userId, current_streak: 0, max_streak: 0, daily_likes_count: 0 })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return getStreak(userId);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function checkAndRecordDailyLogin(userId: string): Promise<{
  isNewDay: boolean;
  streakBonusAmount: number;
  newStreak: number;
  error: string | null;
}> {
  const streakResult = await ensureStreak(userId);
  if (!streakResult.data) return { isNewDay: false, streakBonusAmount: 0, newStreak: 0, error: streakResult.error };

  const streak = streakResult.data;
  const today = new Date().toISOString().split('T')[0];

  if (streak.last_login_date === today) {
    return { isNewDay: false, streakBonusAmount: 0, newStreak: streak.current_streak, error: null };
  }

  // Check if yesterday was last login
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (streak.last_login_date === yesterdayStr) {
    newStreak = streak.current_streak + 1;
  } else {
    newStreak = 1; // Reset streak
  }

  const maxStreak = Math.max(newStreak, streak.max_streak);

  // Update streak
  await supabase
    .from('coin_daily_streaks')
    .update({
      current_streak: newStreak,
      max_streak: maxStreak,
      last_login_date: today,
      daily_likes_count: 0, // Reset daily likes
      daily_likes_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Award daily login coins
  await earnCoins(userId, COIN_RULES.daily_login.amount, 'daily_login');

  // Check streak bonuses
  let streakBonusAmount = 0;
  if (newStreak === 3) streakBonusAmount = COIN_RULES.streak_bonus_3.amount;
  else if (newStreak === 7) streakBonusAmount = COIN_RULES.streak_bonus_7.amount;
  else if (newStreak === 14) streakBonusAmount = COIN_RULES.streak_bonus_14.amount;
  else if (newStreak === 30) streakBonusAmount = COIN_RULES.streak_bonus_30.amount;

  if (streakBonusAmount > 0) {
    await earnCoins(userId, streakBonusAmount, `streak_bonus_${newStreak}`, { streak: newStreak });
  }

  return { isNewDay: true, streakBonusAmount, newStreak, error: null };
}

export async function checkDailyLikeLimit(userId: string): Promise<{ canLike: boolean; count: number }> {
  const streakResult = await getStreak(userId);
  if (!streakResult.data) return { canLike: true, count: 0 };

  const today = new Date().toISOString().split('T')[0];
  if (streakResult.data.daily_likes_date !== today) {
    return { canLike: true, count: 0 };
  }

  return {
    canLike: streakResult.data.daily_likes_count < MAX_DAILY_LIKES,
    count: streakResult.data.daily_likes_count,
  };
}

export async function incrementDailyLikeCount(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const streakResult = await getStreak(userId);
  if (!streakResult.data) return;

  const currentCount = streakResult.data.daily_likes_date === today
    ? streakResult.data.daily_likes_count
    : 0;

  await supabase
    .from('coin_daily_streaks')
    .update({
      daily_likes_count: currentCount + 1,
      daily_likes_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

// ─── Referrals ───

export async function generateReferralCode(userId: string): Promise<{ code: string | null; error: string | null }> {
  // Check if user already has a referral code
  const { data: existing } = await supabase
    .from('coin_referrals')
    .select('referral_code')
    .eq('referrer_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing?.referral_code) return { code: existing.referral_code, error: null };

  // Generate unique code
  const code = `FG${userId.slice(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

  const { error } = await supabase
    .from('coin_referrals')
    .insert({ referrer_id: userId, referral_code: code, status: 'pending' });

  if (error) return { code: null, error: error.message };
  return { code, error: null };
}

export async function getReferralCode(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('coin_referrals')
    .select('referral_code')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.referral_code || null;
}

// ─── Leaderboard ───

export async function getLeaderboard(limit = 20): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const { data: wallets, error } = await supabase
    .from('coin_wallets')
    .select('user_id, total_earned, balance')
    .order('total_earned', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  if (!wallets || wallets.length === 0) return { data: [], error: null };

  // Fetch usernames
  const userIds = wallets.map(w => w.user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username')
    .in('id', userIds);

  const profileMap = new Map<string, string>();
  (profiles || []).forEach(p => profileMap.set(p.id, p.username || 'User'));

  const entries: LeaderboardEntry[] = wallets.map((w, i) => ({
    user_id: w.user_id,
    username: profileMap.get(w.user_id) || 'User',
    total_earned: w.total_earned,
    balance: w.balance,
    rank: i + 1,
  }));

  return { data: entries, error: null };
}

export async function getWeeklyLeaderboard(limit = 20): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  // Get start of current week (Monday)
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const { data: txns, error } = await supabase
    .from('coin_transactions')
    .select('user_id, amount')
    .eq('type', 'earn')
    .gte('created_at', monday.toISOString());

  if (error) return { data: [], error: error.message };
  if (!txns || txns.length === 0) return { data: [], error: null };

  // Aggregate by user
  const userTotals = new Map<string, number>();
  txns.forEach(t => {
    userTotals.set(t.user_id, (userTotals.get(t.user_id) || 0) + t.amount);
  });

  // Sort and limit
  const sorted = [...userTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Fetch usernames
  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username')
    .in('id', userIds);

  const profileMap = new Map<string, string>();
  (profiles || []).forEach(p => profileMap.set(p.id, p.username || 'User'));

  const entries: LeaderboardEntry[] = sorted.map(([userId, total], i) => ({
    user_id: userId,
    username: profileMap.get(userId) || 'User',
    total_earned: total,
    balance: 0,
    rank: i + 1,
  }));

  return { data: entries, error: null };
}
