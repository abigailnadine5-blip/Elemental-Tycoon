// Suasana dunia: awan, burung, kunang-kunang, danau beriak, rumput bergoyang, lampu jalan.
// Semua bereaksi terhadap waktu (pagi/siang/senja/malam).
import * as THREE from 'three';
import { noise3, addWind } from './nature.js';
import { PLOT_POSITIONS } from './world.js';

import { LAKE, lakeRadius } from './riverpath.js';
export { LAKE };

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

export function createAmbient(scene, quality, isFree) {
  const hi = quality.trees > 300;
  const dummy = new THREE.Object3D();
  const cA = new THREE.Color(), cB = new THREE.Color();

  // ---------- awan ----------
  const cloudTex = canvasTex(256, 128, (g) => {
    for (let i = 0; i < 26; i++) {
      const x = 40 + Math.random() * 176, y = 50 + Math.random() * 40 - Math.abs(x - 128) * 0.15, r = 18 + Math.random() * 30;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  });
  const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: 0.9 });
  const clouds = [];
  for (let i = 0; i < (hi ? 34 : 18); i++) {
    const s = new THREE.Sprite(cloudMat);
    const a = Math.random() * Math.PI * 2, r = 80 + Math.random() * 650;
    s.position.set(Math.sin(a) * r, 150 + Math.random() * 110, Math.cos(a) * r);
    const w = 160 + Math.random() * 220;
    s.scale.set(w, w * (0.35 + Math.random() * 0.15), 1);
    scene.add(s);
    clouds.push({ s, speed: 3 + Math.random() * 4 });
  }

  // ---------- burung ----------
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x1d1d22, side: THREE.DoubleSide, fog: true });
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.25, 0, 0, 0.25, 1.1, 0, 0.05], 3));
  const flocks = [];
  for (let f = 0; f < 4; f++) {
    const g = new THREE.Group();
    const birds = [];
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Group();
      const L = new THREE.Mesh(wingGeo, birdMat), R = new THREE.Mesh(wingGeo, birdMat);
      R.scale.x = -1;
      b.add(L, R);
      b.position.set((i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.6, Math.random() * 0.6, -Math.ceil(i / 2) * 1.6);
      g.add(b);
      birds.push({ L, R, ph: Math.random() * 6 });
    }
    scene.add(g);
    flocks.push({ g, birds, r: 70 + Math.random() * 110, h: 35 + Math.random() * 25, speed: 0.08 + Math.random() * 0.05, a: Math.random() * 6, cx: (Math.random() - 0.5) * 80, cz: (Math.random() - 0.5) * 80 });
  }

  // ---------- kunang-kunang ----------
  const FF = hi ? 380 : 180;
  const ffBase = [];
  const ffPos = new Float32Array(FF * 3);
  for (let i = 0; i < FF; i++) {
    let x, z, k = 0;
    do { const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 160; x = Math.sin(a) * r; z = Math.cos(a) * r; } while (!isFree(x, z) && ++k < 20);
    ffBase.push([x, 0.6 + Math.random() * 2.5, z, Math.random() * 10]);
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({ map: glowTex, color: new THREE.Color(0xd4ff6a).multiplyScalar(2), size: 0.55, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  fireflies.frustumCulled = false;
  scene.add(fireflies);

  // ---------- danau (air & cekungan dibuat di river.js) ----------
  // dermaga kayu kecil
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5435, roughness: 0.85 });
  const dock = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 9), wood); deck.position.y = 0.35; deck.castShadow = deck.receiveShadow = true; dock.add(deck);
  for (const x of [-1, 1]) for (const z of [-4, 0, 4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.6), wood); p.position.set(x, -1.5, z); dock.add(p); }
  dock.position.set(LAKE.x - LAKE.r * 0.6, 0, LAKE.z - LAKE.r * 0.6);
  dock.rotation.y = Math.PI / 4;
  scene.add(dock);
  // alang-alang di tepi danau
  const reedGeo = new THREE.ConeGeometry(0.06, 1.8, 4); reedGeo.translate(0, 0.9, 0);
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x6d8a3a, roughness: 0.9 });
  addWind(reedMat, 0.05);
  const reeds = new THREE.InstancedMesh(reedGeo, reedMat, 160);
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2, r = lakeRadius(a) * (1.06 + Math.random() * 0.2);
    dummy.position.set(LAKE.x + Math.cos(a) * r, 0, LAKE.z + Math.sin(a) * r);
    dummy.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
    dummy.scale.setScalar(0.6 + Math.random() * 0.8);
    dummy.updateMatrix(); reeds.setMatrixAt(i, dummy.matrix);
  }
  scene.add(reeds);

  // ---------- rumput ----------
  const grassTex = canvasTex(64, 64, (g) => {
    for (let i = 0; i < 14; i++) {
      const x = 6 + Math.random() * 52, h = 30 + Math.random() * 32, lean = (Math.random() - 0.5) * 16;
      const gr = g.createLinearGradient(0, 64, 0, 64 - h);
      gr.addColorStop(0, '#2f5a1c'); gr.addColorStop(1, '#8fbf4a');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x - 2.5, 64); g.quadraticCurveTo(x + lean * 0.4, 64 - h * 0.5, x + lean, 64 - h); g.quadraticCurveTo(x + lean * 0.4 + 1, 64 - h * 0.5, x + 2.5, 64); g.fill();
    }
  });
  const gp = [];
  for (const r of [0, Math.PI / 2]) { const p = new THREE.PlaneGeometry(1.3, 0.9); p.translate(0, 0.45, 0); p.rotateY(r); gp.push(p); }
  const grassGeo = new THREE.BufferGeometry();
  { // gabung 2 bidang menyilang
    const pos = [], uv = [], nor = [], idx = [];
    let base = 0;
    for (const p of gp) {
      pos.push(...p.attributes.position.array); uv.push(...p.attributes.uv.array);
      for (let i = 0; i < p.attributes.position.count; i++) nor.push(0, 1, 0);
      idx.push(...Array.from(p.index.array, (v) => v + base));
      base += p.attributes.position.count;
    }
    grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    grassGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    grassGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    grassGeo.setIndex(idx);
  }
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1 });
  addWind(grassMat, 0.12, 0.0);
  const GN = hi ? 7000 : 2500;
  const cells = new Map();
  for (let i = 0; i < GN; i++) {
    const a = Math.random() * Math.PI * 2, r = 16 + Math.sqrt(Math.random()) * 175;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!isFree(x, z) || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.15) continue;
    const k = Math.floor(x / 60) + ',' + Math.floor(z / 60);
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push([x, z]);
  }
  for (const list of cells.values()) {
    const m = new THREE.InstancedMesh(grassGeo, grassMat, list.length);
    list.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z); dummy.rotation.set(0, Math.random() * Math.PI, 0);
      const s = 0.6 + Math.random() * 0.8; dummy.scale.set(s, s * (0.8 + Math.random() * 0.5), s);
      dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      const v = 0.75 + noise3(x * 0.05, 0, z * 0.05) * 0.5;
      m.setColorAt(i, cA.setRGB(v * 0.95, v, v * 0.8));
    });
    m.computeBoundingSphere();
    m.receiveShadow = true;
    scene.add(m);
  }

  // ---------- lampu jalan ----------
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2f35, metalness: 0.7, roughness: 0.45 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xbdb6a6, emissive: 0xffd58a, emissiveIntensity: 0.1, roughness: 0.4 });
  const haloMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffcc77, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const lampSpots = [];
  for (const p of PLOT_POSITIONS) {
    const dir = p.clone().normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    for (let d = 22; d < p.length() - 22; d += 9) for (const s of [-1, 1]) lampSpots.push(dir.clone().multiplyScalar(d).addScaledVector(side, s * 4.2));
  }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; lampSpots.push(new THREE.Vector3(Math.sin(a) * 18.5, 0, Math.cos(a) * 18.5)); }
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 4.4, 8).translate(0, 2.2, 0), postMat, lampSpots.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 12, 8).translate(0, 4.55, 0), bulbMat, lampSpots.length);
  lampSpots.forEach((p, i) => {
    dummy.position.copy(p); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix); heads.setMatrixAt(i, dummy.matrix);
    const h = new THREE.Sprite(haloMat); h.position.copy(p).setY(4.55); h.scale.setScalar(2.6); scene.add(h);
  });
  posts.castShadow = true;
  scene.add(posts, heads);

  // ---------- update ----------
  function update(dt, t, st, camPos) {
    const { night, golden } = st;
    // awan: warna ikut waktu
    cA.set(0xffffff).lerp(cB.set(0xffb07a), golden).lerp(cB.set(0x2a3350), night);
    cloudMat.color.copy(cA);
    cloudMat.opacity = 0.9 - night * 0.35;
    for (const c of clouds) {
      c.s.position.x += c.speed * dt;
      if (c.s.position.x > 750) c.s.position.x = -750;
    }
    // burung (siang saja)
    for (const f of flocks) {
      f.g.visible = night < 0.7;
      if (!f.g.visible) continue;
      f.a += f.speed * dt;
      const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r;
      f.g.position.set(x, f.h + Math.sin(t * 0.5 + f.r) * 3, z);
      f.g.rotation.y = -f.a;
      for (const b of f.birds) { const w = Math.sin(t * 9 + b.ph) * 0.7; b.L.rotation.z = w; b.R.rotation.z = -w; }
    }
    // kunang-kunang (malam)
    ffMat.opacity = night;
    fireflies.visible = night > 0.02;
    if (fireflies.visible) {
      for (let i = 0; i < FF; i++) {
        const [x, y, z, ph] = ffBase[i];
        ffPos[i * 3] = x + Math.sin(t * 0.4 + ph) * 1.6;
        ffPos[i * 3 + 1] = y + Math.sin(t * 0.9 + ph * 2) * 0.5;
        ffPos[i * 3 + 2] = z + Math.cos(t * 0.35 + ph) * 1.6;
      }
      ffGeo.attributes.position.needsUpdate = true;
      ffMat.size = 0.4 + Math.sin(t * 3) * 0.1;
    }
    // riak air
    // lampu jalan menyala saat gelap
    bulbMat.emissiveIntensity = 0.1 + night * 2.4 + golden * 0.6;
    haloMat.opacity = Math.min(0.7, night * 0.75 + golden * 0.15);
  }

  return { update };
}
