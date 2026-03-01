import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import ModePromptModal from '../../components/ModePromptModal';

const SMART_CHIPS = [
  { label: 'High protein', emoji: '💪' },
  { label: 'Light & healthy', emoji: '🥗' },
  { label: 'Comfort food', emoji: '🍛' },
  { label: 'Spicy', emoji: '🌶️' },
  { label: 'Under ₹250', emoji: '💰' },
  { label: 'Sweet cravings', emoji: '🍰' },
];

const TOP_PICKS = [
  {
    id: 'tp1',
    name: 'Butter Chicken',
    restaurant: 'Punjabi Dhaba',
    reason: 'Matches your taste profile perfectly',
    total: 310,
    emoji: '🍗',
    verified: true,
  },
  {
    id: 'tp2',
    name: 'Paneer Tikka Thali',
    restaurant: 'Green Leaf Kitchen',
    reason: 'High protein, within your budget',
    total: 250,
    emoji: '🥬',
    verified: false,
  },
  {
    id: 'tp3',
    name: 'Hyderabadi Biryani',
    restaurant: 'Biryani House',
    reason: 'Top rated, chef-verified kitchen',
    total: 360,
    emoji: '🍚',
    verified: true,
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const app = useApp();
  
  const [showModePrompt, setShowModePrompt] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const hasRedirected = useRef(false);
  const isNavigating = useRef(false);

  // Shimmer animation for Get Matches button
  const shimmerOpacity = useSharedValue(1);
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const { preferences, prefsLoaded, updatePreferences, updateMode, setCurrentQuery } = app;

  useEffect(() => {
    if (prefsLoaded && preferences.sessionCount === 5 && preferences.mode === 'guided') {
      const timer = setTimeout(() => setShowModePrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [prefsLoaded, preferences.sessionCount, preferences.mode]);

  useEffect(() => {
    if (!prefsLoaded) return;
    if (preferences.onboardingComplete) {
      hasRedirected.current = false;
      return;
    }
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    const timer = setTimeout(() => {
      try { router.push('/onboarding'); } catch (e) { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [prefsLoaded, preferences.onboardingComplete]);

  const handleAskGenie = useCallback(
    (text?: string) => {
      if (isNavigating.current) return;
      isNavigating.current = true;

      if (!preferences.onboardingComplete) {
        try { router.push('/onboarding'); } catch (e) { /* ignore */ }
        setTimeout(() => { isNavigating.current = false; }, 2000);
        return;
      }

      const finalQuery = text || query.trim();
      setCurrentQuery(finalQuery);
      setSelectedChip(null);
      setIsSearching(true);
      shimmerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );

      setTimeout(() => {
        setIsSearching(false);
        setQuery('');
        shimmerOpacity.value = 1;
        try { router.push('/ai-thinking'); } catch (e) { /* ignore */ }
        setTimeout(() => { isNavigating.current = false; }, 2000);
      }, 1200);
    },
    [preferences.onboardingComplete, query, setCurrentQuery, router],
  );

  const handleChipPress = useCallback(
    (label: string) => {
      setSelectedChip(label);
      handleAskGenie(label);
    },
    [handleAskGenie],
  );

  const handleModeSelect = useCallback(
    async (mode: 'quick' | 'guided') => {
      try { await updateMode(mode); } catch { /* ignore */ }
    },
    [updateMode],
  );

  if (!prefsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subGreeting}>Hungry? Let the Genie decide.</Text>
            </View>
            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/account')}
            >
              <MaterialIcons name="person" size={22} color={theme.primary} />
            </Pressable>
          </Animated.View>

          {/* ─── HERO: Ask FoodGenie ─── */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <View style={styles.heroOuter}>
              {/* Radial glow background */}
              <LinearGradient
                colors={['rgba(251,191,36,0.12)', 'rgba(251,191,36,0.04)', 'rgba(10,10,10,0)']}
                style={styles.heroGlow}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
              <View style={styles.heroCard}>
                {/* Title row */}
                <View style={styles.heroHeader}>
                  <View style={styles.genieAvatar}>
                    <Image
                      source={require('../../assets/images/genie-mascot.png')}
                      style={styles.genieMascot}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.heroTitleBlock}>
                    <Text style={styles.heroTitle}>Ask FoodGenie</Text>
                    <Text style={styles.heroSubtitle}>Describe your craving. I will find your best match.</Text>
                  </View>
                  {preferences.mode === 'quick' ? (
                    <View style={styles.modeBadge}>
                      <MaterialIcons name="flash-on" size={12} color={theme.primary} />
                      <Text style={styles.modeBadgeText}>Quick</Text>
                    </View>
                  ) : null}
                </View>

                {/* Input + CTA */}
                <View style={styles.heroInputRow}>
                  <View style={styles.heroInputWrapper}>
                    <MaterialIcons name="search" size={20} color={theme.textMuted} style={styles.heroInputIcon} />
                    <TextInput
                      style={styles.heroInput}
                      value={query}
                      onChangeText={setQuery}
                      placeholder="What are you in the mood for?"
                      placeholderTextColor={theme.textMuted}
                      returnKeyType="search"
                      onSubmitEditing={() => handleAskGenie()}
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.heroCTA, pressed && !isSearching && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                    onPress={() => handleAskGenie()}
                    disabled={isSearching}
                  >
                    <Animated.View style={shimmerStyle}>
                      <LinearGradient
                        colors={theme.gradients.goldShine}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCTAGradient}
                      >
                        <MaterialIcons name={isSearching ? 'hourglass-top' : 'auto-awesome'} size={18} color={theme.textOnPrimary} />
                        <Text style={styles.heroCTAText}>{isSearching ? 'Finding...' : 'Get Matches'}</Text>
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>
                </View>
                <Text style={styles.heroHint}>Example: "high protein dinner under ₹300"</Text>

                {/* Smart Chips */}
                <View style={styles.chipsOuter}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContainer}
                  >
                    {SMART_CHIPS.map((chip) => {
                      const isSelected = selectedChip === chip.label;
                      return (
                        <Pressable
                          key={chip.label}
                          style={[styles.chip, isSelected && styles.chipSelected]}
                          onPress={() => handleChipPress(chip.label)}
                        >
                          <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                          <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{chip.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ─── WHY FOODGENIE ─── */}
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.whySection}>
            <Text style={styles.whySectionTitle}>Why FoodGenie</Text>
            <View style={styles.whyBadges}>
              {[
                { icon: 'verified' as const, text: 'Chef-verified kitchens' },
                { icon: 'shield' as const, text: 'Bias-free recommendations' },
                { icon: 'local-shipping' as const, text: 'Order via partners' },
              ].map((badge, i) => (
                <Animated.View
                  key={badge.text}
                  entering={FadeInRight.delay(450 + i * 80).duration(350)}
                >
                  <View style={styles.whyPill}>
                    <MaterialIcons name={badge.icon} size={14} color={theme.textMuted} />
                    <Text style={styles.whyPillText}>{badge.text}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ─── TOP PICKS FOR YOU ─── */}
          <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.topPicksSection}>
            <Text style={styles.topPicksTitle}>Top picks for you</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topPicksScroll}
            >
              {TOP_PICKS.map((pick, i) => (
                <Animated.View
                  key={pick.id}
                  entering={FadeInRight.delay(550 + i * 100).duration(400)}
                >
                  <Pressable
                    style={({ pressed }) => [styles.pickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                    onPress={() => handleAskGenie(pick.name)}
                  >
                    {pick.verified ? (
                      <View style={styles.pickVerifiedBadge}>
                        <MaterialIcons name="verified" size={11} color={theme.success} />
                        <Text style={styles.pickVerifiedText}>Verified</Text>
                      </View>
                    ) : null}
                    <View style={styles.pickEmojiContainer}>
                      <Text style={styles.pickEmoji}>{pick.emoji}</Text>
                    </View>
                    <Text style={styles.pickName} numberOfLines={1}>{pick.name}</Text>
                    <Text style={styles.pickRestaurant} numberOfLines={1}>{pick.restaurant}</Text>
                    <Text style={styles.pickReason} numberOfLines={2}>{pick.reason}</Text>
                    <View style={styles.pickFooter}>
                      <Text style={styles.pickTotal}>Est. ₹{pick.total}</Text>
                      <View style={styles.pickOrderBtn}>
                        <MaterialIcons name="storefront" size={11} color={theme.primary} />
                        <Text style={styles.pickOrderText}>Order</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ─── EXPLORE YOUR WAY ─── */}
          <Animated.View entering={FadeInUp.delay(650).duration(400)} style={styles.exploreSection}>
            <Text style={styles.exploreSectionTitle}>Explore your way</Text>
            <View style={styles.exploreCards}>
              <Pressable
                style={({ pressed }) => [styles.exploreCard, pressed && styles.exploreCardPressed]}
                onPress={() => router.push('/explore')}
              >
                <View style={styles.exploreCardLeft}>
                  <View style={styles.exploreCardIconWrap}>
                    <MaterialIcons name="restaurant-menu" size={22} color={theme.primary} />
                  </View>
                  <View style={styles.exploreCardText}>
                    <Text style={styles.exploreCardTitle}>Explore Dishes</Text>
                    <Text style={styles.exploreCardSub}>Browse categories & cuisines</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.exploreCard, pressed && styles.exploreCardPressed]}
                onPress={() => router.push('/explore')}
              >
                <View style={styles.exploreCardLeft}>
                  <View style={styles.exploreCardIconWrap}>
                    <MaterialIcons name="storefront" size={22} color={theme.primary} />
                  </View>
                  <View style={styles.exploreCardText}>
                    <Text style={styles.exploreCardTitle}>Explore Restaurants</Text>
                    <Text style={styles.exploreCardSub}>Top rated & reliable kitchens</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <ModePromptModal
        visible={showModePrompt}
        onClose={() => setShowModePrompt(false)}
        onSelectMode={handleModeSelect}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '700', color: theme.textPrimary },
  subGreeting: { fontSize: 15, color: theme.textSecondary, marginTop: 4 },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },

  // ── Hero ──
  heroOuter: {
    marginHorizontal: 16,
    marginBottom: 32,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 40,
  },
  heroCard: {
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.22)',
    padding: 24,
    ...theme.shadows.cardElevated,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  genieAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  genieMascot: { width: 38, height: 38 },
  heroTitleBlock: { flex: 1 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.primary, letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 3 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  modeBadgeText: { fontSize: 11, fontWeight: '700', color: theme.primary },

  // Input row
  heroInputRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  heroInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39,39,42,0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.6)',
    paddingHorizontal: 14,
  },
  heroInputIcon: { marginRight: 8 },
  heroInput: { flex: 1, fontSize: 15, color: theme.textPrimary, paddingVertical: 14 },
  heroCTA: { borderRadius: 14, overflow: 'hidden' },
  heroCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  heroCTAText: { fontSize: 14, fontWeight: '700', color: theme.textOnPrimary },
  heroHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 18,
    paddingLeft: 2,
    fontStyle: 'italic',
  },

  // Chips
  chipsOuter: { marginHorizontal: -24 },
  chipsContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 24 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31,31,31,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.5)',
  },
  chipSelected: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.5)',
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipLabelSelected: { color: theme.primary, fontWeight: '600' },

  // ── Why FoodGenie ──
  whySection: { marginBottom: 32, paddingHorizontal: 20 },
  whySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  whyBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  whyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(31,31,31,0.45)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.25)',
  },
  whyPillText: { fontSize: 12, fontWeight: '500', color: theme.textMuted },

  // ── Top Picks ──
  topPicksSection: { marginBottom: 28 },
  topPicksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  topPicksScroll: { paddingHorizontal: 20, gap: 12 },
  pickCard: {
    width: 200,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
    ...theme.shadows.card,
  },
  pickEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickEmoji: { fontSize: 22 },
  pickName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 2 },
  pickRestaurant: { fontSize: 12, color: theme.textMuted, marginBottom: 8 },
  pickReason: { fontSize: 12, color: theme.textSecondary, lineHeight: 17, marginBottom: 14, minHeight: 34 },
  pickFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(63,63,70,0.3)',
    paddingTop: 12,
  },
  pickTotal: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
  pickVerifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    zIndex: 1,
  },
  pickVerifiedText: { fontSize: 9, fontWeight: '700', color: theme.success, letterSpacing: 0.3 },
  pickOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  pickOrderText: { fontSize: 10, fontWeight: '600', color: theme.primary },

  // ── Explore Your Way ──
  exploreSection: { paddingHorizontal: 20, marginTop: 12, marginBottom: 16 },
  exploreSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 14,
  },
  exploreCards: { gap: 12 },
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.18)',
  },
  exploreCardPressed: {
    backgroundColor: 'rgba(30,30,30,1)',
    borderColor: 'rgba(251,191,36,0.4)',
    transform: [{ scale: 0.98 }],
  },
  exploreCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  exploreCardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
  },
  exploreCardText: { flex: 1 },
  exploreCardTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  exploreCardSub: { fontSize: 13, color: theme.textSecondary, marginTop: 3 },
});
