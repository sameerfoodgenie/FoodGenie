import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import ModePromptModal from '../../components/ModePromptModal';

const QUICK_SUGGESTIONS = [
  { label: 'Something spicy', emoji: '🌶️' },
  { label: 'Light & healthy', emoji: '🥗' },
  { label: 'Under ₹200', emoji: '💰' },
  { label: 'Comfort food', emoji: '🍛' },
  { label: 'Quick bite', emoji: '⚡' },
  { label: 'Chef special', emoji: '👨‍🍳' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, updateMode, prefsLoaded, setCurrentQuery } = useApp();
  const [showExplore, setShowExplore] = useState(false);
  const [showModePrompt, setShowModePrompt] = useState(false);
  const [query, setQuery] = useState('');
  const hasRedirected = useRef(false);
  const isNavigating = useRef(false);

  // Mode prompt after 5 sessions
  useEffect(() => {
    if (prefsLoaded && preferences.sessionCount === 5 && preferences.mode === 'guided') {
      const timer = setTimeout(() => setShowModePrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [prefsLoaded, preferences.sessionCount, preferences.mode]);

  // Onboarding redirect
  useEffect(() => {
    if (!prefsLoaded) return;
    if (preferences.onboardingComplete) {
      hasRedirected.current = false;
      return;
    }
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    const timer = setTimeout(() => {
      try { router.push('/onboarding'); } catch (e) { console.log('Nav error:', e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [prefsLoaded, preferences.onboardingComplete]);

  const handleAskGenie = useCallback((text?: string) => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    if (!preferences.onboardingComplete) {
      try { router.push('/onboarding'); } catch (e) { console.log(e); }
      setTimeout(() => { isNavigating.current = false; }, 2000);
      return;
    }

    const finalQuery = text || query.trim();
    setCurrentQuery(finalQuery);
    setQuery('');

    setTimeout(() => {
      try { router.push('/ai-thinking'); } catch (e) { console.log(e); }
      setTimeout(() => { isNavigating.current = false; }, 2000);
    }, 150);
  }, [preferences.onboardingComplete, query]);

  const handleChipPress = useCallback((label: string) => {
    handleAskGenie(label);
  }, [handleAskGenie]);

  const handleModeSelect = useCallback(async (mode: 'quick' | 'guided') => {
    try { await updateMode(mode); } catch { /* ignore */ }
  }, [updateMode]);

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

          {/* Main Ask Card */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.02)', 'transparent']}
              style={styles.askCard}
            >
              <View style={styles.askCardHeader}>
                <View style={styles.genieAvatar}>
                  <Image
                    source={require('../../assets/images/genie-mascot.png')}
                    style={styles.genieMascot}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.askCardTitle}>
                  <Text style={styles.askTitle}>Ask FoodGenie</Text>
                  <Text style={styles.askSubtitle}>
                    {preferences.mode === 'quick'
                      ? 'Instant best match for you'
                      : 'Tell me what you are craving'}
                  </Text>
                </View>
                {preferences.mode === 'quick' ? (
                  <View style={styles.modeBadge}>
                    <MaterialIcons name="flash-on" size={12} color={theme.primary} />
                    <Text style={styles.modeBadgeText}>Quick</Text>
                  </View>
                ) : null}
              </View>

              {/* Input Area */}
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="search" size={20} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.queryInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="e.g. something spicy under ₹300..."
                    placeholderTextColor={theme.textMuted}
                    returnKeyType="search"
                    onSubmitEditing={() => handleAskGenie()}
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.sendButton,
                    pressed && styles.sendButtonPressed,
                  ]}
                  onPress={() => handleAskGenie()}
                >
                  <LinearGradient
                    colors={theme.gradients.genie}
                    style={styles.sendButtonGradient}
                  >
                    <MaterialIcons name="auto-awesome" size={22} color={theme.textOnPrimary} />
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Quick Suggestion Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
                style={styles.chipsScroll}
              >
                {QUICK_SUGGESTIONS.map((chip) => (
                  <Pressable
                    key={chip.label}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => handleChipPress(chip.label)}
                  >
                    <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                    <Text style={styles.chipLabel}>{chip.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </LinearGradient>
          </Animated.View>

          {/* How it works section */}
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.howSection}>
            <Text style={styles.sectionTitle}>How FoodGenie works</Text>
            <View style={styles.stepsRow}>
              {[
                { icon: 'chat', label: 'Tell your craving', color: 'rgba(251, 191, 36, 0.15)' },
                { icon: 'psychology', label: 'AI finds matches', color: 'rgba(34, 197, 94, 0.15)' },
                { icon: 'delivery-dining', label: 'Order via partners', color: 'rgba(59, 130, 246, 0.15)' },
              ].map((step, i) => (
                <Animated.View
                  key={step.label}
                  entering={FadeInUp.delay(500 + i * 100).duration(400)}
                  style={styles.stepCard}
                >
                  <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                    <MaterialIcons name={step.icon as any} size={22} color={theme.textPrimary} />
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Explore manually */}
          <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.exploreSection}>
            <Pressable
              onPress={() => setShowExplore(!showExplore)}
              style={styles.exploreLink}
            >
              <Text style={styles.exploreLinkText}>Explore manually</Text>
              <MaterialIcons
                name={showExplore ? 'expand-less' : 'chevron-right'}
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>

            {showExplore ? (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.exploreOptions}>
                <Pressable
                  style={({ pressed }) => [styles.exploreOption, pressed && styles.exploreOptionPressed]}
                  onPress={() => { setShowExplore(false); router.push('/recommendations'); }}
                >
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.04)']}
                    style={styles.exploreOptionIcon}
                  >
                    <MaterialIcons name="restaurant-menu" size={20} color={theme.primary} />
                  </LinearGradient>
                  <View style={styles.exploreOptionContent}>
                    <Text style={styles.exploreOptionText}>Explore Dishes</Text>
                    <Text style={styles.exploreOptionSub}>Browse all available dishes</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.exploreOption, pressed && styles.exploreOptionPressed]}
                  onPress={() => { setShowExplore(false); router.push('/daily-meals'); }}
                >
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.04)']}
                    style={styles.exploreOptionIcon}
                  >
                    <MaterialIcons name="storefront" size={20} color={theme.primary} />
                  </LinearGradient>
                  <View style={styles.exploreOptionContent}>
                    <Text style={styles.exploreOptionText}>Explore Restaurants</Text>
                    <Text style={styles.exploreOptionSub}>Daily meals and menus</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                </Pressable>
              </Animated.View>
            ) : null}
          </Animated.View>

          {/* Trust line */}
          <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.trustLine}>
            <View style={styles.trustBadge}>
              <MaterialIcons name="verified" size={14} color={theme.success} />
              <Text style={styles.trustText}>Chef-verified kitchens</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustBadge}>
              <MaterialIcons name="shield" size={14} color={theme.primary} />
              <Text style={styles.trustText}>Fair pricing</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Mode prompt */}
      <ModePromptModal
        visible={showModePrompt}
        onClose={() => setShowModePrompt(false)}
        onSelectMode={handleModeSelect}
      />
    </KeyboardAvoidingView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
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
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },

  // Ask Card
  askCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.12)',
    padding: 20,
    marginBottom: 28,
  },
  askCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  genieAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  genieMascot: { width: 36, height: 36 },
  askCardTitle: { flex: 1 },
  askTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
  },
  askSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  modeBadgeText: { fontSize: 11, fontWeight: '700', color: theme.primary },

  // Input
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  queryInput: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
    paddingVertical: 14,
  },
  sendButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  sendButtonPressed: { opacity: 0.8 },
  sendButtonGradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },

  // Chips
  chipsScroll: { marginHorizontal: -20 },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipPressed: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },

  // How it works
  howSection: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 14,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepCard: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Explore
  exploreSection: { marginBottom: 24 },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  exploreLinkText: { fontSize: 15, color: theme.textSecondary, fontWeight: '500' },
  exploreOptions: { gap: 10, marginTop: 8 },
  exploreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.08)',
  },
  exploreOptionPressed: {
    backgroundColor: theme.backgroundTertiary,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  exploreOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreOptionContent: { flex: 1 },
  exploreOptionText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  exploreOptionSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

  // Trust
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  trustDivider: {
    width: 1,
    height: 14,
    backgroundColor: theme.border,
  },
});
