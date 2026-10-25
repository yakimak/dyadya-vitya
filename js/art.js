'use strict';

/* ============================================================
   Вся графика рисуется процедурно: избы, берёзы, ульи, река,
   персонажи и портреты. Никаких тяжёлых спрайтов.
   ============================================================ */

/* ============================================================
   СТАТИЧЕСКИЙ МИР
   ============================================================ */

function drawIzba(g, x, baseY, w, h) {
  // сруб
  const top = baseY - h;
  rect(g, x, top, w, h, 0x2a211c);
  const rows = Math.floor(h / 16);
  for (let i = 0; i < rows; i++) {
    const y = top + i * 16;
    rect(g, x, y, w, 13, i % 2 ? 0x33281f : 0x2b221c);
    line(g, x, y + 13, x + w, y + 13, 1, 0x17110e, 0.8);
    for (let k = 0; k < 3; k++) {
      const sx = x + ((i * 37 + k * 71) % (w - 20)) + 10;
      line(g, sx, y + 3, sx + 16, y + 3, 1, 0x453425, 0.5);
    }
  }
  // угловые брёвна
  for (let i = 0; i < rows + 1; i++) {
    const y = top + i * 16;
    circle(g, x + 4, y, 6, 0x3a2b20);
    circle(g, x + w - 4, y, 6, 0x3a2b20);
    circle(g, x + 4, y, 5, 0x4a3728);
    circle(g, x + w - 4, y, 5, 0x4a3728);
  }
  // крыша
  poly(g, [
    [x - 26, top + 15], [x + w * 0.48, top - 58], [x + w + 26, top + 15], [x + w + 18, top + 30], [x + w * 0.48, top - 38], [x - 18, top + 30],
  ], 0x1b2025);
  poly(g, [
    [x - 26, top + 15], [x + w * 0.48, top - 58], [x + w + 26, top + 15], [x + w + 20, top + 22], [x + w * 0.48, top - 48], [x - 20, top + 22],
  ], 0x2b3339, 0.55);
  line(g, x - 26, top + 15, x + w * 0.48, top - 58, 1.5, 0x6b7b83, 0.3);
  // труба
  rect(g, x + w * 0.68, top - 34, 18, 38, 0x231c19);
  rect(g, x + w * 0.68 - 3, top - 36, 24, 7, 0x382b23);
  // окно
  const wx = x + w * 0.55, wy = top + h * 0.42, ww = 40, wh = 44;
  rect(g, wx - 3, wy - 3, ww + 6, wh + 6, 0x17120f);
  rect(g, wx, wy, ww, wh, 0xd69043, 0.9);
  rect(g, wx + 4, wy + 4, ww - 8, wh - 8, 0xffc46e, 0.75);
  line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, 2.5, 0x241a13);
  line(g, wx, wy + wh / 2, wx + ww, wy + wh / 2, 2.5, 0x241a13);
  rect(g, wx - 5, wy + wh + 2, ww + 10, 5, 0x4e3a29);
  // дверь
  const dx = x + w * 0.18, dw = 34, dh = 58;
  rect(g, dx, baseY - dh, dw, dh, 0x241a15);
  rect(g, dx + 4, baseY - dh + 4, dw - 8, dh - 6, 0x3d2a1e);
  circle(g, dx + dw - 9, baseY - dh / 2, 2, 0xc9a25c);
  // наличники
  line(g, dx - 4, baseY - dh + 2, dx - 4, baseY - 4, 2, 0x5d4430);
  line(g, dx + dw + 2, baseY - dh + 2, dx + dw + 2, baseY - 4, 2, 0x5d4430);
  // крыльцо
  rect(g, dx - 10, baseY - 4, dw + 20, 5, 0x423023);
  line(g, dx - 10, baseY + 1, dx - 12, baseY + 1, 2, 0x1a1410);
  // резьба
  line(g, wx - 8, wy - 8, wx + ww + 8, wy - 8, 2, 0x4c3626);
  for (let i = 0; i < 4; i++) {
    circle(g, wx - 6 + i * ((ww + 12) / 3), wy - 11, 2.4, 0x5e4430);
  }
}

function drawWindowGlow(container, x, y, scale, color, alpha) {
  const glow = softGlow(color || 0xffb35c, 130 * (scale || 1), alpha === undefined ? 0.5 : alpha);
  glow.x = x; glow.y = y;
  container.addChild(glow);
  return glow;
}

function drawBrewery(g, x, baseY, w, h, lights) {
  const top = baseY - h;
  // основной сруб
  rect(g, x, top, w, h, 0x2c221a);
  for (let i = 0; i < h / 18; i++) {
    const y = top + i * 18;
    rect(g, x, y, w, 15, i % 2 ? 0x36291d : 0x2e231a);
    line(g, x, y + 16, x + w, y + 16, 1, 0x160f0b, 0.8);
  }
  // высокий фронтон
  poly(g, [
    [x - 38, top + 10], [x + w * 0.5, top - 96], [x + w + 38, top + 10],
    [x + w + 28, top + 26], [x + w * 0.5, top - 76], [x - 28, top + 26],
  ], 0x1b1e21);
  poly(g, [
    [x - 38, top + 10], [x + w * 0.5, top - 96], [x + w + 38, top + 10],
    [x + w + 32, top + 16], [x + w * 0.5, top - 86], [x - 32, top + 16],
  ], 0x333c3e, 0.35);
  line(g, x - 36, top + 10, x + w * 0.5, top - 94, 2, 0x7c8b87, 0.18);
  // дранка на крыше
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const lx = U.lerp(x - 36, x + w * 0.5, t);
    const rx = U.lerp(x + w + 36, x + w * 0.5, t);
    const yy = U.lerp(top + 10, top - 92, t);
    line(g, lx, yy, rx, yy, 1, 0x505957, 0.18);
  }
  line(g, x + w * 0.5, top - 96, x + w * 0.5, top + 8, 1, 0x0f1213, 0.35);
  // труба
  rect(g, x + 118, top - 72, 22, 54, 0x1f1a16);
  rect(g, x + 114, top - 76, 30, 8, 0x372a20);
  line(g, x + 114, top - 76, x + 144, top - 76, 1, 0x7a6a56, 0.35);
  // фахверковые балки
  for (let i = 0; i <= 4; i++) {
    line(g, x + 20 + i * (w - 40) / 4, top + 22, x + 20 + i * (w - 40) / 4, baseY, 4, 0x1e1712, 0.55);
  }
  line(g, x + 16, top + h * 0.45, x + w - 16, top + h * 0.45, 4, 0x1e1712, 0.5);
  // большие окна
  const wins = [[x + 52, top + 52, 74, 66], [x + w - 132, top + 52, 74, 66]];
  wins.forEach(([wx, wy, ww, wh]) => {
    rect(g, wx - 4, wy - 4, ww + 8, wh + 8, 0x17110d);
    rect(g, wx, wy, ww, wh, 0xffb54f, 0.92);
    rect(g, wx + 5, wy + 5, ww - 10, wh - 10, 0xffd489, 0.8);
    line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, 3, 0x261a11);
    line(g, wx, wy + wh / 2, wx + ww, wy + wh / 2, 3, 0x261a11);
    if (lights) lights.push([wx + ww / 2, wy + wh / 2, 170]);
  });
  // дверь по центру
  const dw = 66, dh = 96, dx = x + w / 2 - dw / 2;
  rect(g, dx - 5, baseY - dh - 5, dw + 10, dh + 5, 0x170f0b);
  rect(g, dx, baseY - dh, dw, dh, 0x6b4529);
  rect(g, dx + 5, baseY - dh + 5, dw - 10, dh - 5, 0x442a1b);
  rect(g, dx + 12, baseY - dh + 14, dw - 24, dh - 30, 0xffb857, 0.55);
  circle(g, dx + dw - 12, baseY - dh / 2, 3.2, 0xe0b66a);
  // навес
  poly(g, [[dx - 20, baseY - dh - 12], [dx + dw + 20, baseY - dh - 12], [dx + dw + 26, baseY - dh], [dx - 26, baseY - dh]], 0x1e1712);
  // вывеска
  const sx = x + w / 2 - 92, sy = top + h * 0.24;
  rect(g, sx - 4, sy - 4, 192, 46, 0x21170f);
  rect(g, sx, sy, 184, 38, 0x4a3420);
  for (let i = 0; i < 18; i++) circle(g, sx + 8 + i * 10, sy + 4, 2, 0x6e5130, 0.8);
  // гирлянда
  if (lights) {
    for (let i = 0; i <= 14; i++) {
      const lx = x + 30 + i * (w - 60) / 14;
      const ly = top + 12 + Math.sin(i / 14 * Math.PI) * 20;
      lights.push([lx, ly, 40, 0xffc978]);
    }
  }
  // бочки у стены
  drawBarrel(g, x + 18, baseY, 30, 42);
  drawBarrel(g, x + w - 56, baseY, 34, 48);
  drawBarrel(g, x + w - 96, baseY, 26, 36);
}

function drawKettle(g, x, baseY, scale) {
  const s = scale || 1;
  const w = 100 * s, h = 76 * s;
  // ножки
  line(g, x - w * 0.34, baseY, x - w * 0.3, baseY - h * 0.2, 5 * s, 0x2f2019);
  line(g, x + w * 0.34, baseY, x + w * 0.3, baseY - h * 0.2, 5 * s, 0x2f2019);
  // топка
  rect(g, x - 23 * s, baseY - 22 * s, 46 * s, 22 * s, 0x241914);
  rect(g, x - 14 * s, baseY - 17 * s, 28 * s, 15 * s, 0xff8438, 0.9);
  rect(g, x - 9 * s, baseY - 14 * s, 18 * s, 10 * s, 0xffd27a, 0.8);
  circle(g, x - 8 * s, baseY - 10 * s, 7 * s, 0xff9b3f, 0.25);
  circle(g, x + 7 * s, baseY - 8 * s, 5 * s, 0xffb14e, 0.2);
  // брюхо
  ellipse(g, x, baseY - h * 0.56, w * 0.54, h * 0.5, 0x5c3a24);
  ellipse(g, x, baseY - h * 0.57, w * 0.5, h * 0.45, 0xa96938);
  ellipse(g, x - w * 0.13, baseY - h * 0.66, w * 0.2, h * 0.23, 0xd08a4b, 0.4);
  ellipse(g, x + w * 0.15, baseY - h * 0.44, w * 0.17, h * 0.16, 0x5d3a24, 0.28);
  // нижний обруч и заклёпки
  line(g, x - w * 0.44, baseY - h * 0.23, x + w * 0.44, baseY - h * 0.23, 3 * s, 0x3e2a1c, 0.8);
  for (let i = 0; i < 6; i++) {
    const a = -0.85 + i * 0.34;
    circle(g, x + Math.cos(a) * w * 0.38, baseY - h * 0.23 - Math.sin(a) * 2, 1.6 * s, 0xc58a51, 0.5);
  }
  // вертикальные медные швы
  g.lineStyle(1.5 * s, 0xe0a05e, 0.2);
  g.moveTo(x - w * 0.24, baseY - h * 0.83);
  g.bezierCurveTo(x - w * 0.34, baseY - h * 0.62, x - w * 0.36, baseY - h * 0.38, x - w * 0.27, baseY - h * 0.2);
  g.moveTo(x + w * 0.18, baseY - h * 0.84);
  g.bezierCurveTo(x + w * 0.3, baseY - h * 0.62, x + w * 0.31, baseY - h * 0.38, x + w * 0.22, baseY - h * 0.2);
  // горловина и крышка
  rect(g, x - 16 * s, baseY - h * 0.9, 32 * s, 12 * s, 0x6d4629);
  line(g, x - 16 * s, baseY - h * 0.9, x + 16 * s, baseY - h * 0.9, 2 * s, 0x3e2a1c);
  ellipse(g, x, baseY - h * 0.93, w * 0.37, h * 0.1, 0x4d3120);
  ellipse(g, x, baseY - h * 0.95, w * 0.34, h * 0.08, 0xb97742);
  circle(g, x, baseY - h * 1.0, 4.5 * s, 0x5c3a24);
  circle(g, x, baseY - h * 1.01, 2.4 * s, 0xd99c58, 0.8);
  // ручки
  g.lineStyle(4.5 * s, 0x53351f, 1);
  g.moveTo(x - w * 0.45, baseY - h * 0.74);
  g.lineTo(x - w * 0.55, baseY - h * 0.7);
  g.lineTo(x - w * 0.45, baseY - h * 0.63);
  g.moveTo(x + w * 0.45, baseY - h * 0.74);
  g.lineTo(x + w * 0.55, baseY - h * 0.7);
  g.lineTo(x + w * 0.45, baseY - h * 0.63);
  // краник
  rect(g, x + w * 0.34, baseY - h * 0.38, 12 * s, 4 * s, 0x4a2e1c);
  rect(g, x + w * 0.43, baseY - h * 0.37, 4 * s, 13 * s, 0x3e2a1c);
  circle(g, x + w * 0.455, baseY - h * 0.2, 2.5 * s, 0x2d1e14);
  // пар
  for (let i = 0; i < 3; i++) {
    const px = x - 12 + i * 12, py = baseY - h * 1.06 - i * 8;
    circle(g, px, py, 7 + i * 2, 0xdfe8ea, 0.07);
    circle(g, px + 5, py - 16, 10 + i, 0xdfe8ea, 0.035);
  }
}

