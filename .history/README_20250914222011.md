# Personal Calorie & Exercise Tracker

Mobile-first React + TypeScript single-page app (no backend) for logging meals, tracking macros & workouts, and saving meal templates for quick add. Data is persisted in localStorage only (private to your browser).

## Features
- Daily meals logging (calories, protein, carbs, fats)
- Workout logging (type + calories burned)
- Saved meal templates (quick add to today)
- Food search (local Indian foods dataset) with gram-based auto macro calculation
- Goals (calories + macros) editable in Settings
- Dashboard with progress bars (net calories subtracting workout calories)
- Mobile nav bar / responsive layout
- Local persistence with Zustand + persist middleware
 - Daily workout set planner (Pushups 6, Pull Ups 6, Legs 4) with completion tracking
- Optional remote nutrition lookup (API Ninjas / CalorieNinjas) when API key provided
- Optional Firebase anonymous cloud sync (toggle in Settings)

## Tech Stack
- React 18 + TypeScript + Vite
- Zustand for state management
- date-fns for date helpers

## Development
Install dependencies and start dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Environment Variables
Create a `.env` file for remote nutrition (optional):

```
VITE_NUTRITION_API_KEY=your_api_ninjas_key
```

Example (do NOT commit real keys):

```
VITE_NUTRITION_API_KEY=YOUR_API_KEY_HERE
```

If omitted, the remote nutrition section will show a message and only local dataset works.

### Firebase Cloud Sync
Anonymous auth is used. Toggle Cloud Sync in Settings. Data stored at:
`/users/<uid>/trackerData` in Firebase Realtime Database.

Sync Strategy:
- On enable: fetch remote dataset; if empty remote -> push local.
- Live subscription merges remote (overwrite preference) then local edits debounce-push (1.5s).
- Disable sync: keeps local state; no remote writes.

NOTE: Firebase config in `src/services/firebase.ts` contains public keys (safe). Do not put secrets in frontend code.

## Data Model
See `src/types.ts` for TypeScript interfaces.

Store key: `tracker-store-v1` in `localStorage`.

## Future Ideas
- Macro auto-calculation from ingredients
- External nutrition API integration (e.g., Edamam, USDA) with caching
- Import/export JSON
- Streaks & charts
- PWA offline caching & install banner
- Dark/light theme toggle
 - Conflict resolution UI for cloud merges

## License
Personal use only (no redistribution implied).
