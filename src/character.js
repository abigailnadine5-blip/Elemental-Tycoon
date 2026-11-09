// Avatar blocky ala Roblox (kepala kotak, badan, 2 tangan, 2 kaki) + aksesori sesuai elemen.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { faceTexture, emblemTexture } from './textures.js';
import { hex } from './elements.js';

const SKINS = [0xf2cd37, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const G = {
  head: new RoundedBoxGeometry(0.66, 0.62, 0.62, 3, 0.1),
  torso: new RoundedBoxGeometry(1.0, 1.0, 0.5, 2, 0.06),
  limb: new RoundedBoxGeometry(0.48, 1.0, 0.48, 2, 0.06),
};
let FACE = null;

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

function addAccessory(el, head) {
  const c = el.color, gl = el.glow;
  switch (el.id) {
    case 'api': { // rambut api
      const m = glowMat(0xff5a00, 2.2);
      [[0, 0.5, 0, 0.22, 0.6], [-0.2, 0.42, 0.05, 0.16, 0.45], [0.2, 0.42, 0.05, 0.16, 0.45], [0, 0.42, -0.2, 0.18, 0.5]]
        .forEach(([x, y, z, r, h]) => mesh(new THREE.ConeGeometry(r, h, 6), m, head, x, y, z));
      break;
    }
    case 'air': { // topi gelombang
      const m = new THREE.MeshPhysicalMaterial({ color: 0x2196f3, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 });
      const cap = mesh(new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, head, 0, 0.26, 0);
      cap.scale.set(1, 0.7, 1);
      mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), m, head, 0, 0.28, 0.4);
      break;
    }
    case 'daun': { // mahkota daun
      const m = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.7, side: THREE.DoubleSide });
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const leaf = mesh(new THREE.SphereGeometry(0.16, 8, 6), m, head, Math.sin(a) * 0.3, 0.36, Math.cos(a) * 0.3);
        leaf.scale.set(0.5, 1.4, 0.2);
        leaf.rotation.y = a;
        leaf.rotation.x = -0.4;
      }
      break;
    }
    case 'listrik': { // tanduk petir
      const m = glowMat(0xffea00, 2);
      for (const s of [-1, 1]) {
        const h = mesh(new THREE.ConeGeometry(0.08, 0.45, 5), m, head, s * 0.24, 0.45, 0);
        h.rotation.z = -s * 0.5;
      }
      mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 24), m, head, 0, 0.2, 0).rotation.x = Math.PI / 2;
      break;
    }
    case 'techno': { // visor + antena
      const m = glowMat(0x00e5ff, 2.5);
      mesh(new THREE.BoxGeometry(0.7, 0.14, 0.12), m, head, 0, 0.06, 0.29);
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35), new THREE.MeshStandardMaterial({ color: 0x9aa4ad, metalness: 1, roughness: 0.3 }), head, 0.22, 0.45, 0);
      mesh(new THREE.SphereGeometry(0.06, 10, 8), glowMat(0xff1744, 3), head, 0.22, 0.64, 0);
      break;
    }
    case 'gempa': { // helm batu
      const m = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 1, flatShading: true });
      const h = mesh(new THREE.DodecahedronGeometry(0.42, 0), m, head, 0, 0.3, -0.02);
      h.scale.set(1, 0.55, 1);
      mesh(new THREE.DodecahedronGeometry(0.1, 0), glowMat(0xff9100, 1.8), head, 0, 0.45, 0.25);
      break;
    }
    case 'es': { // mahkota es
      const m = new THREE.MeshPhysicalMaterial({ color: 0xb3f0ff, roughness: 0.05, clearcoat: 1, emissive: 0x4fc3f7, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        mesh(new THREE.ConeGeometry(0.07, i % 2 ? 0.25 : 0.4, 4), m, head, Math.sin(a) * 0.26, 0.42, Math.cos(a) * 0.26);
      }
      break;
    }
    case 'angin': { // syal angin
      const m = new THREE.MeshStandardMaterial({ color: 0x80cbc4, roughness: 0.8 });
      mesh(new THREE.TorusGeometry(0.33, 0.08, 8, 24), m, head, 0, -0.32, 0).rotation.x = Math.PI / 2;
      const tail = mesh(new THREE.BoxGeometry(0.16, 0.5, 0.05), m, head, 0.2, -0.55, -0.32);
      tail.rotation.x = 0.4;
      break;
    }
    case 'cahaya': { // halo
      mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 32), glowMat(0xffd54f, 3), head, 0, 0.62, 0).rotation.x = Math.PI / 2;
      break;
    }
    case 'bayangan': { // tudung + tanduk
      const m = new THREE.MeshStandardMaterial({ color: 0x1a1030, roughness: 0.9 });
      mesh(new THREE.BoxGeometry(0.74, 0.2, 0.7), m, head, 0, 0.32, -0.02);
      mesh(new THREE.BoxGeometry(0.74, 0.6, 0.12), m, head, 0, 0.02, -0.33);
      for (const s of [-1, 1]) {
        const h = mesh(new THREE.ConeGeometry(0.07, 0.4, 6), glowMat(0xb388ff, 2), head, s * 0.26, 0.55, 0);
        h.rotation.z = -s * 0.35;
      }
      break;
    }
    case 'racun': { // masker gas
      const m = new THREE.MeshStandardMaterial({ color: 0x2a1a3a, roughness: 0.6 });
      mesh(new THREE.BoxGeometry(0.4, 0.22, 0.12), m, head, 0, -0.16, 0.32);
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), glowMat(0x76ff03, 2), head, s * 0.16, -0.18, 0.4).rotation.x = Math.PI / 2;
      break;
    }
    case 'logam': { // helm ksatria
      const m = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 1, roughness: 0.25 });
      const h = mesh(new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, head, 0, 0.22, 0);
      h.scale.set(1, 0.8, 1);
      mesh(new THREE.BoxGeometry(0.06, 0.25, 0.5), m, head, 0, 0.5, 0);
      break;
    }
    default:
      mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 32), glowMat(gl, 2), head, 0, 0.6, 0).rotation.x = Math.PI / 2;
  }
  return c;
}

