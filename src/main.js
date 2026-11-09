// =====================================================================
//  ELEMENTAL TYCOON 3D — entry point
// =====================================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ELEMENTS, getElement, passive, hex } from './elements.js';
import { createWorld, PLOT_POSITIONS, WORLD_LIMIT } from './world.js';
import { Plot, START_CASH, BELT_SPEED } from './tycoon.js';
import { createAvatar, disposeAvatar } from './character.js';
import { Particles, Effects } from './particles.js';
import { makeLabel } from './textures.js';
import { Input } from './input.js';
import { sfx } from './audio.js';
import { createMultiplayer, firebaseConfigured, offline } from './multiplayer.js';
import { fmt, clamp, damp, lerpAngle, isTouch } from './util.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const touch = isTouch();
const low = params.has('low') || (touch && !params.has('high'));
const quality = low
  ? { pr: Math.min(devicePixelRatio, 1.25), shadowSize: 1024, trees: 200, samples: 0 }
  : { pr: Math.min(devicePixelRatio, 2), shadowSize: 2048, trees: 420, samples: 4 };
if (touch) document.body.classList.add('touch');

// ---------------------------------------------------------------------
// Renderer, kamera, post-processing
// ---------------------------------------------------------------------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !quality.samples, powerPreference: 'high-performance' });
renderer.setPixelRatio(quality.pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2500);
camera.position.set(40, 25, 40);

const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: quality.samples });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(quality.pr);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.35, 0.95);
composer.addPass(bloom);
composer.addPass(new OutputPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------------
// Dunia & plot
// ---------------------------------------------------------------------
const world = createWorld(scene, renderer, quality);
const particles = new Particles(scene);
const effects = new Effects(scene);
const plots = PLOT_POSITIONS.map((p, i) => new Plot(scene, i, p, particles));
const input = new Input(canvas);

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
const game = {
  state: 'menu', // menu | select | loading | playing
  t: 0,
  element: null,
  name: '',
  cash: 0,
  rebirths: 0,
  plot: null,
  plotIndex: -1,
  abilityCd: 0,
  abCount: 0,
  boosts: {},
  nextOre: { count: 0, mult: 1 },
  income: 0,
  lastPad: null,
  onCollect: false,
  shake: 0,
};
let mp = offline('');
const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), dash: new THREE.Vector3(),
  onGround: true, facing: 0, avatar: null, label: null, speed: 0,
};
let camYaw = 0, camPitch = 0.42, camDist = 13;
const camTarget = new THREE.Vector3(0, 3, 0);
const camLook = new THREE.Vector3(0, 3, 0);
const remotes = new Map();

const boost = (k) => { const b = game.boosts[k]; return b && game.t < b.until ? b.mult : 1; };
const rebirthMult = () => 1 + game.rebirths * 0.5;
const priceMult = () => passive(game.element, 'discount');
const priceOf = (it) => Math.round(it.price * priceMult());

function localMods() {
  const el = game.element;
  return {
    drop: passive(el, 'drop') * boost('drop'),
    value: passive(el, 'value') * boost('value') * rebirthMult(),
    upg: passive(el, 'upg') * boost('upg'),
    nextOre: game.nextOre,
  };
}
const remoteModsCache = {};
function remoteMods(el) {
  if (!remoteModsCache[el.id]) remoteModsCache[el.id] = { drop: passive(el, 'drop'), value: 1, upg: 1, nextOre: null };
  return remoteModsCache[el.id];
}

// ---------------------------------------------------------------------
// Simpan / muat (localStorage)
// ---------------------------------------------------------------------
const SAVE_KEY = (id) => `elementalTycoon:v1:${id}`;
function loadSave(id) { try { return JSON.parse(localStorage.getItem(SAVE_KEY(id)) || 'null'); } catch (e) { return null; } }
function save() {
  if (game.state !== 'playing' || !game.plot) return;
  try {
    localStorage.setItem(SAVE_KEY(game.element.id), JSON.stringify({
      cash: game.cash + game.plot.bank, items: [...game.plot.items], rebirths: game.rebirths, t: Date.now(),
    }));
    localStorage.setItem('elementalTycoon:name', game.name);
  } catch (e) { /* storage tidak tersedia */ }
}
setInterval(save, 5000);
addEventListener('beforeunload', () => { save(); mp.leave(); });

