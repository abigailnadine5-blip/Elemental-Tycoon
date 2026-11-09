// Avatar blocky ala Roblox (kepala kotak, badan, 2 tangan, 2 kaki)
// + BAJU khas tiap elemen: motif kaos, lengan, sarung tangan, sepatu, ikat pinggang,
//   aksesori kepala & item punggung (jubah, sayap, jetpack, tabung, perisai...).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { faceTexture } from './textures.js';
import { hex } from './elements.js';

const SKINS = [0xf2cd37, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const G = {
  head: new RoundedBoxGeometry(0.66, 0.62, 0.62, 3, 0.1),
  torso: new RoundedBoxGeometry(1.0, 1.0, 0.5, 2, 0.06),
  limb: new RoundedBoxGeometry(0.48, 1.0, 0.48, 2, 0.06),
  sleeve: new RoundedBoxGeometry(0.52, 0.44, 0.52, 2, 0.06),
  glove: new RoundedBoxGeometry(0.52, 0.26, 0.52, 2, 0.06),
  boot: new RoundedBoxGeometry(0.54, 0.28, 0.6, 2, 0.06),
  belt: new THREE.BoxGeometry(1.03, 0.13, 0.53),
};
let FACE = null;

// ---------- desain baju tiap elemen ----------
const OUTFITS = {
  api: { shirt: ['#7f0000', '#ff6d00'], pattern: 'flame', side: 0xb71c1c, pants: 0x2b1a14, boots: 0xff6d00, bootsGlow: 1, gloves: 0x1a1a1a, belt: 0xffab00, back: 'cape', capeColor: 0xb71c1c, capeGlow: 0xff3d00 },
  air: { shirt: ['#0d47a1', '#29b6f6'], pattern: 'wave', side: 0x1565c0, pants: 0x0d2b4d, boots: 0xe3f2fd, gloves: 0x4fc3f7, belt: 0x01579b, back: 'tank' },
  daun: { shirt: ['#1b5e20', '#66bb6a'], pattern: 'leaf', side: 0x2e7d32, pants: 0x4e342e, boots: 0x3e2723, gloves: 0x2e7d32, belt: 0x795548, back: 'cape', capeColor: 0x2e7d32, capeGlow: 0x1b5e20, capeLeaf: true },
  listrik: { shirt: ['#111111', '#2b2b2b'], pattern: 'bolt', side: 0x1a1a1a, pants: 0x1a1a1a, boots: 0xffd600, bootsGlow: 1, gloves: 0xffd600, glovesGlow: 1, belt: 0xffd600, back: 'battery' },
  techno: { shirt: ['#0b1a24', '#12313f'], pattern: 'circuit', side: 0x10202a, pants: 0x263238, boots: 0x00e5ff, bootsGlow: 1, gloves: 0x37474f, belt: 0x00e5ff, back: 'jetpack' },
  gempa: { shirt: ['#3e2723', '#6d4c41'], pattern: 'crack', side: 0x4e342e, pants: 0x2b1d18, boots: 0x5d4037, gloves: 0x6d4c41, belt: 0xff9100, back: 'boulder', shoulders: 'rock' },
  es: { shirt: ['#81d4fa', '#e1f5fe'], pattern: 'snow', side: 0x4fc3f7, pants: 0xeceff1, boots: 0x81d4fa, gloves: 0xe0f7fa, belt: 0x0288d1, back: 'wings', wing: 'ice' },
  angin: { shirt: ['#26a69a', '#b2dfdb'], pattern: 'swirl', side: 0x00897b, pants: 0xf5f5f5, boots: 0x80cbc4, gloves: 0xe0f2f1, belt: 0x004d40, back: 'wings', wing: 'feather' },
  cahaya: { shirt: ['#fffde7', '#ffe082'], pattern: 'sun', side: 0xfff3c4, pants: 0xfff8e1, boots: 0xffc107, bootsGlow: 1, gloves: 0xffffff, belt: 0xffb300, back: 'wings', wing: 'gold' },
  bayangan: { shirt: ['#12001f', '#2a1145'], pattern: 'hood', side: 0x1a0b2e, pants: 0x0a0a12, boots: 0x1a1030, gloves: 0x7c4dff, glovesGlow: 1, belt: 0x7c4dff, back: 'cape', capeColor: 0x1a1030, capeGlow: 0x4a148c },
  racun: { shirt: ['#2a1a3a', '#4a148c'], pattern: 'drip', side: 0x311b4f, pants: 0x1a0f24, boots: 0x76ff03, bootsGlow: 1, gloves: 0x33691e, belt: 0x76ff03, back: 'toxic' },
  logam: { shirt: ['#607d8b', '#cfd8dc'], pattern: 'armor', side: 0x78909c, pants: 0x455a64, boots: 0x37474f, gloves: 0x90a4ae, belt: 0x263238, back: 'shield', shoulders: 'metal', metal: true },
};

// ---------- pola kaos (digambar di canvas) ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const PATTERNS = {
  flame(g, S) {
    for (const [col, h] of [['rgba(255,109,0,0.85)', 170], ['rgba(255,214,0,0.9)', 110]]) {
      g.fillStyle = col;
      for (let x = -20; x < S + 20; x += 42) {
        const top = S - h * rnd(0.7, 1.1);
        g.beginPath(); g.moveTo(x, S);
        g.bezierCurveTo(x - 10, S - 60, x + 25, top + 50, x + 20, top);
        g.bezierCurveTo(x + 40, top + 60, x + 50, S - 40, x + 42, S);
        g.fill();
      }
    }
  },
  wave(g, S) {
    g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,0.35)';
    for (let y = 40; y < S + 20; y += 38) {
      g.beginPath();
      for (let x = 0; x <= S; x += 8) g.lineTo(x, y + Math.sin(x / 22 + y) * 9);
      g.stroke();
    }
  },
  leaf(g, S) {
    for (let i = 0; i < 16; i++) {
      g.save(); g.translate(rnd(0, S), rnd(0, S)); g.rotate(rnd(0, 6));
      g.fillStyle = `rgba(${rnd(120, 190) | 0},255,${rnd(90, 140) | 0},0.4)`;
      g.beginPath(); g.ellipse(0, 0, 10, 24, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,60,0,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -22); g.lineTo(0, 22); g.stroke();
      g.restore();
    }
  },
  bolt(g, S) {
    g.shadowColor = '#ffea00'; g.shadowBlur = 25;
    g.fillStyle = '#ffd600';
    g.beginPath();
    g.moveTo(150, 0); g.lineTo(80, 130); g.lineTo(130, 130); g.lineTo(95, S); g.lineTo(190, 105); g.lineTo(138, 105); g.lineTo(185, 0);
    g.closePath(); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,214,0,0.8)';
    g.fillRect(0, S - 14, S, 6);
  },
  circuit(g, S) {
    g.strokeStyle = '#00e5ff'; g.fillStyle = '#00e5ff'; g.lineWidth = 4;
    g.shadowColor = '#00e5ff'; g.shadowBlur = 12;
    for (let i = 0; i < 12; i++) {
      let x = rnd(0, S), y = rnd(0, S);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 3; k++) { if (k % 2) y += rnd(-60, 60); else x += rnd(-60, 60); g.lineTo(x, y); }
      g.stroke();
      g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
    }
    g.shadowBlur = 0;
  },
  crack(g, S) {
    g.strokeStyle = '#ff9100'; g.lineWidth = 5; g.shadowColor = '#ff6d00'; g.shadowBlur = 16;
    for (let i = 0; i < 7; i++) {
      let x = rnd(0, S), y = rnd(0, S);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += rnd(-35, 35); y += rnd(-35, 35); g.lineTo(x, y); }
      g.stroke();
    }
    g.shadowBlur = 0;
  },
  snow(g, S) {
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const x = rnd(0, S), y = rnd(0, S), r = rnd(8, 18);
      for (let a = 0; a < 3; a++) {
        const an = (a / 3) * Math.PI;
        g.beginPath(); g.moveTo(x - Math.cos(an) * r, y - Math.sin(an) * r); g.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); g.stroke();
      }
    }
  },
  swirl(g, S) {
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 6; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x = rnd(30, S - 30), y = rnd(30, S - 30);
      g.beginPath();
      for (let a = 0; a < 10; a += 0.2) g.lineTo(x + Math.cos(a) * a * 3.5, y + Math.sin(a) * a * 3.5);
      g.stroke();
    }
  },
  sun(g, S) {
    g.fillStyle = 'rgba(255,193,7,0.55)';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.beginPath(); g.moveTo(128 + Math.cos(a - 0.08) * 40, 100 + Math.sin(a - 0.08) * 40);
      g.lineTo(128 + Math.cos(a) * 200, 100 + Math.sin(a) * 200); g.lineTo(128 + Math.cos(a + 0.08) * 40, 100 + Math.sin(a + 0.08) * 40); g.fill();
    }
    g.fillStyle = '#ffb300'; g.fillRect(0, S - 16, S, 8);
  },
  hood(g, S) {
    g.strokeStyle = '#7c4dff'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(40, 0); g.lineTo(128, 120); g.lineTo(216, 0); g.stroke();
    g.strokeStyle = '#9e9e9e'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 120); g.lineTo(128, S); g.stroke();
    g.strokeStyle = '#b388ff'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(100, 60); g.lineTo(96, 150); g.moveTo(156, 60); g.lineTo(160, 150); g.stroke();
    g.fillStyle = 'rgba(124,77,255,0.25)'; g.fillRect(20, 180, 216, 60);
  },
  drip(g, S) {
    g.fillStyle = '#76ff03'; g.shadowColor = '#76ff03'; g.shadowBlur = 14;
    g.fillRect(0, 0, S, 26);
    for (let x = 8; x < S; x += 26) {
      const h = rnd(30, 120);
      g.beginPath(); g.roundRect ? g.roundRect(x, 10, 14, h, 7) : g.rect(x, 10, 14, h); g.fill();
      g.beginPath(); g.arc(x + 7, 10 + h, 9, 0, 7); g.fill();
    }
    g.shadowBlur = 0;
  },
  armor(g, S) {
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4;
    for (const y of [70, 140, 200]) { g.beginPath(); g.moveTo(10, y); g.lineTo(S - 10, y); g.stroke(); }
    g.beginPath(); g.moveTo(128, 0); g.lineTo(128, S); g.stroke();
    g.fillStyle = '#eceff1';
    for (const y of [70, 140, 200]) for (const x of [24, 232]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
    const hl = g.createLinearGradient(0, 0, S, 0);
    hl.addColorStop(0, 'rgba(255,255,255,0)'); hl.addColorStop(0.45, 'rgba(255,255,255,0.35)'); hl.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.fillRect(0, 0, S, S);
  },
};

