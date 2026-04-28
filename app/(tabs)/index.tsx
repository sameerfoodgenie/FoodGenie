import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  RefreshControl,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { usePosts, FoodPost } from '../../contexts/PostContext';
import { useCreator, CREATOR_TIERS } from '../../contexts/CreatorContext';
import { useAuth } from '@/template';
import { useNotifications } from '../../hooks/useNotifications';
import { useCoin } from '../../hooks/useCoin';
import { useTheme } from '../../hooks/useTheme';
import { fetchProfile, UserProfile } from '../../services/profileService';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - 40;
const BANNER_H = 180;
const SERVICE_CARD_W = (SCREEN_W - 52) / 2;

const MEAL_EMOJI: Record<string, string> = { breakfast: '☀️', lunch: '🍽', dinner: '🌙', snack: '🍿' };

// ── Feature Banners data ──
const FEATURE_BANNERS = [
  {
    id: 'aaj-khane',
    title: 'Aaj Khane Kya Hai? 🤔',
    subtitle: 'Not sure what to eat today? Tap to get instant meal ideas based on your mood, budget & cravings',
    cta: 'Decide Now',
    gradient: ['#FF6B6B', '#FF8E53', '#FFB347'] as const,
    icon: 'restaurant' as const,
    accentEmoji: '🍛',
    route: '/decision-lens',
  },
  {
    id: 'ai-planner',
    title: 'Let AI Plan Your Meals 🧠',
    subtitle: 'Get a personalized weekly & monthly meal plan powered by AI — balanced nutrition, zero stress',
    cta: 'Plan My Meals',
    gradient: ['#6C3CE0', '#8B5CF6', '#B794F4'] as const,
    icon: 'auto-awesome' as const,
    accentEmoji: '📅',
    route: '/daily-meals',
  },
  {
    id: 'grocery-deals',
    title: 'Best Grocery Deals 💰',
    subtitle: 'Smart bundles matched to your meals — save up to 30% on weekly groceries from top stores',
    cta: 'See Deals',
    gradient: ['#059669', '#10B981', '#6EE7B7'] as const,
    icon: 'local-offer' as const,
    accentEmoji: '🛒',
    route: '/(tabs)/grocery',
  },
];

// ── Banner data ──
const BANNERS = [
  {
    id: '1',
    title: 'Earn Genie Coins',
    subtitle: 'Post meals daily and earn rewards!',
    cta: 'Start Earning',
    gradient: ['#6C3CE0', '#8B5CF6', '#A78BFA'] as const,
    emoji: '🪙',
    route: '/coin-wallet',
  },
  {
    id: '2',
    title: 'Trending Dishes',
    subtitle: 'Discover what foodies love today',
    cta: 'Explore Now',
    gradient: ['#E8590C', '#FB923C', '#FDBA74'] as const,
    emoji: '🔥',
    route: '/explore',
  },
  {
    id: '3',
    title: 'Redeem Rewards',
    subtitle: 'Use coins for vouchers & perks',
    cta: 'Redeem Now',
    gradient: ['#0891B2', '#22D3EE', '#67E8F9'] as const,
    emoji: '🎁',
    route: '/coin-redeem',
  },
  {
    id: '4',
    title: 'Creator Studio',
    subtitle: 'Become a home chef, build your audience',
    cta: 'Get Started',
    gradient: ['#DC2626', '#F87171', '#FCA5A5'] as const,
    emoji: '👨‍🍳',
    route: '/creator-dashboard',
  },
];

// ── Service cards ──
const SERVICE_CARDS = [
  {
    id: 'book-cook',
    title: 'Book a Cook',
    subtitle: 'Hire expert home cooks',
    emoji: '👨‍🍳',
    iconBg: '#FF6B6B',
    route: '/(tabs)/cook',
  },
  {
    id: 'smart-grocery',
    title: 'Smart Grocery',
    subtitle: 'Budget-friendly bundles',
    emoji: '🛒',
    iconBg: '#4ADE80',
    route: '/(tabs)/grocery',
  },
];

