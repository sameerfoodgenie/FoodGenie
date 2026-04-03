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
import * as coinService from '../services/coinService';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function LeaderboardItem({ entry, isMe }: { entry: coinService.LeaderboardEntry; isMe: boolean }) {
  const isTop3 = entry.rank <= 3;

  return (
    <Animated.View entering={FadeInDown.delay(entry.rank * 50).duration(300)}>
      <View style={[styles.leaderItem, isMe && styles.leaderItemMe, isTop3 && styles.leaderItemTop]}>
        {/* Rank */}
        <View style={styles.rankWrap}>
          {isTop3 ? (
            <Text style={styles.rankMedal}>{RANK_MEDALS[entry.rank - 1]}</Text>
          ) : (
            <Text style={styles.rankNumber}>#{entry.rank}</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={[styles.leaderAvatar, isTop3 && { borderColor: RANK_COLORS[entry.rank - 1] }]}>
          <Text style={styles.leaderAvatarText}>
            {(entry.username || 'U').slice(0, 2).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.leaderInfo}>
          <Text style={[styles.leaderName, isMe && styles.leaderNameMe]} numberOfLines={1}>
            @{entry.username}{isMe ? ' (You)' : ''}
          </Text>
        </View>

        {/* Coins */}
        <View style={styles.leaderCoins}>
          <Image source={require('../assets/images/genie-coin.png')} style={styles.leaderCoinImg} contentFit="contain" />
          <Text style={[styles.leaderCoinText, isTop3 && { color: RANK_COLORS[entry.rank - 1] || '#D4AF37' }]}>
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

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

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
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
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
                {tab === 'alltime' ? 'All Time' : 'This Week'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Top 3 Podium */}
        {top3.length >= 3 ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.podium}>
            <LinearGradient colors={['#1A1A2E', '#0A0A0F']} style={styles.podiumGradient}>
              {/* Second place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, { borderColor: '#C0C0C0' }]}>
                  <Text style={styles.podiumAvatarText}>{(top3[1].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.podiumMedal}>🥈</Text>
                <Text style={styles.podiumName} numberOfLines={1}>@{top3[1].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#C0C0C0' }]}>{top3[1].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 60, backgroundColor: 'rgba(192,192,192,0.15)' }]} />
              </View>

              {/* First place */}
              <View style={[styles.podiumItem, styles.podiumFirst]}>
                <Text style={styles.crownEmoji}>👑</Text>
                <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { borderColor: '#FFD700' }]}>
                  <Text style={[styles.podiumAvatarText, { fontSize: 18 }]}>{(top3[0].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.podiumMedal}>🥇</Text>
                <Text style={styles.podiumName} numberOfLines={1}>@{top3[0].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#FFD700' }]}>{top3[0].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 80, backgroundColor: 'rgba(255,215,0,0.15)' }]} />
              </View>

              {/* Third place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
                  <Text style={styles.podiumAvatarText}>{(top3[2].username || 'U').slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.podiumMedal}>🥉</Text>
                <Text style={styles.podiumName} numberOfLines={1}>@{top3[2].username}</Text>
                <Text style={[styles.podiumCoins, { color: '#CD7F32' }]}>{top3[2].total_earned.toLocaleString()}</Text>
                <View style={[styles.podiumBar, { height: 45, backgroundColor: 'rgba(205,127,50,0.15)' }]} />
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}

        {/* Rest of list */}
        <FlatList
          data={rest}
          keyExtractor={item => item.user_id}
          renderItem={({ item }) => (
            <LeaderboardItem entry={item} isMe={item.user_id === user?.id} />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A2E',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, gap: 4,
    padding: 4, borderRadius: 16, backgroundColor: '#F4F4F8',
    marginBottom: 4,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
  },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  tabTextActive: { color: '#1A1A2E' },

  // Podium
  podium: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  podiumGradient: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingHorizontal: 16, paddingTop: 28, paddingBottom: 16, gap: 8,
  },
  podiumItem: { flex: 1, alignItems: 'center', gap: 4 },
  podiumFirst: { marginTop: -16 },
  crownEmoji: { fontSize: 24, marginBottom: 4 },
  podiumAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#2A2A3E', borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  podiumAvatarFirst: { width: 58, height: 58, borderRadius: 29, borderWidth: 3 },
  podiumAvatarText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  podiumMedal: { fontSize: 20 },
  podiumName: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.70)', textAlign: 'center', maxWidth: 80 },
  podiumCoins: { fontSize: 14, fontWeight: '900' },
  podiumBar: { width: '100%', borderRadius: 8, marginTop: 6 },

  // List items
  leaderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  leaderItemMe: { backgroundColor: 'rgba(212,175,55,0.05)' },
  leaderItemTop: {},
  rankWrap: { width: 36, alignItems: 'center' },
  rankMedal: { fontSize: 22 },
  rankNumber: { fontSize: 15, fontWeight: '800', color: '#6B7280' },
  leaderAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F4F4F8', borderWidth: 2, borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  leaderAvatarText: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  leaderNameMe: { color: '#D4AF37', fontWeight: '700' },
  leaderCoins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaderCoinImg: { width: 18, height: 18 },
  leaderCoinText: { fontSize: 16, fontWeight: '800', color: '#D4AF37' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
});
