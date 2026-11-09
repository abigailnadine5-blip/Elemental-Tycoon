// Sistem animasi prosedural untuk avatar ber-rig (siku, lutut, pergelangan kaki).
// Lapisan: lokomosi (idle -> jalan -> lari, sinkron dengan jarak tempuh supaya kaki tidak "meluncur"),
// udara (naik/jatuh), aksi sekali jalan (mendarat, skill, emote) yang di-blend di atasnya,
// lalu gaya gerak per karakter (ninja, ksatria, robot, ...).
// Ditambah: serangan (lempar, pukul, tebas), emote hormat & pamer, transformasi ultimate, dan pose terbang.
import { clamp, lerp } from './util.js';

const TAU = Math.PI * 2;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t) => t * t * (3 - 2 * t);
// kurva "muncul cepat lalu kembali" untuk pukulan/hentakan
const hit = (t, a = 0.3) => (t < a ? ease(t / a) : 1 - ease((t - a) / (1 - a)));

// Semua kanal pose (nilai semantik, bukan rotasi mentah).
export const CHANNELS = [
  'y', 'lean', 'roll', 'twist', 'spin', 'wLean', 'wTwist', 'wRoll', 'hP', 'hY', 'hR',
  'aLf', 'aLo', 'aLe', 'aLt', 'aRf', 'aRo', 'aRe', 'aRt',
  'lLf', 'lLo', 'lLk', 'lLa', 'lRf', 'lRo', 'lRk', 'lRa',
];
const ZERO = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
const REST = { ...ZERO, aLo: 0.07, aRo: 0.07, aLe: 0.12, aRe: 0.12, lLo: 0.02, lRo: 0.02 };

// ---------------------------------------------------------------------------------------------
// Gaya karakter: idle, lokomosi, dan parameter lain.
// ---------------------------------------------------------------------------------------------
const STYLES = {
  normal: { walkAmp: 1, runAmp: 1, bob: 1, lean: 1, armRun: 1 },
  ninja: { walkAmp: 0.95, runAmp: 1.1, bob: 0.8, lean: 1.6, ninjaRun: true },
  heavy: { walkAmp: 0.85, runAmp: 0.85, bob: 1.4, lean: 0.7, armOut: 0.18, cadence: 0.9 },
  robot: { walkAmp: 0.8, runAmp: 0.8, bob: 0.6, lean: 0.5, quant: 0.12, stiff: true },
  mage: { walkAmp: 0.6, runAmp: 0.75, bob: 0.6, lean: 0.8, staff: true },
  light: { walkAmp: 1.1, runAmp: 1.05, bob: 1.5, lean: 1, armRun: 1.15, bouncy: true },
  swagger: { walkAmp: 1.05, runAmp: 1, bob: 1.1, lean: 0.9, swag: true, armOut: 0.12 },
  float: { walkAmp: 0.9, runAmp: 0.9, bob: 2.2, lean: 0.6, cadence: 0.72, armOut: 0.25 },
};

