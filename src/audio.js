// Efek suara sintetis (WebAudio) — tanpa file audio.
let ctx = null;
let muted = false;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = 0, delay = 0) {
  if (muted) return;
  try {
    const c = ac();
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch (e) { /* audio tidak tersedia */ }
}

function noise(dur, vol = 0.15, freq = 800) {
  if (muted) return;
  try {
    const c = ac();
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  } catch (e) { /* */ }
}

export const sfx = {
  unlock() { try { ac(); } catch (e) { /* */ } },
  toggle() { muted = !muted; return !muted; },
  buy() { tone(523, 0.12, 'triangle', 0.14); tone(659, 0.12, 'triangle', 0.14, 0, 0.08); tone(1046, 0.25, 'triangle', 0.14, 0, 0.16); },
  coin() { tone(988, 0.08, 'square', 0.05); tone(1319, 0.18, 'square', 0.05, 0, 0.07); },
  error() { tone(160, 0.25, 'sawtooth', 0.06, 110); },
  jump() { tone(300, 0.12, 'sine', 0.06, 600); },
  click() { tone(700, 0.05, 'triangle', 0.06); },
  ability(id) {
    switch (id) {
      case 'listrik': noise(0.5, 0.35, 2500); tone(90, 0.4, 'sawtooth', 0.08, 40); break;
      case 'api': noise(0.8, 0.3, 500); tone(120, 0.6, 'sawtooth', 0.06, 300); break;
      case 'gempa': noise(1.0, 0.45, 120); tone(55, 0.9, 'sine', 0.2, 30); break;
      case 'air': noise(0.9, 0.25, 900); break;
      default: tone(330, 0.5, 'sine', 0.1, 990); noise(0.4, 0.12, 1500);
    }
  },
};
