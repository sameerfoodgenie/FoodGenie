import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Types ──
interface GroceryItem {
  name: string;
  qty: string;
  price: number;
  emoji: string;
  category: string;
  checked: boolean;
}

interface GroceryCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  items: GroceryItem[];
}

interface DeliveryPartner {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tagline: string;
  deliveryTime: string;
  discount?: string;
  url: string;
  deepLink: string;
}

const DELIVERY_PARTNERS: DeliveryPartner[] = [
  {
    id: 'zepto',
    name: 'Zepto',
    emoji: '⚡',
    color: '#7B2D8E',
    tagline: 'Fastest 10-min delivery',
    deliveryTime: '10 min',
    discount: 'Up to 15% off',
    url: 'https://www.zeptonow.com',
    deepLink: 'zepto://',
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    emoji: '🟡',
    color: '#F8CB2E',
    tagline: 'Everything in minutes',
    deliveryTime: '10-15 min',
    discount: 'Free delivery above ₹499',
    url: 'https://blinkit.com',
    deepLink: 'blinkit://',
  },
  {
    id: 'bigbasket',
    name: 'BigBasket',
    emoji: '🟢',
    color: '#84C225',
    tagline: 'Fresh & quality guaranteed',
    deliveryTime: '2-4 hrs',
    discount: 'Save 10% on first order',
    url: 'https://www.bigbasket.com',
    deepLink: 'bigbasket://',
  },
  {
    id: 'kirana',
    name: 'Local Kirana',
    emoji: '🏪',
    color: '#FF8C42',
    tagline: 'Support your neighborhood',
    deliveryTime: '30-60 min',
    url: '',
    deepLink: '',
  },
];

// ── Generate grocery from meal plan data ──
function generateGroceryFromMeals(planDataStr: string): GroceryCategory[] {
  // Parse meal plan data passed as params
  let meals: any[] = [];
  try {
    const parsed = JSON.parse(planDataStr);
    if (parsed.meals) meals = parsed.meals;
    else if (parsed.days) {
      parsed.days.forEach((d: any) => { if (d.meals) meals.push(...d.meals); });
    }
  } catch { /* use defaults */ }

  // Collect all ingredients
  const ingredientMap = new Map<string, { qty: string; category: string; emoji: string }>();

  meals.forEach((meal: any) => {
    (meal.ingredients || []).forEach((ing: string) => {
      const lower = ing.toLowerCase();
      if (!ingredientMap.has(lower)) {
        const cat = categorizeIngredient(lower);
        ingredientMap.set(lower, { qty: '1 pack', category: cat.category, emoji: cat.emoji });
      }
    });
  });

  // If no ingredients from meals, generate default grocery
  if (ingredientMap.size === 0) {
    return getDefaultGrocery();
  }

  // Group by category
  const categoryMap = new Map<string, GroceryItem[]>();
  ingredientMap.forEach((info, name) => {
    const items = categoryMap.get(info.category) || [];
    items.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      qty: info.qty,
      price: estimatePrice(name),
      emoji: info.emoji,
      category: info.category,
      checked: false,
    });
    categoryMap.set(info.category, items);
  });

  const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
    'Vegetables': { emoji: '🥬', color: '#4ADE80' },
    'Fruits': { emoji: '🍎', color: '#FF6B6B' },
    'Dairy': { emoji: '🥛', color: '#60A5FA' },
    'Grains & Staples': { emoji: '🌾', color: '#D4AF37' },
    'Spices & Seasonings': { emoji: '🌶️', color: '#F97316' },
    'Oils & Fats': { emoji: '🫗', color: '#A78BFA' },
    'Protein': { emoji: '🥩', color: '#EF4444' },
    'Others': { emoji: '📦', color: '#6B7280' },
  };

  return Array.from(categoryMap.entries()).map(([catName, items]) => ({
    id: catName.toLowerCase().replace(/\s/g, '-'),
    name: catName,
    emoji: CATEGORY_META[catName]?.emoji || '📦',
    color: CATEGORY_META[catName]?.color || '#6B7280',
    items,
  }));
}

