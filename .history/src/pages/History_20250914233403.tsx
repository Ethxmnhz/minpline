import React, { useMemo } from 'react';
import { useStore } from '../state/store';
import { startOfDay, subDays } from 'date-fns';

interface DaySummary {
	date: string; // YYYY-MM-DD
	pushups: number; pullups: number; legs: number;
	pushPlan: number; pullPlan: number; legPlan: number;
	complete: boolean;
	workoutCount: number;
	workoutCalories: number;
}

const PUSH_PLAN = 6; const PULL_PLAN = 6; const LEG_PLAN = 4;

export const History: React.FC = () => {
	const workouts = useStore(s => s.workouts);
	const workoutSets = useStore(s => s.workoutSets);
	const meals = useStore(s => s.meals); // might show later

	const days: DaySummary[] = useMemo(() => {
		const out: DaySummary[] = [];
		for (let i=0;i<14;i++) {
			const d = subDays(startOfDay(new Date()), i);
			const key = d.toISOString().slice(0,10);
			const sets = workoutSets[key] || { pushups:0, pullups:0, legs:0 };
			const ws = workouts.filter(w => w.date && w.date.startsWith(key));
			const workoutCalories = ws.reduce((a,b)=>a+b.calories,0);
			out.push({
				date:key,
				pushups: sets.pushups||0,
				pullups: sets.pullups||0,
				legs: sets.legs||0,
				pushPlan: PUSH_PLAN,
				pullPlan: PULL_PLAN,
				legPlan: LEG_PLAN,
				complete: (sets.pushups||0) >= PUSH_PLAN && (sets.pullups||0) >= PULL_PLAN && (sets.legs||0) >= LEG_PLAN,
				workoutCount: ws.length,
				workoutCalories
			});
		}
		return out;
	}, [workouts, workoutSets]);

	return (
		<div className="page">
			<h1>History</h1>
			<div className="card" style={{marginBottom:16}}>
				<div style={{fontSize:'.8rem', lineHeight:1.4}}>
					Past 14 days set completion. A day is marked Complete when all planned sets are reached: Pushups {PUSH_PLAN}, Pull Ups {PULL_PLAN}, Legs {LEG_PLAN}.
				</div>
			</div>
			<ul className="list" style={{marginTop:0}}>
				{days.map(d => (
					<li key={d.date} style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
						<div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
							<strong style={{fontSize:'.85rem'}}>{d.date}</strong>
							<span className="small" style={{color: d.complete ? 'var(--color-protein)' : 'var(--color-text-dim)'}}>{d.complete ? 'Complete' : 'In Progress'}</span>
						</div>
						<div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:'100%', fontSize:'.65rem'}}>
							<div>Push {d.pushups}/{d.pushPlan}</div>
							<div>Pull {d.pullups}/{d.pullPlan}</div>
							<div>Legs {d.legs}/{d.legPlan}</div>
						</div>
						<div className="small" style={{opacity:.6}}>Workouts: {d.workoutCount} • {d.workoutCalories} kcal</div>
					</li>
				))}
			</ul>
		</div>
	);
};

export default History;
