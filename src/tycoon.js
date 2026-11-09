// Logika & visual plot tycoon bertingkat:
//   Lantai 1 (pabrik) -> Lantai 2 (Lab) -> Lantai 3 (Reaktor) -> Rooftop
// Tiap lantai punya conveyor: dropper -> upgrader -> collector, semua uang masuk ke bank yang sama.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { concreteTexture, beltTexture, makeLabel, emblemTexture } from './textures.js';
import { createAvatar } from './character.js';
import { fmt, easeOutBack } from './util.js';
import { hex } from './elements.js';

export const PLOT_HALF = 20;
export const FLOORS = [0.3, 7.3, 14.3, 21.3]; // tinggi permukaan tiap lantai
export const FLOOR_NAMES = ['Lantai 1', 'Lantai 2 · Lab', 'Lantai 3 · Reaktor', 'Rooftop'];
const BASE_TOP = 0.3;
const SLAB = 0.4;
export const BELT_SPEED = 3.2;
const COLLECT_PAD = new THREE.Vector3(13.6, BASE_TOP, -2.5);
export const SPAWN_LOCAL = new THREE.Vector3(0, BASE_TOP, 18);
export const START_CASH = 10;

// Conveyor per lantai
const CONV = [
  { floor: 0, z: -8, x0: -17.5, x1: 12, collectX: 12.1 },
  { floor: 1, z: -10, x0: -12, x1: 11, collectX: 11.1 },
  { floor: 2, z: -10, x0: -12, x1: 11, collectX: 11.1 },
].map((c, i) => ({ ...c, i, top: FLOORS[c.floor] + 1.0, drop: FLOORS[c.floor] + 3.1 }));

// Tangga: level 1 (L1->L2) kanan, level 2 (L2->L3) kiri, level 3 (L3->Roof) kanan
const STAIR_RIGHT = { x0: 16.4, x1: 19.2 };
const STAIR_LEFT = { x0: -19.2, x1: -16.4 };
const stairOf = (level) => (level === 2 ? STAIR_LEFT : STAIR_RIGHT);

// ---------- Daftar item (urut sesuai ketergantungan) ----------
// floor = lantai tempat tombol beli, c = index conveyor, pad = posisi tombol (lokal plot)
const RAW_ITEMS = [
  // Lantai 1
  { id: 'dropper1', name: 'Dropper I', price: 0, req: [], x: -13, value: 4, interval: 1.6, pad: [-14, 3] },
  { id: 'dropper2', name: 'Dropper II', price: 60, req: ['dropper1'], x: -10, value: 8, interval: 1.6, pad: [-8.4, 3] },
  { id: 'dropper3', name: 'Dropper III', price: 220, req: ['dropper2'], x: -7, value: 15, interval: 1.5, pad: [-2.8, 3] },
  { id: 'upgrader1', name: 'Upgrader x1.5', price: 450, req: ['dropper2'], type: 'upgrader', x: 5, mult: 1.5, pad: [2.8, 3] },
  { id: 'dropper4', name: 'Dropper IV', price: 1000, req: ['dropper3'], x: -4, value: 30, interval: 1.5, pad: [8.4, 3] },
  { id: 'walls', name: 'Tembok Markas', price: 1600, req: ['upgrader1'], type: 'walls', pad: [14, 3] },
  { id: 'dropper5', name: 'Dropper V', price: 3200, req: ['dropper4'], x: -1, value: 60, interval: 1.4, pad: [-14, 8] },
  { id: 'lamps', name: 'Lampu Taman', price: 4500, req: ['walls'], type: 'lamps', pad: [-8.4, 8] },
  { id: 'upgrader2', name: 'Upgrader x2', price: 8000, req: ['dropper5'], type: 'upgrader', x: 8, mult: 2, pad: [-2.8, 8] },
  { id: 'autocollect', name: 'Auto Collector', price: 14000, req: ['upgrader2'], type: 'auto', pad: [2.8, 8] },
  { id: 'dropper6', name: 'Dropper VI', price: 22000, req: ['dropper5'], x: 2, value: 130, interval: 1.3, pad: [8.4, 8] },
  { id: 'floor2', name: '🏢 Lantai 2', price: 45000, req: ['dropper6', 'autocollect'], type: 'floor', level: 1, pad: [14, 8] },
  { id: 'mega', name: 'Mega Dropper', price: 130000, req: ['floor2'], x: -15.8, value: 700, interval: 2.4, big: true, pad: [-14, 13] },
  { id: 'upgrader3', name: 'Upgrader x3', price: 350000, req: ['mega'], type: 'upgrader', x: 10.4, mult: 3, pad: [-8.4, 13] },
  // Lantai 2 — Lab
  { id: 'f2drop1', name: 'Dropper Lab I', price: 60000, req: ['floor2'], c: 1, floor: 1, x: -10, value: 300, interval: 1.5, pad: [-13, -3] },
  { id: 'f2drop2', name: 'Dropper Lab II', price: 95000, req: ['f2drop1'], c: 1, floor: 1, x: -6, value: 450, interval: 1.5, pad: [-8, -3] },
  { id: 'f2upg', name: 'Upgrader Lab x2', price: 140000, req: ['f2drop1'], type: 'upgrader', c: 1, floor: 1, x: 6, mult: 2, pad: [-3, -3] },
  { id: 'f2decor', name: '🛋 Lounge', price: 120000, req: ['f2drop1'], type: 'lounge', floor: 1, pad: [2, -3] },
  { id: 'f2drop3', name: 'Dropper Lab III', price: 220000, req: ['f2drop2'], c: 1, floor: 1, x: -2, value: 700, interval: 1.4, pad: [7, -3] },
  { id: 'floor3', name: '🏢 Lantai 3', price: 550000, req: ['f2drop3', 'f2upg'], type: 'floor', level: 2, floor: 1, pad: [12, -3] },
  // Lantai 3 — Reaktor
  { id: 'f3drop1', name: 'Dropper Reaktor I', price: 750000, req: ['floor3'], c: 2, floor: 2, x: -10, value: 2500, interval: 1.6, pad: [-13, -3] },
  { id: 'f3upg', name: 'Reaktor x3', price: 1100000, req: ['f3drop1'], type: 'upgrader', c: 2, floor: 2, x: 6, mult: 3, pad: [-8, -3] },
  { id: 'f3decor', name: '🛏 Kamar Boss', price: 900000, req: ['f3drop1'], type: 'bossroom', floor: 2, pad: [-3, -3] },
  { id: 'f3drop2', name: 'Dropper Reaktor II', price: 1600000, req: ['f3drop1'], c: 2, floor: 2, x: -5, value: 4000, interval: 1.8, big: true, pad: [2, -3] },
  { id: 'f3drop3', name: 'Dropper Reaktor III', price: 2400000, req: ['f3drop2'], c: 2, floor: 2, x: 0, value: 6000, interval: 1.7, pad: [7, -3] },
  { id: 'roof', name: '🌇 Rooftop', price: 3000000, req: ['f3drop2', 'f3upg'], type: 'floor', level: 3, floor: 2, pad: [12, -3] },
  // Rooftop
  { id: 'tower', name: 'Menara Elemen x2', price: 4000000, req: ['roof'], type: 'tower', mult: 2, floor: 3, pad: [-12, -2] },
  { id: 'pool', name: '🏊 Kolam Rooftop', price: 3500000, req: ['roof'], type: 'pool', floor: 3, pad: [-4, -2] },
  { id: 'statue', name: 'Patung Legenda x2', price: 9000000, req: ['tower'], type: 'statue', mult: 2, floor: 3, pad: [4, -2] },
  { id: 'rebirth', name: '♻ REBIRTH (+50%)', price: 15000000, req: ['statue'], type: 'rebirth', floor: 3, pad: [12, -2] },
];
export const ITEMS = RAW_ITEMS.map((it) => ({ type: 'dropper', floor: 0, c: 0, ...it }));
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

