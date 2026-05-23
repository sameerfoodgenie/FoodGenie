import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTheme } from '../hooks/useTheme';
import { useCoin } from '../hooks/useCoin';
import { useAuth } from '@/template';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Spin Wheel Rewards ──
const SPIN_REWARDS = [
  { label: '+10 Tokens', emoji: '✨', color: '#F5B731', value: 10 },
  { label: 'Free Recipe', emoji: '📖', color: '#7B2FA0', value: 0 },
  { label: '₹30 Cashback', emoji: '💰', color: '#4ADE80', value: 30 },
  { label: 'Free Delivery', emoji: '🚚', color: '#60A5FA', value: 0 },
  { label: '+25 Tokens', emoji: '🌟', color: '#F5B731', value: 25 },
  { label: 'Extra Spin', emoji: '🎰', color: '#C41E7A', value: 0 },
  { label: '₹50 Coupon', emoji: '🎟️', color: '#4ADE80', value: 50 },
  { label: '+5 Tokens', emoji: '⚡', color: '#F97316', value: 5 },
];

// ── Daily Challenges ──
const DAILY_CHALLENGES = [
  { id: 'meal_plan', title: 'Generate 3 Meal Plans', desc: 'Use AI meal planner', reward: '+15 tokens', progress: 1, total: 3, emoji: '🍽️', color: '#7B2FA0' },
  { id: 'recipe_video', title: 'Watch Recipe Video', desc: 'Learn a new recipe', reward: '+10 tokens', progress: 0, total: 1, emoji: '🎬', color: '#F04E50' },
  { id: 'food_photo', title: 'Upload Food Photo', desc: 'Share your meal', reward: '+20 tokens', progress: 0, total: 1, emoji: '📸', color: '#F5B731' },
  { id: 'grocery', title: 'Complete Grocery Order', desc: 'Order via Smart Grocery', reward: '+25 tokens', progress: 0, total: 1, emoji: '🛒', color: '#4ADE80' },
];

// ── Streak Rewards ──
const STREAK_MILESTONES = [
  { days: 3, reward: '+30 tokens', emoji: '🔥', unlocked: true },
  { days: 7, reward: '+100 tokens', emoji: '⭐', unlocked: true },
  { days: 14, reward: 'Free Recipe Unlock', emoji: '🏆', unlocked: false },
  { days: 30, reward: 'Premium Recipe Pack', emoji: '👑', unlocked: false },
];

// ── Community Rewards ──
const COMMUNITY_ACTIONS = [
  { id: 'post', label: 'Post Meal', reward: '+10', emoji: '📸' },
  { id: 'like', label: 'Give Likes', reward: '+2', emoji: '❤️' },
  { id: 'review', label: 'Write Review', reward: '+15', emoji: '⭐' },
  { id: 'recipe', label: 'Upload Recipe', reward: '+30', emoji: '📖' },
  { id: 'refer', label: 'Refer Friend', reward: '+50', emoji: '👥' },
];

// ── Surprise Offers ──
const SURPRISE_OFFERS = [
  { id: 'blinkit', provider: 'Blinkit', emoji: '🟡', title: '₹100 off on ₹500+', desc: 'Grocery combo deal', color: '#F8CB2E', expires: '2h left' },
  { id: 'zepto', provider: 'Zepto', emoji: '⚡', title: 'Free delivery today', desc: 'No min order', color: '#7B2D8E', expires: '5h left' },
  { id: 'bundle', provider: 'FoodGenie', emoji: '🧞', title: 'Healthy meal bundle', desc: '7-day plan at ₹49', color: '#C41E7A', expires: '1d left' },
];

