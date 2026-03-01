import React, { useEffect, useState } from 'react';
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

export default function AIThinkingScreen() {
  const router = useRouter();
  const { preferences, currentQuery, setAiResults, incrementSession } = useApp();
  const [messageIndex, setMessageIndex] = useState(0);
  const [messages, setMessages] = useState([
    'Checking chef-approved kitchens...',
    'Filtering by your budget range...',
    'Ranking by confidence...',
  ]);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  useEffect(() => {
    // Generate dynamic messages based on query
    if (currentQuery) {
      const dynamicMessages = getAnalysisText(currentQuery);
      setMessages(dynamicMessages);
    }

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
      setTimeout(() => { dotScale2.value = withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 })); }, 200);
      setTimeout(() => { dotScale3.value = withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 })); }, 400);
    };
    animateDots();
    const dotInterval = setInterval(animateDots, 1200);
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2500);

    // Process AI request
    const processTimer = setTimeout(async () => {
      const results = processAIRequest({
        query: currentQuery || '',
        diet: preferences.diet,
        budgetMin: preferences.budgetMin,
        budgetMax: preferences.budgetMax,
        spiceLevel: preferences.spiceLevel,
        mode: preferences.mode,
      });

      setAiResults(results);
      
      // Increment session count
      await incrementSession();
      
      router.replace('/results');
    }, 2500);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
      clearTimeout(processTimer);
    };
  }, []);

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
            <Image source={require('../assets/images/genie-mascot.png')} style={styles.mascot} contentFit="contain" />
          </View>
        </Animated.View>

        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>

        <Animated.Text
          key={messageIndex}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.message}
        >
          {messages[messageIndex % messages.length]}
        </Animated.Text>

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
  mascotContainer: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  mascot: { width: 120, height: 120 },
  dotsContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.8)' },
  message: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.95)', textAlign: 'center', minHeight: 50 },
  trustNote: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 24 },
});
