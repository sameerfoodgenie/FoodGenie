import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { usePosts, FoodPost } from '../../contexts/PostContext';
import { useCreator, CREATOR_TIERS } from '../../contexts/CreatorContext';
import { useAuth } from '@/template';
import { useNotifications } from '../../hooks/useNotifications';
import { useCoin } from '../../hooks/useCoin';
import { fetchProfile, UserProfile } from '../../services/profileService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_COLS = 3;
const QUICK_CARD_W = (SCREEN_W - 40 - CARD_GAP * 2) / CARD_COLS;
const WEEK_CARD_W = (SCREEN_W - 40 - CARD_GAP) / 2;

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
    return {
      dayName: name,
      date: d,
      dateStr: d.toISOString().split('T')[0],
    };
  });
}

function getPostsForDay(posts: FoodPost[], dateStr: string): FoodPost[] {
  return posts.filter(p => {
    const postDate = new Date(p.timestamp).toISOString().split('T')[0];
    return postDate === dateStr;
  });
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '☀️',
  lunch: '🍽',
  dinner: '🌙',
  snack: '🍿',
};

// ─── Quick Action Card ───
function QuickActionCard({
  emoji,
  label,
  color,
  onPress,
  delay = 0,
}: {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
      <Pressable
        style={({ pressed }) => [
          styles.quickCard,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
      >
        <View style={[styles.quickCardIcon, { backgroundColor: `${color}12` }]}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <Text style={styles.quickCardLabel} numberOfLines={2}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Day Meal Card ───
function DayMealCard({
  dayName,
  date,
  posts,
  isToday,
  index,
  onPress,
}: {
  dayName: string;
  date: Date;
  posts: FoodPost[];
  isToday: boolean;
  index: number;
  onPress: () => void;
}) {
  const latestPost = posts.length > 0 ? posts[0] : null;
  const dateNum = date.getDate();

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 60).duration(400)}>
      <Pressable
        style={({ pressed }) => [
          styles.dayCard,
          isToday && styles.dayCardToday,
          pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
      >
        {/* Image or placeholder */}
        <View style={styles.dayCardImage}>
          {latestPost?.imageUri ? (
            <Image
              source={{ uri: latestPost.thumbnailUri || latestPost.imageUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={200}
            />
          ) : latestPost ? (
            <View style={styles.dayCardNoImg}>
              <Text style={{ fontSize: 32 }}>{MEAL_EMOJI[latestPost.mealType] || '🍽'}</Text>
            </View>
          ) : (
            <View style={styles.dayCardEmpty}>
              <MaterialIcons name="add-circle-outline" size={28} color={isToday ? '#D4AF37' : '#D1D5DB'} />
            </View>
          )}
          {/* Day overlay badge */}
          <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
            <Text style={[styles.dayBadgeText, isToday && styles.dayBadgeTextToday]}>{dayName}</Text>
          </View>
          {/* Meal count badge */}
          {posts.length > 1 ? (
            <View style={styles.mealCountBadge}>
              <Text style={styles.mealCountText}>{posts.length}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom info */}
        <View style={styles.dayCardBottom}>
          {latestPost ? (
            <>
              <Text style={styles.dayDishName} numberOfLines={1}>{latestPost.dishName}</Text>
              <View style={styles.dayMetaRow}>
                <Text style={styles.daySource}>{latestPost.source === 'home_cooked' ? '🏠' : latestPost.source === 'restaurant' ? '🍴' : '📦'}</Text>
                <Text style={styles.dayLikes}>❤️ {latestPost.likes}</Text>
              </View>
            </>
          ) : (
            <Text style={[styles.dayDishName, { color: '#9CA3AF', fontSize: 12 }]}>
              {isToday ? 'Add meal' : 'No meal'}
            </Text>
          )}
        </View>

        {/* Bookmark icon */}
        {latestPost ? (
          <View style={styles.dayBookmark}>
            <MaterialIcons name={latestPost.isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={latestPost.isSaved ? '#D4AF37' : '#9CA3AF'} />
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
  const { feedPosts, myPosts, totalPosts, followingCount, followerCount, loading: feedLoading, refreshFeed } = usePosts();
  const { isCreatorUnlocked, currentLevel, myCreatorType } = useCreator();
  const { unreadCount } = useNotifications(user?.id || null);
  const { balance, currentStreak } = useCoin();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id).then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user?.id]);

  const name = profile?.full_name || user?.username || 'Food Lover';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = new Date().toISOString().split('T')[0];

  const weekMeals = useMemo(() => {
    return weekDates.map(wd => ({
      ...wd,
      posts: getPostsForDay(myPosts, wd.dateStr),
      isToday: wd.dateStr === todayStr,
    }));
  }, [weekDates, myPosts, todayStr]);

  const myTier = CREATOR_TIERS.find(t => t.id === myCreatorType) || null;

  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [selectedDayForMeal, setSelectedDayForMeal] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
  }, [refreshFeed]);

  const handleAddMeal = useCallback((dayStr: string) => {
    setSelectedDayForMeal(dayStr);
    setMealPickerVisible(true);
  }, []);

  const handleMealTypeSelect = useCallback((mealType: string) => {
    setMealPickerVisible(false);
    router.push({ pathname: '/(tabs)/camera', params: { mealType, date: selectedDayForMeal || undefined } });
  }, [selectedDayForMeal, router]);

  // Count total meals this week
  const weekMealCount = weekMeals.reduce((sum, d) => sum + d.posts.length, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {/* ─── Profile Summary Bar ─── */}
        <View style={[styles.profileBar, { paddingTop: insets.top + 12 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.profileBarInner}>
            {/* Left: Avatar */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </Pressable>

            {/* Middle: Stats */}
            <View style={styles.profileStats}>
              <Pressable style={styles.profileStat} onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}>
                <Text style={styles.profileStatValue}>{followingCount}</Text>
                <Text style={styles.profileStatLabel}>Chefs</Text>
              </Pressable>
              <View style={styles.profileStatDivider} />
              <Pressable style={styles.profileStat} onPress={() => { Haptics.selectionAsync(); router.push('/coin-wallet'); }}>
                <Image source={require('../../assets/images/genie-coin.png')} style={{ width: 18, height: 18 }} contentFit="contain" />
                <Text style={[styles.profileStatValue, { color: '#D4AF37' }]}>{balance}</Text>
              </Pressable>
            </View>

            {/* Right: Coins */}
            <Pressable
              style={({ pressed }) => [styles.coinsBadge, pressed && { opacity: 0.8 }]}
              onPress={() => { Haptics.selectionAsync(); router.push('/coin-wallet'); }}
            >
              <Image source={require('../../assets/images/genie-coin.png')} style={styles.coinsBadgeImg} contentFit="contain" />
              <Text style={styles.coinsBadgeText}>{balance}</Text>
            </Pressable>
          </Animated.View>

          {/* Notification bell */}
          <Pressable
            style={styles.notifBtn}
            onPress={() => { Haptics.selectionAsync(); router.push('/notifications'); }}
          >
            <MaterialIcons name="notifications-none" size={22} color="#1A1A2E" />
            {unreadCount > 0 ? (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* ─── Quick Action Cards Row 1 ─── */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickRow}>
            <QuickActionCard
              emoji="🪙"
              label="Genie Coins"
              color="#FFD700"
              onPress={() => router.push('/coin-wallet')}
              delay={50}
            />
            <QuickActionCard
              emoji={myTier?.emoji || currentLevel.emoji}
              label="Creator Badge"
              color="#D4AF37"
              onPress={() => router.push('/creator-dashboard')}
              delay={100}
            />
            <QuickActionCard
              emoji="👨‍🍳"
              label="Become Home Chef"
              color="#4ADE80"
              onPress={() => {
                if (isCreatorUnlocked) {
                  router.push('/creator-studio');
                } else {
                  router.push('/creator-dashboard');
                }
              }}
              delay={150}
            />
          </View>
        </View>

        {/* ─── Quick Action Cards Row 2 ─── */}
        <View style={styles.quickActionsSection2}>
          <View style={styles.quickRow}>
            <QuickActionCard
              emoji="🔥"
              label="Trending Food"
              color="#FF6B6B"
              onPress={() => router.push('/explore')}
              delay={200}
            />
            <QuickActionCard
              emoji="🎟️"
              label="Offers & Vouchers"
              color="#A855F7"
              onPress={() => router.push('/coin-redeem')}
              delay={250}
            />
            <QuickActionCard
              emoji="📦"
              label="Order Food"
              color="#3B82F6"
              onPress={() => router.push('/partner-apps')}
              delay={300}
            />
          </View>
        </View>

        {/* ─── Weekly Meal Calendar ─── */}
        <View style={styles.weekSection}>
          <Animated.View entering={FadeIn.delay(200).duration(350)} style={styles.weekHeader}>
            <View style={styles.weekHeaderLeft}>
              <Text style={styles.weekTitle}>This Week</Text>
              <View style={styles.weekCountBadge}>
                <Text style={styles.weekCountText}>{weekMealCount} meals</Text>
              </View>
            </View>
            {currentStreak > 0 ? (
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakText}>{currentStreak}d streak</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Day cards grid - 2 columns */}
          <View style={styles.weekGrid}>
            {weekMeals.map((day, i) => (
              <DayMealCard
                key={day.dayName}
                dayName={day.dayName}
                date={day.date}
                posts={day.posts}
                isToday={day.isToday}
                index={i}
                onPress={() => {
                  if (day.posts.length === 0) {
                    handleAddMeal(day.dateStr);
                  } else {
                    handleAddMeal(day.dateStr);
                  }
                }}
              />
            ))}
          </View>
        </View>

        {/* ─── Recent Feed Preview ─── */}
        {feedPosts.length > 0 ? (
          <View style={styles.feedPreviewSection}>
            <Animated.View entering={FadeIn.delay(300).duration(350)} style={styles.feedPreviewHeader}>
              <Text style={styles.feedPreviewTitle}>Community Feed</Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push('/explore'); }}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.feedPreviewSeeAll}>See All</Text>
              </Pressable>
            </Animated.View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.feedPreviewScroll}
            >
              {feedPosts.slice(0, 8).map((post, i) => (
                <Animated.View key={post.id} entering={FadeInRight.delay(350 + i * 60).duration(350)}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.feedCard,
                      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/food-detail', params: { postId: post.id } }); }}
                  >
                    {post.imageUri ? (
                      <Image
                        source={{ uri: post.thumbnailUri || post.imageUri }}
                        style={styles.feedCardImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.feedCardImage, styles.feedCardNoImg]}>
                        <Text style={{ fontSize: 28 }}>{MEAL_EMOJI[post.mealType] || '🍽'}</Text>
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.feedCardOverlay}
                    >
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

      {/* Meal Type Picker Modal */}
      <Modal
        visible={mealPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMealPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMealPickerVisible(false)}>
          <Pressable style={styles.mealPickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.mealPickerHandle} />
            <Text style={styles.mealPickerTitle}>Add a Meal</Text>
            <Text style={styles.mealPickerSub}>What are you logging?</Text>
            <View style={styles.mealPickerGrid}>
              {[
                { id: 'breakfast', label: 'Breakfast', emoji: '☀️', color: '#FFB347' },
                { id: 'lunch', label: 'Lunch', emoji: '🍽', color: '#4ADE80' },
                { id: 'dinner', label: 'Dinner', emoji: '🌙', color: '#818CF8' },
                { id: 'snack', label: 'Snack', emoji: '🍿', color: '#FB923C' },
              ].map(mt => (
                <Pressable
                  key={mt.id}
                  style={({ pressed }) => [
                    styles.mealPickerItem,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleMealTypeSelect(mt.id); }}
                >
                  <View style={[styles.mealPickerEmojiBg, { backgroundColor: `${mt.color}18` }]}>
                    <Text style={{ fontSize: 32 }}>{mt.emoji}</Text>
                  </View>
                  <Text style={styles.mealPickerItemLabel}>{mt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.mealPickerCancel, pressed && { opacity: 0.7 }]}
              onPress={() => setMealPickerVisible(false)}
            >
              <Text style={styles.mealPickerCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  /* ─── Profile Bar ─── */
  profileBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  profileBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  profileStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  profileStat: { alignItems: 'center', gap: 1 },
  profileStatValue: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  profileStatLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3 },
  profileStatDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.06)' },
  coinsBadge: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  coinsBadgeImg: { width: 22, height: 22 },
  coinsBadgeText: { fontSize: 13, fontWeight: '900', color: '#D4AF37' },

  notifBtn: {
    position: 'absolute',
    right: 20,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  /* ─── Quick Actions ─── */
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  quickActionsSection2: {
    paddingHorizontal: 20,
    paddingTop: CARD_GAP,
  },
  quickRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  quickCard: {
    width: QUICK_CARD_W,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  quickCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.90)',
    textAlign: 'center',
    lineHeight: 14,
  },

  /* ─── Meal Picker Modal ─── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  mealPickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mealPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  mealPickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  mealPickerSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 24,
  },
  mealPickerGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  mealPickerItem: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mealPickerEmojiBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPickerItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  mealPickerCancel: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 14,
    backgroundColor: '#F4F4F8',
  },
  mealPickerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },

  /* ─── Weekly Meal Calendar ─── */
  weekSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  weekCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.20)',
  },
  weekCountText: { fontSize: 11, fontWeight: '700', color: '#22C55E' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.15)',
  },
  streakEmoji: { fontSize: 13 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#FF6B6B' },

  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  /* ─── Day Card ─── */
  dayCard: {
    width: WEEK_CARD_W,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dayCardToday: {
    borderColor: 'rgba(212,175,55,0.35)',
    borderWidth: 1.5,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.08,
  },
  dayCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8F8FA',
    position: 'relative',
  },
  dayCardNoImg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F4',
  },
  dayCardEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  dayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  dayBadgeToday: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: 'rgba(212,175,55,0.30)',
  },
  dayBadgeText: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  dayBadgeTextToday: { color: '#D4AF37' },
  mealCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCountText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  dayCardBottom: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  dayDishName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  dayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daySource: { fontSize: 11 },
  dayLikes: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  dayBookmark: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },

  /* ─── Feed Preview ─── */
  feedPreviewSection: {
    paddingTop: 24,
  },
  feedPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  feedPreviewTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  feedPreviewSeeAll: { fontSize: 14, fontWeight: '600', color: '#D4AF37' },
  feedPreviewScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  feedCard: {
    width: 140,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F4F4F8',
    position: 'relative',
  },
  feedCardImage: {
    width: '100%',
    height: '100%',
  },
  feedCardNoImg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F4',
  },
  feedCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 30,
  },
  feedCardDish: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  feedCardUser: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.70)' },
  feedCardLikes: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  feedCardLikesText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
});
