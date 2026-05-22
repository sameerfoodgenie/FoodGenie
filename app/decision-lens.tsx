import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { exportMealPlanPDF } from '../services/pdfExportService';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth, useAlert } from '../template';
import { useCoin } from '../hooks/useCoin';
import { loadPreferences, loadAdvancedPreferences } from '../services/preferencesService';
import { generateMealPlan, generateCookingSteps, generateMealSwaps, TodayPlan, WeeklyPlan, MonthlyPlan, MealItem, CookingStepsData, SwapAlternative } from '../services/mealPlannerService';
import { COIN_RULES } from '../services/coinService';
import {
  loadSubscription,
  deductTokens,
  isSubscriptionActive,
  TOKEN_COSTS as SUB_TOKEN_COSTS,
  UserSubscription,
} from '../services/subscriptionService';

const { width: SCREEN_W } = Dimensions.get('window');

const PERSONS_OPTIONS = [1, 2, 3, 4, 5, 6];

type PlanTab = 'today' | 'weekly' | 'monthly';

const PLAN_TABS: { id: PlanTab; label: string; emoji: string }[] = [
  { id: 'today', label: 'Today', emoji: '☀️' },
  { id: 'weekly', label: 'Weekly', emoji: '📅' },
  { id: 'monthly', label: 'Monthly', emoji: '🗓️' },
];

const MEAL_ICONS: Record<string, { emoji: string; gradient: readonly [string, string] }> = {
  breakfast: { emoji: '☀️', gradient: ['#F5B731', '#FDD85D'] as const },
  lunch: { emoji: '🍽️', gradient: ['#1E1456', '#7B2FA0'] as const },
  snack: { emoji: '🍿', gradient: ['#C41E7A', '#7B2FA0'] as const },
  dinner: { emoji: '🌙', gradient: ['#7B2FA0', '#1E1456'] as const },
};

const DAY_COLORS = ['#1E1456', '#7B2FA0', '#F5B731', '#C41E7A', '#F04E50', '#2D1F6B', '#D9A020'];

