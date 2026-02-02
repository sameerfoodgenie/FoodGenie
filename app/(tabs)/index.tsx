import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { config } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences } = useApp();

  // Animated values for genie button
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const floatY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);
  const innerGlow = useSharedValue(0);

  useEffect(() => {
    // Floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );

    // Gentle rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );

    // Sparkle animation
    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(0.7, { duration: 800 })
      ),
      -1,
      true
    );

    // Outer ring pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Inner glow breathing
    innerGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: floatY.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: 1 + glowOpacity.value * 0.15 },
    ],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: sparkleScale.value,
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value,
  }));

  const animatedInnerGlowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value * 0.3,
  }));

  const handleAskGenie = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(0.92),
      withSpring(1)
    );
    
    // Check if onboarding complete
    if (!preferences.onboardingComplete) {
      router.push('/onboarding');
    } else {
      router.push('/voice-chat');
    }
  };

  const handleQuickAction = (actionId: string) => {
    Haptics.selectionAsync();
    switch (actionId) {
      case 'chat':
        router.push('/(tabs)/chat');
        break;
      case 'plans':
        router.push('/(tabs)/plans');
        break;
      case 'daily':
        router.push('/daily-meals');
        break;
      case 'prefs':
        router.push('/onboarding');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}
              </Text>
              <Text style={styles.tagline}>{config.app.tagline}</Text>
            </View>
            <Pressable style={styles.profileButton}>
              <MaterialIcons name="person" size={24} color={theme.primary} />
            </Pressable>
          </View>

          {/* Hero: Ask FoodGenie Button */}
          <View style={styles.heroContainer}>
            {/* Outer pulse ring */}
            <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
            
            {/* Multiple rotating glow layers */}
            <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
              <LinearGradient
                colors={['rgba(251, 191, 36, 0)', 'rgba(251, 191, 36, 0.5)', 'rgba(245, 158, 11, 0.4)', 'rgba(251, 191, 36, 0)']}
                style={styles.glow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Second glow layer */}
            <Animated.View style={[styles.glowContainer2, animatedGlowStyle]}>
              <LinearGradient
                colors={['rgba(253, 224, 71, 0)', 'rgba(253, 224, 71, 0.3)', 'rgba(251, 191, 36, 0.2)', 'rgba(253, 224, 71, 0)']}
                style={styles.glow2}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </Animated.View>

            {/* Sparkles */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, animatedSparkleStyle]}>
              <Text style={styles.sparkleEmoji}>✨</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, animatedSparkleStyle]}>
              <Text style={styles.sparkleEmoji}>⭐</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, animatedSparkleStyle]}>
              <Text style={styles.sparkleEmoji}>💫</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle4, animatedSparkleStyle]}>
              <Text style={styles.sparkleEmoji}>✨</Text>
            </Animated.View>
            
            <Animated.View style={animatedButtonStyle}>
              <Pressable 
                onPress={handleAskGenie}
                style={({ pressed }) => [
                  styles.genieButtonWrapper,
                  pressed && styles.genieButtonPressed,
                ]}
              >
                {/* Outer gold ring */}
                <View style={styles.outerRing}>
                  <LinearGradient
                    colors={theme.gradients.goldShine}
                    style={styles.genieButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Inner dark circle */}
                    <View style={styles.innerCircle}>
                      {/* Animated inner glow */}
                      <Animated.View style={[styles.innerGlowEffect, animatedInnerGlowStyle]} />
                      
                      {/* Mascot - BIGGER SIZE */}
                      <Image
                        source={require('../../assets/images/genie-mascot.png')}
                        style={styles.genieMascot}
                        contentFit="contain"
                      />
                      
                      {/* Mic icon badge */}
                      <View style={styles.micBadge}>
                        <LinearGradient
                          colors={theme.gradients.gold}
                          style={styles.micBadgeGradient}
                        >
                          <MaterialIcons name="mic" size={16} color={theme.textOnPrimary} />
                        </LinearGradient>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
                
                {/* Text below button */}
                <Text style={styles.genieButtonText}>Ask FoodGenie</Text>
                <Text style={styles.genieSubtext}>
                  Tap to speak your wish
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
            <View style={styles.quickActionsGrid}>
              {config.quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  style={({ pressed }) => [
                    styles.quickActionTile,
                    pressed && styles.quickActionPressed,
                  ]}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
                    style={styles.quickActionIcon}
                  >
                    <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Trust Banner */}
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
            style={styles.trustBanner}
          >
            <MaterialIcons name="verified" size={20} color={theme.success} />
            <Text style={styles.trustText}>
              All kitchens are chef-verified & hygiene-audited
            </Text>
          </LinearGradient>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  tagline: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  glowContainer: {
    position: 'absolute',
    width: 400,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer2: {
    position: 'absolute',
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  glow2: {
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 10,
    right: 30,
  },
  sparkle2: {
    bottom: 80,
    left: 20,
  },
  sparkle3: {
    top: 120,
    left: 10,
  },
  sparkle4: {
    bottom: 120,
    right: 15,
  },
  sparkleEmoji: {
    fontSize: 32,
  },
  genieButtonWrapper: {
    alignItems: 'center',
  },
  genieButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  outerRing: {
    borderRadius: 150,
    padding: 4,
    ...theme.shadows.genie,
  },
  genieButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  innerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
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
    borderRadius: 130,
  },
  genieMascot: {
    width: 140,
    height: 140,
  },
  micBadge: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  micBadgeGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genieButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
    textAlign: 'center',
    marginTop: 20,
  },
  genieSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 6,
  },
  quickActionsContainer: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionTile: {
    width: '30%',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  quickActionPressed: {
    backgroundColor: theme.backgroundTertiary,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionEmoji: {
    fontSize: 26,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.md,
    marginTop: 28,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  trustText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
  },
});
