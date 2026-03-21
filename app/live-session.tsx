import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useCreator, CREATOR_TIERS } from '../contexts/CreatorContext';
import { useAlert } from '@/template';

const { width: SCREEN_W } = Dimensions.get('window');

function getTierInfo(type: string | null) {
  return CREATOR_TIERS.find(t => t.id === type) || null;
}

function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, targetTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const totalSec = Math.floor(timeLeft / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.countdownWrap}>
      <Text style={styles.countdownLabel}>Starts in</Text>
      <View style={styles.countdownDigits}>
        <View style={styles.digitBlock}>
          <Text style={styles.digitText}>{pad(hours)}</Text>
          <Text style={styles.digitUnit}>hrs</Text>
        </View>
        <Text style={styles.digitSep}>:</Text>
        <View style={styles.digitBlock}>
          <Text style={styles.digitText}>{pad(minutes)}</Text>
          <Text style={styles.digitUnit}>min</Text>
        </View>
        <Text style={styles.digitSep}>:</Text>
        <View style={styles.digitBlock}>
          <Text style={styles.digitText}>{pad(seconds)}</Text>
          <Text style={styles.digitUnit}>sec</Text>
        </View>
      </View>
    </View>
  );
}

function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1, false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1, false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulsingWrap}>
      <Animated.View style={[styles.pulsingRing, animStyle]} />
      <View style={styles.pulsingCore} />
    </View>
  );
}