// ── Nutrition Ring ──
function NutritionRing({ label, value, unit, color, size = 64, colors, isDark }: {
  label: string; value: number; unit: string; color: string; size?: number; colors: any; isDark: boolean;
}) {
  return (
    <View style={[nr.container, { width: size + 20 }]}>
      <View style={[nr.ring, { width: size, height: size, borderColor: isDark ? 'rgba(123,47,160,0.25)' : 'rgba(30,20,86,0.12)' }]}>
        <View style={[nr.ringFill, { borderColor: color || '#F5B731' }]} />
        <Text style={[nr.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[nr.unit, { color: isDark ? 'rgba(191,183,212,0.80)' : 'rgba(123,47,160,0.60)' }]}>{unit}</Text>
      </View>
      <Text style={[nr.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ── Animated Macro Chip ──
function AnimatedMacroChip({ label, value, unit, color, bgColor, index, isDark }: {
  label: string; value: number; unit: string; color: string; bgColor: string; index: number; isDark?: boolean;
}) {
  const adaptedColor = isDark ? (color === '#7B2FA0' ? '#BF7AE0' : color === '#D9A020' ? '#FDD85D' : color === '#F04E50' ? '#FF8A7B' : color === '#1E1456' ? '#BFB7D4' : color) : color;
  return (
    <Animated.View
      entering={SlideInRight.delay(200 + index * 100).duration(350).springify().damping(14)}
      style={[mc.macroItem, { backgroundColor: isDark ? `${adaptedColor}15` : bgColor }]}
    >
      <Animated.Text
        entering={ZoomIn.delay(350 + index * 100).duration(300)}
        style={[mc.macroValue, { color: adaptedColor }]}
      >
        {value}{unit}
      </Animated.Text>
      <Text style={[mc.macroLabel, { color: isDark ? '#7A728E' : '#9CA3AF' }]}>{label}</Text>
    </Animated.View>
  );
}

// ── Cooking Steps View ──
function CookingStepsView({ steps, colors, isDark }: {
  steps: CookingStepsData; colors: any; isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[cs.container, { backgroundColor: isDark ? 'rgba(30,20,86,0.04)' : 'rgba(30,20,86,0.02)', borderColor: 'rgba(123,47,160,0.15)' }]}>
      <View style={cs.header}>
        <View style={{ flex: 1 }}>
          <Text style={[cs.title, { color: colors.textPrimary }]}>🧑‍🍳 Cooking Steps</Text>
          <View style={cs.metaRow}>
            <View style={[cs.metaBadge, { backgroundColor: 'rgba(245,183,49,0.10)' }]}>
              <Text style={[cs.metaText, { color: '#D9A020' }]}>⏱️ {steps.totalTime}</Text>
            </View>
            <View style={[cs.metaBadge, { backgroundColor: 'rgba(123,47,160,0.08)' }]}>
              <Text style={[cs.metaText, { color: '#7B2FA0' }]}>👤 {steps.servings} serving{steps.servings > 1 ? 's' : ''}</Text>
            </View>
            <View style={[cs.metaBadge, { backgroundColor: steps.difficulty === 'Hard' ? 'rgba(240,78,80,0.08)' : steps.difficulty === 'Medium' ? 'rgba(245,183,49,0.08)' : 'rgba(74,222,128,0.08)' }]}>
              <Text style={[cs.metaText, { color: steps.difficulty === 'Hard' ? '#F04E50' : steps.difficulty === 'Medium' ? '#D9A020' : '#16A34A' }]}>{steps.difficulty}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={cs.stepsList}>
        {steps.steps.map((step, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(i * 60).duration(250)} style={cs.stepItem}>
            <View style={[cs.stepNumber, { backgroundColor: i === steps.steps.length - 1 ? '#F5B731' : '#7B2FA0' }]}>
              <Text style={cs.stepNumText}>{step.step}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[cs.stepTitle, { color: colors.textPrimary }]}>{step.title}</Text>
              <Text style={[cs.stepInstruction, { color: colors.textSecondary }]}>{step.instruction}</Text>
              <View style={cs.stepFooter}>
                <Text style={[cs.stepDuration, { color: colors.textMuted }]}>⏱️ {step.duration}</Text>
                {step.tip ? <Text style={[cs.stepTip, { color: '#7B2FA0' }]}>💡 {step.tip}</Text> : null}
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
      {steps.chefTip ? (
        <View style={[cs.chefTipBox, { backgroundColor: 'rgba(245,183,49,0.06)', borderColor: 'rgba(245,183,49,0.20)' }]}>
          <Text style={{ fontSize: 14 }}>👨‍🍳</Text>
          <View style={{ flex: 1 }}>
            <Text style={[cs.chefTipLabel, { color: '#D9A020' }]}>Chef Tip</Text>
            <Text style={[cs.chefTipText, { color: colors.textSecondary }]}>{steps.chefTip}</Text>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

// ── Meal Card ──
function MealCard({ meal, index, colors, isDark, router, persons, prefs, onSwap }: {
  meal: MealItem; index: number; colors: any; isDark: boolean; router: any; persons: number;
  prefs?: any; onSwap?: (index: number, newMeal: MealItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cookingSteps, setCookingSteps] = useState<CookingStepsData | null>(null);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapOptions, setSwapOptions] = useState<SwapAlternative[] | null>(null);
  const config = MEAL_ICONS[meal.type] || MEAL_ICONS.lunch;

  const handleSwapMeal = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (swapOptions) {
      setShowSwap(!showSwap);
      return;
    }
    setSwapLoading(true);
    setShowSwap(true);
    const { data, error } = await generateMealSwaps(
      meal,
      { diet: prefs?.diet, spiceLevel: prefs?.spiceLevel, cuisineBias: prefs?.cuisineBias },
      persons,
    );
    if (data) setSwapOptions(data);
    setSwapLoading(false);
  }, [swapOptions, showSwap, meal, prefs, persons]);

  const handleSelectSwap = useCallback((alt: SwapAlternative) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newMeal: MealItem = {
      type: meal.type,
      name: alt.name,
      description: alt.description,
      calories: alt.calories,
      protein: alt.protein,
      carbs: alt.carbs,
      fat: alt.fat,
      prepTime: alt.prepTime,
      emoji: alt.emoji,
      ingredients: alt.ingredients,
      tip: alt.whySwap,
    };
    onSwap?.(index, newMeal);
    setShowSwap(false);
    setSwapOptions(null);
  }, [meal.type, index, onSwap]);

  const handleViewSteps = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cookingSteps) {
      setShowSteps(!showSteps);
      return;
    }
    setStepsLoading(true);
    setShowSteps(true);
    const { data, error } = await generateCookingSteps(
      meal.name,
      meal.type,
      meal.ingredients || [],
      persons,
    );
    if (data) setCookingSteps(data);
    setStepsLoading(false);
  }, [cookingSteps, showSteps, meal, persons]);

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(350)}>
      {/* Sunset gradient border wrapper */}
      <LinearGradient
        colors={['#1E1456', '#7B2FA0', '#C41E7A', '#F04E50', '#F5B731']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={mc.gradientBorder}
      >
      <Pressable
        style={[mc.card, { backgroundColor: colors.surface }]}
        onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      >
        <View style={mc.header}>
          <LinearGradient colors={config.gradient as unknown as string[]} style={mc.iconWrap}>
            <Text style={{ fontSize: 22 }}>{meal.emoji || config.emoji}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[mc.mealType, { color: colors.textMuted }]}>{meal.type.toUpperCase()}</Text>
            <Text style={[mc.mealName, { color: colors.textPrimary }]}>{meal.name}</Text>
            {meal.description ? (
              <Text style={[mc.mealDesc, { color: colors.textMuted }]} numberOfLines={expanded ? 4 : 1}>{meal.description}</Text>
            ) : null}
          </View>
          <View style={mc.calBadge}>
            <Text style={mc.calValue}>{meal.calories}</Text>
            <Text style={mc.calUnit}>kcal</Text>
          </View>
        </View>

        <View style={mc.macroRow}>
          <AnimatedMacroChip label="Protein" value={meal.protein} unit="g" color="#7B2FA0" bgColor="rgba(123,47,160,0.06)" index={0} isDark={isDark} />
          <AnimatedMacroChip label="Carbs" value={meal.carbs} unit="g" color="#D9A020" bgColor="rgba(245,183,49,0.08)" index={1} isDark={isDark} />
          <AnimatedMacroChip label="Fat" value={meal.fat} unit="g" color="#F04E50" bgColor="rgba(240,78,80,0.06)" index={2} isDark={isDark} />
          {meal.prepTime ? (
            <AnimatedMacroChip label="Prep" value={meal.prepTime} unit="m" color="#1E1456" bgColor="rgba(30,20,86,0.05)" index={3} isDark={isDark} />
          ) : null}
        </View>

        {expanded && meal.ingredients ? (
          <Animated.View entering={FadeIn.duration(250)} style={[mc.expandedSection, { borderTopColor: colors.border }]}>
            <Text style={[mc.ingredientsTitle, { color: colors.textPrimary }]}>Ingredients</Text>
            <View style={mc.ingredientsList}>
              {meal.ingredients.map((ing, i) => (
                <View key={i} style={[mc.ingredientTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Text style={[mc.ingredientText, { color: colors.textSecondary }]}>{ing}</Text>
                </View>
              ))}
            </View>
            {meal.tip ? (
              <View style={[mc.tipBox, { backgroundColor: 'rgba(245,183,49,0.06)', borderColor: 'rgba(245,183,49,0.15)' }]}>
                <Text style={{ fontSize: 12 }}>💡</Text>
                <Text style={[mc.tipText, { color: colors.textSecondary }]}>{meal.tip}</Text>
              </View>
            ) : null}

            {/* Meal Quick Actions */}
            <View style={mc.mealActions}>
              <Pressable style={[mc.mealActionBtn, { backgroundColor: 'rgba(245,183,49,0.08)', borderColor: 'rgba(245,183,49,0.25)' }]}>
                <MaterialIcons name="add-shopping-cart" size={14} color="#F5B731" />
                <Text style={[mc.mealActionText, { color: '#D9A020' }]}>Add to Cart</Text>
              </Pressable>
              <Pressable
                style={[mc.mealActionBtn, { backgroundColor: 'rgba(30,20,86,0.06)', borderColor: 'rgba(30,20,86,0.20)' }]}
                onPress={handleViewSteps}
              >
                {stepsLoading ? (
                  <ActivityIndicator size={14} color="#1E1456" />
                ) : (
                  <MaterialIcons name="menu-book" size={14} color="#1E1456" />
                )}
                <Text style={[mc.mealActionText, { color: '#1E1456' }]}>{showSteps ? 'Hide Steps' : 'View Steps'}</Text>
              </Pressable>
              <Pressable
                style={[mc.mealActionBtn, { backgroundColor: 'rgba(196,30,122,0.06)', borderColor: 'rgba(196,30,122,0.20)' }]}
                onPress={handleSwapMeal}
              >
                {swapLoading ? (
                  <ActivityIndicator size={14} color="#C41E7A" />
                ) : (
                  <MaterialIcons name="swap-horiz" size={14} color="#C41E7A" />
                )}
                <Text style={[mc.mealActionText, { color: '#C41E7A' }]}>{showSwap ? 'Hide Swaps' : 'Swap Meal'}</Text>
              </Pressable>
            </View>

            {/* Swap Meal Section */}
            {showSwap ? (
              swapLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                  <ActivityIndicator size="small" color="#C41E7A" />
                  <Text style={[{ fontSize: 12, fontWeight: '600' }, { color: colors.textMuted }]}>Finding alternatives...</Text>
                </View>
              ) : swapOptions && swapOptions.length > 0 ? (
                <Animated.View entering={FadeIn.duration(300)} style={sw.container}>
                  <View style={sw.headerRow}>
                    <Text style={[sw.title, { color: colors.textPrimary }]}>🔄 Swap Options</Text>
                    <Text style={[sw.subtitle, { color: colors.textMuted }]}>Similar nutrition, different taste</Text>
                  </View>
                  {swapOptions.map((alt, ai) => (
                    <Animated.View key={ai} entering={FadeInDown.delay(ai * 80).duration(250)}>
                      <Pressable
                        style={({ pressed }) => [sw.optionCard, {
                          backgroundColor: isDark ? 'rgba(196,30,122,0.04)' : 'rgba(196,30,122,0.02)',
                          borderColor: 'rgba(196,30,122,0.15)',
                        }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                        onPress={() => handleSelectSwap(alt)}
                      >
                        <View style={sw.optionHeader}>
                          <Text style={{ fontSize: 22 }}>{alt.emoji || '🍽️'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[sw.optionName, { color: colors.textPrimary }]}>{alt.name}</Text>
                            {alt.description ? <Text style={[sw.optionDesc, { color: colors.textMuted }]} numberOfLines={2}>{alt.description}</Text> : null}
                          </View>
                          <View style={sw.selectBtn}>
                            <MaterialIcons name="check-circle" size={20} color="#C41E7A" />
                          </View>
                        </View>
                        <View style={sw.optionMacros}>
                          <View style={[sw.macroPill, { backgroundColor: 'rgba(245,183,49,0.08)' }]}>
                            <Text style={[sw.macroText, { color: '#D9A020' }]}>🔥 {alt.calories} kcal</Text>
                          </View>
                          <View style={[sw.macroPill, { backgroundColor: 'rgba(123,47,160,0.06)' }]}>
                            <Text style={[sw.macroText, { color: '#7B2FA0' }]}>P:{alt.protein}g</Text>
                          </View>
                          <View style={[sw.macroPill, { backgroundColor: 'rgba(240,78,80,0.06)' }]}>
                            <Text style={[sw.macroText, { color: '#F04E50' }]}>F:{alt.fat}g</Text>
                          </View>
                          {alt.prepTime ? (
                            <View style={[sw.macroPill, { backgroundColor: 'rgba(30,20,86,0.04)' }]}>
                              <Text style={[sw.macroText, { color: '#1E1456' }]}>⏱️ {alt.prepTime}m</Text>
                            </View>
                          ) : null}
                        </View>
                        {alt.whySwap ? (
                          <Text style={[sw.whyText, { color: colors.textMuted }]}>💡 {alt.whySwap}</Text>
                        ) : null}
                      </Pressable>
                    </Animated.View>
                  ))}
                </Animated.View>
              ) : null
            ) : null}

            {/* Cooking Steps Section */}
            {showSteps ? (
              stepsLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                  <ActivityIndicator size="small" color="#7B2FA0" />
                  <Text style={[{ fontSize: 12, fontWeight: '600' }, { color: colors.textMuted }]}>Generating cooking steps for {persons} person{persons > 1 ? 's' : ''}...</Text>
                </View>
              ) : cookingSteps ? (
                <CookingStepsView steps={cookingSteps} colors={colors} isDark={isDark} />
              ) : null
            ) : null}

            {/* Recipe Video Card */}
            <Pressable
              style={[mc.recipeVideoCard, { backgroundColor: isDark ? 'rgba(123,47,160,0.06)' : 'rgba(123,47,160,0.04)', borderColor: 'rgba(123,47,160,0.20)' }]}
              onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/recipe-videos' as any, params: { planData: JSON.stringify({ meals: [meal] }) } }); }}
            >
              <View style={mc.recipeVideoRow}>
                <View style={[mc.recipeVideoIcon, { backgroundColor: 'rgba(123,47,160,0.10)' }]}>
                  <MaterialIcons name="play-circle-filled" size={28} color="#7B2FA0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[mc.recipeVideoTitle, { color: colors.textPrimary }]}>Watch Master Chef Recipe</Text>
                  <Text style={[mc.recipeVideoSub, { color: colors.textMuted }]}>Learn {meal.name} from expert chefs</Text>
                </View>
                <View style={mc.recipeTokenBadge}>
                  <Text style={{ fontSize: 10 }}>🪙</Text>
                  <Text style={mc.recipeTokenText}>20</Text>
                </View>
              </View>
              <Text style={[mc.recipeVideoHint, { color: colors.textMuted }]}>Free preview available • Unlock full recipe with tokens</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={mc.expandHint}>
          <MaterialIcons name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color={colors.textMuted} />
        </View>
      </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ── Weekly Day Card ──
function WeeklyDayCard({ day, dayIndex, colors, isDark }: {
  day: { day: string; totalCalories: number; meals: MealItem[] };
  dayIndex: number; colors: any; isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length];

  return (
    <Animated.View entering={FadeInDown.delay(80 + dayIndex * 60).duration(300)}>
      <Pressable
        style={[wd.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      >
        <View style={wd.header}>
          <View style={[wd.dayBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[wd.dayText, { color }]}>{day.day.slice(0, 3)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[wd.dayFull, { color: colors.textPrimary }]}>{day.day}</Text>
            <View style={wd.mealPreview}>
              {day.meals.map((m, i) => (
                <Text key={i} style={[wd.mealPreviewText, { color: colors.textMuted }]} numberOfLines={1}>
                  {MEAL_ICONS[m.type]?.emoji || '🍽️'} {m.name}
                </Text>
              ))}
            </View>
          </View>
          <View style={wd.calColumn}>
            <Text style={wd.calValue}>{day.totalCalories}</Text>
            <Text style={[wd.calLabel, { color: colors.textMuted }]}>kcal</Text>
          </View>
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
        </View>

        {expanded ? (
          <Animated.View entering={FadeIn.duration(200)} style={[wd.expanded, { borderTopColor: colors.border }]}>
            {day.meals.map((meal, i) => {
              const cfg = MEAL_ICONS[meal.type] || MEAL_ICONS.lunch;
              return (
                <View key={i} style={wd.mealRow}>
                  <View style={[wd.mealIcon, { backgroundColor: `${cfg.gradient[0]}18` }]}>
                    <Text style={{ fontSize: 16 }}>{meal.emoji || cfg.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[wd.mealName, { color: colors.textPrimary }]}>{meal.name}</Text>
                    <Text style={[wd.mealMacros, { color: colors.textMuted }]}>
                      {meal.calories} kcal • P:{meal.protein}g • C:{meal.carbs}g • F:{meal.fat}g
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// ── Monthly Week Card ──
function MonthlyWeekCard({ week, index, colors, isDark }: {
  week: { weekNumber: number; theme: string; dailyCalorieTarget: number; estimatedWeeklyCost: number; highlights: any[]; nutritionFocus: string };
  index: number; colors: any; isDark: boolean;
}) {
  const color = DAY_COLORS[index % DAY_COLORS.length];

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(350)}>
      <View style={[mw.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={mw.header}>
          <View style={[mw.weekBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[mw.weekNum, { color }]}>W{week.weekNumber}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[mw.theme, { color: colors.textPrimary }]}>{week.theme}</Text>
            <Text style={[mw.focus, { color: colors.textMuted }]}>{week.nutritionFocus}</Text>
          </View>
          <View style={mw.costBadge}>
            <Text style={mw.costValue}>₹{(week.estimatedWeeklyCost / 1000).toFixed(1)}K</Text>
            <Text style={[mw.costLabel, { color: colors.textMuted }]}>est. cost</Text>
          </View>
        </View>

        <View style={mw.statsRow}>
          <View style={[mw.statItem, { backgroundColor: 'rgba(212,175,55,0.06)' }]}>
            <Text style={mw.statEmoji}>🔥</Text>
            <Text style={[mw.statValue, { color: colors.textPrimary }]}>{week.dailyCalorieTarget}</Text>
            <Text style={[mw.statLabel, { color: colors.textMuted }]}>kcal/day</Text>
          </View>
          <View style={[mw.statItem, { backgroundColor: 'rgba(74,222,128,0.06)' }]}>
            <Text style={mw.statEmoji}>🥗</Text>
            <Text style={[mw.statValue, { color: colors.textPrimary }]}>{week.highlights?.length || 0}</Text>
            <Text style={[mw.statLabel, { color: colors.textMuted }]}>highlights</Text>
          </View>
        </View>

        {week.highlights && week.highlights.length > 0 ? (
          <View style={mw.highlights}>
            <Text style={[mw.highlightsTitle, { color: colors.textSecondary }]}>Highlights</Text>
            {week.highlights.map((h: any, i: number) => (
              <View key={i} style={[mw.highlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                <Text style={{ fontSize: 16 }}>{h.emoji || '🍽️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[mw.highlightName, { color: colors.textPrimary }]}>{h.name}</Text>
                  <Text style={[mw.highlightMeta, { color: colors.textMuted }]}>{h.day} • {h.mealType} • {h.calories} kcal</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ── "What Next?" Decision Card (3 options: Cook Myself, Book a Cook, Order Food) ──
function WhatNextCard({ planData, activeTab, colors, isDark, router }: {
  planData: string; activeTab: PlanTab; colors: any; isDark: boolean; router: any;
}) {
  const options = [
    {
      id: 'cook',
      title: 'Cook Myself',
      desc: 'Auto grocery cart with ingredients, quantity and estimated cost',
      emoji: '🧑‍🍳',
      gradient: ['#F5B731', '#FDD85D'] as const,
      color: '#F5B731',
      features: [
        { icon: 'shopping-cart' as const, text: 'Auto Grocery Cart' },
        { icon: 'savings' as const, text: 'Save ~15%' },
      ],
      cta: 'View Grocery Cart',
      onPress: () => router.push({ pathname: '/grocery-cart', params: { planData, planType: activeTab } }),
    },
    {
      id: 'book',
      title: 'Book a Cook',
      desc: 'Hire trained home cooks based on cuisine and dish expertise',
      emoji: '👨‍🍳',
      gradient: ['#1E1456', '#7B2FA0'] as const,
      color: '#7B2FA0',
      features: [
        { icon: 'verified' as const, text: '100+ Cooks' },
        { icon: 'event' as const, text: 'Day/Week/Month' },
      ],
      cta: 'Browse Cooks',
      onPress: () => router.push('/(tabs)/cook' as any),
    },
    {
      id: 'order',
      title: 'Order Food',
      desc: 'Order similar dishes from restaurant and delivery partners',
      emoji: '🍔',
      gradient: ['#F04E50', '#F5B731'] as const,
      color: '#F04E50',
      features: [
        { icon: 'delivery-dining' as const, text: 'Zomato/Swiggy/ONDC' },
        { icon: 'compare-arrows' as const, text: 'Compare prices' },
      ],
      cta: 'Find Food Options',
      onPress: () => router.push('/partner-apps' as any),
    },
  ];

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500)}>
      <View style={[wn.container, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }]}>
        <Text style={[wn.title, { color: colors.textPrimary }]}>What would you like to do? 🤔</Text>
        <Text style={[wn.subtitle, { color: colors.textMuted }]}>Your meal plan is ready. Choose your path:</Text>

        <View style={wn.optionsColumn}>
          {options.map((opt, i) => (
            <Animated.View key={opt.id} entering={FadeInDown.delay(200 + i * 100).duration(350)}>
              <Pressable
                style={({ pressed }) => [wn.optionRow, {
                  backgroundColor: isDark ? `${opt.color}12` : `${opt.color}06`,
                  borderColor: `${opt.color}30`,
                }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); opt.onPress(); }}
              >
                <LinearGradient colors={opt.gradient as unknown as string[]} style={wn.optionIconSmall}>
                  <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                </LinearGradient>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[wn.optionTitleRow, { color: colors.textPrimary }]}>{opt.title}</Text>
                  <Text style={[wn.optionDescRow, { color: colors.textMuted }]}>{opt.desc}</Text>
                  <View style={wn.featuresInline}>
                    {opt.features.map((f, fi) => (
                      <View key={fi} style={wn.featureTag}>
                        <MaterialIcons name={f.icon} size={10} color={opt.color} />
                        <Text style={[wn.featureText, { color: opt.color }]}>{f.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={[wn.optionArrow, { backgroundColor: `${opt.color}20` }]}>
                  <MaterialIcons name="arrow-forward" size={16} color={opt.color} />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Watch Recipe Videos CTA */}
        <Animated.View entering={FadeInDown.delay(550).duration(350)}>
          <Pressable
            style={({ pressed }) => [wn.recipeVideoCard, {
              backgroundColor: isDark ? 'rgba(123,47,160,0.06)' : 'rgba(123,47,160,0.04)',
              borderColor: 'rgba(123,47,160,0.25)',
            }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: '/recipe-videos' as any, params: { planData } }); }}
          >
            <LinearGradient colors={['#7B2FA0', '#C41E7A']} style={wn.optionIconSmall}>
              <Text style={{ fontSize: 24 }}>🎬</Text>
            </LinearGradient>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[wn.optionTitleRow, { color: colors.textPrimary }]}>Watch Recipe Videos</Text>
              <Text style={[wn.optionDescRow, { color: colors.textMuted }]}>Learn from master chefs — free preview, unlock full with tokens</Text>
              <View style={wn.featuresInline}>
                <View style={wn.featureTag}>
                  <Text style={{ fontSize: 9 }}>🪙</Text>
                  <Text style={[wn.featureText, { color: '#F5B731' }]}>15-30 tokens</Text>
                </View>
                <View style={wn.featureTag}>
                  <MaterialIcons name="play-circle" size={10} color="#7B2FA0" />
                  <Text style={[wn.featureText, { color: '#7B2FA0' }]}>Free preview</Text>
                </View>
              </View>
            </View>
            <View style={[wn.optionArrow, { backgroundColor: 'rgba(123,47,160,0.12)' }]}>
              <MaterialIcons name="arrow-forward" size={16} color="#7B2FA0" />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ── Persons Selector ──
function PersonsSelector({ persons, onSelect, colors, isDark }: {
  persons: number; onSelect: (n: number) => void; colors: any; isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(30).duration(300)}>
      <View style={[prs.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={prs.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[prs.title, { color: colors.textPrimary }]}>Cooking for</Text>
            <Text style={[prs.subtitle, { color: colors.textMuted }]}>Ingredient quantities scale with persons</Text>
          </View>
          <View style={prs.iconWrap}>
            <Text style={{ fontSize: 20 }}>👨‍👩‍👧‍👦</Text>
          </View>
        </View>
        <View style={prs.pillRow}>
          {PERSONS_OPTIONS.map(n => {
            const isActive = persons === n;
            return (
              <Pressable
                key={n}
                style={[prs.pill, {
                  backgroundColor: isActive ? '#F5B731' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: isActive ? '#D9A020' : colors.border,
                }]}
                onPress={() => { Haptics.selectionAsync(); onSelect(n); }}
              >
                <Text style={[prs.pillText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Share Meal Plan Utility ──
function generateShareableText(plan: TodayPlan | null, persons: number): string {
  if (!plan) return '';
  const lines: string[] = [];
  lines.push('🍽️ My FoodGenie Meal Plan');
  lines.push(`📅 ${plan.date} | 👤 ${persons} person${persons > 1 ? 's' : ''}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  plan.meals.forEach(meal => {
    const icon = meal.type === 'breakfast' ? '☀️' : meal.type === 'lunch' ? '🍽️' : meal.type === 'snack' ? '🍿' : '🌙';
    lines.push(`${icon} ${meal.type.toUpperCase()}`);
    lines.push(`   ${meal.name}`);
    lines.push(`   ${meal.calories} kcal | P:${meal.protein}g | C:${meal.carbs}g | F:${meal.fat}g`);
    if (meal.prepTime) lines.push(`   ⏱️ ${meal.prepTime} min prep`);
    lines.push('');
  });
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`🔥 Total: ${plan.totalCalories} kcal`);
  lines.push(`💪 Protein: ${plan.totalProtein}g | 🌾 Carbs: ${plan.totalCarbs}g | 🥑 Fat: ${plan.totalFat}g`);
  lines.push('');
  lines.push('Generated by FoodGenie AI 🧞‍♂️');
  return lines.join('\n');
}

// ── Preferences Summary Card ──
function PreferencesSummary({ prefs, colors, isDark, router }: {
  prefs: any; colors: any; isDark: boolean; router: any;
}) {
  if (!prefs) return null;

  const DIET_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    veg: { label: 'Vegetarian', emoji: '🥬', color: '#4ADE80' },
    egg: { label: 'Eggetarian', emoji: '🥚', color: '#F5B731' },
    nonveg: { label: 'Non-Veg', emoji: '🍗', color: '#F04E50' },
  };

  const SPICE_LABELS: Record<number, { label: string; emoji: string }> = {
    1: { label: 'Mild', emoji: '🌶️' },
    2: { label: 'Medium', emoji: '🌶️🌶️' },
    3: { label: 'Spicy', emoji: '🌶️🌶️🌶️' },
    4: { label: 'Extra Hot', emoji: '🔥' },
  };

  const diet = DIET_LABELS[prefs.diet] || DIET_LABELS.veg;
  const spice = SPICE_LABELS[prefs.spiceLevel] || SPICE_LABELS[2];
  const budgetLabel = `₹${prefs.budgetMin}-${prefs.budgetMax}`;
  const cuisineList = (prefs.cuisineBias || []).slice(0, 3);

  const pills: { label: string; color: string; emoji?: string }[] = [
    { label: diet.label, color: diet.color, emoji: diet.emoji },
    { label: spice.label, color: '#F04E50', emoji: spice.emoji },
    { label: budgetLabel, color: '#1E1456', emoji: '💰' },
  ];

  if (cuisineList.length > 0) {
    const formatted = cuisineList.map((c: string) => c.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())).join(', ');
    pills.push({ label: formatted, color: '#7B2FA0', emoji: '🍛' });
  }

  if (prefs.healthGoal && prefs.healthGoal !== 'none' && prefs.healthGoal !== 'balanced') {
    const goalLabel = prefs.healthGoal.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    pills.push({ label: goalLabel, color: '#C41E7A', emoji: '🎯' });
  }

  return (
    <Animated.View entering={FadeInDown.delay(50).duration(300)}>
      <View style={[ps.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={ps.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[ps.title, { color: colors.textPrimary }]}>Your Preferences</Text>
          </View>
          <Pressable
            style={({ pressed }) => [ps.editBtn, { backgroundColor: 'rgba(123,47,160,0.08)', borderColor: 'rgba(123,47,160,0.20)' }, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.push('/meal-preferences' as any); }}
          >
            <MaterialIcons name="edit" size={12} color="#7B2FA0" />
            <Text style={ps.editText}>Edit</Text>
          </Pressable>
        </View>
        <View style={ps.pillRow}>
          {pills.map((pill, i) => (
            <View key={i} style={[ps.pill, { backgroundColor: `${pill.color}12`, borderColor: `${pill.color}30` }]}>
              {pill.emoji ? <Text style={{ fontSize: 11 }}>{pill.emoji}</Text> : null}
              <Text style={[ps.pillText, { color: pill.color }]}>{pill.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Floating Token Balance Indicator ──
function FloatingTokenIndicator({ subscription, colors, isDark, router, topOffset }: {
  subscription: UserSubscription | null; colors: any; isDark: boolean; router: any; topOffset?: number;
}) {
  const pulseScale = useSharedValue(1);

  // Pulse animation when token balance changes
  useEffect(() => {
    if (subscription) {
      pulseScale.value = withSequence(
        withSpring(1.12, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    }
  }, [subscription?.token_balance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!subscription) return null;

  const tokenBalance = subscription.token_balance || 0;
  const isLow = tokenBalance < 20;

  return null;
}

// ── Main Screen ──
export default function AajKhaneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { earnCoins } = useCoin();
  const [activeTab, setActiveTab] = useState<PlanTab>('today');
  const [coinAwarded, setCoinAwarded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<any>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [persons, setPersons] = useState<number>(2);

  // Serialize current plan for passing to grocery cart
  const currentPlanData = useMemo(() => {
    const plan = activeTab === 'today' ? todayPlan : activeTab === 'weekly' ? weeklyPlan : monthlyPlan;
    if (!plan) return '{}';
    try { return JSON.stringify(plan); } catch { return '{}'; }
  }, [activeTab, todayPlan, weeklyPlan, monthlyPlan]);

  const loadUserPrefs = useCallback(async () => {
    if (!user) return {};
    const [basic, advanced] = await Promise.all([
      loadPreferences(user.id),
      loadAdvancedPreferences(user.id),
    ]);
    const p = {
      diet: basic?.diet || 'veg',
      budgetMin: basic?.budget_min || 100,
      budgetMax: basic?.budget_max || 500,
      spiceLevel: basic?.spice_level || 2,
      healthGoal: advanced?.health_goal || 'balanced',
      cuisineBias: advanced?.cuisine_bias || [],
      avoidTags: advanced?.avoid_tags || [],
    };
    setPrefs(p);
    return p;
  }, [user]);

  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return null;
    const sub = await loadSubscription(user.id);
    setSubscription(sub);
    return sub;
  }, [user?.id]);

  // Check if user can generate a plan (token gating for weekly/monthly)
  const checkTokensForPlan = useCallback(async (tab: PlanTab): Promise<boolean> => {
    if (tab === 'today') return true; // Daily plans are free
    if (!user?.id) {
      showAlert('Login Required', 'Please log in to generate premium meal plans.');
      return false;
    }

    const tokenCost = tab === 'weekly' ? SUB_TOKEN_COSTS.weekly_meal_plan : SUB_TOKEN_COSTS.monthly_meal_plan;
    const sub = await refreshSubscription();

    if (!sub || !isSubscriptionActive(sub)) {
      showAlert(
        'Subscription Required',
        `Weekly and monthly meal plans require AI Tokens. Get started with a 7-day free trial!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Tokens', onPress: () => router.push('/subscription' as any) },
        ]
      );
      return false;
    }

    if (sub.token_balance < tokenCost) {
      showAlert(
        'Insufficient Tokens',
        `You need ${tokenCost} tokens to generate a ${tab} plan but only have ${sub.token_balance}. Upgrade your plan for more tokens.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get More Tokens', onPress: () => router.push('/subscription' as any) },
        ]
      );
      return false;
    }

    return true;
  }, [user?.id, refreshSubscription, showAlert, router]);

  // Deduct tokens after successful plan generation
  const deductPlanTokens = useCallback(async (tab: PlanTab) => {
    if (tab === 'today' || !user?.id) return;
    const tokenCost = tab === 'weekly' ? SUB_TOKEN_COSTS.weekly_meal_plan : SUB_TOKEN_COSTS.monthly_meal_plan;
    const result = await deductTokens(user.id, tokenCost, `${tab}_meal_plan`);
    if (result.success) {
      await refreshSubscription();
    }
  }, [user?.id, refreshSubscription]);

  const fetchPlan = useCallback(async (tab: PlanTab, userPrefs?: any, skipTokenCheck?: boolean) => {
    // Token gating for weekly/monthly plans
    if (!skipTokenCheck) {
      const canProceed = await checkTokensForPlan(tab);
      if (!canProceed) return;
    }

    setLoading(true);
    setError(null);
    const p = userPrefs || prefs || await loadUserPrefs();
    const { data, error: err } = await generateMealPlan(p, tab, persons);
    if (err) {
      setError(err);
    } else {
      if (tab === 'today') setTodayPlan(data);
      else if (tab === 'weekly') setWeeklyPlan(data);
      else setMonthlyPlan(data);

      // Deduct tokens for premium plans
      await deductPlanTokens(tab);

      if (!coinAwarded.has(tab)) {
        setCoinAwarded(prev => new Set(prev).add(tab));
        earnCoins(COIN_RULES.meal_plan_generated.amount, 'meal_plan_generated', { planType: tab });
      }
    }
    setLoading(false);
  }, [prefs, loadUserPrefs, coinAwarded, earnCoins, checkTokensForPlan, deductPlanTokens, persons]);

  useEffect(() => {
    refreshSubscription();
    loadUserPrefs().then(p => fetchPlan('today', p, true));
  }, []);

  const handleTabChange = useCallback((tab: PlanTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    const cached = tab === 'today' ? todayPlan : tab === 'weekly' ? weeklyPlan : monthlyPlan;
    if (!cached) fetchPlan(tab);
  }, [todayPlan, weeklyPlan, monthlyPlan, fetchPlan]);

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const plan = activeTab === 'today' ? todayPlan : activeTab === 'weekly' ? weeklyPlan : monthlyPlan;
    if (!plan) return;
    setPdfLoading(true);
    const { success, error: pdfError } = await exportMealPlanPDF(plan, activeTab, persons);
    setPdfLoading(false);
    if (!success && pdfError) {
      showAlert('PDF Export Failed', pdfError);
    }
  }, [activeTab, todayPlan, weeklyPlan, monthlyPlan, persons, showAlert]);

  const handleSharePlan = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === 'today' && todayPlan) {
      const text = generateShareableText(todayPlan, persons);
      try {
        await Share.share({
          message: text,
          title: 'My FoodGenie Meal Plan',
        });
      } catch { /* user cancelled */ }
    } else if (activeTab === 'weekly' && weeklyPlan) {
      const lines = ['📅 My Weekly Meal Plan (FoodGenie)\n'];
      lines.push(`👤 ${persons} person${persons > 1 ? 's' : ''} | Avg ${weeklyPlan.avgDailyCalories} kcal/day\n`);
      weeklyPlan.days.forEach(day => {
        lines.push(`\n${day.day} (${day.totalCalories} kcal)`);
        day.meals.forEach(m => {
          lines.push(`  ${m.emoji || '🍽️'} ${m.type}: ${m.name}`);
        });
      });
      lines.push('\n\nGenerated by FoodGenie AI 🧞‍♂️');
      try {
        await Share.share({ message: lines.join('\n'), title: 'My FoodGenie Weekly Plan' });
      } catch { /* user cancelled */ }
    } else if (activeTab === 'monthly' && monthlyPlan) {
      const lines = [`🗓️ ${monthlyPlan.month} Meal Plan (FoodGenie)\n`];
      lines.push(`👤 ${persons} person${persons > 1 ? 's' : ''} | Avg ${monthlyPlan.avgDailyCalories} kcal/day | Est. ₹${(monthlyPlan.totalEstimatedCost / 1000).toFixed(1)}K\n`);
      monthlyPlan.weeks.forEach(w => {
        lines.push(`\nWeek ${w.weekNumber}: ${w.theme}`);
        lines.push(`  🔥 ${w.dailyCalorieTarget} kcal/day | 💰 ₹${(w.estimatedWeeklyCost / 1000).toFixed(1)}K`);
      });
      lines.push('\n\nGenerated by FoodGenie AI 🧞‍♂️');
      try {
        await Share.share({ message: lines.join('\n'), title: 'My FoodGenie Monthly Plan' });
      } catch { /* user cancelled */ }
    }
  }, [activeTab, todayPlan, weeklyPlan, monthlyPlan, persons]);

  const handlePersonsChange = useCallback((n: number) => {
    setPersons(n);
    // Clear cached plans so next generation uses new person count
    setTodayPlan(null);
    setWeeklyPlan(null);
    setMonthlyPlan(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSubscription();
    await fetchPlan(activeTab);
    setRefreshing(false);
  }, [activeTab, fetchPlan, refreshSubscription]);

  const handleSwapMeal_Today = useCallback((mealIndex: number, newMeal: MealItem) => {
    if (!todayPlan) return;
    const updatedMeals = [...todayPlan.meals];
    updatedMeals[mealIndex] = newMeal;
    const totalCalories = updatedMeals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = updatedMeals.reduce((s, m) => s + m.protein, 0);
    const totalCarbs = updatedMeals.reduce((s, m) => s + m.carbs, 0);
    const totalFat = updatedMeals.reduce((s, m) => s + m.fat, 0);
    setTodayPlan({ ...todayPlan, meals: updatedMeals, totalCalories, totalProtein, totalCarbs, totalFat });
  }, [todayPlan]);

  const hasPlan = (activeTab === 'today' && todayPlan) || (activeTab === 'weekly' && weeklyPlan) || (activeTab === 'monthly' && monthlyPlan);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={['#1E1456', '#7B2FA0', '#C41E7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={s.headerRow}>
            <Pressable style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Aaj Khane Me Kya Hai? 🤔</Text>
              <Text style={s.headerSub}>AI-powered daily food planning ecosystem</Text>
            </View>
            {hasPlan && !loading ? (
              <Pressable
                style={({ pressed }) => [s.shareHeaderBtn, pressed && { opacity: 0.7 }]}
                onPress={handleSharePlan}
              >
                <MaterialIcons name="share" size={20} color="#FFF" />
              </Pressable>
            ) : null}
          </View>

          {/* Plan Tabs */}
          <View style={s.tabRow}>
            {PLAN_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[s.tab, isActive && s.tabActive]}
                  onPress={() => handleTabChange(tab.id)}
                >
                  <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
                  <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        {/* Token Balance - inline in scroll */}

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5B731" colors={['#F5B731']} />}
        >
          {/* ═══ Token Balance Inline ═══ */}
          {subscription ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/subscription' as any); }}
              >
                <LinearGradient
                  colors={(subscription.token_balance || 0) < 20 ? ['#F04E50', '#C41E7A'] : ['#1E1456', '#7B2FA0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16 }}>🪙</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#FDD85D' }}>{subscription.token_balance || 0} tokens</Text>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.70)' }}>{subscription.plan_name || 'Free'} Plan</Text>
                  </View>
                  {(subscription.token_balance || 0) < 20 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.20)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                      <MaterialIcons name="warning" size={12} color="#FFF" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>Low</Text>
                    </View>
                  ) : (
                    <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.60)" />
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {/* ═══ Persons Selector ═══ */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <PersonsSelector persons={persons} onSelect={handlePersonsChange} colors={colors} isDark={isDark} />
          </View>

          {/* ═══ Preferences Summary ═══ */}
          {prefs ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <PreferencesSummary prefs={prefs} colors={colors} isDark={isDark} router={router} />
            </View>
          ) : null}

          {loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color="#F5B731" />
              <Text style={[s.loadingText, { color: colors.textMuted }]}>
                {activeTab === 'today' ? 'Planning your meals for today...' :
                 activeTab === 'weekly' ? 'Creating your weekly meal plan...' :
                 'Generating your monthly overview...'}
              </Text>
              <Text style={[s.loadingHint, { color: colors.textMuted }]}>This may take a few seconds</Text>
            </View>
          ) : error ? (
            <View style={[s.errorWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 36 }}>⚠️</Text>
              <Text style={[s.errorTitle, { color: colors.textPrimary }]}>Could not generate plan</Text>
              <Text style={[s.errorSub, { color: colors.textMuted }]}>{error}</Text>
              <Pressable style={({ pressed }) => [pressed && { opacity: 0.8 }]} onPress={() => fetchPlan(activeTab)}>
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.retryBtn}>
                  <MaterialIcons name="refresh" size={16} color="#FFF" />
                  <Text style={s.retryText}>Try Again</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : activeTab === 'today' && todayPlan ? (
            <View style={s.content}>
              <Animated.View entering={FadeIn.duration(400)} style={[s.nutritionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.nutritionTitle, { color: colors.textPrimary }]}>Today's Nutrition</Text>
                <Text style={[s.nutritionDate, { color: colors.textMuted }]}>{todayPlan.date}</Text>
                <View style={s.nutritionRow}>
                  <NutritionRing label="Calories" value={todayPlan.totalCalories} unit="kcal" color="#F5B731" colors={colors} isDark={isDark} />
                  <NutritionRing label="Protein" value={todayPlan.totalProtein} unit="g" color={isDark ? '#BF7AE0' : '#7B2FA0'} colors={colors} isDark={isDark} />
                  <NutritionRing label="Carbs" value={todayPlan.totalCarbs} unit="g" color={isDark ? '#FF8A7B' : '#F04E50'} colors={colors} isDark={isDark} />
                  <NutritionRing label="Fat" value={todayPlan.totalFat} unit="g" color={isDark ? '#BFB7D4' : '#1E1456'} colors={colors} isDark={isDark} />
                </View>
              </Animated.View>
              <View style={s.mealList}>
                {todayPlan.meals.map((meal, i) => (
                  <MealCard key={`${i}-${meal.name}`} meal={meal} index={i} colors={colors} isDark={isDark} router={router} persons={persons} prefs={prefs} onSwap={handleSwapMeal_Today} />
                ))}
              </View>
            </View>
          ) : activeTab === 'weekly' && weeklyPlan ? (
            <View style={s.content}>
              <Animated.View entering={FadeIn.duration(400)} style={[s.weeklyHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={s.weeklyHeaderRow}>
                  <View>
                    <Text style={[s.weeklyTitle, { color: colors.textPrimary }]}>Weekly Meal Plan</Text>
                    <Text style={[s.weeklyRange, { color: colors.textMuted }]}>{weeklyPlan.weekStart} – {weeklyPlan.weekEnd}</Text>
                  </View>
                  <View style={s.avgCalBadge}>
                    <Text style={s.avgCalValue}>{weeklyPlan.avgDailyCalories}</Text>
                    <Text style={s.avgCalLabel}>avg kcal/day</Text>
                  </View>
                </View>
              </Animated.View>
              <View style={s.dayList}>
                {weeklyPlan.days.map((day, i) => (
                  <WeeklyDayCard key={i} day={day} dayIndex={i} colors={colors} isDark={isDark} />
                ))}
              </View>
            </View>
          ) : activeTab === 'monthly' && monthlyPlan ? (
            <View style={s.content}>
              <Animated.View entering={FadeIn.duration(400)} style={[s.monthlyHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.monthlyTitle, { color: colors.textPrimary }]}>{monthlyPlan.month} Overview</Text>
                <View style={s.monthlyStatsRow}>
                  <View style={s.monthlyStatItem}>
                    <Text style={s.monthlyStatEmoji}>🔥</Text>
                    <Text style={[s.monthlyStatValue, { color: colors.textPrimary }]}>{monthlyPlan.avgDailyCalories}</Text>
                    <Text style={[s.monthlyStatLabel, { color: colors.textMuted }]}>avg kcal/day</Text>
                  </View>
                  <View style={s.monthlyStatItem}>
                    <Text style={s.monthlyStatEmoji}>💰</Text>
                    <Text style={[s.monthlyStatValue, { color: colors.textPrimary }]}>₹{(monthlyPlan.totalEstimatedCost / 1000).toFixed(1)}K</Text>
                    <Text style={[s.monthlyStatLabel, { color: colors.textMuted }]}>est. cost</Text>
                  </View>
                  <View style={s.monthlyStatItem}>
                    <Text style={s.monthlyStatEmoji}>📅</Text>
                    <Text style={[s.monthlyStatValue, { color: colors.textPrimary }]}>4</Text>
                    <Text style={[s.monthlyStatLabel, { color: colors.textMuted }]}>weeks</Text>
                  </View>
                </View>
              </Animated.View>
              <View style={s.weekList}>
                {monthlyPlan.weeks.map((week, i) => (
                  <MonthlyWeekCard key={i} week={week} index={i} colors={colors} isDark={isDark} />
                ))}
              </View>
            </View>
          ) : null}

          {/* ═══ "What Next?" Decision Section ═══ */}
          {hasPlan && !loading && !error ? (
            <View style={s.decisionSection}>
              <WhatNextCard
                planData={currentPlanData}
                activeTab={activeTab}
                colors={colors}
                isDark={isDark}
                router={router}
              />
            </View>
          ) : null}

          {/* ═══ AI Chat & Regenerate ═══ */}
          {!loading && !error ? (
            <Animated.View entering={FadeInDown.delay(300).duration(300)} style={s.regenerateWrap}>
              {/* Share & PDF Export Buttons */}
              {hasPlan ? (
                <View style={{ width: '100%', gap: 10 }}>
                  <Pressable
                    style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                    onPress={handleExportPDF}
                    disabled={pdfLoading}
                  >
                    <View style={[s.sharePlanBtn, { backgroundColor: colors.surface, borderColor: 'rgba(245,183,49,0.30)' }]}>
                      <LinearGradient colors={['#F5B731', '#D9A020']} style={s.sharePlanIcon}>
                        {pdfLoading ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <MaterialIcons name="picture-as-pdf" size={16} color="#FFF" />
                        )}
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.sharePlanTitle, { color: colors.textPrimary }]}>Download PDF</Text>
                        <Text style={[s.sharePlanSub, { color: colors.textMuted }]}>A4 format with nutrition charts & grocery list</Text>
                      </View>
                      <MaterialIcons name="arrow-forward-ios" size={14} color="#F5B731" />
                    </View>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                    onPress={handleSharePlan}
                  >
                    <View style={[s.sharePlanBtn, { backgroundColor: colors.surface, borderColor: 'rgba(123,47,160,0.25)' }]}>
                      <LinearGradient colors={['#7B2FA0', '#C41E7A']} style={s.sharePlanIcon}>
                        <MaterialIcons name="share" size={16} color="#FFF" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.sharePlanTitle, { color: colors.textPrimary }]}>Share as Text</Text>
                        <Text style={[s.sharePlanSub, { color: colors.textMuted }]}>Send to family or friends</Text>
                      </View>
                      <MaterialIcons name="arrow-forward-ios" size={14} color="#7B2FA0" />
                    </View>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={() => { setCoinAwarded(prev => { const n = new Set(prev); n.delete(activeTab); return n; }); fetchPlan(activeTab); }}
              >
                <LinearGradient colors={['#F5B731', '#FDD85D']} style={s.regenerateBtn}>
                  <MaterialIcons name="auto-awesome" size={18} color="#FFF" />
                  <Text style={s.regenerateText}>Regenerate Plan</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.chatLink, pressed && { opacity: 0.7 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/ai-meal-chat' as any); }}
              >
                <MaterialIcons name="chat" size={16} color="#7B2FA0" />
                <Text style={s.chatLinkText}>Or chat with AI to customize your plan</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  shareHeaderBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  tabActive: { backgroundColor: '#F5B731' },
  tabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  tabLabelActive: { color: '#1E1456' },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '600' },
  loadingHint: { fontSize: 12, fontWeight: '500' },
  errorWrap: { margin: 20, padding: 30, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 10 },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  errorSub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  retryText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  content: { padding: 20, gap: 16 },
  nutritionCard: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 12 },
  nutritionTitle: { fontSize: 18, fontWeight: '800' },
  nutritionDate: { fontSize: 12, fontWeight: '500' },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  mealList: { gap: 12 },
  weeklyHeader: { padding: 20, borderRadius: 20, borderWidth: 1 },
  weeklyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyTitle: { fontSize: 18, fontWeight: '800' },
  weeklyRange: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  avgCalBadge: { alignItems: 'center', backgroundColor: 'rgba(245,183,49,0.10)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  avgCalValue: { fontSize: 20, fontWeight: '900', color: '#F5B731' },
  avgCalLabel: { fontSize: 9, fontWeight: '600', color: '#D9A020' },
  dayList: { gap: 10 },
  monthlyHeader: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  monthlyTitle: { fontSize: 18, fontWeight: '800' },
  monthlyStatsRow: { flexDirection: 'row', gap: 10 },
  monthlyStatItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(30,20,86,0.04)' },
  monthlyStatEmoji: { fontSize: 18 },
  monthlyStatValue: { fontSize: 16, fontWeight: '900' },
  monthlyStatLabel: { fontSize: 9, fontWeight: '600' },
  weekList: { gap: 12 },
  decisionSection: { paddingHorizontal: 20, paddingTop: 8 },
  regenerateWrap: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  regenerateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  regenerateText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  chatLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatLinkText: { fontSize: 13, fontWeight: '600', color: '#7B2FA0' },
  sharePlanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
  },
  sharePlanIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sharePlanTitle: { fontSize: 14, fontWeight: '800' },
  sharePlanSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
});

const prs = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '800' },
  subtitle: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,183,49,0.08)', alignItems: 'center', justifyContent: 'center' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  pillText: { fontSize: 15, fontWeight: '800' },
});

const ps = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  editText: { fontSize: 11, fontWeight: '700', color: '#7B2FA0' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
});

const wn = StyleSheet.create({
  container: { padding: 20, borderRadius: 24, gap: 14 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  optionsColumn: { gap: 10 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 18, borderWidth: 1.5,
  },
  optionIconSmall: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionTitleRow: { fontSize: 15, fontWeight: '900' },
  optionDescRow: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  featuresInline: { flexDirection: 'row', gap: 10, marginTop: 2 },
  featureTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featureText: { fontSize: 10, fontWeight: '700' },
  optionArrow: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  recipeVideoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 18, borderWidth: 1.5,
  },
});

const nr = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  ring: { borderRadius: 32, borderWidth: 4, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringFill: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 32, borderWidth: 4, borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '45deg' }] },
  value: { fontSize: 15, fontWeight: '900' },
  unit: { fontSize: 8, fontWeight: '600' },
  label: { fontSize: 10, fontWeight: '600' },
});

const fti = StyleSheet.create({
  wrapper: {
    position: 'absolute', top: 8, right: 20, zIndex: 50,
  },
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#1E1456', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  tokenIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  balance: { fontSize: 16, fontWeight: '900', color: '#FDD85D' },
  label: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.70)' },
  lowBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
});

const mc = StyleSheet.create({
  gradientBorder: { borderRadius: 19, padding: 1.5 },
  card: { padding: 16, borderRadius: 18, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealType: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  mealName: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  mealDesc: { fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 17 },
  calBadge: { alignItems: 'center' },
  calValue: { fontSize: 18, fontWeight: '900', color: '#F5B731' },
  calUnit: { fontSize: 9, fontWeight: '600', color: '#D9A020' },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 10 },
  macroValue: { fontSize: 13, fontWeight: '800' },
  macroLabel: { fontSize: 9, fontWeight: '600' },
  expandedSection: { paddingTop: 10, borderTopWidth: 1, gap: 10 },
  ingredientsTitle: { fontSize: 13, fontWeight: '700' },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ingredientText: { fontSize: 11, fontWeight: '600' },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  expandHint: { alignItems: 'center' },
  mealActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  mealActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  mealActionText: { fontSize: 10, fontWeight: '700' },
  recipeVideoCard: { padding: 12, borderRadius: 14, borderWidth: 1, marginTop: 6, gap: 6 },
  recipeVideoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipeVideoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recipeVideoTitle: { fontSize: 13, fontWeight: '800' },
  recipeVideoSub: { fontSize: 11, fontWeight: '500' },
  recipeTokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(245,183,49,0.10)',
  },
  recipeTokenText: { fontSize: 12, fontWeight: '900', color: '#F5B731' },
  recipeVideoHint: { fontSize: 10, fontWeight: '500' },
});

const sw = StyleSheet.create({
  container: { marginTop: 12, gap: 10 },
  headerRow: { gap: 2 },
  title: { fontSize: 14, fontWeight: '800' },
  subtitle: { fontSize: 11, fontWeight: '500' },
  optionCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionName: { fontSize: 14, fontWeight: '800' },
  optionDesc: { fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 2 },
  selectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(196,30,122,0.08)', alignItems: 'center', justifyContent: 'center' },
  optionMacros: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  macroPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  macroText: { fontSize: 10, fontWeight: '700' },
  whyText: { fontSize: 11, fontWeight: '500', fontStyle: 'italic' },
});

const wd = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '900' },
  dayFull: { fontSize: 15, fontWeight: '800' },
  mealPreview: { gap: 1, marginTop: 2 },
  mealPreviewText: { fontSize: 10, fontWeight: '500' },
  calColumn: { alignItems: 'center' },
  calValue: { fontSize: 16, fontWeight: '900', color: '#F5B731' },
  calLabel: { fontSize: 8, fontWeight: '600' },
  expanded: { paddingTop: 12, marginTop: 10, borderTopWidth: 1, gap: 8 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: 13, fontWeight: '700' },
  mealMacros: { fontSize: 10, fontWeight: '500', marginTop: 1 },
});

const mw = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weekNum: { fontSize: 14, fontWeight: '900' },
  theme: { fontSize: 15, fontWeight: '800' },
  focus: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  costBadge: { alignItems: 'center' },
  costValue: { fontSize: 16, fontWeight: '900', color: '#F5B731' },
  costLabel: { fontSize: 8, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(30,20,86,0.04)' },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600' },
  highlights: { gap: 8 },
  highlightsTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12 },
  highlightName: { fontSize: 13, fontWeight: '700' },
  highlightMeta: { fontSize: 10, fontWeight: '500', marginTop: 1 },
});

const cs = StyleSheet.create({
  container: { marginTop: 10, padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
  header: { gap: 8 },
  title: { fontSize: 15, fontWeight: '800' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  metaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metaText: { fontSize: 10, fontWeight: '700' },
  stepsList: { gap: 12 },
  stepItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  stepTitle: { fontSize: 13, fontWeight: '800' },
  stepInstruction: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  stepFooter: { flexDirection: 'row', gap: 12, marginTop: 3, flexWrap: 'wrap' },
  stepDuration: { fontSize: 10, fontWeight: '600' },
  stepTip: { fontSize: 10, fontWeight: '600', fontStyle: 'italic' },
  chefTipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  chefTipLabel: { fontSize: 11, fontWeight: '800' },
  chefTipText: { fontSize: 12, fontWeight: '500', lineHeight: 17, marginTop: 2 },
});
