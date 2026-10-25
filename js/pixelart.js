'use strict';

/* ============================================================
   PIXEL-ART MODE: отдельный 16-битный рендер мира
   ============================================================ */

const PixelArt = {
  scale: 4,
  world: null,
  attached: false,
  texCache: {},
  rand: null,

  /* ---------- утилиты ---------- */

  px(ctx, x, y, w, h, color, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  },

  tex(key, w, h, draw) {
    if (this.texCache[key]) return this.texCache[key];
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    draw(ctx, w, h);
    const t = PIXI.Texture.fromCanvas(c);
    if (t.baseTexture) t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this.texCache[key] = t;
    return t;
  },

  sprite(texture, x, y, scale, anchorX, anchorY) {
    const s = new PIXI.Sprite(texture);
    s.anchor.set(anchorX === undefined ? 0.5 : anchorX, anchorY === undefined ? 1 : anchorY);
    s.x = x; s.y = y;
    const sc = Math.max(1, Math.round(scale || this.scale));
    s.scale.set(sc, sc);
    return s;
  },

  rng(seed) {
    return mulberry32(seed || 17);
  },

  /* ---------- палитра ---------- */

  C: {
    outline: '#241a20',
    outline2: '#34252b',
    black: '#120e15',
    grass: '#4e7049',
    grass2: '#628a55',
    grass3: '#85a86a',
    dirt: '#3c2a21',
    dirt2: '#4b3528',
    dirt3: '#5d4430',
    stone: '#59615d',
    stone2: '#747d74',
    wood: '#60432c',
    wood2: '#7b5837',
    wood3: '#987044',
    bark: '#4a3326',
    bark2: '#6a4b32',
    leaf: '#2f513b',
    leaf2: '#3f6b49',
    leaf3: '#5c8655',
    pine: '#264536',
    pine2: '#356048',
    warm: '#ffc46e',
    warm2: '#ffe2a3',
    red: '#a4473d',
    red2: '#c76554',
    blue: '#426475',
    blue2: '#6f9eab',
    skin: '#d39a72',
    skin2: '#efb88e',
    cloth: '#35424a',
    cloth2: '#4a5b60',
    white: '#e7dcc7',
    shadow: 'rgba(6,7,12,.45)',
  },

  /* Единая палитра пиксельного режима: 32 цвета, три тона на материал,
     свет всегда сверху-слева, тень — снизу-справа. */
  P: {
    ink: '#1b1420',
    ink2: '#2b1c26',
    cloud: '#263650',
    cloud2: '#344763',
    sky0: '#080d1d', sky1: '#101a33', sky2: '#1b2a47', sky3: '#2d3d59',
    sky4: '#51485a', sky5: '#715a54', star: '#cfd9e7', moon: '#ead8b1', moonLo: '#c8b38e',
    grassHi: '#9cc07a', grass: '#6d9a5a', grassLo: '#4a7448', grassDark: '#2f5237',
    dirtHi: '#6b4c34', dirt: '#4a3428', dirtLo: '#34241e', dirtDark: '#241918',
    stoneHi: '#a3ad9c', stone: '#727c72', stoneLo: '#4a554e', stoneDark: '#303b37',
    woodHi: '#c39055', wood: '#94663e', woodLo: '#63452f', woodDark: '#3e2b23',
    leafHi: '#8dbb6d', leaf: '#5d9559', leafLo: '#3e7045', leafDark: '#294f38',
    pineHi: '#5f8d62', pine: '#3d6a4d', pineLo: '#294e3b', pineDark: '#1c352c',
    skinHi: '#f2c79b', skin: '#dba276', skinLo: '#b77c58', skinDark: '#8d553d',
    hairHi: '#8b633e', hair: '#61432d', hairLo: '#432c20', hairDark: '#2e1e18',
    coatHi: '#6b8171', coat: '#4b5f53', coatLo: '#35453d', coatDark: '#25302b',
    blueHi: '#7aa8b8', blue: '#4f7f93', blueLo: '#355d72', blueDark: '#244456',
    redHi: '#d66f5b', red: '#a94a43', redLo: '#7d3337', redDark: '#57242c',
    goldHi: '#ffe3a2', gold: '#d6a054', goldLo: '#a16b35', goldDark: '#6c4527',
    white: '#e9dfc9', whiteLo: '#c4b89e',
  },

  /* ---------- загрузка (не обязательна, но оставляет место для ассетов) ---------- */

  async load() {
    return true;
  },

  /* ---------- привязка к миру ---------- */

  attach(world) {
    if (this.attached && this.world === world) return;
    // Новый мир (новая игра / продолжение): старые контейнеры уже уничтожены.
    this.resetForWorld();
    this.world = world;
    this.attached = true;
    world.pixelMode = true;
    world.pixelArt = this;

    this.hideClassic(world);
    this.buildSky(world);
    this.buildParallax(world);
    this.buildWorld(world);
    this.buildFestival(world);
    this.dressStations(world);
    this.buildDummy(world);
    this.buildCat(world);
    this.buildForeground(world);
    this.buildGlow(world);
    this.hideVectorEntities(world);
    this.updateGarden(world.game && world.game.progress ? world.game.progress.garden : null);
    this.updateVisibility(world);

    // лёгкая цветокоррекция, чтобы ночной пиксель не был грязным
    try {
      if (PIXI.filters && PIXI.filters.ColorMatrixFilter) {
        const cm = new PIXI.filters.ColorMatrixFilter();
        cm.brightness(1.12, false);
        cm.saturate(0.12, true);
        this.worldLayer.filters = [cm];
      }
    } catch (e) { /* фильтр не критичен */ }
  },

  resetForWorld() {
    this.worldLayer = null;
    this.terrainLayer = null;
    this.sceneryLayer = null;
    this.labelLayer = null;
    this.platformSprites = null;
    this.rafts = null;
    this.festivalLayer = null;
    this.festivalCrowd = null;
    this.lanternSprites = null;
    this.stationLayer = null;
    this.gardenSprites = null;
    this.foregroundLayer = null;
    this.glowLayer = null;
    this.pixelFireflies = null;
    this.pixelParticles = null;
    this.catSprite = null;
    this.skySprite = null;
    this.parallaxLayer = null;
    this.river = null;
    this.world = null;
  },

  hideClassic(world) {
    const hide = [
      world.skyRoot, world.parallaxRoot, world.weatherRoot, world.frameRoot,
      world.terrainLayer, world.waterLayer, world.waterFx, world.scenery,
      world.platformLayer, world.raftsLayer, world.crowdLayer,
      world.foreground, world.lights, world.fx,
    ];
    for (const c of hide) if (c) c.visible = false;
    if (world.cat && world.cat.c) world.cat.c.visible = false;
    if (world.damMist) world.damMist.visible = false;
  },

  hideVectorEntities(world) {
    // пиксельные версии рисуются в своих местах, а старые векторные детали прячем
    for (const l of world.festivalLanterns) {
      if (l.container) l.container.visible = false;
    }
    for (const bed of world.gardenBeds) if (bed.container) bed.container.visible = false;
    if (world.bees) for (const b of world.bees) b.g.visible = false;
  },

  layer(world) {
    if (!this.worldLayer) {
      this.worldLayer = new PIXI.Container();
      const idx = Math.max(0, world.worldRoot.getChildIndex(world.entityLayer));
      world.worldRoot.addChildAt(this.worldLayer, idx);
    }
    return this.worldLayer;
  },

  /* ---------- небо и параллакс ---------- */

  buildSky(world) {
    // 320×180 → ровно 4× в кадре 1280×720: у всех пикселей один размер.
    const tex = this.tex('sky', 320, 180, (ctx, w, h) => {
      const bands = [
        [0, 54, '#0a1022'], [54, 84, '#121c38'], [84, 108, '#20304f'],
        [108, 132, '#363b59'], [132, 156, '#594b58'], [156, 180, '#735d54'],
      ];
      for (const [y1, y2, color] of bands) this.px(ctx, 0, y1, w, y2 - y1, color);
      // облачные полосы
      for (let i = 0; i < 6; i++) {
        const cx = 25 + i * 53, cy = 78 + (i % 3) * 19;
        this.px(ctx, cx, cy, 38 + (i % 3) * 14, 3, '#263654', 0.45);
        this.px(ctx, cx + 8, cy - 2, 24, 2, '#314361', 0.35);
        this.px(ctx, cx + 16, cy + 3, 20, 1, '#1b2943', 0.5);
      }
      const rng = this.rng(81);
      for (let i = 0; i < 105; i++) {
        const x = Math.floor(rng() * w), y = Math.floor(rng() * 124);
        const col = i % 5 ? '#c5d2e4' : '#f5d89c';
        this.px(ctx, x, y, 1, 1, col, 0.35 + rng() * 0.55);
      }
      // пиксельная луна
      const mx = 150, my = 18, mr = 10;
      for (let y = -mr; y <= mr; y++) {
        for (let x = -mr; x <= mr; x++) {
          if (x * x + y * y <= mr * mr) {
            this.px(ctx, mx + x, my + y, 1, 1, '#e8d7b2', 0.96);
          }
        }
      }
      for (let y = -mr; y <= mr; y++) {
        for (let x = -mr; x <= mr; x++) {
          if (x * x + y * y <= (mr - 1) * (mr - 1) && x * 0.8 + y > 4) {
            this.px(ctx, mx + x, my + y, 1, 1, '#d7c39c', 0.9);
          }
        }
      }
      this.px(ctx, mx - 5, my - 3, 4, 2, '#c8b58f', 0.9);
      this.px(ctx, mx + 4, my + 5, 3, 2, '#c8b58f', 0.8);
      this.px(ctx, mx - 2, my + 9, 2, 1, '#c8b58f', 0.75);
      // тонкие облачные полосы
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(rng() * w), y = 66 + Math.floor(rng() * 52);
        this.px(ctx, x, y, 4 + Math.floor(rng() * 18), 1, '#78839c', 0.08 + rng() * 0.08);
      }
    });
    const sky = new PIXI.Sprite(tex);
    sky.width = GAME_W; sky.height = GAME_H;
    this.skySprite = sky;
    world.root.addChildAt(sky, 0);
  },

  buildParallax(world) {
    const tex = this.tex('hills', 320, 100, (ctx, w, h) => {
      this.px(ctx, 0, 0, w, h, 'rgba(0,0,0,0)');
      // дальние горы
      for (let x = -20; x < w + 20; x += 1) {
        const top = 50 + Math.sin(x * 0.035) * 9 + Math.sin(x * 0.11) * 3;
        this.px(ctx, x, Math.floor(top), 1, h - top, '#24344a', 0.9);
      }
      for (let x = -20; x < w + 20; x += 1) {
        const top = 66 + Math.sin(x * 0.055 + 1.2) * 8 + Math.sin(x * 0.16) * 2;
        this.px(ctx, x, Math.floor(top), 1, h - top, '#2a3c50', 0.9);
      }
      // далёкий лес: чистые ступенчатые силуэты
      for (let x = 4; x < w; x += 9) {
        const top = 70 + Math.floor((Math.sin(x * 0.05) + 1) * 7);
        this.px(ctx, x, top, 2, 18, '#1d2a35', 0.9);
        this.px(ctx, x - 3, top + 4, 8, 3, '#1d2a35', 0.8);
        this.px(ctx, x - 2, top + 1, 6, 4, '#1d2a35', 0.8);
      }
    });
    const c = new PIXI.Container();
    const p = new PIXI.TilingSprite(tex, 1800, 400);
    p.tileScale.set(4, 4);
    // Дальний лес должен читаться над линией земли, а не прятаться за ней.
    p.y = 260;
    c.addChild(p);
    this.parallaxLayer = c;
    world.root.addChildAt(c, 1);
  },

  /* ---------- земля и вода ---------- */

  buildWorld(world) {
    const layer = this.layer(world);
    const n = new PIXI.Container();
    layer.addChild(n);
    this.terrainLayer = n;

    const grass = this.tex('grassStrip', 16, 4, (ctx) => {
      const P = this.P;
      this.px(ctx, 0, 0, 16, 1, P.grassHi);
      this.px(ctx, 0, 1, 16, 2, P.grass);
      this.px(ctx, 0, 3, 16, 1, P.grassLo);
      for (let i = 0; i < 3; i++) {
        const x = 2 + i * 5;
        this.px(ctx, x, 1, 2, 2, P.grassHi, 0.75);
        this.px(ctx, x + 1, 2, 1, 2, P.grassLo);
      }
    });
    const dirt = this.tex('dirtFill', 16, 16, (ctx) => {
      const P = this.P;
      this.px(ctx, 0, 0, 16, 16, P.dirt);
      this.px(ctx, 0, 0, 16, 2, P.dirtHi);
      this.px(ctx, 0, 14, 16, 2, P.dirtLo);
      // редкие камни 2×2, без шума
      this.px(ctx, 3, 5, 2, 2, P.dirtHi);
      this.px(ctx, 11, 9, 2, 2, P.dirtLo);
      this.px(ctx, 7, 12, 2, 2, P.dirtHi, 0.65);
      this.px(ctx, 1, 10, 2, 1, P.dirtLo, 0.5);
    });
    const path = this.tex('pathStrip', 16, 4, (ctx) => {
      const P = this.P;
      this.px(ctx, 0, 0, 16, 1, P.wood);
      this.px(ctx, 0, 1, 16, 2, P.woodLo);
      this.px(ctx, 0, 3, 16, 1, P.ink2);
      for (let i = 0; i < 4; i++) {
        this.px(ctx, 1 + i * 4, 1, 3, 1, P.woodHi, 0.55);
        this.px(ctx, 1 + i * 4, 2, 1, 1, P.ink2, 0.4);
      }
    });

    for (const gr of world.grounds) {
      const g = new PIXI.TilingSprite(grass, gr.w, 16);
      g.x = gr.x; g.y = gr.top;
      g.tileScale.set(this.scale, this.scale);
      n.addChild(g);
      const d = new PIXI.TilingSprite(dirt, gr.w, 220);
      d.x = gr.x; d.y = gr.top + 16;
      d.tileScale.set(this.scale, this.scale);
      n.addChild(d);
    }

    // тропинки
    const paths = [[520, 980], [4220, 5820], [7400, 9180], [9300, 10600]];
    for (const [a, b] of paths) {
      const p = new PIXI.TilingSprite(path, b - a, 16);
      p.x = a; p.y = 600;
      p.tileScale.set(this.scale, this.scale);
      n.addChild(p);
    }

    // трава и цветы на кромке
    const tuft = this.tex('tuft', 6, 6, (ctx) => {
      const P = this.P;
      this.px(ctx, 1, 4, 1, 2, P.grassLo);
      this.px(ctx, 2, 1, 1, 5, P.grass);
      this.px(ctx, 3, 2, 1, 4, P.grassHi);
      this.px(ctx, 4, 4, 1, 2, P.grassLo);
    });
    const flower = this.tex('flower', 5, 5, (ctx) => {
      const P = this.P;
      this.px(ctx, 2, 3, 1, 2, P.grassLo);
      this.px(ctx, 1, 1, 3, 2, P.goldHi);
      this.px(ctx, 2, 0, 1, 4, P.gold);
      this.px(ctx, 0, 2, 5, 1, P.goldLo);
    });
    const rng = this.rng(924);
    for (let i = 0; i < 150; i++) {
      const x = 30 + rng() * 10500;
      if (x > 1885 && x < 2860) continue;
      const s = this.sprite(i % 6 ? tuft : flower, x, 602, 2, 0.5, 1);
      n.addChild(s);
    }

    const clump = this.tex('grassClump', 12, 8, (ctx) => {
      const P = this.P;
      this.px(ctx, 1, 6, 2, 2, P.grassLo);
      this.px(ctx, 2, 2, 2, 6, P.grass);
      this.px(ctx, 4, 3, 2, 5, P.grassHi);
      this.px(ctx, 7, 4, 2, 4, P.grass);
      this.px(ctx, 9, 1, 2, 7, P.grassLo);
      this.px(ctx, 8, 2, 1, 2, P.grassHi);
    });
    for (let i = 0; i < 80; i++) {
      const x = 20 + rng() * 10550;
      if (x > 1885 && x < 2860) continue;
      n.addChild(this.sprite(clump, x, 604, 2, 0.5, 1));
    }

    const dirtStone = this.tex('dirtStone', 12, 6, (ctx) => {
      const P = this.P;
      this.px(ctx, 1, 2, 4, 3, P.stoneLo);
      this.px(ctx, 2, 2, 2, 1, P.stone);
      this.px(ctx, 7, 4, 3, 2, P.stoneDark);
      this.px(ctx, 8, 3, 1, 1, P.stone);
    });
    for (let i = 0; i < 45; i++) {
      const x = 20 + rng() * 10550;
      if (x > 1885 && x < 2860) continue;
      n.addChild(this.sprite(dirtStone, x, 635 + rng() * 55, 2, 0.5, 1));
    }

    // река
    const water = this.tex('water', 16, 16, (ctx) => {
      const P = this.P;
      this.px(ctx, 0, 0, 16, 16, P.blueDark);
      this.px(ctx, 0, 0, 16, 2, P.blueLo);
      for (let i = 0; i < 3; i++) {
        const y = 4 + i * 4;
        this.px(ctx, 0, y, 16, 2, i % 2 ? P.blueLo : P.blue);
        this.px(ctx, 2, y, 5, 1, P.blueHi);
        this.px(ctx, 10, y + 1, 4, 1, P.blueHi, 0.7);
      }
      this.px(ctx, 0, 14, 16, 2, P.blueDark);
    });
    const river = new PIXI.TilingSprite(water, 950, 210);
    river.x = 1900; river.y = 690;
    river.tileScale.set(this.scale, this.scale);
    this.river = river;
    n.addChild(river);

    // берега
    const bank = new PIXI.Graphics();
    bank.beginFill(0x2b211c); bank.drawRect(1885, 600, 18, 120); bank.endFill();
    bank.beginFill(0x3a2b21); bank.drawRect(2848, 600, 18, 120); bank.endFill();
    bank.beginFill(0x506148, 0.75); bank.drawRect(1885, 600, 18, 4); bank.endFill();
    bank.beginFill(0x506148, 0.75); bank.drawRect(2848, 600, 18, 4); bank.endFill();
    n.addChild(bank);

    this.buildScenery(world, n);
    this.buildPlatforms(world, n);
  },

  /* ---------- платформы ---------- */

  buildPlatforms(world, layer) {
    const plank = this.tex('plank', 16, 6, (ctx) => {
      this.px(ctx, 0, 0, 16, 1, '#9c7748');
      this.px(ctx, 0, 1, 16, 3, '#6f4e31');
      this.px(ctx, 0, 4, 16, 1, '#4b3425');
      this.px(ctx, 0, 5, 16, 1, '#2e211a');
      this.px(ctx, 2, 1, 1, 1, '#c39a5d');
      this.px(ctx, 11, 2, 1, 1, '#b08752');
    });
    const island = this.tex('island', 16, 8, (ctx) => {
      this.px(ctx, 0, 0, 16, 2, '#7e8654');
      this.px(ctx, 0, 2, 16, 5, '#5b4a32');
      this.px(ctx, 1, 3, 14, 2, '#6d583a');
    });
    const crates = this.tex('crate', 10, 10, (ctx) => {
      this.px(ctx, 0, 0, 10, 10, '#4a3325');
      this.px(ctx, 1, 1, 8, 8, '#745333');
      this.px(ctx, 2, 2, 6, 6, '#5c4029');
      this.px(ctx, 2, 2, 6, 1, '#9b7145');
      this.px(ctx, 2, 7, 6, 1, '#2f2119');
      this.px(ctx, 4, 2, 1, 6, '#8b633d');
    });
    this.platformSprites = [];
    for (const p of world.platforms) {
      let spr;
      if (p.kind === 'crate') spr = this.sprite(crates, p.x + p.w / 2, p.y + p.h, 4, 0.5, 0);
      else if (p.kind === 'island') {
        spr = new PIXI.TilingSprite(island, p.w, 32);
        spr.x = p.x; spr.y = p.y; spr.tileScale.set(4, 4);
      } else {
        spr = new PIXI.TilingSprite(plank, p.w, 24);
        spr.x = p.x; spr.y = p.y; spr.tileScale.set(4, 4);
      }
      layer.addChild(spr);
      if (p.kind === 'wood') {
        const supports = new PIXI.Graphics();
        supports.lineStyle(2, 0x3a2a1f, 0.8);
        supports.moveTo(p.x + 16 * this.scale, p.y + 24);
        supports.lineTo(p.x + 16 * this.scale, p.y + 48);
        supports.moveTo(p.x + p.w - 16 * this.scale, p.y + 24);
        supports.lineTo(p.x + p.w - 16 * this.scale, p.y + 48);
        layer.addChild(supports);
      }
    }

    // плоты
    this.rafts = [];
    for (const r of world.movingPlatforms) {
      const c = new PIXI.Container();
      const s = new PIXI.TilingSprite(plank, r.w, 24);
      s.tileScale.set(4, 4);
      c.addChild(s);
      const lantern = this.sprite(this.tex('lampSmall', 6, 9, (ctx) => {
        this.px(ctx, 2, 0, 2, 3, '#2a2522');
        this.px(ctx, 1, 3, 4, 5, '#e7b565');
        this.px(ctx, 2, 4, 2, 3, '#ffdc93');
      }), r.w - 20, -12, 2, 0.5, 1);
      c.addChild(lantern);
      c.x = r.x; c.y = r.y;
      layer.addChild(c);
      this.rafts.push({ c, r });
    }
  },

  /* ---------- деревья, дома, мелкие детали ---------- */

  shadowTex() {
    return this.tex('shadow', 20, 5, (ctx) => {
      this.px(ctx, 2, 1, 16, 3, '#130f12', 0.35);
      this.px(ctx, 5, 0, 10, 1, '#130f12', 0.22);
      this.px(ctx, 4, 4, 12, 1, '#130f12', 0.18);
    });
  },

  chickenTex() {
    return this.tex('chicken', 10, 9, (ctx) => {
      this.px(ctx, 2, 4, 5, 4, '#e4d4b7');
      this.px(ctx, 1, 3, 2, 3, '#d4be9f');
      this.px(ctx, 2, 2, 3, 2, '#f0e2c9');
      this.px(ctx, 8, 4, 2, 1, '#e8d1aa');
      this.px(ctx, 1, 2, 1, 1, '#a9473f');
      this.px(ctx, 2, 1, 1, 1, '#a9473f');
      this.px(ctx, 3, 3, 1, 1, '#a9473f');
      this.px(ctx, 3, 8, 1, 1, '#b88c44');
      this.px(ctx, 5, 8, 1, 1, '#b88c44');
      this.px(ctx, 4, 4, 1, 1, '#2b2320');
    });
  },

  smokeTex() {
    return this.tex('smoke', 14, 14, (ctx) => {
      this.px(ctx, 4, 5, 6, 5, '#87909a', 0.2);
      this.px(ctx, 2, 7, 10, 3, '#87909a', 0.13);
      this.px(ctx, 6, 2, 4, 4, '#aab2b8', 0.16);
      this.px(ctx, 7, 7, 4, 3, '#aab2b8', 0.10);
    });
  },

  treeTex(type, variant, w, h) {
    const key = `tree-${type}-${variant}-${w}-${h}`;
    return this.tex(key, w, h, (ctx) => {
      const P = this.P;
      const R = (x, y, ww, hh, c, a) => this.px(ctx, x, y, ww, hh, c, a);
      const cx = Math.floor(w / 2);
      const baseY = h - 2;
      const trunkTop = Math.floor(h * 0.53);
      const pine = type === 'pine';
      const birch = !pine;

      // общая тень у корней
      R(cx - 7, baseY, 14, 2, P.ink, 0.34);

      if (pine) {
        // ствол — тёмный, виден между ярусами
        R(cx - 3, trunkTop - 7, 6, h - trunkTop + 5, P.woodDark);
        R(cx - 2, trunkTop - 6, 4, h - trunkTop + 4, P.woodLo);
        R(cx - 2, trunkTop - 4, 2, h - trunkTop, P.wood);
        R(cx - 5, baseY - 1, 10, 2, P.woodDark);
        R(cx - 4, baseY - 1, 7, 1, P.woodLo);

        // ярусы ели: треугольные, с шагом 2 px и светом сверху-слева
        const tiers = 7;
        for (let i = 0; i < tiers; i++) {
          const y = 3 + i * 5;
          const half = 3 + i * 2;
          for (let row = 0; row < 3; row++) {
            const hw = Math.max(2, half - row * 1);
            const yy = y + row * 2;
            R(cx - hw, yy, hw * 2, 2, P.pineLo);
            R(cx - hw + 1, yy, hw * 2 - 2, 1, P.pine);
            if (row === 0) {
              R(cx - hw + 2, yy, 3, 1, P.pineHi);
              R(cx - hw - 1, yy + 1, 2, 2, P.pineDark);
              R(cx + hw - 1, yy + 1, 2, 2, P.pineDark);
            }
          }
          // тёмная выемка между ярусами, без случайной «пилы»
          R(cx - 2, y + 7, 4, 1, P.pineDark, 0.55);
        }
        R(cx - 1, 2, 2, 2, P.pineDark);
      } else {
        // ствол и ветви березы
        R(cx - 3, trunkTop, 6, h - trunkTop - 3, P.stoneDark);
        R(cx - 2, trunkTop, 4, h - trunkTop - 4, P.stone);
        R(cx - 2, trunkTop, 2, h - trunkTop - 4, P.stoneHi);
        R(cx - 1, trunkTop + 4, 2, 1, P.ink2);
        R(cx, trunkTop + 10, 2, 1, P.ink2);
        R(cx - 2, trunkTop + 16, 2, 1, P.ink2);
        R(cx - 6, baseY - 2, 12, 2, P.stoneDark);
        R(cx - 5, baseY - 2, 10, 1, P.stone);

        if (variant % 2) {
          R(cx - 7, trunkTop + 4, 5, 2, P.woodDark);
          R(cx - 6, trunkTop + 4, 4, 1, P.woodLo);
          R(cx + 4, trunkTop + 9, 5, 2, P.woodDark);
          R(cx + 5, trunkTop + 9, 4, 1, P.woodLo);
        } else {
          R(cx - 6, trunkTop + 8, 4, 2, P.woodDark);
          R(cx + 3, trunkTop + 3, 5, 2, P.woodDark);
        }

        // крона: несколько округлых масс, а не одно «яйцо»
        const ccy = Math.floor(h * 0.31);
        const v = ((variant || 0) % 5 + 5) % 5;
        const sway = v - 2;
        const mask = [];
        for (let y = 0; y < h; y++) {
          mask[y] = [];
          for (let x = 0; x < w; x++) mask[y][x] = false;
        }
        const blob = (bx, by, rx, ry) => {
          for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
              const xx = bx + x, yy = by + y;
              if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
              if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) mask[yy][xx] = true;
            }
          }
        };
        blob(cx, ccy, 9, 10);
        blob(cx - 7, ccy + 4, 5, 6);
        blob(cx + 7, ccy + 4, 5, 6);
        blob(cx - 5 + (sway < 0 ? 1 : 0), ccy - 6, 5, 4);
        blob(cx + 5, ccy - 6 + (sway > 0 ? 1 : 0), 5, 4);
        blob(cx + sway, ccy - 9, 4, 3);
        blob(cx - 5 - (v % 2), ccy + 9, 4 + (v % 2), 4);
        blob(cx + 5 + (v % 2), ccy + 9, 4, 4);
        // прорезь снизу: виден ствол, крона читается двумя массами
        const notchTop = Math.floor(h * 0.54);
        for (let y = notchTop; y < h * 0.68; y++) {
          for (let x = cx - 2; x <= cx + 2; x++) {
            if (y >= 0 && y < h && x >= 0 && x < w) mask[y][x] = false;
          }
        }

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (!mask[y][x]) continue;
            const edge = y === 0 || x === 0 || y === h - 1 || x === w - 1 ||
              !mask[y - 1][x] || !mask[y + 1][x] || !mask[y][x - 1] || !mask[y][x + 1];
            const diag = (x - cx) + (y - ccy) * 0.55;
            let col = P.leaf;
            if (diag > 7) col = P.leafLo;
            else if (diag < -8) col = P.leafHi;
            if (edge) col = diag > 5 ? P.leafDark : P.leafLo;
            R(x, y, 1, 1, col);
          }
        }
        // крупные пятна света/тени — по 2×2, без одиночного шума
        const hi = [[-6, -4], [-1, -8], [6, -4], [-8, 2], [3, -1]];
        const lo = [[4, 8], [8, 3], [-2, 7], [-5, 10]];
        for (const [dx, dy] of hi) {
          const x = cx + dx, y = ccy + dy;
          if (x > 0 && y > 0 && x < w - 2 && y < h - 2) R(x, y, 2, 2, P.leafHi);
        }
        for (const [dx, dy] of lo) {
          const x = cx + dx, y = ccy + dy;
          if (x > 0 && y > 0 && x < w - 2 && y < h - 2) R(x, y, 2, 2, P.leafLo);
        }
        // пара ягод / соцветий
        if (variant % 4 === 0) {
          R(cx - 5, ccy - 2, 2, 2, P.red);
          R(cx + 4, ccy - 5, 2, 2, P.redLo);
        }
      }
    });
  },

  bushTex(variant) {
    const key = `bush-${variant}`;
    return this.tex(key, 14, 12, (ctx) => {
      const P = this.P;
      const R = (x, y, w, h, c) => this.px(ctx, x, y, w, h, c);
      R(1, 7, 12, 3, P.leafDark);
      R(2, 4, 5, 5, P.leafLo);
      R(6, 3, 6, 6, P.leaf);
      R(8, 2, 4, 4, P.leafHi);
      R(3, 5, 4, 2, P.leaf);
      R(2, 9, 10, 1, P.leafDark);
      if (variant % 3 === 0) {
        R(4, 4, 2, 2, P.red);
        R(9, 5, 2, 2, P.redLo);
      }
    });
  },

  houseTex(w, h, opts) {
    const key = `house-${w}-${h}-${opts.key}`;
    return this.tex(key, w, h, (ctx) => {
      const P = this.P;
      const R = (x, y, ww, hh, c) => this.px(ctx, x, y, ww, hh, c);
      const roofH = Math.max(12, Math.floor(h * 0.43));
      const wallY = roofH - 2;
      const wallH = h - wallY - 4;

      // тень под домом
      R(3, h - 3, w - 4, 2, P.ink, 0.28);

      // крыша: ступени по 2 пикселя, свет слева
      for (let y = 2; y < roofH; y += 2) {
        const t = (y - 2) / Math.max(1, roofH - 2);
        const ww = Math.max(8, Math.floor(w * (0.24 + t * 0.76)));
        const xx = Math.floor((w - ww) / 2);
        R(xx, y, ww, 2, (Math.floor(y / 2) % 3 === 0) ? P.woodLo : P.woodDark);
        R(xx + 2, y, Math.max(4, ww - 8), 1, P.wood);
        R(xx - 1, y + 1, 2, 2, P.ink2);
        R(xx + ww - 1, y + 1, 2, 2, P.ink2);
      }
      R(2, roofH - 2, w - 4, 2, P.ink2);
      R(3, roofH, w - 6, 1, P.woodLo);

      // стены-брёвна
      R(4, wallY, w - 8, wallH, P.woodDark);
      R(5, wallY + 1, w - 10, wallH - 2, P.woodLo);
      for (let y = wallY + 2; y < wallY + wallH - 2; y += 4) {
        R(5, y, w - 10, 2, P.wood);
        R(5, y + 2, w - 10, 1, P.woodDark, 0.75);
      }
      R(5, wallY + 1, 2, wallH - 2, P.wood);
      R(w - 8, wallY + 2, 2, wallH - 3, P.woodDark);
      // углы
      R(4, wallY, 2, wallH, P.woodDark);
      R(w - 6, wallY, 2, wallH, P.woodDark);

      // окна
      const wy = wallY + Math.max(6, Math.floor(wallH * 0.28));
      for (let i = 0; i < (opts.windows || 1); i++) {
        const wx = Math.floor(w * (i + 1) / ((opts.windows || 1) + 1) - 5);
        R(wx - 1, wy - 1, 10, 10, P.ink2);
        R(wx, wy, 8, 8, P.woodDark);
        R(wx + 2, wy + 2, 4, 4, P.goldLo);
        R(wx + 2, wy + 2, 2, 2, P.goldHi);
        R(wx + 3, wy, 2, 8, P.woodDark);
        R(wx, wy + 3, 8, 2, P.woodDark);
      }

      // дверь
      if (opts.door !== false) {
        const dx = Math.floor(w * 0.46);
        R(dx - 1, h - 18, 12, 16, P.ink2);
        R(dx, h - 17, 10, 14, P.woodDark);
        R(dx + 1, h - 15, 8, 12, P.woodLo);
        R(dx + 2, h - 14, 6, 2, P.wood);
        R(dx + 2, h - 9, 6, 2, P.wood);
        R(dx + 7, h - 10, 2, 2, P.gold);
      }

      // фундамент
      R(4, h - 5, w - 8, 3, P.stoneLo);
      R(4, h - 2, w - 8, 2, P.stoneDark);
      for (let i = 0; i < Math.floor((w - 8) / 6); i++) R(6 + i * 6, h - 4, 3, 2, P.stone);

      // труба
      if (opts.chimney) {
        const cx = w - 18;
        R(cx, roofH - 12, 7, 12, P.stoneDark);
        R(cx + 1, roofH - 11, 5, 10, P.stoneLo);
        R(cx - 1, roofH - 13, 9, 2, P.ink2);
      }

      // вывеска
      if (opts.sign) {
        const sx = Math.floor(w * 0.30), sw = Math.floor(w * 0.40);
        R(sx - 1, wallY - 1, sw + 2, 8, P.ink2);
        R(sx, wallY, sw, 6, P.woodHi);
        R(sx + 2, wallY + 1, sw - 4, 1, P.woodDark);
        R(sx + 2, wallY + 3, sw - 6, 1, P.woodDark);
      }
    });
  },

  buildScenery(world, layer) {
    const s = new PIXI.Container();
    layer.addChild(s);
    this.sceneryLayer = s;

    const tree = (x, base, type, scale, v) => {
      s.addChild(this.sprite(this.shadowTex(), x, base - 1, (scale || 4) * 0.8, 0.5, 0.5));
      const t = this.treeTex(type, v || 1, type === 'pine' ? 26 : 28, type === 'pine' ? 60 : 62);
      s.addChild(this.sprite(t, x, base, scale || 4, 0.5, 1));
    };
    const bush = (x, base, scale, v) => {
      s.addChild(this.sprite(this.shadowTex(), x, base - 1, (scale || 3) * 0.5, 0.5, 0.5));
      s.addChild(this.sprite(this.bushTex(v || 1), x, base, scale || 3, 0.5, 1));
    };

    // дом и двор
    s.addChild(this.sprite(this.houseTex(75, 48, {
      key: 'izba', roof: '#4b3531', roof2: '#6c4a3f', wall: '#76502e', wall2: '#96653a', trim: '#3e281d',
      windows: 3, window: '#f2bd68', moss: true, chimney: true,
    }), 220, 600, 4, 0.5, 1));
    // записка на двери
    const noteTex = this.tex('note', 5, 7, (ctx) => {
      this.px(ctx, 0, 0, 5, 7, '#d9cba9');
      this.px(ctx, 1, 1, 3, 1, '#8a7658');
      this.px(ctx, 1, 3, 3, 1, '#8a7658');
      this.px(ctx, 1, 5, 2, 1, '#8a7658');
      this.px(ctx, 3, 5, 1, 1, '#a54c3b');
    });
    s.addChild(this.sprite(noteTex, 152, 556, 3, 0.5, 0.5));
    s.addChild(this.sprite(this.chickenTex(), 610, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.chickenTex(), 690, 600, 2.6, 0.5, 1));
    s.addChild(this.sprite(this.smokeTex(), 290, 402, 3, 0.5, 0.5));
    s.addChild(this.sprite(this.smokeTex(), 310, 380, 4, 0.5, 0.5));
    s.addChild(this.sprite(this.wellTex(), 450, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.woodpileTex(), 380, 600, 4, 0.5, 1));
    this.fenceRun(s, 500, 640, 600, 0.9);
    s.addChild(this.sprite(this.signTex(), 560, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.crateTex(), 637, 600, 3, 0.5, 1));
    this.fenceRun(s, 780, 802, 600, 0.9);
    this.fenceRun(s, 938, 975, 600, 0.9);

    tree(1060, 600, 'birch', 4, 2);
    tree(1290, 600, 'birch', 4, 3);
    tree(1560, 600, 'birch', 4, 4);
    bush(1210, 600, 3, 1);
    bush(1710, 600, 3, 2);
    // ульи стоят на деревянных полках-площадках
    s.addChild(this.sprite(this.hiveTex(), 1170, 505, 3, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1400, 445, 3, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1610, 500, 3, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1190, 600, 4, 0.5, 1));

    // роща
    [[2960, 'birch', 4, 5], [3120, 'birch', 4, 6], [3360, 'birch', 4, 7], [3530, 'birch', 4, 8],
      [3750, 'birch', 4, 9], [3960, 'birch', 4, 10], [3080, 'pine', 4, 11], [3840, 'pine', 4, 12],
      [4120, 'pine', 4, 13]].forEach(([x, t, sc, v]) => tree(x, 600, t, sc, v));
    bush(3270, 600, 3, 3); bush(3550, 600, 3, 4);
    s.addChild(this.sprite(this.springTex(), 3140, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.signTex(), 3610, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.mushroomPropTex(), 3050, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.mushroomPropTex(), 3580, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.mushroomPropTex(), 4020, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 3400, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 3990, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.boatTex(), 2805, 700, 3, 0.5, 1));
    s.addChild(this.sprite(this.reedsTex(), 1910, 700, 3, 0.5, 1));
    s.addChild(this.sprite(this.reedsTex(), 2825, 700, 3, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 1875, 690, 3, 0.5, 1));
    this.fenceRun(s, 1830, 1900, 600, 0.9);

    // пивоварня
    s.addChild(this.sprite(this.houseTex(155, 60, {
      key: 'brewery', roof: '#433334', roof2: '#674c48', wall: '#6b482d', wall2: '#8f6239', trim: '#352218',
      windows: 4, window: '#e8ae5d', moss: true, sign: true, chimney: true,
    }), 5070, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.kettleTex(), 5520, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.barrelTex(), 5380, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.barrelTex(), 5560, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.crateTex(), 4700, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.signTex(), 4360, 600, 4, 0.5, 1));
    this.fenceRun(s, 4500, 4700, 600, 0.9);
    s.addChild(this.sprite(this.smokeTex(), 5330, 388, 4, 0.5, 0.5));
    s.addChild(this.sprite(this.smokeTex(), 5350, 356, 5, 0.5, 0.5));

    // лес и мельница
    for (let i = 0; i < 9; i++) {
      const x = 5880 + i * 165;
      if (x > 7350) break;
      tree(x, 600, i % 3 === 0 ? 'pine' : 'birch', 4, 20 + i);
    }
    bush(6010, 600, 3, 5); bush(6430, 600, 3, 6); bush(7280, 600, 3, 7);
    s.addChild(this.sprite(this.mushroomPropTex(), 6080, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.mushroomPropTex(), 6610, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 6220, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 7140, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.signTex(), 5940, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.millTex(), 7000, 600, 4, 0.5, 1));
    this.fenceRun(s, 7200, 7290, 600, 0.9);
    s.addChild(this.sprite(this.crateTex(), 7240, 600, 3, 0.5, 1));

    // площадь
    s.addChild(this.sprite(this.houseTex(46, 44, {
      key: 'vhouse1', roof: '#4b3934', roof2: '#67514a', wall: '#65452e', wall2: '#7d5738', trim: '#36241b',
      windows: 2, window: '#e8b05e', moss: true,
    }), 7565, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.houseTex(58, 48, {
      key: 'vhouse2', roof: '#4b3934', roof2: '#67514a', wall: '#5a4130', wall2: '#79583a', trim: '#34231b',
      windows: 3, window: '#e8b05e', moss: true,
    }), 8970, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.houseTex(36, 38, {
      key: 'vhouse3', roof: '#46362f', roof2: '#5f4840', wall: '#5e4530', wall2: '#765538', trim: '#30221a',
      windows: 1, window: '#e8b05e',
    }), 9185, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.stallTex('#7a3d38'), 7725, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.stallTex('#415968'), 9040, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.stageTex(), 8520, 600, 4, 0.5, 1));
    tree(9060, 600, 'birch', 4, 31);
    tree(7500, 600, 'pine', 4, 32);
    bush(8080, 600, 3, 8); bush(9210, 600, 3, 9);
    s.addChild(this.sprite(this.signTex(), 7410, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 8150, 600, 3, 0.5, 1));

    // старая плотина
    for (let i = 0; i < 7; i++) {
      const x = 9280 + i * 190;
      tree(x, 600, i % 2 === 0 ? 'pine' : 'birch', 4, 50 + i);
    }
    bush(9300, 600, 3, 10); bush(9680, 600, 3, 11); bush(10580, 600, 3, 12);
    s.addChild(this.sprite(this.signTex(), 9260, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 9480, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 10080, 600, 3, 0.5, 1));
    s.addChild(this.sprite(this.waterfallTex(), 10220, 600, 4, 0.5, 1));
    s.addChild(this.sprite(this.damTex(), 10240, 600, 4, 0.5, 1));

    // подписи
    this.pxLabel(s, 'МЕДВЕДЕВО', 635, 538, '#e8cf96', 2.2);
    this.pxLabel(s, 'ТИХИЙ БЕРЕГ', 5070, 428, '#e8cf96', 2.6);
    this.pxLabel(s, 'ПИВОВАРНЯ', 5070, 449, '#d5b37b', 1.4);
    this.pxLabel(s, 'ХМЕЛЬ', 3690, 531, '#c8d49a', 2);
    this.pxLabel(s, 'СТАРАЯ МЕЛЬНИЦА', 7000, 326, '#c8d49a', 2);
    this.pxLabel(s, 'ТИХИЙ БЕРЕГ', 7505, 533, '#e8cf96', 1.8);
    this.pxLabel(s, 'ФЕСТИВАЛЬ', 8520, 380, '#e8cf96', 2.6);
    this.pxLabel(s, '→ СТАРАЯ ПЛОТИНА', 9040, 532, '#9fb8b8', 1.4);
    this.pxLabel(s, 'СТАРАЯ ПЛОТИНА', 9550, 520, '#c8d6d2', 2);
    this.pxLabel(s, '→ ГОРОД', 10320, 515, '#9fb8b8', 1.4);
  },

  pxLabel(parent, text, x, y, color, size) {
    const t = makeText(text, {
      fontFamily: FONT_DISPLAY, fontSize: 12 * (size || 1), fontWeight: '700',
      fill: color || '#e8cf96', letterSpacing: 1.5,
      stroke: '#241a1b', strokeThickness: 2,
    }, 0.5);
    t.x = x; t.y = y;
    if (!this.labelLayer) {
      this.labelLayer = new PIXI.Container();
      parent.addChild(this.labelLayer);
    }
    this.labelLayer.addChild(t);
    return t;
  },

  /* ---------- мелкие текстуры ---------- */

  springTex() {
    return this.tex('springProp', 16, 12, (ctx) => {
      this.px(ctx, 1, 8, 14, 2, '#2c2420');
      this.px(ctx, 3, 7, 10, 1, '#58717a');
      this.px(ctx, 5, 6, 6, 1, '#7ca4aa');
      this.px(ctx, 7, 2, 2, 4, '#6a4a31');
      this.px(ctx, 6, 1, 4, 2, '#8b6b43');
    });
  },

  kettleTex() {
    return this.tex('kettle', 20, 18, (ctx) => {
      this.px(ctx, 3, 10, 14, 7, '#6b4d31');
      this.px(ctx, 4, 8, 12, 3, '#b0763b');
      this.px(ctx, 5, 7, 10, 2, '#d79a52');
      this.px(ctx, 9, 4, 2, 4, '#8f6135');
      this.px(ctx, 8, 2, 4, 2, '#ad7a43');
      this.px(ctx, 2, 12, 2, 3, '#2c211a');
      this.px(ctx, 16, 12, 2, 3, '#2c211a');
      this.px(ctx, 8, 15, 4, 1, '#3a2a20');
    });
  },

  barrelTex() {
    return this.tex('barrel', 10, 12, (ctx) => {
      this.px(ctx, 1, 1, 8, 10, '#6c4b2e');
      this.px(ctx, 2, 1, 6, 10, '#8b633a');
      this.px(ctx, 2, 3, 6, 1, '#3c2b1e');
      this.px(ctx, 2, 8, 6, 1, '#3c2b1e');
      this.px(ctx, 4, 0, 2, 1, '#b58a55');
      this.px(ctx, 3, 1, 1, 9, '#b58a55', 0.7);
    });
  },

  crateTex() {
    return this.tex('crateProp', 10, 10, (ctx) => {
      this.px(ctx, 0, 0, 10, 10, '#4b3325');
      this.px(ctx, 1, 1, 8, 8, '#795534');
      this.px(ctx, 2, 2, 6, 6, '#5b402a');
      this.px(ctx, 2, 2, 6, 1, '#a57a4b');
      this.px(ctx, 4, 2, 1, 6, '#8e663f');
    });
  },

  signTex() {
    return this.tex('signProp', 20, 14, (ctx) => {
      this.px(ctx, 9, 7, 2, 7, '#4a3425');
      this.px(ctx, 1, 1, 18, 7, '#4a3425');
      this.px(ctx, 2, 2, 16, 5, '#8b6a40');
      this.px(ctx, 3, 3, 6, 1, '#c19a62');
      this.px(ctx, 3, 5, 9, 1, '#b08a54');
    });
  },

  wellTex() {
    return this.tex('well', 22, 18, (ctx) => {
      this.px(ctx, 2, 8, 18, 9, '#4b3a2c');
      this.px(ctx, 3, 7, 16, 3, '#667463');
      this.px(ctx, 4, 6, 14, 2, '#87917b');
      this.px(ctx, 4, 11, 14, 4, '#1c1715');
      this.px(ctx, 5, 12, 12, 2, '#27404a');
      this.px(ctx, 4, 0, 2, 9, '#5a3e29');
      this.px(ctx, 16, 0, 2, 9, '#5a3e29');
      this.px(ctx, 2, 0, 18, 2, '#39281d');
      this.px(ctx, 1, 2, 20, 2, '#826039');
      this.px(ctx, 9, 2, 4, 4, '#2a221c');
      this.px(ctx, 10, 4, 2, 2, '#c39a5c');
    });
  },

  woodpileTex() {
    return this.tex('woodpile', 18, 12, (ctx) => {
      for (let i = 0; i < 4; i++) {
        this.px(ctx, 1 + i * 4, 4 + (i % 2) * 3, 4, 4, i % 2 ? '#6d4b2e' : '#7d5936');
        this.px(ctx, 2 + i * 4, 5 + (i % 2) * 3, 2, 1, '#a37b4c');
      }
      this.px(ctx, 0, 10, 18, 2, '#3c2a1d');
    });
  },

  fenceTex() {
    return this.tex('fence', 16, 12, (ctx) => {
      this.px(ctx, 1, 2, 2, 10, '#4b3525');
      this.px(ctx, 13, 2, 2, 10, '#4b3525');
      this.px(ctx, 0, 4, 16, 2, '#7a5735');
      this.px(ctx, 0, 8, 16, 2, '#62452d');
      this.px(ctx, 2, 1, 2, 1, '#a57d4d');
    });
  },

  hiveTex() {
    return this.tex('hive', 10, 12, (ctx) => {
      this.px(ctx, 1, 8, 2, 4, '#4b3524');
      this.px(ctx, 7, 8, 2, 4, '#4b3524');
      this.px(ctx, 2, 3, 6, 6, '#b9833d');
      this.px(ctx, 2, 4, 6, 1, '#d9a45a');
      this.px(ctx, 2, 6, 6, 1, '#d9a45a');
      this.px(ctx, 1, 2, 8, 2, '#5a4027');
      this.px(ctx, 4, 9, 2, 1, '#3a2a1c');
    });
  },

  boatTex() {
    return this.tex('boat', 22, 10, (ctx) => {
      this.px(ctx, 1, 5, 20, 3, '#5a3c27');
      this.px(ctx, 2, 4, 18, 1, '#7b5735');
      this.px(ctx, 3, 7, 16, 1, '#2d2119');
      this.px(ctx, 5, 3, 1, 3, '#3d2c1e');
      this.px(ctx, 15, 3, 1, 3, '#3d2c1e');
    });
  },

  reedsTex() {
    return this.tex('reeds', 12, 16, (ctx) => {
      for (let i = 0; i < 4; i++) {
        const x = 2 + i * 3;
        this.px(ctx, x, 4, 1, 12, i % 2 ? '#536b43' : '#647b4c');
        this.px(ctx, x - 1, 3, 3, 2, '#8c7c4c');
      }
    });
  },

  stonesTex() {
    return this.tex('stones', 16, 8, (ctx) => {
      this.px(ctx, 1, 4, 5, 3, '#4e5551');
      this.px(ctx, 6, 3, 4, 4, '#616a61');
      this.px(ctx, 10, 5, 4, 2, '#444a47');
      this.px(ctx, 2, 3, 2, 1, '#8b9487');
    });
  },

  mushroomPropTex() {
    return this.tex('mushroomProp', 8, 7, (ctx) => {
      this.px(ctx, 3, 4, 2, 3, '#d8c8a3');
      this.px(ctx, 1, 2, 6, 2, '#8f3f37');
      this.px(ctx, 2, 1, 4, 2, '#a95047');
      this.px(ctx, 2, 2, 1, 1, '#f0d5b7');
    });
  },

  fenceRun(parent, x1, x2, y, alpha) {
    const f = new PIXI.TilingSprite(this.fenceTex(), x2 - x1, 48);
    f.x = x1; f.y = y - 48;
    f.tileScale.set(4, 4);
    if (alpha !== undefined) f.alpha = alpha;
    parent.addChild(f);
    return f;
  },

  millTex() {
    return this.tex('mill', 120, 76, (ctx) => {
      this.px(ctx, 20, 20, 76, 54, '#5d412b');
      this.px(ctx, 22, 22, 72, 50, '#714f31');
      for (let y = 28; y < 70; y += 5) this.px(ctx, 22, y, 72, 1, '#8a623b', 0.8);
      this.px(ctx, 18, 20, 80, 2, '#2f211a');
      // крыша
      this.px(ctx, 15, 8, 86, 4, '#3d2b28');
      for (let i = 0; i < 10; i++) {
        this.px(ctx, 18 + i * 2, 8 + i * 1.2, 76 - i * 4, 2, i % 2 ? '#513b34' : '#45302e');
      }
      // колесо
      for (let a = 0; a < 12; a++) {
        const ang = a / 12 * TAU;
        this.px(ctx, Math.floor(105 + Math.cos(ang) * 17), Math.floor(48 + Math.sin(ang) * 17), 2, 2, '#5d4430');
      }
      this.px(ctx, 102, 45, 6, 6, '#3c2b1f');
      for (let i = 0; i < 4; i++) {
        const ang = i / 4 * TAU;
        const x1 = 105 + Math.cos(ang) * 12, y1 = 48 + Math.sin(ang) * 12;
        this.px(ctx, Math.floor(x1), Math.floor(y1), 2, 2, '#7d5b39');
      }
      // окна/дверь
      this.px(ctx, 30, 36, 8, 8, '#3b2a1e');
      this.px(ctx, 31, 37, 6, 6, '#d8a15b');
      this.px(ctx, 54, 38, 8, 8, '#3b2a1e');
      this.px(ctx, 55, 39, 6, 6, '#d8a15b');
      this.px(ctx, 43, 55, 11, 17, '#3a281c');
      this.px(ctx, 45, 57, 7, 13, '#1d1713');
    });
  },

  stallTex(color) {
    return this.tex('stall-' + color, 36, 28, (ctx) => {
      this.px(ctx, 2, 10, 32, 3, '#5b4029');
      this.px(ctx, 4, 13, 3, 14, '#362419');
      this.px(ctx, 29, 13, 3, 14, '#362419');
      this.px(ctx, 1, 0, 34, 3, '#3b2b21');
      for (let i = 0; i < 7; i++) {
        this.px(ctx, 2 + i * 5, 3, 5, 8, i % 2 ? color : '#d6b477');
      }
      this.px(ctx, 5, 14, 26, 2, '#7a5837');
      this.px(ctx, 7, 11, 5, 3, '#6a8d50');
      this.px(ctx, 16, 10, 4, 4, '#c8873d');
      this.px(ctx, 24, 11, 4, 3, '#8f5a39');
    });
  },

  stageTex() {
    return this.tex('stage', 130, 52, (ctx) => {
      const P = this.P;
      const R = (x, y, w, h, c) => this.px(ctx, x, y, w, h, c);
      // задник и шторы
      R(6, 2, 118, 40, P.redDark);
      for (let i = 0; i < 7; i++) {
        R(8 + i * 17, 4, 15, 36, i % 2 ? P.redLo : P.red);
        R(10 + i * 17, 4, 2, 36, P.redDark);
        R(20 + i * 17, 4, 2, 36, P.redDark);
      }
      // ламбрекен
      R(3, 0, 124, 6, P.ink2);
      for (let i = 0; i < 12; i++) {
        R(5 + i * 10, 3, 8, 4, i % 2 ? P.goldLo : P.redHi);
        R(7 + i * 10, 6, 4, 2, P.gold);
      }
      // боковые шторы
      R(5, 6, 9, 34, P.redDark);
      R(7, 7, 3, 31, P.redLo);
      R(116, 6, 9, 34, P.redDark);
      R(118, 7, 3, 31, P.redLo);
      // сцена
      R(0, 40, 130, 12, P.woodDark);
      R(0, 40, 130, 3, P.wood);
      R(0, 43, 130, 1, P.woodHi);
      R(0, 49, 130, 3, P.ink2);
      for (let i = 0; i < 13; i++) R(5 + i * 10, 44, 2, 5, P.woodLo);
      // флажки
      R(18, 4, 10, 21, P.red);
      R(20, 6, 6, 15, P.redHi);
      R(102, 4, 10, 21, P.blue);
      R(104, 6, 6, 15, P.blueHi);
      // фонари
      for (const x of [16, 64, 114]) {
        R(x + 1, 9, 2, 27, P.ink2);
        R(x - 2, 8, 8, 2, P.woodHi);
        R(x - 1, 10, 6, 6, P.ink2);
        R(x, 11, 4, 4, P.gold);
        R(x + 1, 12, 2, 2, P.goldHi);
      }
      // гирлянда
      for (let i = 0; i < 16; i++) {
        const x = 6 + i * 8, y = 17 + Math.round(Math.sin(i / 15 * Math.PI) * 4);
        R(x, y, 2, 2, i % 3 ? P.goldHi : P.goldLo);
      }
    });
  },

  waterfallTex() {
    return this.tex('waterfall', 14, 38, (ctx) => {
      this.px(ctx, 1, 0, 12, 38, '#315d70', 0.5);
      for (let i = 0; i < 14; i++) {
        const x = 2 + (i * 7) % 11;
        const y = (i * 5) % 30;
        this.px(ctx, x, y, 2, 5 + (i % 3) * 3, '#7fb8c7', 0.35 + (i % 2) * 0.14);
      }
      this.px(ctx, 1, 36, 12, 2, '#b9e0e5', 0.35);
    });
  },

  damTex() {
    return this.tex('dam', 108, 34, (ctx) => {
      this.px(ctx, 0, 8, 108, 26, '#4c514d');
      this.px(ctx, 0, 7, 108, 3, '#6d7569');
      for (let i = 0; i < 11; i++) {
        this.px(ctx, 2 + i * 10, 12 + (i % 3) * 4, 8, 5, i % 2 ? '#3d433f' : '#596157');
      }
      // арка
      this.px(ctx, 40, 16, 25, 18, '#111618');
      this.px(ctx, 44, 20, 17, 14, '#101516');
      // мох
      for (let i = 0; i < 4; i++) this.px(ctx, 8 + i * 22, 32, 12, 2, '#526a4f', 0.7);
      // вода
      this.px(ctx, 50, 4, 7, 30, '#5f9aaa', 0.35);
      this.px(ctx, 52, 0, 2, 34, '#9ed0d8', 0.35);
    });
  },

  /* ---------- фестиваль ---------- */

  buildFestival(world) {
    const c = new PIXI.Container();
    this.festivalLayer = c;
    this.worldLayer.addChild(c);
    c.visible = world.day >= 3;

    // гирлянды
    const g = new PIXI.Graphics();
    g.lineStyle(2, 0x2b241c, 0.9);
    g.moveTo(7420, 438); g.quadraticCurveTo(8000, 478, 8580, 440); g.lineTo(9180, 470);
    c.addChild(g);
    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const x = 7420 + t * 1760;
      const y = 440 + Math.sin(t * Math.PI) * 24;
      const col = i % 3 === 0 ? 0xa94c40 : i % 3 === 1 ? 0xd2a35c : 0x58747c;
      const f = new PIXI.Graphics();
      f.beginFill(col); f.drawPolygon([x - 5, y, x + 5, y, x, y + 10]); f.endFill();
      c.addChild(f);
    }

    // толпа и столы
    this.festivalCrowd = [];
    const xs = [7440, 7580, 7700, 7820, 7920, 8010, 8100, 8160, 8840, 8910, 8990, 9070, 9140];
    xs.forEach((x, i) => {
      const a = buildPixelCharacter(i % 5 === 0 ? 'zina' : i % 5 === 1 ? 'stas' : i % 5 === 2 ? 'pavel' : i % 5 === 3 ? 'grisha' : 'villager');
      a.root.x = x; a.root.y = 600;
      a.root.scale.set(1, 1);
      c.addChild(a.root);
      this.festivalCrowd.push({ root: a.root, base: 600, phase: i * 1.2 });
    });
    // музыкант на сцене
    const mus = buildPixelCharacter('stas');
    mus.root.x = 8490; mus.root.y = 577; mus.root.scale.set(1, 1);
    c.addChild(mus.root);

    // столы
    const tableTex = this.tex('feast', 28, 12, (ctx) => {
      this.px(ctx, 0, 3, 28, 3, '#7a5738');
      this.px(ctx, 1, 6, 3, 5, '#3b2a1e');
      this.px(ctx, 24, 6, 3, 5, '#3b2a1e');
      this.px(ctx, 4, 0, 3, 3, '#c9974e');
      this.px(ctx, 9, 1, 3, 2, '#b7773c');
      this.px(ctx, 15, 0, 4, 3, '#d2a45f');
      this.px(ctx, 22, 1, 2, 3, '#7f9b5b');
    });
    for (const x of [7520, 8880, 9110]) c.addChild(this.sprite(tableTex, x, 600, 2, 0.5, 1));

    // фонарики
    this.lanternSprites = [];
    world.festivalLanterns.forEach((l) => {
      const tex = l.lit ? this.lanternTex(true) : this.lanternTex(false);
      const spr = this.sprite(tex, l.baseX, l.baseY, 2, 0.5, 1);
      c.addChild(spr);
      const glow = this.sprite(this.lampGlowTex(), l.baseX + 20, l.baseY - 60, 4, 0.5, 0.5);
      glow.alpha = l.lit ? 0.55 : 0.15;
      c.addChild(glow);
      this.lanternSprites.push({ l, spr, glow });
    });
  },

  lanternTex(lit) {
    return this.tex('lantern-' + (lit ? 1 : 0), 10, 28, (ctx) => {
      this.px(ctx, 1, 24, 8, 3, '#2a211c');
      this.px(ctx, 4, 8, 2, 16, '#4a3827');
      this.px(ctx, 1, 6, 8, 3, '#57402b');
      this.px(ctx, 2, 9, 6, 6, '#2e2723');
      this.px(ctx, 3, 10, 4, 4, lit ? '#ffd27a' : '#3a414a');
      this.px(ctx, 1, 5, 8, 1, '#8b6b43');
      if (lit) this.px(ctx, 4, 10, 2, 2, '#fff0b0');
      this.px(ctx, 2, 15, 6, 1, '#2c231d');
    });
  },

  lampGlowTex() {
    return this.tex('lampGlow', 32, 32, (ctx) => {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const dx = x - 16, dy = y - 16;
          const d = Math.sqrt(dx * dx + dy * dy);
          let a = 0;
          if (d < 4) a = 0.34;
          else if (d < 8) a = 0.20;
          else if (d < 12) a = 0.10;
          else if (d < 15) a = 0.04;
          if (a > 0) this.px(ctx, x, y, 1, 1, '#ffd08a', a);
        }
      }
    });
  },

  dressStations(world) {
    // кровать, прилавки, огород, чаны — простые пиксельные силуэты
    const root = new PIXI.Container();
    this.worldLayer.addChild(root);
    this.stationLayer = root;
    const bed = this.tex('bed', 24, 12, (ctx) => {
      this.px(ctx, 0, 7, 24, 5, '#4a3325');
      this.px(ctx, 2, 4, 20, 4, '#7d5938');
      this.px(ctx, 4, 3, 16, 3, '#b29062');
    });
    root.addChild(this.sprite(bed, 170, 600, 2, 0.5, 1));
    const counter = this.tex('counter', 30, 18, (ctx) => {
      this.px(ctx, 0, 8, 30, 4, '#6c4c31');
      this.px(ctx, 2, 12, 3, 6, '#3b281b'); this.px(ctx, 25, 12, 3, 6, '#3b281b');
      this.px(ctx, 2, 4, 26, 4, '#4a3323');
      this.px(ctx, 4, 1, 4, 5, '#9b7448');
      this.px(ctx, 12, 2, 4, 4, '#b07c41');
      this.px(ctx, 21, 1, 4, 5, '#748e5e');
    });
    root.addChild(this.sprite(counter, 4960, 600, 2, 0.5, 1));
    root.addChild(this.sprite(counter, 7720, 600, 2, 0.5, 1));

    // огород
    this.gardenSprites = [];
    const bedTex = this.tex('gardenBed', 14, 7, (ctx) => {
      this.px(ctx, 0, 2, 14, 5, '#4a3324');
      this.px(ctx, 1, 1, 12, 2, '#6b4a2c');
      this.px(ctx, 2, 3, 10, 2, '#2e2018');
      this.px(ctx, 3, 0, 2, 3, '#537449');
      this.px(ctx, 8, 0, 2, 2, '#5d7c4c');
    });
    for (const bed of world.gardenBeds) {
      const spr = this.sprite(bedTex, bed.x, 600, 2, 0.5, 1);
      root.addChild(spr);
      this.gardenSprites.push({ bed, spr });
    }
    // мастерская/прилавок — небольшие ящики
    root.addChild(this.sprite(this.crateTex(), 4665, 600, 2, 0.5, 1));
  },

  /* ---------- обновление ---------- */

  burst(x, y, color, count) {
    if (!this.glowLayer) return;
    for (let i = 0; i < (count || 10); i++) {
      const s = this.sprite(this.sparkTex(), x, y, 1.5 + Math.random(), 0.5, 0.5);
      s.tint = color || 0xffd58a;
      s.vx = (Math.random() - 0.5) * 90;
      s.vy = -30 - Math.random() * 90;
      s.life = 0.4 + Math.random() * 0.5;
      s.maxLife = s.life;
      s.gravity = 90;
      this.glowLayer.addChild(s);
      if (!this.pixelParticles) this.pixelParticles = [];
      this.pixelParticles.push(s);
    }
  },

  firework() {
    if (!this.glowLayer) return;
    const colors = [0xffb45e, 0xf1d296, 0xd47b73, 0x9cdcea, 0xa7c98d];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = 7600 + Math.random() * 1350;
    const y = 120 + Math.random() * 100;
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * TAU;
      const s = this.sprite(this.sparkTex(), x, y, 1.4 + Math.random() * 1.6, 0.5, 0.5);
      s.tint = color;
      s.vx = Math.cos(ang) * (55 + Math.random() * 90);
      s.vy = Math.sin(ang) * (55 + Math.random() * 90);
      s.life = 0.8 + Math.random() * 0.7;
      s.maxLife = s.life;
      s.gravity = 30;
      this.glowLayer.addChild(s);
      if (!this.pixelParticles) this.pixelParticles = [];
      this.pixelParticles.push(s);
    }
  },

  update(world, dt, t, camera) {
    if (!this.attached) return;
    if (this.parallaxLayer) {
      this.parallaxLayer.x = -Math.round(camera.x) * 0.18;
      this.parallaxLayer.y = -Math.round(camera.y) * 0.08;
    }
    if (this.river) {
      this.river.tilePosition.x = Math.round(this.river.tilePosition.x + dt * 5);
      this.river.tilePosition.y = Math.round(this.river.tilePosition.y + dt * 1.2);
    }
    if (this.rafts) {
      for (const r of this.rafts) { r.c.x = Math.round(r.r.x); r.c.y = Math.round(r.r.y); }
    }
    if (this.festivalLayer) {
      this.festivalLayer.visible = world.day >= 3;
      if (world.day >= 3) {
        for (const f of this.festivalCrowd || []) {
          f.root.y = Math.round(f.base + Math.sin(t * 1.8 + f.phase) * 2);
        }
      }
      for (const l of this.lanternSprites || []) {
        if (l.l.lit) l.glow.alpha = 0.45 + Math.sin(t * 2.5 + l.l.index) * 0.08;
      }
    }
    // деревья/трава слегка дышат
    if (this.sceneryLayer) this.sceneryLayer.y = 0;
    for (const f of this.pixelFireflies || []) {
      f.x = Math.round(f.ox + Math.cos(t * f.sp + f.phase) * f.ax);
      f.y = Math.round(f.oy + Math.sin(t * f.sp * 0.8 + f.phase) * f.ay);
      f.alpha = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 1.7 + f.phase));
    }
    if (this.pixelParticles) {
      for (let i = this.pixelParticles.length - 1; i >= 0; i--) {
        const s = this.pixelParticles[i];
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += (s.gravity || 0) * dt;
        s.alpha = Math.max(0, s.life / s.maxLife);
        if (s.life <= 0) {
          if (s.parent) s.parent.removeChild(s);
          this.pixelParticles.splice(i, 1);
        }
      }
    }
  },

  portrait(kind) {
    const P = this.P;
    const palettes = {
      vitya: { skin: P.skin, hair: P.hair, hat: null, coat: P.coat, accent: P.gold, beard: P.hair },
      zina: { skin: P.skin, hair: P.hair, hat: 'scarfRed', coat: P.woodLo, accent: P.whiteLo, beard: null },
      stas: { skin: P.skin, hair: P.hair, hat: 'capGreen', coat: P.blue, accent: P.red, beard: null },
      grisha: { skin: P.skin, hair: P.hair, hat: 'capGreen', coat: P.leaf, accent: P.gold, beard: null },
      pavel: { skin: P.skinLo, hair: P.stoneHi, hat: 'capDark', coat: P.coat, accent: P.goldLo, beard: P.stoneHi },
      klava: { skin: P.skin, hair: P.hair, hat: 'scarfRed', coat: P.wood, accent: P.white, beard: null },
      boris: { skin: P.skinLo, hair: P.hairLo, hat: 'capDark', coat: P.blueDark, accent: P.redLo, beard: P.hairHi },
      arkady: { skin: P.skin, hair: P.hairLo, hat: 'topHat', coat: P.leafDark, accent: P.goldLo, beard: null },
    };
    const d = palettes[kind] || palettes.vitya;
    return this.tex('portrait2-' + kind, 35, 35, (ctx) => {
      const R = (x, y, w, h, c) => this.px(ctx, x, y, w, h, c);
      // фон
      R(0, 0, 35, 35, P.sky1);
      R(1, 1, 33, 33, P.sky2);
      R(2, 2, 31, 31, P.sky1);
      // плечи
      R(4, 25, 27, 9, P.ink2);
      R(5, 24, 25, 9, d.coat);
      R(7, 25, 2, 7, d.coat);
      R(27, 26, 2, 7, P.ink2);
      R(14, 23, 7, 3, d.skin);
      // голова
      R(10, 6, 15, 17, P.ink);
      R(11, 7, 13, 15, d.skin);
      R(12, 8, 3, 6, P.skinHi);
      R(21, 10, 2, 8, P.skinLo);
      // глаза, нос, рот
      R(14, 13, 2, 2, P.ink);
      R(20, 13, 2, 2, P.ink);
      R(17, 15, 2, 3, P.skinDark);
      R(15, 19, 5, 2, P.skinDark);
      // брови
      R(13, 11, 4, 1, d.hair);
      R(19, 11, 4, 1, d.hair);
      // борода
      if (d.beard) {
        R(12, 17, 11, 7, d.beard);
        R(14, 23, 7, 2, d.beard);
        R(16, 19, 3, 2, P.ink, 0.25);
      }
      // головной убор/волосы
      if (d.hat === 'scarfRed') {
        R(9, 3, 17, 5, P.redDark);
        R(10, 2, 15, 5, P.red);
        R(8, 6, 2, 10, P.redLo);
        R(25, 6, 2, 10, P.redLo);
        R(11, 4, 6, 2, P.redHi);
      } else if (d.hat === 'capGreen' || d.hat === 'capDark') {
        const c = d.hat === 'capGreen' ? P.leafDark : P.stoneDark;
        const hi = d.hat === 'capGreen' ? P.leaf : P.stone;
        R(9, 4, 17, 4, c);
        R(10, 2, 15, 3, c);
        R(11, 3, 7, 2, hi);
        R(23, 6, 5, 2, c);
      } else if (d.hat === 'topHat') {
        R(8, 0, 19, 3, P.ink);
        R(9, 2, 17, 3, P.ink2);
        R(10, 1, 4, 2, P.ink);
        R(23, 3, 4, 2, P.ink);
      } else {
        R(9, 3, 17, 5, d.hair);
        R(10, 2, 13, 3, d.hair);
        R(8, 6, 2, 7, d.hair);
        R(25, 6, 2, 7, d.hair);
      }
      // шарф/воротник
      R(11, 22, 13, 3, d.accent);
      R(16, 23, 3, 2, P.goldHi);
      // блик
      R(12, 7, 2, 3, P.skinHi);
      // рамка
      R(0, 0, 35, 1, P.goldLo);
      R(0, 34, 35, 1, P.goldLo);
      R(0, 0, 1, 35, P.goldLo);
      R(34, 0, 1, 35, P.goldLo);
    });
  },

  itemTex(type) {
    return this.tex('item-' + type, 14, 14, (ctx) => {
      const R = (x, y, w, h, c, a) => this.px(ctx, x, y, w, h, c, a);
      if (type === 'honey') {
        R(2, 4, 10, 9, '#3b291d'); R(3, 5, 8, 7, '#d99339'); R(4, 6, 6, 2, '#ffc665');
        R(4, 3, 6, 2, '#6d4628'); R(5, 2, 4, 2, '#e7c176'); R(4, 10, 6, 1, '#f4b95a');
      } else if (type === 'water' || type === 'spring') {
        R(5, 1, 4, 3, '#6d5b3e'); R(4, 4, 6, 8, '#24495b'); R(5, 5, 4, 6, '#78c5d3');
        R(5, 5, 3, 2, '#c8eef0'); R(5, 10, 3, 1, '#b5d9dd');
        if (type === 'spring') R(3, 12, 8, 1, '#9cdcea');
      } else if (type === 'hop') {
        R(6, 1, 2, 2, '#627a3b'); R(5, 3, 4, 4, '#8aa551'); R(4, 6, 6, 3, '#6e8a42');
        R(5, 9, 4, 2, '#526a34'); R(3, 4, 2, 2, '#a7c16f'); R(9, 5, 2, 2, '#a7c16f');
      } else if (type === 'berries') {
        R(3, 4, 4, 4, '#7c2d3b'); R(7, 5, 4, 4, '#a54550'); R(5, 7, 4, 4, '#c75b66');
        R(4, 5, 1, 1, '#eaa0a6'); R(8, 6, 1, 1, '#f0b0b4'); R(6, 8, 1, 1, '#f0b0b4');
        R(6, 1, 2, 4, '#4f6f43'); R(4, 2, 5, 2, '#4f6f43');
      } else if (type === 'mushroom') {
        R(4, 8, 6, 4, '#d9c9a7'); R(3, 4, 8, 5, '#8f3f37'); R(2, 6, 10, 3, '#a95047');
        R(4, 4, 2, 2, '#f2d7b3'); R(8, 5, 2, 1, '#f2d7b3');
      } else if (type === 'herb') {
        R(6, 2, 2, 11, '#4f7344'); R(4, 4, 3, 2, '#7fa263'); R(8, 3, 3, 2, '#6c9456');
        R(3, 7, 3, 2, '#8caf6c'); R(9, 8, 3, 2, '#7fa263');
      } else if (type === 'yeast') {
        R(2, 3, 10, 9, '#584428'); R(3, 4, 8, 7, '#c7a56b'); R(4, 5, 6, 2, '#8e6d3d');
        R(5, 8, 4, 1, '#8e6d3d');
      } else if (type === 'flashlight') {
        R(5, 2, 4, 9, '#aab8b8'); R(6, 3, 2, 5, '#e7f4ef'); R(4, 4, 1, 4, '#617477');
        R(6, 11, 2, 1, '#ffcf70');
      } else if (type === 'lure') {
        R(5, 4, 4, 6, '#d5a143'); R(6, 5, 2, 3, '#ffe3a0'); R(7, 1, 1, 4, '#899b96');
      } else {
        R(3, 3, 8, 8, '#687c49'); R(5, 2, 4, 10, '#91a95e');
      }
    });
  },

  sparkTex() {
    return this.tex('spark', 2, 2, (ctx) => {
      this.px(ctx, 0, 0, 2, 2, '#ffffff');
    });
  },

  heartTex(filled) {
    return this.tex('heart-' + (filled ? 1 : 0), 9, 8, (ctx) => {
      const c = filled ? '#b34b45' : '#333a45';
      const hi = filled ? '#dd7a68' : '#444d59';
      this.px(ctx, 1, 1, 3, 2, c); this.px(ctx, 5, 1, 3, 2, c);
      this.px(ctx, 0, 2, 9, 2, c); this.px(ctx, 1, 4, 7, 2, c);
      this.px(ctx, 2, 6, 5, 1, c); this.px(ctx, 3, 7, 3, 1, c);
      this.px(ctx, 2, 2, 1, 1, hi);
    });
  },

  paperTex() {
    return this.tex('ui-paper', 61, 26, (ctx) => {
      const R = (x, y, w, h, c, a) => this.px(ctx, x, y, w, h, c, a);
      // мягкая тень, ступеньками по 2 px
      R(4, 5, 56, 21, '#1a1114', 0.28);
      R(7, 3, 50, 24, '#1a1114', 0.16);
      // неровный бумажный край
      R(4, 1, 52, 2, '#6c5138');
      R(2, 3, 56, 2, '#6c5138');
      R(1, 5, 58, 17, '#6c5138');
      R(3, 22, 54, 2, '#6c5138');
      R(7, 24, 46, 1, '#6c5138');
      // поле бумаги и верхний свет
      R(3, 3, 54, 20, '#d8c7a1');
      R(3, 5, 2, 16, '#c9b58c');
      R(4, 3, 51, 2, '#e7d9b5');
      R(4, 23, 49, 1, '#b9a37e');
      // редкие пятна и следы сгиба — только 2×2, без шума
      R(10, 17, 2, 2, '#c4ad84', 0.8);
      R(47, 7, 2, 2, '#c4ad84', 0.65);
      R(38, 20, 2, 2, '#c9b58c', 0.7);
      R(24, 6, 2, 1, '#c9b58c', 0.55);
    });
  },

  stampTex() {
    return this.tex('ui-stamp', 15, 15, (ctx) => {
      const R = (x, y, w, h, c, a) => this.px(ctx, x, y, w, h, c, a);
      // кольцо 2 px, с разрывами — как оттиск печати
      R(5, 1, 5, 1, '#9c3d2f', 0.72);
      R(2, 3, 2, 2, '#9c3d2f', 0.72); R(11, 3, 2, 2, '#9c3d2f', 0.72);
      R(1, 6, 1, 4, '#9c3d2f', 0.72); R(13, 6, 1, 4, '#9c3d2f', 0.72);
      R(2, 11, 2, 2, '#9c3d2f', 0.72); R(11, 11, 2, 2, '#9c3d2f', 0.72);
      R(5, 13, 5, 1, '#9c3d2f', 0.72);
      R(3, 5, 2, 1, '#c76554', 0.45);
    });
  },

  crowTex() {
    return this.tex('crow', 16, 12, (ctx) => {
      this.px(ctx, 3, 5, 8, 5, '#0b0e13');
      this.px(ctx, 10, 3, 5, 4, '#0d1117');
      this.px(ctx, 14, 4, 2, 1, '#2e2922');
      this.px(ctx, 11, 4, 1, 1, '#d8b36a');
      this.px(ctx, 1, 3, 5, 2, '#080b10');
      this.px(ctx, 1, 2, 2, 4, '#080b10');
      this.px(ctx, 5, 9, 2, 2, '#171b20');
      this.px(ctx, 9, 9, 2, 2, '#171b20');
    });
  },

  checkpointTex(lit) {
    return this.tex('checkpoint-' + (lit ? 1 : 0), 12, 30, (ctx) => {
      this.px(ctx, 5, 8, 2, 22, '#493626');
      this.px(ctx, 2, 4, 8, 2, '#684a2e');
      this.px(ctx, 1, 5, 10, 6, '#2b2420');
      this.px(ctx, 3, 6, 6, 4, lit ? '#ffd382' : '#3c4650');
      this.px(ctx, 4, 7, 4, 2, lit ? '#fff0b4' : '#4d5964');
      this.px(ctx, 0, 29, 12, 1, '#241a17');
      if (lit) this.px(ctx, 5, 8, 2, 2, '#fff3c0');
    });
  },

  gardenTex(stage, watered) {
    const key = `garden-${stage}-${watered ? 1 : 0}`;
    return this.tex(key, 14, 8, (ctx) => {
      this.px(ctx, 0, 3, 14, 5, '#3c2a1f');
      this.px(ctx, 1, 2, 12, 2, '#6c4a2c');
      this.px(ctx, 2, 4, 10, 2, watered ? '#2c2a1e' : '#35251b');
      if (stage > 0) {
        const hh = stage === 1 ? 3 : stage === 2 ? 5 : 6;
        this.px(ctx, 3, 3 - hh, 1, hh, '#5c7f4d');
        this.px(ctx, 5, 3 - hh + 1, 1, hh - 1, '#78985c');
        this.px(ctx, 9, 3 - hh, 1, hh, '#5c7f4d');
        this.px(ctx, 11, 3 - hh + 1, 1, hh - 1, '#78985c');
        if (stage >= 2) {
          this.px(ctx, 2, 5, 2, 1, '#8aa867');
          this.px(ctx, 8, 4, 2, 1, '#8aa867');
        }
        if (stage >= 3) {
          this.px(ctx, 4, 1, 2, 2, '#c6b35a');
          this.px(ctx, 9, 1, 2, 2, '#c6b35a');
        }
      }
    });
  },

  updateGarden(beds) {
    if (!this.gardenSprites) return;
    for (const item of this.gardenSprites) {
      const state = (beds && beds[item.bed.index]) || { stage: 0, watered: false };
      item.spr.texture = this.gardenTex(state.stage || 0, !!state.watered);
    }
  },

  syncAllLanterns() {
    if (!this.lanternSprites) return;
    for (const l of this.lanternSprites) this.syncLantern(l.l);
  },

  updateVisibility(world) {
    if (this.festivalLayer) this.festivalLayer.visible = world.day >= 3;
  },

  buildDummy(world) {
    const d = world.tutorialDummy;
    if (!d || !d.container) return;
    if (d.art) d.art.visible = false;
    const tex = this.tex('dummy', 20, 36, (ctx) => {
      this.px(ctx, 9, 12, 2, 23, '#4e3623');
      this.px(ctx, 3, 18, 14, 2, '#5e4129');
      this.px(ctx, 5, 8, 10, 12, '#806338');
      this.px(ctx, 6, 9, 8, 10, '#a88752');
      this.px(ctx, 6, 11, 2, 2, '#c6a66c');
      this.px(ctx, 3, 14, 2, 7, '#6d4d2f');
      this.px(ctx, 15, 14, 2, 7, '#6d4d2f');
      this.px(ctx, 7, 3, 6, 6, '#b99a63');
      this.px(ctx, 8, 4, 1, 1, '#29201a');
      this.px(ctx, 11, 4, 1, 1, '#29201a');
      this.px(ctx, 8, 7, 4, 1, '#5c4030');
      this.px(ctx, 5, 0, 10, 2, '#4b3928');
      this.px(ctx, 6, 2, 8, 2, '#5b452d');
      this.px(ctx, 0, 24, 20, 1, 'rgba(0,0,0,.28)');
    });
    const spr = this.sprite(tex, 0, 0, 2, 0.5, 1);
    d.container.addChild(spr);
    d.pixelSprite = spr;
  },

  buildCat(world) {
    const tex = this.tex('cat', 16, 10, (ctx) => {
      this.px(ctx, 2, 5, 11, 4, '#191b20');
      this.px(ctx, 2, 8, 3, 2, '#14161a');
      this.px(ctx, 10, 8, 3, 2, '#14161a');
      this.px(ctx, 11, 2, 5, 5, '#1d1f23');
      this.px(ctx, 12, 1, 2, 2, '#1d1f23');
      this.px(ctx, 15, 1, 2, 2, '#1d1f23');
      this.px(ctx, 13, 4, 1, 1, '#d8b36a');
      this.px(ctx, 15, 4, 1, 1, '#d8b36a');
      this.px(ctx, 0, 3, 2, 2, '#1b1d21');
      this.px(ctx, 0, 1, 1, 3, '#1b1d21');
    });
    const c = this.sprite(tex, 520, 600, 2, 0.5, 1);
    this.worldLayer.addChild(c);
    this.catSprite = c;
  },

  buildForeground(world) {
    const c = new PIXI.Container();
    world.worldRoot.addChild(c);
    this.foregroundLayer = c;
    const tex = this.tex('fgGrass', 10, 20, (ctx) => {
      this.px(ctx, 3, 18, 1, 2, '#2c211d');
      this.px(ctx, 3, 10, 1, 8, '#37513a');
      this.px(ctx, 4, 6, 1, 12, '#466546');
      this.px(ctx, 5, 2, 1, 16, '#5a7c52');
      this.px(ctx, 2, 12, 1, 6, '#2f472f');
      this.px(ctx, 6, 8, 1, 9, '#3d5b3d');
      this.px(ctx, 7, 4, 1, 12, '#52734c');
    });
    const rng = this.rng(542);
    for (let i = 0; i < 120; i++) {
      const x = rng() * 10600;
      if (x > 1885 && x < 2860) continue;
      const s = this.sprite(tex, x, 722, 2, 0.5, 1);
      s.alpha = 0.55 + rng() * 0.3;
      c.addChild(s);
    }
  },

  buildGlow(world) {
    const c = new PIXI.Container();
    this.worldLayer.addChild(c);
    this.glowLayer = c;
    const add = (x, y, scale, alpha, color) => {
      const s = this.sprite(this.lampGlowTex(), x, y, scale, 0.5, 0.5);
      s.tint = color || 0xffb45e;
      s.alpha = alpha;
      s.blendMode = PIXI.BLEND_MODES.ADD;
      c.addChild(s);
      return s;
    };
    // окна и очаги
    add(205, 558, 6, 0.25, 0xffc46e);
    add(4850, 548, 9, 0.22, 0xffbd68);
    add(5300, 548, 7, 0.18, 0xffb45e);
    add(5520, 552, 8, 0.20, 0xff9c4e);
    add(7000, 548, 7, 0.18, 0xffb45e);
    add(7565, 550, 6, 0.22, 0xffc46e);
    add(8970, 548, 7, 0.22, 0xffc46e);
    add(8520, 470, 12, 0.24, 0xffb35e);
    add(8420, 550, 3, 0.25, 0xffd58a);
    add(8620, 550, 3, 0.25, 0xffd58a);
    add(9600, 560, 6, 0.18, 0x9ccdd8);
    add(10230, 540, 7, 0.16, 0x9ccdd8);

    // пиксельные светляки
    this.pixelFireflies = [];
    const rng = this.rng(1931);
    for (let i = 0; i < 36; i++) {
      const x = 80 + rng() * 10400;
      const y = 430 + rng() * 150;
      const s = this.sprite(this.sparkTex(), x, y, 1.8, 0.5, 0.5);
      s.tint = i % 4 ? 0xffe39a : 0xa7d8d2;
      s.alpha = 0.25 + rng() * 0.35;
      s.ox = x; s.oy = y; s.phase = rng() * TAU; s.ax = 8 + rng() * 22; s.ay = 5 + rng() * 12; s.sp = 0.3 + rng() * 0.5;
      c.addChild(s);
      this.pixelFireflies.push(s);
    }
  },

  syncLantern(l) {
    if (!this.lanternSprites) return;
    const item = this.lanternSprites.find(x => x.l === l);
    if (!item) return;
    item.spr.texture = this.lanternTex(l.lit);
    item.glow.alpha = l.lit ? 0.55 : 0.15;
  },
};

