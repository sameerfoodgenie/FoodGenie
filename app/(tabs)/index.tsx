import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import ModePromptModal from '../../components/ModePromptModal';

function getScreenWidth() {
  try {
    const w = Dimensions.get('window').width;
    return w > 0 ? w : 375;
  } catch {
    return 375;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, updateMode, prefsLoaded, setCurrentQuery } = useApp();
  const [showExplore, setShowExplore] = useState(false);
  const [showModePrompt, setShowModePrompt] = useState(false);
  const [showGuidedPrompt, setShowGuidedPrompt] = useState(false);
  const [guidedQuery, setGuidedQuery] = useState('');
  const hasRedirected = useRef(false);
  const isNavigating = useRef(false);
  const [screenWidth, setScreenWidth] = useState(getScreenWidth);

  useEffect(() => {
    const update = () => {
      const w = Dimensions.get('window').width;
      if (w > 0) setScreenWidth(w);
    };
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  const RING_SIZE = Math.max(120, Math.min(screenWidth * 0.72, 310));
  const INNER_SIZE = Math.max(100, RING_SIZE - 16);
  const MASCOT_SIZE = Math.max(60, INNER_SIZE * 0.58);

  // Animations
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const rotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);
  const innerGlow = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(withSequence(
      withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
    ), -1, true);
    glowOpacity.value = withRepeat(withSequence(
      withTiming(1, { duration: 1500 }),
      withTiming(0.35, { duration: 1500 })
    ), -1, true);
    rotation.value = withRepeat(withTiming(360, { duration: 25000, easing: Easing.linear }), -1, false);
    sparkleScale.value = withRepeat(withSequence(
      withTiming(1.3, { duration: 800 }),
      withTiming(0.7, { duration: 800 })
    ), -1, true);
    pulseScale.value = withRepeat(withSequence(
      withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    ), -1, true);
    innerGlow.value = withRepeat(withSequence(
      withTiming(1, { duration: 1200 }),
      withTiming(0.3, { duration: 1200 })
    ), -1, true);
  }, []);

  // Mode prompt after 5 sessions
  useEffect(() => {
    if (prefsLoaded && preferences.sessionCount === 5 && preferences.mode === 'guided') {
      const timer = setTimeout(() => setShowModePrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [prefsLoaded, preferences.sessionCount, preferences.mode]);

  // Onboarding redirect - only once
  useEffect(() => {
    if (!prefsLoaded) return;
    if (preferences.onboardingComplete) {
      hasRedirected.current = false;
      return;
    }
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    const timer = setTimeout(() => {
      try {
        router.push('/onboarding');
      } catch (e) {
        console.log('Navigation error:', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [prefsLoaded, preferences.onboardingComplete]);

  const animatedFloat = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }, { translateY: floatY.value }],
  }));
  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: 1 + glowOpacity.value * 0.12 }],
  }));
  const animatedSparkle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: interpolate(sparkleScale.value, [0.7, 1.3], [0.5, 1]),
  }));
  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.08], [0.6, 0.2]),
  }));
  const animatedInnerGlow = useAnimatedStyle(() => ({
    opacity: innerGlow.value * 0.25,
  }));

  const handleAskGenie = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    pressScale.value = withSequence(withSpring(0.93, { damping: 12 }), withSpring(1, { damping: 10 }));

    if (!preferences.onboardingComplete) {
      try { router.push('/onboarding'); } catch (e) { console.log(e); }
      setTimeout(() => { isNavigating.current = false; }, 2000);
      return;
    }

    if (preferences.mode === 'quick') {
      setCurrentQuery('');
      try { router.push('/ai-thinking'); } catch (e) { console.log(e); }
      setTimeout(() => { isNavigating.current = false; }, 2000);
    } else {
      isNavigating.current = false;
      setShowGuidedPrompt(true);
    }
  }, [preferences.onboardingComplete, preferences.mode]);

  const handleGuidedSubmit = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setShowGuidedPrompt(false);
    setCurrentQuery(guidedQuery);
    setGuidedQuery('');
    // Small delay to let state settle before navigation
    setTimeout(() => {
      try { router.push('/ai-thinking'); } catch (e) { console.log(e); }
      setTimeout(() => { isNavigating.current = false; }, 2000);
    }, 150);
  }, [guidedQuery]);

  const handleVoiceInput = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setShowGuidedPrompt(false);
    try { router.push('/voice-chat'); } catch (e) { console.log(e); }
    setTimeout(() => { isNavigating.current = false; }, 2000);
  }, []);

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
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subGreeting}>What should we eat today?</Text>
            </View>
            <View style={styles.headerRight}>
              {preferences.mode === 'quick' ? (
                <View style={styles.modeBadge}>
                  <MaterialIcons name="flash-on" size={12} color={theme.primary} />
                  <Text style={styles.modeBadgeText}>Quick</Text>
                </View>
              ) : null}
              <Pressable style={styles.profileButton} onPress={() => router.push('/(tabs)/account')}>
                <MaterialIcons name="person" size={22} color={theme.primary} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Hero */}
          <View style={styles.heroContainer}>
            <Animated.View style={[styles.pulseRing, animatedPulse, { width: RING_SIZE + 50, height: RING_SIZE + 50, borderRadius: (RING_SIZE + 50) / 2 }]} />
            <Animated.View style={[styles.glowContainer, animatedGlow, { width: RING_SIZE + 120, height: RING_SIZE + 120 }]}>
              <LinearGradient
                colors={['rgba(251, 191, 36, 0)', 'rgba(251, 191, 36, 0.45)', 'rgba(245, 158, 11, 0.35)', 'rgba(251, 191, 36, 0)']}
                style={{ width: RING_SIZE + 120, height: RING_SIZE + 120, borderRadius: (RING_SIZE + 120) / 2 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Sparkles */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, animatedSparkle]}>
              <Text style={styles.sparkleEmoji}>✨</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, animatedSparkle]}>
              <Text style={styles.sparkleEmoji}>⭐</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, animatedSparkle]}>
              <Text style={styles.sparkleEmoji}>💫</Text>
            </Animated.View>

            {/* Ring button */}
            <Animated.View style={animatedFloat}>
              <Pressable onPress={handleAskGenie} style={({ pressed }) => [styles.genieButtonWrapper, pressed && { opacity: 0.9 }]}>
                <View style={[styles.outerRing, { borderRadius: RING_SIZE / 2 }]}>
                  <LinearGradient
                    colors={theme.gradients.goldShine}
                    style={[styles.genieButton, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.innerCircle, { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2 }]}>
                      <Animated.View style={[styles.innerGlowEffect, animatedInnerGlow, { borderRadius: INNER_SIZE / 2 }]} />
                      <Image source={require('../../assets/images/genie-mascot.png')} style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} contentFit="contain" />
                      <View style={[styles.micBadge, { bottom: INNER_SIZE * 0.1, right: INNER_SIZE * 0.1 }]}>
                        <LinearGradient colors={theme.gradients.gold} style={styles.micBadgeGradient}>
                          <MaterialIcons name="mic" size={18} color={theme.textOnPrimary} />
                        </LinearGradient>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.labelContainer}>
              <Text style={styles.genieLabel}>Ask FoodGenie</Text>
              <Text style={styles.genieSub}>
                {preferences.mode === 'quick' ? 'Tap for instant best match' : 'Tell me what you feel like eating'}
              </Text>
            </Animated.View>
          </View>

          {/* Explore link */}
          <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.exploreSection}>
            <Pressable onPress={() => setShowExplore(!showExplore)} style={styles.exploreLink}>
              <Text style={styles.exploreLinkText}>Explore manually</Text>
              <MaterialIcons name={showExplore ? 'expand-less' : 'arrow-forward'} size={16} color={theme.textSecondary} />
            </Pressable>

            {showExplore ? (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.exploreOptions}>
                <Pressable
                  style={({ pressed }) => [styles.exploreOption, pressed && styles.exploreOptionPressed]}
                  onPress={() => { setShowExplore(false); router.push('/recommendations'); }}
                >
                  <LinearGradient colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.04)']} style={styles.exploreOptionIcon}>
                    <MaterialIcons name="restaurant-menu" size={20} color={theme.primary} />
                  </LinearGradient>
                  <Text style={styles.exploreOptionText}>Explore Dishes</Text>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.exploreOption, pressed && styles.exploreOptionPressed]}
                  onPress={() => { setShowExplore(false); router.push('/daily-meals'); }}
                >
                  <LinearGradient colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.04)']} style={styles.exploreOptionIcon}>
                    <MaterialIcons name="storefront" size={20} color={theme.primary} />
                  </LinearGradient>
                  <Text style={styles.exploreOptionText}>Explore Restaurants</Text>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                </Pressable>
              </Animated.View>
            ) : null}
          </Animated.View>

          {/* Trust line */}
          <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.trustLine}>
            <MaterialIcons name="verified" size={14} color={theme.success} />
            <Text style={styles.trustText}>All kitchens chef-verified and hygiene-audited</Text>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Guided prompt modal */}
      <Modal visible={showGuidedPrompt} transparent animationType="slide">
        <View style={styles.guidedOverlay}>
          <View style={styles.guidedModal}>
            <View style={styles.guidedHeader}>
              <Text style={styles.guidedEmoji}>🧞‍♂️</Text>
              <Text style={styles.guidedTitle}>What are you craving?</Text>
              <Text style={styles.guidedHint}>Feeling adventurous or want something safe?</Text>
            </View>
            <TextInput
              style={styles.guidedInput}
              value={guidedQuery}
              onChangeText={setGuidedQuery}
              placeholder="e.g., something spicy and filling..."
              placeholderTextColor={theme.textMuted}
              multiline
              autoFocus
            />
            <View style={styles.guidedActions}>
              <Pressable style={styles.guidedVoice} onPress={handleVoiceInput}>
                <MaterialIcons name="mic" size={22} color={theme.primary} />
              </Pressable>
              <Pressable
                style={[styles.guidedSubmit, !guidedQuery.trim() && styles.guidedSubmitDisabled]}
                onPress={handleGuidedSubmit}
                disabled={!guidedQuery.trim()}
              >
                <LinearGradient
                  colors={guidedQuery.trim() ? theme.gradients.genie : [theme.border, theme.border]}
                  style={styles.guidedSubmitGradient}
                >
                  <Text style={styles.guidedSubmitText}>Find my meal</Text>
                  <MaterialIcons name="auto-awesome" size={18} color={guidedQuery.trim() ? theme.textOnPrimary : theme.textMuted} />
                </LinearGradient>
              </Pressable>
            </View>
            <Pressable style={styles.guidedCancel} onPress={() => setShowGuidedPrompt(false)}>
              <Text style={styles.guidedCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Mode prompt */}
      <ModePromptModal
        visible={showModePrompt}
        onClose={() => setShowModePrompt(false)}
        onSelectMode={handleModeSelect}
      />
    </View>
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
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16 },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
  subGreeting: { fontSize: 15, color: theme.textSecondary, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  modeBadgeText: { fontSize: 11, fontWeight: '700', color: theme.primary },
  profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundTertiary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.25)' },

  heroContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', paddingVertical: 20 },
  pulseRing: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(251, 191, 36, 0.25)' },
  glowContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute', zIndex: 5 },
  sparkle1: { top: 0, right: 20 },
  sparkle2: { bottom: 70, left: 10 },
  sparkle3: { top: 60, left: 5 },
  sparkleEmoji: { fontSize: 28 },
  genieButtonWrapper: { alignItems: 'center' },
  outerRing: { padding: 4, ...theme.shadows.genie },
  genieButton: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  innerCircle: { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)' },
  innerGlowEffect: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(251, 191, 36, 0.15)' },
  micBadge: { position: 'absolute', borderRadius: 22, overflow: 'hidden', ...theme.shadows.card },
  micBadgeGradient: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  labelContainer: { alignItems: 'center', marginTop: 20 },
  genieLabel: { fontSize: 26, fontWeight: '700', color: theme.primary, letterSpacing: 0.3 },
  genieSub: { fontSize: 14, color: theme.textSecondary, marginTop: 6 },

  exploreSection: { alignItems: 'center' },
  exploreLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  exploreLinkText: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
  exploreOptions: { width: '100%', gap: 10, marginTop: 8 },
  exploreOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.lg, padding: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.1)' },
  exploreOptionPressed: { backgroundColor: theme.backgroundTertiary, borderColor: 'rgba(251, 191, 36, 0.3)' },
  exploreOptionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  exploreOptionText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.textPrimary },

  trustLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 16 },
  trustText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },

  // Guided prompt
  guidedOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  guidedModal: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: theme.border },
  guidedHeader: { alignItems: 'center', marginBottom: 20 },
  guidedEmoji: { fontSize: 36, marginBottom: 8 },
  guidedTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  guidedHint: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  guidedInput: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border, minHeight: 56, textAlignVertical: 'top' },
  guidedActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  guidedVoice: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.25)' },
  guidedSubmit: { flex: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  guidedSubmitDisabled: { opacity: 0.5 },
  guidedSubmitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  guidedSubmitText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
  guidedCancel: { alignItems: 'center', marginTop: 16 },
  guidedCancelText: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
});
