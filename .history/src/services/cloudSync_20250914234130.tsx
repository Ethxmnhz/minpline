import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { loadGlobalData, saveGlobalData, subscribeGlobalData } from './firebase';

// Hook component mounted once in App to manage cloud sync side-effects.
export function CloudSync() {
  const cloudEnabled = useStore(s => s.cloudEnabled); // will always be true after migration but keep conditional
  const exportData = useStore(s => s.exportData);
  const importData = useStore(s => s.importData);
  const localRevision = useStore(s => s.revision);
  const markSyncing = useStore(s => s.markSyncing);
  const markSynced = useStore(s => s.markSynced);
  const markSyncError = useStore(s => s.markSyncError);
  const cloudStatus = useStore(s => s.cloudStatus); // kept if UI reads it elsewhere
  const setCloudError = useStore(s => s.setCloudError);
  // syncKey no longer used for global mode

  const unsubRef = useRef<() => void>();
  const lastKnownRemoteRevisionRef = useRef<number>(-1);
  const lastPushedRevisionRef = useRef<number>(-1);

  // Initial connect / subscribe - also react to syncKey changes
  useEffect(() => {
    if (!cloudEnabled) {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = undefined; }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        markSyncing();
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = undefined; }
        const remote = await loadGlobalData();
        if (cancelled) return;
        if (remote) {
          const rRev = typeof remote.revision === 'number' ? remote.revision : 0;
          const localRev = getSafeLocalRevision();
          if (rRev > localRev) {
            importData(remote);
            lastKnownRemoteRevisionRef.current = rRev;
            lastPushedRevisionRef.current = rRev; // baseline
          } else if (rRev < localRev) {
            const payload = exportData();
            await saveGlobalData(payload);
            lastKnownRemoteRevisionRef.current = payload.revision;
            lastPushedRevisionRef.current = payload.revision;
          } else {
            lastKnownRemoteRevisionRef.current = rRev;
            lastPushedRevisionRef.current = rRev;
          }
        } else {
          const payload = exportData();
          await saveGlobalData(payload);
          lastKnownRemoteRevisionRef.current = payload.revision;
          lastPushedRevisionRef.current = payload.revision;
        }
        markSynced();
        unsubRef.current = subscribeGlobalData((data: any) => {
          if (!data) return;
          const rRev = typeof data.revision === 'number' ? data.revision : 0;
          if (rRev <= lastKnownRemoteRevisionRef.current) return; // stale or duplicate
            const localRev = getSafeLocalRevision();
            if (rRev > localRev) {
              importData(data);
              lastKnownRemoteRevisionRef.current = rRev;
              // don't modify lastPushedRevisionRef; it reflects last local push
            }
        });
      } catch (e) {
        console.error('Global sync init failed', e);
        setCloudError((e as any)?.message || 'Cloud sync failed');
        markSyncError();
      }
    })();
    return () => { cancelled = true; if (unsubRef.current) unsubRef.current(); };
  }, [cloudEnabled, localRevision]);

  function getSafeLocalRevision() {
    // Access store directly to avoid stale closure
    try {
      return useStore.getState().revision ?? 0;
    } catch { return 0; }
  }

  // Push local changes debounced (observe slices)
  const meals = useStore(s => s.meals);
  const workouts = useStore(s => s.workouts);
  const mealTemplates = useStore(s => s.mealTemplates);
  const workoutSets = useStore(s => s.workoutSets);
  const goals = useStore(s => s.goals);

  useEffect(() => {
  if (!cloudEnabled) return;
    // Shorter debounce for faster propagation
    const delay = 800;
    const timer = setTimeout(async () => {
      try {
        markSyncing();
        const payload = exportData();
        if (payload.revision <= lastPushedRevisionRef.current) { markSynced(); return; }
        await saveGlobalData(payload);
        lastPushedRevisionRef.current = payload.revision;
        lastKnownRemoteRevisionRef.current = Math.max(lastKnownRemoteRevisionRef.current, payload.revision);
        markSynced();
      } catch (e) {
        console.error('Cloud push failed', e);
        markSyncError();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [cloudEnabled, meals, workouts, mealTemplates, workoutSets, goals, localRevision]);

  // Immediate (almost) push when revision changes specifically due to deletions to minimize window for resurrection.
  // We'll approximate by pushing whenever localRevision increments and debounce wasn't yet scheduled: use another effect.
  useEffect(() => {
    if (!cloudEnabled) return;
    if (localRevision <= lastPushedRevisionRef.current) return;
    // Quick push with tiny delay (100ms) to batch rapid successive actions.
    const t = setTimeout(async () => {
      try {
        const payload = exportData();
        if (payload.revision <= lastPushedRevisionRef.current) return;
        await saveGlobalData(payload);
        lastPushedRevisionRef.current = payload.revision;
        lastKnownRemoteRevisionRef.current = Math.max(lastKnownRemoteRevisionRef.current, payload.revision);
      } catch (e) {
        // Non-fatal; regular debounce cycle will retry
        console.warn('Fast push failed', e);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [localRevision, cloudEnabled]);

  return null;
}
