import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/template';
import * as coinService from '../services/coinService';

const LUX = {
  bg: '#0A0A0F',
  bgCard: '#111118',
  bgSurface: '#16161F',
  gold: '#D4AF37',
  goldLight: '#FFD700',
  goldMuted: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.25)',
  white: '#F0F0F5',
  whiteMuted: 'rgba(255,255,255,0.55)',
  whiteFaint: 'rgba(255,255,255,0.30)',
  border: 'rgba(255,255,255,0.06)',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_GLOW = ['rgba(255,215,0,0.12)', 'rgba(192,192,192,0.10)', 'rgba(205,127,50,0.10)'];

function LeaderboardItem({ entry, isMe, index }: { entry: coinService.LeaderboardEntry; isMe: boolean; index: number }) {
  const isTop3 = entry.rank <= 3;
  return (
    <Animated.View entering={FadeInDown.delay(50 + index * 35).duration(300)}>
      <View style={[
        styles.leaderItem,
        isMe && styles.leaderItemMe,
        isTop3 && { backgroundColor: RANK_GLOW[entry.rank - 1] },
      ]}>
        <View style={styles.rankWrap}>
          {isTop3 ? (
            <Text style={styles.rankMedal}>{RANK_MEDALS[entry.rank - 1]}</Text>
          ) : (
            <Text style={styles.rankNumber}>#{entry.rank}</Text>
          )}
        </View>
        <LinearGradient
          colors={isTop3 ? [RANK_COLORS[entry.rank - 1], `${RANK_COLORS[entry.rank - 1]}88`] : [LUX.bgSurface, LUX.bgSurface]}
          style={styles.leaderAvatar}
        >
          <Text style={styles.leaderAvatarText}>
            {(entry.username || 'U').slice(0, 2).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={styles.leaderInfo}>
          <Text style={[styles.leaderName, isMe && styles.leaderNameMe]} numberOfLines={1}>
            @{entry.username}{isMe ? ' (You)' : ''}
          </Text>
        </View>
        <View style={styles.leaderCoins}>
          <Image source={require('../assets/images/genie-coin.png')} style={styles.leaderCoinImg} contentFit="contain" />
          <Text style={[styles.leaderCoinText, isTop3 && { color: RANK_COLORS[entry.rank - 1] }]}>
            {entry.total_earned.toLocaleString()}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CoinLeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'alltime' | 'weekly'>('alltime');
  const [leaderboard, setLeaderboard] = useState<coinService.LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    const result = activeTab === 'alltime'
      ? await coinService.getLeaderboard(50)
      : await coinService.getWeeklyLeaderboard(50);
    setLeaderboard(result.data);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }, [loadLeaderboard]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color={LUX.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['alltime', 'weekly'] as const).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'alltime' ? '🏆 All Time' : '⚡ This Week'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Top 3 Podium */}
        {top3.length >= 3 ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.podium}>
            <LinearGradient
              colors={['#14100A', '#0F0F14', '#0A0A0F']}
              style={styles.podiumGrad}
            >
              {/* Decorative glow */}
              <View style={styles.podiumGlow} />

              {/* Second place */}
              <View style={styles.podiumItem}>
                <LinearGradient colors={['#C0C0C0', '#A0A0A0']} style={styles.podiumAv}>
                  <Text style={styles.podiumAvText}>{(top3[1].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.podiumMedal}>🥈</Text>
                <Text style={styles.podiumName} numberOfLines={1}>@{top3[1].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#C0C0C0' }]}>{top3[1].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 55, backgroundColor: 'rgba(192,192,192,0.12)' }]} />
              </View>

              {/* First place */}
              <View style={[styles.podiumItem, styles.podiumFirst]}>
                <Text style={styles.crownEmoji}>👑</Text>
                <LinearGradient colors={[LUX.gold, LUX.goldLight]} style={[styles.podiumAv, styles.podiumAvFirst]}>
                  <Text style={[styles.podiumAvText, { fontSize: 20, color: '#0A0A0F' }]}>{(top3[0].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.podiumMedal}>🥇</Text>
                <Text style={styles.podiumName} numberOfLines={1}>@{top3[0].username}</Text>
                <Text style={[styles.podiumCoins, { color: LUX.goldLight }]}>{top3[0].total_earned.toLocaleString()}</Text>
                <LinearGradient
                  colors={['rgba(212,175,55,0.20)', 'rgba(212,175,55,0.05)']}
                  style={[styles.podiumBar, { height: 75 }]}
                />
              </View>

              {/* Third place */}
              <View style={styles.podiumItem}>
                <LinearGradient colors={['#CD7F32', '#A06828']} style={styles.podiumAv}>
                  <Text style={styles.podiumAvText}>{(top3[2].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.podiumMedal}>🥉</Text>
                <Text style={styles.podiumName} numberOfLines={1}>@{top3[2].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#CD7F32' }]}>{top3[2].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 40, backgroundColor: 'rgba(205,127,50,0.12)' }]} />
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}

        {/* Ranking label */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Rankings</Text>
          <Text style={styles.listHeaderCount}>{leaderboard.length} players</Text>
        </View>

        {/* Rest of list */}
        <FlatList
          data={rest}
          keyExtractor={item => item.user_id}
          renderItem={({ item, index }) => (
            <LeaderboardItem entry={item} isMe={item.user_id === user?.id} index={index} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={LUX.goldLight} colors={[LUX.goldLight]} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptySub}>Be the first to earn Genie Coins!</Text>
              </View>
            ) : null
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
    backgroundColor: LUX.bgSurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: LUX.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LUX.white },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, gap: 4,
    padding: 4, borderRadius: 16, backgroundColor: LUX.bgCard,
    borderWidth: 1, borderColor: LUX.border,
    marginBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12 },
  tabActive: {
    backgroundColor: LUX.goldMuted,
    borderWidth: 1, borderColor: LUX.goldBorder,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: LUX.whiteFaint },
  tabTextActive: { color: LUX.goldLight },

  // Podium
  podium: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 12 },
  podiumGrad: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingHorizontal: 16, paddingTop: 32, paddingBottom: 18, gap: 8,
    borderWidth: 1, borderColor: LUX.goldBorder, borderRadius: 24,
    position: 'relative',
  },
  podiumGlow: {
    position: 'absolute', top: -40, left: '50%', marginLeft: -60,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  podiumItem: { flex: 1, alignItems: 'center', gap: 4 },
  podiumFirst: { marginTop: -20 },
  crownEmoji: { fontSize: 26, marginBottom: 4 },
  podiumAv: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  podiumAvFirst: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: LUX.goldBorder },
  podiumAvText: { fontSize: 16, fontWeight: '800', color: LUX.white },
  podiumMedal: { fontSize: 22 },
  podiumName: { fontSize: 11, fontWeight: '700', color: LUX.whiteMuted, textAlign: 'center', maxWidth: 80 },
  podiumCoins: { fontSize: 15, fontWeight: '900' },
  podiumBar: { width: '100%', borderRadius: 10, marginTop: 6 },

  // List header
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: LUX.white },
  listHeaderCount: { fontSize: 12, fontWeight: '600', color: LUX.whiteFaint },

  // List items
  leaderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: LUX.border,
  },
  leaderItemMe: { backgroundColor: LUX.goldMuted },
  rankWrap: { width: 36, alignItems: 'center' },
  rankMedal: { fontSize: 22 },
  rankNumber: { fontSize: 15, fontWeight: '800', color: LUX.whiteFaint },
  leaderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: LUX.border,
  },
  leaderAvatarText: { fontSize: 14, fontWeight: '700', color: LUX.white },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600', color: LUX.white },
  leaderNameMe: { color: LUX.goldLight, fontWeight: '700' },
  leaderCoins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaderCoinImg: { width: 18, height: 18 },
  leaderCoinText: { fontSize: 16, fontWeight: '800', color: LUX.gold },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LUX.white },
  emptySub: { fontSize: 14, color: LUX.whiteFaint },
});
