import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useMeals, } from '../hooks/useMeals';
import { MealEntry } from '../contexts/MealContext';
import { useAlert } from '@/template';

function getScoreColor(score: number): string {
  if (score >= 80) return '#4ADE80';
  if (score >= 60) return '#FBBF24';
  if (score >= 40) return '#FB923C';
  return '#F87171';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export default function FoodInsightScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    imageUri?: string;
    name?: string;
    healthScore?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    insight?: string;
    alreadyAdded?: string;
  }>();
  const { addMeal } = useMeals();
  const { showAlert } = useAlert();

  const [foodName, setFoodName] = useState(params.name || 'Unknown Food');
  const [isEditing, setIsEditing] = useState(false);
  const [added, setAdded] = useState(params.alreadyAdded === 'true');

  const healthScore = parseInt(params.healthScore || '0', 10);
  const calories = parseInt(params.calories || '0', 10);
  const protein = parseInt(params.protein || '0', 10);
  const carbs = parseInt(params.carbs || '0', 10);
  const fat = parseInt(params.fat || '0', 10);
  const insight = params.insight || '';
  const scoreColor = getScoreColor(healthScore);

  // Score animation
  const scoreScale = useSharedValue(0.5);
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  React.useEffect(() => {
    scoreScale.value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
  }, []);

  const handleAddToday = useCallback(() => {
    if (added) {
      router.back();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const meal: MealEntry = {
      id: Date.now().toString(),
      name: foodName,
      healthScore,
      calories,
      protein,
      carbs,
      fat,
      insight,
      imageUri: params.imageUri || null,
      timestamp: Date.now(),
    };
    addMeal(meal);
    setAdded(true);
    showAlert('Added', `${foodName} added to today's log`);
    setTimeout(() => router.back(), 800);
  }, [added, foodName, healthScore, calories, protein, carbs, fat, insight, params.imageUri, addMeal, router, showAlert]);

  const handleEdit = useCallback(() => {
    Haptics.selectionAsync();
    setIsEditing(true);
  }, []);

  const totalMacros = protein + carbs + fat;
  const proteinPct = totalMacros > 0 ? Math.round((protein / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((carbs / totalMacros) * 100) : 0;
  const fatPct = totalMacros > 0 ? Math.round((fat / totalMacros) * 100) : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); router.back(); }}
            >
              <MaterialIcons name="close" size={22} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Food Insight</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Image + Score overlay */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.imageSection}>
            {params.imageUri ? (
              <Image source={{ uri: params.imageUri }} style={styles.foodImage} contentFit="cover" />
            ) : (
              <View style={styles.noImage}>
                <Text style={{ fontSize: 56 }}>🍽</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(10,10,15,0.9)']}
              style={styles.imageGradient}
            />

            {/* Health Score Badge */}
            <Animated.View style={[styles.scoreBadge, scoreStyle]}>
              <LinearGradient
                colors={[`${scoreColor}30`, `${scoreColor}10`]}
                style={styles.scoreBadgeInner}
              >
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>{healthScore}</Text>
                <Text style={styles.scorePercent}>%</Text>
              </LinearGradient>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>{getScoreLabel(healthScore)}</Text>
            </Animated.View>
          </Animated.View>

          {/* Food Name */}
          <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.nameSection}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={foodName}
                onChangeText={setFoodName}
                autoFocus
                onBlur={() => setIsEditing(false)}
                onSubmitEditing={() => setIsEditing(false)}
                returnKeyType="done"
              />
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.foodName}>{foodName}</Text>
                <Pressable onPress={handleEdit} style={styles.editBtn}>
                  <MaterialIcons name="edit" size={16} color={theme.textMuted} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Insight */}
          <Animated.View entering={FadeInUp.delay(250).duration(400)} style={styles.insightCard}>
            <MaterialIcons name="auto-awesome" size={18} color={theme.primary} />
            <Text style={styles.insightText}>{insight}</Text>
          </Animated.View>

          {/* Nutrition Breakdown */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>

            {/* Calories hero */}
            <View style={styles.calorieCard}>
              <View style={styles.calorieRow}>
                <Text style={styles.calorieEmoji}>🔥</Text>
                <View>
                  <Text style={styles.calorieValue}>{calories}</Text>
                  <Text style={styles.calorieLabel}>Calories</Text>
                </View>
              </View>
            </View>

            {/* Macro bars */}
            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{protein}g</Text>
                </View>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${proteinPct}%`, backgroundColor: '#4ADE80' }]} />
                </View>
                <Text style={styles.macroPct}>{proteinPct}%</Text>
              </View>

              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{carbs}g</Text>
                </View>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${carbsPct}%`, backgroundColor: '#FBBF24' }]} />
                </View>
                <Text style={styles.macroPct}>{carbsPct}%</Text>
              </View>

              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>{fat}g</Text>
                </View>
                <View style={styles.macroBarBg}>
                  <View style={[styles.macroBarFill, { width: `${fatPct}%`, backgroundColor: '#F87171' }]} />
                </View>
                <Text style={styles.macroPct}>{fatPct}%</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.addBtn,
              added && styles.addBtnDone,
              pressed && !added && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleAddToday}
            disabled={added}
          >
            <LinearGradient
              colors={added ? ['#22C55E', '#16A34A'] : theme.gradients.cameraBtn}
              style={styles.addBtnGradient}
            >
              <MaterialIcons name={added ? 'check' : 'add'} size={22} color={theme.textOnPrimary} />
              <Text style={styles.addBtnText}>{added ? 'Done' : 'Add to Today'}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },

  // Image section
  imageSection: {
    height: 280,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  foodImage: { width: '100%', height: '100%' },
  noImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
  },
  scoreBadgeInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreNumber: { fontSize: 40, fontWeight: '800', letterSpacing: -2 },
  scorePercent: { fontSize: 18, fontWeight: '700', color: theme.textSecondary, marginLeft: 2 },
  scoreLabel: { fontSize: 13, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },

  // Name
  nameSection: { paddingHorizontal: 20, marginBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  foodName: { fontSize: 28, fontWeight: '800', color: theme.textPrimary, flex: 1, letterSpacing: -0.5 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editText: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
  nameInput: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
    paddingBottom: 4,
  },

  // Insight
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  insightText: { flex: 1, fontSize: 15, color: theme.textSecondary, lineHeight: 22 },

  // Nutrition
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  calorieCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  calorieRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  calorieEmoji: { fontSize: 32 },
  calorieValue: { fontSize: 36, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1 },
  calorieLabel: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },

  // Macros
  macroGrid: { paddingHorizontal: 20, gap: 16 },
  macroItem: { gap: 8 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabel: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  macroValue: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  macroBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  macroBarFill: { height: '100%', borderRadius: 4 },
  macroPct: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnDone: { opacity: 0.8 },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  addBtnText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
});
