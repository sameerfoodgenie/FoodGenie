import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useMeals } from '../../hooks/useMeals';
import { useApp } from '../../contexts/AppContext';
import { useState } from 'react';

function getScoreColor(score: number): string {
  if (score >= 80) return '#4ADE80';
  if (score >= 60) return '#FBBF24';
  if (score >= 40) return '#FB923C';
  return '#F87171';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getTimeLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  if (h < 11) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 18) return 'Snack';
  return 'Dinner';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { todayMeals, dailyScore, streak, totalCalories, totalProtein, totalCarbs, totalFat } = useMeals();
  const { preferences, prefsLoaded } = useApp();
  const [query, setQuery] = useState('');

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!prefsLoaded) return;
    if (preferences.onboardingComplete) {
      hasRedirected.current = false;
      return;
    }
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    const timer = setTimeout(() => {
      try { router.push('/onboarding'); } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [prefsLoaded, preferences.onboardingComplete]);

  if (!prefsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const scoreColor = getScoreColor(dailyScore);
  const hasMeals = todayMeals.length > 0;

  // Suggestion based on meals
  const suggestion = (() => {
    if (!hasMeals) return 'Scan your first meal to start tracking!';
    if (totalProtein < 50) return 'Add more protein to hit your daily goal.';
    if (totalCalories > 1800) return 'You are close to your calorie target. Go lighter on dinner.';
    if (dailyScore >= 80) return 'Great eating today! Keep it up.';
    return 'Improve your next meal for better balance.';
  })();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subGreeting}>Track your nutrition with AI</Text>
            </View>
            <Pressable
              style={styles.profileBtn}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <MaterialIcons name="person" size={22} color={theme.primary} />
            </Pressable>
          </Animated.View>

          {/* ─── DAILY STATS ─── */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsSection}>
            <View style={styles.statsGrid}>
              {/* Score */}
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[`${scoreColor}15`, `${scoreColor}05`]}
                  style={styles.statCardInner}
                >
                  <Text style={styles.statEmoji}>{hasMeals ? '🎯' : '—'}</Text>
                  <Text style={[styles.statValue, { color: hasMeals ? scoreColor : theme.textMuted }]}>
                    {hasMeals ? `${dailyScore}%` : '—'}
                  </Text>
                  <Text style={styles.statLabel}>Health Score</Text>
                </LinearGradient>
              </View>

              {/* Meals logged */}
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(251,191,36,0.1)', 'rgba(251,191,36,0.03)']}
                  style={styles.statCardInner}
                >
                  <Text style={styles.statEmoji}>🍽</Text>
                  <Text style={[styles.statValue, { color: theme.accent }]}>
                    {todayMeals.length}
                  </Text>
                  <Text style={styles.statLabel}>Meals Today</Text>
                </LinearGradient>
              </View>

              {/* Streak */}
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(251,146,60,0.1)', 'rgba(251,146,60,0.03)']}
                  style={styles.statCardInner}
                >
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={[styles.statValue, { color: '#FB923C' }]}>
                    {streak}
                  </Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </LinearGradient>
              </View>
            </View>
          </Animated.View>

          {/* ─── AI SUGGESTION ─── */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.suggestCard}>
            <View style={styles.suggestIcon}>
              <MaterialIcons name="auto-awesome" size={18} color={theme.primary} />
            </View>
            <Text style={styles.suggestText}>{suggestion}</Text>
          </Animated.View>

          {/* ─── QUICK SCAN CTA ─── */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.ctaSection}>
            <Pressable
              style={({ pressed }) => [styles.scanCTA, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/camera'); }}
            >
              <LinearGradient
                colors={theme.gradients.cameraBtn}
                style={styles.scanCTAGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="camera-alt" size={24} color={theme.textOnPrimary} />
                <View style={styles.scanCTAText}>
                  <Text style={styles.scanCTATitle}>Scan your meal</Text>
                  <Text style={styles.scanCTASub}>AI-powered nutrition tracking</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={theme.textOnPrimary} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ─── NUTRITION SUMMARY ─── */}
          {hasMeals ? (
            <Animated.View entering={FadeInDown.delay(350).duration(400)}>
              <Text style={styles.sectionTitle}>Today's Nutrition</Text>
              <View style={styles.nutritionCard}>
                <View style={styles.nutritionRow}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>🔥</Text>
                    <Text style={styles.nutritionValue}>{totalCalories}</Text>
                    <Text style={styles.nutritionLabel}>kcal</Text>
                  </View>
                  <View style={styles.nutritionDivider} />
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>💪</Text>
                    <Text style={styles.nutritionValue}>{totalProtein}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionDivider} />
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>🍚</Text>
                    <Text style={styles.nutritionValue}>{totalCarbs}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionDivider} />
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>🥑</Text>
                    <Text style={styles.nutritionValue}>{totalFat}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* ─── MEAL LOG ─── */}
          {hasMeals ? (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <Text style={styles.sectionTitle}>Meal Log</Text>
              <View style={styles.mealList}>
                {todayMeals.map((meal, index) => (
                  <Animated.View key={meal.id} entering={FadeInRight.delay(index * 80).duration(300)}>
                    <View style={styles.mealCard}>
                      {meal.imageUri ? (
                        <Image source={{ uri: meal.imageUri }} style={styles.mealImage} contentFit="cover" />
                      ) : (
                        <View style={styles.mealImageFallback}>
                          <Text style={{ fontSize: 24 }}>🍽</Text>
                        </View>
                      )}
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                        <Text style={styles.mealTime}>{getTimeLabel(meal.timestamp)}</Text>
                        <View style={styles.mealMeta}>
                          <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                          <View style={[styles.mealScoreDot, { backgroundColor: getScoreColor(meal.healthScore) }]} />
                          <Text style={[styles.mealScore, { color: getScoreColor(meal.healthScore) }]}>{meal.healthScore}%</Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : (
            /* Empty state */
            <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={{ fontSize: 48 }}>📷</Text>
              </View>
              <Text style={styles.emptyTitle}>No meals logged today</Text>
              <Text style={styles.emptySub}>
                Tap the camera button to scan your first meal and start tracking.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '700', color: theme.textPrimary },
  subGreeting: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Stats
  statsSection: { paddingHorizontal: 20, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  statCardInner: {
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statEmoji: { fontSize: 24, marginBottom: 2 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Suggestion
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.12)',
  },
  suggestIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestText: { flex: 1, fontSize: 14, color: theme.textSecondary, lineHeight: 20, fontWeight: '500' },

  // Scan CTA
  ctaSection: { paddingHorizontal: 20, marginBottom: 24 },
  scanCTA: { borderRadius: 20, overflow: 'hidden', ...theme.shadows.neonGreen },
  scanCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
  },
  scanCTAText: { flex: 1 },
  scanCTATitle: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
  scanCTASub: { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 2, fontWeight: '500' },

  // Nutrition summary
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  nutritionCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  nutritionRow: { flexDirection: 'row', alignItems: 'center' },
  nutritionItem: { flex: 1, alignItems: 'center', gap: 2 },
  nutritionDivider: { width: 1, height: 36, backgroundColor: theme.border },
  nutritionEmoji: { fontSize: 18 },
  nutritionValue: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  nutritionLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },

  // Meal log
  mealList: { paddingHorizontal: 20, gap: 10 },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  mealImage: { width: 56, height: 56, borderRadius: 14 },
  mealImageFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  mealTime: { fontSize: 12, color: theme.textMuted, marginTop: 2, fontWeight: '500' },
  mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  mealCalories: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  mealScoreDot: { width: 6, height: 6, borderRadius: 3 },
  mealScore: { fontSize: 13, fontWeight: '700' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 20,
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  emptySub: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
});
