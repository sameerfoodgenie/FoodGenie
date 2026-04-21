import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Budget Plans ──
interface BudgetPlan {
  id: string;
  title: string;
  subtitle: string;
  budget: number;
  emoji: string;
  color: string;
  gradientColors: readonly [string, string];
  items: number;
}

const BUDGET_PLANS: BudgetPlan[] = [
  {
    id: 'monthly',
    title: 'Monthly Grocery',
    subtitle: 'Full month essentials',
    budget: 10000,
    emoji: '📦',
    color: '#D4AF37',
    gradientColors: ['#D4AF37', '#FFD700'],
    items: 45,
  },
  {
    id: 'weekly',
    title: 'Weekly Grocery',
    subtitle: 'Fresh weekly refill',
    budget: 5000,
    emoji: '🛒',
    color: '#4ADE80',
    gradientColors: ['#4ADE80', '#22C55E'],
    items: 22,
  },
  {
    id: 'budget',
    title: 'Budget Saver',
    subtitle: 'Essentials only',
    budget: 3000,
    emoji: '💰',
    color: '#818CF8',
    gradientColors: ['#818CF8', '#6366F1'],
    items: 15,
  },
];

// ── Smart Bundles ──
interface GroceryItem {
  name: string;
  qty: string;
  price: number;
  emoji: string;
}

interface SmartBundle {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  totalPrice: number;
  items: GroceryItem[];
}

const SMART_BUNDLES: SmartBundle[] = [
  {
    id: 'essential',
    name: 'Essential Pack',
    description: 'Daily cooking staples for a family of 4',
    emoji: '🏠',
    color: '#D4AF37',
    totalPrice: 2850,
    items: [
      { name: 'Basmati Rice', qty: '5 kg', price: 450, emoji: '🍚' },
      { name: 'Toor Dal', qty: '2 kg', price: 280, emoji: '🫘' },
      { name: 'Atta (Wheat Flour)', qty: '5 kg', price: 220, emoji: '🌾' },
      { name: 'Cooking Oil', qty: '2 L', price: 320, emoji: '🫗' },
      { name: 'Onions', qty: '3 kg', price: 120, emoji: '🧅' },
      { name: 'Tomatoes', qty: '2 kg', price: 80, emoji: '🍅' },
      { name: 'Potatoes', qty: '3 kg', price: 90, emoji: '🥔' },
      { name: 'Milk', qty: '15 L', price: 900, emoji: '🥛' },
      { name: 'Sugar', qty: '2 kg', price: 90, emoji: '🧂' },
      { name: 'Spices Combo', qty: '1 set', price: 300, emoji: '🌶️' },
    ],
  },
  {
    id: 'healthy',
    name: 'Healthy Living',
    description: 'Nutrient-rich items for health-conscious families',
    emoji: '🥗',
    color: '#4ADE80',
    totalPrice: 3200,
    items: [
      { name: 'Quinoa', qty: '1 kg', price: 350, emoji: '🌾' },
      { name: 'Brown Rice', qty: '2 kg', price: 240, emoji: '🍚' },
      { name: 'Oats', qty: '1 kg', price: 180, emoji: '🥣' },
      { name: 'Mixed Sprouts', qty: '1 kg', price: 160, emoji: '🌱' },
      { name: 'Greek Yogurt', qty: '1 kg', price: 280, emoji: '🥛' },
      { name: 'Dry Fruits Mix', qty: '500 g', price: 450, emoji: '🥜' },
      { name: 'Fresh Veggies', qty: '5 kg', price: 400, emoji: '🥬' },
      { name: 'Fruits Basket', qty: '3 kg', price: 500, emoji: '🍎' },
      { name: 'Olive Oil', qty: '500 ml', price: 420, emoji: '🫒' },
      { name: 'Honey', qty: '500 g', price: 220, emoji: '🍯' },
    ],
  },
  {
    id: 'family',
    name: 'Family Feast',
    description: 'Everything for a big family with snacks and treats',
    emoji: '👨‍👩‍👧‍👦',
    color: '#FF6B6B',
    totalPrice: 5500,
    items: [
      { name: 'Rice + Dal Combo', qty: '10 kg', price: 850, emoji: '🍚' },
      { name: 'Atta', qty: '10 kg', price: 420, emoji: '🌾' },
      { name: 'Cooking Oil', qty: '5 L', price: 750, emoji: '🫗' },
      { name: 'Vegetables Assorted', qty: '8 kg', price: 500, emoji: '🥬' },
      { name: 'Fruits', qty: '5 kg', price: 600, emoji: '🍎' },
      { name: 'Milk & Curd', qty: '20 L', price: 1200, emoji: '🥛' },
      { name: 'Snacks & Biscuits', qty: '2 kg', price: 400, emoji: '🍪' },
      { name: 'Bread & Bakery', qty: '4 packs', price: 180, emoji: '🍞' },
      { name: 'Masalas & Spices', qty: '1 set', price: 350, emoji: '🌶️' },
      { name: 'Tea & Coffee', qty: '500 g', price: 250, emoji: '☕' },
    ],
  },
];

