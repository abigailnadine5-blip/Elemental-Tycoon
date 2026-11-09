// =====================================================================
//  KONFIGURASI FIREBASE (MULTIPLAYER)
// ---------------------------------------------------------------------
//  1. Buka https://console.firebase.google.com -> buat project.
//  2. Build > Realtime Database -> Create database.
//  3. Build > Authentication -> Sign-in method -> aktifkan "Anonymous".
//  4. Project settings > Your apps > Web (</>) -> salin firebaseConfig ke sini.
//  5. Tempel isi file database.rules.json ke tab "Rules" Realtime Database.
//
//  Selama apiKey / databaseURL masih kosong, game berjalan OFFLINE (single player).
// =====================================================================

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  databaseURL: '', // contoh: https://nama-project-default-rtdb.asia-southeast1.firebasedatabase.app
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// Nama room default. Bisa diganti lewat URL: index.html?room=namaroom
export const DEFAULT_ROOM = 'main';
