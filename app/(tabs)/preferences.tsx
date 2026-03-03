import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAlert, useAuth } from '@/template';
import { CustomSlider } from '../../components/CustomSlider';

// ── Constants ──

const DIET_OPTIONS = [
  { id: 'veg', label: 'Veg Only', emoji: '🥬' },
  { id: 'egg', label: 'Egg', emoji: '🥚' },
  { id: 'nonveg', label: 'Non-Veg', emoji: '🍗' },
] as const;

const SPICE_OPTIONS = [
  { level: 1, label: 'Mild', emoji: '😌' },
  { level: 2, label: 'Medium', emoji: '🌶️' },
  { level: 3, label: 'Spicy', emoji: '🔥' },
] as const;

const HEALTH_GOALS = [
  { id: 'none', label: 'No Preference', emoji: '😊' },
  { id: 'weight_loss', label: 'Weight Loss', emoji: '⚖️' },
  { id: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { id: 'balanced', label: 'Balanced', emoji: '🧘' },
] as const;

const DELIVERY_PRIORITIES = [
  { id: 'fastest', label: 'Fastest', icon: 'flash-on' as const, desc: 'Quickest delivery time' },
  { id: 'most_reliable', label: 'Most Reliable', icon: 'verified' as const, desc: 'Highest trust score' },
  { id: 'best_rated', label: 'Best Rated', icon: 'star' as const, desc: 'Top rated kitchens' },
] as const;

const CUISINE_OPTIONS = [
  'North Indian', 'South Indian', 'Chinese', 'Mughlai', 'Street Food',
  'Healthy', 'Thali', 'Fast Casual', 'Desserts', 'Beverages',
  'Biryani', 'Punjabi', 'Continental',
];

const COMMON_AVOID_TAGS = [
  'Peanuts', 'Gluten', 'Dairy', 'Soy', 'Shellfish', 'Mushroom',
  'Onion', 'Garlic', 'MSG', 'Ajinomoto', 'Maida',
];

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const {
    preferences,
    updatePreferences,
    syncPreferencesToDB,
    advancedPrefs,
    updateAdvancedPrefs,
    syncAdvancedPrefsToDB,
  } = useApp();

  // Local editing state
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Core prefs local state
  const [diet, setDiet] = useState<'veg' | 'egg' | 'nonveg' | null>(preferences.diet);
  const [budgetMin, setBudgetMin] = useState(preferences.budgetMin);
  const [budgetMax, setBudgetMax] = useState(preferences.budgetMax);
  const [spiceLevel, setSpiceLevel] = useState(preferences.spiceLevel);

  // Advanced prefs local state
  const [healthGoal, setHealthGoal] = useState(advancedPrefs.healthGoal);
  const [deliveryPriority, setDeliveryPriority] = useState(advancedPrefs.deliveryPriority);
  const [cuisineBias, setCuisineBias] = useState<string[]>(advancedPrefs.cuisineBias);
  const [avoidTags, setAvoidTags] = useState<string[]>(advancedPrefs.avoidTags);
  const [heightCm, setHeightCm] = useState(advancedPrefs.heightCm?.toString() || '');
  const [weightKg, setWeightKg] = useState(advancedPrefs.weightKg?.toString() || '');
  const [customAvoid, setCustomAvoid] = useState('');

  // Sync from context when prefs change
  useEffect(() => {
    setDiet(preferences.diet);
    setBudgetMin(preferences.budgetMin);
    setBudgetMax(preferences.budgetMax);
    setSpiceLevel(preferences.spiceLevel);
  }, [preferences]);

  useEffect(() => {
    setHealthGoal(advancedPrefs.healthGoal);
    setDeliveryPriority(advancedPrefs.deliveryPriority);
    setCuisineBias(advancedPrefs.cuisineBias);
    setAvoidTags(advancedPrefs.avoidTags);
    setHeightCm(advancedPrefs.heightCm?.toString() || '');
    setWeightKg(advancedPrefs.weightKg?.toString() || '');
  }, [advancedPrefs]);

  const bmi = (() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (h > 0 && w > 0) {
      return (w / ((h / 100) ** 2)).toFixed(1);
    }
    return null;
  })();

  const bmiCategory = (() => {
    if (!bmi) return null;
    const v = parseFloat(bmi);
    if (v < 18.5) return { label: 'Underweight', color: '#3B82F6' };
    if (v < 25) return { label: 'Normal', color: theme.success };
    if (v < 30) return { label: 'Overweight', color: theme.warning };
    return { label: 'Obese', color: theme.error };
  })();

  const handleSaveCore = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePreferences({ diet, budgetMin, budgetMax, spiceLevel });
    await syncPreferencesToDB({ diet, budgetMin, budgetMax, spiceLevel });
    setEditingSection(null);
    showAlert('Saved', 'Core preferences updated. Your Genie will adapt instantly.');
  }, [diet, budgetMin, budgetMax, spiceLevel, updatePreferences, syncPreferencesToDB, showAlert]);

  const handleSaveAdvanced = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const h = parseFloat(heightCm) || null;
    const w = parseFloat(weightKg) || null;
    const computedBmi = (h && w) ? parseFloat((w / ((h / 100) ** 2)).toFixed(1)) : null;

    updateAdvancedPrefs({
      healthGoal,
      deliveryPriority,
      cuisineBias,
      avoidTags,
      heightCm: h,
      weightKg: w,
      bmi: computedBmi,
    });
    await syncAdvancedPrefsToDB({
      health_goal: healthGoal,
      delivery_priority: deliveryPriority,
      cuisine_bias: cuisineBias,
      avoid_tags: avoidTags,
      height_cm: h,
      weight_kg: w,
      bmi: computedBmi,
    });
    setEditingSection(null);
    showAlert('Saved', 'Advanced preferences updated.');
  }, [healthGoal, deliveryPriority, cuisineBias, avoidTags, heightCm, weightKg, updateAdvancedPrefs, syncAdvancedPrefsToDB, showAlert]);

  const toggleCuisine = useCallback((c: string) => {
    Haptics.selectionAsync();
    setCuisineBias(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }, []);

  const toggleAvoid = useCallback((t: string) => {
    Haptics.selectionAsync();
    setAvoidTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }, []);

  const addCustomAvoid = useCallback(() => {
    const tag = customAvoid.trim();
    if (tag && !avoidTags.includes(tag)) {
      setAvoidTags(prev => [...prev, tag]);
      setCustomAvoid('');
      Haptics.selectionAsync();
    }
  }, [customAvoid, avoidTags]);

  const isEditingCore = editingSection === 'core';
  const isEditingAdvanced = editingSection === 'advanced';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={styles.title}>My Taste Profile</Text>
            <Text style={styles.subtitle}>This is how your Genie thinks.</Text>
          </Animated.View>

          {/* ─── CORE PREFERENCES ─── */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="restaurant" size={20} color={theme.primary} />
                  <Text style={styles.sectionTitle}>Core Preferences</Text>
                </View>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setEditingSection(isEditingCore ? null : 'core');
                  }}
                >
                  <MaterialIcons name={isEditingCore ? 'close' : 'edit'} size={16} color={theme.primary} />
                  <Text style={styles.editBtnText}>{isEditingCore ? 'Cancel' : 'Edit'}</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                {/* Diet Type */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Diet Type</Text>
                  <View style={styles.optionRow}>
                    {DIET_OPTIONS.map(opt => {
                      const selected = diet === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[styles.optionPill, selected && styles.optionPillSelected, !isEditingCore && styles.optionDisabled]}
                          onPress={() => { if (isEditingCore) { Haptics.selectionAsync(); setDiet(opt.id); } }}
                        >
                          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Budget Range */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Budget Range</Text>
                  <View style={styles.budgetDisplay}>
                    <Text style={styles.budgetText}>₹{budgetMin} – ₹{budgetMax}</Text>
                  </View>
                  {isEditingCore ? (
                    <View style={styles.sliderArea}>
                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>Min ₹{budgetMin}</Text>
                        <View style={styles.sliderWrap}>
                          <CustomSlider
                            value={budgetMin}
                            minimumValue={50}
                            maximumValue={budgetMax - 50}
                            step={50}
                            onValueChange={setBudgetMin}
                          />
                        </View>
                      </View>
                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>Max ₹{budgetMax}</Text>
                        <View style={styles.sliderWrap}>
                          <CustomSlider
                            value={budgetMax}
                            minimumValue={budgetMin + 50}
                            maximumValue={1500}
                            step={50}
                            onValueChange={setBudgetMax}
                          />
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Spice Level */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Spice Level</Text>
                  <View style={styles.optionRow}>
                    {SPICE_OPTIONS.map(opt => {
                      const selected = spiceLevel === opt.level;
                      return (
                        <Pressable
                          key={opt.level}
                          style={[styles.optionPill, selected && styles.optionPillSelected, !isEditingCore && styles.optionDisabled]}
                          onPress={() => { if (isEditingCore) { Haptics.selectionAsync(); setSpiceLevel(opt.level); } }}
                        >
                          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Health Goal */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Health Goal</Text>
                  <View style={styles.optionRow}>
                    {HEALTH_GOALS.map(opt => {
                      const selected = healthGoal === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[styles.optionPillSmall, selected && styles.optionPillSelected, !isEditingCore && styles.optionDisabled]}
                          onPress={() => { if (isEditingCore) { Haptics.selectionAsync(); setHealthGoal(opt.id); } }}
                        >
                          <Text style={styles.optionEmojiSmall}>{opt.emoji}</Text>
                          <Text style={[styles.optionLabelSmall, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {isEditingCore ? (
                  <Pressable style={styles.saveBtn} onPress={handleSaveCore}>
                    <LinearGradient colors={theme.gradients.goldShine} style={styles.saveBtnGradient}>
                      <MaterialIcons name="check" size={18} color={theme.textOnPrimary} />
                      <Text style={styles.saveBtnText}>Save Core Preferences</Text>
                    </LinearGradient>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* ─── ADVANCED PREFERENCES ─── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="tune" size={20} color={theme.primary} />
                  <Text style={styles.sectionTitle}>Advanced Preferences</Text>
                </View>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setEditingSection(isEditingAdvanced ? null : 'advanced');
                  }}
                >
                  <MaterialIcons name={isEditingAdvanced ? 'close' : 'edit'} size={16} color={theme.primary} />
                  <Text style={styles.editBtnText}>{isEditingAdvanced ? 'Cancel' : 'Edit'}</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                {/* BMI Calculator */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>BMI Calculator (Optional)</Text>
                  {isEditingAdvanced ? (
                    <View style={styles.bmiInputRow}>
                      <View style={styles.bmiInputGroup}>
                        <Text style={styles.bmiInputLabel}>Height (cm)</Text>
                        <TextInput
                          style={styles.bmiInput}
                          value={heightCm}
                          onChangeText={setHeightCm}
                          keyboardType="numeric"
                          placeholder="170"
                          placeholderTextColor={theme.textMuted}
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.bmiInputGroup}>
                        <Text style={styles.bmiInputLabel}>Weight (kg)</Text>
                        <TextInput
                          style={styles.bmiInput}
                          value={weightKg}
                          onChangeText={setWeightKg}
                          keyboardType="numeric"
                          placeholder="70"
                          placeholderTextColor={theme.textMuted}
                          maxLength={3}
                        />
                      </View>
                    </View>
                  ) : null}
                  {bmi ? (
                    <View style={styles.bmiResult}>
                      <Text style={styles.bmiValue}>BMI: {bmi}</Text>
                      <View style={[styles.bmiCategoryBadge, { backgroundColor: `${bmiCategory?.color}20` }]}>
                        <Text style={[styles.bmiCategoryText, { color: bmiCategory?.color }]}>
                          {bmiCategory?.label}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.bmiHint}>Enter height and weight to calculate</Text>
                  )}
                </View>

                {/* Delivery Priority */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Delivery Priority</Text>
                  <View style={styles.priorityList}>
                    {DELIVERY_PRIORITIES.map(opt => {
                      const selected = deliveryPriority === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[styles.priorityItem, selected && styles.priorityItemSelected, !isEditingAdvanced && styles.optionDisabled]}
                          onPress={() => { if (isEditingAdvanced) { Haptics.selectionAsync(); setDeliveryPriority(opt.id); } }}
                        >
                          <View style={[styles.priorityIcon, selected && styles.priorityIconSelected]}>
                            <MaterialIcons name={opt.icon} size={18} color={selected ? theme.textOnPrimary : theme.textMuted} />
                          </View>
                          <View style={styles.priorityText}>
                            <Text style={[styles.priorityLabel, selected && styles.priorityLabelSelected]}>{opt.label}</Text>
                            <Text style={styles.priorityDesc}>{opt.desc}</Text>
                          </View>
                          {selected ? (
                            <MaterialIcons name="check-circle" size={20} color={theme.primary} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Cuisine Bias */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Cuisine Preferences</Text>
                  <Text style={styles.fieldHint}>Select cuisines you prefer. AI will prioritize these.</Text>
                  <View style={styles.chipGrid}>
                    {CUISINE_OPTIONS.map(c => {
                      const selected = cuisineBias.includes(c);
                      return (
                        <Pressable
                          key={c}
                          style={[styles.multiChip, selected && styles.multiChipSelected, !isEditingAdvanced && styles.optionDisabled]}
                          onPress={() => { if (isEditingAdvanced) toggleCuisine(c); }}
                        >
                          <Text style={[styles.multiChipText, selected && styles.multiChipTextSelected]}>{c}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Avoid Ingredients */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Avoid Ingredients</Text>
                  <Text style={styles.fieldHint}>Dishes with these tags will be deprioritized.</Text>
                  <View style={styles.chipGrid}>
                    {COMMON_AVOID_TAGS.map(t => {
                      const selected = avoidTags.includes(t);
                      return (
                        <Pressable
                          key={t}
                          style={[styles.avoidChip, selected && styles.avoidChipSelected, !isEditingAdvanced && styles.optionDisabled]}
                          onPress={() => { if (isEditingAdvanced) toggleAvoid(t); }}
                        >
                          <Text style={[styles.avoidChipText, selected && styles.avoidChipTextSelected]}>{t}</Text>
                          {selected ? <MaterialIcons name="close" size={12} color="#EF4444" /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  {isEditingAdvanced ? (
                    <View style={styles.customAvoidRow}>
                      <TextInput
                        style={styles.customAvoidInput}
                        value={customAvoid}
                        onChangeText={setCustomAvoid}
                        placeholder="Add custom ingredient..."
                        placeholderTextColor={theme.textMuted}
                        onSubmitEditing={addCustomAvoid}
                        returnKeyType="done"
                      />
                      <Pressable
                        style={({ pressed }) => [styles.customAvoidBtn, pressed && { opacity: 0.7 }]}
                        onPress={addCustomAvoid}
                      >
                        <MaterialIcons name="add" size={20} color={theme.primary} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                {isEditingAdvanced ? (
                  <Pressable style={styles.saveBtn} onPress={handleSaveAdvanced}>
                    <LinearGradient colors={theme.gradients.goldShine} style={styles.saveBtnGradient}>
                      <MaterialIcons name="check" size={18} color={theme.textOnPrimary} />
                      <Text style={styles.saveBtnText}>Save Advanced Preferences</Text>
                    </LinearGradient>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* ─── AI INFLUENCE NOTE ─── */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.aiNote}>
              <LinearGradient
                colors={['rgba(251,191,36,0.08)', 'rgba(251,191,36,0.02)']}
                style={styles.aiNoteGradient}
              >
                <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
                <View style={styles.aiNoteText}>
                  <Text style={styles.aiNoteTitle}>Your preferences shape AI results</Text>
                  <Text style={styles.aiNoteDesc}>
                    Every change you make here immediately influences how FoodGenie ranks and recommends dishes for you.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Header
  header: { paddingTop: 16, paddingBottom: 8, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: theme.textPrimary },
  subtitle: { fontSize: 15, color: theme.textSecondary, marginTop: 4 },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  // Card
  card: {
    backgroundColor: 'rgba(20,20,20,0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.12)',
    ...theme.shadows.card,
  },

  // Fields
  fieldBlock: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  fieldHint: { fontSize: 12, color: theme.textMuted, marginBottom: 10 },

  // Option pills (diet, spice)
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(31,31,31,0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(63,63,70,0.4)',
  },
  optionPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(31,31,31,0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(63,63,70,0.4)',
  },
  optionPillSelected: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.5)',
  },
  optionDisabled: { opacity: 0.7 },
  optionEmoji: { fontSize: 18 },
  optionEmojiSmall: { fontSize: 15 },
  optionLabel: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },
  optionLabelSmall: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  optionLabelSelected: { color: theme.primary, fontWeight: '600' },

  // Budget
  budgetDisplay: {
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    marginBottom: 8,
  },
  budgetText: { fontSize: 18, fontWeight: '700', color: theme.primary },
  sliderArea: { gap: 16, marginTop: 8 },
  sliderRow: { gap: 6 },
  sliderLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted },
  sliderWrap: { marginHorizontal: -4 },

  // BMI
  bmiInputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  bmiInputGroup: { flex: 1, gap: 6 },
  bmiInputLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted },
  bmiInput: {
    backgroundColor: 'rgba(31,31,31,0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.4)',
    textAlign: 'center',
  },
  bmiResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bmiValue: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  bmiCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bmiCategoryText: { fontSize: 12, fontWeight: '700' },
  bmiHint: { fontSize: 13, color: theme.textMuted, fontStyle: 'italic' },

  // Delivery Priority
  priorityList: { gap: 8 },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(31,31,31,0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(63,63,70,0.3)',
  },
  priorityItemSelected: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.4)',
  },
  priorityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(63,63,70,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityIconSelected: {
    backgroundColor: 'rgba(251,191,36,0.25)',
  },
  priorityText: { flex: 1 },
  priorityLabel: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  priorityLabelSelected: { color: theme.textPrimary },
  priorityDesc: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

  // Cuisine & Avoid chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(31,31,31,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.4)',
  },
  multiChipSelected: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.5)',
  },
  multiChipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  multiChipTextSelected: { color: theme.primary, fontWeight: '600' },

  avoidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(31,31,31,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.4)',
  },
  avoidChipSelected: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  avoidChipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  avoidChipTextSelected: { color: '#EF4444', fontWeight: '600' },

  customAvoidRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  customAvoidInput: {
    flex: 1,
    backgroundColor: 'rgba(31,31,31,0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.4)',
  },
  customAvoidBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Save button
  saveBtn: { marginTop: 4, borderRadius: 14, overflow: 'hidden' },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },

  // AI Note
  aiNote: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  aiNoteGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  aiNoteText: { flex: 1 },
  aiNoteTitle: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  aiNoteDesc: { fontSize: 13, color: theme.textSecondary, lineHeight: 19 },
});
