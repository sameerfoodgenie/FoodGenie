import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Linking,
  Share,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useTheme } from '../hooks/useTheme';
import { fetchPriceComparisons, PriceComparison, PriceEntry, PROVIDER_META, GroceryItemInput, getMatchScoreColor, getMatchScoreLabel } from '../services/priceComparisonService';
import { calculateSmartSplit, calculateMealCost, estimateMealCosts } from '../services/smartSplitService';

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
  collapsed: boolean;
}

interface ItemPriceData {
  loading: boolean;
  comparison: PriceComparison | null;
  expanded: boolean;
}

// ── AI Recommendation Tags ──
const AI_TAGS: Record<string, { label: string; color: string; icon: string }> = {
  'best_price': { label: 'Best Price', color: '#4ADE80', icon: 'local-offer' },
  'fastest': { label: 'Fastest', color: '#7B2D8E', icon: 'bolt' },
  'best_match': { label: 'Best Match', color: '#F5B731', icon: 'auto-awesome' },
  'fresh': { label: 'Fresh Pick', color: '#84C225', icon: 'eco' },
  'budget': { label: 'Budget Friendly', color: '#60A5FA', icon: 'savings' },
  'popular': { label: 'Most Popular', color: '#F97316', icon: 'trending-up' },
};

function getItemTags(entry: PriceEntry, isBest: boolean, isFastest: boolean): string[] {
  const tags: string[] = [];
  if (isBest) tags.push('best_price');
  if (isFastest) tags.push('fastest');
  if ((entry.match_score || 0) >= 85) tags.push('best_match');
  if (entry.provider_name === 'Local Kirana') tags.push('fresh');
  if ((entry.discount_price || entry.price || 999) < 50) tags.push('budget');
  return tags.slice(0, 2);
}

