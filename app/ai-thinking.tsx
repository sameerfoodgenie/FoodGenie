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
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { processAIRequest, getAnalysisText } from '../services/aiEngine';

const DEFAULT_MESSAGES = [
  'Checking chef-approved kitchens...',
  'Filtering by your budget range...',
  'Ranking by confidence scores...',
];

export default function AIThinkingScreen() {
  const router = useRouter();
  const appContext = useApp();
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayMessages, setDisplayMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const hasNavigated = useRef(false);

  // Capture current values on mount via ref to avoid stale closures
  const contextRef = useRef({
    preferences: appContext.preferences,
    currentQuery: appContext.currentQuery,
    setAiResults: appContext.setAiResults,
    incrementSession: appContext.incrementSession,
  });

  // Update ref on every render so we always have latest
  contextRef.current = {
    preferences: appContext.preferences,
    currentQuery: appContext.currentQuery,
    setAiResults: appContext.setAiResults,
    incrementSession: appContext.incrementSession,
  };

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  useEffect(() => {
    if (hasNavigated.current) return;

    // Generate dynamic messages based on query
    const query = contextRef.current.currentQuery || '';
    if (query) {
      try {
        const dynamic = getAnalysisText(query);
        if (dynamic && dynamic.length > 0) {
          setDisplayMessages(dynamic);
        }
      } catch {
        // Use defaults
      }
    }

    // Start animations
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

    // Cycle messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => prev + 1);
    }, 2000);

    // Process AI and navigate after delay
    const processTimer = setTimeout(() => {
      if (hasNavigated.current) return;

      const ctx = contextRef.current;
      try {
        const results = processAIRequest({
          query: ctx.currentQuery || '',
          diet: ctx.preferences.diet,
          budgetMin: ctx.preferences.budgetMin,
          budgetMax: ctx.preferences.budgetMax,
          spiceLevel: ctx.preferences.spiceLevel,
          mode: ctx.preferences.mode,
        });
        ctx.setAiResults(results);
      } catch (e) {
        console.log('AI processing error:', e);
        ctx.setAiResults([]);
      }

      // Non-blocking session increment
      ctx.incrementSession().catch(() => {});

      // Navigate to results — use back + push instead of replace
      // because replace on a fullScreenModal can hang navigation
      navigateToResults();
    }, 2500);

    // Failsafe
    const failsafe = setTimeout(() => {
      navigateToResults();
    }, 6000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
      clearTimeout(processTimer);
      clearTimeout(failsafe);
    };
  }, []);

  const navigateToResults = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    try {
      // Dismiss the modal first, then push results after a tick
      if (router.canGoBack()) {
        router.back();
      }
      setTimeout(() => {
        try {
          router.push('/results');
        } catch (e) {
          console.log('Push results error:', e);
        }
      }, 100);
    } catch (e) {
      console.log('Navigation error:', e);
      // Last resort: try direct replace
      try {
        router.replace('/results');
      } catch (e2) {
        console.log('Replace fallback error:', e2);
      }
    }
  };

  const currentMessage = displayMessages[messageIndex % displayMessages.length] || DEFAULT_MESSAGES[0];

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

        <Text style={styles.message}>{currentMessage}</Text>

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
