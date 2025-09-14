import React from 'react';
import { useStore } from '../state/store';
import { nanoid } from '../util/id';

export const SavedMeals: React.FC = () => {
  const templates = useStore(s => s.mealTemplates);
  const today = useStore(s => s.today);
  const addMeal = useStore(s => s.addMeal);

  return (
    <div className="page">
      <h1>Saved Meals</h1>
      <ul className="list">
        {templates.map(t => (
          <li key={t.id}>
            {t.name} <span className="small">{t.calories} kcal</span>
            <button className="btn tiny" onClick={()=>addMeal({ ...t, id: nanoid(), date: today.toISOString() })} style={{marginLeft:8}}>Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
