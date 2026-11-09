// Sistem kekuatan: proyektil/sinar serangan elemen [Q] + Kristal Elemen yang bisa dihancurkan.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

const GEO = {
  sphere: new THREE.SphereGeometry(1, 16, 12),
  leaf: new THREE.SphereGeometry(1, 10, 6),
  laser: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  rock: new THREE.DodecahedronGeometry(1, 0),
  shard: new THREE.ConeGeometry(0.5, 1, 6),
  tornado: new THREE.ConeGeometry(1, 2.6, 18, 4, true),
  disc: new THREE.CylinderGeometry(1, 1, 0.12, 6),
};
const matCache = {};
function projMat(a) {
  const key = a.shape + a.color;
  if (matCache[key]) return matCache[key];
  let m;
  switch (a.shape) {
    case 'water': m = new THREE.MeshPhysicalMaterial({ color: a.color, emissive: a.color, emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.05, clearcoat: 1 }); break;
    case 'rock': m = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 1, flatShading: true, emissive: 0xff6d00, emissiveIntensity: 0.25 }); break;
    case 'tornado': m = new THREE.MeshBasicMaterial({ color: new THREE.Color(a.color).multiplyScalar(1.4), transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }); break;
    case 'disc': m = new THREE.MeshStandardMaterial({ color: a.color, metalness: 1, roughness: 0.2, emissive: 0x90a4ae, emissiveIntensity: 0.5 }); break;
    case 'orb': m = new THREE.MeshStandardMaterial({ color: 0x0a0014, emissive: a.color, emissiveIntensity: 2.5 }); break;
    default: m = new THREE.MeshStandardMaterial({ color: a.color, emissive: a.color, emissiveIntensity: 3, roughness: 0.3 });
  }
  return (matCache[key] = m);
}

function makeMesh(a) {
  const geo = GEO[a.shape] || GEO.sphere;
  const m = new THREE.Mesh(geo, projMat(a));
  const s = a.size;
  switch (a.shape) {
    case 'leaf': m.scale.set(s, s * 0.15, s * 0.5); break;
    case 'laser': m.scale.set(s, 1.8, s); break;
    case 'shard': m.scale.set(s, 1.3, s); break;
    case 'tornado': m.scale.set(s, s, s); m.rotation.x = Math.PI; break;
    case 'disc': m.scale.set(s, 1, s); break;
    default: m.scale.setScalar(s);
  }
  return m;
}

export class Powers {
  constructor(scene, particles, effects) {
    this.scene = scene; this.p = particles; this.fx = effects;
    this.list = [];
  }

  // owner: { local, el, name, id }
  fire(owner, origin, dir, world) {
    const a = owner.el.attack;
    if (a.kind === 'beam') return this.beam(owner, origin, dir, world);
    const n = a.multi || 1;
    for (let i = 0; i < n; i++) {
      const d = dir.clone();
      if (n > 1) d.applyAxisAngle(UP, (i - (n - 1) / 2) * 0.16);
      const mesh = makeMesh(a);
      mesh.position.copy(origin);
      if (a.shape === 'tornado') mesh.position.y = Math.max(origin.y - 1.2, 1.3);
      this.scene.add(mesh);
      const vel = d.multiplyScalar(a.speed);
      vel.y += a.up || 0;
      if (a.shape === 'tornado') vel.y = 0;
      this.list.push({ owner, a, mesh, vel, life: a.life, hitSet: new Set() });
    }
    this.p.emit(origin, 14, { ...owner.el.fx, speed: 3, spread: 0.2, life: 0.4 });
  }

  beam(owner, origin, dir, world) {
    const a = owner.el.attack;
    let end = null, hitT = null;
    const p = origin.clone();
    const step = dir.clone().normalize().multiplyScalar(0.5);
    for (let d = 0; d < a.range; d += 0.5) {
      p.add(step);
      const targets = world.targets(owner);
      for (const t of targets) if (t.pos.distanceTo(p) < t.r + 0.4) { hitT = t; break; }
      if (hitT || world.solidAt(p)) { end = p.clone(); break; }
    }
    if (!end) end = p.clone();
    if (a.style === 'bolt') {
      this.fx.bolt(origin, end, a.color); this.fx.bolt(origin, end, 0xffffff);
    } else {
      this.fx.beam(origin, end, a.color, 0.35);
    }
    if (hitT) hitT.hit(dir.clone().setY(0).normalize(), a);
    this.explode({ owner, a: { ...a, explode: 1.2 } }, end, world);
  }

  explode(pr, pos, world) {
    const el = pr.owner.el, a = pr.a;
    const big = a.explode || 1;
    this.p.emit(pos, Math.round(30 * big + 10), { ...el.fx, speed: (el.fx.speed || 2) * 1.5 + 4 * big, spread: 0.3 * big, life: (el.fx.life || 1) * 0.9, size: (el.fx.size || 0.4) * (0.8 + big * 0.3) });
    this.fx.shockwave(pos, a.color, 2 + big * 3);
    if (a.cloud) this.p.emit(pos, 40, { color: 0x76ff03, color2: 0xaa00ff, speed: 1.2, spread: 1.5, life: 3, size: 1.2, grow: 2.5, gravity: -0.2, drag: 1 });
    world.onExplode?.(pos, a, pr.owner);
  }

