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
function addHeadAccessory(el, head, F) {
  const M = (m) => F || m;
  switch (el.id) {
    case 'api': {
      const m = M(glowMat(0xff5a00, 2.2));
      [[0, 0.5, 0, 0.22, 0.6], [-0.2, 0.42, 0.05, 0.16, 0.45], [0.2, 0.42, 0.05, 0.16, 0.45], [0, 0.42, -0.2, 0.18, 0.5]]
        .forEach(([x, y, z, r, h]) => mesh(new THREE.ConeGeometry(r, h, 6), m, head, x, y, z));
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
      }
      break;
    }
    case 'listrik': {
      const m = M(glowMat(0xffea00, 2));
      for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.08, 0.45, 5), m, head, s * 0.24, 0.45, 0).rotation.z = -s * 0.5;
      mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 24), m, head, 0, 0.2, 0).rotation.x = Math.PI / 2;
      break;
    }
    case 'techno': {
      mesh(new THREE.BoxGeometry(0.7, 0.14, 0.12), M(glowMat(0x00e5ff, 2.5)), head, 0, 0.06, 0.29);
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35), M(new THREE.MeshStandardMaterial({ color: 0x9aa4ad, metalness: 1, roughness: 0.3 })), head, 0.22, 0.45, 0);
      mesh(new THREE.SphereGeometry(0.06, 10, 8), M(glowMat(0xff1744, 3)), head, 0.22, 0.64, 0);
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
      mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 32), M(glowMat(0xffd54f, 3)), head, 0, 0.62, 0).rotation.x = Math.PI / 2;
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

/**
 * opts.material -> paksa satu material (patung emas)
 * opts.skin     -> warna kulit
 */
