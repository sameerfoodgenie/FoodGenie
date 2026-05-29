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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '@/template';
import { generateSmartGroceryPlan, PlanConfig, fetchUserDietPreference } from '../services/groceryPlannerService';
import { getPantryDeductions } from '../services/pantryService';

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

const BUDGET_OPTIONS = [
  { id: '3000', label: '₹3,000', emoji: '💰', desc: 'Budget conscious', value: 3000 },
  { id: '5000', label: '₹5,000', emoji: '💵', desc: 'Standard household', value: 5000 },
  { id: '8000', label: '₹8,000', emoji: '💳', desc: 'Comfortable family', value: 8000 },
  { id: '10000', label: '₹10,000', emoji: '🏷️', desc: 'Premium quality', value: 10000 },
  { id: '15000', label: '₹15,000+', emoji: '👑', desc: 'No budget limit', value: 15000 },
];

export default function GroceryPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState<string>('');
  const [familySize, setFamilySize] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const totalSteps = 3;
  const progress = step / totalSteps;

  const canProceed = () => {
    if (step === 1) return duration !== '';
    if (step === 2) return familySize !== '';
    if (step === 3) return budget !== '';
    return false;
  };

  const handleNext = useCallback(async () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Generate plan
      setGenerating(true);

      // Fetch user dietary preference from DB
      let dietType = 'vegetarian';
      if (user?.id) {
        dietType = await fetchUserDietPreference(user.id);
      }

      const budgetValue = BUDGET_OPTIONS.find(b => b.id === budget)?.value || 5000;
      const planConfig: PlanConfig = {
        duration,
        familySize,
        budget: budgetValue,
        brands: [],
        dietType,
      };

      // Fetch pantry deductions to auto-subtract existing stock
      let pantryDeductions: Record<string, number> = {};
      if (user?.id) {
        pantryDeductions = await getPantryDeductions(user.id);
      }

      const plan = generateSmartGroceryPlan(planConfig, pantryDeductions);

      // Format into grocery-cart compatible data
      const meals = [{
        ingredients: plan.items.map(item => `${item.name} ${item.recommendedPack}`),
      }];

      const planType = `${plan.planSummary.planType} (${plan.planSummary.people}, ${plan.planSummary.durationDays} days, ${dietType})`;

      setGenerating(false);

      router.push({
        pathname: '/grocery-cart',
        params: {
          planData: JSON.stringify({
            meals,
            planResult: plan,
          }),
          planType,
        },
      });
    }
  }, [step, duration, familySize, budget, user?.id, router]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step > 1) setStep(step - 1);
    else router.back();
  }, [step, router]);

  const getStepTitle = () => {
    if (step === 1) return 'What are you planning groceries for?';
    if (step === 2) return 'How many people?';
    return 'What is your grocery budget?';
  };

  const getStepSubtitle = () => {
    if (step === 1) return 'AI will optimize quantities and savings based on duration';
    if (step === 2) return 'Quantities calculated with buffer for realistic household usage';
    return 'We will optimize grocery within your budget with best value packs';
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
                    <View style={{ flex: 1 }}>
                      <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[st.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                    </View>
                    {duration === opt.id ? (
                      <MaterialIcons name="check-circle" size={20} color="#7B2FA0" />
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
                    <View style={{ flex: 1 }}>
                      <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[st.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                    </View>
                    {familySize === opt.id ? (
                      <MaterialIcons name="check-circle" size={20} color="#7B2FA0" />
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {/* Step 3: Budget */}
          {step === 3 ? (
            <View style={st.optionsGrid}>
              {BUDGET_OPTIONS.map((opt, i) => (
                <Animated.View key={opt.id} entering={FadeInDown.delay(i * 50).duration(280)}>
                  <Pressable
                    style={({ pressed }) => [
                      st.optionCard,
                      {
                        backgroundColor: budget === opt.id ? (isDark ? 'rgba(245,183,49,0.10)' : 'rgba(245,183,49,0.04)') : colors.surface,
                        borderColor: budget === opt.id ? '#F5B731' : colors.border,
                        borderWidth: budget === opt.id ? 2 : 1,
                      },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setBudget(opt.id); }}
                  >
                    <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[st.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                    </View>
                    {budget === opt.id ? (
                      <MaterialIcons name="check-circle" size={20} color="#F5B731" />
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}

              {/* Selected summary */}
              {duration && familySize ? (
                <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                  <View style={[st.summaryCard, { backgroundColor: isDark ? 'rgba(123,47,160,0.06)' : 'rgba(123,47,160,0.02)', borderColor: 'rgba(123,47,160,0.15)' }]}>
                    <MaterialIcons name="summarize" size={16} color="#7B2FA0" />
                    <View style={{ flex: 1 }}>
                      <Text style={[st.summaryTitle, { color: colors.textPrimary }]}>Plan Summary</Text>
                      <Text style={[st.summaryText, { color: colors.textMuted }]}>
                        {duration === 'monthly' ? '30 days' : duration === 'weekly' ? '7 days' : 'Today'} • {
                          familySize === '3-4' ? '3-4 members' : familySize === '5+' ? '5+ members' : `${familySize} person`
                        } • 3 meals/day • Dietary preferences auto-applied
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[st.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleNext}
            disabled={!canProceed() || generating}
          >
            <LinearGradient
              colors={canProceed() ? ['#7B2FA0', '#1E1456'] : ['#9A9AB0', '#9A9AB0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.nextBtn}
            >
              {generating ? (
                <Text style={st.nextBtnText}>Generating Plan...</Text>
              ) : (
                <>
                  <Text style={st.nextBtnText}>{step === totalSteps ? 'Generate Grocery Plan' : 'Continue'}</Text>
                  <MaterialIcons name={step === totalSteps ? 'auto-awesome' : 'arrow-forward'} size={18} color="#FFF" />
                </>
              )}
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

  // Options Grid
  optionsGrid: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 18,
  },
  optionLabel: { fontSize: 16, fontWeight: '800' },
  optionDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Summary
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4,
  },
  summaryTitle: { fontSize: 12, fontWeight: '800' },
  summaryText: { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 },

  // Bottom
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