function drawFence(g, x1, x2, baseY, color) {
  const c = color || 0x3a2d21;
  const n = Math.max(2, Math.round((x2 - x1) / 34));
  for (let i = 0; i <= n; i++) {
    const x = U.lerp(x1, x2, i / n);
    const lean = Math.sin(i * 2.7) * 1.5;
    rect(g, x + lean, baseY - 40, 6, 42, c);
    poly(g, [[x + lean, baseY - 40], [x + lean + 3, baseY - 47], [x + lean + 6, baseY - 40]], c);
  }
  line(g, x1, baseY - 30, x2, baseY - 30, 4, c);
  line(g, x1, baseY - 15, x2, baseY - 15, 3.5, c);
  line(g, x1, baseY - 31, x2, baseY - 31, 1, 0x6d5b47, 0.35);
}

function drawWell(g, x, baseY) {
  ellipse(g, x, baseY, 52, 12, 0x201813, 0.6);
  // сруб
  rect(g, x - 30, baseY - 42, 60, 42, 0x3a2b1f);
  for (let i = 0; i < 4; i++) line(g, x - 30, baseY - 10 - i * 10, x + 30, baseY - 10 - i * 10, 2, 0x231a13);
  rect(g, x - 34, baseY - 47, 68, 7, 0x4b3726);
  // столбы и крыша
  line(g, x - 26, baseY - 44, x - 26, baseY - 82, 5, 0x3e2e21);
  line(g, x + 26, baseY - 44, x + 26, baseY - 82, 5, 0x3e2e21);
  poly(g, [[x - 42, baseY - 80], [x, baseY - 104], [x + 42, baseY - 80], [x + 36, baseY - 86], [x, baseY - 96], [x - 36, baseY - 86]], 0x232a2c);
  line(g, x - 50, baseY - 80, x, baseY - 104, 2, 0x8a9a9e, 0.25);
  // ворот
  line(g, x - 22, baseY - 66, x + 22, baseY - 66, 3, 0x5a4330);
  line(g, x, baseY - 66, x, baseY - 42, 1.5, 0x8c7455);
  circle(g, x, baseY - 44, 4, 0x5a4330);
}

function drawBoat(g, x, waterY) {
  // лодка у берега
  poly(g, [
    [x - 58, waterY - 18], [x + 58, waterY - 18], [x + 42, waterY + 8], [x - 38, waterY + 8],
  ], 0x3d2c1d);
  poly(g, [
    [x - 50, waterY - 15], [x + 50, waterY - 15], [x + 36, waterY + 2], [x - 32, waterY + 2],
  ], 0x2a1d14);
  line(g, x - 56, waterY - 17, x + 56, waterY - 17, 3, 0x6e5236);
  line(g, x - 46, waterY - 4, x + 44, waterY - 4, 1.5, 0x5d452f, 0.7);
  // банка
  line(g, x - 16, waterY - 15, x - 16, waterY + 2, 3, 0x755838);
  line(g, x + 22, waterY - 15, x + 22, waterY + 2, 3, 0x755838);
  // весло
  line(g, x - 24, waterY - 12, x + 62, waterY - 32, 3, 0x8b7048);
  poly(g, [[x + 62, waterY - 32], [x + 74, waterY - 36], [x + 66, waterY - 27]], 0x8b7048);
  // верёвка
  g.lineStyle(1.2, 0x9d895f, 0.7);
  g.moveTo(x - 50, waterY - 18);
  g.quadraticCurveTo(x - 78, waterY - 28, x - 92, waterY - 4);
  // отблеск
  ellipse(g, x, waterY + 10, 96, 7, 0x8bb2c0, 0.08);
}

function drawBarrel(g, x, baseY, w, h) {
  ellipse(g, x, baseY, w * 0.56, 4, 0x140f0c, 0.6);
  poly(g, [
    [x - w / 2, baseY - 4], [x - w / 2 + 3, baseY - h + 6], [x + w / 2 - 3, baseY - h + 6], [x + w / 2, baseY - 4],
    [x + w / 2 - 5, baseY], [x - w / 2 + 5, baseY],
  ], 0x4a3323);
  ellipse(g, x, baseY - h + 5, w / 2 - 3, 5, 0x6b4a2f);
  line(g, x - w / 2 + 2, baseY - h * 0.7, x + w / 2 - 2, baseY - h * 0.7, 2.5, 0x2a1d14);
  line(g, x - w / 2 + 1, baseY - h * 0.35, x + w / 2 - 1, baseY - h * 0.35, 2.5, 0x2a1d14);
  line(g, x - w / 2 + 6, baseY - h * 0.5, x - w / 2 + 6, baseY - h * 0.45, 2, 0x8f6b46, 0.4);
}

function drawCrates(g, x, baseY, n, size) {
  let y = baseY;
  for (let i = 0; i < n; i++) {
    const w = size - i * 4, h = size * 0.7;
    rect(g, x - w / 2, y - h, w, h, 0x4a3624);
    rect(g, x - w / 2 + 3, y - h + 3, w - 6, h - 6, 0x5b432c);
    line(g, x - w / 2 + 4, y - h + 4, x + w / 2 - 4, y - 4, 2, 0x3a2a1c);
    line(g, x + w / 2 - 4, y - h + 4, x - w / 2 + 4, y - 4, 2, 0x3a2a1c);
    y -= h - 2;
  }
}

function drawWoodpile(g, x, baseY) {
  const rng = mulberry32(4242);
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 6 - row; i++) {
      const cx = x + i * 18 + row * 9;
      const cy = baseY - 8 - row * 15;
      circle(g, cx, cy, 8, 0x3b2b1d);
      circle(g, cx, cy, 6.5, 0x6b4c32);
      circle(g, cx + 1, cy, 3, 0x8c6a43, 0.5);
      line(g, cx + 2, cy - 4, cx + 2, cy + 4, 1, 0x4a3322, 0.6);
    }
  }
}

function drawSign(g, x, baseY, w, h) {
  line(g, x - 22, baseY, x - 22, baseY - 80, 5, 0x3b2c1f);
  line(g, x + w + 22, baseY, x + w + 22, baseY - 80, 5, 0x3b2c1f);
  rect(g, x - 4, baseY - 92, w + 8, h + 8, 0x23180f);
  rect(g, x, baseY - 88, w, h, 0x5a4128);
  for (let i = 0; i < 8; i++) line(g, x + 8, baseY - 80 + i * 8, x + w - 8, baseY - 80 + i * 8, 1, 0x4a3320, 0.35);
  // гвозди
  circle(g, x + 7, baseY - 82, 2, 0x1d150f);
  circle(g, x + w - 7, baseY - 82, 2, 0x1d150f);
}

function drawLanternPost(g, x, baseY, lit) {
  const c = 0x2c2b2c;
  circle(g, x, baseY, 12, 0x10141b, 0.4);
  rect(g, x - 3, baseY - 92, 6, 92, c);
  // кронштейн
  line(g, x, baseY - 88, x + 20, baseY - 88, 4, c);
  line(g, x + 20, baseY - 88, x + 20, baseY - 78, 2, c);
  // фонарь
  const lx = x + 20, ly = baseY - 60;
  rect(g, lx - 10, ly - 16, 20, 26, 0x1c1d20);
  rect(g, lx - 7, ly - 13, 14, 20, lit ? 0xffd48a : 0x37404c);
  poly(g, [[lx - 13, ly - 16], [lx + 13, ly - 16], [lx + 9, ly - 22], [lx - 9, ly - 22]], 0x2e3034);
  circle(g, lx, ly - 24, 3, 0x2e3034);
  line(g, lx - 10, ly + 10, lx + 10, ly + 10, 3, 0x2e3034);
  if (lit) {
    rect(g, lx - 6, ly - 11, 12, 17, 0xffe6a8, 0.9);
  }
}

function drawBirch(g, x, baseY, h, seed, opts) {
  const rng = mulberry32(seed || 1);
  const lean = (rng() - 0.5) * 10;
  const topX = x + lean;
  const dark = opts && opts.silhouette;
  const trunkColor = dark ? 0x26303a : 0x8d9080;
  const trunkShade = dark ? 0x1c242c : 0x5e675e;
  const w = 7 + rng() * 4;

  // ствол
  poly(g, [
    [x - w / 2, baseY], [topX - w * 0.24, baseY - h * 0.55], [topX - w * 0.1, baseY - h], [topX + w * 0.12, baseY - h],
    [topX + w * 0.3, baseY - h * 0.55], [x + w / 2, baseY],
  ], trunkColor);
  poly(g, [[x + 1, baseY], [topX + w * 0.1, baseY - h * 0.6], [topX + w * 0.11, baseY - h], [topX + w * 0.3, baseY - h * 0.55], [x + w / 2, baseY]], trunkShade, 0.8);
  // чёрточки
  if (!dark) {
    for (let i = 0; i < 9; i++) {
      const t = 0.1 + rng() * 0.75;
      const yy = baseY - h * t;
      const xx = U.lerp(x, topX, t) + (rng() - 0.5) * w * 0.7;
      line(g, xx, yy, xx + 3 + rng() * 6, yy + 1, 1.4, 0x2a2a28, 0.65);
    }
  }
  // ветки
  const branches = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < branches; i++) {
    const t = 0.35 + rng() * 0.6;
    const yy = baseY - h * t;
    const xx = U.lerp(x, topX, t);
    const dir = i % 2 ? 1 : -1;
    const len = 20 + rng() * 34;
    line(g, xx, yy, xx + dir * len, yy - 12 - rng() * 22, 2.2, trunkShade, dark ? 0.9 : 0.85);
    line(g, xx + dir * len * 0.5, yy - 8, xx + dir * len, yy - 40 - rng() * 10, 1.2, trunkShade, 0.6);
  }
  // листва
  const leaves = dark ? 3 : 7;
  for (let i = 0; i < leaves; i++) {
    const t = 0.62 + rng() * 0.36;
    const yy = baseY - h * t;
    const xx = topX + (rng() - 0.5) * 80;
    const r = 16 + rng() * 24;
    if (dark) {
      circle(g, xx, yy, r, 0x18222a, 0.9);
    } else {
      circle(g, xx, yy, r, 0x1f2b24, 0.92);
      for (let k = 0; k < 5; k++) {
        circle(
          g,
          xx + (rng() - 0.5) * r * 1.3,
          yy + (rng() - 0.5) * r * 1.1,
          r * (0.28 + rng() * 0.3),
          k % 2 ? 0x26352a : 0x2d3b2b,
          0.55
        );
      }
      circle(g, xx - r * 0.2, yy - r * 0.3, r * 0.55, 0x3a4834, 0.25);
      if (rng() < 0.5) circle(g, xx + r * 0.35, yy - r * 0.4, r * 0.2, 0x9a8a58, 0.25);
    }
  }
}

function drawPine(g, x, baseY, h, seed, dark) {
  const rng = mulberry32(seed || 2);
  const c1 = dark ? 0x121c22 : 0x1b2a2a;
  const c2 = dark ? 0x17242b : 0x26382f;
  line(g, x, baseY, x, baseY - h, 4, 0x241f1a);
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const yy = baseY - h * (0.25 + t * 0.72);
    const w = (1 - t) * 48 + 10;
    poly(g, [[x, yy - 40], [x - w, yy + 12], [x + w, yy + 12]], c1);
    poly(g, [[x, yy - 30], [x - w * 0.72, yy + 7], [x + w * 0.72, yy + 7]], c2, 0.7);
    if (rng() < 0.7) line(g, x - w * 0.7, yy + 8, x + w * 0.2, yy + 8, 1, 0x8ba19b, 0.12);
  }
}

function drawBush(g, x, baseY, s, seed) {
  const rng = mulberry32(seed || 3);
  for (let i = 0; i < 5; i++) {
    const bx = x + (rng() - 0.5) * 50 * s;
    const by = baseY - rng() * 22 * s;
    const r = (16 + rng() * 16) * s;
    circle(g, bx, by, r, 0x26352c, 0.85);
    circle(g, bx - 3, by - 4, r * 0.6, 0x3a4a37, 0.5);
  }
  ellipse(g, x, baseY, 70 * s, 10 * s, 0x0d1315, 0.4);
}

function drawReeds(g, x, baseY, seed) {
  const rng = mulberry32(seed || 4);
  for (let i = 0; i < 12; i++) {
    const xx = x + (rng() - 0.5) * 90;
    const h = 24 + rng() * 46;
    line(g, xx, baseY, xx + (rng() - 0.5) * 16, baseY - h, 1.6, 0x4a4b38, 0.9);
    rect(g, xx - 2 + (rng() - 0.5) * 10, baseY - h - 8, 4, 9, 0x6a5a3a, 0.85);
  }
}

