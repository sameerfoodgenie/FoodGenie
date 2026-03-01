import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/template';
import { mockDishes, mockRestaurants, Dish, Restaurant, ChatMessage, initialChatMessages } from '../services/mockData';
import { ConfidenceResult } from '../services/aiEngine';
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [aiResults, setAiResults] = useState<ConfidenceResult[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const lastUserId = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Load from Supabase when user changes
  useEffect(() => {
    if (user?.id) {
      // Prevent duplicate loads for the same user
      if (lastUserId.current === user.id && prefsLoaded) return;
      if (isLoadingRef.current) return;
      lastUserId.current = user.id;
      loadFromDB(user.id);
    } else {
      lastUserId.current = null;
      setPreferences(defaultPreferences);
      setBehavior(null);
      setPrefsLoaded(false);
    }
  }, [user?.id]);

  const loadFromDB = async (userId: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [dbPrefs, dbBehavior] = await Promise.all([
        loadPreferences(userId).catch(() => null),
        loadBehavior(userId).catch(() => null),
      ]);

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
      await Promise.all([
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
        allDishes: mockDishes,
        allRestaurants: mockRestaurants,
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
