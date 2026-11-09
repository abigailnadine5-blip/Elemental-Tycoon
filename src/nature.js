// Alam yang lebih realistis:
//  - 3 jenis pohon (beringin/oak, pinus, birch) dengan mahkota daun bergelombang, cabang, tekstur kulit kayu
//  - semak-semak
//  - semua daun bergoyang tertiup angin (shader)
//  - pegunungan asli: tanah naik membentuk punggung gunung, lereng batu, puncak bersalju, pinus di kaki gunung
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- noise sederhana (value noise + fbm) ----------
function hash(x, y, z) {
  let h = x * 374761393 + y * 668265263 + z * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), xf), L(c(0, 1, 0), c(1, 1, 0), xf), yf),
    L(L(c(0, 0, 1), c(1, 0, 1), xf), L(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
export function fbm(x, z, oct = 5) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise3(x * f, 0.5, z * f); f *= 2.03; a *= 0.5; }
  return v / 0.97;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- tinggi pegunungan ----------
export const MOUNTAIN_START = 250;
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  if (r < MOUNTAIN_START) return -2;
  const t = smooth(MOUNTAIN_START, MOUNTAIN_START + 170, r);
  const ridge = 1 - Math.abs(fbm(x * 0.0045 + 7, z * 0.0045 - 3, 4) * 2 - 1);
  const base = fbm(x * 0.003, z * 0.003, 5);
  const detail = fbm(x * 0.02, z * 0.02, 3);
  const peaks = Math.pow(0.3 * base + 0.7 * ridge * ridge, 1.6);
  return -2 + t * (12 + 120 * peaks) + t * detail * 9;
}

// ---------- tekstur kulit kayu ----------
function barkTexture(base, dark, marks = false) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = dark; g.globalAlpha = 0.25 + Math.random() * 0.4; g.lineWidth = 1 + Math.random() * 3;
    const x = Math.random() * 64;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= 256; y += 32) g.lineTo(x + (Math.random() - 0.5) * 6, y);
    g.stroke();
  }
  if (marks) {
    g.globalAlpha = 0.85; g.fillStyle = '#222';
    for (let i = 0; i < 26; i++) g.fillRect(Math.random() * 64, Math.random() * 256, 6 + Math.random() * 18, 2 + Math.random() * 4);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- geometri pohon ----------
function colorize(geo, fn) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function blob(r, detail, x, y, z, amp, seed) {
  let g = new THREE.IcosahedronGeometry(r, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3 - seed) - 0.5;
    v.multiplyScalar(1 + n * amp);
    p.setXYZ(i, v.x + x, v.y + y, v.z + z);
  }
  return g;
}

function leafColor(dark, light) {
  const a = new THREE.Color(dark), b = new THREE.Color(light);
  return (x, y, z, c, top, bottom) => {
    const k = Math.min(1, Math.max(0, (y - bottom) / (top - bottom)));
    const n = noise3(x * 2.1, y * 2.1, z * 2.1);
    c.copy(a).lerp(b, k * 0.8 + n * 0.35);
  };
}

function oakCrown() {
  const parts = [];
  const spots = [[0, 6.2, 0, 2.1], [1.4, 5.4, 0.6, 1.6], [-1.3, 5.6, -0.5, 1.7], [0.4, 5.3, -1.4, 1.5], [-0.5, 5.2, 1.4, 1.5], [0.2, 7.3, 0.2, 1.4], [1.0, 6.6, -0.9, 1.2]];
  spots.forEach(([x, y, z, r], i) => parts.push(blob(r, 1, x, y, z, 0.45, i * 3.7)));
  const g = mergeGeometries(parts);
  const fn = leafColor(0x1f3d12, 0x7aa43a);
  colorize(g, (x, y, z, c) => fn(x, y, z, c, 8.4, 3.8));
  g.computeVertexNormals();
  return g;
}

function birchCrown() {
  const parts = [];
  [[0, 6.6, 0, 1.6], [0.9, 5.8, 0.4, 1.2], [-0.8, 6.0, -0.4, 1.3], [0.2, 7.6, 0, 1.1], [0, 5.2, 0.9, 1.0]]
    .forEach(([x, y, z, r], i) => parts.push(blob(r, 1, x, y, z, 0.5, i * 5.1 + 2)));
  const g = mergeGeometries(parts);
  const fn = leafColor(0x4a6b1a, 0xb7d45a);
  colorize(g, (x, y, z, c) => fn(x, y, z, c, 8.6, 4.2));
  g.computeVertexNormals();
  return g;
}