function shirtTexture(el, o, front) {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, o.shirt[0]); grad.addColorStop(1, o.shirt[1]);
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  PATTERNS[o.pattern]?.(g, S, front);
  if (front) {
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.moveTo(92, 0); g.lineTo(128, 34); g.lineTo(164, 0); g.fill();
    g.fillStyle = hex(el.dark);
    g.beginPath(); g.arc(128, 104, 36, 0, 7); g.fill();
    g.lineWidth = 6; g.strokeStyle = hex(el.glow); g.stroke();
    g.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(el.icon, 128, 108);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function glowMat(color, intensity = 1.5, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3, ...extra });
}

// ---------- aksesori kepala ----------
function addHeadAccessory(el, head, F, anims = []) {
  const M = (m) => F || m;
  switch (el.id) {
    case 'api': {
      const m = M(glowMat(0xff5a00, 2.2));
      [[0, 0.5, 0, 0.22, 0.6], [-0.2, 0.42, 0.05, 0.16, 0.45], [0.2, 0.42, 0.05, 0.16, 0.45], [0, 0.42, -0.2, 0.18, 0.5]]
        .forEach(([x, y, z, r, h], i) => {
          const f = mesh(new THREE.ConeGeometry(r, h, 6), m, head, x, y, z);
          anims.push((t) => { f.scale.set(1, 1 + Math.sin(t * 15 + i * 1.9) * 0.2, 1); f.rotation.z = Math.sin(t * 9 + i) * 0.12; });
        });
      break;
    }
    case 'air': {
      const m = M(new THREE.MeshPhysicalMaterial({ color: 0x2196f3, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 }));
      const cap = mesh(new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, head, 0, 0.26, 0);
      cap.scale.set(1, 0.7, 1);
      mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), m, head, 0, 0.28, 0.4);
      break;
    }
    case 'daun': {
      const m = M(new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.7 }));
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const leaf = mesh(new THREE.SphereGeometry(0.16, 8, 6), m, head, Math.sin(a) * 0.3, 0.36, Math.cos(a) * 0.3);
        leaf.scale.set(0.5, 1.4, 0.2); leaf.rotation.y = a; leaf.rotation.x = -0.4;
        anims.push((t) => { leaf.rotation.x = -0.4 + Math.sin(t * 3 + i) * 0.15; });
      }
      break;
    }
    case 'listrik': {
      const m = M(glowMat(0xffea00, 2));
      for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.08, 0.45, 5), m, head, s * 0.24, 0.45, 0).rotation.z = -s * 0.5;
      const ring = mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 24), m, head, 0, 0.2, 0);
      ring.rotation.x = Math.PI / 2;
      anims.push((t) => { ring.rotation.z = t * 6; ring.position.y = 0.2 + Math.sin(t * 20) * 0.02; });
      break;
    }
    case 'techno': {
      mesh(new THREE.BoxGeometry(0.7, 0.14, 0.12), M(glowMat(0x00e5ff, 2.5)), head, 0, 0.06, 0.29);
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35), M(new THREE.MeshStandardMaterial({ color: 0x9aa4ad, metalness: 1, roughness: 0.3 })), head, 0.22, 0.45, 0);
      const blink = mesh(new THREE.SphereGeometry(0.06, 10, 8), M(glowMat(0xff1744, 3)), head, 0.22, 0.64, 0);
      if (!F) anims.push((t) => { blink.material.emissiveIntensity = Math.sin(t * 5) > 0.2 ? 4 : 0.3; });
      break;
    }
    case 'gempa': {
      const h = mesh(new THREE.DodecahedronGeometry(0.42, 0), M(new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 1, flatShading: true })), head, 0, 0.3, -0.02);
      h.scale.set(1, 0.55, 1);
      mesh(new THREE.DodecahedronGeometry(0.1, 0), M(glowMat(0xff9100, 1.8)), head, 0, 0.45, 0.25);
      break;
    }
    case 'es': {
      const m = M(new THREE.MeshPhysicalMaterial({ color: 0xb3f0ff, roughness: 0.05, clearcoat: 1, emissive: 0x4fc3f7, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        mesh(new THREE.ConeGeometry(0.07, i % 2 ? 0.25 : 0.4, 4), m, head, Math.sin(a) * 0.26, 0.42, Math.cos(a) * 0.26);
      }
      break;
    }
    case 'angin': {
      const m = M(new THREE.MeshStandardMaterial({ color: 0x80cbc4, roughness: 0.8 }));
      mesh(new THREE.TorusGeometry(0.33, 0.08, 8, 24), m, head, 0, -0.32, 0).rotation.x = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.16, 0.5, 0.05), m, head, 0.2, -0.55, -0.32).rotation.x = 0.4;
      break;
    }
    case 'cahaya':
      const halo = mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 32), M(glowMat(0xffd54f, 3)), head, 0, 0.62, 0);
      halo.rotation.x = Math.PI / 2;
      anims.push((t) => { halo.position.y = 0.62 + Math.sin(t * 2.5) * 0.04; halo.rotation.z = t * 1.5; });
      break;
    case 'bayangan': {
      const m = M(new THREE.MeshStandardMaterial({ color: 0x1a1030, roughness: 0.9 }));
      mesh(new THREE.BoxGeometry(0.74, 0.2, 0.7), m, head, 0, 0.32, -0.02);
      mesh(new THREE.BoxGeometry(0.74, 0.6, 0.12), m, head, 0, 0.02, -0.33);
      for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.07, 0.4, 6), M(glowMat(0xb388ff, 2)), head, s * 0.26, 0.55, 0).rotation.z = -s * 0.35;
      break;
    }
    case 'racun': {
      mesh(new THREE.BoxGeometry(0.4, 0.22, 0.12), M(new THREE.MeshStandardMaterial({ color: 0x2a1a3a, roughness: 0.6 })), head, 0, -0.16, 0.32);
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), M(glowMat(0x76ff03, 2)), head, s * 0.16, -0.18, 0.4).rotation.x = Math.PI / 2;
      break;
    }
    case 'logam': {
      const m = M(new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 1, roughness: 0.25 }));
      mesh(new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, head, 0, 0.22, 0).scale.set(1, 0.8, 1);
      mesh(new THREE.BoxGeometry(0.06, 0.25, 0.5), m, head, 0, 0.5, 0);
      break;
    }
  }
}

