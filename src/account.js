// AKUN PEMAIN: Daftar & Masuk pakai NAMA + PASSWORD (tanpa Google, tanpa email asli).
// Di balik layar memakai Firebase Authentication (Email/Password): nama diubah jadi email tiruan
// "<nama>@elemental-tycoon.app". Password disimpan aman (ter-hash) oleh Firebase, BUKAN oleh game.
// Progres disimpan di Realtime Database: users/{uid}/saves/{elemen}, jadi bisa lanjut di perangkat mana pun.
import { firebaseConfig } from '../firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const DOMAIN = 'elemental-tycoon.app';

export function firebaseConfigured() {
  return !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

let fbPromise = null;
// Muat SDK Firebase sekali saja (dipakai bersama oleh akun & multiplayer)
export function loadFirebase() {
  if (!fbPromise) {
    fbPromise = (async () => {
      const [appMod, db, auth] = await Promise.all([
        import(SDK + 'firebase-app.js'),
        import(SDK + 'firebase-database.js'),
        import(SDK + 'firebase-auth.js'),
      ]);
      const app = appMod.initializeApp(firebaseConfig);
      return { app, db, authMod: auth, auth: auth.getAuth(app), database: db.getDatabase(app) };
    })();
    fbPromise.catch(() => { fbPromise = null; });
  }
  return fbPromise;
}

export const cleanName = (n) => String(n || '').trim();
export function validName(n) {
  return /^[A-Za-z0-9_]{3,16}$/.test(n);
}
const toEmail = (n) => `${n.toLowerCase()}@${DOMAIN}`;

// pesan error dalam Bahasa Indonesia
export function authError(e) {
  const c = (e && e.code) || '';
  if (c.includes('email-already-in-use')) return 'Nama ini sudah dipakai. Pilih nama lain, atau Masuk kalau itu akunmu.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login')) return 'Nama atau password salah.';
  if (c.includes('weak-password')) return 'Password minimal 6 karakter.';
  if (c.includes('too-many-requests')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (c.includes('network-request-failed')) return 'Tidak ada koneksi internet.';
  if (c.includes('operation-not-allowed')) return 'Login Nama+Password belum diaktifkan di Firebase (Authentication → Email/Password).';
  if (c.includes('invalid-email')) return 'Nama hanya boleh huruf, angka, dan _.';
  return 'Gagal: ' + (c || (e && e.message) || 'tidak diketahui');
}

// Akun yang sedang masuk (null jika belum / tamu)
export async function currentAccount() {
  if (!firebaseConfigured()) return null;
  const fb = await loadFirebase();
  await fb.auth.authStateReady?.();
  const u = fb.auth.currentUser;
  if (!u || u.isAnonymous) return null;
  return { uid: u.uid, name: u.displayName || u.email.split('@')[0] };
}

export async function signUp(name, pass) {
  const fb = await loadFirebase();
  const cred = await fb.authMod.createUserWithEmailAndPassword(fb.auth, toEmail(name), pass);
  await fb.authMod.updateProfile(cred.user, { displayName: name });
  await fb.db.set(fb.db.ref(fb.database, `users/${cred.user.uid}/profile`), { name, created: fb.db.serverTimestamp() });
  return { uid: cred.user.uid, name };
}

export async function logIn(name, pass) {
  const fb = await loadFirebase();
  const cred = await fb.authMod.signInWithEmailAndPassword(fb.auth, toEmail(name), pass);
  return { uid: cred.user.uid, name: cred.user.displayName || name };
}

export async function logOut() {
  const fb = await loadFirebase();
  await fb.authMod.signOut(fb.auth);
}

// Tamu (untuk multiplayer tanpa akun)
export async function ensureGuest() {
  const fb = await loadFirebase();
  await fb.auth.authStateReady?.();
  if (!fb.auth.currentUser) await fb.authMod.signInAnonymously(fb.auth);
  return fb.auth.currentUser.uid;
}

// ---------- simpanan di cloud ----------
export async function loadCloudSaves(uid) {
  const fb = await loadFirebase();
  const snap = await fb.db.get(fb.db.ref(fb.database, `users/${uid}/saves`));
  return snap.val() || {};
}

export function saveCloud(uid, elId, data) {
  loadFirebase().then((fb) => fb.db.set(fb.db.ref(fb.database, `users/${uid}/saves/${elId}`), data)).catch((e) => console.warn('saveCloud', e));
}
