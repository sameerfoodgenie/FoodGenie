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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { usePosts } from '../../contexts/PostContext';
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
  } = useCreator();

  const name = user?.username || 'Food Lover';
  const email = user?.email || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const gridPosts = posts;

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
                <Pressable style={styles.headerIconBtn} onPress={() => router.push('/explore')}>
                  <MaterialIcons name="menu" size={26} color={theme.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Profile info */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.profileSection}>
              <View style={styles.avatarWrap}>
                <LinearGradient colors={[currentLevel.color, `${currentLevel.color}CC`]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
                {/* Level badge on avatar */}
                <View style={[styles.levelBadge, { backgroundColor: currentLevel.color }]}>
                  <Text style={styles.levelBadgeEmoji}>{currentLevel.emoji}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{gridPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todayMeals.length}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#FB923C' }]}>🔥 {streak}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
              </View>
            </Animated.View>

            {/* Bio + Level */}
            <View style={styles.bioSection}>
              <View style={styles.bioNameRow}>
                <Text style={styles.bioName}>{name}</Text>
                <View style={[styles.levelTag, { backgroundColor: `${currentLevel.color}18`, borderColor: `${currentLevel.color}40` }]}>
                  <Text style={styles.levelTagEmoji}>{currentLevel.emoji}</Text>
                  <Text style={[styles.levelTagText, { color: currentLevel.color }]}>{currentLevel.name}</Text>
                </View>
              </View>
              {email ? <Text style={styles.bioEmail}>{email}</Text> : null}
              <Text style={styles.bioText}>Food lover sharing my meals on FoodGenie 🍽✨</Text>
            </View>

            {/* ─── Badges Row ─── */}
            {unlockedBadges.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(50).duration(300)}>
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
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.actionRow}>
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
                style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.8 }]}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={18} color={theme.textSecondary} />
              </Pressable>
            </Animated.View>

            {/* ─── Creator Shows Section ─── */}
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
                      <View style={styles.creatorBadge}>
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
                      <MaterialIcons name="lock" size={22} color={theme.textMuted} />
                    </View>
                    <View style={styles.lockTitleBlock}>
                      <Text style={styles.lockTitle}>Creator Mode</Text>
                      <Text style={styles.lockSubtitle}>Unlock to create shows</Text>
                    </View>
                  </View>
                  <Text style={styles.lockDesc}>
                    Post 5 meals or maintain a 7-day streak to unlock Creator Mode
                  </Text>
                  <View style={styles.progressSection}>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>Posts</Text>
                        <Text style={styles.progressCount}>{postCount}/5</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${postProgress * 100}%`, backgroundColor: theme.primary }]} />
                      </View>
                    </View>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>Streak</Text>
                        <Text style={styles.progressCount}>{streakCount}/7 days</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${streakProgress * 100}%`, backgroundColor: theme.accent }]} />
                      </View>
                    </View>
                  </View>
                  {postsNeeded > 0 && streakNeeded > 0 ? (
                    <Text style={styles.lockHint}>
                      {postsNeeded} more post{postsNeeded !== 1 ? 's' : ''} or {streakNeeded} more day{streakNeeded !== 1 ? 's' : ''} to go!
                    </Text>
                  ) : null}
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
    gap: 24,
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
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  statLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted },

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
  settingsBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
  },

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
  creatorBadge: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  lockTitleBlock: { flex: 1, gap: 2 },
  lockTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  lockSubtitle: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  lockDesc: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },

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

  lockHint: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },

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
