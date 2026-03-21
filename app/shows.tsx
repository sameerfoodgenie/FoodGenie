import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useCreator, CREATOR_TIERS, LiveSession, TrendingShow, TopCreator } from '../contexts/CreatorContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.72;
const CREATOR_CARD_W = 140;

type TabId = 'trending' | 'live' | 'creators';

const TABS: { id: TabId; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'trending', label: 'Trending', icon: 'local-fire-department' },
  { id: 'live', label: 'Live', icon: 'sensors' },
  { id: 'creators', label: 'Top Creators', icon: 'star' },
];

function getTierInfo(type: string | null) {
  return CREATOR_TIERS.find(t => t.id === type) || null;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ─── Live Session Card ───
function LiveSessionCard({ session, onPress }: { session: LiveSession; onPress: () => void }) {
  const tier = getTierInfo(session.hostCreatorType);
  const timeUntil = session.scheduledAt - Date.now();

  return (
    <Pressable
      style={({ pressed }) => [styles.liveCard, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      {session.coverUri ? (
        <Image source={{ uri: session.coverUri }} style={styles.liveCardImage} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.liveCardImage, { backgroundColor: theme.backgroundTertiary }]}>
          <Text style={{ fontSize: 40, opacity: 0.3 }}>🎬</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.liveCardOverlay}
      >
        {session.isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.countdownBadge}>
            <MaterialIcons name="schedule" size={12} color="#FFF" />
            <Text style={styles.countdownText}>in {formatTime(timeUntil)}</Text>
          </View>
        )}
        {session.isPaid ? (
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>₹{session.price}</Text>
          </View>
        ) : null}
        <Text style={styles.liveCardTitle} numberOfLines={1}>{session.title}</Text>
        <View style={styles.liveCardMeta}>
          <View style={styles.liveHostRow}>
            <View style={[styles.miniAvatar, tier ? { borderColor: tier.color } : {}]}>
              <Text style={styles.miniAvatarText}>{session.hostAvatarInitials}</Text>
            </View>
            <Text style={styles.liveHostName}>@{session.hostUsername}</Text>
            {tier ? <Text style={styles.tierEmoji}>{tier.emoji}</Text> : null}
          </View>
          <View style={styles.attendeeRow}>
            <MaterialIcons name="people" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.attendeeText}>{session.attendeeCount}/{session.maxAttendees}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Trending Show Card ───
function TrendingShowCard({ show, index, onPress }: { show: TrendingShow; index: number; onPress: () => void }) {
  const tier = getTierInfo(show.hostCreatorType);

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(300)}>
      <Pressable
        style={({ pressed }) => [styles.trendingCard, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
        onPress={onPress}
      >
        {show.coverUri ? (
          <Image source={{ uri: show.coverUri }} style={styles.trendingImage} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.trendingImage, { backgroundColor: theme.backgroundTertiary, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 32 }}>🎬</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendingOverlay}>
          <View style={styles.trendingRatingBadge}>
            <MaterialIcons name="star" size={12} color="#FBBF24" />
            <Text style={styles.trendingRating}>{show.rating}</Text>
          </View>
          <Text style={styles.trendingTitle} numberOfLines={2}>{show.title}</Text>
          <View style={styles.trendingMeta}>
            <View style={styles.liveHostRow}>
              <View style={[styles.miniAvatar, tier ? { borderColor: tier.color } : {}, { width: 22, height: 22, borderRadius: 11 }]}>
                <Text style={[styles.miniAvatarText, { fontSize: 9 }]}>{show.hostAvatarInitials}</Text>
              </View>
              <Text style={styles.trendingHost}>@{show.hostUsername}</Text>
            </View>
            <Text style={styles.trendingStats}>{show.episodeCount} eps · {formatCount(show.viewCount)} views</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Top Creator Card ───
function TopCreatorCard({ creator, rank, onPress }: { creator: TopCreator; rank: number; onPress: () => void }) {
  const tier = getTierInfo(creator.creatorType);

  return (
    <Pressable
      style={({ pressed }) => [styles.creatorCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
      onPress={onPress}
    >
      <View style={styles.creatorRank}>
        <Text style={styles.creatorRankText}>#{rank}</Text>
      </View>
      <View style={[styles.creatorAvatar, tier ? { borderColor: tier.color } : {}]}>
        <Text style={styles.creatorAvatarText}>{creator.avatarInitials}</Text>
        {creator.isVerified ? (
          <View style={styles.verifiedDot}>
            <MaterialIcons name="verified" size={14} color="#3B82F6" />
          </View>
        ) : null}
      </View>
      <Text style={styles.creatorName} numberOfLines={1}>@{creator.username}</Text>
      {tier ? (
        <View style={[styles.creatorTierTag, { backgroundColor: `${tier.color}15`, borderColor: `${tier.color}30` }]}>
          <Text style={styles.creatorTierEmoji}>{tier.emoji}</Text>
          <Text style={[styles.creatorTierText, { color: tier.color }]} numberOfLines={1}>{tier.name}</Text>
        </View>
      ) : null}
      <Text style={styles.creatorFollowers}>{formatCount(creator.followers)} followers</Text>
      <Text style={styles.creatorShows}>{creator.showCount} shows</Text>
    </Pressable>
  );
}

export default function ShowsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { liveSessions, trendingShows, topCreators } = useCreator();
  const [activeTab, setActiveTab] = useState<TabId>('trending');

  const liveNow = liveSessions.filter(s => s.isLive);
  const upcoming = liveSessions.filter(s => !s.isLive);

  const handleSessionPress = useCallback((session: LiveSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/live-session', params: { sessionId: session.id } });
  }, [router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => { Haptics.selectionAsync(); router.back(); }}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Shows</Text>
        <Pressable
          style={styles.scheduleBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/schedule-live'); }}
        >
          <MaterialIcons name="add-circle-outline" size={22} color={theme.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
          >
            <MaterialIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ─── Trending Tab ─── */}
        {activeTab === 'trending' ? (
          <View style={styles.section}>
            {/* Featured live session banner */}
            {liveNow.length > 0 ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.liveBanner}>
                <Pressable
                  style={({ pressed }) => [styles.liveBannerInner, pressed && { opacity: 0.95 }]}
                  onPress={() => handleSessionPress(liveNow[0])}
                >
                  <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.liveBannerGrad}>
                    <View style={styles.liveBannerLeft}>
                      <View style={styles.liveBannerDotRow}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBannerLabel}>LIVE NOW</Text>
                      </View>
                      <Text style={styles.liveBannerTitle} numberOfLines={1}>{liveNow[0].title}</Text>
                      <Text style={styles.liveBannerHost}>@{liveNow[0].hostUsername} · {liveNow[0].attendeeCount} watching</Text>
                    </View>
                    <MaterialIcons name="play-circle-filled" size={44} color="rgba(255,255,255,0.9)" />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : null}

            <Text style={styles.sectionTitle}>🔥 Trending Shows</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            >
              {trendingShows.map((show, i) => (
                <TrendingShowCard key={show.id} show={show} index={i} onPress={() => Haptics.selectionAsync()} />
              ))}
            </ScrollView>

            {/* Upcoming sessions */}
            {upcoming.length > 0 ? (
              <View style={styles.upcomingSection}>
                <Text style={styles.sectionTitle}>📅 Upcoming Sessions</Text>
                {upcoming.map((session, i) => (
                  <Animated.View key={session.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                    <LiveSessionCard session={session} onPress={() => handleSessionPress(session)} />
                  </Animated.View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ─── Live Tab ─── */}
        {activeTab === 'live' ? (
          <View style={styles.section}>
            {liveNow.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>🔴 Live Now</Text>
                {liveNow.map((session, i) => (
                  <Animated.View key={session.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                    <LiveSessionCard session={session} onPress={() => handleSessionPress(session)} />
                  </Animated.View>
                ))}
              </>
            ) : null}

            <Text style={[styles.sectionTitle, { marginTop: liveNow.length > 0 ? 24 : 0 }]}>📅 Upcoming</Text>
            {upcoming.length > 0 ? (
              upcoming.map((session, i) => (
                <Animated.View key={session.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <LiveSessionCard session={session} onPress={() => handleSessionPress(session)} />
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="sensors" size={48} color={theme.textMuted} />
                <Text style={styles.emptyTitle}>No upcoming sessions</Text>
                <Text style={styles.emptySub}>Check back later for new live sessions</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ─── Top Creators Tab ─── */}
        {activeTab === 'creators' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Top Creators</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {topCreators.map((creator, i) => (
                <Animated.View key={creator.id} entering={FadeInRight.delay(i * 80).duration(300)}>
                  <TopCreatorCard creator={creator} rank={i + 1} onPress={() => Haptics.selectionAsync()} />
                </Animated.View>
              ))}
            </ScrollView>

            {/* Creator tiers info */}
            <View style={styles.tiersSection}>
              <Text style={styles.sectionTitle}>Creator Tiers</Text>
              {CREATOR_TIERS.map((tier, i) => (
                <Animated.View key={tier.id} entering={FadeInDown.delay(i * 80).duration(300)}>
                  <View style={[styles.tierCard, { borderColor: `${tier.color}25` }]}>
                    <View style={styles.tierHeader}>
                      <View style={[styles.tierIconWrap, { backgroundColor: `${tier.color}15` }]}>
                        <Text style={styles.tierIcon}>{tier.emoji}</Text>
                      </View>
                      <View style={styles.tierInfo}>
                        <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                        <Text style={styles.tierDesc}>{tier.description}</Text>
                      </View>
                    </View>
                    <View style={styles.tierPerks}>
                      {tier.perks.map((perk, pi) => (
                        <View key={pi} style={styles.perkRow}>
                          <MaterialIcons name="check-circle" size={14} color={tier.color} />
                          <Text style={styles.perkText}>{perk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  scheduleBtn: { padding: 8 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabActive: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  tabTextActive: { color: theme.primary },

  // Sections
  section: { paddingTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },

  // Live banner
  liveBanner: { paddingHorizontal: 20, marginBottom: 20 },
  liveBannerInner: { borderRadius: 16, overflow: 'hidden' },
  liveBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  liveBannerLeft: { flex: 1, gap: 4, marginRight: 12 },
  liveBannerDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBannerLabel: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  liveBannerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  liveBannerHost: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  // Live dot
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },

  // Live session card
  liveCard: {
    marginHorizontal: 20,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  liveCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  liveCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  liveBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  countdownText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  paidBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(251,191,36,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paidText: { fontSize: 13, fontWeight: '800', color: '#0A0A0F' },
  liveCardTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  liveCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveHostRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  miniAvatarText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  liveHostName: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tierEmoji: { fontSize: 14 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // Trending card
  trendingCard: {
    width: CARD_W,
    height: CARD_W * 1.25,
    borderRadius: 16,
    overflow: 'hidden',
  },
  trendingImage: { width: '100%', height: '100%', position: 'absolute' },
  trendingOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  trendingRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  trendingRating: { fontSize: 12, fontWeight: '700', color: '#FBBF24' },
  trendingTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  trendingMeta: { gap: 4 },
  trendingHost: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  trendingStats: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },

  // Top creator card
  creatorCard: {
    width: CREATOR_CARD_W,
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  creatorRank: {
    alignSelf: 'flex-start',
  },
  creatorRankText: { fontSize: 12, fontWeight: '800', color: theme.accent },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  creatorAvatarText: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.background,
    borderRadius: 10,
    padding: 1,
  },
  creatorName: { fontSize: 13, fontWeight: '700', color: theme.textPrimary },
  creatorTierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  creatorTierEmoji: { fontSize: 10 },
  creatorTierText: { fontSize: 10, fontWeight: '700' },
  creatorFollowers: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  creatorShows: { fontSize: 11, fontWeight: '500', color: theme.textMuted },

  // Upcoming
  upcomingSection: { marginTop: 24 },

  // Tiers info
  tiersSection: { marginTop: 28, paddingBottom: 20 },
  tierCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierIcon: { fontSize: 24 },
  tierInfo: { flex: 1, gap: 2 },
  tierName: { fontSize: 16, fontWeight: '800' },
  tierDesc: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  tierPerks: { gap: 8, paddingLeft: 4 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  emptySub: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },
});
