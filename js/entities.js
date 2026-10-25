'use strict';

/* ============================================================
   ЖИВЫЕ СУЩНОСТИ: дядя Витя, NPC, фонари, ингредиенты
   ============================================================ */

class Player {
  constructor(game, x, groundY) {
    this.game = game;
    this.w = 30;
    this.h = 60;
    this.x = x;
    this.y = groundY - this.h;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.onGround = true;
    this.coyote = 0.1;
    this.jumpBuf = 0;
    this.riding = null;
    this.squash = 0;
    this.phase = 0;
    this.walkTime = 0;
    this.footTimer = 0;
    this.blinkTimer = 2 + Math.random() * 3;
    this.blink = 0;
    this.locked = false;
    this.landVy = 0;

    const art = buildVitya();
    this.art = art;
    this.container = art.root;
    this.container.x = this.x + this.w / 2;
    this.container.y = this.y + this.h;
    this.container.scale.x = this.dir;

    // мягкий свет от фонаря вокруг героя
    this.aura = softGlow(0xffb45e, 420, 0.10);
    this.aura.y = -24;
    this.container.addChildAt(this.aura, 1);

    this.totalTime = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get feet() { return this.y + this.h; }

  respawn(x, groundY) {
    this.x = x;
    this.y = groundY - this.h;
    this.vx = 0; this.vy = 0;
    this.onGround = true;
    this.riding = null;
    this.container.x = this.cx;
    this.container.y = this.feet;
  }

  update(dt, t) {
    this.totalTime = t;
    const input = this.game.input;
    const world = this.game.world;
    const solids = world.activeSolids;
    const locked = this.locked || this.game.isPlayerLocked();
    const wasGrounded = this.onGround;

    let axis = 0;
    if (!locked) {
      if (input.left()) axis -= 1;
      if (input.right()) axis += 1;
    }

    const maxSpeed = 258;
    const accel = this.onGround ? 2500 : 1750;
    const friction = this.onGround ? 3200 : 900;
    if (axis !== 0) {
      this.vx = U.approach(this.vx, axis * maxSpeed, accel * dt);
      this.dir = axis;
    } else {
      this.vx = U.approach(this.vx, 0, friction * dt);
    }

    // прыжок
    if (!locked && input.jumpPressed()) this.jumpBuf = 0.13;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    if (this.onGround) this.coyote = 0.11;
    else this.coyote = Math.max(0, this.coyote - dt);

    this.vy += 2150 * dt;
    if (this.vy > 1050) this.vy = 1050;

    if (this.jumpBuf > 0 && this.coyote > 0) {
      this.vy = -715;
      this.onGround = false;
      this.riding = null;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.squash = 0.55;
      this.game.audio.sfx('jump');
      world.spawnDust(this.cx, this.feet, this.dir, 5);
    }

    if (!input.jump() && this.vy < -250) this.vy = -250;

    // горизонталь
    this.x += this.vx * dt;
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (!this.overlaps(s)) continue;
      if (this.vx > 0) this.x = s.x - this.w;
      else if (this.vx < 0) this.x = s.x + s.w;
      this.vx = 0;
    }

    // вертикаль
    this.landVy = this.vy;
    this.y += this.vy * dt;
    this.onGround = false;
    this.riding = null;
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (!this.overlaps(s)) continue;
      if (this.vy >= 0) {
        this.y = s.y - this.h;
        if (this.landVy > 360) {
          this.squash = Math.min(1, this.landVy / 900);
          this.game.audio.sfx('land');
          world.spawnDust(this.cx, this.feet, 0, 7);
          this.game.shake(2.2, 0.14);
        }
        this.vy = 0;
        this.onGround = true;
        this.riding = s.moving ? s : null;
      } else {
        this.y = s.y + s.h;
        this.vy = 0;
      }
    }

    if (!wasGrounded && this.onGround && Math.abs(this.landVy) > 200) this.squash = Math.max(this.squash, 0.4);

    // границы
    this.x = U.clamp(this.x, 0, world.width - this.w);
    if (this.y > 900) this.game.onPlayerFall();