function categorizeIngredient(name: string): { category: string; emoji: string } {
  const vegs = ['onion', 'tomato', 'potato', 'garlic', 'ginger', 'carrot', 'capsicum', 'peas', 'beans', 'cauliflower', 'cabbage', 'brinjal', 'okra', 'spinach', 'coriander', 'mint', 'cucumber', 'bottle gourd', 'radish', 'beetroot', 'palak', 'methi', 'lady finger'];
  const fruits = ['banana', 'apple', 'mango', 'orange', 'lemon', 'lime', 'papaya', 'pomegranate', 'grapes', 'watermelon'];
  const dairy = ['milk', 'curd', 'yogurt', 'paneer', 'butter', 'ghee', 'cheese', 'cream'];
  const grains = ['rice', 'wheat', 'atta', 'flour', 'dal', 'lentil', 'chana', 'rajma', 'oats', 'poha', 'semolina', 'sooji', 'bread', 'roti', 'moong', 'masoor', 'toor', 'urad', 'besan'];
  const spices = ['turmeric', 'cumin', 'coriander powder', 'chilli', 'pepper', 'garam masala', 'salt', 'mustard seed', 'fenugreek', 'bay leaf', 'cinnamon', 'clove', 'cardamom', 'asafoetida', 'hing'];
  const oils = ['oil', 'sunflower', 'mustard oil', 'olive oil', 'coconut oil', 'sesame'];
  const protein = ['chicken', 'egg', 'fish', 'mutton', 'prawn', 'soya', 'tofu', 'nuts', 'almond', 'cashew', 'peanut'];

  if (vegs.some(v => name.includes(v))) return { category: 'Vegetables', emoji: '🥬' };
  if (fruits.some(v => name.includes(v))) return { category: 'Fruits', emoji: '🍎' };
  if (dairy.some(v => name.includes(v))) return { category: 'Dairy', emoji: '🥛' };
  if (grains.some(v => name.includes(v))) return { category: 'Grains & Staples', emoji: '🌾' };
  if (spices.some(v => name.includes(v))) return { category: 'Spices & Seasonings', emoji: '🌶️' };
  if (oils.some(v => name.includes(v))) return { category: 'Oils & Fats', emoji: '🫗' };
  if (protein.some(v => name.includes(v))) return { category: 'Protein', emoji: '🥩' };
  return { category: 'Others', emoji: '📦' };
}

function estimatePrice(name: string): number {
  const priceMap: Record<string, number> = {
    rice: 280, wheat: 220, atta: 220, flour: 200, oil: 180, milk: 60, curd: 40, paneer: 80,
    butter: 55, ghee: 250, chicken: 200, egg: 90, fish: 250, mutton: 400, dal: 140,
    onion: 40, tomato: 30, potato: 30, sugar: 45, salt: 25, turmeric: 20, cumin: 30,
  };
  for (const [key, price] of Object.entries(priceMap)) {
    if (name.includes(key)) return price;
  }
  return Math.floor(30 + Math.random() * 70);
}

