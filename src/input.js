// Input keyboard, mouse (drag untuk putar kamera) & sentuh (joystick virtual).
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.lookX = 0; this.lookY = 0; this.zoom = 0;
    this.joy = { x: 0, y: 0 };
    this.pressed = new Set();
    this.enabled = true;

    const typing = () => ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    addEventListener('keydown', (e) => {
      if (typing()) return;
      const k = e.code;
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(k)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // pointer
    const active = new Map();
    const joyEl = document.getElementById('joystick');
    const knob = document.getElementById('joyKnob');
    let joyId = null, joyOrigin = null;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && joyId === null) {
        joyId = e.pointerId;
        joyOrigin = { x: e.clientX, y: e.clientY };
        joyEl.style.left = e.clientX + 'px';
        joyEl.style.top = e.clientY + 'px';
        joyEl.classList.add('on');
        return;
      }
      active.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), mouse: e.pointerType === 'mouse' && e.button === 0 });
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId === joyId) {
        let dx = e.clientX - joyOrigin.x, dy = e.clientY - joyOrigin.y;
        const len = Math.hypot(dx, dy), max = 55;
        if (len > max) { dx = dx / len * max; dy = dy / len * max; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.joy.x = dx / max; this.joy.y = dy / max;
        return;
      }
      const p = active.get(e.pointerId);
      if (!p) return;
      const sens = e.pointerType === 'touch' ? 1.4 : 1;
      this.lookX += (e.clientX - p.x) * sens;
      this.lookY += (e.clientY - p.y) * sens;
      p.x = e.clientX; p.y = e.clientY;
    });
    const end = (e) => {
      if (e.pointerId === joyId) {
        joyId = null; this.joy.x = this.joy.y = 0;
        knob.style.transform = '';
        joyEl.classList.remove('on');
      }
      const p = active.get(e.pointerId);
      if (p && p.mouse && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 6 && performance.now() - p.t < 300) this.pressed.add('Click');
      active.delete(e.pointerId);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => { this.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const btn = (id, code) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.pressed.add(code); this.keys.add(code); });
      const up = () => this.keys.delete(code);
      el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
    };
    btn('btnJump', 'Space');
    btn('abilityBtn', 'KeyE');
    btn('btnAttack', 'KeyQ');
    btn('btnUlt', 'KeyF');
    btn('btnZ', 'KeyZ');
    btn('btnX', 'KeyX');
  }

  down(...codes) { return this.enabled && codes.some((c) => this.keys.has(c)); }
  hit(code) { const h = this.enabled && this.pressed.has(code); return h; }
  endFrame() { this.pressed.clear(); this.lookX = this.lookY = this.zoom = 0; }

  moveVector() {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0, y = 0;
    if (this.down('KeyW', 'ArrowUp')) y += 1;
    if (this.down('KeyS', 'ArrowDown')) y -= 1;
    if (this.down('KeyD', 'ArrowRight')) x += 1;
    if (this.down('KeyA', 'ArrowLeft')) x -= 1;
    x += this.joy.x; y -= this.joy.y;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }
}
