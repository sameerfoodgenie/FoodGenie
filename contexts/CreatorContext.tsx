import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { usePosts, CreatorType } from './PostContext';

// ─── Types ───

export interface ShowEpisode {
  id: string;
  title: string;
  description: string;
  imageUri: string | null;
  createdAt: number;
}

export interface CreatorShow {
  id: string;
  title: string;
  description: string;
  coverUri: string | null;
  episodes: ShowEpisode[];
  createdAt: number;
  isPaid?: boolean;
  price?: number;
}

// ─── Creator Tiers ───

export interface CreatorTierInfo {
  id: CreatorType;
  name: string;
  emoji: string;
  color: string;
  description: string;
  perks: string[];
}

export const CREATOR_TIERS: CreatorTierInfo[] = [
  {
    id: 'home_master_chef',
    name: 'Home Master Chef',
    emoji: '👨‍🍳',
    color: '#F97316',
    description: 'Master of home cooking',
    perks: ['Create cooking shows', 'Upload recipe videos', 'Schedule live sessions', 'Paid live sessions'],
  },
  {
    id: 'verified_chef',
    name: 'Chef (Verified)',
    emoji: '✅',
    color: '#3B82F6',
    description: 'Verified professional chef',
    perks: ['Verified badge', 'Highlighted in feed', 'Featured section', 'Priority visibility'],
  },
  {
    id: 'food_blogger',
    name: 'Food Blogger',
    emoji: '📝',
    color: '#A855F7',
    description: 'Food content creator',
    perks: ['Restaurant tagging', 'Grow via followers', 'Engagement boosts', 'Brand collaborations'],
  },
];

// ─── Live Sessions ───

export interface LiveSession {
  id: string;
  hostUserId: string;
  hostUsername: string;
  hostAvatarInitials: string;
  hostCreatorType: CreatorType;
  title: string;
  description: string;
  coverUri: string | null;
  scheduledAt: number;
  isLive: boolean;
  isPaid: boolean;
  price: number;
  attendeeCount: number;
  maxAttendees: number;
}

export interface TrendingShow {
  id: string;
  title: string;
  hostUsername: string;
  hostAvatarInitials: string;
  hostCreatorType: CreatorType;
  coverUri: string | null;
  episodeCount: number;
  viewCount: number;
  rating: number;
}

export interface TopCreator {
  id: string;
  username: string;
  avatarInitials: string;
  creatorType: CreatorType;
  followers: number;
  showCount: number;
  isVerified: boolean;
}

export type CreatorLevel = 'new_creator' | 'rising_creator' | 'food_influencer' | 'genie_creator' | 'elite_chef';

export interface CreatorLevelInfo {
  id: CreatorLevel;
  name: string;
  emoji: string;
  color: string;
  minPosts: number;
}

export type MilestoneCategory = 'activity' | 'consistency' | 'impact';

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  isUnlocked: boolean;
  reward: string;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  color: string;
}

interface CreatorContextType {
  // Creator Tier
  myCreatorType: CreatorType;
  setMyCreatorType: (type: CreatorType) => void;
  creatorTiers: CreatorTierInfo[];
  getCreatorTier: (type: CreatorType) => CreatorTierInfo | null;

  // Live Sessions
  liveSessions: LiveSession[];
  scheduleLiveSession: (session: Omit<LiveSession, 'id' | 'isLive' | 'attendeeCount'>) => string;
  joinLiveSession: (sessionId: string) => void;

  // Trending & Top
  trendingShows: TrendingShow[];
  topCreators: TopCreator[];

  // Levels
  currentLevel: CreatorLevelInfo;
  nextLevel: CreatorLevelInfo | null;
  levelProgress: number;
  allLevels: CreatorLevelInfo[];

  // Milestones
  milestones: Milestone[];
  unlockedMilestones: Milestone[];
  nextMilestone: Milestone | null;

  // Badges
  badges: Badge[];
  unlockedBadges: Badge[];

