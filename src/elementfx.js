// Efek visual khas tiap elemen untuk skill [E], ultimate, dan emote.
import * as THREE from 'three';
import { createAvatar } from './character.js';

const add = (c, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

export class ElementFX {
  constructor(scene, particles, effects) {
    this.scene = scene; this.p = particles; this.fx = effects;
    this.items = [];
  }

  spawn(obj, dur, fn) {
    this.scene.add(obj);
    this.items.push({ obj, dur, fn, t: 0 });
    return obj;
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const k = Math.min(1, it.t / it.dur);
      it.fn?.(it.obj, k, dt, it);
      if (k >= 1) {
        this.scene.remove(it.obj);
        it.obj.traverse((o) => {
          if (o.geometry && !o.userData.shared) o.geometry.dispose();
          if (o.material && !o.userData.shared) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        });
        this.items.splice(i, 1);
      }
    }
  }

  // ---------- skill [E] ----------
  skill(el, pos) {
    const P = pos.clone();
    const fx = el.fx;
    const fade = (o, k, from = 0.7) => o.traverse((m) => { if (m.material) m.material.opacity = k < from ? 1 : 1 - (k - from) / (1 - from); });
    switch (el.id) {
      case 'api': { // pilar api
        const g = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 16, 24, 1, true), add(0xff5a00, 2));
        g.position.copy(P).setY(P.y + 8);
        this.spawn(g, 1.6, (o, k) => {
          o.scale.set(1 + k * 0.5, Math.min(1, k * 4), 1 + k * 0.5); o.rotation.y += 0.2;
          o.material.opacity = 1 - k;
          if (Math.random() < 0.9) this.p.emit(new THREE.Vector3(P.x, P.y + Math.random() * 10, P.z), 4, { ...fx, swirl: 6, speed: 2, spread: 1, life: 1 });
        });
        break;
      }
      case 'air': { // gelombang air
        for (let i = 0; i < 3; i++) {
          const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 8, 48), add(0x29b6f6, 2));
          r.rotation.x = Math.PI / 2; r.position.copy(P).setY(P.y + 0.4);
          this.spawn(r, 1.4 + i * 0.25, (o, k) => { o.scale.setScalar(1 + k * (14 - i * 3)); o.position.y = P.y + 0.4 + Math.sin(k * Math.PI) * 1.2; o.material.opacity = 1 - k; });
        }
        this.p.emit(P.clone().setY(P.y + 1), 120, { color: 0x4fc3f7, color2: 0xffffff, speed: 6, up: 7, gravity: 14, life: 1.4, size: 0.35 });
        break;
      }
      case 'daun': { // akar & daun tumbuh
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const v = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.5, 7), new THREE.MeshStandardMaterial({ color: 0x2e7d32, emissive: 0x1b5e20, emissiveIntensity: 0.5, transparent: true }));
          v.position.set(P.x + Math.cos(a) * 3, P.y - 1.8, P.z + Math.sin(a) * 3);
          v.rotation.z = Math.cos(a) * 0.3; v.rotation.x = -Math.sin(a) * 0.3;
          this.spawn(v, 2.2, (o, k) => { o.position.y = P.y - 1.8 + Math.min(1, k * 3) * 2.2 - Math.max(0, k - 0.75) * 10; fade(o, k, 0.75); });
        }
        this.p.emit(P.clone().setY(P.y + 1.5), 160, { ...fx, swirl: 5, speed: 6, spread: 1.5, life: 2.2, size: 0.45 });
        break;
      }
      case 'listrik': { // badai petir
        let n = 0;
        const g = new THREE.Object3D();
        this.spawn(g, 1.3, (o, k) => {
          while (n < k * 10) {
            n++;
            const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
            const hit = new THREE.Vector3(P.x + Math.cos(a) * r, P.y + 0.1, P.z + Math.sin(a) * r);
            this.fx.bolt(hit.clone().setY(P.y + 35), hit, 0xfff59d);
            this.fx.shockwave(hit, 0xffea00, 3);
            this.p.emit(hit.clone().setY(hit.y + 0.5), 20, { ...fx, speed: 8 });
          }
        });
        break;
      }
      case 'techno': { // kubah hologram
        const d = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x00e5ff).multiplyScalar(2), wireframe: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        d.position.copy(P).setY(P.y + 1.3);
        this.spawn(d, 1.6, (o, k) => { o.scale.setScalar(0.5 + Math.min(1, k * 2.5) * 4.5); o.rotation.y += 0.04; o.material.opacity = 1 - k * k; });
        const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 5, 6), add(0x00e5ff, 2));
        ring.rotation.x = -Math.PI / 2; ring.position.copy(P).setY(P.y + 0.1);
        this.spawn(ring, 1.6, (o, k) => { o.rotation.z += 0.05; o.material.opacity = 1 - k; });
        break;
      }
      case 'gempa': { // batu-batu meletus dari tanah
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 5;
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.6, 0), new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true, emissive: 0xff6d00, emissiveIntensity: 0.3, transparent: true }));
          rock.position.set(P.x + Math.cos(a) * r, P.y - 0.5, P.z + Math.sin(a) * r);
          const vy = 8 + Math.random() * 6;
          this.spawn(rock, 1.8, (o, k, dt, it) => {
            it.vy = (it.vy ?? vy) - 22 * dt;
            o.position.y = Math.max(P.y - 1, o.position.y + it.vy * dt);
            o.rotation.x += dt * 4; fade(o, k, 0.7);
          });
        }
        const crack = new THREE.Mesh(new THREE.RingGeometry(0.5, 6, 32), new THREE.MeshBasicMaterial({ color: 0x3e2723, transparent: true, opacity: 0.7, depthWrite: false }));
        crack.rotation.x = -Math.PI / 2; crack.position.copy(P).setY(P.y + 0.05);
        this.spawn(crack, 2, (o, k) => { o.material.opacity = 0.7 * (1 - k); });
        break;
      }
      case 'es': { // duri es muncul melingkar
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 6), new THREE.MeshPhysicalMaterial({ color: 0xb3f0ff, emissive: 0x4fc3f7, emissiveIntensity: 0.8, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9 }));
          sp.position.set(P.x + Math.cos(a) * 3.2, P.y + 1.3, P.z + Math.sin(a) * 3.2);
          sp.rotation.z = -Math.cos(a) * 0.35; sp.rotation.x = Math.sin(a) * 0.35;
          this.spawn(sp, 2.2, (o, k) => { o.scale.set(1, Math.min(1, k * 6) * (1 - Math.max(0, k - 0.8) * 5), 1); });
        }
        this.p.emit(P.clone().setY(P.y + 1), 120, { ...fx, speed: 5, swirl: 2, life: 2, size: 0.35 });
        break;
      }
      case 'angin': { // tornado mengelilingi pemain
        const tor = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 0.6, 8, 24, 6, true), add(0xe0f2f1, 1.2));
        tor.position.copy(P).setY(P.y + 4);
        this.spawn(tor, 2, (o, k) => { o.rotation.y += 0.35; o.material.opacity = 0.5 * (1 - k); o.scale.set(1 + k * 0.5, 1, 1 + k * 0.5); });
        this.p.emit(P.clone().setY(P.y + 2), 160, { ...fx, swirl: 12, speed: 5, spread: 2, life: 1.8, up: 3 });
        break;
      }
      case 'cahaya': { // tiang cahaya dari langit + halo
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 70, 24, 1, true), add(0xfff6c0, 2.5));
        beam.position.copy(P).setY(P.y + 35);
        this.spawn(beam, 1.5, (o, k) => { const w = Math.sin(k * Math.PI); o.scale.set(w, 1, w); o.material.opacity = w; });
        const halo = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 8, 48), add(0xffd54f, 3));
        halo.rotation.x = Math.PI / 2; halo.position.copy(P).setY(P.y + 4);
        this.spawn(halo, 1.8, (o, k) => { o.scale.setScalar(1 + k * 4); o.material.opacity = 1 - k; });
        this.p.emit(P.clone().setY(P.y + 2), 140, { ...fx, speed: 4, up: 3, life: 2 });
        break;
      }
      case 'bayangan': { // klon bayangan
        const mat = new THREE.MeshBasicMaterial({ color: 0x2a0a4a, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const av = createAvatar(el, { material: mat, noAccessory: true });
          av.root.traverse((m) => { m.userData.shared = true; }); // geometri dipakai bersama avatar lain: jangan di-dispose
          av.root.position.set(P.x + Math.cos(a) * 2.5, P.y, P.z + Math.sin(a) * 2.5);
          av.root.rotation.y = -a + Math.PI / 2;
          av.play('slash');
          this.spawn(av.root, 1.6, (o, k, dt) => { av.update(dt, 0, false); o.position.y = P.y - Math.max(0, k - 0.6) * 5; });
        }
        this.spawn(new THREE.Object3D(), 1.7, (o, k) => { mat.opacity = 0.6 * (1 - k); if (k >= 0.99) mat.dispose(); });
        this.p.emit(P.clone().setY(P.y + 1), 140, { ...fx, speed: 3, spread: 2.5, life: 1.8 });
        break;
      }
      case 'racun': { // kubah gelembung racun
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshPhysicalMaterial({ color: 0x76ff03, emissive: 0x33691e, emissiveIntensity: 0.6, transparent: true, opacity: 0.35, roughness: 0.1, clearcoat: 1, depthWrite: false }));
        dome.position.copy(P);
        this.spawn(dome, 2, (o, k) => { o.scale.setScalar(0.5 + Math.min(1, k * 2) * 5); o.material.opacity = 0.35 * (1 - k); });
        this.spawn(new THREE.Object3D(), 2, () => { if (Math.random() < 0.7) this.p.emit(new THREE.Vector3(P.x + (Math.random() - 0.5) * 8, P.y + 0.3, P.z + (Math.random() - 0.5) * 8), 2, { ...fx, up: 3, speed: 0.5, life: 1.5, size: 0.5 }); });
        break;
      }
      default: { // logam: pisau berputar keluar
        for (let i = 0; i < 6; i++) {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 1, roughness: 0.15, emissive: 0x90a4ae, emissiveIntensity: 0.4, transparent: true }));
          const a0 = (i / 6) * Math.PI * 2;
          this.spawn(b, 1.6, (o, k) => {
            const a = a0 + k * 8, r = 1 + k * 7;
            o.position.set(P.x + Math.cos(a) * r, P.y + 1.2, P.z + Math.sin(a) * r);
            o.rotation.y += 0.5; fade(o, k, 0.7);
          });
        }
      }
    }
  }

  // ---------- emote ----------
  emote(el, pos, id) {
    const at = pos.clone().setY(pos.y + 2.6);
    switch (id) {
      case 'dance': this.p.emit(at, 60, { color: el.color, color2: el.glow, speed: 6, up: 4, gravity: 7, life: 2, size: 0.3 }); break;
      case 'victory': this.p.emit(at, 90, { color: 0xffd54f, color2: el.glow, speed: 8, up: 6, gravity: 8, life: 2, size: 0.35 }); this.fx.shockwave(pos, 0xffd54f, 6); break;
      case 'flex': this.p.emit(at.setY(pos.y + 1.6), 50, { ...el.fx, speed: 4, spread: 0.8 }); break;
      default: this.p.emit(at, 25, { ...el.fx, speed: 2, life: 1.2 });
    }
  }
}
