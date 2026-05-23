import { getSupabaseClient } from '@/template';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  monthlyTokens: number;
  features: string[];
  isBestValue?: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price: number;
  token_balance: number;
  monthly_token_limit: number;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_active: boolean;
  subscription_status: string;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    monthlyTokens: 200,
    features: [
      '200 AI Tokens/month',
      'AI meal plans (daily)',
      'Smart grocery cart',
      'Recipe previews',
      'Limited recipe unlocks',
    ],
  },
  {
    id: 'genie_plus',
    name: 'Genie Plus',
    price: 99,
    monthlyTokens: 500,
    features: [
      '500 AI Tokens/month',
      'Daily + weekly meal plans',
      '20 recipe video unlocks',
      'Smart grocery optimization',
      'AI food chat',
      'Smart Split savings',
    ],
  },
  {
    id: 'genie_pro',
    name: 'Genie Pro',
    price: 299,
    monthlyTokens: 1500,
    isBestValue: true,
    features: [
      '1500 AI Tokens/month',
      'Daily + weekly + monthly plans',
      'Unlimited recipe videos',
      'Advanced grocery planning',
      'Priority AI chat',
      'Cook booking discounts',
      'Monthly bundle savings',
    ],
  },
];

export const TOKEN_COSTS = {
  daily_meal_plan: 0,
  weekly_meal_plan: 20,
  monthly_meal_plan: 50,
  recipe_video_unlock: 20, // 20-100 range
  ai_food_chat: 5,
  grocery_cart_optimization: 10,
};

const TRIAL_DURATION_DAYS = 7;
const TRIAL_TOKENS = 100;

function getClient() {
  return getSupabaseClient();
}

export async function loadSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as UserSubscription;
}

export async function startFreeTrial(userId: string): Promise<{ data: UserSubscription | null; error: string | null }> {
  const supabase = getClient();
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const subscriptionData = {
    user_id: userId,
    plan_name: 'trial',
    plan_price: 0,
    token_balance: TRIAL_TOKENS,
    monthly_token_limit: TRIAL_TOKENS,
    trial_start_date: now.toISOString(),
    trial_end_date: trialEnd.toISOString(),
    is_trial_active: true,
    subscription_status: 'trial',
    renewal_date: trialEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as UserSubscription, error: null };
}

export async function subscribeToPlan(userId: string, planId: string): Promise<{ data: UserSubscription | null; error: string | null }> {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) return { data: null, error: 'Plan not found' };

  const supabase = getClient();
  const now = new Date();
  const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscriptionData = {
    user_id: userId,
    plan_name: plan.id,
    plan_price: plan.price,
    token_balance: plan.monthlyTokens,
    monthly_token_limit: plan.monthlyTokens,
    trial_start_date: null,
    trial_end_date: null,
    is_trial_active: false,
    subscription_status: 'active',
    renewal_date: renewalDate.toISOString(),
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as UserSubscription, error: null };
}

export async function deductTokens(userId: string, amount: number, reason: string): Promise<{ success: boolean; error: string | null; remaining: number }> {
  const sub = await loadSubscription(userId);
  if (!sub) return { success: false, error: 'No active subscription', remaining: 0 };
  if (sub.subscription_status === 'inactive') return { success: false, error: 'Subscription inactive', remaining: 0 };

  // Check trial expiry
  if (sub.is_trial_active && sub.trial_end_date) {
    const trialEnd = new Date(sub.trial_end_date);
    if (new Date() > trialEnd) {
      // Trial expired
      const supabase = getClient();
      await supabase
        .from('user_subscriptions')
        .update({ is_trial_active: false, subscription_status: 'expired', token_balance: 0, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      return { success: false, error: 'Trial expired. Please upgrade to continue.', remaining: 0 };
    }
  }

  if (sub.token_balance < amount) {
    return { success: false, error: `Insufficient tokens. You need ${amount} but have ${sub.token_balance}.`, remaining: sub.token_balance };
  }

  const newBalance = sub.token_balance - amount;
  const supabase = getClient();
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ token_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message, remaining: sub.token_balance };
  return { success: true, error: null, remaining: newBalance };
}

export function getTrialDaysRemaining(subscription: UserSubscription | null): number {
  if (!subscription || !subscription.is_trial_active || !subscription.trial_end_date) return 0;
  const trialEnd = new Date(subscription.trial_end_date);
  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function isSubscriptionActive(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  if (subscription.subscription_status === 'active') return true;
  if (subscription.is_trial_active && subscription.trial_end_date) {
    return new Date() < new Date(subscription.trial_end_date);
  }
  return false;
}
