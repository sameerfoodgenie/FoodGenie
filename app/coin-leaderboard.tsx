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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/template';
import { useTheme } from '../hooks/useTheme';
import * as coinService from '../services/coinService';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#D4AF37', '#9CA3AF', '#CD7F32'];

function LeaderboardItem({ entry, isMe, index, colors }: { entry: coinService.LeaderboardEntry; isMe: boolean; index: number; colors: any }) {
  const isTop3 = entry.rank <= 3;
  return (
    <Animated.View entering={FadeInDown.delay(50 + index * 35).duration(300)}>
      <View style={[
        styles.leaderItem, { borderBottomColor: colors.border },
        isMe && { backgroundColor: 'rgba(212,175,55,0.08)' },
        isTop3 && { backgroundColor: `${RANK_COLORS[entry.rank - 1]}08` },
      ]}>
        <View style={styles.rankWrap}>
          {isTop3 ? (
            <Text style={styles.rankMedal}>{RANK_MEDALS[entry.rank - 1]}</Text>
          ) : (
            <Text style={[styles.rankNumber, { color: colors.textMuted }]}>#{entry.rank}</Text>
          )}
        </View>
        <LinearGradient
          colors={isTop3 ? [RANK_COLORS[entry.rank - 1], `${RANK_COLORS[entry.rank - 1]}88`] : [colors.backgroundTertiary, colors.backgroundTertiary]}
          style={styles.leaderAvatar}
        >
          <Text style={[styles.leaderAvatarText, { color: isTop3 ? '#FFF' : colors.textPrimary }]}>
            {(entry.username || 'U').slice(0, 2).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={styles.leaderInfo}>
          <Text style={[styles.leaderName, { color: colors.textPrimary }, isMe && { color: '#D4AF37', fontWeight: '700' }]} numberOfLines={1}>
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
  const { colors } = useTheme();
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Leaderboard</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['alltime', 'weekly'] as const).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === tab && styles.tabTextActive]}>
                {tab === 'alltime' ? '🏆 All Time' : '⚡ This Week'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Top 3 Podium */}
        {top3.length >= 3 ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.podium}>
            <LinearGradient
              colors={['#FFF8E1', '#FFECB3', '#FDF8F0']}
              style={styles.podiumGrad}
            >
              {/* Second */}
              <View style={styles.podiumItem}>
                <LinearGradient colors={['#C0C0C0', '#A0A0A0']} style={styles.podiumAv}>
                  <Text style={styles.podiumAvText}>{(top3[1].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.podiumMedal}>🥈</Text>
                <Text style={[styles.podiumName, { color: colors.textSecondary }]} numberOfLines={1}>@{top3[1].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#9CA3AF' }]}>{top3[1].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 55, backgroundColor: 'rgba(192,192,192,0.15)' }]} />
              </View>

              {/* First */}
              <View style={[styles.podiumItem, styles.podiumFirst]}>
                <Text style={styles.crownEmoji}>👑</Text>
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={[styles.podiumAv, styles.podiumAvFirst]}>
                  <Text style={[styles.podiumAvText, { fontSize: 20, color: '#FFF' }]}>{(top3[0].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.podiumMedal}>🥇</Text>
                <Text style={[styles.podiumName, { color: colors.textSecondary }]} numberOfLines={1}>@{top3[0].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#D4AF37' }]}>{top3[0].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 75, backgroundColor: 'rgba(212,175,55,0.15)' }]} />
              </View>

              {/* Third */}
              <View style={styles.podiumItem}>
                <LinearGradient colors={['#CD7F32', '#A06828']} style={styles.podiumAv}>
                  <Text style={styles.podiumAvText}>{(top3[2].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.podiumMedal}>🥉</Text>
                <Text style={[styles.podiumName, { color: colors.textSecondary }]} numberOfLines={1}>@{top3[2].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#CD7F32' }]}>{top3[2].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 40, backgroundColor: 'rgba(205,127,50,0.12)' }]} />
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}

        {/* Rankings */}
        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderTitle, { color: colors.textPrimary }]}>Rankings</Text>
          <Text style={[styles.listHeaderCount, { color: colors.textMuted }]}>{leaderboard.length} players</Text>
        </View>

        <FlatList
          data={rest}
          keyExtractor={item => item.user_id}
          renderItem={({ item, index }) => (
            <LeaderboardItem entry={item} isMe={item.user_id === user?.id} index={index} colors={colors} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No entries yet</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Be the first to earn Genie Coins!</Text>
              </View>
            ) : null
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
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, gap: 4,
    padding: 4, borderRadius: 16, borderWidth: 1, marginBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12 },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  tabText: { fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#D4AF37' },

  podium: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 12 },
  podiumGrad: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingHorizontal: 16, paddingTop: 32, paddingBottom: 18, gap: 8,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)', borderRadius: 24,
    position: 'relative',
  },
  podiumItem: { flex: 1, alignItems: 'center', gap: 4 },
  podiumFirst: { marginTop: -20 },
  crownEmoji: { fontSize: 26, marginBottom: 4 },
  podiumAv: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  podiumAvFirst: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: 'rgba(212,175,55,0.40)' },
  podiumAvText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  podiumMedal: { fontSize: 22 },
  podiumName: { fontSize: 11, fontWeight: '700', textAlign: 'center', maxWidth: 80 },
  podiumCoins: { fontSize: 15, fontWeight: '900' },
  podiumBar: { width: '100%', borderRadius: 10, marginTop: 6 },

  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: '800' },
  listHeaderCount: { fontSize: 12, fontWeight: '600' },

  leaderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  rankWrap: { width: 36, alignItems: 'center' },
  rankMedal: { fontSize: 22 },
  rankNumber: { fontSize: 15, fontWeight: '800' },
  leaderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  leaderAvatarText: { fontSize: 14, fontWeight: '700' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600' },
  leaderCoins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaderCoinImg: { width: 18, height: 18 },
  leaderCoinText: { fontSize: 16, fontWeight: '800', color: '#D4AF37' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14 },
});
