import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { ensureAnonAuth, loadUserData, saveUserData, subscribeUserData } from './firebase';

// Hook component mounted once in App to manage cloud sync side-effects.
export function CloudSync() {
  const cloudEnabled = useStore(s => s.cloudEnabled);
  const exportData = useStore(s => s.exportData);
  const importData = useStore(s => s.importData);
  const markSyncing = useStore(s => s.markSyncing);
  const markSynced = useStore(s => s.markSynced);
  const markSyncError = useStore(s => s.markSyncError);
  const cloudStatus = useStore(s => s.cloudStatus);
  const setCloudError = useStore(s => s.setCloudError);
  const enableCloud = useStore(s => s.enableCloud);
  const syncKey = useStore(s => s.syncKey);

  const unsubRef = useRef<() => void>();
  const lastPushRef = useRef<number>(0);
  const uidRef = useRef<string|null>(null);
  const lastSnapshotRef = useRef<string>('');

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
        const anonUid = await ensureAnonAuth();
        if (!anonUid) {
          setCloudError('Anonymous auth blocked (admin restricted). Enable anonymous auth in Firebase Console or use a different auth method.');
          enableCloud(false);
          return;
        }
        if (cancelled) return;
        const keyBase = (syncKey && syncKey.trim()) ? syncKey.trim() : anonUid;
        // sanitize key (firebase path can't include ., #, $, [, ])
        const safeKey = keyBase.replace(/[.#$\[\]]/g,'_');
        uidRef.current = safeKey;
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = undefined; }
        // initial load
        const remote = await loadUserData(safeKey);
        if (remote) {
          importData(remote);
          lastSnapshotRef.current = JSON.stringify(remote);
        } else {
          // push local if no remote
          const payload = exportData();
          await saveUserData(safeKey, payload);
          lastSnapshotRef.current = JSON.stringify(payload);
        }
        markSynced();
        unsubRef.current = subscribeUserData(safeKey, data => {
          if (!data) return;
          const serialized = JSON.stringify(data);
          if (serialized !== lastSnapshotRef.current) {
            importData(data);
            lastSnapshotRef.current = serialized;
          }
        });
      } catch (e) {
        console.error('Cloud sync init failed', e);
        setCloudError((e as any)?.message || 'Cloud sync failed');
        markSyncError();
      }
    })();
    return () => { cancelled = true; if (unsubRef.current) unsubRef.current(); };
  }, [cloudEnabled, syncKey]);

  // Push local changes debounced (observe slices)
  const meals = useStore(s => s.meals);
  const workouts = useStore(s => s.workouts);
  const mealTemplates = useStore(s => s.mealTemplates);
  const workoutSets = useStore(s => s.workoutSets);
  const goals = useStore(s => s.goals);

  useEffect(() => {
    if (!cloudEnabled || !uidRef.current) return;
    const now = Date.now();
    // debounce ~1.5s
    const delay = 1500;
    const timer = setTimeout(async () => {
      try {
        markSyncing();
        const payload = exportData();
        const serialized = JSON.stringify(payload);
        if (serialized === lastSnapshotRef.current) {
          markSynced();
          return;
        }
        await saveUserData(uidRef.current!, payload);
        lastSnapshotRef.current = serialized;
        markSynced();
      } catch (e) {
        console.error('Cloud push failed', e);
        markSyncError();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [cloudEnabled, meals, workouts, mealTemplates, workoutSets, goals, syncKey]);

  return null;
}
