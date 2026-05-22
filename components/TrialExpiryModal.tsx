import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserSubscription,
  SUBSCRIPTION_PLANS,
  getTrialDaysRemaining,
} from '../services/subscriptionService';

const { width: SCREEN_W } = Dimensions.get('window');

const DISMISSED_KEY = '@trial_expiry_modal_dismissed';
const DISMISSED_EXPIRY = 12 * 60 * 60 * 1000; // 12 hours

interface Props {
  subscription: UserSubscription | null;
  colors: any;
  isDark: boolean;
  onUpgrade: () => void;
}

const FEATURES_LOST = [
  { emoji: '📅', label: 'Weekly & Monthly meal plans' },
  { emoji: '🎬', label: 'Recipe video unlocks' },
  { emoji: '💬', label: 'Advanced AI food chat' },
  { emoji: '🛒', label: 'Smart grocery optimization' },
  { emoji: '👨‍🍳', label: 'Premium chef content' },
];

const PLAN_COMPARISON = [
  { id: 'starter', name: 'Starter', price: '₹99', tokens: '100', color: '#D4AF37' },
  { id: 'smart_foodie', name: 'Smart Foodie', price: '₹199', tokens: '300', color: '#B8860B' },
  { id: 'genie_pro', name: 'Genie Pro', price: '₹499', tokens: '1000', color: '#8B6914', best: true },
];

export default function TrialExpiryModal({ subscription, colors, isDark, onUpgrade }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkShouldShow();
  }, [subscription]);

  const checkShouldShow = async () => {
    if (!subscription) return;

    const trialDays = getTrialDaysRemaining(subscription);
    const isTrialExpired = subscription.is_trial_active && subscription.trial_end_date && new Date() >= new Date(subscription.trial_end_date);
    const isLastDay = subscription.is_trial_active && trialDays <= 1 && trialDays > 0;
    const justExpired = subscription.subscription_status === 'expired' || isTrialExpired;

    if (!isLastDay && !justExpired) return;

    // Check if dismissed recently
    try {
      const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        if (Date.now() - dismissedAt < DISMISSED_EXPIRY) return;
      }
    } catch { /* proceed */ }

    setVisible(true);
  };

  const handleDismiss = async () => {
    Haptics.selectionAsync();
    setVisible(false);
    try {
      await AsyncStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch { /* non-blocking */ }
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVisible(false);
    onUpgrade();
  };

  const trialDays = getTrialDaysRemaining(subscription);
  const isExpired = trialDays === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable style={s.overlay} onPress={handleDismiss}>
        <Pressable style={[s.modal, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
          {/* Close button */}
          <Pressable style={[s.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} onPress={handleDismiss}>
            <MaterialIcons name="close" size={20} color={colors.textMuted} />
          </Pressable>

          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={s.headerWrap}>
            <LinearGradient
              colors={isExpired ? ['#B8860B', '#D4AF37'] : ['#D4AF37', '#F6C945']}
              style={s.headerIcon}
            >
              <Text style={{ fontSize: 32 }}>{isExpired ? '⏰' : '⚠️'}</Text>
            </LinearGradient>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
              {isExpired ? 'Your Trial Has Expired' : 'Trial Ends Tomorrow!'}
            </Text>
            <Text style={[s.headerSub, { color: colors.textMuted }]}>
              {isExpired
                ? 'Your free trial tokens have expired. Upgrade now to keep using premium features.'
                : 'You have less than 1 day left on your free trial. Upgrade to keep uninterrupted access.'}
            </Text>
          </Animated.View>

          {/* Features you will lose */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={s.loseSection}>
            <Text style={[s.loseSectionTitle, { color: colors.textPrimary }]}>
              {isExpired ? 'You have lost access to:' : 'You will lose access to:'}
            </Text>
            <View style={s.loseList}>
              {FEATURES_LOST.map((feat, i) => (
                <View key={i} style={[s.loseItem, { backgroundColor: isDark ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.04)' }]}>
                  <Text style={{ fontSize: 16 }}>{feat.emoji}</Text>
                  <Text style={[s.loseItemText, { color: colors.textSecondary }]}>{feat.label}</Text>
                  <MaterialIcons name="block" size={14} color="rgba(184,134,11,0.5)" />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Plan comparison */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={s.plansSection}>
            <Text style={[s.plansSectionTitle, { color: colors.textPrimary }]}>Upgrade to keep access:</Text>
            <View style={s.plansMini}>
              {PLAN_COMPARISON.map((plan) => (
                <View
                  key={plan.id}
                  style={[
                    s.planMiniCard,
                    {
                      backgroundColor: isDark ? `${plan.color}10` : `${plan.color}06`,
                      borderColor: plan.best ? plan.color : `${plan.color}30`,
                      borderWidth: plan.best ? 2 : 1,
                    },
                  ]}
                >
                  {plan.best ? (
                    <View style={[s.bestBadgeMini, { backgroundColor: plan.color }]}>
                      <Text style={s.bestBadgeMiniText}>Best</Text>
                    </View>
                  ) : null}
                  <Text style={[s.planMiniName, { color: plan.color }]}>{plan.name}</Text>
                  <Text style={[s.planMiniPrice, { color: colors.textPrimary }]}>{plan.price}</Text>
                  <Text style={[s.planMiniTokens, { color: colors.textMuted }]}>{plan.tokens} tokens/mo</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={s.ctaWrap}>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={handleUpgrade}
            >
              <LinearGradient colors={['#B8860B', '#D4AF37']} style={s.ctaBtn}>
                <MaterialIcons name="rocket-launch" size={18} color="#FFF" />
                <Text style={s.ctaText}>Upgrade Now</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={handleDismiss} style={({ pressed }) => [s.laterBtn, pressed && { opacity: 0.7 }]}>
              <Text style={[s.laterText, { color: colors.textMuted }]}>Maybe Later</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modal: {
    width: '100%', maxWidth: 380, borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20, shadowRadius: 30, elevation: 15,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 10,
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },

  headerWrap: { alignItems: 'center', gap: 10, marginBottom: 20 },
  headerIcon: {
    width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, textAlign: 'center' },
  headerSub: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19 },

  loseSection: { gap: 8, marginBottom: 18 },
  loseSectionTitle: { fontSize: 14, fontWeight: '800' },
  loseList: { gap: 6 },
  loseItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12,
  },
  loseItemText: { flex: 1, fontSize: 13, fontWeight: '600' },

  plansSection: { gap: 10, marginBottom: 20 },
  plansSectionTitle: { fontSize: 14, fontWeight: '800' },
  plansMini: { flexDirection: 'row', gap: 8 },
  planMiniCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 16, position: 'relative',
  },
  bestBadgeMini: {
    position: 'absolute', top: -8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  bestBadgeMiniText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  planMiniName: { fontSize: 11, fontWeight: '800', marginTop: 4 },
  planMiniPrice: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  planMiniTokens: { fontSize: 9, fontWeight: '600', marginTop: 2 },

  ctaWrap: { alignItems: 'center', gap: 10 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, paddingHorizontal: 48, borderRadius: 16, minWidth: 220,
  },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  laterBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  laterText: { fontSize: 13, fontWeight: '600' },
});
