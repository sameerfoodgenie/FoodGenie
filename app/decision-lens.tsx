import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth, useAlert } from '../template';
import { useCoin } from '../hooks/useCoin';
import { loadPreferences, loadAdvancedPreferences } from '../services/preferencesService';
import { generateMealPlan, TodayPlan, WeeklyPlan, MonthlyPlan, MealItem } from '../services/mealPlannerService';
import { COIN_RULES } from '../services/coinService';
import {
  loadSubscription,
  deductTokens,
  isSubscriptionActive,
  TOKEN_COSTS as SUB_TOKEN_COSTS,
  UserSubscription,
} from '../services/subscriptionService';

const { width: SCREEN_W } = Dimensions.get('window');

type PlanTab = 'today' | 'weekly' | 'monthly';

const PLAN_TABS: { id: PlanTab; label: string; emoji: string }[] = [
  { id: 'today', label: 'Today', emoji: '☀️' },
  { id: 'weekly', label: 'Weekly', emoji: '📅' },
  { id: 'monthly', label: 'Monthly', emoji: '🗓️' },
];

const MEAL_ICONS: Record<string, { emoji: string; gradient: readonly [string, string] }> = {
  breakfast: { emoji: '☀️', gradient: ['#FFB347', '#FF8E53'] as const },
  lunch: { emoji: '🍽️', gradient: ['#4ADE80', '#22C55E'] as const },
  snack: { emoji: '🍿', gradient: ['#818CF8', '#6366F1'] as const },
  dinner: { emoji: '🌙', gradient: ['#8B5CF6', '#7C3AED'] as const },
};

const DAY_COLORS = ['#FF6B6B', '#FFB347', '#4ADE80', '#22D3EE', '#818CF8', '#F472B6', '#D4AF37'];

// ── Nutrition Ring ──
function NutritionRing({ label, value, unit, color, size = 64 }: {
  label: string; value: number; unit: string; color: string; size?: number;
}) {
  return (
    <View style={[nr.container, { width: size + 20 }]}>
      <View style={[nr.ring, { width: size, height: size, borderColor: `${color}30` }]}>
        <View style={[nr.ringFill, { borderColor: color }]} />
        <Text style={[nr.value, { color }]}>{value}</Text>
        <Text style={[nr.unit, { color: `${color}AA` }]}>{unit}</Text>
      </View>
      <Text style={nr.label}>{label}</Text>
    </View>
  );
}