// ── Product Match Card ──
function ProductMatchCard({ entry, colors, isDark, isFirst, tags }: {
  entry: PriceEntry;
  colors: any;
  isDark: boolean;
  isFirst: boolean;
  tags: string[];
}) {
  const meta = PROVIDER_META[entry.provider_name] || { emoji: '📦', color: '#6B7280', tagline: '' };
  const scoreColor = getMatchScoreColor(entry.match_score || 0);

  return (
    <View style={[
      pm.card,
      {
        backgroundColor: isFirst ? (isDark ? 'rgba(74,222,128,0.04)' : 'rgba(74,222,128,0.02)') : colors.surface,
        borderColor: isFirst ? 'rgba(74,222,128,0.20)' : colors.border,
      },
    ]}>
      <View style={pm.cardTop}>
        <View style={[pm.providerBadge, { backgroundColor: `${meta.color}12` }]}>
          <Text style={{ fontSize: 13 }}>{meta.emoji}</Text>
          <Text style={[pm.providerText, { color: meta.color }]}>{entry.provider_name}</Text>
        </View>
        {/* Tags */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {tags.map(tag => {
            const t = AI_TAGS[tag];
            if (!t) return null;
            return (
              <View key={tag} style={[pm.tagBadge, { backgroundColor: `${t.color}12` }]}>
                <MaterialIcons name={t.icon as any} size={8} color={t.color} />
                <Text style={[pm.tagText, { color: t.color }]}>{t.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={[pm.productTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {entry.product_title || entry.query_name}
      </Text>
      {entry.brand_name ? (
        <View style={pm.brandRow}>
          <MaterialIcons name="verified" size={9} color="#7B2FA0" />
          <Text style={[pm.brandText, { color: colors.textMuted }]}>{entry.brand_name}</Text>
        </View>
      ) : null}

      {/* Quantity info */}
      <View style={pm.qtySection}>
        {entry.recipe_qty ? (
          <View style={[pm.qtyBadge, { backgroundColor: isDark ? 'rgba(123,47,160,0.06)' : 'rgba(123,47,160,0.03)' }]}>
            <Text style={[pm.qtyLabel, { color: colors.textMuted }]}>Need</Text>
            <Text style={[pm.qtyValue, { color: '#7B2FA0' }]}>{entry.recipe_qty}</Text>
          </View>
        ) : null}
        {entry.recommended_buy_qty ? (
          <View style={[pm.qtyBadge, { backgroundColor: isDark ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.03)' }]}>
            <Text style={[pm.qtyLabel, { color: colors.textMuted }]}>Buy</Text>
            <Text style={[pm.qtyValue, { color: '#4ADE80' }]}>{entry.recommended_buy_qty}</Text>
          </View>
        ) : null}
        {entry.leftover && entry.leftover !== '0' ? (
          <View style={[pm.qtyBadge, { backgroundColor: isDark ? 'rgba(245,183,49,0.06)' : 'rgba(245,183,49,0.03)' }]}>
            <Text style={[pm.qtyLabel, { color: colors.textMuted }]}>Left</Text>
            <Text style={[pm.qtyValue, { color: '#D9A020' }]}>{entry.leftover}</Text>
          </View>
        ) : null}
      </View>

      {/* Price */}
      <View style={pm.bottomRow}>
        <View style={pm.priceSection}>
          {entry.mrp && entry.mrp > (entry.discount_price || entry.price || 0) ? (
            <Text style={[pm.mrp, { color: colors.textMuted }]}>₹{entry.mrp}</Text>
          ) : null}
          <Text style={[pm.price, { color: entry.availability ? (isFirst ? '#4ADE80' : colors.textPrimary) : colors.textMuted }]}>
            ₹{entry.discount_price || entry.price || '—'}
          </Text>
        </View>
        {entry.delivery_time ? (
          <View style={pm.deliveryBadge}>
            <MaterialIcons name="schedule" size={9} color={meta.color} />
            <Text style={[pm.deliveryText, { color: colors.textMuted }]}>{entry.delivery_time}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ── Price Comparison Card ──
function PriceComparisonCard({ itemName, priceData, colors, isDark, onToggle }: {
  itemName: string;
  priceData: ItemPriceData;
  colors: any;
  isDark: boolean;
  onToggle: () => void;
}) {
  if (priceData.loading) {
    return (
      <View style={pc.loadingRow}>
        <ActivityIndicator size="small" color="#7B2FA0" />
        <Text style={[pc.loadingText, { color: colors.textMuted }]}>Matching...</Text>
      </View>
    );
  }

  const comparison = priceData.comparison;
  if (!comparison || comparison.prices.length === 0) return null;

  const bestPrice = comparison.bestPrice;
  const fastestDelivery = comparison.fastestDelivery;
  const topMatch = comparison.prices[0];

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <Pressable onPress={onToggle} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <View style={[pc.summaryRow, { backgroundColor: isDark ? 'rgba(123,47,160,0.05)' : 'rgba(123,47,160,0.02)', borderColor: 'rgba(123,47,160,0.12)' }]}>
          <View style={pc.summaryLeft}>
            {bestPrice ? (
              <View style={pc.bestPriceBadge}>
                <MaterialIcons name="local-offer" size={9} color="#4ADE80" />
                <Text style={pc.bestPriceText}>₹{bestPrice.discount_price || bestPrice.price}</Text>
                <Text style={[pc.bestPriceProvider, { color: colors.textMuted }]}>{bestPrice.provider_name}</Text>
              </View>
            ) : null}
            {topMatch?.brand_name ? (
              <View style={pc.fastBadge}>
                <MaterialIcons name="verified" size={8} color="#7B2FA0" />
                <Text style={[pc.fastText, { color: '#7B2FA0' }]}>{topMatch.brand_name}</Text>
              </View>
            ) : null}
          </View>
          <View style={pc.compareBtn}>
            <Text style={pc.compareBtnText}>{comparison.prices.length}</Text>
            <MaterialIcons name={priceData.expanded ? 'expand-less' : 'expand-more'} size={13} color="#7B2FA0" />
          </View>
        </View>
      </Pressable>

      {priceData.expanded ? (
        <Animated.View entering={FadeInDown.duration(200)} style={pc.expandedList}>
          {comparison.prices.map((entry, i) => {
            const isBest = bestPrice?.provider_name === entry.provider_name;
            const isFastest = fastestDelivery?.provider_name === entry.provider_name;
            const tags = getItemTags(entry, isBest, isFastest);
            return (
              <ProductMatchCard key={i} entry={entry} colors={colors} isDark={isDark} isFirst={i === 0} tags={tags} />
            );
          })}
          {comparison.isEstimated ? (
            <View style={[pc.estimateNote, { backgroundColor: 'rgba(245,183,49,0.05)' }]}>
              <MaterialIcons name="info-outline" size={11} color="#D9A020" />
              <Text style={[pc.estimateText, { color: colors.textMuted }]}>Estimated prices — refreshing shortly</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// ── Cost Insights Section ──
function CostInsights({ mealCost, marketCost, leftoverValue, mealBreakdown, colors, isDark }: {
  mealCost: number;
  marketCost: number;
  leftoverValue: number;
  mealBreakdown: { breakfast: number; lunch: number; snack: number; dinner: number; daily: number; weekly: number; monthly: number };
  colors: any;
  isDark: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <View style={{ gap: 12 }}>
      {/* Main Cost Cards */}
      <View style={[ci.card, { backgroundColor: isDark ? 'rgba(30,20,86,0.08)' : 'rgba(30,20,86,0.02)', borderColor: isDark ? 'rgba(123,47,160,0.18)' : 'rgba(30,20,86,0.08)' }]}>
        <View style={ci.headerRow}>
          <MaterialIcons name="analytics" size={18} color="#7B2FA0" />
          <Text style={[ci.title, { color: colors.textPrimary }]}>Cost Intelligence</Text>
        </View>

        <View style={ci.costGrid}>
          <View style={[ci.costItem, { backgroundColor: isDark ? 'rgba(123,47,160,0.06)' : 'rgba(123,47,160,0.03)', borderColor: 'rgba(123,47,160,0.12)' }]}>
            <Text style={[ci.costLabel, { color: colors.textMuted }]}>Market Grocery</Text>
            <Text style={[ci.costAmount, { color: colors.textPrimary }]}>₹{marketCost.toLocaleString()}</Text>
            <Text style={[ci.costHint, { color: colors.textMuted }]}>Total shopping bill</Text>
          </View>
          <View style={[ci.costItem, { backgroundColor: isDark ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.02)', borderColor: 'rgba(74,222,128,0.15)' }]}>
            <Text style={[ci.costLabel, { color: colors.textMuted }]}>Actual Meal Cost</Text>
            <Text style={[ci.costAmount, { color: '#4ADE80' }]}>₹{mealCost.toLocaleString()}</Text>
            <Text style={[ci.costHint, { color: colors.textMuted }]}>Recipe consumption</Text>
          </View>
          <View style={[ci.costItem, { backgroundColor: isDark ? 'rgba(245,183,49,0.06)' : 'rgba(245,183,49,0.02)', borderColor: 'rgba(245,183,49,0.15)' }]}>
            <Text style={[ci.costLabel, { color: colors.textMuted }]}>Leftover Value</Text>
            <Text style={[ci.costAmount, { color: '#F5B731' }]}>₹{leftoverValue.toLocaleString()}</Text>
            <Text style={[ci.costHint, { color: colors.textMuted }]}>Reusable for future</Text>
          </View>
        </View>
      </View>

      {/* Per Meal Breakdown */}
      <Pressable onPress={() => { Haptics.selectionAsync(); setShowBreakdown(!showBreakdown); }}>
        <View style={[ci.card, { backgroundColor: isDark ? 'rgba(245,183,49,0.04)' : 'rgba(245,183,49,0.02)', borderColor: 'rgba(245,183,49,0.15)' }]}>
          <View style={ci.breakdownHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="restaurant-menu" size={16} color="#F5B731" />
              <Text style={[ci.breakdownTitle, { color: colors.textPrimary }]}>Cost Per Meal</Text>
            </View>
            <MaterialIcons name={showBreakdown ? 'expand-less' : 'expand-more'} size={18} color={colors.textMuted} />
          </View>

          {showBreakdown ? (
            <Animated.View entering={FadeInDown.duration(200)}>
              <View style={ci.mealGrid}>
                <MealCostRow icon="free-breakfast" label="Breakfast" cost={mealBreakdown.breakfast} colors={colors} />
                <MealCostRow icon="lunch-dining" label="Lunch" cost={mealBreakdown.lunch} colors={colors} />
                <MealCostRow icon="cookie" label="Snack" cost={mealBreakdown.snack} colors={colors} />
                <MealCostRow icon="dinner-dining" label="Dinner" cost={mealBreakdown.dinner} colors={colors} />
              </View>
              <View style={[ci.estimateRow, { borderTopColor: colors.border }]}>
                <View style={ci.estimateItem}>
                  <Text style={[ci.estimateLabel, { color: colors.textMuted }]}>Daily</Text>
                  <Text style={[ci.estimateValue, { color: colors.textPrimary }]}>₹{mealBreakdown.daily}</Text>
                </View>
                <View style={ci.estimateItem}>
                  <Text style={[ci.estimateLabel, { color: colors.textMuted }]}>Weekly</Text>
                  <Text style={[ci.estimateValue, { color: colors.textPrimary }]}>₹{mealBreakdown.weekly.toLocaleString()}</Text>
                </View>
                <View style={ci.estimateItem}>
                  <Text style={[ci.estimateLabel, { color: colors.textMuted }]}>Monthly</Text>
                  <Text style={[ci.estimateValue, { color: '#F5B731' }]}>₹{mealBreakdown.monthly.toLocaleString()}</Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Text style={[ci.breakdownPreview, { color: colors.textMuted }]}>
              Daily ₹{mealBreakdown.daily} • Weekly ₹{mealBreakdown.weekly.toLocaleString()} • Monthly ₹{mealBreakdown.monthly.toLocaleString()}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function MealCostRow({ icon, label, cost, colors }: { icon: string; label: string; cost: number; colors: any }) {
  return (
    <View style={ci.mealRow}>
      <MaterialIcons name={icon as any} size={14} color={colors.textMuted} />
      <Text style={[ci.mealLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[ci.mealCost, { color: colors.textPrimary }]}>₹{cost}</Text>
    </View>
  );
}

// ── Generate grocery ──
function generateGroceryFromMeals(planDataStr: string): GroceryCategory[] {
  let meals: any[] = [];
  try {
    const parsed = JSON.parse(planDataStr);
    if (parsed.meals) meals = parsed.meals;
    else if (parsed.days) {
      parsed.days.forEach((d: any) => { if (d.meals) meals.push(...d.meals); });
    }
  } catch {}

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

  if (ingredientMap.size === 0) return getDefaultGrocery();

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
    'Spices & Seasonings': { emoji: '🧂', color: '#F97316' },
    'Oils & Fats': { emoji: '🫗', color: '#A78BFA' },
    'Protein': { emoji: '🥩', color: '#EF4444' },
    'Bakery': { emoji: '🍞', color: '#D2691E' },
    'Beverages': { emoji: '🥤', color: '#06B6D4' },
    'Others': { emoji: '📦', color: '#6B7280' },
  };

  return Array.from(categoryMap.entries()).map(([catName, items]) => ({
    id: catName.toLowerCase().replace(/\s/g, '-'),
    name: catName,
    emoji: CATEGORY_META[catName]?.emoji || '📦',
    color: CATEGORY_META[catName]?.color || '#6B7280',
    items,
    collapsed: false,
  }));
}

function categorizeIngredient(name: string): { category: string; emoji: string } {
  const vegs = ['onion', 'tomato', 'potato', 'garlic', 'ginger', 'carrot', 'capsicum', 'peas', 'beans', 'cauliflower', 'cabbage', 'brinjal', 'okra', 'spinach', 'coriander', 'mint', 'cucumber', 'bottle gourd', 'radish', 'beetroot', 'palak', 'methi', 'lady finger', 'green chilli'];
  const fruits = ['banana', 'apple', 'mango', 'orange', 'lemon', 'lime', 'papaya', 'pomegranate', 'grapes', 'watermelon'];
  const dairy = ['milk', 'curd', 'yogurt', 'paneer', 'butter', 'ghee', 'cheese', 'cream'];
  const grains = ['rice', 'wheat', 'atta', 'flour', 'dal', 'lentil', 'chana', 'rajma', 'oats', 'poha', 'semolina', 'sooji', 'bread', 'roti', 'moong', 'masoor', 'toor', 'urad', 'besan', 'maida', 'sugar'];
  const spices = ['turmeric', 'cumin', 'coriander powder', 'chilli', 'pepper', 'garam masala', 'salt', 'mustard seed', 'fenugreek', 'bay leaf', 'cinnamon', 'clove', 'cardamom', 'asafoetida', 'hing', 'masala'];
  const oils = ['oil', 'sunflower', 'mustard oil', 'olive oil', 'coconut oil', 'sesame'];
  const protein = ['chicken', 'egg', 'fish', 'mutton', 'prawn', 'soya', 'tofu', 'nuts', 'almond', 'cashew', 'peanut'];

  if (vegs.some(v => name.includes(v))) return { category: 'Vegetables', emoji: '🥬' };
  if (fruits.some(v => name.includes(v))) return { category: 'Fruits', emoji: '🍎' };
  if (dairy.some(v => name.includes(v))) return { category: 'Dairy', emoji: '🥛' };
  if (grains.some(v => name.includes(v))) return { category: 'Grains & Staples', emoji: '🌾' };
  if (spices.some(v => name.includes(v))) return { category: 'Spices & Seasonings', emoji: '🧂' };
  if (oils.some(v => name.includes(v))) return { category: 'Oils & Fats', emoji: '🫗' };
  if (protein.some(v => name.includes(v))) return { category: 'Protein', emoji: '🥩' };
  return { category: 'Others', emoji: '📦' };
}

function estimatePrice(name: string): number {
  const priceMap: Record<string, number> = {
    rice: 280, wheat: 220, atta: 220, flour: 200, oil: 180, milk: 60, curd: 40, paneer: 135,
    butter: 55, ghee: 250, chicken: 200, egg: 90, fish: 250, mutton: 400, dal: 140,
    onion: 52, tomato: 35, potato: 45, sugar: 45, salt: 25, turmeric: 38, cumin: 32,
    bread: 45, cheese: 110, cream: 65, masala: 55,
  };
  for (const [key, price] of Object.entries(priceMap)) {
    if (name.includes(key)) return price;
  }
  return Math.floor(30 + Math.random() * 70);
}

function getDefaultGrocery(): GroceryCategory[] {
  return [
    {
      id: 'dairy', name: 'Dairy', emoji: '🥛', color: '#60A5FA', collapsed: false,
      items: [
        { name: 'Milk (Toned)', qty: '1 L', price: 56, emoji: '🥛', category: 'Dairy', checked: false },
        { name: 'Curd', qty: '400 g', price: 35, emoji: '🥣', category: 'Dairy', checked: false },
        { name: 'Paneer', qty: '500 g', price: 135, emoji: '🧀', category: 'Dairy', checked: false },
        { name: 'Butter', qty: '200 g', price: 52, emoji: '🧈', category: 'Dairy', checked: false },
      ],
    },
    {
      id: 'vegs', name: 'Vegetables', emoji: '🥬', color: '#4ADE80', collapsed: false,
      items: [
        { name: 'Onions', qty: '2 kg', price: 52, emoji: '🧅', category: 'Vegetables', checked: false },
        { name: 'Tomatoes', qty: '1 kg', price: 35, emoji: '🍅', category: 'Vegetables', checked: false },
        { name: 'Potatoes', qty: '2 kg', price: 45, emoji: '🥔', category: 'Vegetables', checked: false },
        { name: 'Green Chillies', qty: '100 g', price: 10, emoji: '🌶️', category: 'Vegetables', checked: false },
        { name: 'Coriander Leaves', qty: '1 bunch', price: 8, emoji: '🌿', category: 'Vegetables', checked: false },
        { name: 'Spinach', qty: '500 g', price: 20, emoji: '🥬', category: 'Vegetables', checked: false },
      ],
    },
    {
      id: 'grains', name: 'Grains & Staples', emoji: '🌾', color: '#D4AF37', collapsed: false,
      items: [
        { name: 'Basmati Rice', qty: '5 kg', price: 399, emoji: '🍚', category: 'Grains & Staples', checked: false },
        { name: 'Atta (Wheat Flour)', qty: '5 kg', price: 198, emoji: '🌾', category: 'Grains & Staples', checked: false },
        { name: 'Toor Dal', qty: '1 kg', price: 135, emoji: '🫘', category: 'Grains & Staples', checked: false },
        { name: 'Moong Dal', qty: '1 kg', price: 115, emoji: '🫘', category: 'Grains & Staples', checked: false },
      ],
    },
    {
      id: 'spices', name: 'Spices & Masalas', emoji: '🧂', color: '#F97316', collapsed: false,
      items: [
        { name: 'Turmeric Powder', qty: '200 g', price: 38, emoji: '🟡', category: 'Spices & Seasonings', checked: false },
        { name: 'Cumin Seeds', qty: '100 g', price: 32, emoji: '🟤', category: 'Spices & Seasonings', checked: false },
        { name: 'Garam Masala', qty: '100 g', price: 55, emoji: '🌶️', category: 'Spices & Seasonings', checked: false },
        { name: 'Red Chilli Powder', qty: '200 g', price: 48, emoji: '🔴', category: 'Spices & Seasonings', checked: false },
      ],
    },
    {
      id: 'oils', name: 'Oils & Fats', emoji: '🫗', color: '#A78BFA', collapsed: false,
      items: [
        { name: 'Sunflower Oil', qty: '2 L', price: 249, emoji: '🫗', category: 'Oils & Fats', checked: false },
        { name: 'Ghee', qty: '500 ml', price: 245, emoji: '🧈', category: 'Oils & Fats', checked: false },
      ],
    },
    {
      id: 'protein', name: 'Protein', emoji: '🥩', color: '#EF4444', collapsed: false,
      items: [
        { name: 'Eggs', qty: '12 pcs', price: 78, emoji: '🥚', category: 'Protein', checked: false },
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
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, ItemPriceData>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [pincode, setPincode] = useState('400001');
  const [pincodeInput, setPincodeInput] = useState('400001');
  const [locationLoading, setLocationLoading] = useState(false);

  const handleUseMyLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationLoading(false); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geocode] = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (geocode?.postalCode) { setPincodeInput(geocode.postalCode); setPincode(geocode.postalCode); }
    } catch (err) { console.error('Location error:', err); }
    finally { setLocationLoading(false); }
  }, []);

  useEffect(() => { loadPriceComparisons(); }, [pincode]);

  const loadPriceComparisons = useCallback(async () => {
    const allItems: GroceryItemInput[] = categories.flatMap(c => c.items.map(i => ({ name: i.name, qty: i.qty })));
    if (allItems.length === 0) return;

    setPricesLoading(true);
    const initialMap: Record<string, ItemPriceData> = {};
    allItems.forEach(item => { initialMap[item.name] = { loading: true, comparison: null, expanded: false }; });
    setPriceMap(initialMap);

    const { data } = await fetchPriceComparisons(allItems.slice(0, 20), pincode);
    
    if (data) {
      const updatedMap: Record<string, ItemPriceData> = {};
      allItems.forEach(item => {
        const key = Object.keys(data).find(k => k.toLowerCase() === item.name.toLowerCase()) || item.name;
        updatedMap[item.name] = { loading: false, comparison: data[key] || null, expanded: false };
      });
      setPriceMap(updatedMap);
      setPricesLoaded(true);
    } else {
      const clearedMap: Record<string, ItemPriceData> = {};
      allItems.forEach(item => { clearedMap[item.name] = { loading: false, comparison: null, expanded: false }; });
      setPriceMap(clearedMap);
    }
    setPricesLoading(false);
  }, [categories, pincode]);

  const togglePriceExpand = useCallback((itemName: string) => {
    Haptics.selectionAsync();
    setPriceMap(prev => ({ ...prev, [itemName]: { ...prev[itemName], expanded: !prev[itemName]?.expanded } }));
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    Haptics.selectionAsync();
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, collapsed: !c.collapsed } : c));
  }, []);

  const totalItems = useMemo(() => categories.reduce((s, c) => s + c.items.length, 0), [categories]);
  const totalCost = useMemo(() => categories.reduce((s, c) => s + c.items.reduce((si, item) => si + item.price, 0), 0), [categories]);
  const checkedCount = useMemo(() => categories.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0), [categories]);

  // Cost Intelligence
  const costData = useMemo(() => {
    const allItems = categories.flatMap(c => c.items);
    return calculateMealCost(allItems, priceMap as any);
  }, [categories, priceMap]);

  const mealBreakdown = useMemo(() => estimateMealCosts(costData.mealCost), [costData.mealCost]);

  const toggleItem = useCallback((catId: string, itemIdx: number) => {
    Haptics.selectionAsync();
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c;
      return { ...c, items: c.items.map((item, i) => i === itemIdx ? { ...item, checked: !item.checked } : item) };
    }));
  }, []);

  const handleSmartSplit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const allItems = categories.flatMap(c => c.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, category: i.category })));
    const splitResult = calculateSmartSplit(allItems, priceMap as any);
    router.push({ pathname: '/smart-split', params: { splitData: JSON.stringify(splitResult) } });
  }, [categories, priceMap]);

  const handleShareList = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lines = ['🛒 My Grocery List (FoodGenie)\n'];
    categories.forEach(cat => {
      lines.push(`\n${cat.emoji} ${cat.name}`);
      cat.items.forEach(item => {
        lines.push(`  ${item.checked ? '✅' : '⬜'} ${item.name} — ${item.qty} (₹${item.price})`);
      });
    });
    lines.push(`\n💰 Total: ₹${totalCost}`);
    try { await Share.share({ message: lines.join('\n') }); } catch {}
  }, [categories, totalCost]);

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
              <Text style={st.headerSub}>{totalItems} items • {params.planType || 'today'} plan</Text>
            </View>
            <Pressable style={({ pressed }) => [st.shareBtn, pressed && { opacity: 0.7 }]} onPress={handleShareList}>
              <MaterialIcons name="share" size={18} color="#FFF" />
            </Pressable>
          </View>

          {/* Progress */}
          <View style={st.progressRow}>
            <View style={st.progressBar}>
              <View style={[st.progressFill, { width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }]} />
            </View>
            <Text style={st.progressText}>{checkedCount}/{totalItems}</Text>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
          {/* Pincode */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={[st.pincodeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={st.pincodeLeft}>
              <MaterialIcons name="location-on" size={16} color="#7B2FA0" />
              <Text style={[st.pincodeLabel, { color: colors.textSecondary }]}>Pincode</Text>
            </View>
            <View style={st.pincodeRight}>
              <Pressable
                style={({ pressed }) => [st.locationBtn, { backgroundColor: isDark ? 'rgba(123,47,160,0.10)' : 'rgba(123,47,160,0.05)' }, pressed && { opacity: 0.7 }]}
                onPress={handleUseMyLocation}
                disabled={locationLoading}
              >
                {locationLoading ? <ActivityIndicator size="small" color="#7B2FA0" /> : <MaterialIcons name="my-location" size={14} color="#7B2FA0" />}
              </Pressable>
              <TextInput
                style={[st.pincodeInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(123,47,160,0.05)' : 'rgba(123,47,160,0.02)' }]}
                value={pincodeInput}
                onChangeText={(t) => setPincodeInput(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="400001"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable
                style={({ pressed }) => [st.pincodeApplyBtn, pincodeInput.length === 6 && pincodeInput !== pincode ? { backgroundColor: '#7B2FA0' } : { backgroundColor: isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.06)' }, pressed && { opacity: 0.7 }]}
                onPress={() => { if (pincodeInput.length === 6 && pincodeInput !== pincode) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPincode(pincodeInput); } }}
                disabled={pincodeInput.length !== 6 || pincodeInput === pincode}
              >
                <MaterialIcons name="check" size={14} color={pincodeInput.length === 6 && pincodeInput !== pincode ? '#FFF' : '#7B2FA0'} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Cost Intelligence */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <CostInsights
              mealCost={costData.mealCost}
              marketCost={costData.marketCost || totalCost}
              leftoverValue={costData.leftoverValue}
              mealBreakdown={mealBreakdown}
              colors={colors}
              isDark={isDark}
            />
          </Animated.View>

          {/* Grocery Categories */}
          {categories.map((cat, ci2) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(150 + ci2 * 40).duration(300)} style={st.categorySection}>
              <Pressable onPress={() => toggleCategory(cat.id)} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                <View style={[st.categoryHeader, { borderColor: colors.border }]}>
                  <View style={[st.categoryIcon, { backgroundColor: `${cat.color}12` }]}>
                    <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                  </View>
                  <Text style={[st.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                  <View style={[st.categoryCount, { backgroundColor: `${cat.color}12` }]}>
                    <Text style={[st.categoryCountText, { color: cat.color }]}>{cat.items.length}</Text>
                  </View>
                  <Text style={[st.categoryTotal, { color: colors.textMuted }]}>₹{cat.items.reduce((s, i) => s + i.price, 0)}</Text>
                  <MaterialIcons name={cat.collapsed ? 'expand-more' : 'expand-less'} size={20} color={colors.textMuted} />
                </View>
              </Pressable>

              {!cat.collapsed ? (
                <View style={st.itemsList}>
                  {cat.items.map((item, ii) => (
                    <View key={ii}>
                      <Pressable
                        style={({ pressed }) => [
                          st.groceryItem,
                          { backgroundColor: item.checked ? (isDark ? 'rgba(74,222,128,0.04)' : 'rgba(74,222,128,0.02)') : colors.surface, borderColor: item.checked ? 'rgba(74,222,128,0.15)' : colors.border },
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => toggleItem(cat.id, ii)}
                      >
                        <View style={[st.checkbox, item.checked && { backgroundColor: '#4ADE80', borderColor: '#4ADE80' }, !item.checked && { borderColor: colors.border }]}>
                          {item.checked ? <MaterialIcons name="check" size={12} color="#FFF" /> : null}
                        </View>
                        <Text style={{ fontSize: 15 }}>{item.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[st.itemName, { color: colors.textPrimary }, item.checked && { textDecorationLine: 'line-through', opacity: 0.5 }]}>{item.name}</Text>
                          <Text style={[st.itemQty, { color: colors.textMuted }]}>{item.qty}</Text>
                        </View>
                        <Text style={[st.itemPrice, { color: item.checked ? colors.textMuted : '#F5B731' }]}>₹{item.price}</Text>
                      </Pressable>
                      {priceMap[item.name] ? (
                        <PriceComparisonCard itemName={item.name} priceData={priceMap[item.name]} colors={colors} isDark={isDark} onToggle={() => togglePriceExpand(item.name)} />
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </Animated.View>
          ))}

          {/* Provider Comparison */}
          {pricesLoaded ? (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
              <View style={[st.provCompCard, { backgroundColor: isDark ? 'rgba(74,222,128,0.03)' : 'rgba(74,222,128,0.01)', borderColor: 'rgba(74,222,128,0.15)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <MaterialIcons name="leaderboard" size={18} color="#4ADE80" />
                  <Text style={[st.provCompTitle, { color: colors.textPrimary }]}>Provider Totals</Text>
                  {pricesLoading ? <ActivityIndicator size="small" color="#7B2FA0" /> : (
                    <Pressable onPress={loadPriceComparisons} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                      <MaterialIcons name="refresh" size={16} color="#7B2FA0" />
                    </Pressable>
                  )}
                </View>
                <ProviderTotalsCompact priceMap={priceMap} categories={categories} colors={colors} isDark={isDark} />
              </View>
            </Animated.View>
          ) : pricesLoading ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color="#7B2FA0" />
              <Text style={[{ fontSize: 11, fontWeight: '600' }, { color: colors.textMuted }]}>Loading live prices...</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[st.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 10 }]}>
          <View style={st.bottomLeft}>
            <Text style={[st.bottomLabel, { color: colors.textMuted }]}>Total</Text>
            <Text style={st.bottomPrice}>₹{totalCost.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={({ pressed }) => [st.smartSplitBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSmartSplit}
            >
              <MaterialIcons name="auto-awesome" size={16} color="#7B2FA0" />
              <Text style={st.smartSplitText}>Smart Split</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                if (selectedPartner) {
                  const url = selectedPartner === 'zepto' ? 'https://www.zeptonow.com' : selectedPartner === 'blinkit' ? 'https://blinkit.com' : selectedPartner === 'bigbasket' ? 'https://www.bigbasket.com' : '';
                  if (url) Linking.openURL(url).catch(() => {});
                }
              }}
            >
              <LinearGradient colors={['#F5B731', '#D9A020']} style={st.orderBtn}>
                <MaterialIcons name="shopping-cart-checkout" size={18} color="#FFF" />
                <Text style={st.orderBtnText}>Order</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Provider Totals Compact ──
function ProviderTotalsCompact({ priceMap, categories, colors, isDark }: {
  priceMap: Record<string, ItemPriceData>;
  categories: GroceryCategory[];
  colors: any;
  isDark: boolean;
}) {
  const allItems = categories.flatMap(c => c.items);
  const providerNames = ['Zepto', 'Blinkit', 'BigBasket', 'Instamart', 'Local Kirana'];
  const totals: { name: string; total: number; items: number; emoji: string; color: string }[] = [];

  providerNames.forEach(pName => {
    let total = 0;
    let items = 0;
    allItems.forEach(item => {
      const data = priceMap[item.name];
      if (data?.comparison?.prices) {
        const entry = data.comparison.prices.find(p => p.provider_name === pName && p.availability && p.price);
        if (entry) { total += (entry.discount_price || entry.price || 0); items++; }
        else { total += item.price; }
      } else { total += item.price; }
    });
    const meta = PROVIDER_META[pName] || { emoji: '📦', color: '#6B7280', tagline: '' };
    totals.push({ name: pName, total: Math.round(total), items, emoji: meta.emoji, color: meta.color });
  });

  totals.sort((a, b) => a.total - b.total);
  const cheapest = totals[0];

  return (
    <View style={{ gap: 6 }}>
      {totals.map((p, i) => (
        <View key={p.name} style={[prc.row, { backgroundColor: i === 0 ? (isDark ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.02)') : 'transparent', borderColor: i === 0 ? 'rgba(74,222,128,0.20)' : colors.border }]}>
          <Text style={{ fontSize: 15 }}>{p.emoji}</Text>
          <Text style={[prc.name, { color: colors.textPrimary }]}>{p.name}</Text>
          {i === 0 ? (
            <View style={prc.cheapBadge}>
              <Text style={prc.cheapText}>Cheapest</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Text style={[prc.total, { color: i === 0 ? '#4ADE80' : colors.textPrimary }]}>₹{p.total.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Styles ──
const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  shareBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.20)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#FFF' },
  progressText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  // Pincode
  pincodeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  pincodeLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pincodeLabel: { fontSize: 12, fontWeight: '700' },
  pincodeRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pincodeInput: { width: 72, height: 32, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  pincodeApplyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Category
  categorySection: { paddingHorizontal: 16, paddingTop: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 0.5 },
  categoryIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 14, fontWeight: '800', flex: 1 },
  categoryCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  categoryCountText: { fontSize: 10, fontWeight: '800' },
  categoryTotal: { fontSize: 12, fontWeight: '700' },
  itemsList: { gap: 4, marginTop: 6 },

  // Grocery Item
  groceryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '600' },
  itemQty: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '800' },

  // Provider Comparison
  provCompCard: { padding: 14, borderRadius: 16, borderWidth: 1 },
  provCompTitle: { fontSize: 14, fontWeight: '800', flex: 1 },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  bottomLeft: { gap: 0 },
  bottomLabel: { fontSize: 9, fontWeight: '600' },
  bottomPrice: { fontSize: 20, fontWeight: '900', color: '#F5B731' },
  smartSplitBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(123,47,160,0.08)', borderWidth: 1, borderColor: 'rgba(123,47,160,0.20)' },
  smartSplitText: { fontSize: 12, fontWeight: '800', color: '#7B2FA0' },
  orderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  orderBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});

const ci = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '800' },
  costGrid: { flexDirection: 'row', gap: 6 },
  costItem: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 3 },
  costLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  costAmount: { fontSize: 16, fontWeight: '900' },
  costHint: { fontSize: 8, fontWeight: '500' },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breakdownTitle: { fontSize: 14, fontWeight: '800' },
  breakdownPreview: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  mealGrid: { marginTop: 10, gap: 6 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  mealCost: { fontSize: 13, fontWeight: '700' },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 0.5 },
  estimateItem: { alignItems: 'center' },
  estimateLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  estimateValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
});

const pm = StyleSheet.create({
  card: { padding: 10, borderRadius: 12, borderWidth: 1, gap: 6, marginBottom: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  providerText: { fontSize: 10, fontWeight: '700' },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  tagText: { fontSize: 8, fontWeight: '700' },
  productTitle: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  brandText: { fontSize: 10, fontWeight: '600' },
  qtySection: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  qtyBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  qtyLabel: { fontSize: 8, fontWeight: '600' },
  qtyValue: { fontSize: 11, fontWeight: '800', marginTop: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceSection: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  mrp: { fontSize: 10, fontWeight: '500', textDecorationLine: 'line-through' },
  price: { fontSize: 15, fontWeight: '900' },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  deliveryText: { fontSize: 9, fontWeight: '500' },
});

const pc = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 40 },
  loadingText: { fontSize: 9, fontWeight: '500' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 40, marginRight: 12, marginTop: -1, marginBottom: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' },
  bestPriceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bestPriceText: { fontSize: 11, fontWeight: '800', color: '#4ADE80' },
  bestPriceProvider: { fontSize: 8, fontWeight: '600' },
  fastBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  fastText: { fontSize: 9, fontWeight: '700' },
  compareBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  compareBtnText: { fontSize: 9, fontWeight: '700', color: '#7B2FA0' },
  expandedList: { marginLeft: 40, marginRight: 12, marginBottom: 6, gap: 4 },
  estimateNote: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6, borderRadius: 6 },
  estimateText: { fontSize: 9, fontWeight: '500' },
});

const prc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  name: { fontSize: 12, fontWeight: '700' },
  cheapBadge: { backgroundColor: '#4ADE80', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  cheapText: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  total: { fontSize: 14, fontWeight: '900' },
});
