import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { usePosts } from '../../contexts/PostContext';
import { CREATOR_TIERS, useCreator } from '../../contexts/CreatorContext';
import { useAlert, useAuth } from '@/template';
import { useRouter } from 'expo-router';
import { fetchProfile, UserProfile } from '../../services/profileService';
import { useCoin } from '../../hooks/useCoin';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_SIZE = (SCREEN_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ── Level System ──
const LEVELS = [
  { id: 'newbie', name: 'Newbie', emoji: '🌱', minPosts: 0, color: '#9CA3AF' },
  { id: 'explorer', name: 'Explorer', emoji: '🧭', minPosts: 3, color: '#3B82F6' },
  { id: 'creator', name: 'Creator', emoji: '⭐', minPosts: 10, color: '#D4AF37' },
  { id: 'legend', name: 'Food Legend', emoji: '👑', minPosts: 25, color: '#FFD700' },
];

function getUserLevel(postCount: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (postCount >= l.minPosts) level = l;
  }
  return level;
}

function getNextLevel(postCount: number) {
  for (const l of LEVELS) {
    if (postCount < l.minPosts) return l;
  }
  return null;
}

function getLevelProgress(postCount: number) {
  const current = getUserLevel(postCount);
  const next = getNextLevel(postCount);
  if (!next) return 1;
  const currentMin = current.minPosts;
  const nextMin = next.minPosts;
  return Math.min(1, Math.max(0, (postCount - currentMin) / (nextMin - currentMin)));
}

// ── Animated Counter ──
function AnimatedCounter({ value, style, delay = 0, colors }: { value: number; style?: any; delay?: number; colors: any }) {
  const [display, setDisplay] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const timer = setTimeout(() => {
        let current = 0;
        const step = Math.max(1, Math.ceil(value / 20));
        const interval = setInterval(() => {
          current = Math.min(current + step, value);
          setDisplay(current);
          if (current >= value) clearInterval(interval);
        }, 40);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDisplay(value);
    }
  }, [value]);

  return <Text style={style}>{display.toLocaleString()}</Text>;
}

