// Sungai & danau yang BISA DIRENANGI:
//  - tanah dilubangi (mask) di jalur sungai & danau
//  - di bawahnya ada cekungan: tepian landai -> dasar dalam (sungai ±2.5, danau ±3.4)
//  - permukaan air (WATER_Y) dengan riak yang mengalir searah arus
//  - batu di tepi, batu pijakan, alang-alang
import * as THREE from 'three';
import { RIVERS, LAKE, riverWidth, riverProfile, lakeRadius, LAKE_PROFILE, WATER_Y } from './riverpath.js';
import { terrainHeight, noise3, addWind } from './nature.js';

const GROUND_SIZE = 900;

function normalTexture() {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const H = (x, y) => noise3(x / 26, y / 9, 1.5) * 0.6 + noise3(x / 8, y / 5, 4.5) * 0.4;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = H((x + 1) % S, y) - H((x - 1 + S) % S, y), dy = H(x, (y + 1) % S) - H(x, (y - 1 + S) % S);
    const i = (y * S + x) * 4;
    img.data[i] = 128 + dx * 300; img.data[i + 1] = 128 + dy * 300; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const BED_TOP = new THREE.Color(0xbfae84), BED_MID = new THREE.Color(0x8a7a58), BED_DEEP = new THREE.Color(0x4c4130);
function bedColor(y, c) {
  if (y > -0.2) return c.copy(BED_TOP);
  if (y > -1.4) return c.copy(BED_TOP).lerp(BED_MID, (-0.2 - y) / 1.2);
  return c.copy(BED_MID).lerp(BED_DEEP, Math.min(1, (-1.4 - y) / 1.8));
}

const keepOutsideLake = (samples) => samples.filter((p) => Math.hypot(p.x - LAKE.x, p.z - LAKE.z) > LAKE.r * 0.97);

// pita sepanjang sungai dengan penampang (offset, tinggi) per titik
function sweep(samples, profileFn, yBase, colorFn) {
  const pos = [], uv = [], col = [], idx = [];
  const c = new THREE.Color();
  let len = 0, P = 0;
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    if (i > 0) len += Math.hypot(p.x - samples[i - 1].x, p.z - samples[i - 1].z);
    const prof = profileFn(riverWidth(p.x, p.z));
    P = prof.length;
    const base = yBase(p);
    prof.forEach(([o, y], j) => {
      const x = p.x + nx * o, z = p.z + nz * o;
      pos.push(x, base + y, z);
      uv.push(j / (prof.length - 1), len / 7);
      if (colorFn) { colorFn(y, c); col.push(c.r, c.g, c.b); }
    });
    if (i > 0) for (let j = 0; j < P - 1; j++) {
      const a0 = (i - 1) * P + j, a1 = a0 + 1, b0 = i * P + j, b1 = b0 + 1;
      idx.push(a0, a1, b0, a1, b1, b0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// penampang lengkap: kiri -> tengah -> kanan
const fullProfile = (w) => {
  const half = riverProfile(w);
  return [...half.map(([o, y]) => [-o, y]), ...half.slice(0, -1).reverse().map(([o, y]) => [o, y])];
};
const waterProfile = (w) => [[-(w / 2 + 0.35), WATER_Y], [w / 2 + 0.35, WATER_Y]];

// mangkuk danau (cincin x sudut)
function lakeBowl(profile, colorFn) {
  const A = 72;
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  for (let i = 0; i <= A; i++) {
    const a = (i / A) * Math.PI * 2, R = lakeRadius(a);
    for (const [f, y] of profile) {
      pos.push(LAKE.x + Math.cos(a) * R * f, y, LAKE.z + Math.sin(a) * R * f);
      if (colorFn) { colorFn(y, c); col.push(c.r, c.g, c.b); }
    }
  }
  const P = profile.length;
  for (let i = 0; i < A; i++) for (let j = 0; j < P - 1; j++) {
    const a0 = i * P + j, a1 = a0 + 1, b0 = (i + 1) * P + j, b1 = b0 + 1;
    idx.push(a0, a1, b0, a1, b1, b0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Lubangi tanah rumput di jalur sungai & danau (shader membuang piksel di area mask)
export function applyWaterHoles(groundMat) {
  const S = 2048, k = S / GROUND_SIZE;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  g.strokeStyle = g.fillStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
  const X = (x) => (x + GROUND_SIZE / 2) * k, Z = (z) => (z + GROUND_SIZE / 2) * k;
  for (const rv of RIVERS) {
    const s = keepOutsideLake(rv.samples).length ? rv.samples : rv.samples;
    for (let i = 1; i < s.length; i++) {
      const w = riverWidth(s[i].x, s[i].z);
      g.lineWidth = (w + 1.6) * k;
      g.beginPath(); g.moveTo(X(s[i - 1].x), Z(s[i - 1].z)); g.lineTo(X(s[i].x), Z(s[i].z)); g.stroke();
    }
  }
  g.beginPath();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2, R = lakeRadius(a) * 1.08;
    const x = X(LAKE.x + Math.cos(a) * R), z = Z(LAKE.z + Math.sin(a) * R);
    if (i === 0) g.moveTo(x, z); else g.lineTo(x, z);
  }
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.flipY = false; // baris kanvas = arah z dunia
  groundMat.onBeforeCompile = (sh) => {
    sh.uniforms.uHoles = { value: tex };
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform sampler2D uHoles;\nvarying vec3 vWPos;\n' + sh.fragmentShader.replace('void main() {', `void main() {
      vec2 huv = (vWPos.xz + ${(GROUND_SIZE / 2).toFixed(1)}) / ${GROUND_SIZE.toFixed(1)};
      if (huv.x > 0.0 && huv.x < 1.0 && huv.y > 0.0 && huv.y < 1.0 && texture2D(uHoles, huv).r > 0.5) discard;`);
  };
  groundMat.customProgramCacheKey = () => 'ground-holes';
  groundMat.needsUpdate = true;
}

export function createRiver(scene, quality) {
  const norm = normalTexture();
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2a6f8c, roughness: 0.05, metalness: 0.15, normalMap: norm, normalScale: new THREE.Vector2(0.7, 0.7), transparent: true, opacity: 0.82, depthWrite: false });
  const bedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const dummy = new THREE.Object3D();
  const rockSpots = [], reedSpots = [], steps = [];
  const baseY = (p) => Math.max(0, terrainHeight(p.x, p.z));

  for (const rv of RIVERS) {
    // cekungan sungai (sampai sedikit masuk danau agar tersambung)
    const bed = new THREE.Mesh(sweep(keepOutsideLake(rv.samples), fullProfile, baseY, bedColor), bedMat);
    bed.receiveShadow = true;
    scene.add(bed);
    const water = new THREE.Mesh(sweep(keepOutsideLake(rv.samples), waterProfile, baseY), waterMat);
    water.renderOrder = 2;
    scene.add(water);

    const kept = keepOutsideLake(rv.samples).filter((p) => Math.hypot(p.x - LAKE.x, p.z - LAKE.z) > LAKE.r * 1.15);
    kept.forEach((p, i) => {
      if (i === 0 || i === kept.length - 1) return;
      const a = kept[i - 1], b = kept[i + 1];
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      const w = riverWidth(p.x, p.z);
      const y = baseY(p);
      if (Math.random() < 0.55) { const s = Math.random() < 0.5 ? -1 : 1; const o = w * 0.5 + 1.2 + Math.random() * 1.6; rockSpots.push([p.x + nx * o * s, y, p.z + nz * o * s, 0.3 + Math.random() * 0.8]); }
      if (Math.hypot(p.x, p.z) < 240 && Math.random() < 0.7) for (let k = 0; k < 3; k++) { const s = Math.random() < 0.5 ? -1 : 1; const o = w * 0.5 + 0.8 + Math.random() * 1.8; reedSpots.push([p.x + nx * o * s + (Math.random() - 0.5), y, p.z + nz * o * s + (Math.random() - 0.5)]); }
      // batu pijakan (menonjol di atas air)
      if (i % 22 === 11 && Math.hypot(p.x, p.z) < 230) for (let k = -2; k <= 2; k++) steps.push([p.x + nx * k * w * 0.22, y, p.z + nz * k * w * 0.22]);
    });
  }

  // danau
  const lakeBed = new THREE.Mesh(lakeBowl(LAKE_PROFILE, bedColor), bedMat);
  lakeBed.receiveShadow = true;
  scene.add(lakeBed);
  const lakeNorm = norm.clone(); lakeNorm.repeat.set(6, 6); lakeNorm.needsUpdate = true;
  const lakeMat = waterMat.clone(); lakeMat.normalMap = lakeNorm;
  const lakeWater = new THREE.Mesh(lakeBowl([[1.04, WATER_Y], [0, WATER_Y]]), lakeMat);
  // UV untuk normal map danau
  { const p = lakeWater.geometry.attributes.position; const uv = [];
    for (let i = 0; i < p.count; i++) uv.push((p.getX(i) - LAKE.x) / 40, (p.getZ(i) - LAKE.z) / 40);
    lakeWater.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); }
  lakeWater.renderOrder = 2;
  scene.add(lakeWater);

  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x8b8880, roughness: 0.9, flatShading: true }), rockSpots.length + steps.length);
  let n = 0;
  for (const [x, y, z, s] of rockSpots) {
    dummy.position.set(x, y + s * 0.15, z); dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); dummy.scale.set(s, s * 0.6, s); dummy.updateMatrix();
    rocks.setMatrixAt(n++, dummy.matrix);
  }
  for (const [x, y, z] of steps) {
    dummy.position.set(x, y - 1.0, z); dummy.rotation.set(0, Math.random() * 3, 0); dummy.scale.set(0.9, 1.0, 0.8); dummy.updateMatrix();
    rocks.setMatrixAt(n++, dummy.matrix);
  }
  rocks.count = n;
  rocks.castShadow = rocks.receiveShadow = true;
  scene.add(rocks);

  const reedGeo = new THREE.ConeGeometry(0.06, 1.8, 4); reedGeo.translate(0, 0.9, 0);
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x6d8a3a, roughness: 0.9 });
  addWind(reedMat, 0.05, 0);
  const reeds = new THREE.InstancedMesh(reedGeo, reedMat, Math.max(1, reedSpots.length));
  reedSpots.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z); dummy.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3); dummy.scale.setScalar(0.5 + Math.random() * 0.8); dummy.updateMatrix();
    reeds.setMatrixAt(i, dummy.matrix);
  });
  reeds.count = reedSpots.length;
  scene.add(reeds);

  const cA = new THREE.Color(), cB = new THREE.Color();
  return {
    update(dt, t, st) {
      norm.offset.y -= dt * 0.22; // arus sungai
      norm.offset.x = Math.sin(t * 0.3) * 0.05;
      lakeNorm.offset.set(t * 0.012, t * 0.008);
      cA.set(0x2a6f8c).lerp(cB.set(0x7a4a3a), st.golden * 0.35).lerp(cB.set(0x07121e), st.night * 0.8);
      waterMat.color.copy(cA); lakeMat.color.copy(cA);
    },
  };
}
