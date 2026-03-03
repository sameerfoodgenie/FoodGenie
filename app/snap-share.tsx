import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth, useAlert } from '@/template';
import {
  trackShareEvent,
  claimReward,
  linkGuestSharesToUser,
} from '../services/rewardService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

interface VibeData {
  headline: string;
  score: number;
  scoreLabel: string;
  emoji: string;
}

function generateVibe(preferences: any, query: string): VibeData {
  const q = (query || '').toLowerCase();
  const spice = preferences?.spiceLevel || 2;
  const budgetMax = preferences?.budgetMax || 500;
  const diet = preferences?.diet || 'veg';
  const sessions = preferences?.sessionCount || 0;

  if (q.includes('cheat') || q.includes('comfort') || q.includes('pizza') || q.includes('burger'))
    return { headline: 'Cheat Day\nActivated', score: 87, scoreLabel: 'Comfort Food Energy', emoji: '🍕' };
  if (q.includes('healthy') || q.includes('protein') || q.includes('salad') || q.includes('light'))
    return { headline: 'Clean Eating\nMode ON', score: 94, scoreLabel: 'Health Warrior Vibes', emoji: '💪' };
  if (q.includes('spicy') || q.includes('hot') || q.includes('chilli'))
    return { headline: 'Spice Lord\nRising', score: 91, scoreLabel: 'Heat Seeker Energy', emoji: '🌶️' };
  if (q.includes('sweet') || q.includes('dessert') || q.includes('cake'))
    return { headline: 'Sweet Tooth\nUnleashed', score: 89, scoreLabel: 'Sugar Rush Vibes', emoji: '🍰' };
  if (q.includes('biryani') || q.includes('thali') || q.includes('north indian'))
    return { headline: 'Desi Foodie\nVibes Only', score: 93, scoreLabel: 'Authentic Flavor Energy', emoji: '🍛' };
  if (q.includes('chinese') || q.includes('noodle') || q.includes('momos'))
    return { headline: 'Wok Game\nStrong', score: 88, scoreLabel: 'Fusion Food Energy', emoji: '🥡' };
  if (spice >= 3)
    return { headline: 'Born to\nHandle Heat', score: 95, scoreLabel: 'Spice Tolerance Level', emoji: '🔥' };
  if (budgetMax <= 250)
    return { headline: 'Budget Boss\nMoves Only', score: 88, scoreLabel: 'Smart Saver Energy', emoji: '💰' };
  if (diet === 'veg')
    return { headline: 'Green Power\nActivated', score: 92, scoreLabel: 'Plant-Based Vibes', emoji: '🌿' };
  if (sessions > 10)
    return { headline: 'Certified\nFoodie', score: 96, scoreLabel: 'Genie Power User', emoji: '✨' };

  return { headline: 'Foodie Mode\nActivated', score: 85, scoreLabel: 'Craving Confidence', emoji: '🧞‍♂️' };
}

type LoginStage = 'options' | 'email' | 'otp';

