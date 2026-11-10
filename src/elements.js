// Definisi semua elemen: warna, bonus pasif, skill aktif, material ore & gaya partikel.
// Tambah elemen baru cukup dengan menambah objek baru di array ini.

export const ELEMENTS = [
  {
    id: 'api', name: 'Api', icon: '🔥',
    color: 0xff5722, glow: 0xffa040, dark: 0x5d1a0a,
    desc: 'Panas membara, mesin bekerja tanpa henti.',
    passive: { drop: 1.25 }, passiveText: '+25% kecepatan dropper',
    ability: { name: 'Ledakan Api', type: 'dropBoost', mult: 3, duration: 8, cooldown: 30, text: 'Dropper 3x lebih cepat selama 8 detik' },
    ore: { color: 0x2a1208, emissive: 0xff4a00, ei: 1.6, rough: 0.9, metal: 0 },
    fx: { color: 0xff6a00, color2: 0xffd000, gravity: -4, speed: 1.5, life: 0.9, size: 0.55, drag: 1.5, grow: 0.2 },
  },
  {
    id: 'air', name: 'Air', icon: '💧',
    color: 0x2196f3, glow: 0x6ecbff, dark: 0x0d2b4d,
    desc: 'Mengalir tenang, memoles ore jadi berkilau.',
    passive: { value: 1.2 }, passiveText: '+20% nilai ore',
    ability: { name: 'Gelombang Pasang', type: 'valueBoost', mult: 2, duration: 10, cooldown: 35, text: 'Nilai ore 2x selama 10 detik' },
    ore: { color: 0x1e88e5, emissive: 0x0d47a1, ei: 0.5, rough: 0.05, metal: 0.1, opacity: 0.8 },
    fx: { color: 0x4fc3f7, color2: 0xffffff, gravity: 9, speed: 4, up: 4, life: 1.0, size: 0.35 },
  },
  {
    id: 'daun', name: 'Daun', icon: '🍃',
    color: 0x43a047, glow: 0x9cff6e, dark: 0x1b3d1d,
    desc: 'Alam tumbuh subur, panen tak pernah habis.',
    passive: { value: 1.1, drop: 1.1 }, passiveText: '+10% nilai & kecepatan',
    ability: { name: 'Panen Raya', type: 'instantCash', seconds: 25, cooldown: 40, text: 'Langsung dapat uang = 25 detik pendapatan' },
    ore: { color: 0x4caf50, emissive: 0x1b5e20, ei: 0.35, rough: 0.8, metal: 0 },
    fx: { color: 0x66bb6a, color2: 0xc5e1a5, gravity: 1, swirl: 3, speed: 2, life: 1.8, size: 0.4 },
  },
  {
    id: 'listrik', name: 'Listrik', icon: '⚡',
    color: 0xffd600, glow: 0xfff27a, dark: 0x3a3300,
    desc: 'Secepat kilat, menyambar semua ore sekaligus.',
    passive: { speed: 1.3, drop: 1.1 }, passiveText: '+30% lari, +10% dropper',
    ability: { name: 'Sambaran Petir', type: 'zap', cooldown: 20, text: 'Petir mengirim semua ore di conveyor ke collector + dash' },
    ore: { color: 0xfff176, emissive: 0xffea00, ei: 1.4, rough: 0.3, metal: 0.5 },
    fx: { color: 0xfff59d, color2: 0x80d8ff, gravity: 0, speed: 7, life: 0.35, size: 0.3, drag: 4 },
  },
  {
    id: 'techno', name: 'Techno', icon: '🤖',
    color: 0x00e5ff, glow: 0x7df9ff, dark: 0x10202a,
    desc: 'Teknologi canggih, upgrader jadi super efisien.',
    passive: { upg: 1.25 }, passiveText: 'Upgrader +25% lebih kuat',
    ability: { name: 'Overclock', type: 'upgBoost', mult: 2, duration: 12, cooldown: 35, text: 'Efek upgrader 2x selama 12 detik' },
    ore: { color: 0x263238, emissive: 0x00e5ff, ei: 1.2, rough: 0.25, metal: 0.9 },
    fx: { color: 0x00e5ff, color2: 0x2979ff, gravity: -1, speed: 1.5, life: 1.2, size: 0.3 },
  },
  {
    id: 'gempa', name: 'Gempa', icon: '🌋',
    color: 0x8d6e63, glow: 0xffb74d, dark: 0x3e2723,
    desc: 'Mengguncang bumi, ore hancur jadi permata.',
    passive: { value: 1.3, drop: 0.9 }, passiveText: '+30% nilai, -10% dropper',
    ability: { name: 'Guncangan Bumi', type: 'shock', mult: 3, cooldown: 25, text: 'Semua ore di conveyor nilainya 3x' },
    ore: { color: 0x6d4c41, emissive: 0x000000, ei: 0, rough: 1, metal: 0 },
    fx: { color: 0x8d6e63, color2: 0xd7ccc8, gravity: 8, speed: 3, up: 3, life: 1.0, size: 0.45, additive: false },
  },
  {
    id: 'es', name: 'Es', icon: '❄️',
    color: 0x80deea, glow: 0xe0ffff, dark: 0x1f4a5a,
    desc: 'Dingin membeku, ore mengkristal sempurna.',
    passive: { value: 1.15, speed: 1.1 }, passiveText: '+15% nilai, +10% lari',
    ability: { name: 'Kristal Abadi', type: 'nextOre', count: 15, mult: 4, cooldown: 35, text: '15 ore berikutnya jadi kristal bernilai 4x' },
    ore: { color: 0xb3f0ff, emissive: 0x4fc3f7, ei: 0.45, rough: 0.05, metal: 0.1, opacity: 0.75 },
    fx: { color: 0xe0f7fa, color2: 0x80deea, gravity: 1.5, swirl: 1, speed: 1.2, life: 2, size: 0.3 },
  },
  {
    id: 'angin', name: 'Angin', icon: '🌪️',
    color: 0xb2dfdb, glow: 0xffffff, dark: 0x37595a,
    desc: 'Bebas seperti angin, lari dan lompat paling tinggi.',
    passive: { speed: 1.45, jump: 1.35 }, passiveText: '+45% lari, +35% lompat',
    ability: { name: 'Tornado', type: 'speedBoost', mult: 1.8, duration: 8, cooldown: 20, text: 'Lari & lompat super selama 8 detik' },
    ore: { color: 0xe0f2f1, emissive: 0x80cbc4, ei: 0.4, rough: 0.5, metal: 0, opacity: 0.85 },
    fx: { color: 0xffffff, color2: 0xb2dfdb, gravity: -0.5, swirl: 6, speed: 3, life: 1.2, size: 0.35 },
  },
  {
    id: 'cahaya', name: 'Cahaya', icon: '✨',
    color: 0xffc83d, glow: 0xfff6c0, dark: 0x5a4a10,
    desc: 'Bersinar terang, semua harga lebih murah.',
    passive: { discount: 0.9 }, passiveText: 'Semua harga -10%',
    ability: { name: 'Berkah Cahaya', type: 'nextOre', count: 20, mult: 5, cooldown: 40, text: '20 ore berikutnya jadi emas bernilai 5x' },
    ore: { color: 0xffd54f, emissive: 0xffc107, ei: 1.2, rough: 0.2, metal: 1 },
    fx: { color: 0xfff59d, color2: 0xffffff, gravity: -1.5, speed: 1.5, life: 1.4, size: 0.45 },
  },
  {
    id: 'bayangan', name: 'Bayangan', icon: '🌑',
    color: 0x7e57c2, glow: 0xb388ff, dark: 0x1a1030,
    desc: 'Bergerak dalam gelap, teleport ke mana saja.',
    passive: { drop: 1.15, discount: 0.95 }, passiveText: '+15% dropper, harga -5%',
    ability: { name: 'Langkah Bayangan', type: 'teleport', cooldown: 18, text: 'Teleport ke pad uang & langsung ambil uang' },
    ore: { color: 0x1a0f2e, emissive: 0x7c4dff, ei: 1.0, rough: 0.4, metal: 0.2 },
    fx: { color: 0x7c4dff, color2: 0x311b92, gravity: -1, speed: 1, life: 1.6, size: 0.7, grow: 2 },
  },
  {
    id: 'racun', name: 'Racun', icon: '☠️',
    color: 0x9ccc00, glow: 0xd4ff4f, dark: 0x2a1a3a,
    desc: 'Kabut beracun yang melipatgandakan keuntungan.',
    passive: { value: 1.15, drop: 1.05 }, passiveText: '+15% nilai, +5% dropper',
    ability: { name: 'Kabut Racun', type: 'valueBoost', mult: 2.2, duration: 9, cooldown: 35, text: 'Nilai ore 2.2x selama 9 detik' },
    ore: { color: 0x33691e, emissive: 0x76ff03, ei: 0.9, rough: 0.5, metal: 0 },
    fx: { color: 0x76ff03, color2: 0xaa00ff, gravity: -0.6, speed: 1.2, life: 1.6, size: 0.6, grow: 1.8 },
  },
  {
    id: 'logam', name: 'Logam', icon: '⚙️',
    color: 0x90a4ae, glow: 0xe0f0ff, dark: 0x263238,
    desc: 'Sekuat baja, pabrik tahan banting.',
    passive: { upg: 1.15, value: 1.1 }, passiveText: 'Upgrader +15%, nilai +10%',
    ability: { name: 'Tempa Baja', type: 'upgBoost', mult: 1.8, duration: 15, cooldown: 35, text: 'Efek upgrader 1.8x selama 15 detik' },
    ore: { color: 0xb0bec5, emissive: 0x000000, ei: 0, rough: 0.2, metal: 1 },
    fx: { color: 0xffe0b2, color2: 0xffffff, gravity: 10, speed: 5, up: 3, life: 0.6, size: 0.25 },
  },
];

