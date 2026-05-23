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
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Scheduled Essentials ──
const ESSENTIALS = [
  { id: 'milk', name: 'Milk', emoji: '🥛', freq: 'Daily', time: 'Morning', provider: 'Milk Vendor' },
  { id: 'curd', name: 'Curd', emoji: '🥣', freq: 'Daily', time: 'Morning', provider: 'Blinkit' },
  { id: 'bread', name: 'Bread', emoji: '🍞', freq: 'Alternate', time: 'Morning', provider: 'Zepto' },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', freq: 'Weekly', time: 'Morning', provider: 'Local Kirana' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎', freq: 'Alternate', time: 'Morning', provider: 'Local Kirana' },
  { id: 'vegetables', name: 'Vegetables', emoji: '🥬', freq: 'Wed & Sat', time: 'Morning', provider: 'Local Kirana' },
  { id: 'paneer', name: 'Paneer', emoji: '🧀', freq: 'Weekly', time: 'Morning', provider: 'Blinkit' },
  { id: 'coconut', name: 'Coconut Water', emoji: '🥥', freq: 'Daily', time: 'Afternoon', provider: 'Zepto' },
];

// ── Provider Bundles ──
const PROVIDER_BUNDLES = [
  {
    id: 'bb_essential', provider: 'BigBasket', emoji: '🟢', color: '#84C225',
    name: 'Family Essential Bundle', price: 4999, savings: 850, items: 35,
    categories: ['Atta', 'Rice', 'Oil', 'Dals', 'Spices', 'Dairy'],
    badge: 'Most Popular',
  },
  {
    id: 'blinkit_healthy', provider: 'Blinkit', emoji: '🟡', color: '#F8CB2E',
    name: 'Healthy Living Bundle', price: 3499, savings: 620, items: 28,
    categories: ['Oats', 'Quinoa', 'Dry Fruits', 'Fresh Veggies', 'Fruits'],
    badge: 'Fast Delivery',
  },
  {
    id: 'zepto_fitness', provider: 'Zepto', emoji: '⚡', color: '#7B2D8E',
    name: 'Fitness Protein Pack', price: 2999, savings: 480, items: 20,
    categories: ['Eggs', 'Chicken', 'Paneer', 'Whey', 'Seeds', 'Nuts'],
    badge: '10-min Delivery',
  },
  {
    id: 'kirana_budget', provider: 'Local Kirana', emoji: '🏪', color: '#FF8C42',
    name: 'Budget Saver Bundle', price: 2499, savings: 350, items: 25,
    categories: ['Vegetables', 'Fruits', 'Staples', 'Daily Essentials'],
    badge: 'No Delivery Fee',
  },
];

// ── Add-on Offers ──
const ADDON_OFFERS = [
  { id: 'fruits', emoji: '🍎', title: 'Fruits Combo', desc: 'Apple + Banana + Orange 3kg', savings: 120, price: 280 },
  { id: 'dairy', emoji: '🥛', title: 'Dairy Essentials', desc: 'Milk + Curd + Paneer + Butter', savings: 85, price: 320 },
  { id: 'breakfast', emoji: '🥣', title: 'Breakfast Pack', desc: 'Oats + Bread + Cornflakes + Milk', savings: 95, price: 250 },
  { id: 'snacks', emoji: '🍪', title: 'Healthy Snacks', desc: 'Dry fruits + Seeds + Makhana', savings: 150, price: 450 },
];

