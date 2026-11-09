// Jalur sungai (tanpa dependensi supaya bisa dipakai pohon, rumput, pegunungan, dll.)
// Sungai turun dari pegunungan timur laut -> berkelok di padang -> masuk danau -> keluar ke barat daya.
import * as THREE from 'three';
import { noise3 } from './noise.js';

export const LAKE = { x: 104, z: 98, r: 21 };

const IN_PTS = [[360, -300], [285, -205], [228, -128], [186, -62], [168, 2], [150, 44], [124, 74], [112, 86]];
const OUT_PTS = [[90, 112], [62, 142], [24, 156], [-22, 160], [-64, 176], [-104, 196], [-150, 230], [-215, 275], [-300, 330]];

function build(pts) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const n = Math.ceil(curve.getLength() / 3);
  return { curve, samples: curve.getSpacedPoints(n) };
}
export const RIVERS = [build(IN_PTS), build(OUT_PTS)];

// lebar sungai: sempit di pegunungan, lebar di padang
export function riverWidth(x, z) {
  const r = Math.hypot(x, z);
  return r > 250 ? 5 : r > 200 ? 6.5 : 8;
}

// grid untuk mencari jarak ke sungai dengan cepat
const CELL = 24;
const grid = new Map();
for (const rv of RIVERS) for (const p of rv.samples) {
  const k = Math.floor(p.x / CELL) + ',' + Math.floor(p.z / CELL);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}
export function distToRiver(x, z, maxD = 48) {
  let best = maxD;
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL), R = Math.ceil(maxD / CELL);
  for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
    const list = grid.get((cx + i) + ',' + (cz + j));
    if (!list) continue;
    for (const p of list) { const d = Math.hypot(p.x - x, p.z - z); if (d < best) best = d; }
  }
  return best;
}

// ---------------------------------------------------------------------
// KEDALAMAN AIR (untuk berenang)
// ---------------------------------------------------------------------
export const WATER_Y = -0.35; // permukaan air sungai & danau

// profil penampang sungai: [jarak dari tengah, tinggi dasar]
export function riverProfile(w) {
  const h = w / 2;
  return [[h + 2.5, 0.02], [h + 0.6, 0], [h - 0.4, -1.0], [h - 1.8, -2.0], [(h - 1.8) * 0.5, -2.4], [0, -2.5]];
}
function interpProfile(prof, d) {
  if (d >= prof[1][0]) return 0;
  for (let i = 1; i < prof.length - 1; i++) {
    const [d0, y0] = prof[i], [d1, y1] = prof[i + 1];
    if (d >= d1) return y0 + (y1 - y0) * ((d0 - d) / (d0 - d1));
  }
  return prof[prof.length - 1][1];
}

// jari-jari danau (bentuk tidak bulat sempurna)
export function lakeRadius(a) {
  return LAKE.r * (0.85 + noise3(Math.cos(a) * 2, 3, Math.sin(a) * 2) * 0.35);
}
// profil danau: [jarak relatif terhadap tepi, tinggi dasar]
export const LAKE_PROFILE = [[1.2, 0.02], [1.02, 0], [0.92, -1.2], [0.75, -2.6], [0.45, -3.2], [0, -3.4]];

// tinggi dasar sungai/danau di titik (x, z); 0 = daratan biasa
export function groundAt(x, z) {
  let g = 0;
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (dl < LAKE.r * 1.4) {
    const f = dl / lakeRadius(Math.atan2(z - LAKE.z, x - LAKE.x));
    g = Math.min(g, interpProfile(LAKE_PROFILE, f));
  }
  const w = riverWidth(x, z);
  const d = distToRiver(x, z, w / 2 + 1);
  if (d < w / 2 + 0.6) g = Math.min(g, interpProfile(riverProfile(w), d));
  return g;
}
