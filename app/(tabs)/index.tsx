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
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { usePosts, FoodPost } from '../../contexts/PostContext';
import { useCreator, CREATOR_TIERS } from '../../contexts/CreatorContext';
import { useAuth } from '@/template';
import { useNotifications } from '../../hooks/useNotifications';
import { useCoin } from '../../hooks/useCoin';
import { useTheme } from '../../hooks/useTheme';
import { fetchProfile, UserProfile } from '../../services/profileService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_COLS = 3;
const QUICK_CARD_W = (SCREEN_W - 40 - CARD_GAP * 2) / CARD_COLS;
const WEEK_CARD_W = (SCREEN_W - 40 - CARD_GAP) / 2;
const BANNER_W = SCREEN_W - 32;
const BANNER_H = 170;

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(): { dayName: string; date: Date; dateStr: string }[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { dayName: name, date: d, dateStr: d.toISOString().split('T')[0] };
  });
}

function getPostsForDay(posts: FoodPost[], dateStr: string): FoodPost[] {
  return posts.filter(p => new Date(p.timestamp).toISOString().split('T')[0] === dateStr);
}

const MEAL_EMOJI: Record<string, string> = { breakfast: '☀️', lunch: '🍽', dinner: '🌙', snack: '🍿' };

// ── Banner data ──
const BANNERS = [
  {
    id: '1',
    title: 'Earn Genie Coins',
    subtitle: 'Post meals daily and earn coins!',
    cta: 'Start Earning',
    gradient: ['#D4AF37', '#FFD700', '#FFC107'] as const,
    emoji: '🪙',
    route: '/coin-wallet',
  },
  {
    id: '2',
    title: 'Creator Studio',
    subtitle: 'Become a Home Chef, build your audience',
    cta: 'Explore',
    gradient: ['#FF6B6B', '#FF8E53', '#FFB347'] as const,
    emoji: '👨‍🍳',
    route: '/creator-dashboard',
  },
  {
    id: '3',
    title: 'Redeem Rewards',
    subtitle: 'Use coins for vouchers and perks',
    cta: 'Redeem Now',
    gradient: ['#818CF8', '#A78BFA', '#C084FC'] as const,
    emoji: '🎁',
    route: '/coin-redeem',
  },
  {
    id: '4',
    title: 'Trending Food',
    subtitle: 'Discover what foodies are eating today',
    cta: 'See Trends',
    gradient: ['#22C55E', '#4ADE80', '#86EFAC'] as const,
    emoji: '🔥',
    route: '/explore',
  },
];

