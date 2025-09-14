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
  const clean = query.trim();
  // Avoid 400 on too-short single words; require at least 2 chars or a space
  if (!clean || clean.length < 2) return [];
  try {
    const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { headers: { 'X-Api-Key': key } });
    if (!res.ok) {
      if (res.status === 400) console.warn('Nutrition API error 400 (bad query):', clean);
      else if (res.status === 401 || res.status === 403) console.warn('Nutrition API auth error (check key)');
      else if (res.status === 429) console.warn('Nutrition API rate limit reached');
      else console.warn('Nutrition API error', res.status);
      return [];
    }
    const data: any = await res.json();
    if (Array.isArray(data)) return data as RemoteNutritionItem[];
    if (data && Array.isArray(data.items)) return data.items as RemoteNutritionItem[];
    return [];
  } catch (e) {
    console.error('Nutrition fetch failed', e);
    return [];
  }
}
