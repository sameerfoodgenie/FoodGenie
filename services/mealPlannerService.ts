import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface MealItem {
  type: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  prepTime?: number;
  emoji?: string;
  ingredients?: string[];
  tip?: string;
}

export interface TodayPlan {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: MealItem[];
}

export interface WeeklyDay {
  day: string;
  totalCalories: number;
  meals: MealItem[];
}

export interface WeeklyPlan {
  weekStart: string;
  weekEnd: string;
  avgDailyCalories: number;
  days: WeeklyDay[];
}

export interface MonthlyWeek {
  weekNumber: number;
  theme: string;
  dailyCalorieTarget: number;
  estimatedWeeklyCost: number;
  highlights: { day: string; mealType: string; name: string; calories: number; emoji: string }[];
  nutritionFocus: string;
}

export interface MonthlyPlan {
  month: string;
  avgDailyCalories: number;
  totalEstimatedCost: number;
  weeks: MonthlyWeek[];
}

export interface UserMealPreferences {
  diet?: string | null;
  budgetMin?: number;
  budgetMax?: number;
  spiceLevel?: number;
  healthGoal?: string | null;
  cuisineBias?: string[];
  avoidTags?: string[];
  persons?: number;
}

function extractJSON(text: string): string {
  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

export async function generateMealPlan(
  preferences: UserMealPreferences,
  planType: 'today' | 'weekly' | 'monthly',
  persons?: number,
): Promise<{ data: any; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
      body: {
        action: 'generate_meal_plan',
        preferences: { ...preferences, planType, persons: persons || preferences.persons || 1 },
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const textContent = await error.context?.text();
          errorMessage = textContent || error.message;
        } catch { /* ignore */ }
      }
      return { data: null, error: errorMessage };
    }

    const content = data?.content || '';
    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return { data: parsed, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to generate meal plan' };
  }
}

export async function sendMealChat(
  message: string,
  preferences: UserMealPreferences,
  history: { role: string; content: string }[],
): Promise<{ data: string | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
      body: {
        action: 'chat',
        message,
        preferences,
        history,
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const textContent = await error.context?.text();
          errorMessage = textContent || error.message;
        } catch { /* ignore */ }
      }
      return { data: null, error: errorMessage };
    }

    return { data: data?.content || '', error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to send message' };
  }
}
