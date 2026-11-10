// JURUS TAMBAHAN tiap elemen:
//   [Z] gerakan / pertahanan   (lari kilat, teleport, perisai, menghilang, lompatan raksasa, ...)
//   [X] jurus area             (hujan meteor, pusaran air, akar, badai petir, drone, tembok, ...)
//   [F] ledakan pembuka ultimate
// Jurus dijalankan di SEMUA pemain (lewat event multiplayer). Damage dihitung di sisi korban,
// sama seperti serangan [Q], jadi tiap pemain menghitung sendiri apakah dia terkena.
import * as THREE from 'three';

export const SKILLS = {
  api: {
    z: { name: 'Roket Api', icon: '🚀', cd: 9, type: 'dash', dist: 22, desc: 'Melesat ke depan meninggalkan jejak api' },
    x: { name: 'Hujan Meteor', icon: '☄️', cd: 16, type: 'strikes', count: 6, spread: 4.5, radius: 3, dmg: 18, delay: 0.55, interval: 0.17, vis: 'meteor', desc: '6 meteor jatuh di titik bidikan' },
  },
  air: {
    z: { name: 'Selancar Ombak', icon: '🏄', cd: 12, type: 'buff', buff: 'surf', dur: 4, speed: 2.0, desc: 'Berselancar super cepat 4 detik' },
    x: { name: 'Pusaran Air', icon: '🌀', cd: 16, type: 'zone', at: 'aim', radius: 6, dur: 3.5, tick: 0.5, dmg: 6, pull: 9, vis: 'whirlpool', desc: 'Pusaran yang menyedot & melukai musuh' },
  },
  daun: {
    z: { name: 'Perisai Daun', icon: '🌿', cd: 14, type: 'buff', buff: 'leafshield', dur: 5, dmgMult: 0.3, heal: 30, desc: 'Pulih 30 HP & damage diterima -70% selama 5 dtk' },
    x: { name: 'Akar Penjerat', icon: '🌱', cd: 15, type: 'burst', at: 'aim', radius: 4.8, dmg: 16, root: 2.2, delay: 0.35, vis: 'roots', desc: 'Akar menjerat musuh 2 detik' },
  },
  listrik: {
    z: { name: 'Teleport Kilat', icon: '⚡', cd: 7, type: 'blink', dist: 15, desc: 'Teleport 15 meter ke depan' },
    x: { name: 'Badai Petir', icon: '🌩️', cd: 15, type: 'chain', radius: 22, hits: 2, dmg: 13, interval: 0.35, desc: 'Petir menyambar semua musuh di sekitar 2x' },
  },
  techno: {
    z: { name: 'Perisai Energi', icon: '🛡️', cd: 15, type: 'buff', buff: 'hexshield', dur: 4, dmgMult: 0, desc: 'Kebal semua serangan 4 detik' },
    x: { name: 'Drone Laser', icon: '🛸', cd: 18, type: 'drone', dur: 7, range: 17, tick: 0.7, dmg: 7, desc: 'Drone menembak musuh terdekat 7 detik' },
  },
  gempa: {
    z: { name: 'Lompatan Raksasa', icon: '🦘', cd: 11, type: 'leap', vy: 15, forward: 14, slam: { radius: 6.5, dmg: 22, knock: 22 }, desc: 'Lompat tinggi lalu menghantam tanah' },
    x: { name: 'Tembok Batu', icon: '🧱', cd: 14, type: 'wall', dur: 7, len: 9, height: 4, desc: 'Tembok penahan serangan selama 7 dtk' },
  },
  es: {
    z: { name: 'Seluncur Es', icon: '⛸️', cd: 10, type: 'buff', buff: 'iceslide', dur: 3.5, speed: 1.8, desc: 'Meluncur cepat di atas es' },
    x: { name: 'Penjara Es', icon: '🧊', cd: 16, type: 'burst', at: 'aim', radius: 5.5, dmg: 12, freeze: 2.0, delay: 0.45, vis: 'iceprison', desc: 'Membekukan musuh 2 detik' },
  },
  angin: {
    z: { name: 'Lompatan Angin', icon: '🪽', cd: 8, type: 'superjump', vy: 21, desc: 'Lompat super tinggi lalu melayang' },
    x: { name: 'Tornado Raksasa', icon: '🌪️', cd: 17, type: 'zone', at: 'travel', speed: 8, radius: 4.2, dur: 4, tick: 0.4, dmg: 6, pull: 11, vis: 'bigtornado', desc: 'Tornado berjalan menyedot musuh' },
  },
  cahaya: {
    z: { name: 'Cahaya Penyembuh', icon: '💖', cd: 14, type: 'heal', heal: 55, desc: 'Pulihkan 55 HP & hapus efek beku/jerat' },
    x: { name: 'Hujan Cahaya', icon: '🌟', cd: 15, type: 'strikes', count: 5, spread: 5, radius: 2.8, dmg: 16, delay: 0.35, interval: 0.22, vis: 'lightbeam', desc: '5 sinar suci menghujam titik bidikan' },
  },
  bayangan: {
    z: { name: 'Menghilang', icon: '👻', cd: 13, type: 'buff', buff: 'invis', dur: 4, speed: 1.4, desc: 'Tak terlihat & lebih cepat 4 detik' },
    x: { name: 'Cakar Bayangan', icon: '🦇', cd: 13, type: 'line', len: 18, steps: 6, radius: 2.3, dmg: 18, interval: 0.07, desc: 'Duri bayangan muncul berbaris ke depan' },
  },
  racun: {
    z: { name: 'Kabut Pelindung', icon: '😷', cd: 14, type: 'zone', at: 'self', follow: true, radius: 4.5, dur: 5, tick: 0.5, dmg: 5, vis: 'poisoncloud', desc: 'Kabut racun di sekelilingmu 5 dtk' },
    x: { name: 'Kolam Asam', icon: '🧪', cd: 15, type: 'zone', at: 'aim', radius: 5, dur: 4, tick: 0.5, dmg: 6, slow: 1, vis: 'acid', desc: 'Kolam asam melukai & memperlambat' },
  },
  logam: {
    z: { name: 'Zirah Baja', icon: '🦾', cd: 15, type: 'buff', buff: 'armor', dur: 6, dmgMult: 0.4, noKnock: true, desc: 'Damage diterima -60% & tak bisa terpental' },
    x: { name: 'Badai Pisau', icon: '🔪', cd: 14, type: 'zone', at: 'self', follow: true, radius: 4.2, dur: 3.5, tick: 0.35, dmg: 5, vis: 'blades', desc: 'Pisau berputar melukai musuh di dekatmu' },
  },
};
export const ULT_BURST = { type: 'burst', at: 'self', radius: 9, dmg: 20, knock: 18, delay: 0.25 };
export const skillOf = (el, slot) => (slot === 'u' ? { ...ULT_BURST, name: el.ult.name } : SKILLS[el.id] && SKILLS[el.id][slot]);

