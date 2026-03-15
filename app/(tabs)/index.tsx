
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

          {/* ─── PREFERENCE SUMMARY ─── */}
          {preferences.onboardingComplete ? (
            <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.prefSummarySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.prefSummaryContainer}
              >
                {preferences.diet ? (
                  <Pressable style={styles.prefChip} onPress={() => router.push('/(tabs)/preferences')}>
                    <Text style={styles.prefChipEmoji}>
                      {preferences.diet === 'veg' ? '🥬' : preferences.diet === 'egg' ? '🥚' : '🍗'}
                    </Text>
                    <Text style={styles.prefChipLabel}>
                      {preferences.diet === 'veg' ? 'Veg Only' : preferences.diet === 'egg' ? 'Egg' : 'Non-Veg'}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.prefChip} onPress={() => router.push('/(tabs)/preferences')}>
                  <Text style={styles.prefChipEmoji}>💰</Text>
                  <Text style={styles.prefChipLabel}>Under ₹{preferences.budgetMax}</Text>
                </Pressable>
                <Pressable style={styles.prefChip} onPress={() => router.push('/(tabs)/preferences')}>
                  <Text style={styles.prefChipEmoji}>
                    {preferences.spiceLevel === 1 ? '😌' : preferences.spiceLevel === 2 ? '🌶️' : '🔥'}
                  </Text>
                  <Text style={styles.prefChipLabel}>
                    {preferences.spiceLevel === 1 ? 'Mild' : preferences.spiceLevel === 2 ? 'Medium' : 'Spicy'}
                  </Text>
                </Pressable>
                {app.advancedPrefs.healthGoal && app.advancedPrefs.healthGoal !== 'none' ? (
                  <Pressable style={styles.prefChip} onPress={() => router.push('/(tabs)/preferences')}>
                    <Text style={styles.prefChipEmoji}>
                      {app.advancedPrefs.healthGoal === 'weight_loss' ? '⚖️' : app.advancedPrefs.healthGoal === 'muscle_gain' ? '💪' : '🧘'}
                    </Text>
                    <Text style={styles.prefChipLabel}>
                      {app.advancedPrefs.healthGoal === 'weight_loss' ? 'Weight Loss' : app.advancedPrefs.healthGoal === 'muscle_gain' ? 'High Protein' : 'Balanced'}
                    </Text>
                  </Pressable>
                ) : null}
                {app.advancedPrefs.deliveryPriority && app.advancedPrefs.deliveryPriority !== 'best_rated' ? (
                  <Pressable style={styles.prefChip} onPress={() => router.push('/(tabs)/preferences')}>
                    <Text style={styles.prefChipEmoji}>
                      {app.advancedPrefs.deliveryPriority === 'fastest' ? '⚡' : '✅'}
                    </Text>
                    <Text style={styles.prefChipLabel}>
                      {app.advancedPrefs.deliveryPriority === 'fastest' ? 'Fastest' : 'Reliable First'}
                    </Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* ─── EXPLORE YOUR WAY ─── */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.exploreSection}>
            <Pressable
              style={({ pressed }) => [styles.exploreCard, pressed && styles.exploreCardPressed]}
              onPress={() => router.push('/explore')}
            >
              <View style={styles.exploreCardLeft}>
                <View style={styles.exploreCardIconWrap}>
                  <MaterialIcons name="explore" size={26} color={theme.primary} />
                </View>
                <View style={styles.exploreCardText}>
                  <Text style={styles.exploreCardTitle}>Explore your way</Text>
                  <Text style={styles.exploreCardSub}>Browse dishes & restaurants</Text>
                </View>
              </View>
              <View style={styles.exploreArrowWrap}>
                <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
              </View>
            </Pressable>
          </Animated.View>

          {/* ─── SNAP & SHARE ─── */}
          <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.snapSection}>
            <Pressable
              style={({ pressed }) => [styles.snapCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => router.push('/snap-share')}
            >
              <View style={styles.snapCardInner}>
                <View style={styles.snapCardLeft}>
                  <View style={styles.snapIconWrap}>
                    <MaterialIcons name="camera-alt" size={22} color={theme.primary} />
                  </View>
                  <View style={styles.snapCardText}>
                    <Text style={styles.snapCardTitle}>Snap & Share your vibe</Text>
                    <Text style={styles.snapCardSub}>Share to Stories & unlock rewards</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
              </View>
            </Pressable>
          </Animated.View>

          {/* ─── WHY FOODGENIE ─── */}
          <Animated.View entering={FadeIn.delay(550).duration(400)} style={styles.whySection}>
            <Text style={styles.whySectionTitle}>Why FoodGenie</Text>
            <View style={styles.whyBadges}>
              {[
                { icon: 'verified' as const, text: 'Chef-verified kitchens' },
                { icon: 'shield' as const, text: 'Bias-free recommendations' },
                { icon: 'local-shipping' as const, text: 'Order via partners' },
              ].map((badge, i) => (
                <Animated.View
                  key={badge.text}
                  entering={FadeInRight.delay(600 + i * 80).duration(350)}
                >
                  <View style={styles.whyPill}>
                    <MaterialIcons name={badge.icon} size={14} color={theme.textSecondary} />
                    <Text style={styles.whyPillText}>{badge.text}</Text>
                  </View>
                </Animated.View>
              ))}
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
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.2)',
    ...theme.shadows.card,
  },

  // ── Hero ──
  heroOuter: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  heroCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
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
    backgroundColor: 'rgba(200,135,90,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(200,135,90,0.2)',
  },
  genieMascot: { width: 38, height: 38 },
  heroTitleBlock: { flex: 1 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.primary, letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 3 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(200,135,90,0.1)',
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
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipSelected: {
    backgroundColor: 'rgba(200,135,90,0.1)',
    borderColor: 'rgba(200,135,90,0.35)',
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipLabelSelected: { color: theme.primary, fontWeight: '600' },

  // ── Preference Summary ──
  prefSummarySection: { marginBottom: 8 },
  prefSummaryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(200,135,90,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
  },
  prefChipEmoji: { fontSize: 13 },
  prefChipLabel: { fontSize: 12, fontWeight: '600', color: theme.primary },

  // ── Why FoodGenie ──
  whySection: { marginBottom: 40, paddingHorizontal: 20, marginTop: 8 },
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
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  whyPillText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },

  // ── Snap & Share ──
  snapSection: { paddingHorizontal: 20, marginBottom: 8 },
  snapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
    backgroundColor: theme.surface,
    ...theme.shadows.card,
  },
  snapCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  snapCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  snapIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(200,135,90,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
  },
  snapCardText: { flex: 1 },
  snapCardTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  snapCardSub: { fontSize: 13, color: theme.textSecondary, marginTop: 3 },

  // ── Explore Your Way ──
  exploreSection: { paddingHorizontal: 20, marginBottom: 8 },
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
    ...theme.shadows.card,
  },
  exploreCardPressed: {
    backgroundColor: theme.backgroundSecondary,
    borderColor: 'rgba(200,135,90,0.3)',
    transform: [{ scale: 0.98 }],
  },
  exploreCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  exploreCardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(200,135,90,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
  },
  exploreArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreCardText: { flex: 1 },
  exploreCardTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
  exploreCardSub: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
});
