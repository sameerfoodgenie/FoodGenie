import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Step Data ──
const DURATION_OPTIONS = [
  { id: 'today', label: 'Today', emoji: '📅', desc: 'Quick grocery for today' },
  { id: 'weekly', label: 'Weekly', emoji: '🗓️', desc: '7-day grocery plan' },
  { id: 'monthly', label: 'Monthly', emoji: '📦', desc: 'Full month essentials' },
];

const FAMILY_OPTIONS = [
  { id: '1', label: '1 Person', emoji: '🧑', desc: 'Solo living' },
  { id: '2', label: '2 People', emoji: '👫', desc: 'Couple / Roommates' },
  { id: '3-4', label: '3-4 Members', emoji: '👨‍👩‍👧', desc: 'Family' },
  { id: '5+', label: '5+ Members', emoji: '👨‍👩‍👧‍👦', desc: 'Large family' },
];

const MEAL_PLAN_OPTIONS = [
  { id: 'budget', label: 'Budget Friendly', emoji: '💰', color: '#4ADE80' },
  { id: 'healthy', label: 'Healthy Lifestyle', emoji: '🥗', color: '#22C55E' },
  { id: 'high_protein', label: 'High Protein', emoji: '💪', color: '#EF4444' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬', color: '#84C225' },
  { id: 'jain', label: 'Jain', emoji: '🙏', color: '#F5B731' },
  { id: 'family', label: 'Family Meals', emoji: '👨‍👩‍👧‍👦', color: '#7B2FA0' },
  { id: 'kids', label: 'Kids Friendly', emoji: '🧒', color: '#FF6B6B' },
  { id: 'south_indian', label: 'South Indian', emoji: '🍛', color: '#D4AF37' },
  { id: 'north_indian', label: 'North Indian', emoji: '🫓', color: '#F97316' },
  { id: 'gujarati', label: 'Gujarati', emoji: '🥣', color: '#A78BFA' },
  { id: 'custom', label: 'Custom AI Plan', emoji: '🤖', color: '#C41E7A' },
];

const BRAND_OPTIONS = [
  { id: 'aashirvaad', label: 'Aashirvaad', emoji: '🌾' },
  { id: 'fortune', label: 'Fortune', emoji: '🫗' },
  { id: 'amul', label: 'Amul', emoji: '🥛' },
  { id: 'mother_dairy', label: 'Mother Dairy', emoji: '🧈' },
  { id: 'tata', label: 'Tata', emoji: '🏷️' },
  { id: 'patanjali', label: 'Patanjali', emoji: '🌿' },
  { id: 'organic', label: 'Organic Brands', emoji: '🌱' },
  { id: 'no_pref', label: 'No Preference', emoji: '🔄' },
  { id: 'lowest', label: 'Lowest Price', emoji: '💸' },
];

export default function GroceryPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState<string>('');
  const [familySize, setFamilySize] = useState<string>('');
  const [mealPlan, setMealPlan] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  const totalSteps = 4;
  const progress = step / totalSteps;

  const canProceed = () => {
    if (step === 1) return duration !== '';
    if (step === 2) return familySize !== '';
    if (step === 3) return mealPlan !== '';
    if (step === 4) return selectedBrands.size > 0;
    return false;
  };

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Generate grocery plan and navigate
      const planConfig = { duration, familySize, mealPlan, brands: Array.from(selectedBrands) };
      router.push({
        pathname: '/smart-grocery',
        params: { planConfig: JSON.stringify(planConfig) },
      });
    }
  }, [step, duration, familySize, mealPlan, selectedBrands, router]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step > 1) setStep(step - 1);
    else router.back();
  }, [step, router]);

  const toggleBrand = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (id === 'no_pref' || id === 'lowest') {
        return new Set([id]);
      }
      next.delete('no_pref');
      next.delete('lowest');
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const getStepTitle = () => {
    if (step === 1) return 'What are you planning groceries for?';
    if (step === 2) return 'How many people?';
    if (step === 3) return 'What type of meal plan?';
    return 'Preferred grocery brands?';
  };

  const getStepSubtitle = () => {
    if (step === 1) return 'We will optimize quantities and savings based on duration';
    if (step === 2) return 'Helps calculate right quantities for your household';
    if (step === 3) return 'AI will curate grocery list based on your diet preference';
    return 'Select brands you prefer or choose lowest price';
  };

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={st.header}>
          <Pressable style={({ pressed }) => [st.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Plan Your Groceries</Text>
            <Text style={[st.headerStep, { color: colors.textMuted }]}>Step {step} of {totalSteps}</Text>
          </View>
          <View style={[st.stepBadge, { backgroundColor: 'rgba(123,47,160,0.08)' }]}>
            <Text style={st.stepBadgeText}>{step}/{totalSteps}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={[st.progressWrap, { backgroundColor: colors.border }]}>
          <Animated.View style={[st.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Question */}
          <Animated.View key={`step-${step}`} entering={FadeInDown.duration(300)}>
            <Text style={[st.question, { color: colors.textPrimary }]}>{getStepTitle()}</Text>
            <Text style={[st.questionSub, { color: colors.textMuted }]}>{getStepSubtitle()}</Text>
          </Animated.View>

          {/* Step 1: Duration */}
          {step === 1 ? (
            <View style={st.optionsGrid}>
              {DURATION_OPTIONS.map((opt, i) => (
                <Animated.View key={opt.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [
                      st.optionCard,
                      {
                        backgroundColor: duration === opt.id ? (isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.05)') : colors.surface,
                        borderColor: duration === opt.id ? '#7B2FA0' : colors.border,
                        borderWidth: duration === opt.id ? 2 : 1,
                      },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setDuration(opt.id); }}
                  >
                    <Text style={{ fontSize: 32 }}>{opt.emoji}</Text>
                    <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[st.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                    {duration === opt.id ? (
                      <View style={st.optionCheck}>
                        <MaterialIcons name="check-circle" size={20} color="#7B2FA0" />
                      </View>
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {/* Step 2: Family Size */}
          {step === 2 ? (
            <View style={st.optionsGrid}>
              {FAMILY_OPTIONS.map((opt, i) => (
                <Animated.View key={opt.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [
                      st.optionCard,
                      {
                        backgroundColor: familySize === opt.id ? (isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.05)') : colors.surface,
                        borderColor: familySize === opt.id ? '#7B2FA0' : colors.border,
                        borderWidth: familySize === opt.id ? 2 : 1,
                      },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setFamilySize(opt.id); }}
                  >
                    <Text style={{ fontSize: 32 }}>{opt.emoji}</Text>
                    <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[st.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                    {familySize === opt.id ? (
                      <View style={st.optionCheck}>
                        <MaterialIcons name="check-circle" size={20} color="#7B2FA0" />
                      </View>
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {/* Step 3: Meal Plan */}
          {step === 3 ? (
            <View style={st.mealGrid}>
              {MEAL_PLAN_OPTIONS.map((opt, i) => (
                <Animated.View key={opt.id} entering={FadeInDown.delay(i * 40).duration(250)}>
                  <Pressable
                    style={({ pressed }) => [
                      st.mealChip,
                      {
                        backgroundColor: mealPlan === opt.id ? `${opt.color}15` : colors.surface,
                        borderColor: mealPlan === opt.id ? opt.color : colors.border,
                        borderWidth: mealPlan === opt.id ? 2 : 1,
                      },
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setMealPlan(opt.id); }}
                  >
                    <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                    <Text style={[st.mealChipLabel, { color: mealPlan === opt.id ? opt.color : colors.textPrimary }]}>{opt.label}</Text>
                    {mealPlan === opt.id ? <MaterialIcons name="check" size={14} color={opt.color} /> : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {/* Step 4: Brands */}
          {step === 4 ? (
            <View style={st.brandGrid}>
              {BRAND_OPTIONS.map((opt, i) => {
                const isSelected = selectedBrands.has(opt.id);
                return (
                  <Animated.View key={opt.id} entering={FadeInDown.delay(i * 40).duration(250)}>
                    <Pressable
                      style={({ pressed }) => [
                        st.brandChip,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(245,183,49,0.12)' : 'rgba(245,183,49,0.06)') : colors.surface,
                          borderColor: isSelected ? '#F5B731' : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                        pressed && { opacity: 0.9 },
                      ]}
                      onPress={() => toggleBrand(opt.id)}
                    >
                      <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                      <Text style={[st.brandChipLabel, { color: isSelected ? '#D9A020' : colors.textPrimary }]}>{opt.label}</Text>
                      {isSelected ? (
                        <View style={st.brandCheck}>
                          <MaterialIcons name="check" size={10} color="#FFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[st.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <LinearGradient
              colors={canProceed() ? ['#7B2FA0', '#1E1456'] : ['#9A9AB0', '#9A9AB0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.nextBtn}
            >
              <Text style={st.nextBtnText}>{step === totalSteps ? 'Generate Grocery Plan' : 'Continue'}</Text>
              <MaterialIcons name={step === totalSteps ? 'auto-awesome' : 'arrow-forward'} size={18} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerStep: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  stepBadgeText: { fontSize: 12, fontWeight: '800', color: '#7B2FA0' },

  progressWrap: { height: 4, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7B2FA0', borderRadius: 2 },

  question: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3, lineHeight: 28 },
  questionSub: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 6, marginBottom: 24 },

  // Options Grid (Duration / Family)
  optionsGrid: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 18, position: 'relative',
  },
  optionLabel: { fontSize: 16, fontWeight: '800' },
  optionDesc: { fontSize: 12, fontWeight: '500', position: 'absolute', right: 50, top: 24 },
  optionCheck: { position: 'absolute', right: 16, top: '50%', marginTop: -10 },

  // Meal Grid
  mealGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mealChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
  },
  mealChipLabel: { fontSize: 13, fontWeight: '700' },

  // Brand Grid
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  brandChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
  },
  brandChipLabel: { fontSize: 13, fontWeight: '700' },
  brandCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#F5B731', alignItems: 'center', justifyContent: 'center' },

  // Bottom
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