// ---------- item punggung ----------
const WING_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.3, 0.45, 0.8, 0.85, 1.35, 1.0);
  s.lineTo(1.1, 0.62); s.lineTo(1.3, 0.4); s.lineTo(0.98, 0.25); s.lineTo(1.08, 0.02); s.lineTo(0.7, -0.02);
  s.bezierCurveTo(0.4, -0.25, 0.15, -0.2, 0, 0);
  return s;
})();
const WING_GEO = new THREE.ExtrudeGeometry(WING_SHAPE, { depth: 0.04, bevelEnabled: false });

function addBack(o, el, body, extras, F) {
  const M = (m) => F || m;
  const metal = M(new THREE.MeshStandardMaterial({ color: 0x9aa4ad, metalness: 1, roughness: 0.3 }));
  switch (o.back) {
    case 'cape': {
      const pivot = new THREE.Group();
      pivot.position.set(0, 2.0, -0.27);
      body.add(pivot);
      let mat;
      if (F) mat = F;
      else if (o.capeLeaf) {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = hex(o.capeColor); g.fillRect(0, 0, 128, 128);
        PATTERNS.leaf(g, 128);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        mat = new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 });
      } else {
        mat = new THREE.MeshStandardMaterial({ color: o.capeColor, emissive: o.capeGlow, emissiveIntensity: 0.35, side: THREE.DoubleSide, roughness: 0.8 });
      }
      const geo = new THREE.PlaneGeometry(0.95, 1.55, 1, 6);
      geo.translate(0, -0.775, 0);
      const cape = mesh(geo, mat, pivot);
      cape.castShadow = true;
      extras.push({ type: 'cape', obj: pivot });
      break;
    }
    case 'wings': {
      const mat = F || (o.wing === 'ice'
        ? new THREE.MeshPhysicalMaterial({ color: 0xb3f0ff, emissive: 0x4fc3f7, emissiveIntensity: 0.7, transparent: true, opacity: 0.7, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide })
        : o.wing === 'gold'
          ? new THREE.MeshStandardMaterial({ color: 0xffe082, emissive: 0xffc107, emissiveIntensity: 1.4, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide })
          : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide }));
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.12, 1.85, -0.28);
        body.add(pivot);
        const w = mesh(WING_GEO, mat, pivot);
        w.scale.set(side, 1, 1);
        extras.push({ type: 'wing', obj: pivot, side });
      }
      break;
    }
    case 'tank': {
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.75, 16), M(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1 })), body, 0, 1.55, -0.45);
      mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.55, 16), M(glowMat(0x29b6f6, 0.8, { transparent: true, opacity: 0.85 })), body, 0, 1.5, -0.45);
      for (const y of [1.15, 1.95]) mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.08, 16), metal, body, 0, y, -0.45);
      break;
    }
    case 'battery': {
      mesh(new RoundedBoxGeometry(0.6, 0.75, 0.25, 2, 0.05), M(new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.5 })), body, 0, 1.55, -0.38);
      for (const x of [-0.16, 0.16]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10), M(glowMat(0xffea00, 2.5)), body, x, 1.55, -0.52);
      break;
    }
    case 'jetpack': {
      for (const x of [-0.18, 0.18]) {
        mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.65, 14), metal, body, x, 1.6, -0.42);
        const noz = mesh(new THREE.ConeGeometry(0.12, 0.2, 12), M(glowMat(0x00e5ff, 3)), body, x, 1.18, -0.42);
        noz.rotation.x = Math.PI;
        const marker = new THREE.Object3D(); marker.position.set(x, 1.05, -0.42); body.add(marker);
        extras.push({ type: 'jet', obj: marker });
      }
      break;
    }
    case 'boulder': {
      mesh(new THREE.DodecahedronGeometry(0.42, 0), M(new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1, flatShading: true })), body, 0, 1.6, -0.55);
      mesh(new THREE.DodecahedronGeometry(0.12, 0), M(glowMat(0xff6d00, 2)), body, 0.15, 1.75, -0.86);
      break;
    }
    case 'toxic': {
      for (const x of [-0.18, 0.18]) {
        mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 14), M(glowMat(0x76ff03, 1.4, { transparent: true, opacity: 0.85 })), body, x, 1.55, -0.42);
        mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 14), metal, body, x, 1.88, -0.42);
      }
      break;
    }
    case 'shield': {
      const s = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 24), metal, body, 0, 1.5, -0.33);
      s.rotation.x = Math.PI / 2;
      mesh(new THREE.SphereGeometry(0.12, 12, 8), M(glowMat(el.glow, 1.5)), body, 0, 1.5, -0.4);
      break;
    }
  }
  if (o.shoulders === 'rock') {
    const m = M(new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 1, flatShading: true }));
    for (const s of [-1, 1]) mesh(new THREE.DodecahedronGeometry(0.3, 0), m, body, s * 0.72, 2.02, 0);
  } else if (o.shoulders === 'metal') {
    for (const s of [-1, 1]) {
      const p = mesh(new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal, body, s * 0.75, 1.92, 0);
      p.scale.set(1, 0.7, 1);
    }
  }
}

