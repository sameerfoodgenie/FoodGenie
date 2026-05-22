import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../template';
import {
  loadPreferences,
  loadAdvancedPreferences,
  savePreferences,
  saveAdvancedPreferences,
} from '../services/preferencesService';

type Step = 'ask' | 'form';

const FOOD_TYPES = [
  { id: 'veg', label: 'Vegetarian', emoji: '🥬', color: '#4ADE80' },
  { id: 'egg', label: 'Eggetarian', emoji: '🥚', color: '#FFB347' },
  { id: 'nonveg', label: 'Non-Veg', emoji: '🍗', color: '#FF6B6B' },
];

const MEAL_GOALS = [
  { id: 'balanced', label: 'Balanced Diet', emoji: '⚖️' },
  { id: 'weight_loss', label: 'Weight Loss', emoji: '🏃' },
  { id: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { id: 'energy', label: 'High Energy', emoji: '⚡' },
  { id: 'gut_health', label: 'Gut Health', emoji: '🫶' },
];

const CUISINES = [
  { id: 'north_indian', label: 'North Indian', emoji: '🍛' },
  { id: 'south_indian', label: 'South Indian', emoji: '🥘' },
  { id: 'bengali', label: 'Bengali', emoji: '🐟' },
  { id: 'gujarati', label: 'Gujarati', emoji: '🥗' },
  { id: 'punjabi', label: 'Punjabi', emoji: '🧈' },
  { id: 'maharashtrian', label: 'Maharashtrian', emoji: '🌶️' },
  { id: 'hyderabadi', label: 'Hyderabadi', emoji: '🍚' },
  { id: 'continental', label: 'Continental', emoji: '🍝' },
];

const SPICE_LEVELS = [
  { id: 1, label: 'Mild', emoji: '🌶️', desc: 'Low spice' },
  { id: 2, label: 'Medium', emoji: '🌶️🌶️', desc: 'Balanced' },
  { id: 3, label: 'Spicy', emoji: '🌶️🌶️🌶️', desc: 'Hot' },
  { id: 4, label: 'Extra Hot', emoji: '🔥', desc: 'Very spicy' },
];

const BUDGETS = [
  { id: 'low', label: '₹100-200', min: 100, max: 200, desc: 'Budget friendly' },
  { id: 'mid', label: '₹200-400', min: 200, max: 400, desc: 'Moderate' },
  { id: 'high', label: '₹400-700', min: 400, max: 700, desc: 'Premium' },
  { id: 'premium', label: '₹700+', min: 700, max: 1500, desc: 'No limit' },
];

const COOKING_PREFS = [
  { id: 'quick', label: 'Quick & Easy', emoji: '⏱️', desc: 'Under 30 min' },
  { id: 'elaborate', label: 'Elaborate', emoji: '👨‍🍳', desc: 'Full recipes' },
  { id: 'no_cook', label: 'No Cooking', emoji: '🥗', desc: 'Raw/ready meals' },
  { id: 'mixed', label: 'Mix of Both', emoji: '🎯', desc: 'Variety' },
];

const COMMON_ALLERGIES = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'onion_garlic', label: 'Onion/Garlic' },
  { id: 'mushroom', label: 'Mushroom' },
  { id: 'none', label: 'None' },
];

