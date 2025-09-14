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
  const cloudStatus = useStore(s => s.cloudStatus);
  const setCloudError = useStore(s => s.setCloudError);
  // syncKey no longer used for global mode

  const unsubRef = useRef<() => void>();
  const lastPushRef = useRef<number>(0);
  const uidRef = useRef<string|null>('global');
  const lastSnapshotRef = useRef<string>('');
  const lastSnapshotRevisionRef = useRef<number>(-1);

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
          // Only pull remote if it's strictly newer than our local revision
          if (rRev > getSafeLocalRevision()) {
            importData(remote);
            lastSnapshotRef.current = JSON.stringify(remote);
            lastSnapshotRevisionRef.current = rRev;
          } else if (rRev < getSafeLocalRevision()) {
            // Our local is newer; push it up
            const payload = exportData();
            await saveGlobalData(payload);
            lastSnapshotRef.current = JSON.stringify(payload);
            lastSnapshotRevisionRef.current = payload.revision;
          } else {
            // Equal revisions; treat remote as authoritative snapshot baseline
            lastSnapshotRef.current = JSON.stringify(remote);
            lastSnapshotRevisionRef.current = rRev;
          }
        } else {
          const payload = exportData();
          await saveGlobalData(payload);
          lastSnapshotRef.current = JSON.stringify(payload);
          lastSnapshotRevisionRef.current = payload.revision;
        }
        markSynced();
        unsubRef.current = subscribeGlobalData((data: any) => {
          if (!data) return;
          const serialized = JSON.stringify(data);
          if (serialized === lastSnapshotRef.current) return; // no change
          const rRev = typeof data.revision === 'number' ? data.revision : 0;
          // Only import if remote revision is newer than BOTH local and last imported snapshot revision
          if (rRev > getSafeLocalRevision() && rRev > lastSnapshotRevisionRef.current) {
            importData(data);
            lastSnapshotRef.current = serialized;
            lastSnapshotRevisionRef.current = rRev;
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
    const now = Date.now();
    // debounce ~1.5s
    const delay = 1500;
    const timer = setTimeout(async () => {
      try {
        markSyncing();
        const payload = exportData();
        const serialized = JSON.stringify(payload);
        // Skip push if nothing changed OR our known remote has same or newer revision
        if (serialized === lastSnapshotRef.current || payload.revision <= lastSnapshotRevisionRef.current) {
          markSynced();
          return;
        }
        await saveGlobalData(payload);
        lastSnapshotRef.current = serialized;
        lastSnapshotRevisionRef.current = payload.revision;
        markSynced();
      } catch (e) {
        console.error('Cloud push failed', e);
        markSyncError();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [cloudEnabled, meals, workouts, mealTemplates, workoutSets, goals, localRevision]);

  return null;
}
