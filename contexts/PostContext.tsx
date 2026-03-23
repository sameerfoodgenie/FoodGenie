import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useAuth } from '@/template';
import * as PostService from '../services/postService';

export interface Story {
  id: string;
  imageUri: string;
  caption?: string;
  timestamp: number;
  duration: number;
}

export interface StoryGroup {
  userId: string;
  username: string;
  avatarInitials: string;
  stories: Story[];
  hasUnseen: boolean;
}

export interface PostComment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export type CreatorType = 'home_master_chef' | 'verified_chef' | 'food_blogger' | null;

export interface FoodPost {
  id: string;
  userId: string;
  username: string;
  avatarInitials: string;
  imageUri: string | null;
  dishName: string;
  caption: string;
  location: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: 'home_cooked' | 'restaurant' | 'online_order';
  restaurantName?: string;
  platform?: string;
  tags: string[];
  taggedFriends: string[];
  likes: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: PostComment[];
  timestamp: number;
  creatorType?: CreatorType;
  isVerified?: boolean;
  showName?: string;
  showId?: string;
  commentsCount: number;
}

interface PostContextType {
  posts: FoodPost[];
  feedPosts: FoodPost[];
  myPosts: FoodPost[];
  addPost: (post: {
    imageUri?: string | null;
    dishName: string;
    caption?: string;
    location?: string;
    mealType?: string;
    source?: string;
    restaurantName?: string;
    platform?: string;
    tags?: string[];
    taggedFriends?: string[];
    creatorType?: CreatorType;
    isVerified?: boolean;
    showName?: string;
    showId?: string;
  }) => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  streak: number;
  totalPosts: number;
  storyGroups: StoryGroup[];
  markStorySeen: (userId: string) => void;
  followedUserIds: Set<string>;
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  followingCount: number;
  followerCount: number;
  loading: boolean;
  refreshFeed: () => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

function dbPostToFoodPost(dbPost: PostService.DBPost): FoodPost {
  const username = dbPost.user_profiles?.username || 'user';
  const initials = username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return {
    id: dbPost.id,
    userId: dbPost.user_id,
    username,
    avatarInitials: initials,
    imageUri: dbPost.image_url,
    dishName: dbPost.dish_name,
    caption: dbPost.caption || '',
    location: dbPost.location || '',
    mealType: (dbPost.meal_type as any) || 'lunch',
    source: (dbPost.source as any) || 'home_cooked',
    restaurantName: dbPost.restaurant_name || undefined,
    platform: dbPost.platform || undefined,
    tags: dbPost.tags || [],
    taggedFriends: dbPost.tagged_friends || [],
    likes: dbPost.likes_count || 0,
    isLiked: dbPost.is_liked || false,
    isSaved: dbPost.is_saved || false,
    comments: [],
    timestamp: new Date(dbPost.created_at).getTime(),
    creatorType: (dbPost.creator_type as CreatorType) || null,
    isVerified: dbPost.is_verified || false,
    showName: dbPost.show_name || undefined,
    showId: dbPost.show_id || undefined,
    commentsCount: dbPost.comments_count || 0,
  };
}

export function PostProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const userId = user?.id || null;

