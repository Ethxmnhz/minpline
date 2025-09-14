import React, { useState } from 'react';
import { useStore } from '../state/store';
import { MealInput } from '../types';
import { nanoid } from '../util/id';

const empty: MealInput = { name: '', calories: 0, protein: 0, carbs: 0, fats: 0 };

export const Meals: React.FC = () => {
  const today = useStore(s => s.today);
  const addMeal = useStore(s => s.addMeal);
  const saveTemplate = useStore(s => s.saveMealTemplate);
  const templates = useStore(s => s.mealTemplates);
  const totals = useStore(s => s.totalsForDate(today));
  const [form, setForm] = useState<MealInput>(empty);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMeal({ id: nanoid(), date: today.toISOString(), ...form });
    setForm(empty);
  };

  const quickAddTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    addMeal({ id: nanoid(), date: today.toISOString(), ...t });
  };

  return (
    <div className="page">
      <h1>Meals</h1>
      <form onSubmit={onSubmit} className="card form-grid">
        <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        <input type="number" placeholder="Calories" value={form.calories||''} onChange={e=>setForm(f=>({...f,calories:+e.target.value}))} />
        <input type="number" placeholder="Protein" value={form.protein||''} onChange={e=>setForm(f=>({...f,protein:+e.target.value}))} />
        <input type="number" placeholder="Carbs" value={form.carbs||''} onChange={e=>setForm(f=>({...f,carbs:+e.target.value}))} />
        <input type="number" placeholder="Fats" value={form.fats||''} onChange={e=>setForm(f=>({...f,fats:+e.target.value}))} />
        <div className="row gap">
          <button type="submit" className="btn primary" style={{flex:1}}>Add</button>
          <button type="button" className="btn" onClick={()=>{ if(form.name.trim()) { saveTemplate({ id: nanoid(), ...form }); } }}>Save Template</button>
        </div>
      </form>

      <section>
        <h2>Today</h2>
        <ul className="list">
          {totals.meals.map(m => (
            <li key={m.id}>{m.name} <span className="small">{m.calories} kcal • P{m.protein} C{m.carbs} F{m.fats}</span></li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Saved Templates</h2>
        <ul className="list">
          {templates.map(t => (
            <li key={t.id}>
              {t.name} <span className="small">{t.calories} kcal</span>
              <button className="btn tiny" onClick={()=>quickAddTemplate(t.id)} style={{marginLeft:8}}>Add</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
