// Firebase 初始化與資料存取工具
// 使用方式：請先在頁面中引入 `js/firebase-config.js`，設定 window.FIREBASE_CONFIG 後再載入本檔

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MSG_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

async function ensureAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async user => {
      if (user) return resolve(user);
      try {
        const cred = await signInAnonymously(auth);
        resolve(cred.user);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function listenStudents(onData) {
  const colRef = collection(db, 'students');
  return onSnapshot(colRef, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => `${a.class || ''}`.localeCompare(`${b.class || ''}`) || `${a.name || ''}`.localeCompare(`${b.name || ''}`));
    onData(list);
  });
}

async function uploadStudentPhoto(studentId, file) {
  const storageRef = ref(storage, `students/${studentId}/profile_${Date.now()}.jpg`);
  const result = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(result.ref);
  await updateDoc(doc(db, 'students', studentId), {
    photoUrl: url,
    updatedAt: serverTimestamp()
  });
  return url;
}

async function addStudentScore(studentId, type, value, dateStr) {
  const scoreId = `${dateStr}_${type}`;
  await setDoc(
    doc(db, 'students', studentId, 'scores', scoreId),
    { type, value: Number(value) || 0, date: dateStr, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

function listenStudentScores(studentId, onData) {
  const colRef = collection(db, 'students', studentId, 'scores');
  const q = query(colRef, orderBy('date', 'asc'));
  return onSnapshot(q, snap => {
    const byType = { frontJump: [], jumpingJack: [], skiJump: [], bicycleStep: [] };
    snap.forEach(ds => {
      const s = ds.data();
      if (byType[s.type]) byType[s.type].push({ value: Number(s.value) || 0, date: s.date });
    });
    onData(byType);
  });
}

async function getStudent(studentId) {
  const d = await getDoc(doc(db, 'students', studentId));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() };
}

export {
  app,
  db,
  storage,
  auth,
  ensureAuth,
  listenStudents,
  uploadStudentPhoto,
  addStudentScore,
  listenStudentScores,
  getStudent,
  signInWithEmailAndPassword
};