function drawStones(g, x, baseY, seed, n) {
  const rng = mulberry32(seed || 5);
  for (let i = 0; i < (n || 4); i++) {
    const xx = x + (rng() - 0.5) * 60;
    const r = 5 + rng() * 10;
    ellipse(g, xx, baseY - r * 0.2, r, r * 0.6, 0x39434b, 0.9);
    ellipse(g, xx - 2, baseY - r * 0.4, r * 0.6, r * 0.3, 0x6c7a80, 0.3);
  }
}

function drawMushrooms(g, x, baseY, seed) {
  const rng = mulberry32(seed || 6);
  for (let i = 0; i < 3; i++) {
    const xx = x + (rng() - 0.5) * 24;
    const h = 5 + rng() * 8;
    rect(g, xx, baseY - h, 2.5, h, 0xd7cbb0, 0.8);
    ellipse(g, xx + 1, baseY - h, 5 + rng() * 3, 3, 0xb8623e, 0.85);
  }
}

function drawBees(container, x, y, count) {
  const bees = [];
  for (let i = 0; i < count; i++) {
    const b = new PIXI.Graphics();
    b.beginFill(0xffd06a); b.drawEllipse(0, 0, 2.4, 1.4); b.endFill();
    b.beginFill(0x2a2118); b.drawRect(-0.6, -1.2, 1, 2.4); b.endFill();
    b.x = x; b.y = y;
    container.addChild(b);
    bees.push({ g: b, ox: x, oy: y, ph: Math.random() * TAU, amp: 8 + Math.random() * 18, sp: 0.5 + Math.random() * 0.7 });
  }
  return bees;
}

function drawHive(g, x, baseY) {
  rect(g, x - 24, baseY - 52, 48, 52, 0x5d4930);
  rect(g, x - 27, baseY - 56, 54, 9, 0x3f3121);
  for (let i = 0; i < 4; i++) line(g, x - 24, baseY - 10 - i * 12, x + 24, baseY - 10 - i * 12, 1.5, 0x3c2d1e, 0.7);
  rect(g, x - 8, baseY - 8, 16, 4, 0x17110c);
  poly(g, [[x - 30, baseY - 56], [x - 16, baseY - 68], [x + 16, baseY - 68], [x + 30, baseY - 56]], 0x3c3326);
  line(g, x - 16, baseY - 68, x + 16, baseY - 68, 2, 0x7e735e, 0.3);
}

function drawHive2(g, x, baseY) {
  // улей-колода
  rect(g, x - 20, baseY - 60, 40, 60, 0x4b3a26);
  for (let i = 0; i < 5; i++) line(g, x - 20, baseY - 10 - i * 11, x + 20, baseY - 10 - i * 11, 1.5, 0x322515, 0.8);
  circle(g, x, baseY - 32, 5, 0x17100b);
  poly(g, [[x - 26, baseY - 58], [x - 12, baseY - 70], [x + 12, baseY - 70], [x + 26, baseY - 58]], 0x3a3124);
  line(g, x - 10, baseY - 70, x + 10, baseY - 70, 2, 0x675c49, 0.3);
}

function drawHopVines(g, x, topY, bottomY, seed) {
  const rng = mulberry32(seed || 7);
  for (let i = 0; i < 5; i++) {
    const xx = x + (rng() - 0.5) * 40;
    g.lineStyle(1.5, 0x3e4a31, 0.9);
    g.moveTo(xx, topY);
    g.bezierCurveTo(xx + 15, topY + 40, xx - 18, bottomY - 50, xx + (rng() - 0.5) * 20, bottomY);
    for (let k = 0; k < 4; k++) {
      const t = 0.2 + k * 0.2;
      drawHop(g, xx + Math.sin(t * 8 + i) * 10, U.lerp(topY, bottomY, t), 0.55 + rng() * 0.3, 0x6f7c42);
    }
  }
}

function drawHop(g, x, y, s, color) {
  s = s || 1;
  g.beginFill(color || 0x8b9a57, 0.95);
  g.drawEllipse(x, y, 10 * s, 16 * s);
  g.endFill();
  g.beginFill(0x6f7d45, 0.7);
  for (let i = 0; i < 4; i++) {
    g.drawEllipse(x + Math.sin(i * 2.1) * 3 * s, y - 6 * s + i * 4 * s, 6 * s, 3.4 * s);
  }
  g.endFill();
  g.beginFill(0xb5b97b, 0.5);
  g.drawEllipse(x - 2 * s, y - 5 * s, 3 * s, 8 * s);
  g.endFill();
  line(g, x, y - 16 * s, x + 4 * s, y - 24 * s, 1.2 * s, 0x5d6838);
  g.beginFill(0x7d8a4e, 0.8);
  g.drawEllipse(x + 4 * s, y - 18 * s, 5 * s, 2.4 * s);
  g.endFill();
}

/* ---------- иконки HUD ---------- */
function drawHopIcon(g, x, y, s, color) {
  s = s || 1;
  g.beginFill(color || 0x9eac61, 0.95);
  g.drawEllipse(x, y + 3, 8 * s, 13 * s);
  g.endFill();
  g.beginFill(0x76854b, 0.95);
  for (let i = 0; i < 3; i++) g.drawEllipse(x + Math.sin(i * 1.8) * 2.4 * s, y - 2 * s + i * 4 * s, 5.4 * s, 3 * s);
  g.endFill();
  g.beginFill(0xc4c68c, 0.6);
  g.drawEllipse(x - 2 * s, y - 2 * s, 2.6 * s, 7 * s);
  g.endFill();
  line(g, x, y - 10 * s, x + 3 * s, y - 17 * s, 1.3 * s, 0x65713e);
  g.beginFill(0x849154, 0.8);
  g.drawEllipse(x + 4 * s, y - 13 * s, 4.5 * s, 2 * s);
  g.endFill();
}

function drawHoneyIcon(g, x, y, s) {
  s = s || 1;
  g.beginFill(0x2f2a25, 0.9);
  g.drawRoundedRect(x - 9 * s, y - 12 * s, 18 * s, 24 * s, 3 * s);
  g.endFill();
  g.beginFill(0xf0b34b, 0.95);
  g.drawRoundedRect(x - 7 * s, y - 8 * s, 14 * s, 18 * s, 2 * s);
  g.endFill();
  g.beginFill(0xffd780, 0.6);
  g.drawRoundedRect(x - 5 * s, y - 6 * s, 3.5 * s, 12 * s, 1.5 * s);
  g.endFill();
  g.beginFill(0x5a3b22, 1);
  g.drawRoundedRect(x - 10 * s, y - 14 * s, 20 * s, 5 * s, 2 * s);
  g.endFill();
  g.beginFill(0x8a5f36, 1);
  g.drawRoundedRect(x - 11 * s, y - 16 * s, 22 * s, 3 * s, 1.5 * s);
  g.endFill();
  g.beginFill(0xe8c990, 0.8);
  g.drawRect(x - 4 * s, y + 9 * s, 8 * s, 3 * s);
  g.endFill();
}

function drawWaterIcon(g, x, y, s) {
  s = s || 1;
  g.beginFill(0x9fbfc9, 0.35);
  g.drawRoundedRect(x - 7 * s, y - 13 * s, 14 * s, 26 * s, 3 * s);
  g.endFill();
  g.beginFill(0x5f93a8, 0.95);
  g.drawRoundedRect(x - 5.5 * s, y - 3 * s, 11 * s, 15 * s, 2 * s);
  g.endFill();
  g.beginFill(0x9ad3df, 0.7);
  g.drawRoundedRect(x - 4 * s, y - 1 * s, 3 * s, 9 * s, 1.5 * s);
  g.endFill();
  g.beginFill(0xe4d3ad, 1);
  g.drawRoundedRect(x - 5 * s, y - 16 * s, 10 * s, 4 * s, 1.5 * s);
  g.endFill();
  g.beginFill(0xc9b98f, 1);
  g.drawRoundedRect(x - 4 * s, y - 20 * s, 8 * s, 5 * s, 1 * s);
  g.endFill();
  g.lineStyle(1.2 * s, 0xc7e8ee, 0.45);
  g.moveTo(x + 3 * s, y + 2 * s);
  g.lineTo(x + 3 * s, y + 8 * s);
}

function drawBerriesIcon(g, x, y, s) {
  s = s || 1;
  // лист
  g.beginFill(0x526b45, 0.95);
  g.drawEllipse(x + 6 * s, y - 9 * s, 7 * s, 4 * s);
  g.endFill();
  g.lineStyle(1.2 * s, 0x4c3b2a, 0.9);
  g.moveTo(x, y + 2 * s); g.lineTo(x + 2 * s, y - 9 * s);
  // ягоды
  const pts = [[-4, 2], [4, 2], [-1, 8], [6, 7], [-7, 8]];
  for (const [dx, dy] of pts) {
    g.beginFill(0xa64c5d, 0.98);
    g.drawCircle(x + dx * s, y + dy * s, 4.6 * s);
    g.endFill();
    g.beginFill(0xd88894, 0.45);
    g.drawCircle(x + (dx - 1) * s, y + (dy - 1.5) * s, 1.6 * s);
    g.endFill();
  }
}

function drawMushroomIcon(g, x, y, s) {
  s = s || 1;
  g.beginFill(0xe3d6b8, 0.95);
  g.drawRoundedRect(x - 3 * s, y - 1 * s, 6 * s, 13 * s, 2 * s);
  g.endFill();
  g.beginFill(0xb46b48, 1);
  g.drawEllipse(x, y - 4 * s, 14 * s, 8 * s);
  g.endFill();
  g.beginFill(0xd18a60, 0.8);
  g.drawEllipse(x - 3 * s, y - 6 * s, 7 * s, 3 * s);
  g.endFill();
  g.beginFill(0xe3c8a6, 0.8);
  g.drawCircle(x + 4 * s, y - 5 * s, 1.4 * s);
  g.drawCircle(x - 5 * s, y - 3 * s, 1.1 * s);
  g.endFill();
}

function drawHerbIcon(g, x, y, s) {
  s = s || 1;
  g.lineStyle(1.4 * s, 0x5f7a4b, 0.95);
  g.moveTo(x, y + 12 * s); g.lineTo(x, y - 10 * s);
  const leaves = [[-1, -7, -6], [1, -3, 6], [-1, 1, -7], [1, 5, 7], [-1, 9, -5]];
  for (const [dx, dy, lx] of leaves) {
    g.beginFill(0x9bbb72, 0.95);
    g.drawEllipse(x + lx * 0.5 * s, y + dy * s, 7 * s, 3 * s);
    g.endFill();
    g.beginFill(0xc0d49a, 0.5);
    g.drawEllipse(x + lx * 0.4 * s, y + dy * s - 0.5 * s, 3.2 * s, 1.2 * s);
    g.endFill();
  }
}

function drawYeastIcon(g, x, y, s) {
  s = s || 1;
  g.beginFill(0xd9c9a4, 0.95);
  g.drawRoundedRect(x - 8 * s, y - 9 * s, 16 * s, 20 * s, 4 * s);
  g.endFill();
  g.beginFill(0xb08c5b, 1);
  g.drawRoundedRect(x - 9 * s, y - 12 * s, 18 * s, 5 * s, 2 * s);
  g.endFill();
  g.beginFill(0xf0e4c6, 0.8);
  g.drawCircle(x - 2 * s, y + 2 * s, 2 * s);
  g.drawCircle(x + 3 * s, y + 5 * s, 1.6 * s);
  g.drawCircle(x + 1 * s, y - 2 * s, 1.2 * s);
  g.endFill();
  g.lineStyle(1 * s, 0x8a6a42, 0.6);
  g.moveTo(x - 4 * s, y + 12 * s); g.lineTo(x + 4 * s, y + 12 * s);
}

function drawItemIcon(g, type, x, y, s) {
  if (type === 'honey') drawHoneyIcon(g, x, y, s);
  else if (type === 'water') drawWaterIcon(g, x, y, s);
  else if (type === 'spring') drawWaterIcon(g, x, y, s);
  else if (type === 'berries') drawBerriesIcon(g, x, y, s);
  else if (type === 'mushroom') drawMushroomIcon(g, x, y, s);
  else if (type === 'herb') drawHerbIcon(g, x, y, s);
  else if (type === 'yeast') drawYeastIcon(g, x, y, s);
  else drawHopIcon(g, x, y, s, 0x9eac61);
}

function drawHeart(g, x, y, size, filled, color) {
  const s = size / 12;
  g.lineStyle(0, 0, 0);
  g.beginFill(filled ? (color || 0xc85b4f) : 0x252d38, filled ? 1 : 0.8);
  g.drawCircle(x - 4 * s, y - 2 * s, 4.2 * s);
  g.drawCircle(x + 4 * s, y - 2 * s, 4.2 * s);
  g.drawPolygon([x - 8.1 * s, y + 0.5 * s, x + 8.1 * s, y + 0.5 * s, x, y + 10 * s]);
  g.endFill();
  if (filled) {
    g.beginFill(0xf0a08e, 0.5);
    g.drawCircle(x - 4 * s, y - 3.5 * s, 1.6 * s);
    g.endFill();
  }
}

function drawIngredient(container, type, x, y, s) {
  const g = new PIXI.Graphics();
  if (type === 'honey') drawHoneyIcon(g, 0, 0, s);
  else if (type === 'water') drawWaterIcon(g, 0, 0, s);
  else drawHopIcon(g, 0, 0, s);
  g.x = x; g.y = y;
  container.addChild(g);
  return g;
}