function getDefaultGrocery(): GroceryCategory[] {
  return [
    {
      id: 'vegs', name: 'Vegetables', emoji: '🥬', color: '#4ADE80',
      items: [
        { name: 'Onions', qty: '2 kg', price: 60, emoji: '🧅', category: 'Vegetables', checked: false },
        { name: 'Tomatoes', qty: '1 kg', price: 40, emoji: '🍅', category: 'Vegetables', checked: false },
        { name: 'Potatoes', qty: '2 kg', price: 50, emoji: '🥔', category: 'Vegetables', checked: false },
        { name: 'Green Chillies', qty: '100 g', price: 15, emoji: '🌶️', category: 'Vegetables', checked: false },
        { name: 'Coriander Leaves', qty: '1 bunch', price: 10, emoji: '🌿', category: 'Vegetables', checked: false },
        { name: 'Spinach', qty: '500 g', price: 25, emoji: '🥬', category: 'Vegetables', checked: false },
      ],
    },
    {
      id: 'grains', name: 'Grains & Staples', emoji: '🌾', color: '#D4AF37',
      items: [
        { name: 'Basmati Rice', qty: '5 kg', price: 450, emoji: '🍚', category: 'Grains & Staples', checked: false },
        { name: 'Atta (Wheat Flour)', qty: '5 kg', price: 220, emoji: '🌾', category: 'Grains & Staples', checked: false },
        { name: 'Toor Dal', qty: '1 kg', price: 140, emoji: '🫘', category: 'Grains & Staples', checked: false },
        { name: 'Moong Dal', qty: '500 g', price: 80, emoji: '🫘', category: 'Grains & Staples', checked: false },
      ],
    },
    {
      id: 'dairy', name: 'Dairy', emoji: '🥛', color: '#60A5FA',
      items: [
        { name: 'Milk (Toned)', qty: '7 L', price: 350, emoji: '🥛', category: 'Dairy', checked: false },
        { name: 'Curd', qty: '1 kg', price: 40, emoji: '🥣', category: 'Dairy', checked: false },
        { name: 'Paneer', qty: '500 g', price: 80, emoji: '🧀', category: 'Dairy', checked: false },
      ],
    },
    {
      id: 'spices', name: 'Spices & Seasonings', emoji: '🌶️', color: '#F97316',
      items: [
        { name: 'Turmeric Powder', qty: '200 g', price: 40, emoji: '🟡', category: 'Spices & Seasonings', checked: false },
        { name: 'Cumin Seeds', qty: '100 g', price: 30, emoji: '🟤', category: 'Spices & Seasonings', checked: false },
        { name: 'Garam Masala', qty: '100 g', price: 45, emoji: '🌶️', category: 'Spices & Seasonings', checked: false },
        { name: 'Red Chilli Powder', qty: '200 g', price: 50, emoji: '🔴', category: 'Spices & Seasonings', checked: false },
      ],
    },
    {
      id: 'oils', name: 'Oils & Fats', emoji: '🫗', color: '#A78BFA',
      items: [
        { name: 'Sunflower Oil', qty: '2 L', price: 280, emoji: '🫗', category: 'Oils & Fats', checked: false },
        { name: 'Ghee', qty: '500 ml', price: 250, emoji: '🧈', category: 'Oils & Fats', checked: false },
      ],
    },
  ];
}