// Buang item yang syaratnya tidak terpenuhi (misal dari save versi lama)
export function validItems(list) {
  const want = new Set(list || []);
  const ok = new Set();
  for (const it of ITEMS) if (want.has(it.id) && it.type !== 'rebirth' && it.req.every((r) => ok.has(r))) ok.add(it.id);
  return [...ok];
}

// ---------- material & geometri bersama ----------
const M = {
  concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(5, 196), roughness: 0.9, color: 0x9a9da3 }),
  floor: new THREE.MeshStandardMaterial({ map: concreteTexture(8, 230), roughness: 0.6, color: 0xc9c6c0 }),
  wall: new THREE.MeshStandardMaterial({ map: concreteTexture(3, 225), roughness: 0.85, color: 0xb8b2a8 }),
  stair: new THREE.MeshStandardMaterial({ map: concreteTexture(1, 210), roughness: 0.8, color: 0xa7a39c }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.95, roughness: 0.32 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2f35, metalness: 0.75, roughness: 0.45 }),
  black: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffc94a, metalness: 1, roughness: 0.22 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffe2a0, emissiveIntensity: 3 }),
  panel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 1.6 }),
  grey: new THREE.MeshStandardMaterial({ color: 0x777777, emissive: 0x333333, roughness: 0.5 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.22, metalness: 0.9, roughness: 0.05, depthWrite: false }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8d5a34, roughness: 0.7 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 }),
  plant: new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.9, flatShading: true }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x29b6f6, roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.82, emissive: 0x0277bd, emissiveIntensity: 0.25 }),
  poolTile: new THREE.MeshStandardMaterial({ color: 0x9fe3ff, roughness: 0.4 }),
};
// Lampu markas lebih terang saat malam
export function setNightLevel(n) {
  M.bulb.emissiveIntensity = 1 + n * 3.5;
  M.panel.emissiveIntensity = 1.2 + n * 2.2;
}

const ORE_GEO = new RoundedBoxGeometry(0.55, 0.55, 0.55, 2, 0.08);
const PAD_GEO = new THREE.CylinderGeometry(1.25, 1.25, 0.18, 32);
const UPG_COLORS = { 1.5: 0x00e676, 2: 0x2979ff, 3: 0xd500f9 };