export default function GenieRewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { balance, currentStreak } = useCoin();
  const { user } = useAuth();

  const [spinAvailable, setSpinAvailable] = useState(true);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [showSpinModal, setShowSpinModal] = useState(false);

  // Lamp glow animation
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowScale.value = withRepeat(withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    glowOpacity.value = withRepeat(withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const handleSpin = useCallback(() => {
    if (!spinAvailable) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSpinAvailable(false);
    setShowSpinModal(true);

    // Random reward
    const reward = SPIN_REWARDS[Math.floor(Math.random() * SPIN_REWARDS.length)];
    setTimeout(() => {
      setSpinResult(reward.label);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }, [spinAvailable]);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#1E1456', '#7B2FA0', '#C41E7A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
          <View style={st.headerRow}>
            <Pressable style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Genie Rewards ✨</Text>
              <Text style={st.headerSub}>Earn, spin & unlock daily rewards</Text>
            </View>
            <View style={st.tokenBadge}>
              <Text style={{ fontSize: 14 }}>🪙</Text>
              <Text style={st.tokenText}>{balance}</Text>
            </View>
          </View>

          {/* Lamp Section */}
          <View style={st.lampSection}>
            <Animated.View style={[st.lampGlow, glowStyle]} />
            <Image source={require('../assets/images/foodgenie-logo.png')} style={{ width: 56, height: 56, borderRadius: 14 }} contentFit="contain" />
            <Text style={st.lampText}>Rub the lamp & unlock rewards</Text>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

          {/* ═══ Daily Spin ═══ */}
          <Animated.View entering={FadeInDown.delay(50).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <Pressable
              style={({ pressed }) => [st.spinCard, { backgroundColor: isDark ? 'rgba(245,183,49,0.05)' : 'rgba(245,183,49,0.02)', borderColor: 'rgba(245,183,49,0.25)' }, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
              onPress={handleSpin}
              disabled={!spinAvailable}
            >
              <View style={st.spinHeader}>
                <Text style={{ fontSize: 32 }}>🎰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[st.spinTitle, { color: colors.textPrimary }]}>Daily Spin Wheel</Text>
                  <Text style={[st.spinSub, { color: colors.textMuted }]}>Win tokens, cashback, free delivery & more</Text>
                </View>
              </View>
              <LinearGradient
                colors={spinAvailable ? ['#F5B731', '#D9A020'] : ['#6B7280', '#4B5563']}
                style={st.spinBtn}
              >
                <MaterialIcons name="stars" size={18} color="#FFF" />
                <Text style={st.spinBtnText}>{spinAvailable ? 'Spin Now' : 'Spun Today'}</Text>
              </LinearGradient>
              {/* Mini reward previews */}
              <View style={st.spinRewards}>
                {SPIN_REWARDS.slice(0, 4).map((r, i) => (
                  <View key={i} style={[st.spinRewardChip, { backgroundColor: `${r.color}12` }]}>
                    <Text style={{ fontSize: 12 }}>{r.emoji}</Text>
                    <Text style={[st.spinRewardText, { color: r.color }]}>{r.label}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          </Animated.View>

          {/* ═══ Daily Challenges ═══ */}
          <Animated.View entering={FadeInDown.delay(120).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <View style={st.sectionHeader}>
              <MaterialIcons name="flag" size={18} color="#7B2FA0" />
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Daily Challenges</Text>
              <View style={st.sectionBadge}>
                <Text style={st.sectionBadgeText}>1/4 done</Text>
              </View>
            </View>
            <View style={st.challengeGrid}>
              {DAILY_CHALLENGES.map((ch, i) => (
                <Animated.View key={ch.id} entering={FadeInDown.delay(140 + i * 40).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [st.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
                    onPress={() => Haptics.selectionAsync()}
                  >
                    <View style={[st.challengeIcon, { backgroundColor: `${ch.color}12` }]}>
                      <Text style={{ fontSize: 20 }}>{ch.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[st.challengeTitle, { color: colors.textPrimary }]}>{ch.title}</Text>
                      <Text style={[st.challengeDesc, { color: colors.textMuted }]}>{ch.desc}</Text>
                      <View style={st.challengeProgress}>
                        <View style={[st.challengeProgressBar, { backgroundColor: colors.border }]}>
                          <View style={[st.challengeProgressFill, { width: `${(ch.progress / ch.total) * 100}%`, backgroundColor: ch.color }]} />
                        </View>
                        <Text style={[st.challengeProgressText, { color: colors.textMuted }]}>{ch.progress}/{ch.total}</Text>
                      </View>
                    </View>
                    <View style={[st.challengeReward, { backgroundColor: 'rgba(245,183,49,0.10)' }]}>
                      <Text style={st.challengeRewardText}>{ch.reward}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ═══ Streak Rewards ═══ */}
          <Animated.View entering={FadeInDown.delay(250).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 22 }}>
            <View style={st.sectionHeader}>
              <MaterialIcons name="local-fire-department" size={18} color="#F04E50" />
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Streak Rewards</Text>
              <View style={[st.streakBadge, { backgroundColor: 'rgba(240,78,80,0.12)' }]}>
                <Text style={{ fontSize: 10 }}>🔥</Text>
                <Text style={st.streakBadgeText}>{currentStreak} day streak</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 8 }}>
              {STREAK_MILESTONES.map((m, i) => (
                <View key={i} style={[st.streakCard, { backgroundColor: m.unlocked ? (isDark ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.03)') : colors.surface, borderColor: m.unlocked ? 'rgba(74,222,128,0.25)' : colors.border }]}>
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                  <Text style={[st.streakDays, { color: m.unlocked ? '#4ADE80' : colors.textPrimary }]}>{m.days} days</Text>
                  <Text style={[st.streakReward, { color: colors.textMuted }]}>{m.reward}</Text>
                  {m.unlocked ? (
                    <View style={st.streakUnlocked}>
                      <MaterialIcons name="check-circle" size={14} color="#4ADE80" />
                    </View>
                  ) : (
                    <View style={st.streakLocked}>
                      <MaterialIcons name="lock" size={12} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ Community Rewards ═══ */}
          <Animated.View entering={FadeInDown.delay(320).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 22 }}>
            <View style={st.sectionHeader}>
              <MaterialIcons name="people" size={18} color="#60A5FA" />
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Community Rewards</Text>
            </View>
            <View style={st.communityGrid}>
              {COMMUNITY_ACTIONS.map((action, i) => (
                <Pressable
                  key={action.id}
                  style={({ pressed }) => [st.communityCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <Text style={{ fontSize: 22 }}>{action.emoji}</Text>
                  <Text style={[st.communityLabel, { color: colors.textPrimary }]}>{action.label}</Text>
                  <Text style={st.communityReward}>{action.reward}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ═══ Surprise Offers ═══ */}
          <Animated.View entering={FadeInDown.delay(400).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 22 }}>
            <View style={st.sectionHeader}>
              <MaterialIcons name="card-giftcard" size={18} color="#C41E7A" />
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Surprise Offers</Text>
            </View>
            <View style={{ gap: 8, marginTop: 8 }}>
              {SURPRISE_OFFERS.map((offer, i) => (
                <Pressable
                  key={offer.id}
                  style={({ pressed }) => [st.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.9 }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <View style={[st.offerIcon, { backgroundColor: `${offer.color}12` }]}>
                    <Text style={{ fontSize: 22 }}>{offer.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[st.offerProvider, { color: offer.color }]}>{offer.provider}</Text>
                      <View style={[st.offerExpiry, { backgroundColor: 'rgba(240,78,80,0.10)' }]}>
                        <Text style={st.offerExpiryText}>{offer.expires}</Text>
                      </View>
                    </View>
                    <Text style={[st.offerTitle, { color: colors.textPrimary }]}>{offer.title}</Text>
                    <Text style={[st.offerDesc, { color: colors.textMuted }]}>{offer.desc}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ═══ Refer & Earn ═══ */}
          <Animated.View entering={FadeInDown.delay(460).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 22 }}>
            <Pressable
              style={({ pressed }) => [st.referCard, { borderColor: 'rgba(123,47,160,0.30)' }, pressed && { opacity: 0.9 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/coin-wallet' as any); }}
            >
              <LinearGradient colors={['#1E1456', '#7B2FA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.referGradient}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 30 }}>👥</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.referTitle}>Refer & Earn +50 Tokens</Text>
                    <Text style={st.referSub}>Share FoodGenie with friends, both earn rewards</Text>
                  </View>
                  <View style={st.referCta}>
                    <Text style={st.referCtaText}>Share</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ═══ Spin Result Modal ═══ */}
      <Modal visible={showSpinModal} transparent animationType="fade" onRequestClose={() => setShowSpinModal(false)}>
        <Pressable style={st.modalOverlay} onPress={() => setShowSpinModal(false)}>
          <Pressable style={[st.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            {spinResult ? (
              <Animated.View entering={FadeInUp.duration(400)} style={{ alignItems: 'center', gap: 16 }}>
                <Text style={{ fontSize: 48 }}>🎉</Text>
                <Text style={[st.modalTitle, { color: colors.textPrimary }]}>Congratulations!</Text>
                <Text style={[st.modalReward, { color: '#F5B731' }]}>{spinResult}</Text>
                <Text style={[st.modalDesc, { color: colors.textMuted }]}>Reward added to your account</Text>
                <Pressable
                  style={({ pressed }) => [st.modalBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setShowSpinModal(false)}
                >
                  <LinearGradient colors={['#7B2FA0', '#1E1456']} style={st.modalBtnGrad}>
                    <Text style={st.modalBtnText}>Claim Reward</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <View style={{ alignItems: 'center', gap: 16 }}>
                <Text style={{ fontSize: 48 }}>🎰</Text>
                <Text style={[st.modalTitle, { color: colors.textPrimary }]}>Spinning...</Text>
                <Text style={[st.modalDesc, { color: colors.textMuted }]}>Your reward is coming!</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  tokenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,183,49,0.20)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tokenText: { fontSize: 14, fontWeight: '900', color: '#F5B731' },

  lampSection: { alignItems: 'center', marginTop: 12, position: 'relative' },
  lampGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(245,183,49,0.3)' },
  lampEmoji: { fontSize: 48 },
  lampText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 8 },

  // Spin
  spinCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 12 },
  spinHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spinTitle: { fontSize: 16, fontWeight: '900' },
  spinSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  spinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  spinBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  spinRewards: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  spinRewardChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  spinRewardText: { fontSize: 10, fontWeight: '700' },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  sectionBadge: { backgroundColor: 'rgba(123,47,160,0.10)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: '#7B2FA0' },

  // Challenges
  challengeGrid: { gap: 8 },
  challengeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  challengeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { fontSize: 13, fontWeight: '800' },
  challengeDesc: { fontSize: 10, fontWeight: '500' },
  challengeProgress: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  challengeProgressBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  challengeProgressFill: { height: '100%', borderRadius: 2 },
  challengeProgressText: { fontSize: 9, fontWeight: '700' },
  challengeReward: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  challengeRewardText: { fontSize: 10, fontWeight: '800', color: '#F5B731' },

  // Streak
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  streakBadgeText: { fontSize: 10, fontWeight: '700', color: '#F04E50' },
  streakCard: { width: 110, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
  streakDays: { fontSize: 13, fontWeight: '800' },
  streakReward: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  streakUnlocked: { position: 'absolute', top: 8, right: 8 },
  streakLocked: { position: 'absolute', top: 8, right: 8 },

  // Community
  communityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  communityCard: { width: (SCREEN_W - 48) / 3, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  communityLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  communityReward: { fontSize: 10, fontWeight: '800', color: '#F5B731' },

  // Offers
  offerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  offerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  offerProvider: { fontSize: 10, fontWeight: '700' },
  offerExpiry: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  offerExpiryText: { fontSize: 8, fontWeight: '700', color: '#F04E50' },
  offerTitle: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  offerDesc: { fontSize: 10, fontWeight: '500' },

  // Refer
  referCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  referGradient: { padding: 18 },
  referTitle: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  referSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  referCta: { backgroundColor: '#F5B731', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  referCtaText: { fontSize: 12, fontWeight: '800', color: '#1E1456' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalContent: { width: SCREEN_W * 0.8, padding: 32, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  modalReward: { fontSize: 28, fontWeight: '900' },
  modalDesc: { fontSize: 13, fontWeight: '500' },
  modalBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, width: '100%' },
  modalBtnGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  modalBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