  // Stats
  isCreatorUnlocked: boolean;
  postCount: number;
  streakCount: number;
  totalLikes: number;
  postsNeeded: number;
  streakNeeded: number;
  postProgress: number;
  streakProgress: number;

  // Shows
  shows: CreatorShow[];
  addShow: (show: Omit<CreatorShow, 'id' | 'episodes' | 'createdAt'>) => string;
  addEpisode: (showId: string, episode: Omit<ShowEpisode, 'id' | 'createdAt'>) => void;
  removeShow: (showId: string) => void;
  removeEpisode: (showId: string, episodeId: string) => void;

  // Unlock
  hasSeenUnlock: boolean;
  markUnlockSeen: () => void;
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

// ─── Constants ───

const POSTS_THRESHOLD = 5;
const STREAK_THRESHOLD = 7;

export const CREATOR_LEVELS: CreatorLevelInfo[] = [
  { id: 'new_creator', name: 'New Creator', emoji: '🌱', color: '#4ADE80', minPosts: 0 },
  { id: 'rising_creator', name: 'Rising Creator', emoji: '🚀', color: '#60A5FA', minPosts: 10 },
  { id: 'food_influencer', name: 'Food Influencer', emoji: '⭐', color: '#FBBF24', minPosts: 25 },
  { id: 'genie_creator', name: 'Genie Creator', emoji: '🧞', color: '#A78BFA', minPosts: 50 },
  { id: 'elite_chef', name: 'Elite Chef', emoji: '👨‍🍳', color: '#F87171', minPosts: 100 },
];

function getLevel(postCount: number): CreatorLevelInfo {
  for (let i = CREATOR_LEVELS.length - 1; i >= 0; i--) {
    if (postCount >= CREATOR_LEVELS[i].minPosts) return CREATOR_LEVELS[i];
  }
  return CREATOR_LEVELS[0];
}

function getNextLevel(postCount: number): CreatorLevelInfo | null {
  for (const lvl of CREATOR_LEVELS) {
    if (postCount < lvl.minPosts) return lvl;
  }
  return null;
}

function getLevelProgress(postCount: number): number {
  const current = getLevel(postCount);
  const next = getNextLevel(postCount);
  if (!next) return 1;
  const range = next.minPosts - current.minPosts;
  if (range <= 0) return 1;
  return Math.min((postCount - current.minPosts) / range, 1);
}

// ─── Provider ───

// ─── Sample Data ───

const SAMPLE_LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'live_1',
    hostUserId: 'user_ananya',
    hostUsername: 'ananya.foodie',
    hostAvatarInitials: 'AF',
    hostCreatorType: 'home_master_chef',
    title: 'Butter Chicken Masterclass',
    description: 'Learn my secret recipe for the creamiest butter chicken ever',
    coverUri: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d4a?w=800&q=80',
    scheduledAt: Date.now() + 3600000 * 2,
    isLive: false,
    isPaid: true,
    price: 99,
    attendeeCount: 45,
    maxAttendees: 100,
  },
  {
    id: 'live_2',
    hostUserId: 'user_rahul',
    hostUsername: 'rahul.eats',
    hostAvatarInitials: 'RE',
    hostCreatorType: 'verified_chef',
    title: 'Street Food Secrets',
    description: 'Mumbai street food at home - chaat, pav bhaji, vada pav',
    coverUri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    scheduledAt: Date.now() + 3600000 * 5,
    isLive: false,
    isPaid: false,
    price: 0,
    attendeeCount: 128,
    maxAttendees: 200,
  },
  {
    id: 'live_3',
    hostUserId: 'user_priya',
    hostUsername: 'priya.cooks',
    hostAvatarInitials: 'PC',
    hostCreatorType: 'home_master_chef',
    title: 'Healthy Meal Prep Sunday',
    description: 'Prep 5 days of clean meals in 2 hours',
    coverUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    scheduledAt: Date.now() - 600000,
    isLive: true,
    isPaid: true,
    price: 149,
    attendeeCount: 67,
    maxAttendees: 80,
  },
];

