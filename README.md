# 🔥💧🍃⚡ Elemental Tycoon 3D

Game **tycoon 3D** di browser dengan karakter blocky ala Roblox. Pilih elemenmu, bangun markas, kumpulkan uang, dan jadi pemain terkaya!
Dibuat dengan [Three.js](https://threejs.org) (tanpa build step) dan siap **multiplayer pakai Firebase Realtime Database**.

## ✨ Fitur

- **Menu → START → Pilih Elemen** (12 elemen): Api, Air, Daun, Listrik, Techno, Gempa, Es, Angin, Cahaya, Bayangan, Racun, Logam
- Tiap elemen punya **bonus pasif**, **skill aktif (tombol E)**, aksesori karakter, warna markas, ore, dan efek partikel sendiri
- Grafik "realistis": langit fisik, bayangan lembut, refleksi lingkungan (PBR), bloom/glow, kabut, pohon & gunung
- Gameplay tycoon klasik: **Dropper → Conveyor → Upgrader → Collector → Pad Uang**
- 15 bangunan yang bisa dibeli + **Rebirth** (bonus pendapatan permanen +50%)
- Progres **tersimpan otomatis** (localStorage) per elemen
- Kontrol PC (keyboard + mouse) & HP (joystick virtual + tombol)
- **Multiplayer (Firebase)**: maks 4 pemain per room, lihat pemain & markas orang lain secara realtime, chat, leaderboard

## 🎮 Kontrol

| Aksi | PC | HP |
|---|---|---|
| Jalan | WASD / panah | Joystick kiri |
| Lari | Shift | – |
| Lompat | Spasi | Tombol ⤒ |
| Putar kamera | Drag mouse | Geser layar kanan |
| Zoom | Scroll | – |
| Skill elemen | E | Tombol skill |
| Chat | Enter / T | 💬 |
| Kembali ke markas | R | – |

## ⚗️ Daftar Elemen

| Elemen | Pasif | Skill (E) |
|---|---|---|
| 🔥 Api | +25% kecepatan dropper | **Ledakan Api** – dropper 3x lebih cepat 8 dtk |
| 💧 Air | +20% nilai ore | **Gelombang Pasang** – nilai ore 2x 10 dtk |
| 🍃 Daun | +10% nilai & kecepatan | **Panen Raya** – uang instan = 25 dtk pendapatan |
| ⚡ Listrik | +30% lari, +10% dropper | **Sambaran Petir** – semua ore di conveyor langsung masuk collector + dash |
| 🤖 Techno | Upgrader +25% | **Overclock** – efek upgrader 2x 12 dtk |
| 🌋 Gempa | +30% nilai, -10% dropper | **Guncangan Bumi** – semua ore di conveyor nilainya 3x |
| ❄️ Es | +15% nilai, +10% lari | **Kristal Abadi** – 15 ore berikutnya 4x |
| 🌪️ Angin | +45% lari, +35% lompat | **Tornado** – lari & lompat super 8 dtk |
| ✨ Cahaya | Harga -10% | **Berkah Cahaya** – 20 ore berikutnya jadi emas 5x |
| 🌑 Bayangan | +15% dropper, harga -5% | **Langkah Bayangan** – teleport ke pad uang |
| ☠️ Racun | +15% nilai, +5% dropper | **Kabut Racun** – nilai ore 2.2x 9 dtk |
| ⚙️ Logam | Upgrader +15%, nilai +10% | **Tempa Baja** – efek upgrader 1.8x 15 dtk |

Mau tambah elemen? Cukup tambahkan objek baru di `src/elements.js` (dan aksesorinya di `src/character.js`).

## 🚀 Menjalankan

Game ini file statis biasa (HTML + ES modules), **tidak perlu npm install**.

**Lokal:** jalankan web server sederhana di folder ini (jangan buka `index.html` langsung via `file://`):

```bash
python3 -m http.server 8000
```

lalu buka <http://localhost:8000>.

**GitHub Pages:** repo ini sudah punya workflow `.github/workflows/pages.yml`.
Buka **Settings → Pages → Source: GitHub Actions**, lalu push ke `main`. Game akan online di
`https://<username>.github.io/<nama-repo>/`.

## 🌐 Mengaktifkan Multiplayer (Firebase)

Selama `firebase-config.js` masih kosong, game berjalan **offline / single player**. Untuk multiplayer:

1. Buka [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. **Build → Realtime Database → Create database** (pilih lokasi terdekat, misal `asia-southeast1`).
3. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
4. **Project settings (⚙) → Your apps → Web (`</>`)** → daftarkan app → salin objek `firebaseConfig`.
5. Tempel ke `firebase-config.js` (pastikan `databaseURL` terisi!).
6. Di **Realtime Database → Rules**, tempel isi file [`database.rules.json`](database.rules.json) → **Publish**.
7. **Authentication → Settings → Authorized domains** → tambahkan `<username>.github.io`.
8. Commit & push. Selesai! 🎉

> `apiKey` Firebase untuk web **bukan rahasia** — aman di-commit. Keamanan data diatur oleh *Rules* di langkah 6.

**Room:** semua pemain masuk room `main` secara default. Bikin room privat lewat URL, misal
`https://<username>.github.io/<repo>/?room=kelas7b`.

### Struktur data Firebase

```
rooms/{room}/players/{uid}  = { n, e, x, y, z, r, s, g, ab, c, t }   // posisi & status pemain (10x/detik)
rooms/{room}/plots/{0..3}   = { owner, name, element, items: {...} } // markas yang sudah diklaim
rooms/{room}/chat/{pushId}  = { uid, n, m, t }                       // pesan chat
```

Data pemain & plot otomatis terhapus saat pemain keluar (`onDisconnect`).

## 📁 Struktur Proyek

```
index.html            UI (menu, pilih elemen, HUD)
style.css             tampilan UI
firebase-config.js    ← isi config Firebase di sini
database.rules.json   aturan keamanan Realtime Database
src/
  main.js             loop game, kamera, fisika pemain, skill, UI, sinkron multiplayer
  elements.js         data 12 elemen
  character.js        avatar blocky ala Roblox + aksesori elemen
  tycoon.js           plot, item, dropper/conveyor/upgrader/collector, pad beli
  world.js            langit, cahaya, tanah, pohon, plaza
  particles.js        sistem partikel & efek (petir, gelombang kejut)
  multiplayer.js      integrasi Firebase (auth anonim, realtime database)
  input.js            keyboard, mouse, joystick sentuh
  audio.js            efek suara sintetis (WebAudio)
  textures.js         tekstur prosedural & label 3D
  util.js             helper
```

## 🛠 Tips

- HP terasa berat? Tambahkan `?low` di URL. PC mau grafik penuh di layar sentuh? Pakai `?high`.
- Ubah harga/nilai item di array `ITEMS` (`src/tycoon.js`).
- Debug di console browser: `game.cash = 1e6`.

---

Karakter bergaya blocky terinspirasi Roblox; game ini proyek fan-made dan tidak berafiliasi dengan Roblox Corporation.
