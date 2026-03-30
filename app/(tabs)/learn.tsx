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
import { theme } from '../../constants/theme';
import { usePosts } from '../../contexts/PostContext';
import {
  useCreator,
  CREATOR_TIERS,
  LiveSession,
  TrendingShow,
  TopCreator,
  NewCreator,
} from '../../contexts/CreatorContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CHEF_CARD_W = 136;
const SHOW_CARD_W = SCREEN_W * 0.65;

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

function timeAgoShort(ts: number): string {
  const diff = Date.now() - ts;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Trending Home Chef Card ───
function TrendingChefCard({ creator, rank, isFollowed, onFollow, onPress }: { creator: TopCreator; rank: number; isFollowed: boolean; onFollow: () => void; onPress: () => void }) {
  const tier = getTierInfo(creator.creatorType);

  return (
    <Pressable
      style={({ pressed }) => [styles.chefCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
      onPress={onPress}
    >
      <View style={[styles.chefAvatar, tier ? { borderColor: tier.color } : {}]}>
        <Text style={styles.chefAvatarText}>{creator.avatarInitials}</Text>
        {creator.isVerified ? (
          <View style={styles.verifiedDot}>
            <MaterialIcons name="verified" size={12} color="#FFD700" />
          </View>
        ) : null}
      </View>
      <Text style={styles.chefName} numberOfLines={1}>@{creator.username}</Text>
      {tier ? (
        <View style={[styles.chefTierTag, { backgroundColor: `${tier.color}12` }]}>
          <Text style={styles.chefTierEmoji}>{tier.emoji}</Text>
        </View>
      ) : null}
      <Text style={styles.chefFollowers}>{formatCount(creator.followers)}</Text>
      <Text style={styles.chefFollowersLabel}>followers</Text>
      <Pressable
        style={({ pressed }) => [styles.chefFollowBtn, pressed && { opacity: 0.8 }]}
        onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onFollow(); }}
      >
        {isFollowed ? (
          <View style={styles.chefFollowingBtnInner}>
            <Text style={styles.chefFollowingText}>Following</Text>
          </View>
        ) : (
          <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.chefFollowBtnGrad}>
            <Text style={styles.chefFollowText}>Follow</Text>
          </LinearGradient>
        )}
      </Pressable>
    </Pressable>
  );
}