/* ============================================================
   ПЕРСОНАЖИ
   ============================================================ */

function makeShadow(parent, scale) {
  const sh = new PIXI.Graphics();
  ellipse(sh, 0, 0, 20 * (scale || 1), 6 * (scale || 1), 0x05070b, 0.45);
  parent.addChild(sh);
  return sh;
}

function buildVitya() {
  const root = new PIXI.Container();
  const shadow = makeShadow(root, 1.05);
  shadow.y = 1;

  const body = new PIXI.Container();
  root.addChild(body);

  const legBack = new PIXI.Container();
  legBack.x = -5; legBack.y = -30;
  const lb = new PIXI.Graphics();
  rect(lb, -4, 0, 9, 24, 0x262c3a);
  rect(lb, -4.5, 22, 10, 9, 0x171a22);
  rect(lb, -5.5, 27, 13, 4, 0x0e1016);
  lb.beginFill(0x3b4457, 0.5); lb.drawRect(-3, 2, 3, 18); lb.endFill();
  legBack.addChild(lb);
  body.addChild(legBack);

  const legFront = new PIXI.Container();
  legFront.x = 5; legFront.y = -30;
  const lf = new PIXI.Graphics();
  rect(lf, -4, 0, 9, 24, 0x2d3444);
  rect(lf, -4.5, 22, 10, 9, 0x1a1e27);
  rect(lf, -5, 27, 13, 4, 0x101219);
  lf.beginFill(0x4b566e, 0.45); lf.drawRect(-3, 2, 3, 18); lf.endFill();
  legFront.addChild(lf);
  body.addChild(legFront);

  // пальто
  const torso = new PIXI.Container();
  const tg = new PIXI.Graphics();
  poly(tg, [[-13, -54], [-15, -46], [-16, -24], [-13, -8], [13, -8], [16, -24], [14, -47], [12, -54]], 0x2b3242);
  poly(tg, [[-13, -52], [-8, -53], [-6, -8], [-13, -8], [-16, -24], [-15, -45]], 0x353d50);
  poly(tg, [[12, -54], [14, -47], [16, -24], [13, -8], [8, -8], [9, -50]], 0x212734);
  // воротник
  poly(tg, [[-13, -55], [-2, -49], [0, -44], [-9, -50]], 0x1d222d);
  poly(tg, [[13, -55], [2, -49], [0, -44], [9, -50]], 0x1d222d);
  // шарф
  poly(tg, [[-11, -57], [11, -57], [10, -50], [-9, -50]], 0x7c3f36);
  poly(tg, [[6, -51], [11, -50], [13, -36], [8, -37]], 0x6b352e);
  line(tg, -8, -53, 8, -53, 1, 0xa05b4a, 0.5);
  // ремень
  rect(tg, -14, -28, 29, 5, 0x3a2b22);
  rect(tg, -2, -29, 6, 7, 0xb28b4f, 0.9);
  // пуговицы
  circle(tg, 3, -38, 1.6, 0xb7975f, 0.85);
  circle(tg, 3, -33, 1.6, 0xb7975f, 0.85);
  // сумка
  tg.lineStyle(2, 0x4d3423, 0.9);
  tg.moveTo(-11, -52); tg.lineTo(8, -32);
  rect(tg, 7, -33, 11, 12, 0x503925);
  rect(tg, 8, -32, 9, 4, 0x64472e);
  rect(tg, 9, -26, 3, 4, 0xb28b4f, 0.7);
  // тёплый контровой свет
  tg.lineStyle(1.6, 0xffc071, 0.25);
  tg.moveTo(13.5, -47); tg.lineTo(15.5, -24); tg.lineTo(12.5, -9);
  torso.addChild(tg);
  body.addChild(torso);

  // руки
  const armBack = new PIXI.Container();
  armBack.x = -11; armBack.y = -48;
  const ab = new PIXI.Graphics();
  rect(ab, -4, 0, 8.5, 19, 0x252b39);
  circle(ab, 0.2, 20, 4.2, 0xc99772);
  armBack.addChild(ab);
  body.addChild(armBack);

  const armFront = new PIXI.Container();
  armFront.x = 11; armFront.y = -48;
  const af = new PIXI.Graphics();
  rect(af, -4, 0, 8.5, 19, 0x2f3647);
  rect(af, -3, 17, 6, 3, 0x1f2531);
  circle(af, 0.2, 21, 4.2, 0xd6a179);
  af.beginFill(0xefb98e, 0.4); af.drawCircle(1, 20, 2); af.endFill();
  armFront.addChild(af);
  body.addChild(armFront);

  // голова
  const head = new PIXI.Container();
  head.x = 0; head.y = -58;
  const hg = new PIXI.Graphics();
  // шея
  rect(hg, -4, 8, 8, 7, 0xb37c5c);
  // лицо
  hg.beginFill(0xd6a179); hg.drawEllipse(0, 0, 11, 12); hg.endFill();
  hg.beginFill(0xc08a63, 0.55); hg.drawEllipse(5, 1, 6, 10); hg.endFill();
  // ухо
  circle(hg, -9, 3, 3.2, 0xc08a63);
  circle(hg, -9, 3, 1.4, 0x9b6349, 0.6);
  // нос
  poly(hg, [[1, 0], [5, 3], [1, 6]], 0xc98b62);
  // глаза
  const eyeL = new PIXI.Graphics();
  eyeL.beginFill(0x1b1c22); eyeL.drawEllipse(-4, -1, 1.7, 1.9); eyeL.endFill();
  head.addChild(eyeL);
  const eyeR = new PIXI.Graphics();
  eyeR.beginFill(0x1b1c22); eyeR.drawEllipse(4.5, -1, 1.7, 1.9); eyeR.endFill();
  head.addChild(eyeR);
  // брови
  line(hg, -7, -5, -2, -4, 1.4, 0x5a4433, 0.8);
  line(hg, 2, -4, 7, -5, 1.4, 0x5a4433, 0.8);
  // борода
  poly(hg, [[-11, 2], [-10, 13], [-5, 20], [0, 22], [5, 19], [10, 12], [10, 3], [6, 9], [2, 11], [-2, 9], [-6, 10]], 0x5a4b3d);
  poly(hg, [[-8, 5], [-4, 15], [0, 17], [5, 14], [8, 5], [5, 9], [0, 11], [-4, 8]], 0x6e5d4c, 0.8);
  // усы
  poly(hg, [[-6, 5], [-1, 4], [0, 7], [-5, 8]], 0x4b3d31);
  poly(hg, [[6, 5], [1, 4], [0, 7], [5, 8]], 0x4b3d31);
  // шапка
  hg.beginFill(0x6f3835); hg.drawEllipse(0, -10, 12.5, 9); hg.endFill();
  hg.beginFill(0x83413c); hg.drawEllipse(-1, -12, 11, 6); hg.endFill();
  rect(hg, -12, -9, 24, 4.5, 0x5d2e2c);
  hg.beginFill(0x9a4d45, 0.5); hg.drawEllipse(-3, -13, 5, 2.5); hg.endFill();
  // контровой свет
  hg.lineStyle(1.4, 0xffcf8c, 0.35);
  hg.moveTo(10, -8); hg.lineTo(11, 2); hg.lineTo(8, 11);
  head.addChild(hg);
  body.addChild(head);

  // фонарь
  const lantern = new PIXI.Container();
  lantern.x = 18; lantern.y = -30;
  const glow = glowSprite(0xffb45e, 150, 0.45);
  glow.y = 4;
  lantern.addChild(glow);
  const lg = new PIXI.Graphics();
  line(lg, 0, -20, 0, -8, 2, 0x2c2a28);
  rect(lg, -7, -8, 14, 4, 0x33302c);
  rect(lg, -6, -5, 12, 16, 0x3b3732);
  rect(lg, -4.5, -3, 9, 12, 0xffc76f, 0.92);
  rect(lg, -3, -2, 4, 9, 0xffe9b0, 0.6);
  line(lg, -6, 11, 6, 11, 2.5, 0x2e2b27);
  circle(lg, 0, -1, 1.6, 0xffe5a7, 0.9);
  lantern.addChild(lg);
  const lGlow = glowSprite(0xff9c3f, 40, 0.5);
  lantern.addChild(lGlow);
  root.addChild(lantern);

  // пар от дыхания
  const breath = new PIXI.Graphics();
  circle(breath, 0, 0, 3, 0xd9e4e6, 0.16);
  circle(breath, 3, -4, 4, 0xd9e4e6, 0.08);
  breath.x = 8; breath.y = -63;
  body.addChild(breath);

  return {
    root, body, shadow, legBack, legFront, armBack, armFront, head, lantern,
    eyeL, eyeR, breath,
    glow,
  };
}

function buildZina() {
  const root = new PIXI.Container();
  makeShadow(root, 0.95).y = 1;
  const body = new PIXI.Container();
  root.addChild(body);

  const g = new PIXI.Graphics();
  // юбка
  poly(g, [[-14, -24], [14, -24], [19, 0], [-19, 0]], 0x3c3a34);
  poly(g, [[-12, -24], [-2, -24], [0, 0], [-16, 0]], 0x4a463d);
  // кофта
  poly(g, [[-12, -52], [-14, -24], [14, -24], [12, -52], [8, -56], [-8, -56]], 0x5a4a3f);
  rect(g, -13, -30, 26, 5, 0x6e3e35);
  // фартук
  poly(g, [[-8, -34], [8, -34], [10, -2], [-10, -2]], 0x6e5d4a);
  line(g, -8, -20, 8, -20, 1.5, 0x544737, 0.7);
  // руки
  rect(g, -17, -48, 6, 22, 0x4e4036);
  rect(g, 11, -48, 6, 22, 0x5a4a3f);
  circle(g, 14, -25, 3.6, 0xc99772);
  // банка в руках
  rect(g, 13, -36, 11, 13, 0x3a2f27);
  rect(g, 14, -35, 9, 10, 0xe6a93f, 0.9);
  rect(g, 13, -38, 11, 3, 0x6c4b2e);
  // голова
  circle(g, 0, -61, 10, 0xd0a07a);
  circle(g, 5, -59, 5, 0xbe8c68, 0.4);
  // платок
  poly(g, [[-11, -65], [-7, -73], [0, -75], [7, -73], [11, -65], [9, -58], [4, -61], [0, -58], [-5, -61], [-9, -58]], 0x6b3f3c);
  poly(g, [[-8, -66], [0, -72], [8, -66], [5, -60], [0, -63], [-5, -60]], 0x7d4b46);
  // лицо
  circle(g, -4, -61, 1.4, 0x26221f);
  circle(g, 4, -61, 1.4, 0x26221f);
  line(g, -7, -64, -3, -63, 1, 0x5c4434, 0.7);
  line(g, 3, -63, 7, -64, 1, 0x5c4434, 0.7);
  poly(g, [[-2, -57], [2, -57], [1, -55]], 0xba7757);
  line(g, -3, -54, 3, -54, 1, 0x8a5540, 0.8);
  // очки
  g.lineStyle(1.1, 0xc7b38b, 0.7);
  g.drawCircle(-4, -61, 3.2); g.drawCircle(4, -61, 3.2);
  g.moveTo(-1, -61); g.lineTo(1, -61);
  // контровой
  g.lineStyle(1.4, 0xffc67a, 0.25); g.moveTo(10, -70); g.lineTo(13, -52); g.lineTo(10, -30);

  body.addChild(g);
  return { root, body, phase: Math.random() * 9 };
}

function buildPavel() {
  const root = new PIXI.Container();
  makeShadow(root, 1.0);
  const body = new PIXI.Container();
  root.addChild(body);
  const g = new PIXI.Graphics();
  // ноги
  rect(g, -9, -28, 7, 28, 0x2c2b27);
  rect(g, 3, -28, 7, 28, 0x302f2a);
  rect(g, -11, -4, 10, 4, 0x171611);
  rect(g, 1, -4, 10, 4, 0x171611);
  // длинное пальто
  poly(g, [[-14, -58], [-16, -28], [-12, -20], [12, -20], [16, -28], [14, -58], [8, -62], [-8, -62]], 0x42483f);
  poly(g, [[-14, -56], [-6, -60], [-6, -22], [-13, -23]], 0x4f564a);
  rect(g, -3, -56, 6, 34, 0x33382f);
  // шарф
  rect(g, -12, -62, 24, 6, 0x6b4e3a);
  // руки
  rect(g, -19, -52, 6, 22, 0x393f36);
  rect(g, 13, -52, 6, 22, 0x454c41);
  circle(g, -16, -29, 3.6, 0xc9966e);
  circle(g, 16, -29, 3.6, 0xc9966e);
  // трость
  line(g, 19, -50, 25, 0, 2, 0x6d5638);
  circle(g, 19, -52, 3, 0x8a6d44);
  // голова
  circle(g, 0, -70, 10, 0xc9966e);
  circle(g, 4, -69, 4, 0xb07a56, 0.35);
  // глаза
  circle(g, -4, -71, 1.3, 0x20211e);
  circle(g, 4, -71, 1.3, 0x20211e);
  // борода
  poly(g, [[-9, -66], [-8, -56], [-3, -51], [2, -51], [8, -56], [9, -66], [4, -62], [0, -60], [-4, -62]], 0x8e8c80);
  // кепка
  ellipse(g, 0, -79, 13, 3.5, 0x383b36);
  poly(g, [[-9, -79], [-7, -86], [6, -86], [10, -79]], 0x42453f);
  rect(g, 3, -80, 10, 3, 0x2f322d);
  // пар
  circle(g, 8, -65, 3, 0xd9e4e6, 0.12);
  body.addChild(g);
  return { root, body, phase: Math.random() * 9, glow: null };
}