/* ============================================================
   ПИКСЕЛЬНЫЕ ПЕРСОНАЖИ
   ============================================================ */

function buildPixelCharacter(kind) {
  const P = PixelArt.P;
  const defs = {
    vitya: { skin: P.skin, hair: P.hair, hat: null, coat: P.coat, coatHi: P.coatHi, coatLo: P.coatLo, accent: P.gold, boots: P.woodDark, beard: P.hair, kid: false },
    zina: { skin: P.skin, hair: P.hair, hat: 'scarfRed', coat: P.woodLo, coatHi: P.wood, coatLo: P.woodDark, accent: P.whiteLo, boots: P.woodDark, beard: null, kid: false },
    stas: { skin: P.skin, hair: P.hair, hat: 'capGreen', coat: P.blue, coatHi: P.blueHi, coatLo: P.blueDark, accent: P.red, boots: P.woodDark, beard: null, kid: false },
    grisha: { skin: P.skin, hair: P.hair, hat: 'capGreen', coat: P.leaf, coatHi: P.leafHi, coatLo: P.leafDark, accent: P.gold, boots: P.woodDark, beard: null, kid: true },
    pavel: { skin: P.skinLo, hair: P.stoneHi, hat: 'capDark', coat: P.coat, coatHi: P.coatHi, coatLo: P.coatDark, accent: P.goldLo, boots: P.woodDark, beard: P.stoneHi, kid: false },
    klava: { skin: P.skin, hair: P.hair, hat: 'scarfRed', coat: P.wood, coatHi: P.woodHi, coatLo: P.woodDark, accent: P.white, boots: P.woodDark, beard: null, kid: false },
    boris: { skin: P.skinLo, hair: P.hairLo, hat: 'capDark', coat: P.blueDark, coatHi: P.blue, coatLo: P.ink2, accent: P.redLo, boots: P.ink, beard: P.hairHi, kid: false },
    arkady: { skin: P.skin, hair: P.hairLo, hat: 'topHat', coat: P.leafDark, coatHi: P.leaf, coatLo: P.ink2, accent: P.goldLo, boots: P.ink, beard: null, kid: false },
    thug: { skin: P.skinLo, hair: P.hairLo, hat: 'capDark', coat: P.stoneLo, coatHi: P.stone, coatLo: P.stoneDark, accent: P.redLo, boots: P.ink, beard: null, kid: false },
    villager: { skin: P.skin, hair: P.hair, hat: 'capGreen', coat: P.blueLo, coatHi: P.blue, coatLo: P.blueDark, accent: P.goldLo, boots: P.woodDark, beard: null, kid: false },
  };
  const d = defs[kind] || defs.villager;
  const wide = d.kid ? 14 : 16;
  const high = d.kid ? 22 : 26;
  const headY = d.kid ? 2 : 3;

  const make = (frame) => {
    const c = makeCanvas(wide, high);
    const x = c.getContext('2d');
    const R = (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(px, py, pw, ph); };
    // мягкая тень (2 пикселя, не шум)
    R(3, high - 2, wide - 6, 1, 'rgba(10,8,12,.42)');
    R(4, high - 1, wide - 8, 1, 'rgba(10,8,12,.24)');

    const bodyTop = headY + 7;
    const bodyBottom = high - 7;
    const bodyW = d.kid ? 7 : 8;
    const bx = Math.floor((wide - bodyW) / 2);
    const legY = high - 7;
    const legCol = d.boots;

    // ноги и обувь: 2-3 пикселя, две фазы
    const lx = frame ? bx - 1 : bx;
    const rx = frame ? bx + bodyW : bx + bodyW - 3;
    R(lx, legY, 3, 5, legCol);
    R(rx, legY, 3, 5, legCol);
    R(lx - 1, high - 3, 4, 2, P.ink2);
    R(rx, high - 3, 4, 2, P.ink2);
    R(lx + 1, legY, 1, 3, P.woodDark);
    R(rx + 1, legY, 1, 3, P.woodDark);

    // силуэт пальто/платья
    R(bx - 1, bodyTop - 1, bodyW + 2, bodyBottom - bodyTop + 2, d.coatLo);
    R(bx, bodyTop, bodyW, bodyBottom - bodyTop, d.coat);
    // расклешение снизу
    R(bx - 2, bodyBottom - 1, bodyW + 4, 2, d.coatLo);
    // свет сверху-слева, тень снизу-справа
    R(bx, bodyTop, 2, bodyBottom - bodyTop - 2, d.coatHi);
    R(bx + bodyW - 2, bodyTop + 2, 2, bodyBottom - bodyTop - 4, d.coatLo);
    // складка
    R(bx + Math.floor(bodyW / 2), bodyTop + 2, 1, bodyBottom - bodyTop - 4, d.coatLo);

    // руки, ладони
    R(bx - 2, bodyTop + 2, 2, 5, d.coatLo);
    R(bx + bodyW, bodyTop + 2, 2, 5, d.coatLo);
    R(bx - 2, bodyTop + 6, 2, 2, d.skin);
    R(bx + bodyW, bodyTop + 6, 2, 2, d.skin);

    // шея и голова: контур выборочный — тёмный тон кожи/волос, не чистый чёрный
    R(bx + 3, bodyTop - 1, 2, 2, d.skin);
    R(bx + 1, headY, 6, 6, P.hairDark);
    R(bx + 2, headY, 4, 5, d.skin);
    R(bx + 2, headY + 1, 1, 3, P.skinHi, 0.8);
    // глаза
    R(bx + 3, headY + 3, 1, 1, P.ink);
    R(bx + 6, headY + 3, 1, 1, P.ink);
    // нос/рот
    R(bx + 5, headY + 5, 1, 1, P.skinDark);
    R(bx + 4, headY + 6, 2, 1, P.skinDark);
    // борода
    if (d.beard) {
      R(bx + 2, headY + 6, 4, 3, d.beard);
      R(bx + 3, headY + 8, 2, 1, d.beard);
    }

    // головные уборы / волосы — чистый силуэт
    if (d.hat === 'scarfRed') {
      R(bx, headY - 2, 8, 3, P.redDark);
      R(bx + 1, headY - 2, 6, 2, P.red);
      R(bx - 1, headY, 2, 3, P.redLo);
      R(bx + 7, headY, 2, 3, P.redLo);
      R(bx + 6, headY + 2, 2, 1, P.red);
    } else if (d.hat === 'capGreen' || d.hat === 'capDark') {
      const c1 = d.hat === 'capGreen' ? P.leafDark : P.stoneDark;
      const c2 = d.hat === 'capGreen' ? P.leaf : P.stone;
      R(bx, headY - 1, 7, 2, c1);
      R(bx + 1, headY - 2, 5, 1, c1);
      R(bx + 1, headY - 1, 5, 1, c2);
      R(bx + 6, headY, 2, 1, c1);
    } else if (d.hat === 'topHat') {
      R(bx, headY - 3, 8, 3, P.ink);
      R(bx + 1, headY - 3, 6, 2, P.ink2);
      R(bx + 1, headY - 1, 6, 1, P.ink);
    } else {
      R(bx, headY - 1, 7, 2, d.hair);
      R(bx + 1, headY - 2, 5, 1, d.hair);
      R(bx - 1, headY, 1, 2, d.hair);
    }

    // шарф/воротник
    R(bx + 1, bodyTop - 1, bodyW - 2, 2, d.accent);
    R(bx + 2, bodyTop, bodyW - 4, 1, P.goldHi, 0.6);

    // отдельные детали силуэта
    if (kind === 'klava') {
      R(bx + 1, bodyTop + 3, bodyW - 2, 5, P.whiteLo);
      R(bx + 3, bodyTop + 5, 2, 2, P.woodLo);
    }
    if (kind === 'arkady') {
      R(bx + bodyW, bodyTop + 5, 4, 6, P.woodDark);
      R(bx + bodyW + 1, bodyTop + 6, 2, 4, P.wood);
      R(bx + bodyW + 1, bodyTop + 6, 2, 1, P.woodHi);
    }
    if (kind === 'boris') {
      R(bx + 6, headY + 5, 4, 1, P.whiteLo);
      R(bx + 10, headY + 4, 1, 1, P.redHi);
    }
    if (kind === 'thug') {
      R(bx - 3, bodyTop + 5, 3, 4, P.woodLo);
      R(bx - 2, bodyTop + 4, 2, 1, P.wood);
    }
    return c;
  };

  const tex0 = PIXI.Texture.fromCanvas(make(0));
  const tex1 = PIXI.Texture.fromCanvas(make(1));
  tex0.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  tex1.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const root = new PIXI.Container();
  const sprite = new PIXI.Sprite(tex0);
  sprite.anchor.set(0.5, 1);
  sprite.scale.set(4);
  root.addChild(sprite);
  return { root, sprite, frames: [tex0, tex1], w: wide, h: high };
}

function buildPixelBroom() {
  const c = makeCanvas(24, 10);
  const x = c.getContext('2d');
  x.fillStyle = '#6e4b2c'; x.fillRect(0, 5, 18, 3);
  x.fillStyle = '#89643a'; x.fillRect(16, 3, 5, 5);
  x.fillStyle = '#c9ad70';
  for (let i = 0; i < 6; i++) x.fillRect(20 + (i % 2), 2 + i, 4, 1);
  const tex = PIXI.Texture.fromCanvas(c);
  tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const s = new PIXI.Sprite(tex);
  s.anchor.set(0, 0.5);
  s.scale.set(4);
  return s;
}