export function createAvatar(el, opts = {}) {
  if (!FACE) FACE = faceTexture();
  const o = OUTFITS[el.id] || OUTFITS.api;
  const F = opts.material || null;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = opts.skin ?? SKINS[Math.floor(Math.random() * SKINS.length)];
  const skinMat = F || new THREE.MeshStandardMaterial({ color: skin, roughness: 0.55 });
  const sideMat = F || new THREE.MeshStandardMaterial({ color: o.side, roughness: o.metal ? 0.3 : 0.7, metalness: o.metal ? 0.9 : 0 });
  const pantsMat = F || new THREE.MeshStandardMaterial({ color: o.pants, roughness: 0.8 });
  const glove = F || new THREE.MeshStandardMaterial({ color: o.gloves, roughness: 0.6, emissive: o.glovesGlow ? o.gloves : 0, emissiveIntensity: o.glovesGlow ? 1.2 : 0 });
  const boot = F || new THREE.MeshStandardMaterial({ color: o.boots, roughness: 0.5, emissive: o.bootsGlow ? o.boots : 0, emissiveIntensity: o.bootsGlow ? 0.9 : 0 });
  const beltMat = F || new THREE.MeshStandardMaterial({ color: o.belt, roughness: 0.4, metalness: 0.4, emissive: o.belt, emissiveIntensity: 0.25 });

  // badan + kaos bermotif
  const torso = mesh(G.torso, sideMat, body, 0, 1.5, 0);
  if (!F) {
    const pm = { roughness: o.metal ? 0.3 : 0.7, metalness: o.metal ? 0.8 : 0 };
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: shirtTexture(el, o, true), ...pm }));
    front.position.set(0, 0, 0.252);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: shirtTexture(el, o, false), ...pm }));
    back.position.set(0, 0, -0.252); back.rotation.y = Math.PI;
    torso.add(front, back);
  }
  mesh(G.belt, beltMat, body, 0, 1.06, 0);
  mesh(new THREE.BoxGeometry(0.2, 0.15, 0.04), F || glowMat(el.glow, 1.2), body, 0, 1.06, 0.28);

  // kepala
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.32, 0);
  body.add(headPivot);
  const head = mesh(G.head, skinMat, headPivot);
  if (!F) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: FACE, transparent: true, roughness: 0.6 }));
    face.position.z = 0.312;
    head.add(face);
  }
  if (!opts.noAccessory) addHeadAccessory(el, headPivot, F);

  // tangan & kaki
  const limb = (x, y, mat) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    body.add(pivot);
    mesh(G.limb, mat, pivot, 0, -0.5, 0);
    return pivot;
  };
  const armL = limb(-0.75, 1.98, skinMat);
  const armR = limb(0.75, 1.98, skinMat);
  const legL = limb(-0.25, 1.0, pantsMat);
  const legR = limb(0.25, 1.0, pantsMat);
  for (const a of [armL, armR]) {
    mesh(G.sleeve, sideMat, a, 0, -0.2, 0);
    mesh(G.glove, glove, a, 0, -0.88, 0);
  }
  for (const l of [legL, legR]) mesh(G.boot, boot, l, 0, -0.87, 0.04);

  const extras = [];
  addBack(o, el, body, extras, F);

  // aura ultimate (cincin elemen)
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

  let phase = 0, t = 0, punch = 0, power = false, scale = 1;
  function update(dt, speed, airborne) {
    t += dt;
    const s = Math.min(speed, 1.6);
    phase += dt * (4 + 7 * s);
    let aL, aR, lL, lR;
    if (airborne) { aL = aR = -2.7; lL = 0.25; lR = -0.25; } else {
      const sw = Math.sin(phase) * 0.9 * Math.min(1, s);
      aL = sw; aR = -sw; lL = -sw; lR = sw;
    }
    if (punch > 0) { punch -= dt; aR = -1.6; }
    const k = 1 - Math.exp(-18 * dt);
    armL.rotation.x += (aL - armL.rotation.x) * k;
    armR.rotation.x += (aR - armR.rotation.x) * k;
    armL.rotation.z += ((airborne ? -0.25 : 0) - armL.rotation.z) * k;
    armR.rotation.z += ((airborne ? 0.25 : 0) - armR.rotation.z) * k;
    legL.rotation.x += (lL - legL.rotation.x) * k;
    legR.rotation.x += (lR - legR.rotation.x) * k;
    body.position.y = airborne ? 0 : Math.abs(Math.sin(phase)) * 0.07 * Math.min(1, s) + Math.sin(phase * 0.3) * 0.01;
    headPivot.rotation.y = Math.sin(phase * 0.15) * 0.08 * (1 - Math.min(1, s));

    for (const e of extras) {
      if (e.type === 'cape') {
        const target = 0.12 + s * 0.55 + (airborne ? 0.5 : 0) + Math.sin(t * 6) * 0.05 * (0.3 + s);
        e.obj.rotation.x += (target - e.obj.rotation.x) * k * 0.5;
      } else if (e.type === 'wing') {
        const flap = airborne || power ? Math.sin(t * 12) * 0.55 : Math.sin(t * 2) * 0.12;
        e.obj.rotation.y = e.side * (0.55 + flap);
        e.obj.rotation.z = e.side * -0.1;
      }
    }
    // ultimate: membesar + aura
    const ts = power ? 1.25 : 1;
    scale += (ts - scale) * Math.min(1, dt * 6);
    root.scale.setScalar(scale * (opts.baseScale || 1));
    aura.visible = power;
    if (power) {
      aura.children.forEach((r, i) => { r.rotation.z += dt * (i % 2 ? -3 : 3); r.scale.setScalar(1 + Math.sin(t * 5 + i) * 0.08); });
    }
  }

  root.traverse((m) => { if (m.isMesh && m !== aura) m.castShadow = true; });
  aura.traverse((m) => { m.castShadow = false; });

  return {
    root, update, element: el,
    punch() { punch = 0.25; },
    setPower(on) { power = on; },
    jets() { return extras.filter((e) => e.type === 'jet').map((e) => e.obj); },
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
