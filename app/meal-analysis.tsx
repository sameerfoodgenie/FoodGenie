import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { analyzeFood, FoodAnalysisResult } from '../services/foodAnalysis';

const MESSAGES = [
  'Analyzing your meal...',
  'Detecting ingredients...',
  'Calculating nutrition...',
  'Scoring health impact...',
];

export default function MealAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const [messageIdx, setMessageIdx] = useState(0);

  // Pulse animation
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.3 + pulse.value * 0.3,
  }));

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    analyzeFood().then((result) => {
      if (!mounted) return;
      router.replace({
        pathname: '/food-insight',
        params: {
          imageUri: params.imageUri || '',
          name: result.name,
          healthScore: String(result.healthScore),
          calories: String(result.calories),
          protein: String(result.protein),
          carbs: String(result.carbs),
          fat: String(result.fat),
          insight: result.insight,
        },
      });
    });
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background image with dark overlay */}
      {params.imageUri ? (
        <>
          <Image
            source={{ uri: params.imageUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            blurRadius={20}
          />
          <View style={styles.darkOverlay} />
        </>
      ) : null}

      <View style={styles.content}>
        {/* Pulsing ring */}
        <View style={styles.ringContainer}>
          <Animated.View style={[styles.outerRing, pulseStyle]} />
          <View style={styles.innerRing}>
            {params.imageUri ? (
              <Image
                source={{ uri: params.imageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.iconFallback}>
                <Text style={{ fontSize: 40 }}>🍽</Text>
              </View>
            )}
          </View>
        </View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.textBlock}>
          <ActivityIndicator size="small" color={theme.primary} style={styles.spinner} />
          <Text style={styles.message}>{MESSAGES[messageIdx]}</Text>
          <View style={styles.dotRow}>
            {MESSAGES.map((_, i) => (
              <View key={i} style={[styles.dot, i === messageIdx && styles.dotActive]} />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  ringContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: theme.primary,
    ...theme.shadows.neonGreen,
  },
  innerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(74,222,128,0.4)',
  },
  previewImage: { width: '100%', height: '100%' },
  iconFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', gap: 12 },
  spinner: { marginBottom: 4 },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  dotRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.backgroundTertiary,
  },
  dotActive: {
    backgroundColor: theme.primary,
    ...theme.shadows.neonGreen,
  },
});
