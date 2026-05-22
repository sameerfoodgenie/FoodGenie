import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '../hooks/useCoin';
import { useAlert } from '@/template';
import { useTheme } from '../hooks/useTheme';
import { REDEEM_CATEGORIES } from '../services/coinService';

export default function CoinRedeemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, spendCoins, refreshWallet } = useCoin();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(REDEEM_CATEGORIES[0].id);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const activeCategory = REDEEM_CATEGORIES.find(c => c.id === selectedCategory) || REDEEM_CATEGORIES[0];

  const handleRedeem = useCallback(async (item: { id: string; name: string; coins: number }) => {
    if (balance < item.coins) {
      showAlert('Insufficient Coins', `You need ${item.coins - balance} more coins to redeem this.`);
      return;
    }
    showAlert('Confirm Redeem', `Spend ${item.coins} Genie Coins for "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setRedeeming(item.id);
          const success = await spendCoins(item.coins, 'redeem', { item_id: item.id, item_name: item.name });
          setRedeeming(null);
          if (success) {
            await refreshWallet();
            showAlert('Redeemed!', `You have redeemed "${item.name}". Check your email for details.`);
          } else {
            showAlert('Error', 'Failed to redeem. Please try again.');
          }
        },
      },
    ]);
  }, [balance, spendCoins, showAlert, refreshWallet]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Rewards Store</Text>
          <View style={styles.balancePill}>
            <Image source={require('../assets/images/genie-coin.png')} style={styles.pillCoin} contentFit="contain" />
            <Text style={styles.pillBalance}>{balance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Category Tabs */}
        <Animated.View entering={FadeIn.duration(300)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabs}>
            {REDEEM_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryTab, { backgroundColor: colors.surface, borderColor: colors.border },
                    isActive && { borderColor: `${cat.color}50`, backgroundColor: `${cat.color}10` },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat.id); }}
                >
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                  <Text style={[styles.categoryLabel, { color: colors.textSecondary }, isActive && { color: cat.color }]}>{cat.title}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Category Hero */}
        <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.catHero}>
          <LinearGradient
            colors={[`${activeCategory.color}12`, `${activeCategory.color}06`, colors.background]}
            style={styles.catHeroGrad}
          >
            <Text style={styles.catHeroEmoji}>{activeCategory.icon}</Text>
            <View>
              <Text style={[styles.catHeroTitle, { color: colors.textPrimary }]}>{activeCategory.title}</Text>
              <Text style={[styles.catHeroSub, { color: colors.textMuted }]}>{activeCategory.items.length} rewards available</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Items */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.itemsList, { paddingBottom: insets.bottom + 40 }]}
        >
          {activeCategory.items.map((item, i) => {
            const canAfford = balance >= item.coins;
            const isRedeeming = redeeming === item.id;
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(80 + i * 60).duration(400)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.redeemCard, { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && canAfford && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                    !canAfford && styles.redeemCardDisabled,
                  ]}
                  onPress={() => handleRedeem(item)}
                  disabled={isRedeeming}
                >
                  <View style={styles.redeemTop}>
                    <View style={[styles.redeemEmoji, { backgroundColor: `${activeCategory.color}10` }]}>
                      <Text style={{ fontSize: 36 }}>{item.image}</Text>
                    </View>
                    <View style={styles.redeemInfo}>
                      <Text style={[styles.redeemName, { color: colors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.redeemDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                      <View style={styles.redeemPriceRow}>
                        <Image source={require('../assets/images/genie-coin.png')} style={styles.redeemCoinImg} contentFit="contain" />
                        <Text style={[styles.redeemCoinText, !canAfford && { color: colors.textMuted }]}>{item.coins}</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.redeemBtn, !canAfford && styles.redeemBtnLocked]}
                    onPress={() => handleRedeem(item)}
                    disabled={isRedeeming || !canAfford}
                  >
                    {canAfford ? (
                      <LinearGradient colors={['#F5B731', '#FDD85D']} style={styles.redeemBtnGrad}>
                        <Text style={styles.redeemBtnText}>Redeem Now</Text>
                        <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                      </LinearGradient>
                    ) : (
                      <View style={[styles.redeemBtnGrad, { backgroundColor: colors.backgroundTertiary }]}>
                        <MaterialIcons name="lock" size={14} color={colors.textMuted} />
                        <Text style={[styles.redeemBtnText, { color: colors.textMuted }]}>
                          Need {item.coins - balance} more
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.10)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  pillCoin: { width: 20, height: 20 },
  pillBalance: { fontSize: 14, fontWeight: '800', color: '#F5B731' },

  categoryTabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5,
  },
  categoryEmoji: { fontSize: 18 },
  categoryLabel: { fontSize: 13, fontWeight: '700' },

  catHero: { paddingHorizontal: 16, marginTop: 8 },
  catHeroGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 18, borderRadius: 20,
  },
  catHeroEmoji: { fontSize: 36 },
  catHeroTitle: { fontSize: 22, fontWeight: '900' },
  catHeroSub: { fontSize: 13, fontWeight: '500' },

  itemsList: { paddingHorizontal: 16, gap: 14, paddingTop: 14 },

  redeemCard: {
    padding: 18, borderRadius: 22, borderWidth: 1, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  redeemCardDisabled: { opacity: 0.6 },
  redeemTop: { flexDirection: 'row', gap: 14 },
  redeemEmoji: {
    width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  redeemInfo: { flex: 1, gap: 4 },
  redeemName: { fontSize: 16, fontWeight: '700' },
  redeemDesc: { fontSize: 12, fontWeight: '500' },
  redeemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  redeemCoinImg: { width: 18, height: 18 },
  redeemCoinText: { fontSize: 16, fontWeight: '800', color: '#F5B731' },

  redeemBtn: { borderRadius: 16, overflow: 'hidden' },
  redeemBtnLocked: {},
  redeemBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 16,
  },
  redeemBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
