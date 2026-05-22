import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useCoin } from '../hooks/useCoin';
import { useAuth } from '@/template';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import {
  loadSubscription,
  deductTokens,
  isSubscriptionActive,
  UserSubscription,
} from '../services/subscriptionService';

const { width: SCREEN_W } = Dimensions.get('window');
const supabase = getSupabaseClient();

// Token costs per meal type
const TOKEN_COSTS: Record<string, number> = {
  breakfast: 20,
  lunch: 30,
  snack: 15,
  dinner: 30,
};

const MEAL_TYPE_META: Record<string, { emoji: string; gradient: readonly [string, string]; chef: string; chefHandle: string }> = {
  breakfast: {
    emoji: '☀️',
    gradient: ['#F5B731', '#FDD85D'],
    chef: 'Chef Kunal Kapur',
    chefHandle: '@chefkunalkapur',
  },
  lunch: {
    emoji: '🍽️',
    gradient: ['#1E1456', '#7B2FA0'],
    chef: 'Chef Ranveer Brar',
    chefHandle: '@ranveerbrar',
  },
  snack: {
    emoji: '🍿',
    gradient: ['#C41E7A', '#7B2FA0'],
    chef: 'Chef Amrita Raichand',
    chefHandle: '@amritaraichand',
  },
  dinner: {
    emoji: '🌙',
    gradient: ['#7B2FA0', '#1E1456'],
    chef: 'Chef Vikas Khanna',
    chefHandle: '@vikaboraink',
  },
};

const THUMBNAILS: Record<string, string> = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  lunch: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  snack: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  dinner: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
};

interface MealVideo {
  id: string;
  mealType: string;
  mealName: string;
  chef: string;
  chefHandle: string;
  thumbnail: string;
  tokenCost: number;
  duration: string;
  emoji: string;
  gradient: readonly [string, string];
}

function parseMealVideos(planDataStr: string): MealVideo[] {
  const videos: MealVideo[] = [];
  try {
    const parsed = JSON.parse(planDataStr);
    const meals = parsed.meals || [];
    meals.forEach((meal: any) => {
      const type = (meal.type || 'lunch').toLowerCase();
      const meta = MEAL_TYPE_META[type] || MEAL_TYPE_META.lunch;
      videos.push({
        id: `video_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mealType: type,
        mealName: meal.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Dish`,
        chef: meta.chef,
        chefHandle: meta.chefHandle,
        thumbnail: THUMBNAILS[type] || THUMBNAILS.lunch,
        tokenCost: TOKEN_COSTS[type] || 20,
        duration: type === 'snack' ? '8 min' : type === 'breakfast' ? '12 min' : '18 min',
        emoji: meta.emoji,
        gradient: meta.gradient,
      });
    });
  } catch { /* fallback */ }

  // If no meals from plan, show defaults
  if (videos.length === 0) {
    const types = ['breakfast', 'lunch', 'snack', 'dinner'];
    types.forEach(type => {
      const meta = MEAL_TYPE_META[type];
      videos.push({
        id: `video_${type}_default`,
        mealType: type,
        mealName: type === 'breakfast' ? 'Masala Dosa' : type === 'lunch' ? 'Paneer Tikka Masala' : type === 'snack' ? 'Samosa Chaat' : 'Dal Makhani',
        chef: meta.chef,
        chefHandle: meta.chefHandle,
        thumbnail: THUMBNAILS[type],
        tokenCost: TOKEN_COSTS[type],
        duration: type === 'snack' ? '8 min' : type === 'breakfast' ? '12 min' : '18 min',
        emoji: meta.emoji,
        gradient: meta.gradient,
      });
    });
  }

  return videos;
}

