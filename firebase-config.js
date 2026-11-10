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
  apiKey: 'AIzaSyDFR1fW4_VnYAMWSaRbbrgLaflaq-mK5Yc',
  authDomain: 'elemental-tycoon-68344.firebaseapp.com',
  databaseURL: 'https://elemental-tycoon-68344-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'elemental-tycoon-68344',
  storageBucket: 'elemental-tycoon-68344.firebasestorage.app',
  messagingSenderId: '839757969988',
  appId: '1:839757969988:web:16e499875a66c2916c5a11',
};

// Nama room default. Bisa diganti lewat URL: index.html?room=namaroom
export const DEFAULT_ROOM = 'main';