// ---------------------------------------------------------------------
// UI: Menu & pilih elemen
// ---------------------------------------------------------------------
let selected = null;
let preview = null;
const PREVIEW_POS = new THREE.Vector3(0, 0, 9.5);

try { $('nameInput').value = localStorage.getItem('elementalTycoon:name') || ''; } catch (e) { /* */ }
$('netInfo').textContent = firebaseConfigured() ? '🟢 Multiplayer Firebase aktif' : '⚪ Mode offline — isi firebase-config.js untuk multiplayer';

function buildCards() {
  const grid = $('elementGrid');
  grid.innerHTML = '';
  for (const el of ELEMENTS) {
    const s = loadSave(el.id);
    const card = document.createElement('button');
    card.className = 'el-card';
    card.style.setProperty('--c', hex(el.color));
    card.style.setProperty('--g', hex(el.glow));
    card.innerHTML = `
      <div class="el-icon">${el.icon}</div>
      <div class="el-name">${el.name}</div>
      <div class="el-pass">${el.passiveText}</div>
      ${s ? `<div class="el-save">💾 ${fmt(s.cash)}${s.rebirths ? ' · ♻' + s.rebirths : ''}</div>` : ''}`;
    card.onclick = () => selectElement(el, card);
    grid.appendChild(card);
  }
}

function selectElement(el, card) {
  sfx.click();
  selected = el;
  document.querySelectorAll('.el-card').forEach((c) => c.classList.remove('sel'));
  card.classList.add('sel');
  const d = $('elementDetail');
  d.style.setProperty('--c', hex(el.color));
  d.innerHTML = `
    <div class="d-head"><span class="d-icon">${el.icon}</span><div><h3>${el.name}</h3><p>${el.desc}</p></div></div>
    <div class="d-row"><b>Pasif</b><span>${el.passiveText}</span></div>
    <div class="d-row"><b>Skill [E]</b><span><i>${el.ability.name}</i> — ${el.ability.text} (cooldown ${el.ability.cooldown}d)</span></div>`;
  $('playBtn').disabled = false;
  $('playBtn').style.setProperty('--c', hex(el.color));
  if (preview) disposeAvatar(preview);
  preview = createAvatar(el);
  preview.root.position.copy(PREVIEW_POS);
  scene.add(preview.root);
  particles.emit(PREVIEW_POS.clone().setY(1.5), 90, { ...el.fx, speed: (el.fx.speed || 2) * 2 + 2, spread: 0.5 });
  effects.shockwave(PREVIEW_POS, el.color, 5);
}

function show(id) {
  for (const s of ['menu', 'select', 'hud']) $(s).classList.toggle('hidden', s !== id);
}

$('startBtn').onclick = () => {
  sfx.unlock(); sfx.click();
  game.name = ($('nameInput').value.trim() || 'Player' + Math.floor(Math.random() * 1000)).slice(0, 16);
  $('nameInput').value = game.name;
  buildCards();
  game.state = 'select';
  show('select');
};
$('backBtn').onclick = () => { sfx.click(); game.state = 'menu'; show('menu'); };
$('playBtn').onclick = () => { if (selected) startGame(selected); };
$('howBtn').onclick = () => $('howPanel').classList.toggle('hidden');
$('muteBtn').onclick = () => { $('muteBtn').textContent = sfx.toggle() ? '🔊' : '🔇'; };
$('exitBtn').onclick = () => { save(); mp.leave(); location.href = location.pathname + location.search; };
$('helpClose').onclick = () => $('help').classList.add('hidden');

// ---------------------------------------------------------------------
// Toast & chat
// ---------------------------------------------------------------------
function toast(msg, color = '#fff') {
  const d = document.createElement('div');
  d.className = 'toast';
  d.style.color = color;
  d.textContent = msg;
  $('toasts').appendChild(d);
  setTimeout(() => d.classList.add('out'), 2200);
  setTimeout(() => d.remove(), 2700);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
}

