// Siklus PAGI – SIANG – SENJA – MALAM
//  - matahari bergerak & mengubah warna langit, cahaya, kabut, refleksi
//  - malam: bintang berkelip, bulan, cahaya bulan kebiruan
//  - waktu dihitung dari jam dunia nyata, jadi SAMA untuk semua pemain multiplayer
//  - siang 8 menit, malam 4 menit (1 hari = 12 menit). Paksa waktu: ?waktu=pagi|siang|senja|malam
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const DAY_REAL = 8 * 60, NIGHT_REAL = 4 * 60, CYCLE = DAY_REAL + NIGHT_REAL;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function realHour() {
  const f = (Date.now() / 1000) % CYCLE;
  if (f < DAY_REAL) return 6 + 12 * (f / DAY_REAL);
  return (18 + 12 * ((f - DAY_REAL) / NIGHT_REAL)) % 24;
}

export function hourLabel(h) {
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  const name = h >= 4.5 && h < 10 ? '🌅 Pagi' : h >= 10 && h < 15.5 ? '☀️ Siang' : h >= 15.5 && h < 18.8 ? '🌇 Senja' : '🌙 Malam';
  return `${name} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function setSky(u, sunDir, golden, night) {
  u.turbidity.value = 2.4 + golden * 6.5;
  u.rayleigh.value = 1.5 + golden * 1.4 + night * 1.0;
  u.mieCoefficient.value = 0.004 + golden * 0.005;
  u.mieDirectionalG.value = 0.82;
  u.sunPosition.value.copy(sunDir);
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createDayNight(scene, renderer, quality) {
  const params = new URLSearchParams(location.search);
  const FIXED = { pagi: 7.0, siang: 12.5, senja: 17.6, malam: 23.0 }[params.get('waktu')];
  let override = FIXED ?? null;

  const sky = new Sky();
  sky.scale.setScalar(4500);
  scene.add(sky);
  const su = sky.material.uniforms;
  const sunDir = new THREE.Vector3();
  const moonDir = new THREE.Vector3();

  // refleksi lingkungan untuk 3 suasana (dibuat sekali di awal)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const bake = (elev, golden, night, bg) => {
    const sc = new THREE.Scene();
    if (bg) sc.background = new THREE.Color(bg);
    else {
      const s = new Sky(); s.scale.setScalar(4500);
      setSky(s.material.uniforms, new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), 2.5), golden, night);
      sc.add(s);
    }
    return pmrem.fromScene(sc, 0, 1, 5000).texture;
  };
  const ENV = { day: bake(50, 0, 0), gold: bake(4, 1, 0), night: bake(0, 0, 1, 0x0c1426) };
  pmrem.dispose();
  scene.environment = ENV.day;

  scene.fog = new THREE.Fog(0xa9c4dc, 180, 900);
  const FOG = { day: new THREE.Color(0xa9c4dc), gold: new THREE.Color(0xe6a47a), night: new THREE.Color(0x0b1424) };

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4b6a2e, 0.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45; sc.right = sc.top = 45; sc.near = 1; sc.far = 300;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // ---------- bintang ----------
  const N = 2200;
  const sp = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = Math.random(), v = Math.random() * 0.95 + 0.05;
    const th = u * Math.PI * 2, ph = Math.acos(v);
    sp[i * 3] = Math.sin(ph) * Math.cos(th) * 1800; sp[i * 3 + 1] = Math.cos(ph) * 1800; sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 1800;
    seed[i] = Math.random();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `attribute float seed; uniform float uTime; varying float vA; varying float vS;
      void main(){ vS = seed; vA = 0.55 + 0.45 * sin(uTime * (1.5 + seed * 3.0) + seed * 40.0);
      vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 1.5 + seed * seed * 3.5; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uOp; varying float vA; varying float vS;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
      vec3 c = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.92, 0.8), vS);
      gl_FragColor = vec4(c * 1.6, (1.0 - d * 2.0) * vA * uOp); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false; stars.renderOrder = -1;
  scene.add(stars);

  // ---------- bulan ----------
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: canvasTex(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.42, '#f1ecd6'); gr.addColorStop(0.47, 'rgba(210,225,255,0.35)'); gr.addColorStop(1, 'rgba(200,220,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      g.fillStyle = 'rgba(150,150,140,0.25)';
      for (const [x, y, r] of [[54, 52, 7], [72, 70, 5], [60, 76, 4], [76, 50, 3]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    }),
    fog: false, depthWrite: false, transparent: true,
  }));
  moon.scale.setScalar(200);
  scene.add(moon);

  const state = { hour: 12, night: 0, golden: 0, day: 1, elev: 50 };
  const cA = new THREE.Color(), cB = new THREE.Color();
  let envKey = 'day';

  function update(dt, t, focus, camPos) {
    const hour = override ?? realHour();
    state.hour = hour;
    // matahari: terbit jam 6, puncak jam 12, terbenam jam 18
    const elev = 62 * Math.sin(((hour - 6) / 12) * Math.PI);
    const az = (hour / 24) * Math.PI * 2 + 0.6;
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), az);
    moonDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - Math.max(18, -elev * 0.9)), az + Math.PI);
    const night = 1 - sstep(-8, 3, elev);
    const golden = Math.max(0, 1 - Math.abs(elev - 5) / 15) * (1 - night * 0.6);
    const day = sstep(-3, 14, elev);
    Object.assign(state, { night, golden, day, elev });

    setSky(su, sunDir, golden, night);
    starMat.uniforms.uOp.value = night;
    starMat.uniforms.uTime.value = t;
    stars.position.copy(camPos);
    moon.position.copy(camPos).addScaledVector(moonDir, 1700);
    moon.material.opacity = night;

    // cahaya utama: matahari saat siang, bulan saat malam
    if (elev > -3) {
      sun.position.copy(focus).addScaledVector(sunDir, 150);
      sun.color.copy(cA.set(0xff8f4a).lerp(cB.set(0xfff1dc), sstep(3, 30, elev)));
      sun.intensity = 2.5 * day + 0.25 * night;
    } else {
      sun.position.copy(focus).addScaledVector(moonDir, 150);
      sun.color.set(0x9fb6ff);
      sun.intensity = 0.6 * night;
    }
    sun.target.position.copy(focus);
    hemi.color.copy(cA.set(0x22335e).lerp(cB.set(0xcfe6ff), day));
    hemi.groundColor.copy(cA.set(0x10180f).lerp(cB.set(0x4b6a2e), day));
    hemi.intensity = 0.35 + 0.12 * day;
    scene.fog.color.copy(FOG.day).lerp(FOG.gold, golden).lerp(FOG.night, night);
    renderer.toneMappingExposure = 0.7 + night * 0.35 + golden * 0.1;

    const key = night > 0.55 ? 'night' : golden > 0.45 ? 'gold' : 'day';
    if (key !== envKey) { envKey = key; scene.environment = ENV[key]; }
  }

  return {
    update, state, sun, sunDir,
    setHour(h) { override = h; },
    clearHour() { override = FIXED ?? null; },
  };
}
