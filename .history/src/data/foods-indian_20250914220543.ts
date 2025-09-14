// Minimal in-app dataset for common Indian foods (per 100g / standard unit)
// Values approximate; you can expand or adjust.
export interface FoodItem { id: string; name: string; unit: string; gramsPerUnit: number; calories: number; protein: number; carbs: number; fats: number; }

export const foods: FoodItem[] = [
  { id: 'rice-white', name: 'Rice (White, cooked)', unit: 'cup', gramsPerUnit: 158, calories: 205, protein: 4.3, carbs: 44.5, fats: 0.4 },
  { id: 'rice-brown', name: 'Rice (Brown, cooked)', unit: 'cup', gramsPerUnit: 195, calories: 216, protein: 5.0, carbs: 44.8, fats: 1.8 },
  { id: 'roti', name: 'Roti (Chapati, 40g dough)', unit: 'piece', gramsPerUnit: 35, calories: 120, protein: 3.1, carbs: 18.0, fats: 3.2 },
  { id: 'dal', name: 'Dal (Cooked Lentils)', unit: 'cup', gramsPerUnit: 198, calories: 230, protein: 17.0, carbs: 40.0, fats: 1.0 },
  { id: 'chicken-curry', name: 'Chicken Curry (lean)', unit: 'cup', gramsPerUnit: 200, calories: 280, protein: 28, carbs: 8, fats: 14 },
  { id: 'paneer', name: 'Paneer (Fresh)', unit: '100g', gramsPerUnit: 100, calories: 296, protein: 18.0, carbs: 6.1, fats: 22.0 },
  { id: 'curd', name: 'Curd (Dahi, low-fat)', unit: 'cup', gramsPerUnit: 245, calories: 154, protein: 13.0, carbs: 17.0, fats: 4.0 },
  { id: 'idli', name: 'Idli', unit: 'piece', gramsPerUnit: 39, calories: 58, protein: 2.0, carbs: 11.0, fats: 0.4 },
  { id: 'dosa', name: 'Dosa (Plain)', unit: 'piece', gramsPerUnit: 80, calories: 133, protein: 3.0, carbs: 18.0, fats: 5.0 },
  { id: 'poha', name: 'Poha', unit: 'cup', gramsPerUnit: 160, calories: 250, protein: 5.0, carbs: 45.0, fats: 7.0 },
  { id: 'upma', name: 'Upma', unit: 'cup', gramsPerUnit: 245, calories: 220, protein: 6.0, carbs: 40.0, fats: 6.0 },
  { id: 'sambar', name: 'Sambar', unit: 'cup', gramsPerUnit: 200, calories: 150, protein: 6.0, carbs: 22.0, fats: 4.0 },
  { id: 'rajma', name: 'Rajma (Kidney Bean Curry)', unit: 'cup', gramsPerUnit: 200, calories: 240, protein: 15.0, carbs: 34.0, fats: 5.0 },
  { id: 'chole', name: 'Chole (Chickpea Curry)', unit: 'cup', gramsPerUnit: 200, calories: 270, protein: 13.0, carbs: 35.0, fats: 8.0 },
  { id: 'egg-boiled', name: 'Egg (Boiled)', unit: 'piece', gramsPerUnit: 50, calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3 },
  { id: 'banana', name: 'Banana (Medium)', unit: 'piece', gramsPerUnit: 118, calories: 105, protein: 1.3, carbs: 27.0, fats: 0.4 },
  { id: 'apple', name: 'Apple (Medium)', unit: 'piece', gramsPerUnit: 182, calories: 95, protein: 0.5, carbs: 25.0, fats: 0.3 },
  { id: 'almonds', name: 'Almonds', unit: '10 nuts', gramsPerUnit: 12, calories: 70, protein: 2.6, carbs: 2.5, fats: 6.1 },
  { id: 'milk-250', name: 'Milk (Low-fat)', unit: 'cup', gramsPerUnit: 244, calories: 102, protein: 8.2, carbs: 12.0, fats: 2.4 },
];

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 20);
}

export function scaleFood(f: FoodItem, grams: number) {
  const ratio = grams / f.gramsPerUnit;
  return {
    calories: Math.round(f.calories * ratio),
    protein: +(f.protein * ratio).toFixed(1),
    carbs: +(f.carbs * ratio).toFixed(1),
    fats: +(f.fats * ratio).toFixed(1)
  };
}