function addChat(name, msg, color = '#fff') {
  const line = document.createElement('div');
  line.className = 'chat-line';
  const b = document.createElement('b');
  b.style.color = color;
  b.textContent = name + ': ';
  line.append(b, document.createTextNode(msg));
  $('chatLog').appendChild(line);
  while ($('chatLog').children.length > 8) $('chatLog').firstChild.remove();
  $('chatLog').scrollTop = 1e9;
}

function openChat() {
  if (!mp.online) { toast('Chat butuh multiplayer (Firebase)', '#ffcc80'); return; }
  $('chatInput').classList.remove('hidden');
  $('chatInput').focus();
}
$('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const v = e.target.value.trim();
    if (v) mp.sendChat(game.name, v);
    e.target.value = '';
    e.target.blur();
    e.target.classList.add('hidden');
  } else if (e.key === 'Escape') { e.target.blur(); e.target.classList.add('hidden'); }
  e.stopPropagation();
});
$('chatBtn').onclick = openChat;
addEventListener('keydown', (e) => {
  if (game.state !== 'playing' || document.activeElement === $('chatInput')) return;
  if (e.code === 'Enter' || e.code === 'KeyT') { e.preventDefault(); openChat(); }
});

// ---------------------------------------------------------------------
// Multiplayer handlers
// ---------------------------------------------------------------------
const handlers = {
  onPlayer(id, d) {
    if (!d || typeof d.x !== 'number') return;
    const el = getElement(d.e);
    let r = remotes.get(id);
    if (r && r.el.id !== el.id) { removeRemote(id); r = null; }
    if (!r) {
      const av = createAvatar(el);
      const label = makeLabel([{ text: d.n || 'Pemain', color: hex(el.glow), size: 42 }], { scale: 0.9 });
      label.sprite.position.y = 3.3;
      av.root.add(label.sprite);
      av.root.position.set(d.x, d.y, d.z);
      scene.add(av.root);
      r = { id, avatar: av, label, el, target: new THREE.Vector3(d.x, d.y, d.z), ry: d.r || 0, s: 0, g: false, ab: d.ab, n: d.n, c: d.c || 0 };
      remotes.set(id, r);
      if (game.state === 'playing') toast(`👋 ${d.n || 'Pemain'} (${el.name}) bergabung`, hex(el.glow));
    }
    r.target.set(d.x, d.y, d.z);
    r.ry = d.r || 0; r.s = d.s || 0; r.g = !!d.g; r.c = d.c || 0;
    if (d.n !== r.n) { r.n = d.n; r.label.set([{ text: d.n || 'Pemain', color: hex(el.glow), size: 42 }]); }
    if (d.ab !== r.ab) { r.ab = d.ab; abilityFx(r.avatar.root.position, el); }
    updateLeaderboard();
  },
  onPlayerLeave(id) {
    const r = remotes.get(id);
    if (r && game.state === 'playing') toast(`${r.n || 'Pemain'} keluar`, '#aaa');
    removeRemote(id);
    updateLeaderboard();
  },
  onPlot(i, data) {
    const plot = plots[i];
    if (!plot || i === game.plotIndex) return;
    if (!data) { plot.clearOwner(); return; }
    if (data.owner === mp.id) return;
    plot.applyRemote(data, getElement(data.element));
  },
  onChat(m) {
    if (!m) return;
    const r = [...remotes.values()].find((x) => x.id === m.uid);
    addChat(m.n || '?', m.m || '', m.uid === mp.id ? hex(game.element?.glow || 0xffffff) : r ? hex(r.el.glow) : '#9ecbff');
  },
  onConnection(ok) {
    $('netStatus').textContent = ok ? `🟢 Online · room ${mp.room}` : '🟠 Menyambung ulang...';
  },
};

function removeRemote(id) {
  const r = remotes.get(id);
  if (!r) return;
  disposeAvatar(r.avatar);
  remotes.delete(id);
}

