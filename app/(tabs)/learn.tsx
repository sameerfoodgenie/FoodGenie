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
import {
  useCreator,
  CREATOR_TIERS,
  LiveSession,
  TrendingShow,
  TopCreator,
  NewCreator,
} from '../../contexts/CreatorContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CHEF_CARD_W = 130;
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
function TrendingChefCard({ creator, rank, onPress }: { creator: TopCreator; rank: number; onPress: () => void }) {
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
            <MaterialIcons name="verified" size={12} color="#D4AF37" />
          </View>
        ) : null}
      </View>
      <Text style={styles.chefName} numberOfLines={1}>@{creator.username}</Text>
      {tier ? (
        <View style={[styles.chefTierTag, { backgroundColor: `${tier.color}15` }]}>
          <Text style={styles.chefTierEmoji}>{tier.emoji}</Text>
        </View>
      ) : null}
      <Text style={styles.chefFollowers}>{formatCount(creator.followers)}</Text>
      <Text style={styles.chefFollowersLabel}>followers</Text>
      <Pressable
        style={({ pressed }) => [styles.chefFollowBtn, pressed && { opacity: 0.8 }]}
        onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      >
        <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.chefFollowBtnGrad}>
          <Text style={styles.chefFollowText}>Follow</Text>
        </LinearGradient>
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
        <View style={[styles.liveCardImage, { backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 36, opacity: 0.3 }}>🎬</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.90)']}
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
            <Text style={styles.priceText}>₹{session.price}</Text>
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
          <MaterialIcons name="people" size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.liveAttendees}>{session.attendeeCount}</Text>
        </View>
        {/* Join button */}
        <Pressable
          style={({ pressed }) => [styles.joinBtn, isLive && styles.joinBtnLive, pressed && { opacity: 0.85 }]}
          onPress={(e) => { e.stopPropagation(); onPress(); }}
        >
          {isLive ? (
            <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.joinBtnGrad}>
              <MaterialIcons name="play-arrow" size={16} color="#0A0A0A" />
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
        <View style={[styles.showCardImage, { backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 28 }}>🎬</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.92)']}
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
        <View style={[styles.newCreatorCover, { backgroundColor: '#1A1A1A' }]} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.95)']}
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

  const liveNow = liveSessions.filter(s => s.isLive);
  const upcoming = liveSessions.filter(s => !s.isLive).slice(0, 3);
  const allSessions = [...liveNow, ...upcoming];

  const handleSessionPress = useCallback((session: LiveSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/live-session', params: { sessionId: session.id } });
  }, [router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Learn</Text>
          <Text style={styles.headerSubtitle}>Discover Home Chefs & Shows</Text>
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
        <Animated.View entering={FadeInDown.delay(50).duration(350)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>🔥</Text>
              <Text style={styles.sectionTitle}>Trending Home Chefs</Text>
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
                  onPress={() => Haptics.selectionAsync()}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ─── Live & Upcoming ─── */}
        {allSessions.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionIcon}>📡</Text>
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
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>⭐</Text>
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

        {/* ─── New Creators ─── */}
        <Animated.View entering={FadeInDown.delay(300).duration(350)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>🌱</Text>
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

        {/* ─── Become a Creator CTA ─── */}
        <Animated.View entering={FadeInDown.delay(400).duration(350)} style={styles.ctaSection}>
          <LinearGradient
            colors={['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)']}
            style={styles.ctaCard}
          >
            <View style={styles.ctaIcon}>
              <MaterialIcons name="auto-awesome" size={28} color="#D4AF37" />
            </View>
            <Text style={styles.ctaTitle}>Start Your Food Journey</Text>
            <Text style={styles.ctaDesc}>Post 5 meals or maintain a 7-day streak to unlock Creator Mode</Text>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/camera'); }}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.ctaBtn}>
                <MaterialIcons name="camera-alt" size={18} color="#0A0A0A" />
                <Text style={styles.ctaBtnText}>Start Posting</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '500', color: '#6B6B6B', marginTop: 2 },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },

  // Live banner
  liveBanner: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, overflow: 'hidden' },
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
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },

  // Chef Card
  chefCard: {
    width: CHEF_CARD_W,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
    gap: 4,
  },
  chefAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.20)',
    marginBottom: 4,
  },
  chefAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  verifiedDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#0A0A0A',
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
  chefFollowersLabel: { fontSize: 10, fontWeight: '500', color: '#6B6B6B', marginTop: -2 },
  chefFollowBtn: {
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  chefFollowBtnGrad: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 14,
  },
  chefFollowText: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },

  // Live card
  liveCard: {
    height: 180,
    borderRadius: 16,
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
    padding: 14,
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
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  countdownText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(212,175,55,0.90)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: { fontSize: 13, fontWeight: '800', color: '#0A0A0A' },
  freeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(74,222,128,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  freeText: { fontSize: 11, fontWeight: '800', color: '#0A0A0A', letterSpacing: 0.5 },
  liveTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  liveMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  miniAvatarText: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  liveHost: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  liveDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.25)' },
  liveAttendees: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  joinBtn: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 2,
  },
  joinBtnLive: {},
  joinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  joinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    borderRadius: 20,
  },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },
  joinBtnTextLive: { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },

  // Show Card
  showCard: {
    width: SHOW_CARD_W,
    height: SHOW_CARD_W * 1.2,
    borderRadius: 16,
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
    padding: 14,
    gap: 4,
  },
  showRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.20)',
  },
  showRating: { fontSize: 12, fontWeight: '700', color: '#FFD700' },
  showCardTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  showCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  showCardHost: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  showCardStats: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },

  // New Creator Card
  newCreatorCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
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
    paddingBottom: 14,
    paddingHorizontal: 10,
    gap: 3,
  },
  newCreatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4ADE80',
    marginBottom: 4,
  },
  newCreatorAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  newCreatorName: { fontSize: 12, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  newCreatorMeta: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  newCreatorBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,10,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CTA Section
  ctaSection: { paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
  ctaCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  ctaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  ctaDesc: { fontSize: 14, fontWeight: '500', color: '#6B6B6B', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
});
