import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

function getSafeDims() {
  try {
    const w = Dimensions.get('window').width;
    const h = Dimensions.get('window').height;
    return { width: w > 0 ? w : 375, height: h > 0 ? h : 812 };
  } catch {
    return { width: 375, height: 812 };
  }
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [dims, setDims] = useState(getSafeDims);

  useEffect(() => {
    const update = () => {
      const d = getSafeDims();
      setDims(d);
    };
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  const screenWidth = dims.width;
  const screenHeight = dims.height;

  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-10);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);
  const shimmer1 = useSharedValue(-screenWidth);
  const shimmer2 = useSharedValue(-screenWidth);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);
  const sparkle3Opacity = useSharedValue(0);
  const sparkle4Opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 500, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
    );
    logoRotate.value = withSequence(withTiming(5, { duration: 400 }), withTiming(0, { duration: 300 }));

    ringOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    ringScale.value = withDelay(200, withSequence(
      withTiming(1.1, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 300 })
    ));

    shimmer1.value = withDelay(400, withRepeat(
      withTiming(screenWidth * 2, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, false
    ));
    shimmer2.value = withDelay(700, withRepeat(
      withTiming(screenWidth * 2, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, false
    ));

    sparkle1Opacity.value = withDelay(600, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true));
    sparkle2Opacity.value = withDelay(750, withRepeat(withSequence(withTiming(1, { duration: 350 }), withTiming(0.2, { duration: 350 })), -1, true));
    sparkle3Opacity.value = withDelay(500, withRepeat(withSequence(withTiming(1, { duration: 450 }), withTiming(0.4, { duration: 450 })), -1, true));
    sparkle4Opacity.value = withDelay(850, withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.2, { duration: 380 })), -1, true));

    textOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(500, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    const timeout = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) { runOnJS(onFinish)(); }
      });
    }, 2800);

    // Failsafe: ensure splash always finishes
    const failsafe = setTimeout(() => { onFinish(); }, 4000);

    return () => { clearTimeout(timeout); clearTimeout(failsafe); };
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));
  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const shimmer1Style = useAnimatedStyle(() => ({ transform: [{ translateX: shimmer1.value }] }));
  const shimmer2Style = useAnimatedStyle(() => ({ transform: [{ translateX: shimmer2.value }] }));
  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
    transform: [{ scale: interpolate(sparkle1Opacity.value, [0.3, 1], [0.8, 1.2]) }],
  }));
  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
    transform: [{ scale: interpolate(sparkle2Opacity.value, [0.2, 1], [0.7, 1.3]) }],
  }));
  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3Opacity.value,
    transform: [{ scale: interpolate(sparkle3Opacity.value, [0.4, 1], [0.9, 1.1]) }],
  }));
  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4Opacity.value,
    transform: [{ scale: interpolate(sparkle4Opacity.value, [0.2, 1], [0.8, 1.2]) }],
  }));
  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));
  const taglineAnimatedStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
    pointerEvents: fadeOut.value < 0.1 ? 'none' : 'auto',
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient colors={['#0A0A0A', '#141414', '#0A0A0A']} style={styles.gradient}>
        <Animated.View style={[styles.shimmerContainer, shimmer1Style]}>
          <LinearGradient
            colors={['transparent', 'rgba(251, 191, 36, 0.15)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: screenWidth * 0.5, height: screenHeight }}
          />
        </Animated.View>
        <Animated.View style={[styles.shimmerContainer, shimmer2Style]}>
          <LinearGradient
            colors={['transparent', 'rgba(253, 224, 71, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: screenWidth * 0.3, height: screenHeight }}
          />
        </Animated.View>

        <Animated.Text style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>✨</Animated.Text>
        <Animated.Text style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>⭐</Animated.Text>
        <Animated.Text style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>💫</Animated.Text>
        <Animated.Text style={[styles.sparkle, styles.sparkle4, sparkle4Style]}>✨</Animated.Text>

        <View style={styles.logoContainer}>
          <Animated.View style={[styles.outerRing, ringAnimatedStyle]}>
            <LinearGradient colors={theme.gradients.goldShine} style={styles.ringGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          </Animated.View>
          <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
            <LinearGradient colors={theme.gradients.gold} style={styles.logoBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.logoInner}>
                <Image source={require('../assets/images/genie-mascot.png')} style={styles.mascot} contentFit="contain" />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.appName}>FoodGenie</Text>
        </Animated.View>
        <Animated.View style={taglineAnimatedStyle}>
          <Text style={styles.tagline}>Right food. Right price. Delivered right.</Text>
        </Animated.View>

        <View style={styles.bottomAccent}>
          <LinearGradient colors={['transparent', 'rgba(251, 191, 36, 0.1)']} style={styles.bottomGradient} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shimmerContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sparkle: { position: 'absolute', fontSize: 28 },
  sparkle1: { top: '15%', right: '15%' },
  sparkle2: { top: '25%', left: '12%' },
  sparkle3: { bottom: '30%', right: '18%' },
  sparkle4: { bottom: '22%', left: '15%' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  outerRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, overflow: 'hidden' },
  ringGradient: { flex: 1, opacity: 0.3 },
  logoWrapper: { borderRadius: 95, overflow: 'hidden', ...theme.shadows.genie },
  logoBorder: { width: 190, height: 190, borderRadius: 95, padding: 4, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 182, height: 182, borderRadius: 91, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)' },
  mascot: { width: 120, height: 120 },
  appName: { fontSize: 38, fontWeight: '700', color: theme.primary, letterSpacing: 1, textShadowColor: 'rgba(251, 191, 36, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  tagline: { fontSize: 15, color: theme.textSecondary, marginTop: 12, letterSpacing: 0.5 },
  bottomAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { flex: 1 },
});