function updateLeaderboard() {
  const rows = [{ n: game.name + ' (kamu)', c: game.cash, col: hex(game.element?.glow || 0xffffff) }];
  for (const r of remotes.values()) rows.push({ n: r.n || 'Pemain', c: r.c, col: hex(r.el.glow) });
  rows.sort((a, b) => b.c - a.c);
  $('leaderboard').innerHTML = `<div class="lb-title">🏆 Pemain (${rows.length})</div>` +
    rows.slice(0, 8).map((r) => `<div class="lb-row"><span style="color:${r.col}">${escapeHtml(r.n)}</span><b>${fmt(r.c)}</b></div>`).join('');
}
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function plotPayload() {
  const p = game.plot;
  return { name: game.name, element: game.element.id, items: Object.fromEntries([...(p ? p.items : [])].map((i) => [i, true])) };
}
function syncPlot() { if (mp.online && game.plotIndex >= 0) mp.updatePlot(game.plotIndex, plotPayload()); }

// ---------------------------------------------------------------------
// Mulai game
// ---------------------------------------------------------------------
async function startGame(el) {
  sfx.click();
  game.state = 'loading';
  $('loadingText').textContent = firebaseConfigured() ? 'Menghubungkan ke server...' : 'Menyiapkan markas...';
  $('loading').classList.remove('hidden');
  game.element = el;
  if (preview) { disposeAvatar(preview); preview = null; }

  mp = await createMultiplayer(handlers);
  const s = loadSave(el.id);
  game.cash = s ? s.cash : START_CASH;
  game.rebirths = s ? s.rebirths || 0 : 0;
  const items = s ? s.items || [] : [];

  let idx = await mp.claimPlot(plots.length, { name: game.name, element: el.id, items: Object.fromEntries(items.map((i) => [i, true])) });
  if (idx < 0) {
    toast('Server penuh (maks 4 pemain). Main offline dulu ya!', '#ffcc80');
    mp.leave();
    mp = offline('Server penuh');
    idx = 0;
  }
  game.plotIndex = idx;
  const plot = plots[idx];
  plot.reset();
  plot.setOwner(game.name, el, true, mp.id);
  items.forEach((id) => plot.build(id, false));
  game.plot = plot;

  // avatar pemain
  player.avatar = createAvatar(el);
  player.label = makeLabel([{ text: game.name, color: hex(el.glow), size: 42 }], { scale: 0.9 });
  player.label.sprite.position.y = 3.3;
  player.avatar.root.add(player.label.sprite);
  scene.add(player.avatar.root);
  respawn();

  $('elIcon').textContent = el.icon;
  $('elName').textContent = el.name;
  $('elPassive').textContent = el.passiveText;
  $('elBadge').style.setProperty('--c', hex(el.color));
  $('abilityBtn').style.setProperty('--c', hex(el.color));
  $('abIcon').textContent = el.icon;
  $('abName').textContent = el.ability.name;
  $('netStatus').textContent = mp.online ? `🟢 Online · room ${mp.room}` : '⚪ Offline';
  $('netStatus').title = mp.online ? '' : mp.reason;
  $('chatBtn').classList.toggle('hidden', !mp.online);
  $('loading').classList.add('hidden');
  show('hud');
  game.state = 'playing';
  updateLeaderboard();
  toast(`Selamat datang di markas ${el.name}, ${game.name}! ${el.icon}`, hex(el.glow));
  if (!items.length) setTimeout(() => toast('Injak tombol hijau "Dropper I" untuk mulai!', '#7dff9b'), 1500);
  abilityFx(player.pos, el);
}

function respawn() {
  game.plot.spawnWorld(player.pos);
  player.vel.set(0, 0, 0);
  player.dash.set(0, 0, 0);
  player.facing = game.plot.angle + Math.PI;
  camYaw = game.plot.angle;
  camTarget.copy(player.pos).y += 2.2;
}

