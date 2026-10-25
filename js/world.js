'use strict';

/* ============================================================
   МИР: небо, параллакс, земля, река, декорации, NPC, свет
   ============================================================ */

class World {
  constructor(game) {
    this.game = game;
    this.width = 10700;
    this.day = 1;
    this.camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
    this.time = 0;
    this.brewIntensity = 0;
    this.gates = [];
    this.stations = [];
    this.gardenBeds = [];
    this.festivalLights = [];
    this.festivalLanterns = [];
    this.crowdFigures = [];
    this.festivalGroup = null;
    this.festivalActive = false;
    this.fireworkTimer = 5;

    this.root = new PIXI.Container();

    this.skyRoot = new PIXI.Container();
    this.parallaxRoot = new PIXI.Container();
    this.root.addChild(this.skyRoot);
    this.root.addChild(this.parallaxRoot);

    this.stars = [];
    this.parallaxLayers = [];
    this.lightList = [];
    this.particles = [];
    this.fireflies = [];
    this.leaves = [];
    this.bees = [];
    this.crows = [];
    this.foregroundBlades = [];

    this.buildSky();

    this.worldRoot = new PIXI.Container();
    this.root.addChild(this.worldRoot);

    this.terrainLayer = new PIXI.Container();
    this.waterLayer = new PIXI.Container();
    this.waterFx = new PIXI.Container();
    this.scenery = new PIXI.Container();
    this.platformLayer = new PIXI.Container();
    this.raftsLayer = new PIXI.Container();
    this.crowdLayer = new PIXI.Container();
    this.entityLayer = new PIXI.Container();
    this.foreground = new PIXI.Container();
    this.lights = new PIXI.Container();
    this.fx = new PIXI.Container();
    this.promptLayer = new PIXI.Container();

    this.worldRoot.addChild(this.terrainLayer);
    this.worldRoot.addChild(this.waterLayer);
    this.worldRoot.addChild(this.waterFx);
    this.worldRoot.addChild(this.scenery);
    this.worldRoot.addChild(this.platformLayer);
    this.worldRoot.addChild(this.raftsLayer);
    this.worldRoot.addChild(this.crowdLayer);
    this.worldRoot.addChild(this.entityLayer);
    this.worldRoot.addChild(this.foreground);
    this.worldRoot.addChild(this.lights);
    this.worldRoot.addChild(this.fx);
    this.worldRoot.addChild(this.promptLayer);

    this.weatherRoot = new PIXI.Container();
    this.root.addChild(this.weatherRoot);
    this.frameRoot = new PIXI.Container();
    this.root.addChild(this.frameRoot);
    this.dayTint = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.dayTint.width = GAME_W;
    this.dayTint.height = GAME_H;
    this.dayTint.tint = 0xffa05e;
    this.dayTint.alpha = 0;
    this.dayTint.blendMode = PIXI.BLEND_MODES.ADD;
    this.root.addChild(this.dayTint);

    this.grounds = [];
    this.staticSolids = [];
    this.movingPlatforms = [];
    this.activeSolids = [];
    this.collectibles = [];
    this.npcs = [];
    this.checkpoints = [];
    this.interactables = [];

    this.buildParallax();
    this.buildLevel();
    this.buildWeather();
    this.buildFrame();
    this.buildEntities();
    this.buildAmbience();

    this.activeSolids = this.staticSolids.concat(this.movingPlatforms);
  }

  /* ================= НЕБО ================= */

  buildSky() {
    const sky = new PIXI.Sprite(linearGradientTexture(1280, 800, [
      [0, '#04060d'],
      [0.28, '#081021'],
      [0.52, '#111d33'],
      [0.7, '#1d2b43'],
      [0.84, '#354055'],
      [0.93, '#4e4a58'],
      [1, '#5b4a4e'],
    ], true));
    sky.y = -40;
    this.skySprite = sky;
    this.skyVariants = [
      sky.texture,
      linearGradientTexture(1280, 800, [
        [0, '#0b1628'],
        [0.28, '#1b2a44'],
        [0.5, '#34455f'],
        [0.68, '#6e5b62'],
        [0.82, '#b47862'],
        [0.93, '#d99a6e'],
        [1, '#7a5750'],
      ], true),
      linearGradientTexture(1280, 800, [
        [0, '#090b1a'],
        [0.3, '#201a35'],
        [0.55, '#3b2a46'],
        [0.7, '#6b3f4d'],
        [0.84, '#a85c55'],
        [0.94, '#d98c61'],
        [1, '#654141'],
      ], true),
    ];
    this.skyRoot.addChild(sky);
    this.starFactor = 1;

    // далёкое тёплое зарево деревни
    const warm = fogSprite(900, 400, 0.22);
    warm.tint = 0xc88a5c;
    warm.x = 860; warm.y = 470;
    this.skyRoot.addChild(warm);
    const blue = fogSprite(1000, 500, 0.16);
    blue.tint = 0x4b6a92;
    blue.x = 300; blue.y = 360;
    this.skyRoot.addChild(blue);

    // млечная полоса / туманность
    const neb = new PIXI.Sprite(radialTexture(512, [
      [0, 'rgba(120,140,190,.16)'],
      [0.5, 'rgba(90,110,160,.05)'],
      [1, 'rgba(70,90,130,0)'],
    ]));
    neb.anchor.set(0.5);
    neb.width = 1150; neb.height = 330;
    neb.x = 600; neb.y = 220; neb.rotation = -0.2;
    neb.blendMode = PIXI.BLEND_MODES.ADD;
    this.skyRoot.addChild(neb);

    // звёзды
    const rng = mulberry32(73821);
    for (let i = 0; i < 150; i++) {
      const x = rng() * 1280;
      const y = 18 + rng() * 380;
      const big = rng() < 0.13;
      const size = big ? 8 + rng() * 10 : 3 + rng() * 5;
      const s = glowSprite(big ? 0xfff4d8 : 0xcfe0ff, size, (big ? 0.45 : 0.3) + rng() * 0.35);
      s.x = x; s.y = y;
      s.baseAlpha = s.alpha;
      s.twinkle = 0.4 + rng() * 1.6;
      s.phase = rng() * TAU;
      this.skyRoot.addChild(s);
      this.stars.push(s);
    }
    // пара звёзд с лучиками
    const starG = new PIXI.Graphics();
    [[420, 92], [760, 58], [1110, 215]].forEach(([x, y], i) => {
      starG.lineStyle(1.2, 0xfff2d0, 0.4);
      starG.moveTo(x - 9, y); starG.lineTo(x + 9, y);
      starG.moveTo(x, y - 9); starG.lineTo(x, y + 9);
      starG.beginFill(0xfff8e2, 0.8); starG.drawCircle(x, y, 1.6); starG.endFill();
    });
    this.skyRoot.addChild(starG);

    // луна
    this.moonHalo = glowSprite(0xffe3ab, 640, 0.34);
    this.moonHalo.x = 1008; this.moonHalo.y = 136;
    this.skyRoot.addChild(this.moonHalo);
    this.moonCore = new PIXI.Sprite(buildTextures().moon);
    this.moonCore.anchor.set(0.5);
    this.moonCore.width = this.moonCore.height = 255;
    this.moonCore.x = 1008; this.moonCore.y = 136;
    this.moonCore.blendMode = PIXI.BLEND_MODES.ADD;
    this.skyRoot.addChild(this.moonCore);
    const mg = new PIXI.Graphics();
    mg.beginFill(0xfff4d2, 0.95); mg.drawCircle(1008, 136, 51); mg.endFill();
    mg.beginFill(0xf3e3b9, 0.55);
    mg.drawCircle(990, 120, 8); mg.drawCircle(1024, 151, 11); mg.drawCircle(1022, 112, 5);
    mg.drawCircle(992, 158, 4); mg.endFill();
    mg.beginFill(0xfffbec, 0.35); mg.drawCircle(999, 126, 16); mg.endFill();
    this.skyRoot.addChild(mg);

    // облако, наползающее на луну
    this.moonCloud = fogSprite(420, 150, 0.18);
    this.moonCloud.tint = 0x9fb0c9;
    this.moonCloud.x = 1010; this.moonCloud.y = 130;
    this.skyRoot.addChild(this.moonCloud);

    // медленно плывущие облака
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      const c = fogSprite(500 + rng() * 420, 130 + rng() * 90, 0.06 + rng() * 0.05);
      c.tint = i % 2 ? 0xa9b6c9 : 0x8796ad;
      c.x = rng() * 1280; c.y = 260 + rng() * 160;
      c.speed = 3 + rng() * 6;
      this.skyRoot.addChild(c);
      this.clouds.push(c);
    }

