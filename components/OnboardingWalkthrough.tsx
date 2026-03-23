import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORAGE_KEY = 'foodgenie_onboarding_complete';

interface WalkthroughStep {
  type: 'fullscreen' | 'spotlight';
  title: string;
  description: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  emoji?: string;
  spotlightPosition?: { top: number; left: number; width: number; height: number; borderRadius: number };
  ctaText?: string;
}

const STEPS: WalkthroughStep[] = [
  {
    type: 'fullscreen',
    title: 'Welcome to FoodGenie',
    description: 'Post your meals. Discover food.\nBecome a creator.',
    emoji: '✨',
    ctaText: 'Start Journey',
  },
  {
    type: 'spotlight',
    title: 'Discover Food',
    description: 'Scroll to see what people are eating around you',
    icon: 'swipe',
    spotlightPosition: {
      top: SCREEN_H * 0.15,
      left: 16,
      width: SCREEN_W - 32,
      height: SCREEN_H * 0.45,
      borderRadius: 20,
    },
  },
  {
    type: 'spotlight',
    title: 'Post a Meal',
    description: 'Tap the + button to share your first meal',
    icon: 'add-circle',
    spotlightPosition: {
      top: SCREEN_H - 110,
      left: SCREEN_W / 2 - 38,
      width: 76,
      height: 76,
      borderRadius: 22,
    },
  },
  {
    type: 'spotlight',
    title: 'Record Recipes',
    description: 'Switch to Video mode and tap once to start recording',
    icon: 'videocam',
    spotlightPosition: {
      top: SCREEN_H * 0.55,
      left: SCREEN_W / 2 - 55,
      width: 110,
      height: 110,
      borderRadius: 55,
    },
  },
  {
    type: 'spotlight',
    title: 'Become a Creator',
    description: 'Post 5 meals to unlock Creator Mode — shows, live sessions & more',
    icon: 'auto-awesome',
    spotlightPosition: {
      top: SCREEN_H * 0.35,
      left: 20,
      width: SCREEN_W - 40,
      height: 140,
      borderRadius: 18,
    },
  },
  {
    type: 'spotlight',
    title: 'Learn & Discover',
    description: 'Find home chefs, live sessions & trending food shows',
    icon: 'school',
    spotlightPosition: {
      top: SCREEN_H - 90,
      left: SCREEN_W * 0.2,
      width: 60,
      height: 60,
      borderRadius: 30,
    },
  },
  {
    type: 'fullscreen',
    title: "You're All Set!",
    description: 'Start sharing your food journey today',
    emoji: '🚀',
    ctaText: 'Start Posting',
  },
];

function PulseRing({ position }: { position: NonNullable<WalkthroughStep['spotlightPosition']> }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.25, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: position.top - 6,
          left: position.left - 6,
          width: position.width + 12,
          height: position.height + 12,
          borderRadius: position.borderRadius + 6,
          borderWidth: 2,
          borderColor: '#D4AF37',
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === current && styles.stepDotActive,
            i < current && styles.stepDotDone,
          ]}
        />
      ))}
    </View>
  );
}

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

export default function OnboardingWalkthrough({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step >= STEPS.length - 1) {
      onComplete();
    } else {
      setStep(prev => prev + 1);
    }
  }, [step, onComplete]);

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

  // ─── Fullscreen Step ───
  if (current.type === 'fullscreen') {
    const isLast = step === STEPS.length - 1;
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <LinearGradient
          colors={['#0A0A0A', '#0D0D0D', '#0A0A0A']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Skip */}
        {!isLast ? (
          <Animated.View entering={FadeIn.delay(400).duration(300)} style={[styles.skipWrap, { top: insets.top + 16 }]}>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
              <MaterialIcons name="chevron-right" size={18} color="#6B6B6B" />
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={styles.fullscreenContent}>
          {/* Emoji/Icon */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View style={styles.fullscreenEmoji}>
              <Text style={{ fontSize: 56 }}>{current.emoji}</Text>
            </View>
          </Animated.View>

          {/* Gold accent line */}
          <Animated.View entering={FadeIn.delay(250).duration(300)} style={styles.accentLine} />

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.fullscreenTitle}>{current.title}</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Text style={styles.fullscreenDesc}>{current.description}</Text>
          </Animated.View>

          {/* Step indicator */}
          <Animated.View entering={FadeIn.delay(500).duration(300)}>
            <StepIndicator total={STEPS.length} current={step} />
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(550).duration(400)}>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
              onPress={handleNext}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.fullscreenCta}>
                <Text style={styles.fullscreenCtaText}>{current.ctaText}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#0A0A0A" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }

  // ─── Spotlight Step ───
  const spot = current.spotlightPosition!;

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
      key={`step-${step}`}
    >
      {/* Dimmed background */}
      <View style={styles.dimBg} />

      {/* Spotlight cutout (simulated with bordered view) */}
      <View
        style={[
          styles.spotlightCutout,
          {
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            borderRadius: spot.borderRadius,
          },
        ]}
      />
      <PulseRing position={spot} />

      {/* Skip button */}
      <View style={[styles.skipWrap, { top: insets.top + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
          <MaterialIcons name="chevron-right" size={18} color="#6B6B6B" />
        </Pressable>
      </View>

      {/* Tooltip card */}
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={[
          styles.tooltipCard,
          spot.top > SCREEN_H * 0.5
            ? { top: spot.top - 180 }
            : { top: spot.top + spot.height + 20 },
        ]}
      >
        <View style={styles.tooltipIconWrap}>
          <MaterialIcons name={current.icon || 'info'} size={24} color="#D4AF37" />
        </View>
        <Text style={styles.tooltipTitle}>{current.title}</Text>
        <Text style={styles.tooltipDesc}>{current.description}</Text>

        <StepIndicator total={STEPS.length} current={step} />

        <View style={styles.tooltipActions}>
          {step > 0 ? (
            <Pressable
              style={({ pressed }) => [styles.tooltipBackBtn, pressed && { opacity: 0.7 }]}
              onPress={handleBack}
            >
              <MaterialIcons name="arrow-back" size={18} color="#A0A0A0" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            onPress={handleNext}
          >
            <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.tooltipNextBtn}>
              <Text style={styles.tooltipNextText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#0A0A0A" />
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  dimBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },

  // Spotlight
  spotlightCutout: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.50)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Skip
  skipWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },

  // Fullscreen
  fullscreenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  fullscreenEmoji: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  accentLine: {
    width: 48,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D4AF37',
  },
  fullscreenTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  fullscreenDesc: {
    fontSize: 17,
    fontWeight: '500',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 26,
  },
  fullscreenCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 18,
    marginTop: 12,
  },
  fullscreenCtaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stepDotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
  },
  stepDotDone: {
    backgroundColor: 'rgba(212,175,55,0.35)',
  },

  // Tooltip
  tooltipCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#151515',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  tooltipIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  tooltipDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 22,
  },
  tooltipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  tooltipBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  tooltipNextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});