function box(w, h, d, mat, parent, x, y, z, rounded = false) {
  const geo = rounded ? new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.12) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = !mat.transparent; m.receiveShadow = true;
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
    this.occluders = [];
    this.bank = 0;
    this.element = null;
    this.owner = null;
    this.ownerName = '';
    this.isLocal = false;
    this.colliders = [];
    this.itemColliders = {};
    this.globalMult = 1;
    this.earned = 0;
    this.topFloor = 0;
    this.beltTexes = [];
    this.chutes = {};

    this.trimMat = M.grey.clone();
    this.colorMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.6, roughness: 0.35 });
    this.fabricMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.95 });
    this.oreMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    this.specialMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd54f, emissiveIntensity: 2, metalness: 1, roughness: 0.15 });

    this.buildBase();
    this.pads = {};
    for (const it of ITEMS) this.createPad(it);
  }

  // ---- konversi koordinat ----
  toLocal(world, out) { return out.copy(world).applyMatrix4(this.inv); }
  toWorld(local, out) { return out.copy(local).applyMatrix4(this.group.matrixWorld); }
  localDir(x, z, out) { return out.set(x, 0, z).applyQuaternion(this.group.quaternion); }
  contains(world) { this.toLocal(world, tmpV); return Math.abs(tmpV.x) < PLOT_HALF && Math.abs(tmpV.z) < PLOT_HALF; }

  // ---------- base: lantai dasar, conveyor 1, collector, pad uang, papan nama ----------
  buildBase() {
    const g = this.group;
    const slab = box(PLOT_HALF * 2, BASE_TOP, PLOT_HALF * 2, M.concrete, g, 0, BASE_TOP / 2, 0);
    slab.castShadow = false;
    this.colliders.push({ x0: -20, x1: 20, z0: -20, z1: 20, y0: -1, y1: BASE_TOP });
    for (const [w, d, x, z] of [[40.3, 0.3, 0, 20], [40.3, 0.3, 0, -20], [0.3, 40.3, 20, 0], [0.3, 40.3, -20, 0]]) {
      box(w, 0.12, d, this.trimMat, g, x, BASE_TOP + 0.02, z).castShadow = false;
    }
    this.buildConveyor(CONV[0], g, this.colliders);

    const padMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, emissive: 0x00e676, emissiveIntensity: 0.9, roughness: 0.4 });
    const cp = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 40), padMat);
    cp.position.copy(COLLECT_PAD).setY(BASE_TOP + 0.1);
    cp.receiveShadow = true;
    g.add(cp);
    this.bankLabel = makeLabel([{ text: '💰 $0', color: '#7dff9b', size: 50 }, { text: 'Injak untuk ambil uang', size: 30 }], { scale: 1.2 });
    this.bankLabel.sprite.position.copy(COLLECT_PAD).setY(3.4);
    g.add(this.bankLabel.sprite);
    this.lastBankText = '';

    box(0.25, 3.2, 0.25, M.metal, g, -7.5, 1.6, 19.4);
    box(0.25, 3.2, 0.25, M.metal, g, -3.5, 1.6, 19.4);
    box(4.4, 1.2, 0.2, this.colorMat, g, -5.5, 2.9, 19.4, true);
    this.colliders.push({ x0: -7.7, x1: -7.3, z0: 19.2, z1: 19.6, y0: 0, y1: 3.2 });
    this.colliders.push({ x0: -3.7, x1: -3.3, z0: 19.2, z1: 19.6, y0: 0, y1: 3.2 });
    this.signLabel = makeLabel([{ text: 'PLOT KOSONG', color: '#cccccc', size: 48 }], { scale: 1.15 });
    this.signLabel.sprite.position.set(-5.5, 4.6, 19.4);
    g.add(this.signLabel.sprite);
  }

  buildConveyor(c, g, cols) {
    const fy = FLOORS[c.floor];
    const len = c.x1 - c.x0, cx = (c.x0 + c.x1) / 2;
    box(len, 0.95, 2.3, M.dark, g, cx, fy + 0.475, c.z);
    const tex = beltTexture();
    tex.repeat.set(len / 2, 1);
    this.beltTexes.push(tex);
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
    belt.rotation.x = -Math.PI / 2;
    belt.position.set(cx, c.top - 0.02, c.z);
    belt.receiveShadow = true;
    g.add(belt);
    for (const s of [-1, 1]) {
      box(len, 0.22, 0.14, M.metal, g, cx, c.top + 0.08, c.z + s * 1.1);
      box(len, 0.06, 0.16, this.trimMat, g, cx, c.top - 0.3, c.z + s * 1.16).castShadow = false;
    }
    cols.push({ x0: c.x0, x1: c.x1, z0: c.z - 1.18, z1: c.z + 1.18, y0: fy, y1: c.top, belt: true });

    if (c.floor === 0) {
      box(3.4, 3.6, 3.4, M.dark, g, 13.7, BASE_TOP + 1.8, c.z, true);
      box(0.1, 1.5, 2.2, M.black, g, 11.97, c.top + 0.6, c.z);
      box(0.14, 1.7, 0.16, this.trimMat, g, 11.95, c.top + 0.6, c.z - 1.18);
      box(0.14, 1.7, 0.16, this.trimMat, g, 11.95, c.top + 0.6, c.z + 1.18);
      box(3.5, 0.18, 3.5, this.trimMat, g, 13.7, BASE_TOP + 3.2, c.z);
      const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.2, 16), M.metal);
      chim.position.set(14.4, BASE_TOP + 4.6, c.z - 0.6); chim.castShadow = true; g.add(chim);
      this.chimneyTop = new THREE.Vector3(14.4, BASE_TOP + 5.8, c.z - 0.6);
      cols.push({ x0: 12, x1: 15.4, z0: c.z - 1.7, z1: c.z + 1.7, y0: 0, y1: BASE_TOP + 3.6 });
    } else {
      // chute: ore turun lewat pipa ke collector utama
      box(2.4, 2.4, 2.8, M.dark, g, 12.3, fy + 1.2, c.z, true);
      box(0.1, 1.5, 2.2, M.black, g, 11.08, c.top + 0.6, c.z);
      box(2.5, 0.16, 2.9, this.trimMat, g, 12.3, fy + 2.1, c.z).castShadow = false;
      const bottom = c.floor === 1 ? BASE_TOP + 3.6 : FLOORS[c.floor - 1] + 2.4;
      const h = fy - bottom;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, h, 14), M.metal);
      pipe.position.set(13.0, bottom + h / 2, -9.2);
      pipe.castShadow = true;
      g.add(pipe);
      cols.push({ x0: 11.1, x1: 13.5, z0: c.z - 1.4, z1: c.z + 1.4, y0: fy, y1: fy + 2.4 });
      this.chutes[c.i] = new THREE.Vector3(12.3, fy + 2.6, c.z);
    }
  }

  createPad(it) {
    const g = new THREE.Group();
    g.position.set(it.pad[0], FLOORS[it.floor] + 0.09, it.pad[1]);
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
    const txt = [{ text: (isLocal ? '⭐ ' : '') + 'Markas ' + name, color: hex(el.glow), size: 46 }];
    this.signLabel.set(txt);
    if (this.roofLabel) this.roofLabel.set(txt);
  }

  clearOwner() {
    this.reset();
    this.owner = null; this.ownerName = ''; this.isLocal = false; this.element = null;
    this.trimMat.copy(M.grey);
    this.colorMat.color.set(0x9e9e9e);
    this.fabricMat.color.set(0x9e9e9e);
    this.signLabel.set([{ text: 'PLOT KOSONG', color: '#cccccc', size: 48 }]);
    for (const p of Object.values(this.pads)) p.group.visible = false;
  }

  setElement(el) {
    this.element = el;
    this.trimMat.color.set(el.color);
    this.trimMat.emissive.set(el.color);
    this.trimMat.emissiveIntensity = 1.4;
    this.colorMat.color.set(el.color);
    this.fabricMat.color.set(el.color);
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
      case 'floor': this.buildFloor(it.level, g, cols); break;
      case 'lounge': this.buildLounge(g, cols); break;
      case 'bossroom': this.buildBossRoom(g, cols, el); break;
      case 'pool': this.buildPool(g, cols); break;
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
      const isFloor = it.type === 'floor';
      const c = isFloor
        ? this.toWorld(tmpV.set(0, FLOORS[it.level], -10), new THREE.Vector3())
        : this.toWorld(tmpV.set(g.position.x, FLOORS[it.floor] + 2, g.position.z), new THREE.Vector3());
      if (el) this.particles.emit(c, isFloor ? 220 : 60, { ...el.fx, speed: (el.fx.speed || 2) * 2.5, spread: isFloor ? 8 : 1.5, life: 1.2 });
    }
  }

  recalcMult() {
    let m = 1, top = 0;
    for (const id of this.items) {
      const it = ITEM_BY_ID[id];
      if (it.type === 'tower' || it.type === 'statue') m *= it.mult;
      if (it.type === 'floor') top = Math.max(top, it.level);
    }
    this.globalMult = m;
    this.topFloor = top;
  }

  buildDropper(it, g, cols) {
    const c = CONV[it.c];
    const fy = FLOORS[c.floor];
    const s = it.big ? 1.4 : 1;
    const zs = it.big ? 1.15 : 1;
    g.position.set(it.x, 0, c.z);
    const top = c.drop + 1.75 * s;
    for (const sz of [-1.5, 1.5]) {
      box(0.26 * s, top - fy, 0.26 * s, M.metal, g, 0, fy + (top - fy) / 2, sz * zs);
      cols.push({ x0: it.x - 0.2 * s, x1: it.x + 0.2 * s, z0: c.z + sz * zs - 0.2, z1: c.z + sz * zs + 0.2, y0: fy, y1: top });
    }
    box(0.3, 0.3, 3.4 * zs, M.dark, g, 0, top, 0);
    const body = box(1.4 * s, 1.4 * s, 1.4 * s, this.colorMat, g, 0, c.drop + 0.95 * s, 0, true);
    box(1.46 * s, 0.14, 1.46 * s, this.trimMat, g, 0, c.drop + 0.95 * s, 0).castShadow = false;
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.62 * s, 0.28 * s, 0.55 * s, 16), M.metal);
    funnel.position.y = c.drop + 0.05;
    funnel.castShadow = true;
    g.add(funnel);
    const lbl = makeLabel([{ text: fmt(it.value), color: '#ffe082', size: 44 }], { scale: 0.55 });
    lbl.sprite.position.y = top + 0.5;
    g.add(lbl.sprite);
    this.droppers.push({ it, c, body, timer: Math.random() * it.interval, squash: 0, x: it.x, big: !!it.big });
  }

  buildUpgrader(it, g, cols) {
    const c = CONV[it.c];
    const fy = FLOORS[c.floor];
    g.position.set(it.x, 0, c.z);
    const color = UPG_COLORS[it.mult] || 0xffffff;
    const glow = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2, roughness: 0.2 });
    for (const sz of [-1.65, 1.65]) {
      box(0.4, 3.4, 0.4, M.dark, g, 0, fy + 1.7, sz, true);
      box(0.44, 0.15, 0.44, glow, g, 0, fy + 2.5, sz).castShadow = false;
      cols.push({ x0: it.x - 0.25, x1: it.x + 0.25, z0: c.z + sz - 0.25, z1: c.z + sz + 0.25, y0: fy, y1: fy + 3.4 });
    }
    box(0.5, 0.4, 3.8, M.dark, g, 0, fy + 3.5, 0, true);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.09, 10, 40), glow);
    ring.rotation.y = Math.PI / 2;
    ring.position.y = c.top + 0.9;
    g.add(ring);
    const laser = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.6), transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    laser.rotation.y = Math.PI / 2;
    laser.position.y = c.top + 0.9;
    g.add(laser);
    const lbl = makeLabel([{ text: 'x' + it.mult, color: hex(color), size: 54 }], { scale: 0.8 });
    lbl.sprite.position.y = fy + 4.4;
    g.add(lbl.sprite);
    this.spinners.push({ obj: ring, axis: 'x', speed: 2 });
    this.upgraders.push({ it, c, x: it.x, idx: this.upgraders.length, laser });
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
    for (const [x, z] of [[-18, 18], [18, 18], [-18, 6], [18, 6], [-1.5, 18.6], [-9.5, 18.6]]) {
      box(0.18, 4, 0.18, M.dark, g, x, BASE_TOP + 2, z);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10), M.bulb);
      b.position.set(x, BASE_TOP + 4.2, z);
      g.add(b);
      box(0.6, 0.1, 0.6, this.trimMat, g, x, BASE_TOP + 3.9, z).castShadow = false;
      cols.push({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 4.3 });
    }
  }

  buildAuto(g, cols) {
    g.position.set(9.5, 0, -2.5);
    box(1.8, 2.4, 1.8, this.colorMat, g, 0, BASE_TOP + 1.2, 0, true);
    box(1.9, 0.15, 1.9, this.trimMat, g, 0, BASE_TOP + 1.6, 0).castShadow = false;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 8, 32), this.trimMat);
    ring.position.y = BASE_TOP + 3.1;
    g.add(ring);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.4, 10), M.metal);
    pipe.rotation.z = Math.PI / 2; pipe.position.set(1.9, BASE_TOP + 0.4, 0);
    g.add(pipe);
    this.spinners.push({ obj: ring, axis: 'y', speed: 3 });
    cols.push({ x0: 8.6, x1: 10.4, z0: -3.4, z1: -1.6, y0: 0, y1: BASE_TOP + 2.4 });
  }

  // ---------- LANTAI 2, 3, ROOFTOP ----------
  buildFloor(level, g, cols) {
    const y = FLOORS[level], yb = FLOORS[level - 1];
    const holeRight = level !== 2; // lubang tangga dari lantai bawah
    const hx = holeRight ? 16.4 : -16.4;

    const slab = (x0, x1, z0, z1) => {
      const m = box(x1 - x0, SLAB, z1 - z0, M.floor, g, (x0 + x1) / 2, y - SLAB / 2, (z0 + z1) / 2);
      this.occluders.push(m);
      cols.push({ x0, x1, z0, z1, y0: y - SLAB, y1: y, slab: true });
    };
    if (holeRight) { slab(-20, 16.4, -20, 0); slab(16.4, 20, -20, -13); } else { slab(-16.4, 20, -20, 0); slab(-20, -16.4, -20, -13); }
    const fx0 = holeRight ? -20 : -16.4, fx1 = holeRight ? 16.4 : 20;
    box(fx1 - fx0, 0.14, 0.12, this.trimMat, g, (fx0 + fx1) / 2, y - 0.2, 0.02).castShadow = false;

    // lampu plafon
    for (const x of [-12, -2, 8]) for (const z of [-15, -5]) box(3, 0.06, 0.8, M.panel, g, x, y - SLAB - 0.04, z).castShadow = false;

    // tiang penyangga
    const skip = level === 2 ? '19.6,-0.4' : level === 3 ? '-19.6,-0.4' : '';
    for (const x of [-19.6, -6.5, 6.5, 19.6]) for (const z of [-19.6, -0.4]) {
      if (`${x},${z}` === skip) continue;
      box(0.7, y - SLAB - yb, 0.7, M.wall, g, x, yb + (y - SLAB - yb) / 2, z);
      cols.push({ x0: x - 0.35, x1: x + 0.35, z0: z - 0.35, z1: z + 0.35, y0: yb, y1: y - SLAB });
    }

    // tangga dari lantai bawah
    const st = stairOf(level);
    const n = 16, rise = (y - yb) / n, run = 12 / n;
    for (let i = 0; i < n; i++) {
      const top = yb + (i + 1) * rise, z1 = -1 - i * run, z0 = z1 - run;
      box(st.x1 - st.x0, top - yb, run, M.stair, g, (st.x0 + st.x1) / 2, (yb + top) / 2, (z0 + z1) / 2);
      cols.push({ x0: st.x0, x1: st.x1, z0, z1, y0: yb, y1: top });
    }
    const railX = holeRight ? st.x0 + 0.05 : st.x1 - 0.05;
    const len = Math.hypot(12, y - yb);
    const rail = box(0.08, 0.08, len, M.metal, g, railX, (yb + y) / 2 + 1.0, -7);
    rail.rotation.x = Math.atan2(y - yb, 12);
    for (let i = 0; i < 4; i++) box(0.06, 1.0, 0.06, M.metal, g, railX, yb + ((i + 0.5) / 4) * (y - yb) + 0.5, -1 - ((i + 0.5) / 4) * 12);

    // pagar kaca di sekitar lubang & depan
    const glassRail = (x0, x1, z0, z1) => {
      box(x1 - x0, 1.1, z1 - z0, M.glass, g, (x0 + x1) / 2, y + 0.55, (z0 + z1) / 2);
      box(x1 - x0 + 0.04, 0.08, z1 - z0 + 0.04, this.trimMat, g, (x0 + x1) / 2, y + 1.12, (z0 + z1) / 2).castShadow = false;
      cols.push({ x0, x1, z0, z1, y0: y, y1: y + 1.1 });
    };
    glassRail(hx - 0.06, hx + 0.06, -13, 0);
    glassRail(fx0, fx1, -0.12, 0);

    if (level < 3) {
      const h = 7 - SLAB;
      const wall = (x0, x1, z0, z1) => {
        box(x1 - x0, h, z1 - z0, M.glass, g, (x0 + x1) / 2, y + h / 2, (z0 + z1) / 2);
        cols.push({ x0, x1, z0, z1, y0: y, y1: y + h });
      };
      wall(-20, 20, -20, -19.85);
      wall(-20, -19.85, -20, 0);
      wall(19.85, 20, -20, 0);
      for (let x = -20; x <= 20; x += 5) box(0.16, h, 0.16, M.dark, g, x, y + h / 2, -19.9);
      for (let z = -15; z <= 0; z += 5) for (const sx of [-19.9, 19.9]) box(0.16, h, 0.16, M.dark, g, sx, y + h / 2, z);
      box(40, 0.12, 0.2, this.trimMat, g, 0, y + 0.06, -19.9).castShadow = false;
      this.buildConveyor(CONV[level], g, cols);
    } else {
      const par = (x0, x1, z0, z1) => {
        box(x1 - x0, 1.2, z1 - z0, M.wall, g, (x0 + x1) / 2, y + 0.6, (z0 + z1) / 2);
        box(x1 - x0 + 0.05, 0.1, z1 - z0 + 0.05, this.trimMat, g, (x0 + x1) / 2, y + 1.22, (z0 + z1) / 2).castShadow = false;
        cols.push({ x0, x1, z0, z1, y0: y, y1: y + 1.2 });
      };
      par(-20, 20, -20, -19.6);
      par(-20, -19.6, -20, 0);
      par(19.6, 20, -20, 0);
      const heli = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.0, 40), this.trimMat);
      heli.rotation.x = -Math.PI / 2; heli.position.set(-12, y + 0.02, -17);
      g.add(heli);
      this.roofLabel = makeLabel([{ text: '⭐ Markas ' + this.ownerName, color: hex(this.element ? this.element.glow : 0xffffff), size: 46 }], { scale: 2.4 });
      this.roofLabel.sprite.position.set(0, y + 5, -19);
      g.add(this.roofLabel.sprite);
    }
    const lbl = makeLabel([{ text: FLOOR_NAMES[level], color: '#ffffff', size: 46 }], { scale: 1.2 });
    lbl.sprite.position.set(-8, y + (level < 3 ? 5.6 : 3), -0.6);
    g.add(lbl.sprite);
  }

  buildLounge(g, cols) {
    const y = FLOORS[1];
    const ox = -9.5, oz = -16;
    g.position.set(ox, y, oz);
    const el = this.element;
    const rug = new THREE.Mesh(new THREE.BoxGeometry(9, 0.04, 5), new THREE.MeshStandardMaterial({ color: el ? el.dark : 0x333333, roughness: 1 }));
    rug.position.y = 0.02; rug.receiveShadow = true; g.add(rug);
    box(4.2, 0.5, 1.2, this.fabricMat, g, 0, 0.35, -1.8, true);
    box(4.2, 1.0, 0.35, this.fabricMat, g, 0, 0.9, -2.35, true);
    for (const s of [-1, 1]) box(0.35, 0.8, 1.2, this.fabricMat, g, s * 2.1, 0.5, -1.8, true);
    for (const s of [-1, 0, 1]) box(1.2, 0.18, 1.0, M.white, g, s * 1.3, 0.68, -1.75, true);
    cols.push({ x0: ox - 2.3, x1: ox + 2.3, z0: oz - 2.55, z1: oz - 1.2, y0: y, y1: y + 1.4 });
    box(2, 0.1, 1, M.wood, g, 0, 0.5, 0);
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.4, 0.4]) box(0.08, 0.5, 0.08, M.wood, g, sx, 0.25, sz);
    box(3.4, 0.6, 0.6, M.dark, g, 0, 0.3, 2.0);
    box(3.4, 2.0, 0.12, M.black, g, 0, 1.65, 2.2);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: emblemTexture(el ? el.icon : '⭐', hex(el ? el.color : 0x444444)) }));
    scr.position.set(0, 1.65, 2.13); scr.rotation.y = Math.PI;
    g.add(scr);
    cols.push({ x0: ox - 1.7, x1: ox + 1.7, z0: oz + 1.7, z1: oz + 2.3, y0: y, y1: y + 2.7 });
    for (const sx of [-3.8, 3.8]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 12), M.white);
      pot.position.set(sx, 0.3, -2.2); pot.castShadow = true; g.add(pot);
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), M.plant);
      leaves.position.set(sx, 1.1, -2.2); leaves.scale.y = 1.4; leaves.castShadow = true; g.add(leaves);
    }
  }

  buildBossRoom(g, cols, el) {
    const y = FLOORS[2];
    const ox = 9, oz = -16;
    g.position.set(ox, y, oz);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(10, 0.04, 5.5), new THREE.MeshStandardMaterial({ color: el ? el.dark : 0x333333, roughness: 1 }));
    rug.position.y = 0.02; rug.receiveShadow = true; g.add(rug);
    box(2.6, 0.5, 3.6, M.wood, g, -3, 0.25, -0.8);
    box(2.4, 0.3, 3.4, M.white, g, -3, 0.65, -0.8, true);
    box(2.45, 0.14, 2.2, this.fabricMat, g, -3, 0.84, -0.2, true);
    box(1.6, 0.22, 0.6, M.white, g, -3, 0.9, -2.15, true);
    box(2.6, 1.4, 0.2, M.wood, g, -3, 0.7, -2.65);
    cols.push({ x0: ox - 4.3, x1: ox - 1.7, z0: oz - 2.75, z1: oz + 1.0, y0: y, y1: y + 1.0 });
    box(2.4, 0.1, 1.1, M.wood, g, 2.2, 1.0, -2.1);
    for (const sx of [-1.1, 1.1]) box(0.1, 1.0, 1.0, M.wood, g, 2.2 + sx, 0.5, -2.1);
    box(1.3, 0.75, 0.06, M.black, g, 2.2, 1.5, -2.5);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.65), new THREE.MeshBasicMaterial({ color: new THREE.Color(el ? el.glow : 0xffffff).multiplyScalar(1.4) }));
    scr.position.set(2.2, 1.5, -2.465); g.add(scr);
    box(0.7, 0.1, 0.7, this.fabricMat, g, 2.2, 0.55, -1.2);
    box(0.7, 0.8, 0.1, this.fabricMat, g, 2.2, 0.95, -0.85);
    cols.push({ x0: ox + 1.0, x1: ox + 3.4, z0: oz - 2.7, z1: oz - 1.5, y0: y, y1: y + 1.1 });
    box(2.6, 2.2, 0.5, M.wood, g, 5.3, 1.1, -2.4);
    [0xffd54f, 0xb0bec5, 0xcd7f32].forEach((col, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: col, metalness: 1, roughness: 0.25 });
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.1, 0.4, 14), mat);
      cup.position.set(4.5 + i * 0.8, 2.45, -2.4); g.add(cup);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), mat);
      base.position.set(4.5 + i * 0.8, 2.25, -2.4); g.add(base);
    });
    cols.push({ x0: ox + 4.0, x1: ox + 6.6, z0: oz - 2.65, z1: oz - 2.15, y0: y, y1: y + 2.2 });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ map: emblemTexture(el ? el.icon : '⭐', hex(el ? el.dark : 0x333333)), transparent: true }));
    poster.position.set(0, 3.4, -3.8); g.add(poster);
  }

  buildPool(g, cols) {
    const y = FLOORS[3];
    const ox = -1, oz = -14;
    g.position.set(ox, y, oz);
    const floorT = new THREE.Mesh(new THREE.BoxGeometry(10, 0.04, 6), M.poolTile);
    floorT.position.y = 0.02; g.add(floorT);
    for (const [w, d, x, z] of [[10.6, 0.3, 0, -3.15], [10.6, 0.3, 0, 3.15], [0.3, 6, -5.15, 0], [0.3, 6, 5.15, 0]]) {
      box(w, 0.7, d, M.white, g, x, 0.35, z);
      cols.push({ x0: ox + x - w / 2, x1: ox + x + w / 2, z0: oz + z - d / 2, z1: oz + z + d / 2, y0: y, y1: y + 0.7 });
    }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), M.water);
    water.rotation.x = -Math.PI / 2; water.position.y = 0.55; g.add(water);
    this.floaters.push({ obj: water, base: 0.55, amp: 0.03, spin: 0 });
    for (const sx of [-2.5, 1.5]) {
      box(1.0, 0.3, 2.0, this.fabricMat, g, sx, 0.35, 4.6, true);
      const back = box(1.0, 0.9, 0.12, this.fabricMat, g, sx, 0.75, 5.5, true);
      back.rotation.x = 0.5;
      cols.push({ x0: ox + sx - 0.5, x1: ox + sx + 0.5, z0: oz + 3.6, z1: oz + 5.6, y0: y, y1: y + 0.5 });
    }
    box(0.08, 2.6, 0.08, M.metal, g, -0.5, 1.3, 4.8);
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 12, 1, true), new THREE.MeshStandardMaterial({ color: this.element ? this.element.color : 0xffffff, side: THREE.DoubleSide, roughness: 0.8 }));
    umb.position.set(-0.5, 2.7, 4.8); umb.castShadow = true; g.add(umb);
  }

  buildTower(g, cols, el) {
    const y = FLOORS[3];
    g.position.set(-12, y - BASE_TOP, -9);
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
    cols.push({ x0: -14.6, x1: -9.4, z0: -11.6, z1: -6.4, y0: y, y1: y + 1.4 });
  }

  buildStatue(g, cols, el) {
    const y = FLOORS[3];
    g.position.set(8.5, y - BASE_TOP, -9);
    box(4.5, 1.6, 4.5, M.wall, g, 0, BASE_TOP + 0.8, 0, true);
    box(4.6, 0.16, 4.6, this.trimMat, g, 0, BASE_TOP + 1.55, 0).castShadow = false;
    const av = createAvatar(el, { material: M.gold, skin: 0xffc94a, baseScale: 2.3 });
    av.root.position.y = BASE_TOP + 1.6;
    av.update(0.016, 0, false);
    g.add(av.root);
    cols.push({ x0: 6.25, x1: 10.75, z0: -11.25, z1: -6.75, y0: y, y1: y + 1.6 });
  }

  reset() {
    for (const id of Object.keys(this.objects)) this.objects[id].removeFromParent();
    for (const o of this.ores) o.mesh.removeFromParent();
    this.objects = {}; this.items.clear(); this.droppers = []; this.upgraders = []; this.ores = [];
    this.spinners = []; this.floaters = []; this.building = []; this.occluders = [];
    this.beltTexes.length = 1;
    this.chutes = {};
    this.roofLabel = null;
    for (const id of Object.keys(this.itemColliders)) {
      for (const c of this.itemColliders[id]) { const i = this.colliders.indexOf(c); if (i >= 0) this.colliders.splice(i, 1); }
    }
    this.itemColliders = {};
    this.bank = 0;
    this.recalcMult();
  }

  // Sinkron dari data multiplayer
  applyRemote(data, el) {
    if (!this.element || this.element.id !== el.id || this.ownerName !== data.name || this.owner !== data.owner) {
      this.setOwner(data.name || 'Pemain', el, false, data.owner);
    }
    const want = new Set(validItems(Object.keys(data.items || {})));
    for (const id of this.items) if (!want.has(id)) { this.reset(); break; }
    for (const it of ITEMS) if (want.has(it.id) && !this.items.has(it.id)) this.build(it.id, true);
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
    for (const p of Object.values(this.pads)) {
      if (!p.group.visible) continue;
      if (Math.abs(local.y - FLOORS[p.item.floor]) > 1.0) continue;
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
  collectPoint(c, out) { return this.toWorld(tmpV.set(c.collectX + 0.3, c.top + 0.6, c.z), out); }

  // ---------- simulasi ore ----------
  spawnOre(d, mods) {
    let value = d.it.value;
    let special = false;
    if (mods.nextOre && mods.nextOre.count > 0) { mods.nextOre.count--; value *= mods.nextOre.mult; special = true; }
    const mesh = new THREE.Mesh(ORE_GEO, special ? this.specialMat : this.oreMat);
    const sc = d.big ? 1.7 : 1;
    mesh.scale.setScalar(sc);
    mesh.castShadow = true;
    const ore = { mesh, c: d.c, x: d.x + (Math.random() - 0.5) * 0.2, y: d.c.drop - 0.25, z: d.c.z + (Math.random() - 0.5) * 0.6, vy: 0, onBelt: false, value, mask: 0, special, r: sc * 0.275, spin: (Math.random() - 0.5) * 4 };
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    mesh.position.set(ore.x, ore.y, ore.z);
    this.group.add(mesh);
    this.ores.push(ore);
    d.squash = 1;
    if (this.ores.length > 320) this.collectOre(0, mods);
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
    for (const tex of this.beltTexes) tex.offset.x -= (BELT_SPEED * dt) / 2;
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

    const dropMult = mods.drop || 1;
    for (const d of this.droppers) {
      d.timer += dt * dropMult;
      if (d.timer >= d.it.interval) { d.timer -= d.it.interval; if (d.timer > d.it.interval) d.timer = 0; this.spawnOre(d, mods); }
      d.squash = Math.max(0, d.squash - dt * 5);
      const s = 1 + d.squash * 0.12;
      d.body.scale.set(s, 1 / s, s);
    }
    const upgMult = mods.upg || 1;
    for (let i = this.ores.length - 1; i >= 0; i--) {
      const o = this.ores[i];
      const c = o.c;
      if (!o.onBelt) {
        o.vy -= 22 * dt;
        o.y += o.vy * dt;
        const floor = c.top + o.r;
        if (o.y <= floor) { o.y = floor; o.vy = 0; o.onBelt = true; }
        o.mesh.rotation.x += o.spin * dt;
      } else {
        o.x += BELT_SPEED * dt;
        o.z += (c.z - o.z) * Math.min(1, dt * 0.8);
      }
      for (const u of this.upgraders) {
        if (u.c !== c) continue;
        const bit = 1 << u.idx;
        if (!(o.mask & bit) && o.x >= u.x) {
          o.mask |= bit;
          o.value *= u.it.mult * upgMult;
          if (Math.random() < 0.6) this.particles.emit(this.oreWorld(o, new THREE.Vector3()), 4, { color: UPG_COLORS[u.it.mult], color2: 0xffffff, speed: 2.5, life: 0.5, size: 0.25 });
        }
      }
      if (o.x >= c.collectX) {
        if (c.i > 0 && this.chutes[c.i] && Math.random() < 0.3) this.particles.emit(this.toWorld(this.chutes[c.i], new THREE.Vector3()), 2, { ...this.element.fx, speed: 1, life: 0.6, size: 0.3 });
        this.collectOre(i, mods);
        continue;
      }
      o.mesh.position.set(o.x, o.y, o.z);
    }
    for (const u of this.upgraders) u.laser.material.opacity = 0.25 + Math.sin(t * 8 + u.idx) * 0.1;

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
