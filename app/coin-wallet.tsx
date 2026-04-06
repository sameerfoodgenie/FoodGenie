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
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '../hooks/useCoin';
import { useAuth } from '@/template';
import { useTheme } from '../hooks/useTheme';
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

function TransactionItem({ item, index, colors }: { item: coinService.CoinTransaction; index: number; colors: any }) {
  const info = REASON_LABELS[item.reason] || { label: item.reason, icon: '🪙' };
  const isEarn = item.type === 'earn';

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <View style={[styles.txItem, { borderBottomColor: colors.border }]}>
        <View style={[styles.txIcon, isEarn ? { backgroundColor: 'rgba(34,197,94,0.10)' } : { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
          <Text style={styles.txIconEmoji}>{info.icon}</Text>
        </View>
        <View style={styles.txContent}>
          <Text style={[styles.txLabel, { color: colors.textPrimary }]}>{info.label}</Text>
          <Text style={[styles.txTime, { color: colors.textMuted }]}>{formatTimeAgo(item.created_at)}</Text>
        </View>
        <Text style={[styles.txAmount, isEarn ? { color: '#22C55E' } : { color: '#EF4444' }]}>
          {isEarn ? '+' : '-'}{item.amount}
        </Text>
      </View>
    </Animated.View>
  );
}

function EarnCard({ emoji, label, coins, onPress, delay, colors }: {
  emoji: string; label: string; coins: string; onPress: () => void; delay: number; colors: any;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
      <Pressable
        style={({ pressed }) => [styles.earnCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
      >
        <View style={styles.earnCardIcon}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <View style={styles.earnCardText}>
          <Text style={[styles.earnCardLabel, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={styles.earnCardCoins}>{coins}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function CoinWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { balance, totalEarned, totalSpent, currentStreak, maxStreak, refreshWallet, generateReferral, referralCode } = useCoin();
  const [activeTab, setActiveTab] = useState<'all' | 'earn' | 'spend'>('all');
  const [transactions, setTransactions] = useState<coinService.CoinTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const coinScale = useSharedValue(1);
  useEffect(() => {
    coinScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
  }, []);
  const coinAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinScale.value }] }));

  const todayEarned = transactions
    .filter(t => t.type === 'earn' && new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.amount, 0);

  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;
    setTxLoading(true);
    const type = activeTab === 'all' ? undefined : activeTab;
    const result = await coinService.getTransactions(user.id, type, 50);
    setTransactions(result.data);
    setTxLoading(false);
  }, [user?.id, activeTab]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWallet();
    await loadTransactions();
    setRefreshing(false);
  }, [refreshWallet, loadTransactions]);

  const handleShareReferral = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let code = referralCode;
    if (!code) { code = await generateReferral(); }
    if (code) {
      Share.share({
        message: `Join me on FoodGenie and earn 100 Genie Coins! Use my referral code: ${code}\n\nDownload: https://foodgenie.in`,
      });
    }
  }, [referralCode, generateReferral]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => <TransactionItem item={item} index={index} colors={colors} />}
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
                  style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                  onPress={() => { Haptics.selectionAsync(); router.back(); }}
                >
                  <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Genie Wallet</Text>
                <Pressable
                  style={({ pressed }) => [styles.leaderboardBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/coin-leaderboard'); }}
                >
                  <MaterialIcons name="leaderboard" size={20} color="#D4AF37" />
                </Pressable>
              </View>

              {/* Hero Balance */}
              <Animated.View entering={FadeIn.duration(600)} style={styles.heroSection}>
                <LinearGradient
                  colors={['#FFF8E1', '#FFECB3', '#FDF8F0']}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroCenter}>
                    <View style={styles.glowRing} />
                    <Animated.View style={coinAnimStyle}>
                      <Image source={require('../assets/images/genie-coin.png')} style={styles.heroCoin} contentFit="contain" />
                    </Animated.View>
                  </View>
                  <Text style={styles.heroLabel}>Total Balance</Text>
                  <Text style={styles.heroBalance}>{balance.toLocaleString()}</Text>
                  <Text style={styles.heroSubLabel}>Genie Coins</Text>

                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <View style={[styles.heroStatDot, { backgroundColor: '#22C55E' }]} />
                      <View>
                        <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{todayEarned}</Text>
                        <Text style={styles.heroStatLabel}>Earned Today</Text>
                      </View>
                    </View>
                    <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(212,175,55,0.20)' }]} />
                    <View style={styles.heroStat}>
                      <View style={[styles.heroStatDot, { backgroundColor: '#D4AF37' }]} />
                      <View>
                        <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{totalEarned.toLocaleString()}</Text>
                        <Text style={styles.heroStatLabel}>Total Earned</Text>
                      </View>
                    </View>
                    <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(212,175,55,0.20)' }]} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatEmoji}>🔥</Text>
                      <View>
                        <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{currentStreak}</Text>
                        <Text style={styles.heroStatLabel}>Day Streak</Text>
                      </View>
                    </View>
                  </View>

                  {currentStreak > 0 ? (
                    <View style={styles.streakBar}>
                      <Text style={styles.streakBarText}>
                        {currentStreak < 3 ? `🔥 ${3 - currentStreak} days to 3-day bonus (+10)` :
                         currentStreak < 7 ? `🔥 ${7 - currentStreak} days to 7-day bonus (+25)` :
                         currentStreak < 14 ? `🔥 ${14 - currentStreak} days to 14-day bonus (+50)` :
                         currentStreak < 30 ? `🔥 ${30 - currentStreak} days to 30-day bonus (+100)` :
                         `🏆 Max streak: ${maxStreak} days! Legend!`}
                      </Text>
                    </View>
                  ) : null}
                </LinearGradient>
              </Animated.View>

              {/* Quick Actions */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.quickActions}>
                {[
                  { emoji: '🎁', label: 'Redeem', route: '/coin-redeem', color: 'rgba(212,175,55,0.12)' },
                  { emoji: '🔗', label: 'Refer', route: null, color: 'rgba(34,197,94,0.10)' },
                  { emoji: '🏆', label: 'Leaderboard', route: '/coin-leaderboard', color: 'rgba(239,68,68,0.08)' },
                ].map((action) => (
                  <Pressable
                    key={action.label}
                    style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (action.route) router.push(action.route as any);
                      else handleShareReferral();
                    }}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                      <Text style={{ fontSize: 22 }}>{action.emoji}</Text>
                    </View>
                    <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
                  </Pressable>
                ))}
              </Animated.View>

              {/* Earn More */}
              <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.earnSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Earn More Coins</Text>
                  <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>DAILY</Text></View>
                </View>
                <EarnCard emoji="📸" label="Post a meal" coins="+20 coins" onPress={() => router.push('/(tabs)/camera')} delay={200} colors={colors} />
                <EarnCard emoji="📤" label="Share a post" coins="+10 coins" onPress={() => router.push('/explore')} delay={240} colors={colors} />
                <EarnCard emoji="👤" label="Follow creators" coins="+5 coins" onPress={() => router.push('/explore')} delay={280} colors={colors} />
                <EarnCard emoji="🔗" label="Invite a friend" coins="+50 coins" onPress={handleShareReferral} delay={320} colors={colors} />
              </Animated.View>

              {/* Earning Rules */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.rulesSection}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How to Earn</Text>
                <View style={styles.rulesGrid}>
                  {Object.entries(COIN_RULES).filter(([k]) => !k.startsWith('streak_bonus')).map(([key, rule]) => (
                    <View key={key} style={[styles.ruleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={styles.ruleIcon}>{rule.icon}</Text>
                      <Text style={[styles.ruleLabel, { color: colors.textSecondary }]} numberOfLines={1}>{rule.label}</Text>
                      <View style={styles.ruleAmountBadge}>
                        <Text style={styles.ruleAmount}>+{rule.amount}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* Referral */}
              {referralCode ? (
                <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.referralSection}>
                  <View style={[styles.referralCard, { backgroundColor: colors.surface, borderColor: 'rgba(212,175,55,0.20)' }]}>
                    <View style={styles.referralLeft}>
                      <Text style={[styles.referralTitle, { color: colors.textMuted }]}>Your Referral Code</Text>
                      <Text style={styles.referralCode}>{referralCode}</Text>
                      <Text style={[styles.referralHint, { color: colors.textMuted }]}>Share and earn 50 coins per invite</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.shareRefBtn, pressed && { opacity: 0.8 }]}
                      onPress={handleShareReferral}
                    >
                      <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.shareRefBtnGrad}>
                        <MaterialIcons name="share" size={20} color="#FFF" />
                      </LinearGradient>
                    </Pressable>
                  </View>
                </Animated.View>
              ) : null}

              {/* Transactions Header */}
              <View style={styles.txHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>History</Text>
                <View style={styles.txTabs}>
                  {(['all', 'earn', 'spend'] as const).map(tab => (
                    <Pressable
                      key={tab}
                      style={[styles.txTab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === tab && styles.txTabActive]}
                      onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
                    >
                      <Text style={[styles.txTabText, { color: colors.textMuted }, activeTab === tab && styles.txTabTextActive]}>
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
              <Text style={[styles.emptyTxTitle, { color: colors.textPrimary }]}>No transactions yet</Text>
              <Text style={[styles.emptyTxSub, { color: colors.textMuted }]}>Start earning coins by posting meals!</Text>
              <Pressable
                style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/(tabs)/camera')}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.emptyCtaGrad}>
                  <Text style={styles.emptyCtaText}>Post Your First Meal</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </View>
          }
        />
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
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  leaderboardBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },

  heroSection: { paddingHorizontal: 16, marginBottom: 4 },
  heroGradient: {
    borderRadius: 28, paddingVertical: 32, paddingHorizontal: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    overflow: 'hidden',
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  heroCenter: { position: 'relative', marginBottom: 16 },
  glowRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,215,0,0.18)', top: -20, left: -20,
  },
  heroCoin: { width: 80, height: 80 },
  heroLabel: { fontSize: 13, fontWeight: '600', color: '#8B6914', letterSpacing: 1.5, textTransform: 'uppercase' },
  heroBalance: { fontSize: 56, fontWeight: '900', color: '#8B6914', letterSpacing: -2, marginTop: 2 },
  heroSubLabel: { fontSize: 14, fontWeight: '600', color: '#A67C00', marginTop: -2, marginBottom: 20 },

  heroStats: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatDot: { width: 8, height: 8, borderRadius: 4 },
  heroStatEmoji: { fontSize: 16 },
  heroStatValue: { fontSize: 18, fontWeight: '800' },
  heroStatLabel: { fontSize: 10, fontWeight: '600', color: '#8B6914', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 36 },

  streakBar: {
    marginTop: 18, width: '100%', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  streakBarText: { fontSize: 12, fontWeight: '700', color: '#8B6914', textAlign: 'center' },

  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 20, marginBottom: 4 },
  quickAction: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 18, borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 12, fontWeight: '700' },

  earnSection: { paddingHorizontal: 16, marginTop: 24, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  sectionBadgeText: { fontSize: 10, fontWeight: '800', color: '#8B6914', letterSpacing: 0.8 },

  earnCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  earnCardIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  earnCardText: { flex: 1, gap: 2 },
  earnCardLabel: { fontSize: 14, fontWeight: '600' },
  earnCardCoins: { fontSize: 12, fontWeight: '800', color: '#D4AF37' },

  rulesSection: { paddingHorizontal: 16, marginTop: 24 },
  rulesGrid: { gap: 6, marginTop: 10 },
  ruleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1,
  },
  ruleIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  ruleLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  ruleAmountBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  ruleAmount: { fontSize: 14, fontWeight: '800', color: '#D4AF37' },

  referralSection: { paddingHorizontal: 16, marginTop: 22 },
  referralCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18, borderRadius: 20, borderWidth: 1,
  },
  referralLeft: { gap: 4, flex: 1 },
  referralTitle: { fontSize: 12, fontWeight: '600' },
  referralCode: { fontSize: 22, fontWeight: '900', color: '#D4AF37', letterSpacing: 2 },
  referralHint: { fontSize: 11, fontWeight: '500' },
  shareRefBtn: { borderRadius: 24, overflow: 'hidden' },
  shareRefBtnGrad: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  txHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 28, marginBottom: 14,
  },
  txTabs: { flexDirection: 'row', gap: 4 },
  txTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1,
  },
  txTabActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.25)' },
  txTabText: { fontSize: 12, fontWeight: '700' },
  txTabTextActive: { color: '#D4AF37' },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  txIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txIconEmoji: { fontSize: 18 },
  txContent: { flex: 1, gap: 2 },
  txLabel: { fontSize: 14, fontWeight: '600' },
  txTime: { fontSize: 12, fontWeight: '500' },
  txAmount: { fontSize: 16, fontWeight: '800' },

  emptyTx: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTxIcon: { fontSize: 44 },
  emptyTxTitle: { fontSize: 17, fontWeight: '700' },
  emptyTxSub: { fontSize: 13 },
  emptyCta: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  emptyCtaGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
  },
  emptyCtaText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
