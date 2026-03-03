import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/template';
import { Dish, Restaurant, ChatMessage, initialChatMessages } from '../services/mockData';
import { ConfidenceResult } from '../services/aiEngine';
import { fetchLiveData } from '../services/dataService';
import {
  loadPreferences,
  savePreferences,
  loadBehavior,
  saveBehavior,
  incrementSessionCount,
  trackIgnoredBestMatch,
  resetIgnoredCount,
  trackSpiceChoice,
  UserBehavior,
  loadAdvancedPreferences,
  saveAdvancedPreferences,
  AdvancedPreferences,
} from '../services/preferencesService';

interface UserPreferences {
  diet: 'veg' | 'egg' | 'nonveg' | null;
  budgetMin: number;
  budgetMax: number;
  spiceLevel: number;
  mode: 'quick' | 'guided';
  onboardingComplete: boolean;
  sessionCount: number;
  preferredPartnerApp: string | null;
  lastPartnerUsed: string | null;
  partnerRedirectCount: number;
}

interface AdvancedPrefs {
  healthGoal: string;
  deliveryPriority: string;
  cuisineBias: string[];
  avoidTags: string[];
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
}

interface CartItem {
  dish: Dish;
  quantity: number;
  addons: string[];
}

interface AppContextType {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  syncPreferencesToDB: (overrides?: Partial<UserPreferences>) => Promise<void>;
  behavior: UserBehavior | null;
  recordIgnoredBestMatch: () => Promise<number>;
  resetIgnored: () => Promise<void>;
  recordSpiceChoice: (level: number) => Promise<{ contradictions: number }>;
  updateMode: (mode: 'quick' | 'guided') => Promise<void>;
  incrementSession: () => Promise<number>;
  cart: CartItem[];
  addToCart: (dish: Dish, addons?: string[]) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  aiResults: ConfidenceResult[];
  setAiResults: (results: ConfidenceResult[]) => void;
  currentQuery: string;
  setCurrentQuery: (query: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  prefsLoaded: boolean;
  allDishes: Dish[];
  allRestaurants: Restaurant[];
  dataLoaded: boolean;
  shareRewardUnlocked: boolean;
  unlockShareReward: () => void;
  advancedPrefs: AdvancedPrefs;
  updateAdvancedPrefs: (prefs: Partial<AdvancedPrefs>) => void;
  syncAdvancedPrefsToDB: (dbPrefs: Partial<AdvancedPreferences>) => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  diet: null,
  budgetMin: 100,
  budgetMax: 500,
  spiceLevel: 2,
  mode: 'guided',
  onboardingComplete: false,
  sessionCount: 0,
  preferredPartnerApp: null,
  lastPartnerUsed: null,
  partnerRedirectCount: 0,
};

const defaultAdvancedPrefs: AdvancedPrefs = {
  healthGoal: 'none',
  deliveryPriority: 'best_rated',
  cuisineBias: [],
  avoidTags: [],
  heightCm: null,
  weightKg: null,
  bmi: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [aiResults, setAiResultsState] = useState<ConfidenceResult[]>([]);
  const [currentQuery, setCurrentQueryState] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareRewardUnlocked, setShareRewardUnlocked] = useState(false);
  const [advancedPrefs, setAdvancedPrefs] = useState<AdvancedPrefs>(defaultAdvancedPrefs);
  const lastUserId = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  // Load live data from Supabase (restaurants + dishes + tags)
  useEffect(() => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    fetchLiveData()
      .then(({ dishes, restaurants }) => {
        setAllDishes(dishes);
        setAllRestaurants(restaurants);
        setDataLoaded(true);
      })
      .catch((e) => {
        console.log('Error loading live data:', e);
        setDataLoaded(true); // Mark loaded even on error so app does not hang
      });
  }, []);

  // Load user preferences from Supabase when user changes or auth finishes loading
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      lastUserId.current = null;
      setPreferences(defaultPreferences);
      setBehavior(null);
      setPrefsLoaded(true);
      return;
    }

    if (lastUserId.current === user.id && prefsLoaded) return;
    if (isLoadingRef.current) return;

    lastUserId.current = user.id;
    isLoadingRef.current = true;
    setPrefsLoaded(false);

    loadFromDB(user.id);
  }, [user?.id, authLoading]);

  // Failsafe: ensure prefsLoaded becomes true within 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrefsLoaded(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadFromDB = async (userId: string) => {
    try {
      const results = await Promise.allSettled([
        loadPreferences(userId),
        loadBehavior(userId),
      ]);

      const dbPrefs = results[0].status === 'fulfilled' ? results[0].value : null;
      const dbBehavior = results[1].status === 'fulfilled' ? results[1].value : null;

      // Load advanced preferences
      try {
        const adv = await loadAdvancedPreferences(userId);
        if (adv) {
          setAdvancedPrefs({
            healthGoal: adv.health_goal || 'none',
            deliveryPriority: adv.delivery_priority || 'best_rated',
            cuisineBias: adv.cuisine_bias || [],
            avoidTags: adv.avoid_tags || [],
            heightCm: adv.height_cm,
            weightKg: adv.weight_kg,
            bmi: adv.bmi,
          });
        }
      } catch (e) {
        console.log('Error loading advanced prefs:', e);
      }

      if (dbPrefs) {
        setPreferences({
          diet: dbPrefs.diet,
          budgetMin: dbPrefs.budget_min,
          budgetMax: dbPrefs.budget_max,
          spiceLevel: dbPrefs.spice_level,
          mode: dbPrefs.mode,
          onboardingComplete: dbPrefs.onboarding_complete,
          sessionCount: dbPrefs.session_count,
          preferredPartnerApp: dbPrefs.preferred_partner_app || null,
          lastPartnerUsed: dbPrefs.last_partner_used || null,
          partnerRedirectCount: dbPrefs.partner_redirect_count || 0,
        });
      }
      if (dbBehavior) {
        setBehavior(dbBehavior);
      }
    } catch (e) {
      console.log('Error loading preferences:', e);
    } finally {
      isLoadingRef.current = false;
      setPrefsLoaded(true);
    }
  };

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  const syncPreferencesToDB = useCallback(async (overrides?: Partial<UserPreferences>) => {
    if (!user?.id) return;
    try {
      const currentPrefs = overrides
        ? { ...preferences, ...overrides }
        : preferences;
      await savePreferences(user.id, {
        diet: currentPrefs.diet,
        budget_min: currentPrefs.budgetMin,
        budget_max: currentPrefs.budgetMax,
        spice_level: currentPrefs.spiceLevel,
        mode: currentPrefs.mode,
        onboarding_complete: currentPrefs.onboardingComplete,
        session_count: currentPrefs.sessionCount,
      });
    } catch (e) {
      console.log('Error syncing preferences:', e);
    }
  }, [user?.id, preferences]);

  const recordIgnoredBestMatch = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;
    try {
      const count = await trackIgnoredBestMatch(user.id);
      const updated = await loadBehavior(user.id).catch(() => null);
      if (updated) setBehavior(updated);
      return count;
    } catch { return 0; }
  }, [user?.id]);

  const resetIgnored = useCallback(async () => {
    if (!user?.id) return;
    try {
      await resetIgnoredCount(user.id);
      const updated = await loadBehavior(user.id).catch(() => null);
      if (updated) setBehavior(updated);
    } catch { /* ignore */ }
  }, [user?.id]);

  const recordSpiceChoice = useCallback(async (level: number): Promise<{ contradictions: number }> => {
    if (!user?.id) return { contradictions: 0 };
    try {
      const result = await trackSpiceChoice(user.id, level);
      const updated = await loadBehavior(user.id).catch(() => null);
      if (updated) setBehavior(updated);
      return { contradictions: result.contradictions };
    } catch { return { contradictions: 0 }; }
  }, [user?.id]);

  const updateMode = useCallback(async (mode: 'quick' | 'guided') => {
    updatePreferences({ mode });
    if (!user?.id) return;
    try {
      await Promise.allSettled([
        savePreferences(user.id, { mode }),
        saveBehavior(user.id, { preferred_mode: mode }),
      ]);
    } catch { /* ignore */ }
  }, [user?.id, updatePreferences]);

  const incrementSession = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0;
    try {
      const count = await incrementSessionCount(user.id);
      setPreferences(prev => ({ ...prev, sessionCount: count }));
      return count;
    } catch { return 0; }
  }, [user?.id]);

  const setAiResults = useCallback((results: ConfidenceResult[]) => {
    setAiResultsState(results);
  }, []);

  const setCurrentQuery = useCallback((query: string) => {
    setCurrentQueryState(query);
  }, []);

  const addToCart = useCallback((dish: Dish, addons: string[] = []) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1, addons: [...item.addons, ...addons] }
            : item
        );
      }
      return [...prev, { dish, quantity: 1, addons }];
    });
  }, []);

  const removeFromCart = useCallback((dishId: string) => {
    setCart(prev => prev.filter(item => item.dish.id !== dishId));
  }, []);

  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(dishId); return; }
    setCart(prev => prev.map(item => item.dish.id === dishId ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const unlockShareReward = useCallback(() => {
    setShareRewardUnlocked(true);
  }, []);

  const updateAdvancedPrefs = useCallback((prefs: Partial<AdvancedPrefs>) => {
    setAdvancedPrefs(prev => ({ ...prev, ...prefs }));
  }, []);

  const syncAdvancedPrefsToDB = useCallback(async (dbPrefs: Partial<AdvancedPreferences>) => {
    if (!user?.id) return;
    try {
      await saveAdvancedPreferences(user.id, dbPrefs);
    } catch (e) {
      console.log('Error syncing advanced prefs:', e);
    }
  }, [user?.id]);

  return (
    <AppContext.Provider
      value={{
        preferences,
        updatePreferences,
        syncPreferencesToDB,
        behavior,
        recordIgnoredBestMatch,
        resetIgnored,
        recordSpiceChoice,
        updateMode,
        incrementSession,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        aiResults,
        setAiResults,
        currentQuery,
        setCurrentQuery,
        chatMessages,
        addChatMessage,
        isLoading,
        setIsLoading,
        prefsLoaded,
        allDishes,
        allRestaurants,
        dataLoaded,
        shareRewardUnlocked,
        unlockShareReward,
        advancedPrefs,
        updateAdvancedPrefs,
        syncAdvancedPrefsToDB,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
