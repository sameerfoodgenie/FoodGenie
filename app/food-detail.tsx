import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { usePosts, FoodPost } from '../contexts/PostContext';

const { width: SCREEN_W } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_W * 1.1;

// ─── Heuristic food breakdown ───

type FoodLevel = 'Low' | 'Medium' | 'High';

interface FoodBreakdown {
  energy: FoodLevel;
  protein: FoodLevel;
  oil: FoodLevel;
}

const HIGH_ENERGY = ['biryani', 'pizza', 'burger', 'pancake', 'naan', 'paratha', 'fried', 'fries', 'pasta', 'cake', 'brownie', 'milkshake', 'thali', 'chole', 'rajma'];
const HIGH_PROTEIN = ['chicken', 'mutton', 'lamb', 'fish', 'egg', 'paneer', 'dal', 'lentil', 'tofu', 'soy', 'kebab', 'tikka', 'tandoori', 'steak', 'prawn', 'shrimp'];
const HIGH_OIL = ['fried', 'butter', 'cream', 'deep', 'pakora', 'samosa', 'puri', 'bhaji', 'manchurian', 'crispy', 'loaded', 'cheesy'];
const LOW_ENERGY = ['salad', 'soup', 'juice', 'smoothie', 'fruit', 'sprout', 'cucumber', 'yogurt', 'raita'];
const LOW_OIL = ['salad', 'grilled', 'steamed', 'boiled', 'baked', 'soup', 'fruit', 'yogurt', 'oats', 'quinoa'];

function estimateBreakdown(dishName: string, tags: string[]): FoodBreakdown {
  const text = `${dishName} ${tags.join(' ')}`.toLowerCase();

  let energy: FoodLevel = 'Medium';
  let protein: FoodLevel = 'Medium';
  let oil: FoodLevel = 'Medium';

  if (HIGH_ENERGY.some(k => text.includes(k))) energy = 'High';
  else if (LOW_ENERGY.some(k => text.includes(k))) energy = 'Low';

  if (HIGH_PROTEIN.some(k => text.includes(k))) protein = 'High';
  else if (LOW_ENERGY.some(k => text.includes(k))) protein = 'Low';

  if (HIGH_OIL.some(k => text.includes(k))) oil = 'High';
  else if (LOW_OIL.some(k => text.includes(k))) oil = 'Low';

  return { energy, protein, oil };
}

function getInsight(bd: FoodBreakdown, dishName: string): string {
  if (bd.energy === 'High' && bd.oil === 'High') return 'Rich and indulgent — enjoy in moderation';
  if (bd.energy === 'High' && bd.protein === 'High') return 'Good energy meal but slightly heavy';
  if (bd.energy === 'Low' && bd.protein === 'High') return 'Great balanced choice — high protein, light feel';
  if (bd.energy === 'Low' && bd.oil === 'Low') return 'Light and clean — perfect for staying on track';
  if (bd.protein === 'High') return 'Solid protein source — good for recovery';
  if (bd.oil === 'High') return 'A bit oily — pair with something light next';
  if (bd.energy === 'High') return 'Energy-dense meal — great before activity';
  return 'A balanced everyday meal — keep it up';
}

const LEVEL_COLORS: Record<FoodLevel, string> = {
  Low: '#4ADE80',
  Medium: '#FBBF24',
  High: '#F87171',
};

const SOURCE_LABEL: Record<string, { label: string; emoji: string }> = {
  home_cooked: { label: 'Home Cooked', emoji: '🏠' },
  restaurant: { label: 'Restaurant', emoji: '🍴' },
  online_order: { label: 'Online Order', emoji: '📦' },
};

const MEAL_LABEL: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '☀️' },
  lunch: { label: 'Lunch', emoji: '🍽' },
  dinner: { label: 'Dinner', emoji: '🌙' },
  snack: { label: 'Snack', emoji: '🍿' },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Breakdown Pill ───

function BreakdownPill({ label, level, icon }: { label: string; level: FoodLevel; icon: string }) {
  const color = LEVEL_COLORS[level];
  return (
    <View style={[styles.breakdownPill, { borderColor: `${color}30`, backgroundColor: `${color}08` }]}>
      <Text style={styles.breakdownIcon}>{icon}</Text>
      <View style={styles.breakdownPillInfo}>
        <Text style={styles.breakdownLabel}>{label}</Text>
        <Text style={[styles.breakdownLevel, { color }]}>{level}</Text>
      </View>
    </View>
  );
}