export function getElement(id) {
  return ELEMENTS.find((e) => e.id === id) || ELEMENTS[0];
}

export function passive(el, key) {
  return (el && el.passive && el.passive[key]) || 1;
}

export const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// ---------------------------------------------------------------------
// POWER: Serangan [Q] & Ultimate [F] tiap elemen
// kind: 'proj' (proyektil) atau 'beam' (sinar instan)
// ---------------------------------------------------------------------
const ATTACKS = {
  api: { dmg: 16, name: 'Bola Api', kind: 'proj', shape: 'sphere', speed: 32, gravity: 2, size: 0.45, cooldown: 1.1, color: 0xff5a00, explode: 1.4 },
  air: { dmg: 12, name: 'Peluru Air', kind: 'proj', shape: 'water', speed: 30, gravity: 6, size: 0.4, cooldown: 0.9, color: 0x29b6f6, explode: 1.0 },
  daun: { dmg: 7, name: 'Pisau Daun', kind: 'proj', shape: 'leaf', speed: 34, gravity: 0, size: 0.5, cooldown: 0.9, multi: 3, color: 0x7cff5a, explode: 0.6 },
  listrik: { dmg: 18, name: 'Sambar Petir', kind: 'beam', range: 45, cooldown: 1.1, color: 0xfff27a, style: 'bolt' },
  techno: { dmg: 7, name: 'Laser Plasma', kind: 'proj', shape: 'laser', speed: 70, gravity: 0, size: 0.15, cooldown: 0.5, color: 0x00e5ff, explode: 0.7 },
  gempa: { dmg: 24, name: 'Lempar Batu', kind: 'proj', shape: 'rock', speed: 24, gravity: 18, up: 7, size: 0.7, cooldown: 1.4, color: 0x8d6e63, explode: 2.2, quake: true },
  es: { dmg: 13, name: 'Tombak Es', kind: 'proj', shape: 'shard', speed: 45, gravity: 0, size: 0.35, cooldown: 0.8, color: 0xb3f0ff, explode: 0.9 },
  angin: { dmg: 11, name: 'Pusaran Angin', kind: 'proj', shape: 'tornado', speed: 14, gravity: 0, size: 0.9, cooldown: 1.6, life: 2.6, color: 0xe0f2f1, explode: 1.6, pierce: true },
  cahaya: { dmg: 15, name: 'Sinar Suci', kind: 'beam', range: 50, cooldown: 1.0, color: 0xfff6c0, style: 'ray' },
  bayangan: { dmg: 15, name: 'Orb Bayangan', kind: 'proj', shape: 'orb', speed: 22, gravity: 0, size: 0.5, cooldown: 1.2, homing: true, color: 0x7c4dff, explode: 1.4 },
  racun: { dmg: 18, name: 'Bom Racun', kind: 'proj', shape: 'bomb', speed: 20, gravity: 14, up: 6, size: 0.45, cooldown: 1.4, color: 0x76ff03, explode: 2.0, cloud: true },
  logam: { dmg: 8, name: 'Shuriken Baja', kind: 'proj', shape: 'disc', speed: 40, gravity: 0, size: 0.4, cooldown: 0.6, color: 0xcfd8dc, explode: 0.6 },
};

const ULTS = {
  api: 'Wujud Phoenix', air: 'Raja Samudra', daun: 'Penjaga Hutan', listrik: 'Dewa Petir',
  techno: 'Mode Mecha', gempa: 'Titan Bumi', es: 'Ratu Salju', angin: 'Badai Langit',
  cahaya: 'Malaikat Cahaya', bayangan: 'Raja Kegelapan', racun: 'Wabah Hijau', logam: 'Ksatria Baja',
};

for (const e of ELEMENTS) {
  e.attack = { life: 1.6, ...ATTACKS[e.id] };
  e.ult = {
    name: ULTS[e.id], duration: 12, cooldown: 70,
    text: 'Berubah wujud 12 detik: bisa TERBANG (tahan Spasi), dropper & nilai ore x1.5, serangan tanpa jeda',
  };
}
