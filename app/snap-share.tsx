import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9); // 9:16 story ratio

// Personality vibes based on user behavior
interface VibeData {
  headline: string;
  score: number;
  scoreLabel: string;
  emoji: string;
}

function generateVibe(preferences: any, query: string): VibeData {
  const q = (query || '').toLowerCase();
  const diet = preferences?.diet || 'veg';
  const spice = preferences?.spiceLevel || 2;
  const budgetMax = preferences?.budgetMax || 500;
  const sessions = preferences?.sessionCount || 0;

  // Query-based vibes
  if (q.includes('cheat') || q.includes('comfort') || q.includes('pizza') || q.includes('burger')) {
    return { headline: 'Cheat Day\nActivated', score: 87, scoreLabel: 'Comfort Food Energy', emoji: '🍕' };
  }
  if (q.includes('healthy') || q.includes('protein') || q.includes('salad') || q.includes('light')) {
    return { headline: 'Clean Eating\nMode ON', score: 94, scoreLabel: 'Health Warrior Vibes', emoji: '💪' };
  }
  if (q.includes('spicy') || q.includes('hot') || q.includes('chilli')) {
    return { headline: 'Spice Lord\nRising', score: 91, scoreLabel: 'Heat Seeker Energy', emoji: '🌶️' };
  }
  if (q.includes('sweet') || q.includes('dessert') || q.includes('cake')) {
    return { headline: 'Sweet Tooth\nUnleashed', score: 89, scoreLabel: 'Sugar Rush Vibes', emoji: '🍰' };
  }
  if (q.includes('biryani') || q.includes('thali') || q.includes('north indian')) {
    return { headline: 'Desi Foodie\nVibes Only', score: 93, scoreLabel: 'Authentic Flavor Energy', emoji: '🍛' };
  }
  if (q.includes('chinese') || q.includes('noodle') || q.includes('momos')) {
    return { headline: 'Wok Game\nStrong', score: 88, scoreLabel: 'Fusion Food Energy', emoji: '🥡' };
  }

  // Preference-based fallbacks
  if (spice >= 3) {
    return { headline: 'Born to\nHandle Heat', score: 95, scoreLabel: 'Spice Tolerance Level', emoji: '🔥' };
  }
  if (budgetMax <= 250) {
    return { headline: 'Budget Boss\nMoves Only', score: 88, scoreLabel: 'Smart Saver Energy', emoji: '💰' };
  }
  if (diet === 'veg') {
    return { headline: 'Green Power\nActivated', score: 92, scoreLabel: 'Plant-Based Vibes', emoji: '🌿' };
  }
  if (sessions > 10) {
    return { headline: 'Certified\nFoodie', score: 96, scoreLabel: 'Genie Power User', emoji: '✨' };
  }

  // Default
  return { headline: 'Foodie Mode\nActivated', score: 85, scoreLabel: 'Craving Confidence', emoji: '🧞‍♂️' };
}

