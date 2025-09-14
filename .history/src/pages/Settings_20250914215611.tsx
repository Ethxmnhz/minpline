import React, { useState } from 'react';
import { useStore } from '../state/store';

export const Settings: React.FC = () => {
  const goals = useStore(s => s.goals);
  const setGoals = useStore(s => s.setGoals);
  const [draft, setDraft] = useState(goals);

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
    </div>
  );
};
