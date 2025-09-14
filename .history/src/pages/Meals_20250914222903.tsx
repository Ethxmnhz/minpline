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
  const updateMeal = useStore(s => s.updateMeal);
  const removeMeal = useStore(s => s.removeMeal);
  const saveTemplate = useStore(s => s.saveMealTemplate);
  const templates = useStore(s => s.mealTemplates);
  const totals = useStore(s => s.totalsForDate(today));
  const [form, setForm] = useState<MealInput>(empty);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [grams, setGrams] = useState<number>(0);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<RemoteNutritionItem[]>([]);
  const [remoteError, setRemoteError] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<MealInput>(empty);

  useEffect(() => {
    const run = async () => {
      if (!foodQuery.trim()) { setFoodResults([]); setRemoteResults([]); setRemoteError(''); return; }
      // local first
      setFoodResults(searchFoods(foodQuery));
      // remote parallel
      setRemoteLoading(true); setRemoteError('');
      const data = await fetchNutrition(foodQuery.trim());
      if (!data.length) setRemoteError('No remote results');
      setRemoteResults(data); setRemoteLoading(false);
    };
    run();
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
    if (!foodQuery.trim()) return;
    setRemoteLoading(true); setRemoteError('');
    const data = await fetchNutrition(foodQuery.trim());
    if (!data.length) setRemoteError('No remote results');
    setRemoteResults(data);
    setRemoteLoading(false);
  };

  const safeNum = (v: any): number => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const applyRemote = (r: RemoteNutritionItem) => {
    const p = safeNum(r.protein_g); const c = safeNum(r.carbohydrates_total_g); const f = safeNum(r.fat_total_g); const cal = safeNum(r.calories);
    setForm((prev: MealInput) => ({
      ...prev,
      name: prev.name ? prev.name + ' + ' + r.name : r.name,
      calories: (prev.calories || 0) + Math.round(cal),
      protein: (prev.protein || 0) + +(p.toFixed ? p.toFixed(1) : p),
      carbs: (prev.carbs || 0) + +(c.toFixed ? c.toFixed(1) : c),
      fats: (prev.fats || 0) + +(f.toFixed ? f.toFixed(1) : f),
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

  const beginEdit = (id: string) => {
    const meal = totals.meals.find(m=>m.id===id);
    if (!meal) return;
    setEditingId(id);
    setEditDraft({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats });
  };

  const commitEdit = () => {
    if (!editingId) return;
    if (!editDraft.name.trim()) { cancelEdit(); return; }
    updateMeal(editingId, { ...editDraft });
    setEditingId(null);
  };

  const cancelEdit = () => { setEditingId(null); };

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
            <input style={{flex:2}} placeholder="Search local & remote" value={foodQuery} onChange={e=>setFoodQuery(e.target.value)} />
            <input style={{flex:1}} type="number" placeholder="g" value={grams||''} onChange={e=>setGrams(+e.target.value)} />
            <button type="button" className="btn" onClick={runRemoteSearch} disabled={remoteLoading}>{remoteLoading? '...' : '↻'}</button>
          </div>
          {(foodResults.length>0 || remoteResults.length>0) && (
            <ul className="list" style={{maxHeight:200, overflowY:'auto', marginTop:4}}>
              {foodResults.map(fr => (
                <li key={'l-'+fr.id} style={{cursor:'pointer'}} onClick={()=>applyFood(fr)}>
                  {fr.name} <span className="small">(local per {fr.unit})</span>
                </li>
              ))}
              {remoteResults.map((r,i)=>{
                const p = safeNum(r.protein_g); const c = safeNum(r.carbohydrates_total_g); const f = safeNum(r.fat_total_g); const cal = safeNum(r.calories);
                return (
                  <li key={'r-'+i} style={{cursor:'pointer'}} onClick={()=>applyRemote(r)}>
                    {r.name} <span className="small">{Math.round(cal)} kcal P{p.toFixed ? p.toFixed(1) : p} C{c.toFixed ? c.toFixed(1) : c} F{f.toFixed ? f.toFixed(1) : f}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {remoteError && <div className="small" style={{color:'#f87171'}}>{remoteError}</div>}
          <p className="small" style={{marginTop:4, opacity:.55}}>Enter grams then tap local item; remote items ignore grams (pre-sized).</p>
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
            <li key={m.id} style={{display:'flex', flexDirection:'column', gap:4}}>
              {editingId === m.id ? (
                <div className="card" style={{margin:0, background:'#1d2730'}}>
                  <input value={editDraft.name} onChange={e=>setEditDraft((d: MealInput)=>({...d,name:e.target.value}))} />
                  <div className="row gap" style={{marginTop:4}}>
                    <input type="number" style={{flex:1}} value={editDraft.calories||''} onChange={e=>setEditDraft((d: MealInput)=>({...d,calories:+e.target.value}))} />
                    <input type="number" style={{flex:1}} value={editDraft.protein||''} onChange={e=>setEditDraft((d: MealInput)=>({...d,protein:+e.target.value}))} />
                    <input type="number" style={{flex:1}} value={editDraft.carbs||''} onChange={e=>setEditDraft((d: MealInput)=>({...d,carbs:+e.target.value}))} />
                    <input type="number" style={{flex:1}} value={editDraft.fats||''} onChange={e=>setEditDraft((d: MealInput)=>({...d,fats:+e.target.value}))} />
                  </div>
                  <div className="row gap" style={{marginTop:6}}>
                    <button className="btn primary tiny" onClick={commitEdit}>Save</button>
                    <button className="btn tiny" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                  <div>{m.name} <span className="small">{m.calories} kcal • P{m.protein} C{m.carbs} F{m.fats}</span></div>
                  <div className="row gap">
                    <button className="btn tiny" onClick={()=>beginEdit(m.id)}>Edit</button>
                    <button className="btn tiny" onClick={()=>removeMeal(m.id)}>Del</button>
                  </div>
                </div>
              )}
            </li>
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
