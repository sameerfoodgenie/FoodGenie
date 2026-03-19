import React, { createContext, useState, useCallback, ReactNode } from 'react';

export type MealSource = 'home_cooked' | 'restaurant' | 'online_order';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  name: string;
  healthScore: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  insight: string;
  imageUri: string | null;
  timestamp: number;
  source?: MealSource;
  mealType?: MealType;
  restaurantName?: string;
  platform?: string;
  tags?: string[];
}

interface MealContextType {
  todayMeals: MealEntry[];
  addMeal: (meal: MealEntry) => void;
  removeMeal: (id: string) => void;
  dailyScore: number;
  streak: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export const MealContext = createContext<MealContextType | undefined>(undefined);

export function MealProvider({ children }: { children: ReactNode }) {
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [streak, setStreak] = useState(3); // Simulated streak

  const addMeal = useCallback((meal: MealEntry) => {
    setTodayMeals(prev => [meal, ...prev]);
  }, []);

  const removeMeal = useCallback((id: string) => {
    setTodayMeals(prev => prev.filter(m => m.id !== id));
  }, []);

  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = todayMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = todayMeals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = todayMeals.reduce((s, m) => s + m.fat, 0);

  const dailyScore = todayMeals.length > 0
    ? Math.round(todayMeals.reduce((s, m) => s + m.healthScore, 0) / todayMeals.length)
    : 0;

  return (
    <MealContext.Provider
      value={{
        todayMeals,
        addMeal,
        removeMeal,
        dailyScore,
        streak,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      }}
    >
      {children}
    </MealContext.Provider>
  );
}
