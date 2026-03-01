import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { theme } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const called = useRef(false);

  useEffect(() => {
    // Simple timer-based splash — no Reanimated dependency
    const timer = setTimeout(() => {
      if (!called.current) {
        called.current = true;
        onFinish();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#141414', '#0A0A0A']} style={styles.gradient}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={theme.gradients.goldShine} style={styles.outerRing}>
            <View style={styles.logoInner}>
              <Image
                source={require('../assets/images/genie-mascot.png')}
                style={styles.mascot}
                contentFit="contain"
              />
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.appName}>FoodGenie</Text>
        <Text style={styles.tagline}>Right food. Right price. Delivered right.</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  mascot: { width: 100, height: 100 },
  appName: {
    fontSize: 38,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
