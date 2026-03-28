import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  Share,
  ViewToken,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
import { useOnboardingStatus } from '../../components/OnboardingWalkthrough';
import { usePosts, FoodPost, CreatorType } from '../../contexts/PostContext';
import { useCreator } from '../../contexts/CreatorContext';
import { CREATOR_TIERS } from '../../contexts/CreatorContext';
import { useAuth } from '@/template';
import { useNotifications } from '../../hooks/useNotifications';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '☀️',
  lunch: '🍽',
  dinner: '🌙',
  snack: '🍿',
};

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const SOURCE_ICON: Record<string, string> = {
  home_cooked: '🏠',
  restaurant: '🍴',
  online_order: '📦',
};

const SOURCE_LABEL: Record<string, string> = {
  home_cooked: 'Home',
  restaurant: 'Restaurant',
  online_order: 'Online',
};

// Default blurhash for food images — warm amber tone
const DEFAULT_BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0LMt7xu';

// ─── Progressive Image ───
function ProgressiveImage({ fullUri, thumbnailUri, style }: { fullUri: string; thumbnailUri: string | null; style: any }) {
  const [fullLoaded, setFullLoaded] = useState(false);

  return (
    <View style={style}>
      {/* Thumbnail layer — shown instantly, hidden once full image loads */}
      {thumbnailUri && !fullLoaded ? (
        <Image
          source={{ uri: thumbnailUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
          placeholderContentFit="cover"
        />
      ) : !fullLoaded ? (
        <Image
          source={{ uri: fullUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
          placeholderContentFit="cover"
          transition={0}
        />
      ) : null}

      {/* Full-resolution layer — fades in on load */}
      <Image
        source={{ uri: fullUri }}
        style={[StyleSheet.absoluteFillObject, !fullLoaded && { opacity: 0 }]}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
        onLoad={() => setFullLoaded(true)}
      />
    </View>
  );
}

// ─── Shimmer Loading Card ───
function ShimmerCard({ cardHeight }: { cardHeight: number }) {
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(shimmerOpacity);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  return (
    <View style={[styles.reelCard, { height: cardHeight, backgroundColor: '#0A0A0A' }]}>
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        {/* Fake image area */}
        <View style={styles.shimmerImage} />
        {/* Fake bottom info */}
        <View style={styles.shimmerBottom}>
          <View style={styles.shimmerLine} />
          <View style={[styles.shimmerLine, { width: '60%', marginTop: 8 }]} />
          <View style={[styles.shimmerLine, { width: '40%', marginTop: 8 }]} />
          <View style={styles.shimmerTagsRow}>
            <View style={styles.shimmerTag} />
            <View style={styles.shimmerTag} />
          </View>
        </View>
        {/* Fake action bar */}
        <View style={styles.shimmerActionBar}>
          <View style={styles.shimmerCircle} />
          <View style={styles.shimmerCircle} />
          <View style={styles.shimmerCircle} />
          <View style={styles.shimmerCircle} />
        </View>
      </Animated.View>
    </View>
  );
}

function getCreatorBadge(type?: CreatorType | null) {
  if (!type) return null;
  return CREATOR_TIERS.find(t => t.id === type) || null;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Action Button ───
function ActionButton({
  icon,
  activeIcon,
  isActive,
  activeColor,
  count,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  activeIcon?: keyof typeof MaterialIcons.glyphMap;
  isActive?: boolean;
  activeColor?: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.85 }] }]}
    >
      <MaterialIcons
        name={isActive && activeIcon ? activeIcon : icon}
        size={28}
        color={isActive ? (activeColor || '#D4AF37') : '#FFF'}
      />
      {count !== undefined ? (
        <Text style={styles.actionCount}>{formatCount(count)}</Text>
      ) : null}
    </Pressable>
  );
}