const SAMPLE_TRENDING_SHOWS: TrendingShow[] = [
  {
    id: 'ts_1',
    title: 'Midnight Cravings',
    hostUsername: 'ananya.foodie',
    hostAvatarInitials: 'AF',
    hostCreatorType: 'home_master_chef',
    coverUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    episodeCount: 12,
    viewCount: 45200,
    rating: 4.8,
  },
  {
    id: 'ts_2',
    title: 'Chef Rahul Specials',
    hostUsername: 'rahul.eats',
    hostAvatarInitials: 'RE',
    hostCreatorType: 'verified_chef',
    coverUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    episodeCount: 8,
    viewCount: 32100,
    rating: 4.9,
  },
  {
    id: 'ts_3',
    title: 'Clean Eating 101',
    hostUsername: 'priya.cooks',
    hostAvatarInitials: 'PC',
    hostCreatorType: 'food_blogger',
    coverUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    episodeCount: 15,
    viewCount: 28700,
    rating: 4.7,
  },
  {
    id: 'ts_4',
    title: 'Biryani Chronicles',
    hostUsername: 'dev.bites',
    hostAvatarInitials: 'DB',
    hostCreatorType: 'verified_chef',
    coverUri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    episodeCount: 6,
    viewCount: 19500,
    rating: 4.6,
  },
];

const SAMPLE_TOP_CREATORS: TopCreator[] = [
  { id: 'tc_1', username: 'ananya.foodie', avatarInitials: 'AF', creatorType: 'home_master_chef', followers: 12400, showCount: 3, isVerified: false },
  { id: 'tc_2', username: 'rahul.eats', avatarInitials: 'RE', creatorType: 'verified_chef', followers: 34200, showCount: 5, isVerified: true },
  { id: 'tc_3', username: 'priya.cooks', avatarInitials: 'PC', creatorType: 'food_blogger', followers: 8900, showCount: 2, isVerified: false },
  { id: 'tc_4', username: 'dev.bites', avatarInitials: 'DB', creatorType: 'verified_chef', followers: 21600, showCount: 4, isVerified: true },
  { id: 'tc_5', username: 'meera.meals', avatarInitials: 'MM', creatorType: 'food_blogger', followers: 5700, showCount: 1, isVerified: false },
];

