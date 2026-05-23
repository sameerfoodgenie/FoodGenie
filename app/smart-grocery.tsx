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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Bundle Grocery Data (Monthly) ──
const BUNDLE_GROCERIES: Record<string, { meals: { ingredients: string[] }[] }> = {
  essential: {
    meals: [
      { ingredients: ['rice 5kg', 'atta 5kg', 'toor dal 2kg', 'moong dal 1kg', 'masoor dal 1kg', 'chana dal 1kg', 'urad dal 500g', 'sugar 2kg', 'salt 1kg', 'poha 1kg', 'besan 500g', 'sooji 500g', 'maida 500g'] },
      { ingredients: ['sunflower oil 5L', 'ghee 1L', 'mustard oil 1L'] },
      { ingredients: ['milk 30L', 'curd 4kg', 'paneer 2kg', 'butter 500g', 'cheese 200g'] },
      { ingredients: ['onion 8kg', 'tomato 6kg', 'potato 5kg', 'garlic 500g', 'ginger 500g', 'green chillies 500g', 'coriander leaves 1kg', 'spinach 2kg', 'capsicum 1kg'] },
      { ingredients: ['turmeric 500g', 'cumin seeds 200g', 'red chilli powder 500g', 'garam masala 200g', 'coriander powder 500g', 'mustard seeds 200g'] },
      { ingredients: ['egg 60 pcs', 'bread 2kg', 'banana 8kg', 'apple 2kg', 'lemon 1kg'] },
    ],
  },
  healthy: {
    meals: [
      { ingredients: ['brown rice 3kg', 'quinoa 1kg', 'oats 2kg', 'atta 3kg', 'moong dal 2kg', 'toor dal 1kg', 'masoor dal 1kg', 'rajma 1kg', 'chana 1kg'] },
      { ingredients: ['olive oil 1L', 'coconut oil 1L', 'ghee 500ml', 'flaxseed 200g', 'chia seeds 200g', 'pumpkin seeds 200g'] },
      { ingredients: ['milk 20L', 'greek yogurt 4kg', 'paneer 1.5kg', 'tofu 1kg', 'whey protein 500g'] },
      { ingredients: ['spinach 3kg', 'broccoli 2kg', 'sweet potato 3kg', 'capsicum 2kg', 'cucumber 2kg', 'carrot 2kg', 'beetroot 1kg', 'avocado 1kg', 'mushroom 1kg'] },
      { ingredients: ['chicken breast 4kg', 'egg 90 pcs', 'fish 2kg', 'almond 500g', 'walnut 250g', 'peanut butter 500g'] },
      { ingredients: ['banana 6kg', 'apple 4kg', 'berries 1kg', 'orange 3kg', 'papaya 2kg', 'pomegranate 2kg'] },
      { ingredients: ['turmeric 300g', 'cumin seeds 200g', 'black pepper 100g', 'cinnamon 100g', 'honey 500g', 'green tea 200g'] },
    ],
  },
  family: {
    meals: [
      { ingredients: ['rice 10kg', 'atta 10kg', 'toor dal 3kg', 'moong dal 2kg', 'masoor dal 2kg', 'chana dal 2kg', 'urad dal 1kg', 'rajma 1kg', 'sugar 3kg', 'salt 2kg', 'poha 2kg', 'besan 1kg', 'sooji 1kg', 'maida 1kg', 'vermicelli 500g'] },
      { ingredients: ['sunflower oil 10L', 'ghee 2L', 'mustard oil 2L', 'butter 1kg'] },
      { ingredients: ['milk 60L', 'curd 8kg', 'paneer 4kg', 'butter 1kg', 'cheese 500g', 'cream 1L'] },
      { ingredients: ['onion 15kg', 'tomato 10kg', 'potato 8kg', 'garlic 1kg', 'ginger 1kg', 'green chillies 1kg', 'coriander leaves 2kg', 'spinach 4kg', 'capsicum 2kg', 'cauliflower 3kg', 'cabbage 2kg', 'beans 2kg', 'peas 2kg', 'carrot 2kg'] },
      { ingredients: ['turmeric 1kg', 'cumin seeds 500g', 'red chilli powder 1kg', 'garam masala 500g', 'coriander powder 1kg', 'mustard seeds 500g', 'bay leaf 100g', 'cardamom 100g', 'cinnamon 100g'] },
      { ingredients: ['chicken 8kg', 'egg 120 pcs', 'fish 3kg', 'bread 4kg'] },
      { ingredients: ['banana 12kg', 'apple 4kg', 'orange 3kg', 'lemon 2kg', 'mango 3kg', 'watermelon 5kg'] },
    ],
  },
  budget: {
    meals: [
      { ingredients: ['rice 5kg', 'atta 5kg', 'toor dal 1kg', 'moong dal 1kg', 'masoor dal 500g', 'sugar 1kg', 'salt 1kg', 'poha 500g'] },
      { ingredients: ['sunflower oil 2L', 'mustard oil 500ml'] },
      { ingredients: ['milk 15L', 'curd 2kg', 'paneer 500g', 'butter 200g'] },
      { ingredients: ['onion 4kg', 'tomato 3kg', 'potato 3kg', 'garlic 250g', 'ginger 250g', 'green chillies 250g', 'coriander leaves 500g', 'spinach 1kg'] },
      { ingredients: ['turmeric 200g', 'cumin seeds 100g', 'red chilli powder 200g', 'garam masala 100g', 'coriander powder 200g'] },
      { ingredients: ['egg 30 pcs', 'bread 1kg', 'banana 4kg', 'lemon 500g'] },
    ],
  },
};

