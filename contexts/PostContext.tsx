import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PostComment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

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
}

const PostContext = createContext<PostContextType | undefined>(undefined);

// Sample feed data
const SAMPLE_POSTS: FoodPost[] = [
  {
    id: 's1',
    userId: 'user_ananya',
    username: 'ananya.foodie',
    avatarInitials: 'AF',
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

export function PostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FoodPost[]>(SAMPLE_POSTS);

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

  const streak = 3;
  const totalPosts = myPosts.length;

  return (
    <PostContext.Provider value={{ posts, myPosts, addPost, toggleLike, toggleSave, addComment, streak, totalPosts }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error('usePosts must be used within PostProvider');
  return ctx;
}
