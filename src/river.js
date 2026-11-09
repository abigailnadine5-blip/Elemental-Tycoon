// Sungai: air mengalir (normal map bergerak searah arus), dasar sungai berpasir/berlumpur,
// batu di tepi, batu pijakan untuk menyeberang, dan alang-alang.
import * as THREE from 'three';
import { RIVERS, LAKE, riverWidth } from './riverpath.js';
import { terrainHeight, noise3, addWind } from './nature.js';

function normalTexture() {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  // gelombang memanjang searah arus + riak kecil
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

function ribbon(samples, widthFn, yOff) {
  const pos = [], uv = [], idx = [];
  let len = 0;
  const kept = samples.filter((p) => Math.hypot(p.x - LAKE.x, p.z - LAKE.z) > LAKE.r * 0.82);
  for (let i = 0; i < kept.length; i++) {
    const p = kept[i];
    const a = kept[Math.max(0, i - 1)], b = kept[Math.min(kept.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    if (i > 0) len += Math.hypot(p.x - kept[i - 1].x, p.z - kept[i - 1].z);
    const w = widthFn(p.x, p.z) * (0.9 + noise3(p.x * 0.05, 7, p.z * 0.05) * 0.25);
    for (const s of [-1, 1]) {
      const x = p.x + nx * w * 0.5 * s, z = p.z + nz * w * 0.5 * s;
      pos.push(x, Math.max(0, terrainHeight(x, z)) + yOff, z);
      uv.push(s < 0 ? 0 : 1, len / 7);
    }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geo: g, kept };
}

export function createRiver(scene, quality) {
  const norm = normalTexture();
  norm.repeat.set(1, 1);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2a6f8c, roughness: 0.05, metalness: 0.15, normalMap: norm, normalScale: new THREE.Vector2(0.7, 0.7), transparent: true, opacity: 0.88, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x6f6247, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xbfae84, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const dummy = new THREE.Object3D();
  const rockSpots = [], reedSpots = [], steps = [];

  for (const rv of RIVERS) {
    const sand = ribbon(rv.samples, (x, z) => riverWidth(x, z) + 5, 0.03);
    const bed = ribbon(rv.samples, (x, z) => riverWidth(x, z) + 1.4, 0.06);
    const water = ribbon(rv.samples, riverWidth, 0.13);
    const ms = new THREE.Mesh(sand.geo, sandMat); ms.receiveShadow = true;
    const mb = new THREE.Mesh(bed.geo, bedMat); mb.receiveShadow = true;
    const mw = new THREE.Mesh(water.geo, waterMat); mw.receiveShadow = true;
    scene.add(ms, mb, mw);

    // batu tepi sungai & alang-alang
    const kept = water.kept;
    kept.forEach((p, i) => {
      if (i === 0 || i === kept.length - 1) return;
      const a = kept[i - 1], b = kept[i + 1];
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      const w = riverWidth(p.x, p.z);
      const y = Math.max(0, terrainHeight(p.x, p.z));
      if (Math.random() < 0.55) { const s = Math.random() < 0.5 ? -1 : 1; rockSpots.push([p.x + nx * (w * 0.5 + 0.6 + Math.random() * 1.5) * s, y, p.z + nz * (w * 0.5 + 0.6) * s, 0.3 + Math.random() * 0.8]); }
      if (Math.hypot(p.x, p.z) < 240 && Math.random() < 0.7) for (let k = 0; k < 3; k++) { const s = Math.random() < 0.5 ? -1 : 1; reedSpots.push([p.x + nx * (w * 0.5 + Math.random() * 1.6) * s + (Math.random() - 0.5), y, p.z + nz * (w * 0.5 + Math.random() * 1.6) * s + (Math.random() - 0.5)]); }
      // batu pijakan di beberapa titik
      if (i % 22 === 11 && Math.hypot(p.x, p.z) < 230) for (let k = -2; k <= 2; k++) steps.push([p.x + nx * k * w * 0.2, y, p.z + nz * k * w * 0.2]);
    });
  }

  let rockGeo = new THREE.DodecahedronGeometry(1, 1);
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x8b8880, roughness: 0.9, flatShading: true }), rockSpots.length + steps.length);
  let n = 0;
  for (const [x, y, z, s] of rockSpots) {
    dummy.position.set(x, y + s * 0.15, z); dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); dummy.scale.set(s, s * 0.6, s); dummy.updateMatrix();
    rocks.setMatrixAt(n++, dummy.matrix);
  }
  for (const [x, y, z] of steps) {
    dummy.position.set(x, y + 0.12, z); dummy.rotation.set(0, Math.random() * 3, 0); dummy.scale.set(0.9, 0.22, 0.8); dummy.updateMatrix();
    rocks.setMatrixAt(n++, dummy.matrix);
  }
  rocks.count = n;
  rocks.castShadow = rocks.receiveShadow = true;
  scene.add(rocks);

  const reedGeo = new THREE.ConeGeometry(0.06, 1.8, 4); reedGeo.translate(0, 0.9, 0);
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x6d8a3a, roughness: 0.9 });
  addWind(reedMat, 0.05, 0);
  const reeds = new THREE.InstancedMesh(reedGeo, reedMat, reedSpots.length);
  reedSpots.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z); dummy.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3); dummy.scale.setScalar(0.5 + Math.random() * 0.8); dummy.updateMatrix();
    reeds.setMatrixAt(i, dummy.matrix);
  });
  scene.add(reeds);

  const cA = new THREE.Color(), cB = new THREE.Color();
  return {
    update(dt, t, st) {
      norm.offset.y -= dt * 0.22; // arus
      norm.offset.x = Math.sin(t * 0.3) * 0.05;
      waterMat.color.copy(cA.set(0x2a6f8c).lerp(cB.set(0x7a4a3a), st.golden * 0.35).lerp(cB.set(0x07121e), st.night * 0.8));
    },
  };
}