// ---------------------------------------------------------------------
// Ekonomi
// ---------------------------------------------------------------------
function buy(it) {
  const price = priceOf(it);
  if (game.cash < price) return false;
  game.cash -= price;
  if (it.type === 'rebirth') {
    game.rebirths++;
    game.cash = START_CASH;
    game.plot.reset();
    game.nextOre = { count: 0, mult: 1 };
    toast(`♻ REBIRTH #${game.rebirths}! Bonus pendapatan permanen x${rebirthMult().toFixed(1)}`, '#ffd54f');
    for (let i = 0; i < 6; i++) setTimeout(() => particles.emit(player.pos.clone().setY(3), 80, { color: 0xffd54f, color2: 0xff4081, speed: 9, life: 1.6, gravity: 6, size: 0.4 }), i * 150);
  } else {
    game.plot.build(it.id, true);
    toast(`✅ ${it.name} dibangun!`, '#7dff9b');
  }
  sfx.buy();
  syncPlot();
  save();
  return true;
}

function collectBank() {
  const p = game.plot;
  if (p.bank < 1) return;
  const v = p.bank;
  game.cash += v;
  p.bank = 0;
  sfx.coin();
  const pos = player.pos.clone().setY(player.pos.y + 1.5);
  particles.emit(pos, Math.min(80, 15 + Math.log10(v + 1) * 10), { color: 0xffd54f, color2: 0x7dff9b, speed: 5, up: 4, gravity: 9, life: 1.1, size: 0.35 });
  toast(`+${fmt(v)}`, '#7dff9b');
}

// ---------------------------------------------------------------------
// Skill elemen
// ---------------------------------------------------------------------
function abilityFx(pos, el) {
  const fx = el.fx;
  particles.emit(new THREE.Vector3(pos.x, pos.y + 1.4, pos.z), 140, { ...fx, speed: (fx.speed || 2) * 2.5 + 3, spread: 0.6, life: (fx.life || 1) * 1.3, size: (fx.size || 0.4) * 1.3 });
  effects.shockwave(pos, el.color, 9);
}

function useAbility() {
  if (game.state !== 'playing' || game.abilityCd > 0) return;
  const el = game.element, ab = el.ability, plot = game.plot;
  game.abilityCd = ab.cooldown;
  game.abCount++;
  const now = game.t;
  abilityFx(player.pos, el);
  sfx.ability(el.id);
  switch (ab.type) {
    case 'dropBoost': game.boosts.drop = { mult: ab.mult, until: now + ab.duration }; break;
    case 'valueBoost': game.boosts.value = { mult: ab.mult, until: now + ab.duration }; break;
    case 'upgBoost': game.boosts.upg = { mult: ab.mult, until: now + ab.duration }; break;
    case 'speedBoost': game.boosts.speed = { mult: ab.mult, until: now + ab.duration }; break;
    case 'instantCash': {
      const amt = Math.max(150, game.income * ab.seconds);
      game.cash += amt;
      toast(`🌾 Panen Raya! +${fmt(amt)}`, '#9cff6e');
      break;
    }
    case 'zap': {
      const target = plot.toWorld(new THREE.Vector3(12, 1.9, -8), new THREE.Vector3());
      let n = 0;
      const before = plot.bank;
      plot.collectAll(localMods(), (o) => { if (n++ < 40) effects.bolt(plot.oreWorld(o, new THREE.Vector3()), target, el.glow); });
      game.income += (plot.bank - before) * 0.05;
      for (let i = 0; i < 3; i++) effects.bolt(player.pos.clone().setY(30), player.pos.clone().setY(1), 0xfff59d);
      player.dash.set(Math.sin(player.facing), 0, Math.cos(player.facing)).multiplyScalar(32);
      if (n) toast(`⚡ ${n} ore tersambar!`, '#fff27a');
      break;
    }
    case 'shock': {
      for (const o of plot.ores) { o.value *= ab.mult; o.onBelt = false; o.vy = 4 + Math.random() * 4; }
      effects.shockwave(player.pos, el.glow, 22);
      game.shake = 0.9;
      player.vel.y = 7;
      player.onGround = false;
      break;
    }
    case 'nextOre': game.nextOre = { count: ab.count, mult: ab.mult }; break;
    case 'teleport': {
      particles.emit(player.pos.clone().setY(player.pos.y + 1.3), 80, { ...el.fx, speed: 4 });
      plot.collectPadWorld(player.pos);
      player.vel.set(0, 0, 0);
      particles.emit(player.pos.clone().setY(player.pos.y + 1.3), 80, { ...el.fx, speed: 4 });
      break;
    }
  }
  toast(`${el.icon} ${ab.name}!`, hex(el.glow));
  sendState(true);
}