    this.shootingStar = null;
    this.shootTimer = 12 + Math.random() * 16;
  }

  /* ================= ПАРАЛЛАКС ================= */

  addLayer(factor, draw) {
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    draw(g, 1280 + factor * (this.width - 1280) + 300);
    c.addChild(g);
    this.parallaxRoot.addChild(c);
    this.parallaxLayers.push({ c, factor });
    return { c, g };
  }

  buildParallax() {
    const camMax = 4570;

    // дальние горы
    this.addLayer(0.025, (g, w) => {
      this.drawRidge(g, w, 478, 0x101a2c, 121, 170, 110);
      this.drawRidge(g, w, 520, 0x0d1524, 561, 230, 70);
      g.lineStyle(1, 0x8fa4c0, 0.08);
      g.moveTo(0, 462); g.lineTo(300, 430); g.lineTo(590, 455); g.lineTo(900, 425); g.lineTo(1250, 460);
    });

    // далёкий ельник
    this.addLayer(0.08, (g, w) => {
      const rng = mulberry32(1017);
      g.beginFill(0x0a1320);
      g.moveTo(0, 570);
      for (let x = 0; x < w; x += 9) {
        const y = 522 + Math.sin(x * 0.021) * 7 + rng() * 9;
        g.lineTo(x, y);
      }
      g.lineTo(w, 760); g.lineTo(0, 760); g.closePath(); g.endFill();
      for (let i = 0; i < 70; i++) {
        const x = rng() * w;
        const h = 30 + rng() * 80;
        const base = 550 + rng() * 22;
        poly(g, [[x, base - h], [x - h * 0.19, base], [x + h * 0.19, base]], 0x0a131e);
      }
    });

    // деревня
    this.addLayer(0.16, (g, w) => {
      const rng = mulberry32(99117);
      const base = 566;
      // холм
      g.beginFill(0x0b141f);
      g.moveTo(0, base);
      for (let x = 0; x < w; x += 30) g.lineTo(x, base - Math.sin(x * 0.004) * 8 - 2);
      g.lineTo(w, 760); g.lineTo(0, 760); g.closePath(); g.endFill();

      for (let i = 0; i < 18; i++) {
        const x = 40 + i * 115 + rng() * 40;
        const hh = 26 + rng() * 28;
        const ww = 34 + rng() * 30;
        const y = base - rng() * 5;
        rect(g, x, y - hh, ww, hh, 0x081018);
        poly(g, [[x - 7, y - hh + 2], [x + ww / 2, y - hh - 20 - rng() * 8], [x + ww + 7, y - hh + 2]], 0x070e16);
        // тёплые окна
        const n = 1 + Math.floor(rng() * 2);
        for (let k = 0; k < n; k++) {
          if (rng() < 0.7) {
            rect(g, x + 6 + k * 14, y - hh + 9 + rng() * (hh - 20), 5, 6, 0xd99a57, 0.55);
          }
        }
        if (rng() < 0.4) line(g, x + ww * 0.7, y - hh - 4, x + ww * 0.7, y - hh - 18, 1.4, 0x050b12);
      }
      // церковь
      const cx = 730;
      rect(g, cx, base - 62, 42, 62, 0x081019);
      poly(g, [[cx - 8, base - 62], [cx + 21, base - 92], [cx + 50, base - 62]], 0x070e16);
      g.beginFill(0x081019);
      g.drawEllipse(cx + 21, base - 99, 12, 17);
      g.endFill();
      line(g, cx + 21, base - 120, cx + 21, base - 108, 2, 0x081019);
      line(g, cx + 16, base - 115, cx + 26, base - 115, 2, 0x081019);
      rect(g, cx + 14, base - 46, 7, 10, 0xd3995b, 0.4);
    });

    // ближний лес
    this.addLayer(0.34, (g, w) => {
      const rng = mulberry32(551);
      g.beginFill(0x08111a);
      g.moveTo(0, 620);
      for (let x = 0; x < w; x += 24) g.lineTo(x, 585 - Math.sin(x * 0.012) * 8 + rng() * 10);
      g.lineTo(w, 800); g.lineTo(0, 800); g.closePath(); g.endFill();

      for (let i = 0; i < 46; i++) {
        const x = rng() * w;
        const h = 90 + rng() * 170;
        const base = 594 + rng() * 8;
        if (rng() < 0.55) {
          // ель
          for (let k = 0; k < 4; k++) {
            const t = k / 4;
            const yy = base - h * (0.2 + t * 0.72);
            const ww = (1 - t) * 33 + 6;
            poly(g, [[x, yy - 35], [x - ww, yy + 9], [x + ww, yy + 9]], 0x071019);
          }
          rect(g, x - 2, base - 20, 4, 20, 0x060d14);
        } else {
          // берёза
          g.lineStyle(2.4, 0x0b141c, 1);
          g.moveTo(x, base);
          g.lineTo(x + (rng() - 0.5) * 8, base - h);
          for (let k = 0; k < 4; k++) {
            const yy = base - h * (0.55 + k * 0.11);
            const dir = k % 2 ? 1 : -1;
            g.moveTo(x, yy); g.lineTo(x + dir * (12 + rng() * 22), yy - 16 - rng() * 21);
          }
          for (let k = 0; k < 3; k++) {
            circle(g, x + (rng() - 0.5) * 45, base - h * (0.7 + rng() * 0.3), 16 + rng() * 20, 0x08111a, 0.9);
          }
        }
      }
    });

    // туманные полосы
    this.fogBands = [];
    for (let i = 0; i < 6; i++) {
      const f = fogSprite(600 + i * 80, 90 + i * 8, 0.09);
      f.tint = 0x93a9c4;
      f.x = 120 + i * 210;
      f.y = 420 + (i % 3) * 45;
      f.speed = 4 + i * 0.7;
      f.baseX = f.x;
      this.parallaxRoot.addChild(f);
      this.fogBands.push(f);
    }
  }

  drawRidge(g, w, base, color, seed, peakW, height) {
    const rng = mulberry32(seed);
    g.beginFill(color);
    g.moveTo(-60, base + 260);
    g.lineTo(-60, base);
    let x = -60;
    while (x < w + 120) {
      const pw = peakW * (0.55 + rng() * 0.8);
      const ph = height * (0.4 + rng() * 0.65);
      g.lineTo(x + pw * 0.18, base - ph * 0.25);
      g.lineTo(x + pw * 0.44, base - ph * 0.8);
      g.lineTo(x + pw * 0.55, base - ph);
      g.lineTo(x + pw * 0.68, base - ph * 0.6);
      g.lineTo(x + pw, base - ph * 0.18);
      x += pw;
    }
    g.lineTo(w + 120, base + 260);
    g.closePath();
    g.endFill();
  }

  /* ================= УРОВЕНЬ ================= */

  buildLevel() {
    this.grounds = [
      { x: -100, w: 1100, top: 600, seed: 12 },
      { x: 980, w: 920, top: 600, seed: 45 },
      { x: 2850, w: 1350, top: 600, seed: 78 },
      { x: 4200, w: 1650, top: 600, seed: 99 },
      { x: 5850, w: 1550, top: 600, seed: 121 },
      { x: 7400, w: 1820, top: 600, seed: 154 },
      { x: 9220, w: 1480, top: 600, seed: 188 },
    ];
    const rng = mulberry32(31337);

    for (const gr of this.grounds) {
      const g = new PIXI.Graphics();
      this.drawGround(g, gr);
      this.terrainLayer.addChild(g);
      const solid = { x: gr.x, y: gr.top, w: gr.w, h: 330 };
      this.staticSolids.push(solid);
      this.grounds[this.grounds.indexOf(gr)] = Object.assign({}, gr, { g });
    }

    // река
    this.drawRiver();
    this.buildPlatforms();
    this.buildScenery();
    this.buildGates();
    this.buildStations();
    this.buildLights();
    this.buildForeground();
  }

  drawGround(g, gr) {
    const rng = mulberry32(gr.seed);
    const x = gr.x, w = gr.w, top = gr.top;

    // тело земли
    rect(g, x, top, w, 340, 0x171c1b);
    for (let i = 0; i < 7; i++) {
      rect(g, x, top + 18 + i * 34, w, 30, i % 2 ? 0x1b211f : 0x151a19, 0.9);
      for (let k = 0; k < 8; k++) {
        const sx = x + rng() * w;
        line(g, sx, top + 20 + i * 34, sx + 10 + rng() * 28, top + 21 + i * 34, 1, 0x2a302b, 0.32);
      }
    }

    // верхний слой почвы
    g.beginFill(0x2d332c);
    g.moveTo(x, top + 14);
    for (let xx = x; xx <= x + w; xx += 14) {
      g.lineTo(xx, top + 4 + Math.sin(xx * 0.07 + gr.seed) * 2.2 + rng() * 2);
    }
    g.lineTo(x + w, top + 18); g.lineTo(x, top + 18); g.closePath(); g.endFill();

    // трава
    g.lineStyle(3.5, 0x4c5b46, 0.95);
    g.moveTo(x, top + 3);
    for (let xx = x; xx <= x + w; xx += 12) {
      g.lineTo(xx, top + 1 + Math.sin(xx * 0.09 + gr.seed) * 2 + (rng() - 0.5) * 1.5);
    }
    g.lineStyle(1, 0x92a47b, 0.34);
    g.moveTo(x, top);
    for (let xx = x; xx <= x + w; xx += 12) {
      g.lineTo(xx, top - 1.5 + Math.sin(xx * 0.09 + gr.seed) * 2);
    }

    // травинки
    for (let i = 0; i < w / 22; i++) {
      const xx = x + rng() * w;
      const hh = 4 + rng() * 11;
      const sway = (rng() - 0.5) * 4;
      line(g, xx, top + 2, xx + sway, top - hh, 1, i % 3 ? 0x5e7050 : 0x7b8c62, 0.55);
      line(g, xx + 2, top + 2, xx + 3 + sway * 0.5, top - hh * 0.7, 0.8, 0x48593f, 0.45);
    }

    // камни и корни
    for (let i = 0; i < w / 160; i++) {
      const xx = x + rng() * w;
      ellipse(g, xx, top + 6, 7 + rng() * 9, 3 + rng() * 3, 0x333c3b, 0.8);
      ellipse(g, xx - 1, top + 4, 4, 1.4, 0x77817a, 0.2);
    }
    // фактура почвы в нижней части экрана
    for (let i = 0; i < w / 55; i++) {
      const xx = x + rng() * w;
      const yy = top + 60 + rng() * 150;
      const rr = 2 + rng() * 5;
      ellipse(g, xx, yy, rr * 1.8, rr, 0x2c332e, 0.4);
      if (rng() < 0.35) {
        line(g, xx, yy - 8, xx + (rng() - 0.5) * 24, yy + 12, 1, 0x39403a, 0.22);
      }
    }
    // тёмная кромка
    rect(g, x, top + 18, w, 5, 0x101412, 0.7);

    // берег реки
    if (gr.x < 1900 && gr.x + gr.w >= 1900) {
      this.drawBankEdge(g, 1900, top, 1);
    }
    if (gr.x <= 2850 && gr.x + gr.w > 2850) {
      this.drawBankEdge(g, 2850, top, -1);
    }
  }

  drawBankEdge(g, x, top, dir) {
    // обрыв у воды
    g.beginFill(0x151a18);
    g.moveTo(x, top + 2);
    g.lineTo(x + dir * 10, top + 26);
    g.lineTo(x + dir * 2, top + 70);
    g.lineTo(x + dir * 16, top + 120);
    g.lineTo(x + dir * 4, 900);
    g.lineTo(x - dir * 28, 900);
    g.lineTo(x - dir * 28, top + 2);
    g.closePath(); g.endFill();
    for (let i = 0; i < 7; i++) {
      const yy = top + 22 + i * 14;
      line(g, x - 20, yy, x + dir * 6, yy + 8, 2, 0x2e332a, 0.4);
    }
    drawReeds(g, x - dir * 8, top + 4, 432 + (dir > 0 ? 1 : 2));
    drawStones(g, x - dir * 14, top, 91, 4);
  }

  drawRiver() {
    const x = 1900, w = 950, top = 690;
    const base = new PIXI.Sprite(linearGradientTexture(w, 260, [
      [0, 'rgba(30,48,62,.96)'],
      [0.15, 'rgba(20,35,48,.98)'],
      [0.5, 'rgba(11,22,33,1)'],
      [1, 'rgba(4,9,14,1)'],
    ], true));
    base.x = x; base.y = top;
    this.waterLayer.addChild(base);

    // отражение луны
    const refl = softGlow(0xffe2ad, 260, 0.13);
    refl.x = 2440; refl.y = top + 40;
    refl.scale.set(0.7, 1.7);
    this.waterLayer.addChild(refl);

    // береговые камни
    const stonesG = new PIXI.Graphics();
    this.scenery.addChild(stonesG);
    for (let i = 0; i < 7; i++) {
      const rng = mulberry32(800 + i);
      const xx = x + 10 + rng() * 30;
      const yy = top + 6 + rng() * 20;
      ellipse(stonesG, xx, yy, 10 + rng() * 18, 4 + rng() * 6, 0x28302f, 0.9);
    }

    this.waterG = new PIXI.Graphics();
    this.waterFx.addChild(this.waterG);

    const mist = fogSprite(1050, 190, 0.16);
    mist.tint = 0x9dbbcf;
    mist.x = x + w / 2; mist.y = top - 30;
    this.waterFx.addChild(mist);
    this.riverMist = mist;

    const farMist = fogSprite(800, 300, 0.11);
    farMist.tint = 0x8aa4bd;
    farMist.x = 2500; farMist.y = 610;
    this.waterFx.addChild(farMist);
  }

  buildPlatforms() {
    const defs = [
      { x: 606, y: 555, w: 62, h: 45, kind: 'crate' },
      { x: 1010, y: 535, w: 92, h: 22, kind: 'wood' },
      { x: 1130, y: 505, w: 150, h: 22, kind: 'wood' },
      { x: 1340, y: 445, w: 150, h: 22, kind: 'wood' },
      { x: 1560, y: 500, w: 172, h: 22, kind: 'wood' },
      { x: 2380, y: 640, w: 160, h: 30, kind: 'island' },
      { x: 3000, y: 520, w: 150, h: 22, kind: 'wood' },
      { x: 3200, y: 455, w: 150, h: 22, kind: 'wood' },
      { x: 3420, y: 390, w: 150, h: 22, kind: 'wood' },
      { x: 3650, y: 330, w: 150, h: 22, kind: 'wood' },
      { x: 3890, y: 420, w: 150, h: 22, kind: 'wood' },
      { x: 4070, y: 500, w: 132, h: 22, kind: 'wood' },
      // лес и мельница — только платформы с добычей или проходом
      { x: 5920, y: 520, w: 140, h: 22, kind: 'wood' },
      { x: 6140, y: 452, w: 132, h: 22, kind: 'wood' },
      { x: 6330, y: 530, w: 120, h: 22, kind: 'wood' },
      { x: 6520, y: 438, w: 144, h: 22, kind: 'wood' },
      { x: 6740, y: 512, w: 150, h: 22, kind: 'wood' },
      { x: 7210, y: 470, w: 145, h: 22, kind: 'wood' },
      // площадь: площадки для фестивальных фонарей
      { x: 7940, y: 500, w: 130, h: 22, kind: 'wood' },
      { x: 8190, y: 445, w: 130, h: 22, kind: 'wood' },
      { x: 8430, y: 500, w: 130, h: 22, kind: 'wood' },
      { x: 8680, y: 445, w: 130, h: 22, kind: 'wood' },
      // старая плотина: подъём к роднику
      { x: 9380, y: 520, w: 130, h: 22, kind: 'wood' },
      { x: 9570, y: 450, w: 120, h: 22, kind: 'wood' },
      { x: 9760, y: 380, w: 130, h: 22, kind: 'wood' },
      { x: 9950, y: 450, w: 120, h: 22, kind: 'wood' },
      { x: 10140, y: 520, w: 130, h: 22, kind: 'wood' },
      { x: 10330, y: 450, w: 120, h: 22, kind: 'wood' },
      { x: 10520, y: 380, w: 120, h: 22, kind: 'wood' },
    ];

    this.platforms = [];
    for (const p of defs) {
      this.platforms.push(p);
      const g = new PIXI.Graphics();
      this.drawPlatform(g, p);
      this.platformLayer.addChild(g);
      this.staticSolids.push({ x: p.x, y: p.y, w: p.w, h: p.h, kind: p.kind });
    }

    // плотики
    const rafts = [
      { x: 1938, y: 652, w: 154, h: 22, bx: 1938, by: 652, rx: 0, ry: 18, speed: 0.55, phase: 0.0 },
      { x: 2160, y: 652, w: 154, h: 22, bx: 2180, by: 652, rx: 90, ry: 0, speed: 0.42, phase: 1.2 },
      { x: 2640, y: 652, w: 154, h: 22, bx: 2650, by: 652, rx: 60, ry: 16, speed: 0.6, phase: 2.4 },
    ];
    rafts.forEach((r) => {
      r.moving = true;
      r.dx = 0; r.dy = 0;
      r.container = new PIXI.Container();
      const g = new PIXI.Graphics();
      this.drawRaft(g, r.w);
      r.container.addChild(g);
      const glow = softGlow(0xffb15b, 120, 0.2);
      glow.x = r.w - 18; glow.y = -24;
      r.container.addChild(glow);
      r.container.x = r.x; r.container.y = r.y;
      this.raftsLayer.addChild(r.container);
      this.movingPlatforms.push(r);
      this.activeSolids.push(r);
    });
    this.rafts = rafts;

    // медный чан — солидный, в него не пройти
    this.staticSolids.push({ x: 5452, y: 500, w: 134, h: 100 });
  }

  drawPlatform(g, p) {
    if (p.kind === 'crate') {
      rect(g, p.x, p.y, p.w, p.h, 0x3a2a1c);
      rect(g, p.x + 3, p.y + 3, p.w - 6, p.h - 6, 0x5b432c);
      line(g, p.x + 5, p.y + 5, p.x + p.w - 5, p.y + p.h - 5, 2, 0x39291b);
      line(g, p.x + p.w - 5, p.y + 5, p.x + 5, p.y + p.h - 5, 2, 0x39291b);
      line(g, p.x, p.y + 2, p.x + p.w, p.y + 2, 1.5, 0x8a6a4a, 0.4);
      return;
    }
    if (p.kind === 'island') {
      // островок: мшистый камень, торчащий из воды
      const rng = mulberry32(4711);
      g.beginFill(0x111816);
      g.moveTo(p.x - 12, p.y + 22);
      g.lineTo(p.x + 2, p.y + 2);
      g.lineTo(p.x + p.w - 5, p.y + 2);
      g.lineTo(p.x + p.w + 14, p.y + 22);
      g.lineTo(p.x + p.w + 8, p.y + 70);
      g.lineTo(p.x + p.w - 18, 760);
      g.lineTo(p.x + 22, 760);
      g.lineTo(p.x - 10, p.y + 68);
      g.closePath(); g.endFill();
      // светлый бок
      g.beginFill(0x28312d);
      g.moveTo(p.x + 2, p.y + 4);
      g.lineTo(p.x + p.w - 5, p.y + 4);
      g.lineTo(p.x + p.w - 14, p.y + 54);
      g.lineTo(p.x + 20, p.y + 66);
      g.closePath(); g.endFill();
      // мох
      g.beginFill(0x3e5142);
      g.moveTo(p.x - 6, p.y + 7);
      for (let xx = p.x; xx <= p.x + p.w; xx += 10) {
        g.lineTo(xx, p.y + 2 + Math.sin(xx * 0.3) * 2);
      }
      g.lineTo(p.x + p.w + 8, p.y + 12);
      g.lineTo(p.x + p.w - 8, p.y + 17);
      g.lineTo(p.x + 8, p.y + 16);
      g.closePath(); g.endFill();
      line(g, p.x + 1, p.y + 1, p.x + p.w - 2, p.y + 1, 1.5, 0x83946c, 0.35);
      // камни и трава
      for (let i = 0; i < 7; i++) {
        const xx = p.x + 8 + rng() * (p.w - 16);
        const yy = p.y + 6 + rng() * 44;
        ellipse(g, xx, yy, 3 + rng() * 8, 2 + rng() * 4, 0x4b5650, 0.8);
      }
      for (let i = 0; i < 12; i++) {
        const xx = p.x + 6 + rng() * (p.w - 12);
        const hh = 5 + rng() * 13;
        line(g, xx, p.y + 4, xx + (rng() - 0.5) * 5, p.y - hh, 1.2, 0x617552, 0.65);
      }
      drawReeds(g, p.x + p.w - 10, p.y + 8, 713);
      drawStones(g, p.x + 18, p.y + 10, 717, 3);
      return;
    }

    // деревянный настил
    const c1 = p.kind === 'stone' ? 0x3b4442 : 0x4b3523;
    const c2 = p.kind === 'stone' ? 0x4c5652 : 0x62462f;
    rect(g, p.x, p.y, p.w, p.h, c1);
    rect(g, p.x, p.y, p.w, 5, c2);
    for (let i = 0; i < p.w / 26; i++) {
      line(g, p.x + 6 + i * 26, p.y + 2, p.x + 6 + i * 26, p.y + p.h - 2, 1, 0x2b1d13, 0.5);
    }
    // мох
    for (let i = 0; i < 4; i++) {
      const xx = p.x + 8 + (i * 37 + p.x) % (p.w - 16);
      circle(g, xx, p.y + 1, 2 + (i % 2), 0x738656, 0.5);
    }
    line(g, p.x + 2, p.y + 1, p.x + p.w - 2, p.y + 1, 1, 0x93a577, 0.35);
    // подвесные верёвки/корни
    line(g, p.x + 12, p.y + p.h, p.x + 4, p.y + p.h + 16, 1.4, 0x3b2b1c, 0.7);
    line(g, p.x + p.w - 14, p.y + p.h, p.x + p.w - 5, p.y + p.h + 20, 1.4, 0x3b2b1c, 0.7);
    line(g, p.x + p.w * 0.5, p.y + p.h, p.x + p.w * 0.5 + 3, p.y + p.h + 12, 1.2, 0x4c693e, 0.55);

    // опоры или подвесные лианы
    if (p.y + p.h < 585) {
      if (p.y > 430) {
        const gy = 600;
        line(g, p.x + 14, p.y + p.h, p.x + 8, gy, 4, 0x322619, 0.9);
        line(g, p.x + p.w - 14, p.y + p.h, p.x + p.w - 8, gy, 4, 0x322619, 0.9);
        line(g, p.x + 8, gy - 18, p.x + p.w - 10, p.y + p.h + 12, 2, 0x3a2c1e, 0.55);
        line(g, p.x + 15, gy - 4, p.x + 14, gy, 1, 0x6f5a3f, 0.35);
      } else {
        line(g, p.x + 18, p.y, p.x + 12, p.y - 54, 1.4, 0x3f5134, 0.5);
        line(g, p.x + p.w - 20, p.y, p.x + p.w - 8, p.y - 42, 1.2, 0x3f5134, 0.4);
      }
    }
  }

  drawRaft(g, w) {
    // брёвна
    for (let i = 0; i < 3; i++) {
      const y = i * 7;
      g.beginFill(i % 2 ? 0x4a3624 : 0x553d29);
      g.drawRoundedRect(0, y, w, 11, 5);
      g.endFill();
      g.lineStyle(1, 0x2d2016, 0.8);
      g.moveTo(2, y + 4); g.lineTo(w - 2, y + 4);
      g.lineStyle(1, 0x7d5d3e, 0.3);
      g.moveTo(6, y + 1.5); g.lineTo(w - 6, y + 1.5);
    }
    // верёвки
    line(g, 16, -2, 16, 22, 2, 0xa18556, 0.7);
    line(g, w - 20, -2, w - 20, 22, 2, 0xa18556, 0.7);
    line(g, 14, 2, w - 18, 2, 1.4, 0xb69b6b, 0.5);
    // фонарик
    line(g, w - 20, 0, w - 20, -18, 1.5, 0x2d2b28);
    rect(g, w - 27, -20, 14, 16, 0x2c2a27);
    rect(g, w - 24, -17, 8, 10, 0xffc670, 0.85);
    rect(g, w - 24, -14, 8, 3, 0x2c2a27);
    // зелёный мох
    circle(g, w * 0.4, 4, 3, 0x5c6d46, 0.45);
    circle(g, w * 0.7, 9, 2, 0x5c6d46, 0.35);
  }

  buildScenery() {
    const g = new PIXI.Graphics();
    this.scenery.addChild(g);

    // ---------- двор ----------
    drawIzba(g, 70, 600, 300, 190);
    // записка на двери
    rect(g, 145, 548, 14, 19, 0xd9cba9, 0.9);
    rect(g, 147, 550, 10, 2, 0x6a5a45, 0.55);
    rect(g, 147, 553, 9, 1.5, 0x6a5a45, 0.5);
    circle(g, 152, 560, 3, 0xa54c3b, 0.5);

    drawWell(g, 450, 600);
    drawWoodpile(g, 380, 600);
    drawFence(g, 500, 640, 600);
    drawSign(g, 560, 600, 150, 42);
    drawCrates(g, 637, 600, 1, 62);
    // огород
    drawFence(g, 780, 802, 600);
    drawFence(g, 938, 975, 600);

    // кот у колодца
    this.buildCat(520, 600);

    // ---------- сад ----------
    drawFence(g, 990, 1120, 600);
    drawBirch(g, 1060, 600, 235, 21);
    drawBirch(g, 1290, 600, 270, 34);
    drawBirch(g, 1560, 600, 240, 55);
    drawBush(g, 1210, 600, 1.1, 22);
    drawBush(g, 1710, 600, 0.9, 29);
    drawStones(g, 1450, 600, 66, 4);

    // ульи на площадках
    drawHive(g, 1170, 505);
    drawHive2(g, 1400, 445);
    drawHive(g, 1610, 500);
    // улей на земле
    drawHive2(g, 1190, 600);

    // яблоки на деревьях
    for (let i = 0; i < 9; i++) {
      const rng = mulberry32(600 + i);
      circle(g, 1240 + rng() * 70, 420 + rng() * 80, 2.2, 0x8b4e35, 0.7);
    }

    // ---------- река ----------
    drawFence(g, 1830, 1900, 600);
    drawBoat(g, 2805, 701);
    drawReeds(g, 1905, 700, 71);
    drawStones(g, 1870, 690, 52, 5);
    // сломанный мост
    this.drawBrokenBridge(g);

    // ---------- роща ----------
    drawBirch(g, 2960, 600, 310, 101);
    drawBirch(g, 3120, 600, 340, 104);
    drawBirch(g, 3360, 600, 300, 108);
    drawBirch(g, 3530, 600, 360, 111);
    drawBirch(g, 3750, 600, 300, 117);
    drawBirch(g, 3960, 600, 340, 123);
    drawPine(g, 3080, 600, 220, 31, true);
    drawPine(g, 3840, 600, 260, 36, true);
    drawPine(g, 4120, 600, 210, 39, true);
    drawBush(g, 3270, 600, 1.2, 47);
    drawBush(g, 3550, 600, 0.8, 51);
    drawMushrooms(g, 3050, 600, 61);
    drawMushrooms(g, 3580, 600, 63);
    drawMushrooms(g, 4020, 600, 67);
    drawStones(g, 3400, 600, 72, 3);
    drawStones(g, 3990, 600, 74, 4);
    drawSign(g, 3610, 600, 160, 42);

    // родник
    this.drawSpring(g, 3140, 600);

    // хмель на ветках
    for (let i = 0; i < 4; i++) {
      const x = 3180 + i * 250;
      drawHopVines(g, x, 230 + (i % 2) * 30, 480, 200 + i);
    }

    // ---------- пивоварня ----------
    drawBirch(g, 4260, 600, 300, 141);
    drawSign(g, 4360, 600, 190, 50);
    drawFence(g, 4500, 4700, 600);
    drawBrewery(g, 4760, 600, 620, 240, null);
    drawKettle(g, 5520, 600, 1.28);
    drawBarrel(g, 5380, 600, 34, 48);
    drawBarrel(g, 5560, 600, 28, 38);
    drawBirch(g, 5720, 600, 320, 151);
    drawBush(g, 4680, 600, 1.1, 58);
    drawCrates(g, 4700, 600, 1, 55);

    // провода с фонариками
    this.drawStringLights(g);

    // ---------- лесная дорога и мельница ----------
    for (let i = 0; i < 9; i++) {
      const x = 5880 + i * 165;
      if (x > 7350) break;
      if (i % 3 === 0) drawPine(g, x, 600, 190 + (i % 4) * 28, 300 + i, true);
      else drawBirch(g, x, 600, 240 + (i % 3) * 45, 300 + i);
    }
    drawBush(g, 6010, 600, 1.0, 301);
    drawBush(g, 6430, 600, 0.9, 303);
    drawBush(g, 7280, 600, 1.2, 305);
    drawMushrooms(g, 6080, 600, 307);
    drawMushrooms(g, 6610, 600, 309);
    drawStones(g, 6220, 600, 311, 3);
    drawStones(g, 7140, 600, 313, 4);
    drawSign(g, 5940, 600, 160, 42);
    drawMill(g, 7000, 600);
    drawFence(g, 7200, 7290, 600);
    drawCrates(g, 7240, 600, 1, 42);
    this.addWorldText('СТАРАЯ МЕЛЬНИЦА', 7000, 326, 15, 0xc9b68f, FONT_UI, '600', 2);

    // ---------- площадь ----------
    drawVillageHouse(g, 7480, 600, 170, 170, 0x4a3a2b, 0x2e3435, 401);
    drawVillageHouse(g, 8860, 600, 220, 190, 0x4d3a2b, 0x34312f, 402);
    drawVillageHouse(g, 9120, 600, 130, 150, 0x40342a, 0x2a3032, 403);
    drawStall(g, 7660, 600, 130, 0x7d3e38);
    drawStall(g, 8980, 600, 120, 0x4d5f6f);
    drawFestivalStage(g, 8260, 600, 520);
    drawBirch(g, 9060, 600, 300, 411);
    drawPine(g, 7500, 600, 200, 413, true);
    drawBush(g, 8080, 600, 0.9, 415);
    drawBush(g, 9210, 600, 1.0, 417);
    drawStones(g, 8150, 600, 419, 4);
    drawSign(g, 7410, 600, 190, 45);
    this.addWorldText('ТИХИЙ БЕРЕГ', 7505, 533, 14, 0xe7c98f, FONT_DISPLAY, '600', 1.2);
    this.addWorldText('ФЕСТИВАЛЬ', 8520, 380, 18, 0xf1d296, FONT_DISPLAY, '600', 3);
    this.addWorldText('→ СТАРАЯ ПЛОТИНА', 9050, 532, 13, 0xa9bdb5, FONT_UI, '600', 1.2);

    // ---------- старая плотина ----------
    for (let i = 0; i < 7; i++) {
      const x = 9280 + i * 190;
      if (i % 2 === 0) drawPine(g, x, 600, 230 + (i % 3) * 35, 500 + i, true);
      else drawBirch(g, x, 600, 250 + (i % 3) * 35, 520 + i);
    }
    drawBush(g, 9300, 600, 1.1, 531);
    drawBush(g, 9680, 600, 0.9, 532);
    drawBush(g, 10580, 600, 1.0, 533);
    drawStones(g, 9480, 600, 534, 4);
    drawStones(g, 10080, 600, 535, 5);
    drawSign(g, 9260, 600, 190, 46);
    // руины плотины
    const dam = new PIXI.Graphics();
    rect(dam, 10040, 470, 430, 130, 0x303532);
    rect(dam, 10040, 470, 430, 8, 0x525a51);
    for (let i = 0; i < 9; i++) {
      const bx = 10060 + i * 45;
      rect(dam, bx, 500 + (i % 3) * 8, 33, 22 + (i % 2) * 12, i % 2 ? 0x3b423d : 0x454c45, 0.9);
    }
    // проём/арка
    dam.beginFill(0x090e12, 0.85);
    dam.drawRoundedRect(10180, 520, 90, 80, 36);
    dam.endFill();
    // мох и светлый камень
    for (let i = 0; i < 12; i++) {
      const mx = 10055 + (i * 37) % 390;
      const my = 480 + (i % 4) * 24;
      ellipse(dam, mx, my, 8 + (i % 3) * 4, 3, 0x566b53, 0.35);
    }
    g.addChild(dam);
    // вода на старой плотине
    const wf = new PIXI.Graphics();
    wf.beginFill(0x6fa5b2, 0.24);
    wf.drawRoundedRect(10208, 300, 48, 180, 8);
    wf.endFill();
    for (let i = 0; i < 9; i++) {
      const sx = 10214 + (i * 11) % 34;
      const sy = 312 + (i * 37) % 150;
      line(wf, sx, sy, sx + 2, sy + 20 + (i % 3) * 12, 1.2, 0xd8f2f4, 0.18 + (i % 2) * 0.08);
    }
    wf.beginFill(0x8fc7d4, 0.22);
    wf.drawRoundedRect(10212, 468, 38, 128, 6);
    wf.endFill();
    ellipse(wf, 10230, 598, 48, 8, 0xbce7eb, 0.22);
    g.addChild(wf);
    // вода, сбегающая по старой плотине
    const fall = new PIXI.Sprite(linearGradientTexture(70, 390, [
      [0, 'rgba(156,205,220,.0)'],
      [0.25, 'rgba(156,205,220,.30)'],
      [0.7, 'rgba(122,177,194,.18)'],
      [1, 'rgba(90,130,150,.04)'],
    ], true));
    fall.x = 10210; fall.y = 310;
    this.waterFx.addChild(fall);
    this.waterfall = fall;
    const fallMist = fogSprite(160, 240, 0.20);
    fallMist.tint = 0x9ccdd8;
    fallMist.x = 10245; fallMist.y = 540;
    this.waterFx.addChild(fallMist);
    this.damMist = fallMist;
    drawStones(g, 10220, 600, 536, 5);
    this.addWorldText('СТАРАЯ ПЛОТИНА', 9550, 520, 18, 0xc9d6cf, FONT_DISPLAY, '600', 2);
    this.addWorldText('родник · туман · тишина', 9550, 540, 9, 0x91a7a4, FONT_UI, '400', 1);
    this.addWorldText('→ ГОРОД', 10320, 515, 13, 0xa9bdb5, FONT_UI, '600', 1.5);

    // текст на вывесках
    this.addWorldText('МЕДВЕДЕВО', 635, 538, 19, 0xe7c98f, FONT_DISPLAY, '600', 2);
    this.addWorldText('три дня до срока', 635, 555, 10, 0xc7ad82, FONT_UI, '400', 1);
    this.addWorldText('ТИХИЙ БЕРЕГ', 5070, 429, 21, 0xf1d296, FONT_DISPLAY, '600', 2);
    this.addWorldText('ПИВОВАРНЯ', 5070, 448, 10, 0xc9a970, FONT_UI, '600', 3);
    this.addWorldText('→ ПИВОВАРНЯ', 4455, 535, 16, 0xe7c98f, FONT_DISPLAY, '600', 1.5);
    this.addWorldText('ХМЕЛЬ', 3690, 532, 15, 0xcdbb8e, FONT_UI, '600', 2);
    this.addWorldText('не для пацанов', 3690, 548, 8, 0x9f8e6e, FONT_UI, '400', 1);
  }

  addWorldText(str, x, y, size, color, font, weight, spacing) {
    const t = makeText(str, {
      fontFamily: font,
      fontSize: size,
      fill: color,
      fontWeight: weight || '400',
      letterSpacing: spacing || 0,
      stroke: 0x1b120b,
      strokeThickness: Math.max(1, size / 16),
    }, 0.5);
    t.x = x; t.y = y;
    this.scenery.addChild(t);
    return t;
  }

  /* ================= ВОРОТА, СТАНЦИИ, ОГОРОД ================= */

  buildGates() {
    const defs = [
      { x: 5790, day: 2, title: 'mill' },
      { x: 7310, day: 3, title: 'village' },
      { x: 9180, day: 1, unlockKey: 'dam', title: 'dam' },
    ];
    for (const def of defs) {
      const closed = new PIXI.Graphics();
      drawGate(closed, def.x, 600, false);
      const open = new PIXI.Graphics();
      drawGate(open, def.x, 600, true);
      this.scenery.addChild(closed, open);
      const solid = { x: def.x - 70, y: 330, w: 140, h: 270, disabled: false, gate: true };
      this.staticSolids.push(solid);
      this.gates.push({ def, closed, open, solid });
    }
    this.updateGates();
  }

  updateGates() {
    const unlocked = (this.game && this.game.progress && this.game.progress.unlocked) || {};
    for (const gate of this.gates) {
      const openByKey = gate.def.unlockKey ? !!unlocked[gate.def.unlockKey] : true;
      const closed = this.day < gate.def.day || !openByKey;
      gate.solid.disabled = !closed;
      gate.closed.visible = closed;
      gate.open.visible = !closed;
    }
  }

  buildStations() {
    // кровать / дом
    const bedG = new PIXI.Graphics();
    rect(bedG, -22, -3, 44, 3, 0x4a3625);
    line(bedG, -22, -3, 22, -3, 1, 0x7a5a38, 0.5);
    line(bedG, -18, -3, -18, 0, 1.5, 0x2a1d13);
    line(bedG, 18, -3, 18, 0, 1.5, 0x2a1d13);
    circle(bedG, 30, -28, 4, 0xffc46e, 0.8);
    line(bedG, 30, -24, 30, -16, 1.2, 0x3c2b1e);
    this.scenery.addChild(bedG);
    bedG.x = 141; bedG.y = 600;
    this.stations.push({ type: 'bed', x: 141, y: 600, range: 78 });

    // прилавок у пивоварни
    const tradeG = new PIXI.Graphics();
    rect(tradeG, -46, -36, 92, 8, 0x4a3322);
    rect(tradeG, -40, -28, 8, 28, 0x352518);
    rect(tradeG, 32, -28, 8, 28, 0x352518);
    rect(tradeG, -42, -56, 84, 20, 0x3a2a1b);
    rect(tradeG, -40, -54, 80, 16, 0x5b4028);
    for (let i = 0; i < 4; i++) {
      const bx = -28 + i * 18;
      rect(tradeG, bx - 3, -52, 6, 16, 0x2f3c34);
      rect(tradeG, bx - 2, -48, 4, 10, i % 2 ? 0xb9853f : 0x7d9a55, 0.9);
      rect(tradeG, bx - 1, -55, 2, 3, 0x6b4b2d);
    }
    line(tradeG, -38, -58, 38, -58, 2, 0x2a1d12);
    this.scenery.addChild(tradeG);
    tradeG.x = 4910; tradeG.y = 600;
    this.stations.push({ type: 'trade', x: 4960, y: 600, range: 92, mult: 0.9, label: 'Борисыч скупает' });

    // мастерская
    const shopG = new PIXI.Graphics();
    rect(shopG, -40, -35, 80, 8, 0x4d3725);
    rect(shopG, -35, -27, 10, 27, 0x3a2a1d);
    rect(shopG, 25, -27, 10, 27, 0x3a2a1d);
    rect(shopG, -34, -47, 30, 6, 0x6d4d31);
    line(shopG, -22, -47, -22, -56, 3, 0x8a6b45);
    circle(shopG, -22, -57, 4, 0x9fb6b8);
    rect(shopG, 10, -43, 22, 4, 0x8a6b45);
    rect(shopG, 10, -48, 4, 9, 0x8a6b45);
    this.scenery.addChild(shopG);
    shopG.x = 4665; shopG.y = 600;
    this.stations.push({ type: 'shop', x: 4665, y: 600, range: 86 });

    // прилавок на площади — уже нарисованная палатка
    this.stations.push({ type: 'trade', x: 7720, y: 600, range: 94, mult: 1.12, label: 'Клава покупает' });

    // огород
    const bedXs = [820, 870, 920];
    bedXs.forEach((x, i) => {
      const c = new PIXI.Container();
      c.x = x; c.y = 600;
      const g = new PIXI.Graphics();
      c.addChild(g);
      this.scenery.addChild(c);
      this.gardenBeds.push({ x, index: i, container: c, graphics: g });
    });
    this.updateGarden(this.game.progress ? this.game.progress.garden : null);
  }

  updateGarden(progressGarden) {
    if (!this.gardenBeds.length) return;
    const beds = progressGarden || (this.game.progress && this.game.progress.garden) || [];
    for (const bed of this.gardenBeds) {
      const state = beds[bed.index] || { stage: 0, watered: false };
      bed.graphics.clear();
      drawGardenBed(bed.graphics, 0, 0, state.stage, state.watered);
    }
  }

  setDay(day) {
    this.day = day;
    this.updateGates();
    this.updateFestivalVisibility();
    if (this.skySprite && this.skyVariants) {
      this.skySprite.texture = this.skyVariants[U.clamp(day - 1, 0, 2)];
    }
    this.starFactor = day === 2 ? 0.35 : day === 3 ? 0.6 : 1;
    if (this.dayTint) {
      this.dayTint.alpha = day === 2 ? 0.045 : day === 3 ? 0.06 : 0;
    }
    // На фестиваль приходят все. После фестиваля они остаются на площади.
    const festivalSpots = { zina: 7520, stas: 7950, grisha: 8090, pavel: 8170, klava: 7830, arkady: 8900 };
    for (const npc of this.npcs) {
      if (!npc || npc.gone || npc.walking) continue;
      if (npc.kind === 'arkady') {
        const show = day >= 3;
        npc.hidden = !show;
        npc.container.visible = show;
        if (show) {
          npc.x = 8900; npc.y = 600; npc.facing = -1;
          npc.container.scale.x = npc.facing;
          npc.container.x = npc.x;
          npc.container.y = npc.y;
        }
        continue;
      }
      const spot = festivalSpots[npc.kind];
      if (day >= 3 && spot !== undefined) {
        npc.x = spot;
        npc.y = 600;
        npc.facing = npc.kind === 'zina' || npc.kind === 'klava' ? 1 : -1;
        npc.container.scale.x = npc.facing;
      } else if (npc.def && npc.def.x !== undefined && npc.kind !== 'boris') {
        npc.x = npc.baseX;
        npc.y = 600;
        npc.facing = npc.def.facing === undefined ? 1 : npc.def.facing;
        npc.container.scale.x = npc.facing;
      }
      npc.container.x = npc.x;
      npc.container.y = npc.y;
    }
    if (this.borisFinal) {
      const bx = day >= 3 ? 8500 : 5290;
      this.borisFinal.x = bx;
      this.borisFinal.container.x = bx;
    }
    this.setFestivalLanterns(this.game && this.game.progress ? this.game.progress.festivalLanterns : []);
    if (this.game && this.game.ui && this.game.ui.hud) this.game.ui.updateHUD();
    if (this.game && this.game.world) this.updateGarden(this.game.progress.garden);
  }

  resetDaily() {
    const side = this.game && this.game.progress ? this.game.progress.side : {};
    for (const c of this.collectibles) {
      if (c.type === 'flashlight' && side.flashlight && side.flashlight !== 'none' && side.flashlight !== 'search') continue;
      if (c.type === 'lure' && side.lure && side.lure !== 'none' && side.lure !== 'search') continue;
      c.collected = false;
      c.collectT = 0;
      c.container.visible = true;
      c.container.alpha = 1;
      c.container.scale.set(1);
      c.container.x = c.baseX;
    }
    this.updateGarden(this.game.progress ? this.game.progress.garden : null);
  }

  applyProgress(progress, flags) {
    if (flags && flags.borisIntro && this.borisIntro) {
      this.borisIntro.gone = true;
      this.borisIntro.container.visible = false;
    }
    if (this.tutorialDummy) {
      const done = !!(flags && flags.broomTutorial);
      this.tutorialDummy.defeated = done;
      this.tutorialDummy.container.visible = !done;
    }
    this.setDay(progress.day || 1);
    this.resetDaily();
    this.updateGarden(progress.garden);
  }

  drawBrokenBridge(g) {
    // обломки моста
    poly(g, [[1885, 640], [1900, 636], [1900, 652], [1886, 658]], 0x4a3422);
    line(g, 1880, 642, 1870, 630, 2, 0x2f241a);
    line(g, 1882, 646, 1868, 646, 2, 0x2f241a);
    poly(g, [[2842, 640], [2856, 632], [2852, 654], [2838, 662]], 0x4a3422);
    line(g, 2858, 630, 2870, 618, 2, 0x2f241a);
    // торчащие сваи
    line(g, 1945, 690, 1948, 620, 5, 0x3a2a1c);
    line(g, 1975, 690, 1970, 636, 4, 0x332419);
    line(g, 2820, 690, 2818, 628, 5, 0x3a2a1c);
  }

  drawSpring(g, x, baseY) {
    ellipse(g, x, baseY, 70, 16, 0x303b3c, 0.8);
    ellipse(g, x, baseY - 2, 50, 9, 0x4c8192, 0.55);
    ellipse(g, x, baseY - 3, 32, 5, 0x8fd3df, 0.4);
    drawStones(g, x - 40, baseY, 88, 5);
    drawStones(g, x + 36, baseY, 89, 4);
    // сруб-желоб
    poly(g, [[x - 18, baseY - 12], [x + 18, baseY - 12], [x + 13, baseY - 4], [x - 13, baseY - 4]], 0x4a3826);
    line(g, x - 16, baseY - 10, x + 16, baseY - 10, 2, 0x7a5a38);
    // ковш
    line(g, x + 20, baseY - 18, x + 32, baseY - 4, 1.5, 0x6b583c);
    circle(g, x + 20, baseY - 18, 4, 0x77664a);
  }

  drawStringLights(g) {
    const points = [];
    const startX = 5380, endX = 5490;
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      const x = U.lerp(startX, endX, t);
      const y = 425 + Math.sin(t * Math.PI) * 26;
      points.push([x, y]);
    }
    g.lineStyle(1.2, 0x2e2a22, 0.8);
    points.forEach(([x, y], i) => { if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
    // от вывески к дому
    g.moveTo(4360, 516); g.lineTo(4560, 480); g.lineTo(4760, 468);
    this.stringBulbs = [];
    for (const [x, y] of points) {
      circle(g, x, y + 5, 2.2, 0xffd38a, 0.85);
      this.stringBulbs.push([x, y + 5]);
    }
    this.stringBulbs.push([4550, 494], [4660, 478], [4745, 465]);
  }

  buildCat(x, y) {
    const c = new PIXI.Container();
    c.x = x; c.y = y;
    const g = new PIXI.Graphics();
    const body = new PIXI.Graphics();
    ellipse(body, 0, -7, 22, 12, 0x14171c);
    circle(body, 12, -17, 8, 0x171a20);
    poly(body, [[6, -24], [8, -31], [12, -24]], 0x171a20);
    poly(body, [[14, -24], [18, -31], [20, -23]], 0x171a20);
    // глаза
    circle(body, 10, -18, 1.4, 0xd8b36a, 0.9);
    circle(body, 15, -18, 1.4, 0xd8b36a, 0.9);
    g.addChild(body);
    // хвост
    const tail = new PIXI.Graphics();
    tail.lineStyle(4, 0x14171c, 1);
    tail.moveTo(-20, -6);
    tail.bezierCurveTo(-38, -10, -34, -34, -18, -30);
    g.addChild(tail);
    c.addChild(g);
    c.scale.x = -1;
    this.scenery.addChild(c);
    this.cat = { c, tail, phase: Math.random() * 9 };
    const glow = softGlow(0xd8b36a, 60, 0.1);
    glow.x = 12; glow.y = -18;
    c.addChild(glow);
  }

  buildLights() {
    const add = (x, y, size, color, alpha, speed, scaleY) => {
      const s = softGlow(color, size, alpha);
      s.x = x; s.y = y;
      if (scaleY) s.scale.y = scaleY;
      this.lights.addChild(s);
      this.lightList.push({ s, base: alpha, speed: speed || 1.2, phase: Math.random() * 9 });
      return s;
    };

    // дом
    add(255, 512, 280, 0xffb35e, 0.20, 1.1);
    add(255, 596, 380, 0xffa64a, 0.10, 0.8, 0.32);
    add(141, 566, 150, 0xffb35e, 0.12, 1.4);
    // фонарик на плотах
    // ульи
    add(1190, 485, 100, 0xffc46e, 0.07, 1.7);
    // Стас
    add(1750, 560, 150, 0xffb15b, 0.18, 1.2);
    add(1750, 594, 210, 0xffa64a, 0.08, 0.7, 0.3);
    // родник
    add(3140, 582, 180, 0x8fd9e2, 0.16, 1.4);
    // пивоварня
    add(4849, 445, 300, 0xffb35e, 0.28, 1.15);
    add(5285, 445, 300, 0xffb35e, 0.28, 1.3);
    add(5070, 552, 380, 0xffb35e, 0.22, 1.05);
    add(5070, 606, 650, 0xffa64a, 0.15, 0.75, 0.28);
    add(5520, 550, 330, 0xff9646, 0.30, 2.1);
    add(5520, 578, 180, 0xff7a30, 0.34, 3.2);
    add(5520, 592, 420, 0xff8a3a, 0.15, 1.7, 0.3);
    // гирлянда
    for (const [x, y] of this.stringBulbs) {
      const s = add(x, y, 38, 0xffd38a, 0.24, 2.4);
      s.blendMode = PIXI.BLEND_MODES.ADD;
    }
    // мельница
    add(7038, 500, 240, 0xffb35e, 0.2, 1.15);
    add(7000, 598, 360, 0xffa64a, 0.09, 0.8, 0.3);
    add(7130, 540, 160, 0xa9d6dc, 0.12, 1.4);
    // площадь
    add(7565, 490, 240, 0xffb35e, 0.18, 1.2);
    add(8970, 500, 260, 0xffb35e, 0.18, 1.3);
    add(9200, 500, 180, 0xffb35e, 0.14, 1.0);
    add(7720, 540, 260, 0xffc36b, 0.18, 1.3);
    add(8520, 500, 500, 0xffb45e, 0.16, 0.9);
    for (let i = 0; i < 16; i++) {
      const lx = 8280 + i * 29;
      const ly = 420 + Math.sin(i / 15 * Math.PI) * 16;
      add(lx, ly, 40, 0xffd38a, 0.25, 2.4);
    }
    // старая плотина
    add(9600, 560, 260, 0x9ccdd8, 0.16, 1.2);
    add(10250, 500, 360, 0x9ccdd8, 0.18, 1.0);
    add(10220, 350, 220, 0x8fc7d4, 0.12, 1.6);
    // огоньки-светляки
    const rng = mulberry32(4321);
    const zones = [[150, 940], [1000, 1900], [2050, 2820], [2950, 4200], [4600, 5750], [5850, 7350], [7400, 9100], [9250, 10550]];
    for (let i = 0; i < 78; i++) {
      const z = zones[Math.floor(rng() * zones.length)];
      const x = z[0] + rng() * (z[1] - z[0]);
      const y = 430 + rng() * 170;
      const s = glowSprite(0xffdf97, 9 + rng() * 14, 0.38 + rng() * 0.32);
      s.x = x; s.y = y;
      this.lights.addChild(s);
      this.fireflies.push({
        s, ox: x, oy: y, ph: rng() * TAU,
        ax: 18 + rng() * 44, ay: 12 + rng() * 30,
        sp: 0.3 + rng() * 0.6,
      });
    }
  }

  buildForeground() {
    const rng = mulberry32(8877);
    for (let i = 0; i < 70; i++) {
      const x = 80 + rng() * 10500;
      const baseline = 600;
      const g = new PIXI.Graphics();
      const n = 3 + Math.floor(rng() * 4);
      for (let k = 0; k < n; k++) {
        const h = 12 + rng() * 26;
        const sx = (rng() - 0.5) * 14;
        g.lineStyle(1.6, k % 2 ? 0x3b4936 : 0x526143, 0.85);
        g.moveTo(sx, 0);
        g.quadraticCurveTo(sx + 3, -h * 0.5, sx + (rng() - 0.5) * 10, -h);
      }
      g.x = x; g.y = baseline + 2;
      this.foreground.addChild(g);
      this.foregroundBlades.push({ g, phase: rng() * TAU, amp: 0.015 + rng() * 0.02, base: 0 });
    }
    // несколько высоких стеблей у воды
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1900 : 2850;
      const x = side + (i % 2 ? -1 : 1) * (4 + (i % 3) * 6);
      const g = new PIXI.Graphics();
      for (let k = 0; k < 3; k++) {
        g.lineStyle(1.5, 0x4c5137, 0.8);
        g.moveTo(0, 0);
        g.quadraticCurveTo(3, -20 - k * 6, 8 + k * 3, -36 - k * 9);
      }
      g.x = x; g.y = 690; g.alpha = 0.8;
      this.foreground.addChild(g);
      this.foregroundBlades.push({ g, phase: rng() * TAU, amp: 0.02, base: 0 });
    }
  }

  /* ================= СУЩНОСТИ ================= */

  buildEntities() {
    // ингредиенты
    const items = [
      ['honey', 1240, 476, 'honey1'],
      ['honey', 1445, 416, 'honey2'],
      ['honey', 1690, 471, 'honey3'],
      ['water', 2480, 616, 'water1'],
      ['water', 2895, 576, 'water2'],
      ['water', 3140, 576, 'water3'],
      ['water', 6785, 480, 'water4'],
      ['hop', 3270, 423, 'hop1'],
      ['hop', 3700, 298, 'hop2'],
      ['hop', 4130, 468, 'hop3'],
      // лес и мельница
      ['berries', 6180, 420, 'berries1'],
      ['berries', 6570, 405, 'berries2'],
      ['berries', 7260, 435, 'berries3'],
      ['mushroom', 5960, 495, 'mush1'],
      ['mushroom', 6450, 560, 'mush2'],
      ['mushroom', 7150, 560, 'mush3'],
      // площадь и дорога
      ['herb', 6385, 495, 'herb1'],
      ['herb', 7610, 560, 'herb2'],
      ['herb', 7980, 560, 'herb3'],
      // старая плотина
      ['spring', 9800, 340, 'spring1'],
      ['spring', 10370, 410, 'spring2'],
      ['mushroom', 9600, 410, 'mush4'],
      ['mushroom', 9980, 410, 'mush5'],
      ['hop', 10550, 340, 'hop4'],
      // поручения
      ['flashlight', 7080, 556, 'flashlight'],
      ['lure', 2890, 560, 'lure'],
    ];
    for (const [type, x, y, id] of items) {
      const c = new Collectible(this.game, type, x, y, id);
      this.collectibles.push(c);
      this.entityLayer.addChild(c.container);
    }

    // фонари
    const lanterns = [
      [760, 600],
      [1105, 600],
      [1810, 600],
      [2930, 600],
      [4180, 600],
      [5950, 600],
      [7400, 600],
      [8130, 600],
      [9600, 600],
    ];
    lanterns.forEach(([x, y], i) => {
      const c = new CheckpointLantern(this, x, y, i);
      this.checkpoints.push(c);
      this.entityLayer.addChild(c.container);
    });

    // NPC
    const npcDefs = [
      {
        kind: 'boris', name: 'Борисыч', portrait: 'boris', x: 960, y: 600, facing: -1,
        lines: (game) => [
          { speaker: 'Борисыч', text: 'Ну здорово, Витя. Три года не виделись. Хорошо выглядишь. Для человека, который должен мне сорок семь тысяч.' },
          { speaker: 'Витя', text: 'Здравствуй, Борисыч. Я верну.' },
          { speaker: 'Борисыч', text: 'Вернёт он. Слушай сюда. Три дня. Не будет денег — заберу двор. И чаны твоего отца.' },
          { speaker: 'Витя', text: 'Чаны не твои. И двор не твой.' },
          { speaker: 'Борисыч', text: 'Пока что — мои. Три дня, Витя. И не вздумай опять за бутылку. Я серьёзно.' },
          { speaker: 'Витя', text: 'Не вздумаю. Я варю. Значит, буду варить.' },
        ],
      },
      {
        kind: 'zina', name: 'Баба Зина', portrait: 'zina', x: 1490, y: 600, facing: 1,
        lines: (game) => {
          const p = game.progress;
          const side = p.side.garden;
          if (p.day >= 3) return [
            { speaker: 'Баба Зина', text: 'Витенька! Я на площадь выбралась. Ноги еле донесли, зато мёд донесли.' },
            { speaker: 'Витя', text: 'Спасибо, баба Зина. Сегодня деревня попробует, что мы сварили.' },
            { speaker: 'Баба Зина', text: 'Попробует. И пусть только кто скажет, что сладко. Я сама ему скажу.' },
          ];
          if (side === 'none') return [
            { speaker: 'Баба Зина', text: 'Витенька! Слыхала про долг. Опять, поди, в бутылку смотришь?' },
            { speaker: 'Витя', text: 'Не смотрю, баба Зина. Три года уже.' },
            { speaker: 'Баба Зина', text: 'Знаю, милый. Прости старую дуру. Мёд у меня есть, да только на верхних полках. Собери три сота — я туда не залезу.' },
            { speaker: 'Витя', text: 'Соберу. Сварю медовуху, как батя варил.' },
            { speaker: 'Баба Зина', text: 'А земля у двора пустует. На, возьми клубни хмеля. Посадишь в грядки — через день соберёшь. Только полей, слышишь?' },
            { speaker: 'Витя', text: 'Посажу. Спасибо, баба Зина.' },
          ];
          if (side === 'planted') return [
            { speaker: 'Баба Зина', text: 'Клубни у тебя. Грядки — у двора, три штуки. Сажай, милый. Земля ждёт.' },
            { speaker: 'Витя', text: 'Сейчас посажу.' },
            { speaker: 'Баба Зина', text: 'И полей. Хмель любит воду и терпение. Как и люди.' },
          ];
          if (side === 'growing') return [
            { speaker: 'Баба Зина', text: 'Растёт? Вот и славно. Полей, если земля сухая. А через ночь ещё поднимется.' },
            { speaker: 'Витя', text: 'Поливаю, баба Зина.' },
            { speaker: 'Баба Зина', text: 'И не пей, Витя. Вари — и отдавай долг. Слышишь?' },
          ];
          if (side === 'ripe') return [
            { speaker: 'Баба Зина', text: 'Глянь-ка, хмель-то какой поднялся! Иди собирай, милый. Это твой урожай.' },
            { speaker: 'Витя', text: 'Спасибо, баба Зина. Я его в медовуху.' },
            { speaker: 'Баба Зина', text: 'В медовуху. Конечно. А я думала, ты его на веник пустишь.' },
          ];
          return [
            { speaker: 'Баба Зина', text: 'Всё собрал? И мёд, и хмель, и воду? Ну, Витя... Иди. Я в тебя верила.' },
            { speaker: 'Баба Зина', text: 'Только не говори никому, что я это сказала. У меня репутация.' },
            { speaker: 'Витя', text: 'Никому, баба Зина.' },
          ];
        },
      },
      {
        kind: 'stas', name: 'Стас', portrait: 'stas', x: 1730, y: 600, facing: 1,
        lines: (game) => {
          const p = game.progress;
          const side = p.side.lure;
          if (p.day >= 3 && side === 'done') return [
            { speaker: 'Стас', text: 'Витя! Я на фестиваль пришёл. С блесной. Для солидности.' },
            { speaker: 'Витя', text: 'А рыба?' },
            { speaker: 'Стас', text: 'Рыба сегодня тоже празднует. В смысле — не клюёт. Но я не в обиде.' },
          ];
          if (side === 'none' && p.day >= 2) return [
            { speaker: 'Стас', text: 'Витя! Слыхал, ты уже первую партию выгнал. Молодец. Слушай, у меня беда.' },
            { speaker: 'Витя', text: 'Рыба не клюёт?' },
            { speaker: 'Стас', text: 'Хуже. Счастливую блесну потерял. Отцовскую, между прочим. Камыши на том берегу обыскал — нету. Может, ты глазастее?' },
            { speaker: 'Витя', text: 'Найду. За рекой, в камышах.' },
            { speaker: 'Стас', text: 'Вот спасибо. А я пока... посторожу воду. Кто-то же должен.' },
          ];
          if (side === 'search') return [
            { speaker: 'Стас', text: 'Блесна, Витя. Золотая, с крючком. В камышах на том берегу. Я бы сам, но у меня сапоги промокают.' },
            { speaker: 'Витя', text: 'Уже иду.' },
          ];
          if (side === 'found') return [
            { speaker: 'Стас', text: 'Нашёл?! Дай сюда... Она! Она, родимая! Смотри, как играет на свету.' },
            { speaker: 'Витя', text: 'Рад, что помог.' },
            { speaker: 'Стас', text: 'Вот, возьми. Не за блесну — за то, что не прошёл мимо. И это... медовухи оставь. Я в долгу не останусь.' },
          ];
          if (side === 'done') return [
            { speaker: 'Стас', text: 'Рыба клюёт, Витя. Первый раз за месяц. Ты приносишь удачу. Не пей только. Примета плохая.' },
            { speaker: 'Витя', text: 'Не пью. Варю.' },
            { speaker: 'Стас', text: 'Вот и правильно. Варить — это тоже ловить. Только улов потом сам себя не съест.' },
          ];
          if (p.stage === STAGES.VILLAGE || p.stage === STAGES.BREW3 || p.stage === STAGES.JUDGE) return [
            { speaker: 'Стас', text: 'Слыхал, сегодня фестиваль? Ты выставляешься? Ну, тогда я приду. С блесной. Для солидности.' },
            { speaker: 'Витя', text: 'Приходи, Стас.' },
          ];
          return [
            { speaker: 'Стас', text: 'Витя! Сколько лет. Слышал, ты завязал. Молодец.' },
            { speaker: 'Витя', text: 'Слышал, ты рыбу ловишь.' },
            { speaker: 'Стас', text: 'Ловлю. Улов — ноль. Зато не должен никому сорок семь тысяч.' },
            { speaker: 'Витя', text: 'Я тоже скоро не буду.' },
            { speaker: 'Стас', text: 'Переправа сгнила. Прыгай по плотам — они тут с войны стоят. А воду на том берегу бери, у родника. Три бутылки, не меньше.' },
            { speaker: 'Витя', text: 'Спасибо, Стас.' },
            { speaker: 'Стас', text: 'Да не за что. Медовухи потом принеси. Я тебе за неё... эх, ладно, просто принеси.' },
          ];
        },
      },
      {
        kind: 'grisha', name: 'Гриша', portrait: 'grisha', x: 3860, y: 600, facing: 1,
        lines: (game) => {
          const p = game.progress;
          const side = p.side.flashlight;
          if (side === 'none' && p.day >= 2) return [
            { speaker: 'Гриша', text: 'Дядя Витя! Я фонарик потерял. На старой мельнице, когда за грибами ходил. Мама убьёт.' },
            { speaker: 'Витя', text: 'А что ты там делал ночью?' },
            { speaker: 'Гриша', text: 'Грибы... искал. Ну и хмель, может. Немножко. Ты же меня научил?' },
            { speaker: 'Витя', text: 'Ничему я тебя такому не учил. Ладно, найду фонарик.' },
            { speaker: 'Гриша', text: 'Он где-то в мешках у мельницы. Я тебе потом помогать буду! Честно-честно.' },
          ];
          if (side === 'search') return [
            { speaker: 'Гриша', text: 'Фонарик, дядя Витя. У мельницы, в мешках. Он железный, с синим стеклом. Я бы сам, но там Пал Палыч ругается.' },
            { speaker: 'Витя', text: 'Найду.' },
          ];
          if (side === 'found') return [
            { speaker: 'Гриша', text: 'Мой фонарик! Работает! Дядя Витя, ты лучший!' },
            { speaker: 'Витя', text: 'Не потеряй больше.' },
            { speaker: 'Гриша', text: 'Не потеряю. Вот, возьми деньги. Я копил на картридж. Но тебе нужнее.' },
          ];
          if (side === 'done') return [
            { speaker: 'Гриша', text: 'Дядя Витя, а на фестивале правда будут судить медовуху? А можно я тоже попробую? В смысле — квас!' },
            { speaker: 'Витя', text: 'Квас будет. И фонарики.' },
            { speaker: 'Гриша', text: 'Тогда я главный по фонарикам. Уже.' },
          ];
          return [
            { speaker: 'Гриша', text: 'Дядя Витя! А правда, что ты пиво варишь? Мне пацаны сказали.' },
            { speaker: 'Витя', text: 'Правда. Медовуху и пиво. Только это не для пацанов.' },
            { speaker: 'Гриша', text: 'Я знаю! Я попробую, когда вырасту. А пока — я тебе хмель покажу. Вон, на самых высоких ветках. У меня фонарик есть.' },
            { speaker: 'Витя', text: 'Спасибо, Гриша. Ты настоящий помощник.' },
            { speaker: 'Гриша', text: 'Я знаю!' },
          ];
        },
      },
      {
        kind: 'pavel', name: 'Пал Палыч', portrait: 'pavel', x: 7160, y: 600, facing: -1,
        lines: (game) => {
          const p = game.progress;
          if (p.day >= 3) return [
            { speaker: 'Пал Палыч', text: 'Ну что, Витя. Я на площадь пришёл. Ноги старые, а любопытство молодое.' },
            { speaker: 'Витя', text: 'Посмотрите, Пал Палыч. Это ваш рецепт.' },
            { speaker: 'Пал Палыч', text: 'Наш. Только ты в него добавил себя. Так и должно быть.' },
          ];
          if (p.stage === STAGES.MILL) return [
            { speaker: 'Пал Палыч', text: 'Ты, что ли, Витя? Вылитый отец. Только глаза другие. Трезвые.' },
            { speaker: 'Витя', text: 'Вы знали отца?' },
            { speaker: 'Пал Палыч', text: 'Знал. Мы тут с ним варили «Отцовское», пока мельница не встала. Потом он умер, а я остался с пустыми мешками.' },
            { speaker: 'Пал Палыч', text: 'Держи дрожжи. Живые, из старой кадки. И запомни: хмель, мёд, вода — и время. Время важнее всего.' },
            { speaker: 'Витя', text: 'Сварю. Как он.' },
            { speaker: 'Пал Палыч', text: 'Свари. Только к вечеру жди гостей. Борисыч не любит, когда долги начинают пахнуть прибылью.' },
            { speaker: 'Витя', text: 'Значит, встретим.' },
            { speaker: 'Пал Палыч', text: 'И вот ещё. Гришин фонарик в мешках валяется. Верни пацану, а то он тут всю ночь светил.' },
          ];
          if (p.stage === STAGES.BREW2 || p.stage === STAGES.DEFENSE) return [
            { speaker: 'Пал Палыч', text: 'Пиво не любит суеты. Сначала свари, потом дерись. Хотя с Борисычем и то и другое — одним вечером.' },
            { speaker: 'Витя', text: 'Я помню.' },
          ];
          if (p.stage === STAGES.PAY2 || p.stage === STAGES.SLEEP2) return [
            { speaker: 'Пал Палыч', text: 'Слыхал, ты выстоял. Отец бы тобой гордился. Он тоже не отдавал чан просто так.' },
            { speaker: 'Витя', text: 'Спасибо, Пал Палыч.' },
            { speaker: 'Пал Палыч', text: 'Иди. Фестиваль не ждёт. А я тут... мешки пересчитаю.' },
          ];
          return [
            { speaker: 'Пал Палыч', text: 'Мельница стоит, колесо скрипит, зато память жива. Это уже немало.' },
            { speaker: 'Витя', text: 'Немало.' },
            { speaker: 'Пал Палыч', text: 'Варку не бросай. И дверь за собой закрывай — тут сквозняк.' },
          ];
        },
      },
      {
        kind: 'klava', name: 'Клава', portrait: 'klava', x: 7830, y: 600, facing: -1,
        lines: (game) => {
          const p = game.progress;
          if (p.stage === STAGES.DAY3_START) return [
            { speaker: 'Клава', text: 'Витя! Ты вовремя. Сегодня «Тихий берег» судят. Нужна праздничная медовуха — с ягодами и травами. Рецепт мой, банка твоя. Приз пополам. Шучу. Почти.' },
            { speaker: 'Витя', text: 'А судьи кто?' },
            { speaker: 'Клава', text: 'Судьи — деревня. А деревня любит, когда вкусно и когда честно. Иди вари. Чан у тебя, я знаю.' },
            { speaker: 'Клава', text: 'Хмель, мёд, вода, ягоды, травы. Всё есть в лесу и на площади. И не вздумай продать праздничную партию до суда — я запомню.' },
          ];
          if (p.stage === STAGES.VILLAGE || p.stage === STAGES.BREW3) {
            const lit = (p.festivalLanterns || []).length;
            const lines = [
              { speaker: 'Клава', text: 'Ну что, «Зимний берег» готов? Неси сюда. Судьи уже скучают, а Борисыч делает вид, что ему всё равно.' },
              { speaker: 'Витя', text: 'Скоро будет.' },
              { speaker: 'Клава', text: 'Смотри, Витя. Сегодня деревня будет пить твою медовуху и вспоминать твоего отца. Не подведи.' },
            ];
            if (lit < 5) lines.push({ speaker: 'Клава', text: `И фонарики не забудь. Пять штук на площадках и у сцены. Зажжено ${lit} из 5 — площадь пока тёмная.` });
            else lines.push({ speaker: 'Клава', text: 'А фонарики уже горят. Вся площадь как в сказке. Ты только посмотри, сколько народу пришло.' });
            return lines;
          }
          if (p.stage === STAGES.JUDGE) {
            const hasFestival = (p.bottles || []).some(b => b.recipe === 'festival');
            if (!hasFestival) return [
              { speaker: 'Клава', text: 'Ну? Где медовуха? Пустые руки на суд не пускают.' },
              { speaker: 'Витя', text: 'Сейчас. Ещё одна партия.' },
              { speaker: 'Клава', text: 'Вари. Ингредиенты в лесу и на площади. И не продавай праздничную — я проверю.' },
            ];
            return [
              { speaker: 'Клава', text: 'Ну? Где медовуха? Давай сюда, попробуем.' },
              { speaker: 'Витя', text: 'Вот. «Зимний берег».' },
              { speaker: 'Клава', text: 'Так... ягоды, травы, мёд. И хмель. Ох, Витя. Ну-ка, ещё глоток. Для точности.' },
              { speaker: 'Клава', text: 'Ставлю высокую оценку. И приз — тебе. Деревня любит, когда вкусно и когда честно. А ты, похоже, и то и другое.' },
            ];
          }
          if (p.stage === STAGES.FINALE) return [
            { speaker: 'Клава', text: 'Иди к Борисычу, Витя. Он у сцены стоит. И не бойся. Сегодня никто не боится.' },
            { speaker: 'Витя', text: 'Спасибо, Клава.' },
            { speaker: 'Клава', text: 'Да не за что. Принеси ещё бутылку. В смысле — на следующий год.' },
          ];
          if (p.stage === STAGES.CITY_ORDER || p.stage === STAGES.CITY_PREP) return [
            { speaker: 'Клава', text: 'Аркадий из города. Важный, как закрытая бочка. Но платит, говорят, хорошо.' },
            { speaker: 'Витя', text: 'Мне нужны три бочки.' },
            { speaker: 'Клава', text: 'Значит, сваришь. А я пока пригляжу за площадью. И за фонариками.' },
          ];
          if (p.stage === STAGES.CITY_DAM) return [
            { speaker: 'Клава', text: 'На плотину собрался? Возьми фонарь. Там туман даже днём.' },
            { speaker: 'Витя', text: 'Возьму.' },
            { speaker: 'Клава', text: 'И грибы не ешь. Они для стаута.' },
          ];
          if (p.stage === STAGES.CITY_DELIVER) return [
            { speaker: 'Клава', text: 'Стаут готов? Неси Аркадию. А потом — сюда. Фестиваль без тебя не заканчивается.' },
            { speaker: 'Витя', text: 'Скоро.' },
          ];
          if (p.stage === STAGES.DONE) return [
            { speaker: 'Клава', text: 'А, главный винодел! Медовуха ещё есть? Нет? Тогда иди вари. Ладно, иди отдыхай. Но потом — вари.' },
            { speaker: 'Витя', text: 'Обязательно.' },
          ];
          return [
            { speaker: 'Клава', text: 'Витя! Ты вовремя. Сегодня «Тихий берег» судят. Нужна праздничная медовуха — с ягодами и травами. Рецепт мой, банка твоя. Приз пополам. Шучу. Почти.' },
            { speaker: 'Витя', text: 'А судьи кто?' },
            { speaker: 'Клава', text: 'Судьи — деревня. А деревня любит, когда вкусно и когда честно. Иди вари. Чан у тебя, я знаю.' },
          ];
        },
      },
      {
        kind: 'arkady', name: 'Аркадий', portrait: 'arkady', x: 8900, y: 600, facing: -1,
        lines: (game) => {
          const p = game.progress;
          const s = p.stage;
          if (s === STAGES.CITY_ORDER) return [
            { speaker: 'Аркадий', text: 'Добрый вечер. Аркадий Штольц, городская гильдия. Я видел вашу медовуху на суде.' },
            { speaker: 'Витя', text: 'И?' },
            { speaker: 'Аркадий', text: 'Город берёт три бочки. Медовуха, пиво и ваша «Зимний берег». Каждая — не ниже семидесяти по вашей шкале. Свежие. Сварите после нашего разговора.' },
            { speaker: 'Витя', text: 'Три бочки — это много.' },
            { speaker: 'Аркадий', text: 'Зато город платит сорок тысяч. И ещё один заказ: плотинный стаут. Но для него нужна вода со старой плотины. Сначала — три бочки.' },
            { speaker: 'Витя', text: 'Договорились.' },
          ];
          if (s === STAGES.CITY_PREP) {
            const done = Object.keys(p.cityBrews || {}).length;
            return [
              { speaker: 'Аркадий', text: `Три бочки, Витя. Свежие партии. Готово: ${done} из 3.` },
              { speaker: 'Витя', text: 'Варю.' },
              { speaker: 'Аркадий', text: 'И не забудь: качество не ниже семидесяти. Город не пьёт «почти».' },
            ];
          }
          if (s === STAGES.CITY_DAM) return [
            { speaker: 'Аркадий', text: 'Три бочки готовы. Теперь стаут. Вода — только со старой плотины, за площадью. Дорога открыта.' },
            { speaker: 'Витя', text: 'Найду родник.' },
            { speaker: 'Аркадий', text: 'Возьми грибы в лесу. И не потеряй рецепт. Он старый, как сама плотина.' },
          ];
          if (s === STAGES.CITY_DELIVER) return [
            { speaker: 'Аркадий', text: 'Стаут готов? Давай сюда. Город ждёт.' },
            { speaker: 'Витя', text: 'Готов. «Старая плотина».' },
            { speaker: 'Аркадий', text: 'Тёмный. Дымный. Хорошо. Вот сорок тысяч. Скажи Борисычу, что город теперь знает ваш берег.' },
          ];
          if (s === STAGES.FINALE || s === STAGES.DONE) return [
            { speaker: 'Аркадий', text: 'Город доволен. В следующем году пришлю заказ на весь фестиваль.' },
            { speaker: 'Витя', text: 'Присылайте.' },
          ];
          return [
            { speaker: 'Аркадий', text: 'Я представляю городскую гильдию. Сегодня смотрю, кто здесь варит.' },
            { speaker: 'Витя', text: 'Смотрите.' },
            { speaker: 'Аркадий', text: 'Уже вижу. После суда поговорим о заказе.' },
          ];
        },
      },
      {
        kind: 'boris', name: 'Борисыч', portrait: 'boris', x: 5290, y: 600, facing: 1,
        lines: (game) => {
          const p = game.progress;
          const s = p.stage;
          if (s === STAGES.SLEEP1 || s === STAGES.SLEEP2) return [
            { speaker: 'Борисыч', text: 'Иди спи, Витя. Завтра не станет легче, но станет понятнее.' },
            { speaker: 'Витя', text: 'Спокойной ночи, Борисыч.' },
            { speaker: 'Борисыч', text: 'Не ночи. Утру. Иди.' },
          ];
          if (s === STAGES.PAY1) {
            if (p.money >= PAYMENTS[1]) return [
              { speaker: 'Борисыч', text: 'Давай сюда. Семь тысяч. Живыми, не медовухой.' },
              { speaker: 'Витя', text: 'Живыми.' },
              { speaker: 'Борисыч', text: 'Хм. Первый раз за три года ты принёс мне деньги, а не обещания. Это уже почти характер.' },
              { speaker: 'Борисыч', text: 'Но это только седьмая часть. Иди поспи. Завтра поговорим о старой мельнице.' },
            ];
            return [
              { speaker: 'Борисыч', text: `Семь тысяч, Витя. У тебя ${formatMoney(p.money)} ₽. Ладно. Давай сколько есть. Остальное — потом.` },
              { speaker: 'Витя', text: 'Отдам. С процентами.' },
              { speaker: 'Борисыч', text: 'Не надо процентов. Просто не пропади. Иди поспи.' },
            ];
          }
          if (s === STAGES.DAY2_START) return [
            { speaker: 'Борисыч', text: 'Проснулся. Хорошо. Дорога на мельницу открыта — я велел снять замок.' },
            { speaker: 'Витя', text: 'Зачем тебе это?' },
            { speaker: 'Борисыч', text: 'Мне не зачем. Тебе зачем. Там старик Пал Палыч. Он помнит, как твой отец варил настоящее пиво.' },
            { speaker: 'Борисыч', text: 'Найдёшь его — найди и рецепт. А то твоя медовуха сладкая, как извинения.' },
            { speaker: 'Витя', text: 'Найду.' },
          ];
          if (s === STAGES.MILL || s === STAGES.BREW2) return [
            { speaker: 'Борисыч', text: 'Мельница в лесу. Иди. И не заставляй меня посылать за тобой людей.' },
            { speaker: 'Витя', text: 'Ты уже послал.' },
            { speaker: 'Борисыч', text: 'Это не люди. Это так... напоминание.' },
          ];
          if (s === STAGES.DEFENSE) return [
            { speaker: 'Борисыч', text: 'Не отдай чан, Витя! Я в него деньги вложил! То есть... в тебя. В тебя вложил.' },
            { speaker: 'Витя', text: 'Помоги лучше.' },
            { speaker: 'Борисыч', text: 'Я по документам. Документально помогу.' },
          ];
          if (s === STAGES.PAY2) {
            if (p.money >= PAYMENTS[2]) return [
              { speaker: 'Борисыч', text: 'Пятнадцать тысяч. Считаю.' },
              { speaker: 'Витя', text: 'Считай.' },
              { speaker: 'Борисыч', text: 'Сходится. И зачем ты такой честный стал? С тобой же разговаривать не о чем.' },
              { speaker: 'Борисыч', text: 'Иди спи. Завтра фестиваль. И... Витя. Ты видел, кто у мельницы крутился? Неважно. Иди.' },
            ];
            return [
              { speaker: 'Борисыч', text: `Пятнадцать тысяч. У тебя ${formatMoney(p.money)} ₽. Ладно. Давай сколько есть. Фестиваль всё спишет.` },
              { speaker: 'Витя', text: 'Спишет?' },
              { speaker: 'Борисыч', text: 'Шучу. Но давай сколько есть. Мне ещё с тобой на площадь идти.' },
            ];
          }
          if (s === STAGES.DAY3_START) return [
            { speaker: 'Борисыч', text: 'Фестиваль, Витя. Иди на площадь. Клава тебе всё расскажет. Она любит рассказывать.' },
            { speaker: 'Витя', text: 'А ты?' },
            { speaker: 'Борисыч', text: 'А я посмотрю. Мне за это не платят, но я посмотрю.' },
          ];
          if (s === STAGES.VILLAGE || s === STAGES.BREW3) return [
            { speaker: 'Борисыч', text: 'Сначала медовуха, потом разговоры. Клава ждёт. И судьи ждут. И вообще все ждут.' },
            { speaker: 'Витя', text: 'Я понял.' },
          ];
          if (s === STAGES.JUDGE) return [
            { speaker: 'Борисыч', text: 'Неси судьям. И не смотри на меня так. Я не судья. Я... наблюдатель.' },
            { speaker: 'Витя', text: 'Наблюдай.' },
          ];
          if (s === STAGES.CITY_ORDER || s === STAGES.CITY_PREP) return [
            { speaker: 'Борисыч', text: 'Городской покупатель. Аркадий. Смотри не продешеви, Витя. И не опозорь берег.' },
            { speaker: 'Витя', text: 'Я варю. Не торгуюсь.' },
            { speaker: 'Борисыч', text: 'Вот и правильно. А я посчитаю. Как всегда.' },
          ];
          if (s === STAGES.CITY_DAM) return [
            { speaker: 'Борисыч', text: 'Старая плотина? Там мой отец воду брал. И твой, наверное, тоже.' },
            { speaker: 'Витя', text: 'Значит, вода правильная.' },
            { speaker: 'Борисыч', text: 'Правильная. Иди. И вернись с бочкой, а не с историей.' },
          ];
          if (s === STAGES.CITY_DELIVER) return [
            { speaker: 'Борисыч', text: 'Неси Аркадию. Потом поговорим. У меня к тебе будет один последний счёт.' },
            { speaker: 'Витя', text: 'Последний?' },
            { speaker: 'Борисыч', text: 'Последний. Обещаю. Почти.' },
          ];
          if (s === STAGES.FINALE) return [
            { speaker: 'Борисыч', text: 'Ну вот. Стоишь. С медовухой. А три дня назад стоял без денег и без лица.' },
            { speaker: 'Витя', text: 'Три дня назад я ещё не знал, что у меня есть берег.' },
            { speaker: 'Борисыч', text: 'Твой отец был моим другом. И должником. Как ты. Только он умер, не успев отдать. А ты — успел.' },
            { speaker: 'Витя', text: 'Сколько осталось?' },
            { speaker: 'Борисыч', text: `Столько же, сколько было: ${formatMoney(Math.max(0, DEBT_TOTAL - p.debtPaid))} ₽. Но я вижу, что ты принёс. И вижу, что ты не пьёшь.` },
            { speaker: 'Витя', text: 'Я не пью. Я варю.' },
            { speaker: 'Борисыч', text: 'Знаю. Поэтому слушай: отдаёшь остаток — и остаёшься здесь хозяином. А я буду рядом. Считать. Иногда — помогать.' },
          ];
          if (s === STAGES.DONE) return [
            { speaker: 'Борисыч', text: 'Ну что, хозяин? Ещё по одной? В смысле — ещё партию. Я в доле.' },
            { speaker: 'Витя', text: 'В доле. Но варить буду я.' },
          ];
          return [
            { speaker: 'Борисыч', text: 'Чан ждёт, Витя. И я жду. И все ждут. Не тяни.' },
            { speaker: 'Витя', text: 'Я не тяну. Я варю.' },
          ];
        },
      },
    ];

    this.borisIntro = null;
    this.borisFinal = null;
    this.arkady = null;
    npcDefs.forEach((def) => {
      const npc = new NPC(this.game, def);
      this.npcs.push(npc);
      this.entityLayer.addChild(npc.container);
      if (def.x === 960) this.borisIntro = npc;
      if (def.x === 5290) this.borisFinal = npc;
      if (def.kind === 'arkady') {
        this.arkady = npc;
        npc.hidden = true;
        npc.container.visible = false;
      }
    });

    // таблички и чан как интерактивные точки
    this.vat = { x: 5520, y: 600, range: 110 };
    this.signs = [
      { x: 635, y: 600, range: 74, lines: [
        { speaker: 'Надпись', text: 'МЕДВЕДЕВО. Ночь первая.' },
        { speaker: 'Надпись', text: 'A / D — идти. Пробел — прыжок. E — действие. F — метла.' },
        { speaker: 'Надпись', text: 'TAB — журнал. T — дороги. M — звук. Если темно — ищи фонарь.' },
      ] },
      { x: 4455, y: 600, range: 74, lines: [
        { speaker: 'Надпись', text: 'ПИВОВАРНЯ «ТИХИЙ БЕРЕГ».' },
        { speaker: 'Надпись', text: 'Здесь варят. Здесь не пьют. (Почти.)' },
      ] },
      { x: 3690, y: 600, range: 70, lines: [
        { speaker: 'Надпись', text: 'ХМЕЛЬ. Не трогать. Это не для пацанов. — В.' },
      ] },
      { x: 5940, y: 600, range: 74, lines: [
        { speaker: 'Надпись', text: 'СТАРАЯ МЕЛЬНИЦА →' },
        { speaker: 'Надпись', text: 'Ночью не ходи. Днём тоже. Но если очень надо — иди.' },
      ] },
      { x: 7410, y: 600, range: 74, lines: [
        { speaker: 'Надпись', text: 'ПЛОЩАДЬ «ТИХИЙ БЕРЕГ».' },
        { speaker: 'Надпись', text: 'Фестиваль. Здесь судят медовуху и людей. Иногда — справедливо.' },
      ] },
      { x: 10080, y: 600, range: 82, lines: [
        { speaker: 'Надпись', text: 'СТАРАЯ ПЛОТИНА. Построена при царе, разобрана при советах, забыта при всех.' },
        { speaker: 'Надпись', text: 'Вода в роднике холодная. Грибы у камней — тёмные. Город платит за такую воду хорошо.' },
      ] },
    ];

    // пчёлы у ульев
    const beeSpots = [[1190, 486], [1410, 426], [1615, 481], [1200, 580]];
    beeSpots.forEach(([x, y], gi) => {
      for (let i = 0; i < 6; i++) {
        const b = new PIXI.Graphics();
        b.beginFill(0xffcf6a, 0.9); b.drawEllipse(0, 0, 2.2, 1.2); b.endFill();
        b.beginFill(0x231b12, 0.9); b.drawRect(-0.5, -1.1, 0.9, 2.2); b.endFill();
        this.entityLayer.addChild(b);
        this.bees.push({ g: b, ox: x, oy: y, ph: Math.random() * TAU, r: 8 + Math.random() * 24, sp: 0.6 + Math.random() * 0.8 });
      }
    });

    // вороны
    [[970, 552], [1695, 545], [3270, 454]].forEach(([x, y], i) => {
      const g = new PIXI.Graphics();
      g.lineStyle(2, 0x0a0d12, 0.95);
      g.moveTo(-8, 0); g.quadraticCurveTo(-4, -6, 0, 0); g.quadraticCurveTo(4, -6, 8, 0);
      g.beginFill(0x0a0d12); g.drawEllipse(0, -2, 3, 2); g.endFill();
      g.x = x; g.y = y;
      this.scenery.addChild(g);
      this.crows.push({ g, ox: x, oy: y, flew: false, vx: 0, vy: 0, life: 1 });
    });

    this.buildTutorialDummy();
    this.buildFestival();
  }

  buildFestival() {
    const group = new PIXI.Container();
    this.crowdLayer.addChild(group);
    this.festivalGroup = group;

    // гирлянды через площадь
    const bunt = new PIXI.Graphics();
    const strings = [[7420, 438, 8180, 462], [8180, 462, 8900, 438], [8900, 438, 9180, 470]];
    for (const [x1, y1, x2, y2] of strings) {
      bunt.lineStyle(1.2, 0x2b241c, 0.9);
      bunt.moveTo(x1, y1);
      bunt.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 28, x2, y2);
      for (let i = 1; i < 10; i++) {
        const t = i / 10;
        const x = U.lerp(x1, x2, t);
        const y = U.lerp(y1, y2, t) + Math.sin(t * Math.PI) * 28;
        const col = i % 3 === 0 ? 0x9b4f43 : i % 3 === 1 ? 0xc49a58 : 0x5c707a;
        poly(bunt, [[x - 5, y], [x + 5, y], [x, y + 12]], col, 0.9);
      }
    }
    group.addChild(bunt);

    // длинные столы с угощением
    const tables = [[7520, 1], [8880, -1], [9110, 1]];
    for (const [tx, dir] of tables) {
      const g = new PIXI.Graphics();
      rect(g, tx - 52, -31, 104, 7, 0x5a4028);
      rect(g, tx - 44, -24, 7, 24, 0x352518);
      rect(g, tx + 37, -24, 7, 24, 0x352518);
      for (let i = 0; i < 5; i++) {
        const mx = tx - 38 + i * 19;
        rect(g, mx - 3, -42, 6, 11, 0x39443b);
        circle(g, mx, -43, 3, i % 2 ? 0xd8a85c : 0xb9853f, 0.95);
      }
      circle(g, tx + dir * 5, -34, 9, 0x9b7444);
      circle(g, tx + dir * 5, -34, 6, 0xc69758);
      this.festivalGroup.addChild(g);
      g.x = 0; g.y = 600;
    }

    // толпа: силуэты, танцующие и поднимающие кружки
    const spots = [
      [7440, 600, 0.88, 0], [7510, 600, 0.78, 1], [7580, 600, 0.9, 2],
      [7700, 600, 0.8, 0], [7760, 600, 0.86, 1], [7820, 600, 0.76, 2],
      [7920, 600, 0.92, 0], [8010, 600, 0.82, 1], [8100, 600, 0.88, 2],
      [8160, 600, 0.78, 0], [8840, 600, 0.86, 1], [8910, 600, 0.76, 2],
      [8990, 600, 0.9, 0], [9070, 600, 0.82, 1], [9140, 600, 0.88, 2],
      [8300, 576, 0.8, 1], [8420, 576, 0.86, 2], [8610, 576, 0.82, 0],
      [8720, 576, 0.88, 1],
    ];
    const colors = [0x2b333a, 0x333a3b, 0x2a2f37, 0x3a3431, 0x303a36];
    const rng = mulberry32(77231);
    spots.forEach(([x, y, sc, dance], i) => {
      const c = new PIXI.Container();
      c.x = x; c.y = y; c.scale.set(sc);
      const g = new PIXI.Graphics();
      ellipse(g, 0, -2, 18, 5, 0x04070b, 0.28);
      const col = colors[i % colors.length];
      // тело
      poly(g, [[-12, -54], [-14, -18], [15, -18], [12, -54], [5, -58], [-5, -58]], col);
      // голова
      circle(g, 0, -66, 10, 0xa38361);
      // шапка/волосы
      ellipse(g, 0, -75, 11, 4, i % 2 ? 0x49392c : 0x39444a);
      rect(g, -6, -82, 12, 7, i % 2 ? 0x49392c : 0x39444a);
      // лицо
      circle(g, -3, -67, 1.1, 0x211c18, 0.85);
      circle(g, 3, -67, 1.1, 0x211c18, 0.85);
      line(g, -3, -61, 3, -61, 1, 0x5c4033, 0.7);
      // руки
      line(g, -13, -48, -22, -37, 3, col);
      line(g, 13, -48, 21, -36, 3, col);
      if (dance === 1) {
        // кружка
        rect(g, 18, -42, 8, 10, 0x9aa6a2);
        line(g, 26, -40, 29, -36, 1.5, 0x9aa6a2);
        line(g, 21, -42, 21, -48, 1.5, 0x9aa6a2);
      } else if (dance === 2) {
        // поднятая рука
        line(g, 22, -37, 27, -59, 2.5, col);
      }
      c.addChild(g);
      this.festivalGroup.addChild(c);
      this.crowdFigures.push({
        c, baseY: y, phase: rng() * TAU, dance: i % 3,
        amp: dance === 0 ? 1.2 : 2.8,
      });
    });

    // музыкант на сцене
    {
      const c = new PIXI.Container();
      c.x = 8490; c.y = 576;
      const g = new PIXI.Graphics();
      ellipse(g, 0, -2, 20, 5, 0x04070b, 0.3);
      poly(g, [[-12, -56], [-15, -19], [15, -19], [12, -56], [4, -60], [-4, -60]], 0x4d3a2e);
      circle(g, 0, -68, 10, 0xa38361);
      ellipse(g, 0, -77, 13, 4, 0x4a3a2b);
      rect(g, -7, -84, 14, 7, 0x4a3a2b);
      // гитара
      ellipse(g, 12, -40, 12, 9, 0x8a5b36);
      circle(g, 12, -40, 4, 0x35251a);
      line(g, 17, -46, 34, -62, 3, 0x5a3c25);
      circle(g, 34, -62, 4, 0x6e4a2e);
      c.addChild(g);
      this.festivalGroup.addChild(c);
      this.crowdFigures.push({ c, baseY: 576, phase: 1.3, dance: 1, amp: 1.5, musician: true });
    }

    // фонарики на площадках и у сцены
    const lanternDefs = [
      [8000, 500], [8255, 445], [8500, 500], [8755, 445], [8130, 600],
    ];
    lanternDefs.forEach(([x, y], i) => {
      const c = new PIXI.Container();
      c.x = x; c.y = y;
      const g = new PIXI.Graphics();
      drawLanternPost(g, 0, 0, false);
      c.addChild(g);
      const glow = softGlow(0xffb45e, 150, 0);
      glow.x = 20; glow.y = -60;
      glow.alpha = 0.13;
      c.addChild(glow);
      this.entityLayer.addChild(c);
      c.visible = false;
      this.festivalLanterns.push({
        index: i, x: x + 20, y: y - 60, baseX: x, baseY: y,
        container: c, g, glow, lit: false, phase: i * 1.7,
      });
    });

    // фестивальная отделка площадок: гирлянда и флажки, чтобы их было видно
    const festPlatforms = [[7940, 500, 130], [8190, 445, 130], [8430, 500, 130], [8680, 445, 130]];
    for (const [x, y, w] of festPlatforms) {
      const trim = new PIXI.Graphics();
      trim.lineStyle(1.1, 0x2b241c, 0.9);
      trim.moveTo(x + 5, y + 24);
      trim.quadraticCurveTo(x + w / 2, y + 34, x + w - 5, y + 24);
      for (let i = 0; i < 6; i++) {
        const t = (i + 0.5) / 6;
        const bx = x + 5 + (w - 10) * t;
        const by = y + 24 + Math.sin(t * Math.PI) * 10;
        circle(trim, bx, by, 2.1, 0xffcf72, 0.9);
      }
      for (let i = 0; i < 3; i++) {
        const bx = x + 18 + i * (w - 36) / 2;
        poly(trim, [[bx - 5, y + 27], [bx + 5, y + 27], [bx, y + 40]], i % 2 ? 0x9b4f43 : 0xc49a58, 0.9);
      }
      this.festivalGroup.addChild(trim);
    }

    group.visible = false;
  }

  updateFestivalVisibility() {
    const on = this.day >= 3;
    this.festivalActive = on;
    if (this.festivalGroup) this.festivalGroup.visible = on;
    for (const l of this.festivalLanterns) l.container.visible = on;
    if (!on) this.fireworkTimer = 5;
  }

  lightFestivalLantern(index, silent) {
    const l = this.festivalLanterns[index];
    if (!l || l.lit) return false;
    l.lit = true;
    l.g.clear();
    drawLanternPost(l.g, 0, 0, true);
    l.glow.alpha = 0.58;
    if (!silent) {
      this.spawnBurst(l.x, l.y, 0xffd38a, 18);
      this.game.audio.sfx('checkpoint');
    }
    return true;
  }

  setFestivalLanterns(litIndices) {
    const set = new Set(litIndices || []);
    for (const l of this.festivalLanterns) {
      if (set.has(l.index)) {
        l.lit = false;
        this.lightFestivalLantern(l.index, true);
      } else {
        l.lit = false;
        l.g.clear();
        drawLanternPost(l.g, 0, 0, false);
        l.glow.alpha = 0.13;
      }
    }
  }

  launchFirework() {
    const colors = [0xffb45e, 0xf1d296, 0xd47b73, 0x9cdcea, 0xa7c98d];
    const x = 7600 + Math.random() * 1350;
    const y = 150 + Math.random() * 120;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const flash = softGlow(color, 120, 0.5);
    flash.x = x; flash.y = y;
    this.addParticle(flash, { life: 0.25, grow: 3 });
    for (let i = 0; i < 34; i++) {
      const ang = (i / 34) * TAU + Math.random() * 0.12;
      const sp = 60 + Math.random() * 150;
      const s = glowSprite(color, 5 + Math.random() * 10, 0.75);
      s.x = x; s.y = y;
      this.addParticle(s, {
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        gravity: 28,
        life: 0.9 + Math.random() * 0.9,
        grow: -2,
      });
    }
    for (let i = 0; i < 14; i++) {
      const s = glowSprite(0xfff1c9, 2 + Math.random() * 4, 0.7);
      s.x = x; s.y = y;
      this.addParticle(s, {
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 180,
        gravity: 50,
        life: 0.5 + Math.random() * 0.6,
      });
    }
  }

  buildTutorialDummy() {
    const x = 3785, y = 600;
    const c = new PIXI.Container();
    c.x = x; c.y = y;
    const shadow = new PIXI.Graphics();
    ellipse(shadow, 0, 0, 27, 7, 0x04070b, 0.38);
    c.addChild(shadow);
    const g = new PIXI.Graphics();
    drawScarecrow(g, 0, 0);
    c.addChild(g);
    // маленькая табличка «F»
    const sign = new PIXI.Graphics();
    rect(sign, -45, -88, 30, 22, 0x4a3826);
    rect(sign, -43, -86, 26, 18, 0x82643d);
    line(sign, -30, -66, -30, -54, 3, 0x5a4128);
    const mark = makeText('F', {
      fontFamily: FONT_UI, fontSize: 13, fontWeight: '700', fill: 0x241a10,
    }, 0.5);
    mark.x = -30; mark.y = -77;
    c.addChild(sign, mark);
    this.entityLayer.addChild(c);
    this.tutorialDummy = {
      x, y, hp: 3, maxHp: 3, defeated: false,
      container: c, art: g, glow: 0,
    };
  }

  hideTutorialDummy() {
    if (!this.tutorialDummy) return;
    this.tutorialDummy.defeated = true;
    this.tutorialDummy.container.visible = false;
  }

  buildAmbience() {
    this.smokeTimer = 0;
    this.steamTimer = 0;
    this.rippleTimer = 0;
    this.waterT = 0;
    this.shootTimer = 9 + Math.random() * 10;
  }

  buildWeather() {
    const rng = mulberry32(2029);
    const colors = [0xa77a43, 0x8e5a3a, 0x7c854f, 0xb08a4e, 0x6c7446];
    for (let i = 0; i < 34; i++) {
      const g = new PIXI.Graphics();
      const c = colors[Math.floor(rng() * colors.length)];
      const s = 1.6 + rng() * 2.6;
      g.beginFill(c, 0.45 + rng() * 0.3);
      g.drawEllipse(0, 0, s * 1.7, s);
      g.endFill();
      g.lineStyle(0.7, c, 0.35);
      g.moveTo(-s * 1.5, 0); g.lineTo(-s * 2.2, -s * 0.7);
      g.x = rng() * 1280;
      g.y = rng() * 720;
      g.alpha = 0.32 + rng() * 0.4;
      this.weatherRoot.addChild(g);
      const scale = 0.55 + rng() * 0.65;
      g.scale.set(scale);
      this.leaves.push({
        g, x: g.x, y: g.y, vx: -8 - rng() * 18, vy: 8 + rng() * 16,
        sway: 1 + rng() * 2.5, ph: rng() * TAU, rot: rng() * TAU, rs: (rng() - 0.5) * 1.6,
        size: scale,
      });
    }
  }

  buildFrame() {
    const g = new PIXI.Graphics();
    // ветка сверху слева
    g.lineStyle(10, 0x04080d, 0.92);
    g.moveTo(-30, -10);
    g.bezierCurveTo(120, 60, 190, 70, 300, 40);
    g.lineStyle(5, 0x04080d, 0.9);
    g.moveTo(105, 48); g.bezierCurveTo(130, 90, 155, 120, 190, 155);
    g.moveTo(235, 54); g.bezierCurveTo(260, 92, 290, 110, 320, 122);
    g.lineStyle(3, 0x050a10, 0.85);
    g.moveTo(40, 25); g.lineTo(65, 95);
    g.moveTo(160, 68); g.lineTo(142, 128);
    // листья
    const rng = mulberry32(123);
    for (let i = 0; i < 16; i++) {
      const x = 30 + rng() * 290;
      const y = 20 + rng() * 125;
      g.beginFill(0x050b10, 0.85);
      g.drawEllipse(x, y, 10 + rng() * 9, 4 + rng() * 4);
      g.endFill();
    }
    // ветка справа
    g.lineStyle(7, 0x04080d, 0.88);
    g.moveTo(1310, -20);
    g.bezierCurveTo(1230, 50, 1160, 70, 1100, 72);
    g.lineStyle(3, 0x04080d, 0.85);
    g.moveTo(1170, 66); g.bezierCurveTo(1160, 100, 1140, 118, 1110, 136);
    for (let i = 0; i < 9; i++) {
      g.beginFill(0x050b10, 0.8);
      g.drawEllipse(1100 + rng() * 190, 20 + rng() * 100, 8 + rng() * 8, 3 + rng() * 3);
      g.endFill();
    }
    this.frameRoot.addChild(g);

    // нижняя кинематографическая кромка
    const shade = new PIXI.Sprite(linearGradientTexture(1280, 170, [
      [0, 'rgba(3,6,11,0)'],
      [0.5, 'rgba(3,6,11,.25)'],
      [1, 'rgba(3,6,11,.78)'],
    ], true));
    shade.x = 0; shade.y = 550;
    this.frameRoot.addChild(shade);

    const fringe = new PIXI.Graphics();
    const frng = mulberry32(7788);
    fringe.beginFill(0x050a0e, 0.9);
    fringe.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 10) {
      const h = 10 + Math.sin(x * 0.031) * 8 + frng() * 26;
      fringe.lineTo(x, 720 - h);
    }
    fringe.lineTo(1280, 720);
    fringe.closePath();
    fringe.endFill();
    for (let i = 0; i < 55; i++) {
      const x = frng() * 1280;
      const h = 18 + frng() * 45;
      fringe.lineStyle(1.4, 0x03070b, 0.8);
      fringe.moveTo(x, 725);
      fringe.quadraticCurveTo(x + 4, 720 - h * 0.5, x + (frng() - 0.5) * 18, 720 - h);
    }
    this.frameRoot.addChild(fringe);
  }

  addLightToWorld(x, y, size, color, alpha) {
    const s = softGlow(color, size, alpha);
    s.x = x; s.y = y;
    this.lights.addChild(s);
    return s;
  }

  /* ================= ОБНОВЛЕНИЕ ================= */

  update(dt, t, camera) {
    this.time = t;
    this.camera = camera;

    // параллакс
    this.worldRoot.x = -camera.x + camera.shakeX;
    this.worldRoot.y = -camera.y + camera.shakeY;
    this.skyRoot.x = camera.shakeX * 0.35;
    this.skyRoot.y = camera.shakeY * 0.35;
    for (const layer of this.parallaxLayers) {
      layer.c.x = -camera.x * layer.factor + camera.shakeX * layer.factor;
      layer.c.y = -camera.y * layer.factor * 0.18;
    }
    this.weatherRoot.x = camera.shakeX * 0.5;
    this.weatherRoot.y = camera.shakeY * 0.5;

    // звёзды
    for (const s of this.stars) {
      s.alpha = s.baseAlpha * (0.72 + 0.28 * Math.sin(t * s.twinkle + s.phase)) * this.starFactor;
    }
    this.moonHalo.alpha = 0.30 + Math.sin(t * 0.5) * 0.035;
    this.moonCore.alpha = 0.94 + Math.sin(t * 1.2) * 0.03;
    this.moonCloud.x = 1010 + Math.sin(t * 0.05) * 90;
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > 1500) c.x = -350;
    }
    for (const f of this.fogBands) {
      f.x += f.speed * dt;
      if (f.x > 1600) f.x = -450;
    }

    // падающая звезда
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && !this.shootingStar) {
      this.shootTimer = 16 + Math.random() * 22;
      const s = glowSprite(0xdde9ff, 60, 0.55);
      s.width = 90; s.height = 2.2;
      s.x = 200 + Math.random() * 800;
      s.y = 40 + Math.random() * 200;
      s.rotation = 0.28;
      this.skyRoot.addChild(s);
      this.shootingStar = { s, vx: 420, vy: 130, life: 1.1 };
    }
    if (this.shootingStar) {
      const ss = this.shootingStar;
      ss.life -= dt;
      ss.s.x += ss.vx * dt; ss.s.y += ss.vy * dt;
      ss.s.alpha = Math.max(0, ss.life) * 0.55;
      if (ss.life <= 0) { this.skyRoot.removeChild(ss.s); this.shootingStar = null; }
    }

    // движущиеся платформы
    for (const p of this.movingPlatforms) {
      const prevX = p.x, prevY = p.y;
      const a = Math.sin(t * p.speed + p.phase);
      p.x = p.bx + a * p.rx;
      p.y = p.by + Math.cos(t * p.speed * 0.9 + p.phase) * p.ry;
      p.dx = p.x - prevX;
      p.dy = p.y - prevY;
      p.container.x = p.x;
      p.container.y = p.y;
      p.container.rotation = Math.sin(t * 1.3 + p.phase) * 0.008;
    }

    // вода
    this.waterT += dt;
    this.drawWater(t);

    // ингредиенты
    for (const c of this.collectibles) c.update(dt, t);

    // NPC
    for (const n of this.npcs) n.update(dt, t);

    // фестиваль: толпа, фонарики, фейерверк
    if (this.festivalActive) {
      for (const f of this.crowdFigures) {
        if (!f.c) continue;
        f.c.y = f.baseY + Math.sin(t * (f.musician ? 2.2 : 1.7) + f.phase) * f.amp;
        f.c.rotation = Math.sin(t * 1.3 + f.phase) * (f.dance === 2 ? 0.025 : 0.012);
      }
      for (const l of this.festivalLanterns) {
        if (!l.lit) continue;
        l.glow.alpha = 0.48 + Math.sin(t * 3.1 + l.phase) * 0.1;
        l.glow.scale.set(1 + Math.sin(t * 1.8 + l.phase) * 0.04);
      }
      this.fireworkTimer -= dt;
      if (this.fireworkTimer <= 0) {
        this.fireworkTimer = 6.5 + Math.random() * 6;
        this.launchFirework();
        if (Math.random() < 0.5) this.launchFirework();
      }
    }

    // фонари
    for (const c of this.checkpoints) c.update(dt, t);

    // свет
    for (const l of this.lightList) {
      l.s.alpha = l.base * (0.9 + 0.1 * Math.sin(t * l.speed + l.phase));
    }

    // светляки
    for (const f of this.fireflies) {
      f.s.x = f.ox + Math.sin(t * f.sp + f.ph) * f.ax;
      f.s.y = f.oy + Math.cos(t * f.sp * 0.8 + f.ph * 1.3) * f.ay;
      f.s.alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.7 + f.ph));
    }

    // пчёлы
    for (const b of this.bees) {
      b.g.x = b.ox + Math.cos(t * b.sp + b.ph) * b.r;
      b.g.y = b.oy + Math.sin(t * b.sp * 1.4 + b.ph) * b.r * 0.5;
    }

    // трава
    for (const blade of this.foregroundBlades) {
      blade.g.rotation = Math.sin(t * 0.8 + blade.phase) * blade.amp;
    }

    // листья
    for (const l of this.leaves) {
      l.x += (l.vx + Math.sin(t * l.sway + l.ph) * 10) * dt;
      l.y += (l.vy + Math.cos(t * l.sway * 0.7 + l.ph) * 5) * dt;
      l.rot += l.rs * dt;
      if (l.x < -40) { l.x = 1320; l.y = Math.random() * 720; }
      if (l.y > 760) { l.y = -20; l.x = Math.random() * 1280; }
      l.g.x = l.x; l.g.y = l.y;
      l.g.rotation = l.rot;
    }

    // кот
    if (this.cat) {
      this.cat.tail.rotation = Math.sin(t * 1.1) * 0.12;
      this.cat.c.scale.x = -1;
    }

    // вороны
    for (const c of this.crows) {
      if (!c.flew && this.game.player) {
        const dx = Math.abs(this.game.player.cx - c.g.x);
        if (dx < 110) {
          c.flew = true;
          c.vx = 45 + Math.random() * 30;
          c.vy = -70 - Math.random() * 40;
          this.game.audio.sfx('jump');
        }
      }
      if (c.flew) {
        c.g.x += c.vx * dt;
        c.g.y += c.vy * dt;
        c.vy += 6 * dt;
        c.g.alpha -= dt * 0.35;
      }
    }

    // дым из труб
    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0) {
      this.smokeTimer = 0.55;
      this.spawnSmoke(283, 374, 0xd0d5d8, 0.16);
      this.spawnSmoke(4889, 286, 0xb9c2c7, 0.13);
    }
    // пар над чаном
    this.steamTimer -= dt;
    if (this.steamTimer <= 0) {
      this.steamTimer = 0.16;
      this.spawnSteam(5520 + (Math.random() - 0.5) * 50, 490, 0.16 + this.brewIntensity * 0.3);
      if (this.brewIntensity > 0.4 && Math.random() < 0.6) {
        this.spawnSpark(5520 + (Math.random() - 0.5) * 40, 530, Math.random() < 0.5 ? 0xffc36b : 0xff8a3a);
      }
    }
    // блики на воде
    this.rippleTimer -= dt;
    if (this.rippleTimer <= 0) {
      this.rippleTimer = 0.8 + Math.random() * 1.6;
      const x = 1920 + Math.random() * 880;
      this.spawnRipple(x, 692 + Math.random() * 30);
    }

    // партиклы
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        if (p.s.parent) p.s.parent.removeChild(p.s);
        this.particles.splice(i, 1);
        continue;
      }
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.s.rotation += (p.rs || 0) * dt;
      const k = p.life / p.maxLife;
      if (p.mode === 'smoke') {
        p.s.alpha = Math.sin(Math.min(1, (1 - k) * 4) * Math.PI * 0.5) * p.baseAlpha * Math.min(1, k * 2.2);
        p.s.width += p.grow * dt;
        p.s.height += p.grow * dt;
      } else {
        p.s.alpha = Math.min(1, k * 2) * p.baseAlpha;
        if (p.grow) { p.s.width += p.grow * dt; p.s.height += p.grow * dt; }
      }
    }

    // интерактивные подсказки обновляет игра
  }

  drawWater(t) {
    const g = this.waterG;
    g.clear();
    const x0 = 1900, x1 = 2850, surface = 690;
    // волны
    for (let i = 0; i < 14; i++) {
      const y = surface + 5 + i * 7;
      const alpha = 0.16 - i * 0.008;
      g.lineStyle(1.1, i % 2 ? 0x93b4c5 : 0x6d91a5, Math.max(0.025, alpha));
      g.moveTo(x0, y + Math.sin(t * 1.2 + i) * 1.5);
      for (let x = x0; x <= x1; x += 30) {
        g.lineTo(x, y + Math.sin(x * 0.06 + t * (0.9 + i * 0.05) + i) * (2 + i * 0.12));
      }
    }
    // блики
    for (let i = 0; i < 24; i++) {
      const seed = i * 137.7;
      const x = x0 + 30 + ((seed * 13) % 830) + Math.sin(t * 0.5 + i) * 10;
      const y = surface + 10 + ((seed * 7) % 130);
      const len = 3 + ((i * 13) % 22) + Math.sin(t * 2 + i) * 3;
      g.lineStyle(1, 0xa9c6d3, 0.12 + (i % 3) * 0.04);
      g.moveTo(x, y); g.lineTo(x + len, y);
    }
    // отражение луны / фонарей
    for (let i = 0; i < 8; i++) {
      const y = surface + 24 + i * 10;
      const w = 34 + Math.sin(t * 1.3 + i) * 8;
      g.lineStyle(2, 0xffe3ad, 0.05 + (i % 2) * 0.03);
      g.moveTo(2440 - w / 2, y); g.lineTo(2440 + w / 2, y);
    }
    // пена у берегов
    for (let i = 0; i < 8; i++) {
      const xx = x0 + 4 + Math.sin(t * 1.3 + i) * 12 + i * 3;
      const yy = surface + 18 + i * 5;
      g.lineStyle(1.2, 0xcfdfdf, 0.05);
      g.moveTo(xx - 10, yy); g.lineTo(xx + 4, yy);
    }
  }

  /* ================= ЧАСТИЦЫ ================= */

  addParticle(sprite, opts) {
    this.fx.addChild(sprite);
    const p = Object.assign({
      s: sprite, vx: 0, vy: 0, life: 1, maxLife: 1, gravity: 0,
      baseAlpha: sprite.alpha, grow: 0, rs: 0, mode: 'normal',
    }, opts || {});
    p.maxLife = p.life;
    this.particles.push(p);
    return p;
  }

  spawnDust(x, y, dir, count) {
    for (let i = 0; i < (count || 4); i++) {
      const s = glowSprite(0xc8c0a8, 8 + Math.random() * 10, 0.12);
      s.x = x + (Math.random() - 0.5) * 14;
      s.y = y - 2 - Math.random() * 4;
      this.addParticle(s, {
        vx: (Math.random() - 0.5) * 40 - (dir || 0) * 20,
        vy: -8 - Math.random() * 20,
        gravity: 30,
        life: 0.45 + Math.random() * 0.3,
        grow: 14,
      });
    }
  }

  spawnBurst(x, y, color, count) {
    for (let i = 0; i < (count || 16); i++) {
      const ang = Math.random() * TAU;
      const sp = 30 + Math.random() * 110;
      const s = glowSprite(color, 8 + Math.random() * 16, 0.6);
      s.x = x; s.y = y;
      this.addParticle(s, {
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 25,
        gravity: 40,
        life: 0.6 + Math.random() * 0.7,
        grow: -6,
      });
    }
    const ring = new PIXI.Graphics();
    ring.lineStyle(2, color, 0.5);
    ring.drawCircle(0, 0, 8);
    ring.x = x; ring.y = y;
    this.addParticle(ring, { life: 0.45, grow: 0 });
    // кольцо вручную
    const start = performance.now();
    const animRing = () => {
      const k = (performance.now() - start) / 450;
      if (k >= 1 || !ring.parent) { if (ring.parent) ring.parent.removeChild(ring); return; }
      ring.scale.set(1 + k * 3);
      ring.alpha = (1 - k) * 0.5;
      requestAnimationFrame(animRing);
    };
    requestAnimationFrame(animRing);
  }

  spawnSplash(x, y) {
    for (let i = 0; i < 22; i++) {
      const s = glowSprite(i % 3 ? 0x9fd8e4 : 0xdcf2f6, 5 + Math.random() * 12, 0.55);
      s.x = x + (Math.random() - 0.5) * 24;
      s.y = y;
      this.addParticle(s, {
        vx: (Math.random() - 0.5) * 120,
        vy: -60 - Math.random() * 170,
        gravity: 380,
        life: 0.5 + Math.random() * 0.5,
        grow: -3,
      });
    }
  }

  spawnSmoke(x, y, color, alpha) {
    const s = new PIXI.Sprite(buildTextures().fog);
    s.tint = color || 0xb9c2c7;
    s.anchor.set(0.5);
    s.width = 26 + Math.random() * 14;
    s.height = 18 + Math.random() * 12;
    s.x = x + (Math.random() - 0.5) * 8;
    s.y = y;
    s.alpha = 0;
    this.addParticle(s, {
      vx: 8 + Math.random() * 10,
      vy: -16 - Math.random() * 12,
      life: 4.5 + Math.random() * 2.5,
      baseAlpha: alpha || 0.16,
      grow: 26,
      mode: 'smoke',
    });
  }

  spawnSteam(x, y, alpha) {
    const s = new PIXI.Sprite(buildTextures().fog);
    s.tint = 0xdbe8e8;
    s.anchor.set(0.5);
    s.width = 24 + Math.random() * 20;
    s.height = 18 + Math.random() * 14;
    s.x = x; s.y = y;
    s.alpha = 0;
    this.addParticle(s, {
      vx: (Math.random() - 0.5) * 12,
      vy: -24 - Math.random() * 20,
      life: 2.4 + Math.random() * 1.8,
      baseAlpha: alpha || 0.16,
      grow: 30,
      mode: 'smoke',
    });
  }

  spawnSpark(x, y, color) {
    const s = glowSprite(color, 4 + Math.random() * 6, 0.7);
    s.x = x + (Math.random() - 0.5) * 20; s.y = y;
    this.addParticle(s, {
      vx: (Math.random() - 0.5) * 20,
      vy: -40 - Math.random() * 50,
      gravity: -8,
      life: 0.8 + Math.random() * 0.8,
    });
  }

  spawnRipple(x, y) {
    const g = new PIXI.Graphics();
    g.lineStyle(1, 0xaed6de, 0.22);
    g.drawEllipse(0, 0, 7, 2);
    g.x = x; g.y = y;
    this.addParticle(g, { life: 1.6, grow: 0 });
    const start = performance.now();
    const anim = () => {
      const k = (performance.now() - start) / 1600;
      if (k >= 1 || !g.parent) { if (g.parent) g.parent.removeChild(g); return; }
      g.scale.set(1 + k * 3);
      g.alpha = (1 - k) * 0.25;
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  /* ================= ИНТЕРАКЦИИ ================= */

  checkCheckpoint(player) {
    for (const c of this.checkpoints) {
      if (!c.lit && Math.abs(player.cx - c.x) < 58 && Math.abs(player.feet - c.y) < 90) {
        if (c.light()) {
          this.game.setCheckpoint(c.x, c.y);
          return c;
        }
      }
    }
    return null;
  }

  collectNear(player) {
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (Math.abs(player.cx - c.baseX) < 44 && Math.abs(player.cy - c.container.y) < 54) {
        if (c.collect()) return c;
      }
    }
    return null;
  }

  nearestInteraction(player) {
    let best = null;
    let bestD = 1e9;
    for (const npc of this.npcs) {
      if (npc.gone || npc.hidden || npc.walking) continue;
      const d = Math.abs(player.cx - npc.x);
      if (d < npc.interactRange && Math.abs(player.feet - npc.y) < 120 && d < bestD) {
        bestD = d;
        best = { type: 'npc', npc, prompt: 'E — поговорить', x: npc.x, y: npc.y };
      }
    }
    for (const sign of this.signs) {
      const d = Math.abs(player.cx - sign.x);
      if (d < sign.range && d < bestD) {
        bestD = d;
        best = { type: 'sign', sign, prompt: 'E — прочитать', x: sign.x, y: sign.y };
      }
    }
    {
      const d = Math.abs(player.cx - this.vat.x);
      if (d < this.vat.range && d < bestD) {
        bestD = d;
        const stage = this.game.progress.stage;
        const prompt = stage === STAGES.INTRO ? 'E — осмотреть чан' : 'E — варить';
        best = { type: 'vat', prompt, x: this.vat.x, y: this.vat.y };
      }
    }
    for (const st of this.stations) {
      const d = Math.abs(player.cx - st.x);
      if (d < st.range && d < bestD) {
        let prompt = 'E — действие';
        if (st.type === 'bed') {
          const s = this.game.progress.stage;
          prompt = (s === STAGES.SLEEP1 || s === STAGES.SLEEP2) ? 'E — лечь спать' : 'E — войти в дом';
        } else if (st.type === 'trade') {
          const count = this.game.countBottles ? this.game.countBottles() : 0;
          prompt = count > 0 ? `E — продать ${count} бут.` : 'E — прилавок';
        } else if (st.type === 'shop') {
          prompt = 'E — мастерская';
        }
        bestD = d;
        best = { type: st.type, station: st, spot: st, prompt, x: st.x, y: st.y };
      }
    }
    for (const bed of this.gardenBeds) {
      const d = Math.abs(player.cx - bed.x);
      if (d < 52 && d < bestD) {
        const state = this.game.progress.garden[bed.index] || { stage: 0 };
        let prompt = 'E — грядка';
        if (state.stage === 0) prompt = this.game.progress.seeds > 0 ? 'E — посадить хмель' : 'E — пустая грядка';
        else if (state.stage >= 3) prompt = 'E — собрать хмель';
        else prompt = 'E — полить';
        bestD = d;
        best = { type: 'garden', bed, prompt, x: bed.x, y: 600 };
      }
    }
    if (this.day >= 3) {
      for (const l of this.festivalLanterns) {
        if (l.lit) continue;
        const d = Math.abs(player.cx - l.x);
        if (d < 60 && Math.abs(player.feet - l.baseY) < 90 && d < bestD) {
          bestD = d;
          best = { type: 'lantern', lantern: l, prompt: 'E — зажечь фонарик', x: l.baseX, y: l.baseY };
        }
      }
    }
    return best;
  }

  startBrew() {
    this.brewIntensity = 1;
  }

  stopBrew() {
    this.brewIntensity = 0;
  }
}
