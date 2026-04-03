import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Share,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '../hooks/useCoin';
import { useAuth } from '@/template';
import * as coinService from '../services/coinService';
import { COIN_RULES } from '../services/coinService';

const { width: SCREEN_W } = Dimensions.get('window');

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  post_food: { label: 'Posted a meal', icon: '📸' },
  share_post: { label: 'Shared a post', icon: '📤' },
  like_post: { label: 'Liked a post', icon: '❤️' },
  watch_reel: { label: 'Watched a reel', icon: '👀' },
  follow_creator: { label: 'Followed a creator', icon: '👤' },
  daily_login: { label: 'Daily login bonus', icon: '📅' },
  refer_user: { label: 'Referred a friend', icon: '🔗' },
  referral_signup: { label: 'Referral joined', icon: '🎉' },
  streak_bonus_3: { label: '3-day streak bonus', icon: '🔥' },
  streak_bonus_7: { label: '7-day streak bonus', icon: '🔥' },
  streak_bonus_14: { label: '14-day streak bonus', icon: '🔥' },
  streak_bonus_30: { label: '30-day streak bonus', icon: '🔥' },
  redeem: { label: 'Redeemed reward', icon: '🎁' },
};

function TransactionItem({ item }: { item: coinService.CoinTransaction }) {
  const info = REASON_LABELS[item.reason] || { label: item.reason, icon: '🪙' };
  const isEarn = item.type === 'earn';

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, isEarn ? styles.txIconEarn : styles.txIconSpend]}>
        <Text style={styles.txIconEmoji}>{info.icon}</Text>
      </View>
      <View style={styles.txContent}>
        <Text style={styles.txLabel}>{info.label}</Text>
        <Text style={styles.txTime}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      <Text style={[styles.txAmount, isEarn ? styles.txAmountEarn : styles.txAmountSpend]}>
        {isEarn ? '+' : '-'}{item.amount}
      </Text>
    </View>
  );
}