// ---------------------------------------------------------------------
// Fisika pemain & tabrakan (AABB lokal per plot)
// ---------------------------------------------------------------------
const tmpL = new THREE.Vector3(), tmpW = new THREE.Vector3(), tmpD = new THREE.Vector3();
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3();
const R = 0.45, STEP = 0.55, HEIGHT = 2.6;

function collide(pos) {
  let ground = 0, belt = null;
  for (const plot of plots) {
    if (Math.abs(pos.x - plot.center.x) > 24 || Math.abs(pos.z - plot.center.z) > 24) continue;
    plot.toLocal(pos, tmpL);
    for (const c of plot.colliders) {
      if (tmpL.x < c.x0 - R || tmpL.x > c.x1 + R || tmpL.z < c.z0 - R || tmpL.z > c.z1 + R) continue;
      if (tmpL.y + HEIGHT < c.y0) continue;
      if (c.y1 <= tmpL.y + STEP) {
        // bisa diinjak — hanya jika benar-benar di atasnya (tanpa radius)
        const inside = tmpL.x > c.x0 - 0.15 && tmpL.x < c.x1 + 0.15 && tmpL.z > c.z0 - 0.15 && tmpL.z < c.z1 + 0.15;
        if (inside && c.y1 > ground) { ground = c.y1; belt = c.belt ? plot : null; }
        continue;
      }
      const p0 = tmpL.x - (c.x0 - R), p1 = c.x1 + R - tmpL.x, q0 = tmpL.z - (c.z0 - R), q1 = c.z1 + R - tmpL.z;
      const m = Math.min(p0, p1, q0, q1);
      if (m === p0) tmpL.x -= p0; else if (m === p1) tmpL.x += p1; else if (m === q0) tmpL.z -= q0; else tmpL.z += q1;
    }
    plot.toWorld(tmpL, pos);
  }
  return { ground, belt };
}

function updatePlayer(dt) {
  const el = game.element;
  camYaw -= input.lookX * 0.005;
  camPitch = clamp(camPitch + input.lookY * 0.004, -0.15, 1.3);
  camDist = clamp(camDist + input.zoom * 1.3, 5, 30);

  const mv = input.moveVector();
  const sprint = input.down('ShiftLeft', 'ShiftRight');
  const spMult = passive(el, 'speed') * boost('speed');
  const maxSpeed = (sprint ? 11.5 : 7.5) * spMult;
  fwd.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  right.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
  wish.set(0, 0, 0).addScaledVector(fwd, mv.y).addScaledVector(right, mv.x);
  const acc = player.onGround ? 14 : 4;
  player.vel.x = damp(player.vel.x, wish.x * maxSpeed, acc, dt);
  player.vel.z = damp(player.vel.z, wish.z * maxSpeed, acc, dt);
  if (wish.lengthSq() > 0.01) player.facing = lerpAngle(player.facing, Math.atan2(wish.x, wish.z), 1 - Math.exp(-12 * dt));

  if (input.hit('Space') && player.onGround) {
    player.vel.y = 9.6 * Math.sqrt(passive(el, 'jump') * (boost('speed') > 1 ? 1.6 : 1));
    player.onGround = false;
    sfx.jump();
  }
  if (input.hit('KeyE')) useAbility();
  if (input.hit('KeyR')) respawn();

  player.vel.y -= 26 * dt;
  player.pos.x += (player.vel.x + player.dash.x) * dt;
  player.pos.z += (player.vel.z + player.dash.z) * dt;
  player.dash.multiplyScalar(Math.exp(-5 * dt));

  const col = collide(player.pos);
  if (col.belt && player.onGround) {
    col.belt.localDir(1, 0, tmpD);
    player.pos.addScaledVector(tmpD, BELT_SPEED * dt);
  }
  player.pos.y += player.vel.y * dt;
  if (player.pos.y <= col.ground) {
    player.pos.y = col.ground;
    if (player.vel.y < 0) player.vel.y = 0;
    player.onGround = true;
  } else if (player.pos.y > col.ground + 0.08) {
    player.onGround = false;
  }
  player.pos.x = clamp(player.pos.x, -WORLD_LIMIT, WORLD_LIMIT);
  player.pos.z = clamp(player.pos.z, -WORLD_LIMIT, WORLD_LIMIT);
  if (player.pos.y < -30) respawn();

  const hs = Math.hypot(player.vel.x, player.vel.z);
  player.speed = hs / 7.5;
  const av = player.avatar;
  av.root.position.copy(player.pos);
  av.root.rotation.y = player.facing;
  av.update(dt, player.speed, !player.onGround);

  // aura elemen
  if (Math.random() < dt * 22) {
    particles.emit(tmpW.set(player.pos.x, player.pos.y + 1.2 + Math.random(), player.pos.z), 1, { ...el.fx, spread: 0.6, speed: (el.fx.speed || 1) * 0.4, size: (el.fx.size || 0.4) * 0.7 });
  }
  if (boost('speed') > 1 && hs > 1) particles.emit(tmpW.set(player.pos.x, player.pos.y + 0.5, player.pos.z), 2, { ...el.fx, swirl: 8, speed: 2 });

  // pad beli & pad uang
  const plot = game.plot;
  plot.toLocal(player.pos, tmpL);
  const it = plot.padAt(tmpL);
  if (it) {
    const first = it.id !== game.lastPad;
    game.lastPad = it.id;
    if (!buy(it) && first) { toast(`Butuh ${fmt(priceOf(it))} untuk ${it.name}`, '#ff8a80'); sfx.error(); }
  } else game.lastPad = null;
  if (plot.onCollectPad(tmpL)) collectBank();
  if (plot.has('autocollect') && plot.bank >= 1) { game.cash += plot.bank; plot.bank = 0; }
}