export default function SnapShareScreen() {
  const router = useRouter();
  const { preferences, currentQuery, unlockShareReward, shareRewardUnlocked } = useApp();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const vibe = useMemo(() => generateVibe(preferences, currentQuery), [preferences, currentQuery]);

  // Reward animation
  const rewardScale = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);
  const rewardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));

  const triggerReward = useCallback(() => {
    setShowReward(true);
    unlockShareReward();
    rewardOpacity.value = withTiming(1, { duration: 300 });
    rewardScale.value = withSequence(
      withSpring(1.15, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
  }, [unlockShareReward]);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Capture view as image
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your FoodGenie vibe',
          });
          // After share dialog closes, trigger reward
          triggerReward();
        } else {
          // Fallback: text share
          await Share.share({
            message: `${vibe.headline.replace('\n', ' ')} ${vibe.emoji}\n${vibe.score}% ${vibe.scoreLabel}\n\n#FoodGenieVibe\nDecided by FoodGenie`,
          });
          triggerReward();
        }
      }
    } catch (e: any) {
      // User cancelled — still counts
      if (e?.message?.includes('cancel') || e?.message?.includes('dismiss')) {
        triggerReward();
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, vibe, triggerReward]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1a1400', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Snap & Share</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Card Preview */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.cardContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
            style={styles.viewShot}
          >
            {/* ─── SHARE CARD (9:16 story-friendly) ─── */}
            <View style={[styles.shareCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
              <LinearGradient
                colors={['#0D0D0D', '#1A1200', '#0D0D0D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Subtle gold corner glow */}
              <View style={styles.cornerGlowTL} />
              <View style={styles.cornerGlowBR} />

              {/* Top: Logo + hashtag */}
              <View style={styles.cardTop}>
                <View style={styles.logoRow}>
                  <Image
                    source={require('../assets/images/genie-mascot.png')}
                    style={styles.logoImage}
                    contentFit="contain"
                  />
                  <Text style={styles.logoText}>FoodGenie</Text>
                </View>
                <Text style={styles.hashtag}>#FoodGenieVibe</Text>
              </View>

              {/* Center: Personality headline */}
              <View style={styles.cardCenter}>
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                <Text style={styles.vibeHeadline}>{vibe.headline}</Text>
              </View>

              {/* Score */}
              <View style={styles.cardScore}>
                <View style={styles.scoreRing}>
                  <LinearGradient
                    colors={['#FBBF24', '#F59E0B', '#D97706']}
                    style={styles.scoreGradient}
                  >
                    <Text style={styles.scoreNumber}>{vibe.score}%</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.scoreLabel}>{vibe.scoreLabel}</Text>
              </View>

              {/* Bottom: Attribution */}
              <View style={styles.cardBottom}>
                <View style={styles.dividerLine} />
                <Text style={styles.attribution}>Decided by FoodGenie</Text>
              </View>
            </View>
          </ViewShot>
        </Animated.View>

        {/* Share Button */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actionArea}>
          {!showReward ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={handleShare}
                disabled={isSharing}
              >
                <LinearGradient colors={theme.gradients.goldShine} style={styles.shareBtnGradient}>
                  <MaterialIcons name={isSharing ? 'hourglass-top' : 'share'} size={20} color={theme.textOnPrimary} />
                  <Text style={styles.shareBtnText}>
                    {isSharing ? 'Preparing...' : 'Share to Stories'}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Text style={styles.shareHint}>Share your vibe and unlock a reward</Text>
            </>
          ) : (
            <Animated.View style={[styles.rewardCard, rewardStyle]}>
              <LinearGradient
                colors={['rgba(251,191,36,0.15)', 'rgba(251,191,36,0.05)']}
                style={styles.rewardGradient}
              >
                <Text style={styles.rewardEmoji}>🎁</Text>
                <Text style={styles.rewardTitle}>Reward Unlocked!</Text>
                <Text style={styles.rewardDesc}>
                  You earned the "Vibe Sharer" badge. Check your profile for exclusive perks.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.rewardDoneBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleClose}
                >
                  <Text style={styles.rewardDoneText}>Continue</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
  },

  // Card container
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  viewShot: {
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.cardElevated,
  },

  // ── Share Card ──
  shareCard: {
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.2)',
  },

  // Corner glows
  cornerGlowTL: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251,191,36,0.06)',
  },
  cornerGlowBR: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251,191,36,0.06)',
  },

  // Top
  cardTop: {
    alignItems: 'center',
    gap: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.3,
  },
  hashtag: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(251,191,36,0.6)',
    letterSpacing: 0.5,
  },

  // Center
  cardCenter: {
    alignItems: 'center',
    gap: 16,
  },
  vibeEmoji: {
    fontSize: 52,
  },
  vibeHeadline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(251,191,36,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  // Score
  cardScore: {
    alignItems: 'center',
    gap: 8,
  },
  scoreRing: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  scoreGradient: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 38,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textOnPrimary,
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.3,
  },

  // Bottom
  cardBottom: {
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(251,191,36,0.2)',
  },
  attribution: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textMuted,
    letterSpacing: 0.3,
  },

  // Action area
  actionArea: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  shareBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  shareHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 10,
  },

  // Reward
  rewardCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  rewardGradient: {
    alignItems: 'center',
    padding: 28,
    gap: 10,
  },
  rewardEmoji: {
    fontSize: 44,
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
  },
  rewardDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  rewardDoneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  rewardDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
  },
});
