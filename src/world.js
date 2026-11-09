// Lingkungan: langit realistis, matahari + bayangan, tanah rumput, pohon, batu, plaza tengah.
import * as THREE from 'three';
import { grassTexture, concreteTexture } from './textures.js';
import { ELEMENTS } from './elements.js';
import { createNature } from './nature.js';
import { createDayNight } from './daynight.js';
import { createAmbient, LAKE } from './ambient.js';

export const PLOT_POSITIONS = [
  new THREE.Vector3(0, 0, -58),
  new THREE.Vector3(58, 0, 0),
  new THREE.Vector3(0, 0, 58),
  new THREE.Vector3(-58, 0, 0),
];
export const WORLD_LIMIT = 190;

export function createWorld(scene, renderer, quality) {
  // ---------- Langit, matahari/bulan & siklus siang-malam ----------
  const dn = createDayNight(scene, renderer, quality);
  const { sun, sunDir } = dn;

  // ---------- Tanah ----------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ map: grassTexture(110), roughness: 1, metalness: 0, color: 0xdfe8d6 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const concreteMat = new THREE.MeshStandardMaterial({ map: concreteTexture(1), roughness: 0.92, color: 0xcfcfcf });

  // Jalan dari plaza ke tiap plot
  for (const p of PLOT_POSITIONS) {
    const len = p.length() - 20;
    const tex = concreteTexture(1);
    tex.repeat.set(1, len / 6);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(6, len), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, color: 0x8f8f8f }));
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = Math.atan2(p.x, p.z);
    road.position.copy(p).multiplyScalar(len / 2 / p.length()).setY(0.02);
    road.receiveShadow = true;
    scene.add(road);
  }

  // ---------- Plaza tengah ----------
  const plazaTex = concreteTexture(6, 214);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(17, 64), new THREE.MeshStandardMaterial({ map: plazaTex, roughness: 0.85, color: 0xb0aca4 }));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.03;
  plaza.receiveShadow = true;
  scene.add(plaza);

  const stone = new THREE.MeshStandardMaterial({ color: 0xd9d4ca, roughness: 0.7 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 0.9, 48, 1, true), stone);
  basin.position.y = 0.45;
  const basinTop = new THREE.Mesh(new THREE.TorusGeometry(5.05, 0.25, 10, 64), stone);
  basinTop.rotation.x = Math.PI / 2; basinTop.position.y = 0.9;
  const water = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshPhysicalMaterial({ color: 0x1f6fa8, roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.88 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.72;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 3, 16), stone);
  pillar.position.y = 1.5;
  for (const m of [basin, basinTop, pillar]) { m.castShadow = m.receiveShadow = true; }
  scene.add(basin, basinTop, water, pillar);

  const crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.92 });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), crystalMat);
  crystal.position.y = 5.2;
  crystal.castShadow = true;
  scene.add(crystal);

  // Obelisk tiap elemen mengelilingi plaza (3 per kuadran, hindari jalan)
  const obelisks = [];
  const angles = [];
  for (let q = 0; q < 4; q++) for (const a of [22, 45, 68]) angles.push(THREE.MathUtils.degToRad(q * 90 + a));
  const obGeo = new THREE.BoxGeometry(0.9, 3.2, 0.9);
  const orbGeo = new THREE.IcosahedronGeometry(0.45, 2);
  ELEMENTS.forEach((el, i) => {
    const a = angles[i % angles.length];
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * 13.5, 0, Math.cos(a) * 13.5);
    const ob = new THREE.Mesh(obGeo, stone);
    ob.position.y = 1.6; ob.castShadow = ob.receiveShadow = true;
    const orb = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({ color: el.color, emissive: el.color, emissiveIntensity: 1.6, roughness: 0.2 }));
    orb.position.y = 3.8;
    g.add(ob, orb);
    scene.add(g);
    obelisks.push(orb);
  });

  // ---------- Alam: pohon realistis, semak, batu, pegunungan ----------
  const isFree = (x, z) => {
    if (Math.hypot(x, z) < 22) return false;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 7) return false;
    if (Math.abs(x) < 6 || Math.abs(z) < 6) { if (Math.hypot(x, z) < 90) return false; }
    for (const p of PLOT_POSITIONS) if (Math.abs(x - p.x) < 27 && Math.abs(z - p.z) < 27) return false;
    return true;
  };
  const nature = createNature(scene, quality, isFree);
  const ambient = createAmbient(scene, quality, isFree);

  // ---------- Update ----------
  const tmpCol = new THREE.Color();
  function update(dt, t, focus, camPos = focus) {
    nature.update(dt, t);
    dn.update(dt, t, focus, camPos);
    ambient.update(dt, t, dn.state, camPos);
    const night = dn.state.night;
    crystalMat.emissiveIntensity = 1.2 + night * 1.5;
    for (const o of obelisks) o.material.emissiveIntensity = 1.6 + night * 2.2;
    crystal.rotation.y += dt * 0.6;
    crystal.position.y = 5.2 + Math.sin(t * 1.3) * 0.35;
    tmpCol.setHSL((t * 0.05) % 1, 0.8, 0.6);
    crystalMat.emissive.copy(tmpCol);
    obelisks.forEach((o, i) => { o.position.y = 3.8 + Math.sin(t * 2 + i) * 0.15; o.rotation.y += dt; });
  }

  return { update, sun, sunDir, isFree, time: dn.state, setHour: dn.setHour, clearHour: dn.clearHour };
}