// ─── Live Now Card ───
function LiveNowCard({ session, onPress }: { session: LiveSession; onPress: () => void }) {
  const tier = getTierInfo(session.hostCreatorType);
  const isLive = session.isLive;
  const timeUntil = session.scheduledAt - Date.now();

  return (
    <Pressable
      style={({ pressed }) => [styles.liveCard, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      {session.coverUri ? (
        <Image source={{ uri: session.coverUri }} style={styles.liveCardImage} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.liveCardImage, { backgroundColor: '#18181E', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 36, opacity: 0.3 }}>🎬</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,15,0.92)']}
        style={styles.liveCardOverlay}
      >
        {/* Status badge */}
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.countdownBadge}>
            <MaterialIcons name="schedule" size={11} color="#D4AF37" />
            <Text style={styles.countdownText}>in {formatTime(timeUntil)}</Text>
          </View>
        )}
        {/* Price */}
        {session.isPaid ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{'\u20B9'}{session.price}</Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        )}
        <Text style={styles.liveTitle} numberOfLines={1}>{session.title}</Text>
        <View style={styles.liveMetaRow}>
          <View style={[styles.miniAvatar, tier ? { borderColor: tier.color } : {}]}>
            <Text style={styles.miniAvatarText}>{session.hostAvatarInitials}</Text>
          </View>
          <Text style={styles.liveHost}>@{session.hostUsername}</Text>
          <View style={styles.liveDivider} />
          <MaterialIcons name="people" size={13} color="rgba(255,255,255,0.35)" />
          <Text style={styles.liveAttendees}>{session.attendeeCount}</Text>
        </View>
        {/* Join button */}
        <Pressable
          style={({ pressed }) => [styles.joinBtn, isLive && styles.joinBtnLive, pressed && { opacity: 0.85 }]}
          onPress={(e) => { e.stopPropagation(); onPress(); }}
        >
          {isLive ? (
            <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.joinBtnGrad}>
              <MaterialIcons name="play-arrow" size={16} color="#0A0A0F" />
              <Text style={styles.joinBtnTextLive}>Join Now</Text>
            </LinearGradient>
          ) : (
            <View style={styles.joinBtnInner}>
              <MaterialIcons name="notifications-none" size={16} color="#D4AF37" />
              <Text style={styles.joinBtnText}>Remind Me</Text>
            </View>
          )}
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Popular Show Card ───
function PopularShowCard({ show, onPress }: { show: TrendingShow; onPress: () => void }) {
  const tier = getTierInfo(show.hostCreatorType);

  return (
    <Pressable
      style={({ pressed }) => [styles.showCard, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      {show.coverUri ? (
        <Image source={{ uri: show.coverUri }} style={styles.showCardImage} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.showCardImage, { backgroundColor: '#18181E', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 28 }}>🎬</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,15,0.94)']}
        style={styles.showCardOverlay}
      >
        <View style={styles.showRatingBadge}>
          <MaterialIcons name="star" size={11} color="#FFD700" />
          <Text style={styles.showRating}>{show.rating}</Text>
        </View>
        <Text style={styles.showCardTitle} numberOfLines={2}>{show.title}</Text>
        <View style={styles.showCardMeta}>
          <View style={[styles.miniAvatar, { width: 20, height: 20, borderRadius: 10 }, tier ? { borderColor: tier.color } : {}]}>
            <Text style={[styles.miniAvatarText, { fontSize: 8 }]}>{show.hostAvatarInitials}</Text>
          </View>
          <Text style={styles.showCardHost}>@{show.hostUsername}</Text>
        </View>
        <Text style={styles.showCardStats}>{show.episodeCount} episodes · {formatCount(show.viewCount)} views</Text>
      </LinearGradient>
    </Pressable>
  );
}

// ─── New Creator Card ───
function NewCreatorCard({ creator, onPress }: { creator: NewCreator; onPress: () => void }) {
  const tier = getTierInfo(creator.creatorType);

  return (
    <Pressable
      style={({ pressed }) => [styles.newCreatorCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      {creator.coverUri ? (
        <Image source={{ uri: creator.coverUri }} style={styles.newCreatorCover} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.newCreatorCover, { backgroundColor: '#18181E' }]} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,15,0.96)']}
        style={styles.newCreatorOverlay}
      >
        <View style={[styles.newCreatorAvatar, tier ? { borderColor: tier.color } : {}]}>
          <Text style={styles.newCreatorAvatarText}>{creator.avatarInitials}</Text>
        </View>
        <Text style={styles.newCreatorName} numberOfLines={1}>@{creator.username}</Text>
        <Text style={styles.newCreatorMeta}>{creator.postCount} posts · {timeAgoShort(creator.unlockedAt)}</Text>
      </LinearGradient>
      <View style={styles.newCreatorBadge}>
        <MaterialIcons name="fiber-new" size={14} color="#4ADE80" />
      </View>
    </Pressable>
  );
}

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { liveSessions, trendingShows, topCreators, newCreators } = useCreator();
  const { toggleFollow, isFollowing } = usePosts();

  const liveNow = liveSessions.filter(s => s.isLive);
  const upcoming = liveSessions.filter(s => !s.isLive).slice(0, 3);
  const allSessions = [...liveNow, ...upcoming];

  const handleFollow = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFollow(userId);
  }, [toggleFollow]);

  const handleSessionPress = useCallback((session: LiveSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/live-session', params: { sessionId: session.id } });
  }, [router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header — refined */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Home Chefs, Shows & Live</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { Haptics.selectionAsync(); router.push('/shows'); }}
        >
          <MaterialIcons name="explore" size={22} color="#D4AF37" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ─── Live Now Banner ─── */}
        {liveNow.length > 0 ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <Pressable
              style={({ pressed }) => [styles.liveBanner, pressed && { opacity: 0.95 }]}
              onPress={() => handleSessionPress(liveNow[0])}
            >
              <LinearGradient colors={['#FF3B30', '#CC2D25']} style={styles.liveBannerGrad}>
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

        {/* ─── Trending Home Chefs ─── */}
        {topCreators.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(50).duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Trending Chefs</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {topCreators.map((creator, i) => (
                <Animated.View key={creator.id} entering={FadeInRight.delay(i * 60).duration(250)}>
                  <TrendingChefCard
                    creator={creator}
                    rank={i + 1}
                    isFollowed={isFollowing(creator.id)}
                    onFollow={() => handleFollow(creator.id)}
                    onPress={() => Haptics.selectionAsync()}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* ─── Live & Upcoming ─── */}
        {allSessions.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Live & Upcoming</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/shows'); }}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <MaterialIcons name="chevron-right" size={18} color="#D4AF37" />
              </Pressable>
            </View>
            {allSessions.map((session, i) => (
              <Animated.View key={session.id} entering={FadeInDown.delay(120 + i * 60).duration(300)} style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <LiveNowCard session={session} onPress={() => handleSessionPress(session)} />
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}

        {/* ─── Popular Shows ─── */}
        {trendingShows.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Popular Shows</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            >
              {trendingShows.map((show, i) => (
                <Animated.View key={show.id} entering={FadeInRight.delay(i * 70).duration(280)}>
                  <PopularShowCard show={show} onPress={() => Haptics.selectionAsync()} />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* ─── New Creators ─── */}
        {newCreators.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>New Creators</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {newCreators.map((creator, i) => (
                <Animated.View key={creator.id} entering={FadeInRight.delay(i * 60).duration(250)}>
                  <NewCreatorCard creator={creator} onPress={() => Haptics.selectionAsync()} />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* ─── Become a Creator CTA ─── */}
        <Animated.View entering={FadeInDown.delay(400).duration(350)} style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaIcon}>
              <MaterialIcons name="auto-awesome" size={28} color="#FFD700" />
            </View>
            <Text style={styles.ctaTitle}>Start Your Food Journey</Text>
            <Text style={styles.ctaDesc}>Post 5 meals or maintain a 7-day streak to unlock Creator Mode</Text>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/camera'); }}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.ctaBtn}>
                <MaterialIcons name="camera-alt" size={18} color="#0A0A0F" />
                <Text style={styles.ctaBtnText}>Start Posting</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 3 },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111116',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },

  // Live banner
  liveBanner: { marginHorizontal: 20, marginTop: 8, borderRadius: 18, overflow: 'hidden' },
  liveBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  liveBannerLeft: { flex: 1, gap: 5, marginRight: 12 },
  liveBannerDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBannerLabel: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  liveBannerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  liveBannerHost: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },

  // Chef Card — glass
  chefCard: {
    width: CHEF_CARD_W,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  chefAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#18181E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.18)',
    marginBottom: 4,
  },
  chefAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  verifiedDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#0A0A0F',
    borderRadius: 8,
    padding: 1,
  },
  chefName: { fontSize: 12, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  chefTierTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chefTierEmoji: { fontSize: 12 },
  chefFollowers: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  chefFollowersLabel: { fontSize: 10, fontWeight: '500', color: '#6B7280', marginTop: -2 },
  chefFollowBtn: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  chefFollowBtnGrad: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 14,
  },
  chefFollowText: { fontSize: 12, fontWeight: '700', color: '#0A0A0F' },
  chefFollowingBtnInner: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  chefFollowingText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },

  // Live card — glass
  liveCard: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
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
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  countdownText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },
  priceBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(212,175,55,0.90)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: { fontSize: 13, fontWeight: '800', color: '#0A0A0F' },
  freeBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(74,222,128,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  freeText: { fontSize: 11, fontWeight: '800', color: '#0A0A0F', letterSpacing: 0.5 },
  liveTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  liveMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  miniAvatarText: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  liveHost: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  liveDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.20)' },
  liveAttendees: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  joinBtn: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 4,
  },
  joinBtnLive: {},
  joinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  joinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
    borderRadius: 20,
  },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },
  joinBtnTextLive: { fontSize: 13, fontWeight: '700', color: '#0A0A0F' },

  // Show Card
  showCard: {
    width: SHOW_CARD_W,
    height: SHOW_CARD_W * 1.2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  showCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  showCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 4,
  },
  showRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10,10,15,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  showRating: { fontSize: 12, fontWeight: '700', color: '#FFD700' },
  showCardTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  showCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  showCardHost: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  showCardStats: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.40)' },

  // New Creator Card
  newCreatorCard: {
    width: 144,
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  newCreatorCover: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  newCreatorOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 10,
    gap: 3,
  },
  newCreatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4ADE80',
    marginBottom: 4,
  },
  newCreatorAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  newCreatorName: { fontSize: 12, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  newCreatorMeta: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  newCreatorBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,15,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CTA Section
  ctaSection: { paddingHorizontal: 20, marginTop: 34, marginBottom: 16 },
  ctaCard: {
    padding: 28,
    borderRadius: 22,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
    backgroundColor: '#111116',
  },
  ctaIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212,175,55,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  ctaDesc: { fontSize: 14, fontWeight: '500', color: '#6B7280', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 8,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0A0F' },
});
