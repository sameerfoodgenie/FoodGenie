import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Demo Steps ──
interface DemoStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  gradient: [string, string];
  features: string[];
  stats?: { label: string; value: string }[];
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'feed',
    title: 'Discover Food',
    subtitle: 'TikTok-style Feed',
    description: 'Swipe through mouthwatering food cards. React with emotions, save favorites, and discover new dishes daily.',
    emoji: '🍽️',
    gradient: ['#FF6B6B', '#FF8E53'],
    features: ['Vertical swipe feed', 'Emoji reactions (Craving, Must Try, Loved)', 'Double-tap to react', 'Creator profiles & follow'],
    stats: [
      { label: 'Food Cards', value: '500+' },
      { label: 'Reactions/Day', value: '12K' },
      { label: 'Creators', value: '150+' },
    ],
  },
  {
    id: 'ai-meal',
    title: 'AI Meal Planner',
    subtitle: 'Powered by Gemini AI',
    description: 'Get personalized daily, weekly, and monthly meal plans with nutrition tracking and calorie goals.',
    emoji: '🤖',
    gradient: ['#818CF8', '#6366F1'],
    features: ['Daily meal suggestions', 'Weekly & monthly plans', 'Nutrition rings & macros', 'ChatGPT-style meal planning'],
    stats: [
      { label: 'Plans Generated', value: '8K+' },
      { label: 'Accuracy', value: '94%' },
      { label: 'Cuisines', value: '25+' },
    ],
  },
  {
    id: 'cook',
    title: 'Book a Cook',
    subtitle: 'Expert Home Chefs',
    description: 'Hire verified home cooks for daily, weekly, or monthly plans. Video reviews, calendar booking, and direct chat.',
    emoji: '👨‍🍳',
    gradient: ['#D4AF37', '#FFD700'],
    features: ['Verified cook profiles', 'Video customer reviews', 'Weekly calendar booking', 'Daily/Weekly/Monthly plans'],
    stats: [
      { label: 'Cooks', value: '50+' },
      { label: 'Avg Rating', value: '4.8' },
      { label: 'Bookings', value: '2K+' },
    ],
  },
  {
    id: 'coins',
    title: 'Earn & Reward',
    subtitle: 'Gamified Engagement',
    description: 'Earn Genie Coins for every action — posting, liking, sharing, booking cooks, and generating meal plans.',
    emoji: '🪙',
    gradient: ['#4ADE80', '#22C55E'],
    features: ['Post food +20 coins', 'Like & share +1-10 coins', 'Book a cook +15 coins', 'Daily login streaks'],
    stats: [
      { label: 'Coins Distributed', value: '1.2M' },
      { label: 'Active Earners', value: '5K+' },
      { label: 'Redemptions', value: '800+' },
    ],
  },
  {
    id: 'grocery',
    title: 'Smart Grocery',
    subtitle: 'Budget-Optimized Shopping',
    description: 'AI bundles your grocery list by budget. Integrates with Zepto, Blinkit, and Swiggy Instamart for one-tap ordering.',
    emoji: '🛒',
    gradient: ['#F59E0B', '#D97706'],
    features: ['Budget-based bundling', 'Partner app integration', 'Weekly/monthly planning', 'Price comparison'],
    stats: [
      { label: 'Avg Savings', value: '18%' },
      { label: 'Partner Apps', value: '3' },
      { label: 'Lists Created', value: '4K+' },
    ],
  },
];

const AUTO_ADVANCE_MS = 6000;

// ── Animated Phone Mockup ──
function PhoneMockup({ step, isActive }: { step: DemoStep; isActive: boolean }) {
  const cardY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isActive) {
      // Simulate swipe animation
      cardY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500 }),
          withTiming(-40, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        ),
        -1,
        false,
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(cardY);
      cancelAnimation(pulseScale);
      cancelAnimation(dotOpacity);
      cardY.value = 0;
      pulseScale.value = 1;
      dotOpacity.value = 0.3;
    }
  }, [isActive]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const dotAnimStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={mock.container}>
      {/* Phone frame */}
      <View style={mock.phone}>
        <LinearGradient
          colors={[step.gradient[0] + '20', step.gradient[1] + '10']}
          style={mock.phoneScreen}
        >
          {/* Notch */}
          <View style={mock.notch} />

          {/* Animated content */}
          <Animated.View style={[mock.cardStack, cardAnimStyle]}>
            {/* Main emoji */}
            <Animated.View style={[mock.emojiCircle, pulseAnimStyle, { backgroundColor: step.gradient[0] + '25' }]}>
              <Text style={mock.emojiText}>{step.emoji}</Text>
            </Animated.View>

            {/* Feature lines */}
            {step.features.slice(0, 3).map((feat, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.delay(300 + i * 150).duration(400)}
                style={[mock.featureLine, { backgroundColor: step.gradient[0] + '12' }]}
              >
                <View style={[mock.featureDot, { backgroundColor: step.gradient[0] }]} />
                <Text style={[mock.featureText, { color: step.gradient[0] }]} numberOfLines={1}>{feat}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Animated dots at bottom */}
          <Animated.View style={[mock.dotsRow, dotAnimStyle]}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[mock.dot, { backgroundColor: step.gradient[0] }]} />
            ))}
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Glow effect */}
      <View style={[mock.glow, { backgroundColor: step.gradient[0], shadowColor: step.gradient[0] }]} />
    </View>
  );
}