// ---------------------------------------------------------------------
// KOSTUM: gaya tambahan yang warnanya mengikuti elemen
//   contoh: Ninja Listrik, Ninja Bayangan, Kesatria Cahaya, Penyihir Api, Samurai Es, Mecha Techno
// ---------------------------------------------------------------------
export const COSTUMES = [
  { id: 'standar', name: 'Standar', icon: '👕' },
  { id: 'ninja', name: 'Ninja', icon: '🥷' },
  { id: 'kesatria', name: 'Kesatria', icon: '🛡️' },
  { id: 'penyihir', name: 'Penyihir', icon: '🧙' },
  { id: 'samurai', name: 'Samurai', icon: '⛩️' },
  { id: 'mecha', name: 'Mecha', icon: '🤖' },
];
export function costumeName(cid, el) {
  const c = COSTUMES.find((x) => x.id === cid) || COSTUMES[0];
  return c.id === 'standar' ? `${el.name} Standar` : `${c.name} ${el.name}`;
}

// gaya pose serangan
const ELEMENT_STYLE = { api: 'throw', air: 'cast', daun: 'throw', listrik: 'cast', techno: 'punch', gempa: 'slam', es: 'throw', angin: 'cast', cahaya: 'cast', bayangan: 'cast', racun: 'throw', logam: 'throw' };
const COSTUME_STYLE = { ninja: 'throw', kesatria: 'slash', penyihir: 'cast', samurai: 'slash', mecha: 'punch' };
export const ACTION_DUR = { throw: 0.45, punch: 0.32, cast: 0.5, slam: 0.6, slash: 0.45, skill: 0.9, transform: 1.0, wave: 2.2, dance: 4, salute: 1.6, flex: 2.2, victory: 2.5 };
export const EMOTES = [
  { id: 'wave', name: 'Lambai', icon: '👋' },
  { id: 'dance', name: 'Joget', icon: '💃' },
  { id: 'salute', name: 'Hormat', icon: '🫡' },
  { id: 'flex', name: 'Pamer', icon: '💪' },
  { id: 'victory', name: 'Menang', icon: '🏆' },
];

function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath(); g.fill();
}

