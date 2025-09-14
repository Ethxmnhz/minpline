import React, { useState } from 'react';
import { useStore } from '../state/store';
import { format } from 'date-fns';
import { ProgressBar } from '../ui/ProgressBar';
import { QuickFoodAdd } from '../ui/QuickFoodAdd';

export const Dashboard: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const today = useStore(s => s.today);
  const totals = useStore(s => s.totalsForDate(today));
  const goals = useStore(s => s.goals);
  const netCalories = totals.calories - totals.workoutCalories;
  const removeMeal = useStore(s => s.removeMeal);
  const removeWorkout = useStore(s => s.removeWorkout);
  const pct = (val: number, goal: number) => goal ? Math.min(100, Math.round(val / goal * 100)) : 0;

  return (
    <>
    <div className="page page-dashboard">
      <h1>{format(today, 'EEE dd MMM')}</h1>
      <section className="summary-grid">
        <div className="card" style={{cursor:'pointer'}} onClick={()=>setShowQuickAdd(true)}>
          <h2>Calories</h2>
          <div className="metric">{netCalories} / {goals.calories}</div>
          <ProgressBar value={pct(netCalories, goals.calories)} color="var(--color-cal)" />
          <div className="small" style={{marginTop:4, opacity:.55}}>Tap to quick add food</div>
        </div>
        <div className="card">
          <h2>Protein</h2>
          <div className="metric">{totals.protein}g / {goals.protein}g</div>
          <ProgressBar value={pct(totals.protein, goals.protein)} color="var(--color-protein)" />
        </div>
        <div className="card">
          <h2>Carbs</h2>
            <div className="metric">{totals.carbs}g / {goals.carbs}g</div>
          <ProgressBar value={pct(totals.carbs, goals.carbs)} color="var(--color-carbs)" />
        </div>
        <div className="card">
          <h2>Fats</h2>
          <div className="metric">{totals.fats}g / {goals.fats}g</div>
          <ProgressBar value={pct(totals.fats, goals.fats)} color="var(--color-fats)" />
        </div>
      </section>
      <section>
        <h2 style={{marginTop:24}}>Today Meals</h2>
        <ul className="list">
          {totals.meals.map(m => (
            <li key={m.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>{m.name} <span className="small">{m.calories} kcal</span></div>
              <button className="btn tiny" onClick={()=>removeMeal(m.id)}>Del</button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 style={{marginTop:24}}>Workouts</h2>
        <ul className="list">
          {totals.workouts.map(w => (
            <li key={w.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>{w.type} <span className="small">-{w.calories} kcal</span></div>
              <button className="btn tiny" onClick={()=>removeWorkout(w.id)}>Del</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
    {showQuickAdd && <QuickFoodAdd date={today} onClose={()=>setShowQuickAdd(false)} />}
    </>
  );
};
