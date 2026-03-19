import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useCreator } from '../contexts/CreatorContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreatorUnlockScreen() {
  const router = useRouter();
  const { markUnlockSeen } = useCreator();

  const iconScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.3);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    iconScale.value = withDelay(300, withSequence(
      withSpring(1.3, { damping: 6 }),
      withSpring(1, { damping: 10 }),
    ));
    glowOpacity.value = withDelay(400, withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    ));
    ringScale.value = withDelay(200, withSpring(1, { damping: 8 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.4,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markUnlockSeen();
    router.replace('/creator-studio');
  };

  const handleLater = () => {
    Haptics.selectionAsync();
    markUnlockSeen();
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#0F1A12', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Glow background */}
          <Animated.View style={[styles.glowBg, glowStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(74,222,128,0.15)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Ring */}
          <Animated.View style={[styles.ring, ringStyle]}>
            <LinearGradient
              colors={['rgba(74,222,128,0.2)', 'rgba(74,222,128,0.05)']}
              style={styles.ringInner}
            />
          </Animated.View>

          {/* Icon */}
          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <LinearGradient
              colors={['#4ADE80', '#22C55E']}
              style={styles.iconCircle}
            >
              <MaterialIcons name="auto-awesome" size={48} color={theme.textOnPrimary} />
            </LinearGradient>
          </Animated.View>

          {/* Text */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.textBlock}>
            <Text style={styles.congrats}>Congratulations!</Text>
            <Text style={styles.unlockTitle}>You have unlocked{'\n'}Creator Mode</Text>
            <Text style={styles.unlockDesc}>
              Create shows, add episodes, and share your food journey with the community.
            </Text>
          </Animated.View>

          {/* Features preview */}
          <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.features}>
            {[
              { icon: 'movie-creation', label: 'Create Shows' },
              { icon: 'playlist-add', label: 'Add Episodes' },
              { icon: 'trending-up', label: 'Track Views' },
            ].map((f, i) => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={f.icon as any} size={20} color={theme.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* CTAs */}
        <Animated.View entering={FadeInUp.delay(1000).duration(500)} style={styles.ctaBlock}>
          <Pressable
            style={({ pressed }) => [styles.mainCta, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleContinue}
          >
            <LinearGradient colors={['#4ADE80', '#22C55E']} style={styles.mainCtaGradient}>
              <MaterialIcons name="movie-creation" size={22} color={theme.textOnPrimary} />
              <Text style={styles.mainCtaText}>Create Your First Show</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.laterBtn, pressed && { opacity: 0.7 }]}
            onPress={handleLater}
          >
            <Text style={styles.laterText}>Maybe Later</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  glowBg: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH / 2,
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  ringInner: { flex: 1, borderRadius: 100 },

  iconWrap: { marginBottom: 32 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.neonGreen,
  },

  textBlock: { alignItems: 'center', gap: 12 },
  congrats: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  unlockTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  unlockDesc: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  features: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 36,
  },
  featureItem: { alignItems: 'center', gap: 8 },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted },

  ctaBlock: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  mainCta: { borderRadius: 16, overflow: 'hidden', ...theme.shadows.colored },
  mainCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  mainCtaText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
  laterBtn: { alignItems: 'center', paddingVertical: 12 },
  laterText: { fontSize: 15, fontWeight: '600', color: theme.textMuted },
});
