import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';
import { mockDishes } from '../services/mockData';

export default function AIThinkingScreen() {
  const router = useRouter();
  const { preferences, setRecommendations } = useApp();
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Animation values
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  useEffect(() => {
    // Mascot pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Rotation
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Dot animation sequence
    const animateDots = () => {
      dotScale1.value = withSequence(
        withTiming(1.5, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      setTimeout(() => {
        dotScale2.value = withSequence(
          withTiming(1.5, { duration: 300 }),
          withTiming(1, { duration: 300 })
        );
      }, 200);
      setTimeout(() => {
        dotScale3.value = withSequence(
          withTiming(1.5, { duration: 300 }),
          withTiming(1, { duration: 300 })
        );
      }, 400);
    };

    animateDots();
    const dotInterval = setInterval(animateDots, 1200);

    // Rotate messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % config.aiThinkingMessages.length);
    }, 2500);

    // Simulate AI processing with minimum 6 recommendations
    setTimeout(() => {
      // Get personalized recommendations (minimum 6 dishes)
      const filtered = mockDishes.filter(dish => {
        if (preferences.diet === 'veg' && !dish.isVeg) return false;
        if (dish.price > preferences.budget + 100) return false;
        return true;
      });

      const sorted = filtered.sort((a, b) => {
        const scoreA = a.chefScore + (Math.abs(a.spiceLevel - preferences.spiceLevel) * -5);
        const scoreB = b.chefScore + (Math.abs(b.spiceLevel - preferences.spiceLevel) * -5);
        return scoreB - scoreA;
      });

      // Ensure minimum 6 recommendations
      const recommendationCount = Math.max(6, Math.min(sorted.length, 8));
      setRecommendations(sorted.slice(0, recommendationCount));
      router.replace('/decision-lens');
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const animatedMascotStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const animatedDot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
  }));

  const animatedDot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
  }));

  const animatedDot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
  }));

  return (
    <LinearGradient
      colors={theme.gradients.genie}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Mascot */}
        <Animated.View style={animatedMascotStyle}>
          <View style={styles.mascotContainer}>
            <Image
              source={require('../assets/images/genie-mascot.png')}
              style={styles.mascot}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Animated Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, animatedDot1Style]} />
          <Animated.View style={[styles.dot, animatedDot2Style]} />
          <Animated.View style={[styles.dot, animatedDot3Style]} />
        </View>

        {/* Rotating Message */}
        <Animated.Text
          key={messageIndex}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.message}
        >
          {config.aiThinkingMessages[messageIndex]}
        </Animated.Text>

        {/* Trust note */}
        <Text style={styles.trustNote}>
          Finding chef-verified, fairly priced options
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mascotContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mascot: {
    width: 120,
    height: 120,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    minHeight: 50,
  },
  trustNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 24,
  },
});
