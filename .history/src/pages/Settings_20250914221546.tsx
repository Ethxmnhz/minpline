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

  const save = () => {
    setGoals(draft);
  };

  return (
    <div className="page">
      <h1>Settings</h1>
      <div className="card form-grid">
        <input type="number" placeholder="Calories" value={draft.calories} onChange={e=>setDraft(d=>({...d,calories:+e.target.value}))} />
        <input type="number" placeholder="Protein" value={draft.protein} onChange={e=>setDraft(d=>({...d,protein:+e.target.value}))} />
        <input type="number" placeholder="Carbs" value={draft.carbs} onChange={e=>setDraft(d=>({...d,carbs:+e.target.value}))} />
        <input type="number" placeholder="Fats" value={draft.fats} onChange={e=>setDraft(d=>({...d,fats:+e.target.value}))} />
        <button className="btn primary" onClick={save}>Save</button>
      </div>
      <div className="card" style={{marginTop:16}}>
        <h2 style={{marginTop:0, fontSize:'1rem'}}>Cloud Sync (Firebase)</h2>
        <label style={{display:'flex', alignItems:'center', gap:8, fontSize:'.85rem'}}>
          <input type="checkbox" checked={cloudEnabled} onChange={e=>enableCloud(e.target.checked)} /> Enable sync
        </label>
        <div className="small" style={{marginTop:6, opacity:.7}}>
          Status: {cloudStatus}{lastSync && cloudStatus!=='syncing' ? ` • Last ${new Date(lastSync).toLocaleTimeString()}` : ''}
        </div>
        <p className="small" style={{opacity:.6}}>Anonymous auth; data stored under your browser's generated UID. Disable to keep everything local only.</p>
      </div>
    </div>
  );
};
