// ============================================================
//  db.js — Firebase Firestore com suporte a variantes
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCuabgnUiFxWOtAbhnm1lPlgQNqbFGZqXo",
  authDomain: "receita-ea6a4.firebaseapp.com",
  projectId: "receita-ea6a4",
  storageBucket: "receita-ea6a4.firebasestorage.app",
  messagingSenderId: "169846902582",
  appId: "1:169846902582:web:8d44f2a1eb5ee837672d97"
};

firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();
const COL = "prescricoes";
const SETTINGS_COL = "settings";

const SEED_DATA = [
  // ... (dados iniciais mantidos) ...
];

const LOCAL_CACHE_KEY = "rxmed_prescricoes_cache";

function localCacheSave(docs) {
  try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(docs)); } catch(e) {}
}

function localCacheGet() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function isOffline() { return !navigator.onLine; }

async function dbInit() {
  try {
    const snap = await db.collection(COL).limit(1).get();
    if (snap.empty) {
      for (const item of SEED_DATA) {
        await db.collection(COL).add(item);
      }
    }
    const all = await dbGetAll();
    localCacheSave(all);
  } catch(e) {
    console.error("Erro no dbInit:", e);
  }
}

async function dbGetAll() {
  if (isOffline()) {
    const cached = localCacheGet();
    if (cached) return cached;
  }
  try {
    const snap = await db.collection(COL).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    localCacheSave(docs);
    return docs;
  } catch(e) {
    const cached = localCacheGet();
    if (cached) return cached;
    throw e;
  }
}

async function dbGetBySector(sector) {
  if (isOffline()) {
    const cached = localCacheGet();
    if (cached) return cached.filter(d => d.sector === sector);
  }
  try {
    const snap = await db.collection(COL).where("sector", "==", sector).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    const cached = localCacheGet();
    if (cached) return cached.filter(d => d.sector === sector);
    throw e;
  }
}

async function dbGetById(id) {
  if (isOffline()) {
    const cached = localCacheGet();
    if (cached) return cached.find(d => d.id === id) || null;
  }
  try {
    const docSnap = await db.collection(COL).doc(id).get();
    return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch(e) {
    const cached = localCacheGet();
    if (cached) return cached.find(d => d.id === id) || null;
    throw e;
  }
}

async function dbAdd(entry) {
  await db.collection(COL).add(entry);
}

async function dbUpdate(id, updated) {
  await db.collection(COL).doc(id).update(updated);
}

async function dbDelete(id) {
  await db.collection(COL).doc(id).delete();
}

// Funções para Salvar Configurações Globais (Anotações na Nuvem)
async function dbGetSettings(docId) {
  if (isOffline()) {
    try { return JSON.parse(localStorage.getItem("rxmed_set_" + docId)); } catch(e) { return null; }
  }
  try {
    const snap = await db.collection(SETTINGS_COL).doc(docId).get();
    if (snap.exists) {
      const data = snap.data();
      localStorage.setItem("rxmed_set_" + docId, JSON.stringify(data));
      return data;
    }
    return null;
  } catch(e) {
    try { return JSON.parse(localStorage.getItem("rxmed_set_" + docId)); } catch(err) { return null; }
  }
}

async function dbSaveSettings(docId, data) {
  localStorage.setItem("rxmed_set_" + docId, JSON.stringify(data));
  if (!isOffline()) {
    try {
      await db.collection(SETTINGS_COL).doc(docId).set(data, { merge: true });
    } catch(e) {
      console.error("Erro ao salvar settings", e);
    }
  }
}

window.dbInit        = dbInit;
window.dbGetAll      = dbGetAll;
window.dbGetBySector = dbGetBySector;
window.dbGetById     = dbGetById;
window.dbAdd         = dbAdd;
window.dbUpdate      = dbUpdate;
window.dbDelete      = dbDelete;
window.dbGetSettings = dbGetSettings;
window.dbSaveSettings = dbSaveSettings;