// ── Bundle Data ──
const BUNDLES = [
  {
    id: 'essential',
    name: 'Essential Pack',
    bestFor: 'Daily home cooking',
    items: '35+',
    cost: 5999,
    savings: 850,
    familySize: '2-3 members',
    emoji: '🏠',
    color: '#F5B731',
  },
  {
    id: 'healthy',
    name: 'Healthy Living Pack',
    bestFor: 'Fitness and clean eating',
    items: '40+',
    cost: 7499,
    savings: 1200,
    familySize: '1-2 members',
    emoji: '🥗',
    color: '#4ADE80',
  },
  {
    id: 'family',
    name: 'Family Feast Pack',
    bestFor: 'Family of 4',
    items: '55+',
    cost: 9999,
    savings: 1800,
    familySize: '4-5 members',
    emoji: '👨‍👩‍👧‍👦',
    color: '#7B2FA0',
  },
  {
    id: 'budget',
    name: 'Budget Saver Pack',
    bestFor: 'Students and bachelors',
    items: '25+',
    cost: 3999,
    savings: 650,
    familySize: '1 person',
    emoji: '💰',
    color: '#60A5FA',
  },
];

// ── Daily Essentials ──
const DAILY_ESSENTIALS = [
  { id: 'milk', name: 'Milk', emoji: '🥛', defaultFreq: 'Daily' },
  { id: 'curd', name: 'Curd', emoji: '🥣', defaultFreq: 'Daily' },
  { id: 'paneer', name: 'Paneer', emoji: '🧀', defaultFreq: 'Weekly' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎', defaultFreq: 'Alternate days' },
  { id: 'vegetables', name: 'Vegetables', emoji: '🥬', defaultFreq: 'Daily' },
  { id: 'bread', name: 'Bread', emoji: '🍞', defaultFreq: 'Alternate days' },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', defaultFreq: 'Weekly' },
  { id: 'coconut-water', name: 'Coconut Water', emoji: '🥥', defaultFreq: 'Daily' },
  { id: 'buttermilk', name: 'Buttermilk', emoji: '🥛', defaultFreq: 'Daily' },
];

// ── Pantry Mock Data ──
const PANTRY_ITEMS = [
  { name: 'Atta', remaining: '3.5kg', status: 'good', emoji: '🌾' },
  { name: 'Paneer', remaining: '200g', status: 'low', emoji: '🧀' },
  { name: 'Milk', remaining: 'Reorder', status: 'reorder', emoji: '🥛' },
  { name: 'Tomatoes', remaining: '250g', status: 'expiring', emoji: '🍅' },
  { name: 'Rice', remaining: '4kg', status: 'good', emoji: '🍚' },
  { name: 'Oil', remaining: '1.2L', status: 'good', emoji: '🫗' },
];

// ── Savings Breakdown ──
const SAVINGS_DATA = {
  normalCost: 8450,
  smartCost: 7120,
  totalSavings: 1330,
  breakdown: [
    { label: 'Smart Split Savings', amount: 480, icon: 'auto-awesome' },
    { label: 'Bulk Bundle Savings', amount: 420, icon: 'inventory-2' },
    { label: 'Auto-order Savings', amount: 230, icon: 'schedule' },
    { label: 'Kirana Partner Savings', amount: 200, icon: 'storefront' },
  ],
};

export default function SmartGroceryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedEssentials, setSelectedEssentials] = useState<Set<string>>(new Set(['milk', 'curd', 'vegetables']));

  const toggleEssential = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedEssentials(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBundlePress = useCallback((bundleId: string, bundleName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const bundleData = BUNDLE_GROCERIES[bundleId];
    if (bundleData) {
      router.push({
        pathname: '/grocery-cart',
        params: {
          planData: JSON.stringify(bundleData),
          planType: `monthly (${bundleName})`,
        },
      });
    } else {
      router.push('/grocery-cart');
    }
  }, [router]);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#1E1456', '#7B2FA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
          <View style={st.headerRow}>
            <Pressable style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Smart Grocery 🛒</Text>
              <Text style={st.headerSub}>Plan, save and auto-order intelligently</Text>
            </View>
          </View>
          {/* Savings highlight */}
          <View style={st.savingsHighlight}>
            <MaterialIcons name="savings" size={16} color="#F5B731" />
            <Text style={st.savingsHighlightText}>Save up to ₹{SAVINGS_DATA.totalSavings.toLocaleString()}/month with smart planning</Text>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>

          {/* ═══ Section 1: Savings Overview ═══ */}
          <Animated.View entering={FadeInDown.delay(50).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <View style={[st.savingsCard, { backgroundColor: isDark ? 'rgba(30,20,86,0.12)' : 'rgba(30,20,86,0.02)', borderColor: isDark ? 'rgba(123,47,160,0.20)' : 'rgba(30,20,86,0.08)' }]}>
              <View style={st.savingsHeader}>
                <MaterialIcons name="insights" size={18} color="#7B2FA0" />
                <Text style={[st.savingsTitle, { color: colors.textPrimary }]}>Smart Savings</Text>
              </View>
              <View style={st.savingsCostRow}>
                <View style={st.savingsCostItem}>
                  <Text style={[st.savingsCostLabel, { color: colors.textMuted }]}>Normal</Text>
                  <Text style={[st.savingsCostStrike, { color: colors.textMuted }]}>₹{SAVINGS_DATA.normalCost.toLocaleString()}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={16} color={colors.textMuted} />
                <View style={st.savingsCostItem}>
                  <Text style={[st.savingsCostLabel, { color: colors.textMuted }]}>FoodGenie</Text>
                  <Text style={[st.savingsCostValue, { color: '#4ADE80' }]}>₹{SAVINGS_DATA.smartCost.toLocaleString()}</Text>
                </View>
                <View style={st.savingsBadge}>
                  <Text style={st.savingsBadgeText}>-₹{SAVINGS_DATA.totalSavings}</Text>
                </View>
              </View>
              <View style={st.savingsBreakdown}>
                {SAVINGS_DATA.breakdown.map((item, i) => (
                  <View key={i} style={st.savingsBreakdownItem}>
                    <MaterialIcons name={item.icon as any} size={12} color="#7B2FA0" />
                    <Text style={[st.savingsBreakdownLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <Text style={[st.savingsBreakdownAmount, { color: '#4ADE80' }]}>₹{item.amount}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ═══ Section 2: Monthly Bundles ═══ */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={{ paddingTop: 24 }}>
            <View style={st.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="inventory-2" size={18} color="#F5B731" />
                <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Smart Monthly Bundles</Text>
              </View>
              <Text style={[st.sectionSubtitle, { color: colors.textMuted }]}>AI-curated based on meal plan & family size</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {BUNDLES.map((bundle, i) => (
                <Animated.View key={bundle.id} entering={FadeInDown.delay(120 + i * 60).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [
                      st.bundleCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => handleBundlePress(bundle.id, bundle.name)}
                  >
                    <View style={[st.bundleIcon, { backgroundColor: `${bundle.color}12` }]}>
                      <Text style={{ fontSize: 26 }}>{bundle.emoji}</Text>
                    </View>
                    <Text style={[st.bundleName, { color: colors.textPrimary }]}>{bundle.name}</Text>
                    <Text style={[st.bundleBestFor, { color: colors.textMuted }]}>{bundle.bestFor}</Text>
                    <View style={st.bundleStats}>
                      <View style={[st.bundleStat, { backgroundColor: isDark ? 'rgba(123,47,160,0.06)' : 'rgba(123,47,160,0.03)' }]}>
                        <Text style={[st.bundleStatValue, { color: colors.textPrimary }]}>{bundle.items}</Text>
                        <Text style={[st.bundleStatLabel, { color: colors.textMuted }]}>items</Text>
                      </View>
                      <View style={[st.bundleStat, { backgroundColor: isDark ? 'rgba(245,183,49,0.06)' : 'rgba(245,183,49,0.03)' }]}>
                        <Text style={[st.bundleStatValue, { color: colors.textPrimary }]}>{bundle.familySize}</Text>
                        <Text style={[st.bundleStatLabel, { color: colors.textMuted }]}>size</Text>
                      </View>
                    </View>
                    <View style={st.bundlePricing}>
                      <Text style={[st.bundleCost, { color: colors.textPrimary }]}>₹{bundle.cost.toLocaleString()}<Text style={[st.bundleCostPer, { color: colors.textMuted }]}>/mo</Text></Text>
                      <View style={st.bundleSaveBadge}>
                        <Text style={st.bundleSaveText}>Save ₹{bundle.savings}</Text>
                      </View>
                    </View>
                    <View style={[st.bundleCta, { borderColor: bundle.color }]}>
                      <Text style={[st.bundleCtaText, { color: bundle.color }]}>View Bundle</Text>
                      <MaterialIcons name="arrow-forward" size={12} color={bundle.color} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ Section 3: Auto Daily Essentials ═══ */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={[st.essentialsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={st.essentialsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="schedule" size={18} color="#7B2FA0" />
                  <Text style={[st.essentialsTitle, { color: colors.textPrimary }]}>Schedule Daily Essentials</Text>
                </View>
                <Text style={[st.essentialsSub, { color: colors.textMuted }]}>Auto-order milk, curd, fruits & more</Text>
              </View>
              <View style={st.essentialsGrid}>
                {DAILY_ESSENTIALS.map(item => {
                  const isSelected = selectedEssentials.has(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        st.essentialChip,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.06)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          borderColor: isSelected ? 'rgba(123,47,160,0.30)' : colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => toggleEssential(item.id)}
                    >
                      <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                      <Text style={[st.essentialChipText, { color: isSelected ? '#7B2FA0' : colors.textSecondary }]}>{item.name}</Text>
                      {isSelected ? (
                        <View style={st.essentialCheck}>
                          <MaterialIcons name="check" size={10} color="#FFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={({ pressed }) => [st.setAutoBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              >
                <LinearGradient colors={['#7B2FA0', '#1E1456']} style={st.setAutoBtnGrad}>
                  <MaterialIcons name="schedule" size={16} color="#FFF" />
                  <Text style={st.setAutoBtnText}>Set Auto Order</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* ═══ Section 4: Pantry Intelligence ═══ */}
          <Animated.View entering={FadeInDown.delay(280).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={[st.pantryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={st.pantryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="kitchen" size={18} color="#F5B731" />
                  <Text style={[st.pantryTitle, { color: colors.textPrimary }]}>Your Pantry</Text>
                </View>
                <Pressable style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                  <Text style={st.pantrySeeAll}>View All</Text>
                </Pressable>
              </View>
              <View style={st.pantryGrid}>
                {PANTRY_ITEMS.map((item, i) => {
                  const statusColor = item.status === 'good' ? '#4ADE80' : item.status === 'low' ? '#F5B731' : item.status === 'expiring' ? '#F04E50' : '#7B2FA0';
                  const statusLabel = item.status === 'good' ? 'OK' : item.status === 'low' ? 'Low' : item.status === 'expiring' ? 'Expiring' : 'Reorder';
                  return (
                    <View key={i} style={[st.pantryItem, { borderColor: colors.border }]}>
                      <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.pantryItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                        <Text style={[st.pantryItemQty, { color: colors.textMuted }]}>{item.remaining}</Text>
                      </View>
                      <View style={[st.pantryStatusBadge, { backgroundColor: `${statusColor}12` }]}>
                        <View style={[st.pantryStatusDot, { backgroundColor: statusColor }]} />
                        <Text style={[st.pantryStatusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* ═══ Section 5: Local Kirana ═══ */}
          <Animated.View entering={FadeInDown.delay(340).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={[st.kiranaCard, { backgroundColor: isDark ? 'rgba(255,140,66,0.04)' : 'rgba(255,140,66,0.02)', borderColor: 'rgba(255,140,66,0.18)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={st.kiranaIcon}>
                  <Text style={{ fontSize: 24 }}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.kiranaTitle, { color: colors.textPrimary }]}>Support Local Kiranas</Text>
                  <Text style={[st.kiranaSub, { color: colors.textMuted }]}>Fresh veggies, daily essentials, no delivery fee</Text>
                </View>
              </View>
              <View style={st.kiranaFeatures}>
                {['Daily Essentials', 'Vegetables', 'Fruits', 'Monthly Staples'].map((f, i) => (
                  <View key={i} style={[st.kiranaFeatureChip, { backgroundColor: isDark ? 'rgba(255,140,66,0.08)' : 'rgba(255,140,66,0.05)' }]}>
                    <Text style={[st.kiranaFeatureText, { color: '#FF8C42' }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={({ pressed }) => [st.kiranaCta, pressed && { opacity: 0.85 }]}>
                <MaterialIcons name="send" size={14} color="#FF8C42" />
                <Text style={st.kiranaCtaText}>Send List to Kirana</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ═══ Section 6: Quick Navigation ═══ */}
          <Animated.View entering={FadeInDown.delay(400).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <Text style={[st.navTitle, { color: colors.textPrimary }]}>Quick Access</Text>
            <View style={st.navGrid}>
              {[
                { label: 'AI Grocery Cart', icon: 'smart-toy', route: '/grocery-cart', color: '#7B2FA0' },
                { label: 'Smart Split', icon: 'auto-awesome', route: '/smart-split', color: '#4ADE80' },
                { label: 'Order History', icon: 'receipt-long', route: '/booking-history', color: '#F5B731' },
                { label: 'Meal Planner', icon: 'restaurant-menu', route: '/meal-preferences', color: '#F04E50' },
              ].map((nav, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    st.navItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); router.push(nav.route as any); }}
                >
                  <View style={[st.navItemIcon, { backgroundColor: `${nav.color}10` }]}>
                    <MaterialIcons name={nav.icon as any} size={20} color={nav.color} />
                  </View>
                  <Text style={[st.navItemLabel, { color: colors.textSecondary }]}>{nav.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  savingsHighlight: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(245,183,49,0.15)' },
  savingsHighlightText: { fontSize: 12, fontWeight: '700', color: '#FDD85D' },

  // Savings Overview
  savingsCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  savingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savingsTitle: { fontSize: 15, fontWeight: '800' },
  savingsCostRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savingsCostItem: { alignItems: 'center' },
  savingsCostLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  savingsCostStrike: { fontSize: 18, fontWeight: '700', textDecorationLine: 'line-through', marginTop: 2 },
  savingsCostValue: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  savingsBadge: { backgroundColor: '#4ADE80', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
  savingsBadgeText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  savingsBreakdown: { gap: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(123,47,160,0.10)' },
  savingsBreakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savingsBreakdownLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  savingsBreakdownAmount: { fontSize: 12, fontWeight: '800' },

  // Section Header
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12, gap: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // Bundles
  bundleCard: { width: SCREEN_W * 0.56, padding: 14, borderRadius: 18, borderWidth: 1, gap: 8 },
  bundleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bundleName: { fontSize: 14, fontWeight: '800' },
  bundleBestFor: { fontSize: 11, fontWeight: '500' },
  bundleStats: { flexDirection: 'row', gap: 6 },
  bundleStat: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bundleStatValue: { fontSize: 11, fontWeight: '800' },
  bundleStatLabel: { fontSize: 8, fontWeight: '600' },
  bundlePricing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  bundleCost: { fontSize: 16, fontWeight: '900' },
  bundleCostPer: { fontSize: 11, fontWeight: '500' },
  bundleSaveBadge: { backgroundColor: 'rgba(74,222,128,0.12)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  bundleSaveText: { fontSize: 10, fontWeight: '700', color: '#4ADE80' },
  bundleCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  bundleCtaText: { fontSize: 12, fontWeight: '700' },

  // Essentials
  essentialsCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  essentialsHeader: { gap: 2 },
  essentialsTitle: { fontSize: 15, fontWeight: '800' },
  essentialsSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  essentialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  essentialChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  essentialChipText: { fontSize: 12, fontWeight: '700' },
  essentialCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#7B2FA0', alignItems: 'center', justifyContent: 'center' },
  setAutoBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  setAutoBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  setAutoBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Pantry
  pantryCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  pantryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pantryTitle: { fontSize: 15, fontWeight: '800' },
  pantrySeeAll: { fontSize: 12, fontWeight: '700', color: '#7B2FA0' },
  pantryGrid: { gap: 6 },
  pantryItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  pantryItemName: { fontSize: 13, fontWeight: '700' },
  pantryItemQty: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  pantryStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pantryStatusDot: { width: 6, height: 6, borderRadius: 3 },
  pantryStatusText: { fontSize: 9, fontWeight: '700' },

  // Kirana
  kiranaCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  kiranaIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,140,66,0.10)', alignItems: 'center', justifyContent: 'center' },
  kiranaTitle: { fontSize: 14, fontWeight: '800' },
  kiranaSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  kiranaFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kiranaFeatureChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  kiranaFeatureText: { fontSize: 11, fontWeight: '700' },
  kiranaCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,140,66,0.30)' },
  kiranaCtaText: { fontSize: 13, fontWeight: '700', color: '#FF8C42' },

  // Quick Nav
  navTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navItem: { width: (SCREEN_W - 42) / 2, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  navItemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navItemLabel: { fontSize: 12, fontWeight: '700', flex: 1 },
});
