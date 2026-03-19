import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { usePosts } from './PostContext';

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
}

interface CreatorContextType {
  isCreatorUnlocked: boolean;
  postCount: number;
  streakCount: number;
  postsNeeded: number;
  streakNeeded: number;
  postProgress: number;
  streakProgress: number;
  shows: CreatorShow[];
  addShow: (show: Omit<CreatorShow, 'id' | 'episodes' | 'createdAt'>) => string;
  addEpisode: (showId: string, episode: Omit<ShowEpisode, 'id' | 'createdAt'>) => void;
  removeShow: (showId: string) => void;
  removeEpisode: (showId: string, episodeId: string) => void;
  hasSeenUnlock: boolean;
  markUnlockSeen: () => void;
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

const POSTS_THRESHOLD = 5;
const STREAK_THRESHOLD = 7;

export function CreatorProvider({ children }: { children: ReactNode }) {
  const { posts, streak } = usePosts();
  const [shows, setShows] = useState<CreatorShow[]>([]);
  const [hasSeenUnlock, setHasSeenUnlock] = useState(false);

  const myPostCount = posts.filter(p => p.userId === 'me').length;
  const streakCount = streak;

  const isCreatorUnlocked = myPostCount >= POSTS_THRESHOLD || streakCount >= STREAK_THRESHOLD;

  const postProgress = Math.min(myPostCount / POSTS_THRESHOLD, 1);
  const streakProgress = Math.min(streakCount / STREAK_THRESHOLD, 1);
  const postsNeeded = Math.max(0, POSTS_THRESHOLD - myPostCount);
  const streakNeeded = Math.max(0, STREAK_THRESHOLD - streakCount);

  const addShow = useCallback((show: Omit<CreatorShow, 'id' | 'episodes' | 'createdAt'>): string => {
    const id = `show_${Date.now()}`;
    const newShow: CreatorShow = {
      ...show,
      id,
      episodes: [],
      createdAt: Date.now(),
    };
    setShows(prev => [newShow, ...prev]);
    return id;
  }, []);

  const addEpisode = useCallback((showId: string, episode: Omit<ShowEpisode, 'id' | 'createdAt'>) => {
    const newEpisode: ShowEpisode = {
      ...episode,
      id: `ep_${Date.now()}`,
      createdAt: Date.now(),
    };
    setShows(prev => prev.map(s =>
      s.id === showId ? { ...s, episodes: [...s.episodes, newEpisode] } : s
    ));
  }, []);

  const removeShow = useCallback((showId: string) => {
    setShows(prev => prev.filter(s => s.id !== showId));
  }, []);

  const removeEpisode = useCallback((showId: string, episodeId: string) => {
    setShows(prev => prev.map(s =>
      s.id === showId
        ? { ...s, episodes: s.episodes.filter(e => e.id !== episodeId) }
        : s
    ));
  }, []);

  const markUnlockSeen = useCallback(() => {
    setHasSeenUnlock(true);
  }, []);

  return (
    <CreatorContext.Provider value={{
      isCreatorUnlocked,
      postCount: myPostCount,
      streakCount,
      postsNeeded,
      streakNeeded,
      postProgress,
      streakProgress,
      shows,
      addShow,
      addEpisode,
      removeShow,
      removeEpisode,
      hasSeenUnlock,
      markUnlockSeen,
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
