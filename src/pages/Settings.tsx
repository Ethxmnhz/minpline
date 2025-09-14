import React, { useState } from 'react';
import { useStore } from '../state/store';

export const Settings: React.FC = () => {
  const goals = useStore(s => s.goals);
  const setGoals = useStore(s => s.setGoals);
  const [draft, setDraft] = useState(goals);
  const cloudStatus = useStore(s => s.cloudStatus);
  const lastSync = useStore(s => s.lastSync);
  const cloudError = useStore(s => s.cloudError);
  const nutritionApiEnabled = useStore(s => s.nutritionApiEnabled);
  const setNutritionApiEnabled = useStore(s => s.setNutritionApiEnabled);
  // syncKey deprecated in global mode

  const save = () => {
    setGoals(draft);
  };

  return (
    <div className="page">
      <h1>Settings</h1>
      <div className="card form-grid">
  <input type="number" placeholder="Calories" value={draft.calories} onChange={e=>setDraft((d: typeof goals)=>({...d,calories:+e.target.value}))} />
  <input type="number" placeholder="Protein" value={draft.protein} onChange={e=>setDraft((d: typeof goals)=>({...d,protein:+e.target.value}))} />
  <input type="number" placeholder="Carbs" value={draft.carbs} onChange={e=>setDraft((d: typeof goals)=>({...d,carbs:+e.target.value}))} />
  <input type="number" placeholder="Fats" value={draft.fats} onChange={e=>setDraft((d: typeof goals)=>({...d,fats:+e.target.value}))} />
        <button className="btn primary" onClick={save}>Save</button>
      </div>
      <div className="card" style={{marginTop:16}}>
        <h2 style={{marginTop:0, fontSize:'1rem'}}>Global Data</h2>
        <div className="small" style={{marginTop:4}}>
          Status: {cloudStatus}{lastSync && cloudStatus!=='syncing' ? ` • Last ${new Date(lastSync).toLocaleTimeString()}` : ''}
        </div>
        {cloudError && <div className="small" style={{color:'#f87171', marginTop:6}}>{cloudError}</div>}
        <p className="small" style={{opacity:.65, marginTop:6}}>
          Your entries now save to a single shared database path. Any device opening this app sees the same meals, workouts, and goals. Avoid entering private data. Changes propagate automatically within a few seconds.
        </p>
      </div>
      <div className="card" style={{marginTop:16}}>
        <h2 style={{marginTop:0, fontSize:'1rem'}}>Nutrition API</h2>
        <label style={{display:'flex', alignItems:'center', gap:8, fontSize:'.85rem'}}>
          <input type="checkbox" checked={nutritionApiEnabled} onChange={e=>setNutritionApiEnabled(e.target.checked)} /> Enable remote nutrition search
        </label>
        <p className="small" style={{opacity:.65, marginTop:6}}>When disabled, only local food database results are shown (saves API quota and avoids network). Re-enable anytime.</p>
      </div>
    </div>
  );
};
