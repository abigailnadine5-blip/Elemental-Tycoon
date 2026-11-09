# 🔥💧🍃⚡ Elemental Tycoon 3D

Game **tycoon 3D** di browser dengan karakter blocky ala Roblox. Pilih elemenmu, bangun markas, kumpulkan uang, dan jadi pemain terkaya!
Dibuat dengan [Three.js](https://threejs.org) (tanpa build step) dan siap **multiplayer pakai Firebase Realtime Database**.

## ✨ Fitur

- **Menu → START → Pilih Elemen** (12 elemen): Api, Air, Daun, Listrik, Techno, Gempa, Es, Angin, Cahaya, Bayangan, Racun, Logam
- Tiap elemen punya **baju khas** (motif kaos, sarung tangan, sepatu, ikat pinggang, aksesori kepala & item punggung: jubah, sayap, jetpack, tabung, perisai...)
- **3 kekuatan per elemen**: **[Q] Serangan** (bola api, laser, petir, tornado, shuriken, dll.), **[E] Skill tycoon**, **[F] Ultimate** (berubah wujud, bisa terbang, semua bonus x1.5)
- **Markas bertingkat**: Lantai 1 (pabrik) → **Lantai 2 (Lab)** → **Lantai 3 (Reaktor)** → **Rooftop** (Menara Elemen, Kolam, Patung Legenda) — lengkap dengan tangga, dinding kaca, conveyor & dropper di tiap lantai
- **Kristal Elemen** muncul di padang rumput — hancurkan dengan serangan [Q] untuk bonus uang
- Grafik "realistis": langit fisik, bayangan lembut, refleksi lingkungan (PBR), bloom/glow, kabut, pohon & gunung
- Gameplay tycoon klasik: **Dropper → Conveyor → Upgrader → Collector → Pad Uang**
- 29 bangunan yang bisa dibeli + **Rebirth** (bonus pendapatan permanen +50%)
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
| Serangan elemen | Q / klik kiri | Tombol besar |
| Skill tycoon | E | Tombol skill |
| Ultimate (terbang: tahan Spasi) | F | Tombol 👑 |
| Chat | Enter / T | 💬 |
| Kembali ke markas | R | – |

## ⚗️ Daftar Elemen

| Elemen | Baju | Pasif | [Q] Serangan | [E] Skill | [F] Ultimate |
|---|---|---|---|---|---|
| 🔥 Api | Kaos api + jubah merah | +25% kecepatan dropper | Bola Api | **Ledakan Api** – dropper 3x 8 dtk | Wujud Phoenix |
| 💧 Air | Kaos ombak + tabung air | +20% nilai ore | Peluru Air | **Gelombang Pasang** – nilai ore 2x 10 dtk | Raja Samudra |
| 🍃 Daun | Kaos daun + jubah daun | +10% nilai & kecepatan | Pisau Daun (3 sekaligus) | **Panen Raya** – uang instan | Penjaga Hutan |
| ⚡ Listrik | Kaos petir + baterai | +30% lari, +10% dropper | Sambar Petir (instan) | **Sambaran Petir** – semua ore langsung ke collector | Dewa Petir |
| 🤖 Techno | Kaos sirkuit + jetpack | Upgrader +25% | Laser Plasma | **Overclock** – upgrader 2x 12 dtk | Mode Mecha |
| 🌋 Gempa | Kaos retak lava + bahu batu | +30% nilai, -10% dropper | Lempar Batu (guncang) | **Guncangan Bumi** – ore di conveyor 3x | Titan Bumi |
| ❄️ Es | Kaos salju + sayap es | +15% nilai, +10% lari | Tombak Es | **Kristal Abadi** – 15 ore berikutnya 4x | Ratu Salju |
| 🌪️ Angin | Kaos pusaran + sayap bulu | +45% lari, +35% lompat | Pusaran Angin (tembus) | **Tornado** – lari & lompat super | Badai Langit |
| ✨ Cahaya | Kaos matahari + sayap emas | Harga -10% | Sinar Suci (instan) | **Berkah Cahaya** – 20 ore emas 5x | Malaikat Cahaya |
| 🌑 Bayangan | Hoodie gelap + jubah ungu | +15% dropper, harga -5% | Orb Bayangan (mengejar) | **Langkah Bayangan** – teleport ke pad uang | Raja Kegelapan |
| ☠️ Racun | Kaos tetesan racun + tabung | +15% nilai, +5% dropper | Bom Racun (kabut) | **Kabut Racun** – nilai ore 2.2x 9 dtk | Wabah Hijau |
| ⚙️ Logam | Baju zirah + perisai | Upgrader +15%, nilai +10% | Shuriken Baja | **Tempa Baja** – upgrader 1.8x 15 dtk | Ksatria Baja |

**Ultimate [F]** (12 detik, cooldown 70 dtk): karakter membesar dengan aura elemen, bisa **terbang** (tahan Spasi), dropper & nilai ore x1.5, serangan hampir tanpa jeda.

Di multiplayer, serangan bisa **mendorong pemain lain** — kecuali saat mereka berada di dalam markasnya sendiri (🛡 zona aman).

## 🏢 Markas Bertingkat

| Lantai | Cara buka | Isi |
|---|---|---|
| Lantai 1 – Pabrik | dari awal | Dropper I–VI, Mega Dropper, Upgrader x1.5/x2/x3, tembok, lampu, Auto Collector |
| Lantai 2 – Lab | beli **🏢 Lantai 2** | 3 Dropper Lab, Upgrader x2, 🛋 Lounge (sofa, TV, tanaman) |
| Lantai 3 – Reaktor | beli **🏢 Lantai 3** di Lantai 2 | 3 Dropper Reaktor, Reaktor x3, 🛏 Kamar Boss (kasur, meja, piala) |
| Rooftop | beli **🌇 Rooftop** di Lantai 3 | Menara Elemen x2, 🏊 Kolam, Patung Legenda x2, Rebirth |

Naik ke lantai atas lewat **tangga di samping markas** (atau terbang pakai Ultimate). Ore dari lantai atas turun lewat pipa ke collector utama.

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
rooms/{room}/players/{uid}  = { n, e, x, y, z, r, s, g, ab, c, u, pq, pd, t } // posisi, status, ultimate & serangan (10x/detik)
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
  character.js        avatar blocky ala Roblox + baju & aksesori tiap elemen
  tycoon.js           plot bertingkat, item, dropper/conveyor/upgrader/collector, pad beli
  world.js            langit, cahaya, tanah, pohon, plaza
  particles.js        sistem partikel & efek (petir, gelombang kejut)
  powers.js           serangan [Q] (proyektil & sinar) + Kristal Elemen
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
- Setelah mengubah kode, naikkan versi di **3 tempat**: `GAME_VERSION` dan semua `?v=` di `index.html`, serta `version.json`. Browser pemain akan otomatis memuat versi baru (tidak terjebak cache lama).

---

Karakter bergaya blocky terinspirasi Roblox; game ini proyek fan-made dan tidak berafiliasi dengan Roblox Corporation.
