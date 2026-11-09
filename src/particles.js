// Sistem partikel ringan berbasis THREE.Points dengan shader kustom (warna, ukuran & alpha per partikel).
import * as THREE from 'three';

const VS = /* glsl */`
attribute float size;
attribute float alpha;
attribute vec3 pcolor;
varying float vA;
varying vec3 vC;
void main() {
  vA = alpha; vC = pcolor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (480.0 / max(0.1, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;
const FS = /* glsl */`
varying float vA;
varying vec3 vC;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.4) * vA;
  gl_FragColor = vec4(vC * (1.0 + (1.0 - d * 2.0)), a);
}`;

class Pool {
  constructor(scene, max, additive) {
    this.max = max; this.count = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.base = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.swirl = new Float32Array(max);
    this.grow = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    this.aAlpha = new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos);
    geo.setAttribute('pcolor', this.aCol);
    geo.setAttribute('size', this.aSize);
    geo.setAttribute('alpha', this.aAlpha);
    geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.geo = geo;
    scene.add(this.points);
  }

  swap(i, j) {
    const f3 = (a) => { for (let k = 0; k < 3; k++) a[i * 3 + k] = a[j * 3 + k]; };
    f3(this.pos); f3(this.col); f3(this.vel);
    for (const a of [this.size, this.alpha, this.life, this.maxLife, this.base, this.grav, this.drag, this.swirl, this.grow]) a[i] = a[j];
  }

  update(dt) {
    let i = 0;
    while (i < this.count) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.count--; if (i !== this.count) this.swap(i, this.count); continue; }
      const i3 = i * 3;
      const dr = Math.exp(-this.drag[i] * dt);
      let vx = this.vel[i3] * dr, vy = this.vel[i3 + 1] * dr - this.grav[i] * dt, vz = this.vel[i3 + 2] * dr;
      if (this.swirl[i]) {
        const a = this.swirl[i] * dt, c = Math.cos(a), s = Math.sin(a);
        const nx = vx * c - vz * s; vz = vx * s + vz * c; vx = nx;
      }
      this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
      this.pos[i3] += vx * dt; this.pos[i3 + 1] += vy * dt; this.pos[i3 + 2] += vz * dt;
      const r = this.life[i] / this.maxLife[i];
      this.alpha[i] = Math.min(1, r * 1.6) * Math.min(1, (1 - r) * 8 + 0.2);
      this.size[i] = this.base[i] * (this.grow[i] + (1 - this.grow[i]) * r);
      i++;
    }
    this.geo.setDrawRange(0, this.count);
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSize.needsUpdate = this.aAlpha.needsUpdate = true;
  }
}

const cA = new THREE.Color(), cB = new THREE.Color();

export class Particles {
  constructor(scene) {
    this.add = new Pool(scene, 5000, true);
    this.norm = new Pool(scene, 1500, false);
  }

  // o: { color, color2, speed, spread, up, gravity, life, size, drag, swirl, grow, additive, dir }
  emit(origin, n, o = {}) {
    const p = o.additive === false ? this.norm : this.add;
    cA.set(o.color ?? 0xffffff); cB.set(o.color2 ?? o.color ?? 0xffffff);
    const speed = o.speed ?? 2, spread = o.spread ?? 0.3, life = o.life ?? 1, size = o.size ?? 0.4;
    for (let k = 0; k < n; k++) {
      if (p.count >= p.max) return;
      const i = p.count++, i3 = i * 3;
      p.pos[i3] = origin.x + (Math.random() - 0.5) * 2 * spread;
      p.pos[i3 + 1] = origin.y + (Math.random() - 0.5) * 2 * spread;
      p.pos[i3 + 2] = origin.z + (Math.random() - 0.5) * 2 * spread;
      // random direction on sphere
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const sp = speed * (0.4 + Math.random() * 0.6);
      p.vel[i3] = s * Math.cos(th) * sp + (o.dir ? o.dir.x : 0);
      p.vel[i3 + 1] = u * sp + (o.up ?? 0) + (o.dir ? o.dir.y : 0);
      p.vel[i3 + 2] = s * Math.sin(th) * sp + (o.dir ? o.dir.z : 0);
      const m = Math.random();
      p.col[i3] = cA.r + (cB.r - cA.r) * m;
      p.col[i3 + 1] = cA.g + (cB.g - cA.g) * m;
      p.col[i3 + 2] = cA.b + (cB.b - cA.b) * m;
      p.maxLife[i] = p.life[i] = life * (0.6 + Math.random() * 0.4);
      p.base[i] = size * (0.6 + Math.random() * 0.6);
      p.size[i] = p.base[i];
      p.alpha[i] = 0;
      p.grav[i] = o.gravity ?? 0;
      p.drag[i] = o.drag ?? 0.5;
      p.swirl[i] = o.swirl ?? 0;
      p.grow[i] = o.grow ?? 0.3;
    }
  }

  update(dt) { this.add.update(dt); this.norm.update(dt); }
}

// Efek kilat petir, gelombang kejut, dll.
export class Effects {
  constructor(scene) { this.scene = scene; this.items = []; }

  bolt(from, to, color = 0xbfe9ff) {
    const pts = [];
    const seg = 10;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const p = new THREE.Vector3().lerpVectors(from, to, t);
      if (i > 0 && i < seg) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9));
      pts.push(p);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.items.push({ obj: line, t: 0, dur: 0.35, kind: 'fade' });
  }

  shockwave(pos, color, radius = 14) {
    const geo = new THREE.RingGeometry(0.8, 1.2, 64);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.copy(pos).setY(pos.y + 0.15);
    this.scene.add(m);
    this.items.push({ obj: m, t: 0, dur: 0.9, kind: 'ring', radius });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const r = it.t / it.dur;
      it.obj.material.opacity = Math.max(0, 1 - r);
      if (it.kind === 'ring') it.obj.scale.setScalar(1 + r * it.radius);
      if (r >= 1) {
        this.scene.remove(it.obj);
        it.obj.geometry.dispose(); it.obj.material.dispose();
        this.items.splice(i, 1);
      }
    }
  }
}
