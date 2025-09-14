import React, { useState } from 'react';
import { useStore } from '../state/store';

export const Settings: React.FC = () => {
  const goals = useStore(s => s.goals);
  const setGoals = useStore(s => s.setGoals);
  const [draft, setDraft] = useState(goals);
  const cloudEnabled = useStore(s => s.cloudEnabled);
  const enableCloud = useStore(s => s.enableCloud);
  const cloudStatus = useStore(s => s.cloudStatus);
  const lastSync = useStore(s => s.lastSync);
  const cloudError = useStore(s => s.cloudError);
  const nutritionApiEnabled = useStore(s => s.nutritionApiEnabled);
  const setNutritionApiEnabled = useStore(s => s.setNutritionApiEnabled);
  const syncKey = useStore(s => s.syncKey);
  const setSyncKey = useStore(s => s.setSyncKey);

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
        <h2 style={{marginTop:0, fontSize:'1rem'}}>Cloud Sync (Firebase)</h2>
        <label style={{display:'flex', alignItems:'center', gap:8, fontSize:'.85rem'}}>
          <input type="checkbox" checked={cloudEnabled} onChange={e=>enableCloud(e.target.checked)} /> Enable sync
        </label>
        <div className="row" style={{marginTop:8, gap:8, alignItems:'center'}}>
          <input style={{flex:1}} placeholder="Optional shared sync key" value={syncKey||''} onChange={e=>{
            const raw = e.target.value;
            const sanitized = raw.replace(/[.#$\[\]]/g,'_').slice(0,40);
            setSyncKey(sanitized || null);
          }} />
          <span className="small" style={{opacity:.6}}>Share this key across browsers/devices</span>
        </div>
        <div className="small" style={{marginTop:6, opacity:.7}}>
          Status: {cloudStatus}{lastSync && cloudStatus!=='syncing' ? ` • Last ${new Date(lastSync).toLocaleTimeString()}` : ''}
        </div>
        {cloudError && <div className="small" style={{color:'#f87171', marginTop:6}}>{cloudError}</div>}
        <p className="small" style={{opacity:.6}}>
          Anonymous auth by default creates a different internal ID per browser. To see the same data everywhere, enter a custom sync key above (e.g. your nickname). All devices with that key + sync enabled will share one dataset. Characters .#$[] are replaced with _.
          If you see an admin restriction error, enable Anonymous Auth in Firebase Console: Authentication → Sign-in method → Anonymous → Enable. Disable sync to keep everything local.
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
