import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTheme } from '../hooks/useTheme';
import { useAuth, useAlert } from '../template';
import {
  SUBSCRIPTION_PLANS,
  TOKEN_COSTS,
  UserSubscription,
  loadSubscription,
  startFreeTrial,
  subscribeToPlan,
  getTrialDaysRemaining,
  isSubscriptionActive,
} from '../services/subscriptionService';

const { width: SCREEN_W } = Dimensions.get('window');

const PLAN_COLORS: Record<string, { primary: string; gradient: readonly [string, string] }> = {
  starter: { primary: '#F5B731', gradient: ['#F5B731', '#FDD85D'] },
  smart_foodie: { primary: '#7B2FA0', gradient: ['#7B2FA0', '#C41E7A'] },
  genie_pro: { primary: '#1E1456', gradient: ['#1E1456', '#7B2FA0'] },
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('genie_pro');

  useEffect(() => {
    if (user?.id) {
      loadSubscription(user.id).then(sub => {
        setSubscription(sub);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const trialDays = getTrialDaysRemaining(subscription);
  const isActive = isSubscriptionActive(subscription);
  const hasSubscription = subscription && subscription.subscription_status !== 'inactive' && subscription.subscription_status !== 'expired';

  const handleStartTrial = useCallback(async () => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActionLoading(true);
    const { data, error } = await startFreeTrial(user.id);
    setActionLoading(false);
    if (error) {
      showAlert('Error', error);
    } else {
      setSubscription(data);
      showAlert('Trial Started!', 'You have 7 days free with 100 AI Tokens. Enjoy exploring FoodGenie premium features!');
    }
  }, [user?.id, showAlert]);

  const handleSubscribe = useCallback(async () => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActionLoading(true);
    const { data, error } = await subscribeToPlan(user.id, selectedPlan);
    setActionLoading(false);
    if (error) {
      showAlert('Error', error);
    } else {
      setSubscription(data);
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
      showAlert('Subscribed!', `You are now on the ${plan?.name || ''} plan with ${plan?.monthlyTokens || 0} AI Tokens/month.`);
    }
  }, [user?.id, selectedPlan, showAlert]);

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={s.loadingCenter}>
          <ActivityIndicator size="large" color="#F5B731" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(30,20,86,0.05)' }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>FoodGenie AI Tokens</Text>
            <Text style={[s.headerSub, { color: colors.textMuted }]}>Unlock smarter meal planning</Text>
          </View>
          {subscription && isActive ? (
            <View style={s.tokenBadge}>
              <Image source={require('../assets/images/genie-coin.png')} style={{ width: 16, height: 16 }} contentFit="contain" />
              <Text style={s.tokenBadgeText}>{subscription.token_balance}</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeIn.duration(400)}>
            <LinearGradient
              colors={['#1E1456', '#7B2FA0', '#C41E7A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              <View style={s.heroCircle1} />
              <View style={s.heroCircle2} />
              <Text style={s.heroEmoji}>✨</Text>
              <Text style={s.heroTitle}>FoodGenie AI Tokens</Text>
              <Text style={s.heroSubtitle}>
                Unlock smarter meal planning, recipe videos, grocery carts and premium food guidance.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Trial Banner or Active Status */}
          {subscription && subscription.is_trial_active && trialDays > 0 ? (
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <View style={[s.trialBanner, { backgroundColor: isDark ? 'rgba(245,183,49,0.08)' : 'rgba(245,183,49,0.06)', borderColor: 'rgba(245,183,49,0.25)' }]}>
                <View style={s.trialIconWrap}>
                  <Text style={{ fontSize: 24 }}>⏱️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.trialTitle, { color: colors.textPrimary }]}>Free Trial Active</Text>
                  <Text style={[s.trialDesc, { color: colors.textMuted }]}>
                    Trial ends in {trialDays} day{trialDays !== 1 ? 's' : ''} • {subscription.token_balance} tokens remaining
                  </Text>
                </View>
                <View style={[s.trialDaysBadge, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
                  <Text style={s.trialDaysText}>{trialDays}d</Text>
                </View>
              </View>
            </Animated.View>
          ) : subscription && subscription.subscription_status === 'active' ? (
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <View style={[s.trialBanner, { backgroundColor: isDark ? 'rgba(30,20,86,0.12)' : 'rgba(30,20,86,0.04)', borderColor: 'rgba(30,20,86,0.20)' }]}>
                <View style={s.trialIconWrap}>
                  <Text style={{ fontSize: 24 }}>👑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.trialTitle, { color: colors.textPrimary }]}>
                    {SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan_name)?.name || 'Active'} Plan
                  </Text>
                  <Text style={[s.trialDesc, { color: colors.textMuted }]}>
                    {subscription.token_balance}/{subscription.monthly_token_limit} tokens • Renews {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : 'soon'}
                  </Text>
                </View>
                <View style={[s.trialDaysBadge, { backgroundColor: 'rgba(123,47,160,0.12)' }]}>
                  <Text style={[s.trialDaysText, { color: '#7B2FA0' }]}>Active</Text>
                </View>
              </View>
            </Animated.View>
          ) : !hasSubscription ? (
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
                onPress={handleStartTrial}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#F5B731', '#D9A020']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.trialCta}
                >
                  <Text style={{ fontSize: 20 }}>🎉</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.trialCtaTitle}>Start with 7 days free trial</Text>
                    <Text style={s.trialCtaDesc}>Get 100 trial tokens to explore premium features</Text>
                  </View>
                  {actionLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <MaterialIcons name="arrow-forward" size={22} color="#FFF" />
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Subscription Plans */}
          <View style={s.plansSection}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>
            <Text style={[s.sectionSub, { color: colors.textMuted }]}>Select a plan to unlock premium AI-powered features</Text>

            <View style={s.plansList}>
              {SUBSCRIPTION_PLANS.map((plan, i) => {
                const isSelected = selectedPlan === plan.id;
                const planColor = PLAN_COLORS[plan.id] || PLAN_COLORS.starter;
                const isCurrentPlan = subscription?.plan_name === plan.id && subscription?.subscription_status === 'active';

                return (
                  <Animated.View key={plan.id} entering={FadeInDown.delay(200 + i * 100).duration(350)}>
                    <Pressable
                      style={({ pressed }) => [
                        s.planCard,
                        {
                          backgroundColor: isSelected ? `${planColor.primary}08` : colors.surface,
                          borderColor: isSelected ? planColor.primary : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                        pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedPlan(plan.id); }}
                    >
                      {/* Best Value Badge */}
                      {plan.isBestValue ? (
                        <View style={[s.bestValueBadge, { backgroundColor: planColor.primary }]}>
                          <MaterialIcons name="star" size={10} color="#FFF" />
                          <Text style={s.bestValueText}>Best Value</Text>
                        </View>
                      ) : null}

                      {/* Current Plan Badge */}
                      {isCurrentPlan ? (
                        <View style={[s.currentPlanBadge, { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.30)' }]}>
                          <MaterialIcons name="check-circle" size={12} color="#D4AF37" />
                          <Text style={s.currentPlanText}>Current Plan</Text>
                        </View>
                      ) : null}

                      {/* Plan Header */}
                      <View style={s.planHeader}>
                        <View style={s.planNameRow}>
                          <LinearGradient colors={planColor.gradient as unknown as string[]} style={s.planIcon}>
                            <Text style={{ fontSize: 20 }}>
                              {plan.id === 'starter' ? '🌱' : plan.id === 'smart_foodie' ? '🧠' : '👑'}
                            </Text>
                          </LinearGradient>
                          <View>
                            <Text style={[s.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
                            <Text style={[s.planTokens, { color: planColor.primary }]}>{plan.monthlyTokens} tokens/month</Text>
                          </View>
                        </View>
                        <View style={s.planPriceWrap}>
                          <Text style={[s.planPrice, { color: colors.textPrimary }]}>₹{plan.price}</Text>
                          <Text style={[s.planPeriod, { color: colors.textMuted }]}>/month</Text>
                        </View>
                      </View>

                      {/* Features */}
                      <View style={s.planFeatures}>
                        {plan.features.map((feature, fi) => (
                          <View key={fi} style={s.featureRow}>
                            <MaterialIcons name="check-circle" size={14} color={planColor.primary} />
                            <Text style={[s.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Selection Indicator */}
                      <View style={s.planSelectRow}>
                        <View style={[
                          s.radioOuter,
                          { borderColor: isSelected ? planColor.primary : colors.border },
                        ]}>
                          {isSelected ? (
                            <View style={[s.radioInner, { backgroundColor: planColor.primary }]} />
                          ) : null}
                        </View>
                        <Text style={[s.selectLabel, { color: isSelected ? planColor.primary : colors.textMuted }]}>
                          {isSelected ? 'Selected' : 'Select plan'}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Token Usage Info */}
          <Animated.View entering={FadeInDown.delay(550).duration(350)}>
            <View style={[s.tokenUsageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.tokenUsageTitle, { color: colors.textPrimary }]}>Token Usage Guide</Text>
              <Text style={[s.tokenUsageSub, { color: colors.textMuted }]}>How AI Tokens are used across FoodGenie</Text>

              <View style={s.tokenCostsList}>
                {[
                  { label: 'Daily meal plan', cost: 'Free', emoji: '☀️', isFree: true } as const,
                  { label: 'Weekly meal plan', cost: '20 tokens', emoji: '📅', isFree: false },
                  { label: 'Monthly meal plan', cost: '50 tokens', emoji: '🗓️', isFree: false },
                  { label: 'Recipe video unlock', cost: '20–100 tokens', emoji: '🎬', isFree: false },
                  { label: 'AI food chat (advanced)', cost: '5 tokens/query', emoji: '💬', isFree: false },
                  { label: 'Grocery cart optimization', cost: '10 tokens', emoji: '🛒', isFree: false },
                ].map((item, i) => (
                  <View key={i} style={[s.tokenCostRow, { borderBottomColor: i < 5 ? colors.border : 'transparent' }]}>
                    <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                    <Text style={[s.tokenCostLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <View style={[
                      s.tokenCostBadge,
                      { backgroundColor: item.isFree ? 'rgba(74,222,128,0.10)' : 'rgba(245,183,49,0.10)' },
                    ]}>
                      <Text style={[
                        s.tokenCostValue,
                        { color: item.isFree ? '#4ADE80' : '#F5B731' },
                      ]}>{item.cost}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* CTA Button */}
          {!isCurrentPlanSelected() ? (
            <Animated.View entering={FadeInUp.delay(600).duration(400)} style={s.ctaWrap}>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={handleSubscribe}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#F5B731', '#D9A020']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.ctaBtn}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="rocket-launch" size={20} color="#FFF" />
                      <Text style={s.ctaText}>
                        {hasSubscription ? 'Upgrade Plan' : 'Subscribe Now'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
              <Text style={[s.ctaHint, { color: colors.textMuted }]}>
                Cancel anytime • No hidden charges
              </Text>
            </Animated.View>
          ) : null}

          {/* Manage Subscription */}
          {hasSubscription ? (
            <Animated.View entering={FadeInDown.delay(650).duration(300)}>
              <Pressable
                style={({ pressed }) => [
                  s.manageBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => { Haptics.selectionAsync(); showAlert('Manage Subscription', 'Subscription management will be available soon. Contact support for changes.'); }}
              >
                <MaterialIcons name="settings" size={18} color={colors.textSecondary} />
                <Text style={[s.manageBtnText, { color: colors.textSecondary }]}>Manage Subscription</Text>
                <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  function isCurrentPlanSelected(): boolean {
    return subscription?.plan_name === selectedPlan && subscription?.subscription_status === 'active';
  }
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(245,183,49,0.10)', borderWidth: 1, borderColor: 'rgba(245,183,49,0.25)',
  },
  tokenBadgeText: { fontSize: 14, fontWeight: '900', color: '#F5B731' },

  scrollContent: { paddingHorizontal: 20, gap: 20, paddingTop: 20 },

  /* Hero */
  hero: {
    borderRadius: 24, padding: 28, alignItems: 'center', gap: 10,
    overflow: 'hidden', position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -20, left: 20,
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 19 },

  /* Trial */
  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 18, borderWidth: 1.5,
  },
  trialIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,183,49,0.10)' },
  trialTitle: { fontSize: 14, fontWeight: '800' },
  trialDesc: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  trialDaysBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  trialDaysText: { fontSize: 12, fontWeight: '900', color: '#F5B731' },

  trialCta: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 18,
  },
  trialCtaTitle: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  trialCtaDesc: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  /* Plans */
  plansSection: { gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, fontWeight: '500' },
  plansList: { gap: 14, marginTop: 6 },

  planCard: {
    padding: 18, borderRadius: 20, position: 'relative', gap: 14,
  },
  bestValueBadge: {
    position: 'absolute', top: -10, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  bestValueText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  currentPlanBadge: {
    position: 'absolute', top: -10, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  currentPlanText: { fontSize: 10, fontWeight: '800', color: '#D4AF37' },

  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 16, fontWeight: '900' },
  planTokens: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: 24, fontWeight: '900' },
  planPeriod: { fontSize: 10, fontWeight: '600' },

  planFeatures: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, fontWeight: '500', flex: 1 },

  planSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  selectLabel: { fontSize: 12, fontWeight: '700' },

  /* Token Usage */
  tokenUsageCard: { padding: 18, borderRadius: 20, borderWidth: 1, gap: 12 },
  tokenUsageTitle: { fontSize: 16, fontWeight: '900' },
  tokenUsageSub: { fontSize: 12, fontWeight: '500', marginTop: -4 },
  tokenCostsList: { gap: 0 },
  tokenCostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  tokenCostLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  tokenCostBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tokenCostValue: { fontSize: 11, fontWeight: '800' },

  /* CTA */
  ctaWrap: { alignItems: 'center', gap: 8 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 40, borderRadius: 18, minWidth: 260,
  },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  ctaHint: { fontSize: 11, fontWeight: '500' },

  /* Manage */
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  manageBtnText: { flex: 1, fontSize: 14, fontWeight: '700' },
});