function pineCrown() {
  const parts = [];
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const r = 2.6 - i * 0.38, h = 2.6 - i * 0.12;
    let g = new THREE.ConeGeometry(r, h, 10, 2, false);
    g.deleteAttribute('normal'); g.deleteAttribute('uv');
    g = mergeVertices(g);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const rad = Math.hypot(x, z);
      if (rad > 0.05) {
        const a = Math.atan2(z, x);
        const jag = 1 + (noise3(Math.cos(a) * 3 + i, y, Math.sin(a) * 3) - 0.5) * 0.5 + (Math.sin(a * 7 + i) * 0.08);
        p.setXYZ(k, x * jag, y - (rad / r) * 0.35, z * jag);
      }
    }
    g.translate(0, 2.4 + i * 1.25, 0);
    parts.push(g);
  }
  const g = mergeGeometries(parts);
  const a = new THREE.Color(0x0c1f14), b = new THREE.Color(0x2c5530);
  colorize(g, (x, y, z, c) => {
    const rad = Math.hypot(x, z);
    c.copy(a).lerp(b, Math.min(1, rad * 0.35 + noise3(x * 3, y * 3, z * 3) * 0.35));
  });
  g.computeVertexNormals();
  return g;
}

function trunkGeo(rTop, rBottom, h, branches) {
  const parts = [];
  const t = new THREE.CylinderGeometry(rTop, rBottom, h, 7, 1);
  t.translate(0, h / 2, 0);
  parts.push(t);
  for (let i = 0; i < branches; i++) {
    const b = new THREE.CylinderGeometry(0.05, rTop * 0.6, 2.0, 6);
    b.translate(0, 1.0, 0);
    b.rotateZ(0.9 + Math.random() * 0.3);
    b.rotateY((i / branches) * Math.PI * 2 + Math.random());
    b.translate(0, h * (0.55 + Math.random() * 0.3), 0);
    parts.push(b);
  }
  return mergeGeometries(parts);
}

function bushGeo() {
  const parts = [[0, 0.5, 0, 0.8], [0.6, 0.4, 0.2, 0.6], [-0.5, 0.45, -0.2, 0.65]].map(([x, y, z, r], i) => blob(r, 1, x, y, z, 0.5, i * 9));
  const g = mergeGeometries(parts);
  const fn = leafColor(0x1f3d12, 0x6b9a34);
  colorize(g, (x, y, z, c) => fn(x, y, z, c, 1.3, 0));
  g.computeVertexNormals();
  return g;
}