/**
 * opts.material -> paksa satu material (misal untuk patung emas)
 * opts.skin     -> warna kulit
 */
export function createAvatar(el, opts = {}) {
  if (!FACE) FACE = faceTexture();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = opts.skin ?? SKINS[Math.floor(Math.random() * SKINS.length)];
  const forced = opts.material;
  const skinMat = forced || new THREE.MeshStandardMaterial({ color: skin, roughness: 0.55 });
  const shirtMat = forced || new THREE.MeshStandardMaterial({ color: el.color, roughness: 0.65 });
  const pantsMat = forced || new THREE.MeshStandardMaterial({ color: el.dark, roughness: 0.8 });

  const torso = mesh(G.torso, shirtMat, body, 0, 1.5, 0);
  if (!forced) {
    const emb = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: emblemTexture(el.icon, hex(el.dark)), transparent: true, roughness: 0.5 }));
    emb.position.set(0, 0.08, 0.256);
    torso.add(emb);
  }

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.32, 0);
  body.add(headPivot);
  const head = mesh(G.head, skinMat, headPivot);
  if (!forced) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: FACE, transparent: true, roughness: 0.6 }));
    face.position.z = 0.312;
    head.add(face);
  }
  if (!opts.noAccessory) addAccessory(el, headPivot);

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
  // lengan baju
  if (!forced) {
    for (const a of [armL, armR]) mesh(new RoundedBoxGeometry(0.5, 0.42, 0.5, 2, 0.06), shirtMat, a, 0, -0.2, 0);
  }

  let phase = 0;
  function update(dt, speed, airborne) {
    const s = Math.min(speed, 1.6);
    phase += dt * (4 + 7 * s);
    let aL, aR, lL, lR;
    if (airborne) {
      aL = aR = -2.7; lL = 0.25; lR = -0.25;
    } else {
      const sw = Math.sin(phase) * 0.9 * Math.min(1, s);
      aL = sw; aR = -sw; lL = -sw; lR = sw;
    }
    const k = 1 - Math.exp(-18 * dt);
    armL.rotation.x += (aL - armL.rotation.x) * k;
    armR.rotation.x += (aR - armR.rotation.x) * k;
    armL.rotation.z += ((airborne ? -0.25 : 0) - armL.rotation.z) * k;
    armR.rotation.z += ((airborne ? 0.25 : 0) - armR.rotation.z) * k;
    legL.rotation.x += (lL - legL.rotation.x) * k;
    legR.rotation.x += (lR - legR.rotation.x) * k;
    body.position.y = airborne ? 0 : Math.abs(Math.sin(phase)) * 0.07 * Math.min(1, s) + Math.sin(phase * 0.3) * 0.01;
    headPivot.rotation.y = Math.sin(phase * 0.15) * 0.08 * (1 - Math.min(1, s));
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, update, element: el };
}

export function disposeAvatar(av) {
  av.root.traverse((o) => {
    if (o.isMesh) {
      if (!Object.values(G).includes(o.geometry)) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if (m.map && m.map !== FACE) m.map.dispose(); m.dispose(); });
    }
  });
  av.root.removeFromParent();
}
