import { useContext } from 'react';
import { MealContext } from '../contexts/MealContext';

export function useMeals() {
  const context = useContext(MealContext);
  if (!context) throw new Error('useMeals must be used within MealProvider');
  return context;
}
