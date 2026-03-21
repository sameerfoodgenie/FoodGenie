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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { usePosts, FoodPost, StoryGroup } from '../../contexts/PostContext';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1;

// ─── Story Bar ───
function StoryBar({ groups, onStoryPress }: { groups: StoryGroup[]; onStoryPress: (userId: string) => void }) {
  return (
    <View style={storyStyles.container}>
      <FlatList
        horizontal
        data={groups}
        keyExtractor={item => item.userId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={storyStyles.scroll}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [storyStyles.storyItem, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
            onPress={() => onStoryPress(item.userId)}
          >
            {item.hasUnseen ? (
              <LinearGradient
                colors={['#4ADE80', '#22C55E', '#FBBF24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={storyStyles.gradientRing}
              >
                <View style={storyStyles.avatarInner}>
                  <Text style={storyStyles.avatarText}>{item.avatarInitials}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={storyStyles.seenRing}>
                <View style={storyStyles.avatarInner}>
                  <Text style={storyStyles.avatarText}>{item.avatarInitials}</Text>
                </View>
              </View>
            )}
            <Text style={[storyStyles.username, item.hasUnseen && storyStyles.usernameBold]} numberOfLines={1}>
              {item.username.split('.')[0]}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const storyStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
    gap: 6,
  },
  gradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  seenRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: theme.background,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  username: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textMuted,
    textAlign: 'center',
  },
  usernameBold: {
    fontWeight: '700',
    color: theme.textSecondary,
  },
});

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '☀️',
  lunch: '🍽',
  dinner: '🌙',
  snack: '🍿',
};

const SOURCE_LABEL: Record<string, string> = {
  home_cooked: '🏠 Homemade',
  restaurant: '🍽 Restaurant',
  online_order: '📦 Ordered',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function PostCard({ post, onLike, onSave, onComment, onShare }: {
  post: FoodPost;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.postCard}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserRow}>
          <View style={[styles.avatar, { backgroundColor: post.isLiked ? 'rgba(74,222,128,0.15)' : theme.backgroundTertiary }]}>
            <Text style={styles.avatarText}>{post.avatarInitials}</Text>
          </View>
          <View style={styles.postUserInfo}>
            <Text style={styles.postUsername}>{post.username}</Text>
            <View style={styles.postMetaRow}>
              {post.location ? (
                <View style={styles.locationTag}>
                  <MaterialIcons name="place" size={12} color={theme.textMuted} />
                  <Text style={styles.locationText}>{post.location}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <Text style={styles.postTime}>{timeAgo(post.timestamp)}</Text>
      </View>

      {/* Image */}
      {post.imageUri ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.imageUri }}
            style={styles.postImage}
            contentFit="cover"
            transition={200}
          />
          {/* Meal type badge */}
          <View style={styles.mealBadge}>
            <Text style={styles.mealBadgeText}>
              {MEAL_EMOJI[post.mealType] || '🍽'} {post.mealType.charAt(0).toUpperCase() + post.mealType.slice(1)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noImagePlaceholder}>
          <Text style={{ fontSize: 64 }}>🍽</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <Pressable
            onPress={onLike}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }]}
          >
            <MaterialIcons
              name={post.isLiked ? 'favorite' : 'favorite-border'}
              size={26}
              color={post.isLiked ? '#F87171' : theme.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={onComment}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="chat-bubble-outline" size={24} color={theme.textPrimary} />
          </Pressable>
          <Pressable
            onPress={onShare}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="send" size={24} color={theme.textPrimary} style={{ transform: [{ rotate: '-30deg' }] }} />
          </Pressable>
        </View>
        <Pressable
          onPress={onSave}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }]}
        >
          <MaterialIcons
            name={post.isSaved ? 'bookmark' : 'bookmark-border'}
            size={26}
            color={post.isSaved ? theme.accent : theme.textPrimary}
          />
        </Pressable>
      </View>

      {/* Likes */}
      {post.likes > 0 ? (
        <Text style={styles.likesText}>{formatLikes(post.likes)} likes</Text>
      ) : null}

      {/* Dish name + caption */}
      <View style={styles.captionBlock}>
        <Text style={styles.dishName}>{post.dishName}</Text>
        {post.restaurantName ? (
          <View style={styles.restTag}>
            <MaterialIcons name="storefront" size={12} color={theme.primary} />
            <Text style={styles.restTagText}>{post.restaurantName}</Text>
          </View>
        ) : null}
        {post.caption ? (
          <Text style={styles.captionText}>
            <Text style={styles.captionUser}>{post.username} </Text>
            {post.caption}
          </Text>
        ) : null}
      </View>

      {/* Source badge */}
      <View style={styles.sourceRow}>
        <Text style={styles.sourceText}>{SOURCE_LABEL[post.source] || post.source}</Text>
        {post.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {post.tags.slice(0, 2).map(t => (
              <Text key={t} style={styles.tagText}>#{t.replace(/\s/g, '')}</Text>
            ))}
          </View>
        ) : null}
      </View>

      {/* Comments preview */}
      {post.comments.length > 0 ? (
        <View style={styles.commentsPreview}>
          {post.comments.length > 2 ? (
            <Pressable onPress={onComment}>
              <Text style={styles.viewAllComments}>View all {post.comments.length} comments</Text>
            </Pressable>
          ) : null}
          {post.comments.slice(-2).map(c => (
            <Text key={c.id} style={styles.commentItem}>
              <Text style={styles.commentUser}>{c.username} </Text>
              {c.text}
            </Text>
          ))}
        </View>
      ) : null}
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

  const handleStoryPress = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/story-viewer', params: { userId } });
  }, [router]);

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

  const renderPost = useCallback(({ item, index }: { item: FoodPost; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(350)}>
      <PostCard
        post={item}
        onLike={() => handleLike(item.id)}
        onSave={() => handleSave(item.id)}
        onComment={() => handleComment(item.id)}
        onShare={() => handleShare(item)}
      />
    </Animated.View>
  ), [handleLike, handleSave, handleComment, handleShare]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* App header */}
        <View style={styles.appHeader}>
          <Text style={styles.appTitle}>FoodGenie</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/camera'); }}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="camera-alt" size={22} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Stories */}
        {storyGroups.length > 0 ? (
          <StoryBar groups={storyGroups} onStoryPress={handleStoryPress} />
        ) : null}

        {/* Feed */}
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 56 }}>📷</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Be the first to share what you ate today!</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/camera')}
              >
                <Text style={styles.emptyBtnText}>Create Post</Text>
              </Pressable>
            </View>
          }
        />

        {/* Comment input overlay */}
        {commentingPostId ? (
          <View style={[styles.commentBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 12 }]}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              placeholderTextColor={theme.textMuted}
              returnKeyType="send"
              onSubmitEditing={handleSubmitComment}
              autoFocus
            />
            <Pressable
              onPress={handleSubmitComment}
              style={({ pressed }) => [styles.commentSendBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="send" size={20} color={commentText.trim() ? theme.primary : theme.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => { setCommentingPostId(null); setCommentText(''); }}
              style={styles.commentCloseBtn}
            >
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },

  // App header
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Post card
  postCard: { paddingBottom: 4 },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  postUserInfo: { flex: 1 },
  postUsername: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  postMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  postTime: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },

  // Image
  imageContainer: { position: 'relative' },
  postImage: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
  noImagePlaceholder: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT * 0.7,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backdropFilter: 'blur(8)',
  },
  mealBadgeText: { fontSize: 12, color: '#FFF', fontWeight: '600' },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 18 },

  // Likes
  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  // Caption
  captionBlock: { paddingHorizontal: 16, gap: 4 },
  dishName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  restTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  restTagText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  captionText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  captionUser: { fontWeight: '700', color: theme.textPrimary },

  // Source
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  sourceText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  tagRow: { flexDirection: 'row', gap: 6 },
  tagText: { fontSize: 12, color: theme.primary, fontWeight: '600' },

  // Comments
  commentsPreview: { paddingHorizontal: 16, marginTop: 8, gap: 2 },
  viewAllComments: { fontSize: 13, color: theme.textMuted, marginBottom: 4 },
  commentItem: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  commentUser: { fontWeight: '700', color: theme.textPrimary },

  // Separator
  postSeparator: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 4,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  emptySub: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: theme.textOnPrimary },

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
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  commentSendBtn: { padding: 8 },
  commentCloseBtn: { padding: 8 },
});