  update(dt, world) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const pr = this.list[i];
      const a = pr.a, m = pr.mesh;
      pr.life -= dt;
      const targets = world.targets(pr.owner);
      if (a.homing && targets.length) {
        let best = null, bd = 30;
        for (const t of targets) { const d = t.pos.distanceTo(m.position); if (d < bd) { bd = d; best = t; } }
        if (best) {
          tmp.subVectors(best.pos, m.position).normalize().multiplyScalar(a.speed);
          pr.vel.lerp(tmp, Math.min(1, dt * 3));
        }
      }
      pr.vel.y -= (a.gravity || 0) * dt;
      m.position.addScaledVector(pr.vel, dt);
      // putar / arahkan mesh
      if (a.shape === 'laser' || a.shape === 'shard') m.quaternion.setFromUnitVectors(UP, tmp2.copy(pr.vel).normalize());
      else if (a.shape === 'disc' || a.shape === 'tornado') m.rotation.y += dt * 18;
      else if (a.shape === 'leaf') { m.rotation.y += dt * 25; }
      else { m.rotation.x += dt * 6; m.rotation.z += dt * 4; }
      if (a.shape === 'tornado') this.p.emit(m.position, 2, { ...pr.owner.el.fx, swirl: 10, speed: 2, spread: 0.8, life: 0.6 });
      else if (Math.random() < 0.8) this.p.emit(m.position, 1, { ...pr.owner.el.fx, speed: 0.4, spread: 0.1, life: 0.45 });

      let dead = pr.life <= 0;
      for (const t of targets) {
        if (pr.hitSet.has(t)) continue;
        if (t.pos.distanceTo(m.position) < t.r + a.size) {
          t.hit(tmp.copy(pr.vel).setY(0).normalize().clone(), a);
          pr.hitSet.add(t);
          if (!a.pierce) { dead = true; break; }
        }
      }
      if (!dead && a.shape !== 'tornado' && world.solidAt(m.position)) dead = true;
      if (dead) {
        this.explode(pr, m.position.clone(), world);
        this.scene.remove(m);
        this.list.splice(i, 1);
      }
    }
  }
}

// ---------------------------------------------------------------------
// Kristal Elemen: muncul acak di padang rumput. Hancurkan dengan serangan [Q] atau sentuh.
// ---------------------------------------------------------------------
const CRYSTAL_GEO = new THREE.OctahedronGeometry(0.75, 0);
const BEAM_GEO = new THREE.CylinderGeometry(0.12, 0.12, 40, 8, 1, true);

export class Crystals {
  constructor(scene, particles, isFree, colors) {
    this.scene = scene; this.p = particles; this.isFree = isFree; this.colors = colors;
    this.items = [];
    this.timer = 1;
    this.max = 8;
  }

  spawn() {
    for (let k = 0; k < 30; k++) {
      const r = 26 + Math.random() * 90, a = Math.random() * Math.PI * 2;
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (!this.isFree(x, z)) continue;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const mat = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.92 });
      const c = new THREE.Mesh(CRYSTAL_GEO, mat);
      c.scale.y = 1.5; c.position.y = 1.6; c.castShadow = true;
      const beam = new THREE.Mesh(BEAM_GEO, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.5), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
      beam.position.y = 20;
      g.add(c, beam);
      this.scene.add(g);
      this.items.push({ g, c, color, pos: new THREE.Vector3(x, 1.6, z), t: Math.random() * 6 });
      return;
    }
  }

  break(cr) {
    const i = this.items.indexOf(cr);
    if (i < 0) return false;
    this.items.splice(i, 1);
    this.p.emit(cr.pos, 70, { color: cr.color, color2: 0xffffff, speed: 8, life: 1.1, gravity: 8, size: 0.4 });
    this.scene.remove(cr.g);
    cr.g.traverse((o) => { if (o.material) o.material.dispose(); });
    this.onBreak?.(cr);
    return true;
  }

  update(dt, playerPos) {
    this.timer -= dt;
    if (this.timer <= 0 && this.items.length < this.max) { this.spawn(); this.timer = 5; }
    for (const cr of [...this.items]) {
      cr.t += dt;
      cr.c.rotation.y += dt * 1.5;
      cr.c.position.y = 1.6 + Math.sin(cr.t * 2) * 0.25;
      cr.pos.y = cr.c.position.y;
      if (Math.random() < dt * 3) this.p.emit(cr.pos, 1, { color: cr.color, speed: 0.5, up: 1, life: 1.2, size: 0.3, spread: 0.5 });
      if (playerPos && playerPos.distanceTo(tmp.set(cr.pos.x, playerPos.y, cr.pos.z)) < 1.4 && Math.abs(playerPos.y - 0) < 3) this.break(cr);
    }
  }
}