function VideoCard({ video, isUnlocked, balance, onUnlock, onPreview, colors, isDark, index }: {
  video: MealVideo;
  isUnlocked: boolean;
  balance: number;
  onUnlock: (video: MealVideo) => void;
  onPreview: (video: MealVideo) => void;
  colors: any;
  isDark: boolean;
  index: number;
}) {
  const canAfford = balance >= video.tokenCost;

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(400)}>
      <View style={[st.videoCard, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: '#000',
      }]}>
        {/* Thumbnail */}
        <Pressable
          style={st.thumbnailWrap}
          onPress={() => { Haptics.selectionAsync(); onPreview(video); }}
        >
          <Image source={{ uri: video.thumbnail }} style={st.thumbnail} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={st.thumbnailOverlay} />

          {/* Play Icon */}
          <View style={st.playIconWrap}>
            <View style={st.playIcon}>
              <MaterialIcons name="play-arrow" size={28} color="#FFF" />
            </View>
          </View>

          {/* Duration badge */}
          <View style={st.durationBadge}>
            <MaterialIcons name="schedule" size={10} color="#FFF" />
            <Text style={st.durationText}>{video.duration}</Text>
          </View>

          {/* Lock overlay if not unlocked */}
          {!isUnlocked ? (
            <View style={st.lockOverlay}>
              <View style={st.lockBadge}>
                <MaterialIcons name="lock" size={14} color="#FFF" />
                <Text style={st.lockText}>Full Recipe Locked</Text>
              </View>
            </View>
          ) : (
            <View style={st.unlockedBadge}>
              <MaterialIcons name="check-circle" size={14} color="#FFF" />
              <Text style={st.unlockedText}>Unlocked</Text>
            </View>
          )}

          {/* Free preview label */}
          <View style={st.previewLabel}>
            <Text style={st.previewLabelText}>Free Preview</Text>
          </View>
        </Pressable>

        {/* Info section */}
        <View style={st.videoInfo}>
          <View style={st.videoInfoTop}>
            <LinearGradient colors={video.gradient as unknown as string[]} style={st.mealTypeBadge}>
              <Text style={{ fontSize: 14 }}>{video.emoji}</Text>
              <Text style={st.mealTypeText}>{video.mealType.toUpperCase()}</Text>
            </LinearGradient>
            <View style={st.tokenCostBadge}>
              <Text style={{ fontSize: 11 }}>🪙</Text>
              <Text style={st.tokenCostText}>{video.tokenCost}</Text>
            </View>
          </View>

          <Text style={[st.mealName, { color: colors.textPrimary }]} numberOfLines={1}>{video.mealName}</Text>

          <View style={st.chefRow}>
            <View style={st.chefAvatar}>
              <MaterialIcons name="person" size={14} color="#7B2FA0" />
            </View>
            <View>
              <Text style={[st.chefName, { color: colors.textSecondary }]}>{video.chef}</Text>
              <Text style={[st.chefHandle, { color: colors.textMuted }]}>{video.chefHandle}</Text>
            </View>
          </View>

          {/* Action button */}
          {isUnlocked ? (
            <Pressable
              style={({ pressed }) => [st.watchBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPreview(video); }}
            >
              <LinearGradient colors={['#7B2FA0', '#C41E7A']} style={st.watchBtnGrad}>
                <MaterialIcons name="play-circle-filled" size={18} color="#FFF" />
                <Text style={st.watchBtnText}>Watch Full Recipe</Text>
              </LinearGradient>
            </Pressable>
          ) : canAfford ? (
            <Pressable
              style={({ pressed }) => [st.unlockBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onUnlock(video); }}
            >
              <LinearGradient colors={['#F5B731', '#D9A020']} style={st.unlockBtnGrad}>
                <MaterialIcons name="lock-open" size={16} color="#FFF" />
                <Text style={st.unlockBtnText}>Unlock with {video.tokenCost} Tokens</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={[st.lockedBtn, { backgroundColor: colors.backgroundTertiary }]}>
              <MaterialIcons name="lock" size={16} color={colors.textMuted} />
              <Text style={[st.lockedBtnText, { color: colors.textMuted }]}>
                Need {video.tokenCost - balance} more tokens
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function RecipeVideosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { balance, spendCoins, refreshWallet } = useCoin();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams<{ planData?: string }>();

  const videos = useMemo(() => parseMealVideos(params.planData || '{}'), [params.planData]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadSubscription(user.id).then(sub => {
        setSubscription(sub);
        setTokenBalance(sub?.token_balance ?? 0);
      });
    }
  }, [user?.id]);

  const handleUnlock = useCallback(async (video: MealVideo) => {
    if (!user?.id) {
      showAlert('Login Required', 'Please log in to unlock recipe videos.');
      return;
    }

    // Check subscription status first
    const sub = await loadSubscription(user.id);
    setSubscription(sub);
    setTokenBalance(sub?.token_balance ?? 0);

    if (!sub || !isSubscriptionActive(sub)) {
      showAlert(
        'Subscription Required',
        'You need an active subscription with AI Tokens to unlock recipe videos. Start with a 7-day free trial!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Tokens', onPress: () => router.push('/subscription' as any) },
        ]
      );
      return;
    }

    if ((sub.token_balance ?? 0) < video.tokenCost) {
      showAlert(
        'Insufficient Tokens',
        `You need ${video.tokenCost} tokens but only have ${sub.token_balance}. Upgrade your plan for more tokens.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get More Tokens', onPress: () => router.push('/subscription' as any) },
        ]
      );
      return;
    }

    showAlert('Unlock Recipe', `Spend ${video.tokenCost} AI Tokens to unlock "${video.mealName}" full recipe?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlock',
        onPress: async () => {
          setUnlocking(video.id);

          // Deduct tokens from subscription
          const result = await deductTokens(user.id, video.tokenCost, 'recipe_video_unlock');

          if (result.success) {
            // Record unlock in database
            try {
              await supabase.from('recipe_video_unlocks').insert({
                video_id: video.id,
                chef_id: video.chefHandle,
                user_id: user.id,
                token_cost: video.tokenCost,
                creator_revenue_share: 70.00,
                platform_revenue_share: 30.00,
                video_title: video.mealName,
                chef_name: video.chef,
              });
            } catch { /* non-blocking */ }

            setUnlockedIds(prev => new Set(prev).add(video.id));
            setTokenBalance(result.remaining);
            setSubscription(prev => prev ? { ...prev, token_balance: result.remaining } : prev);
            showAlert('Unlocked!', `"${video.mealName}" recipe is now available. You have ${result.remaining} tokens remaining.`);
          } else {
            showAlert('Error', result.error || 'Could not unlock video. Please try again.');
          }
          setUnlocking(null);
        },
      },
    ]);
  }, [user, showAlert, router]);

  const handlePreview = useCallback((video: MealVideo) => {
    Haptics.selectionAsync();
    // In production, this would open a video player
    showAlert(
      unlockedIds.has(video.id) ? 'Playing Full Recipe' : 'Free Preview',
      unlockedIds.has(video.id)
        ? `Now playing full recipe for "${video.mealName}" by ${video.chef}`
        : `Playing 30-second preview of "${video.mealName}". Unlock to watch the full recipe.`
    );
  }, [unlockedIds, showAlert]);

  const totalTokensNeeded = videos.reduce((s, v) => s + (unlockedIds.has(v.id) ? 0 : v.tokenCost), 0);
  const effectiveBalance = tokenBalance;

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[st.header, { borderBottomColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [st.backBtn, { backgroundColor: colors.backgroundSecondary }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Recipe Videos</Text>
            <Text style={[st.headerSub, { color: colors.textMuted }]}>Learn today's meals from master chefs</Text>
          </View>
          <Pressable
            style={st.tokenPill}
            onPress={() => { Haptics.selectionAsync(); router.push('/subscription' as any); }}
          >
            <Text style={{ fontSize: 12 }}>🪙</Text>
            <Text style={st.tokenPillText}>{effectiveBalance}</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* Summary banner */}
          <Animated.View entering={FadeIn.duration(400)} style={st.summaryWrap}>
            <View style={[st.summaryCard, {
              backgroundColor: isDark ? 'rgba(30,20,86,0.08)' : 'rgba(30,20,86,0.04)',
              borderColor: 'rgba(30,20,86,0.12)',
            }]}>
              <View style={st.summaryRow}>
                <View style={st.summaryItem}>
                  <Text style={{ fontSize: 20 }}>🎬</Text>
                  <Text style={[st.summaryValue, { color: colors.textPrimary }]}>{videos.length}</Text>
                  <Text style={[st.summaryLabel, { color: colors.textMuted }]}>Videos</Text>
                </View>
                <View style={[st.summaryDivider, { backgroundColor: 'rgba(30,20,86,0.12)' }]} />
                <View style={st.summaryItem}>
                  <Text style={{ fontSize: 20 }}>🔓</Text>
                  <Text style={[st.summaryValue, { color: colors.textPrimary }]}>{unlockedIds.size}</Text>
                  <Text style={[st.summaryLabel, { color: colors.textMuted }]}>Unlocked</Text>
                </View>
                <View style={[st.summaryDivider, { backgroundColor: 'rgba(30,20,86,0.12)' }]} />
                <View style={st.summaryItem}>
                  <Text style={{ fontSize: 20 }}>🪙</Text>
                  <Text style={[st.summaryValue, { color: '#F5B731' }]}>{totalTokensNeeded}</Text>
                  <Text style={[st.summaryLabel, { color: colors.textMuted }]}>To Unlock All</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Info note */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={st.infoNoteWrap}>
            <View style={[st.infoNote, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialIcons name="info-outline" size={16} color={colors.textMuted} />
              <Text style={[st.infoNoteText, { color: colors.textSecondary }]}>
                Tap any video for a free preview. Unlock the full recipe with tokens.
              </Text>
            </View>
          </Animated.View>

          {/* Video cards */}
          <View style={st.videoList}>
            {videos.map((video, i) => (
              <VideoCard
                key={video.id}
                video={video}
                index={i}
                isUnlocked={unlockedIds.has(video.id)}
                balance={effectiveBalance}
                onUnlock={handleUnlock}
                onPreview={handlePreview}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>

          {/* Revenue info */}
          <Animated.View entering={FadeInDown.delay(500).duration(300)} style={st.revenueNoteWrap}>
            <View style={[st.revenueNote, { borderColor: colors.border }]}>
              <Text style={{ fontSize: 16 }}>👨‍🍳</Text>
              <View style={{ flex: 1 }}>
                <Text style={[st.revenueTitle, { color: colors.textPrimary }]}>Supporting Creators</Text>
                <Text style={[st.revenueSub, { color: colors.textMuted }]}>
                  70% of tokens go directly to the chef. Your unlock supports their craft.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  tokenPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(245,183,49,0.10)', borderWidth: 1, borderColor: 'rgba(245,183,49,0.25)',
  },
  tokenPillText: { fontSize: 14, fontWeight: '900', color: '#F5B731' },

  // Summary
  summaryWrap: { paddingHorizontal: 16, paddingTop: 16 },
  summaryCard: { padding: 16, borderRadius: 18, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '600' },
  summaryDivider: { width: 1, height: 36 },

  // Info note
  infoNoteWrap: { paddingHorizontal: 16, paddingTop: 12 },
  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  infoNoteText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Video list
  videoList: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  // Video card
  videoCard: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  thumbnailWrap: { width: '100%', height: 200, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  playIconWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  playIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.30)',
  },
  durationBadge: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  durationText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  lockOverlay: {
    position: 'absolute', top: 10, right: 10,
  },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lockText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  unlockedBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(123,47,160,0.85)',
  },
  unlockedText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  previewLabel: {
    position: 'absolute', bottom: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.90)',
  },
  previewLabelText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },

  // Video info
  videoInfo: { padding: 16, gap: 10 },
  videoInfoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  mealTypeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  tokenCostBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(245,183,49,0.10)', borderWidth: 1, borderColor: 'rgba(245,183,49,0.25)',
  },
  tokenCostText: { fontSize: 13, fontWeight: '900', color: '#F5B731' },
  mealName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  chefRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chefAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(123,47,160,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  chefName: { fontSize: 13, fontWeight: '700' },
  chefHandle: { fontSize: 11, fontWeight: '500' },

  // Buttons
  unlockBtn: { borderRadius: 14, overflow: 'hidden' },
  unlockBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14,
  },
  unlockBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  watchBtn: { borderRadius: 14, overflow: 'hidden' },
  watchBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14,
  },
  watchBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  lockedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 14,
  },
  lockedBtnText: { fontSize: 14, fontWeight: '700' },

  // Revenue note
  revenueNoteWrap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  revenueNote: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  revenueTitle: { fontSize: 14, fontWeight: '700' },
  revenueSub: { fontSize: 12, fontWeight: '500', lineHeight: 17, marginTop: 2 },
});