export function CreatorProvider({ children }: { children: ReactNode }) {
  const { posts, streak, myPosts } = usePosts();
  const [shows, setShows] = useState<CreatorShow[]>([]);
  const [hasSeenUnlock, setHasSeenUnlock] = useState(false);
  const [myCreatorType, setMyCreatorType] = useState<CreatorType>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>(SAMPLE_LIVE_SESSIONS);

  const postCount = myPosts.length;
  const streakCount = streak;
  const totalLikes = useMemo(() => myPosts.reduce((s, p) => s + p.likes, 0), [myPosts]);

  const isCreatorUnlocked = postCount >= POSTS_THRESHOLD || streakCount >= STREAK_THRESHOLD;
  const postProgress = Math.min(postCount / POSTS_THRESHOLD, 1);
  const streakProgress = Math.min(streakCount / STREAK_THRESHOLD, 1);
  const postsNeeded = Math.max(0, POSTS_THRESHOLD - postCount);
  const streakNeeded = Math.max(0, STREAK_THRESHOLD - streakCount);

  // Levels
  const currentLevel = useMemo(() => getLevel(postCount), [postCount]);
  const nextLevel = useMemo(() => getNextLevel(postCount), [postCount]);
  const levelProgress = useMemo(() => getLevelProgress(postCount), [postCount]);

  // Milestones
  const milestones: Milestone[] = useMemo(() => [
    // Activity
    { id: 'act_5', category: 'activity' as MilestoneCategory, title: 'First Steps', description: 'Post 5 meals', icon: '📸', target: 5, current: Math.min(postCount, 5), isUnlocked: postCount >= 5, reward: 'Creator Mode Unlocked', color: '#4ADE80' },
    { id: 'act_10', category: 'activity' as MilestoneCategory, title: 'Getting Serious', description: 'Post 10 meals', icon: '🔥', target: 10, current: Math.min(postCount, 10), isUnlocked: postCount >= 10, reward: 'Rising Creator Badge', color: '#60A5FA' },
    { id: 'act_25', category: 'activity' as MilestoneCategory, title: 'Feed Star', description: 'Post 25 meals', icon: '⚡', target: 25, current: Math.min(postCount, 25), isUnlocked: postCount >= 25, reward: 'Feed Boost', color: '#FBBF24' },
    { id: 'act_50', category: 'activity' as MilestoneCategory, title: 'Powerhouse', description: 'Post 50 meals', icon: '💎', target: 50, current: Math.min(postCount, 50), isUnlocked: postCount >= 50, reward: 'Profile Highlight', color: '#A78BFA' },
    // Consistency
    { id: 'str_7', category: 'consistency' as MilestoneCategory, title: 'Week Warrior', description: '7-day streak', icon: '🗓', target: 7, current: Math.min(streakCount, 7), isUnlocked: streakCount >= 7, reward: 'Streak Badge', color: '#FB923C' },
    { id: 'str_15', category: 'consistency' as MilestoneCategory, title: 'Consistent Chef', description: '15-day streak', icon: '🏆', target: 15, current: Math.min(streakCount, 15), isUnlocked: streakCount >= 15, reward: 'Gold Streak Frame', color: '#FBBF24' },
    { id: 'str_30', category: 'consistency' as MilestoneCategory, title: 'Iron Discipline', description: '30-day streak', icon: '👑', target: 30, current: Math.min(streakCount, 30), isUnlocked: streakCount >= 30, reward: 'Exclusive Avatar Ring', color: '#F87171' },
    // Impact
    { id: 'imp_100', category: 'impact' as MilestoneCategory, title: 'Crowd Favorite', description: 'Get 100 likes', icon: '❤️', target: 100, current: Math.min(totalLikes, 100), isUnlocked: totalLikes >= 100, reward: 'Visibility Boost', color: '#F87171' },
    { id: 'imp_500', category: 'impact' as MilestoneCategory, title: 'Trending Creator', description: 'Get 500 likes', icon: '🌟', target: 500, current: Math.min(totalLikes, 500), isUnlocked: totalLikes >= 500, reward: 'Featured Creator', color: '#FBBF24' },
    { id: 'imp_1000', category: 'impact' as MilestoneCategory, title: 'Food Legend', description: 'Get 1000 likes', icon: '🎯', target: 1000, current: Math.min(totalLikes, 1000), isUnlocked: totalLikes >= 1000, reward: 'Monetization Unlock', color: '#A78BFA' },
  ], [postCount, streakCount, totalLikes]);

  const unlockedMilestones = useMemo(() => milestones.filter(m => m.isUnlocked), [milestones]);
  const nextMilestone = useMemo(() => milestones.find(m => !m.isUnlocked) || null, [milestones]);

  // Badges
  const badges: Badge[] = useMemo(() => [
    { id: 'b_creator', name: 'Creator', emoji: '🌱', description: 'Unlocked Creator Mode', isUnlocked: isCreatorUnlocked, color: '#4ADE80' },
    { id: 'b_rising', name: 'Rising Star', emoji: '🚀', description: 'Posted 10 meals', isUnlocked: postCount >= 10, color: '#60A5FA' },
    { id: 'b_influencer', name: 'Influencer', emoji: '⭐', description: 'Posted 25 meals', isUnlocked: postCount >= 25, color: '#FBBF24' },
    { id: 'b_streak7', name: 'Streak Warrior', emoji: '🔥', description: '7-day streak', isUnlocked: streakCount >= 7, color: '#FB923C' },
    { id: 'b_streak30', name: 'Iron Chef', emoji: '👑', description: '30-day streak', isUnlocked: streakCount >= 30, color: '#F87171' },
    { id: 'b_liked', name: 'Fan Favorite', emoji: '❤️', description: '100 likes earned', isUnlocked: totalLikes >= 100, color: '#F87171' },
    { id: 'b_legend', name: 'Food Legend', emoji: '🎯', description: '1000 likes earned', isUnlocked: totalLikes >= 1000, color: '#A78BFA' },
    { id: 'b_showmaker', name: 'Showmaker', emoji: '🎬', description: 'Created a show', isUnlocked: shows.length > 0, color: '#22C55E' },
  ], [isCreatorUnlocked, postCount, streakCount, totalLikes, shows.length]);

  const unlockedBadges = useMemo(() => badges.filter(b => b.isUnlocked), [badges]);

  // Creator tier helpers
  const getCreatorTier = useCallback((type: CreatorType): CreatorTierInfo | null => {
    if (!type) return null;
    return CREATOR_TIERS.find(t => t.id === type) || null;
  }, []);

  // Live sessions
  const scheduleLiveSession = useCallback((session: Omit<LiveSession, 'id' | 'isLive' | 'attendeeCount'>): string => {
    const id = `live_${Date.now()}`;
    setLiveSessions(prev => [{ ...session, id, isLive: false, attendeeCount: 0 }, ...prev]);
    return id;
  }, []);

  const joinLiveSession = useCallback((sessionId: string) => {
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, attendeeCount: s.attendeeCount + 1 } : s
    ));
  }, []);

  // Shows
  const addShow = useCallback((show: Omit<CreatorShow, 'id' | 'episodes' | 'createdAt'>): string => {
    const id = `show_${Date.now()}`;
    setShows(prev => [{ ...show, id, episodes: [], createdAt: Date.now() }, ...prev]);
    return id;
  }, []);

  const addEpisode = useCallback((showId: string, episode: Omit<ShowEpisode, 'id' | 'createdAt'>) => {
    setShows(prev => prev.map(s =>
      s.id === showId
        ? { ...s, episodes: [...s.episodes, { ...episode, id: `ep_${Date.now()}`, createdAt: Date.now() }] }
        : s
    ));
  }, []);

  const removeShow = useCallback((showId: string) => {
    setShows(prev => prev.filter(s => s.id !== showId));
  }, []);

  const removeEpisode = useCallback((showId: string, episodeId: string) => {
    setShows(prev => prev.map(s =>
      s.id === showId ? { ...s, episodes: s.episodes.filter(e => e.id !== episodeId) } : s
    ));
  }, []);

  const markUnlockSeen = useCallback(() => setHasSeenUnlock(true), []);

  return (
    <CreatorContext.Provider value={{
      myCreatorType, setMyCreatorType, creatorTiers: CREATOR_TIERS, getCreatorTier,
      liveSessions, scheduleLiveSession, joinLiveSession,
      trendingShows: SAMPLE_TRENDING_SHOWS, topCreators: SAMPLE_TOP_CREATORS,
      currentLevel, nextLevel, levelProgress, allLevels: CREATOR_LEVELS,
      milestones, unlockedMilestones, nextMilestone,
      badges, unlockedBadges,
      isCreatorUnlocked, postCount, streakCount, totalLikes,
      postsNeeded, streakNeeded, postProgress, streakProgress,
      shows, addShow, addEpisode, removeShow, removeEpisode,
      hasSeenUnlock, markUnlockSeen,
    }}>
      {children}
    </CreatorContext.Provider>
  );
}

export function useCreator() {
  const ctx = useContext(CreatorContext);
  if (!ctx) throw new Error('useCreator must be used within CreatorProvider');
  return ctx;
}