const add = (c, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

export class SkillSystem {
  /**
   * hooks: {
   *   selfPos(): Vector3, selfAlive(): bool, localId(): string,
   *   damageSelf(amount, owner, dir, status), predict(r, amount, status),
   *   enemies(owner): [{ id, pos, r? }]  // calon korban dari sudut pandang owner (untuk efek visual/prediksi)
   *   anchor(ownerId): Object3D | null,  // avatar pemilik (untuk zona yang mengikuti)
   *   shake(v)
   * }
   */
  constructor(scene, particles, effects, elFx, hooks) {
    this.scene = scene; this.p = particles; this.fx = effects; this.elFx = elFx; this.h = hooks;
    this.zones = []; this.timers = []; this.walls = [];
  }

  later(t, fn) { this.timers.push({ t, fn }); }

  // owner: { local, id, name, el, ult }
  cast(owner, slot, pos, dir, aim) {
    const sk = skillOf(owner.el, slot);
    if (!sk) return;
    const el = owner.el;
    pos = pos.clone(); dir = dir.clone().setY(0).normalize(); aim = aim.clone();
    switch (sk.type) {
      case 'strikes': {
        for (let i = 0; i < sk.count; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * sk.spread;
          const at = aim.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
          const t = sk.delay + i * sk.interval;
          this.strikeVisual(sk.vis, el, at, t);
          this.later(t, () => this.impact(owner, at, sk.radius, sk.dmg, {}, sk));
        }
        break;
      }
      case 'burst': {
        const at = sk.at === 'self' ? pos : aim;
        if (sk.vis === 'roots') this.rootsVisual(at, sk.radius);
        else if (sk.vis === 'iceprison') this.iceVisual(at, sk.radius);
        else { this.elFx.skill(el, at); this.fx.shockwave(at, el.color, sk.radius * 1.6); }
        this.later(sk.delay || 0, () => this.impact(owner, at, sk.radius, sk.dmg, { root: sk.root, freeze: sk.freeze, knock: sk.knock }, sk));
        break;
      }
      case 'zone': {
        const at = sk.at === 'aim' ? aim : pos;
        const z = { owner, sk, pos: at.clone(), t: 0, next: 0, dir, objs: this.zoneVisual(sk.vis, el, at, sk.radius) };
        this.zones.push(z);
        break;
      }
      case 'chain': {
        for (let k = 0; k < sk.hits; k++) this.later(0.15 + k * sk.interval, () => {
          const src = this.anchorPos(owner, pos);
          // sambar musuh-musuh di sekitar pemilik
          for (const e of this.h.enemies(owner)) {
            if (e.pos.distanceTo(src) > sk.radius) continue;
            this.fx.bolt(src.clone().setY(src.y + 2), e.pos.clone().setY(e.pos.y + 1.3), 0xfff27a);
            this.fx.bolt(e.pos.clone().setY(e.pos.y + 30), e.pos.clone().setY(e.pos.y + 1), 0xffffff);
            if (owner.local) this.h.predict(e, sk.dmg);
          }
          if (!owner.local && this.h.selfAlive()) {
            const me = this.h.selfPos();
            if (me.distanceTo(src) < sk.radius) {
              this.fx.bolt(me.clone().setY(me.y + 30), me.clone().setY(me.y + 1), 0xffffff);
              this.h.damageSelf(sk.dmg, owner, me.clone().sub(src).setY(0).normalize(), {});
            }
          }
          this.fx.shockwave(src, 0xffea00, 6);
        });
        break;
      }
      case 'drone': {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.9, roughness: 0.3, emissive: 0x00e5ff, emissiveIntensity: 0.6 }));
        body.scale.y = 0.5; g.add(body);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 24), add(0x00e5ff, 2.5)); ring.rotation.x = Math.PI / 2; g.add(ring);
        g.position.copy(pos).setY(pos.y + 3.5);
        this.scene.add(g);
        this.zones.push({ owner, sk, pos: pos.clone(), t: 0, next: 0.5, drone: g, objs: [g] });
        break;
      }
      case 'wall': {
        const center = pos.clone().addScaledVector(dir, 4);
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 1, flatShading: true });
        for (let i = 0; i < 5; i++) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), mat);
          rock.position.set((i - 2) * 1.8, sk.height / 2, 0);
          rock.scale.set(1, sk.height / 2.2, 0.8);
          rock.castShadow = rock.receiveShadow = true;
          g.add(rock);
        }
        g.position.copy(center);
        g.rotation.y = Math.atan2(dir.x, dir.z);
        g.scale.y = 0.01;
        this.scene.add(g);
        const wall = { g, center, dir, len: sk.len, height: sk.height, until: sk.dur, t: 0 };
        this.walls.push(wall);
        this.p.emit(center.clone().setY(center.y + 0.5), 60, { ...el.fx, speed: 6, up: 4, gravity: 10, life: 1 });
        this.h.shake(0.3);
        break;
      }
      default: break; // dash/blink/buff/heal/leap/superjump: gerakan & efek diri diurus main.js; di sini hanya visual
    }
    // visual umum untuk jurus gerakan/buff (juga terlihat oleh pemain lain)
    if (['dash', 'blink', 'buff', 'heal', 'leap', 'superjump'].includes(sk.type)) {
      this.p.emit(pos.clone().setY(pos.y + 1.2), 50, { ...el.fx, speed: 5, spread: 0.5, life: 0.9 });
      if (sk.type === 'blink') this.fx.bolt(pos.clone().setY(pos.y + 1.3), aim.clone().setY(aim.y + 1.3), 0xfff27a);
      if (sk.type === 'heal') this.fx.shockwave(pos, 0xffe082, 6);
    }
  }

  // ledakan pendaratan (Lompatan Raksasa) — dipanggil saat mendarat
  slam(owner, pos) {
    const sk = skillOf(owner.el, 'z');
    if (!sk || !sk.slam) return;
    this.elFx.skill(owner.el, pos);
    this.fx.shockwave(pos, owner.el.color, sk.slam.radius * 2);
    this.h.shake(0.8);
    this.impact(owner, pos, sk.slam.radius, sk.slam.dmg, { knock: sk.slam.knock }, sk);
  }

  impact(owner, at, radius, dmg, status, sk) {
    if (owner.local) {
      for (const e of this.h.enemies(owner)) if (e.pos.distanceTo(at) < radius + 0.6) this.h.predict(e, dmg, status);
    } else if (this.h.selfAlive()) {
      const me = this.h.selfPos();
      const d = Math.hypot(me.x - at.x, me.z - at.z);
      if (d < radius + 0.6 && Math.abs(me.y - at.y) < 6) {
        const dir = new THREE.Vector3(me.x - at.x, 0, me.z - at.z);
        if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
        this.h.damageSelf(dmg, owner, dir.normalize(), status);
      }
    }
  }

  anchorPos(owner, fallback) {
    const a = this.h.anchor(owner.local ? this.h.localId() : owner.id);
    return a ? a.position.clone() : fallback.clone();
  }

  // ---------- visual ----------
  strikeVisual(vis, el, at, t) {
    if (vis === 'meteor') {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), new THREE.MeshStandardMaterial({ color: 0x3e2723, emissive: 0xff5a00, emissiveIntensity: 2.2, flatShading: true }));
      const start = at.clone().add(new THREE.Vector3(-14, 34, -8));
      m.position.copy(start);
      this.elFx.spawn(m, t, (o, k) => {
        o.position.lerpVectors(start, at, k * k);
        o.rotation.x += 0.2; o.rotation.y += 0.15;
        this.p.emit(o.position, 2, { ...el.fx, speed: 1, life: 0.5, size: 0.8 });
        if (k >= 1) { this.p.emit(at.clone().setY(at.y + 0.5), 60, { color: 0xff6a00, color2: 0xffd000, speed: 8, up: 5, gravity: 10, life: 1, size: 0.5 }); this.fx.shockwave(at, 0xff5a00, 4); this.h.shake(0.25); }
      });
    } else if (vis === 'lightbeam') {
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.8, 32), add(0xffe082, 2));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(at).setY(at.y + 0.1);
      this.elFx.spawn(ring, t, (o, k) => { o.material.opacity = 0.3 + k * 0.7; o.scale.setScalar(1.2 - k * 0.3); if (k >= 1) { this.fx.beam(at.clone().setY(at.y + 45), at.clone(), 0xfff6c0, 1.2); this.fx.shockwave(at, 0xffd54f, 4); this.p.emit(at.clone().setY(at.y + 1), 40, { ...el.fx, speed: 5, up: 3, life: 1 }); } });
    }
  }

  rootsVisual(at, radius) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = radius * (0.4 + Math.random() * 0.6);
      const v = new THREE.Mesh(new THREE.ConeGeometry(0.28, 3, 6), new THREE.MeshStandardMaterial({ color: 0x4e342e, emissive: 0x1b5e20, emissiveIntensity: 0.5, transparent: true }));
      v.position.set(at.x + Math.cos(a) * r, at.y - 1.5, at.z + Math.sin(a) * r);
      v.rotation.set((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
      this.elFx.spawn(v, 2.6, (o, k) => { o.position.y = at.y - 1.5 + Math.min(1, k * 6) * 1.8 - Math.max(0, k - 0.8) * 8; if (k > 0.8) o.material.opacity = 1 - (k - 0.8) * 5; });
    }
    this.p.emit(at.clone().setY(at.y + 0.5), 60, { color: 0x66bb6a, color2: 0x8d6e63, speed: 5, up: 3, gravity: 8, life: 1 });
  }

  iceVisual(at, radius) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, radius, 40), add(0x80deea, 1.5));
    ring.rotation.x = -Math.PI / 2; ring.position.copy(at).setY(at.y + 0.08);
    this.elFx.spawn(ring, 0.5, (o, k) => { o.material.opacity = 0.6 * k; if (k >= 1) this.elFx.skill({ id: 'es', fx: { color: 0xe0f7fa, color2: 0x80deea, speed: 1.2, life: 2, size: 0.3 } }, at); });
  }

  zoneVisual(vis, el, at, radius) {
    const objs = [];
    const mk = (o) => { this.scene.add(o); objs.push(o); return o; };
    switch (vis) {
      case 'whirlpool': {
        const d = mk(new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshPhysicalMaterial({ color: 0x0d47a1, emissive: 0x1565c0, emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.05, clearcoat: 1, depthWrite: false })));
        d.rotation.x = -Math.PI / 2; d.position.copy(at).setY(at.y + 0.12);
        for (let i = 0; i < 3; i++) { const r = mk(new THREE.Mesh(new THREE.TorusGeometry(radius * (0.35 + i * 0.25), 0.08, 6, 48), add(0x81d4fa, 2))); r.rotation.x = Math.PI / 2; r.position.copy(at).setY(at.y + 0.2); r.userData.spin = (i % 2 ? -1 : 1) * (3 - i); }
        break;
      }
      case 'bigtornado': {
        const c = mk(new THREE.Mesh(new THREE.CylinderGeometry(radius, 0.8, 12, 24, 6, true), add(0xe0f2f1, 1)));
        c.position.copy(at).setY(at.y + 6); c.userData.spin = 6; c.userData.tornado = true;
        break;
      }
      case 'poisoncloud': case 'acid': {
        const col = vis === 'acid' ? 0x76ff03 : 0x9ccc00;
        const d = mk(new THREE.Mesh(new THREE.CircleGeometry(radius, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(vis === 'acid' ? 1.2 : 0.8), transparent: true, opacity: 0.4, depthWrite: false })));
        d.rotation.x = -Math.PI / 2; d.position.copy(at).setY(at.y + 0.1); d.userData.ground = true;
        break;
      }
      case 'blades': {
        for (let i = 0; i < 6; i++) { const b = mk(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 1, roughness: 0.15, emissive: 0x90a4ae, emissiveIntensity: 0.5 }))); b.userData.blade = i; }
        break;
      }
    }
    return objs;
  }

  // ---------- update ----------
  update(dt, t) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); }
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i], sk = z.sk, el = z.owner.el;
      z.t += dt;
      if (sk.follow) z.pos.copy(this.anchorPos(z.owner, z.pos));
      if (sk.at === 'travel') z.pos.addScaledVector(z.dir, sk.speed * dt);
      // visual
      for (const o of z.objs) {
        if (o.userData.spin) o.rotation[o.userData.tornado ? 'y' : 'z'] += o.userData.spin * dt;
        if (o.userData.tornado || o.userData.ground || o.userData.spin) o.position.x = z.pos.x, o.position.z = z.pos.z;
        if (o.userData.blade !== undefined) {
          const a = t * 6 + (o.userData.blade / 6) * Math.PI * 2;
          o.position.set(z.pos.x + Math.cos(a) * sk.radius * 0.8, z.pos.y + 1.2, z.pos.z + Math.sin(a) * sk.radius * 0.8);
          o.rotation.y += dt * 20;
        }
        if (o.material && 'opacity' in o.material && z.t > sk.dur - 0.5) o.material.opacity = Math.max(0, (sk.dur - z.t) * 1.5);
      }
      if (sk.vis === 'poisoncloud' && Math.random() < 0.9) this.p.emit(z.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * sk.radius * 2, 0.8, (Math.random() - 0.5) * sk.radius * 2)), 2, { color: 0x76ff03, color2: 0xaa00ff, speed: 0.5, up: 0.6, life: 1.6, size: 1.1, grow: 2 });
      if (sk.vis === 'acid' && Math.random() < 0.7) this.p.emit(z.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * sk.radius * 1.6, 0.2, (Math.random() - 0.5) * sk.radius * 1.6)), 1, { color: 0xccff90, speed: 0.3, up: 1.5, life: 0.8, size: 0.35 });
      if (sk.vis === 'whirlpool' && Math.random() < 0.8) this.p.emit(z.pos.clone().setY(z.pos.y + 0.3), 2, { color: 0x81d4fa, color2: 0xffffff, swirl: 8, speed: 3, life: 0.8, size: 0.3 });
      if (sk.vis === 'bigtornado') this.p.emit(z.pos.clone().setY(z.pos.y + Math.random() * 8), 3, { ...el.fx, swirl: 12, speed: 3, spread: 1.5, life: 0.8 });
      if (z.drone) {
        const a = this.anchorPos(z.owner, z.pos);
        z.drone.position.lerp(a.clone().add(new THREE.Vector3(Math.cos(t * 2) * 1.5, 3.6 + Math.sin(t * 3) * 0.3, Math.sin(t * 2) * 1.5)), Math.min(1, dt * 5));
        z.drone.rotation.y += dt * 4;
        z.pos.copy(z.drone.position);
      }
      // tick damage
      if (sk.tick && z.t >= z.next) {
        z.next += sk.tick;
        if (z.drone) this.droneShot(z);
        else this.zoneTick(z);
      }
      if (z.t >= sk.dur) {
        for (const o of z.objs) { this.scene.remove(o); o.traverse((m) => { m.geometry?.dispose(); m.material?.dispose?.(); }); }
        this.zones.splice(i, 1);
      }
    }
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const w = this.walls[i];
      w.t += dt;
      w.g.scale.y = Math.min(1, w.t * 4) * (w.t > w.until - 0.4 ? Math.max(0.01, (w.until - w.t) / 0.4) : 1);
      if (w.t >= w.until) { this.scene.remove(w.g); w.g.traverse((m) => m.geometry?.dispose()); this.walls.splice(i, 1); }
    }
  }

  zoneTick(z) {
    const sk = z.sk;
    const center = z.pos.clone();
    if (z.owner.local) {
      for (const e of this.h.enemies(z.owner)) if (Math.hypot(e.pos.x - center.x, e.pos.z - center.z) < sk.radius) this.h.predict(e, sk.dmg, {});
    } else if (this.h.selfAlive()) {
      const me = this.h.selfPos();
      const dx = center.x - me.x, dz = center.z - me.z, d = Math.hypot(dx, dz);
      if (d < sk.radius && Math.abs(me.y - center.y) < 6) {
        const pull = sk.pull ? new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(sk.pull) : null;
        this.h.damageSelf(sk.dmg, z.owner, new THREE.Vector3(-dx, 0, -dz).normalize(), { pull, slow: sk.slow ? sk.tick + 0.3 : 0, small: true });
      }
    }
  }

  droneShot(z) {
    const sk = z.sk;
    const from = z.drone.position.clone();
    let best = null, bd = sk.range;
    const cands = this.h.enemies(z.owner).map((e) => ({ ...e }));
    if (!z.owner.local && this.h.selfAlive()) cands.push({ id: '__self', pos: this.h.selfPos() });
    for (const e of cands) { const d = e.pos.distanceTo(from); if (d < bd) { bd = d; best = e; } }
    if (!best) return;
    const to = best.pos.clone().setY(best.pos.y + 1.3);
    this.fx.beam(from, to, 0x00e5ff, 0.12);
    this.p.emit(to, 8, { color: 0x00e5ff, color2: 0xffffff, speed: 3, life: 0.4, size: 0.25 });
    if (best.id === '__self') this.h.damageSelf(sk.dmg, z.owner, to.clone().sub(from).setY(0).normalize(), { small: true });
    else if (z.owner.local) this.h.predict(best, sk.dmg);
  }

  // dipakai sistem proyektil: tembok batu menahan serangan
  blocks(p) {
    for (const w of this.walls) {
      if (w.g.scale.y < 0.5) continue;
      const rel = p.clone().sub(w.center);
      const along = rel.x * w.dir.z - rel.z * w.dir.x; // sejajar tembok
      const across = rel.x * w.dir.x + rel.z * w.dir.z;
      if (Math.abs(along) < w.len / 2 + 0.5 && Math.abs(across) < 1.1 && p.y < w.center.y + w.height + 0.5) return true;
    }
    return false;
  }
}