// ── Main Screen ──
export default function GroceryCartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ planData?: string; planType?: string }>();

  const [categories, setCategories] = useState<GroceryCategory[]>(() =>
    generateGroceryFromMeals(params.planData || '{}')
  );
  const [showPartners, setShowPartners] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const totalItems = useMemo(() => categories.reduce((s, c) => s + c.items.length, 0), [categories]);
  const totalCost = useMemo(() => categories.reduce((s, c) => s + c.items.reduce((si, item) => si + item.price, 0), 0), [categories]);
  const checkedCount = useMemo(() => categories.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0), [categories]);
  const estimatedSavings = useMemo(() => Math.round(totalCost * 0.15), [totalCost]);
  const marketPrice = totalCost + estimatedSavings;

  const toggleItem = useCallback((catId: string, itemIdx: number) => {
    Haptics.selectionAsync();
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c;
      return { ...c, items: c.items.map((item, i) => i === itemIdx ? { ...item, checked: !item.checked } : item) };
    }));
  }, []);

  const handlePartnerSelect = useCallback((partner: DeliveryPartner) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedPartner(partner.id);
    // Future: Route order directly to partner
    if (partner.url) {
      setTimeout(() => {
        Linking.openURL(partner.url).catch(() => {});
      }, 300);
    }
  }, []);

  const handleShareList = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lines = ['🛒 My Grocery List (FoodGenie)\n'];
    categories.forEach(cat => {
      lines.push(`\n${cat.emoji} ${cat.name}`);
      cat.items.forEach(item => {
        lines.push(`  ${item.checked ? '✅' : '⬜'} ${item.name} — ${item.qty} (₹${item.price})`);
      });
    });
    lines.push(`\n💰 Total: ₹${totalCost} | Savings: ₹${estimatedSavings}`);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch { /* ignore */ }
  }, [categories, totalCost, estimatedSavings]);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={['#1E1456', '#7B2FA0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={st.header}
        >
          <View style={st.headerRow}>
            <Pressable style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Ready Grocery Cart 🛒</Text>
              <Text style={st.headerSub}>
                {totalItems} items from your {params.planType || 'today'} meal plan
              </Text>
            </View>
            <Pressable style={({ pressed }) => [st.shareBtn, pressed && { opacity: 0.7 }]} onPress={handleShareList}>
              <MaterialIcons name="share" size={20} color="#FFF" />
            </Pressable>
          </View>

          {/* Cost Summary */}
          <Animated.View entering={FadeIn.duration(500)} style={st.costSummary}>
            <View style={st.costItem}>
              <Text style={st.costLabel}>Market Price</Text>
              <Text style={st.costStrikethrough}>₹{marketPrice.toLocaleString()}</Text>
            </View>
            <View style={st.costItem}>
              <Text style={st.costLabel}>Your Cost</Text>
              <Text style={st.costValue}>₹{totalCost.toLocaleString()}</Text>
            </View>
            <View style={st.costItem}>
              <Text style={st.costLabel}>You Save</Text>
              <View style={st.savingsBadge}>
                <MaterialIcons name="local-offer" size={12} color="#FFF" />
                <Text style={st.savingsValue}>₹{estimatedSavings}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Progress */}
          <View style={st.progressRow}>
            <View style={st.progressBar}>
              <View style={[st.progressFill, { width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }]} />
            </View>
            <Text style={st.progressText}>{checkedCount}/{totalItems} checked</Text>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
        >
          {/* Grocery Categories */}
          {categories.map((cat, ci) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(100 + ci * 60).duration(350)} style={st.categorySection}>
              <View style={st.categoryHeader}>
                <View style={[st.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                </View>
                <Text style={[st.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                <View style={[st.categoryCount, { backgroundColor: `${cat.color}15` }]}>
                  <Text style={[st.categoryCountText, { color: cat.color }]}>{cat.items.length}</Text>
                </View>
                <Text style={[st.categoryTotal, { color: colors.textMuted }]}>
                  ₹{cat.items.reduce((s, i) => s + i.price, 0)}
                </Text>
              </View>

              {cat.items.map((item, ii) => (
                <Pressable
                  key={ii}
                  style={({ pressed }) => [
                    st.groceryItem,
                    {
                      backgroundColor: item.checked
                        ? isDark ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.04)'
                        : colors.surface,
                      borderColor: item.checked ? 'rgba(74,222,128,0.20)' : colors.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => toggleItem(cat.id, ii)}
                >
                  <View style={[st.checkbox, item.checked && { backgroundColor: '#4ADE80', borderColor: '#4ADE80' }, !item.checked && { borderColor: colors.border }]}>
                    {item.checked ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
                  </View>
                  <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.itemName, { color: colors.textPrimary }, item.checked && { textDecorationLine: 'line-through', opacity: 0.5 }]}>{item.name}</Text>
                    <Text style={[st.itemQty, { color: colors.textMuted }]}>{item.qty}</Text>
                  </View>
                  <Text style={[st.itemPrice, { color: item.checked ? colors.textMuted : '#F5B731' }]}>₹{item.price}</Text>
                </Pressable>
              ))}
            </Animated.View>
          ))}

          {/* Delivery Partners Section */}
          <View style={st.partnersSection}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>🚀 Choose Delivery Partner</Text>
            <Text style={[st.sectionSub, { color: colors.textMuted }]}>Order directly from your preferred app</Text>

            <View style={st.partnerGrid}>
              {DELIVERY_PARTNERS.map((partner, i) => {
                const isSelected = selectedPartner === partner.id;
                return (
                  <Animated.View key={partner.id} entering={FadeInUp.delay(100 + i * 80).duration(350)}>
                    <Pressable
                      style={({ pressed }) => [
                        st.partnerCard,
                        {
                          backgroundColor: isSelected
                            ? isDark ? `${partner.color}18` : `${partner.color}08`
                            : colors.surface,
                          borderColor: isSelected ? partner.color : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                      ]}
                      onPress={() => handlePartnerSelect(partner)}
                    >
                      <View style={[st.partnerIcon, { backgroundColor: `${partner.color}15` }]}>
                        <Text style={{ fontSize: 28 }}>{partner.emoji}</Text>
                      </View>
                      <Text style={[st.partnerName, { color: colors.textPrimary }]}>{partner.name}</Text>
                      <Text style={[st.partnerTagline, { color: colors.textMuted }]}>{partner.tagline}</Text>
                      <View style={[st.partnerTime, { backgroundColor: `${partner.color}12` }]}>
                        <MaterialIcons name="schedule" size={11} color={partner.color} />
                        <Text style={[st.partnerTimeText, { color: partner.color }]}>{partner.deliveryTime}</Text>
                      </View>
                      {partner.discount ? (
                        <View style={[st.partnerDiscount, { backgroundColor: partner.color }]}>
                          <Text style={st.partnerDiscountText}>{partner.discount}</Text>
                        </View>
                      ) : null}
                      {isSelected ? (
                        <View style={[st.partnerCheck, { backgroundColor: partner.color }]}>
                          <MaterialIcons name="check" size={12} color="#FFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Future-ready note */}
            <View style={[st.futureNote, { backgroundColor: isDark ? 'rgba(245,183,49,0.06)' : 'rgba(245,183,49,0.04)', borderColor: 'rgba(245,183,49,0.20)' }]}>
              <MaterialIcons name="rocket-launch" size={16} color="#F5B731" />
              <Text style={[st.futureNoteText, { color: colors.textSecondary }]}>
                Coming soon: One-tap ordering directly routes your cart to the selected partner app
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[st.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={st.bottomLeft}>
            <Text style={[st.bottomLabel, { color: colors.textMuted }]}>Total</Text>
            <Text style={st.bottomPrice}>₹{totalCost.toLocaleString()}</Text>
            <Text style={[st.bottomSave, { color: '#4ADE80' }]}>Save ₹{estimatedSavings}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              if (selectedPartner) {
                const partner = DELIVERY_PARTNERS.find(p => p.id === selectedPartner);
                if (partner?.url) Linking.openURL(partner.url).catch(() => {});
              } else {
                setShowPartners(true);
              }
            }}
          >
            <LinearGradient colors={['#F5B731', '#D9A020']} style={st.bottomCta}>
              <MaterialIcons name="shopping-cart-checkout" size={20} color="#FFF" />
              <Text style={st.bottomCtaText}>
                {selectedPartner ? `Order on ${DELIVERY_PARTNERS.find(p => p.id === selectedPartner)?.name}` : 'Select Partner & Order'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  shareBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },

  // Cost Summary
  costSummary: { flexDirection: 'row', justifyContent: 'space-between' },
  costItem: { alignItems: 'center', gap: 4 },
  costLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.70)', textTransform: 'uppercase', letterSpacing: 0.5 },
  costStrikethrough: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textDecorationLine: 'line-through' },
  costValue: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  savingsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  savingsValue: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.20)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#FFF' },
  progressText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },

  // Category
  categorySection: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  categoryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 16, fontWeight: '800', flex: 1 },
  categoryCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryCountText: { fontSize: 11, fontWeight: '800' },
  categoryTotal: { fontSize: 13, fontWeight: '700' },

  // Grocery Item
  groceryItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, marginBottom: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemQty: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  itemPrice: { fontSize: 14, fontWeight: '800' },

  // Partners
  partnersSection: { paddingHorizontal: 20, paddingTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sectionSub: { fontSize: 13, fontWeight: '500', marginTop: -6 },
  partnerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  partnerCard: {
    width: (SCREEN_W - 50) / 2, padding: 16, borderRadius: 18,
    alignItems: 'center', gap: 6, position: 'relative',
  },
  partnerIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  partnerName: { fontSize: 15, fontWeight: '800' },
  partnerTagline: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  partnerTime: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  partnerTimeText: { fontSize: 10, fontWeight: '700' },
  partnerDiscount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  partnerDiscountText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  partnerCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Future Note
  futureNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  futureNoteText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  bottomLeft: { gap: 1 },
  bottomLabel: { fontSize: 10, fontWeight: '600' },
  bottomPrice: { fontSize: 22, fontWeight: '900', color: '#F5B731' },
  bottomSave: { fontSize: 11, fontWeight: '700', color: '#F5B731' },
  bottomCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  bottomCtaText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
