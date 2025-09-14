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
  nutritionApiEnabled: boolean;
  cloudEnabled: boolean;
  cloudStatus: 'idle'|'syncing'|'error'|'disabled';
  lastSync: number | null;
  cloudError?: string | null;
  syncKey?: string | null;
  // Monotonic incrementing number used for conflict resolution in global sync.
  // Any local mutation that changes user data MUST bump revision by +1.
  revision: number;
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
  setNutritionApiEnabled: (v: boolean) => void;
  enableCloud: (v: boolean) => void;
  markSyncing: () => void;
  markSynced: () => void;
  markSyncError: () => void;
  setCloudError: (msg: string|null) => void;
  setSyncKey: (k: string|null) => void;
  exportData: () => any;
  importData: (data: any) => void;
}

const todayStart = () => startOfDay(new Date());
const workoutKey = (date: Date) => {
  const d = startOfDay(date);
  return d.toISOString().slice(0,10); // YYYY-MM-DD
};

export const useStore = create<TrackerState>()(persist((set, get) => ({
  today: todayStart(),
  goals: { calories: 2200, protein: 160, carbs: 230, fats: 70 },
  meals: [],
  workouts: [],
  mealTemplates: [],
  workoutSets: {},
  nutritionApiEnabled: true,
  cloudEnabled: true,
  cloudStatus: 'idle',
  lastSync: null,
  cloudError: null,
  syncKey: null,
  revision: 0,
  setToday: (d) => set({ today: startOfDay(d) }),
  addMeal: (m) => set(s => ({ meals: [...s.meals, m], revision: s.revision + 1 })),
  addWorkout: (w) => set(s => ({ workouts: [...s.workouts, w], revision: s.revision + 1 })),
  saveMealTemplate: (t) => set(s => ({ mealTemplates: [...s.mealTemplates.filter(x=>x.name!==t.name), t], revision: s.revision + 1 })),
  removeMeal: (id) => set(s => ({ meals: s.meals.filter(m => m.id !== id), revision: s.revision + 1 })),
  removeWorkout: (id) => set(s => ({ workouts: s.workouts.filter(w => w.id !== id), revision: s.revision + 1 })),
  updateMeal: (id, data) => set(s => ({ meals: s.meals.map(m => m.id === id ? { ...m, ...data, id: m.id } : m), revision: s.revision + 1 })),
  updateWorkout: (id, data) => set(s => ({ workouts: s.workouts.map(w => w.id === id ? { ...w, ...data, id: w.id } : w), revision: s.revision + 1 })),
  setGoals: (g) => set(s => ({ goals: g, revision: s.revision + 1 })),
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
    get().addMeal(scaled); // addMeal already bumps revision
  },
  setWorkoutSetCount: (date, kind, count) => set(s => {
    const key = workoutKey(date);
    const existing = s.workoutSets[key] || { pushups:0, pullups:0, legs:0 };
    const updated = { ...s.workoutSets, [key]: { ...existing, [kind]: count } };
    // Only bump revision if value actually changed
    if (existing[kind] === count) return { workoutSets: s.workoutSets } as any;
    return { workoutSets: updated, revision: s.revision + 1 };
  }),
  setNutritionApiEnabled: (v) => set(s => ({ nutritionApiEnabled: v, revision: s.revision + 1 })),
  enableCloud: (v) => set(s => ({ cloudEnabled: v, cloudStatus: v ? 'idle' : 'disabled' })),
  markSyncing: () => set({ cloudStatus: 'syncing' }),
  markSynced: () => set({ cloudStatus: 'idle', lastSync: Date.now() }),
  markSyncError: () => set({ cloudStatus: 'error' }),
  setCloudError: (msg) => set({ cloudError: msg }),
  setSyncKey: (k) => set({ syncKey: k }),
  exportData: () => {
    const s = get();
    const sanitizeMap = (obj: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [k,v] of Object.entries(obj||{})) {
        // convert any legacy ISO key to YYYY-MM-DD
        const safe = k.includes('T') ? k.slice(0,10) : k;
        out[safe] = v;
      }
      return out;
    };
    const workoutSets = sanitizeMap(s.workoutSets);
    if (workoutSets !== s.workoutSets) {
      // update in-memory state with sanitized keys to keep future exports clean
      set({ workoutSets });
    }
    return {
  version: 6,
      goals: s.goals,
      meals: s.meals,
      workouts: s.workouts,
      mealTemplates: s.mealTemplates,
      workoutSets,
      nutritionApiEnabled: s.nutritionApiEnabled,
      syncKey: s.syncKey || null,
      revision: s.revision
    };
  },
  importData: (data: any) => {
    if (!data || typeof data !== 'object') return;
    const sanitizeMap = (obj: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [k,v] of Object.entries(obj||{})) {
        const safe = k.includes('T') ? k.slice(0,10) : k;
        out[safe] = v;
      }
      return out;
    };
    set(s => ({
      goals: data.goals || s.goals,
      meals: Array.isArray(data.meals) ? data.meals : s.meals,
      workouts: Array.isArray(data.workouts) ? data.workouts : s.workouts,
      mealTemplates: Array.isArray(data.mealTemplates) ? data.mealTemplates : s.mealTemplates,
      workoutSets: sanitizeMap(data.workoutSets || s.workoutSets),
      nutritionApiEnabled: typeof data.nutritionApiEnabled === 'boolean' ? data.nutritionApiEnabled : (s as any).nutritionApiEnabled ?? true,
      syncKey: typeof data.syncKey === 'string' && data.syncKey.trim() ? data.syncKey.trim().replace(/[.#$\[\]]/g,'_').slice(0,40) : (s as any).syncKey || null,
      revision: typeof data.revision === 'number' ? data.revision : s.revision
    }));
  }
}), { name: 'tracker-store-v1',
  version: 6,
  migrate: (persisted: any) => {
    if (persisted && persisted.today && typeof persisted.today === 'string') {
      try { persisted.today = new Date(persisted.today); } catch {}
    }
    // migrate workoutSets keys to safe form (remove dots/millis)
    if (persisted && persisted.workoutSets && typeof persisted.workoutSets === 'object') {
      const updated: Record<string, any> = {};
      for (const [k,v] of Object.entries(persisted.workoutSets)) {
        if (!k) continue;
        const safe = k.includes('T') ? k.slice(0,10) : k.replace(/\./g,'_');
        updated[safe] = v;
      }
      persisted.workoutSets = updated;
    }
    if (typeof persisted.nutritionApiEnabled !== 'boolean') {
      persisted.nutritionApiEnabled = true;
    }
    if (!('syncKey' in persisted)) persisted.syncKey = null;
    // Force enable cloud sync globally from v5 onward
    persisted.cloudEnabled = true;
    persisted.cloudStatus = 'idle';
    if (typeof persisted.revision !== 'number') persisted.revision = 0; // initialize revision if missing
    return persisted;
  }
}));
