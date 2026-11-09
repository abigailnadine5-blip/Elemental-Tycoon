// Logika & visual plot tycoon: dropper -> conveyor -> upgrader -> collector -> pad uang.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { concreteTexture, beltTexture, makeLabel } from './textures.js';
import { createAvatar } from './character.js';
import { fmt, easeOutBack } from './util.js';

export const PLOT_HALF = 20;
const BASE_TOP = 0.3;
const BELT_Z = -8, BELT_TOP = 1.3, BELT_X0 = -17.5, BELT_X1 = 12, COLLECT_X = 12.1;
export const BELT_SPEED = 3.2;
const DROP_Y = 3.4;
const COLLECT_PAD = new THREE.Vector3(13.6, BASE_TOP, -2.5);
export const SPAWN_LOCAL = new THREE.Vector3(0, BASE_TOP, 18);
export const START_CASH = 10;

// Daftar item yang bisa dibeli. pad = posisi tombol beli (lokal plot).
export const ITEMS = [
  { id: 'dropper1', name: 'Dropper I', price: 0, req: [], type: 'dropper', x: -13, value: 4, interval: 1.6, pad: [-14, 3] },
  { id: 'dropper2', name: 'Dropper II', price: 60, req: ['dropper1'], type: 'dropper', x: -10, value: 8, interval: 1.6, pad: [-8.4, 3] },
  { id: 'dropper3', name: 'Dropper III', price: 220, req: ['dropper2'], type: 'dropper', x: -7, value: 15, interval: 1.5, pad: [-2.8, 3] },
  { id: 'upgrader1', name: 'Upgrader x1.5', price: 450, req: ['dropper2'], type: 'upgrader', x: 5, mult: 1.5, pad: [2.8, 3] },
  { id: 'dropper4', name: 'Dropper IV', price: 1000, req: ['dropper3'], type: 'dropper', x: -4, value: 30, interval: 1.5, pad: [8.4, 3] },
  { id: 'walls', name: 'Tembok Markas', price: 1600, req: ['upgrader1'], type: 'walls', pad: [14, 3] },
  { id: 'dropper5', name: 'Dropper V', price: 3200, req: ['dropper4'], type: 'dropper', x: -1, value: 60, interval: 1.4, pad: [-14, 8] },
  { id: 'lamps', name: 'Lampu Taman', price: 4500, req: ['walls'], type: 'lamps', pad: [-8.4, 8] },
  { id: 'upgrader2', name: 'Upgrader x2', price: 8000, req: ['dropper5'], type: 'upgrader', x: 8, mult: 2, pad: [-2.8, 8] },
  { id: 'autocollect', name: 'Auto Collector', price: 14000, req: ['upgrader2'], type: 'auto', pad: [2.8, 8] },
  { id: 'dropper6', name: 'Dropper VI', price: 22000, req: ['dropper5'], type: 'dropper', x: 2, value: 130, interval: 1.3, pad: [8.4, 8] },
  { id: 'tower', name: 'Menara Elemen x2', price: 55000, req: ['dropper6', 'upgrader2'], type: 'tower', mult: 2, pad: [14, 8] },
  { id: 'mega', name: 'Mega Dropper', price: 130000, req: ['tower'], type: 'dropper', x: -15.8, value: 700, interval: 2.4, big: true, pad: [-14, 13] },
  { id: 'upgrader3', name: 'Upgrader x3', price: 350000, req: ['mega'], type: 'upgrader', x: 10.4, mult: 3, pad: [-8.4, 13] },
  { id: 'statue', name: 'Patung Legenda x2', price: 1000000, req: ['upgrader3'], type: 'statue', mult: 2, pad: [-2.8, 13] },
  { id: 'rebirth', name: '♻ REBIRTH (+50%)', price: 2500000, req: ['statue'], type: 'rebirth', pad: [2.8, 13] },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

// ---------- material & geometri bersama ----------
const M = {
  concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(5, 196), roughness: 0.9, color: 0x9a9da3 }),
  wall: new THREE.MeshStandardMaterial({ map: concreteTexture(3, 225), roughness: 0.85, color: 0xb8b2a8 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.95, roughness: 0.32 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2f35, metalness: 0.75, roughness: 0.45 }),
  black: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffc94a, metalness: 1, roughness: 0.22 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffe2a0, emissiveIntensity: 3 }),
  grey: new THREE.MeshStandardMaterial({ color: 0x777777, emissive: 0x333333, roughness: 0.5 }),
};
const ORE_GEO = new RoundedBoxGeometry(0.55, 0.55, 0.55, 2, 0.08);
const PAD_GEO = new THREE.CylinderGeometry(1.25, 1.25, 0.18, 32);
const UPG_COLORS = { 1.5: 0x00e676, 2: 0x2979ff, 3: 0xd500f9 };