function costumeTexture(el, kind, front) {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const C = hex(el.color), GL = hex(el.glow), D = hex(el.dark);
  const emblem = (x, y, r) => {
    g.fillStyle = D; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.lineWidth = 5; g.strokeStyle = GL; g.stroke();
    g.font = `${r * 1.2}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(el.icon, x, y + 3);
  };
  switch (kind) {
    case 'ninja': {
      g.fillStyle = '#17181f'; g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 2;
      for (let i = -S; i < S; i += 10) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
      g.strokeStyle = C; g.lineWidth = 34;
      g.beginPath(); if (front) { g.moveTo(-10, 30); g.lineTo(266, 220); } else { g.moveTo(266, 30); g.lineTo(-10, 220); } g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, S, 14);
      if (front) emblem(185, 70, 24);
      break;
    }
    case 'kesatria': {
      const gr = g.createLinearGradient(0, 0, S, S);
      gr.addColorStop(0, '#f5f7f8'); gr.addColorStop(0.5, '#b0bec5'); gr.addColorStop(1, '#78909c');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.fillStyle = C; g.globalAlpha = 0.2; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4;
      for (const y of [60, 175, 225]) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      g.fillStyle = '#eceff1';
      for (const y of [60, 175, 225]) for (const x of [16, 240]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
      if (front) {
        g.fillStyle = D; g.strokeStyle = '#ffd54f'; g.lineWidth = 6;
        g.beginPath(); g.moveTo(128, 70); g.lineTo(185, 85); g.lineTo(178, 140); g.lineTo(128, 170); g.lineTo(78, 140); g.lineTo(71, 85); g.closePath(); g.fill(); g.stroke();
        g.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(el.icon, 128, 118);
      }
      break;
    }
    case 'penyihir': {
      const gr = g.createLinearGradient(0, 0, 0, S);
      gr.addColorStop(0, D); gr.addColorStop(1, C);
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.fillStyle = '#ffd54f';
      for (let i = 0; i < 14; i++) star(g, Math.random() * S, Math.random() * S, 5 + Math.random() * 7);
      g.beginPath(); g.arc(200, 60, 22, 0, 7); g.fill();
      g.fillStyle = D; g.beginPath(); g.arc(210, 54, 20, 0, 7); g.fill();
      if (front) {
        g.strokeStyle = '#fff8e1'; g.lineWidth = 10; g.beginPath(); g.moveTo(70, 0); g.lineTo(128, 110); g.lineTo(186, 0); g.stroke();
        g.fillStyle = '#ffb300'; g.fillRect(0, 196, S, 18);
      }
      break;
    }
    case 'samurai': {
      g.fillStyle = D; g.fillRect(0, 0, S, S);
      for (let y = 8; y < S; y += 34) {
        g.fillStyle = C; g.globalAlpha = 0.9; g.fillRect(0, y, S, 22); g.globalAlpha = 1;
        g.fillStyle = '#f5f5f5';
        for (let x = 10; x < S; x += 24) g.fillRect(x, y + 8, 6, 6);
      }
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(122, 0, 12, S);
      if (front) emblem(128, 60, 30);
      break;
    }
    case 'mecha': {
      const gr = g.createLinearGradient(0, 0, 0, S);
      gr.addColorStop(0, '#4a5058'); gr.addColorStop(1, '#262a2f');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 4;
      g.strokeRect(14, 14, 228, 100); g.strokeRect(14, 130, 106, 112); g.strokeRect(136, 130, 106, 112);
      g.strokeStyle = GL; g.lineWidth = 4; g.shadowColor = GL; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(20, 122); g.lineTo(236, 122); g.moveTo(128, 130); g.lineTo(128, 250); g.stroke();
      if (front) {
        const rg = g.createRadialGradient(128, 66, 4, 128, 66, 40);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.4, GL); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(128, 66, 40, 0, 7); g.fill();
      }
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(0,0,0,0.5)';
      for (let i = 0; i < 4; i++) g.fillRect(30, 150 + i * 18, 70, 6);
      break;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const tintMetal = (el, k = 0.22) => new THREE.MeshStandardMaterial({ color: new THREE.Color(0xd5dade).lerp(new THREE.Color(el.color), k), metalness: 1, roughness: 0.28 });
const darkMetal = () => new THREE.MeshStandardMaterial({ color: 0x3a4047, metalness: 0.9, roughness: 0.35 });

// Bagian-bagian kostum (kepala, tangan, punggung, dll.)
function buildCostume(kind, el, P, extras, anims) {
  const { head, body, armL, armR, legL, legR, F } = P;
  const M = (m) => F || m;
  const cloth = (color, extra = {}) => M(new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
  const glow = M(glowMat(el.glow, 2));
  switch (kind) {
    case 'ninja': {
      const dark = cloth(0x17181f);
      mesh(new RoundedBoxGeometry(0.72, 0.68, 0.6, 2, 0.08), dark, head, 0, 0.01, -0.05);
      mesh(new THREE.BoxGeometry(0.7, 0.3, 0.08), dark, head, 0, -0.15, 0.31);
      const band = cloth(el.color, { emissive: el.color, emissiveIntensity: 0.25 });
      mesh(new THREE.BoxGeometry(0.75, 0.1, 0.66), band, head, 0, 0.14, -0.02);
      for (const s of [-1, 1]) {
        const tail = new THREE.Group(); tail.position.set(s * 0.06, 0.14, -0.36); head.add(tail);
        const geo = new THREE.BoxGeometry(0.08, 0.6, 0.02); geo.translate(0, -0.3, 0);
        mesh(geo, band, tail);
        extras.push({ type: 'tail', obj: tail, side: s });
      }
      // dua katana menyilang di punggung
      for (const s of [-1, 1]) {
        const k = new THREE.Group(); k.position.set(0, 1.55, -0.3); k.rotation.z = s * 0.65; body.add(k);
        mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 8), band, k, 0, 0.72, 0);
        mesh(new THREE.BoxGeometry(0.16, 0.04, 0.1), M(glowMat(0xffd54f, 0.4)), k, 0, 0.53, 0);
        mesh(new THREE.BoxGeometry(0.06, 1.1, 0.03), M(new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 1, roughness: 0.15, emissive: el.glow, emissiveIntensity: 0.25 })), k, 0, -0.05, 0);
      }
      for (const l of [legL, legR]) mesh(new THREE.BoxGeometry(0.52, 0.08, 0.52), band, l, 0, -0.6, 0);
      return { side: 0x17181f, pants: 0x17181f, gloves: el.color, boots: 0x101014, belt: el.color, face: true };
    }
    case 'kesatria': {
      const metal = M(tintMetal(el));
      mesh(new RoundedBoxGeometry(0.76, 0.74, 0.74, 3, 0.12), metal, head, 0, 0.02, 0);
      mesh(new THREE.BoxGeometry(0.62, 0.09, 0.05), M(new THREE.MeshStandardMaterial({ color: 0x050505 })), head, 0, 0.05, 0.37);
      mesh(new THREE.BoxGeometry(0.56, 0.03, 0.02), glow, head, 0, 0.05, 0.4);
      mesh(new THREE.BoxGeometry(0.08, 0.3, 0.66), cloth(el.color, { emissive: el.color, emissiveIntensity: 0.3 }), head, 0, 0.48, -0.02);
      // pedang di tangan kanan
      const sw = new THREE.Group(); sw.position.set(0, -0.98, 0.05); armR.add(sw);
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 8), cloth(0x4e342e), sw, 0, 0, 0).rotation.x = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.42, 0.07, 0.08), M(glowMat(0xffd54f, 0.5, { metalness: 1 })), sw, 0, 0, 0.18);
      mesh(new THREE.BoxGeometry(0.035, 0.14, 1.25), M(new THREE.MeshStandardMaterial({ color: 0xeef3f6, metalness: 1, roughness: 0.12, emissive: el.glow, emissiveIntensity: 0.7 })), sw, 0, 0, 0.84);
      // perisai di tangan kiri
      const sh = new THREE.Group(); sh.position.set(-0.3, -0.55, 0.05); armL.add(sh);
      mesh(new RoundedBoxGeometry(0.1, 0.9, 0.72, 2, 0.04), cloth(el.color, { metalness: 0.6, roughness: 0.35 }), sh);
      mesh(new THREE.BoxGeometry(0.12, 0.92, 0.1), M(glowMat(0xffd54f, 0.6, { metalness: 1 })), sh);
      mesh(new THREE.BoxGeometry(0.12, 0.1, 0.74), M(glowMat(0xffd54f, 0.6, { metalness: 1 })), sh, 0, 0.12, 0);
      // jubah
      const pivot = new THREE.Group(); pivot.position.set(0, 2.0, -0.27); body.add(pivot);
      const geo = new THREE.PlaneGeometry(0.95, 1.6, 1, 6); geo.translate(0, -0.8, 0);
      mesh(geo, F || new THREE.MeshStandardMaterial({ color: el.color, emissive: el.dark, emissiveIntensity: 0.3, side: THREE.DoubleSide, roughness: 0.8 }), pivot);
      extras.push({ type: 'cape', obj: pivot });
      for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.34, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal, body, s * 0.75, 1.92, 0).scale.set(1, 0.7, 1);
      return { side: 'metal', pants: 'metal', gloves: 'metal', boots: 'metal', belt: 0x5d4037, face: false };
    }
    case 'penyihir': {
      const robe = cloth(el.dark, { side: THREE.DoubleSide });
      const hatMat = cloth(new THREE.Color(el.dark).lerp(new THREE.Color(el.color), 0.35).getHex());
      mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 24), hatMat, head, 0, 0.3, 0);
      const cone = mesh(new THREE.ConeGeometry(0.34, 0.95, 20), hatMat, head, 0, 0.78, -0.05);
      cone.rotation.x = -0.18;
      mesh(new THREE.TorusGeometry(0.33, 0.04, 8, 24), glow, head, 0, 0.36, 0).rotation.x = Math.PI / 2;
      const st = mesh(new THREE.OctahedronGeometry(0.08), M(glowMat(0xffd54f, 3)), head, 0, 1.25, -0.2);
      anims.push((t) => { st.rotation.y = t * 3; });
      // jubah panjang
      mesh(new THREE.CylinderGeometry(0.56, 0.74, 1.05, 18, 1, true), robe, body, 0, 0.52, 0);
      // tongkat sihir
      const staff = new THREE.Group(); staff.position.set(0, -0.98, 0.16); armR.add(staff);
      mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.5, 8), cloth(0x6d4c41), staff, 0, 0.3, 0);
      const orb = mesh(new THREE.SphereGeometry(0.15, 16, 12), M(glowMat(el.glow, 3)), staff, 0, 1.62, 0);
      const ring = mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 24), glow, staff, 0, 1.62, 0);
      anims.push((t) => { ring.rotation.x = t * 3; ring.rotation.y = t * 2; orb.scale.setScalar(1 + Math.sin(t * 6) * 0.12); });
      extras.push({ type: 'tip', obj: orb });
      return { side: el.dark, pants: el.dark, gloves: 0xf1e3c8, boots: 0x3e2723, belt: 0xffb300, face: true };
    }
    case 'samurai': {
      const lac = cloth(0x1d1d22, { roughness: 0.4, metalness: 0.3 });
      const dome = mesh(new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), lac, head, 0, 0.18, -0.02);
      dome.scale.set(1, 0.85, 1);
      for (const s of [-1, 1]) {
        const f = mesh(new THREE.BoxGeometry(0.1, 0.32, 0.55), lac, head, s * 0.4, 0.02, -0.05);
        f.rotation.z = s * 0.35;
        const horn = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.03), M(glowMat(0xffd54f, 0.7, { metalness: 1 })), head, s * 0.15, 0.55, 0.3);
        horn.rotation.z = -s * 0.45;
      }
      mesh(new THREE.BoxGeometry(0.78, 0.26, 0.12), lac, head, 0, -0.12, -0.36);
      mesh(new THREE.SphereGeometry(0.07, 10, 8), glow, head, 0, 0.32, 0.36);
      // pelindung bahu & rok baju zirah
      const plate = cloth(el.color, { roughness: 0.4, metalness: 0.3 });
      for (const [a, s] of [[armL, -1], [armR, 1]]) mesh(new THREE.BoxGeometry(0.12, 0.5, 0.56), plate, a, s * 0.3, -0.18, 0);
      for (const [x, z, ry] of [[0, 0.27, 0], [-0.45, 0, Math.PI / 2], [0.45, 0, Math.PI / 2]]) {
        const p = mesh(new THREE.BoxGeometry(0.5, 0.36, 0.06), plate, body, x, 0.86, z);
        p.rotation.y = ry; p.rotation.x = z ? 0.15 : 0;
      }
      // katana di pinggang & bendera di punggung
      const kat = new THREE.Group(); kat.position.set(-0.56, 1.05, 0.05); kat.rotation.x = -1.2; body.add(kat);
      mesh(new THREE.BoxGeometry(0.07, 1.1, 0.07), lac, kat);
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8), cloth(el.color), kat, 0, 0.7, 0);
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.0, 6), cloth(0x3e2723), body, 0, 2.55, -0.33);
      const flag = new THREE.Group(); flag.position.set(0.02, 3.45, -0.33); body.add(flag);
      const fg = new THREE.PlaneGeometry(0.5, 0.95); fg.translate(0.25, -0.47, 0);
      mesh(fg, F || new THREE.MeshStandardMaterial({ map: costumeTexture(el, 'samurai', true), side: THREE.DoubleSide, roughness: 0.9 }), flag).rotation.y = Math.PI / 2;
      extras.push({ type: 'flag', obj: flag });
      return { side: el.dark, pants: 0x1d1d22, gloves: 0x1d1d22, boots: 0x101014, belt: el.color, face: true };
    }
    case 'mecha': {
      const dm = M(darkMetal());
      mesh(new RoundedBoxGeometry(0.76, 0.72, 0.74, 2, 0.08), dm, head, 0, 0.01, 0);
      const visor = mesh(new THREE.BoxGeometry(0.64, 0.18, 0.04), M(glowMat(el.glow, 3)), head, 0, 0.06, 0.375);
      anims.push((t) => { visor.scale.x = 0.9 + Math.sin(t * 3) * 0.1; });
      for (const s of [-1, 1]) {
        mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), glow, head, s * 0.4, 0.02, 0).rotation.z = Math.PI / 2;
        const ant = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), dm, head, s * 0.25, 0.55, -0.1);
        ant.rotation.z = -s * 0.3;
      }
      for (const s of [-1, 1]) {
        mesh(new RoundedBoxGeometry(0.5, 0.42, 0.62, 2, 0.06), dm, body, s * 0.8, 2.05, 0);
        mesh(new THREE.BoxGeometry(0.52, 0.06, 0.64), glow, body, s * 0.8, 2.0, 0);
      }
      const core = mesh(new THREE.SphereGeometry(0.1, 14, 10), M(glowMat(el.glow, 3)), body, 0, 1.72, 0.27);
      anims.push((t) => { core.scale.setScalar(1 + Math.sin(t * 4) * 0.2); });
      for (const x of [-0.2, 0.2]) {
        mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.75, 14), dm, body, x, 1.6, -0.42);
        const noz = mesh(new THREE.ConeGeometry(0.14, 0.22, 12), glow, body, x, 1.12, -0.42);
        noz.rotation.x = Math.PI;
        const marker = new THREE.Object3D(); marker.position.set(x, 1.0, -0.42); body.add(marker);
        extras.push({ type: 'jet', obj: marker });
      }
      return { side: 'dark', pants: 'dark', gloves: el.glow, glovesGlow: true, boots: 'dark', bootsGlow: el.glow, belt: el.glow, face: false };
    }
  }
  return null;
}

// Benda yang mengorbit saat Ultimate
function makeOrbiters(el, F) {
  const g = new THREE.Group();
  const n = 6;
  const gm = (c, i = 2.5, extra = {}) => F || glowMat(c, i, extra);
  for (let i = 0; i < n; i++) {
    let m;
    switch (el.id) {
      case 'api': m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), gm(0xff6a00, 3)); break;
      case 'air': m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), F || new THREE.MeshPhysicalMaterial({ color: 0x4fc3f7, emissive: 0x0288d1, emissiveIntensity: 0.8, transparent: true, opacity: 0.75, clearcoat: 1, roughness: 0.05 })); break;
      case 'daun': m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), gm(0x66bb6a, 0.8)); m.scale.set(1, 0.2, 0.55); break;
      case 'listrik': m = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), gm(0xffea00, 3)); break;
      case 'techno': m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 6), gm(0x00e5ff, 2.5)); m.rotation.x = Math.PI / 2; break;
      case 'gempa': m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), F || new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true, emissive: 0xff6d00, emissiveIntensity: 0.4 })); break;
      case 'es': m = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 6), gm(0xb3f0ff, 1.2)); break;
      case 'angin': m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), gm(0xffffff, 1.5)); m.scale.set(2, 0.35, 0.35); break;
      case 'cahaya': m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), gm(0xffe082, 4)); break;
      case 'bayangan': m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), F || new THREE.MeshStandardMaterial({ color: 0x0a0014, emissive: 0x7c4dff, emissiveIntensity: 2 })); break;
      case 'racun': m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), gm(0x76ff03, 1.8, { transparent: true, opacity: 0.8 })); break;
      default: m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 6), F || new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 1, roughness: 0.2 })); break;
    }
    g.add(m);
  }
  return g;
}

/**
 * opts.material  -> paksa satu material (patung emas)
 * opts.skin      -> warna kulit
 * opts.costume   -> 'standar' | 'ninja' | 'kesatria' | 'penyihir' | 'samurai' | 'mecha'
 * opts.baseScale -> skala dasar
 */
export function createAvatar(el, opts = {}) {
  if (!FACE) FACE = faceTexture();
  const o = OUTFITS[el.id] || OUTFITS.api;
  const F = opts.material || null;
  const kind = opts.costume && opts.costume !== 'standar' ? opts.costume : null;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const extras = [], anims = [];

  const skin = opts.skin ?? SKINS[Math.floor(Math.random() * SKINS.length)];
  const skinMat = F || new THREE.MeshStandardMaterial({ color: skin, roughness: 0.55 });

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.32, 0);
  body.add(headPivot);
  const head = mesh(G.head, skinMat, headPivot);

  const limb = (x, y, mat) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    body.add(pivot);
    const m = mesh(G.limb, mat, pivot, 0, -0.5, 0);
    return [pivot, m];
  };
  const [armL] = limb(-0.75, 1.98, skinMat);
  const [armR] = limb(0.75, 1.98, skinMat);
  const [legL, legLm] = limb(-0.25, 1.0, skinMat);
  const [legR, legRm] = limb(0.25, 1.0, skinMat);

  // --- tentukan bahan baju ---
  let spec;
  if (kind) spec = buildCostume(kind, el, { head: headPivot, body, armL, armR, legL, legR, F }, extras, anims);
  const metalMat = kind === 'kesatria' ? tintMetal(el) : null;
  const pick = (v, rough = 0.75) => {
    if (F) return F;
    if (v === 'metal') return metalMat;
    if (v === 'dark') return darkMetal();
    return new THREE.MeshStandardMaterial({ color: v, roughness: rough });
  };
  let sideMat, pantsMat, glove, boot, beltMat, showFace = true;
  if (spec) {
    sideMat = pick(spec.side);
    pantsMat = pick(spec.pants, 0.8);
    glove = F || (spec.gloves === 'metal' ? metalMat : new THREE.MeshStandardMaterial({ color: spec.gloves, roughness: 0.6, emissive: spec.glovesGlow ? spec.gloves : 0, emissiveIntensity: spec.glovesGlow ? 1.3 : 0 }));
    boot = F || (spec.boots === 'metal' ? metalMat : spec.boots === 'dark' ? darkMetal() : new THREE.MeshStandardMaterial({ color: spec.boots, roughness: 0.5 }));
    if (spec.bootsGlow && !F) { boot = darkMetal(); boot.emissive = new THREE.Color(spec.bootsGlow); boot.emissiveIntensity = 0.5; }
    beltMat = F || new THREE.MeshStandardMaterial({ color: spec.belt, roughness: 0.45, emissive: spec.belt, emissiveIntensity: 0.2 });
    showFace = spec.face;
  } else {
    sideMat = F || new THREE.MeshStandardMaterial({ color: o.side, roughness: o.metal ? 0.3 : 0.7, metalness: o.metal ? 0.9 : 0 });
    pantsMat = F || new THREE.MeshStandardMaterial({ color: o.pants, roughness: 0.8 });
    glove = F || new THREE.MeshStandardMaterial({ color: o.gloves, roughness: 0.6, emissive: o.glovesGlow ? o.gloves : 0, emissiveIntensity: o.glovesGlow ? 1.2 : 0 });
    boot = F || new THREE.MeshStandardMaterial({ color: o.boots, roughness: 0.5, emissive: o.bootsGlow ? o.boots : 0, emissiveIntensity: o.bootsGlow ? 0.9 : 0 });
    beltMat = F || new THREE.MeshStandardMaterial({ color: o.belt, roughness: 0.4, metalness: 0.4, emissive: o.belt, emissiveIntensity: 0.25 });
  }
  legLm.material = pantsMat; legRm.material = pantsMat;

  // badan + motif
  const torso = mesh(G.torso, sideMat, body, 0, 1.5, 0);
  if (!F) {
    const metalish = kind === 'kesatria' || kind === 'mecha' || (!kind && o.metal);
    const pm = { roughness: metalish ? 0.3 : 0.7, metalness: metalish ? 0.8 : 0 };
    const tex = (front) => (kind ? costumeTexture(el, kind, front) : shirtTexture(el, o, front));
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: tex(true), ...pm }));
    front.position.set(0, 0, 0.252);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: tex(false), ...pm }));
    back.position.set(0, 0, -0.252); back.rotation.y = Math.PI;
    torso.add(front, back);
  }
  mesh(G.belt, beltMat, body, 0, 1.06, 0);
  mesh(new THREE.BoxGeometry(0.2, 0.15, 0.04), F || glowMat(el.glow, 1.2), body, 0, 1.06, 0.28);

  if (!F && showFace) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: FACE, transparent: true, roughness: 0.6 }));
    face.position.z = 0.312;
    head.add(face);
  }
  if (!kind && !opts.noAccessory) addHeadAccessory(el, headPivot, F, anims);

  for (const a of [armL, armR]) {
    mesh(G.sleeve, sideMat, a, 0, -0.2, 0);
    mesh(G.glove, glove, a, 0, -0.88, 0);
  }
  for (const l of [legL, legR]) mesh(G.boot, boot, l, 0, -0.87, 0.04);
  if (!kind) addBack(o, el, body, extras, F);

  // aura & orbit ultimate
  const auraMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(el.glow).multiplyScalar(2), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  const aura = new THREE.Group();
  for (const [r, y] of [[1.1, 0.15], [0.85, 1.4], [0.7, 2.6]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 40), auraMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    aura.add(ring);
  }
  aura.visible = false;
  root.add(aura);
  let orbit = null;

  // ---------- animasi ----------
  let phase = 0, t = 0, power = false, scale = 1, act = null;
  const cur = { aL: 0, aR: 0, zL: 0, zR: 0, lL: 0, lR: 0, pitch: 0, yaw: 0, lift: 0, head: 0 };
  const style = (kind && COSTUME_STYLE[kind]) || ELEMENT_STYLE[el.id] || 'throw';

  function update(dt, speed, airborne, flying = false) {
    t += dt;
    const s = Math.min(speed, 1.6);
    phase += dt * (4 + 7 * s);
    const T = { aL: 0, aR: 0, zL: -0.04, zR: 0.04, lL: 0, lR: 0, pitch: 0, yaw: 0, lift: 0, head: 0 };
    if (flying) {
      Object.assign(T, { aL: -2.95, aR: -2.95, zL: 0.12, zR: -0.12, lL: 0.25, lR: 0.1, pitch: 1.15, head: -0.6 });
    } else if (airborne) {
      Object.assign(T, { aL: -2.7, aR: -2.7, zL: -0.25, zR: 0.25, lL: 0.25, lR: -0.25 });
    } else if (s > 0.05) {
      const sw = Math.sin(phase) * 0.9 * Math.min(1, s);
      Object.assign(T, { aL: sw, aR: -sw, lL: -sw, lR: sw, pitch: s * 0.08, lift: Math.abs(Math.sin(phase)) * 0.07 * Math.min(1, s) });
    } else {
      // idle: bernapas & sedikit goyang
      T.zL = -0.05 - Math.sin(t * 1.6) * 0.03; T.zR = 0.05 + Math.sin(t * 1.6) * 0.03;
      T.lift = Math.sin(t * 1.6) * 0.012;
      T.head = Math.sin(t * 0.7) * 0.05;
    }
    if (act && act.emote && (s > 0.2 || airborne)) act = null;
    if (act) {
      act.t += dt;
      const p = act.t / act.dur;
      if (p >= 1) act = null;
      else switch (act.name) {
        case 'throw': Object.assign(T, p < 0.35 ? { aR: -2.9, zR: 0.3, yaw: -0.45 } : { aR: -1.2, zR: 0, yaw: 0.35, aL: -0.4 }); break;
        case 'punch': Object.assign(T, { aR: -1.6, yaw: 0.35, aL: 0.4, pitch: 0.12 }); break;
        case 'cast': Object.assign(T, { aL: -1.55, aR: -1.55, zL: 0.18, zR: -0.18, pitch: 0.05 }); break;
        case 'slam': Object.assign(T, p < 0.45 ? { aL: -3.0, aR: -3.0, lift: Math.sin((p / 0.45) * Math.PI / 2) * 0.4, head: -0.3 } : { aL: -0.7, aR: -0.7, pitch: 0.35, zL: 0.15, zR: -0.15 }); break;
        case 'slash': Object.assign(T, p < 0.3 ? { aR: -2.9, zR: 0.6, yaw: -0.5 } : { aR: -0.75, zR: -0.5, yaw: 0.55, pitch: 0.15, aL: 0.3 }); break;
        case 'skill': Object.assign(T, { aL: -2.9, aR: -2.9, zL: -0.5, zR: 0.5, lift: Math.sin(p * Math.PI) * 0.3, head: -0.35 }); break;
        case 'transform': Object.assign(T, { yaw: p * Math.PI * 4, zL: -1.4, zR: 1.4, aL: 0, aR: 0, lift: Math.sin(p * Math.PI) * 0.9, head: -0.3 }); break;
        case 'wave': Object.assign(T, { aR: 0, zR: 2.5 + Math.sin(t * 14) * 0.35, head: Math.sin(t * 3) * 0.1 }); break;
        case 'dance': {
          const b = t * 8;
          Object.assign(T, { aL: Math.sin(b) > 0 ? -2.8 : -0.2, aR: Math.sin(b) > 0 ? -0.2 : -2.8, zL: -0.35, zR: 0.35, yaw: Math.sin(t * 4) * 0.45, lift: Math.abs(Math.sin(b)) * 0.18, lL: Math.sin(b) * 0.5, lR: -Math.sin(b) * 0.5 });
          break;
        }
        case 'salute': Object.assign(T, { aR: -2.6, zR: -0.65, head: -0.05 }); break;
        case 'flex': Object.assign(T, { zL: -1.5 - Math.sin(t * 10) * 0.18, zR: 1.5 + Math.sin(t * 10) * 0.18, aL: -0.2, aR: -0.2, head: Math.sin(t * 5) * 0.1, pitch: -0.05 }); break;
        case 'victory': Object.assign(T, { aL: -2.9, aR: -2.9, zL: -0.35, zR: 0.35, lift: Math.abs(Math.sin(t * 7)) * 0.55, lL: 0.2, lR: -0.2 }); break;
      }
    }
    const k = 1 - Math.exp(-(act && !act.emote ? 26 : 16) * dt);
    for (const key in cur) cur[key] += (T[key] - cur[key]) * (key === 'yaw' && act && act.name === 'transform' ? 1 : k);
    armL.rotation.x = cur.aL; armR.rotation.x = cur.aR;
    armL.rotation.z = cur.zL; armR.rotation.z = cur.zR;
    legL.rotation.x = cur.lL; legR.rotation.x = cur.lR;
    headPivot.rotation.x = cur.head;
    // putar badan di sekitar pinggul (y = 1.2)
    body.rotation.set(cur.pitch, cur.yaw, 0);
    body.position.set(0, 1.2 - 1.2 * Math.cos(cur.pitch) + cur.lift, -1.2 * Math.sin(cur.pitch));

    for (const e of extras) {
      if (e.type === 'cape') {
        const target = 0.12 + s * 0.55 + (airborne ? 0.5 : 0) + (flying ? 0.6 : 0) + Math.sin(t * 6) * 0.05 * (0.3 + s);
        e.obj.rotation.x += (target - e.obj.rotation.x) * k * 0.5;
      } else if (e.type === 'tail') {
        e.obj.rotation.x = 0.5 + s * 0.6 + Math.sin(t * 8 + e.side) * 0.15;
        e.obj.rotation.z = e.side * 0.15;
      } else if (e.type === 'flag') {
        e.obj.rotation.y = Math.sin(t * 3) * 0.25;
      } else if (e.type === 'wing') {
        const flap = airborne || power ? Math.sin(t * 12) * 0.55 : Math.sin(t * 2) * 0.12;
        e.obj.rotation.y = e.side * (0.55 + flap);
        e.obj.rotation.z = e.side * -0.1;
      }
    }
    for (const a of anims) a(t);

    // ultimate: membesar + aura + benda mengorbit
    const ts = power ? 1.25 : 1;
    scale += (ts - scale) * Math.min(1, dt * 6);
    root.scale.setScalar(scale * (opts.baseScale || 1));
    aura.visible = power;
    if (power) {
      aura.children.forEach((r, i) => { r.rotation.z += dt * (i % 2 ? -3 : 3); r.scale.setScalar(1 + Math.sin(t * 5 + i) * 0.08); });
      if (!orbit) { orbit = makeOrbiters(el, F); root.add(orbit); }
    }
    if (orbit) {
      orbit.visible = power;
      orbit.children.forEach((m, i) => {
        const a = t * 2.6 + (i / orbit.children.length) * Math.PI * 2;
        const r = 1.35 + Math.sin(t * 2 + i) * 0.15;
        m.position.set(Math.cos(a) * r, 1.3 + Math.sin(t * 3 + i * 1.3) * 0.7, Math.sin(a) * r);
        m.rotation.x += dt * 3; m.rotation.y += dt * 4;
      });
    }
  }

  root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  aura.traverse((m) => { m.castShadow = false; });

  return {
    root, update, element: el, costume: kind || 'standar',
    play(name, dur) { act = { name, t: 0, dur: dur || ACTION_DUR[name] || 1, emote: EMOTES.some((e) => e.id === name) }; },
    attack() { this.play(style); },
    punch() { this.play(style); },
    setPower(on) { power = on; },
    jets() { return extras.filter((e) => e.type === 'jet').map((e) => e.obj); },
    tip() { const e = extras.find((x) => x.type === 'tip'); return e ? e.obj : null; },
  };
}

export function disposeAvatar(av) {
  av.root.traverse((o) => {
    if (o.isMesh) {
      if (!Object.values(G).includes(o.geometry) && o.geometry !== WING_GEO) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if (m.map && m.map !== FACE) m.map.dispose(); m.dispose(); });
    }
  });
  av.root.removeFromParent();
}