// ── Stat Card ──
function StatCard({ label, value, delay, gradient }: { label: string; value: string; delay: number; gradient: [string, string] }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={[stat.card, { borderColor: gradient[0] + '30' }]}>
      <Text style={[stat.value, { color: gradient[0] }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function AppDemoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressWidth = useSharedValue(0);

  const step = DEMO_STEPS[currentStep];

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying) {
      cancelAnimation(progressWidth);
      return;
    }

    progressWidth.value = 0;
    progressWidth.value = withTiming(1, { duration: AUTO_ADVANCE_MS, easing: Easing.linear });

    timerRef.current = setTimeout(() => {
      goToNext();
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isAutoPlaying]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIdx = (currentStep + 1) % DEMO_STEPS.length;
    setTimeout(() => {
      setCurrentStep(nextIdx);
      setIsTransitioning(false);
    }, 150);
  }, [currentStep, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIdx = currentStep === 0 ? DEMO_STEPS.length - 1 : currentStep - 1;
    setTimeout(() => {
      setCurrentStep(prevIdx);
      setIsTransitioning(false);
    }, 150);
  }, [currentStep, isTransitioning]);

  const goToStep = useCallback((idx: number) => {
    if (idx === currentStep || isTransitioning) return;
    Haptics.selectionAsync();
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setCurrentStep(idx);
      setIsTransitioning(false);
      // Restart auto-play after manual navigation
      setTimeout(() => setIsAutoPlaying(true), 2000);
    }, 150);
  }, [currentStep, isTransitioning]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoPlaying(false);
    goToNext();
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, [goToNext]);

  const handlePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoPlaying(false);
    goToPrev();
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, [goToPrev]);

  const toggleAutoPlay = useCallback(() => {
    Haptics.selectionAsync();
    setIsAutoPlaying(prev => !prev);
  }, []);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View style={[s.container, { backgroundColor: isDark ? '#0A0A12' : '#FAFAFA' }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>FoodGenie Demo</Text>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>
            {currentStep + 1} of {DEMO_STEPS.length}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.7 }]}
          onPress={toggleAutoPlay}
        >
          <MaterialIcons
            name={isAutoPlaying ? 'pause' : 'play-arrow'}
            size={22}
            color={isAutoPlaying ? step.gradient[0] : colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={s.progressRow}>
        {DEMO_STEPS.map((ds, i) => (
          <Pressable key={ds.id} style={s.progressSegment} onPress={() => goToStep(i)}>
            <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              {i < currentStep ? (
                <View style={[s.progressFill, { backgroundColor: ds.gradient[0], width: '100%' }]} />
              ) : i === currentStep ? (
                <Animated.View style={[s.progressFill, { backgroundColor: ds.gradient[0] }, progressAnimStyle]} />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <Animated.View
        key={step.id}
        entering={FadeIn.duration(350)}
        style={s.content}
      >
        {/* Phone Mockup */}
        <PhoneMockup step={step} isActive={!isTransitioning} />

        {/* Info section */}
        <View style={s.infoSection}>
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={s.titleRow}>
            <LinearGradient
              colors={step.gradient}
              style={s.stepBadge}
            >
              <Text style={s.stepBadgeText}>{step.subtitle}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(200).duration(350)}
            style={[s.title, { color: colors.textPrimary }]}
          >
            {step.title}
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(350)}
            style={[s.description, { color: colors.textSecondary }]}
          >
            {step.description}
          </Animated.Text>

          {/* Stats */}
          {step.stats ? (
            <View style={s.statsRow}>
              {step.stats.map((st, i) => (
                <StatCard key={st.label} label={st.label} value={st.value} delay={400 + i * 100} gradient={step.gradient} />
              ))}
            </View>
          ) : null}

          {/* Features list */}
          <View style={s.featuresWrap}>
            {step.features.map((feat, i) => (
              <Animated.View
                key={feat}
                entering={FadeInDown.delay(500 + i * 80).duration(300)}
                style={s.featureRow}
              >
                <View style={[s.featureCheck, { backgroundColor: step.gradient[0] + '18' }]}>
                  <MaterialIcons name="check" size={14} color={step.gradient[0]} />
                </View>
                <Text style={[s.featureText, { color: colors.textSecondary }]}>{feat}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Navigation */}
      <View style={[s.navRow, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.7 }]}
          onPress={handlePrev}
        >
          <MaterialIcons name="chevron-left" size={28} color={colors.textMuted} />
        </Pressable>

        {/* Step dots */}
        <View style={s.dotsRow}>
          {DEMO_STEPS.map((ds, i) => (
            <Pressable key={ds.id} onPress={() => goToStep(i)} hitSlop={8}>
              <View style={[
                s.stepDot,
                i === currentStep && { width: 24, backgroundColor: ds.gradient[0] },
                i !== currentStep && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
              ]} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.7 }]}
          onPress={handleNext}
        >
          <MaterialIcons name="chevron-right" size={28} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ──
const mock = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_H * 0.32,
    position: 'relative',
  },
  phone: {
    width: 160,
    height: SCREEN_H * 0.28,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(100,100,100,0.25)',
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  phoneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  notch: {
    position: 'absolute',
    top: 6,
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignSelf: 'center',
  },
  cardStack: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emojiText: {
    fontSize: 30,
  },
  featureLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    width: '100%',
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 4,
    alignSelf: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.08,
    bottom: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 0,
  },
});

const stat = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(150,150,150,0.80)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  featuresWrap: {
    gap: 8,
    marginTop: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
