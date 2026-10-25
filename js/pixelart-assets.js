'use strict';

/* ============================================================
   PIXEL MODE 2: настоящий 16-bit пиксель-арт на готовых спрайтах
   ============================================================ */

(function () {
  if (typeof PixelArt === 'undefined') return;

  const OLD_ATTACH = PixelArt.attach;
  const OLD_RESET = PixelArt.resetForWorld;
  const OLD_UPDATE = PixelArt.update;
  const OLD_CHARACTER = buildPixelCharacter;
  const OLD_PORTRAIT = PixelArt.portrait;

  const KINDS = ['vitya', 'zina', 'stas', 'grisha', 'pavel', 'klava', 'boris', 'arkady', 'thug', 'villager'];
  const ANIMS = { idle: 4, run: 8, jump: 15, attack: 8 };
  const ATTACK_FRAMES = [0, 3, 4, 7];
  const ASSET = 'assets/pixel/hf/';

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image failed: ' + url));
      img.src = url;
    });
  }

  PixelArt.hdReady = false;
  PixelArt.assetImages = null;
  PixelArt.charAnims = null;
  PixelArt.portraitTextures = null;
  PixelArt.baseTextures = null;

  PixelArt.load = async function () {
    if (GRAPHICS_MODE !== 'pixel') return true;
    if (this.hdReady) return true;
    try {
      const files = {
        tiles: ASSET + 'tiles.png',
        buildings: ASSET + 'buildings.png',
        green0: ASSET + 'trees_half/green0.png',
        green1: ASSET + 'trees_half/green1.png',
        green2: ASSET + 'trees_half/green2.png',
        dark0: ASSET + 'trees_half/dark0.png',
        dark1: ASSET + 'trees_half/dark1.png',
        gold0: ASSET + 'trees_half/gold0.png',
        gold1: ASSET + 'trees_half/gold1.png',
      };
      for (const k of KINDS) {
        files['p_' + k] = ASSET + 'portrait/' + k + '.png';
        for (const a of Object.keys(ANIMS)) files[k + '_' + a] = ASSET + 'char/' + k + '_' + a + '.png';
      }
      const keys = Object.keys(files);
      const imgs = await Promise.all(keys.map(k => loadImage(files[k])));
      const images = {};
      const bases = {};
      keys.forEach((k, i) => {
        images[k] = imgs[i];
        const b = PIXI.BaseTexture.from(imgs[i]);
        b.scaleMode = PIXI.SCALE_MODES.NEAREST;
        bases[k] = b;
      });
      this.assetImages = images;
      this.baseTextures = bases;
      this.textures = {};

      this.treeTextures = ['green0', 'green1', 'green2', 'dark0', 'dark1', 'gold0', 'gold1']
        .map(k => this.imageTexture(k));

      this.charAnims = {};
      for (const k of KINDS) {
        const o = {};
        for (const a of Object.keys(ANIMS)) {
          const n = a === 'attack' ? ATTACK_FRAMES.length : ANIMS[a];
          const frames = [];
          for (let i = 0; i < n; i++) {
            const srcIndex = a === 'attack' ? ATTACK_FRAMES[i] : i;
            frames.push(this.frameTexture(k + '_' + a, srcIndex * 128, 0, 128, 96));
          }
          o[a] = frames;
        }
        o.attack = o.attack;
        this.charAnims[k] = o;
      }

      this.portraitTextures = {};
      for (const k of KINDS) this.portraitTextures[k] = this.imageTexture('p_' + k);

      this.hdReady = true;
      return true;
    } catch (err) {
      console.error('[pixel-art] assets failed, fallback to generated sprites', err);
      this.hdReady = false;
      return false;
    }
  };

  PixelArt.imageTexture = function (key) {
    if (this.textures[key]) return this.textures[key];
    const t = PIXI.Texture.from(this.assetImages[key]);
    if (t.baseTexture) t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this.textures[key] = t;
    return t;
  };

  PixelArt.frameTexture = function (key, x, y, w, h) {
    const id = `${key}:${x}:${y}:${w}:${h}`;
    if (this.textures[id]) return this.textures[id];
    const base = this.baseTextures[key];
    const t = new PIXI.Texture(base, new PIXI.Rectangle(x, y, w, h));
    this.textures[id] = t;
    return t;
  };

  PixelArt.makeHouseTexture = function (kind) {
    const id = 'house:' + kind;
    if (this.textures[id]) return this.textures[id];
    const b = this.assetImages.buildings;
    const wide = kind === 'brewery' || kind === 'mill' || kind === 'stage';
    const W = wide ? 232 : 160;
    const H = 128;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // ---- крыша: синяя черепица, вырезанная по двускатному силуэту ----
    const roofY = 16;
    const roofH = 48;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, roofY + roofH);
    ctx.lineTo(W / 2, roofY);
    ctx.lineTo(W, roofY + roofH);
    ctx.closePath();
    ctx.clip();
    // чистый участок синей черепицы из атласа
    for (let y = roofY; y < roofY + roofH; y += 24) {
      for (let x = 0; x < W; x += 48) {
        ctx.drawImage(b, 240, 16, 48, 24, x, y, 48, 24);
      }
    }
    ctx.restore();
    // тёмный контур крыши и конёк
    ctx.fillStyle = '#2b1d1a';
    ctx.fillRect(0, roofY + roofH - 2, W, 2);
    ctx.fillRect(W / 2 - 2, roofY - 2, 4, 4);
    ctx.fillStyle = '#7b5944';
    ctx.fillRect(2, roofY + roofH - 4, W - 4, 2);

    // ---- стены: фактурная панель из атласа ----
    for (let x = 16; x < W - 8; x += 128) {
      ctx.drawImage(b, 256, 64, 128, 48, x, 64, 128, 48);
    }
    // деревянные углы
    ctx.fillStyle = '#3d2a21';
    ctx.fillRect(8, 64, 8, 64);
    ctx.fillRect(W - 16, 64, 8, 64);
    ctx.fillStyle = '#6b4a32';
    ctx.fillRect(10, 64, 2, 64);
    ctx.fillRect(W - 14, 64, 2, 64);

    // ---- дверь ----
    const dw = 32, dh = 48;
    const dx = Math.floor(W / 2 - dw / 2);
    ctx.drawImage(b, 272, 160, 32, 48, dx, 112 - dh, dw, dh);
    ctx.fillStyle = '#171112';
    ctx.fillRect(dx - 2, 112 - dh - 2, dw + 4, 2);

    // ---- окна ----
    const wy = 70;
    for (const wx of [26, W - 58]) {
      ctx.drawImage(b, 224, 96, 32, 32, wx, wy, 32, 32);
      ctx.fillStyle = 'rgba(255,178,80,.46)';
      ctx.fillRect(wx + 4, wy + 4, 24, 24);
      ctx.fillStyle = 'rgba(255,224,154,.62)';
      ctx.fillRect(wx + 8, wy + 8, 9, 9);
    }

    // ---- труба ----
    if (kind !== 'stage') {
      const cx = W - 42;
      ctx.drawImage(b, 320, 64, 16, 32, cx, roofY + 2, 16, 32);
      ctx.fillStyle = '#3a2b22';
      ctx.fillRect(cx - 2, roofY, 20, 3);
    }

    // ---- тень/цоколь ----
    ctx.fillStyle = 'rgba(8,6,10,.55)';
    ctx.fillRect(6, H - 5, W - 12, 5);
    ctx.fillStyle = '#4b4f49';
    ctx.fillRect(8, H - 8, W - 16, 3);

    // ---- вывеска пивоварни ----
    if (kind === 'brewery') {
      ctx.fillStyle = '#241a17';
      ctx.fillRect(W / 2 - 38, 48, 76, 18);
      ctx.fillStyle = '#9b7248';
      ctx.fillRect(W / 2 - 36, 50, 72, 14);
      ctx.fillStyle = '#d8b77c';
      ctx.fillRect(W / 2 - 28, 54, 56, 2);
      ctx.fillRect(W / 2 - 22, 59, 44, 2);
    }
    const t = PIXI.Texture.fromCanvas(c);
    t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this.textures[id] = t;
    return t;
  };

  PixelArt.makeStageTexture = function () {
    if (this.textures.hdStage) return this.textures.hdStage;
    const c = makeCanvas(240, 96);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // тёмный задник
    ctx.fillStyle = '#140f1a';
    ctx.fillRect(0, 0, 240, 96);
    // красный занавес с мягкими складками
    const reds = ['#6f252c', '#8e3035', '#a63a3c', '#7b292f'];
    for (let x = 18; x < 222; x += 6) {
      ctx.fillStyle = reds[(x / 6 | 0) % reds.length];
      ctx.fillRect(x, 8, 6, 64);
    }
    ctx.fillStyle = '#c04a45';
    for (let x = 20; x < 220; x += 24) ctx.fillRect(x, 10, 2, 60);
    ctx.fillStyle = '#42171e';
    ctx.fillRect(12, 4, 216, 8);
    ctx.fillStyle = '#d1a25f';
    ctx.fillRect(12, 6, 216, 2);
    for (let x = 18; x < 222; x += 24) ctx.fillRect(x, 4, 3, 8);
    // сцена и ступени
    ctx.fillStyle = '#2b1d17';
    ctx.fillRect(0, 72, 240, 24);
    ctx.fillStyle = '#6b492f';
    ctx.fillRect(4, 72, 232, 5);
    ctx.fillStyle = '#3e2a1e';
    for (let x = 6; x < 236; x += 12) ctx.fillRect(x, 78, 11, 3);
    ctx.fillStyle = '#1c1311';
    ctx.fillRect(0, 90, 240, 6);
    // колонны
    ctx.fillStyle = '#211615';
    ctx.fillRect(0, 0, 12, 96);
    ctx.fillRect(228, 0, 12, 96);
    ctx.fillStyle = '#7a5536';
    ctx.fillRect(2, 0, 3, 96);
    ctx.fillRect(235, 0, 3, 96);
    const t = PIXI.Texture.fromCanvas(c);
    t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this.textures.hdStage = t;
    return t;
  };

  PixelArt.buildSky = function (world) {
    const tex = this.tex('hd-sky', 640, 360, (ctx, w, h) => {
      // ночное небо с холодным градиентом
      const bands = [
        [0, 110, '#060a18'], [110, 170, '#0a1226'], [170, 225, '#101c38'],
        [225, 275, '#182746'], [275, 320, '#243352'], [320, 360, '#3a3b50'],
      ];
      for (const [y1, y2, col] of bands) this.px(ctx, 0, y1, w, y2 - y1, col);
      // дальние облака
      for (let i = 0; i < 7; i++) {
        const x = 20 + i * 94, y = 122 + (i % 3) * 24;
        this.px(ctx, x, y, 90, 4, '#1c2c4a', 0.35);
        this.px(ctx, x + 18, y - 3, 48, 3, '#263b5a', 0.28);
        this.px(ctx, x + 34, y + 4, 40, 2, '#111c31', 0.45);
      }
      // луна
      const mx = 250, my = 16, mr = 21;
      for (let y = -mr; y <= mr; y++) {
        for (let x = -mr; x <= mr; x++) {
          if (x * x + y * y <= mr * mr) this.px(ctx, mx + x, my + y, 1, 1, '#ead7ae', 0.98);
        }
      }
      for (let y = -mr; y <= mr; y++) {
        for (let x = -mr; x <= mr; x++) {
          if (x * x + y * y <= (mr - 2) * (mr - 2) && x * 0.8 + y > 6) {
            this.px(ctx, mx + x, my + y, 1, 1, '#d5bd94', 0.9);
          }
        }
      }
      this.px(ctx, mx - 9, my - 5, 6, 3, '#c5ab83', 0.8);
      this.px(ctx, mx + 6, my + 9, 5, 3, '#c5ab83', 0.7);
      // звезды
      const rng = this.rng(404);
      for (let i = 0; i < 190; i++) {
        const x = Math.floor(rng() * w);
        const y = Math.floor(rng() * 255);
        const bright = i % 9 === 0 ? 0.95 : 0.3 + rng() * 0.5;
        this.px(ctx, x, y, 1, 1, i % 7 === 0 ? '#f4d79e' : '#cdd8e8', bright);
      }
      // далёкий силуэт старой плотины и леса
      for (let x = 0; x < w; x += 4) {
        const top = 292 + Math.sin(x * 0.017) * 9 + Math.sin(x * 0.06) * 3;
        this.px(ctx, x, top, 4, h - top, '#111827', 0.95);
      }
      for (let x = 0; x < w; x += 24) {
        const top = 270 + Math.round(Math.sin(x * 0.09) * 8);
        this.px(ctx, x, top, 2, 90, '#0b121d', 0.9);
        this.px(ctx, x - 9, top + 18, 20, 5, '#0b121d', 0.75);
      }
    });
    const sky = new PIXI.Sprite(tex);
    sky.scale.set(2);
    this.skySprite = sky;
    world.root.addChildAt(sky, 0);
  };

  PixelArt.buildParallax = function (world) {
    const c = new PIXI.Container();
    const trees = this.treeTextures;
    const positions = [-140, 110, 350, 620, 900, 1180, 1440];
    positions.forEach((x, i) => {
      const tex = trees[(i * 3 + 1) % trees.length];
      const s = new PIXI.Sprite(tex);
      s.anchor.set(0.5, 1);
      s.scale.set(2);
      s.x = x; s.y = 660;
      s.tint = i % 2 ? 0x6f8282 : 0x5d7279;
      s.alpha = 0.48;
      c.addChild(s);
    });
    const fog = new PIXI.Sprite(this.tex('hd-fog', 640, 100, (ctx, w, h) => {
      for (let y = 0; y < 100; y += 2) {
        this.px(ctx, 0, y, w, 2, '#8fa5b5', 0.015 + (y / 100) * 0.05);
      }
    }));
    fog.scale.set(2);
    fog.y = 440;
    c.addChild(fog);
    this.parallaxLayer = c;
    world.root.addChildAt(c, 1);
  };

  PixelArt.cropTexture = function (key, sx, sy, sw, sh) {
    const id = `crop:${key}:${sx}:${sy}:${sw}:${sh}`;
    if (this.textures[id]) return this.textures[id];
    const img = this.assetImages[key];
    const c = makeCanvas(sw, sh);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const t = PIXI.Texture.fromCanvas(c);
    t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    this.textures[id] = t;
    return t;
  };

  PixelArt.groundTextures = function () {
    if (this._groundTex) return this._groundTex;
    const stone = this.tex('hd-stone', 16, 16, (ctx) => {
      this.px(ctx, 0, 0, 16, 16, '#262a27');
      this.px(ctx, 0, 0, 16, 2, '#3b403b');
      this.px(ctx, 0, 8, 16, 1, '#181d1a');
      this.px(ctx, 8, 0, 1, 8, '#181d1a');
      this.px(ctx, 3, 3, 4, 2, '#444943');
      this.px(ctx, 11, 2, 3, 2, '#4a4e48');
      this.px(ctx, 1, 10, 5, 2, '#3f443f');
      this.px(ctx, 10, 11, 4, 2, '#343833');
      this.px(ctx, 4, 13, 2, 1, '#54574f');
    });
    const dirt = this.tex('hd-dirt', 16, 16, (ctx) => {
      this.px(ctx, 0, 0, 16, 16, '#201f1d');
      this.px(ctx, 0, 0, 16, 2, '#2d2b27');
      this.px(ctx, 1, 8, 16, 1, '#171614');
      this.px(ctx, 8, 0, 1, 16, '#171614');
      this.px(ctx, 3, 3, 3, 2, '#34322c');
      this.px(ctx, 11, 10, 3, 2, '#2b2925');
    });
    const path = this.tex('hd-path', 16, 16, (ctx) => {
      this.px(ctx, 0, 0, 16, 16, '#343532');
      this.px(ctx, 0, 0, 16, 2, '#474844');
      this.px(ctx, 0, 7, 16, 1, '#232522');
      this.px(ctx, 7, 0, 1, 8, '#232522');
      this.px(ctx, 2, 3, 4, 2, '#55564f');
      this.px(ctx, 10, 10, 4, 2, '#4a4b45');
    });
    this._groundTex = {
      top: stone,
      dirt,
      path,
      edge: this.tex('hd-edge', 16, 10, (ctx) => {
        this.px(ctx, 0, 3, 16, 2, '#3d5a39');
        this.px(ctx, 1, 1, 2, 5, '#6b8d56');
        this.px(ctx, 4, 0, 2, 6, '#7d9e62');
        this.px(ctx, 7, 3, 2, 4, '#527348');
        this.px(ctx, 10, 1, 2, 6, '#6b8d56');
        this.px(ctx, 13, 3, 2, 4, '#4a683f');
        this.px(ctx, 0, 6, 16, 2, '#2b3e2b');
      }),
      water: this.tex('hd-water2', 32, 16, (ctx) => {
        const hi = '#79b2b4', mid = '#2f6272', low = '#1d4252', dark = '#112c3d';
        this.px(ctx, 0, 0, 32, 16, mid);
        this.px(ctx, 0, 0, 32, 2, low);
        this.px(ctx, 0, 13, 32, 3, dark);
        // длинные спокойные волны, без «гофры» на весь экран
        this.px(ctx, 1, 4, 9, 2, hi, 0.55);
        this.px(ctx, 13, 7, 12, 2, hi, 0.38);
        this.px(ctx, 22, 3, 8, 2, hi, 0.45);
        this.px(ctx, 5, 10, 7, 1, hi, 0.28);
        this.px(ctx, 17, 11, 10, 1, hi, 0.26);
        this.px(ctx, 0, 0, 2, 2, hi, 0.5);
      }),
      grass: this.tex('hd-grass', 16, 12, (ctx) => {
        this.px(ctx, 0, 9, 16, 3, '#3b5139');
        this.px(ctx, 1, 5, 2, 5, '#5b7b4e');
        this.px(ctx, 4, 3, 2, 7, '#6b8c56');
        this.px(ctx, 8, 6, 2, 4, '#4d6c44');
        this.px(ctx, 11, 2, 2, 8, '#75955d');
        this.px(ctx, 14, 7, 2, 3, '#46613e');
      }),
      flower: this.tex('hd-flower', 8, 8, (ctx) => {
        this.px(ctx, 3, 5, 1, 3, '#4f6b44');
        this.px(ctx, 2, 2, 4, 3, '#d8b46f');
        this.px(ctx, 3, 1, 2, 5, '#e8cf8a');
        this.px(ctx, 1, 3, 6, 1, '#b08b4f');
      }),
      rock: this.tex('hd-rock', 12, 8, (ctx) => {
        this.px(ctx, 1, 3, 8, 5, '#4c544e');
        this.px(ctx, 2, 2, 6, 2, '#7b8378');
        this.px(ctx, 3, 2, 3, 1, '#9ca397');
        this.px(ctx, 8, 5, 3, 2, '#363d39');
      }),
    };
    return this._groundTex;
  };

  PixelArt.buildWorld = function (world) {
    const layer = this.layer(world);
    const n = new PIXI.Container();
    layer.addChild(n);
    this.terrainLayer = n;
    const gt = this.groundTextures();

    for (const gr of world.grounds) {
      const g = new PIXI.TilingSprite(gt.top, gr.w, 32);
      g.x = gr.x; g.y = gr.top;
      g.tileScale.set(2, 2);
      n.addChild(g);
      const d = new PIXI.TilingSprite(gt.dirt, gr.w, 230);
      d.x = gr.x; d.y = gr.top + 32;
      d.tileScale.set(2, 2);
      d.tint = 0x8b8b86;
      n.addChild(d);
      // травяной/моховой край поверх камня
      const moss = new PIXI.TilingSprite(gt.edge, gr.w, 20);
      moss.x = gr.x; moss.y = gr.top - 8;
      moss.tileScale.set(2, 2);
      moss.alpha = 0.9;
      n.addChild(moss);
    }

    // тропинки
    for (const [a, b] of [[520, 980], [4220, 5820], [7400, 9180], [9300, 10600]]) {
      const p = new PIXI.TilingSprite(gt.path, b - a, 32);
      p.x = a; p.y = 600;
      p.tileScale.set(2, 2);
      p.tint = 0x8a857d;
      p.alpha = 0.75;
      n.addChild(p);
    }

    // река
    const water = new PIXI.TilingSprite(gt.water, 950, 210);
    water.x = 1900; water.y = 690;
    water.tileScale.set(2, 2);
    this.river = water;
    n.addChild(water);

    // берега
    const bank = new PIXI.Graphics();
    bank.beginFill(0x1b1d22); bank.drawRect(1885, 600, 18, 120); bank.endFill();
    bank.beginFill(0x3b403d); bank.drawRect(2848, 600, 18, 120); bank.endFill();
    bank.beginFill(0x526749); bank.drawRect(1885, 600, 18, 5); bank.endFill();
    bank.beginFill(0x526749); bank.drawRect(2848, 600, 18, 5); bank.endFill();
    n.addChild(bank);

    // трава/цветы/камни вдоль кромки
    const rng = this.rng(921);
    for (let i = 0; i < 120; i++) {
      const x = 30 + rng() * 10500;
      if (x > 1885 && x < 2860) continue;
      const tex = i % 7 === 0 ? gt.flower : gt.grass;
      const s = this.sprite(tex, x, 604, 2, 0.5, 1);
      s.alpha = 0.55 + rng() * 0.3;
      n.addChild(s);
    }
    for (let i = 0; i < 48; i++) {
      const x = 30 + rng() * 10500;
      if (x > 1885 && x < 2860) continue;
      n.addChild(this.sprite(gt.rock, x, 620 + rng() * 70, 2, 0.5, 1));
    }

    this.buildScenery(world, n);
    this.buildPlatforms(world, n);
  };

  PixelArt.buildScenery = function (world, layer) {
    const s = new PIXI.Container();
    layer.addChild(s);
    this.sceneryLayer = s;

    const treeNames = ['green0', 'green1', 'dark0', 'dark1', 'green2', 'gold0', 'gold1'];
    const tree = (x, base, variant) => {
      const name = treeNames[Math.abs(variant || 0) % treeNames.length];
      const key = 'tree_' + name;
      let tex = this.textures[key];
      if (!tex) {
        const idx = ['green0', 'green1', 'green2', 'dark0', 'dark1', 'gold0', 'gold1'].indexOf(name);
        tex = this.treeTextures[idx];
        this.textures[key] = tex;
      }
      s.addChild(this.sprite(this.shadowTex(), x, base - 1, 2, 0.5, 0.5));
      const spr = new PIXI.Sprite(tex);
      spr.anchor.set(0.5, 1);
      spr.scale.set(2);
      spr.x = x; spr.y = base;
      s.addChild(spr);
    };
    const house = (x, base, kind) => {
      const spr = this.sprite(this.makeHouseTexture(kind), x, base, 2, 0.5, 1);
      if (kind === 'brewery') spr.tint = 0xffedcf;
      if (kind === 'mill') spr.tint = 0xb8c8cc;
      s.addChild(spr);
    };
    const prop = (key, x, base, sc) => {
      if (this.assetsProps && this.assetsProps[key]) {
        s.addChild(this.sprite(this.assetsProps[key], x, base, sc || 2, 0.5, 1));
      }
    };

    // дом и двор
    house(220, 600, 'home');
    const noteTex = this.tex('hd-note', 5, 7, (ctx) => {
      this.px(ctx, 0, 0, 5, 7, '#d9cba9');
      this.px(ctx, 1, 1, 3, 1, '#8a7658');
      this.px(ctx, 1, 3, 3, 1, '#8a7658');
      this.px(ctx, 1, 5, 2, 1, '#8a7658');
      this.px(ctx, 3, 5, 1, 1, '#a54c3b');
    });
    s.addChild(this.sprite(noteTex, 152, 556, 2, 0.5, 0.5));
    s.addChild(this.sprite(this.chickenTex(), 610, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.chickenTex(), 690, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.smokeTex(), 290, 380, 2, 0.5, 0.5));
    s.addChild(this.sprite(this.smokeTex(), 310, 350, 2, 0.5, 0.5));
    s.addChild(this.sprite(this.wellTex(), 450, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.woodpileTex(), 380, 600, 2, 0.5, 1));
    this.fenceRun(s, 500, 640, 600, 0.9);
    s.addChild(this.sprite(this.signTex(), 560, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.crateTex(), 637, 600, 2, 0.5, 1));
    this.fenceRun(s, 780, 802, 600, 0.9);
    this.fenceRun(s, 938, 975, 600, 0.9);
    // уличный фонарь у мостков
    s.addChild(this.sprite(this.lanternTex(true), 745, 600, 2, 0.5, 1));
    const lampGlow = this.sprite(this.lampGlowTex(), 750, 548, 4, 0.5, 0.5);
    lampGlow.tint = 0xffbf6a;
    lampGlow.alpha = 0.32;
    lampGlow.blendMode = PIXI.BLEND_MODES.ADD;
    s.addChild(lampGlow);

    tree(1060, 600, 0);
    tree(1560, 600, 2);
    tree(1710, 600, 3);
    // лесная поросль у мостков
    const bushes = this.cropTexture('tiles', 96, 0, 48, 32);
    s.addChild(this.sprite(bushes, 795, 600, 2, 0.5, 1));
    s.addChild(this.sprite(bushes, 915, 600, 2, 0.5, 1));
    s.addChild(this.sprite(bushes, 1380, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1170, 505, 2, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1400, 445, 2, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1610, 500, 2, 0.5, 1));
    s.addChild(this.sprite(this.hiveTex(), 1190, 600, 2, 0.5, 1));

    // роща
    [[2960, 1], [3120, 2], [3360, 0], [3530, 4], [3750, 1], [3960, 3], [4120, 2]]
      .forEach(([x, v]) => tree(x, 600, v));
    s.addChild(this.sprite(this.springTex(), 3140, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.signTex(), 3610, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.mushroomPropTex(), 3050, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.stonesTex(), 3400, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.reedsTex(), 1910, 700, 2, 0.5, 1));
    s.addChild(this.sprite(this.reedsTex(), 2825, 700, 2, 0.5, 1));

    // пивоварня
    house(5070, 600, 'brewery');
    s.addChild(this.sprite(this.kettleTex(), 5520, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.barrelTex(), 5380, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.barrelTex(), 5560, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.crateTex(), 4700, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.signTex(), 4360, 600, 2, 0.5, 1));
    this.fenceRun(s, 4500, 4700, 600, 0.9);
    s.addChild(this.sprite(this.smokeTex(), 5330, 388, 2, 0.5, 0.5));

    // лес и мельница
    for (let i = 0; i < 7; i++) {
      const x = 5880 + i * 190;
      if (x > 7350) break;
      tree(x, 600, i + 4);
    }
    s.addChild(this.sprite(this.signTex(), 5940, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.millTex(), 7000, 600, 2, 0.5, 1));
    this.fenceRun(s, 7200, 7290, 600, 0.9);

    // площадь
    house(7565, 600, 'house');
    house(8970, 600, 'house');
    house(9185, 600, 'house');
    s.addChild(this.sprite(this.stallTex('#7a3d38'), 7725, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.stallTex('#415968'), 9040, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.makeStageTexture(), 8520, 600, 2, 0.5, 1));
    tree(9060, 600, 1);
    tree(7500, 600, 3);

    // старая плотина
    for (let i = 0; i < 5; i++) {
      const x = 9280 + i * 230;
      tree(x, 600, i + 2);
    }
    s.addChild(this.sprite(this.waterfallTex(), 10220, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.damTex(), 10240, 600, 2, 0.5, 1));
    s.addChild(this.sprite(this.signTex(), 9260, 600, 2, 0.5, 1));

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
  };

  PixelArt.buildPlatforms = function (world, layer) {
    const tile = this.cropTexture('tiles', 0, 0, 16, 16);
    const wood = this.cropTexture('tiles', 0, 96, 64, 16);
    this.platformSprites = [];
    for (const p of world.platforms) {
      let spr;
      if (p.kind === 'crate') {
        spr = this.sprite(this.crateTex(), p.x + p.w / 2, p.y + p.h, 2, 0.5, 0);
      } else if (p.kind === 'island') {
        spr = new PIXI.TilingSprite(tile, p.w, 24);
        spr.x = p.x; spr.y = p.y; spr.tileScale.set(2, 2); spr.tint = 0x8d8d82;
      } else {
        spr = new PIXI.TilingSprite(wood, p.w, 16);
        spr.x = p.x; spr.y = p.y; spr.tileScale.set(2, 2);
      }
      layer.addChild(spr);
      this.platformSprites.push(spr);
      if (p.kind === 'wood') {
        const supports = new PIXI.Graphics();
        supports.lineStyle(2, 0x31241c, 0.8);
        supports.moveTo(p.x + 12, p.y + 16);
        supports.lineTo(p.x + 12, p.y + 34);
        supports.moveTo(p.x + p.w - 12, p.y + 16);
        supports.lineTo(p.x + p.w - 12, p.y + 34);
        layer.addChild(supports);
      }
    }
    this.rafts = [];
    for (const r of world.movingPlatforms) {
      const c = new PIXI.Container();
      const s = new PIXI.TilingSprite(wood, r.w, 16);
      s.tileScale.set(2, 2);
      c.addChild(s);
      const lantern = this.sprite(this.tex('hd-lampSmall', 6, 9, (ctx) => {
        this.px(ctx, 2, 0, 2, 3, '#2a2522');
        this.px(ctx, 1, 3, 4, 5, '#e7b565');
        this.px(ctx, 2, 4, 2, 3, '#ffdc93');
      }), r.w - 12, -8, 2, 0.5, 1);
      c.addChild(lantern);
      c.x = r.x; c.y = r.y;
      layer.addChild(c);
      this.rafts.push({ c, r });
    }
  };

  PixelArt.portrait = function (kind) {
    if (this.hdReady && this.portraitTextures && this.portraitTextures[kind]) {
      return this.portraitTextures[kind];
    }
    return OLD_PORTRAIT.call(this, kind);
  };

  PixelArt.buildAssetCharacter = function (kind) {
    const anims = (this.charAnims && this.charAnims[kind]) || (this.charAnims && this.charAnims.villager);
    const root = new PIXI.Container();
    const shadow = this.sprite(this.shadowTex(), 0, 0, 2, 0.5, 0.5);
    shadow.alpha = 0.55;
    root.addChild(shadow);
    const sprite = new PIXI.Sprite(anims.idle[0]);
    sprite.anchor.set(0.5, 80 / 96);
    sprite.scale.set(2);
    root.addChild(sprite);
    root._sprite = sprite;
    root._anims = anims;
    return { root, sprite, frames: anims.idle, anims, w: 128, h: 96 };
  };

  // Replace global character builder (entities call it directly).
  window.buildPixelCharacter = function (kind) {
    if (PixelArt.hdReady && PixelArt.charAnims) return PixelArt.buildAssetCharacter(kind);
    return OLD_CHARACTER(kind);
  };

  const OLD_BUILD_GLOW = PixelArt.buildGlow;
  PixelArt.buildGlow = function (world) {
    OLD_BUILD_GLOW.call(this, world);
    if (!this.glowLayer) return;
    const add = (x, y, scale, alpha, color) => {
      const s = this.sprite(this.lampGlowTex(), x, y, scale, 0.5, 0.5);
      s.tint = color || 0xffb45e;
      s.alpha = alpha;
      s.blendMode = PIXI.BLEND_MODES.ADD;
      this.glowLayer.addChild(s);
    };
    // тёплые пятна от окон новых домов
    add(220, 535, 5, 0.18, 0xffbd68);
    add(5070, 520, 5, 0.16, 0xffbd68);
    add(7565, 520, 4, 0.14, 0xffbd68);
    add(8970, 520, 4, 0.14, 0xffbd68);
    add(9185, 520, 4, 0.13, 0xffbd68);
  };

  PixelArt.update = function (world, dt, t, camera) {
    OLD_UPDATE.call(this, world, dt, t, camera);
    if (!this.hdReady) return;
    // анимация толпы и статичных NPC на площади
    if (this.festivalCrowd) {
      for (const f of this.festivalCrowd) {
        const sp = f.root && f.root._sprite;
        const an = f.root && f.root._anims;
        if (!sp || !an) continue;
        sp.texture = an.idle[Math.floor(t * 4 + f.phase) % an.idle.length];
      }
    }
  };

  // ensure world attach still works after our overrides
  PixelArt.attach = function (world) {
    if (this.attached && this.world === world) return;
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
  };
})();