// ── Quick action items ──
const QUICK_ACTIONS = [
  { id: 'coins', emoji: '🪙', label: 'Coins', color: '#D4AF37', route: '/coin-wallet' },
  { id: 'trending', emoji: '🔥', label: 'Trending', color: '#FF6B6B', route: '/explore' },
  { id: 'offers', emoji: '🎟️', label: 'Offers', color: '#818CF8', route: '/coin-redeem' },
  { id: 'order', emoji: '📦', label: 'Order Food', color: '#FB923C', route: '/partner-apps' },
  { id: 'creator', emoji: '🎬', label: 'Creator', color: '#22D3EE', route: '/creator-dashboard' },
  { id: 'leaderboard', emoji: '🏆', label: 'Leaderboard', color: '#F59E0B', route: '/coin-leaderboard' },
];

// ── Feature Banner Card ──
function FeatureBannerCard({
  banner, index, onPress, colors, isDark,
}: {
  banner: typeof FEATURE_BANNERS[0]; index: number; onPress: () => void; colors: any; isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(400 + index * 100).duration(400)}>
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
      >
        <LinearGradient
          colors={banner.gradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.featureBanner}
        >
          {/* Decorative circles */}
          <View style={[s.featureCircle, { width: 120, height: 120, top: -30, right: -20, backgroundColor: 'rgba(255,255,255,0.10)' }]} />
          <View style={[s.featureCircle, { width: 80, height: 80, bottom: -20, left: 30, backgroundColor: 'rgba(255,255,255,0.07)' }]} />

          <View style={s.featureContent}>
            <View style={s.featureTextArea}>
              <Text style={s.featureTitle}>{banner.title}</Text>
              <Text style={s.featureSubtitle}>{banner.subtitle}</Text>
              <View style={s.featureCta}>
                <Text style={s.featureCtaText}>{banner.cta}</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#FFF" />
              </View>
            </View>
            <View style={s.featureIconWrap}>
              <Text style={s.featureAccentEmoji}>{banner.accentEmoji}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { feedPosts, myPosts, refreshFeed } = usePosts();
  const { isCreatorUnlocked } = useCreator();
  const { unreadCount } = useNotifications(user?.id || null);
  const { balance, currentStreak } = useCoin();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id).then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user?.id]);

  // Auto-scroll banners
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollTo({ x: next * (BANNER_W + 12), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleBannerScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
    setActiveBanner(idx);
  }, []);

  const name = profile?.full_name || user?.username || 'Food Lover';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [selectedDayForMeal, setSelectedDayForMeal] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => { setRefreshing(true); await refreshFeed(); setRefreshing(false); }, [refreshFeed]);
  const handleAddMeal = useCallback((dayStr: string) => { setSelectedDayForMeal(dayStr); setMealPickerVisible(true); }, []);
  const handleMealTypeSelect = useCallback((mealType: string) => {
    setMealPickerVisible(false);
    router.push({ pathname: '/(tabs)/camera', params: { mealType, date: selectedDayForMeal || undefined } });
  }, [selectedDayForMeal, router]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />}
      >
        {/* ═══════ Top Bar ═══════ */}
        <View style={[s.topSection, { paddingTop: insets.top + 8 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={s.topBar}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
              style={({ pressed }) => [s.topBarLeft, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.greeting, { color: colors.textMuted }]}>{getGreeting()}</Text>
                <Text style={[s.userName, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
              </View>
            </Pressable>

            <View style={s.topBarRight}>
              <Pressable
                style={({ pressed }) => [s.coinPill, pressed && { opacity: 0.8 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/coin-wallet'); }}
              >
                <Image source={require('../../assets/images/genie-coin.png')} style={{ width: 16, height: 16 }} contentFit="contain" />
                <Text style={s.coinPillText}>{balance}</Text>
              </Pressable>
              <Pressable
                style={[s.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/notifications'); }}
              >
                <MaterialIcons name="notifications-none" size={22} color={colors.textPrimary} />
                {unreadCount > 0 ? (
                  <View style={s.notifDot}><Text style={s.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
                ) : null}
              </Pressable>
            </View>
          </Animated.View>

          {/* Search */}
          <Animated.View entering={FadeInDown.delay(60).duration(300)}>
            <Pressable
              style={[s.searchBar, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F5',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB',
              }]}
              onPress={() => { Haptics.selectionAsync(); router.push('/explore'); }}
            >
              <MaterialIcons name="search" size={22} color={colors.textMuted} />
              <Text style={[s.searchPlaceholder, { color: colors.textMuted }]}>Search food, chefs, recipes...</Text>
              <View style={[s.searchDivider, { backgroundColor: colors.border }]} />
              <MaterialIcons name="mic" size={20} color={colors.textMuted} />
            </Pressable>
          </Animated.View>
        </View>

        {/* ═══════ Banner Carousel ═══════ */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.bannerSection}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
            snapToInterval={BANNER_W + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 32 }}
          >
            {BANNERS.map((banner, i) => (
              <Pressable
                key={banner.id}
                style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
                onPress={() => { Haptics.selectionAsync(); router.push(banner.route as any); }}
              >
                <LinearGradient
                  colors={banner.gradient as unknown as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[s.bannerCard, i < BANNERS.length - 1 && { marginRight: 12 }]}
                >
                  <View style={s.bannerContent}>
                    <Text style={s.bannerTitle}>{banner.title}</Text>
                    <Text style={s.bannerSubtitle}>{banner.subtitle}</Text>
                    <View style={s.bannerCta}>
                      <Text style={s.bannerCtaText}>{banner.cta}</Text>
                      <MaterialIcons name="arrow-forward" size={14} color="#FFF" />
                    </View>
                  </View>
                  <View style={s.bannerEmojiWrap}>
                    <Text style={s.bannerEmoji}>{banner.emoji}</Text>
                  </View>
                  {/* Decorative */}
                  <View style={[s.bannerCircle, { width: 140, height: 140, top: -40, right: -30, backgroundColor: 'rgba(255,255,255,0.10)' }]} />
                  <View style={[s.bannerCircle, { width: 90, height: 90, bottom: -25, left: 50, backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
          <View style={s.bannerDots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[s.bannerDot, activeBanner === i && s.bannerDotActive]} />
            ))}
          </View>
        </Animated.View>

        {/* ═══════ Main Service Cards (Book a Cook / Smart Grocery) ═══════ */}
        <View style={s.serviceSection}>
          <Animated.View entering={FadeInDown.delay(160).duration(350)} style={s.serviceSectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>What would you like?</Text>
          </Animated.View>
          <View style={s.serviceRow}>
            {SERVICE_CARDS.map((card, i) => (
              <Animated.View key={card.id} entering={FadeInDown.delay(200 + i * 80).duration(350)}>
                <Pressable
                  style={({ pressed }) => [
                    s.serviceCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.08)',
                    },
                    pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(card.route as any); }}
                >
                  <View style={[s.serviceIconWrap, { backgroundColor: `${card.iconBg}15` }]}>
                    <Text style={{ fontSize: 30 }}>{card.emoji}</Text>
                  </View>
                  <View style={s.serviceTextWrap}>
                    <View style={s.serviceTitleRow}>
                      <Text style={[s.serviceTitle, { color: colors.textPrimary }]}>{card.title}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                    </View>
                    <Text style={[s.serviceSubtitle, { color: colors.textMuted }]}>{card.subtitle}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ═══════ Quick Actions Grid ═══════ */}
        <View style={s.quickSection}>
          <Animated.View entering={FadeIn.delay(300).duration(300)}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          </Animated.View>
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map((action, i) => (
              <Animated.View key={action.id} entering={FadeInDown.delay(320 + i * 40).duration(300)}>
                <Pressable
                  style={({ pressed }) => [
                    s.quickItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (action.id === 'creator') {
                      router.push(isCreatorUnlocked ? '/creator-studio' : '/creator-dashboard');
                    } else {
                      router.push(action.route as any);
                    }
                  }}
                >
                  <View style={[s.quickItemIcon, { backgroundColor: `${action.color}12` }]}>
                    <Text style={{ fontSize: 22 }}>{action.emoji}</Text>
                  </View>
                  <Text style={[s.quickItemLabel, { color: colors.textSecondary }]} numberOfLines={1}>{action.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ═══════ Feature Banners ═══════ */}
        <View style={s.featureSection}>
          <Animated.View entering={FadeIn.delay(380).duration(300)} style={s.featureSectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>For You</Text>
            {currentStreak > 0 ? (
              <View style={s.streakBadge}>
                <Text style={{ fontSize: 12 }}>🔥</Text>
                <Text style={s.streakText}>{currentStreak}d streak</Text>
              </View>
            ) : null}
          </Animated.View>
          <View style={s.featureBannerList}>
            {FEATURE_BANNERS.map((banner, i) => (
              <FeatureBannerCard
                key={banner.id}
                banner={banner}
                index={i}
                onPress={() => router.push(banner.route as any)}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        {/* ═══════ Community Feed Preview ═══════ */}
        {feedPosts.length > 0 ? (
          <View style={s.feedSection}>
            <Animated.View entering={FadeIn.delay(480).duration(300)} style={s.feedHeader}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Community Feed</Text>
              <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/explore'); }} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <Text style={s.feedSeeAll}>See All</Text>
              </Pressable>
            </Animated.View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.feedScroll}>
              {feedPosts.slice(0, 8).map((post, i) => (
                <Animated.View key={post.id} entering={FadeInRight.delay(500 + i * 50).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [
                      s.feedCard,
                      { backgroundColor: colors.surface },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/food-detail', params: { postId: post.id } }); }}
                  >
                    {post.imageUri ? (
                      <Image source={{ uri: post.thumbnailUri || post.imageUri }} style={s.feedCardImage} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[s.feedCardImage, s.feedCardNoImg, { backgroundColor: colors.backgroundTertiary }]}>
                        <Text style={{ fontSize: 28 }}>{MEAL_EMOJI[post.mealType] || '🍽'}</Text>
                      </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={s.feedCardOverlay}>
                      <Text style={s.feedCardDish} numberOfLines={1}>{post.dishName}</Text>
                      <Text style={s.feedCardUser} numberOfLines={1}>@{post.username}</Text>
                    </LinearGradient>
                    <View style={s.feedCardLikes}>
                      <MaterialIcons name="favorite" size={11} color="#FFD700" />
                      <Text style={s.feedCardLikesText}>{post.likes}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {/* ═══════ Meal Picker Modal ═══════ */}
      <Modal visible={mealPickerVisible} transparent animationType="fade" onRequestClose={() => setMealPickerVisible(false)}>
        <Pressable style={[s.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.50)' }]} onPress={() => setMealPickerVisible(false)}>
          <Pressable style={[s.mealSheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[s.mealHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.mealTitle, { color: colors.textPrimary }]}>Add a Meal</Text>
            <Text style={[s.mealSub, { color: colors.textMuted }]}>What are you logging?</Text>
            <View style={s.mealGrid}>
              {[
                { id: 'breakfast', label: 'Breakfast', emoji: '☀️', color: '#FFB347' },
                { id: 'lunch', label: 'Lunch', emoji: '🍽', color: '#4ADE80' },
                { id: 'dinner', label: 'Dinner', emoji: '🌙', color: '#818CF8' },
                { id: 'snack', label: 'Snack', emoji: '🍿', color: '#FB923C' },
              ].map(mt => (
                <Pressable
                  key={mt.id}
                  style={({ pressed }) => [
                    s.mealItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleMealTypeSelect(mt.id); }}
                >
                  <View style={[s.mealEmojiBg, { backgroundColor: `${mt.color}18` }]}>
                    <Text style={{ fontSize: 30 }}>{mt.emoji}</Text>
                  </View>
                  <Text style={[s.mealItemLabel, { color: colors.textPrimary }]}>{mt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [s.mealCancel, pressed && { opacity: 0.7 }]}
              onPress={() => setMealPickerVisible(false)}
            >
              <Text style={[s.mealCancelText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  /* ── Top Section ── */
  topSection: { paddingHorizontal: 20, paddingBottom: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  greeting: { fontSize: 11, fontWeight: '500' },
  userName: { fontSize: 16, fontWeight: '800', maxWidth: 150 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.10)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  coinPillText: { fontSize: 13, fontWeight: '900', color: '#D4AF37' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  notifDot: {
    position: 'absolute', top: -1, right: -1,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  notifDotText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  /* ── Search ── */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: 1,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, fontWeight: '500' },
  searchDivider: { width: 1, height: 20 },

  /* ── Banner ── */
  bannerSection: { marginBottom: 4 },
  bannerCard: {
    width: BANNER_W, height: BANNER_H, borderRadius: 20,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 20,
  },
  bannerContent: { flex: 1, gap: 6, zIndex: 2 },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  bannerSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.80)', lineHeight: 17 },
  bannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  bannerCtaText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  bannerEmojiWrap: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8, zIndex: 2,
  },
  bannerEmoji: { fontSize: 36 },
  bannerCircle: { position: 'absolute', borderRadius: 999 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  bannerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.10)' },
  bannerDotActive: { width: 22, backgroundColor: '#D4AF37' },

  /* ── Service Cards ── */
  serviceSection: { paddingHorizontal: 20, paddingTop: 22 },
  serviceSectionHeader: { marginBottom: 12 },
  serviceRow: { gap: 12 },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  serviceIconWrap: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  serviceTextWrap: { flex: 1, gap: 2 },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceTitle: { fontSize: 16, fontWeight: '800' },
  serviceSubtitle: { fontSize: 12, fontWeight: '500' },

  /* ── Quick Actions ── */
  quickSection: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: {
    width: (SCREEN_W - 60) / 3, alignItems: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  quickItemIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickItemLabel: { fontSize: 11, fontWeight: '700' },

  /* ── Section Title ── */
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },

  /* ── Feature Banners ── */
  featureSection: { paddingTop: 24, gap: 12 },
  featureSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 2,
  },
  featureBannerList: { paddingHorizontal: 20, gap: 12 },
  featureBanner: {
    borderRadius: 20, overflow: 'hidden', position: 'relative',
    paddingHorizontal: 20, paddingVertical: 20, minHeight: 130,
  },
  featureCircle: { position: 'absolute', borderRadius: 999 },
  featureContent: {
    flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 2,
  },
  featureTextArea: { flex: 1, gap: 6 },
  featureTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  featureSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', lineHeight: 17 },
  featureCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    marginTop: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  featureCtaText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  featureIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureAccentEmoji: { fontSize: 32 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: 'rgba(255,107,107,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.15)',
  },
  streakText: { fontSize: 11, fontWeight: '700', color: '#FF6B6B' },

  /* ── Feed ── */
  feedSection: { paddingTop: 24 },
  feedHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  feedSeeAll: { fontSize: 13, fontWeight: '600', color: '#D4AF37' },
  feedScroll: { paddingHorizontal: 20, gap: 12 },
  feedCard: { width: 130, height: 180, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  feedCardImage: { width: '100%', height: '100%' },
  feedCardNoImg: { alignItems: 'center', justifyContent: 'center' },
  feedCardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 30,
  },
  feedCardDish: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  feedCardUser: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.70)' },
  feedCardLikes: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  feedCardLikesText: { fontSize: 9, fontWeight: '700', color: '#FFF' },

  /* ── Meal Picker ── */
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  mealSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, alignItems: 'center',
  },
  mealHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  mealTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  mealSub: { fontSize: 14, fontWeight: '500', marginBottom: 24 },
  mealGrid: { flexDirection: 'row', gap: 12, width: '100%' },
  mealItem: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 18, borderRadius: 16, borderWidth: 1,
  },
  mealEmojiBg: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  mealItemLabel: { fontSize: 12, fontWeight: '700' },
  mealCancel: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 14 },
  mealCancelText: { fontSize: 14, fontWeight: '600' },
});