  // Load feed from database
  const refreshFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await PostService.fetchFeedPosts(userId || undefined);
      setPosts(data.map(dbPostToFoodPost));
    } catch (e) {
      console.error('Failed to refresh feed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load following list
  const loadFollowing = useCallback(async () => {
    if (!userId) return;
    const { data } = await PostService.fetchFollowing(userId);
    setFollowedUserIds(new Set(data));
    const count = await PostService.fetchFollowerCount(userId);
    setFollowerCount(count);
  }, [userId]);

  // Initial load when user changes
  useEffect(() => {
    if (userId) {
      refreshFeed();
      loadFollowing();
    } else {
      setPosts([]);
      setFollowedUserIds(new Set());
      setFollowerCount(0);
    }
  }, [userId]);

  // Poll feed every 15s
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      refreshFeed();
    }, 15000);
    return () => clearInterval(interval);
  }, [userId, refreshFeed]);

  const myPosts = useMemo(() => posts.filter(p => p.userId === userId), [posts, userId]);

  // Feed sorted: followed creators first, then by timestamp
  const feedPosts = useMemo(() => {
    if (followedUserIds.size === 0) return posts;
    const followed: FoodPost[] = [];
    const others: FoodPost[] = [];
    for (const p of posts) {
      if (followedUserIds.has(p.userId)) {
        followed.push(p);
      } else {
        others.push(p);
      }
    }
    return [...followed, ...others];
  }, [posts, followedUserIds]);

  // Follow system
  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!userId) return;
    const wasFollowing = followedUserIds.has(targetUserId);

    // Optimistic update
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (wasFollowing) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return next;
    });

    const { error } = await PostService.toggleFollow(userId, targetUserId, wasFollowing);
    if (error) {
      // Revert on error
      setFollowedUserIds(prev => {
        const next = new Set(prev);
        if (wasFollowing) {
          next.add(targetUserId);
        } else {
          next.delete(targetUserId);
        }
        return next;
      });
    }
  }, [userId, followedUserIds]);

  const isFollowing = useCallback((targetUserId: string) => {
    return followedUserIds.has(targetUserId);
  }, [followedUserIds]);

  const followingCount = followedUserIds.size;

  const addPost = useCallback(async (post: {
    imageUri?: string | null;
    dishName: string;
    caption?: string;
    location?: string;
    mealType?: string;
    source?: string;
    restaurantName?: string;
    platform?: string;
    tags?: string[];
    taggedFriends?: string[];
    creatorType?: CreatorType;
    isVerified?: boolean;
    showName?: string;
    showId?: string;
  }) => {
    if (!userId) return;

    const { data, error } = await PostService.createPost({
      user_id: userId,
      image_url: post.imageUri || null,
      dish_name: post.dishName,
      caption: post.caption || '',
      location: post.location || '',
      meal_type: post.mealType || 'lunch',
      source: post.source || 'home_cooked',
      restaurant_name: post.restaurantName,
      platform: post.platform,
      tags: post.tags || [],
      tagged_friends: post.taggedFriends || [],
      creator_type: post.creatorType || null,
      is_verified: post.isVerified || false,
      show_name: post.showName,
      show_id: post.showId,
    });

    if (data) {
      const newPost = dbPostToFoodPost(data);
      // Override username since joined data may not be available immediately
      const username = user?.username || 'you';
      const initials = username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ME';
      newPost.username = username;
      newPost.avatarInitials = initials;
      setPosts(prev => [newPost, ...prev]);
    }
  }, [userId, user]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!userId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        isLiked: !p.isLiked,
        likes: p.isLiked ? p.likes - 1 : p.likes + 1,
      };
    }));

    const { error } = await PostService.togglePostLike(postId, userId, post.isLiked);
    if (error) {
      // Revert
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          isLiked: post.isLiked,
          likes: post.likes,
        };
      }));
    }
  }, [userId, posts]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!userId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, isSaved: !p.isSaved };
    }));

    const { error } = await PostService.togglePostSave(postId, userId, post.isSaved);
    if (error) {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return { ...p, isSaved: post.isSaved };
      }));
    }
  }, [userId, posts]);

  const addComment = useCallback(async (postId: string, text: string) => {
    if (!userId) return;

    // Optimistic update
    const username = user?.username || 'you';
    const tempComment: PostComment = {
      id: `cmt_${Date.now()}`,
      username,
      text,
      timestamp: Date.now(),
    };
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [...p.comments, tempComment],
        commentsCount: p.commentsCount + 1,
      };
    }));

    await PostService.addPostComment(postId, userId, text);
  }, [userId, user]);

  const markStorySeen = useCallback((storyUserId: string) => {
    setStoryGroups(prev => prev.map(g =>
      g.userId === storyUserId ? { ...g, hasUnseen: false } : g
    ));
  }, []);

  const streak = useMemo(() => {
    if (myPosts.length === 0) return 0;
    // Calculate streak from post timestamps
    const days = new Set(myPosts.map(p => new Date(p.timestamp).toDateString()));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [myPosts]);

  const totalPosts = myPosts.length;

  return (
    <PostContext.Provider value={{
      posts, feedPosts, myPosts, addPost, toggleLike, toggleSave, addComment,
      streak, totalPosts, storyGroups, markStorySeen,
      followedUserIds, toggleFollow, isFollowing, followingCount, followerCount,
      loading, refreshFeed,
    }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error('usePosts must be used within PostProvider');
  return ctx;
}