    // бег / пыль
    if (this.onGround && Math.abs(this.vx) > 40) {
      this.phase += Math.abs(this.vx) * dt * 0.055;
      this.footTimer -= dt;
      if (this.footTimer <= 0) {
        this.footTimer = 0.28;
        world.spawnDust(this.cx - this.dir * 5, this.feet, -this.dir, 1);
        if (Math.random() < 0.5) this.game.audio.sfx('step');
      }
    } else {
      this.phase += dt * 1.4;
    }

    this.animate(dt, t);
  }

  overlaps(s) {
    return this.x < s.x + s.w && this.x + this.w > s.x && this.y < s.y + s.h && this.y + this.h > s.y;
  }

  animate(dt, t) {
    const a = this.art;
    this.container.x = this.cx;
    this.container.y = this.feet;
    this.container.scale.x = this.dir;

    this.squash = U.damp(this.squash, 0, 11, dt);
    const sq = this.squash;
    const moving = Math.abs(this.vx) > 20 && this.onGround;
    const air = !this.onGround;

    const bob = moving ? Math.sin(this.phase * 2) * 1.4 : Math.sin(t * 2.1) * 0.65;
    a.body.y = bob * 0.4;
    a.body.scale.set(1 + sq * 0.12, 1 - sq * 0.16);

    let legSwing = moving ? Math.sin(this.phase) * 0.62 : 0;
    let armSwing = moving ? -Math.sin(this.phase) * 0.5 : 0;

    if (air) {
      const rise = U.clamp(this.vy / -600, -1, 1);
      a.legBack.rotation = 0.35 - rise * 0.2;
      a.legFront.rotation = -0.55 + rise * 0.15;
      a.armBack.rotation = -0.6;
      a.armFront.rotation = -0.9;
      a.body.rotation = U.clamp(this.vx * 0.00012, -0.06, 0.06);
    } else {
      a.legBack.rotation = legSwing;
      a.legFront.rotation = -legSwing;
      a.armBack.rotation = armSwing * 0.8;
      a.armFront.rotation = -armSwing * 0.7;
      a.body.rotation = U.damp(a.body.rotation, 0, 12, dt);
    }

    a.head.rotation = moving ? Math.sin(this.phase) * 0.025 : Math.sin(t * 1.3) * 0.015;
    a.head.y = -58 + (moving ? Math.abs(Math.sin(this.phase)) * -0.8 : 0);

    // фонарь покачивается
    const targetSwing = moving ? Math.sin(this.phase - 0.4) * 0.18 : Math.sin(t * 1.2) * 0.05;
    a.lantern.rotation = U.damp(a.lantern.rotation, targetSwing - this.vx * 0.00025, 8, dt);
    a.lantern.y = -30 + (air ? -3 : 0);

    // дыхание
    a.breath.alpha = 0.35 + Math.sin(t * 1.4) * 0.18;
    a.breath.y = -63 - (Math.sin(t * 1.4) * 0.8);

    // моргание
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) { this.blink = 0.12; this.blinkTimer = 2.8 + Math.random() * 4.2; }
    if (this.blink > 0) {
      this.blink -= dt;
      a.eyeL.scale.y = 0.15; a.eyeR.scale.y = 0.15;
    } else {
      a.eyeL.scale.y = 1; a.eyeR.scale.y = 1;
    }

    // свет
    a.glow.alpha = 0.38 + Math.sin(t * 5.2) * 0.025;
    this.aura.alpha = 0.09 + Math.sin(t * 2.3) * 0.012;

    // тень чуть меняется в прыжке
    a.shadow.scale.x = air ? 0.7 : 1;
    a.shadow.alpha = air ? 0.22 : 0.45;
  }
}

/* ============================================================
   NPC
   ============================================================ */

class NPC {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.kind = def.kind;
    this.name = def.name;
    this.portrait = def.portrait || def.kind;
    this.x = def.x;
    this.y = def.y; // ноги
    this.baseX = def.x;
    this.facing = def.facing === undefined ? 1 : def.facing;
    this.phase = Math.random() * 20;
    this.hidden = false;
    this.gone = false;
    this.walking = false;
    this.walkTargetX = null;
    this.walkSpeed = 60;
    this.fade = 1;