// ── Meal Card ──
function MealCard({ meal, index, colors, isDark, router }: {
  meal: MealItem; index: number; colors: any; isDark: boolean; router: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = MEAL_ICONS[meal.type] || MEAL_ICONS.lunch;

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(350)}>
      <Pressable
        style={[mc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
          <View style={[mc.macroItem, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
            <Text style={[mc.macroValue, { color: '#EF4444' }]}>{meal.protein}g</Text>
            <Text style={[mc.macroLabel, { color: colors.textMuted }]}>Protein</Text>
          </View>
          <View style={[mc.macroItem, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
            <Text style={[mc.macroValue, { color: '#F59E0B' }]}>{meal.carbs}g</Text>
            <Text style={[mc.macroLabel, { color: colors.textMuted }]}>Carbs</Text>
          </View>
          <View style={[mc.macroItem, { backgroundColor: 'rgba(129,140,248,0.08)' }]}>
            <Text style={[mc.macroValue, { color: '#818CF8' }]}>{meal.fat}g</Text>
            <Text style={[mc.macroLabel, { color: colors.textMuted }]}>Fat</Text>
          </View>
          {meal.prepTime ? (
            <View style={[mc.macroItem, { backgroundColor: 'rgba(74,222,128,0.08)' }]}>
              <Text style={[mc.macroValue, { color: '#4ADE80' }]}>{meal.prepTime}m</Text>
              <Text style={[mc.macroLabel, { color: colors.textMuted }]}>Prep</Text>
            </View>
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
              <View style={[mc.tipBox, { backgroundColor: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.15)' }]}>
                <Text style={{ fontSize: 12 }}>💡</Text>
                <Text style={[mc.tipText, { color: colors.textSecondary }]}>{meal.tip}</Text>
              </View>
            ) : null}

            {/* Meal Quick Actions */}
            <View style={mc.mealActions}>
              <Pressable style={[mc.mealActionBtn, { backgroundColor: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.20)' }]}>
                <MaterialIcons name="add-shopping-cart" size={14} color="#4ADE80" />
                <Text style={[mc.mealActionText, { color: '#4ADE80' }]}>Add to Cart</Text>
              </Pressable>
              <Pressable
                style={[mc.mealActionBtn, { backgroundColor: 'rgba(129,140,248,0.08)', borderColor: 'rgba(129,140,248,0.20)' }]}
                onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/recipe-videos' as any, params: { planData: JSON.stringify({ meals: [meal] }) } }); }}
              >
                <MaterialIcons name="play-circle" size={14} color="#818CF8" />
                <Text style={[mc.mealActionText, { color: '#818CF8' }]}>Recipe Video</Text>
              </Pressable>
              <Pressable style={[mc.mealActionBtn, { backgroundColor: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.20)' }]}>
                <MaterialIcons name="delivery-dining" size={14} color="#FB923C" />
                <Text style={[mc.mealActionText, { color: '#FB923C' }]}>Order</Text>
              </Pressable>
            </View>

            {/* Recipe Video Card */}
            <Pressable
              style={[mc.recipeVideoCard, { backgroundColor: isDark ? 'rgba(129,140,248,0.06)' : 'rgba(129,140,248,0.03)', borderColor: 'rgba(129,140,248,0.15)' }]}
              onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/recipe-videos' as any, params: { planData: JSON.stringify({ meals: [meal] }) } }); }}
            >
              <View style={mc.recipeVideoRow}>
                <View style={mc.recipeVideoIcon}>
                  <MaterialIcons name="play-circle-filled" size={28} color="#818CF8" />
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
      gradient: ['#4ADE80', '#22C55E'] as const,
      color: '#4ADE80',
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
      gradient: ['#FF6B6B', '#FF8E53'] as const,
      color: '#FF6B6B',
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
      gradient: ['#FB923C', '#F97316'] as const,
      color: '#FB923C',
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
              backgroundColor: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(129,140,248,0.04)',
              borderColor: 'rgba(129,140,248,0.25)',
            }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: '/recipe-videos' as any, params: { planData } }); }}
          >
            <LinearGradient colors={['#818CF8', '#6366F1']} style={wn.optionIconSmall}>
              <Text style={{ fontSize: 24 }}>🎬</Text>
            </LinearGradient>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[wn.optionTitleRow, { color: colors.textPrimary }]}>Watch Recipe Videos</Text>
              <Text style={[wn.optionDescRow, { color: colors.textMuted }]}>Learn from master chefs — free preview, unlock full with tokens</Text>
              <View style={wn.featuresInline}>
                <View style={wn.featureTag}>
                  <Text style={{ fontSize: 9 }}>🪙</Text>
                  <Text style={[wn.featureText, { color: '#818CF8' }]}>15-30 tokens</Text>
                </View>
                <View style={wn.featureTag}>
                  <MaterialIcons name="play-circle" size={10} color="#818CF8" />
                  <Text style={[wn.featureText, { color: '#818CF8' }]}>Free preview</Text>
                </View>
              </View>
            </View>
            <View style={[wn.optionArrow, { backgroundColor: 'rgba(129,140,248,0.20)' }]}>
              <MaterialIcons name="arrow-forward" size={16} color="#818CF8" />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ── Preferences Summary Card ──
function PreferencesSummary({ prefs, colors, isDark, router }: {
  prefs: any; colors: any; isDark: boolean; router: any;
}) {
  if (!prefs) return null;

  const DIET_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    veg: { label: 'Vegetarian', emoji: '🥬', color: '#4ADE80' },
    egg: { label: 'Eggetarian', emoji: '🥚', color: '#FFB347' },
    nonveg: { label: 'Non-Veg', emoji: '🍗', color: '#FF6B6B' },
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
    { label: spice.label, color: '#FF6B6B', emoji: spice.emoji },
    { label: budgetLabel, color: '#4ADE80', emoji: '💰' },
  ];

  if (cuisineList.length > 0) {
    const formatted = cuisineList.map((c: string) => c.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())).join(', ');
    pills.push({ label: formatted, color: '#818CF8', emoji: '🍛' });
  }

  if (prefs.healthGoal && prefs.healthGoal !== 'none' && prefs.healthGoal !== 'balanced') {
    const goalLabel = prefs.healthGoal.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    pills.push({ label: goalLabel, color: '#22D3EE', emoji: '🎯' });
  }

  return (
    <Animated.View entering={FadeInDown.delay(50).duration(300)}>
      <View style={[ps.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={ps.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[ps.title, { color: colors.textPrimary }]}>Your Preferences</Text>
          </View>
          <Pressable
            style={({ pressed }) => [ps.editBtn, { backgroundColor: 'rgba(212,175,55,0.10)', borderColor: 'rgba(212,175,55,0.25)' }, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.push('/meal-preferences' as any); }}
          >
            <MaterialIcons name="edit" size={12} color="#D4AF37" />
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
    const { data, error: err } = await generateMealPlan(p, tab);
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
  }, [prefs, loadUserPrefs, coinAwarded, earnCoins, checkTokensForPlan, deductPlanTokens]);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSubscription();
    await fetchPlan(activeTab);
    setRefreshing(false);
  }, [activeTab, fetchPlan, refreshSubscription]);

  const hasPlan = (activeTab === 'today' && todayPlan) || (activeTab === 'weekly' && weeklyPlan) || (activeTab === 'monthly' && monthlyPlan);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53', '#FFB347']}
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

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />}
        >
          {/* ═══ Preferences Summary ═══ */}
          {prefs ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <PreferencesSummary prefs={prefs} colors={colors} isDark={isDark} router={router} />
            </View>
          ) : null}

          {loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color="#D4AF37" />
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
                  <NutritionRing label="Calories" value={todayPlan.totalCalories} unit="kcal" color="#FF6B6B" />
                  <NutritionRing label="Protein" value={todayPlan.totalProtein} unit="g" color="#EF4444" />
                  <NutritionRing label="Carbs" value={todayPlan.totalCarbs} unit="g" color="#F59E0B" />
                  <NutritionRing label="Fat" value={todayPlan.totalFat} unit="g" color="#818CF8" />
                </View>
              </Animated.View>
              <View style={s.mealList}>
                {todayPlan.meals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} colors={colors} isDark={isDark} router={router} />
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
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={() => { setCoinAwarded(prev => { const n = new Set(prev); n.delete(activeTab); return n; }); fetchPlan(activeTab); }}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.regenerateBtn}>
                  <MaterialIcons name="auto-awesome" size={18} color="#FFF" />
                  <Text style={s.regenerateText}>Regenerate Plan</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.chatLink, pressed && { opacity: 0.7 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/ai-meal-chat' as any); }}
              >
                <MaterialIcons name="chat" size={16} color="#D4AF37" />
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
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  tabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  tabLabelActive: { color: '#FF6B6B' },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '600' },
  loadingHint: { fontSize: 12, fontWeight: '500' },
  errorWrap: { margin: 20, padding: 30, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 10 },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  errorSub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
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
  avgCalBadge: { alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  avgCalValue: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  avgCalLabel: { fontSize: 9, fontWeight: '600', color: '#D4AF37' },
  dayList: { gap: 10 },
  monthlyHeader: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  monthlyTitle: { fontSize: 18, fontWeight: '800' },
  monthlyStatsRow: { flexDirection: 'row', gap: 10 },
  monthlyStatItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.05)' },
  monthlyStatEmoji: { fontSize: 18 },
  monthlyStatValue: { fontSize: 16, fontWeight: '900' },
  monthlyStatLabel: { fontSize: 9, fontWeight: '600' },
  weekList: { gap: 12 },
  decisionSection: { paddingHorizontal: 20, paddingTop: 8 },
  regenerateWrap: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  regenerateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  regenerateText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  chatLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatLinkText: { fontSize: 13, fontWeight: '600', color: '#D4AF37' },
});

const ps = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  editText: { fontSize: 11, fontWeight: '700', color: '#D4AF37' },
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
  label: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
});

const mc = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealType: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  mealName: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  mealDesc: { fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 17 },
  calBadge: { alignItems: 'center' },
  calValue: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  calUnit: { fontSize: 9, fontWeight: '600', color: '#D4AF37' },
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
  recipeVideoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(129,140,248,0.10)', alignItems: 'center', justifyContent: 'center' },
  recipeVideoTitle: { fontSize: 13, fontWeight: '800' },
  recipeVideoSub: { fontSize: 11, fontWeight: '500' },
  recipeTokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  recipeTokenText: { fontSize: 12, fontWeight: '900', color: '#D4AF37' },
  recipeVideoHint: { fontSize: 10, fontWeight: '500' },
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
  calValue: { fontSize: 16, fontWeight: '900', color: '#D4AF37' },
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
  costValue: { fontSize: 16, fontWeight: '900', color: '#D4AF37' },
  costLabel: { fontSize: 8, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600' },
  highlights: { gap: 8 },
  highlightsTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12 },
  highlightName: { fontSize: 13, fontWeight: '700' },
  highlightMeta: { fontSize: 10, fontWeight: '500', marginTop: 1 },
});
