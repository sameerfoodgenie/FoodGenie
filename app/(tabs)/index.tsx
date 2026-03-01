import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
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
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = Math.min(SCREEN_WIDTH * 0.72, 310);
const INNER_SIZE = RING_SIZE - 16;
const MASCOT_SIZE = INNER_SIZE * 0.58;

export default function HomeScreen() {
  const router = useRouter();
  const { preferences } = useApp();
  const [showExplore, setShowExplore] = useState(false);

  // Animations
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const rotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);
  const innerGlow = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.35, { duration: 1500 })
      ),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );

    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(0.7, { duration: 800 })
      ),
      -1,
      true
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    innerGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedFloat = useAnimatedStyle(() => ({
    transform: [
      { scale: pressScale.value },
      { translateY: floatY.value },
    ],
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: 1 + glowOpacity.value * 0.12 },
    ],
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

  const handleAskGenie = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pressScale.value = withSequence(
      withSpring(0.93, { damping: 12 }),
      withSpring(1, { damping: 10 })
    );
    if (!preferences.onboardingComplete) {
      router.push('/onboarding');
    } else {
      router.push('/voice-chat');
    }
  };

  const handleExploreToggle = () => {
    Haptics.selectionAsync();
    setShowExplore(!showExplore);
  };

  const handleExploreDishes = () => {
    Haptics.selectionAsync();
    setShowExplore(false);
    router.push('/recommendations');
  };

  const handleExploreRestaurants = () => {
    Haptics.selectionAsync();
    setShowExplore(false);
    router.push('/daily-meals');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Greeting */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subGreeting}>What should we eat today?</Text>
            </View>
            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/account')}
            >
              <MaterialIcons name="person" size={22} color={theme.primary} />
            </Pressable>
          </Animated.View>

          {/* Center Hero */}
          <View style={styles.heroContainer}>
            {/* Outer pulse ring */}
            <Animated.View style={[styles.pulseRing, animatedPulse]} />

            {/* Rotating glow */}
            <Animated.View style={[styles.glowContainer, animatedGlow]}>
              <LinearGradient
                colors={[
                  'rgba(251, 191, 36, 0)',
                  'rgba(251, 191, 36, 0.45)',
                  'rgba(245, 158, 11, 0.35)',
                  'rgba(251, 191, 36, 0)',
                ]}
                style={styles.glow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Second glow layer */}
            <Animated.View style={[styles.glowContainer2, animatedGlow]}>
              <LinearGradient
                colors={[
                  'rgba(253, 224, 71, 0)',
                  'rgba(253, 224, 71, 0.25)',
                  'rgba(251, 191, 36, 0.18)',
                  'rgba(253, 224, 71, 0)',
                ]}
                style={styles.glow2}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
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
            <Animated.View style={[styles.sparkle, styles.sparkle4, animatedSparkle]}>
              <Text style={styles.sparkleEmoji}>✨</Text>
            </Animated.View>

            {/* Main ring button */}
            <Animated.View style={animatedFloat}>
              <Pressable
                onPress={handleAskGenie}
                style={({ pressed }) => [
                  styles.genieButtonWrapper,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.outerRing}>
                  <LinearGradient
                    colors={theme.gradients.goldShine}
                    style={styles.genieButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.innerCircle}>
                      <Animated.View style={[styles.innerGlowEffect, animatedInnerGlow]} />
                      <Image
                        source={require('../../assets/images/genie-mascot.png')}
                        style={styles.genieMascot}
                        contentFit="contain"
                      />
                      {/* Mic badge */}
                      <View style={styles.micBadge}>
                        <LinearGradient
                          colors={theme.gradients.gold}
                          style={styles.micBadgeGradient}
                        >
                          <MaterialIcons name="mic" size={18} color={theme.textOnPrimary} />
                        </LinearGradient>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            </Animated.View>

            {/* Label */}
            <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.labelContainer}>
              <Text style={styles.genieLabel}>Ask FoodGenie</Text>
              <Text style={styles.genieSub}>Tell me what you feel like eating</Text>
            </Animated.View>
          </View>

          {/* Explore manually link */}
          <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.exploreSection}>
            <Pressable onPress={handleExploreToggle} style={styles.exploreLink}>
              <Text style={styles.exploreLinkText}>Explore manually</Text>
              <MaterialIcons
                name={showExplore ? 'expand-less' : 'arrow-forward'}
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>

            {showExplore ? (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.exploreOptions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.exploreOption,
                    pressed && styles.exploreOptionPressed,
                  ]}
                  onPress={handleExploreDishes}
                >
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.04)']}
                    style={styles.exploreOptionIcon}
                  >
                    <MaterialIcons name="restaurant-menu" size={20} color={theme.primary} />
                  </LinearGradient>
                  <Text style={styles.exploreOptionText}>Explore Dishes</Text>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.exploreOption,
                    pressed && styles.exploreOptionPressed,
                  ]}
                  onPress={handleExploreRestaurants}
                >
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.04)']}
                    style={styles.exploreOptionIcon}
                  >
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
            <Text style={styles.trustText}>All kitchens chef-verified & hygiene-audited</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  subGreeting: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },

  // Hero
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE + 50,
    height: RING_SIZE + 50,
    borderRadius: (RING_SIZE + 50) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  glowContainer: {
    position: 'absolute',
    width: RING_SIZE + 120,
    height: RING_SIZE + 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer2: {
    position: 'absolute',
    width: RING_SIZE + 80,
    height: RING_SIZE + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: RING_SIZE + 120,
    height: RING_SIZE + 120,
    borderRadius: (RING_SIZE + 120) / 2,
  },
  glow2: {
    width: RING_SIZE + 80,
    height: RING_SIZE + 80,
    borderRadius: (RING_SIZE + 80) / 2,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 5,
  },
  sparkle1: {
    top: 0,
    right: 20,
  },
  sparkle2: {
    bottom: 70,
    left: 10,
  },
  sparkle3: {
    top: 60,
    left: 5,
  },
  sparkle4: {
    bottom: 100,
    right: 10,
  },
  sparkleEmoji: {
    fontSize: 28,
  },
  genieButtonWrapper: {
    alignItems: 'center',
  },
  outerRing: {
    borderRadius: RING_SIZE / 2,
    padding: 4,
    ...theme.shadows.genie,
  },
  genieButton: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  innerGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: INNER_SIZE / 2,
  },
  genieMascot: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
  micBadge: {
    position: 'absolute',
    bottom: INNER_SIZE * 0.1,
    right: INNER_SIZE * 0.1,
    borderRadius: 22,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  micBadgeGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Label
  labelContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  genieLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.3,
  },
  genieSub: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 6,
  },

  // Explore
  exploreSection: {
    alignItems: 'center',
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  exploreLinkText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  exploreOptions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  exploreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.1)',
  },
  exploreOptionPressed: {
    backgroundColor: theme.backgroundTertiary,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  exploreOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },

  // Trust
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  trustText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
});
