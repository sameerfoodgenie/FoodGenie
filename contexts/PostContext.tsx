import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
}

interface PostContextType {
  posts: FoodPost[];
  myPosts: FoodPost[];
  addPost: (post: Omit<FoodPost, 'id' | 'likes' | 'isLiked' | 'isSaved' | 'comments'>) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  streak: number;
  totalPosts: number;
  storyGroups: StoryGroup[];
  markStorySeen: (userId: string) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

// Sample feed data
const SAMPLE_POSTS: FoodPost[] = [
  {
    id: 's1',
    userId: 'user_ananya',
    username: 'ananya.foodie',
    avatarInitials: 'AF',
    creatorType: 'home_master_chef',
    isVerified: false,
    imageUri: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d4a?w=800&q=80',
    dishName: 'Butter Chicken',
    caption: 'Sunday special at home! Nothing beats homemade butter chicken with garlic naan 🔥',
    location: 'Kandivali West',
    mealType: 'dinner',
    source: 'home_cooked',
    tags: ['homemade', 'comfort food'],
    taggedFriends: [],
    likes: 42,
    isLiked: false,
    isSaved: false,
    comments: [
      { id: 'c1', username: 'rahul.eats', text: 'Recipe please! 🙏', timestamp: Date.now() - 3600000 },
    ],
    timestamp: Date.now() - 1800000,
  },
  {
    id: 's2',
    userId: 'user_rahul',
    username: 'rahul.eats',
    avatarInitials: 'RE',
    creatorType: 'verified_chef',
    isVerified: true,
    imageUri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
    dishName: 'Masala Dosa',
    caption: 'Crispy dosa mornings are the best mornings. This place never disappoints! 💯',
    location: 'Borivali East',
    mealType: 'breakfast',
    source: 'restaurant',
    restaurantName: 'Sagar Ratna',
    tags: ['breakfast', 'south indian'],
    taggedFriends: ['priya.cooks'],
    likes: 89,
    isLiked: false,
    isSaved: false,
    comments: [
      { id: 'c2', username: 'priya.cooks', text: 'Was so good! 😍', timestamp: Date.now() - 7200000 },
      { id: 'c3', username: 'ananya.foodie', text: 'My fav place too!', timestamp: Date.now() - 5400000 },
    ],
    timestamp: Date.now() - 7200000,
  },
  {
    id: 's3',
    userId: 'user_priya',
    username: 'priya.cooks',
    avatarInitials: 'PC',
    creatorType: 'food_blogger',
    isVerified: false,
    imageUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    dishName: 'Quinoa Salad Bowl',
    caption: 'Trying to eat clean this week. Loaded with veggies and a lemon tahini dressing ✨',
    location: 'Andheri West',
    mealType: 'lunch',
    source: 'home_cooked',
    tags: ['healthy', 'clean eating'],
    taggedFriends: [],
    likes: 156,
    isLiked: false,
    isSaved: false,
    comments: [],
    timestamp: Date.now() - 14400000,
  },
  {
    id: 's4',
    userId: 'user_dev',
    username: 'dev.bites',
    avatarInitials: 'DB',
    creatorType: 'verified_chef',
    isVerified: true,
    imageUri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    dishName: 'Chicken Biryani',
    caption: 'Friday biryani ritual. Ordered from the OG biryani spot. Worth every rupee 🍚',
    location: 'Malad West',
    mealType: 'dinner',
    source: 'online_order',
    restaurantName: 'Behrouz Biryani',
    platform: 'zomato',
    tags: ['biryani', 'friday vibes'],
    taggedFriends: ['rahul.eats'],
    likes: 234,
    isLiked: false,
    isSaved: false,
    comments: [
      { id: 'c4', username: 'rahul.eats', text: 'Behrouz is unbeatable', timestamp: Date.now() - 18000000 },
    ],
    timestamp: Date.now() - 21600000,
  },
  {
    id: 's5',
    userId: 'user_meera',
    username: 'meera.meals',
    avatarInitials: 'MM',
    creatorType: 'food_blogger',
    isVerified: false,
    imageUri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    dishName: 'Pancake Stack',
    caption: 'Fluffy pancakes with maple syrup and fresh berries. Brunch done right! 🥞',
    location: 'Bandra West',
    mealType: 'breakfast',
    source: 'restaurant',
    restaurantName: 'The Pantry',
    tags: ['brunch', 'weekend'],
    taggedFriends: [],
    likes: 78,
    isLiked: false,
    isSaved: false,
    comments: [],
    timestamp: Date.now() - 43200000,
  },
];

const SAMPLE_STORIES: StoryGroup[] = [
  {
    userId: 'user_ananya',
    username: 'ananya.foodie',
    avatarInitials: 'AF',
    hasUnseen: true,
    stories: [
      { id: 'st1a', imageUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', caption: 'Morning chai vibes ☕', timestamp: Date.now() - 3600000, duration: 5000 },
      { id: 'st1b', imageUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', caption: 'Made pizza from scratch! 🍕', timestamp: Date.now() - 1800000, duration: 5000 },
    ],
  },
  {
    userId: 'user_rahul',
    username: 'rahul.eats',
    avatarInitials: 'RE',
    hasUnseen: true,
    stories: [
      { id: 'st2a', imageUri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', caption: 'Burger night 🍔', timestamp: Date.now() - 7200000, duration: 5000 },
    ],
  },
  {
    userId: 'user_priya',
    username: 'priya.cooks',
    avatarInitials: 'PC',
    hasUnseen: true,
    stories: [
      { id: 'st3a', imageUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', caption: 'Salad prep Sunday 🥗', timestamp: Date.now() - 10800000, duration: 5000 },
      { id: 'st3b', imageUri: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80', caption: 'French toast perfection', timestamp: Date.now() - 9000000, duration: 5000 },
      { id: 'st3c', imageUri: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80', caption: 'Afternoon snack plate', timestamp: Date.now() - 5400000, duration: 5000 },
    ],
  },
  {
    userId: 'user_dev',
    username: 'dev.bites',
    avatarInitials: 'DB',
    hasUnseen: true,
    stories: [
      { id: 'st4a', imageUri: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80', caption: 'Street food crawl tonight 🌮', timestamp: Date.now() - 14400000, duration: 5000 },
    ],
  },
  {
    userId: 'user_meera',
    username: 'meera.meals',
    avatarInitials: 'MM',
    hasUnseen: false,
    stories: [
      { id: 'st5a', imageUri: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', caption: 'Dessert time 🍰', timestamp: Date.now() - 21600000, duration: 5000 },
    ],
  },
];

export function PostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FoodPost[]>(SAMPLE_POSTS);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(SAMPLE_STORIES);

  const myPosts = posts.filter(p => p.userId === 'me');

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
    <PostContext.Provider value={{ posts, myPosts, addPost, toggleLike, toggleSave, addComment, streak, totalPosts, storyGroups, markStorySeen }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error('usePosts must be used within PostProvider');
  return ctx;
}
