// Jalur sungai (tanpa dependensi supaya bisa dipakai pohon, rumput, pegunungan, dll.)
// Sungai turun dari pegunungan timur laut -> berkelok di padang -> masuk danau -> keluar ke barat daya.
import * as THREE from 'three';

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
