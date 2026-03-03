import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
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
  const hasNavigated = useRef(false);

  // Snapshot values at mount time
  const prefsRef = useRef(appContext.preferences);
  const queryRef = useRef(appContext.currentQuery);
  const dishesRef = useRef(appContext.allDishes);
  const restaurantsRef = useRef(appContext.allRestaurants);

  // Keep refs updated each render
  prefsRef.current = appContext.preferences;
  queryRef.current = appContext.currentQuery;
  dishesRef.current = appContext.allDishes;
  restaurantsRef.current = appContext.allRestaurants;

  const displayMessages = useRef<string[]>((() => {
    try {
      const dynamic = getAnalysisText(appContext.currentQuery || '');
      return dynamic.length > 0 ? dynamic : DEFAULT_MESSAGES;
    } catch {
      return DEFAULT_MESSAGES;
    }
  })()).current;

  const navigateToResults = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    try {
      router.replace('/results');
    } catch {
      try { router.push('/results'); } catch { /* give up */ }
    }
  };

  useEffect(() => {
    // Cycle messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => prev + 1);
    }, 1800);

    // Process AI request after a short delay
    const processTimer = setTimeout(() => {
      if (hasNavigated.current) return;

      try {
        const snap = prefsRef.current;
        const q = queryRef.current;
        const results = processAIRequest(
          {
            query: q || '',
            diet: snap.diet,
            budgetMin: snap.budgetMin,
            budgetMax: snap.budgetMax,
            spiceLevel: snap.spiceLevel,
            mode: snap.mode,
          },
          dishesRef.current,
          restaurantsRef.current,
        );
        appContext.setAiResults(results);
      } catch (e) {
        console.log('AI processing error:', e);
        appContext.setAiResults([]);
      }

      // Non-blocking session increment
      appContext.incrementSession().catch(() => {});

      navigateToResults();
    }, 2500);

    // Failsafe: always navigate after 4 seconds
    const failsafe = setTimeout(() => {
      navigateToResults();
    }, 4000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(processTimer);
      clearTimeout(failsafe);
    };
  }, []);

  const currentMessage = displayMessages[messageIndex % displayMessages.length] || DEFAULT_MESSAGES[0];

  return (
    <LinearGradient colors={['#1a1400', '#0A0A0A', '#1a1400']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mascotContainer}>
          <Image
            source={require('../assets/images/genie-mascot.png')}
            style={styles.mascot}
            contentFit="contain"
          />
        </View>

        <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />

        <Text style={styles.message}>{currentMessage}</Text>
        <Text style={styles.trustNote}>Finding chef-verified, fairly priced Top 3 matches</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  mascotContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  mascot: { width: 90, height: 90 },
  spinner: { marginBottom: 24 },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    textAlign: 'center',
    minHeight: 50,
  },
  trustNote: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
