import React, { useState } from 'react';
import { useStore } from '../state/store';
import { WorkoutInput } from '../types';
import { nanoid } from '../util/id';

const empty: WorkoutInput = { type: '', calories: 0 };

export const Workouts: React.FC = () => {
  const rawToday = useStore(s => s.today);
  const today = rawToday instanceof Date ? rawToday : new Date(rawToday as any);
  const addWorkout = useStore(s => s.addWorkout);
  const updateWorkout = useStore(s => s.updateWorkout);
  const removeWorkout = useStore(s => s.removeWorkout);
  const [form, setForm] = useState<WorkoutInput>(empty);
  const totals = useStore(s => s.totalsForDate(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<WorkoutInput>(empty);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type.trim()) return;
    addWorkout({ id: nanoid(), date: today.toISOString(), ...form });
    setForm(empty);
  };

  const setWorkoutSetCount = useStore(s => s.setWorkoutSetCount);
  const workoutSets = useStore(s => s.workoutSets);
  // Store now normalizes keys to YYYY-MM-DD
  const dayKey = today.toISOString().slice(0,10);
  const record = workoutSets[dayKey] || { pushups:0, pullups:0, legs:0 };
  const plan = { pushups:6, pullups:6, legs:4 };
  const kinds: Array<{k: 'pushups'|'pullups'|'legs'; label: string; total: number}> = [
    { k:'pushups', label:'Pushups', total: plan.pushups },
    { k:'pullups', label:'Pull Ups', total: plan.pullups },
    { k:'legs', label:'Legs', total: plan.legs },
  ];

  const toggleSet = (kind: 'pushups'|'pullups'|'legs', idx: number) => {
    const current = record[kind];
    // If clicking a completed set (i < current) reduce to that index, else advance to include this set.
    const newCount = (idx + 1) === current ? idx : (idx < current ? idx : idx + 1);
    setWorkoutSetCount(today, kind, newCount);
  };

  return (
    <div className="page">
      <h1>Workouts</h1>
      <form onSubmit={onSubmit} className="card form-grid">
  <input placeholder="Type" value={form.type} onChange={e=>setForm((f: WorkoutInput)=>({...f,type:e.target.value}))} />
  <input type="number" placeholder="Calories" value={form.calories||''} onChange={e=>setForm((f: WorkoutInput)=>({...f,calories:+e.target.value}))} />
        <button type="submit" className="btn primary">Add</button>
      </form>

      <section>
        <h2>Today</h2>
        <ul className="list">
          {totals.workouts.map(w => (
            <li key={w.id} style={{display:'flex', flexDirection:'column', gap:4}}>
              {editingId === w.id ? (
                <div className="card" style={{margin:0, background:'#1d2730'}}>
                  <input value={editDraft.type} onChange={e=>setEditDraft((d: WorkoutInput)=>({...d,type:e.target.value}))} />
                  <input type="number" value={editDraft.calories||''} onChange={e=>setEditDraft((d: WorkoutInput)=>({...d,calories:+e.target.value}))} />
                  <div className="row gap" style={{marginTop:6}}>
                    <button className="btn primary tiny" onClick={()=>{ if(editDraft.type.trim()){ updateWorkout(w.id,{...editDraft}); setEditingId(null);} }}>Save</button>
                    <button className="btn tiny" onClick={()=>setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>{w.type} <span className="small">-{w.calories} kcal</span></div>
                  <div className="row gap">
                    <button className="btn tiny" onClick={()=>{ setEditingId(w.id); setEditDraft({ type: w.type, calories: w.calories }); }}>Edit</button>
                    <button className="btn tiny" onClick={()=>removeWorkout(w.id)}>Del</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Planned Sets</h2>
        <div className="card" style={{display:'flex', flexDirection:'column', gap:12}}>
          {kinds.map(group => (
            <div key={group.k}>
              <div style={{fontSize:'.8rem', marginBottom:4}}>{group.label} ({record[group.k]}/{group.total})</div>
              <div style={{display:'flex', gap:6}}>
                {Array.from({length: group.total}).map((_,i)=>(
                  <button
                    key={i}
                    type="button"
                    onClick={()=>toggleSet(group.k, i)}
                    className="btn tiny"
                    style={{
                      flex:1,
                      background: i < record[group.k] ? 'var(--color-accent)' : 'var(--color-surface-alt)',
                      border: i < record[group.k] ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                      color: i < record[group.k] ? '#fff' : 'var(--color-text-dim)',
                      transition:'background 160ms, transform 140ms',
                      fontWeight:600
                    }}
                  >{i+1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
