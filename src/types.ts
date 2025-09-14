export interface MealBase { name: string; calories: number; protein: number; carbs: number; fats: number; }
export interface Meal extends MealBase { id: string; date: string; }
export interface Workout { id: string; date: string; type: string; calories: number; }
export interface MealTemplate extends MealBase { id: string; }
export interface Goals { calories: number; protein: number; carbs: number; fats: number; }
export type MealInput = MealBase;
export type WorkoutInput = { type: string; calories: number; };
