import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

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
}

interface PostContextType {
  posts: FoodPost[];
  feedPosts: FoodPost[];
  myPosts: FoodPost[];
  addPost: (post: Omit<FoodPost, 'id' | 'likes' | 'isLiked' | 'isSaved' | 'comments'>) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  streak: number;
  totalPosts: number;
  storyGroups: StoryGroup[];
  markStorySeen: (userId: string) => void;
  // Follow system
  followedUserIds: Set<string>;
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  followingCount: number;
  followerCount: number;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

// Posts start empty — real data comes from user actions
const SAMPLE_POSTS: FoodPost[] = [];

// Stories start empty — real data comes from user actions
const SAMPLE_STORIES: StoryGroup[] = [];

export function PostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FoodPost[]>(SAMPLE_POSTS);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(SAMPLE_STORIES);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  const myPosts = posts.filter(p => p.userId === 'me');

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
  const toggleFollow = useCallback((userId: string) => {
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const isFollowing = useCallback((userId: string) => {
    return followedUserIds.has(userId);
  }, [followedUserIds]);

  const followingCount = followedUserIds.size;
  const followerCount = 0;

  const addPost = useCallback((post: Omit<FoodPost, 'id' | 'likes' | 'isLiked' | 'isSaved' | 'comments'>) => {
    const newPost: FoodPost = {
      ...post,
      id: `post_${Date.now()}`,
      likes: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        isLiked: !p.isLiked,
        likes: p.isLiked ? p.likes - 1 : p.likes + 1,
      };
    }));
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, isSaved: !p.isSaved };
    }));
  }, []);

  const addComment = useCallback((postId: string, text: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [...p.comments, {
          id: `cmt_${Date.now()}`,
          username: 'you',
          text,
          timestamp: Date.now(),
        }],
      };
    }));
  }, []);

  const markStorySeen = useCallback((userId: string) => {
    setStoryGroups(prev => prev.map(g =>
      g.userId === userId ? { ...g, hasUnseen: false } : g
    ));
  }, []);

  const streak = 3;
  const totalPosts = myPosts.length;

  return (
    <PostContext.Provider value={{
      posts, feedPosts, myPosts, addPost, toggleLike, toggleSave, addComment,
      streak, totalPosts, storyGroups, markStorySeen,
      followedUserIds, toggleFollow, isFollowing, followingCount, followerCount,
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
