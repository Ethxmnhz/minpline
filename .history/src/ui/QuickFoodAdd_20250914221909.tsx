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
  const [remoteQuery, setRemoteQuery] = useState('');
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<RemoteNutritionItem[]>([]);
  const [remoteError, setRemoteError] = useState('');
  const [draft, setDraft] = useState<MealInput>({ name:'', calories:0, protein:0, carbs:0, fats:0 });

  useEffect(()=>{
    if (localQuery.trim()) setLocalResults(searchFoods(localQuery)); else setLocalResults([]);
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
    if (!remoteQuery.trim()) return;
    setRemoteLoading(true); setRemoteError('');
    const res = await fetchNutrition(remoteQuery.trim());
    if (!res.length) setRemoteError('No results (or API key missing)');
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
          <div className="qa-subtitle">Local Foods</div>
          <div className="row gap" style={{marginBottom:6}}>
            <input style={{flex:2}} placeholder="Search" value={localQuery} onChange={e=>setLocalQuery(e.target.value)} />
            <input style={{flex:1}} type="number" placeholder="g" value={grams||''} onChange={e=>setGrams(+e.target.value)} />
          </div>
          {localResults.length>0 && (
            <ul className="list" style={{maxHeight:120, overflowY:'auto'}}>
              {localResults.map(f => (
                <li key={f.id} style={{cursor:'pointer'}} onClick={()=>applyLocal(f)}>{f.name} <span className="small">per {f.unit}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="qa-section">
          <div className="qa-subtitle">Remote Nutrition</div>
          <div className="row gap" style={{marginBottom:6}}>
            <input style={{flex:2}} placeholder="e.g. 2 eggs and 1 cup rice" value={remoteQuery} onChange={e=>setRemoteQuery(e.target.value)} />
            <button type="button" className="btn" style={{flex:1}} onClick={runRemote} disabled={remoteLoading}>{remoteLoading?'...':'Fetch'}</button>
          </div>
          {remoteError && <div className="small" style={{color:'#f87171'}}>{remoteError}</div>}
          {remoteResults.length>0 && (
            <ul className="list" style={{maxHeight:120, overflowY:'auto'}}>
              {remoteResults.map((r,i)=>(
                <li key={i} style={{cursor:'pointer'}} onClick={()=>applyRemote(r)}>
                  {r.name} <span className="small">{Math.round(r.calories)} kcal P{r.protein_g.toFixed(1)} C{r.carbohydrates_total_g.toFixed(1)} F{r.fat_total_g.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
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