export default function LiveSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { liveSessions, joinLiveSession } = useCreator();
  const { showAlert } = useAlert();
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const session = liveSessions.find(s => s.id === params.sessionId);

  if (!session) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>Session not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const tier = getTierInfo(session.hostCreatorType);
  const spotsLeft = session.maxAttendees - session.attendeeCount;

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(prev => !prev);
  };

  const handleJoin = () => {
    if (!isFollowing) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert('Follow Required', 'You need to follow this chef to join their session');
      return;
    }
    if (session.isPaid && !hasJoined) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      showAlert('Confirm Payment', `Pay ₹${session.price} to join this session?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay ₹${session.price}`,
          onPress: () => {
            joinLiveSession(session.id);
            setHasJoined(true);
            showAlert('Joined', 'You have joined the session. You will be notified when it starts.');
          },
        },
      ]);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    joinLiveSession(session.id);
    setHasJoined(true);
    if (session.isLive) {
      showAlert('Welcome', 'You are now in the live session!');
    } else {
      showAlert('Joined', 'You will be notified when the session starts.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          {session.coverUri ? (
            <Image source={{ uri: session.coverUri }} style={styles.heroImage} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: theme.backgroundTertiary }]}>
              <Text style={{ fontSize: 60, opacity: 0.3 }}>🎬</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(10,10,15,0.5)', 'transparent', 'rgba(10,10,15,0.9)', theme.background]}
            locations={[0, 0.3, 0.75, 1]}
            style={styles.heroOverlay}
          />
          {/* Back button */}
          <Pressable
            style={[styles.backFloating, { top: insets.top + 8 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>

          {/* Status badge */}
          <View style={[styles.statusBadge, { top: insets.top + 12 }]}>
            {session.isLive ? (
              <View style={styles.liveStatusBadge}>
                <PulsingDot />
                <Text style={styles.liveStatusText}>LIVE</Text>
              </View>
            ) : (
              <View style={styles.upcomingStatusBadge}>
                <MaterialIcons name="schedule" size={14} color={theme.accent} />
                <Text style={styles.upcomingStatusText}>Upcoming</Text>
              </View>
            )}
          </View>

          {/* Paid badge */}
          {session.isPaid ? (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>₹{session.price}</Text>
            </View>
          ) : (
            <View style={[styles.priceBadge, { backgroundColor: 'rgba(74,222,128,0.9)' }]}>
              <Text style={[styles.priceText, { color: '#0A0A0F' }]}>FREE</Text>
            </View>
          )}
        </View>

        {/* Title & Description */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.infoSection}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionDesc}>{session.description}</Text>
        </Animated.View>

        {/* Host info */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.hostSection}>
          <View style={styles.hostLeft}>
            <View style={[styles.hostAvatar, tier ? { borderColor: tier.color } : {}]}>
              <Text style={styles.hostAvatarText}>{session.hostAvatarInitials}</Text>
            </View>
            <View>
              <View style={styles.hostNameRow}>
                <Text style={styles.hostName}>@{session.hostUsername}</Text>
                {tier ? <Text style={styles.hostTierEmoji}>{tier.emoji}</Text> : null}
              </View>
              {tier ? <Text style={[styles.hostTierName, { color: tier.color }]}>{tier.name}</Text> : null}
            </View>
          </View>
          <Pressable
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleFollow}
          >
            <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Countdown (if not live) */}
        {!session.isLive ? (
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <CountdownTimer targetTime={session.scheduledAt} />
          </Animated.View>
        ) : null}

        {/* Session stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={22} color={theme.primary} />
            <Text style={styles.statVal}>{session.attendeeCount}</Text>
            <Text style={styles.statLabel}>{session.isLive ? 'Watching' : 'Joined'}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="event-seat" size={22} color={theme.accent} />
            <Text style={styles.statVal}>{spotsLeft}</Text>
            <Text style={styles.statLabel}>Spots Left</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="group" size={22} color="#A855F7" />
            <Text style={styles.statVal}>{session.maxAttendees}</Text>
            <Text style={styles.statLabel}>Max Seats</Text>
          </View>
        </Animated.View>

        {/* What to expect */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.expectSection}>
          <Text style={styles.expectTitle}>What to Expect</Text>
          <View style={styles.expectList}>
            {['Live cooking demonstration', 'Interactive Q&A with the chef', 'Recipe shared after session', 'Tips and tricks from a pro'].map((item, i) => (
              <View key={i} style={styles.expectItem}>
                <MaterialIcons name="check-circle" size={16} color={theme.primary} />
                <Text style={styles.expectText}>{item}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        {hasJoined ? (
          <View style={styles.joinedBar}>
            <MaterialIcons name="check-circle" size={22} color={theme.primary} />
            <Text style={styles.joinedText}>
              {session.isLive ? 'You are in the session' : 'You have joined — we will notify you'}
            </Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleJoin}
          >
            <LinearGradient
              colors={session.isLive ? ['#EF4444', '#DC2626'] : [theme.primary, theme.primaryDark]}
              style={styles.joinBtn}
            >
              <MaterialIcons
                name={session.isLive ? 'sensors' : 'event-available'}
                size={22}
                color={session.isLive ? '#FFF' : theme.textOnPrimary}
              />
              <Text style={[styles.joinBtnText, session.isLive ? { color: '#FFF' } : {}]}>
                {session.isLive
                  ? 'Join Live Session'
                  : session.isPaid
                    ? `Pay ₹${session.price} & Reserve Spot`
                    : 'Reserve Your Spot'
                }
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Hero
  heroSection: {
    width: SCREEN_W,
    height: SCREEN_W * 0.75,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  backFloating: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  liveStatusText: { fontSize: 13, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  upcomingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  upcomingStatusText: { fontSize: 13, fontWeight: '700', color: theme.accent },
  priceBadge: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(251,191,36,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  priceText: { fontSize: 16, fontWeight: '800', color: '#0A0A0F' },

  // Pulsing dot
  pulsingWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pulsingRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
  },
  pulsingCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },

  // Info
  infoSection: { paddingHorizontal: 20, paddingTop: 4, gap: 8 },
  sessionTitle: { fontSize: 26, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.5 },
  sessionDesc: { fontSize: 15, fontWeight: '500', color: theme.textSecondary, lineHeight: 22 },

  // Host
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  hostLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  hostAvatarText: { fontSize: 17, fontWeight: '800', color: theme.textPrimary },
  hostNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hostName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  hostTierEmoji: { fontSize: 16 },
  hostTierName: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  followBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.primary,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  followText: { fontSize: 14, fontWeight: '700', color: theme.textOnPrimary },
  followTextActive: { color: theme.textSecondary },

  // Countdown
  countdownWrap: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    gap: 12,
  },
  countdownLabel: { fontSize: 13, fontWeight: '700', color: theme.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  countdownDigits: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  digitBlock: { alignItems: 'center', gap: 2 },
  digitText: { fontSize: 40, fontWeight: '900', color: theme.textPrimary, fontVariant: ['tabular-nums'] },
  digitUnit: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  digitSep: { fontSize: 32, fontWeight: '700', color: theme.textMuted, marginBottom: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  statVal: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },

  // Expect
  expectSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  expectTitle: { fontSize: 17, fontWeight: '800', color: theme.textPrimary },
  expectList: { gap: 10 },
  expectItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expectText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  joinBtnText: { fontSize: 17, fontWeight: '800', color: theme.textOnPrimary },
  joinedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  joinedText: { fontSize: 15, fontWeight: '600', color: theme.primary },
});