export default function FoodDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ postId?: string }>();
  const { posts, toggleLike, toggleSave, addComment } = usePosts();

  const post = posts.find(p => p.id === params.postId);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const commentRef = useRef<TextInput>(null);

  if (!post) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>Post not found</Text>
          <Pressable style={styles.backFloating} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const breakdown = estimateBreakdown(post.dishName, post.tags);
  const insight = getInsight(breakdown, post.dishName);
  const sourceInfo = SOURCE_LABEL[post.source] || SOURCE_LABEL.home_cooked;
  const mealInfo = MEAL_LABEL[post.mealType] || MEAL_LABEL.lunch;

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(post.id);
  };

  const handleSave = () => {
    Haptics.selectionAsync();
    toggleSave(post.id);
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out ${post.dishName} by @${post.username} on FoodGenie! 🍽`,
      });
    } catch { /* ignore */ }
  };

  const handleComment = () => {
    Haptics.selectionAsync();
    setShowComments(true);
    setTimeout(() => commentRef.current?.focus(), 150);
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Hero Image ─── */}
          <View style={styles.imageSection}>
            {post.imageUri ? (
              <Image
                source={{ uri: post.imageUri }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.heroNoImage}>
                <Text style={{ fontSize: 72, opacity: 0.3 }}>🍽</Text>
              </View>
            )}
            <LinearGradient
              colors={['rgba(10,10,15,0.6)', 'transparent', 'transparent', 'rgba(10,10,15,0.8)']}
              locations={[0, 0.2, 0.7, 1]}
              style={styles.imageOverlay}
            />
            {/* Back button */}
            <Pressable
              style={[styles.backFloating, { top: insets.top + 8 }]}
              onPress={() => { Haptics.selectionAsync(); router.back(); }}
            >
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
          </View>

          {/* ─── User Info ─── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.userSection}>
            <View style={styles.userLeft}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{post.avatarInitials}</Text>
              </View>
              <View>
                <Text style={styles.userName}>@{post.username}</Text>
                <Text style={styles.userTime}>{timeAgo(post.timestamp)}</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.followBtn,
                isFollowing && styles.followBtnActive,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleFollow}
            >
              <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* ─── Dish Info ─── */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.dishSection}>
            <Text style={styles.dishName}>{post.dishName}</Text>
            {post.caption ? (
              <Text style={styles.caption}>{post.caption}</Text>
            ) : null}

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagEmoji}>{sourceInfo.emoji}</Text>
                <Text style={styles.tagText}>{sourceInfo.label}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagEmoji}>{mealInfo.emoji}</Text>
                <Text style={styles.tagText}>{mealInfo.label}</Text>
              </View>
              {post.restaurantName ? (
                <View style={[styles.tag, styles.tagAccent]}>
                  <MaterialIcons name="storefront" size={13} color={theme.primary} />
                  <Text style={[styles.tagText, { color: theme.primary }]}>{post.restaurantName}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ─── Location ─── */}
          {post.location ? (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.locationRow}>
              <MaterialIcons name="place" size={18} color={theme.textMuted} />
              <Text style={styles.locationText}>{post.location}</Text>
            </Animated.View>
          ) : null}

          {/* ─── Food Breakdown ─── */}
          <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Food Breakdown</Text>
            <View style={styles.breakdownRow}>
              <BreakdownPill label="Energy" level={breakdown.energy} icon="⚡" />
              <BreakdownPill label="Protein" level={breakdown.protein} icon="💪" />
              <BreakdownPill label="Oil" level={breakdown.oil} icon="🫒" />
            </View>
            <Text style={styles.breakdownNote}>Based on typical preparation</Text>
          </Animated.View>

          {/* ─── Insight ─── */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.insightSection}>
            <LinearGradient
              colors={['rgba(74,222,128,0.06)', 'rgba(74,222,128,0.02)']}
              style={styles.insightCard}
            >
              <MaterialIcons name="lightbulb-outline" size={20} color={theme.primary} />
              <Text style={styles.insightText}>{insight}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ─── Actions ─── */}
          <Animated.View entering={FadeInUp.delay(250).duration(350)} style={styles.actionsSection}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.92 }] }]}
              onPress={handleLike}
            >
              <MaterialIcons
                name={post.isLiked ? 'favorite' : 'favorite-border'}
                size={24}
                color={post.isLiked ? '#F87171' : theme.textSecondary}
              />
              <Text style={[styles.actionLabel, post.isLiked && { color: '#F87171' }]}>
                {formatCount(post.likes)}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.92 }] }]}
              onPress={handleComment}
            >
              <MaterialIcons name="chat-bubble-outline" size={22} color={theme.textSecondary} />
              <Text style={styles.actionLabel}>{post.comments.length}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.92 }] }]}
              onPress={handleShare}
            >
              <MaterialIcons name="send" size={22} color={theme.textSecondary} />
              <Text style={styles.actionLabel}>Share</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.92 }] }]}
              onPress={handleSave}
            >
              <MaterialIcons
                name={post.isSaved ? 'bookmark' : 'bookmark-border'}
                size={24}
                color={post.isSaved ? theme.accent : theme.textSecondary}
              />
              <Text style={[styles.actionLabel, post.isSaved && { color: theme.accent }]}>Save</Text>
            </Pressable>
          </Animated.View>

          {/* ─── Comments ─── */}
          {(showComments || post.comments.length > 0) ? (
            <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>
                Comments {post.comments.length > 0 ? `(${post.comments.length})` : ''}
              </Text>
              {post.comments.map(c => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {c.username.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>@{c.username}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}

              {/* Comment input */}
              <View style={styles.commentInputRow}>
                <TextInput
                  ref={commentRef}
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="send"
                  onSubmitEditing={submitComment}
                />
                <Pressable
                  onPress={submitComment}
                  style={({ pressed }) => [styles.commentSendBtn, pressed && { opacity: 0.7 }]}
                >
                  <MaterialIcons
                    name="send"
                    size={20}
                    color={commentText.trim() ? theme.primary : theme.textMuted}
                  />
                </Pressable>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // Image
  imageSection: {
    width: SCREEN_W,
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: theme.backgroundTertiary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroNoImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondary,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backFloating: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // User
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  userTime: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: theme.primary,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  followText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  followTextActive: {
    color: theme.textSecondary,
  },

  // Dish
  dishSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  dishName: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  caption: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textSecondary,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tagAccent: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.2)',
  },
  tagEmoji: {
    fontSize: 13,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
  },

  // Breakdown
  breakdownSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  breakdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  breakdownIcon: {
    fontSize: 20,
  },
  breakdownPillInfo: {
    gap: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownLevel: {
    fontSize: 15,
    fontWeight: '800',
  },
  breakdownNote: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
    fontStyle: 'italic',
  },

  // Insight
  insightSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    lineHeight: 20,
  },

  // Actions
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginHorizontal: 20,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },

  // Comments
  commentsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
  },
  commentContent: {
    flex: 1,
    gap: 2,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  commentText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    lineHeight: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  commentSendBtn: {
    padding: 8,
  },
});
