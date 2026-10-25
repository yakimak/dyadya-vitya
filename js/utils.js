'use strict';

/* ============================================================
   ДЯДЯ ВИТЯ И ТИХИЙ БЕРЕГ
   утилиты, палитра, текстуры
   ============================================================ */

const GAME_W = 1280;
const GAME_H = 720;
const TAU = Math.PI * 2;

const FONT_DISPLAY = 'Cormorant Garamond';
const FONT_UI = 'Alegreya Sans';

const PAL = {
  ink: 0x090d16,
  night: 0x0d1322,
  night2: 0x151d33,
  blue: 0x263553,
  slate: 0x3d4d68,
  mist: 0x8fa3bd,
  moon: 0xffefc4,
  cream: 0xf1e4c9,
  amber: 0xffb45e,
  amberDeep: 0xd97a2e,
  gold: 0xd8b06a,
  brown: 0x4a3427,
  wood: 0x5d4030,
  woodLight: 0x8a6244,
  green: 0x51694f,
  greenDeep: 0x2b3c36,
  moss: 0x7e9163,
  honey: 0xf0b34b,
  hop: 0x9aa85c,
  water: 0x4b7186,
  red: 0x8f4438,
  skin: 0xd6a179,
  skinShade: 0xa86e52,
};

/* ---------- математика ---------- */
const U = {
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  invLerp(a, b, v) { return U.clamp((v - a) / (b - a), 0, 1); },
  damp(a, b, lambda, dt) { return U.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
  approach(a, b, delta) {
    if (a < b) return Math.min(a + delta, b);
    return Math.max(a - delta, b);
  },
  smooth(t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
  easeOutCubic(t) { t = U.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
  easeInCubic(t) { t = U.clamp(t, 0, 1); return t * t * t; },
  easeOutBack(t) { t = U.clamp(t, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  pingPong(t) { const m = t % 2; return m > 1 ? 2 - m : m; },
  dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
  rng(seed) { return mulberry32(seed); },
  chance(rng, p) { return rng() < p; },
  pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; },
  pad(n, l) { return String(n).padStart(l, '0'); },
};

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function rgba(hex, a) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function lighten(hex, amount) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  return (r << 16) | (g << 8) | b;
}

function darken(hex, amount) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  r = Math.round(r * (1 - amount)); g = Math.round(g * (1 - amount)); b = Math.round(b * (1 - amount));
  return (r << 16) | (g << 8) | b;
}

function mixColor(hexA, hexB, t) {
  const ar = (hexA >> 16) & 255, ag = (hexA >> 8) & 255, ab = hexA & 255;
  const br = (hexB >> 16) & 255, bg = (hexB >> 8) & 255, bb = hexB & 255;
  return (Math.round(U.lerp(ar, br, t)) << 16) | (Math.round(U.lerp(ag, bg, t)) << 8) | Math.round(U.lerp(ab, bb, t));
}

/* ---------- canvas / текстуры ---------- */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function canvasTexture(w, h, draw) {
  const c = makeCanvas(w, h);
  draw(c.getContext('2d'), c.width, c.height);
  const tex = PIXI.Texture.fromCanvas(c);
  if (tex.baseTexture) tex.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
  return tex;
}

function linearGradientTexture(w, h, stops, vertical) {
  return canvasTexture(w, h, (ctx, cw, ch) => {
    const g = vertical !== false ? ctx.createLinearGradient(0, 0, 0, ch) : ctx.createLinearGradient(0, 0, cw, 0);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  });
}

function radialTexture(size, stops) {
  return canvasTexture(size, size, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

let TEX = null;
function buildTextures() {
  if (TEX) return TEX;
  TEX = {
    glow: radialTexture(256, [
      [0, 'rgba(255,255,255,1)'],
      [0.18, 'rgba(255,255,255,.72)'],
      [0.45, 'rgba(255,255,255,.22)'],
      [0.75, 'rgba(255,255,255,.045)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    glowSoft: radialTexture(256, [
      [0, 'rgba(255,255,255,.55)'],
      [0.4, 'rgba(255,255,255,.18)'],
      [0.75, 'rgba(255,255,255,.03)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    moon: radialTexture(512, [
      [0, 'rgba(255,246,214,1)'],
      [0.34, 'rgba(255,236,185,.99)'],
      [0.41, 'rgba(255,224,158,.55)'],
      [0.65, 'rgba(255,214,146,.13)'],
      [1, 'rgba(255,210,150,0)'],
    ]),
    fog: radialTexture(512, [
      [0, 'rgba(178,198,224,.30)'],
      [0.42, 'rgba(160,182,214,.13)'],
      [0.75, 'rgba(150,175,205,.035)'],
      [1, 'rgba(150,175,205,0)'],
    ]),
    vignette: canvasTexture(GAME_W, GAME_H, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 0.48, h * 0.22, w / 2, h * 0.52, h * 0.88);
      g.addColorStop(0, 'rgba(2,5,10,0)');
      g.addColorStop(0.55, 'rgba(2,5,10,.12)');
      g.addColorStop(0.82, 'rgba(2,5,10,.46)');
      g.addColorStop(1, 'rgba(1,3,7,.78)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const top = ctx.createLinearGradient(0, 0, 0, 120);
      top.addColorStop(0, 'rgba(2,4,9,.5)');
      top.addColorStop(1, 'rgba(2,4,9,0)');
      ctx.fillStyle = top; ctx.fillRect(0, 0, w, 120);
      const bot = ctx.createLinearGradient(0, h - 150, 0, h);
      bot.addColorStop(0, 'rgba(2,4,9,0)');
      bot.addColorStop(1, 'rgba(2,4,9,.45)');
      ctx.fillStyle = bot; ctx.fillRect(0, h - 150, w, 150);
    }),
    grain: canvasTexture(256, 256, (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const rng = mulberry32(9137);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = rng() * 255;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = Math.floor(rng() * 26);
      }
      ctx.putImageData(img, 0, 0);
    }),
    paper: canvasTexture(512, 320, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#dfd0ae'); g.addColorStop(.4, '#e8dcc0');
      g.addColorStop(.75, '#d8c7a2'); g.addColorStop(1, '#cebb95');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const rng = mulberry32(77);
      for (let i = 0; i < 1600; i++) {
        ctx.fillStyle = `rgba(${90 + rng() * 70 | 0},${70 + rng() * 60 | 0},${40 + rng() * 40 | 0},${rng() * .06})`;
        ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
      }
      const v = ctx.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, h * .95);
      v.addColorStop(0, 'rgba(80,55,25,0)'); v.addColorStop(1, 'rgba(70,45,20,.28)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    }),
  };
  return TEX;
}

/* ---------- текст ---------- */
function makeText(str, opts, anchor) {
  const style = Object.assign({
    fontFamily: FONT_UI,
    fontSize: 20,
    fill: PAL.cream,
    align: 'left',
    padding: 4,
  }, opts || {});
  const t = new PIXI.Text(str, style);
  try { t.resolution = 2; } catch (e) { /* старый pixi */ }
  if (anchor !== undefined) {
    if (typeof anchor === 'number') t.anchor.set(anchor);
    else t.anchor.set(anchor[0], anchor[1]);
  }
  return t;
}

function label(str, size, color, opts) {
  return makeText(str, Object.assign({
    fontFamily: FONT_UI,
    fontSize: size,
    fill: color,
    fontWeight: '500',
  }, opts || {}));
}

/* ---------- спрайты ---------- */
function glowSprite(color, size, alpha) {
  const t = buildTextures();
  const s = new PIXI.Sprite(t.glow);
  s.tint = color;
  s.anchor.set(0.5);
  s.width = s.height = size;
  s.alpha = alpha === undefined ? 1 : alpha;
  s.blendMode = PIXI.BLEND_MODES.ADD;
  return s;
}

function softGlow(color, size, alpha) {
  const t = buildTextures();
  const s = new PIXI.Sprite(t.glowSoft);
  s.tint = color;
  s.anchor.set(0.5);
  s.width = s.height = size;
  s.alpha = alpha === undefined ? 1 : alpha;
  s.blendMode = PIXI.BLEND_MODES.ADD;
  return s;
}

function fogSprite(w, h, alpha) {
  const s = new PIXI.Sprite(buildTextures().fog);
  s.anchor.set(0.5);
  s.width = w; s.height = h;
  s.alpha = alpha === undefined ? 0.25 : alpha;
  return s;
}

function makePaperPanel(w, h) {
  const c = new PIXI.Container();
  const bg = new PIXI.Sprite(buildTextures().paper);
  bg.width = w; bg.height = h;
  c.addChild(bg);
  return c;
}

/* ---------- геометрия / рисование ---------- */
function drawStar(g, x, y, r, color, alpha) {
  g.beginFill(color, alpha === undefined ? 1 : alpha);
  g.drawCircle(x, y, r); g.endFill();
}

function rounded(g, x, y, w, h, r) { g.drawRoundedRect(x, y, w, h, r); }

function circle(g, x, y, r, color, alpha) {
  g.lineStyle(0, 0, 0);
  g.beginFill(color, alpha === undefined ? 1 : alpha);
  g.drawCircle(x, y, r); g.endFill();
}

function rect(g, x, y, w, h, color, alpha) {
  g.lineStyle(0, 0, 0);
  g.beginFill(color, alpha === undefined ? 1 : alpha);
  g.drawRect(x, y, w, h); g.endFill();
}

function line(g, x1, y1, x2, y2, w, color, alpha) {
  g.lineStyle(w, color, alpha === undefined ? 1 : alpha);
  g.moveTo(x1, y1); g.lineTo(x2, y2);
}

function poly(g, pts, color, alpha) {
  const flat = [];
  for (let i = 0; i < pts.length; i++) flat.push(pts[i][0], pts[i][1]);
  g.lineStyle(0, 0, 0);
  g.beginFill(color, alpha === undefined ? 1 : alpha);
  g.drawPolygon(flat); g.endFill();
}

function ellipse(g, x, y, w, h, color, alpha) {
  g.lineStyle(0, 0, 0);
  g.beginFill(color, alpha === undefined ? 1 : alpha);
  g.drawEllipse(x, y, w, h); g.endFill();
}

/* ---------- ввод ---------- */
class Input {
  constructor() {
    this.keys = Object.create(null);
    this.pressed = Object.create(null);
    this.released = Object.create(null);
    this.anyKey = false;
    window.addEventListener('keydown', (e) => {
      const k = e.code || e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Tab'].includes(k)) e.preventDefault();
      if (!this.keys[k]) {
        this.pressed[k] = true;
        this.anyKey = true;
      }
      this.keys[k] = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = e.code || e.key;
      this.keys[k] = false;
      this.released[k] = true;
    });
    window.addEventListener('blur', () => { this.keys = Object.create(null); });
  }
  isDown(...codes) { return codes.some(c => !!this.keys[c]); }
  wasPressed(...codes) { return codes.some(c => !!this.pressed[c]); }
  clear() { this.pressed = Object.create(null); this.released = Object.create(null); this.anyKey = false; }
  left() { return this.isDown('ArrowLeft', 'KeyA'); }
  right() { return this.isDown('ArrowRight', 'KeyD'); }
  jump() { return this.isDown('Space', 'KeyW', 'ArrowUp', 'KeyZ'); }
  jumpPressed() { return this.wasPressed('Space', 'KeyW', 'ArrowUp', 'KeyZ'); }
  interactPressed() { return this.wasPressed('KeyE', 'Enter', 'NumpadEnter', 'MouseInteract'); }
  pausePressed() { return this.wasPressed('Escape', 'KeyP'); }
}

/* ---------- мелочи ---------- */
function exists(v) { return v !== undefined && v !== null; }

function makeSparkle(x, y, color, size) {
  const s = new PIXI.Sprite(buildTextures().glow);
  s.tint = color;
  s.anchor.set(0.5);
  s.width = s.height = size || 20;
  s.blendMode = PIXI.BLEND_MODES.ADD;
  s.x = x; s.y = y;
  return s;
}
