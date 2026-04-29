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
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../template';
import { useCoin } from '../hooks/useCoin';
import { loadPreferences, loadAdvancedPreferences } from '../services/preferencesService';
import { generateMealPlan, TodayPlan, WeeklyPlan, MonthlyPlan, MealItem } from '../services/mealPlannerService';
import { COIN_RULES } from '../services/coinService';

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
function MealCard({ meal, index, colors, isDark }: {
  meal: MealItem; index: number; colors: any; isDark: boolean;
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

        {/* Macro row */}
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

        {/* Expanded details */}
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
          </Animated.View>
        ) : null}

        <View style={mc.expandHint}>
          <MaterialIcons name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Weekly Day Row ──
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

// ── Main Screen ──
export default function AajKhaneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { earnCoins } = useCoin();
  const [activeTab, setActiveTab] = useState<PlanTab>('today');
  const [showCookPrompt, setShowCookPrompt] = useState(false);
  const [coinAwarded, setCoinAwarded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<any>(null);

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

  const fetchPlan = useCallback(async (tab: PlanTab, userPrefs?: any) => {
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
      // Award coins for generating plan
      const coinKey = `${tab}-${Date.now()}`;
      if (!coinAwarded.has(tab)) {
        setCoinAwarded(prev => new Set(prev).add(tab));
        earnCoins(COIN_RULES.meal_plan_generated.amount, 'meal_plan_generated', { planType: tab });
      }
      setShowCookPrompt(true);
    }
    setLoading(false);
  }, [prefs, loadUserPrefs]);

  useEffect(() => {
    loadUserPrefs().then(p => fetchPlan('today', p));
  }, []);

  const handleTabChange = useCallback((tab: PlanTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    const cached = tab === 'today' ? todayPlan : tab === 'weekly' ? weeklyPlan : monthlyPlan;
    if (!cached) fetchPlan(tab);
  }, [todayPlan, weeklyPlan, monthlyPlan, fetchPlan]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlan(activeTab);
    setRefreshing(false);
  }, [activeTab, fetchPlan]);

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
              <Text style={s.headerSub}>AI-powered meal plans based on your preferences</Text>
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
              {/* Nutrition Summary */}
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

              {/* Meal Cards */}
              <View style={s.mealList}>
                {todayPlan.meals.map((meal, i) => (
                  <MealCard key={i} meal={meal} index={i} colors={colors} isDark={isDark} />
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

          {/* Book a Cook Prompt */}
          {showCookPrompt && !loading && !error ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[s.cookPromptCard, { backgroundColor: colors.surface, borderColor: 'rgba(212,175,55,0.25)' }]}>
              <View style={s.cookPromptHeader}>
                <View style={s.cookPromptIconWrap}>
                  <Text style={{ fontSize: 28 }}>👨‍🍳</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.cookPromptTitle, { color: colors.textPrimary }]}>Want an expert cook?</Text>
                  <Text style={[s.cookPromptSub, { color: colors.textMuted }]}>Let a professional cook prepare these meals for you</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/cook' as any); }}
              >
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={s.cookPromptBtn}>
                  <MaterialIcons name="restaurant" size={18} color="#FFF" />
                  <Text style={s.cookPromptBtnText}>Book a Cook</Text>
                  <View style={s.cookPromptCoinBadge}>
                    <Text style={{ fontSize: 10 }}>🪙</Text>
                    <Text style={s.cookPromptCoinText}>+{COIN_RULES.cook_booked.amount}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.cookPromptDismiss, pressed && { opacity: 0.6 }]}
                onPress={() => setShowCookPrompt(false)}
              >
                <Text style={[s.cookPromptDismissText, { color: colors.textMuted }]}>Maybe later</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Service Cards */}
          {!loading && !error ? (
            <Animated.View entering={FadeInDown.delay(250).duration(300)} style={s.serviceCards}>
              <Pressable
                style={({ pressed }) => [s.serviceCardItem, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/cook' as any); }}
              >
                <View style={[s.serviceCardIcon, { backgroundColor: 'rgba(255,107,107,0.10)' }]}>
                  <Text style={{ fontSize: 24 }}>👨‍🍳</Text>
                </View>
                <Text style={[s.serviceCardTitle, { color: colors.textPrimary }]}>Book a Cook</Text>
                <Text style={[s.serviceCardSub, { color: colors.textMuted }]}>Hire experts</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.serviceCardItem, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/grocery' as any); }}
              >
                <View style={[s.serviceCardIcon, { backgroundColor: 'rgba(74,222,128,0.10)' }]}>
                  <Text style={{ fontSize: 24 }}>🛒</Text>
                </View>
                <Text style={[s.serviceCardTitle, { color: colors.textPrimary }]}>Smart Grocery</Text>
                <Text style={[s.serviceCardSub, { color: colors.textMuted }]}>Budget bundles</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.serviceCardItem, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/ai-meal-chat' as any); }}
              >
                <View style={[s.serviceCardIcon, { backgroundColor: 'rgba(139,92,246,0.10)' }]}>
                  <Text style={{ fontSize: 24 }}>🧠</Text>
                </View>
                <Text style={[s.serviceCardTitle, { color: colors.textPrimary }]}>AI Chat</Text>
                <Text style={[s.serviceCardSub, { color: colors.textMuted }]}>Plan meals</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Regenerate Button */}
          {!loading && !error ? (
            <Animated.View entering={FadeInDown.delay(300).duration(300)} style={s.regenerateWrap}>
              <Pressable style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]} onPress={() => { setCoinAwarded(prev => { const n = new Set(prev); n.delete(activeTab); return n; }); fetchPlan(activeTab); }}>
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
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)',
  },
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
  // Cook Prompt
  cookPromptCard: {
    padding: 16, borderRadius: 18, borderWidth: 1.5, gap: 12,
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  cookPromptHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cookPromptIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  cookPromptTitle: { fontSize: 16, fontWeight: '800' },
  cookPromptSub: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  cookPromptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14,
  },
  cookPromptBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  cookPromptCoinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  cookPromptCoinText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  cookPromptDismiss: { alignSelf: 'center', paddingVertical: 4 },
  cookPromptDismissText: { fontSize: 12, fontWeight: '600' },
  // Service Cards in Decision Lens
  serviceCards: { flexDirection: 'row', gap: 10 },
  serviceCardItem: {
    flex: 1, alignItems: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  serviceCardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceCardTitle: { fontSize: 12, fontWeight: '800' },
  serviceCardSub: { fontSize: 9, fontWeight: '600' },
  regenerateWrap: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  regenerateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  regenerateText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  chatLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatLinkText: { fontSize: 13, fontWeight: '600', color: '#D4AF37' },
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
