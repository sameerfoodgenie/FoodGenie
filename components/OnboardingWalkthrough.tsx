import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORAGE_KEY = 'foodgenie_onboarding_complete';

// ── Onboarding Steps ──
interface OnboardingStep {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: { icon: string; text: string; color: string }[];
  image: any;
  gradient: [string, string, string];
  bgPattern: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    emoji: '🍽️',
    title: 'Welcome to FoodGenie',
    subtitle: 'Your Social Food Companion',
    description: 'Discover food, plan meals, book cooks, and earn rewards — all in one place.',
    highlights: [
      { icon: 'local-fire-department', text: 'Swipe through food content', color: '#FF6B6B' },
      { icon: 'auto-awesome', text: 'AI plans your meals', color: '#818CF8' },
      { icon: 'person', text: 'Book verified home cooks', color: '#D4AF37' },
    ],
    image: require('../assets/images/demo-home.png'),
    gradient: ['#1a1510', '#0A0A0F', '#0A0A0F'],
    bgPattern: '✨',
  },
  {
    id: 'feed',
    emoji: '🔥',
    title: 'Foodies Feed',
    subtitle: 'Swipe. React. Discover.',
    description: 'Vertical swipe cards showing the best food around you. React with Craving, Must Try, or Loved It.',
    highlights: [
      { icon: 'swipe-vertical', text: 'Swipe to discover new dishes', color: '#FF6B6B' },
      { icon: 'emoji-emotions', text: 'React with 3 unique emojis', color: '#FFD700' },
      { icon: 'people', text: 'Follow your favorite creators', color: '#4ADE80' },
    ],
    image: require('../assets/images/demo-feed.png'),
    gradient: ['#1a0f0f', '#0A0A0F', '#0A0A0F'],
    bgPattern: '🤤',
  },
  {
    id: 'ai-planner',
    emoji: '🤖',
    title: 'AI Meal Planner',
    subtitle: 'What to eat today? AI decides.',
    description: 'Get personalized daily, weekly & monthly meal plans based on your diet, budget, and health goals.',
    highlights: [
      { icon: 'restaurant-menu', text: 'Daily breakfast-lunch-dinner plans', color: '#818CF8' },
      { icon: 'monitor-heart', text: 'Nutrition & calorie tracking', color: '#4ADE80' },
      { icon: 'chat', text: 'Chat with AI for custom plans', color: '#A855F7' },
    ],
    image: require('../assets/images/demo-meal-planner.png'),
    gradient: ['#0f0f1a', '#0A0A0F', '#0A0A0F'],
    bgPattern: '🧠',
  },
  {
    id: 'cook',
    emoji: '👨‍🍳',
    title: 'Book a Home Cook',
    subtitle: 'Verified chefs at your doorstep.',
    description: 'Browse rated home cooks, watch video reviews, and book for daily, weekly or monthly cooking.',
    highlights: [
      { icon: 'verified', text: 'Verified & rated cook profiles', color: '#D4AF37' },
      { icon: 'videocam', text: 'Real customer video reviews', color: '#FF6B6B' },
      { icon: 'event', text: 'Flexible booking calendar', color: '#818CF8' },
    ],
    image: require('../assets/images/demo-cook-booking.png'),
    gradient: ['#1a1510', '#0A0A0F', '#0A0A0F'],
    bgPattern: '🍳',
  },
  {
    id: 'coins',
    emoji: '🪙',
    title: 'Earn Genie Coins',
    subtitle: 'Every action earns rewards.',
    description: 'Post meals, react to food, maintain streaks, and refer friends — collect coins for real rewards.',
    highlights: [
      { icon: 'add-a-photo', text: 'Post food = +20 coins', color: '#FFD700' },
      { icon: 'local-fire-department', text: 'Daily login streak bonus', color: '#FF6B6B' },
      { icon: 'redeem', text: 'Redeem for cook trials & more', color: '#4ADE80' },
    ],
    image: require('../assets/images/demo-coins.png'),
    gradient: ['#0f1a10', '#0A0A0F', '#0A0A0F'],
    bgPattern: '💰',
  },
];

// ── Pulsing Dot Component ──
function PulsingDot({ color, delay = 0 }: { color: string; delay?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(
      withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    opacity.value = withDelay(delay, withRepeat(
      withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    return () => { cancelAnimation(scale); cancelAnimation(opacity); };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: color,
    }, animStyle]} />
  );
}

// ── Progress Bar ──
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.progressSegment]}>
          <View style={[
            styles.progressTrack,
            i <= current ? { backgroundColor: '#D4AF37' } : { backgroundColor: 'rgba(255,255,255,0.1)' },
            i === current && { backgroundColor: '#FFD700' },
          ]} />
        </View>
      ))}
    </View>
  );
}

