import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { useApp } from '../contexts/AppContext';
import { processAIRequest, getAnalysisText } from '../services/aiEngine';

const MESSAGES = [
  'Checking chef-approved kitchens...',
  'Filtering by your budget range...',
  'Ranking by confidence scores...',
];

export default function AIThinkingScreen() {
  const router = useRouter();
  const { preferences, currentQuery, setAiResults, incrementSession } = useApp();
  const [messageIndex, setMessageIndex] = useState(0);
  const hasNavigated = useRef(false);
  const messagesRef = useRef<string[]>(MESSAGES);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  useEffect(() => {
    if (hasNavigated.current) return;

    // Generate dynamic messages based on query
    if (currentQuery) {
      try {
        const dynamicMessages = getAnalysisText(currentQuery);
        if (dynamicMessages && dynamicMessages.length > 0) {
          messagesRef.current = dynamicMessages;
        }
      } catch (e) {
        // Use default messages
      }
    }

    // Animations
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );

    const animateDots = () => {
      dotScale1.value = withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 }));
      setTimeout(() => {
        dotScale2.value = withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 }));
      }, 200);
      setTimeout(() => {
        dotScale3.value = withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 }));
      }, 400);
    };
    animateDots();
    const dotInterval = setInterval(animateDots, 1200);

    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => {
        const msgs = messagesRef.current;
        return (prev + 1) % msgs.length;
      });
    }, 2500);

    // Process AI request and navigate
    const processTimer = setTimeout(() => {
      if (hasNavigated.current) return;
      try {
        const results = processAIRequest({
          query: currentQuery || '',
          diet: preferences.diet,
          budgetMin: preferences.budgetMin,
          budgetMax: preferences.budgetMax,
          spiceLevel: preferences.spiceLevel,
          mode: preferences.mode,
        });
        setAiResults(results);
      } catch (e) {
        console.log('AI processing error:', e);
        setAiResults([]);
      }

      // Non-blocking session increment
      incrementSession().catch(() => {});

      if (!hasNavigated.current) {
        hasNavigated.current = true;
        try {
          router.replace('/results');
        } catch (e) {
          console.log('Navigation error:', e);
        }
      }
    }, 2500);

    // Failsafe navigation
    const failsafe = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        try {
          router.replace('/results');
        } catch (e) {
          console.log('Failsafe navigation error:', e);
        }
      }
    }, 6000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
      clearTimeout(processTimer);
      clearTimeout(failsafe);
    };
  }, []);

  const displayMessage = messagesRef.current[messageIndex % messagesRef.current.length] || MESSAGES[0];

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  const dot1Style = useAnimatedStyle(() => ({ transform: [{ scale: dotScale1.value }] }));
  const dot2Style = useAnimatedStyle(() => ({ transform: [{ scale: dotScale2.value }] }));
  const dot3Style = useAnimatedStyle(() => ({ transform: [{ scale: dotScale3.value }] }));

  return (
    <LinearGradient colors={theme.gradients.genie} style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={mascotStyle}>
          <View style={styles.mascotContainer}>
            <Image
              source={require('../assets/images/genie-mascot.png')}
              style={styles.mascot}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>

        <Text style={styles.message}>{displayMessage}</Text>

        <Text style={styles.trustNote}>
          Finding chef-verified, fairly priced Top 3 matches
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  mascotContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mascot: { width: 120, height: 120 },
  dotsContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.8)' },
  message: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.95)', textAlign: 'center', minHeight: 50 },
  trustNote: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 24 },
});
