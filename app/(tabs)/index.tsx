import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { usePosts, FoodPost, CreatorType } from '../../contexts/PostContext';
import { CREATOR_TIERS } from '../../contexts/CreatorContext';

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
  return (
    <View style={[styles.reelCard, { height: cardHeight }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} />

      {post.imageUri ? (
        <Image
          source={{ uri: post.imageUri }}
          style={styles.reelImage}
          contentFit="cover"
          transition={200}
          recyclingKey={post.id}
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

        {/* Chef action buttons */}
        {isHomeMasterChef ? (
          <View style={styles.chefActionsRow}>
            {post.showName ? (
              <Pressable
                style={({ pressed }) => [styles.chefActionBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
                onPress={onViewShow}
              >
                <MaterialIcons name="play-circle-outline" size={14} color="#FFF" />
                <Text style={styles.chefActionText}>View Show</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.chefActionBtn, styles.chefFollowBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
              onPress={onFollowChef}
            >
              <MaterialIcons name="person-add" size={14} color="#D4AF37" />
              <Text style={[styles.chefActionText, { color: '#D4AF37' }]}>Follow Chef</Text>
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
  const { posts, toggleLike, toggleSave, addComment, storyGroups } = usePosts();
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<TextInput>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const renderReel = useCallback(({ item }: { item: FoodPost }) => (
    <ReelCard
      post={item}
      cardHeight={cardHeight}
      onLike={() => handleLike(item.id)}
      onSave={() => handleSave(item.id)}
      onComment={() => handleComment(item.id)}
      onShare={() => handleShare(item)}
      onProfile={() => Haptics.selectionAsync()}
      onTap={() => { Haptics.selectionAsync(); router.push({ pathname: '/food-detail', params: { postId: item.id } }); }}
      onViewShow={item.showName ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/shows'); } : undefined}
      onFollowChef={item.creatorType === 'home_master_chef' ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } : undefined}
    />
  ), [cardHeight, handleLike, handleSave, handleComment, handleShare, router]);

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
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/camera'); }}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="camera-alt" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Reels Feed */}
      <FlatList
        data={posts}
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
});
