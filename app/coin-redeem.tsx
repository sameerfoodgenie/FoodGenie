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
import { REDEEM_CATEGORIES } from '../services/coinService';

export default function CoinRedeemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, spendCoins, refreshWallet } = useCoin();
  const { showAlert } = useAlert();
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
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#1A1A2E" />
          </Pressable>
          <Text style={styles.headerTitle}>Redeem Rewards</Text>
          <View style={styles.balancePill}>
            <Image source={require('../assets/images/genie-coin.png')} style={styles.pillCoin} contentFit="contain" />
            <Text style={styles.pillBalance}>{balance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Category Tabs */}
        <Animated.View entering={FadeIn.duration(300)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {REDEEM_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryTab, isActive && { borderColor: `${cat.color}40`, backgroundColor: `${cat.color}08` }]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat.id); }}
                >
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                  <Text style={[styles.categoryLabel, isActive && { color: cat.color }]}>{cat.title}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Category Header */}
        <View style={styles.catHeader}>
          <Text style={styles.catHeaderEmoji}>{activeCategory.icon}</Text>
          <Text style={styles.catHeaderTitle}>{activeCategory.title}</Text>
        </View>

        {/* Items */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.itemsList, { paddingBottom: insets.bottom + 40 }]}
        >
          {activeCategory.items.map((item, i) => {
            const canAfford = balance >= item.coins;
            const isRedeeming = redeeming === item.id;
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.redeemCard,
                    pressed && canAfford && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                    !canAfford && styles.redeemCardDisabled,
                  ]}
                  onPress={() => handleRedeem(item)}
                  disabled={isRedeeming}
                >
                  <View style={styles.redeemLeft}>
                    <View style={[styles.redeemEmoji, { backgroundColor: `${activeCategory.color}10` }]}>
                      <Text style={{ fontSize: 32 }}>{item.image}</Text>
                    </View>
                    <View style={styles.redeemInfo}>
                      <Text style={styles.redeemName}>{item.name}</Text>
                      <Text style={styles.redeemDesc}>{item.desc}</Text>
                    </View>
                  </View>

                  <View style={styles.redeemRight}>
                    <View style={styles.redeemCoins}>
                      <Image source={require('../assets/images/genie-coin.png')} style={styles.redeemCoinImg} contentFit="contain" />
                      <Text style={[styles.redeemCoinText, !canAfford && { color: '#9CA3AF' }]}>{item.coins}</Text>
                    </View>
                    <Pressable
                      style={[
                        styles.redeemBtn,
                        canAfford ? styles.redeemBtnActive : styles.redeemBtnDisabled,
                      ]}
                      onPress={() => handleRedeem(item)}
                      disabled={isRedeeming || !canAfford}
                    >
                      {canAfford ? (
                        <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.redeemBtnGrad}>
                          <Text style={styles.redeemBtnText}>Redeem</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.redeemBtnGrad}>
                          <MaterialIcons name="lock" size={14} color="#9CA3AF" />
                          <Text style={[styles.redeemBtnText, { color: '#9CA3AF' }]}>Locked</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Conversion info */}
          <View style={styles.conversionCard}>
            <MaterialIcons name="info-outline" size={18} color="#D4AF37" />
            <Text style={styles.conversionText}>100 Genie Coins = ₹10 value</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F4F4F8',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  pillCoin: { width: 20, height: 20 },
  pillBalance: { fontSize: 14, fontWeight: '800', color: '#D4AF37' },

  categoryTabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 16, backgroundColor: '#F8F8FA',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  categoryEmoji: { fontSize: 18 },
  categoryLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },

  catHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  catHeaderEmoji: { fontSize: 24 },
  catHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },

  itemsList: { paddingHorizontal: 16, gap: 12 },

  redeemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  redeemCardDisabled: { opacity: 0.65 },
  redeemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  redeemEmoji: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  redeemInfo: { flex: 1, gap: 3 },
  redeemName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  redeemDesc: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },

  redeemRight: { alignItems: 'flex-end', gap: 8, marginLeft: 8 },
  redeemCoins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  redeemCoinImg: { width: 18, height: 18 },
  redeemCoinText: { fontSize: 15, fontWeight: '800', color: '#D4AF37' },

  redeemBtn: { borderRadius: 14, overflow: 'hidden' },
  redeemBtnActive: {},
  redeemBtnDisabled: {},
  redeemBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14,
    backgroundColor: '#F4F4F8',
  },
  redeemBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  conversionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 16, paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: 16, backgroundColor: 'rgba(212,175,55,0.05)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.12)',
    justifyContent: 'center',
  },
  conversionText: { fontSize: 14, fontWeight: '600', color: '#D4AF37' },
});
