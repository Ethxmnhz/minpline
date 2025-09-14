import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';

// Hook: Automatically updates the store 'today' at local midnight without needing a page reload.
// Also initializes an empty workoutSets entry for the new day to make UI immediately show zeroed counts.
export function useMidnightRollover() {
  const setToday = useStore(s => s.setToday);
  const workoutSets = useStore(s => s.workoutSets);
  const revision = useStore(s => s.revision); // subscribing ensures rerender if store changes
  const ensureWorkoutSet = useStore();
  const refLastDay = useRef<string>(new Date().toDateString());

  useEffect(() => {
    function schedule() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24,0,0,0); // start of next day
      const ms = next.getTime() - now.getTime();
      return setTimeout(() => {
        const current = new Date();
        const dayStr = current.toDateString();
        if (dayStr !== refLastDay.current) {
          refLastDay.current = dayStr;
          setToday(current);
          // Precreate workoutSets entry if absent
          const key = current.toISOString().slice(0,10);
          const st = useStore.getState();
          if (!st.workoutSets[key]) {
            useStore.setState(s => ({ workoutSets: { ...s.workoutSets, [key]: { pushups:0, pullups:0, legs:0 } } }));
          }
        }
        schedule(); // reschedule for following midnight
      }, ms + 50); // small buffer
    }
    const timer = schedule();
    return () => clearTimeout(timer);
  }, [setToday]);
}
