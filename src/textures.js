// Tekstur prosedural (dibuat lewat <canvas>, jadi tidak perlu file gambar).
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, rx = 1, ry = rx, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Tile helper: draw with wrap so the texture tiles seamlessly.
function wrapDraw(size, x, y, fn) {
  for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
    const px = x + ox, py = y + oy;
    if (px > -40 && px < size + 40 && py > -40 && py < size + 40) fn(px, py);
  }
}

export function grassTexture(repeat = 40) {
  const S = 512;
  const [c, g] = canvas(S);
  g.fillStyle = '#4b7a2f';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = rnd(25, 80);
    const col = Math.random() < 0.5 ? 'rgba(98,140,52,0.18)' : 'rgba(46,82,28,0.18)';
    wrapDraw(S, x, y, (px, py) => { g.fillStyle = col; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); });
  }
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const l = rnd(18, 46);
    const col = `hsl(${rnd(80, 112)},${rnd(35, 60)}%,${l}%)`;
    const dx = rnd(-2.5, 2.5), dy = -rnd(3, 9), w = rnd(0.8, 1.8);
    wrapDraw(S, x, y, (px, py) => {
      g.strokeStyle = col; g.lineWidth = w;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx, py + dy); g.stroke();
    });
  }
  return toTexture(c, repeat);
}

export function concreteTexture(repeat = 4, tint = 200) {
  const S = 256;
  const [c, g] = canvas(S);
  g.fillStyle = `rgb(${tint},${tint},${tint - 4})`;
  g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = rnd(-14, 14);
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    wrapDraw(S, x, y, (px, py) => {
      g.fillStyle = 'rgba(0,0,0,0.04)'; g.beginPath(); g.arc(px, py, rnd(8, 30), 0, 7); g.fill();
    });
  }
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2;
  g.strokeRect(1, 1, S - 2, S - 2);
  return toTexture(c, repeat);
}

export function beltTexture() {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#1d2024'; g.fillRect(0, 0, 128, 128);
  const img = g.getImageData(0, 0, 128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = rnd(-8, 8); img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = '#3a3f46';
  for (let x = 0; x < 128; x += 32) {
    g.beginPath(); g.moveTo(x, 10); g.lineTo(x + 16, 64); g.lineTo(x, 118); g.lineTo(x + 8, 118); g.lineTo(x + 24, 64); g.lineTo(x + 8, 10); g.fill();
  }
  g.fillStyle = '#e0b100';
  g.fillRect(0, 0, 128, 5); g.fillRect(0, 123, 128, 5);
  return toTexture(c, 1);
}

export function faceTexture() {
  const [c, g] = canvas(128);
  g.fillStyle = '#111';
  g.beginPath(); g.ellipse(42, 50, 8, 13, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(86, 50, 8, 13, 0, 0, 7); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(44, 45, 3, 0, 7); g.fill();
  g.beginPath(); g.arc(88, 45, 3, 0, 7); g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 72, 24, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function emblemTexture(icon, color) {
  const [c, g] = canvas(128);
  g.fillStyle = color;
  g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
  g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.stroke();
  g.font = '68px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(icon, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Label 3D (sprite) yang selalu menghadap kamera.
// lines: [{ text, color, size }]
export function makeLabel(lines, opts = {}) {
  const W = opts.width || 512;
  const n = opts.lines || lines.length;
  const H = n * 62 + 26;
  const [c, g] = canvas(W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const sprite = new THREE.Sprite(mat);
  const worldH = (H / 62) * 0.5 * (opts.scale || 1);
  sprite.scale.set(worldH * W / H, worldH, 1);
  sprite.renderOrder = 10;
  let last = '';
  function set(ls) {
    const key = JSON.stringify(ls);
    if (key === last) return;
    last = key;
    g.clearRect(0, 0, W, H);
    if (opts.bg !== false) {
      g.fillStyle = opts.bg || 'rgba(8,12,22,0.72)';
      const r = 22;
      g.beginPath();
      g.roundRect ? g.roundRect(4, 4, W - 8, H - 8, r) : g.rect(4, 4, W - 8, H - 8);
      g.fill();
      if (opts.border) { g.lineWidth = 5; g.strokeStyle = opts.border; g.stroke(); }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    ls.forEach((l, i) => {
      let size = l.size || 44;
      g.font = `800 ${size}px "Nunito","Segoe UI",system-ui,sans-serif`;
      while (g.measureText(l.text).width > W - 40 && size > 16) {
        size -= 2;
        g.font = `800 ${size}px "Nunito","Segoe UI",system-ui,sans-serif`;
      }
      g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.55)';
      const y = 13 + 31 + i * 62;
      g.strokeText(l.text, W / 2, y);
      g.fillStyle = l.color || '#e8e8e8';
      g.fillText(l.text, W / 2, y);
    });
    tex.needsUpdate = true;
  }
  set(lines);
  return { sprite, set };
}