export default function CoinWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { balance, totalEarned, totalSpent, currentStreak, maxStreak, refreshWallet, generateReferral, referralCode } = useCoin();
  const [activeTab, setActiveTab] = useState<'all' | 'earn' | 'spend'>('all');
  const [transactions, setTransactions] = useState<coinService.CoinTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Coin rotation animation
  const coinRotate = useSharedValue(0);
  useEffect(() => {
    coinRotate.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${coinRotate.value}deg` }],
  }));

  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;
    setTxLoading(true);
    const type = activeTab === 'all' ? undefined : activeTab;
    const result = await coinService.getTransactions(user.id, type, 50);
    setTransactions(result.data);
    setTxLoading(false);
  }, [user?.id, activeTab]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWallet();
    await loadTransactions();
    setRefreshing(false);
  }, [refreshWallet, loadTransactions]);

  const handleShareReferral = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let code = referralCode;
    if (!code) {
      code = await generateReferral();
    }
    if (code) {
      Share.share({
        message: `Join me on FoodGenie and earn 100 Genie Coins! Use my referral code: ${code}\n\nDownload: https://foodgenie.in`,
      });
    }
  }, [referralCode, generateReferral]);


  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />
          }
          ListHeaderComponent={
            <View>
              {/* Header */}
              <View style={styles.header}>
                <Pressable
                  style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { Haptics.selectionAsync(); router.back(); }}
                >
                  <MaterialIcons name="arrow-back" size={22} color="#FFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Genie Coins</Text>
                <Pressable
                  style={({ pressed }) => [styles.leaderboardBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/coin-leaderboard'); }}
                >
                  <MaterialIcons name="leaderboard" size={20} color="#FFD700" />
                </Pressable>
              </View>

              {/* Balance Card */}
              <Animated.View entering={FadeIn.duration(500)}>
                <LinearGradient colors={['#1A1A2E', '#0A0A0F']} style={styles.balanceCard}>
                  <View style={styles.balanceTop}>
                    <Animated.View style={coinStyle}>
                      <Image
                        source={require('../assets/images/genie-coin.png')}
                        style={styles.balanceCoinImg}
                        contentFit="contain"
                      />
                    </Animated.View>
                    <View style={styles.balanceTextBlock}>
                      <Text style={styles.balanceLabel}>Total Balance</Text>
                      <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>

                    </View>
                  </View>

                  <View style={styles.balanceStats}>
                    <View style={styles.balanceStat}>
                      <MaterialIcons name="arrow-upward" size={16} color="#4ADE80" />
                      <Text style={styles.balanceStatValue}>{totalEarned.toLocaleString()}</Text>
                      <Text style={styles.balanceStatLabel}>Earned</Text>
                    </View>
                    <View style={styles.balanceStatDivider} />
                    <View style={styles.balanceStat}>
                      <MaterialIcons name="arrow-downward" size={16} color="#FF6B6B" />
                      <Text style={styles.balanceStatValue}>{totalSpent.toLocaleString()}</Text>
                      <Text style={styles.balanceStatLabel}>Spent</Text>
                    </View>
                    <View style={styles.balanceStatDivider} />
                    <View style={styles.balanceStat}>
                      <Text style={styles.streakEmoji}>🔥</Text>
                      <Text style={styles.balanceStatValue}>{currentStreak}</Text>
                      <Text style={styles.balanceStatLabel}>Day Streak</Text>
                    </View>
                  </View>

                  {/* Streak bonus info */}
                  {currentStreak > 0 ? (
                    <View style={styles.streakBonusBar}>
                      <Text style={styles.streakBonusText}>
                        {currentStreak < 3 ? `${3 - currentStreak} days to 🔥 3-day bonus (+10)` :
                         currentStreak < 7 ? `${7 - currentStreak} days to 🔥 7-day bonus (+25)` :
                         currentStreak < 14 ? `${14 - currentStreak} days to 🔥 14-day bonus (+50)` :
                         currentStreak < 30 ? `${30 - currentStreak} days to 🔥 30-day bonus (+100)` :
                         `Max streak: ${maxStreak} days! Keep going!`}
                      </Text>
                    </View>
                  ) : null}
                </LinearGradient>
              </Animated.View>

              {/* Quick Actions */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.quickActions}>
                <Pressable
                  style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/coin-redeem'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(212,175,55,0.10)' }]}>
                    <Text style={{ fontSize: 22 }}>🎁</Text>
                  </View>
                  <Text style={styles.quickActionLabel}>Redeem</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
                  onPress={handleShareReferral}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(74,222,128,0.10)' }]}>
                    <Text style={{ fontSize: 22 }}>🔗</Text>
                  </View>
                  <Text style={styles.quickActionLabel}>Refer</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/coin-leaderboard'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255,107,107,0.10)' }]}>
                    <Text style={{ fontSize: 22 }}>🏆</Text>
                  </View>
                  <Text style={styles.quickActionLabel}>Leaderboard</Text>
                </Pressable>
              </Animated.View>

              {/* Earning Rules */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.rulesSection}>
                <Text style={styles.rulesTitle}>How to Earn</Text>
                <View style={styles.rulesGrid}>
                  {Object.entries(COIN_RULES).filter(([k]) => !k.startsWith('streak_bonus')).map(([key, rule]) => (
                    <View key={key} style={styles.ruleItem}>
                      <Text style={styles.ruleIcon}>{rule.icon}</Text>
                      <Text style={styles.ruleLabel} numberOfLines={1}>{rule.label}</Text>
                      <Text style={styles.ruleAmount}>+{rule.amount}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* Referral Code */}
              {referralCode ? (
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.referralSection}>
                  <View style={styles.referralCard}>
                    <View style={styles.referralLeft}>
                      <Text style={styles.referralTitle}>Your Referral Code</Text>
                      <Text style={styles.referralCode}>{referralCode}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.shareRefBtn, pressed && { opacity: 0.8 }]}
                      onPress={handleShareReferral}
                    >
                      <MaterialIcons name="share" size={18} color="#FFF" />
                    </Pressable>
                  </View>
                </Animated.View>
              ) : null}

              {/* Transactions Header */}
              <View style={styles.txHeader}>
                <Text style={styles.txHeaderTitle}>History</Text>
                <View style={styles.txTabs}>
                  {(['all', 'earn', 'spend'] as const).map(tab => (
                    <Pressable
                      key={tab}
                      style={[styles.txTab, activeTab === tab && styles.txTabActive]}
                      onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
                    >
                      <Text style={[styles.txTabText, activeTab === tab && styles.txTabTextActive]}>
                        {tab === 'all' ? 'All' : tab === 'earn' ? 'Earned' : 'Spent'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxIcon}>🪙</Text>
              <Text style={styles.emptyTxTitle}>No transactions yet</Text>
              <Text style={styles.emptyTxSub}>Start earning coins by posting meals!</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A2E',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  leaderboardBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },

  // Balance card
  balanceCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.25)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  balanceCoinImg: { width: 72, height: 72 },
  balanceTextBlock: { flex: 1, gap: 2 },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.50)' },
  balanceValue: { fontSize: 42, fontWeight: '900', color: '#FFD700', letterSpacing: -1 },

  balanceStats: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceStat: { alignItems: 'center', gap: 4 },
  balanceStatValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  balanceStatLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.40)' },
  balanceStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  streakEmoji: { fontSize: 16 },

  streakBonusBar: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  streakBonusText: { fontSize: 12, fontWeight: '600', color: '#D4AF37', textAlign: 'center' },

  // Quick actions
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 20 },
  quickAction: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 18, borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 12, fontWeight: '700', color: '#1A1A2E' },

  // Rules
  rulesSection: { paddingHorizontal: 16, marginTop: 24 },
  rulesTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  rulesGrid: { gap: 6 },
  ruleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: '#F8F8FA',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  ruleIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  ruleLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  ruleAmount: { fontSize: 15, fontWeight: '800', color: '#D4AF37' },

  // Referral
  referralSection: { paddingHorizontal: 16, marginTop: 20 },
  referralCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 18, backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)',
  },
  referralLeft: { gap: 4 },
  referralTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  referralCode: { fontSize: 20, fontWeight: '900', color: '#D4AF37', letterSpacing: 2 },
  shareRefBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center',
  },

  // Transactions
  txHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 28, marginBottom: 12,
  },
  txHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  txTabs: { flexDirection: 'row', gap: 4 },
  txTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 14, backgroundColor: '#F4F4F8',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  txTabActive: { backgroundColor: 'rgba(212,175,55,0.10)', borderColor: 'rgba(212,175,55,0.20)' },
  txTabText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  txTabTextActive: { color: '#D4AF37' },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  txIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txIconEarn: { backgroundColor: 'rgba(74,222,128,0.08)' },
  txIconSpend: { backgroundColor: 'rgba(255,107,107,0.08)' },
  txIconEmoji: { fontSize: 18 },
  txContent: { flex: 1, gap: 2 },
  txLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  txTime: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txAmountEarn: { color: '#4ADE80' },
  txAmountSpend: { color: '#FF6B6B' },

  emptyTx: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyTxIcon: { fontSize: 40 },
  emptyTxTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  emptyTxSub: { fontSize: 13, color: '#9CA3AF' },
});