export default function GroceryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedSchedule, setSelectedSchedule] = useState<Set<string>>(new Set(['milk', 'curd', 'vegetables']));

  const toggleSchedule = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedSchedule(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#1E1456', '#7B2FA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
          <View style={st.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Smart Grocery 🛒</Text>
              <Text style={st.headerSub}>AI-powered grocery planning & savings</Text>
            </View>
            <Pressable
              style={({ pressed }) => [st.planBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/grocery-planner' as any); }}
            >
              <MaterialIcons name="auto-awesome" size={14} color="#1E1456" />
              <Text style={st.planBtnText}>Plan</Text>
            </Pressable>
          </View>
          <View style={st.savingsRow}>
            <MaterialIcons name="savings" size={14} color="#FDD85D" />
            <Text style={st.savingsText}>Save up to ₹1,800/month with smart planning</Text>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

          {/* ═══ Quick Actions ═══ */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={st.quickRow}>
            {[
              { id: 'plan', label: 'Plan Grocery', icon: 'event-note', route: '/grocery-planner', color: '#7B2FA0' },
              { id: 'cart', label: 'AI Cart', icon: 'smart-toy', route: '/grocery-cart', color: '#F5B731' },
              { id: 'split', label: 'Smart Split', icon: 'auto-awesome', route: '/smart-split', color: '#4ADE80' },
              { id: 'pantry', label: 'Pantry', icon: 'kitchen', route: '/smart-grocery', color: '#F04E50' },
            ].map((item, i) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [st.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}
                onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
              >
                <View style={[st.quickIcon, { backgroundColor: `${item.color}12` }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[st.quickLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* ═══ Provider Bundles ═══ */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ paddingTop: 20 }}>
            <View style={st.sectionHeader}>
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Monthly Grocery Bundles</Text>
              <Text style={[st.sectionSub, { color: colors.textMuted }]}>Curated by delivery partners</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {PROVIDER_BUNDLES.map((bundle, i) => (
                <Animated.View key={bundle.id} entering={FadeInRight.delay(120 + i * 60).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [st.bundleCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/grocery-cart' as any); }}
                  >
                    <View style={st.bundleTop}>
                      <View style={[st.bundleProviderBadge, { backgroundColor: `${bundle.color}12` }]}>
                        <Text style={{ fontSize: 14 }}>{bundle.emoji}</Text>
                        <Text style={[st.bundleProviderText, { color: bundle.color }]}>{bundle.provider}</Text>
                      </View>
                      <View style={[st.bundleBadge, { backgroundColor: `${bundle.color}15` }]}>
                        <Text style={[st.bundleBadgeText, { color: bundle.color }]}>{bundle.badge}</Text>
                      </View>
                    </View>
                    <Text style={[st.bundleName, { color: colors.textPrimary }]}>{bundle.name}</Text>
                    <View style={st.bundleCategories}>
                      {bundle.categories.slice(0, 4).map((cat, ci2) => (
                        <View key={ci2} style={[st.bundleCatChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                          <Text style={[st.bundleCatText, { color: colors.textMuted }]}>{cat}</Text>
                        </View>
                      ))}
                      {bundle.categories.length > 4 ? (
                        <Text style={[st.bundleMore, { color: colors.textMuted }]}>+{bundle.categories.length - 4}</Text>
                      ) : null}
                    </View>
                    <View style={st.bundleBottom}>
                      <View>
                        <Text style={[st.bundlePrice, { color: colors.textPrimary }]}>₹{bundle.price.toLocaleString()}<Text style={[st.bundlePer, { color: colors.textMuted }]}>/mo</Text></Text>
                      </View>
                      <View style={st.bundleSaveBadge}>
                        <MaterialIcons name="savings" size={10} color="#4ADE80" />
                        <Text style={st.bundleSaveText}>Save ₹{bundle.savings}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ Add-on Offers ═══ */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary, marginBottom: 10 }]}>Recommended Add-ons</Text>
            <View style={st.addonGrid}>
              {ADDON_OFFERS.map((offer, i) => (
                <Pressable
                  key={offer.id}
                  style={({ pressed }) => [st.addonCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <Text style={{ fontSize: 24 }}>{offer.emoji}</Text>
                  <Text style={[st.addonTitle, { color: colors.textPrimary }]}>{offer.title}</Text>
                  <Text style={[st.addonDesc, { color: colors.textMuted }]} numberOfLines={2}>{offer.desc}</Text>
                  <View style={st.addonBottom}>
                    <Text style={[st.addonPrice, { color: colors.textPrimary }]}>₹{offer.price}</Text>
                    <View style={st.addonSaveBadge}>
                      <Text style={st.addonSaveText}>-₹{offer.savings}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ═══ Scheduled Essentials ═══ */}
          <Animated.View entering={FadeInDown.delay(280).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={[st.scheduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={st.scheduleHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="event-repeat" size={18} color="#7B2FA0" />
                  <Text style={[st.scheduleTitle, { color: colors.textPrimary }]}>Scheduled Essentials</Text>
                </View>
                <Text style={[st.scheduleSub, { color: colors.textMuted }]}>Pre-schedule recurring daily groceries</Text>
              </View>

              <View style={st.scheduleGrid}>
                {ESSENTIALS.map((item) => {
                  const isActive = selectedSchedule.has(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        st.scheduleChip,
                        {
                          backgroundColor: isActive ? (isDark ? 'rgba(123,47,160,0.10)' : 'rgba(123,47,160,0.04)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          borderColor: isActive ? 'rgba(123,47,160,0.25)' : colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => toggleSchedule(item.id)}
                    >
                      <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.scheduleChipName, { color: isActive ? '#7B2FA0' : colors.textPrimary }]}>{item.name}</Text>
                        <Text style={[st.scheduleChipMeta, { color: colors.textMuted }]}>{item.freq} • {item.time}</Text>
                      </View>
                      {isActive ? (
                        <View style={st.scheduleActive}>
                          <MaterialIcons name="check" size={10} color="#FFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={({ pressed }) => [st.scheduleCta, pressed && { opacity: 0.85 }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <LinearGradient colors={['#7B2FA0', '#1E1456']} style={st.scheduleCtaGrad}>
                  <MaterialIcons name="event-repeat" size={16} color="#FFF" />
                  <Text style={st.scheduleCtaText}>Set Schedule ({selectedSchedule.size} items)</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* ═══ Local Kirana ═══ */}
          <Animated.View entering={FadeInDown.delay(340).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <View style={[st.kiranaCard, { backgroundColor: isDark ? 'rgba(255,140,66,0.04)' : 'rgba(255,140,66,0.02)', borderColor: 'rgba(255,140,66,0.18)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 26 }}>🏪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[st.kiranaTitle, { color: colors.textPrimary }]}>Support Local Kiranas</Text>
                  <Text style={[st.kiranaSub, { color: colors.textMuted }]}>Fresh veggies, daily essentials, no delivery fee</Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [st.kiranaCta, pressed && { opacity: 0.85 }]}>
                <MaterialIcons name="send" size={14} color="#FF8C42" />
                <Text style={st.kiranaCtaText}>Send List to Kirana</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5B731' },
  planBtnText: { fontSize: 13, fontWeight: '800', color: '#1E1456' },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(245,183,49,0.12)' },
  savingsText: { fontSize: 11, fontWeight: '700', color: '#FDD85D' },

  // Quick Actions
  quickRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  quickAction: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Section
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12, gap: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSub: { fontSize: 11, fontWeight: '500' },

  // Bundles
  bundleCard: { width: SCREEN_W * 0.68, padding: 14, borderRadius: 18, borderWidth: 1, gap: 8 },
  bundleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bundleProviderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bundleProviderText: { fontSize: 11, fontWeight: '700' },
  bundleBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  bundleBadgeText: { fontSize: 9, fontWeight: '700' },
  bundleName: { fontSize: 14, fontWeight: '800' },
  bundleCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bundleCatChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  bundleCatText: { fontSize: 9, fontWeight: '600' },
  bundleMore: { fontSize: 9, fontWeight: '600', alignSelf: 'center' },
  bundleBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  bundlePrice: { fontSize: 18, fontWeight: '900' },
  bundlePer: { fontSize: 11, fontWeight: '500' },
  bundleSaveBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(74,222,128,0.10)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  bundleSaveText: { fontSize: 10, fontWeight: '700', color: '#4ADE80' },

  // Add-ons
  addonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  addonCard: { width: (SCREEN_W - 42) / 2, padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  addonTitle: { fontSize: 13, fontWeight: '800' },
  addonDesc: { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  addonBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  addonPrice: { fontSize: 14, fontWeight: '900' },
  addonSaveBadge: { backgroundColor: 'rgba(74,222,128,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  addonSaveText: { fontSize: 9, fontWeight: '700', color: '#4ADE80' },

  // Schedule
  scheduleCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  scheduleHeader: { gap: 2 },
  scheduleTitle: { fontSize: 15, fontWeight: '800' },
  scheduleSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  scheduleGrid: { gap: 6 },
  scheduleChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  scheduleChipName: { fontSize: 13, fontWeight: '700' },
  scheduleChipMeta: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  scheduleActive: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#7B2FA0', alignItems: 'center', justifyContent: 'center' },
  scheduleCta: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  scheduleCtaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  scheduleCtaText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Kirana
  kiranaCard: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  kiranaTitle: { fontSize: 14, fontWeight: '800' },
  kiranaSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  kiranaCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,140,66,0.30)' },
  kiranaCtaText: { fontSize: 13, fontWeight: '700', color: '#FF8C42' },
});
