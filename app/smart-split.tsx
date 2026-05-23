import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { PROVIDER_META } from '../services/priceComparisonService';

const { width: SCREEN_W } = Dimensions.get('window');

interface SplitProvider {
  name: string;
  emoji: string;
  color: string;
  items: { name: string; qty: string; price: number; brand?: string }[];
  subtotal: number;
  deliveryFee: number;
  handlingCharge: number;
  discount: number;
  finalAmount: number;
  deliveryTime: string;
  minOrder: number;
}

interface SplitResult {
  providers: SplitProvider[];
  originalTotal: number;
  optimizedTotal: number;
  totalSavings: number;
  totalDeliveryFee: number;
  estimatedTime: string;
}

export default function SmartSplitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ splitData?: string }>();
  const [loading, setLoading] = useState(true);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);

  useEffect(() => {
    // Parse split data from params
    try {
      if (params.splitData) {
        const parsed = JSON.parse(params.splitData);
        setSplitResult(parsed);
      } else {
        // Generate demo split
        setSplitResult(generateDemoSplit());
      }
    } catch {
      setSplitResult(generateDemoSplit());
    }
    setTimeout(() => setLoading(false), 800);
  }, []);

  function generateDemoSplit(): SplitResult {
    return {
      providers: [
        {
          name: 'Blinkit',
          emoji: '🟡',
          color: '#F8CB2E',
          items: [
            { name: 'Milk (Toned)', qty: '1L', price: 56, brand: 'Amul' },
            { name: 'Bread', qty: '400g', price: 42, brand: 'Britannia' },
            { name: 'Paneer', qty: '500g', price: 135, brand: 'Amul' },
            { name: 'Curd', qty: '400g', price: 35, brand: 'Mother Dairy' },
            { name: 'Butter', qty: '200g', price: 52, brand: 'Amul' },
            { name: 'Eggs', qty: '12 pcs', price: 78 },
            { name: 'Cheese', qty: '200g', price: 110, brand: 'Amul' },
            { name: 'Cream', qty: '200ml', price: 65, brand: 'Amul' },
          ],
          subtotal: 573,
          deliveryFee: 0,
          handlingCharge: 4,
          discount: 45,
          finalAmount: 532,
          deliveryTime: '10-15 min',
          minOrder: 149,
        },
        {
          name: 'BigBasket',
          emoji: '🟢',
          color: '#84C225',
          items: [
            { name: 'Basmati Rice', qty: '5kg', price: 399, brand: 'India Gate' },
            { name: 'Atta', qty: '5kg', price: 198, brand: 'Aashirvaad' },
            { name: 'Sunflower Oil', qty: '2L', price: 249, brand: 'Fortune' },
            { name: 'Toor Dal', qty: '1kg', price: 135, brand: 'Tata Sampann' },
            { name: 'Moong Dal', qty: '1kg', price: 115, brand: 'Fortune' },
            { name: 'Sugar', qty: '1kg', price: 42 },
          ],
          subtotal: 1138,
          deliveryFee: 0,
          handlingCharge: 3,
          discount: 88,
          finalAmount: 1053,
          deliveryTime: '2-4 hrs',
          minOrder: 200,
        },
        {
          name: 'Local Kirana',
          emoji: '🏪',
          color: '#FF8C42',
          items: [
            { name: 'Onions', qty: '2kg', price: 52 },
            { name: 'Tomatoes', qty: '1kg', price: 35 },
            { name: 'Potatoes', qty: '2kg', price: 45 },
            { name: 'Green Chillies', qty: '100g', price: 10 },
            { name: 'Coriander Leaves', qty: '1 bunch', price: 8 },
            { name: 'Spinach', qty: '500g', price: 20 },
            { name: 'Ginger', qty: '100g', price: 12 },
            { name: 'Garlic', qty: '250g', price: 28 },
          ],
          subtotal: 210,
          deliveryFee: 0,
          handlingCharge: 0,
          discount: 0,
          finalAmount: 210,
          deliveryTime: '30-60 min',
          minOrder: 0,
        },
        {
          name: 'Zepto',
          emoji: '⚡',
          color: '#7B2D8E',
          items: [
            { name: 'Turmeric Powder', qty: '200g', price: 38, brand: 'MDH' },
            { name: 'Cumin Seeds', qty: '100g', price: 32, brand: 'Everest' },
            { name: 'Garam Masala', qty: '100g', price: 55, brand: 'MDH' },
            { name: 'Red Chilli Powder', qty: '200g', price: 48, brand: 'Everest' },
            { name: 'Ghee', qty: '500ml', price: 245, brand: 'Amul' },
          ],
          subtotal: 418,
          deliveryFee: 0,
          handlingCharge: 2,
          discount: 30,
          finalAmount: 390,
          deliveryTime: '10 min',
          minOrder: 99,
        },
      ],
      originalTotal: 2519,
      optimizedTotal: 2185,
      totalSavings: 334,
      totalDeliveryFee: 9,
      estimatedTime: '10 min - 4 hrs',
    };
  }

  if (loading) {
    return (
      <View style={[ss.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={ss.loadingWrap}>
          <LinearGradient colors={['#1E1456', '#7B2FA0']} style={ss.loadingGrad}>
            <ActivityIndicator size="large" color="#F5B731" />
            <Text style={ss.loadingTitle}>AI Optimizing Your Cart...</Text>
            <Text style={ss.loadingSub}>Comparing prices across 5 providers</Text>
          </LinearGradient>
        </SafeAreaView>
      </View>
    );
  }

  if (!splitResult) return null;

  return (
    <View style={[ss.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#1E1456', '#7B2FA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ss.header}>
          <View style={ss.headerRow}>
            <Pressable style={({ pressed }) => [ss.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={ss.headerTitle}>AI Smart Split ✨</Text>
              <Text style={ss.headerSub}>Optimized across {splitResult.providers.length} providers</Text>
            </View>
            <View style={ss.savingsBadge}>
              <MaterialIcons name="savings" size={14} color="#F5B731" />
              <Text style={ss.savingsBadgeText}>₹{splitResult.totalSavings} saved</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          {/* Summary Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <View style={[ss.summaryCard, { backgroundColor: isDark ? 'rgba(30,20,86,0.15)' : 'rgba(30,20,86,0.03)', borderColor: isDark ? 'rgba(123,47,160,0.25)' : 'rgba(30,20,86,0.10)' }]}>
              <View style={ss.summaryRow}>
                <View style={ss.summaryItem}>
                  <Text style={[ss.summaryLabel, { color: colors.textMuted }]}>Original</Text>
                  <Text style={[ss.summaryStrike, { color: colors.textMuted }]}>₹{splitResult.originalTotal.toLocaleString()}</Text>
                </View>
                <View style={ss.summaryDivider} />
                <View style={ss.summaryItem}>
                  <Text style={[ss.summaryLabel, { color: colors.textMuted }]}>Optimized</Text>
                  <Text style={[ss.summaryValue, { color: '#4ADE80' }]}>₹{splitResult.optimizedTotal.toLocaleString()}</Text>
                </View>
                <View style={ss.summaryDivider} />
                <View style={ss.summaryItem}>
                  <Text style={[ss.summaryLabel, { color: colors.textMuted }]}>Savings</Text>
                  <Text style={ss.summaryHighlight}>₹{splitResult.totalSavings}</Text>
                </View>
              </View>
              <View style={[ss.etaRow, { backgroundColor: 'rgba(245,183,49,0.06)' }]}>
                <MaterialIcons name="schedule" size={13} color="#F5B731" />
                <Text style={[ss.etaText, { color: colors.textSecondary }]}>
                  Deliveries arrive between {splitResult.estimatedTime}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Provider Splits */}
          {splitResult.providers.map((provider, i) => (
            <Animated.View key={provider.name} entering={FadeInDown.delay(200 + i * 100).duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <View style={[ss.providerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Provider Header */}
                <View style={ss.providerHeader}>
                  <View style={[ss.providerIcon, { backgroundColor: `${provider.color}15` }]}>
                    <Text style={{ fontSize: 22 }}>{provider.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ss.providerName, { color: colors.textPrimary }]}>{provider.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name="schedule" size={11} color={provider.color} />
                      <Text style={[ss.providerEta, { color: provider.color }]}>{provider.deliveryTime}</Text>
                      <Text style={[ss.providerCount, { color: colors.textMuted }]}>• {provider.items.length} items</Text>
                    </View>
                  </View>
                  <View style={ss.providerTotal}>
                    <Text style={[ss.providerTotalAmount, { color: colors.textPrimary }]}>₹{provider.finalAmount}</Text>
                    {provider.discount > 0 ? (
                      <Text style={ss.providerDiscount}>-₹{provider.discount}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Items */}
                <View style={[ss.itemsList, { borderTopColor: colors.border }]}>
                  {provider.items.map((item, j) => (
                    <View key={j} style={ss.splitItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={[ss.splitItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                        <Text style={[ss.splitItemMeta, { color: colors.textMuted }]}>
                          {item.brand ? `${item.brand} • ` : ''}{item.qty}
                        </Text>
                      </View>
                      <Text style={[ss.splitItemPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
                    </View>
                  ))}
                </View>

                {/* Charges breakdown */}
                <View style={[ss.chargesRow, { borderTopColor: colors.border }]}>
                  <View style={ss.chargeItem}>
                    <Text style={[ss.chargeLabel, { color: colors.textMuted }]}>Subtotal</Text>
                    <Text style={[ss.chargeValue, { color: colors.textSecondary }]}>₹{provider.subtotal}</Text>
                  </View>
                  {provider.deliveryFee > 0 ? (
                    <View style={ss.chargeItem}>
                      <Text style={[ss.chargeLabel, { color: colors.textMuted }]}>Delivery</Text>
                      <Text style={[ss.chargeValue, { color: colors.textSecondary }]}>₹{provider.deliveryFee}</Text>
                    </View>
                  ) : (
                    <View style={ss.chargeItem}>
                      <Text style={[ss.chargeLabel, { color: colors.textMuted }]}>Delivery</Text>
                      <Text style={[ss.chargeValue, { color: '#4ADE80' }]}>FREE</Text>
                    </View>
                  )}
                  {provider.discount > 0 ? (
                    <View style={ss.chargeItem}>
                      <Text style={[ss.chargeLabel, { color: colors.textMuted }]}>Discount</Text>
                      <Text style={[ss.chargeValue, { color: '#4ADE80' }]}>-₹{provider.discount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          ))}

          {/* Why Smart Split */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <View style={[ss.whyCard, { backgroundColor: isDark ? 'rgba(245,183,49,0.04)' : 'rgba(245,183,49,0.03)', borderColor: 'rgba(245,183,49,0.20)' }]}>
              <Text style={[ss.whyTitle, { color: colors.textPrimary }]}>💡 Why Smart Split?</Text>
              <View style={ss.whyList}>
                <Text style={[ss.whyItem, { color: colors.textSecondary }]}>• Dairy & fresh items from fastest delivery (Blinkit/Zepto)</Text>
                <Text style={[ss.whyItem, { color: colors.textSecondary }]}>• Bulk staples from BigBasket (best pack prices)</Text>
                <Text style={[ss.whyItem, { color: colors.textSecondary }]}>• Fresh veggies & fruits from Local Kirana (freshest, no delivery fee)</Text>
                <Text style={[ss.whyItem, { color: colors.textSecondary }]}>• Spices & masalas from Zepto (brand discounts, fast delivery)</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[ss.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={ss.bottomLeft}>
            <Text style={[ss.bottomLabel, { color: colors.textMuted }]}>Smart Split Total</Text>
            <Text style={ss.bottomPrice}>₹{splitResult.optimizedTotal.toLocaleString()}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.back();
            }}
          >
            <LinearGradient colors={['#4ADE80', '#22C55E']} style={ss.bottomCta}>
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
              <Text style={ss.bottomCtaText}>Proceed With Split</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1 },
  loadingGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  loadingSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  headerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  savingsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,183,49,0.20)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  savingsBadgeText: { fontSize: 12, fontWeight: '800', color: '#F5B731' },

  // Summary
  summaryCard: { padding: 16, borderRadius: 18, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryStrike: { fontSize: 18, fontWeight: '700', textDecorationLine: 'line-through', marginTop: 4 },
  summaryValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  summaryHighlight: { fontSize: 20, fontWeight: '900', color: '#F5B731', marginTop: 4 },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(123,47,160,0.15)' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, padding: 10, borderRadius: 10 },
  etaText: { fontSize: 12, fontWeight: '600' },

  // Provider
  providerCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  providerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  providerName: { fontSize: 15, fontWeight: '800' },
  providerEta: { fontSize: 11, fontWeight: '700' },
  providerCount: { fontSize: 11, fontWeight: '500' },
  providerTotal: { alignItems: 'flex-end' },
  providerTotalAmount: { fontSize: 18, fontWeight: '900' },
  providerDiscount: { fontSize: 10, fontWeight: '700', color: '#4ADE80', marginTop: 1 },

  itemsList: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  splitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  splitItemName: { fontSize: 13, fontWeight: '600' },
  splitItemMeta: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  splitItemPrice: { fontSize: 13, fontWeight: '700' },

  chargesRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexWrap: 'wrap', gap: 8 },
  chargeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chargeLabel: { fontSize: 10, fontWeight: '600' },
  chargeValue: { fontSize: 11, fontWeight: '700' },

  // Why card
  whyCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  whyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  whyList: { gap: 4 },
  whyItem: { fontSize: 12, fontWeight: '500', lineHeight: 18 },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  bottomLeft: { gap: 1 },
  bottomLabel: { fontSize: 10, fontWeight: '600' },
  bottomPrice: { fontSize: 22, fontWeight: '900', color: '#4ADE80' },
  bottomCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16 },
  bottomCtaText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
