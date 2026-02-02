import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockDishes, mockRestaurants, Dish, Restaurant, ChatMessage, initialChatMessages } from '../services/mockData';

interface UserPreferences {
  diet: 'veg' | 'egg' | 'nonveg' | null;
  budget: number;
  spiceLevel: number;
  allergies: string[];
  onboardingComplete: boolean;
  // Optional health data
  height?: number; // in cm
  weight?: number; // in kg
  dateOfBirth?: string;
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
  
  // Cart
  cart: CartItem[];
  addToCart: (dish: Dish, addons?: string[]) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  
  // Recommendations
  recommendations: Dish[];
  setRecommendations: (dishes: Dish[]) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  
  // Decision flow
  decisionMode: 'dishes' | 'restaurants' | null;
  setDecisionMode: (mode: 'dishes' | 'restaurants' | null) => void;
  
  // App state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Data
  allDishes: Dish[];
  allRestaurants: Restaurant[];
}

const defaultPreferences: UserPreferences = {
  diet: null,
  budget: 300,
  spiceLevel: 2,
  allergies: [],
  onboardingComplete: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<Dish[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [decisionMode, setDecisionMode] = useState<'dishes' | 'restaurants' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from storage
  useEffect(() => {
    AsyncStorage.getItem('foodgenie_preferences').then(data => {
      if (data) {
        setPreferences(JSON.parse(data));
      }
    });
    AsyncStorage.getItem('foodgenie_cart').then(data => {
      if (data) {
        setCart(JSON.parse(data));
      }
    });
  }, []);

  // Persist preferences
  useEffect(() => {
    AsyncStorage.setItem('foodgenie_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Persist cart
  useEffect(() => {
    AsyncStorage.setItem('foodgenie_cart', JSON.stringify(cart));
  }, [cart]);

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
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
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.dish.id === dishId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  return (
    <AppContext.Provider
      value={{
        preferences,
        updatePreferences,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        recommendations,
        setRecommendations,
        chatMessages,
        addChatMessage,
        decisionMode,
        setDecisionMode,
        isLoading,
        setIsLoading,
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
