// Warga plaza: karakter dengan elemen & kostum acak yang berjalan-jalan, melambai, berjoget,
// duduk, dan bersorak — membuat dunia terasa hidup sambil memamerkan animasi.
// (diadaptasi dari contoh Villagers milik proyek)
import * as THREE from 'three';
import { createAvatar, COSTUMES } from './character.js';
import { ELEMENTS } from './elements.js';
import { makeLabel } from './textures.js';
import { lerpAngle } from './util.js';

const NAMES = ['Budi', 'Sari', 'Rudi', 'Mega', 'Tono', 'Lala', 'Dimas', 'Wulan', 'Agus', 'Nina'];

export class Villagers {
  constructor(scene, count = 7, hooks = {}) {
    this.scene = scene; this.list = []; this.hooks = hooks;
    for (let i = 0; i < count; i++) {
      const el = ELEMENTS[(i * 5 + 3) % ELEMENTS.length];
      const costume = COSTUMES[(i + 1) % COSTUMES.length].id;
      const av = createAvatar(el, { costume });
      const label = makeLabel([{ text: NAMES[i % NAMES.length], color: '#e9eefc', size: 40 }], { scale: 0.75 });
      label.sprite.position.y = 3.25;
      av.root.add(label.sprite);
      const a = (i / count) * Math.PI * 2 + 0.3;
      const pos = new THREE.Vector3(Math.sin(a) * 9.5, 0.03, Math.cos(a) * 9.5);
      av.root.position.copy(pos);
      scene.add(av.root);
      const v = { av, el, pos, facing: a + Math.PI, target: null, wait: 1 + Math.random() * 4, speed: 0, run: false, name: NAMES[i % NAMES.length] };
      av.anim.onStep = (side, run) => hooks.onStep && hooks.onStep(v, run);
      this.list.push(v);
    }
  }

  pickTarget(v) {
    // titik acak di cincin plaza (hindari kolam tengah & obelisk)
    const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 5;
    v.target = new THREE.Vector3(Math.sin(a) * r, 0.03, Math.cos(a) * r);
  }

  update(dt, focus) {
    for (const v of this.list) {
      const near = !focus || v.pos.distanceToSquared(focus) < 140 * 140;
      v.av.root.visible = near;
      if (v.target) {
        const d = v.target.clone().sub(v.pos); d.y = 0;
        const dist = d.length();
        if (dist < 0.4) { v.target = null; v.wait = 2 + Math.random() * 6; v.speed = 0; }
        else {
          v.facing = lerpAngle(v.facing, Math.atan2(d.x, d.z), 1 - Math.exp(-6 * dt));
          v.speed += ((v.run ? 7 : 3.2) - v.speed) * (1 - Math.exp(-4 * dt));
          v.pos.addScaledVector(d.normalize(), v.speed * dt);
          const r = Math.hypot(v.pos.x, v.pos.z);
          if (r < 6.2) v.pos.multiplyScalar(6.2 / r);
        }
      } else {
        v.speed = Math.max(0, v.speed - dt * 10);
        v.wait -= dt;
        if (v.wait <= 0) {
          const roll = Math.random();
          if (roll < 0.12) { v.av.play('wave'); v.wait = 2.5; if (near) this.hooks.onEmote?.(v, 'wave'); }
          else if (roll < 0.2) { v.av.play('dance'); v.wait = 5.5; if (near) this.hooks.onEmote?.(v, 'dance'); }
          else if (roll < 0.27) { v.av.play('sit'); v.wait = 6 + Math.random() * 6; }
          else if (roll < 0.33) { v.av.play('victory'); v.wait = 2; }
          else { v.av.anim.stop('sit'); v.run = Math.random() < 0.2; this.pickTarget(v); }
        }
      }
      v.pos.y = 0.03;
      v.av.root.position.copy(v.pos);
      v.av.root.rotation.y = v.facing;
      if (near) v.av.update(dt, { speed: v.speed, grounded: true, vy: 0 });
    }
  }
}