// ── Activity Item ──
function ActivityItem({ emoji, text, time, index, colors }: {
  emoji: string; text: string; time: string; index: number; colors: any;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(200 + index * 60).duration(300)}>
      <View style={[s.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[s.activityIcon, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.activityText, { color: colors.textPrimary }]}>{text}</Text>
          <Text style={[s.activityTime, { color: colors.textMuted }]}>{time}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Content Tab Types ──
type ContentTab = 'posts' | 'shows' | 'saved' | 'liked';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, myPosts, followingCount, followerCount } = usePosts();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user, logout } = useAuth();
  const { colors, isDark, toggleDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const { balance: coinBalance, currentStreak: coinStreak, totalEarned: totalCoinEarned } = useCoin();
  const {
    currentLevel,
    isCreatorUnlocked,
    postCount,
    streakCount,
    postsNeeded,
    streakNeeded,
    postProgress,
    streakProgress,
    shows,
    hasSeenUnlock,
    unlockedBadges,
    badges,
    totalLikes,
    myCreatorType,
  } = useCreator();

  const [activeTab, setActiveTab] = useState<ContentTab>('posts');

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id).then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user?.id]);

  const myTier = CREATOR_TIERS.find(t => t.id === myCreatorType) || null;
  const name = profile?.full_name || user?.username || 'Food Lover';
  const email = user?.email || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const totalPostCount = myPosts.length || postCount;
  const userLevel = getUserLevel(totalPostCount);
  const nextLevel = getNextLevel(totalPostCount);
  const levelProgress = getLevelProgress(totalPostCount);

  // Glow animation for coin pill
  const coinGlow = useSharedValue(0.4);
  useEffect(() => {
    coinGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    );
  }, []);
  const coinGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: coinGlow.value,
  }));

  // Content for tabs
  const gridPosts = myPosts;

  const handleLogout = () => {
    Haptics.selectionAsync();
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) showAlert('Error', error);
        },
      },
    ]);
  };

  const handleShowsTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isCreatorUnlocked) {
      if (!hasSeenUnlock) router.push('/creator-unlock');
      else router.push('/creator-studio');
    }
  }, [isCreatorUnlocked, hasSeenUnlock, router]);

  const renderGridItem = ({ item, index }: { item: typeof myPosts[0]; index: number }) => (
    <Pressable
      style={[s.gridItem, { marginRight: (index + 1) % GRID_COLS === 0 ? 0 : GRID_GAP }]}
      onPress={() => Haptics.selectionAsync()}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.thumbnailUri || item.imageUri }} style={s.gridImage} contentFit="cover" transition={150} />
      ) : (
        <View style={[s.gridNoImage, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 28 }}>🍽</Text>
        </View>
      )}
      {item.likes > 0 ? (
        <View style={s.gridLikesBadge}>
          <MaterialIcons name="favorite" size={10} color="#FFF" />
          <Text style={s.gridLikesText}>{item.likes}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  // ── Recent activity items ──
  const activities = [
    { emoji: '📸', text: `Posted ${totalPostCount} meals`, time: 'All time' },
    { emoji: '🪙', text: `${totalCoinEarned} total coins earned`, time: 'All time' },
    { emoji: '🔥', text: `${coinStreak} day streak`, time: 'Current' },
    { emoji: '📺', text: `${shows.length} shows created`, time: 'All time' },
  ];

  // ── Badge definitions ──
  const PROFILE_BADGES = [
    { id: 'creator', name: 'Creator', emoji: '⭐', color: '#D4AF37', unlocked: isCreatorUnlocked },
    { id: 'showmaker', name: 'Showmaker', emoji: '🎬', color: '#818CF8', unlocked: shows.length > 0 },
    { id: 'top_foodie', name: 'Top Foodie', emoji: '🏆', color: '#FFB347', unlocked: totalPostCount >= 5 },
    { id: 'streak_master', name: 'Streak Master', emoji: '🔥', color: '#FF6B6B', unlocked: coinStreak >= 3 },
    { id: 'coin_collector', name: 'Coin Collector', emoji: '💰', color: '#22C55E', unlocked: coinBalance >= 50 },
  ];

  const earnedBadges = PROFILE_BADGES.filter(b => b.unlocked);
  const lockedBadges = PROFILE_BADGES.filter(b => !b.unlocked);

  const headerGradient = isDark
    ? ['#0A0A0F', '#14141C', '#1A1510'] as const
    : ['#FDF8F0', '#FFF8E1', '#FFECB3'] as const;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={gridPosts}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={renderGridItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          columnWrapperStyle={{ marginBottom: GRID_GAP }}
          ListHeaderComponent={
            <View>
              {/* ═══ Premium Header ═══ */}
              <LinearGradient colors={headerGradient} style={s.headerGradient}>
                {/* Top toolbar */}
                <View style={s.toolbar}>
                  <Text style={[s.toolbarTitle, { color: colors.textPrimary }]}>Profile</Text>
                  <View style={s.toolbarActions}>
                    <Pressable
                      style={({ pressed }) => [s.toolbarBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                      onPress={() => { Haptics.selectionAsync(); router.push('/admin' as any); }}
                    >
                      <MaterialIcons name="admin-panel-settings" size={18} color="#D4AF37" />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.toolbarBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                      onPress={() => { Haptics.selectionAsync(); router.push('/app-info' as any); }}
                    >
                      <MaterialIcons name="settings" size={18} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.toolbarBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                      onPress={handleLogout}
                    >
                      <MaterialIcons name="logout" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>

                {/* ═══ Large Profile Card ═══ */}
                <Animated.View entering={FadeIn.duration(500)} style={s.profileCardWrap}>
                  <View style={[s.profileCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.15)' }]}>
                    {/* Avatar + Info */}
                    <View style={s.profileTop}>
                      <View style={s.avatarSection}>
                        <LinearGradient colors={['#D4AF37', '#FFD700', '#B8960C']} style={s.avatarOuter}>
                          <View style={[s.avatarInner, { backgroundColor: isDark ? '#14141C' : '#FFF' }]}>
                            <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.avatar}>
                              <Text style={s.avatarText}>{initials}</Text>
                            </LinearGradient>
                          </View>
                        </LinearGradient>
                        {/* Level badge on avatar */}
                        <View style={[s.avatarLevelBadge, { backgroundColor: userLevel.color, borderColor: isDark ? '#14141C' : '#FFF' }]}>
                          <Text style={{ fontSize: 14 }}>{userLevel.emoji}</Text>
                        </View>
                      </View>

                      <View style={s.profileInfo}>
                        <View style={s.nameRow}>
                          <Text style={[s.profileName, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
                          {myTier ? (
                            <View style={[s.badgeTag, { backgroundColor: `${myTier.color}18`, borderColor: `${myTier.color}35` }]}>
                              <Text style={{ fontSize: 11 }}>{myTier.emoji}</Text>
                              <Text style={[s.badgeTagText, { color: myTier.color }]}>{myTier.name}</Text>
                            </View>
                          ) : null}
                        </View>
                        {email ? <Text style={[s.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>{email}</Text> : null}

                        {/* Coin pill */}
                        <Animated.View style={[s.coinPill, coinGlowStyle]}>
                          <Pressable
                            style={({ pressed }) => [s.coinPillInner, pressed && { opacity: 0.85 }]}
                            onPress={() => { Haptics.selectionAsync(); router.push('/coin-wallet'); }}
                          >
                            <Image source={require('../../assets/images/genie-coin.png')} style={{ width: 20, height: 20 }} contentFit="contain" />
                            <Text style={s.coinPillValue}>{coinBalance}</Text>
                            <Text style={s.coinPillLabel}>coins</Text>
                          </Pressable>
                        </Animated.View>
                      </View>
                    </View>

                    {/* ═══ Level Progress Bar ═══ */}
                    <View style={s.levelSection}>
                      <View style={s.levelLabelRow}>
                        <View style={s.levelCurrent}>
                          <Text style={{ fontSize: 13 }}>{userLevel.emoji}</Text>
                          <Text style={[s.levelCurrentText, { color: userLevel.color }]}>{userLevel.name}</Text>
                        </View>
                        {nextLevel ? (
                          <View style={s.levelNext}>
                            <Text style={[s.levelNextText, { color: colors.textMuted }]}>Next:</Text>
                            <Text style={{ fontSize: 13 }}>{nextLevel.emoji}</Text>
                            <Text style={[s.levelNextName, { color: nextLevel.color }]}>{nextLevel.name}</Text>
                          </View>
                        ) : (
                          <Text style={[s.levelMaxText, { color: '#FFD700' }]}>MAX LEVEL 👑</Text>
                        )}
                      </View>
                      <View style={[s.levelBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                        <LinearGradient
                          colors={['#D4AF37', '#FFD700']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[s.levelBarFill, { width: `${Math.max(5, levelProgress * 100)}%` }]}
                        />
                      </View>
                      {nextLevel ? (
                        <Text style={[s.levelProgressText, { color: colors.textMuted }]}>
                          {totalPostCount}/{nextLevel.minPosts} posts to level up
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Animated.View>
              </LinearGradient>

              {/* ═══ Stats Section ═══ */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.statsSection}>
                <View style={[s.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {[
                    { label: 'Posts', value: totalPostCount, icon: 'grid-on', color: '#D4AF37' },
                    { label: 'Followers', value: followerCount, icon: 'people', color: '#818CF8' },
                    { label: 'Following', value: followingCount, icon: 'person-add', color: '#4ADE80' },
                    { label: 'Coins', value: coinBalance, icon: 'stars', color: '#FFD700' },
                  ].map((stat, i) => (
                    <React.Fragment key={stat.label}>
                      {i > 0 ? <View style={[s.statsDivider, { backgroundColor: colors.border }]} /> : null}
                      <Pressable
                        style={s.statsItem}
                        onPress={stat.label === 'Coins' ? () => router.push('/coin-wallet') : undefined}
                      >
                        <View style={[s.statsIconWrap, { backgroundColor: `${stat.color}15` }]}>
                          <MaterialIcons name={stat.icon as any} size={18} color={stat.color} />
                        </View>
                        <AnimatedCounter
                          value={stat.value}
                          style={[s.statsValue, { color: stat.label === 'Coins' ? '#FFD700' : colors.textPrimary }]}
                          delay={200 + i * 100}
                          colors={colors}
                        />
                        <Text style={[s.statsLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                      </Pressable>
                    </React.Fragment>
                  ))}
                </View>
              </Animated.View>

              {/* ═══ Badges Section ═══ */}
              <Animated.View entering={FadeInDown.delay(150).duration(350)}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Badges</Text>
                  <View style={s.badgeCountPill}>
                    <Text style={s.badgeCountText}>{earnedBadges.length}/{PROFILE_BADGES.length}</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                >
                  {earnedBadges.map((badge, i) => (
                    <Animated.View key={badge.id} entering={FadeInRight.delay(200 + i * 60).duration(300)}>
                      <View style={[s.badge, { backgroundColor: `${badge.color}12`, borderColor: `${badge.color}30` }]}>
                        <Text style={{ fontSize: 24 }}>{badge.emoji}</Text>
                        <Text style={[s.badgeName, { color: badge.color }]}>{badge.name}</Text>
                        <View style={[s.badgeCheck, { backgroundColor: badge.color }]}>
                          <MaterialIcons name="check" size={10} color="#FFF" />
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                  {lockedBadges.map((badge, i) => (
                    <Animated.View key={badge.id} entering={FadeInRight.delay(300 + i * 60).duration(300)}>
                      <View style={[s.badge, s.badgeLocked, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                        <Text style={{ fontSize: 24, opacity: 0.35 }}>{badge.emoji}</Text>
                        <Text style={[s.badgeName, { color: colors.textMuted }]}>{badge.name}</Text>
                        <MaterialIcons name="lock" size={12} color={colors.textMuted} style={{ position: 'absolute', top: 8, right: 8 }} />
                      </View>
                    </Animated.View>
                  ))}
                </ScrollView>
              </Animated.View>

              {/* ═══ Creator Studio Card ═══ */}
              <Animated.View entering={FadeInDown.delay(200).duration(350)} style={s.creatorSection}>
                {isCreatorUnlocked ? (
                  <Pressable
                    style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
                    onPress={handleShowsTap}
                  >
                    <LinearGradient
                      colors={isDark ? ['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)'] : ['rgba(255,248,225,0.9)', 'rgba(253,248,240,0.9)']}
                      style={[s.creatorCard, { borderColor: 'rgba(212,175,55,0.20)' }]}
                    >
                      <View style={s.creatorHeader}>
                        <View style={s.creatorTitleRow}>
                          <View style={[s.creatorIconWrap, { backgroundColor: 'rgba(212,175,55,0.15)' }]}>
                            <MaterialIcons name="auto-awesome" size={22} color="#FFD700" />
                          </View>
                          <View>
                            <Text style={[s.creatorTitle, { color: colors.textPrimary }]}>Creator Studio</Text>
                            <Text style={[s.creatorSub, { color: colors.textMuted }]}>Manage shows & content</Text>
                          </View>
                        </View>
                        <View style={s.creatorUnlockedBadge}>
                          <MaterialIcons name="verified" size={14} color="#D4AF37" />
                          <Text style={s.creatorUnlockedText}>Active</Text>
                        </View>
                      </View>

                      <View style={s.creatorStatsRow}>
                        <View style={[s.creatorStatCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.08)' }]}>
                          <Text style={[s.creatorStatVal, { color: colors.textPrimary }]}>{shows.length}</Text>
                          <Text style={[s.creatorStatLbl, { color: colors.textMuted }]}>Shows</Text>
                        </View>
                        <View style={[s.creatorStatCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.08)' }]}>
                          <Text style={[s.creatorStatVal, { color: colors.textPrimary }]}>
                            {shows.reduce((sum, sh) => sum + sh.episodes.length, 0)}
                          </Text>
                          <Text style={[s.creatorStatLbl, { color: colors.textMuted }]}>Episodes</Text>
                        </View>
                        <View style={[s.creatorStatCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.08)' }]}>
                          <Text style={[s.creatorStatVal, { color: '#FFD700' }]}>{totalLikes}</Text>
                          <Text style={[s.creatorStatLbl, { color: colors.textMuted }]}>Likes</Text>
                        </View>
                      </View>

                      <Pressable
                        style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/create-show'); }}
                      >
                        <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.creatorCta}>
                          <MaterialIcons name="add" size={18} color="#FFF" />
                          <Text style={s.creatorCtaText}>Create New Show</Text>
                        </LinearGradient>
                      </Pressable>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <View style={[s.creatorCardLocked, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={s.lockHeader}>
                      <View style={[s.lockIconWrap, { backgroundColor: 'rgba(212,175,55,0.08)' }]}>
                        <MaterialIcons name="rocket-launch" size={24} color="#FFD700" />
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={[s.lockTitle, { color: colors.textPrimary }]}>Creator Mode</Text>
                        <Text style={[s.lockSub, { color: colors.textMuted }]}>
                          {postsNeeded > 0
                            ? `${postsNeeded} post${postsNeeded !== 1 ? 's' : ''} away`
                            : `${streakNeeded} day${streakNeeded !== 1 ? 's' : ''} streak to unlock`
                          }
                        </Text>
                      </View>
                    </View>
                    <View style={s.lockProgressSection}>
                      <View style={s.lockProgressItem}>
                        <View style={s.lockProgressLabel}>
                          <Text style={[s.lockProgressText, { color: colors.textMuted }]}>Posts</Text>
                          <Text style={[s.lockProgressCount, { color: colors.textPrimary }]}>{postCount}/5</Text>
                        </View>
                        <View style={[s.lockProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                          <View style={[s.lockProgressFill, { width: `${postProgress * 100}%`, backgroundColor: '#D4AF37' }]} />
                        </View>
                      </View>
                      <View style={s.lockProgressItem}>
                        <View style={s.lockProgressLabel}>
                          <Text style={[s.lockProgressText, { color: colors.textMuted }]}>Streak</Text>
                          <Text style={[s.lockProgressCount, { color: colors.textPrimary }]}>{streakCount}/7 days</Text>
                        </View>
                        <View style={[s.lockProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                          <View style={[s.lockProgressFill, { width: `${streakProgress * 100}%`, backgroundColor: '#FFD700' }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* ═══ Coin Section ═══ */}
              <Animated.View entering={FadeInDown.delay(250).duration(350)} style={s.coinSection}>
                <View style={[s.coinCard, { borderColor: 'rgba(212,175,55,0.20)' }]}>
                  <LinearGradient
                    colors={isDark ? ['rgba(212,175,55,0.10)', 'rgba(212,175,55,0.03)'] : ['rgba(255,248,225,0.95)', 'rgba(253,248,240,0.95)']}
                    style={s.coinCardInner}
                  >
                    <View style={s.coinCardHeader}>
                      <Image source={require('../../assets/images/genie-coin.png')} style={{ width: 32, height: 32 }} contentFit="contain" />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[s.coinCardTitle, { color: colors.textPrimary }]}>Genie Coins</Text>
                        <Text style={[s.coinCardSub, { color: colors.textMuted }]}>Earn coins, unlock rewards</Text>
                      </View>
                    </View>
                    <View style={s.coinStatsRow}>
                      <View style={[s.coinStatBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.08)' }]}>
                        <Text style={[s.coinStatLabel, { color: colors.textMuted }]}>Earned</Text>
                        <Text style={[s.coinStatValue, { color: '#FFD700' }]}>{totalCoinEarned}</Text>
                      </View>
                      <View style={[s.coinStatBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.08)' }]}>
                        <Text style={[s.coinStatLabel, { color: colors.textMuted }]}>Total</Text>
                        <Text style={[s.coinStatValue, { color: '#FFD700' }]}>{coinBalance}</Text>
                      </View>
                      <View style={[s.coinStatBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.08)' }]}>
                        <Text style={[s.coinStatLabel, { color: colors.textMuted }]}>Streak</Text>
                        <Text style={[s.coinStatValue, { color: '#FF6B6B' }]}>🔥 {coinStreak}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                      onPress={() => { Haptics.selectionAsync(); router.push('/coin-redeem'); }}
                    >
                      <View style={[s.coinUseBtn, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.10)', borderColor: 'rgba(212,175,55,0.25)' }]}>
                        <MaterialIcons name="redeem" size={18} color="#D4AF37" />
                        <Text style={s.coinUseBtnText}>Use Coins</Text>
                      </View>
                    </Pressable>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* ═══ Activity Section ═══ */}
              <Animated.View entering={FadeInDown.delay(300).duration(350)}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Activity</Text>
                </View>
                <View style={s.activityList}>
                  {activities.map((act, i) => (
                    <ActivityItem key={i} emoji={act.emoji} text={act.text} time={act.time} index={i} colors={colors} />
                  ))}
                </View>
              </Animated.View>

              {/* ═══ Dark Mode + Actions ═══ */}
              <Animated.View entering={FadeInDown.delay(350).duration(300)} style={s.settingsSection}>
                <Pressable
                  style={[s.darkModeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => { Haptics.selectionAsync(); toggleDarkMode(); }}
                >
                  <View style={s.darkModeLeft}>
                    <View style={[s.darkModeIcon, { backgroundColor: isDark ? 'rgba(255,215,0,0.12)' : 'rgba(26,26,46,0.06)' }]}>
                      <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={22} color={isDark ? '#FFD700' : '#1A1A2E'} />
                    </View>
                    <View>
                      <Text style={[s.darkModeLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                      <Text style={[s.darkModeSub, { color: colors.textMuted }]}>{isDark ? 'On' : 'Off'}</Text>
                    </View>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={() => { Haptics.selectionAsync(); toggleDarkMode(); }}
                    trackColor={{ false: '#E5E7EB', true: 'rgba(212,175,55,0.35)' }}
                    thumbColor={isDark ? '#FFD700' : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                  />
                </Pressable>

                <View style={s.actionRow}>
                  <Pressable
                    style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push('/(tabs)/preferences')}
                  >
                    <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                    <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>Edit Profile</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
                    onPress={() => { Haptics.selectionAsync(); router.push('/creator-dashboard'); }}
                  >
                    <MaterialIcons name="dashboard" size={16} color="#D4AF37" />
                    <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>Dashboard</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.actionBtn, { backgroundColor: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.20)' }, pressed && { opacity: 0.8 }]}
                    onPress={() => { Haptics.selectionAsync(); router.push('/shows'); }}
                  >
                    <MaterialIcons name="live-tv" size={16} color="#D4AF37" />
                    <Text style={[s.actionBtnText, { color: '#D4AF37' }]}>Shows</Text>
                  </Pressable>
                </View>
              </Animated.View>

              {/* ═══ Content Tabs ═══ */}
              <View style={[s.contentTabsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                {([
                  { id: 'posts' as ContentTab, icon: 'grid-on', label: 'Posts' },
                  { id: 'shows' as ContentTab, icon: 'play-circle-outline', label: 'Shows' },
                  { id: 'saved' as ContentTab, icon: 'bookmark-border', label: 'Saved' },
                  { id: 'liked' as ContentTab, icon: 'favorite-border', label: 'Liked' },
                ]).map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      style={[s.contentTab, isActive && s.contentTabActive]}
                      onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                    >
                      <MaterialIcons
                        name={tab.icon as any}
                        size={22}
                        color={isActive ? '#D4AF37' : colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>

              {/* Shows tab content */}
              {activeTab === 'shows' ? (
                <View style={s.showsTabContent}>
                  {shows.length > 0 ? (
                    shows.map((show, i) => (
                      <Animated.View key={show.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                        <Pressable
                          style={({ pressed }) => [
                            s.showItem,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                          ]}
                          onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/create-show', params: { showId: show.id } }); }}
                        >
                          <View style={[s.showItemCover, { backgroundColor: colors.backgroundTertiary }]}>
                            {show.coverUri ? (
                              <Image source={{ uri: show.coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={150} />
                            ) : (
                              <Text style={{ fontSize: 28 }}>🎬</Text>
                            )}
                          </View>
                          <View style={{ flex: 1, gap: 3 }}>
                            <Text style={[s.showItemTitle, { color: colors.textPrimary }]} numberOfLines={1}>{show.title}</Text>
                            <Text style={[s.showItemMeta, { color: colors.textMuted }]}>{show.episodes.length} episodes</Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
                        </Pressable>
                      </Animated.View>
                    ))
                  ) : (
                    <View style={s.emptyTabState}>
                      <Text style={{ fontSize: 36 }}>🎬</Text>
                      <Text style={[s.emptyTabTitle, { color: colors.textPrimary }]}>No Shows Yet</Text>
                      <Text style={[s.emptyTabSub, { color: colors.textMuted }]}>Create your first show to get started</Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            activeTab === 'posts' || activeTab === 'saved' || activeTab === 'liked' ? (
              <View style={s.emptyGrid}>
                <View style={[s.emptyGridIcon, { backgroundColor: colors.surface }]}>
                  <MaterialIcons
                    name={activeTab === 'posts' ? 'camera-alt' : activeTab === 'saved' ? 'bookmark' : 'favorite'}
                    size={40}
                    color={colors.textMuted}
                  />
                </View>
                <Text style={[s.emptyGridTitle, { color: colors.textPrimary }]}>
                  {activeTab === 'posts' ? 'No Posts Yet' : activeTab === 'saved' ? 'Nothing Saved' : 'No Likes Yet'}
                </Text>
                <Text style={[s.emptyGridSub, { color: colors.textMuted }]}>
                  {activeTab === 'posts' ? 'Share your first meal!' : activeTab === 'saved' ? 'Save posts to see them here' : 'Like posts to see them here'}
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  /* Header gradient */
  headerGradient: { paddingBottom: 8 },

  /* Toolbar */
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  toolbarTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  toolbarBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  /* Profile Card */
  profileCardWrap: { paddingHorizontal: 16, paddingBottom: 4 },
  profileCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarSection: { position: 'relative' },
  avatarOuter: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    padding: 3,
  },
  avatarInner: { width: 78, height: 78, borderRadius: 39, padding: 3 },
  avatar: {
    width: '100%', height: '100%', borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  avatarLevelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },
  profileInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  profileName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  badgeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  badgeTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  profileEmail: { fontSize: 12, fontWeight: '500' },

  /* Coin pill */
  coinPill: {
    alignSelf: 'flex-start',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
  },
  coinPillInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  coinPillValue: { fontSize: 16, fontWeight: '900', color: '#FFD700' },
  coinPillLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(212,175,55,0.65)' },

  /* Level progress */
  levelSection: { gap: 6 },
  levelLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelCurrent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelCurrentText: { fontSize: 13, fontWeight: '800' },
  levelNext: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelNextText: { fontSize: 11, fontWeight: '600' },
  levelNextName: { fontSize: 11, fontWeight: '800' },
  levelMaxText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  levelBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  levelBarFill: { height: '100%', borderRadius: 4 },
  levelProgressText: { fontSize: 10, fontWeight: '600' },

  /* Stats Section */
  statsSection: { paddingHorizontal: 16, paddingTop: 14 },
  statsCard: {
    flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  statsItem: { flex: 1, alignItems: 'center', gap: 4 },
  statsIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statsValue: { fontSize: 20, fontWeight: '900' },
  statsLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsDivider: { width: 1, height: 44, alignSelf: 'center' },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 22, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },

  /* Badges */
  badgeCountPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.10)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  badgeCountText: { fontSize: 11, fontWeight: '800', color: '#D4AF37' },
  badge: {
    width: 82, paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 16, alignItems: 'center', gap: 6, borderWidth: 1,
    position: 'relative',
  },
  badgeLocked: { opacity: 0.7 },
  badgeName: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  badgeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Creator Section */
  creatorSection: { paddingHorizontal: 16, paddingTop: 18 },
  creatorCard: {
    padding: 18, borderRadius: 22, borderWidth: 1, gap: 16,
  },
  creatorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  creatorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  creatorIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  creatorTitle: { fontSize: 16, fontWeight: '800' },
  creatorSub: { fontSize: 12, fontWeight: '500' },
  creatorUnlockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  creatorUnlockedText: { fontSize: 11, fontWeight: '700', color: '#D4AF37' },
  creatorStatsRow: { flexDirection: 'row', gap: 10 },
  creatorStatCard: {
    flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, borderRadius: 14,
  },
  creatorStatVal: { fontSize: 20, fontWeight: '900' },
  creatorStatLbl: { fontSize: 11, fontWeight: '600' },
  creatorCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
  },
  creatorCtaText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  /* Locked creator */
  creatorCardLocked: { padding: 18, borderRadius: 22, borderWidth: 1, gap: 14 },
  lockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIconWrap: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)',
  },
  lockTitle: { fontSize: 16, fontWeight: '800' },
  lockSub: { fontSize: 13, fontWeight: '500' },
  lockProgressSection: { gap: 10 },
  lockProgressItem: { gap: 6 },
  lockProgressLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lockProgressText: { fontSize: 13, fontWeight: '600' },
  lockProgressCount: { fontSize: 13, fontWeight: '700' },
  lockProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  lockProgressFill: { height: '100%', borderRadius: 3 },

  /* Coin Section */
  coinSection: { paddingHorizontal: 16, paddingTop: 18 },
  coinCard: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  coinCardInner: { padding: 18, gap: 14 },
  coinCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinCardTitle: { fontSize: 16, fontWeight: '800' },
  coinCardSub: { fontSize: 12, fontWeight: '500' },
  coinStatsRow: { flexDirection: 'row', gap: 10 },
  coinStatBox: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, borderRadius: 14 },
  coinStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  coinStatValue: { fontSize: 18, fontWeight: '900' },
  coinUseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  coinUseBtnText: { fontSize: 14, fontWeight: '700', color: '#D4AF37' },

  /* Activity */
  activityList: { paddingHorizontal: 16, gap: 8 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1,
  },
  activityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityText: { fontSize: 14, fontWeight: '600' },
  activityTime: { fontSize: 11, fontWeight: '500' },

  /* Settings */
  settingsSection: { paddingHorizontal: 16, paddingTop: 18, gap: 12 },
  darkModeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  darkModeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  darkModeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  darkModeLabel: { fontSize: 15, fontWeight: '700' },
  darkModeSub: { fontSize: 12, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  /* Content Tabs */
  contentTabsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, marginTop: 18,
  },
  contentTab: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
  },
  contentTabActive: {
    borderBottomWidth: 2, borderBottomColor: '#D4AF37',
  },

  /* Shows tab */
  showsTabContent: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  showItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, borderWidth: 1,
  },
  showItemCover: {
    width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  showItemTitle: { fontSize: 15, fontWeight: '700' },
  showItemMeta: { fontSize: 12, fontWeight: '500' },

  /* Empty tab state */
  emptyTabState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTabTitle: { fontSize: 16, fontWeight: '700' },
  emptyTabSub: { fontSize: 13 },

  /* Grid */
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridNoImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  gridLikesBadge: {
    position: 'absolute', bottom: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  gridLikesText: { fontSize: 9, fontWeight: '700', color: '#FFF' },

  emptyGrid: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyGridIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyGridTitle: { fontSize: 18, fontWeight: '700' },
  emptyGridSub: { fontSize: 14 },
});
