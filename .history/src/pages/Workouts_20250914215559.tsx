import React, { useState } from 'react';
import { useStore } from '../state/store';
import { WorkoutInput } from '../types';
import { nanoid } from '../util/id';

const empty: WorkoutInput = { type: '', calories: 0 };

export const Workouts: React.FC = () => {
  const today = useStore(s => s.today);
  const addWorkout = useStore(s => s.addWorkout);
  const [form, setForm] = useState<WorkoutInput>(empty);
  const totals = useStore(s => s.totalsForDate(today));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type.trim()) return;
    addWorkout({ id: nanoid(), date: today.toISOString(), ...form });
    setForm(empty);
  };

  return (
    <div className="page">
      <h1>Workouts</h1>
      <form onSubmit={onSubmit} className="card form-grid">
        <input placeholder="Type" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} />
        <input type="number" placeholder="Calories" value={form.calories||''} onChange={e=>setForm(f=>({...f,calories:+e.target.value}))} />
        <button type="submit" className="btn primary">Add</button>
      </form>

      <section>
        <h2>Today</h2>
        <ul className="list">
          {totals.workouts.map(w => (
            <li key={w.id}>{w.type} <span className="small">-{w.calories} kcal</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
};