function buildKlava() {
  const root = new PIXI.Container();
  makeShadow(root, 1.0);
  const body = new PIXI.Container();
  root.addChild(body);
  const g = new PIXI.Graphics();
  // юбка
  poly(g, [[-13, -30], [13, -30], [20, 0], [-20, 0]], 0x463a3b);
  poly(g, [[-12, -30], [-2, -30], [0, 0], [-17, 0]], 0x564749);
  // кофта
  poly(g, [[-12, -56], [-14, -30], [14, -30], [12, -56], [7, -60], [-7, -60]], 0x5b4a48);
  rect(g, -13, -36, 26, 5, 0x7d4d3f);
  // фартук
  poly(g, [[-8, -38], [8, -38], [10, -2], [-10, -2]], 0x79654f);
  // руки и корзина
  rect(g, -18, -52, 6, 23, 0x51413f);
  rect(g, 12, -52, 6, 23, 0x5b4a48);
  circle(g, 15, -29, 3.6, 0xcf9e78);
  rect(g, 13, -43, 15, 15, 0x6a4e2f);
  line(g, 13, -43, 28, -43, 2, 0x8e6a3f);
  circle(g, 18, -46, 4, 0xb84e4e, 0.8);
  circle(g, 24, -47, 3, 0xd8a04a, 0.8);
  // голова
  circle(g, 0, -68, 10, 0xd3a078);
  circle(g, 5, -67, 5, 0xbc8965, 0.4);
  // глаза
  circle(g, -4, -69, 1.4, 0x26221f);
  circle(g, 4, -69, 1.4, 0x26221f);
  // улыбка
  line(g, -4, -62, 4, -62, 1.2, 0x8a5540);
  // серьги
  circle(g, -9, -64, 1.8, 0xd6b36a, 0.9);
  circle(g, 9, -64, 1.8, 0xd6b36a, 0.9);
  // платок
  poly(g, [[-12, -72], [-8, -80], [0, -82], [8, -80], [12, -72], [10, -64], [5, -68], [0, -65], [-5, -68], [-10, -64]], 0x7d4650);
  poly(g, [[-8, -73], [0, -79], [8, -73], [5, -67], [0, -70], [-5, -67]], 0x96555d);
  // бусы
  for (let i = 0; i < 4; i++) circle(g, -6 + i * 4, -56 + Math.abs(i - 1.5) * 2, 1.4, 0xd8b06a, 0.8);
  body.addChild(g);
  return { root, body, phase: Math.random() * 9, glow: null };
}

function buildStas() {  const root = new PIXI.Container();
  makeShadow(root, 1);
  const body = new PIXI.Container();
  root.addChild(body);

  const g = new PIXI.Graphics();
  // ведро
  poly(g, [[-15, -10], [15, -10], [12, 0], [-12, 0]], 0x3b4248);
  line(g, -15, -10, 15, -10, 2, 0x5a636a);
  // ноги
  poly(g, [[-9, -32], [-4, -32], [-6, -8], [-13, -8]], 0x2e3742);
  poly(g, [[5, -32], [11, -32], [14, -8], [7, -8]], 0x333d49);
  // туловище
  poly(g, [[-12, -56], [-14, -30], [14, -30], [12, -56], [6, -60], [-6, -60]], 0x3d4b4c);
  rect(g, -12, -42, 24, 4, 0x2d3838);
  // рука с удочкой
  rect(g, 11, -52, 6, 18, 0x354142);
  circle(g, 14, -34, 3.5, 0xcaa07c);
  // удочка
  line(g, 18, -50, 105, -104, 1.8, 0x6a583e);
  line(g, 105, -104, 108, -50, 0.7, 0x9aa7a0, 0.45);
  // поплавок
  rect(g, 106, -56, 2, 7, 0xd86048);
  rect(g, 106, -52, 2, 2, 0xe8e2cf);
  // голова
  circle(g, 0, -68, 10, 0xcb9a73);
  // борода
  poly(g, [[-8, -66], [-5, -56], [0, -53], [5, -56], [8, -66], [4, -62], [0, -60], [-4, -62]], 0x4a4238);
  // усы
  line(g, -4, -63, 4, -63, 1.8, 0x5d5448);
  // глаза
  circle(g, -4, -69, 1.3, 0x22221f);
  circle(g, 4, -69, 1.3, 0x22221f);
  // шляпа
  ellipse(g, 0, -77, 15, 4, 0x4d4937);
  poly(g, [[-8, -77], [-6, -88], [6, -88], [8, -77]], 0x5c5642);
  rect(g, -8, -78, 16, 3, 0x3d392d);
  // контровой
  g.lineStyle(1.4, 0xffc67a, 0.22); g.moveTo(9, -78); g.lineTo(11, -56); g.lineTo(8, -36);

  body.addChild(g);
  return { root, body, phase: Math.random() * 9, rod: g };
}

function buildGrisha() {
  const root = new PIXI.Container();
  makeShadow(root, 0.85);
  const body = new PIXI.Container();
  root.addChild(body);

  const g = new PIXI.Graphics();
  // ноги
  rect(g, -8, -22, 6, 22, 0x2b3440);
  rect(g, 2, -22, 6, 22, 0x2f3946);
  rect(g, -10, -4, 9, 4, 0x171b22);
  rect(g, 1, -4, 9, 4, 0x171b22);
  // куртка
  poly(g, [[-12, -48], [-13, -22], [13, -22], [12, -48], [7, -52], [-7, -52]], 0x4f4c38);
  poly(g, [[-12, -46], [-4, -49], [-4, -22], [-12, -22]], 0x5d5942);
  rect(g, -5, -48, 10, 27, 0x3c3a2b);
  line(g, 0, -46, 0, -23, 1.3, 0xc7b36c, 0.6);
  // руки
  rect(g, -16, -44, 5.5, 20, 0x474431);
  rect(g, 10, -44, 5.5, 20, 0x524e39);
  circle(g, -13, -23, 3.2, 0xcf9d76);
  circle(g, 13, -23, 3.2, 0xcf9d76);
  // фонарик
  rect(g, 14, -29, 6, 9, 0x333a40);
  circle(g, 17, -20, 2.5, 0xc7e8ee, 0.55);
  // голова
  circle(g, 0, -58, 9, 0xcf9d76);
  // шапка
  poly(g, [[-10, -63], [-8, -70], [0, -73], [8, -70], [10, -63], [8, -59], [-8, -59]], 0x535a41);
  rect(g, -10, -64, 20, 4, 0x444a35);
  // волосы
  line(g, -8, -58, -5, -54, 2, 0x6b4d30, 0.9);
  line(g, 8, -58, 5, -54, 2, 0x6b4d30, 0.9);
  // лицо
  circle(g, -3.5, -59, 1.3, 0x22221f);
  circle(g, 3.5, -59, 1.3, 0x22221f);
  line(g, -6, -62, -2, -62, 1, 0x5c4434, 0.6);
  line(g, 2, -62, 6, -62, 1, 0x5c4434, 0.6);
  line(g, -2, -54, 2, -54, 1.2, 0x8a5540, 0.7);
  circle(g, -6, -55, 1, 0xd88a72, 0.25);
  circle(g, 6, -55, 1, 0xd88a72, 0.25);

  body.addChild(g);

  const glow = softGlow(0xbfe8ed, 90, 0.25);
  glow.x = 16; glow.y = -24;
  body.addChild(glow);
  return { root, body, phase: Math.random() * 9, glow };
}

function buildBorisych() {  const root = new PIXI.Container();
  makeShadow(root, 1.3);
  const body = new PIXI.Container();
  root.addChild(body);

  const g = new PIXI.Graphics();
  // ноги
  rect(g, -13, -28, 10, 28, 0x24252a);
  rect(g, 3, -28, 10, 28, 0x28292e);
  rect(g, -16, -4, 15, 4, 0x141519);
  rect(g, 1, -4, 15, 4, 0x141519);
  // тяжёлое пальто
  poly(g, [[-18, -60], [-21, -30], [-18, -14], [18, -14], [21, -32], [18, -60], [10, -64], [-10, -64]], 0x272c35);
  poly(g, [[-18, -58], [-8, -62], [-10, -16], [-18, -14], [-21, -30]], 0x303641);
  poly(g, [[18, -60], [8, -62], [10, -16], [18, -14], [21, -32]], 0x1e222a);
  // воротник
  poly(g, [[-18, -61], [-5, -55], [0, -48], [-8, -52]], 0x1a1e25);
  poly(g, [[18, -61], [5, -55], [0, -48], [8, -52]], 0x1a1e25);
  // шарф
  poly(g, [[-12, -64], [12, -64], [11, -56], [-10, -56]], 0x4b3b3b);
  // руки в карманах
  poly(g, [[-21, -52], [-24, -36], [-18, -30], [-14, -40]], 0x2b313b);
  poly(g, [[21, -52], [24, -36], [18, -30], [14, -40]], 0x2b313b);
  // пуговицы
  circle(g, 5, -46, 1.8, 0xb2945f, 0.6);
  circle(g, 5, -38, 1.8, 0xb2945f, 0.6);
  // голова
  circle(g, 0, -70, 11.5, 0xbe8761);
  circle(g, 6, -68, 5, 0xa87452, 0.4);
  // тяжёлые брови
  line(g, -8, -73, -2, -72, 2.4, 0x3c2d23, 0.9);
  line(g, 2, -72, 8, -73, 2.4, 0x3c2d23, 0.9);
  // глаза
  circle(g, -4.5, -69, 1.5, 0x1c1e22);
  circle(g, 4.5, -69, 1.5, 0x1c1e22);
  // нос
  poly(g, [[0, -69], [4.5, -65], [0, -63]], 0xb57752);
  // щетина
  poly(g, [[-10, -64], [-8, -58], [-3, -55], [3, -55], [8, -58], [10, -64], [5, -61], [0, -60], [-5, -61]], 0x4b4038, 0.75);
  // усы
  line(g, -5, -62, 4, -62, 2.2, 0x42382f, 0.9);
  // кепка
  ellipse(g, 0, -79, 15, 4.5, 0x2c2f33);
  poly(g, [[-11, -79], [-9, -85], [5, -87], [11, -81], [8, -78]], 0x35383c);
  rect(g, 4, -80, 13, 3, 0x24272b);
  // сигарета
  rect(g, 7, -59, 11, 2, 0xd9d0b6);
  circle(g, 18, -58, 1.4, 0xff7238, 0.9);
  // контровой
  g.lineStyle(1.8, 0xffbd70, 0.3); g.moveTo(15, -86); g.lineTo(18, -68); g.lineTo(14, -50);

  body.addChild(g);

  const cig = softGlow(0xff7a40, 50, 0.35);
  cig.x = 19; cig.y = -58;
  body.addChild(cig);
  return { root, body, phase: Math.random() * 9, cig };
}

function buildArkady() {
  const root = new PIXI.Container();
  makeShadow(root, 1.25);
  const body = new PIXI.Container();
  root.addChild(body);
  const g = new PIXI.Graphics();
  // ноги
  rect(g, -12, -26, 9, 26, 0x24292a);
  rect(g, 3, -26, 9, 26, 0x2a3031);
  rect(g, -15, -4, 14, 4, 0x15191a);
  rect(g, 1, -4, 14, 4, 0x15191a);
  // городское пальто
  poly(g, [[-18, -61], [-21, -30], [-17, -13], [17, -13], [21, -31], [18, -61], [10, -65], [-10, -65]], 0x34464a);
  poly(g, [[-18, -59], [-8, -63], [-10, -15], [-17, -13], [-21, -31]], 0x40565a);
  poly(g, [[18, -61], [8, -63], [10, -15], [17, -13], [21, -31]], 0x27373a);
  // шарф
  poly(g, [[-13, -66], [13, -66], [12, -57], [-11, -57]], 0x7a4a42);
  // руки
  poly(g, [[-21, -52], [-25, -37], [-18, -31], [-14, -41]], 0x2d3f43);
  poly(g, [[21, -52], [25, -37], [18, -31], [14, -41]], 0x2d3f43);
  // папка/контракт
  rect(g, 10, -44, 15, 20, 0x7d5a36);
  rect(g, 12, -42, 11, 16, 0xc7b28a);
  line(g, 14, -38, 21, -38, 1, 0x6d583b);
  line(g, 14, -34, 20, -34, 1, 0x6d583b);
  // голова
  circle(g, 0, -72, 11, 0xc08a64);
  circle(g, 5, -70, 4.5, 0xa97555, 0.4);
  // глаза/усы
  circle(g, -4.5, -72, 1.4, 0x1d2020);
  circle(g, 4.5, -72, 1.4, 0x1d2020);
  line(g, -7, -65, 0, -64, 2, 0x44372d, 0.9);
  line(g, 0, -64, 7, -65, 2, 0x44372d, 0.9);
  // цилиндр
  ellipse(g, 0, -84, 17, 4.5, 0x2a2e2d);
  rect(g, -10, -99, 20, 15, 0x303635);
  rect(g, -10, -86, 20, 3, 0x1e2221);
  // цепочка
  line(g, -13, -48, -3, -42, 1, 0xc9a86a, 0.8);
  g.lineStyle(1.5, 0x9ccdd8, 0.3);
  g.moveTo(12, -90); g.lineTo(16, -68); g.lineTo(11, -44);
  body.addChild(g);
  return { root, body, phase: Math.random() * 9 };
}

