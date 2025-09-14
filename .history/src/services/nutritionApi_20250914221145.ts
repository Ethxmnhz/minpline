// External Nutrition API service (API Ninjas / CalorieNinjas compatible)
// We do not hard-code the key; user must set VITE_NUTRITION_API_KEY in .env file.
// Fallback: returns empty array on error.

export interface RemoteNutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  serving_size_g: number;
}

export async function fetchNutrition(query: string): Promise<RemoteNutritionItem[]> {
  const key = import.meta.env.VITE_NUTRITION_API_KEY;
  if (!key) {
    console.warn('Nutrition API key missing (VITE_NUTRITION_API_KEY).');
    return [];
  }
  if (!query.trim()) return [];
  try {
    const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'X-Api-Key': key } });
    if (!res.ok) {
      console.warn('Nutrition API error', res.status);
      return [];
    }
    const data: any = await res.json();
    // API Ninjas returns array directly; CalorieNinjas older form uses { items: [] }
    if (Array.isArray(data)) return data as RemoteNutritionItem[];
    if (data && Array.isArray(data.items)) return data.items as RemoteNutritionItem[];
    return [];
  } catch (e) {
    console.error('Nutrition fetch failed', e);
    return [];
  }
}
