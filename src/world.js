// Lingkungan: langit realistis, matahari + bayangan, tanah rumput, pohon, batu, plaza tengah.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { grassTexture, concreteTexture } from './textures.js';
import { ELEMENTS } from './elements.js';

export const PLOT_POSITIONS = [
  new THREE.Vector3(0, 0, -58),
  new THREE.Vector3(58, 0, 0),
  new THREE.Vector3(0, 0, 58),
  new THREE.Vector3(-58, 0, 0),
];
export const WORLD_LIMIT = 190;

export function createWorld(scene, renderer, quality) {
  // ---------- Langit & cahaya ----------
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(52), THREE.MathUtils.degToRad(145));
  const makeSky = () => {
    const s = new Sky();
    s.scale.setScalar(4500);
    const u = s.material.uniforms;
    u.turbidity.value = 3.5;
    u.rayleigh.value = 1.4;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.82;
    u.sunPosition.value.copy(sunDir);
    return s;
  };
  scene.add(makeSky());

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(makeSky());
  const envRT = pmrem.fromScene(envScene, 0, 1, 5000);
  scene.environment = envRT.texture;
  pmrem.dispose();

  scene.fog = new THREE.Fog(0xa9c4dc, 140, 520);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4b6a2e, 0.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.castShadow = true;
  const sm = quality.shadowSize;
  sun.shadow.mapSize.set(sm, sm);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45; sc.right = sc.top = 45; sc.near = 1; sc.far = 260;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

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

  // ---------- Pohon & batu (instanced) ----------
  const isFree = (x, z) => {
    if (Math.hypot(x, z) < 22) return false;
    if (Math.abs(x) < 6 || Math.abs(z) < 6) { if (Math.hypot(x, z) < 90) return false; }
    for (const p of PLOT_POSITIONS) if (Math.abs(x - p.x) < 27 && Math.abs(z - p.z) < 27) return false;
    return true;
  };
  const treeCount = quality.trees;
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 4, 7);
  trunkGeo.translate(0, 2, 0);
  const leafGeo = new THREE.IcosahedronGeometry(2.3, 1);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5b3b24, roughness: 1 }), treeCount);
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), treeCount * 2);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let n = 0, tries = 0;
  while (n < treeCount && tries < treeCount * 30) {
    tries++;
    const r = 30 + Math.sqrt(Math.random()) * 220, a = Math.random() * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!isFree(x, z)) continue;
    const s = 0.8 + Math.random() * 0.8;
    dummy.position.set(x, 0, z); dummy.rotation.set(0, Math.random() * 6, 0); dummy.scale.set(s, s, s); dummy.updateMatrix();
    trunks.setMatrixAt(n, dummy.matrix);
    for (let k = 0; k < 2; k++) {
      dummy.position.set(x + (Math.random() - 0.5) * s, (4 + k * 1.6) * s, z + (Math.random() - 0.5) * s);
      const ls = s * (k ? 0.75 : 1) * (0.9 + Math.random() * 0.3);
      dummy.scale.set(ls, ls * 0.9, ls); dummy.updateMatrix();
      leaves.setMatrixAt(n * 2 + k, dummy.matrix);
      col.setHSL(0.24 + Math.random() * 0.08, 0.45 + Math.random() * 0.2, 0.22 + Math.random() * 0.12);
      leaves.setColorAt(n * 2 + k, col);
    }
    n++;
  }
  trunks.count = n; leaves.count = n * 2;
  trunks.castShadow = leaves.castShadow = true;
  trunks.receiveShadow = leaves.receiveShadow = true;
  scene.add(trunks, leaves);

  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.95, flatShading: true }), 120);
  let rn = 0;
  for (let i = 0; i < 600 && rn < 120; i++) {
    const r = 25 + Math.random() * 200, a = Math.random() * Math.PI * 2;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!isFree(x, z)) continue;
    const s = 0.3 + Math.random() * 1.3;
    dummy.position.set(x, s * 0.3, z); dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); dummy.scale.set(s, s * 0.7, s); dummy.updateMatrix();
    rocks.setMatrixAt(rn++, dummy.matrix);
  }
  rocks.count = rn;
  rocks.castShadow = rocks.receiveShadow = true;
  scene.add(rocks);

  // Pegunungan jauh
  const mtMat = new THREE.MeshStandardMaterial({ color: 0x6d7f8f, roughness: 1, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.1;
    const h = 40 + Math.random() * 70;
    const m = new THREE.Mesh(new THREE.ConeGeometry(30 + Math.random() * 40, h, 6), mtMat);
    m.position.set(Math.sin(a) * 330, h / 2 - 2, Math.cos(a) * 330);
    m.rotation.y = Math.random() * 3;
    scene.add(m);
  }

  // ---------- Update ----------
  const tmpCol = new THREE.Color();
  function update(dt, t, focus) {
    sun.position.copy(focus).addScaledVector(sunDir, 120);
    sun.target.position.copy(focus);
    crystal.rotation.y += dt * 0.6;
    crystal.position.y = 5.2 + Math.sin(t * 1.3) * 0.35;
    tmpCol.setHSL((t * 0.05) % 1, 0.8, 0.6);
    crystalMat.emissive.copy(tmpCol);
    obelisks.forEach((o, i) => { o.position.y = 3.8 + Math.sin(t * 2 + i) * 0.15; o.rotation.y += dt; });
  }

  return { update, sun, sunDir, isFree };
}