function drawGardenBed(g, x, baseY, stage, watered) {
  // деревянный короб
  rect(g, x - 26, baseY - 16, 52, 16, 0x3b2b1e);
  rect(g, x - 23, baseY - 13, 46, 4, 0x2a1d14);
  rect(g, x - 23, baseY - 8, 46, 8, 0x261a12);
  // земля
  ellipse(g, x, baseY - 8, 42, 6, 0x2a2118);
  // росток
  if (stage > 0) {
    const h = stage === 1 ? 9 : stage === 2 ? 20 : 32;
    line(g, x, baseY - 10, x - 1, baseY - 10 - h, 2, 0x52673f);
    for (let i = 0; i < (stage === 1 ? 2 : 5); i++) {
      const yy = baseY - 13 - h * (0.25 + i * 0.14);
      const dir = i % 2 ? 1 : -1;
      line(g, x, yy, x + dir * (5 + i * 2), yy - 4, 1.4, 0x6d8552, 0.9);
      ellipse(g, x + dir * (5 + i * 2), yy - 4, 7, 3, 0x6f8a52, 0.85);
    }
    if (stage >= 3) {
      drawHop(g, x + 3, baseY - 10 - h, 0.5, 0x9aa85c);
      drawHop(g, x - 4, baseY - 6 - h * 0.8, 0.42, 0x8c9a54);
    }
  }
  if (watered) {
    g.beginFill(0x8fc9d5, 0.35);
    g.drawEllipse(x, baseY - 9, 13, 2.5);
    g.endFill();
  }
}

function drawGate(g, x, baseY, open) {
  // высокие воротные столбы
  rect(g, x - 70, baseY - 250, 12, 250, 0x3b2c1f);
  rect(g, x + 58, baseY - 250, 12, 250, 0x3b2c1f);
  circle(g, x - 64, baseY - 250, 6, 0x57412b);
  circle(g, x + 64, baseY - 250, 6, 0x57412b);
  line(g, x - 75, baseY - 232, x + 75, baseY - 232, 3, 0x2a1e14, 0.7);
  if (open) {
    // створки распахнуты
    line(g, x - 58, baseY - 228, x - 96, baseY - 204, 6, 0x4a3522);
    line(g, x - 56, baseY - 120, x - 98, baseY - 100, 6, 0x4a3522);
    line(g, x + 58, baseY - 228, x + 96, baseY - 204, 6, 0x4a3522);
    line(g, x + 56, baseY - 120, x + 98, baseY - 100, 6, 0x4a3522);
    line(g, x - 60, baseY - 70, x + 60, baseY - 70, 4, 0x2a1e14, 0.5);
  } else {
    // запертые высокие створки
    for (let i = 0; i < 4; i++) {
      rect(g, x - 58 + i * 29, baseY - 224, 26, 194, i % 2 ? 0x4c3622 : 0x402d1c);
      line(g, x - 58 + i * 29, baseY - 224, x - 32 + i * 29, baseY - 30, 1.5, 0x2b1e13, 0.7);
    }
    line(g, x - 60, baseY - 210, x + 60, baseY - 210, 5, 0x332417);
    line(g, x - 60, baseY - 128, x + 60, baseY - 128, 5, 0x332417);
    line(g, x - 60, baseY - 64, x + 60, baseY - 64, 5, 0x332417);
    // замок
    circle(g, x, baseY - 160, 9, 0x8b744a);
    circle(g, x, baseY - 160, 5, 0x2a2017);
    line(g, x, baseY - 152, x, baseY - 142, 2, 0x2a2017);
    // предупреждение
    circle(g, x, baseY - 190, 2.2, 0xd98f5a, 0.8);
  }
}

function drawMill(g, x, baseY) {
  const w = 280, h = 210;
  const top = baseY - h;
  // сруб
  rect(g, x - w / 2, top, w, h, 0x33271c);
  for (let i = 0; i < 11; i++) {
    rect(g, x - w / 2, top + i * 19, w, 16, i % 2 ? 0x3d2e20 : 0x33271c);
    line(g, x - w / 2, top + 17 + i * 19, x + w / 2, top + 17 + i * 19, 1, 0x1c140e, 0.7);
  }
  // крыша
  poly(g, [[x - w / 2 - 28, top + 8], [x, top - 72], [x + w / 2 + 28, top + 8],
    [x + w / 2 + 18, top + 22], [x, top - 54], [x - w / 2 - 18, top + 22]], 0x1c2021);
  line(g, x - w / 2 - 28, top + 8, x, top - 72, 2, 0x7c8b87, 0.2);
  // дверь и окна
  rect(g, x - 42, baseY - 72, 32, 72, 0x241811);
  rect(g, x - 37, baseY - 67, 22, 67, 0x3c2a1b);
  circle(g, x - 20, baseY - 36, 2.5, 0xc9a25c);
  const win = [[x + 20, top + 52], [x + 70, top + 52]];
  win.forEach(([wx, wy], i) => {
    rect(g, wx - 3, wy - 3, 26, 28, 0x17110c);
    rect(g, wx, wy, 20, 22, i ? 0xffc46e : 0xd69043, 0.9);
    line(g, wx + 10, wy, wx + 10, wy + 22, 2, 0x241a13);
  });
  // колесо
  const cx = x + w / 2 + 62, cy = baseY - 60;
  circle(g, cx, cy, 58, 0x211813);
  line(g, cx, cy, cx + 58, cy, 52, 0x2b1d14, 0);
  // обод
  g.lineStyle(7, 0x5e4530, 0.95); g.drawCircle(cx, cy, 58); g.lineStyle(2, 0x8e6b44, 0.4); g.drawCircle(cx, cy, 52);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    g.lineStyle(3, 0x4f3926, 0.95);
    g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 52, cy + Math.sin(a) * 52);
    g.lineStyle(2, 0x2c1e14, 0.8);
    g.moveTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50);
    g.lineTo(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62);
  }
  circle(g, cx, cy, 8, 0x332316);
  // вода и брызги
  ellipse(g, cx, baseY, 88, 11, 0x375b66, 0.55);
  ellipse(g, cx, baseY - 2, 66, 6, 0x7fb0ba, 0.18);
  for (let i = 0; i < 5; i++) {
    circle(g, cx - 20 + i * 14, baseY - 10 - (i % 3) * 8, 4 + (i % 2) * 3, 0xcfe3e6, 0.08);
  }
  // мешки и бочка
  drawBarrel(g, x - w / 2 + 26, baseY, 30, 40);
  poly(g, [[x + 18, baseY], [x + 12, baseY - 30], [x + 30, baseY - 46], [x + 48, baseY - 28], [x + 44, baseY]], 0x6f5c42);
  line(g, x + 18, baseY - 30, x + 34, baseY - 22, 2, 0x4b3d2b);
}

function drawVillageHouse(g, x, baseY, w, h, color, roofColor, seed) {
  const top = baseY - h;
  const rng = mulberry32(seed || 1);
  rect(g, x, top, w, h, color || 0x45372a);
  rect(g, x, top + 4, w, h - 4, lighten(color || 0x45372a, 0.08));
  for (let i = 0; i < h / 16; i++) line(g, x, top + i * 16, x + w, top + i * 16, 1, 0x2a2119, 0.4);
  poly(g, [[x - 16, top + 6], [x + w / 2, top - 48], [x + w + 16, top + 6],
    [x + w + 10, top + 16], [x + w / 2, top - 36], [x - 10, top + 16]], roofColor || 0x2a3032);
  // окна
  const n = Math.max(1, Math.floor(w / 55));
  for (let i = 0; i < n; i++) {
    const wx = x + 14 + i * (w - 28) / n;
    const wy = top + 26 + rng() * 12;
    rect(g, wx - 2, wy - 2, 24, 26, 0x1b130d);
    rect(g, wx, wy, 20, 22, i % 2 ? 0xffc46e : 0xe9a75e, 0.88);
    line(g, wx + 10, wy, wx + 10, wy + 22, 2, 0x2c1d12);
    line(g, wx, wy + 11, wx + 20, wy + 11, 2, 0x2c1d12);
  }
  // дверь
  const dx = x + w - 32;
  rect(g, dx, baseY - 48, 22, 48, 0x2d1f15);
  rect(g, dx + 3, baseY - 45, 16, 45, 0x4a3220);
  // ставни/цветы
  if (rng() < 0.7) {
    rect(g, x + 10, baseY - 20, 24, 7, 0x3f2c1c);
    for (let i = 0; i < 4; i++) circle(g, x + 14 + i * 5, baseY - 22, 2.2, i % 2 ? 0x9f6b6b : 0xd6b35f);
  }
  // тёплый дым
  for (let i = 0; i < 3; i++) circle(g, x + w * 0.7 + i * 5, top - 38 - i * 8, 8 + i * 4, 0xbec5c8, 0.045);
}

function drawStall(g, x, baseY, w, awning) {
  // стойка
  rect(g, x, baseY - 44, w, 44, 0x4a3322);
  rect(g, x + 4, baseY - 40, w - 8, 36, 0x5b4028);
  for (let i = 0; i < 5; i++) line(g, x + 8, baseY - 8 - i * 7, x + w - 8, baseY - 8 - i * 7, 1, 0x372618, 0.5);
  // столбы
  line(g, x + 5, baseY - 44, x + 5, baseY - 116, 5, 0x3a2a1d);
  line(g, x + w - 5, baseY - 44, x + w - 5, baseY - 116, 5, 0x3a2a1d);
  // навес
  const c1 = awning || 0x8d4c3f;
  const c2 = 0xe3d0ab;
  for (let i = 0; i < 6; i++) {
    poly(g, [[x - 12 + i * (w + 24) / 6, baseY - 150], [x - 12 + (i + 1) * (w + 24) / 6, baseY - 150],
      [x - 8 + (i + 1) * (w + 20) / 6, baseY - 112], [x - 8 + i * (w + 20) / 6, baseY - 112]], i % 2 ? c1 : c2);
  }
  line(g, x - 14, baseY - 151, x + w + 14, baseY - 151, 3, 0x4b3525);
  // бутылки и банки
  for (let i = 0; i < 4; i++) {
    const bx = x + 22 + i * (w - 44) / 3;
    rect(g, bx - 4, baseY - 66, 8, 22, 0x2f3c34);
    rect(g, bx - 3, baseY - 60, 6, 14, i % 2 ? 0xb9853f : 0x7d9a55, 0.9);
    rect(g, bx - 2, baseY - 69, 4, 4, 0x6b4b2d);
  }
  // вывеска
  rect(g, x + w / 2 - 42, baseY - 142, 84, 20, 0x2b1d12);
  rect(g, x + w / 2 - 40, baseY - 140, 80, 16, 0x4d3721);
  for (let i = 0; i < 6; i++) circle(g, x + w / 2 - 32 + i * 13, baseY - 132, 1.8, 0xd3ab68, 0.6);
}

function drawFestivalStage(g, x, baseY, w) {
  // сцена
  rect(g, x, baseY - 24, w, 24, 0x3e2b1d);
  rect(g, x, baseY - 24, w, 5, 0x66472d);
  for (let i = 0; i < 8; i++) line(g, x + 10 + i * (w - 20) / 7, baseY - 20, x + 10 + i * (w - 20) / 7, baseY, 2, 0x2a1d13, 0.6);
  // задник
  rect(g, x + 10, baseY - 150, w - 20, 126, 0x3f3030);
  for (let i = 0; i < 5; i++) {
    poly(g, [[x + 10 + i * (w - 20) / 5, baseY - 150], [x + 10 + (i + 1) * (w - 20) / 5, baseY - 150],
      [x + 10 + (i + 1) * (w - 20) / 5, baseY - 24], [x + 10 + i * (w - 20) / 5, baseY - 24]], i % 2 ? 0x503b36 : 0x44322e);
  }
  drawBanner(g, x + w * 0.25, baseY - 148, 36, 76, 0x8a4d3e);
  drawBanner(g, x + w * 0.75 - 36, baseY - 148, 36, 76, 0x4d6275);
  // гирлянда
  for (let i = 0; i < 14; i++) {
    const lx = x + 8 + i * (w - 16) / 13;
    const ly = baseY - 170 + Math.sin(i / 13 * Math.PI) * 18;
    circle(g, lx, ly, 2.4, 0xffcf72, 0.9);
  }
  // ящики и бочки
  drawCrates(g, x + 26, baseY - 24, 1, 30);
  drawBarrel(g, x + w - 40, baseY - 24, 26, 34);
}