function idlePose(style, t, o) {
  const br = Math.sin(t * 1.7); // napas
  const sh = Math.sin(t * 0.45); // geser berat badan
  const p = { ...REST, wLean: -0.015 + br * 0.018, y: br * 0.008, roll: sh * 0.018, lLk: 0.04 + Math.max(0, sh) * 0.06, rLk: 0.04 + Math.max(0, -sh) * 0.06 };
  p.lRk = p.rLk; delete p.rLk;
  p.aLo += br * 0.02; p.aRo += br * 0.02;
  switch (style) {
    case 'ninja':
      Object.assign(p, { y: -0.08 + br * 0.006, lLf: 0.25, lLk: 0.45, lRf: -0.15, lRk: 0.4, lLo: 0.12, lRo: 0.12, aLf: 0.55, aLe: 1.5, aRf: 0.2, aRe: 1.9, aLo: 0.12, aRo: 0.25, wTwist: -0.25, twist: 0.2, wLean: 0.12, hY: -0.15 });
      break;
    case 'heavy':
      Object.assign(p, { aLo: 0.5, aRo: 0.5, aLe: 1.7, aRe: 1.7, aLf: -0.25, aRf: -0.25, lLo: 0.1, lRo: 0.1, wLean: -0.05 + br * 0.02 });
      break;
    case 'robot': {
      const tw = Math.floor(t / 2.2) % 3;
      Object.assign(p, { aLo: 0.12, aRo: 0.12, aLe: 0.3, aRe: 0.3, hY: tw === 1 ? 0.35 : tw === 2 ? -0.35 : 0, roll: 0, wLean: 0 });
      break;
    }
    case 'mage':
      Object.assign(p, { aRf: 0.35, aRe: 1.25, aRo: 0.18, aLf: 0.25 + Math.sin(t * 1.3) * 0.1, aLe: 0.9, aLo: 0.25 });
      break;
    case 'light':
      Object.assign(p, { aLo: 0.55, aLe: 1.9, aLf: -0.2, roll: 0.05 + sh * 0.03, lLo: 0.06, lRf: 0.12, lRk: 0.15, hR: 0.06 });
      break;
    case 'swagger':
      Object.assign(p, { aLo: 0.55, aRo: 0.55, aLe: 1.6, aRe: 1.6, aLf: -0.2, aRf: -0.2, lLo: 0.16, lRo: 0.16, wLean: -0.07, roll: sh * 0.04 });
      break;
    case 'float':
      Object.assign(p, { y: 0.06 + Math.sin(t * 1.1) * 0.05, aLo: 0.3 + br * 0.05, aRo: 0.3 + br * 0.05, lLk: 0.15, lRk: 0.2, lLf: 0.05 });
      break;
  }
  p.hP = (p.hP || 0) + o.lookP; p.hY = (p.hY || 0) + o.lookY;
  return p;
}

function locoPose(S, ph, w, r, t) {
  // w = bobot jalan (0..1), r = bobot lari (0..1)
  const s = Math.sin(ph), c = Math.cos(ph);
  const amp = lerp(S.walkAmp, S.runAmp, r);
  const legF = lerp(0.52, 0.98, r) * amp;
  const kneeSwing = lerp(0.9, 1.65, r);
  const p = { ...REST };
  p.lLf = s * legF; p.lRf = -s * legF;
  p.lLk = lerp(0.12, 0.3, r) + Math.max(0, c) * kneeSwing + Math.max(0, -s) * 0.15 * r;
  p.lRk = lerp(0.12, 0.3, r) + Math.max(0, -c) * kneeSwing + Math.max(0, s) * 0.15 * r;
  p.lLa = 0.22 * s - 0.25 * Math.max(0, -s) * r; p.lRa = -0.22 * s - 0.25 * Math.max(0, s) * r;
  const armF = lerp(0.42, 0.95, r) * (S.armRun || 1);
  p.aLf = -s * armF; p.aRf = s * armF;
  p.aLe = lerp(0.2, 1.35, r) + Math.max(0, -s) * 0.25; p.aRe = lerp(0.2, 1.35, r) + Math.max(0, s) * 0.25;
  p.aLo = 0.08 + (S.armOut || 0); p.aRo = 0.08 + (S.armOut || 0);
  const bob = lerp(0.05, 0.11, r) * S.bob;
  p.y = Math.abs(c) * bob - bob * 0.7 - 0.02 * r;
  p.lean = lerp(0.05, 0.22, r) * S.lean;
  p.wTwist = s * lerp(0.12, 0.24, r); p.twist = -s * lerp(0.07, 0.12, r);
  p.roll = s * 0.03 * w;
  p.hP = -p.lean * 0.6; p.hY = -p.wTwist * 0.6;
  if (S.ninjaRun && r > 0.05) {
    p.aLf = lerp(p.aLf, -1.25, r); p.aRf = lerp(p.aRf, -1.25, r); p.aLe = lerp(p.aLe, 0.15, r); p.aRe = lerp(p.aRe, 0.15, r);
    p.aLo = lerp(p.aLo, 0.22, r); p.aRo = lerp(p.aRo, 0.22, r); p.lean = lerp(p.lean, 0.55, r); p.hP = lerp(p.hP, -0.4, r); p.wTwist *= 0.4;
  }
  if (S.swag) { p.wTwist *= 1.6; p.roll = s * 0.08; p.aLo += 0.1; p.aRo += 0.1; }
  if (S.staff) { p.aRf = 0.35 + s * 0.08; p.aRe = 1.25; }
  if (S.bouncy) p.y += Math.abs(c) * 0.03;
  return p;
}

