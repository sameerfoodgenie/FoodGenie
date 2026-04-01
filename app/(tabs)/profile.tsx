import React, { useCallback, useState, useEffect } from 'react';
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
import { fetchProfile, UserProfile } from '../../services/profileService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, streak, totalPosts, followingCount, followerCount, refreshFeed } = usePosts();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id).then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user?.id]);
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

  const name = profile?.full_name || user?.username || 'Food Lover';
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
                  <MaterialIcons name="add-box" size={24} color="#1A1A2E" />
                </Pressable>
                <Pressable style={styles.headerIconBtn} onPress={() => { Haptics.selectionAsync(); router.push('/admin' as any); }}>
                  <MaterialIcons name="admin-panel-settings" size={22} color="#D4AF37" />
                </Pressable>
                <Pressable style={styles.headerIconBtn} onPress={() => { Haptics.selectionAsync(); router.push('/investor-deck' as any); }}>
                  <MaterialIcons name="slideshow" size={20} color="#FFD700" />
                </Pressable>
                <Pressable style={styles.headerIconBtn} onPress={() => { Haptics.selectionAsync(); router.push('/app-info' as any); }}>
                  <MaterialIcons name="info-outline" size={20} color="#6B7280" />
                </Pressable>
                <Pressable style={styles.headerIconBtn} onPress={handleLogout}>
                  <MaterialIcons name="logout" size={20} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            {/* Profile info + social stats — glass card */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.profileCard}>
              <View style={styles.profileCardInner}>
                <View style={styles.avatarWrap}>
                  <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.avatar}>
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
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{followerCount}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{followingCount}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FFD700' }]}>{totalLikes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Bio + Level */}
            <View style={styles.bioSection}>
              <View style={styles.bioNameRow}>
                <Text style={styles.bioName}>{name}</Text>
                {myTier ? (
                  <View style={[styles.levelTag, { backgroundColor: `${myTier.color}14`, borderColor: `${myTier.color}30` }]}>
                    <Text style={styles.levelTagEmoji}>{myTier.emoji}</Text>
                    <Text style={[styles.levelTagText, { color: myTier.color }]}>{myTier.name}</Text>
                  </View>
                ) : (
                  <View style={[styles.levelTag, { backgroundColor: `${currentLevel.color}14`, borderColor: `${currentLevel.color}30` }]}>
                    <Text style={styles.levelTagEmoji}>{currentLevel.emoji}</Text>
                    <Text style={[styles.levelTagText, { color: currentLevel.color }]}>{currentLevel.name}</Text>
                  </View>
                )}
              </View>
              {email ? <Text style={styles.bioEmail}>{email}</Text> : null}
              <Text style={styles.bioText}>Food lover sharing my meals on FoodGenie</Text>
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
                    colors={['transparent', 'rgba(10,10,15,0.75)', 'rgba(10,10,15,0.95)']}
                    style={styles.latestPostOverlay}
                  >
                    <View style={styles.latestPostInfo}>
                      <Text style={styles.latestDishName}>{latestPost.dishName}</Text>
                      {latestPost.caption ? (
                        <Text style={styles.latestCaption} numberOfLines={1}>{latestPost.caption}</Text>
                      ) : null}
                      <View style={styles.latestMeta}>
                        <View style={styles.latestMetaItem}>
                          <MaterialIcons name="favorite" size={14} color="#FFD700" />
                          <Text style={styles.latestMetaText}>{latestPost.likes}</Text>
                        </View>
                        <View style={styles.latestMetaItem}>
                          <MaterialIcons name="chat-bubble" size={13} color="#6B7280" />
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
                        style={[styles.profileBadge, { backgroundColor: `${badge.color}10`, borderColor: `${badge.color}25` }]}
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
                <MaterialIcons name="live-tv" size={16} color="#D4AF37" />
                <Text style={[styles.editProfileText, { color: '#D4AF37' }]}>Shows</Text>
              </Pressable>
            </Animated.View>

            {/* ─── Creator Section ─── */}
            <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.creatorSection}>
              {isCreatorUnlocked ? (
                <Pressable
                  style={({ pressed }) => [styles.creatorCardUnlocked, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                  onPress={handleShowsTap}
                >
                  <View style={styles.creatorCardInner}>
                    <View style={styles.creatorHeader}>
                      <View style={styles.creatorTitleRow}>
                        <MaterialIcons name="auto-awesome" size={20} color="#FFD700" />
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
                      <MaterialIcons name="arrow-forward" size={16} color="#D4AF37" />
                    </View>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.creatorCardLocked}>
                  <View style={styles.lockHeader}>
                    <View style={styles.lockIconWrap}>
                      <MaterialIcons name="rocket-launch" size={24} color="#FFD700" />
                    </View>
                    <View style={styles.lockTitleBlock}>
                      <Text style={styles.lockTitle}>Creator Mode</Text>
                      <Text style={styles.lockSubtitle}>
                        {postsNeeded > 0
                          ? `You are ${postsNeeded} post${postsNeeded !== 1 ? 's' : ''} away from Creator Mode`
                          : `${streakNeeded} day${streakNeeded !== 1 ? 's' : ''} streak to unlock`
                        }
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rewardPreview}>
                    <MaterialIcons name="emoji-events" size={16} color="#FFD700" />
                    <Text style={styles.rewardPreviewText}>Unlock: Create Shows and gain followers</Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>Posts</Text>
                        <Text style={styles.progressCount}>{postCount}/5</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, { width: `${postProgress * 100}%`, backgroundColor: '#D4AF37' }]} />
                      </View>
                    </View>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>Streak</Text>
                        <Text style={styles.progressCount}>{streakCount}/7 days</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, { width: `${streakProgress * 100}%`, backgroundColor: '#FFD700' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Grid header */}
            <View style={styles.gridHeader}>
              <View style={styles.gridTab}>
                <MaterialIcons name="grid-on" size={22} color="#D4AF37" />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <View style={styles.emptyGridIcon}>
              <MaterialIcons name="camera-alt" size={40} color="#6B7280" />
            </View>
            <Text style={styles.emptyGridTitle}>No Posts Yet</Text>
            <Text style={styles.emptyGridSub}>Share your first meal!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', gap: 14 },
  headerIconBtn: { padding: 6 },

  // Profile card — glass
  profileCard: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 18,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
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
    borderColor: '#FFFFFF',
  },
  levelBadgeEmoji: { fontSize: 12 },

  socialStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 10, fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.08)' },

  bioSection: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 4 },
  bioNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bioName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
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
  bioEmail: { fontSize: 13, color: '#6B7280' },
  bioText: { fontSize: 14, color: '#9CA3AF', marginTop: 4, lineHeight: 20 },

  // Latest post hero
  latestPostSection: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  latestLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  latestPostCard: {
    height: 210,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  latestPostImage: { width: '100%', height: '100%' },
  latestPostNoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#18181E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 50,
  },
  latestPostInfo: { gap: 4 },
  latestDishName: { fontSize: 20, fontWeight: '800', color: '#FFF' },  // keep white on overlay
  latestCaption: { fontSize: 13, color: 'rgba(255,255,255,0.60)', fontWeight: '500' },
  latestMeta: { flexDirection: 'row', gap: 16, marginTop: 6 },
  latestMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  latestMetaText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

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
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgesText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 12,
  },
  showsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  editProfileBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  editProfileText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },

  /* Creator Section */
  creatorSection: { paddingHorizontal: 20, paddingBottom: 16 },
  creatorCardUnlocked: { borderRadius: 20, overflow: 'hidden' },
  creatorCardInner: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    backgroundColor: 'rgba(212,175,55,0.04)',
    gap: 14,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  creatorBadgeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  creatorBadgeText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },
  creatorStats: { flexDirection: 'row', gap: 24 },
  creatorStatItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  creatorStatVal: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  creatorStatLbl: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  creatorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  creatorCtaText: { fontSize: 14, fontWeight: '600', color: '#D4AF37' },

  /* Locked */
  creatorCardLocked: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 14,
  },
  lockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  lockTitleBlock: { flex: 1, gap: 3 },
  lockTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  lockSubtitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', lineHeight: 18 },

  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  rewardPreviewText: { fontSize: 13, fontWeight: '600', color: '#D4AF37' },

  progressSection: { gap: 10 },
  progressItem: { gap: 6 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  progressCount: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },

  /* Grid */
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  gridTab: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37',
  },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  gridNoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGrid: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyGridIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyGridTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  emptyGridSub: { fontSize: 14, color: '#6B7280' },
});