// ---------- angin: shader goyang ----------
export const windUniform = { value: 0 };
function addWind(mat, strength) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = windUniform;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        #ifdef USE_INSTANCING
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        #else
          vec4 wp = modelMatrix * vec4(position, 1.0);
        #endif
        float hh = max(position.y - 1.0, 0.0);
        float s = ${strength.toFixed(3)} * hh;
        transformed.x += (sin(uTime * 1.7 + wp.x * 0.13 + wp.z * 0.07) + 0.35 * sin(uTime * 4.3 + wp.z * 0.5)) * s;
        transformed.z += (cos(uTime * 1.3 + wp.z * 0.11 + wp.x * 0.05)) * s * 0.7;
      }`);
  };
  mat.customProgramCacheKey = () => 'wind' + strength;
}

// ---------- bangun semua ----------
export function createNature(scene, quality, isFree) {
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  const barkMat = new THREE.MeshStandardMaterial({ map: barkTexture('#5a3e2a', '#2a1a10'), roughness: 1 });
  const birchMat = new THREE.MeshStandardMaterial({ map: barkTexture('#e9e4da', '#9a9488', true), roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const pineMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  addWind(barkMat, 0.012); addWind(birchMat, 0.014); addWind(leafMat, 0.03); addWind(pineMat, 0.02);

  const types = {
    oak: { trunk: trunkGeo(0.32, 0.55, 5.5, 4), crown: oakCrown(), tMat: barkMat, cMat: leafMat, list: [] },
    pine: { trunk: trunkGeo(0.16, 0.36, 9, 0), crown: pineCrown(), tMat: barkMat, cMat: pineMat, list: [] },
    birch: { trunk: trunkGeo(0.18, 0.28, 6.5, 3), crown: birchCrown(), tMat: birchMat, cMat: leafMat, list: [] },
  };

  // padang rumput
  const total = quality.trees;
  let tries = 0;
  while (types.oak.list.length + types.pine.list.length + types.birch.list.length < total && tries < total * 40) {
    tries++;
    const r = 28 + Math.sqrt(Math.random()) * 205, a = Math.random() * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!isFree(x, z)) continue;
    // hutan berkelompok: pakai noise agar ada area padat & area terbuka
    if (noise3(x * 0.03, 1, z * 0.03) < 0.42) continue;
    const pick = Math.random();
    const kind = r > 150 && pick < 0.55 ? 'pine' : pick < 0.5 ? 'oak' : pick < 0.82 ? 'pine' : 'birch';
    types[kind].list.push([x, 0, z, 0.75 + Math.random() * 0.6]);
  }
  // pinus di kaki & lereng gunung (tanpa bayangan agar ringan)
  const farPines = [];
  for (let i = 0; i < (quality.trees > 300 ? 360 : 160); i++) {
    const r = MOUNTAIN_START - 10 + Math.random() * 120, a = Math.random() * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    const h = terrainHeight(x, z);
    if (h > 45) continue;
    farPines.push([x, Math.max(0, h) - 0.3, z, 0.9 + Math.random() * 0.9]);
  }

  // dikelompokkan per area (chunk) supaya pohon di luar layar/bayangan tidak ikut dirender
  const CHUNK = 110;
  const instanced = (geo, mat, items, shadow, tint) => {
    const cells = new Map();
    for (const it of items) {
      const k = Math.floor(it[0] / CHUNK) + ',' + Math.floor(it[2] / CHUNK);
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(it);
    }
    for (const list of cells.values()) {
      const m = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach(([x, y, z, s, rot, sx, sz, tr, tg, tb], i) => {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rot, 0);
        dummy.scale.set(s * sx, s, s * sz);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        if (tint) m.setColorAt(i, col.setRGB(tr, tg, tb));
      });
      m.computeBoundingSphere();
      m.castShadow = shadow; m.receiveShadow = true;
      scene.add(m);
    }
  };
  const decorate = (list) => list.map(([x, y, z, s]) => [x, y, z, s, Math.random() * Math.PI * 2, 0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2,
    0.8 + Math.random() * 0.35, 0.85 + Math.random() * 0.3, 0.7 + Math.random() * 0.35]);
  for (const t of Object.values(types)) {
    const list = decorate(t.list);
    instanced(t.trunk, t.tMat, list, true, false);
    instanced(t.crown, t.cMat, list, true, true);
  }
  const far = decorate(farPines);
  instanced(types.pine.trunk, types.pine.tMat, far, false, false);
  instanced(types.pine.crown, types.pine.cMat, far, false, true);

  // semak
  const bushes = new THREE.InstancedMesh(bushGeo(), leafMat, 260);
  let bn = 0;
  for (let i = 0; i < 2000 && bn < 260; i++) {
    const r = 20 + Math.random() * 210, a = Math.random() * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!isFree(x, z)) continue;
    const s = 0.6 + Math.random() * 0.9;
    dummy.position.set(x, -0.1, z); dummy.rotation.set(0, Math.random() * 6, 0); dummy.scale.set(s, s * 0.8, s); dummy.updateMatrix();
    bushes.setMatrixAt(bn, dummy.matrix);
    col.setRGB(0.8 + Math.random() * 0.4, 0.9 + Math.random() * 0.3, 0.7 + Math.random() * 0.4); bushes.setColorAt(bn, col);
    bn++;
  }
  bushes.count = bn;
  bushes.castShadow = bushes.receiveShadow = true;
  scene.add(bushes);

  // batu
  let rockGeo = new THREE.DodecahedronGeometry(1, 1);
  rockGeo.deleteAttribute('normal'); rockGeo.deleteAttribute('uv');
  rockGeo = mergeVertices(rockGeo);
  { const p = rockGeo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(0.8 + noise3(v.x * 2, v.y * 2, v.z * 2) * 0.45); p.setXYZ(i, v.x, v.y, v.z); } }
  rockGeo.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x8a8780, roughness: 0.95 }), 160);
  let rn = 0;
  for (let i = 0; i < 900 && rn < 160; i++) {
    const r = 25 + Math.random() * 210, a = Math.random() * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!isFree(x, z)) continue;
    const s = 0.3 + Math.random() * 1.4;
    dummy.position.set(x, s * 0.2, z); dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); dummy.scale.set(s, s * 0.65, s); dummy.updateMatrix();
    rocks.setMatrixAt(rn, dummy.matrix);
    { const k = 0.75 + Math.random() * 0.5; col.setRGB(k, k * 0.98, k * 0.95); } rocks.setColorAt(rn, col);
    rn++;
  }
  rocks.count = rn;
  rocks.castShadow = rocks.receiveShadow = true;
  scene.add(rocks);

  // ---------- pegunungan ----------
  const SIZE = 1500, SEG = quality.trees > 300 ? 240 : 160;
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  tg.rotateX(-Math.PI / 2);
  const p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, terrainHeight(p.getX(i), p.getZ(i)));
  tg.computeVertexNormals();
  const nrm = tg.attributes.normal;
  const grass = new THREE.Color(0x5a8a34), dry = new THREE.Color(0x8c8a52), rock = new THREE.Color(0x9a948a), rock2 = new THREE.Color(0x777168), snow = new THREE.Color(0xf7f9fc);
  tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(p.count * 3), 3));
  const colors = tg.attributes.color;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const slope = 1 - nrm.getY(i);
    const n = noise3(x * 0.05, 0, z * 0.05);
    c3.copy(grass).lerp(dry, Math.min(1, Math.max(0, (y - 15) / 40)) * 0.8 + n * 0.2);
    const rockK = smooth(0.18, 0.45, slope + (n - 0.5) * 0.15) * smooth(5, 25, y);
    c3.lerp(rockK > 0.5 ? rock2 : rock, Math.max(rockK, smooth(35, 60, y)));
    const snowK = smooth(62 + n * 20, 82 + n * 20, y) * (1 - smooth(0.5, 0.75, slope) * 0.6);
    c3.lerp(snow, snowK);
    colors.setXYZ(i, c3.r, c3.g, c3.b);
  }
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  return {
    update(dt, t) { windUniform.value = t; },
  };
}
const c3 = new THREE.Color();
