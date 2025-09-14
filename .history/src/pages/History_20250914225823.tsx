import React, { useMemo } from 'react';
import { useStore } from '../state/store';
import { subDays, startOfDay, format } from 'date-fns';

export const History: React.FC = () => {
  const todayRaw = useStore(s => s.today);
  const today = todayRaw instanceof Date ? todayRaw : new Date(todayRaw as any);
  const totalsForDate = useStore(s => s.totalsForDate);
  const goals = useStore(s => s.goals);

  const days = useMemo(() => {
    return Array.from({length:14}).map((_,i) => {
      const d = startOfDay(subDays(today, 13 - i));
      const t = totalsForDate(d);
      return { date: d, calories: t.calories - t.workoutCalories, protein: t.protein, carbs: t.carbs, fats: t.fats };
    });
  }, [today, totalsForDate]);

  const maxCal = Math.max(1, ...days.map(d=>d.calories));
  const barW = 16; const gap = 6; const chartH = 120; const chartW = days.length*barW + (days.length-1)*gap;

  return (
    <div className="page">
      <h1>History</h1>
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{fontSize:'.75rem', marginBottom:8, opacity:.7}}>Last 14 days (net calories)</div>
        <svg width={chartW} height={chartH} role="img" aria-label="Net calories last 14 days">
          {days.map((d,i) => {
            const h = Math.round((d.calories / maxCal) * (chartH-20));
            return (
              <g key={i} transform={`translate(${i*(barW+gap)}, ${chartH - h - 15})`}>
                <rect width={barW} height={h} rx={3} fill={d.calories > goals.calories ? '#f87171' : '#34d399'} />
                <text x={barW/2} y={h+10} textAnchor="middle" fontSize="8" fill="#94a3b8">{format(d.date,'d')}</text>
              </g>
            );
          })}
        </svg>
        <div style={{fontSize:'.65rem', marginTop:4, display:'flex', gap:8}}>
          <span><span style={{display:'inline-block', width:10, height:10, background:'#34d399', borderRadius:2}} /> below goal</span>
          <span><span style={{display:'inline-block', width:10, height:10, background:'#f87171', borderRadius:2}} /> over goal</span>
        </div>
      </div>
      <section style={{marginTop:24}}>
        <h2 style={{fontSize:'1rem'}}>Macro Averages (14d)</h2>
        {(() => {
          const avg = (field: 'protein'|'carbs'|'fats') => Math.round(days.reduce((a,b)=>a + (b as any)[field],0)/days.length);
          return (
            <ul className="list">
              <li>Protein avg: {avg('protein')} g</li>
              <li>Carbs avg: {avg('carbs')} g</li>
              <li>Fats avg: {avg('fats')} g</li>
            </ul>
          );
        })()}
      </section>
    </div>
  );
};