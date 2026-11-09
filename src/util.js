export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return '$' + n;
  let i = 0, v = n;
  while (v >= 1000 && i < SUFFIX.length - 1) { v /= 1000; i++; }
  return '$' + (v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)) + SUFFIX[i];
}

export const easeOutBack = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