function box(w, h, d, mat, parent, x, y, z, rounded = false) {
  const geo = rounded ? new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.12) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

const tmpV = new THREE.Vector3();

export class Plot {
  constructor(scene, index, center, particles) {
    this.index = index;
    this.center = center.clone();
    this.angle = Math.atan2(-center.x, -center.z); // menghadap ke plaza
    this.group = new THREE.Group();
    this.group.position.copy(center);
    this.group.rotation.y = this.angle;
    scene.add(this.group);
    this.group.updateMatrixWorld(true);
    this.inv = this.group.matrixWorld.clone().invert();
    this.particles = particles;

    this.items = new Set();
    this.objects = {};
    this.droppers = [];
    this.upgraders = [];
    this.ores = [];
    this.spinners = [];
    this.floaters = [];
    this.building = [];
    this.bank = 0;
    this.element = null;
    this.owner = null;
    this.ownerName = '';
    this.isLocal = false;
    this.colliders = [];
    this.itemColliders = {};
    this.globalMult = 1;
    this.earned = 0;

    this.trimMat = M.grey.clone();
    this.colorMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.6, roughness: 0.35 });
    this.oreMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    this.specialMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd54f, emissiveIntensity: 2, metalness: 1, roughness: 0.15 });
    this.beltTex = beltTexture();
    this.beltTex.repeat.set((BELT_X1 - BELT_X0) / 2, 1);

    this.buildBase();
    this.pads = {};
    for (const it of ITEMS) this.createPad(it);
  }

  // ---- konversi koordinat ----
  toLocal(world, out) { return out.copy(world).applyMatrix4(this.inv); }
  toWorld(local, out) { return out.copy(local).applyMatrix4(this.group.matrixWorld); }
  localDir(x, z, out) { return out.set(x, 0, z).applyQuaternion(this.group.quaternion); }

  addCollider(c, list = this.colliders) { list.push(c); return c; }

  buildBase() {
    const g = this.group;
    const slab = box(PLOT_HALF * 2, BASE_TOP, PLOT_HALF * 2, M.concrete, g, 0, BASE_TOP / 2, 0);
    slab.castShadow = false;
    this.addCollider({ x0: -20, x1: 20, z0: -20, z1: 20, y0: -1, y1: BASE_TOP });
    // garis tepi bercahaya
    for (const [w, d, x, z] of [[40.3, 0.3, 0, 20], [40.3, 0.3, 0, -20], [0.3, 40.3, 20, 0], [0.3, 40.3, -20, 0]]) {
      const m = box(w, 0.12, d, this.trimMat, g, x, BASE_TOP + 0.02, z);
      m.castShadow = false;
    }
    // conveyor
    const len = BELT_X1 - BELT_X0, cx = (BELT_X0 + BELT_X1) / 2;
    box(len, 0.95, 2.3, M.dark, g, cx, BASE_TOP + 0.475, BELT_Z);
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.0), new THREE.MeshStandardMaterial({ map: this.beltTex, roughness: 0.75 }));
    belt.rotation.x = -Math.PI / 2;
    belt.position.set(cx, BELT_TOP - 0.02, BELT_Z);
    belt.receiveShadow = true;
    g.add(belt);
    for (const s of [-1, 1]) {
      box(len, 0.22, 0.14, M.metal, g, cx, BELT_TOP + 0.08, BELT_Z + s * 1.1);
      box(len, 0.06, 0.16, this.trimMat, g, cx, BELT_TOP - 0.3, BELT_Z + s * 1.16).castShadow = false;
    }
    this.addCollider({ x0: BELT_X0, x1: BELT_X1, z0: BELT_Z - 1.18, z1: BELT_Z + 1.18, y0: 0, y1: BELT_TOP, belt: true });
    // collector
    box(3.4, 3.6, 3.4, M.dark, g, 13.7, BASE_TOP + 1.8, BELT_Z, true);
    box(0.1, 1.5, 2.2, M.black, g, 11.97, BELT_TOP + 0.6, BELT_Z);
    box(0.14, 1.7, 0.16, this.trimMat, g, 11.95, BELT_TOP + 0.6, BELT_Z - 1.18);
    box(0.14, 1.7, 0.16, this.trimMat, g, 11.95, BELT_TOP + 0.6, BELT_Z + 1.18);
    box(3.5, 0.18, 3.5, this.trimMat, g, 13.7, BASE_TOP + 3.2, BELT_Z);
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.2, 16), M.metal);
    chim.position.set(14.4, BASE_TOP + 4.6, BELT_Z - 0.6); chim.castShadow = true; g.add(chim);
    this.chimneyTop = new THREE.Vector3(14.4, BASE_TOP + 5.8, BELT_Z - 0.6);
    this.addCollider({ x0: 12, x1: 15.4, z0: BELT_Z - 1.7, z1: BELT_Z + 1.7, y0: 0, y1: BASE_TOP + 3.6 });

    // pad uang
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, emissive: 0x00e676, emissiveIntensity: 0.9, roughness: 0.4 });
    const cp = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 40), padMat);
    cp.position.copy(COLLECT_PAD).setY(BASE_TOP + 0.1);
    cp.receiveShadow = true;
    g.add(cp);
    this.collectPadMesh = cp;
    this.bankLabel = makeLabel([{ text: '💰 $0', color: '#7dff9b', size: 50 }, { text: 'Injak untuk ambil uang', size: 30 }], { scale: 1.2 });
    this.bankLabel.sprite.position.copy(COLLECT_PAD).setY(3.4);
    g.add(this.bankLabel.sprite);
    this.lastBankText = '';

    // papan nama
    box(0.25, 3.2, 0.25, M.metal, g, -7.5, 1.6, 19.4);
    box(0.25, 3.2, 0.25, M.metal, g, -3.5, 1.6, 19.4);
    box(4.4, 1.2, 0.2, this.colorMat, g, -5.5, 2.9, 19.4, true);
    this.addCollider({ x0: -7.7, x1: -7.3, z0: 19.2, z1: 19.6, y0: 0, y1: 3.2 });
    this.addCollider({ x0: -3.7, x1: -3.3, z0: 19.2, z1: 19.6, y0: 0, y1: 3.2 });
    this.signLabel = makeLabel([{ text: 'PLOT KOSONG', color: '#cccccc', size: 48 }], { scale: 1.15 });
    this.signLabel.sprite.position.set(-5.5, 4.6, 19.4);
    g.add(this.signLabel.sprite);
  }

  createPad(it) {
    const g = new THREE.Group();
    g.position.set(it.pad[0], BASE_TOP + 0.09, it.pad[1]);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0f3d18, emissive: 0x00e676, emissiveIntensity: 1, roughness: 0.4 });
    const m = new THREE.Mesh(PAD_GEO, mat);
    m.receiveShadow = true;
    g.add(m);
    const label = makeLabel([{ text: it.name, size: 40 }, { text: fmt(it.price), color: '#7dff9b', size: 46 }], { scale: 1.05 });
    label.sprite.position.y = 2.2;
    g.add(label.sprite);
    g.visible = false;
    this.group.add(g);
    this.pads[it.id] = { group: g, mat, label, item: it, state: '' };
  }

  // ---------- kepemilikan & elemen ----------
  setOwner(name, el, isLocal, ownerId = null) {
    this.ownerName = name;
    this.owner = ownerId;
    this.isLocal = isLocal;
    this.setElement(el);
    this.signLabel.set([{ text: (isLocal ? '⭐ ' : '') + 'Markas ' + name, color: '#' + el.glow.toString(16).padStart(6, '0'), size: 46 }]);
  }

  clearOwner() {
    this.reset();
    this.owner = null; this.ownerName = ''; this.isLocal = false; this.element = null;
    this.trimMat.copy(M.grey);
    this.colorMat.color.set(0x9e9e9e);
    this.signLabel.set([{ text: 'PLOT KOSONG', color: '#cccccc', size: 48 }]);
    for (const p of Object.values(this.pads)) p.group.visible = false;
  }

  setElement(el) {
    this.element = el;
    this.trimMat.color.set(el.color);
    this.trimMat.emissive.set(el.color);
    this.trimMat.emissiveIntensity = 1.4;
    this.colorMat.color.set(el.color);
    const o = el.ore;
    this.oreMat.dispose();
    this.oreMat = new THREE.MeshStandardMaterial({
      color: o.color, emissive: o.emissive, emissiveIntensity: o.ei, roughness: o.rough, metalness: o.metal,
      transparent: !!o.opacity, opacity: o.opacity || 1,
    });
    for (const ore of this.ores) if (!ore.special) ore.mesh.material = this.oreMat;
    if (this.objects.tower) this.objects.tower.userData.crystalMat?.color.set(el.glow);
  }

  // ---------- membangun item ----------
  has(id) { return this.items.has(id); }

  build(id, animate = true) {
    const it = ITEM_BY_ID[id];
    if (!it || this.items.has(id) || it.type === 'rebirth') return;
    this.items.add(id);
    const g = new THREE.Group();
    const cols = [];
    const el = this.element;
    switch (it.type) {
      case 'dropper': this.buildDropper(it, g, cols); break;
      case 'upgrader': this.buildUpgrader(it, g, cols); break;
      case 'walls': this.buildWalls(g, cols); break;
      case 'lamps': this.buildLamps(g, cols); break;
      case 'auto': this.buildAuto(g, cols); break;
      case 'tower': this.buildTower(g, cols, el); break;
      case 'statue': this.buildStatue(g, cols, el); break;
    }
    this.group.add(g);
    this.objects[id] = g;
    this.itemColliders[id] = cols;
    this.colliders.push(...cols);
    this.recalcMult();
    if (animate) {
      g.scale.setScalar(0.01);
      this.building.push({ obj: g, t: 0 });
      const c = this.toWorld(g.position.clone().setY(2), new THREE.Vector3());
      if (el) this.particles.emit(c, 60, { ...el.fx, speed: (el.fx.speed || 2) * 2.5, spread: 1.5, life: 1.2 });
    }
  }

  recalcMult() {
    let m = 1;
    for (const id of this.items) { const it = ITEM_BY_ID[id]; if (it.type === 'tower' || it.type === 'statue') m *= it.mult; }
    this.globalMult = m;
  }

  buildDropper(it, g, cols) {
    const s = it.big ? 1.55 : 1;
    g.position.set(it.x, 0, BELT_Z);
    const top = DROP_Y + 1.75 * s;
    for (const sz of [-1.5, 1.5]) {
      box(0.26 * s, top - BASE_TOP, 0.26 * s, M.metal, g, 0, BASE_TOP + (top - BASE_TOP) / 2, sz * (it.big ? 1.15 : 1));
      cols.push({ x0: it.x - 0.2 * s, x1: it.x + 0.2 * s, z0: BELT_Z + sz * (it.big ? 1.15 : 1) - 0.2, z1: BELT_Z + sz * (it.big ? 1.15 : 1) + 0.2, y0: 0, y1: top });
    }
    box(0.3, 0.3, 3.4 * (it.big ? 1.15 : 1), M.dark, g, 0, top, 0);
    const body = box(1.4 * s, 1.4 * s, 1.4 * s, this.colorMat, g, 0, DROP_Y + 0.95 * s, 0, true);
    box(1.46 * s, 0.14, 1.46 * s, this.trimMat, g, 0, DROP_Y + 0.95 * s, 0).castShadow = false;
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.62 * s, 0.28 * s, 0.55 * s, 16), M.metal);
    funnel.position.y = DROP_Y + 0.05;
    funnel.castShadow = true;
    g.add(funnel);
    const lbl = makeLabel([{ text: fmt(it.value), color: '#ffe082', size: 44 }], { scale: 0.8 });
    lbl.sprite.position.y = top + 0.9;
    g.add(lbl.sprite);
    this.droppers.push({ it, body, timer: Math.random() * it.interval, squash: 0, x: it.x, big: !!it.big });
  }

  buildUpgrader(it, g, cols) {
    g.position.set(it.x, 0, BELT_Z);
    const color = UPG_COLORS[it.mult] || 0xffffff;
    const glow = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2, roughness: 0.2 });
    for (const sz of [-1.65, 1.65]) {
      box(0.4, 3.4, 0.4, M.dark, g, 0, BASE_TOP + 1.7, sz, true);
      box(0.44, 0.15, 0.44, glow, g, 0, BASE_TOP + 2.5, sz).castShadow = false;
      cols.push({ x0: it.x - 0.25, x1: it.x + 0.25, z0: BELT_Z + sz - 0.25, z1: BELT_Z + sz + 0.25, y0: 0, y1: BASE_TOP + 3.4 });
    }
    box(0.5, 0.4, 3.8, M.dark, g, 0, BASE_TOP + 3.5, 0, true);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.09, 10, 40), glow);
    ring.rotation.y = Math.PI / 2;
    ring.position.y = BELT_TOP + 0.9;
    g.add(ring);
    const laser = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.6), transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    laser.rotation.y = Math.PI / 2;
    laser.position.y = BELT_TOP + 0.9;
    g.add(laser);
    const lbl = makeLabel([{ text: 'x' + it.mult, color: '#' + color.toString(16).padStart(6, '0'), size: 54 }], { scale: 0.9 });
    lbl.sprite.position.y = BASE_TOP + 4.5;
    g.add(lbl.sprite);
    this.spinners.push({ obj: ring, axis: 'x', speed: 2 });
    this.upgraders.push({ it, x: it.x, idx: this.upgraders.length, laser });
  }

  buildWalls(g, cols) {
    const h = 3.6, y = BASE_TOP + h / 2;
    box(40, h, 0.5, M.wall, g, 0, y, -19.75);
    box(40.1, 0.18, 0.56, this.trimMat, g, 0, BASE_TOP + h, -19.75).castShadow = false;
    cols.push({ x0: -20, x1: 20, z0: -20, z1: -19.5, y0: 0, y1: BASE_TOP + h });
    for (const s of [-1, 1]) {
      box(0.5, h, 26, M.wall, g, s * 19.75, y, -7);
      box(0.56, 0.18, 26.1, this.trimMat, g, s * 19.75, BASE_TOP + h, -7).castShadow = false;
      cols.push({ x0: s * 19.75 - 0.25, x1: s * 19.75 + 0.25, z0: -20, z1: 6, y0: 0, y1: BASE_TOP + h });
      box(0.9, h + 0.6, 0.9, M.wall, g, s * 19.75, BASE_TOP + (h + 0.6) / 2, 6, true);
    }
  }

  buildLamps(g, cols) {
    for (const [x, z] of [[-18, 18], [18, 18], [-18, 6], [18, 6], [-18, -18], [18, -18], [-1.5, 18.6], [-9.5, 18.6]]) {
      box(0.18, 4, 0.18, M.dark, g, x, BASE_TOP + 2, z);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10), M.bulb);
      b.position.set(x, BASE_TOP + 4.2, z);
      g.add(b);
      box(0.6, 0.1, 0.6, this.trimMat, g, x, BASE_TOP + 3.9, z).castShadow = false;
      cols.push({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 4.3 });
    }
  }

  buildAuto(g, cols) {
    g.position.set(17.4, 0, -2.5);
    box(1.8, 2.4, 1.8, this.colorMat, g, 0, BASE_TOP + 1.2, 0, true);
    box(1.9, 0.15, 1.9, this.trimMat, g, 0, BASE_TOP + 1.6, 0).castShadow = false;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 8, 32), this.trimMat);
    ring.position.y = BASE_TOP + 3.1;
    g.add(ring);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.4, 10), M.metal);
    pipe.rotation.z = Math.PI / 2; pipe.position.set(-1.9, BASE_TOP + 0.4, 0);
    g.add(pipe);
    this.spinners.push({ obj: ring, axis: 'y', speed: 3 });
    cols.push({ x0: 16.5, x1: 18.3, z0: -3.4, z1: -1.6, y0: 0, y1: BASE_TOP + 2.4 });
  }

  buildTower(g, cols, el) {
    g.position.set(-11, 0, -15);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.7, 1.4, 32), M.wall);
    ped.position.y = BASE_TOP + 0.7; ped.castShadow = ped.receiveShadow = true;
    g.add(ped);
    box(0.5, 4.2, 0.5, M.metal, g, 0, BASE_TOP + 3, 0);
    box(4.6, 0.16, 0.5, this.trimMat, g, 0, BASE_TOP + 1.45, 0).castShadow = false;
    const crystalMat = new THREE.MeshPhysicalMaterial({ color: el ? el.glow : 0xffffff, emissive: el ? el.color : 0xffffff, emissiveIntensity: 1.3, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9 });
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(2.0, 0), crystalMat);
    cr.scale.y = 1.5;
    cr.position.y = 8;
    cr.castShadow = true;
    g.add(cr);
    g.userData.crystalMat = crystalMat;
    this.floaters.push({ obj: cr, base: 8, amp: 0.5, spin: 0.8 });
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(ORE_GEO, crystalMat);
      g.add(c);
      this.floaters.push({ obj: c, orbit: { r: 3.4, y: 8, speed: 1.2, phase: (i / 4) * Math.PI * 2 } });
    }
    cols.push({ x0: -13.6, x1: -8.4, z0: -17.6, z1: -12.4, y0: 0, y1: BASE_TOP + 1.4 });
  }

  buildStatue(g, cols, el) {
    g.position.set(9, 0, -15);
    box(4.5, 1.6, 4.5, M.wall, g, 0, BASE_TOP + 0.8, 0, true);
    box(4.6, 0.16, 4.6, this.trimMat, g, 0, BASE_TOP + 1.55, 0).castShadow = false;
    const av = createAvatar(el, { material: M.gold, skin: 0xffc94a });
    av.root.scale.setScalar(2.3);
    av.root.position.y = BASE_TOP + 1.6;
    av.update(0.016, 0, false);
    g.add(av.root);
    cols.push({ x0: 6.75, x1: 11.25, z0: -17.25, z1: -12.75, y0: 0, y1: BASE_TOP + 1.6 });
  }

  reset() {
    for (const id of Object.keys(this.objects)) this.objects[id].removeFromParent();
    for (const o of this.ores) o.mesh.removeFromParent();
    this.objects = {}; this.items.clear(); this.droppers = []; this.upgraders = []; this.ores = [];
    this.spinners = []; this.floaters = []; this.building = [];
    for (const id of Object.keys(this.itemColliders)) {
      for (const c of this.itemColliders[id]) { const i = this.colliders.indexOf(c); if (i >= 0) this.colliders.splice(i, 1); }
    }
    this.itemColliders = {};
    this.bank = 0;
    this.recalcMult();
  }

  // Sinkron dari data multiplayer
  applyRemote(data, el) {
    if (!this.element || this.element.id !== el.id) this.setOwner(data.name || 'Pemain', el, false, data.owner);
    else if (this.ownerName !== data.name || this.owner !== data.owner) this.setOwner(data.name || 'Pemain', el, false, data.owner);
    const want = new Set(Object.keys(data.items || {}));
    for (const id of this.items) if (!want.has(id)) { this.reset(); break; }
    for (const id of ITEMS.map((i) => i.id)) if (want.has(id) && !this.items.has(id)) this.build(id, true);
  }

  // ---------- pad ----------
  refreshPads(cash, priceMult) {
    for (const p of Object.values(this.pads)) {
      const it = p.item;
      const avail = this.isLocal && !this.items.has(it.id) && it.req.every((r) => this.items.has(r));
      p.group.visible = avail;
      if (!avail) continue;
      const price = Math.round(it.price * priceMult);
      const ok = cash >= price;
      const state = (ok ? 'y' : 'n') + price;
      if (state !== p.state) {
        p.state = state;
        p.mat.emissive.set(ok ? 0x00e676 : 0xff1744);
        p.mat.color.set(ok ? 0x0f3d18 : 0x4a0d14);
        p.label.set([{ text: it.name, size: 40 }, { text: price === 0 ? 'GRATIS' : fmt(price), color: ok ? '#7dff9b' : '#ff8a80', size: 46 }]);
      }
    }
  }

  padAt(local) {
    if (Math.abs(local.y - BASE_TOP) > 1.2) return null;
    for (const p of Object.values(this.pads)) {
      if (!p.group.visible) continue;
      const dx = local.x - p.group.position.x, dz = local.z - p.group.position.z;
      if (dx * dx + dz * dz < 1.5) return p.item;
    }
    return null;
  }

  onCollectPad(local) {
    if (Math.abs(local.y - BASE_TOP) > 1.2) return false;
    const dx = local.x - COLLECT_PAD.x, dz = local.z - COLLECT_PAD.z;
    return dx * dx + dz * dz < 2.1;
  }

  collectPadWorld(out) { return this.toWorld(COLLECT_PAD, out); }
  spawnWorld(out) { return this.toWorld(SPAWN_LOCAL, out); }

  // ---------- simulasi ore ----------
  spawnOre(d, mods) {
    let value = d.it.value;
    let special = false;
    if (mods.nextOre && mods.nextOre.count > 0) { mods.nextOre.count--; value *= mods.nextOre.mult; special = true; }
    const mesh = new THREE.Mesh(ORE_GEO, special ? this.specialMat : this.oreMat);
    const sc = d.big ? 1.7 : 1;
    mesh.scale.setScalar(sc);
    mesh.castShadow = true;
    const ore = { mesh, x: d.x + (Math.random() - 0.5) * 0.2, y: DROP_Y - 0.25, z: BELT_Z + (Math.random() - 0.5) * 0.6, vy: 0, onBelt: false, value, mask: 0, special, r: sc * 0.275, spin: (Math.random() - 0.5) * 4 };
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    mesh.position.set(ore.x, ore.y, ore.z);
    this.group.add(mesh);
    this.ores.push(ore);
    d.squash = 1;
    if (this.ores.length > 260) this.collectOre(0, mods);
  }

  collectOre(i, mods) {
    const o = this.ores[i];
    const v = o.value * this.globalMult * (mods.value || 1);
    this.bank += v;
    this.earned += v;
    o.mesh.removeFromParent();
    this.ores[i] = this.ores[this.ores.length - 1];
    this.ores.pop();
    return v;
  }

  collectAll(mods, onEach) {
    for (let i = this.ores.length - 1; i >= 0; i--) {
      if (onEach) onEach(this.ores[i]);
      this.collectOre(i, mods);
    }
  }

  oreWorld(o, out) { return this.toWorld(tmpV.set(o.x, o.y, o.z), out); }

  update(dt, t, mods) {
    this.earned = 0;
    // scroll conveyor
    this.beltTex.offset.x -= (BELT_SPEED * dt) / 2;
    // animasi pembangunan
    for (let i = this.building.length - 1; i >= 0; i--) {
      const b = this.building[i];
      b.t += dt / 0.7;
      b.obj.scale.setScalar(Math.max(0.01, easeOutBack(Math.min(1, b.t))));
      if (b.t >= 1) { b.obj.scale.setScalar(1); this.building.splice(i, 1); }
    }
    for (const s of this.spinners) s.obj.rotation[s.axis] += s.speed * dt;
    for (const f of this.floaters) {
      if (f.orbit) {
        const a = t * f.orbit.speed + f.orbit.phase;
        f.obj.position.set(Math.cos(a) * f.orbit.r, f.orbit.y + Math.sin(a * 2) * 0.5, Math.sin(a) * f.orbit.r);
        f.obj.rotation.x += dt * 2; f.obj.rotation.y += dt * 1.5;
      } else {
        f.obj.position.y = f.base + Math.sin(t * 1.5) * f.amp;
        f.obj.rotation.y += f.spin * dt;
      }
    }
    if (!this.element) return 0;

    // dropper
    const dropMult = mods.drop || 1;
    for (const d of this.droppers) {
      d.timer += dt * dropMult;
      if (d.timer >= d.it.interval) { d.timer -= d.it.interval; if (d.timer > d.it.interval) d.timer = 0; this.spawnOre(d, mods); }
      d.squash = Math.max(0, d.squash - dt * 5);
      const s = 1 + d.squash * 0.12;
      d.body.scale.set(s, 1 / s, s);
    }
    // ore
    const upgMult = mods.upg || 1;
    for (let i = this.ores.length - 1; i >= 0; i--) {
      const o = this.ores[i];
      if (!o.onBelt) {
        o.vy -= 22 * dt;
        o.y += o.vy * dt;
        const floor = BELT_TOP + o.r;
        if (o.y <= floor) { o.y = floor; o.vy = 0; o.onBelt = true; }
        o.mesh.rotation.x += o.spin * dt;
      } else {
        o.x += BELT_SPEED * dt;
        o.z += (BELT_Z - o.z) * Math.min(1, dt * 0.8);
      }
      for (const u of this.upgraders) {
        const bit = 1 << u.idx;
        if (!(o.mask & bit) && o.x >= u.x) {
          o.mask |= bit;
          o.value *= u.it.mult * upgMult;
          if (Math.random() < 0.6) this.particles.emit(this.oreWorld(o, new THREE.Vector3()), 4, { color: UPG_COLORS[u.it.mult], color2: 0xffffff, speed: 2.5, life: 0.5, size: 0.25 });
        }
      }
      if (o.x >= COLLECT_X) { this.collectOre(i, mods); continue; }
      o.mesh.position.set(o.x, o.y, o.z);
    }
    for (const u of this.upgraders) u.laser.material.opacity = 0.25 + Math.sin(t * 8 + u.idx) * 0.1;

    // asap collector
    if (this.droppers.length && Math.random() < dt * 6) {
      this.particles.emit(this.toWorld(this.chimneyTop, new THREE.Vector3()), 1, { ...this.element.fx, speed: 0.6, up: 1.5, gravity: -0.5, life: 1.8, size: 0.6, grow: 2 });
    }

    if (this.isLocal) {
      const txt = fmt(this.bank);
      if (txt !== this.lastBankText) {
        this.lastBankText = txt;
        this.bankLabel.set([{ text: '💰 ' + txt, color: '#7dff9b', size: 50 }, { text: 'Injak untuk ambil uang', size: 30 }]);
      }
      this.bankLabel.sprite.visible = true;
    } else {
      this.bankLabel.sprite.visible = false;
    }
    return this.earned;
  }
}
