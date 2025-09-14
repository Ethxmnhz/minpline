import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { MealInput } from '../types';
import { nanoid } from '../util/id';
import { searchFoods, scaleFood, FoodItem } from '../data/foods-indian';
import { fetchNutrition, RemoteNutritionItem } from '../services/nutritionApi';

const empty: MealInput = { name: '', calories: 0, protein: 0, carbs: 0, fats: 0 };

export const Meals: React.FC = () => {
  const today = useStore(s => s.today);
  const addMeal = useStore(s => s.addMeal);
  const saveTemplate = useStore(s => s.saveMealTemplate);
  const templates = useStore(s => s.mealTemplates);
  const totals = useStore(s => s.totalsForDate(today));
  const [form, setForm] = useState<MealInput>(empty);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [grams, setGrams] = useState<number>(0);
  const [remoteQuery, setRemoteQuery] = useState('');
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<RemoteNutritionItem[]>([]);
  const [remoteError, setRemoteError] = useState<string>('');

  useEffect(() => {
    if (foodQuery.trim()) {
      setFoodResults(searchFoods(foodQuery));
    } else {
      setFoodResults([]);
    }
  }, [foodQuery]);

  const applyFood = (f: FoodItem) => {
    if (!grams || grams <= 0) return;
    const scaled = scaleFood(f, grams);
  setForm((prev: MealInput) => ({
      ...prev,
      name: prev.name ? prev.name + ' + ' + f.name : f.name,
      calories: (prev.calories || 0) + scaled.calories,
      protein: (prev.protein || 0) + scaled.protein,
      carbs: (prev.carbs || 0) + scaled.carbs,
      fats: (prev.fats || 0) + scaled.fats,
    }));
    setFoodQuery('');
    setFoodResults([]);
    setGrams(0);
  };

  const runRemoteSearch = async () => {
    if (!remoteQuery.trim()) return;
    setRemoteLoading(true); setRemoteError('');
    const data = await fetchNutrition(remoteQuery.trim());
    if (!data.length) setRemoteError('No remote results or API key missing');
    setRemoteResults(data);
    setRemoteLoading(false);
  };

  const applyRemote = (r: RemoteNutritionItem) => {
    setForm((prev: MealInput) => ({
      ...prev,
      name: prev.name ? prev.name + ' + ' + r.name : r.name,
      calories: (prev.calories || 0) + Math.round(r.calories),
      protein: (prev.protein || 0) + +(r.protein_g.toFixed(1)),
      carbs: (prev.carbs || 0) + +(r.carbohydrates_total_g.toFixed(1)),
      fats: (prev.fats || 0) + +(r.fat_total_g.toFixed(1)),
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMeal({ id: nanoid(), date: today.toISOString(), ...form });
    setForm(empty);
  };

  const quickAddTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
  // spread template first so explicit id/date override
  addMeal({ ...t, id: nanoid(), date: today.toISOString() });
  };

  return (
    <div className="page">
      <h1>Meals</h1>
      <form onSubmit={onSubmit} className="card form-grid">
  <input placeholder="Name" value={form.name} onChange={e=>setForm((f: MealInput)=>({...f,name:e.target.value}))} />
  <input type="number" placeholder="Calories" value={form.calories||''} onChange={e=>setForm((f: MealInput)=>({...f,calories:+e.target.value}))} />
  <input type="number" placeholder="Protein" value={form.protein||''} onChange={e=>setForm((f: MealInput)=>({...f,protein:+e.target.value}))} />
  <input type="number" placeholder="Carbs" value={form.carbs||''} onChange={e=>setForm((f: MealInput)=>({...f,carbs:+e.target.value}))} />
  <input type="number" placeholder="Fats" value={form.fats||''} onChange={e=>setForm((f: MealInput)=>({...f,fats:+e.target.value}))} />
        <div style={{gridColumn:'1 / -1'}} className="food-search-block">
          <div className="row gap" style={{marginBottom:6}}>
            <input style={{flex:2}} placeholder="Search food (Indian)" value={foodQuery} onChange={e=>setFoodQuery(e.target.value)} />
            <input style={{flex:1}} type="number" placeholder="g" value={grams||''} onChange={e=>setGrams(+e.target.value)} />
          </div>
          {foodResults.length>0 && (
            <ul className="list" style={{maxHeight:160, overflowY:'auto', marginTop:4}}>
              {foodResults.map(fr => (
                <li key={fr.id} style={{cursor:'pointer'}} onClick={()=>applyFood(fr)}>
                  {fr.name} <span className="small">per {fr.unit}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="small" style={{marginTop:4, opacity:.55}}>Enter grams then tap a food to add scaled macros.</p>
        </div>
        <div style={{gridColumn:'1 / -1', marginTop:4}} className="remote-nutrition-block">
          <div className="row gap" style={{marginBottom:6}}>
            <input style={{flex:2}} placeholder="Remote nutrition query (e.g. 2 eggs and 1 cup rice)" value={remoteQuery} onChange={e=>setRemoteQuery(e.target.value)} />
            <button type="button" className="btn" style={{flex:1}} onClick={runRemoteSearch} disabled={remoteLoading}>{remoteLoading? '...' : 'Fetch'}</button>
          </div>
          {remoteError && <div className="small" style={{color:'#f87171'}}>{remoteError}</div>}
          {remoteResults.length>0 && (
            <ul className="list" style={{maxHeight:140, overflowY:'auto'}}>
              {remoteResults.map((r,i)=>(
                <li key={i} style={{cursor:'pointer'}} onClick={()=>applyRemote(r)}>
                  {r.name} <span className="small">{Math.round(r.calories)} kcal P{r.protein_g.toFixed(1)} C{r.carbohydrates_total_g.toFixed(1)} F{r.fat_total_g.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
