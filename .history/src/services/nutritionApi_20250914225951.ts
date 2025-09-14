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

// In-flight dedupe map
const inFlight: Record<string, Promise<RemoteNutritionItem[]>> = {};
let lastCall = 0;
const MIN_INTERVAL = 600; // ms between network calls

export async function fetchNutrition(query: string, opts?: { cacheGet?: (q:string)=>any[]|null; cacheSet?: (q:string, items:any[])=>void; onCall?: ()=>void; onHit?: ()=>void }): Promise<RemoteNutritionItem[]> {
  const key = import.meta.env.VITE_NUTRITION_API_KEY;
  if (!key) {
    console.warn('Nutrition API key missing (VITE_NUTRITION_API_KEY).');
    return [];
  }
  // Sanitize: remove backslashes and collapse excess whitespace
  const clean = query.replace(/\\/g,' ').replace(/\s+/g,' ').trim();
  // Avoid 400 on too-short / malformed queries; require at least 2 chars or a space
  if (!clean || clean.length < 2) return [];
  const cacheKey = clean.toLowerCase();
  if (opts?.cacheGet) {
    const cached = opts.cacheGet(cacheKey);
    if (cached) { opts.onHit && opts.onHit(); return cached as RemoteNutritionItem[]; }
  }
  if (inFlight[cacheKey]) return inFlight[cacheKey];
  const run = async () => {
    const since = Date.now() - lastCall;
    if (since < MIN_INTERVAL) {
      await new Promise(r => setTimeout(r, MIN_INTERVAL - since));
    }
    opts?.onCall && opts.onCall();
    lastCall = Date.now();
    try {
    const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { headers: { 'X-Api-Key': key } });
    if (!res.ok) {
      if (res.status === 400) console.warn('Nutrition API error 400 (bad query):', clean);
      else if (res.status === 401 || res.status === 403) console.warn('Nutrition API auth error (check key)');
      else if (res.status === 429) console.warn('Nutrition API rate limit reached');
      else console.warn('Nutrition API error', res.status);
      return [] as RemoteNutritionItem[];
    }
    const data: any = await res.json();
    const items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
    if (opts?.cacheSet) opts.cacheSet(cacheKey, items);
    return items as RemoteNutritionItem[];
  } catch (e) {
      console.error('Nutrition fetch failed', e);
      return [] as RemoteNutritionItem[];
    } finally {
      delete inFlight[cacheKey];
    }
  };
  inFlight[cacheKey] = run();
  return inFlight[cacheKey];
}
