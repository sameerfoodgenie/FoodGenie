import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { usePosts, CreatorType } from '../../contexts/PostContext';
import { CREATOR_TIERS } from '../../contexts/CreatorContext';
import { useMeals } from '../../hooks/useMeals';
import { useCreator } from '../../contexts/CreatorContext';
import { useAlert, useAuth } from '@/template';
import { useRouter } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, streak, totalPosts } = usePosts();
  const { todayMeals } = useMeals();
  const { showAlert } = useAlert();
  const { user, logout } = useAuth();
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
    liveSessions,
  } = useCreator();

  const myTier = CREATOR_TIERS.find(t => t.id === myCreatorType) || null;

  const name = user?.username || 'Food Lover';
  const email = user?.email || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const gridPosts = posts;
  const latestPost = posts.length > 0 ? posts[0] : null;

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
      if (!hasSeenUnlock) {
        router.push('/creator-unlock');
      } else {
        router.push('/creator-studio');
      }
    }
  }, [isCreatorUnlocked, hasSeenUnlock, router]);

  const renderGridItem = ({ item, index }: { item: typeof posts[0]; index: number }) => (
    <Pressable
      style={[
        styles.gridItem,
        { marginRight: (index + 1) % GRID_COLS === 0 ? 0 : GRID_GAP },
      ]}
      onPress={() => Haptics.selectionAsync()}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.gridImage} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.gridNoImage}>
          <Text style={{ fontSize: 28 }}>🍽</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{name}</Text>
              <View style={styles.headerActions}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/camera')}>
                  <MaterialIcons name="add-box" size={26} color={theme.textPrimary} />
                </Pressable>
                <Pressable style={styles.headerIconBtn} onPress={handleLogout}>
                  <MaterialIcons name="logout" size={22} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Profile info + social stats */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.profileSection}>
              <View style={styles.avatarWrap}>
                <LinearGradient colors={[currentLevel.color, `${currentLevel.color}CC`]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
                <View style={[styles.levelBadge, { backgroundColor: currentLevel.color }]}>
                  <Text style={styles.levelBadgeEmoji}>{currentLevel.emoji}</Text>
                </View>
              </View>
              <View style={styles.socialStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{gridPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>128</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>89</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#F87171' }]}>{totalLikes}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>
            </Animated.View>

            {/* Bio + Level */}
            <View style={styles.bioSection}>
              <View style={styles.bioNameRow}>
                <Text style={styles.bioName}>{name}</Text>
                {myTier ? (
                  <View style={[styles.levelTag, { backgroundColor: `${myTier.color}18`, borderColor: `${myTier.color}40` }]}>
                    <Text style={styles.levelTagEmoji}>{myTier.emoji}</Text>
                    <Text style={[styles.levelTagText, { color: myTier.color }]}>{myTier.name}</Text>
                  </View>
                ) : (
                  <View style={[styles.levelTag, { backgroundColor: `${currentLevel.color}18`, borderColor: `${currentLevel.color}40` }]}>
                    <Text style={styles.levelTagEmoji}>{currentLevel.emoji}</Text>
                    <Text style={[styles.levelTagText, { color: currentLevel.color }]}>{currentLevel.name}</Text>
                  </View>
                )}
              </View>
              {email ? <Text style={styles.bioEmail}>{email}</Text> : null}
              <Text style={styles.bioText}>Food lover sharing my meals on FoodGenie 🍽✨</Text>
            </View>

            {/* ─── Latest Post Hero ─── */}
            {latestPost ? (
              <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.latestPostSection}>
                <Text style={styles.latestLabel}>LATEST POST</Text>
                <Pressable
                  style={({ pressed }) => [styles.latestPostCard, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  {latestPost.imageUri ? (
                    <Image source={{ uri: latestPost.imageUri }} style={styles.latestPostImage} contentFit="cover" transition={200} />
                  ) : (
                    <View style={styles.latestPostNoImage}>
                      <Text style={{ fontSize: 48 }}>🍽</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.latestPostOverlay}
                  >
                    <View style={styles.latestPostInfo}>
                      <Text style={styles.latestDishName}>{latestPost.dishName}</Text>
                      {latestPost.caption ? (
                        <Text style={styles.latestCaption} numberOfLines={1}>{latestPost.caption}</Text>
                      ) : null}
                      <View style={styles.latestMeta}>
                        <View style={styles.latestMetaItem}>
                          <MaterialIcons name="favorite" size={14} color="#F87171" />
                          <Text style={styles.latestMetaText}>{latestPost.likes}</Text>
                        </View>
                        <View style={styles.latestMetaItem}>
                          <MaterialIcons name="chat-bubble" size={13} color={theme.textMuted} />
                          <Text style={styles.latestMetaText}>{latestPost.comments.length}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : null}

            {/* ─── Badges Row ─── */}
            {unlockedBadges.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                <Pressable
                  style={styles.badgesSection}
                  onPress={() => { Haptics.selectionAsync(); router.push('/creator-dashboard'); }}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.badgesScroll}
                  >
                    {unlockedBadges.map(badge => (
                      <View
                        key={badge.id}
                        style={[styles.profileBadge, { backgroundColor: `${badge.color}12`, borderColor: `${badge.color}30` }]}
                      >
                        <Text style={styles.profileBadgeEmoji}>{badge.emoji}</Text>
                        <Text style={[styles.profileBadgeName, { color: badge.color }]}>{badge.name}</Text>
                      </View>
                    ))}
                    {unlockedBadges.length < badges.length ? (
                      <View style={styles.moreBadges}>
                        <Text style={styles.moreBadgesText}>+{badges.length - unlockedBadges.length}</Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </Pressable>
              </Animated.View>
            ) : null}

            {/* Action buttons */}
            <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/(tabs)/preferences')}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.8 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/creator-dashboard'); }}
              >
                <Text style={styles.editProfileText}>Dashboard</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, styles.showsBtn, pressed && { opacity: 0.8 }]}
                onPress={() => { Haptics.selectionAsync(); router.push('/shows'); }}
              >
                <MaterialIcons name="live-tv" size={16} color={theme.primary} />
                <Text style={[styles.editProfileText, { color: theme.primary }]}>Shows</Text>
              </Pressable>
            </Animated.View>

            {/* ─── Creator Section ─── */}
            <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.creatorSection}>
              {isCreatorUnlocked ? (
                <Pressable
                  style={({ pressed }) => [styles.creatorCardUnlocked, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                  onPress={handleShowsTap}
                >
                  <LinearGradient
                    colors={['rgba(74,222,128,0.08)', 'rgba(74,222,128,0.02)']}
                    style={styles.creatorCardInner}
                  >
                    <View style={styles.creatorHeader}>
                      <View style={styles.creatorTitleRow}>
                        <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
                        <Text style={styles.creatorTitle}>Creator Studio</Text>
                      </View>
                      <View style={styles.creatorBadgeTag}>
                        <Text style={styles.creatorBadgeText}>Unlocked</Text>
                      </View>
                    </View>
                    <View style={styles.creatorStats}>
                      <View style={styles.creatorStatItem}>
                        <Text style={styles.creatorStatVal}>{shows.length}</Text>
                        <Text style={styles.creatorStatLbl}>Shows</Text>
                      </View>
                      <View style={styles.creatorStatItem}>
                        <Text style={styles.creatorStatVal}>
                          {shows.reduce((s, sh) => s + sh.episodes.length, 0)}
                        </Text>
                        <Text style={styles.creatorStatLbl}>Episodes</Text>
                      </View>
                    </View>
                    <View style={styles.creatorCta}>
                      <Text style={styles.creatorCtaText}>Open Studio</Text>
                      <MaterialIcons name="arrow-forward" size={16} color={theme.primary} />
                    </View>
                  </LinearGradient>
                </Pressable>
              ) : (
                <View style={styles.creatorCardLocked}>
                  <View style={styles.lockHeader}>
                    <View style={styles.lockIconWrap}>
                      <MaterialIcons name="rocket-launch" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.lockTitleBlock}>
                      <Text style={styles.lockTitle}>Creator Mode</Text>
                      <Text style={styles.lockSubtitle}>
                        {postsNeeded > 0
                          ? `You are ${postsNeeded} post${postsNeeded !== 1 ? 's' : ''} away from Creator Mode`
                          : `🔥 ${streakNeeded} day${streakNeeded !== 1 ? 's' : ''} streak to unlock`
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Reward preview */}
                  <View style={styles.rewardPreview}>
                    <MaterialIcons name="emoji-events" size={16} color={theme.accent} />
                    <Text style={styles.rewardPreviewText}>Unlock: Create Shows & gain followers</Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>📸 Posts</Text>
                        <Text style={styles.progressCount}>{postCount}/5</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, { width: `${postProgress * 100}%`, backgroundColor: theme.primary }]} />
                      </View>
                    </View>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>🔥 Streak</Text>
                        <Text style={styles.progressCount}>{streakCount}/7 days</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, { width: `${streakProgress * 100}%`, backgroundColor: theme.accent }]} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Grid header */}
            <View style={styles.gridHeader}>
              <View style={styles.gridTab}>
                <MaterialIcons name="grid-on" size={22} color={theme.textPrimary} />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <MaterialIcons name="camera-alt" size={48} color={theme.textMuted} />
            <Text style={styles.emptyGridTitle}>No Posts Yet</Text>
            <Text style={styles.emptyGridSub}>Share your first meal!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerIconBtn: { padding: 4 },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: theme.textOnPrimary },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  levelBadgeEmoji: { fontSize: 12 },

  socialStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 19, fontWeight: '800', color: theme.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '500', color: theme.textMuted },

  bioSection: { paddingHorizontal: 20, paddingBottom: 8, gap: 4 },
  bioNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bioName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelTagEmoji: { fontSize: 12 },
  levelTagText: { fontSize: 11, fontWeight: '700' },
  bioEmail: { fontSize: 13, color: theme.textMuted },
  bioText: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },

  // Latest post hero
  latestPostSection: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  latestLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  latestPostCard: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  latestPostImage: { width: '100%', height: '100%' },
  latestPostNoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 40,
  },
  latestPostInfo: { gap: 4 },
  latestDishName: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  latestCaption: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  latestMeta: { flexDirection: 'row', gap: 14, marginTop: 4 },
  latestMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  latestMetaText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  // Badges
  badgesSection: { paddingBottom: 4 },
  badgesScroll: { paddingHorizontal: 20, gap: 8, paddingVertical: 6 },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileBadgeEmoji: { fontSize: 14 },
  profileBadgeName: { fontSize: 12, fontWeight: '600' },
  moreBadges: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgesText: { fontSize: 12, fontWeight: '700', color: theme.textMuted },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 10,
  },
  showsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderColor: 'rgba(74,222,128,0.25)',
    backgroundColor: 'rgba(74,222,128,0.06)',
  },
  editProfileBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editProfileText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },

  /* Creator Section */
  creatorSection: { paddingHorizontal: 20, paddingBottom: 16 },
  creatorCardUnlocked: { borderRadius: 16, overflow: 'hidden' },
  creatorCardInner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    gap: 14,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  creatorBadgeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.15)',
  },
  creatorBadgeText: { fontSize: 12, fontWeight: '700', color: theme.primary },
  creatorStats: { flexDirection: 'row', gap: 24 },
  creatorStatItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  creatorStatVal: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  creatorStatLbl: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
  creatorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  creatorCtaText: { fontSize: 14, fontWeight: '600', color: theme.primary },

  /* Locked */
  creatorCardLocked: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  lockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  lockTitleBlock: { flex: 1, gap: 3 },
  lockTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  lockSubtitle: { fontSize: 13, color: theme.textSecondary, fontWeight: '500', lineHeight: 18 },

  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
  },
  rewardPreviewText: { fontSize: 13, fontWeight: '600', color: theme.accent },

  progressSection: { gap: 10 },
  progressItem: { gap: 6 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  progressCount: { fontSize: 13, fontWeight: '700', color: theme.textPrimary },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },

  /* Grid */
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  gridTab: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderBottomWidth: 2,
    borderBottomColor: theme.textPrimary,
  },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  gridNoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGrid: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyGridTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  emptyGridSub: { fontSize: 14, color: theme.textMuted },
});
