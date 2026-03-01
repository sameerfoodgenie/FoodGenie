import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  UserPreferences as DBPreferences,
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
  // User preferences
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  syncPreferencesToDB: (overrides?: Partial<UserPreferences>) => Promise<void>;
  
  // Behavior
  behavior: UserBehavior | null;
  recordIgnoredBestMatch: () => Promise<number>;
  resetIgnored: () => Promise<void>;
  recordSpiceChoice: (level: number) => Promise<{ contradictions: number }>;
  updateMode: (mode: 'quick' | 'guided') => Promise<void>;
  incrementSession: () => Promise<number>;
  
  // Cart
  cart: CartItem[];
  addToCart: (dish: Dish, addons?: string[]) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  
  // AI Results
  aiResults: ConfidenceResult[];
  setAiResults: (results: ConfidenceResult[]) => void;
  currentQuery: string;
  setCurrentQuery: (query: string) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  
  // App state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  prefsLoaded: boolean;
  
  // Data
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

  // Load from Supabase when user changes
  useEffect(() => {
    if (user?.id) {
      loadFromDB(user.id);
    } else {
      setPreferences(defaultPreferences);
      setBehavior(null);
      setPrefsLoaded(false);
    }
  }, [user?.id]);

  // Load cart from local storage
  useEffect(() => {
    AsyncStorage.getItem('foodgenie_cart').then(data => {
      if (data) setCart(JSON.parse(data));
    });
  }, []);

  // Persist cart
  useEffect(() => {
    AsyncStorage.setItem('foodgenie_cart', JSON.stringify(cart));
  }, [cart]);

  const loadFromDB = async (userId: string) => {
    try {
      const [dbPrefs, dbBehavior] = await Promise.all([
        loadPreferences(userId),
        loadBehavior(userId),
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
      setPrefsLoaded(true);
    }
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  };

  const syncPreferencesToDB = async (overrides?: Partial<UserPreferences>) => {
    if (!user?.id) return;
    const merged = overrides ? { ...preferences, ...overrides } : preferences;
    await savePreferences(user.id, {
      diet: merged.diet,
      budget_min: merged.budgetMin,
      budget_max: merged.budgetMax,
      spice_level: merged.spiceLevel,
      mode: merged.mode,
      onboarding_complete: merged.onboardingComplete,
      session_count: merged.sessionCount,
    });
  };

  const recordIgnoredBestMatch = async (): Promise<number> => {
    if (!user?.id) return 0;
    const count = await trackIgnoredBestMatch(user.id);
    const updated = await loadBehavior(user.id);
    if (updated) setBehavior(updated);
    return count;
  };

  const resetIgnored = async () => {
    if (!user?.id) return;
    await resetIgnoredCount(user.id);
    const updated = await loadBehavior(user.id);
    if (updated) setBehavior(updated);
  };

  const recordSpiceChoice = async (level: number): Promise<{ contradictions: number }> => {
    if (!user?.id) return { contradictions: 0 };
    const result = await trackSpiceChoice(user.id, level);
    const updated = await loadBehavior(user.id);
    if (updated) setBehavior(updated);
    return { contradictions: result.contradictions };
  };

  const updateMode = async (mode: 'quick' | 'guided') => {
    updatePreferences({ mode });
    if (!user?.id) return;
    await savePreferences(user.id, { mode });
    await saveBehavior(user.id, { preferred_mode: mode });
  };

  const incrementSession = async (): Promise<number> => {
    if (!user?.id) return 0;
    const count = await incrementSessionCount(user.id);
    setPreferences(prev => ({ ...prev, sessionCount: count }));
    return count;
  };

  const addToCart = (dish: Dish, addons: string[] = []) => {
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
  };

  const removeFromCart = (dishId: string) => {
    setCart(prev => prev.filter(item => item.dish.id !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(dishId); return; }
    setCart(prev => prev.map(item => item.dish.id === dishId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

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