    const builders = { vitya: buildVitya, zina: buildZina, stas: buildStas, grisha: buildGrisha, boris: buildBorisych };
    const built = (builders[this.kind] || buildZina)();
    this.art = built;
    this.container = built.root;
    this.container.x = this.x;
    this.container.y = this.y;
    this.container.scale.x = this.facing;
    if (def.alpha !== undefined) this.container.alpha = def.alpha;

    this.interactRange = def.range || 88;
    this.lines = def.lines || ((g) => [{ speaker: this.name, text: '...' }]);
  }

  get cx() { return this.x; }

  update(dt, t) {
    this.phase += dt;
    const a = this.art;
    if (!a) return;

    if (this.walking) {
      const dir = Math.sign(this.walkTargetX - this.x) || 1;
      this.x += dir * this.walkSpeed * dt;
      this.container.scale.x = dir;
      a.body.y = Math.abs(Math.sin(t * 9)) * -2;
      if (a.legFront) {
        a.legFront.rotation = Math.sin(t * 10) * 0.5;
        a.legBack.rotation = -Math.sin(t * 10) * 0.5;
        a.armFront.rotation = -Math.sin(t * 10) * 0.4;
        a.armBack.rotation = Math.sin(t * 10) * 0.4;
      }
      if (Math.abs(this.x - this.walkTargetX) < 4) {
        this.walking = false;
        this.x = this.walkTargetX;
        this.fadeOut = true;
      }
    } else {
      if (a.body) {
        a.body.y = Math.sin(t * 1.5 + this.phase) * 0.8;
        a.body.scale.y = 1 + Math.sin(t * 1.5 + this.phase) * 0.006;
        if (a.legFront) {
          a.legFront.rotation = 0;
          a.legBack.rotation = 0;
          a.armFront.rotation = Math.sin(t * 1.3 + this.phase) * 0.02;
          a.armBack.rotation = -Math.sin(t * 1.3 + this.phase) * 0.02;
        }
      }
      if (this.kind === 'cat') {
        // хвост
      }
    }

    if (a.cig) a.cig.alpha = 0.25 + Math.abs(Math.sin(t * 2.7 + this.phase)) * 0.2;
    if (a.glow) a.glow.alpha = 0.22 + Math.sin(t * 2.2) * 0.04;

    if (this.fadeOut) {
      this.fade -= dt * 1.4;
      this.container.alpha = Math.max(0, this.fade) * (this.def.alpha === undefined ? 1 : this.def.alpha);
      if (this.fade <= 0) this.gone = true;
    }

    this.container.x = this.x;
    this.container.y = this.y;
  }

  walkTo(x, speed) {
    this.walking = true;
    this.walkTargetX = x;
    this.walkSpeed = speed || 65;
  }

  getDialogue(game) {
    return this.lines(game, this);
  }
}

/* ============================================================
   КОНТРОЛЬНЫЕ ФОНАРИ
   ============================================================ */

class CheckpointLantern {
  constructor(world, x, groundY, index) {
    this.world = world;
    this.x = x;
    this.y = groundY;
    this.index = index;
    this.lit = false;
    this.pulse = Math.random() * 5;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = groundY;

    const g = new PIXI.Graphics();
    drawLanternPost(g, 0, 0, false);
    this.post = g;
    this.container.addChild(g);

    this.glow = softGlow(0xffb45e, 190, 0);
    this.glow.x = 20;
    this.glow.y = -60;
    this.container.addChild(this.glow);

    this.pool = softGlow(0xffa64a, 340, 0);
    this.pool.y = -2;
    this.pool.scale.y = 0.32;
    this.container.addChild(this.pool);

    this.spark = new PIXI.Graphics();
    this.spark.x = 20; this.spark.y = -60;
    this.container.addChild(this.spark);
    this.spark.visible = false;
  }

