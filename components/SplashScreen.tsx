import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { theme } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const called = useRef(false);

  useEffect(() => {
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
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <View style={styles.glowRing}>
            <LinearGradient colors={theme.gradients.cameraBtn} style={styles.outerRing}>
              <View style={styles.logoInner}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.mascot}
                  contentFit="contain"
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        <Text style={styles.appName}>FoodGenie</Text>
        <Text style={styles.tagline}>Scan. Track. Eat better.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  glowRing: {
    ...theme.shadows.neonGreen,
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  mascot: { width: 90, height: 90 },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 10,
    letterSpacing: 0.3,
  },
});