// ─── Reel Card ───
function ReelCard({
  post,
  cardHeight,
  isFollowed,
  onLike,
  onSave,
  onComment,
  onShare,
  onProfile,
  onTap,
  onViewShow,
  onFollowChef,
}: {
  post: FoodPost;
  cardHeight: number;
  isFollowed: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfile: () => void;
  onTap: () => void;
  onViewShow?: () => void;
  onFollowChef?: () => void;
}) {
  const isHomeMasterChef = post.creatorType === 'home_master_chef';
  const hasCreatorType = !!post.creatorType;
  return (
    <View style={[styles.reelCard, { height: cardHeight }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} />

      {post.imageUri ? (
        <ProgressiveImage
          fullUri={post.imageUri}
          thumbnailUri={post.thumbnailUri}
          style={styles.reelImage}
        />
      ) : (
        <View style={styles.reelNoImage}>
          <Text style={{ fontSize: 80, opacity: 0.3 }}>🍽</Text>
        </View>
      )}

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.35, 0.65, 1]}
        style={styles.bottomGradient}
      />

      {/* Top gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.15)', 'transparent']}
        style={styles.topGradient}
      />

      {/* ─── Right Action Bar ─── */}
      <View style={styles.actionBar} pointerEvents="box-none">
        <Pressable
          onPress={onProfile}
          style={({ pressed }) => [styles.actionAvatarWrap, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.actionAvatar}>
            <Text style={styles.actionAvatarText}>{post.avatarInitials}</Text>
          </View>
        </Pressable>

        <ActionButton
          icon="favorite-border"
          activeIcon="favorite"
          isActive={post.isLiked}
          activeColor="#D4AF37"
          count={post.likes}
          onPress={onLike}
        />
        <ActionButton
          icon="chat-bubble-outline"
          count={post.comments.length}
          onPress={onComment}
        />
        <ActionButton
          icon="send"
          onPress={onShare}
        />
        <ActionButton
          icon="bookmark-border"
          activeIcon="bookmark"
          isActive={post.isSaved}
          activeColor="#FFD700"
          onPress={onSave}
        />
      </View>

      {/* ─── Bottom Info ─── */}
      <View style={styles.bottomInfo} pointerEvents="box-none">
        {/* Username + Creator badge */}
        <Pressable onPress={onProfile} hitSlop={8} style={styles.usernameRow}>
          <Text style={styles.reelUsername}>@{post.username}</Text>
          {post.isVerified ? (
            <MaterialIcons name="verified" size={16} color="#D4AF37" />
          ) : null}
          {(() => {
            const badge = getCreatorBadge(post.creatorType);
            return badge ? (
              <View style={[styles.creatorBadge, { backgroundColor: `${badge.color}20`, borderColor: `${badge.color}40` }]}>
                <Text style={styles.creatorBadgeEmoji}>{badge.emoji}</Text>
                <Text style={[styles.creatorBadgeText, { color: badge.color }]}>{badge.name}</Text>
              </View>
            ) : null;
          })()}
        </Pressable>

        {/* Dish name */}
        <Text style={styles.reelDishName}>{post.dishName}</Text>

        {/* Caption */}
        {post.caption ? (
          <Text style={styles.reelCaption} numberOfLines={2}>{post.caption}</Text>
        ) : null}

        {/* Show reference */}
        {isHomeMasterChef && post.showName ? (
          <View style={styles.showRefRow}>
            <MaterialIcons name="movie-creation" size={13} color="rgba(212,175,55,0.8)" />
            <Text style={styles.showRefText}>From Show: {post.showName}</Text>
          </View>
        ) : null}

        {/* Tags row — gold pill style */}
        <View style={styles.tagsRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeEmoji}>{SOURCE_ICON[post.source]}</Text>
            <Text style={styles.tagBadgeText}>{SOURCE_LABEL[post.source]}</Text>
          </View>

          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeEmoji}>{MEAL_EMOJI[post.mealType]}</Text>
            <Text style={styles.tagBadgeText}>{MEAL_LABEL[post.mealType]}</Text>
          </View>

          {post.location ? (
            <View style={styles.tagBadge}>
              <MaterialIcons name="place" size={12} color="#D4AF37" />
              <Text style={styles.tagBadgeText}>{post.location}</Text>
            </View>
          ) : null}

          {post.restaurantName ? (
            <View style={[styles.tagBadge, styles.tagBadgeAccent]}>
              <MaterialIcons name="storefront" size={12} color="#FFD700" />
              <Text style={[styles.tagBadgeText, { color: '#FFD700' }]}>{post.restaurantName}</Text>
            </View>
          ) : null}
        </View>

        {/* Action buttons — follow for all creators, show for home master chef */}
        {hasCreatorType ? (
          <View style={styles.chefActionsRow}>
            {isHomeMasterChef && post.showName ? (
              <Pressable
                style={({ pressed }) => [styles.chefActionBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
                onPress={onViewShow}
              >
                <MaterialIcons name="play-circle-outline" size={14} color="#FFF" />
                <Text style={styles.chefActionText}>View Show</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.chefActionBtn,
                isFollowed ? styles.chefFollowingBtn : styles.chefFollowBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
              onPress={onFollowChef}
            >
              <MaterialIcons
                name={isFollowed ? 'check' : 'person-add'}
                size={14}
                color={isFollowed ? '#0A0A0A' : '#D4AF37'}
              />
              <Text style={[styles.chefActionText, isFollowed ? { color: '#0A0A0A' } : { color: '#D4AF37' }]}>
                {isFollowed ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { feedPosts, toggleLike, toggleSave, addComment, storyGroups, toggleFollow, isFollowing, loading: feedLoading, refreshFeed } = usePosts();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Track initial load completion
  useEffect(() => {
    if (!feedLoading && initialLoad) {
      setInitialLoad(false);
    }
  }, [feedLoading, initialLoad]);
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id || null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<TextInput>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { hasCompleted: onboardingDone } = useOnboardingStatus();
  const [taskDismissed, setTaskDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('foodgenie_first_task_dismissed').then(val => {
      setTaskDismissed(val === 'true');
    });
  }, []);

  const showFirstTask = onboardingDone === true && !taskDismissed && feedPosts.length < 1;

  const dismissTask = useCallback(() => {
    setTaskDismissed(true);
    AsyncStorage.setItem('foodgenie_first_task_dismissed', 'true');
  }, []);

  const tabBarHeight = Platform.select({
    ios: insets.bottom + 60,
    android: insets.bottom + 60,
    default: 68,
  });
  const cardHeight = SCREEN_H - tabBarHeight;

  const handleLike = useCallback((postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(postId);
  }, [toggleLike]);

  const handleSave = useCallback((postId: string) => {
    Haptics.selectionAsync();
    toggleSave(postId);
  }, [toggleSave]);

  const handleComment = useCallback((postId: string) => {
    Haptics.selectionAsync();
    setCommentingPostId(postId);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  }, []);

  const handleShare = useCallback(async (post: FoodPost) => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out ${post.dishName} by @${post.username} on FoodGenie! 🍽`,
      });
    } catch { /* ignore */ }
  }, []);

  const handleSubmitComment = useCallback(() => {
    if (!commentingPostId || !commentText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment(commentingPostId, commentText.trim());
    setCommentText('');
    setCommentingPostId(null);
  }, [commentingPostId, commentText, addComment]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleFollowChef = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFollow(userId);
  }, [toggleFollow]);

  const renderReel = useCallback(({ item }: { item: FoodPost }) => (
    <ReelCard
      post={item}
      cardHeight={cardHeight}
      isFollowed={isFollowing(item.userId)}
      onLike={() => handleLike(item.id)}
      onSave={() => handleSave(item.id)}
      onComment={() => handleComment(item.id)}
      onShare={() => handleShare(item)}
      onProfile={() => Haptics.selectionAsync()}
      onTap={() => { Haptics.selectionAsync(); router.push({ pathname: '/food-detail', params: { postId: item.id } }); }}
      onViewShow={item.showName ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/shows'); } : undefined}
      onFollowChef={item.creatorType ? () => handleFollowChef(item.userId) : undefined}
    />
  ), [cardHeight, handleLike, handleSave, handleComment, handleShare, router, isFollowing, handleFollowChef]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: cardHeight,
    offset: cardHeight * index,
    index,
  }), [cardHeight]);

  return (
    <View style={styles.container}>
      {/* Header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.appTitle}>FoodGenie</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push('/notifications'); }}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="notifications-none" size={22} color="#FFF" />
            {unreadCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/camera'); }}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="camera-alt" size={22} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Reels Feed */}
      {feedLoading && initialLoad ? (
        /* Show shimmer skeleton while loading initial feed */
        <View style={{ flex: 1 }}>
          <ShimmerCard cardHeight={cardHeight} />
        </View>
      ) : (
        <FlatList
          data={feedPosts}
          keyExtractor={item => item.id}
          renderItem={renderReel}
          pagingEnabled
          snapToInterval={cardHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refreshFeed();
                setRefreshing(false);
              }}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
              progressBackgroundColor="#1A1A1A"
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { height: cardHeight }]}>
              <Text style={{ fontSize: 56 }}>📷</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Be the first to share what you ate!</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/camera')}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.emptyBtnGrad}>
                  <Text style={styles.emptyBtnText}>Create Post</Text>
                </LinearGradient>
              </Pressable>
            </View>
          }
        />
      )}

      {/* First Task Banner */}
      {showFirstTask ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(200)}
          style={[styles.taskBanner, { top: insets.top + 56 }]}
        >
          <LinearGradient
            colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)']}
            style={styles.taskBannerInner}
          >
            <View style={styles.taskBannerIcon}>
              <MaterialIcons name="restaurant" size={18} color="#D4AF37" />
            </View>
            <View style={styles.taskBannerContent}>
              <Text style={styles.taskBannerTitle}>Post your first meal</Text>
              <Text style={styles.taskBannerDesc}>Tap + to share what you ate today</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.taskBannerClose, pressed && { opacity: 0.6 }]}
              onPress={dismissTask}
              hitSlop={10}
            >
              <MaterialIcons name="close" size={16} color="#6B6B6B" />
            </Pressable>
          </LinearGradient>
        </Animated.View>
      ) : null}

      {/* Comment input overlay */}
      {commentingPostId ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.commentBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 12 }]}
        >
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
            autoFocus
          />
          <Pressable
            onPress={handleSubmitComment}
            style={({ pressed }) => [styles.commentSendBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="send" size={20} color={commentText.trim() ? '#D4AF37' : 'rgba(255,255,255,0.25)'} />
          </Pressable>
          <Pressable
            onPress={() => { setCommentingPostId(null); setCommentText(''); }}
            style={styles.commentCloseBtn}
          >
            <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // Header
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 50,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0A0A0A',
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },

  // Reel card
  reelCard: {
    width: SCREEN_W,
    position: 'relative',
    backgroundColor: '#0A0A0A',
  },
  reelImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: '100%',
  },
  reelNoImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gradients
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  // Right action bar
  actionBar: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
    zIndex: 20,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionAvatarWrap: {
    marginBottom: 6,
  },
  actionAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  actionAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },

  // Bottom info
  bottomInfo: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 72,
    zIndex: 20,
    gap: 6,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  reelUsername: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  creatorBadgeEmoji: { fontSize: 10 },
  creatorBadgeText: { fontSize: 10, fontWeight: '700' },
  reelDishName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  reelCaption: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Gold pill tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  tagBadgeAccent: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.25)',
  },
  tagBadgeEmoji: {
    fontSize: 11,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
  },

  // Show reference
  showRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  showRefText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212,175,55,0.7)',
    fontStyle: 'italic',
  },

  // Chef action buttons
  chefActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chefActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chefFollowBtn: {
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderColor: 'rgba(212,175,55,0.25)',
  },
  chefFollowingBtn: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  chefActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  emptySub: { fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  emptyBtnGrad: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },

  // Shimmer loading
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#151515',
  },
  shimmerBottom: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 72,
    gap: 4,
  },
  shimmerLine: {
    height: 14,
    width: '80%',
    borderRadius: 7,
    backgroundColor: '#1F1F1F',
  },
  shimmerTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  shimmerTag: {
    width: 72,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
  },
  shimmerActionBar: {
    position: 'absolute',
    right: 14,
    bottom: 120,
    alignItems: 'center',
    gap: 22,
  },
  shimmerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
  },

  // Comment bar
  commentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.10)',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  commentSendBtn: { padding: 8 },
  commentCloseBtn: { padding: 8 },

  // Task banner
  taskBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
  },
  taskBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  taskBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBannerContent: { flex: 1, gap: 2 },
  taskBannerTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  taskBannerDesc: { fontSize: 12, fontWeight: '500', color: '#A0A0A0' },
  taskBannerClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