  light(silent) {
    if (this.lit) return false;
    this.lit = true;
    // перерисовать яркий фонарь
    this.post.clear();
    drawLanternPost(this.post, 0, 0, true);
    this.glow.alpha = 0.55;
    this.pool.alpha = 0.26;
    this.spark.visible = true;
    this.spark.clear();
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * TAU, d = 30 + Math.random() * 60;
      const s = glowSprite(i % 2 ? 0xffd995 : 0xff9a44, 8 + Math.random() * 14, 0.5);
      s.x = Math.cos(ang) * d * 0.4; s.y = Math.sin(ang) * d * 0.4;
      this.spark.addChild(s);
      s.vy = Math.sin(ang) * d * 0.4 + 20;
      s.vx = Math.cos(ang) * d * 0.3;
      s.life = 1.5;
    }
    if (!silent) this.world.game.audio.sfx('checkpoint');
    this.world.game.ui.toast('Фонарь зажжён', 'контрольная точка', 0xffcf8a);
    return true;
  }

  update(dt, t) {
    if (this.lit) {
      this.glow.alpha = 0.5 + Math.sin(t * 3.4 + this.pulse) * 0.08;
      this.pool.alpha = 0.22 + Math.sin(t * 2.1 + this.pulse) * 0.03;
      this.glow.scale.set(1 + Math.sin(t * 1.7 + this.pulse) * 0.03);
      for (let i = this.spark.children.length - 1; i >= 0; i--) {
        const s = this.spark.children[i];
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 10 * dt;
        s.alpha = Math.max(0, s.life / 1.5) * 0.6;
        if (s.life <= 0) this.spark.removeChild(s);
      }
    }
  }
}

/* ============================================================
   ИНГРЕДИЕНТЫ
   ============================================================ */

class Collectible {
  constructor(game, type, x, y, id) {
    this.game = game;
    this.type = type;
    this.id = id;
    this.baseX = x;
    this.baseY = y;
    this.collected = false;
    this.collectT = 0;
    this.phase = Math.random() * TAU;

    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    const colors = { honey: 0xffb35c, hop: 0xc0cf82, water: 0x9cdcea };
    const color = colors[type];

    this.halo = softGlow(color, 150, 0.35);
    this.container.addChild(this.halo);

    this.ring = new PIXI.Graphics();
    this.container.addChild(this.ring);

    this.art = new PIXI.Container();
    const g = new PIXI.Graphics();
    if (type === 'honey') {
      drawHoneyIcon(g, 0, 0, 1.55);
      this.art.addChild(g);
    } else if (type === 'water') {
      drawWaterIcon(g, 0, 0, 1.6);
      this.art.addChild(g);
    } else {
      drawHop(g, 0, 0, 1.45);
      this.art.addChild(g);
    }
    this.container.addChild(this.art);

    this.sparkles = [];
    for (let i = 0; i < 3; i++) {
      const s = glowSprite(color, 10, 0.5);
      s.x = Math.cos(i / 3 * TAU) * 22;
      s.y = Math.sin(i / 3 * TAU) * 12;
      this.container.addChild(s);
      this.sparkles.push(s);
    }

    this.drawRing();
  }

  drawRing() {
    const colors = { honey: 0xffca7a, hop: 0xd7e0a0, water: 0xaee8f2 };
    const g = this.ring;
    g.clear();
    g.lineStyle(1.2, colors[this.type], 0.35);
    g.drawEllipse(0, 14, 22, 5);
    g.lineStyle(1, colors[this.type], 0.14);
    g.drawEllipse(0, 14, 32, 8);
  }

  update(dt, t) {
    if (this.collected) {
      this.collectT += dt;
      const k = U.easeOutCubic(Math.min(1, this.collectT / 0.35));
      this.container.scale.set(1 + k * 0.8, 1 + k * 0.8);
      this.container.alpha = 1 - k;
      this.container.y = this.baseY - k * 24;
      if (this.collectT > 0.4) this.container.visible = false;
      return;
    }
    const bob = Math.sin(t * 2.0 + this.phase) * 4.5;
    this.container.y = this.baseY + bob;
    this.container.rotation = Math.sin(t * 0.9 + this.phase) * 0.035;
    this.halo.alpha = 0.28 + Math.sin(t * 2.4 + this.phase) * 0.06;
    this.sparkles.forEach((s, i) => {
      const a = t * 0.8 + i / 3 * TAU + this.phase;
      s.x = Math.cos(a) * 26;
      s.y = Math.sin(a * 1.1) * 11 - 4;
      s.alpha = 0.25 + Math.sin(a * 2) * 0.15;
    });
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    return true;
  }
}
