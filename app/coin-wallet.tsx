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
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '../hooks/useCoin';
import { useAuth } from '@/template';
import * as coinService from '../services/coinService';
import { COIN_RULES } from '../services/coinService';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Luxury palette ──
const LUX = {
  bg: '#0A0A0F',
  bgCard: '#111118',
  bgSurface: '#16161F',
  bgElevated: '#1C1C28',
  gold: '#D4AF37',
  goldLight: '#FFD700',
  goldMuted: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.25)',
  goldText: '#FFD700',
  white: '#F0F0F5',
  whiteMuted: 'rgba(255,255,255,0.55)',
  whiteFaint: 'rgba(255,255,255,0.30)',
  green: '#4ADE80',
  greenBg: 'rgba(74,222,128,0.10)',
  red: '#FF6B6B',
  redBg: 'rgba(255,107,107,0.10)',
  border: 'rgba(255,255,255,0.06)',
};

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

function TransactionItem({ item, index }: { item: coinService.CoinTransaction; index: number }) {
  const info = REASON_LABELS[item.reason] || { label: item.reason, icon: '🪙' };
  const isEarn = item.type === 'earn';

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
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
    </Animated.View>
  );
}

// ── Earn More Card ──
function EarnCard({ emoji, label, coins, onPress, delay }: {
  emoji: string; label: string; coins: string; onPress: () => void; delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
      <Pressable
        style={({ pressed }) => [styles.earnCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
      >
        <View style={styles.earnCardIcon}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <View style={styles.earnCardText}>
          <Text style={styles.earnCardLabel}>{label}</Text>
          <Text style={styles.earnCardCoins}>{coins}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={LUX.whiteFaint} />
      </Pressable>
    </Animated.View>
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

  // Animated coin glow
  const glowOpacity = useSharedValue(0.15);
  const coinScale = useSharedValue(1);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.45, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
    coinScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const coinAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinScale.value }] }));

  // Today's earned
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
    if (!code) { code = await generateReferral(); }
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
          renderItem={({ item, index }) => <TransactionItem item={item} index={index} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={LUX.goldLight} colors={[LUX.goldLight]} />
          }
          ListHeaderComponent={
            <View>
              {/* ═══ Header ═══ */}
              <View style={[styles.header, { paddingTop: 4 }]}>
                <Pressable
                  style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { Haptics.selectionAsync(); router.back(); }}
                >
                  <MaterialIcons name="arrow-back" size={22} color={LUX.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Genie Wallet</Text>
                <Pressable
                  style={({ pressed }) => [styles.leaderboardBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/coin-leaderboard'); }}
                >
                  <MaterialIcons name="leaderboard" size={20} color={LUX.goldLight} />
                </Pressable>
              </View>

              {/* ═══ Hero Balance ═══ */}
              <Animated.View entering={FadeIn.duration(600)} style={styles.heroSection}>
                <LinearGradient
                  colors={['#1A1510', '#0F0F14', '#0A0A0F']}
                  style={styles.heroGradient}
                >
                  {/* Glow ring behind coin */}
                  <View style={styles.heroCenter}>
                    <Animated.View style={[styles.glowRing, glowStyle]} />
                    <Animated.View style={coinAnimStyle}>
                      <Image
                        source={require('../assets/images/genie-coin.png')}
                        style={styles.heroCoin}
                        contentFit="contain"
                      />
                    </Animated.View>
                  </View>
                  <Text style={styles.heroLabel}>Total Balance</Text>
                  <Text style={styles.heroBalance}>{balance.toLocaleString()}</Text>
                  <Text style={styles.heroSubLabel}>Genie Coins</Text>

                  {/* Stats row */}
                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <View style={[styles.heroStatDot, { backgroundColor: LUX.green }]} />
                      <View>
                        <Text style={styles.heroStatValue}>{todayEarned}</Text>
                        <Text style={styles.heroStatLabel}>Earned Today</Text>
                      </View>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <View style={[styles.heroStatDot, { backgroundColor: LUX.goldLight }]} />
                      <View>
                        <Text style={styles.heroStatValue}>{totalEarned.toLocaleString()}</Text>
                        <Text style={styles.heroStatLabel}>Total Earned</Text>
                      </View>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatEmoji}>🔥</Text>
                      <View>
                        <Text style={styles.heroStatValue}>{currentStreak}</Text>
                        <Text style={styles.heroStatLabel}>Day Streak</Text>
                      </View>
                    </View>
                  </View>

                  {/* Streak bonus info */}
                  {currentStreak > 0 ? (
                    <View style={styles.streakBar}>
                      <LinearGradient
                        colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.streakBarInner}
                      >
                        <Text style={styles.streakBarText}>
                          {currentStreak < 3 ? `🔥 ${3 - currentStreak} days to 3-day bonus (+10)` :
                           currentStreak < 7 ? `🔥 ${7 - currentStreak} days to 7-day bonus (+25)` :
                           currentStreak < 14 ? `🔥 ${14 - currentStreak} days to 14-day bonus (+50)` :
                           currentStreak < 30 ? `🔥 ${30 - currentStreak} days to 30-day bonus (+100)` :
                           `🏆 Max streak: ${maxStreak} days! Legend!`}
                        </Text>
                      </LinearGradient>
                    </View>
                  ) : null}

                  {/* Decorative circles */}
                  <View style={[styles.decoCircle, { top: -30, right: -30, width: 120, height: 120 }]} />
                  <View style={[styles.decoCircle, { bottom: -20, left: 30, width: 80, height: 80 }]} />
                </LinearGradient>
              </Animated.View>

              {/* ═══ Quick Actions ═══ */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.quickActions}>
                {[
                  { emoji: '🎁', label: 'Redeem', route: '/coin-redeem', color: LUX.goldMuted },
                  { emoji: '🔗', label: 'Refer', route: null, color: LUX.greenBg },
                  { emoji: '🏆', label: 'Leaderboard', route: '/coin-leaderboard', color: LUX.redBg },
                ].map((action, i) => (
                  <Pressable
                    key={action.label}
                    style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (action.route) router.push(action.route as any);
                      else handleShareReferral();
                    }}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                      <Text style={{ fontSize: 22 }}>{action.emoji}</Text>
                    </View>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </Pressable>
                ))}
              </Animated.View>

              {/* ═══ Earn More Coins ═══ */}
              <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.earnSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Earn More Coins</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>DAILY</Text>
                  </View>
                </View>
                <EarnCard emoji="📸" label="Post a meal" coins="+20 coins" onPress={() => router.push('/(tabs)/camera')} delay={200} />
                <EarnCard emoji="📤" label="Share a post" coins="+10 coins" onPress={() => router.push('/explore')} delay={240} />
                <EarnCard emoji="👤" label="Follow creators" coins="+5 coins" onPress={() => router.push('/explore')} delay={280} />
                <EarnCard emoji="🔗" label="Invite a friend" coins="+50 coins" onPress={handleShareReferral} delay={320} />
              </Animated.View>

              {/* ═══ Earning Rules ═══ */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.rulesSection}>
                <Text style={styles.sectionTitle}>How to Earn</Text>
                <View style={styles.rulesGrid}>
                  {Object.entries(COIN_RULES).filter(([k]) => !k.startsWith('streak_bonus')).map(([key, rule]) => (
                    <View key={key} style={styles.ruleItem}>
                      <Text style={styles.ruleIcon}>{rule.icon}</Text>
                      <Text style={styles.ruleLabel} numberOfLines={1}>{rule.label}</Text>
                      <View style={styles.ruleAmountBadge}>
                        <Text style={styles.ruleAmount}>+{rule.amount}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* ═══ Referral Code ═══ */}
              {referralCode ? (
                <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.referralSection}>
                  <LinearGradient
                    colors={['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)']}
                    style={styles.referralCard}
                  >
                    <View style={styles.referralLeft}>
                      <Text style={styles.referralTitle}>Your Referral Code</Text>
                      <Text style={styles.referralCode}>{referralCode}</Text>
                      <Text style={styles.referralHint}>Share and earn 50 coins per invite</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.shareRefBtn, pressed && { opacity: 0.8 }]}
                      onPress={handleShareReferral}
                    >
                      <LinearGradient colors={[LUX.gold, LUX.goldLight]} style={styles.shareRefBtnGrad}>
                        <MaterialIcons name="share" size={20} color="#0A0A0F" />
                      </LinearGradient>
                    </Pressable>
                  </LinearGradient>
                </Animated.View>
              ) : null}

              {/* ═══ Transactions Header ═══ */}
              <View style={styles.txHeader}>
                <Text style={styles.sectionTitle}>History</Text>
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
              <Pressable
                style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/(tabs)/camera')}
              >
                <LinearGradient colors={[LUX.gold, LUX.goldLight]} style={styles.emptyCtaGrad}>
                  <Text style={styles.emptyCtaText}>Post Your First Meal</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#0A0A0F" />
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
  container: { flex: 1, backgroundColor: LUX.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LUX.bgSurface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: LUX.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LUX.white },
  leaderboardBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LUX.goldMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: LUX.goldBorder,
  },

  // ── Hero Balance ──
  heroSection: { paddingHorizontal: 16, marginBottom: 4 },
  heroGradient: {
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LUX.goldBorder,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 30,
    elevation: 12,
  },
  heroCenter: { position: 'relative', marginBottom: 16 },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,215,0,0.20)',
    top: -20,
    left: -20,
  },
  heroCoin: { width: 80, height: 80 },
  heroLabel: { fontSize: 13, fontWeight: '600', color: LUX.whiteFaint, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroBalance: { fontSize: 56, fontWeight: '900', color: LUX.goldLight, letterSpacing: -2, marginTop: 2 },
  heroSubLabel: { fontSize: 14, fontWeight: '600', color: LUX.whiteMuted, marginTop: -2, marginBottom: 20 },

  heroStats: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatDot: { width: 8, height: 8, borderRadius: 4 },
  heroStatEmoji: { fontSize: 16 },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: LUX.white },
  heroStatLabel: { fontSize: 10, fontWeight: '600', color: LUX.whiteFaint, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)' },

  streakBar: { marginTop: 18, width: '100%' },
  streakBarInner: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: LUX.goldBorder,
  },
  streakBarText: { fontSize: 12, fontWeight: '700', color: LUX.gold, textAlign: 'center' },

  decoCircle: {
    position: 'absolute', borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.04)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.06)',
  },

  // ── Quick Actions ──
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 20, marginBottom: 4 },
  quickAction: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 18, borderRadius: 20,
    backgroundColor: LUX.bgCard,
    borderWidth: 1, borderColor: LUX.border,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 12, fontWeight: '700', color: LUX.whiteMuted },

  // ── Earn More ──
  earnSection: { paddingHorizontal: 16, marginTop: 24, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: LUX.white },
  sectionBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: LUX.goldMuted, borderWidth: 1, borderColor: LUX.goldBorder,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: '800', color: LUX.gold, letterSpacing: 0.8 },

  earnCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: LUX.bgCard,
    borderWidth: 1, borderColor: LUX.border,
  },
  earnCardIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: LUX.goldMuted, alignItems: 'center', justifyContent: 'center',
  },
  earnCardText: { flex: 1, gap: 2 },
  earnCardLabel: { fontSize: 14, fontWeight: '600', color: LUX.white },
  earnCardCoins: { fontSize: 12, fontWeight: '800', color: LUX.gold },

  // ── Rules ──
  rulesSection: { paddingHorizontal: 16, marginTop: 24 },
  rulesGrid: { gap: 6, marginTop: 10 },
  ruleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: LUX.bgCard,
    borderWidth: 1, borderColor: LUX.border,
  },
  ruleIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  ruleLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: LUX.whiteMuted },
  ruleAmountBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: LUX.goldMuted,
  },
  ruleAmount: { fontSize: 14, fontWeight: '800', color: LUX.goldLight },

  // ── Referral ──
  referralSection: { paddingHorizontal: 16, marginTop: 22 },
  referralCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18, borderRadius: 20,
    borderWidth: 1, borderColor: LUX.goldBorder,
  },
  referralLeft: { gap: 4, flex: 1 },
  referralTitle: { fontSize: 12, fontWeight: '600', color: LUX.whiteFaint },
  referralCode: { fontSize: 22, fontWeight: '900', color: LUX.goldLight, letterSpacing: 2 },
  referralHint: { fontSize: 11, fontWeight: '500', color: LUX.whiteFaint },
  shareRefBtn: { borderRadius: 24, overflow: 'hidden' },
  shareRefBtnGrad: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Transactions ──
  txHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 28, marginBottom: 14,
  },
  txTabs: { flexDirection: 'row', gap: 4 },
  txTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 14, backgroundColor: LUX.bgSurface,
    borderWidth: 1, borderColor: LUX.border,
  },
  txTabActive: { backgroundColor: LUX.goldMuted, borderColor: LUX.goldBorder },
  txTabText: { fontSize: 12, fontWeight: '700', color: LUX.whiteFaint },
  txTabTextActive: { color: LUX.goldLight },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: LUX.border,
  },
  txIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txIconEarn: { backgroundColor: LUX.greenBg },
  txIconSpend: { backgroundColor: LUX.redBg },
  txIconEmoji: { fontSize: 18 },
  txContent: { flex: 1, gap: 2 },
  txLabel: { fontSize: 14, fontWeight: '600', color: LUX.white },
  txTime: { fontSize: 12, fontWeight: '500', color: LUX.whiteFaint },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txAmountEarn: { color: LUX.green },
  txAmountSpend: { color: LUX.red },

  emptyTx: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTxIcon: { fontSize: 44 },
  emptyTxTitle: { fontSize: 17, fontWeight: '700', color: LUX.white },
  emptyTxSub: { fontSize: 13, color: LUX.whiteFaint },
  emptyCta: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  emptyCtaGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
  },
  emptyCtaText: { fontSize: 14, fontWeight: '700', color: '#0A0A0F' },
});