// ── Food categories ──
const FOOD_CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🍽', color: '#FF6B6B' },
  { id: 'biryani', label: 'Biryani', emoji: '🍛', color: '#FFB347' },
  { id: 'curry', label: 'Curries', emoji: '🍲', color: '#D4AF37' },
  { id: 'dessert', label: 'Desserts', emoji: '🍰', color: '#FF69B4' },
  { id: 'snacks', label: 'Snacks', emoji: '🥪', color: '#4ADE80' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤', color: '#818CF8' },
  { id: 'thali', label: 'Thali', emoji: '🥘', color: '#FB923C' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', color: '#EF4444' },
];

// ── Vibrant Quick Action Tile ──
const TILE_COLORS: { bg: string; text: string; iconBg: string }[] = [
  { bg: '#FFD700', text: '#5C3D00', iconBg: 'rgba(255,255,255,0.35)' },
  { bg: '#FF6B6B', text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.25)' },
  { bg: '#4ADE80', text: '#064E3B', iconBg: 'rgba(255,255,255,0.30)' },
  { bg: '#818CF8', text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.25)' },
  { bg: '#FB923C', text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.25)' },
  { bg: '#3B82F6', text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.25)' },
];

function QuickActionCard({
  emoji, label, tileColor, onPress, delay = 0,
}: {
  emoji: string; label: string; tileColor: typeof TILE_COLORS[0]; onPress: () => void; delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
      <Pressable
        style={({ pressed }) => [
          styles.quickCard,
          { backgroundColor: tileColor.bg },
          pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
        ]}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
      >
        <View style={[styles.quickCardIcon, { backgroundColor: tileColor.iconBg }]}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <Text style={[styles.quickCardLabel, { color: tileColor.text }]} numberOfLines={2}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Day Meal Card ──
function DayMealCard({
  dayName, posts, isToday, index, onPress, colors,
}: {
  dayName: string; date: Date; posts: FoodPost[]; isToday: boolean; index: number; onPress: () => void; colors: any;
}) {
  const latestPost = posts.length > 0 ? posts[0] : null;
  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 60).duration(400)}>
      <Pressable
        style={({ pressed }) => [
          styles.dayCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          isToday && { borderColor: 'rgba(212,175,55,0.35)', borderWidth: 1.5 },
          pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
      >
        <View style={[styles.dayCardImage, { backgroundColor: colors.surface }]}>
          {latestPost?.imageUri ? (
            <Image source={{ uri: latestPost.thumbnailUri || latestPost.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          ) : latestPost ? (
            <View style={[styles.dayCardNoImg, { backgroundColor: colors.backgroundTertiary }]}>
              <Text style={{ fontSize: 32 }}>{MEAL_EMOJI[latestPost.mealType] || '🍽'}</Text>
            </View>
          ) : (
            <View style={[styles.dayCardEmpty, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialIcons name="add-circle-outline" size={28} color={isToday ? '#D4AF37' : colors.textMuted} />
            </View>
          )}
          <View style={[styles.dayBadge, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, isToday && styles.dayBadgeToday]}>
            <Text style={[styles.dayBadgeText, { color: colors.textSecondary }, isToday && styles.dayBadgeTextToday]}>{dayName}</Text>
          </View>
          {posts.length > 1 ? (
            <View style={styles.mealCountBadge}><Text style={styles.mealCountText}>{posts.length}</Text></View>
          ) : null}
        </View>
        <View style={styles.dayCardBottom}>
          {latestPost ? (
            <>
              <Text style={[styles.dayDishName, { color: colors.textPrimary }]} numberOfLines={1}>{latestPost.dishName}</Text>
              <View style={styles.dayMetaRow}>
                <Text style={styles.daySource}>{latestPost.source === 'home_cooked' ? '🏠' : latestPost.source === 'restaurant' ? '🍴' : '📦'}</Text>
                <Text style={[styles.dayLikes, { color: colors.textMuted }]}>❤️ {latestPost.likes}</Text>
              </View>
            </>
          ) : (
            <Text style={[styles.dayDishName, { color: colors.textMuted, fontSize: 12 }]}>{isToday ? 'Add meal' : 'No meal'}</Text>
          )}
        </View>
        {latestPost ? (
          <View style={styles.dayBookmark}>
            <MaterialIcons name={latestPost.isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={latestPost.isSaved ? '#D4AF37' : colors.textMuted} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { feedPosts, myPosts, followingCount, refreshFeed } = usePosts();
  const { isCreatorUnlocked, currentLevel, myCreatorType } = useCreator();
  const { unreadCount } = useNotifications(user?.id || null);
  const { balance, currentStreak } = useCoin();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
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
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleBannerScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
    setActiveBanner(idx);
  }, []);

  const name = profile?.full_name || user?.username || 'Food Lover';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = new Date().toISOString().split('T')[0];
  const weekMeals = useMemo(() => weekDates.map(wd => ({
    ...wd, posts: getPostsForDay(myPosts, wd.dateStr), isToday: wd.dateStr === todayStr,
  })), [weekDates, myPosts, todayStr]);
  const weekMealCount = weekMeals.reduce((sum, d) => sum + d.posts.length, 0);

  const myTier = CREATOR_TIERS.find(t => t.id === myCreatorType) || null;

  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [selectedDayForMeal, setSelectedDayForMeal] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => { setRefreshing(true); await refreshFeed(); setRefreshing(false); }, [refreshFeed]);
  const handleAddMeal = useCallback((dayStr: string) => { setSelectedDayForMeal(dayStr); setMealPickerVisible(true); }, []);
  const handleMealTypeSelect = useCallback((mealType: string) => {
    setMealPickerVisible(false);
    router.push({ pathname: '/(tabs)/camera', params: { mealType, date: selectedDayForMeal || undefined } });
  }, [selectedDayForMeal, router]);

  const headerGradient = isDark
    ? ['#1A1510', '#1E1A12', '#14141C'] as const
    : ['#FFF8E1', '#FFECB3', '#FFF3E0'] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />}
      >
        {/* ═══════ Golden Header Area ═══════ */}
        <LinearGradient colors={headerGradient} style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}>

          {/* Top bar: Avatar + Name + Icons */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.topBar}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
              style={({ pressed }) => [styles.topBarLeft, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <View>
                <Text style={[styles.greeting, { color: isDark ? '#FFD700' : '#8B6914' }]}>Hello,</Text>
                <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
              </View>
            </Pressable>

            <View style={styles.topBarRight}>
              <Pressable
                style={({ pressed }) => [styles.coinPill, pressed && { opacity: 0.8 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/coin-wallet'); }}
              >
                <Image source={require('../../assets/images/genie-coin.png')} style={{ width: 18, height: 18 }} contentFit="contain" />
                <Text style={styles.coinPillText}>{balance}</Text>
              </Pressable>
              <Pressable
                style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/notifications'); }}
              >
                <MaterialIcons name="notifications-none" size={22} color={colors.textPrimary} />
                {unreadCount > 0 ? (
                  <View style={styles.notifDot}><Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
                ) : null}
              </Pressable>
            </View>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <Pressable
              style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,215,0,0.15)', borderColor: isDark ? 'rgba(212,175,55,0.20)' : 'rgba(212,175,55,0.30)' }]}
              onPress={() => { Haptics.selectionAsync(); router.push('/explore'); }}
            >
              <MaterialIcons name="search" size={24} color={isDark ? '#D4AF37' : '#8B6914'} />
              <Text style={[styles.searchPlaceholder, { color: isDark ? 'rgba(255,215,0,0.50)' : 'rgba(139,105,20,0.50)' }]}>Search food, chefs, recipes...</Text>
              <View style={[styles.searchDivider, { backgroundColor: isDark ? 'rgba(212,175,55,0.20)' : 'rgba(139,105,20,0.15)' }]} />
              <MaterialIcons name="mic" size={22} color={isDark ? '#D4AF37' : '#8B6914'} />
            </Pressable>
          </Animated.View>

          {/* Rolling Banner Carousel */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.bannerSection}>
            <ScrollView
              ref={bannerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleBannerScroll}
              snapToInterval={BANNER_W + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 16 }}
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
                    end={{ x: 1, y: 0.8 }}
                    style={[styles.bannerCard, i < BANNERS.length - 1 && { marginRight: 12 }]}
                  >
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                      <View style={styles.bannerCta}>
                        <Text style={styles.bannerCtaText}>{banner.cta}</Text>
                        <MaterialIcons name="chevron-right" size={18} color="#1A1A2E" />
                      </View>
                    </View>
                    <View style={styles.bannerEmojiWrap}>
                      <Text style={styles.bannerEmoji}>{banner.emoji}</Text>
                    </View>
                    {/* Decorative circles */}
                    <View style={[styles.bannerCircle, styles.bannerCircle1]} />
                    <View style={[styles.bannerCircle, styles.bannerCircle2]} />
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
            {/* Pagination dots */}
            <View style={styles.bannerDots}>
              {BANNERS.map((_, i) => (
                <View key={i} style={[styles.bannerDot, activeBanner === i && styles.bannerDotActive]} />
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ═══════ Food Category Scroll ═══════ */}
        <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {FOOD_CATEGORIES.map((cat, i) => {
              const isActive = cat.id === activeCategory;
              return (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    { backgroundColor: isActive ? cat.color : (isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'), borderColor: isActive ? cat.color : colors.cardBorder },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.id); }}
                >
                  <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: isActive ? '#FFFFFF' : colors.textPrimary }]}>{cat.label}</Text>
                  {isActive ? <View style={styles.categoryActiveLine} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ═══════ Quick Action Tiles (Vibrant) ═══════ */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickRow}>
            <QuickActionCard emoji="🪙" label="Genie Coins" tileColor={TILE_COLORS[0]} onPress={() => router.push('/coin-wallet')} delay={50} />
            <QuickActionCard emoji={myTier?.emoji || currentLevel.emoji} label="Creator Badge" tileColor={TILE_COLORS[1]} onPress={() => router.push('/creator-dashboard')} delay={100} />
            <QuickActionCard emoji="👨‍🍳" label="Home Chef" tileColor={TILE_COLORS[2]} onPress={() => { isCreatorUnlocked ? router.push('/creator-studio') : router.push('/creator-dashboard'); }} delay={150} />
          </View>
        </View>
        <View style={styles.quickActionsSection2}>
          <View style={styles.quickRow}>
            <QuickActionCard emoji="🔥" label="Trending" tileColor={TILE_COLORS[3]} onPress={() => router.push('/explore')} delay={200} />
            <QuickActionCard emoji="🎟️" label="Offers" tileColor={TILE_COLORS[4]} onPress={() => router.push('/coin-redeem')} delay={250} />
            <QuickActionCard emoji="📦" label="Order Food" tileColor={TILE_COLORS[5]} onPress={() => router.push('/partner-apps')} delay={300} />
          </View>
        </View>

        {/* ═══════ Weekly Meal Calendar ═══════ */}
        <View style={styles.weekSection}>
          <Animated.View entering={FadeIn.delay(250).duration(350)} style={styles.weekHeader}>
            <View style={styles.weekHeaderLeft}>
              <Text style={[styles.weekTitle, { color: colors.textPrimary }]}>This Week</Text>
              <View style={styles.weekCountBadge}><Text style={styles.weekCountText}>{weekMealCount} meals</Text></View>
            </View>
            {currentStreak > 0 ? (
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakText}>{currentStreak}d streak</Text>
              </View>
            ) : null}
          </Animated.View>
          <View style={styles.weekGrid}>
            {weekMeals.map((day, i) => (
              <DayMealCard key={day.dayName} dayName={day.dayName} date={day.date} posts={day.posts} isToday={day.isToday} index={i} onPress={() => handleAddMeal(day.dateStr)} colors={colors} />
            ))}
          </View>
        </View>

        {/* ═══════ Community Feed Preview ═══════ */}
        {feedPosts.length > 0 ? (
          <View style={styles.feedPreviewSection}>
            <Animated.View entering={FadeIn.delay(300).duration(350)} style={styles.feedPreviewHeader}>
              <Text style={[styles.feedPreviewTitle, { color: colors.textPrimary }]}>Community Feed</Text>
              <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/explore'); }} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <Text style={styles.feedPreviewSeeAll}>See All</Text>
              </Pressable>
            </Animated.View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feedPreviewScroll}>
              {feedPosts.slice(0, 8).map((post, i) => (
                <Animated.View key={post.id} entering={FadeInRight.delay(350 + i * 60).duration(350)}>
                  <Pressable
                    style={({ pressed }) => [styles.feedCard, { backgroundColor: colors.surface }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                    onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/food-detail', params: { postId: post.id } }); }}
                  >
                    {post.imageUri ? (
                      <Image source={{ uri: post.thumbnailUri || post.imageUri }} style={styles.feedCardImage} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[styles.feedCardImage, styles.feedCardNoImg, { backgroundColor: colors.backgroundTertiary }]}>
                        <Text style={{ fontSize: 28 }}>{MEAL_EMOJI[post.mealType] || '🍽'}</Text>
                      </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.feedCardOverlay}>
                      <Text style={styles.feedCardDish} numberOfLines={1}>{post.dishName}</Text>
                      <Text style={styles.feedCardUser} numberOfLines={1}>@{post.username}</Text>
                    </LinearGradient>
                    <View style={styles.feedCardLikes}>
                      <MaterialIcons name="favorite" size={12} color="#FFD700" />
                      <Text style={styles.feedCardLikesText}>{post.likes}</Text>
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
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]} onPress={() => setMealPickerVisible(false)}>
          <Pressable style={[styles.mealPickerSheet, { backgroundColor: colors.modalBg }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.mealPickerHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.mealPickerTitle, { color: colors.textPrimary }]}>Add a Meal</Text>
            <Text style={[styles.mealPickerSub, { color: colors.textMuted }]}>What are you logging?</Text>
            <View style={styles.mealPickerGrid}>
              {[
                { id: 'breakfast', label: 'Breakfast', emoji: '☀️', color: '#FFB347' },
                { id: 'lunch', label: 'Lunch', emoji: '🍽', color: '#4ADE80' },
                { id: 'dinner', label: 'Dinner', emoji: '🌙', color: '#818CF8' },
                { id: 'snack', label: 'Snack', emoji: '🍿', color: '#FB923C' },
              ].map(mt => (
                <Pressable
                  key={mt.id}
                  style={({ pressed }) => [styles.mealPickerItem, { backgroundColor: colors.surface, borderColor: colors.cardBorder }, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleMealTypeSelect(mt.id); }}
                >
                  <View style={[styles.mealPickerEmojiBg, { backgroundColor: `${mt.color}18` }]}>
                    <Text style={{ fontSize: 32 }}>{mt.emoji}</Text>
                  </View>
                  <Text style={[styles.mealPickerItemLabel, { color: colors.textPrimary }]}>{mt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={({ pressed }) => [styles.mealPickerCancel, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]} onPress={() => setMealPickerVisible(false)}>
              <Text style={[styles.mealPickerCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Golden Header ── */
  headerGradient: {
    paddingBottom: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  greeting: { fontSize: 12, fontWeight: '600' },
  userName: { fontSize: 16, fontWeight: '800', maxWidth: 140 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  coinPillText: { fontSize: 14, fontWeight: '900', color: '#D4AF37' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  /* ── Search Bar ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, fontWeight: '500' },
  searchDivider: { width: 1, height: 22, borderRadius: 1 },

  /* ── Banner Carousel ── */
  bannerSection: { paddingLeft: 16, marginBottom: 8 },
  bannerCard: {
    width: BANNER_W,
    height: BANNER_H,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  bannerContent: { flex: 1, gap: 6, zIndex: 2 },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.3 },
  bannerSubtitle: { fontSize: 13, fontWeight: '600', color: 'rgba(26,26,46,0.65)', lineHeight: 18 },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(26,26,46,0.85)',
  },
  bannerCtaText: { fontSize: 13, fontWeight: '700', color: '#FFD700' },
  bannerEmojiWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    zIndex: 2,
  },
  bannerEmoji: { fontSize: 40 },
  bannerCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bannerCircle1: { width: 120, height: 120, top: -30, right: -20 },
  bannerCircle2: { width: 80, height: 80, bottom: -20, left: 60 },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingRight: 16,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212,175,55,0.20)',
  },
  bannerDotActive: {
    width: 24,
    backgroundColor: '#D4AF37',
  },

  /* ── Food Categories ── */
  categorySection: {
    paddingTop: 14,
    paddingBottom: 6,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 72,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: { fontSize: 12, fontWeight: '700' },
  categoryActiveLine: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
  },

  /* ── Quick Action Tiles ── */
  quickActionsSection: { paddingHorizontal: 16, paddingTop: 14 },
  quickActionsSection2: { paddingHorizontal: 16, paddingTop: CARD_GAP },
  quickRow: { flexDirection: 'row', gap: CARD_GAP },
  quickCard: {
    width: QUICK_CARD_W,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  quickCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
  },

  /* ── Meal Picker Modal ── */
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  mealPickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mealPickerHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  mealPickerTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  mealPickerSub: { fontSize: 14, fontWeight: '500', marginBottom: 24 },
  mealPickerGrid: { flexDirection: 'row', gap: 12, width: '100%' },
  mealPickerItem: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  mealPickerEmojiBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mealPickerItemLabel: { fontSize: 12, fontWeight: '700' },
  mealPickerCancel: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 14 },
  mealPickerCancelText: { fontSize: 14, fontWeight: '700' },

  /* ── Weekly Meal Calendar ── */
  weekSection: { paddingHorizontal: 16, paddingTop: 22 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  weekHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekTitle: { fontSize: 18, fontWeight: '800' },
  weekCountBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.10)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.20)',
  },
  weekCountText: { fontSize: 11, fontWeight: '700', color: '#22C55E' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.15)',
  },
  streakEmoji: { fontSize: 13 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#FF6B6B' },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },

  /* ── Day Card ── */
  dayCard: {
    width: WEEK_CARD_W,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dayCardImage: { width: '100%', height: 100, position: 'relative' },
  dayCardNoImg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayCardEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  dayBadgeToday: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.30)' },
  dayBadgeText: { fontSize: 11, fontWeight: '800' },
  dayBadgeTextToday: { color: '#D4AF37' },
  mealCountBadge: {
    position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center',
  },
  mealCountText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  dayCardBottom: { paddingHorizontal: 10, paddingVertical: 8, gap: 3 },
  dayDishName: { fontSize: 13, fontWeight: '700' },
  dayMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  daySource: { fontSize: 11 },
  dayLikes: { fontSize: 11, fontWeight: '600' },
  dayBookmark: { position: 'absolute', bottom: 10, right: 10 },

  /* ── Feed Preview ── */
  feedPreviewSection: { paddingTop: 24 },
  feedPreviewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 14,
  },
  feedPreviewTitle: { fontSize: 18, fontWeight: '800' },
  feedPreviewSeeAll: { fontSize: 14, fontWeight: '600', color: '#D4AF37' },
  feedPreviewScroll: { paddingHorizontal: 16, gap: 12 },
  feedCard: { width: 140, height: 190, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  feedCardImage: { width: '100%', height: '100%' },
  feedCardNoImg: { alignItems: 'center', justifyContent: 'center' },
  feedCardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 30,
  },
  feedCardDish: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  feedCardUser: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.70)' },
  feedCardLikes: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  feedCardLikesText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
});