// ── Hook ──
export function useOnboardingStatus() {
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      setHasCompleted(val === 'true');
    });
  }, []);

  const markComplete = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setHasCompleted(true);
  }, []);

  return { hasCompleted, markComplete };
}

// ── Main Component ──
export default function OnboardingWalkthrough({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;
  const isFirst = step === 0;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      onComplete();
    } else {
      setStep(prev => prev + 1);
    }
  }, [step, isLast, onComplete]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    onComplete();
  }, [onComplete]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      Haptics.selectionAsync();
      setStep(prev => prev - 1);
    }
  }, [step]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <LinearGradient
        colors={current.gradient}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Background decorative elements */}
      <View style={styles.bgDecor}>
        <PulsingDot color={current.highlights[0]?.color + '08'} delay={0} />
        <PulsingDot color={current.highlights[1]?.color + '06'} delay={500} />
      </View>

      {/* Header: Skip + Progress */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {!isFirst ? (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={handleBack}
          >
            <MaterialIcons name="arrow-back-ios" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>
        ) : <View style={{ width: 40 }} />}

        <ProgressBar current={step} total={ONBOARDING_STEPS.length} />

        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>{isLast ? '' : 'Skip'}</Text>
        </Pressable>
      </View>

      {/* Main Content - Key visual */}
      <ScrollView
        key={current.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        bounces={false}
      >
        {/* App Screenshot */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.imageSection}>
          <View style={styles.phoneFrame}>
            <View style={styles.phoneNotch} />
            <Image
              source={current.image}
              style={styles.phoneScreen}
              contentFit="cover"
              transition={400}
            />
            {/* Glow effect behind phone */}
            <View style={[styles.phoneGlow, { backgroundColor: current.highlights[0]?.color + '15' }]} />
          </View>
        </Animated.View>

        {/* Emoji + Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.titleSection}>
          <View style={styles.emojiRow}>
            <Text style={styles.stepEmoji}>{current.emoji}</Text>
            <View style={styles.stepCounter}>
              <Text style={styles.stepCounterText}>{step + 1}/{ONBOARDING_STEPS.length}</Text>
            </View>
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.descSection}>
          <Text style={styles.description}>{current.description}</Text>
        </Animated.View>

        {/* Feature Highlights */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.highlightsSection}>
          {current.highlights.map((h, i) => (
            <Animated.View
              key={i}
              entering={FadeInLeft.delay(450 + i * 100).duration(350)}
              style={styles.highlightCard}
            >
              <View style={[styles.highlightIcon, { backgroundColor: h.color + '15' }]}>
                <MaterialIcons name={h.icon as any} size={20} color={h.color} />
              </View>
              <Text style={styles.highlightText}>{h.text}</Text>
              <MaterialIcons name="check-circle" size={16} color={h.color + '80'} />
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Area */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={isLast ? ['#4ADE80', '#22C55E'] : ['#D4AF37', '#FFD700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {isLast ? "Let's Go!" : isFirst ? 'Show Me Around' : 'Next Feature'}
            </Text>
            <MaterialIcons
              name={isLast ? 'rocket-launch' : 'arrow-forward'}
              size={20}
              color="#0A0A0A"
            />
          </LinearGradient>
        </Pressable>

        {/* Swipe hint */}
        {!isLast ? (
          <Animated.View entering={FadeIn.delay(800).duration(400)} style={styles.swipeHint}>
            <View style={styles.swipeHintDots}>
              {ONBOARDING_STEPS.map((_, i) => (
                <View key={i} style={[
                  styles.hintDot,
                  i === step && styles.hintDotActive,
                ]} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },

  bgDecor: {
    position: 'absolute',
    top: SCREEN_H * 0.1,
    left: -40,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skipBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },

  // Progress
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 16,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressTrack: {
    height: '100%',
    borderRadius: 2,
  },

  // Main Content
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // Phone Frame
  imageSection: {
    marginTop: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  phoneFrame: {
    width: SCREEN_W * 0.6,
    height: SCREEN_H * 0.32,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#1A1A1A',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  phoneNotch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 2,
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
  },
  phoneGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 44,
    zIndex: -1,
  },

  // Title
  titleSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepEmoji: {
    fontSize: 36,
  },
  stepCounter: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Description
  descSection: {
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Highlights
  highlightsSection: {
    width: '100%',
    gap: 10,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  // Bottom
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(10,10,15,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: SCREEN_W - 48,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  swipeHint: {
    alignItems: 'center',
  },
  swipeHintDots: {
    flexDirection: 'row',
    gap: 6,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  hintDotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
});
