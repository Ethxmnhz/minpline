import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, startOfDay } from 'date-fns';
import { Meal, MealTemplate, Workout, Goals, MealInput, WorkoutInput } from '../types';
import { nanoid } from '../util/id';

export interface TrackerState {
  today: Date;
  goals: Goals;
  meals: Meal[];
  workouts: Workout[];
  mealTemplates: MealTemplate[];
  workoutSets: Record<string, { pushups: number; pullups: number; legs: number; }>;
  cloudEnabled: boolean;
  cloudStatus: 'idle'|'syncing'|'error'|'disabled';
  lastSync: number | null;
  cloudError?: string | null;
  setToday: (d: Date) => void;
  addMeal: (m: Meal) => void;
  addWorkout: (w: Workout) => void;
  saveMealTemplate: (t: MealTemplate) => void;
  removeMeal: (id: string) => void;
  removeWorkout: (id: string) => void;
  updateMeal: (id: string, data: Partial<Meal>) => void;
  updateWorkout: (id: string, data: Partial<Workout>) => void;
  setGoals: (g: Goals) => void;
  totalsForDate: (d: Date) => {
    meals: Meal[];
    workouts: Workout[];
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    workoutCalories: number;
  };
  quickAddTemplate: (templateId: string) => void;
  bulkAddMeals: (inputs: MealInput[]) => void;
  addFromTemplateWithMultiplier: (templateId: string, multiplier: number) => void;
  setWorkoutSetCount: (date: Date, kind: 'pushups'|'pullups'|'legs', count: number) => void;
  enableCloud: (v: boolean) => void;
  markSyncing: () => void;
  markSynced: () => void;
  markSyncError: () => void;
  setCloudError: (msg: string|null) => void;
  exportData: () => any;
  importData: (data: any) => void;
}

const todayStart = () => startOfDay(new Date());
const workoutKey = (date: Date) => startOfDay(date).toISOString().replace(/\..+Z$/, 'Z').replace(/\./g,'_');

export const useStore = create<TrackerState>()(persist((set, get) => ({
  today: todayStart(),
  goals: { calories: 2200, protein: 160, carbs: 230, fats: 70 },
  meals: [],
  workouts: [],
  mealTemplates: [],
  workoutSets: {},
  cloudEnabled: false,
  cloudStatus: 'disabled',
  lastSync: null,
  cloudError: null,
  setToday: (d) => set({ today: startOfDay(d) }),
  addMeal: (m) => set(s => ({ meals: [...s.meals, m] })),
  addWorkout: (w) => set(s => ({ workouts: [...s.workouts, w] })),
  saveMealTemplate: (t) => set(s => ({ mealTemplates: [...s.mealTemplates.filter(x=>x.name!==t.name), t] })),
  removeMeal: (id) => set(s => ({ meals: s.meals.filter(m => m.id !== id) })),
  removeWorkout: (id) => set(s => ({ workouts: s.workouts.filter(w => w.id !== id) })),
  updateMeal: (id, data) => set(s => ({ meals: s.meals.map(m => m.id === id ? { ...m, ...data, id: m.id } : m) })),
  updateWorkout: (id, data) => set(s => ({ workouts: s.workouts.map(w => w.id === id ? { ...w, ...data, id: w.id } : w) })),
  setGoals: (g) => set({ goals: g }),
  totalsForDate: (d) => {
    const day = startOfDay(d).toISOString();
    const meals = get().meals.filter(m => startOfDay(new Date(m.date)).toISOString() === day);
    const workouts = get().workouts.filter(w => startOfDay(new Date(w.date)).toISOString() === day);
    const calories = meals.reduce((a,b)=>a+b.calories,0);
    const protein = meals.reduce((a,b)=>a+b.protein,0);
    const carbs = meals.reduce((a,b)=>a+b.carbs,0);
    const fats = meals.reduce((a,b)=>a+b.fats,0);
    const workoutCalories = workouts.reduce((a,b)=>a+b.calories,0);
    return { meals, workouts, calories, protein, carbs, fats, workoutCalories };
  },
  quickAddTemplate: (templateId) => {
    const t = get().mealTemplates.find(t=>t.id===templateId);
    if (!t) return;
  get().addMeal({ ...t, id: nanoid(), date: new Date().toISOString() });
  },
  bulkAddMeals: (inputs) => set(s => ({ meals: [...s.meals, ...inputs.map(i => ({ id: nanoid(), date: new Date().toISOString(), ...i }))] })),
  addFromTemplateWithMultiplier: (templateId, multiplier) => {
    const t = get().mealTemplates.find(t=>t.id===templateId);
    if (!t) return;
    const scaled: Meal = { id: nanoid(), date: new Date().toISOString(), name: t.name, calories: Math.round(t.calories*multiplier), protein: Math.round(t.protein*multiplier), carbs: Math.round(t.carbs*multiplier), fats: Math.round(t.fats*multiplier) };
    get().addMeal(scaled);
  },
  setWorkoutSetCount: (date, kind, count) => set(s => {
    const key = workoutKey(date);
    const existing = s.workoutSets[key] || { pushups:0, pullups:0, legs:0 };
    return { workoutSets: { ...s.workoutSets, [key]: { ...existing, [kind]: count } } };
  }),
  enableCloud: (v) => set(s => ({ cloudEnabled: v, cloudStatus: v ? 'idle' : 'disabled' })),
  markSyncing: () => set({ cloudStatus: 'syncing' }),
  markSynced: () => set({ cloudStatus: 'idle', lastSync: Date.now() }),
  markSyncError: () => set({ cloudStatus: 'error' }),
  setCloudError: (msg) => set({ cloudError: msg }),
  exportData: () => {
    const s = get();
    return {
      version: 1,
      goals: s.goals,
      meals: s.meals,
      workouts: s.workouts,
      mealTemplates: s.mealTemplates,
      workoutSets: s.workoutSets
    };
  },
  importData: (data: any) => {
    if (!data || typeof data !== 'object') return;
    set(s => ({
      goals: data.goals || s.goals,
      meals: Array.isArray(data.meals) ? data.meals : s.meals,
      workouts: Array.isArray(data.workouts) ? data.workouts : s.workouts,
      mealTemplates: Array.isArray(data.mealTemplates) ? data.mealTemplates : s.mealTemplates,
      workoutSets: data.workoutSets || s.workoutSets
    }));
  }
}), { name: 'tracker-store-v1',
  migrate: (persisted: any) => {
    if (persisted && persisted.today && typeof persisted.today === 'string') {
      try { persisted.today = new Date(persisted.today); } catch {}
    }
    // migrate workoutSets keys to safe form (remove dots/millis)
    if (persisted && persisted.workoutSets && typeof persisted.workoutSets === 'object') {
      const updated: Record<string, any> = {};
      for (const [k,v] of Object.entries(persisted.workoutSets)) {
        if (!k) continue;
        const safe = k.replace(/\..+Z$/, 'Z').replace(/\./g,'_');
        updated[safe] = v;
      }
      persisted.workoutSets = updated;
    }
    return persisted;
  }
}));
