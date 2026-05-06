import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
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
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
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
function AnimatedCounter({ value, style, delay = 0 }: { value: number; style?: any; delay?: number }) {
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

type ContentTab = 'posts' | 'shows' | 'saved';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { myPosts, followingCount, followerCount } = usePosts();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user, logout } = useAuth();
  const { colors, isDark, toggleDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const { balance: coinBalance } = useCoin();
  const {
    isCreatorUnlocked,
    postCount,
    shows,
    hasSeenUnlock,
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

  const headerGradient = isDark
    ? ['#0A0A0F', '#14141C', '#1A1510'] as const
    : ['#FDF8F0', '#FFF8E1', '#FFECB3'] as const;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={activeTab === 'posts' ? gridPosts : []}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={renderGridItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          columnWrapperStyle={activeTab === 'posts' && gridPosts.length > 0 ? { marginBottom: GRID_GAP } : undefined}
          ListHeaderComponent={
            <View>
              {/* ═══ Header Gradient ═══ */}
              <LinearGradient colors={headerGradient} style={s.headerGradient}>
                {/* Toolbar */}
                <View style={s.toolbar}>
                  <Text style={[s.toolbarTitle, { color: colors.textPrimary }]}>Profile</Text>
                  <View style={s.toolbarActions}>
                    <Pressable
                      style={({ pressed }) => [s.toolbarBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                      onPress={() => { Haptics.selectionAsync(); toggleDarkMode(); }}
                    >
                      <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={17} color={isDark ? '#FFD700' : colors.textSecondary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.toolbarBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                      onPress={() => { Haptics.selectionAsync(); router.push('/app-info' as any); }}
                    >
                      <MaterialIcons name="settings" size={17} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.toolbarBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                      onPress={handleLogout}
                    >
                      <MaterialIcons name="logout" size={17} color={colors.error} />
                    </Pressable>
                  </View>
                </View>

                {/* ═══ Profile Card ═══ */}
                <Animated.View entering={FadeIn.duration(450)} style={s.profileCardWrap}>
                  <View style={[s.profileCard, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.12)',
                    shadowColor: isDark ? '#000' : '#B8960C',
                  }]}>
                    {/* Avatar + Info Row */}
                    <View style={s.profileTop}>
                      <View style={s.avatarSection}>
                        <LinearGradient colors={['#D4AF37', '#FFD700', '#B8960C']} style={s.avatarRing}>
                          <View style={[s.avatarInner, { backgroundColor: isDark ? '#14141C' : '#FFF' }]}>
                            <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.avatar}>
                              <Text style={s.avatarText}>{initials}</Text>
                            </LinearGradient>
                          </View>
                        </LinearGradient>
                        <View style={[s.avatarLevelBadge, { backgroundColor: userLevel.color, borderColor: isDark ? '#14141C' : '#FFF' }]}>
                          <Text style={{ fontSize: 13 }}>{userLevel.emoji}</Text>
                        </View>
                      </View>

                      <View style={s.profileInfo}>
                        <View style={s.nameRow}>
                          <Text style={[s.profileName, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
                          {myTier ? (
                            <View style={[s.tierTag, { backgroundColor: `${myTier.color}15`, borderColor: `${myTier.color}30` }]}>
                              <Text style={{ fontSize: 10 }}>{myTier.emoji}</Text>
                              <Text style={[s.tierTagText, { color: myTier.color }]}>{myTier.name}</Text>
                            </View>
                          ) : null}
                        </View>
                        {email ? <Text style={[s.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>{email}</Text> : null}

                        {/* Coin pill — single source */}
                        <Pressable
                          style={({ pressed }) => [s.coinPill, pressed && { opacity: 0.85 }]}
                          onPress={() => { Haptics.selectionAsync(); router.push('/coin-wallet'); }}
                        >
                          <Image source={require('../../assets/images/genie-coin.png')} style={{ width: 18, height: 18 }} contentFit="contain" />
                          <Text style={s.coinPillValue}>{coinBalance}</Text>
                          <Text style={s.coinPillLabel}>coins</Text>
                          <MaterialIcons name="chevron-right" size={14} color="rgba(212,175,55,0.55)" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Level Progress */}
                    <View style={s.levelSection}>
                      <View style={s.levelRow}>
                        <View style={s.levelCurrent}>
                          <Text style={{ fontSize: 12 }}>{userLevel.emoji}</Text>
                          <Text style={[s.levelName, { color: userLevel.color }]}>{userLevel.name}</Text>
                        </View>
                        {nextLevel ? (
                          <View style={s.levelNext}>
                            <Text style={[s.levelNextLabel, { color: colors.textMuted }]}>Next:</Text>
                            <Text style={{ fontSize: 12 }}>{nextLevel.emoji}</Text>
                            <Text style={[s.levelNextName, { color: nextLevel.color }]}>{nextLevel.name}</Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFD700', letterSpacing: 0.3 }}>MAX 👑</Text>
                        )}
                      </View>
                      <View style={[s.levelBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        <Animated.View entering={FadeIn.delay(300).duration(600)}>
                          <LinearGradient
                            colors={['#D4AF37', '#FFD700']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[s.levelBarFill, { width: `${Math.max(5, levelProgress * 100)}%` }]}
                          />
                        </Animated.View>
                      </View>
                      {nextLevel ? (
                        <Text style={[s.levelHint, { color: colors.textMuted }]}>{totalPostCount}/{nextLevel.minPosts} posts to level up</Text>
                      ) : null}
                    </View>
                  </View>
                </Animated.View>
              </LinearGradient>

              {/* ═══ Action Buttons ═══ */}
              <Animated.View entering={FadeInDown.delay(80).duration(350)} style={s.actionRow}>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/preferences'); }}
                >
                  <LinearGradient colors={isDark ? ['rgba(212,175,55,0.15)', 'rgba(212,175,55,0.05)'] : ['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)']} style={s.actionBtnIcon}>
                    <MaterialIcons name="edit" size={16} color="#D4AF37" />
                  </LinearGradient>
                  <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>Edit Profile</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/creator-dashboard'); }}
                >
                  <LinearGradient colors={isDark ? ['rgba(129,140,248,0.15)', 'rgba(129,140,248,0.05)'] : ['rgba(129,140,248,0.08)', 'rgba(129,140,248,0.02)']} style={s.actionBtnIcon}>
                    <MaterialIcons name="dashboard" size={16} color="#818CF8" />
                  </LinearGradient>
                  <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>Dashboard</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                  onPress={() => { Haptics.selectionAsync(); router.push('/admin' as any); }}
                >
                  <LinearGradient colors={isDark ? ['rgba(74,222,128,0.15)', 'rgba(74,222,128,0.05)'] : ['rgba(74,222,128,0.08)', 'rgba(74,222,128,0.02)']} style={s.actionBtnIcon}>
                    <MaterialIcons name="admin-panel-settings" size={16} color="#4ADE80" />
                  </LinearGradient>
                  <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>Admin</Text>
                </Pressable>

              </Animated.View>

              {/* ═══ Stats Row ═══ */}
              <Animated.View entering={FadeInDown.delay(140).duration(380)} style={s.statsWrap}>
                <View style={[s.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {[
                    { label: 'Posts', value: totalPostCount, icon: 'grid-on' as const, color: '#D4AF37' },
                    { label: 'Followers', value: followerCount, icon: 'people' as const, color: '#818CF8' },
                    { label: 'Following', value: followingCount, icon: 'person-add' as const, color: '#4ADE80' },
                    { label: 'Coins', value: coinBalance, icon: 'stars' as const, color: '#FFD700' },
                  ].map((stat, i) => (
                    <React.Fragment key={stat.label}>
                      {i > 0 ? <View style={[s.statsDivider, { backgroundColor: colors.border }]} /> : null}
                      <Pressable
                        style={s.statItem}
                        onPress={stat.label === 'Coins' ? () => { Haptics.selectionAsync(); router.push('/coin-wallet'); } : undefined}
                      >
                        <View style={[s.statIconWrap, { backgroundColor: `${stat.color}12` }]}>
                          <MaterialIcons name={stat.icon} size={16} color={stat.color} />
                        </View>
                        <AnimatedCounter
                          value={stat.value}
                          style={[s.statValue, { color: stat.label === 'Coins' ? '#FFD700' : colors.textPrimary }]}
                          delay={250 + i * 80}
                        />
                        <Text style={[s.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                      </Pressable>
                    </React.Fragment>
                  ))}
                </View>
              </Animated.View>

              {/* ═══ Content Tabs ═══ */}
              <View style={[s.tabsRow, { borderColor: colors.border }]}>
                {([
                  { id: 'posts' as ContentTab, icon: 'grid-on' as const, label: 'Posts' },
                  { id: 'shows' as ContentTab, icon: 'play-circle-outline' as const, label: 'Shows' },
                  { id: 'saved' as ContentTab, icon: 'bookmark-border' as const, label: 'Saved' },
                ]).map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      style={[s.tab, active && s.tabActive]}
                      onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                    >
                      <MaterialIcons name={tab.icon} size={21} color={active ? '#D4AF37' : colors.textMuted} />
                      <Text style={[s.tabLabel, { color: active ? '#D4AF37' : colors.textMuted }]}>{tab.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Shows tab content */}
              {activeTab === 'shows' ? (
                <View style={s.showsList}>
                  {shows.length > 0 ? (
                    shows.map((show, i) => (
                      <Animated.View key={show.id} entering={FadeInDown.delay(i * 50).duration(280)}>
                        <Pressable
                          style={({ pressed }) => [
                            s.showItem,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                          ]}
                          onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/create-show', params: { showId: show.id } }); }}
                        >
                          <View style={[s.showCover, { backgroundColor: colors.backgroundTertiary }]}>
                            {show.coverUri ? (
                              <Image source={{ uri: show.coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={150} />
                            ) : (
                              <Text style={{ fontSize: 24 }}>🎬</Text>
                            )}
                          </View>
                          <View style={{ flex: 1, gap: 3 }}>
                            <Text style={[s.showTitle, { color: colors.textPrimary }]} numberOfLines={1}>{show.title}</Text>
                            <Text style={[s.showMeta, { color: colors.textMuted }]}>{show.episodes.length} episodes</Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </Pressable>
                      </Animated.View>
                    ))
                  ) : (
                    <View style={s.emptyTab}>
                      <Text style={{ fontSize: 32 }}>🎬</Text>
                      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No Shows Yet</Text>
                      <Text style={[s.emptySub, { color: colors.textMuted }]}>Create your first show to get started</Text>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Saved tab content */}
              {activeTab === 'saved' ? (
                <View style={s.emptyTab}>
                  <View style={[s.emptyIcon, { backgroundColor: colors.surface }]}>
                    <MaterialIcons name="bookmark" size={36} color={colors.textMuted} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Nothing Saved</Text>
                  <Text style={[s.emptySub, { color: colors.textMuted }]}>Save posts to see them here</Text>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            activeTab === 'posts' ? (
              <View style={s.emptyTab}>
                <View style={[s.emptyIcon, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="camera-alt" size={36} color={colors.textMuted} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No Posts Yet</Text>
                <Text style={[s.emptySub, { color: colors.textMuted }]}>Share your first meal!</Text>
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

  /* Header */
  headerGradient: { paddingBottom: 6 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8,
  },
  toolbarTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  toolbarBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  /* Profile Card */
  profileCardWrap: { paddingHorizontal: 16, paddingBottom: 4 },
  profileCard: {
    padding: 18, borderRadius: 22, borderWidth: 1, gap: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarSection: { position: 'relative' },
  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center', padding: 3,
  },
  avatarInner: { width: 70, height: 70, borderRadius: 35, padding: 3 },
  avatar: {
    width: '100%', height: '100%', borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  avatarLevelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3,
  },
  profileInfo: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  profileName: { fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  tierTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1,
  },
  tierTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  profileEmail: { fontSize: 12, fontWeight: '500' },
  coinPill: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
    marginTop: 2,
  },
  coinPillValue: { fontSize: 15, fontWeight: '900', color: '#FFD700' },
  coinPillLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(212,175,55,0.60)' },

  /* Level Progress */
  levelSection: { gap: 5 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelCurrent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelName: { fontSize: 12, fontWeight: '800' },
  levelNext: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  levelNextLabel: { fontSize: 10, fontWeight: '600' },
  levelNextName: { fontSize: 10, fontWeight: '800' },
  levelBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  levelBarFill: { height: '100%', borderRadius: 3 },
  levelHint: { fontSize: 10, fontWeight: '600' },

  /* Action Buttons */
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 6, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 11, borderRadius: 14, borderWidth: 1,
  },
  actionBtnIcon: {
    width: 28, height: 28, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  /* Stats */
  statsWrap: { paddingHorizontal: 16, paddingTop: 12 },
  statsCard: {
    flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 18, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statsDivider: { width: 1, height: 40, alignSelf: 'center' },

  /* Content Tabs */
  tabsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    marginTop: 18,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#D4AF37' },
  tabLabel: { fontSize: 12, fontWeight: '700' },

  /* Shows */
  showsList: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  showItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  showCover: {
    width: 50, height: 50, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  showTitle: { fontSize: 14, fontWeight: '700' },
  showMeta: { fontSize: 12, fontWeight: '500' },

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

  /* Empty States */
  emptyTab: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500' },
});
