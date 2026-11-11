// Multiplayer via Firebase Realtime Database (+ Anonymous Auth).
// Struktur data:
//   rooms/{room}/players/{uid} = { n, e, x, y, z, r, s, g, ab, c, t }
//   rooms/{room}/plots/{index} = { owner, name, element, items: { id: true } }
//   rooms/{room}/chat/{pushId}  = { uid, n, m, t }
import { firebaseConfig, DEFAULT_ROOM } from '../firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

export function firebaseConfigured() {
  return !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

export function offline(reason) {
  return {
    online: false, id: 'local', reason, room: '-',
    async claimPlot() { return 0; },
    updatePlot() {}, sendState() {}, sendChat() {}, leave() {},
  };
}

export async function createMultiplayer(h = {}) {
  if (!firebaseConfigured()) return offline('Firebase belum diatur (lihat firebase-config.js)');
  try {
    const [appMod, db, authMod] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-database.js'),
      import(SDK + 'firebase-auth.js'),
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    const cred = await authMod.signInAnonymously(auth);
    const uid = cred.user.uid;
    const database = db.getDatabase(app);

    const room = (new URLSearchParams(location.search).get('room') || DEFAULT_ROOM || 'main').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'main';
    const base = `rooms/${room}`;
    const meRef = db.ref(database, `${base}/players/${uid}`);
    db.onDisconnect(meRef).remove();

    const playersRef = db.ref(database, `${base}/players`);
    db.onChildAdded(playersRef, (s) => { if (s.key !== uid) h.onPlayer?.(s.key, s.val()); });
    db.onChildChanged(playersRef, (s) => { if (s.key !== uid) h.onPlayer?.(s.key, s.val()); });
    db.onChildRemoved(playersRef, (s) => h.onPlayerLeave?.(s.key));

    const plotsRef = db.ref(database, `${base}/plots`);
    db.onChildAdded(plotsRef, (s) => h.onPlot?.(Number(s.key), s.val()));
    db.onChildChanged(plotsRef, (s) => h.onPlot?.(Number(s.key), s.val()));
    db.onChildRemoved(plotsRef, (s) => h.onPlot?.(Number(s.key), null));

    const chatQuery = db.query(db.ref(database, `${base}/chat`), db.limitToLast(15));
    db.onChildAdded(chatQuery, (s) => h.onChat?.(s.val()));

    // markas yang kita klaim (disimpan agar bisa diklaim ulang setelah koneksi putus-sambung)
    let claimed = null;
    const plotRef = (i) => db.ref(database, `${base}/plots/${i}`);
    async function reclaim() {
      if (!claimed) return;
      try {
        const res = await db.runTransaction(plotRef(claimed.i), (cur) => {
          if (cur === null || cur.owner === uid) return { ...claimed.data, owner: uid };
          return undefined;
        });
        if (res.committed) db.onDisconnect(plotRef(claimed.i)).remove();
      } catch (e) { console.warn('reclaim', e); }
    }

    // Setiap kali (kembali) tersambung: daftarkan ulang "hapus saat keluar" & pulihkan markas.
    // onDisconnect hanya berlaku sekali, jadi tanpa ini pemain bisa jadi "hantu" setelah koneksi putus sebentar.
    const connRef = db.ref(database, '.info/connected');
    db.onValue(connRef, (s) => {
      const ok = !!s.val();
      if (ok) {
        db.onDisconnect(meRef).remove();
        reclaim();
      }
      h.onConnection?.(ok);
    });

    let lastSend = 0;
    return {
      online: true, id: uid, room,
      async claimPlot(count, data) {
        for (let i = 0; i < count; i++) {
          const ref = db.ref(database, `${base}/plots/${i}`);
          try {
            const res = await db.runTransaction(ref, (cur) => {
              if (cur === null || cur.owner === uid) return { ...data, owner: uid };
              return undefined; // sudah dimiliki orang lain -> batal
            });
            if (res.committed) {
              db.onDisconnect(ref).remove();
              claimed = { i, data: { ...data } };
              return i;
            }
          } catch (e) { console.warn('claimPlot', i, e); }
        }
        return -1;
      },
      updatePlot(i, data) {
        // selalu tulis data lengkap + owner, supaya tetap diterima walau markas sempat terhapus
        claimed = { i, data: { ...(claimed && claimed.i === i ? claimed.data : {}), ...data } };
        db.set(plotRef(i), { ...claimed.data, owner: uid }).catch((e) => { console.warn(e); reclaim(); });
      },
      sendState(state, force = false) {
        const now = performance.now();
        if (!force && now - lastSend < 100) return; // 10x per detik
        lastSend = now;
        db.set(meRef, { ...state, t: db.serverTimestamp() }).catch(() => {});
      },
      sendChat(name, text) {
        db.push(db.ref(database, `${base}/chat`), { uid, n: String(name).slice(0, 20), m: String(text).slice(0, 120), t: db.serverTimestamp() }).catch((e) => console.warn(e));
      },
      leave() {
        db.remove(meRef).catch(() => {});
        if (claimed) db.remove(plotRef(claimed.i)).catch(() => {});
        claimed = null;
      },
    };
  } catch (e) {
    console.error(e);
    return offline('Gagal konek Firebase: ' + (e.code || e.message));
  }
}