// terbang ala superhero (saat ultimate)
function flyPose(t) {
  const f = Math.sin(t * 3) * 0.06;
  return { ...REST, lean: 1.2 + f, aLf: 2.95, aRf: 2.6, aLe: 0.05, aRe: 0.35, aLo: 0.12, aRo: 0.25, lLf: -0.12, lRf: 0.05, lLk: 0.15, lRk: 0.5, lLa: -0.5, lRa: -0.5, hP: -0.95, y: 0.4 };
}

function airPose(vy, t) {
  const k = smooth(4, -7, vy); // 0 naik, 1 jatuh
  const flap = Math.sin(t * 15) * 0.18 * k;
  return {
    ...REST,
    lLf: lerp(0.75, 0.25, k), lLk: lerp(1.35, 0.5, k), lRf: lerp(-0.2, -0.05, k), lRk: lerp(0.45, 0.35, k),
    lLa: lerp(-0.3, 0.1, k), lRa: -0.2,
    aLf: lerp(0.5, 1.5, k) + flap, aRf: lerp(-0.35, 1.5, k) - flap, aLo: lerp(0.35, 0.75, k), aRo: lerp(0.35, 0.75, k),
    aLe: lerp(0.9, 0.55, k), aRe: lerp(0.6, 0.55, k), lean: lerp(0.05, -0.05, k), hP: lerp(-0.1, 0.12, k), y: 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Aksi sekali jalan. f(t01, time) -> pose parsial. dur dalam detik.
// ---------------------------------------------------------------------------------------------
export const ACTIONS = {
  jump: { dur: 0.22, in: 0.02, out: 0.12, f: (t) => { const k = 1 - t; return { y: -0.12 * k, lLk: 0.3 * k, lRk: 0.3 * k, aLf: 0.9 * (1 - k), aRf: 0.9 * (1 - k), aLo: 0.5, aRo: 0.5, lean: 0.1 * k }; } },
  land: { dur: 0.32, in: 0.01, out: 0.18, f: (t, _, s) => { const k = (1 - ease(t)) * (s || 1); return { y: -0.28 * k, lLk: 1.0 * k, lRk: 1.0 * k, lLf: 0.5 * k, lRf: 0.5 * k, lLa: -0.4 * k, lRa: -0.4 * k, lean: 0.3 * k, aLf: 0.5 * k, aRf: 0.5 * k, aLo: 0.4 * k, aRo: 0.4 * k, hP: -0.1 * k }; } },
  wave: { dur: 2.2, in: 0.18, out: 0.3, expr: 'happy', f: (t, T) => ({ aRo: 2.65, aRf: 0.25, aRe: 0.55 + Math.sin(T * 13) * 0.4, aRt: 0.4, hR: -0.12, hY: 0.15, roll: 0.04, aLo: 0.1 }) },
  cheer: { dur: 1.8, in: 0.12, out: 0.25, expr: 'happy', f: (t, T) => { const b = Math.abs(Math.sin(T * 7)); return { aLo: 2.6 + b * 0.25, aRo: 2.6 + b * 0.25, aLe: 0.3, aRe: 0.3, y: b * 0.22, lLk: 0.4 * (1 - b), lRk: 0.4 * (1 - b), hP: -0.25 }; } },
  dance: {
    dur: 5.4, in: 0.25, out: 0.4, expr: 'happy', f: (t, T) => {
      const beat = T * Math.PI * 2 * 1.9, s = Math.sin(beat), b = Math.abs(Math.sin(beat));
      const part = Math.floor(T * 1.9 / 4) % 2; // ganti gerakan tiap 4 ketukan
      if (part === 0) return { y: -0.12 + b * 0.12, roll: s * 0.14, twist: s * 0.25, lLk: 0.35 + Math.max(0, s) * 0.5, lRk: 0.35 + Math.max(0, -s) * 0.5, lLo: 0.15, lRo: 0.15, aLf: 0.6 + s * 0.6, aRf: 0.6 - s * 0.6, aLe: 1.4, aRe: 1.4, hR: s * 0.15, hY: s * 0.2 };
      const up = s > 0;
      return { y: -0.08 + b * 0.1, roll: s * 0.1, aRo: up ? 2.7 : 0.4, aRf: up ? 0.4 : 1.2, aRe: up ? 0.1 : 1.6, aLo: up ? 0.3 : 0.9, aLf: up ? 1.2 : -0.3, aLe: 1.5, lLf: up ? 0.25 : -0.1, lRf: up ? -0.1 : 0.25, lLk: 0.3, lRk: 0.3, hR: s * 0.1, wTwist: s * 0.3 };
    },
  },
  sit: { dur: Infinity, in: 0.35, out: 0.3, f: (t, T) => ({ y: -0.86, lLf: 1.5, lRf: 1.5, lLk: 0.15, lRk: 0.15, lLo: 0.18, lRo: 0.18, lLa: 0.3, lRa: 0.3, aLf: -0.55, aRf: -0.55, aLo: 0.25, aRo: 0.25, aLe: 0.05, aRe: 0.05, wLean: -0.18 + Math.sin(T * 1.6) * 0.02, hP: 0.05, hY: Math.sin(T * 0.4) * 0.25 }) },
  fistPump: { dur: 0.75, in: 0.05, out: 0.2, expr: 'happy', f: (t) => { const k = hit(t, 0.35); return { aRf: 0.3 + 0.6 * k, aRo: 0.4 + 1.2 * (1 - k), aRe: 2.1, aLo: 0.2, y: k * 0.08, lean: -0.08 * k, hP: -0.15 * k }; } },
  collect: { dur: 0.9, in: 0.05, out: 0.25, expr: 'happy', f: (t) => { const k = hit(t, 0.3); return { aLo: 0.4 + 2.2 * k, aRo: 0.4 + 2.2 * k, aLe: 0.3, aRe: 0.3, y: k * 0.25, lLk: 0.4 * (1 - k), lRk: 0.4 * (1 - k), hP: -0.25 * k }; } },
  shake: { dur: 0.7, in: 0.06, out: 0.2, expr: 'sad', f: (t, T) => ({ hY: Math.sin(T * 22) * 0.35 * (1 - t), aLo: 0.45, aRo: 0.45, aLe: 1.3, aRe: 1.3, aLf: 0.3, aRf: 0.3, aLt: 0.8, aRt: 0.8, wLean: -0.05 }) },
  point: { dur: 1.0, in: 0.1, out: 0.25, f: () => ({ aRf: 1.55, aRe: 0.05, aRo: 0.05, hP: 0, wTwist: -0.15 }) },
  // ---- skill ----
  castPower: { dur: 1.15, in: 0.06, out: 0.3, expr: 'focus', f: (t, T) => {
    const a = smooth(0, 0.35, t), b = smooth(0.35, 0.5, t);
    return { y: -0.22 * a * (1 - b) + 0.12 * b, lLk: 0.8 * a * (1 - b), lRk: 0.8 * a * (1 - b), lLo: 0.15 + 0.15 * b, lRo: 0.15 + 0.15 * b,
      aLf: lerp(1.1 * a, 0.4, b), aRf: lerp(1.1 * a, 0.4, b), aLo: lerp(-0.35 * a, 2.3, b), aRo: lerp(-0.35 * a, 2.3, b), aLe: lerp(1.6 * a, 0.1, b), aRe: lerp(1.6 * a, 0.1, b),
      wLean: 0.25 * a * (1 - b) - 0.22 * b, hP: 0.3 * a * (1 - b) - 0.35 * b, roll: b ? Math.sin(T * 40) * 0.015 : 0 };
  } },
  castWave: { dur: 0.95, in: 0.06, out: 0.3, expr: 'focus', f: (t) => {
    const a = smooth(0, 0.3, t), b = smooth(0.3, 0.42, t);
    return { aLf: lerp(0.4 * a, 1.5, b), aRf: lerp(0.4 * a, 1.5, b), aLe: lerp(1.9 * a, 0.05, b), aRe: lerp(1.9 * a, 0.05, b), aLo: -0.15, aRo: -0.15, aLt: -0.6 * b, aRt: -0.6 * b,
      lLf: 0.45 * b, lLk: 0.35 * b, lRf: -0.35 * b, lean: -0.1 * a + 0.2 * b, wTwist: 0.2 * a * (1 - b), y: -0.08 * b };
  } },
  castSlam: { dur: 1.1, in: 0.05, out: 0.3, expr: 'focus', f: (t) => {
    const a = smooth(0, 0.4, t), b = smooth(0.4, 0.5, t);
    return { aLo: 0.4, aRo: 0.4, aLf: lerp(2.9 * a, 1.0, b), aRf: lerp(2.9 * a, 1.0, b), aLe: 0.4, aRe: 0.4, y: lerp(0.1 * a, -0.42, b), lLk: lerp(0, 1.3, b), lRk: lerp(0, 1.3, b), lLf: 0.6 * b, lRf: 0.6 * b, lean: lerp(-0.25 * a, 0.5, b), hP: lerp(-0.35 * a, 0.25, b) };
  } },
  castDash: { dur: 0.8, in: 0.04, out: 0.3, expr: 'focus', f: (t) => {
    const a = smooth(0, 0.18, t);
    return { lean: 0.6 * a, aRf: 1.55 * a, aRe: 0.05, aLf: -1.1 * a, aLe: 0.2, lLf: 0.8 * a, lLk: 0.7 * a, lRf: -0.7 * a, lRk: 0.2, y: -0.15 * a, hP: -0.4 * a };
  } },
  castSpin: { dur: 0.95, in: 0.05, out: 0.2, expr: 'focus', f: (t) => ({ spin: ease(t) * TAU * 2, aLo: 1.5, aRo: 1.5, aLe: 0.05, aRe: 0.05, y: Math.sin(t * Math.PI) * 0.35, lLk: 0.5, lRk: 0.2, lLf: 0.3 }) },
  castHarvest: { dur: 1.2, in: 0.06, out: 0.3, expr: 'happy', f: (t) => {
    const a = smooth(0, 0.35, t), b = smooth(0.4, 0.7, t);
    return { aLo: lerp(2.6 * a, 0.6, b), aRo: lerp(2.6 * a, 0.6, b), aLf: lerp(0.3, 1.0, b), aRf: lerp(0.3, 1.0, b), aLe: lerp(0.2, 1.2, b), aRe: lerp(0.2, 1.2, b), wLean: lerp(-0.2 * a, 0.35, b), y: -0.18 * b, lLk: 0.5 * b, lRk: 0.5 * b, hP: lerp(-0.4 * a, 0.3, b) };
  } },
  // ---- serangan [Q] ----
  throw: { dur: 0.5, in: 0.04, out: 0.2, expr: 'focus', f: (t) => {
    const a = smooth(0, 0.35, t), b = smooth(0.35, 0.5, t);
    return { aRf: lerp(2.7 * a, 1.2, b), aRe: lerp(1.3 * a, 0.1, b), aRo: 0.2, wTwist: lerp(0.4 * a, -0.45, b), lean: 0.15 * b, aLf: 0.6 * a, aLe: 0.8, lLf: 0.3 * b, lRf: -0.2 * b };
  } },
  punch: { dur: 0.36, in: 0.03, out: 0.15, expr: 'focus', f: (t) => {
    const k = hit(t, 0.3);
    return { aRf: 0.3 + 1.25 * k, aRe: 1.6 * (1 - k), aLf: 0.4, aLe: 1.6, wTwist: -0.4 * k, lean: 0.12 * k, lLf: 0.3, lRf: -0.25, lLk: 0.3, lRk: 0.3 };
  } },
  slash: { dur: 0.5, in: 0.04, out: 0.2, expr: 'focus', f: (t) => {
    const a = smooth(0, 0.3, t), b = smooth(0.3, 0.45, t);
    return { aRf: lerp(2.8 * a, 0.6, b), aRo: lerp(0.5 * a, -0.3, b), aRe: lerp(0.6, 0.1, b), wTwist: lerp(0.5 * a, -0.6, b), lean: 0.2 * b, lLf: 0.45 * b, lLk: 0.4 * b, lRf: -0.35 * b, aLf: 0.4, aLe: 1.2 };
  } },
  // ---- emote tambahan ----
  salute: { dur: 1.6, in: 0.15, out: 0.25, f: () => ({ aRo: 1.3, aRf: 0.6, aRe: 2.3, aRt: 0.3, hP: -0.05, wLean: -0.05, lLo: 0, lRo: 0 }) },
  flex: { dur: 2.2, in: 0.15, out: 0.3, expr: 'happy', f: (t, T) => { const pump = Math.sin(T * 9); return { aLo: 1.45, aRo: 1.45, aLe: 1.8 + pump * 0.18, aRe: 1.8 + pump * 0.18, aLt: 1.5, aRt: 1.5, y: -0.06, lLo: 0.2, lRo: 0.2, lLk: 0.25, lRk: 0.25, hP: 0.1, hY: Math.sin(T * 3) * 0.3 }; } },
  // ---- transformasi ultimate ----
  transform: { dur: 1.1, in: 0.05, out: 0.25, expr: 'focus', f: (t) => ({ spin: ease(t) * TAU * 2, aLo: 1.4 + Math.sin(t * Math.PI) * 1.2, aRo: 1.4 + Math.sin(t * Math.PI) * 1.2, aLe: 0.05, aRe: 0.05, y: Math.sin(t * Math.PI) * 0.6, lLk: 0.6, lRk: 0.6, lLf: 0.4, lRf: 0.4, hP: -0.4 }) },
  // ---- iseng saat diam lama ----
  lookWatch: { dur: 2.0, in: 0.25, out: 0.3, f: () => ({ aLf: 1.2, aLe: 1.7, aLo: -0.25, aLt: -1.1, hP: 0.35, hY: 0.25 }) },
  stretch: { dur: 2.2, in: 0.35, out: 0.4, expr: 'happy', f: (t) => { const k = Math.sin(t * Math.PI); return { aLo: 2.8 * k, aRo: 2.8 * k, aLe: 0.2, aRe: 0.2, wLean: -0.25 * k, hP: -0.35 * k, y: 0.04 * k }; } },
  tapFoot: { dur: 1.8, in: 0.2, out: 0.25, f: (t, T) => ({ lRa: Math.max(0, Math.sin(T * 14)) * 0.5, lRf: 0.15, aLo: 0.5, aRo: 0.5, aLe: 1.6, aRe: 1.6, aLf: -0.2, aRf: -0.2 }) },
  scratch: { dur: 1.6, in: 0.25, out: 0.3, f: (t, T) => ({ aRo: 1.9, aRf: 0.4, aRe: 2.2 + Math.sin(T * 18) * 0.15, hR: 0.15, hP: 0.08 }) },
  victory: { dur: Infinity, in: 0, out: 0, f: () => ({ aRo: 2.7, aRf: 0.2, aRe: 0.1, aLo: 0.45, aLe: 1.7, aLf: -0.2, lLf: 0.3, lLk: 0.1, lRf: -0.2, wLean: -0.08, hP: -0.2, hY: -0.2 }) },
};
const FIDGETS = ['lookWatch', 'stretch', 'tapFoot', 'scratch'];

// ---------------------------------------------------------------------------------------------
export class Animator {
  constructor(J, style = 'normal') {
    this.J = J;
    this.styleName = style;
    this.S = STYLES[style] || STYLES.normal;
    this.cur = { ...REST };
    this.phase = 0;
    this.w = 0; this.r = 0; this.air = 0; this.fly = 0;
    this.actions = [];
    this.t = Math.random() * 10;
    this.look = { y: 0, p: 0, ty: 0, tp: 0, next: 2 };
    this.idleTime = 0;
    this.fidgetAt = 7 + Math.random() * 6;
    this.wasAir = false; this.lastVy = 0;
    this.prevCos = 1;
    this.onStep = null; this.onLand = null; this.onExpr = null;
    this.expr = 'normal'; this.exprUntil = 0;
  }

  play(name, opts = {}) {
    const A = ACTIONS[name];
    if (!A) return;
    const additive = name === 'land' || name === 'jump';
    if (!additive && !opts.stack) for (const a of this.actions) if (a.name !== 'land' && a.name !== 'jump') a.stopping = true;
    this.actions.push({ name, def: A, t: 0, s: opts.strength ?? 1, fade: 1, stopping: false });
    if (A.expr) this.setExpr(A.expr, Math.min(A.dur, 3));
  }
  stop(name) { for (const a of this.actions) if (!name || a.name === name) a.stopping = true; }
  playing(name) { return this.actions.some((a) => a.name === name && !a.stopping); }
  setExpr(e, dur = 1.2) { this.expr = e; this.exprUntil = this.t + dur; if (this.onExpr) this.onExpr(e); }

  // inp: { speed (unit/detik), grounded, vy, turn (rad/detik), accel }
  update(dt, inp) {
    this.t += dt;
    const T = this.t, S = this.S;
    const speed = inp.speed || 0;
    const grounded = inp.grounded !== false;

    // --- bobot lokomosi ---
    this.w = lerp(this.w, smooth(0.25, 2.5, speed), 1 - Math.exp(-10 * dt));
    this.r = lerp(this.r, smooth(6, 10.5, speed), 1 - Math.exp(-6 * dt));
    this.air = lerp(this.air, grounded ? 0 : 1, 1 - Math.exp(-(grounded ? 22 : 12) * dt));
    this.fly = lerp(this.fly, inp.fly ? 1 : 0, 1 - Math.exp(-6 * dt));

    // fase langkah mengikuti jarak tempuh (anti-meluncur)
    const cycle = lerp(2.5, 4.1, this.r) / (S.cadence || 1);
    if (grounded) this.phase = (this.phase + (speed * dt / cycle) * TAU) % TAU;
    const c = Math.cos(this.phase);
    if (grounded && this.w > 0.3 && Math.sign(c) !== Math.sign(this.prevCos) && this.onStep) this.onStep(c < 0 ? 'L' : 'R', this.r);
    this.prevCos = c;

    // pendaratan
    if (this.wasAir && grounded) {
      const impact = clamp(-this.lastVy / 22, 0.15, 1.2);
      this.play('land', { strength: impact, stack: true });
      if (this.onLand) this.onLand(impact);
    }
    this.wasAir = !grounded; this.lastVy = inp.vy || 0;

    // lihat sekeliling saat diam
    if (speed < 0.3 && grounded) { this.idleTime += dt; } else { this.idleTime = 0; }
    this.look.next -= dt;
    if (this.look.next <= 0) { this.look.next = 2 + Math.random() * 4; this.look.ty = (Math.random() - 0.5) * 0.9; this.look.tp = (Math.random() - 0.4) * 0.25; }
    const lk = 1 - Math.exp(-3 * dt);
    this.look.y = lerp(this.look.y, this.w > 0.4 ? 0 : this.look.ty, lk); this.look.p = lerp(this.look.p, this.w > 0.4 ? 0 : this.look.tp, lk);
    if (this.idleTime > this.fidgetAt && !this.actions.length) { this.fidgetAt = this.idleTime + 8 + Math.random() * 8; this.play(FIDGETS[Math.floor(Math.random() * FIDGETS.length)]); }

    // --- susun pose dasar ---
    const idle = idlePose(this.styleName, T, { lookY: this.look.y, lookP: this.look.p });
    const loco = locoPose(S, this.phase, this.w, this.r, T);
    const air = airPose(inp.vy || 0, T);
    const fly = this.fly > 0.01 ? flyPose(T) : null;
    const out = {};
    for (const ch of CHANNELS) {
      let v = lerp(idle[ch] ?? REST[ch], loco[ch] ?? REST[ch], this.w);
      v = lerp(v, air[ch] ?? REST[ch], this.air);
      if (fly) v = lerp(v, fly[ch] ?? REST[ch], this.fly);
      out[ch] = v;
    }
    // condong saat berbelok & berakselerasi
    out.roll += clamp(-(inp.turn || 0) * speed * 0.012, -0.22, 0.22) * (1 - this.air);
    out.lean += clamp((inp.accel || 0) * 0.012, -0.15, 0.2) * (1 - this.air);

    // --- aksi ---
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const a = this.actions[i], d = a.def;
      a.t += dt;
      if (a.name === 'sit' && (speed > 0.6 || !grounded)) a.stopping = true;
      if (d.dur !== Infinity && a.t >= d.dur) a.stopping = true;
      let wgt;
      if (a.stopping) { a.fade -= dt / Math.max(0.01, d.out || 0.15); wgt = Math.max(0, a.fade); if (a.fade <= 0) { this.actions.splice(i, 1); continue; } }
      else wgt = clamp(a.t / Math.max(0.001, d.in || 0.05), 0, 1);
      // aksi tertentu melemah saat berlari
      if (['wave', 'lookWatch', 'stretch', 'tapFoot', 'scratch', 'point', 'fistPump'].includes(a.name)) wgt *= 1 - this.w * 0.6;
      if (['dance', 'cheer'].includes(a.name) && this.w > 0.5) a.stopping = true;
      const p = d.f(d.dur === Infinity ? 0 : clamp(a.t / d.dur, 0, 1), a.t, a.s);
      const add = a.name === 'land' || a.name === 'jump';
      for (const k in p) out[k] = add ? out[k] + p[k] * wgt : lerp(out[k], p[k], wgt);
    }

    // --- haluskan & kuantisasi (robot) ---
    const k = 1 - Math.exp(-(S.stiff ? 32 : 20) * dt);
    for (const ch of CHANNELS) {
      if (ch === 'spin') { this.cur.spin = out.spin; continue; }
      this.cur[ch] = lerp(this.cur[ch], out[ch], k);
    }
    if (this.expr !== 'normal' && T > this.exprUntil) { this.expr = 'normal'; if (this.onExpr) this.onExpr('normal'); }
    this.apply();
  }

  apply() {
    const J = this.J, p = this.cur, q = this.S.quant;
    const Q = q ? (v) => Math.round(v / q) * q : (v) => v;
    J.body.position.y = p.y;
    J.body.rotation.set(Q(p.lean), p.twist + p.spin, Q(p.roll), 'YXZ');
    J.waist.rotation.set(Q(p.wLean), Q(p.wTwist), p.wRoll);
    J.neck.rotation.set(Q(p.hP), Q(p.hY), p.hR, 'YXZ');
    J.shL.rotation.set(Q(-p.aLf), p.aLt, Q(p.aLo), 'XYZ');
    J.shR.rotation.set(Q(-p.aRf), -p.aRt, Q(-p.aRo), 'XYZ');
    J.elL.rotation.x = Q(-p.aLe); J.elR.rotation.x = Q(-p.aRe);
    J.hpL.rotation.set(Q(-p.lLf), 0, p.lLo); J.hpR.rotation.set(Q(-p.lRf), 0, -p.lRo);
    J.knL.rotation.x = Q(p.lLk); J.knR.rotation.x = Q(p.lRk);
    J.anL.rotation.x = -p.lLa; J.anR.rotation.x = -p.lRa;
    // kaki menapak: kompensasi agar telapak tetap rata saat lutut menekuk
    J.anL.rotation.x += (p.lLf - p.lLk) * 0.6 * (1 - this.air);
    J.anR.rotation.x += (p.lRf - p.lRk) * 0.6 * (1 - this.air);
  }
}