function updateCamera(dt) {
  if (game.state === 'playing') {
    tmpW.copy(player.pos).y += 2.2;
    camTarget.x = damp(camTarget.x, tmpW.x, 18, dt);
    camTarget.z = damp(camTarget.z, tmpW.z, 18, dt);
    camTarget.y = damp(camTarget.y, tmpW.y, 10, dt);
    const cp = Math.cos(camPitch);
    camera.position.set(
      camTarget.x + Math.sin(camYaw) * cp * camDist,
      camTarget.y + Math.sin(camPitch) * camDist,
      camTarget.z + Math.cos(camYaw) * cp * camDist,
    );
    if (camera.position.y < 0.4) camera.position.y = 0.4;
    camLook.copy(camTarget);
  } else {
    let pos, look;
    if (game.state === 'select' && preview) {
      const portrait = innerWidth < innerHeight * 0.9;
      pos = portrait ? new THREE.Vector3(0, 2.6, 18.5) : new THREE.Vector3(-2.3, 2.3, 16);
      look = portrait ? new THREE.Vector3(0, 0.1, 9.5) : new THREE.Vector3(-2.3, 1.5, 9.5);
      preview.root.rotation.y += dt * 0.6;
      preview.update(dt, 0, false);
      const fx = preview.element.fx;
      if (Math.random() < dt * 30) particles.emit(tmpW.set(PREVIEW_POS.x, 1.3 + Math.random(), PREVIEW_POS.z), 1, { ...fx, spread: 0.7, speed: (fx.speed || 1) * 0.5 });
    } else {
      const a = game.t * 0.05;
      pos = new THREE.Vector3(Math.sin(a) * 52, 24, Math.cos(a) * 52);
      look = new THREE.Vector3(0, 3, 0);
    }
    camera.position.x = damp(camera.position.x, pos.x, 2.5, dt);
    camera.position.y = damp(camera.position.y, pos.y, 2.5, dt);
    camera.position.z = damp(camera.position.z, pos.z, 2.5, dt);
    camLook.x = damp(camLook.x, look.x, 3, dt);
    camLook.y = damp(camLook.y, look.y, 3, dt);
    camLook.z = damp(camLook.z, look.z, 3, dt);
  }
  if (game.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * game.shake;
    camera.position.y += (Math.random() - 0.5) * game.shake;
    game.shake = Math.max(0, game.shake - dt * 1.2);
  }
  camera.lookAt(camLook);
}