function drawBanner(g, x, y, w, h, color) {
  poly(g, [[x, y], [x + w, y], [x + w, y + h], [x + w / 2, y + h - 10], [x, y + h]], color);
  line(g, x, y, x + w, y, 3, 0x2a1d15);
  circle(g, x + w / 2, y + 22, 8, 0xe0c087, 0.3);
  line(g, x + w / 2, y + 14, x + w / 2, y + 30, 1.5, 0xe0c087, 0.5);
  line(g, x + w / 2 - 7, y + 22, x + w / 2 + 7, y + 22, 1.5, 0xe0c087, 0.5);
}

function drawMillBridge(g, x1, x2, y) {
  // мостик через ручей
  line(g, x1, y, x1, y - 50, 4, 0x3a2a1d);
  line(g, x2, y, x2, y - 50, 4, 0x3a2a1d);
  for (let i = 0; i < Math.floor((x2 - x1) / 18); i++) {
    const xx = x1 + i * 18;
    rect(g, xx, y - 8, 16, 5, i % 2 ? 0x4f3925 : 0x5d442b);
  }
  line(g, x1, y - 30, x2, y - 30, 2, 0x3b2b1d);
}

function drawScarecrow(g, x, baseY) {
  // столб и перекладина
  rect(g, x - 3, baseY - 104, 6, 104, 0x5a4128);
  line(g, x - 34, baseY - 80, x + 34, baseY - 80, 5, 0x5a4128);
  // мешковина
  poly(g, [[-18, -92], [18, -92], [23, -56], [12, -30], [-12, -30], [-23, -56]], 0x9b8251);
  poly(g, [[-18, -92], [-5, -96], [0, -50], [-12, -30], [-23, -56]], 0xb19662);
  // заплатки
  rect(g, 4, -78, 11, 11, 0x7d6642, 0.9);
  line(g, 4, -78, 15, -67, 1, 0x4f402a, 0.8);
  line(g, 15, -78, 4, -67, 1, 0x4f402a, 0.8);
  // руки-палки
  line(g, -34, -80, -44, -60, 3, 0x5a4128);
  line(g, 34, -80, 44, -58, 3, 0x5a4128);
  // голова-мешок
  circle(g, 0, -115, 18, 0xa88c5a);
  circle(g, -7, -119, 3, 0x2a241d);
  circle(g, 7, -119, 3, 0x2a241d);
  line(g, -8, -106, 8, -106, 2, 0x4a3626, 0.8);
  // шляпа
  ellipse(g, 0, -132, 26, 5, 0x4c3a26);
  rect(g, -11, -143, 22, 12, 0x5b452b);
  // солома
  for (let i = 0; i < 12; i++) {
    const sx = -24 + i * 4.3;
    const sy = -46 + (i % 3) * 5;
    line(g, sx, sy, sx + (i % 2 ? 3 : -3), sy + 18, 1.4, 0xc0a366, 0.85);
  }
  line(g, -12, -30, 0, -9, 2, 0x5a4128);
  line(g, 12, -30, 0, -9, 2, 0x5a4128);
}

const PORTRAIT_CACHE = {};