// ── Partner Apps ──
interface PartnerApp {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  color: string;
  deliveryTime: string;
  url: string;
}

const PARTNER_APPS: PartnerApp[] = [
  {
    id: 'zepto',
    name: 'Zepto',
    tagline: '10-min delivery',
    logo: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc608c?w=100&q=80',
    color: '#7B2D8E',
    deliveryTime: '10 min',
    url: 'https://www.zeptonow.com',
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    tagline: 'Everything delivered',
    logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&q=80',
    color: '#F8CB2E',
    deliveryTime: '10-15 min',
    url: 'https://blinkit.com',
  },
  {
    id: 'bigbasket',
    name: 'BigBasket',
    tagline: 'Fresh & quality',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80',
    color: '#84C225',
    deliveryTime: '2-4 hrs',
    url: 'https://www.bigbasket.com',
  },
  {
    id: 'kirana',
    name: 'Local Kirana',
    tagline: 'Support local stores',
    logo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100&q=80',
    color: '#FF8C42',
    deliveryTime: '30-60 min',
    url: '',
  },
];

// ── Category Quick Picks ──
const CATEGORIES = [
  { id: 'veggies', name: 'Vegetables', emoji: '🥬', color: '#4ADE80' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎', color: '#FF6B6B' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛', color: '#60A5FA' },
  { id: 'grains', name: 'Grains', emoji: '🌾', color: '#D4AF37' },
  { id: 'spices', name: 'Spices', emoji: '🌶️', color: '#F97316' },
  { id: 'oils', name: 'Oils', emoji: '🫗', color: '#A78BFA' },
];

// ── Components ──

function BudgetCard({ plan, isSelected, onSelect, colors, isDark }: {
  plan: BudgetPlan; isSelected: boolean; onSelect: () => void; colors: any; isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(100).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          st.budgetCard,
          {
            backgroundColor: isSelected
              ? isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)'
              : colors.surface,
            borderColor: isSelected ? plan.color : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
          pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(); }}
      >
        <Text style={{ fontSize: 28 }}>{plan.emoji}</Text>
        <Text style={[st.budgetCardTitle, { color: colors.textPrimary }]}>{plan.title}</Text>
        <Text style={[st.budgetCardSub, { color: colors.textMuted }]}>{plan.subtitle}</Text>
        <LinearGradient colors={plan.gradientColors} style={st.budgetPriceTag}>
          <Text style={st.budgetPriceText}>₹{plan.budget.toLocaleString()}</Text>
        </LinearGradient>
        <Text style={[st.budgetItemCount, { color: colors.textMuted }]}>{plan.items}+ items</Text>
        {isSelected ? (
          <View style={[st.budgetCheck, { backgroundColor: plan.color }]}>
            <MaterialIcons name="check" size={14} color="#FFF" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function BundleCard({ bundle, index, onOrder, colors, isDark }: {
  bundle: SmartBundle; index: number; onOrder: (bundle: SmartBundle) => void; colors: any; isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(350)}>
      <Pressable
        style={[st.bundleCard, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: isDark ? '#000' : '#B8960C',
        }]}
        onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      >
        <View style={st.bundleHeader}>
          <View style={[st.bundleEmoji, { backgroundColor: `${bundle.color}15` }]}>
            <Text style={{ fontSize: 26 }}>{bundle.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.bundleName, { color: colors.textPrimary }]}>{bundle.name}</Text>
            <Text style={[st.bundleDesc, { color: colors.textMuted }]}>{bundle.description}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={st.bundlePrice}>₹{bundle.totalPrice.toLocaleString()}</Text>
            <Text style={[st.bundleItemsCount, { color: colors.textMuted }]}>{bundle.items.length} items</Text>
          </View>
        </View>

        {expanded ? (
          <Animated.View entering={FadeIn.duration(250)} style={st.bundleItems}>
            <View style={[st.bundleDivider, { backgroundColor: colors.border }]} />
            {bundle.items.map((item, i) => (
              <View key={i} style={st.bundleItemRow}>
                <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[st.bundleItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[st.bundleItemQty, { color: colors.textMuted }]}>{item.qty}</Text>
                </View>
                <Text style={[st.bundleItemPrice, { color: colors.textSecondary }]}>₹{item.price}</Text>
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [st.orderBundleBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onOrder(bundle); }}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={st.orderBundleBtnGrad}>
                <MaterialIcons name="shopping-cart" size={18} color="#FFF" />
                <Text style={st.orderBundleBtnText}>Order This Bundle</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={st.bundleExpandHint}>
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PartnerAppCard({ partner, index, colors, isDark }: {
  partner: PartnerApp; index: number; colors: any; isDark: boolean;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (partner.url) {
      Linking.openURL(partner.url).catch(() => {});
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          st.partnerCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        onPress={handlePress}
      >
        <View style={[st.partnerLogo, { backgroundColor: `${partner.color}15` }]}>
          <Text style={{ fontSize: 24 }}>{partner.id === 'zepto' ? '⚡' : partner.id === 'blinkit' ? '🟡' : partner.id === 'bigbasket' ? '🟢' : '🏪'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.partnerName, { color: colors.textPrimary }]}>{partner.name}</Text>
          <Text style={[st.partnerTagline, { color: colors.textMuted }]}>{partner.tagline}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[st.deliveryBadge, { backgroundColor: `${partner.color}15` }]}>
            <MaterialIcons name="schedule" size={12} color={partner.color} />
            <Text style={[st.deliveryTime, { color: partner.color }]}>{partner.deliveryTime}</Text>
          </View>
          <MaterialIcons name="open-in-new" size={16} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Order Sheet Modal ──
function OrderSheet({ bundle, visible, onClose, colors, isDark }: {
  bundle: SmartBundle | null; visible: boolean; onClose: () => void; colors: any; isDark: boolean;
}) {
  if (!visible || !bundle) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={st.orderSheetOverlay}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <Animated.View entering={FadeInDown.duration(350)} style={[st.orderSheet, { backgroundColor: colors.surface }]}>
        <View style={st.orderSheetHandle} />
        <Text style={[st.orderSheetTitle, { color: colors.textPrimary }]}>
          Order {bundle.emoji} {bundle.name}
        </Text>
        <Text style={[st.orderSheetSub, { color: colors.textMuted }]}>
          Choose where to order from
        </Text>
        <View style={st.orderSheetApps}>
          {PARTNER_APPS.map((app, i) => (
            <Pressable
              key={app.id}
              style={({ pressed }) => [
                st.orderSheetAppBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (app.url) Linking.openURL(app.url).catch(() => {});
                onClose();
              }}
            >
              <Text style={{ fontSize: 22 }}>{app.id === 'zepto' ? '⚡' : app.id === 'blinkit' ? '🟡' : app.id === 'bigbasket' ? '🟢' : '🏪'}</Text>
              <Text style={[st.orderSheetAppName, { color: colors.textPrimary }]}>{app.name}</Text>
              <Text style={[st.orderSheetAppTime, { color: colors.textMuted }]}>{app.deliveryTime}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [st.orderSheetClose, pressed && { opacity: 0.8 }]}
          onPress={onClose}
        >
          <Text style={[st.orderSheetCloseText, { color: colors.textMuted }]}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [customBudget, setCustomBudget] = useState('');
  const [orderBundle, setOrderBundle] = useState<SmartBundle | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);

  const activeBudget = selectedPlan === 'custom'
    ? parseInt(customBudget) || 0
    : BUDGET_PLANS.find(p => p.id === selectedPlan)?.budget || 10000;

  const filteredBundles = SMART_BUNDLES.filter(b => b.totalPrice <= activeBudget);

  const handleOrderBundle = useCallback((bundle: SmartBundle) => {
    setOrderBundle(bundle);
    setShowOrderSheet(true);
  }, []);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* ═══ Header ═══ */}
          <LinearGradient
            colors={isDark ? ['#14141C', '#1A1510', '#14141C'] : ['#FDF8F0', '#FFF8E1', '#FDF8F0']}
            style={st.header}
          >
            <Animated.View entering={FadeIn.duration(400)} style={st.headerContent}>
              <View style={st.headerRow}>
                <View>
                  <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Smart Grocery</Text>
                  <Text style={[st.headerSub, { color: colors.textMuted }]}>Bundle & save on monthly essentials</Text>
                </View>
                <View style={[st.headerIcon, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.08)' }]}>
                  <Text style={{ fontSize: 28 }}>🛒</Text>
                </View>
              </View>

              {/* Budget Stat */}
              <View style={[st.budgetStat, {
                backgroundColor: isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.06)',
                borderColor: 'rgba(212,175,55,0.18)',
              }]}>
                <MaterialIcons name="account-balance-wallet" size={20} color="#D4AF37" />
                <View>
                  <Text style={[st.budgetStatLabel, { color: colors.textMuted }]}>Selected Budget</Text>
                  <Text style={st.budgetStatValue}>₹{activeBudget.toLocaleString()}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Text style={[st.budgetStatInfo, { color: colors.textMuted }]}>
                  {filteredBundles.length} bundles available
                </Text>
              </View>
            </Animated.View>
          </LinearGradient>

          {/* ═══ Budget Plans ═══ */}
          <View style={st.section}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>
              💰 Choose Your Budget
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.budgetScroll}>
              {BUDGET_PLANS.map(plan => (
                <BudgetCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan === plan.id}
                  onSelect={() => setSelectedPlan(plan.id)}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
              {/* Custom Budget */}
              <Pressable
                style={[
                  st.budgetCard,
                  {
                    backgroundColor: selectedPlan === 'custom'
                      ? isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.06)'
                      : colors.surface,
                    borderColor: selectedPlan === 'custom' ? '#FF6B6B' : colors.border,
                    borderWidth: selectedPlan === 'custom' ? 2 : 1,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedPlan('custom'); }}
              >
                <Text style={{ fontSize: 28 }}>✏️</Text>
                <Text style={[st.budgetCardTitle, { color: colors.textPrimary }]}>Custom</Text>
                <Text style={[st.budgetCardSub, { color: colors.textMuted }]}>Set your own</Text>
                {selectedPlan === 'custom' ? (
                  <TextInput
                    style={[st.customInput, {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    }]}
                    placeholder="₹ Amount"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={customBudget}
                    onChangeText={setCustomBudget}
                    autoFocus
                  />
                ) : null}
              </Pressable>
            </ScrollView>
          </View>

          {/* ═══ Category Quick Picks ═══ */}
          <View style={st.section}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>
              📂 Categories
            </Text>
            <View style={st.categoryGrid}>
              {CATEGORIES.map((cat, i) => (
                <Animated.View key={cat.id} entering={FadeInDown.delay(i * 50).duration(250)}>
                  <Pressable
                    style={({ pressed }) => [
                      st.categoryChip,
                      { backgroundColor: `${cat.color}12`, borderColor: `${cat.color}25` },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                    ]}
                    onPress={() => Haptics.selectionAsync()}
                  >
                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                    <Text style={[st.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* ═══ Smart Bundles ═══ */}
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>
                📦 Smart Bundles
              </Text>
              <Text style={[st.sectionHint, { color: colors.textMuted }]}>
                Tap to expand
              </Text>
            </View>
            {filteredBundles.length > 0 ? (
              <View style={st.bundleList}>
                {filteredBundles.map((bundle, i) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    index={i}
                    onOrder={handleOrderBundle}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
            ) : (
              <View style={[st.emptyBundles, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>😅</Text>
                <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No bundles fit this budget</Text>
                <Text style={[st.emptySub, { color: colors.textMuted }]}>Try increasing your budget to see available packs</Text>
              </View>
            )}
          </View>

          {/* ═══ Order From ═══ */}
          <View style={st.section}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>
              🚀 Order From
            </Text>
            <Text style={[st.sectionSub, { color: colors.textMuted }]}>
              Choose your preferred delivery partner
            </Text>
            <View style={st.partnerList}>
              {PARTNER_APPS.map((app, i) => (
                <PartnerAppCard key={app.id} partner={app} index={i} colors={colors} isDark={isDark} />
              ))}
            </View>
          </View>

          {/* ═══ Tips Section ═══ */}
          <View style={st.section}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>
              💡 Saving Tips
            </Text>
            <View style={st.tipsGrid}>
              {[
                { emoji: '📅', title: 'Buy weekly veggies', desc: 'Fresh vegetables save money vs monthly bulk' },
                { emoji: '🏪', title: 'Support Kirana', desc: 'Local stores often have better prices on staples' },
                { emoji: '📋', title: 'Plan meals first', desc: 'Meal planning reduces food waste by 25%' },
                { emoji: '🔄', title: 'Compare prices', desc: 'Check 2-3 apps before ordering' },
              ].map((tip, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(100 + i * 60).duration(300)} style={[
                  st.tipCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                  <Text style={{ fontSize: 22 }}>{tip.emoji}</Text>
                  <Text style={[st.tipTitle, { color: colors.textPrimary }]}>{tip.title}</Text>
                  <Text style={[st.tipDesc, { color: colors.textMuted }]}>{tip.desc}</Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Order Sheet */}
      <OrderSheet
        bundle={orderBundle}
        visible={showOrderSheet}
        onClose={() => setShowOrderSheet(false)}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  headerContent: { gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  headerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  budgetStat: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  budgetStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  budgetStatValue: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  budgetStatInfo: { fontSize: 11, fontWeight: '600' },

  // Sections
  section: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sectionSub: { fontSize: 13, fontWeight: '500', marginTop: -4 },
  sectionHint: { fontSize: 11, fontWeight: '600' },

  // Budget Cards
  budgetScroll: { paddingRight: 20, gap: 12 },
  budgetCard: {
    width: 140, padding: 16, borderRadius: 18,
    alignItems: 'center', gap: 6, borderWidth: 1, position: 'relative',
  },
  budgetCardTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  budgetCardSub: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  budgetPriceTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 4 },
  budgetPriceText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  budgetItemCount: { fontSize: 10, fontWeight: '600' },
  budgetCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  customInput: {
    width: '100%', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, fontSize: 16, fontWeight: '800',
    textAlign: 'center', marginTop: 4,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
  },
  categoryName: { fontSize: 13, fontWeight: '700' },

  // Bundles
  bundleList: { gap: 12 },
  bundleCard: {
    padding: 16, borderRadius: 20, borderWidth: 1,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  bundleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bundleEmoji: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  bundleName: { fontSize: 16, fontWeight: '800' },
  bundleDesc: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  bundlePrice: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  bundleItemsCount: { fontSize: 10, fontWeight: '600' },
  bundleExpandHint: { alignItems: 'center', marginTop: 4 },
  bundleItems: { gap: 8, marginTop: 8 },
  bundleDivider: { height: 1, marginBottom: 4 },
  bundleItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  bundleItemName: { fontSize: 14, fontWeight: '600' },
  bundleItemQty: { fontSize: 11, fontWeight: '500' },
  bundleItemPrice: { fontSize: 14, fontWeight: '800' },
  orderBundleBtn: { marginTop: 8 },
  orderBundleBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  orderBundleBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  // Partners
  partnerList: { gap: 10 },
  partnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  partnerLogo: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  partnerName: { fontSize: 15, fontWeight: '800' },
  partnerTagline: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  deliveryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  deliveryTime: { fontSize: 11, fontWeight: '700' },

  // Tips
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tipCard: {
    width: (SCREEN_W - 50) / 2, padding: 14, borderRadius: 16, borderWidth: 1, gap: 6,
  },
  tipTitle: { fontSize: 13, fontWeight: '700' },
  tipDesc: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

  // Empty
  emptyBundles: {
    padding: 32, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  // Order Sheet
  orderSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  orderSheet: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    gap: 16,
  },
  orderSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.30)',
    alignSelf: 'center',
  },
  orderSheetTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  orderSheetSub: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: -8 },
  orderSheetApps: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  orderSheetAppBtn: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16, borderWidth: 1,
  },
  orderSheetAppName: { fontSize: 12, fontWeight: '700' },
  orderSheetAppTime: { fontSize: 10, fontWeight: '500' },
  orderSheetClose: { paddingVertical: 12, alignItems: 'center' },
  orderSheetCloseText: { fontSize: 14, fontWeight: '600' },
});
