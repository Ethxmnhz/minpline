import React, { useEffect, useState } from 'react';
import { searchFoods, scaleFood, FoodItem } from '../data/foods-indian';
import { fetchNutrition, RemoteNutritionItem } from '../services/nutritionApi';
import { useStore } from '../state/store';
import { nanoid } from '../util/id';
import { MealInput } from '../types';

interface QuickFoodAddProps { onClose: () => void; date: Date; }

export const QuickFoodAdd: React.FC<QuickFoodAddProps> = ({ onClose, date }) => {
  const addMeal = useStore(s => s.addMeal);
  const saveTemplate = useStore(s => s.saveMealTemplate);
  const [localQuery, setLocalQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodItem[]>([]);
  const [grams, setGrams] = useState<number>(0);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<RemoteNutritionItem[]>([]);
  const [remoteError, setRemoteError] = useState('');
  const [draft, setDraft] = useState<MealInput>({ name:'', calories:0, protein:0, carbs:0, fats:0 });

  useEffect(()=>{
    const run = async () => {
      if (!localQuery.trim()) { setLocalResults([]); setRemoteResults([]); setRemoteError(''); return; }
      setLocalResults(searchFoods(localQuery));
      setRemoteLoading(true); setRemoteError('');
      const res = await fetchNutrition(localQuery.trim());
      if (!res.length) setRemoteError('No remote results');
      setRemoteResults(res); setRemoteLoading(false);
    };
    run();
  }, [localQuery]);

  const applyLocal = (f: FoodItem) => {
    if (!grams) return;
    const scaled = scaleFood(f, grams);
    setDraft(d => ({
      name: d.name ? d.name + ' + ' + f.name : f.name,
      calories: d.calories + scaled.calories,
      protein: d.protein + scaled.protein,
      carbs: d.carbs + scaled.carbs,
      fats: d.fats + scaled.fats
    }));
    setLocalQuery(''); setLocalResults([]); setGrams(0);
  };

  const runRemote = async () => {
    if (!localQuery.trim()) return;
    setRemoteLoading(true); setRemoteError('');
    const res = await fetchNutrition(localQuery.trim());
    if (!res.length) setRemoteError('No results');
    setRemoteResults(res); setRemoteLoading(false);
  };

  const applyRemote = (r: RemoteNutritionItem) => {
    setDraft(d => ({
      name: d.name ? d.name + ' + ' + r.name : r.name,
      calories: d.calories + Math.round(r.calories),
      protein: d.protein + +(r.protein_g.toFixed(1)),
      carbs: d.carbs + +(r.carbohydrates_total_g.toFixed(1)),
      fats: d.fats + +(r.fat_total_g.toFixed(1))
    }));
  };

  const resetDraft = () => setDraft({ name:'', calories:0, protein:0, carbs:0, fats:0 });

  const commit = () => {
    if (!draft.name.trim() || draft.calories <=0) return;
    addMeal({ id: nanoid(), date: date.toISOString(), ...draft });
    onClose();
  };

  const saveAsTemplate = () => {
    if (!draft.name.trim()) return;
    saveTemplate({ id: nanoid(), ...draft });
  };

  return (
    <div className="quick-add-overlay" role="dialog" aria-modal="true">
      <div className="quick-add-sheet">
        <div className="qa-header">
          <strong>Quick Add Meal</strong>
          <button className="btn tiny" onClick={onClose}>Close</button>
        </div>
        <div className="qa-section">
          <div className="qa-subtitle">Search Foods</div>
          <div className="row gap" style={{marginBottom:6}}>
            <input style={{flex:2}} placeholder="Search local & remote" value={localQuery} onChange={e=>setLocalQuery(e.target.value)} />
            <input style={{flex:1}} type="number" placeholder="g" value={grams||''} onChange={e=>setGrams(+e.target.value)} />
            <button type="button" className="btn" onClick={runRemote} disabled={remoteLoading}>{remoteLoading?'...':'↻'}</button>
          </div>
          {remoteError && <div className="small" style={{color:'#f87171'}}>{remoteError}</div>}
          {(localResults.length>0 || remoteResults.length>0) && (
            <ul className="list" style={{maxHeight:140, overflowY:'auto'}}>
              {localResults.map(f => (
                <li key={'l-'+f.id} style={{cursor:'pointer'}} onClick={()=>applyLocal(f)}>{f.name} <span className="small">(local per {f.unit})</span></li>
              ))}
              {remoteResults.map((r,i)=>(
                <li key={'r-'+i} style={{cursor:'pointer'}} onClick={()=>applyRemote(r)}>
                  {r.name} <span className="small">{Math.round(r.calories)} kcal P{r.protein_g.toFixed(1)} C{r.carbohydrates_total_g.toFixed(1)} F{r.fat_total_g.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="small" style={{marginTop:4, opacity:.55}}>Local items scale by grams; remote entries use provided size.</p>
        </div>
        <div className="qa-section">
          <div className="qa-subtitle">Draft</div>
          <div className="card" style={{margin:0}}>
            <div style={{fontSize:'.8rem', lineHeight:1.4}}>
              <div><strong>{draft.name || '—'}</strong></div>
              <div>{draft.calories} kcal • P{draft.protein} C{draft.carbs} F{draft.fats}</div>
            </div>
            <div className="row gap" style={{marginTop:8}}>
              <button className="btn primary" style={{flex:1}} onClick={commit} disabled={!draft.name || draft.calories<=0}>Add</button>
              <button className="btn" onClick={saveAsTemplate}>Save Template</button>
              <button className="btn" onClick={resetDraft}>Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