function portraitTexture(kind) {
  if (PORTRAIT_CACHE[kind]) return PORTRAIT_CACHE[kind];
  const tex = canvasTexture(240, 240, (ctx, w, h) => {
    // фон
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.36, 20, w * 0.5, h * 0.5, 160);
    bg.addColorStop(0, 'rgba(61,73,92,1)');
    bg.addColorStop(0.6, 'rgba(28,35,50,1)');
    bg.addColorStop(1, 'rgba(10,14,22,1)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // тёплый свет сбоку
    const rim = ctx.createRadialGradient(185, 90, 8, 185, 90, 150);
    rim.addColorStop(0, 'rgba(255,180,94,.26)');
    rim.addColorStop(0.5, 'rgba(255,150,70,.07)');
    rim.addColorStop(1, 'rgba(255,150,70,0)');
    ctx.fillStyle = rim; ctx.fillRect(0, 0, w, h);

    const rng = mulberry32(kind.length * 977 + 13);
    for (let i = 0; i < 170; i++) {
      ctx.fillStyle = `rgba(220,225,235,${rng() * 0.04})`;
      ctx.fillRect(rng() * w, rng() * h, 1, 1);
    }

    ctx.save();
    ctx.translate(w / 2, h / 2 + 16);

    const skin = '#c9946d';
    const skinShade = '#a46c4e';
    const lineC = 'rgba(38,29,25,.85)';

    // плечи/шуба
    ctx.fillStyle = kind === 'zina' ? '#57473c' : kind === 'grisha' ? '#4f4c38' : '#252b35';
    ctx.beginPath();
    ctx.moveTo(-98, 112);
    ctx.quadraticCurveTo(-88, 32, -34, 22);
    ctx.lineTo(34, 22);
    ctx.quadraticCurveTo(88, 32, 98, 112);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,191,112,.09)';
    ctx.beginPath();
    ctx.moveTo(34, 22); ctx.quadraticCurveTo(88, 32, 98, 112);
    ctx.lineTo(60, 112); ctx.quadraticCurveTo(62, 40, 30, 26); ctx.closePath(); ctx.fill();

    if (kind === 'arkady') {
      // городской покупатель
      ctx.fillStyle = '#3b4d50';
      ctx.fillRect(-18, -22, 36, 46);
      ctx.fillStyle = '#c08a64';
      ctx.beginPath(); ctx.ellipse(0, -50, 42, 47, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(160,105,75,.28)';
      ctx.beginPath(); ctx.ellipse(18, -48, 22, 40, 0.1, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,32,28,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-28, -60); ctx.quadraticCurveTo(-20, -64, -12, -60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -60); ctx.quadraticCurveTo(20, -64, 28, -60); ctx.stroke();
      ctx.fillStyle = '#232127';
      ctx.beginPath(); ctx.ellipse(-21, -51, 3.2, 4, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(21, -51, 3.2, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b97b58';
      ctx.beginPath(); ctx.moveTo(-2, -46); ctx.quadraticCurveTo(8, -36, 0, -32); ctx.quadraticCurveTo(-7, -36, -2, -46); ctx.fill();
      ctx.strokeStyle = '#4b3b2f'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-22, -31); ctx.quadraticCurveTo(-9, -26, 0, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(10, -26, 22, -32); ctx.stroke();
      // цилиндр
      ctx.fillStyle = '#2c3232';
      ctx.fillRect(-42, -92, 84, 12);
      ctx.beginPath(); ctx.ellipse(0, -92, 43, 9, 0, 0, TAU); ctx.fill();
      ctx.fillRect(-30, -132, 60, 42);
      ctx.fillStyle = '#46514f'; ctx.fillRect(-30, -100, 60, 9);
      // воротник и галстук
      ctx.fillStyle = '#263234'; ctx.beginPath(); ctx.moveTo(-32, 18); ctx.lineTo(0, 46); ctx.lineTo(32, 18); ctx.lineTo(20, 66); ctx.lineTo(-20, 66); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a4a42'; ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(7, 8); ctx.lineTo(10, 42); ctx.lineTo(0, 54); ctx.lineTo(-10, 42); ctx.closePath(); ctx.fill();
    }

    if (kind === 'vitya') {
      // шея
      ctx.fillStyle = skinShade; ctx.fillRect(-17, -20, 34, 42);
      // голова
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, -50, 45, 50, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(164,108,78,.35)';
      ctx.beginPath(); ctx.ellipse(18, -48, 24, 42, 0.1, 0, TAU); ctx.fill();
      // уши
      ctx.fillStyle = skinShade; ctx.beginPath(); ctx.ellipse(-43, -42, 9, 14, 0, 0, TAU); ctx.fill();
      // глаза
      ctx.strokeStyle = lineC; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-30, -60); ctx.quadraticCurveTo(-22, -65, -14, -60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -60); ctx.quadraticCurveTo(21, -65, 29, -60); ctx.stroke();
      ctx.fillStyle = '#232127';
      ctx.beginPath(); ctx.ellipse(-22, -52, 3.4, 4.2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(21, -52, 3.4, 4.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(240,228,200,.7)';
      ctx.beginPath(); ctx.arc(-23, -54, 1.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(20, -54, 1.2, 0, TAU); ctx.fill();
      // нос
      ctx.fillStyle = '#bd7d58';
      ctx.beginPath(); ctx.moveTo(-2, -48); ctx.quadraticCurveTo(8, -38, 0, -33); ctx.quadraticCurveTo(-7, -38, -2, -48); ctx.fill();
      // борода
      ctx.fillStyle = '#5b4b3c';
      ctx.beginPath();
      ctx.moveTo(-42, -38); ctx.quadraticCurveTo(-46, 8, -20, 28);
      ctx.quadraticCurveTo(0, 43, 22, 26); ctx.quadraticCurveTo(46, 5, 41, -38);
      ctx.quadraticCurveTo(30, -18, 22, -22); ctx.quadraticCurveTo(8, -8, 0, -10);
      ctx.quadraticCurveTo(-9, -8, -22, -22); ctx.quadraticCurveTo(-31, -18, -42, -38);
      ctx.fill();
      ctx.fillStyle = 'rgba(113,94,77,.9)';
      ctx.beginPath(); ctx.moveTo(-25, -12); ctx.quadraticCurveTo(-30, 12, -12, 23);
      ctx.quadraticCurveTo(-2, 28, 3, 18); ctx.quadraticCurveTo(-12, 12, -16, -8); ctx.fill();
      // усы
      ctx.strokeStyle = '#4b3d31'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-20, -31); ctx.quadraticCurveTo(-10, -26, 0, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(11, -26, 21, -32); ctx.stroke();
      // шапка
      ctx.fillStyle = '#703834';
      ctx.beginPath(); ctx.ellipse(0, -82, 50, 33, 0, Math.PI, TAU); ctx.fill();
      ctx.fillRect(-50, -84, 100, 13);
      ctx.fillStyle = '#87423d';
      ctx.beginPath(); ctx.ellipse(-8, -92, 34, 18, -0.1, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,120,.17)';
      ctx.beginPath(); ctx.ellipse(20, -92, 20, 10, 0.2, 0, TAU); ctx.fill();
      // контровой свет
      ctx.strokeStyle = 'rgba(255,196,120,.5)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(8, -50, 44, -0.7, 0.8); ctx.stroke();
    }

    if (kind === 'boris') {
      ctx.fillStyle = '#7c543b'; ctx.fillRect(-20, -18, 40, 40);
      ctx.fillStyle = '#be8761'; ctx.beginPath(); ctx.ellipse(0, -55, 48, 52, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(150,96,66,.33)'; ctx.beginPath(); ctx.ellipse(20, -55, 25, 44, 0, 0, TAU); ctx.fill();
      // брови
      ctx.strokeStyle = '#3c2d23'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-31, -72); ctx.lineTo(-9, -69); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -69); ctx.lineTo(31, -73); ctx.stroke();
      // глаза
      ctx.fillStyle = '#1c1e22';
      ctx.beginPath(); ctx.ellipse(-19, -58, 4, 5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(19, -58, 4, 5, 0, 0, TAU); ctx.fill();
      // нос
      ctx.fillStyle = '#b57752';
      ctx.beginPath(); ctx.moveTo(0, -54); ctx.lineTo(9, -42); ctx.lineTo(-2, -38); ctx.closePath(); ctx.fill();
      // щетина
      ctx.fillStyle = 'rgba(65,55,48,.7)';
      ctx.beginPath(); ctx.ellipse(0, -30, 36, 26, 0, 0, Math.PI); ctx.fill();
      // ухмылка
      ctx.strokeStyle = '#4a332b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-14, -27); ctx.quadraticCurveTo(0, -18, 17, -28); ctx.stroke();
      // кепка
      ctx.fillStyle = '#303337';
      ctx.beginPath(); ctx.ellipse(0, -88, 56, 30, 0, Math.PI, TAU); ctx.fill();
      ctx.fillRect(-56, -90, 112, 10);
      ctx.fillStyle = '#26292d';
      ctx.beginPath(); ctx.ellipse(16, -85, 43, 10, 0.04, 0, TAU); ctx.fill();
      // контровой
      ctx.strokeStyle = 'rgba(255,188,110,.45)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(6, -52, 48, -0.6, 0.75); ctx.stroke();
      // сигарета
      ctx.fillStyle = '#ded4ba'; ctx.fillRect(22, -25, 28, 4);
      ctx.fillStyle = 'rgba(255,116,52,.9)'; ctx.beginPath(); ctx.arc(50, -23, 2.6, 0, TAU); ctx.fill();
    }

    if (kind === 'zina') {
      // плечи
      ctx.fillStyle = '#5a4a3f';
      ctx.beginPath(); ctx.ellipse(0, 90, 92, 60, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ca976f'; ctx.beginPath(); ctx.ellipse(0, -44, 43, 46, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(160,105,74,.3)'; ctx.beginPath(); ctx.ellipse(16, -44, 22, 38, 0, 0, TAU); ctx.fill();
      // глаза
      ctx.fillStyle = '#26221f';
      ctx.beginPath(); ctx.ellipse(-16, -48, 3.2, 3.8, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -48, 3.2, 3.8, 0, 0, TAU); ctx.fill();
      // очки
      ctx.strokeStyle = 'rgba(209,187,148,.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(-16, -48, 12, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(16, -48, 12, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -48); ctx.lineTo(4, -48); ctx.stroke();
      // морщинки
      ctx.strokeStyle = 'rgba(125,78,55,.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-34, -58); ctx.quadraticCurveTo(-28, -61, -22, -59); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -59); ctx.quadraticCurveTo(28, -61, 34, -58); ctx.stroke();
      // нос
      ctx.fillStyle = '#b97b58';
      ctx.beginPath(); ctx.moveTo(0, -45); ctx.quadraticCurveTo(6, -35, -1, -33); ctx.quadraticCurveTo(-7, -36, 0, -45); ctx.fill();
      // улыбка
      ctx.strokeStyle = '#8a5540'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-11, -25); ctx.quadraticCurveTo(0, -18, 11, -25); ctx.stroke();
      // румянец
      ctx.fillStyle = 'rgba(196,104,82,.22)';
      ctx.beginPath(); ctx.ellipse(-28, -32, 9, 5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(28, -32, 9, 5, 0, 0, TAU); ctx.fill();
      // платок
      ctx.fillStyle = '#6b3f3c';
      ctx.beginPath();
      ctx.moveTo(-48, -75); ctx.quadraticCurveTo(0, -125, 48, -75);
      ctx.quadraticCurveTo(52, -49, 38, -36); ctx.quadraticCurveTo(28, -67, 0, -73);
      ctx.quadraticCurveTo(-28, -67, -38, -36); ctx.quadraticCurveTo(-52, -49, -48, -75);
      ctx.fill();
      ctx.fillStyle = '#7d4b46';
      ctx.beginPath(); ctx.moveTo(-38, -72); ctx.quadraticCurveTo(0, -105, 38, -72);
      ctx.quadraticCurveTo(20, -82, 0, -84); ctx.quadraticCurveTo(-20, -82, -38, -72); ctx.fill();
      // узел
      ctx.fillStyle = '#5c3432'; ctx.beginPath(); ctx.ellipse(-42, -46, 10, 7, -0.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,120,.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(20, -48, 37, -0.7, 0.6); ctx.stroke();
    }

    if (kind === 'stas') {
      ctx.fillStyle = '#3d4b4c';
      ctx.beginPath(); ctx.ellipse(0, 100, 95, 68, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ca976f'; ctx.beginPath(); ctx.ellipse(0, -46, 42, 47, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(150,96,66,.28)'; ctx.beginPath(); ctx.ellipse(17, -46, 22, 40, 0, 0, TAU); ctx.fill();
      // глаза
      ctx.fillStyle = '#22221f';
      ctx.beginPath(); ctx.ellipse(-16, -52, 3, 3.6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -52, 3, 3.6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(70,55,42,.7)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-27, -57); ctx.quadraticCurveTo(-20, -60, -10, -58); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -58); ctx.quadraticCurveTo(20, -60, 27, -57); ctx.stroke();
      // нос
      ctx.fillStyle = '#b97b58';
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(7, -38, 0, -35); ctx.quadraticCurveTo(-6, -39, 0, -48); ctx.fill();
      // борода
      ctx.fillStyle = '#51483c';
      ctx.beginPath(); ctx.moveTo(-35, -30); ctx.quadraticCurveTo(-30, 14, 0, 26);
      ctx.quadraticCurveTo(32, 14, 35, -30); ctx.quadraticCurveTo(22, -16, 12, -19);
      ctx.quadraticCurveTo(0, -10, -12, -19); ctx.quadraticCurveTo(-22, -16, -35, -30); ctx.fill();
      ctx.strokeStyle = '#40392f'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-17, -26); ctx.quadraticCurveTo(0, -20, 18, -27); ctx.stroke();
      // шляпа
      ctx.fillStyle = '#4d4937';
      ctx.beginPath(); ctx.ellipse(0, -84, 63, 13, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5c5642';
      ctx.beginPath(); ctx.moveTo(-32, -84); ctx.quadraticCurveTo(-30, -113, 0, -115);
      ctx.quadraticCurveTo(30, -113, 32, -84); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3d392d'; ctx.fillRect(-33, -84, 66, 8);
      // улыбка
      ctx.strokeStyle = '#7b4b36'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, -23); ctx.quadraticCurveTo(0, -19, 11, -24); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,120,.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(16, -48, 38, -0.6, 0.7); ctx.stroke();
    }

    if (kind === 'grisha') {
      ctx.fillStyle = '#4f4c38';
      ctx.beginPath(); ctx.ellipse(0, 105, 89, 65, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#cf9d76'; ctx.beginPath(); ctx.ellipse(0, -48, 37, 41, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(165,110,78,.25)'; ctx.beginPath(); ctx.ellipse(15, -48, 20, 34, 0, 0, TAU); ctx.fill();
      // глаза большие
      ctx.fillStyle = '#202126';
      ctx.beginPath(); ctx.ellipse(-14, -52, 4, 5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(14, -52, 4, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(240,230,210,.8)';
      ctx.beginPath(); ctx.arc(-15, -54, 1.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(13, -54, 1.3, 0, TAU); ctx.fill();
      // брови
      ctx.strokeStyle = '#6b4d30'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-22, -61); ctx.quadraticCurveTo(-16, -64, -7, -61); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -61); ctx.quadraticCurveTo(16, -64, 22, -61); ctx.stroke();
      // нос
      ctx.fillStyle = '#bd8060';
      ctx.beginPath(); ctx.ellipse(0, -41, 4, 5, 0, 0, TAU); ctx.fill();
      // улыбка
      ctx.strokeStyle = '#8a5540'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-9, -30); ctx.quadraticCurveTo(0, -22, 10, -30); ctx.stroke();
      // веснушки
      ctx.fillStyle = 'rgba(160,90,55,.5)';
      [[-20, -36], [-14, -33], [17, -35], [23, -38]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); });
      // шапка
      ctx.fillStyle = '#535a41';
      ctx.beginPath(); ctx.ellipse(0, -78, 44, 30, 0, Math.PI, TAU); ctx.fill();
      ctx.fillRect(-44, -80, 88, 13);
      ctx.fillStyle = '#444a35'; ctx.fillRect(-45, -70, 90, 7);
      // волосы
      ctx.strokeStyle = '#6b4d30'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-35, -62); ctx.quadraticCurveTo(-44, -48, -38, -40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(35, -62); ctx.quadraticCurveTo(44, -48, 38, -40); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,120,.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(12, -50, 34, -0.6, 0.6); ctx.stroke();
    }

    if (kind === 'pavel') {
      // Пал Палыч, старый мельник
      ctx.fillStyle = '#3f4b45';
      ctx.beginPath(); ctx.ellipse(0, 100, 94, 66, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9966e'; ctx.beginPath(); ctx.ellipse(0, -46, 44, 47, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(150,96,66,.28)'; ctx.beginPath(); ctx.ellipse(18, -45, 22, 40, 0, 0, TAU); ctx.fill();
      // глаза
      ctx.fillStyle = '#22221f';
      ctx.beginPath(); ctx.ellipse(-17, -52, 3.2, 3.8, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(17, -52, 3.2, 3.8, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(70,55,42,.8)'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(-29, -58); ctx.quadraticCurveTo(-21, -62, -10, -59); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -59); ctx.quadraticCurveTo(21, -62, 29, -58); ctx.stroke();
      // нос
      ctx.fillStyle = '#b97b58';
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(7, -38, 0, -34); ctx.quadraticCurveTo(-6, -38, 0, -48); ctx.fill();
      // борода
      ctx.fillStyle = '#8d8b7e';
      ctx.beginPath(); ctx.moveTo(-38, -27); ctx.quadraticCurveTo(-42, 28, 0, 40);
      ctx.quadraticCurveTo(42, 28, 38, -27); ctx.quadraticCurveTo(25, -12, 13, -17);
      ctx.quadraticCurveTo(0, -7, -13, -17); ctx.quadraticCurveTo(-25, -12, -38, -27); ctx.fill();
      ctx.fillStyle = 'rgba(170,168,154,.55)';
      ctx.beginPath(); ctx.moveTo(-18, -4); ctx.quadraticCurveTo(-20, 20, 0, 30); ctx.quadraticCurveTo(20, 20, 18, -4); ctx.fill();
      ctx.strokeStyle = '#5f5c52'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-18, -25); ctx.quadraticCurveTo(0, -18, 18, -26); ctx.stroke();
      // кепка
      ctx.fillStyle = '#3c3f3a';
      ctx.beginPath(); ctx.ellipse(0, -88, 52, 27, 0, Math.PI, TAU); ctx.fill();
      ctx.fillRect(-52, -90, 104, 12);
      ctx.fillStyle = '#2f322e'; ctx.beginPath(); ctx.ellipse(8, -82, 42, 9, 0.04, 0, TAU); ctx.fill();
      // морщины
      ctx.strokeStyle = 'rgba(110,70,48,.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-34, -66); ctx.quadraticCurveTo(-28, -69, -21, -66); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(21, -66); ctx.quadraticCurveTo(28, -69, 34, -66); ctx.stroke();
      // шарф
      ctx.fillStyle = '#6b4e3a';
      ctx.fillRect(-44, 18, 88, 22);
      ctx.strokeStyle = 'rgba(255,190,120,.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(12, -50, 40, -0.6, 0.7); ctx.stroke();
    }

    if (kind === 'klava') {
      // Клава, торговка с площади
      ctx.fillStyle = '#5b483f';
      ctx.beginPath(); ctx.ellipse(0, 104, 96, 68, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d3a078'; ctx.beginPath(); ctx.ellipse(0, -46, 43, 46, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(170,105,74,.25)'; ctx.beginPath(); ctx.ellipse(17, -46, 21, 38, 0, 0, TAU); ctx.fill();
      // глаза
      ctx.fillStyle = '#26221f';
      ctx.beginPath(); ctx.ellipse(-16, -51, 3.2, 3.8, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -51, 3.2, 3.8, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(100,60,40,.5)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-27, -57); ctx.quadraticCurveTo(-20, -60, -10, -57); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -57); ctx.quadraticCurveTo(20, -60, 27, -57); ctx.stroke();
      // румянец
      ctx.fillStyle = 'rgba(196,104,82,.28)';
      ctx.beginPath(); ctx.ellipse(-27, -33, 10, 6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(27, -33, 10, 6, 0, 0, TAU); ctx.fill();
      // нос
      ctx.fillStyle = '#b97b58';
      ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(6, -37, -1, -34); ctx.quadraticCurveTo(-7, -37, 0, -46); ctx.fill();
      // улыбка
      ctx.strokeStyle = '#8a5540'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(-12, -25); ctx.quadraticCurveTo(0, -16, 13, -26); ctx.stroke();
      // серьги
      ctx.strokeStyle = '#d6b36a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-38, -35, 6, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(38, -35, 6, 0, TAU); ctx.stroke();
      // платок
      ctx.fillStyle = '#7c3f46';
      ctx.beginPath();
      ctx.moveTo(-49, -76); ctx.quadraticCurveTo(0, -126, 49, -76);
      ctx.quadraticCurveTo(53, -48, 40, -36); ctx.quadraticCurveTo(30, -68, 0, -74);
      ctx.quadraticCurveTo(-30, -68, -40, -36); ctx.quadraticCurveTo(-53, -48, -49, -76); ctx.fill();
      ctx.fillStyle = '#96525a';
      ctx.beginPath(); ctx.moveTo(-38, -74); ctx.quadraticCurveTo(0, -108, 38, -74);
      ctx.quadraticCurveTo(18, -82, 0, -84); ctx.quadraticCurveTo(-18, -82, -38, -74); ctx.fill();
      // бусы
      ctx.fillStyle = '#d8b06a';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(-18 + i * 9, 22 + Math.abs(i - 2) * 3, 3, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,190,120,.32)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(14, -50, 39, -0.6, 0.7); ctx.stroke();
    }

    if (kind === 'narrator') {
      ctx.fillStyle = 'rgba(18,24,36,1)';
      ctx.fillRect(-120, -120, 240, 240);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 3, 0, 0, 90);
      g.addColorStop(0, 'rgba(255,230,170,.95)');
      g.addColorStop(0.15, 'rgba(255,180,90,.55)');
      g.addColorStop(0.5, 'rgba(255,140,50,.12)');
      g.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffc36b';
      ctx.fillRect(-13, -24, 26, 54);
      ctx.fillStyle = '#ffe3a4'; ctx.fillRect(-9, -19, 18, 42);
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-17, -30, 34, 7);
      ctx.fillRect(-17, 30, 34, 6);
      ctx.fillRect(-10, -38, 20, 4);
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -30, 8, Math.PI, TAU); ctx.stroke();
    }

    ctx.restore();

    // виньетка
    const v = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 160);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    // рамка
    ctx.strokeStyle = 'rgba(217,176,106,.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  });
  PORTRAIT_CACHE[kind] = tex;
  return tex;
}
