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
    this.speed = 258;
    this.maxHealth = 3;
    this.health = 3;
    this.invuln = 0;
    this.hurtFlash = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackStarted = false;
    this.knockback = 0;
    this.pixelMode = GRAPHICS_MODE === 'pixel';

    let art;
    if (this.pixelMode) {
      art = buildPixelCharacter('vitya');
      this.pixelFrames = art.frames;
      this.pixelAnims = art.anims || { idle: art.frames, run: art.frames, jump: art.frames, attack: art.frames };
      this.pixelAnimName = 'idle';
      this.pixelAnimT = 0;
      this.pixelSprite = art.sprite;
    } else {
      art = buildVitya();
    }
    this.art = art;
    this.container = art.root;
    this.container.x = this.x + this.w / 2;
    this.container.y = this.y + this.h;
    this.container.scale.x = this.dir;

    if (this.pixelMode) {
      this.aura = new PIXI.Sprite(PixelArt.lampGlowTex());
      this.aura.anchor.set(0.5);
      this.aura.tint = 0xffb45e;
      this.aura.scale.set(4);
      this.aura.alpha = 0.13;
      this.aura.y = -26;
      this.container.addChildAt(this.aura, 0);
    } else {
      // мягкий свет от фонаря вокруг героя
      this.aura = softGlow(0xffb45e, 420, 0.10);
      this.aura.y = -24;
      this.container.addChildAt(this.aura, 1);
    }

    this.totalTime = 0;

    if (this.pixelMode) {
      // В пиксельном режиме метла/посох уже в кадре атаки и ходьбы.
      this.broom = null;
    } else {
      // метла — отцовская, для обороны и от ворон
      this.broom = new PIXI.Container();
      const bg = new PIXI.Graphics();
      line(bg, 0, 0, 30, -26, 4, 0x6a4b2f);
      line(bg, 30, -26, 40, -38, 3, 0x7d5a37);
      // щетина
      bg.lineStyle(1.6, 0xb59a63, 0.95);
      for (let i = 0; i < 7; i++) {
        bg.moveTo(39, -37);
        bg.lineTo(47 + (i % 3) * 4, -46 - (i % 4) * 4);
      }
      bg.beginFill(0x8b6d43, 0.9);
      bg.drawEllipse(43, -40, 15, 8);
      bg.endFill();
      this.broom.addChild(bg);
      this.broom.x = 12; this.broom.y = -17;
      this.broom.rotation = -1.4;
      this.broom.visible = false;
      this.container.addChild(this.broom);
    }
  }

  setUpgrades(upgrades) {
    this.speed = upgrades && upgrades.boots ? 289 : 258;
    this.maxHealth = upgrades && upgrades.lamp ? 4 : 3;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }

  heal(n) {
    this.health = Math.min(this.maxHealth, this.health + n);
    if (this.game.progress) this.game.progress.health = this.health;
  }

  takeDamage(n, fromX) {
    if (this.invuln > 0 || this.game.respawning || this.game.state !== 'play') return false;
    this.health -= n;
    if (this.game.progress) this.game.progress.health = this.health;
    this.invuln = 1.15;
    this.hurtFlash = 0.5;
    this.vx = (this.cx < (fromX || this.cx) ? -1 : 1) * 220;
    this.vy = -260;
    this.game.audio.sfx('hurt');
    this.game.shake(4, 0.25);
    this.game.ui.updateHUD();
    if (this.health <= 0) this.game.onPlayerDown();
    return true;
  }

  startAttack() {
    if (this.attackCooldown > 0 || this.locked || this.game.isPlayerLocked()) return;
    this.attackCooldown = 0.42;
    this.attackTimer = 0.3;
    this.attackStarted = true;
    this.game.audio.sfx('swing');
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

    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);

    if (!locked && input.attackPressed()) this.startAttack();

    let axis = 0;
    if (!locked) {
      if (input.left()) axis -= 1;
      if (input.right()) axis += 1;
    }

    const maxSpeed = this.speed;
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
      if (s.disabled) continue;
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
      if (s.disabled) continue;
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

  animatePixel(dt, t) {
    this.container.x = Math.round(this.cx);
    this.container.y = Math.round(this.feet);
    this.container.scale.x = this.dir;

    const moving = Math.abs(this.vx) > 20 && this.onGround;
    const air = !this.onGround;
    const anims = this.pixelAnims || { idle: this.pixelFrames, run: this.pixelFrames, jump: this.pixelFrames, attack: this.pixelFrames };
    const name = this.attackTimer > 0 ? 'attack' : air ? 'jump' : moving ? 'run' : 'idle';
    const frames = anims[name] || anims.idle;

    if (name !== this.pixelAnimName) {
      this.pixelAnimName = name;
      this.pixelAnimT = 0;
    }
    this.pixelAnimT += dt;
    let idx;
    if (name === 'attack') {
      const k = U.clamp(1 - this.attackTimer / 0.3, 0, 1);
      idx = Math.min(frames.length - 1, Math.floor(k * frames.length));
    } else if (name === 'jump') {
      idx = Math.floor(this.pixelAnimT * 10) % frames.length;
    } else if (name === 'run') {
      idx = Math.floor(this.pixelAnimT * 12) % frames.length;
    } else {
      idx = Math.floor(this.pixelAnimT * 4) % frames.length;
    }
    this.pixelSprite.texture = frames[idx];

    const bob = moving ? Math.sin(this.phase * 2) * 1.2 : Math.sin(t * 2.1) * 0.5;
    this.pixelSprite.y = Math.round(bob - (air ? 1 : 0));
    this.pixelSprite.scale.set(2, 2);
    this.pixelSprite.rotation = 0;

    if (this.invuln > 0) this.container.alpha = Math.sin(t * 42) > 0 ? 0.62 : 1;
    else this.container.alpha = 1;

    if (this.aura) this.aura.alpha = 0.10 + Math.sin(t * 2.2) * 0.025;
  }

  overlaps(s) {
    return this.x < s.x + s.w && this.x + this.w > s.x && this.y < s.y + s.h && this.y + this.h > s.y;
  }

  animate(dt, t) {
    if (this.pixelMode) { this.animatePixel(dt, t); return; }
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

    // метла
    if (this.attackTimer > 0) {
      const k = 1 - this.attackTimer / 0.3;
      this.broom.visible = true;
      this.broom.rotation = -1.5 + U.easeOutCubic(k) * 2.5;
      this.broom.alpha = 0.75 + Math.sin(k * Math.PI) * 0.25;
    } else {
      this.broom.visible = false;
    }

    // мигание от урона
    if (this.invuln > 0) this.container.alpha = Math.sin(t * 42) > 0 ? 0.62 : 1;
    else this.container.alpha = 1;

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
    this.pixelMode = GRAPHICS_MODE === 'pixel';

    let built;
    if (this.pixelMode) {
      built = buildPixelCharacter(this.kind);
      this.pixelFrames = built.frames;
      this.pixelAnims = built.anims || { idle: built.frames, run: built.frames };
      this.pixelAnimT = 0;
      this.pixelSprite = built.sprite;
    } else {
      const builders = { vitya: buildVitya, zina: buildZina, stas: buildStas, grisha: buildGrisha, boris: buildBorisych, pavel: buildPavel, klava: buildKlava, arkady: buildArkady };
      built = (builders[this.kind] || buildZina)();
    }
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

  updatePixel(dt, t) {
    const a = this.pixelSprite;
    const anims = this.pixelAnims || { idle: this.pixelFrames, run: this.pixelFrames };
    let frames = anims.idle;
    let fps = 4;
    if (this.walking) {
      const dir = Math.sign(this.walkTargetX - this.x) || 1;
      this.x += dir * this.walkSpeed * dt;
      this.container.scale.x = dir;
      frames = anims.run || anims.idle;
      fps = 10;
      if (Math.abs(this.x - this.walkTargetX) < 4) {
        this.walking = false;
        this.x = this.walkTargetX;
        this.fadeOut = true;
      }
    }
    this.pixelAnimT += dt;
    a.texture = frames[Math.floor(this.pixelAnimT * fps + this.phase) % frames.length];
    a.y = Math.round(this.walking ? Math.abs(Math.sin(t * 9)) * -1 : Math.sin(t * 1.5 + this.phase) * 0.7);
    if (this.fadeOut) {
      this.fade -= dt * 1.4;
      this.container.alpha = Math.max(0, this.fade) * (this.def.alpha === undefined ? 1 : this.def.alpha);
      if (this.fade <= 0) this.gone = true;
    }
    this.container.x = Math.round(this.x);
    this.container.y = Math.round(this.y);
  }

  update(dt, t) {
    this.phase += dt;
    if (this.pixelMode) { this.updatePixel(dt, t); return; }
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

    this.pixelMode = GRAPHICS_MODE === 'pixel';
    if (this.pixelMode) {
      this.post = PixelArt.sprite(PixelArt.checkpointTex(false), 0, 0, 2, 0.5, 1);
      this.container.addChild(this.post);
      this.glow = PixelArt.sprite(PixelArt.lampGlowTex(), 0, -54, 2, 0.5, 0.5);
      this.glow.alpha = 0;
      this.container.addChild(this.glow);
      this.pool = PixelArt.sprite(PixelArt.lampGlowTex(), 0, -2, 2, 0.5, 0.5);
      this.pool.scale.y = 1.4;
      this.pool.alpha = 0;
      this.container.addChild(this.pool);
      this.spark = new PIXI.Container();
      this.container.addChild(this.spark);
      return;
    }

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
    if (this.pixelMode) {
      this.post.texture = PixelArt.checkpointTex(true);
      this.glow.alpha = 0.55;
      this.pool.alpha = 0.24;
      this.spark.removeChildren();
      for (let i = 0; i < 10; i++) {
        const s = PixelArt.sprite(PixelArt.sparkTex(), 0, -54, 2, 0.5, 0.5);
        s.tint = i % 2 ? 0xffd995 : 0xffa64a;
        s.vx = (Math.random() - 0.5) * 34;
        s.vy = -12 - Math.random() * 30;
        s.life = 1.2;
        this.spark.addChild(s);
      }
      if (!silent) {
        this.world.game.audio.sfx('checkpoint');
        this.world.game.ui.toast('Фонарь зажжён', 'контрольная точка', 0xffcf8a);
      }
      return true;
    }
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
    if (!silent) {
      this.world.game.audio.sfx('checkpoint');
      this.world.game.ui.toast('Фонарь зажжён', 'контрольная точка', 0xffcf8a);
    }
    return true;
  }

  update(dt, t) {
    if (this.pixelMode) {
      if (this.lit) {
        this.glow.alpha = 0.46 + Math.sin(t * 3.4 + this.pulse) * 0.08;
        this.pool.alpha = 0.20 + Math.sin(t * 2.1 + this.pulse) * 0.03;
        for (let i = this.spark.children.length - 1; i >= 0; i--) {
          const s = this.spark.children[i];
          s.life -= dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 10 * dt;
          s.alpha = Math.max(0, s.life / 1.2) * 0.65;
          if (s.life <= 0) this.spark.removeChild(s);
        }
      }
      return;
    }
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

    this.pixelMode = GRAPHICS_MODE === 'pixel';
    if (this.pixelMode) {
      const meta = ITEM_INFO[type] || ITEM_INFO.hop;
      this.halo = new PIXI.Sprite(PixelArt.lampGlowTex());
      this.halo.anchor.set(0.5);
      this.halo.tint = meta.color;
      this.halo.scale.set(2);
      this.halo.alpha = 0.28;
      this.container.addChild(this.halo);
      this.ring = new PIXI.Graphics();
      this.container.addChild(this.ring);
      this.art = new PIXI.Container();
      const icon = PixelArt.sprite(PixelArt.itemTex(type), 0, 0, 2, 0.5, 0.5);
      this.art.addChild(icon);
      this.container.addChild(this.art);
      this.sparkles = [];
      for (let i = 0; i < 3; i++) {
        const sp = PixelArt.sprite(PixelArt.sparkTex(), 0, 0, 2, 0.5, 0.5);
        sp.tint = meta.color;
        this.container.addChild(sp);
        this.sparkles.push(sp);
      }
      return;
    }

    const colors = {
      honey: 0xffb35c, hop: 0xc0cf82, water: 0x9cdcea,
      berries: 0xd47b8b, mushroom: 0xe0c9a0, herb: 0x9bbb72,
      yeast: 0xe0c27a, spring: 0xaee8f2, flashlight: 0xaee8f2, lure: 0xffcf72,
    };
    const color = colors[type] || 0xffca7a;

    this.halo = softGlow(color, 150, 0.35);
    this.container.addChild(this.halo);

    this.ring = new PIXI.Graphics();
    this.container.addChild(this.ring);

    this.art = new PIXI.Container();
    const g = new PIXI.Graphics();
    if (type === 'flashlight') {
      rect(g, -6, -12, 12, 24, 0x394348);
      rect(g, -4, -9, 8, 5, 0xb9d9dc, 0.8);
      circle(g, 0, 14, 5, 0xffd48a, 0.5);
      circle(g, 0, 2, 4, 0xfff2c4, 0.9);
    } else if (type === 'lure') {
      circle(g, 0, 0, 8, 0xd8a74c, 0.95);
      circle(g, -2, -2, 3, 0xffe0a0, 0.7);
      line(g, 0, -8, 0, -20, 1.5, 0xa9b9b5);
      line(g, -5, -20, 5, -20, 1.2, 0xa9b9b5);
      line(g, 8, 0, 16, 7, 1.5, 0x8f9c98);
    } else {
      const small = type === 'berries' || type === 'mushroom' || type === 'herb' || type === 'yeast';
      drawItemIcon(g, type, 0, 0, small ? 1.08 : (type === 'honey' || type === 'water' || type === 'spring' ? 1.42 : 1.45));
    }
    this.art.addChild(g);
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
    const colors = {
      honey: 0xffca7a, hop: 0xd7e0a0, water: 0xaee8f2,
      berries: 0xe2a4b0, mushroom: 0xe6d8bd, herb: 0xc1d7a0,
      yeast: 0xf0dca8, spring: 0xd6f5f8, flashlight: 0xaee8f2, lure: 0xffd88a,
    };
    const g = this.ring;
    g.clear();
    g.lineStyle(1.2, colors[this.type] || 0xffca7a, 0.35);
    g.drawEllipse(0, 14, 22, 5);
    g.lineStyle(1, colors[this.type] || 0xffca7a, 0.14);
    g.drawEllipse(0, 14, 32, 8);
  }

  update(dt, t) {
    if (this.collected) {
      this.collectT += dt;
      const k = U.easeOutCubic(Math.min(1, this.collectT / 0.35));
      this.container.scale.set(1, 1);
      this.container.alpha = 1 - k;
      this.container.y = Math.round(this.baseY - k * 24);
      if (this.collectT > 0.4) this.container.visible = false;
      return;
    }
    const bob = Math.sin(t * 2.0 + this.phase) * 4.5;
    this.container.y = Math.round(this.baseY + bob);
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

/* ============================================================
   ВРАГИ: сборщики Борисыча и вороны-воришки
   ============================================================ */

class Enemy {
  constructor(game, kind, x, y, opts) {
    this.game = game;
    this.kind = kind;
    this.x = x;
    this.y = y === undefined ? 600 : y;
    this.opts = opts || {};
    this.maxHp = kind === 'thug' ? 2 : 1;
    this.hp = this.maxHp;
    this.speed = kind === 'thug' ? (48 + Math.random() * 16) : 120;
    this.state = kind === 'crow' ? 'perch' : 'walk';
    this.baseY = this.y;
    this.phase = Math.random() * TAU;
    this.dir = kind === 'thug' ? -1 : 1;
    this.stun = 0;
    this.attackCd = 0;
    this.dead = false;
    this.gone = false;
    this.fade = 1;
    this.stolen = false;
    this.stealTimer = 0;
    this.active = kind === 'thug';
    this.targetX = opts && opts.targetX !== undefined ? opts.targetX : 5520;
    this.flyTimer = 0;

    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = this.y;
    this.art = new PIXI.Container();
    this.container.addChild(this.art);
    this.pixelMode = GRAPHICS_MODE === 'pixel';
    if (kind === 'thug') this.buildThug();
    else this.buildCrow();
    if (this.pixelMode) {
      this.art.visible = false;
      if (kind === 'thug') {
        const p = buildPixelCharacter('thug');
        this.pixelSprite = p.sprite;
        this.container.addChild(p.root);
      } else {
        this.pixelSprite = PixelArt.sprite(PixelArt.crowTex(), 0, -20, 2, 0.5, 0.5);
        this.container.addChild(this.pixelSprite);
      }
    }

    this.hpBar = new PIXI.Graphics();
    this.hpBar.y = -(kind === 'thug' ? 62 : 44);
    this.container.addChild(this.hpBar);
    this.drawHp();
  }

  buildThug() {
    const g = new PIXI.Graphics();
    const body = new PIXI.Graphics();
    const legL = new PIXI.Graphics();
    const legR = new PIXI.Graphics();
    // ноги
    rect(legL, -8, -22, 6, 22, 0x24262b);
    rect(legL, -10, -3, 10, 4, 0x141519);
    rect(legR, 3, -22, 6, 22, 0x2a2c31);
    rect(legR, 2, -3, 10, 4, 0x141519);
    // пальто
    poly(body, [[-13, -51], [-15, -25], [-11, -17], [12, -17], [15, -25], [13, -51], [7, -55], [-7, -55]], 0x30343d);
    poly(body, [[-13, -50], [-6, -53], [-5, -19], [-12, -20]], 0x3b404a);
    poly(body, [[13, -50], [6, -53], [5, -19], [12, -20]], 0x242830);
    // шарф
    poly(body, [[-10, -56], [10, -56], [9, -50], [-9, -50]], 0x8e3f36);
    // голова
    circle(body, 0, -63, 8.5, 0xc99670);
    circle(body, 3, -63, 3.5, 0xb07a56, 0.4);
    // глаза
    circle(body, -3, -64, 1.2, 0x1d1e22);
    circle(body, 3, -64, 1.2, 0x1d1e22);
    // злая ухмылка
    line(body, -3, -58, 3, -58, 1.3, 0x6b3f35);
    // кепка
    ellipse(body, 0, -70, 11, 4, 0x2b2d31);
    poly(body, [[-8, -70], [-6, -76], [6, -76], [9, -70]], 0x35383c);
    rect(body, 1, -71, 11, 3, 0x282a2f);
    // мешок
    poly(body, [[9, -42], [17, -46], [22, -34], [13, -28]], 0x65563e);
    line(body, 12, -48, 17, -42, 1.5, 0x3f3425);
    // руки
    rect(body, -17, -47, 5, 19, 0x2b2f37);
    rect(body, 12, -47, 5, 19, 0x30343d);
    circle(body, -14.5, -28, 3.2, 0xc99670);
    circle(body, 14.5, -28, 3.2, 0xc99670);
    this.art.addChild(legL, legR, body);
    this.legL = legL; this.legR = legR; this.body = body;
    // тень
    const sh = new PIXI.Graphics();
    ellipse(sh, 0, 0, 19, 6, 0x04070b, 0.4);
    this.container.addChildAt(sh, 0);
  }

  buildCrow() {
    const g = new PIXI.Graphics();
    this.wingL = new PIXI.Graphics();
    this.wingR = new PIXI.Graphics();
    g.beginFill(0x0b0e13);
    g.drawEllipse(0, 0, 10, 6); g.endFill();
    circle(g, 9, -4, 5, 0x0b0e13);
    poly(g, [[13, -3], [20, -1], [13, 2]], 0x2e2922);
    circle(g, 10, -5, 1.2, 0xd8b36a, 0.9);
    this.wingL.beginFill(0x090c11);
    this.wingL.drawEllipse(-8, -4, 14, 5);
    this.wingL.endFill();
    this.wingR.beginFill(0x090c11);
    this.wingR.drawEllipse(8, -28, 6, 13);
    this.wingR.endFill();
    this.art.addChild(this.wingL, g, this.wingR);
    this.bodyG = g;
    const sh = new PIXI.Graphics();
    ellipse(sh, 0, 0, 12, 3, 0x04070b, 0.18);
    this.container.addChildAt(sh, 0);
  }

  drawHp() {
    const g = this.hpBar;
    g.clear();
    if (this.kind !== 'thug' || this.dead) return;
    for (let i = 0; i < this.maxHp; i++) {
      g.beginFill(i < this.hp ? 0xc85b4f : 0x373b42, 0.9);
      g.drawRoundedRect(-13 + i * 14, 0, 10, 4, 2);
      g.endFill();
    }
  }

  update(dt, t) {
    if (this.gone) return;
    if (this.dead) {
      this.fade -= dt * 2.5;
      this.container.alpha = Math.max(0, this.fade);
      if (this.fade <= 0) this.gone = true;
      return;
    }
    this.phase += dt;
    this.stun = Math.max(0, this.stun - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    const p = this.game.player;

    if (this.pixelMode && this.pixelSprite && this.kind === 'crow') {
      this.pixelSprite.rotation = 0;
      this.pixelSprite.y = Math.round(-20 + Math.sin(t * 4 + this.phase) * 2);
    }

    if (this.kind === 'crow') {
      if (this.state === 'perch') {
        this.container.y = this.baseY + Math.sin(t * 2 + this.phase) * 2;
        if (p && Math.abs(p.cx - this.x) < 165) {
          this.state = 'swoop';
          this.active = true;
          this.game.audio.sfx('jump');
        }
      } else if (this.state === 'swoop') {
        if (!p) return;
        const dx = p.cx - this.container.x;
        const dy = (p.cy - 20) - this.container.y;
        const d = Math.hypot(dx, dy) || 1;
        this.container.x += dx / d * 140 * dt;
        this.container.y += dy / d * 120 * dt;
        this.wingL.rotation = Math.sin(t * 18) * 0.9;
        this.wingR.rotation = -Math.sin(t * 18) * 0.9;
        if (Math.hypot(dx, dy) < 30 && !this.stolen) {
          this.stolen = true;
          this.game.onCrowSteal(this);
          this.state = 'flee';
          this.game.audio.sfx('squeak');
          this.game.world.spawnBurst(this.container.x, this.container.y, 0x9fb6c4, 10);
        }
      } else if (this.state === 'flee') {
        this.container.x += 90 * dt;
        this.container.y -= 65 * dt;
        this.fade -= dt * 0.7;
        this.container.alpha = Math.max(0, this.fade);
        this.wingL.rotation = Math.sin(t * 16) * 0.7;
        this.wingR.rotation = -Math.sin(t * 16) * 0.7;
        if (this.fade <= 0) this.gone = true;
      }
      return;
    }

    // сборщик
    if (!this.active) return;
    if (this.stealTimer > 0) {
      this.stealTimer -= dt;
      this.container.x += this.dir * 110 * dt;
      this.container.alpha = Math.max(0, this.stealTimer / 1.0);
      this.container.y = this.baseY;
      if (this.stealTimer <= 0) this.gone = true;
      return;
    }

    const target = this.targetX;
    const dToTarget = target - this.container.x;
    this.dir = dToTarget > 0 ? 1 : -1;
    this.container.scale.x = this.dir;
    const playerNear = p && Math.abs(p.cx - this.container.x) < 62 && Math.abs(p.feet - this.baseY) < 70;
    if (playerNear && this.stun <= 0) {
      if (this.attackCd <= 0) {
        this.attackCd = 1.35;
        p.takeDamage(1, this.container.x);
        this.game.audio.sfx('thud');
      }
      this.container.x += Math.sin(t * 12) * 0.4;
    } else if (this.stun > 0) {
      this.container.x += this.dir * 20 * dt;
    } else {
      const step = this.speed * dt;
      if (Math.abs(dToTarget) > 18) {
        this.container.x += Math.sign(dToTarget) * Math.min(step, Math.abs(dToTarget));
        this.legL.rotation = Math.sin(t * 10 + this.phase) * 0.5;
        this.legR.rotation = -Math.sin(t * 10 + this.phase) * 0.5;
        this.body.y = Math.abs(Math.sin(t * 10 + this.phase)) * -1.5;
      } else {
        // добрался до чана — крадёт и убегает
        this.game.onThugSteal(this);
        this.stealTimer = 1.1;
        this.dir = -this.dir;
      }
    }
    this.container.y = this.baseY;
  }

  hit(dmg, dir) {
    if (this.dead || this.gone) return false;
    this.hp -= dmg;
    this.stun = 0.5;
    this.dir = -dir;
    this.container.x += dir * 22;
    this.game.world.spawnBurst(this.container.x, this.container.y - 35, 0xffd58a, 8);
    this.game.audio.sfx('hit');
    // вспышка
    this.container.alpha = 0.5;
    setTimeout(() => { if (this.container) this.container.alpha = 1; }, 90);
    this.drawHp();
    if (this.hp <= 0) {
      this.dead = true;
      this.active = false;
      this.game.onEnemyDefeated(this);
    }
    return true;
  }
}