export default function SnapShareScreen() {
  const router = useRouter();
  const { preferences, currentQuery, unlockShareReward } = useApp();
  const { user, sendOTP, verifyOTPAndLogin, signInWithGoogle, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const viewShotRef = useRef<ViewShot>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingReward, setPendingReward] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Inline login state
  const [loginStage, setLoginStage] = useState<LoginStage>('options');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');

  const vibe = useMemo(() => generateVibe(preferences, currentQuery), [preferences, currentQuery]);

  // Reward animation
  const rewardScale = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);
  const rewardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));

  // Watch for user login while pending reward
  useEffect(() => {
    if (user?.id && pendingReward && !showReward) {
      handleClaimReward(user.id);
    }
  }, [user?.id, pendingReward]);

  const animateReward = useCallback(() => {
    rewardOpacity.value = withTiming(1, { duration: 300 });
    rewardScale.value = withSequence(
      withSpring(1.15, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
  }, []);

  const handleClaimReward = useCallback(async (userId: string) => {
    setIsClaiming(true);
    setShowLoginModal(false);

    try {
      // Link any guest shares to this user
      await linkGuestSharesToUser(userId);

      // Claim the reward
      await claimReward(userId, 'vibe_sharer', {
        headline: vibe.headline.replace('\n', ' '),
        score: vibe.score,
        claimedAt: new Date().toISOString(),
      });

      unlockShareReward();
      setShowReward(true);
      setPendingReward(false);
      animateReward();
    } catch (e) {
      console.log('Claim reward error:', e);
      // Still show reward UI even if DB fails
      unlockShareReward();
      setShowReward(true);
      setPendingReward(false);
      animateReward();
    } finally {
      setIsClaiming(false);
    }
  }, [vibe, unlockShareReward, animateReward]);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your FoodGenie vibe',
          });
        } else {
          await Share.share({
            message: `${vibe.headline.replace('\n', ' ')} ${vibe.emoji}\n${vibe.score}% ${vibe.scoreLabel}\n\n#FoodGenieVibe\nDecided by FoodGenie`,
          });
        }
      }
    } catch (e: any) {
      // User cancelled — still count as shared for UX
    }

    // Track share event (works for guests too)
    trackShareEvent(user?.id || null, 'vibe').catch(() => {});

    setHasShared(true);
    setIsSharing(false);
  }, [isSharing, vibe, user?.id]);

  const handleUnlockReward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (user?.id) {
      // Logged in — claim immediately
      handleClaimReward(user.id);
    } else {
      // Guest — show login modal
      setPendingReward(true);
      setLoginStage('options');
      setLoginEmail('');
      setLoginOtp('');
      setShowLoginModal(true);
    }
  }, [user?.id, handleClaimReward]);

  // ── Inline Login Handlers ──

  const handleLoginGoogle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await signInWithGoogle();
    if (error) {
      showAlert('Error', error);
    }
    // useEffect will handle reward claim when user appears
  }, [signInWithGoogle, showAlert]);

  const handleLoginSendOTP = useCallback(async () => {
    if (!loginEmail.trim()) {
      showAlert('Error', 'Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      showAlert('Error', 'Please enter a valid email');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await sendOTP(loginEmail.trim());
        if (!error) {
          setLoginStage('otp');
          return;
        }
        lastError = error;
      } catch (e: any) {
        lastError = e?.message || 'Network error';
      }
      if (attempt < 1) await new Promise(r => setTimeout(r, 1500));
    }
    showAlert('Could not send code', lastError);
  }, [loginEmail, sendOTP, showAlert]);

  const handleLoginVerifyOTP = useCallback(async () => {
    if (!loginOtp.trim()) {
      showAlert('Error', 'Please enter the code');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error, user: verifiedUser } = await verifyOTPAndLogin(loginEmail.trim(), loginOtp.trim());
      if (error && !verifiedUser) {
        showAlert('Verification Failed', error);
        return;
      }
      // useEffect handles reward claim
    } catch (e: any) {
      showAlert('Error', e?.message || 'Something went wrong');
    }
  }, [loginOtp, loginEmail, verifyOTPAndLogin, showAlert]);

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
            <View style={[styles.shareCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
              <LinearGradient
                colors={['#0D0D0D', '#1A1200', '#0D0D0D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.cornerGlowTL} />
              <View style={styles.cornerGlowBR} />

              {/* Top */}
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

              {/* Center */}
              <View style={styles.cardCenter}>
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                <Text style={styles.vibeHeadline}>{vibe.headline}</Text>
              </View>

              {/* Score */}
              <View style={styles.cardScore}>
                <View style={styles.scoreRing}>
                  <LinearGradient colors={['#FBBF24', '#F59E0B', '#D97706']} style={styles.scoreGradient}>
                    <Text style={styles.scoreNumber}>{vibe.score}%</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.scoreLabel}>{vibe.scoreLabel}</Text>
              </View>

              {/* Bottom */}
              <View style={styles.cardBottom}>
                <View style={styles.dividerLine} />
                <Text style={styles.attribution}>Decided by FoodGenie</Text>
              </View>
            </View>
          </ViewShot>
        </Animated.View>

        {/* Action Area */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actionArea}>
          {showReward ? (
            /* ── Reward Claimed ── */
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
          ) : hasShared ? (
            /* ── After Share: Unlock Reward ── */
            <View style={styles.afterShareArea}>
              <Text style={styles.afterShareCheck}>✅ Shared!</Text>
              <Pressable
                style={({ pressed }) => [styles.unlockBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={handleUnlockReward}
                disabled={isClaiming}
              >
                <LinearGradient colors={theme.gradients.goldShine} style={styles.unlockGradient}>
                  {isClaiming ? (
                    <ActivityIndicator size="small" color={theme.textOnPrimary} />
                  ) : (
                    <MaterialIcons name="lock-open" size={20} color={theme.textOnPrimary} />
                  )}
                  <Text style={styles.unlockText}>
                    {isClaiming ? 'Claiming...' : 'Unlock Reward'}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Text style={styles.afterShareHint}>
                {user?.id ? 'Tap to claim your Vibe Sharer badge' : 'Login required to claim rewards'}
              </Text>
            </View>
          ) : (
            /* ── Share Button ── */
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
          )}
        </Animated.View>
      </SafeAreaView>

      {/* ── Login Gate Modal ── */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLoginModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {loginStage === 'options' ? (
              /* ── Login Options ── */
              <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
                <View style={styles.modalHeaderBlock}>
                  <View style={styles.modalRewardIcon}>
                    <Text style={styles.modalRewardEmoji}>🎁</Text>
                  </View>
                  <Text style={styles.modalTitle}>Your reward is waiting</Text>
                  <Text style={styles.modalSubtitle}>
                    Login to claim your Vibe Sharer badge inside your Genie.
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { opacity: 0.85 }]}
                    onPress={handleLoginGoogle}
                    disabled={operationLoading}
                  >
                    <LinearGradient colors={theme.gradients.genie} style={styles.modalPrimaryGradient}>
                      <MaterialIcons name="login" size={18} color={theme.textOnPrimary} />
                      <Text style={styles.modalPrimaryText}>Continue with Google</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.modalSecondaryBtn, pressed && { opacity: 0.85 }]}
                    onPress={() => setLoginStage('email')}
                    disabled={operationLoading}
                  >
                    <MaterialIcons name="email" size={18} color={theme.primary} />
                    <Text style={styles.modalSecondaryText}>Continue with Email</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.modalGhostBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => { setShowLoginModal(false); setPendingReward(false); }}
                  >
                    <Text style={styles.modalGhostText}>Maybe later</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : loginStage === 'email' ? (
              /* ── Email Input ── */
              <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
                <Pressable
                  style={styles.modalBackBtn}
                  onPress={() => setLoginStage('options')}
                >
                  <MaterialIcons name="arrow-back" size={20} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.modalTitle}>Enter your email</Text>
                <Text style={styles.modalSubtitle}>
                  We will send a 4-digit code to verify.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />

                <Pressable
                  style={({ pressed }) => [styles.modalPrimaryBtn, operationLoading && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
                  onPress={handleLoginSendOTP}
                  disabled={operationLoading}
                >
                  <LinearGradient colors={theme.gradients.genie} style={styles.modalPrimaryGradient}>
                    <Text style={styles.modalPrimaryText}>
                      {operationLoading ? 'Sending...' : 'Send Code'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              /* ── OTP Verify ── */
              <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
                <Pressable
                  style={styles.modalBackBtn}
                  onPress={() => setLoginStage('email')}
                >
                  <MaterialIcons name="arrow-back" size={20} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.modalTitle}>Verify code</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the 4-digit code sent to {loginEmail}
                </Text>

                <TextInput
                  style={styles.modalOtpInput}
                  value={loginOtp}
                  onChangeText={setLoginOtp}
                  placeholder="0000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                  textAlign="center"
                />

                <Pressable
                  style={({ pressed }) => [styles.modalPrimaryBtn, operationLoading && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
                  onPress={handleLoginVerifyOTP}
                  disabled={operationLoading}
                >
                  <LinearGradient colors={theme.gradients.genie} style={styles.modalPrimaryGradient}>
                    <Text style={styles.modalPrimaryText}>
                      {operationLoading ? 'Verifying...' : 'Verify & Claim'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },

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

  // Share Card
  shareCard: {
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.2)',
  },
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
  cardTop: { alignItems: 'center', gap: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 36, height: 36 },
  logoText: { fontSize: 20, fontWeight: '700', color: theme.primary, letterSpacing: 0.3 },
  hashtag: { fontSize: 14, fontWeight: '600', color: 'rgba(251,191,36,0.6)', letterSpacing: 0.5 },
  cardCenter: { alignItems: 'center', gap: 16 },
  vibeEmoji: { fontSize: 52 },
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
  cardScore: { alignItems: 'center', gap: 8 },
  scoreRing: { borderRadius: 40, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(251,191,36,0.3)' },
  scoreGradient: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 38, alignItems: 'center' },
  scoreNumber: { fontSize: 32, fontWeight: '800', color: theme.textOnPrimary, letterSpacing: -1 },
  scoreLabel: { fontSize: 15, fontWeight: '600', color: theme.textSecondary, letterSpacing: 0.3 },
  cardBottom: { alignItems: 'center', gap: 10 },
  dividerLine: { width: 60, height: 1, backgroundColor: 'rgba(251,191,36,0.2)' },
  attribution: { fontSize: 13, fontWeight: '500', color: theme.textMuted, letterSpacing: 0.3 },

  // Action area
  actionArea: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },

  // Share button
  shareBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  shareBtnText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
  shareHint: { fontSize: 13, color: theme.textMuted, marginTop: 10 },

  // After share
  afterShareArea: { width: '100%', alignItems: 'center', gap: 10 },
  afterShareCheck: { fontSize: 16, fontWeight: '700', color: theme.success },
  unlockBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  unlockText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
  afterShareHint: { fontSize: 12, color: theme.textMuted },

  // Reward
  rewardCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  rewardGradient: { alignItems: 'center', padding: 28, gap: 10 },
  rewardEmoji: { fontSize: 44 },
  rewardTitle: { fontSize: 22, fontWeight: '800', color: theme.primary },
  rewardDesc: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  rewardDoneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  rewardDoneText: { fontSize: 15, fontWeight: '700', color: theme.primary },

  // ── Login Gate Modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    borderBottomWidth: 0,
    ...theme.shadows.cardElevated,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.borderLight,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },

  modalHeaderBlock: { alignItems: 'center', marginBottom: 24 },
  modalRewardIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  modalRewardEmoji: { fontSize: 36 },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  modalActions: { gap: 12 },

  modalPrimaryBtn: { borderRadius: 14, overflow: 'hidden' },
  modalPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  modalPrimaryText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },

  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  modalSecondaryText: { fontSize: 16, fontWeight: '600', color: theme.primary },

  modalGhostBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalGhostText: { fontSize: 15, color: theme.textMuted, fontWeight: '500' },

  modalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  modalInput: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 16,
    marginBottom: 16,
  },

  modalOtpInput: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    letterSpacing: 12,
    marginTop: 16,
    marginBottom: 16,
  },
});