export default function MealPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('ask');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [foodType, setFoodType] = useState<string>('veg');
  const [mealGoal, setMealGoal] = useState<string>('balanced');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<number>(2);
  const [budget, setBudget] = useState<string>('mid');
  const [cookingPref, setCookingPref] = useState<string>('mixed');
  const [allergies, setAllergies] = useState<string[]>([]);

  // Load existing preferences
  useEffect(() => {
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      const [basic, advanced] = await Promise.all([
        loadPreferences(user.id),
        loadAdvancedPreferences(user.id),
      ]);
      if (basic) {
        setFoodType(basic.diet || 'veg');
        setSpiceLevel(basic.spice_level || 2);
        const bMin = basic.budget_min || 200;
        const bMax = basic.budget_max || 400;
        if (bMax <= 200) setBudget('low');
        else if (bMax <= 400) setBudget('mid');
        else if (bMax <= 700) setBudget('high');
        else setBudget('premium');
      }
      if (advanced) {
        setMealGoal(advanced.health_goal || 'balanced');
        setCuisines(advanced.cuisine_bias || []);
        setAllergies(advanced.avoid_tags || []);
      }
      setLoading(false);
    }
    load();
  }, [user?.id]);

  const toggleCuisine = (id: string) => {
    setCuisines(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAllergy = (id: string) => {
    if (id === 'none') {
      setAllergies([]);
      return;
    }
    setAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev.filter(a => a !== 'none'), id]
    );
  };

  const handleContinueWithCurrent = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/decision-lens' as any);
  }, [router]);

  const handleUpdatePreferences = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('form');
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!user?.id) {
      router.replace('/decision-lens' as any);
      return;
    }

    setSaving(true);
    const budgetConfig = BUDGETS.find(b => b.id === budget) || BUDGETS[1];

    await Promise.all([
      savePreferences(user.id, {
        diet: foodType as any,
        budget_min: budgetConfig.min,
        budget_max: budgetConfig.max,
        spice_level: spiceLevel,
        mode: cookingPref === 'quick' ? 'quick' : 'guided',
      }),
      saveAdvancedPreferences(user.id, {
        health_goal: mealGoal,
        cuisine_bias: cuisines,
        avoid_tags: allergies.filter(a => a !== 'none'),
      }),
    ]);

    setSaving(false);
    router.replace('/decision-lens' as any);
  }, [user?.id, foodType, mealGoal, cuisines, spiceLevel, budget, cookingPref, allergies, router]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {step === 'ask' ? 'Meal Preferences' : 'Update Preferences'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {step === 'ask' ? 'Personalize your meal plan' : 'Tell us what you like'}
            </Text>
          </View>
        </View>

        {step === 'ask' ? (
          /* ═══ Ask Step ═══ */
          <View style={styles.askContainer}>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.askContent}>
              <View style={styles.askIconWrap}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.askIcon}>
                  <Text style={{ fontSize: 42 }}>🍛</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.askTitle, { color: colors.textPrimary }]}>
                Do you want to change your{'\n'}food preferences?
              </Text>
              <Text style={[styles.askDesc, { color: colors.textMuted }]}>
                Update your diet, cuisine, budget and other preferences for a more personalized meal plan
              </Text>

              <View style={styles.askButtons}>
                <Animated.View entering={FadeInUp.delay(200).duration(350)} style={{ width: '100%' }}>
                  <Pressable
                    style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                    onPress={handleUpdatePreferences}
                  >
                    <LinearGradient
                      colors={['#D4AF37', '#FFD700']}
                      style={styles.askBtnPrimary}
                    >
                      <MaterialIcons name="tune" size={20} color="#FFF" />
                      <Text style={styles.askBtnPrimaryText}>Yes, Update Preferences</Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(350)} style={{ width: '100%' }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.askBtnSecondary,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: colors.border },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={handleContinueWithCurrent}
                  >
                    <MaterialIcons name="arrow-forward" size={20} color={colors.textPrimary} />
                    <Text style={[styles.askBtnSecondaryText, { color: colors.textPrimary }]}>No, Continue with Current</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        ) : (
          /* ═══ Form Step ═══ */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 100 }]}
          >
            {/* Food Type */}
            <Animated.View entering={FadeInDown.delay(50).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Food Type</Text>
              <View style={styles.chipRow}>
                {FOOD_TYPES.map(ft => {
                  const isSelected = foodType === ft.id;
                  return (
                    <Pressable
                      key={ft.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? `${ft.color}15` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? ft.color : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setFoodType(ft.id); }}
                    >
                      <Text style={{ fontSize: 20 }}>{ft.emoji}</Text>
                      <Text style={[styles.chipLabel, { color: isSelected ? ft.color : colors.textSecondary }]}>{ft.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Meal Goal */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Meal Goal</Text>
              <View style={styles.chipRow}>
                {MEAL_GOALS.map(mg => {
                  const isSelected = mealGoal === mg.id;
                  return (
                    <Pressable
                      key={mg.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? 'rgba(212,175,55,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? '#D4AF37' : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setMealGoal(mg.id); }}
                    >
                      <Text style={{ fontSize: 18 }}>{mg.emoji}</Text>
                      <Text style={[styles.chipLabel, { color: isSelected ? '#D4AF37' : colors.textSecondary }]}>{mg.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Cuisine Preference */}
            <Animated.View entering={FadeInDown.delay(150).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Cuisine Preference</Text>
              <Text style={[styles.formHint, { color: colors.textMuted }]}>Select multiple</Text>
              <View style={styles.chipRow}>
                {CUISINES.map(c => {
                  const isSelected = cuisines.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? 'rgba(129,140,248,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? '#818CF8' : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); toggleCuisine(c.id); }}
                    >
                      <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                      <Text style={[styles.chipLabel, { color: isSelected ? '#818CF8' : colors.textSecondary }]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Spice Level */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Spice Level</Text>
              <View style={styles.spiceRow}>
                {SPICE_LEVELS.map(sl => {
                  const isSelected = spiceLevel === sl.id;
                  return (
                    <Pressable
                      key={sl.id}
                      style={[
                        styles.spiceItem,
                        {
                          backgroundColor: isSelected ? 'rgba(255,107,107,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? '#FF6B6B' : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setSpiceLevel(sl.id); }}
                    >
                      <Text style={{ fontSize: 16 }}>{sl.emoji}</Text>
                      <Text style={[styles.spiceLabel, { color: isSelected ? '#FF6B6B' : colors.textSecondary }]}>{sl.label}</Text>
                      <Text style={[styles.spiceDesc, { color: colors.textMuted }]}>{sl.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Budget */}
            <Animated.View entering={FadeInDown.delay(250).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Budget Preference</Text>
              <Text style={[styles.formHint, { color: colors.textMuted }]}>Per meal cost</Text>
              <View style={styles.budgetRow}>
                {BUDGETS.map(b => {
                  const isSelected = budget === b.id;
                  return (
                    <Pressable
                      key={b.id}
                      style={[
                        styles.budgetItem,
                        {
                          backgroundColor: isSelected ? 'rgba(74,222,128,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? '#4ADE80' : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setBudget(b.id); }}
                    >
                      <Text style={[styles.budgetLabel, { color: isSelected ? '#4ADE80' : colors.textPrimary }]}>{b.label}</Text>
                      <Text style={[styles.budgetDesc, { color: colors.textMuted }]}>{b.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Cooking Preference */}
            <Animated.View entering={FadeInDown.delay(300).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Cooking Preference</Text>
              <View style={styles.cookRow}>
                {COOKING_PREFS.map(cp => {
                  const isSelected = cookingPref === cp.id;
                  return (
                    <Pressable
                      key={cp.id}
                      style={[
                        styles.cookItem,
                        {
                          backgroundColor: isSelected ? 'rgba(212,175,55,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? '#D4AF37' : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setCookingPref(cp.id); }}
                    >
                      <Text style={{ fontSize: 22 }}>{cp.emoji}</Text>
                      <Text style={[styles.cookLabel, { color: isSelected ? '#D4AF37' : colors.textPrimary }]}>{cp.label}</Text>
                      <Text style={[styles.cookDesc, { color: colors.textMuted }]}>{cp.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Allergies */}
            <Animated.View entering={FadeInDown.delay(350).duration(300)}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Allergies / Avoid Items</Text>
              <Text style={[styles.formHint, { color: colors.textMuted }]}>Select all that apply</Text>
              <View style={styles.chipRow}>
                {COMMON_ALLERGIES.map(a => {
                  const isSelected = a.id === 'none' ? allergies.length === 0 : allergies.includes(a.id);
                  return (
                    <Pressable
                      key={a.id}
                      style={[
                        styles.allergyChip,
                        {
                          backgroundColor: isSelected ? 'rgba(251,146,60,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          borderColor: isSelected ? '#FB923C' : colors.border,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); toggleAllergy(a.id); }}
                    >
                      <Text style={[styles.allergyLabel, { color: isSelected ? '#FB923C' : colors.textSecondary }]}>{a.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Generate Button */}
            <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.generateWrap}>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={handleGeneratePlan}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53', '#FFB347']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.generateBtn}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="auto-awesome" size={22} color="#FFF" />
                      <Text style={styles.generateText}>Generate My Meal Plan</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
              <Text style={[styles.generateHint, { color: colors.textMuted }]}>
                Preferences saved for future meal plans
              </Text>
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  /* Ask Step */
  askContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  askContent: { alignItems: 'center', gap: 20 },
  askIconWrap: { marginBottom: 8 },
  askIcon: {
    width: 100, height: 100, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  askTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3, lineHeight: 30 },
  askDesc: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  askButtons: { width: '100%', gap: 12, marginTop: 12 },
  askBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: 16,
  },
  askBtnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  askBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: 16, borderWidth: 1.5,
  },
  askBtnSecondaryText: { fontSize: 16, fontWeight: '700' },

  /* Form */
  formScroll: { paddingHorizontal: 20, paddingTop: 24, gap: 28 },
  formLabel: { fontSize: 16, fontWeight: '800', marginBottom: 10, letterSpacing: -0.2 },
  formHint: { fontSize: 12, fontWeight: '500', marginTop: -6, marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5,
  },
  chipLabel: { fontSize: 13, fontWeight: '700' },

  spiceRow: { flexDirection: 'row', gap: 8 },
  spiceItem: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  spiceLabel: { fontSize: 11, fontWeight: '700' },
  spiceDesc: { fontSize: 9, fontWeight: '500' },

  budgetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  budgetItem: {
    width: '47%', alignItems: 'center', gap: 3,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  budgetLabel: { fontSize: 14, fontWeight: '800' },
  budgetDesc: { fontSize: 10, fontWeight: '500' },

  cookRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cookItem: {
    width: '47%', alignItems: 'center', gap: 4,
    paddingVertical: 16, borderRadius: 14, borderWidth: 1.5,
  },
  cookLabel: { fontSize: 13, fontWeight: '700' },
  cookDesc: { fontSize: 10, fontWeight: '500' },

  allergyChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5,
  },
  allergyLabel: { fontSize: 12, fontWeight: '700' },

  /* Generate */
  generateWrap: { alignItems: 'center', paddingTop: 12, gap: 10 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, paddingHorizontal: 40, borderRadius: 18, minWidth: 280,
  },
  generateText: { fontSize: 17, fontWeight: '900', color: '#FFF' },
  generateHint: { fontSize: 11, fontWeight: '500' },
});