function updateRemotes(dt) {
  for (const r of remotes.values()) {
    const root = r.avatar.root;
    root.position.x = damp(root.position.x, r.target.x, 12, dt);
    root.position.y = damp(root.position.y, r.target.y, 12, dt);
    root.position.z = damp(root.position.z, r.target.z, 12, dt);
    if (root.position.distanceToSquared(r.target) > 400) root.position.copy(r.target);
    root.rotation.y = lerpAngle(root.rotation.y, r.ry, 1 - Math.exp(-12 * dt));
    r.avatar.update(dt, r.s, r.g);
    if (Math.random() < dt * 10) particles.emit(tmpW.set(root.position.x, root.position.y + 1.2 + Math.random(), root.position.z), 1, { ...r.el.fx, spread: 0.6, speed: (r.el.fx.speed || 1) * 0.4, size: (r.el.fx.size || 0.4) * 0.7 });
  }
}

function sendState(force = false) {
  if (!mp.online || game.state !== 'playing') return;
  const p = player.pos;
  mp.sendState({
    n: game.name, e: game.element.id,
    x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2),
    r: +player.facing.toFixed(2), s: +player.speed.toFixed(2), g: !player.onGround,
    ab: game.abCount, c: Math.floor(game.cash),
  }, force);
}

// ---------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------
let hudTimer = 0, lbTimer = 0;
function updateHud(dt) {
  hudTimer -= dt;
  const el = game.element;
  const cd = game.abilityCd;
  $('abilityBtn').style.setProperty('--p', cd > 0 ? (cd / el.ability.cooldown) : 0);
  $('abCd').textContent = cd > 0 ? Math.ceil(cd) : '';
  $('abilityBtn').classList.toggle('ready', cd <= 0);
  if (hudTimer > 0) return;
  hudTimer = 0.1;
  $('cash').textContent = fmt(game.cash);
  $('income').textContent = `+${fmt(game.income)}/dtk`;
  $('rebirth').textContent = game.rebirths ? `♻ Rebirth ${game.rebirths} · x${rebirthMult().toFixed(1)}` : '';
  const labels = { drop: '⚙ Dropper', value: '💎 Nilai', upg: '🔧 Upgrader', speed: '💨 Kecepatan' };
  const bs = [];
  for (const k of Object.keys(labels)) {
    const b = game.boosts[k];
    if (b && game.t < b.until) bs.push(`<span>${labels[k]} x${b.mult} · ${Math.ceil(b.until - game.t)}d</span>`);
  }
  if (game.nextOre.count > 0) bs.push(`<span>✨ Ore spesial x${game.nextOre.mult} · ${game.nextOre.count} lagi</span>`);
  $('boosts').innerHTML = bs.join('');
  lbTimer -= 0.1;
  if (lbTimer <= 0) { lbTimer = 1; updateLeaderboard(); }
}

// ---------------------------------------------------------------------
// Loop utama
// ---------------------------------------------------------------------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  game.t += dt;

  if (game.state === 'playing') {
    updatePlayer(dt);
    game.abilityCd = Math.max(0, game.abilityCd - dt);
  }
  const mods = game.state === 'playing' ? localMods() : null;
  for (const p of plots) {
    if (p === game.plot) {
      const earned = p.update(dt, game.t, mods);
      game.income = damp(game.income, earned / dt, 0.35, dt);
      p.refreshPads(game.cash, priceMult());
    } else {
      p.update(dt, game.t, p.element ? remoteMods(p.element) : {});
    }
  }
  updateRemotes(dt);
  updateCamera(dt);
  world.update(dt, game.t, game.state === 'playing' ? player.pos : camLook);
  particles.update(dt);
  effects.update(dt);
  if (game.state === 'playing') { updateHud(dt); sendState(); }
  input.endFrame();
  composer.render();
}

$('loading').classList.add('hidden');
show('menu');
loop();
// Debug helper di console: window.game
window.game = game;
game.player = player;
game._handlers = handlers; // untuk debug/tes multiplayer
