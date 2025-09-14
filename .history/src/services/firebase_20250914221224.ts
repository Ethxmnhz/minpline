// Firebase initialization (client-side). Keys here are public identifiers.
// IMPORTANT: Do not store secrets in client code. This config only identifies the project.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, set, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDX25nwzQc-STovWztgtw2aCycvWXJxA3Y',
  authDomain: 'dash-13064.firebaseapp.com',
  databaseURL: 'https://dash-13064-default-rtdb.firebaseio.com',
  projectId: 'dash-13064',
  storageBucket: 'dash-13064.appspot.com',
  messagingSenderId: '409540597555',
  appId: '1:409540597555:web:5cc48d3ab4046fbd309046',
  measurementId: 'G-78JL7PXFPJ'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export async function ensureAnonAuth(): Promise<string | null> {
  if (auth.currentUser) return auth.currentUser.uid;
  await signInAnonymously(auth);
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, usr => { if (usr) { resolve(usr.uid); unsub(); } });
  });
}

export async function loadUserData(uid: string) {
  const snapshot = await get(ref(db, `users/${uid}/trackerData`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function saveUserData(uid: string, data: any) {
  await set(ref(db, `users/${uid}/trackerData`), data);
}

export function subscribeUserData(uid: string, cb: (data: any)=>void) {
  const r = ref(db, `users/${uid}/trackerData`);
  return onValue(r, snap => cb(snap.val()));
}
