'use strict';

/* ============================================================
   ИГРА: состояния, камера, физика, сюжет, финал
   ============================================================ */

const INTRO_PAGES = [
  'Ночь опустилась на Медведево. В доме дяди Вити пахло пылью, старым деревом и чем-то ещё — чем-то, что он давно запретил себе вспоминать.',
  'На двери висела записка: «47 000. Три дня. — Борисыч». Рядом лежала отцовская тетрадь. Медовуха. Пиво. Надежда.',
  'Витя не пил три года. Но варить — это другое. Варить — значит создавать, а не забываться.',
  '«Ну что ж, — сказал он себе. — Значит, сварим».',
];

const ENDING_PAGES = [
  'Через неделю Витя отдал Борисычу первые деньги. Не все сорок семь тысяч — но впервые за долгое время это были настоящие деньги, заработанные своим трудом.',
  'Медовуха разошлась по деревне за три дня. Потом за неделю. Потом её начали спрашивать из соседнего села.',
  'Витя так и не выпил ни капли. Ему больше нравилось смотреть, как пьют другие. И как с двери исчезает записка.',
  'На двери больше не было записки. Только вывеска: «Тихий берег». Пивоварня дяди Вити. Глава первая.',
];

class Game {
  constructor(app) {
    this.app = app;
    this.time = 0;
    this.acc = 0;
    this.last = 0;
    this.state = 'title';
    this.audio = new AudioEngine();
    this.input = new Input();

    this.root = new PIXI.Container();
    app.stage.addChild(this.root);

    this.inventory = this.freshInventory();
    this.flags = this.freshFlags();
    this.checkpoint = { x: 220, y: 600 };
    this.camera = {
      x: 0, y: 90, shakeX: 0, shakeY: 0,
      shakeTime: 0, shakeDur: 1, shakeMag: 0,
    };
    this.cameraFocus = { x: 320, y: 600 };
    this.currentInteraction = null;
    this.respawning = false;
    this.activeNpc = null;
    this.brewTimer = 0;
    this.brewStage = 0;
    this._lastMuteToast = 0;
    this.frozen = false;
    this.starting = false;

    this.worldHolder = new PIXI.Container();
    this.root.addChild(this.worldHolder);

    this.newWorld();

    this.ui = new UI(this);
    this.root.addChild(this.ui.root);

    this.player.locked = true;
    this.ui.showTitle();
    this.ui.setFade(0);
    this.ui.setObjective('Собрать ингредиенты: хмель, мёд и вода · 0/9');

    this.updateCamera(0.2);
    this.world.update(0, 0, this.camera);
  }

  freshInventory() {
    return {
      hop: 0, honey: 0, water: 0,
      total() { return this.hop + this.honey + this.water; },
    };
  }

  freshFlags() {
    return {
      borisIntro: false,
      finalTalk: false,
      orchard: false,
      river: false,
      grove: false,
      brewery: false,
    };
  }

  newWorld() {
    if (this.world) {
      try {
        this.worldHolder.removeChild(this.world.root);
        this.world.root.destroy({ children: true, texture: false, baseTexture: false });
      } catch (e) { /* старый мир уходит в туман */ }
    }
    this.world = new World(this);
    this.worldHolder.addChild(this.world.root);

    this.player = new Player(this, 220, 600);
    this.world.entityLayer.addChild(this.player.container);
    this.player.locked = true;
    this.world.activeSolids = this.world.staticSolids.concat(this.world.movingPlatforms);
    this.acc = 0;
  }

  resetRun() {
    this.inventory = this.freshInventory();
    this.flags = this.freshFlags();
    this.checkpoint = { x: 220, y: 600 };
    this.cameraFocus = { x: 320, y: 600 };
    this.camera.x = 0;
    this.camera.y = 90;
    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
    this.camera.shakeTime = 0;
    this.player.respawn(220, 600);
    this.player.locked = true;
    this.player.dir = 1;
    this.respawning = false;
    this.activeNpc = null;
    this.brewTimer = 0;
    this.brewStage = 0;
    this.acc = 0;
    this.ui.reset();
    this.ui.hud.visible = false;
    this.ui.updateHUD();
    this.ui.setObjective('Собрать ингредиенты: хмель, мёд и вода · 0/9');
  }

  layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.app.renderer.resize(w, h);
    if (this.app.view.style) {
      this.app.view.style.width = w + 'px';
      this.app.view.style.height = h + 'px';
    }
    const scale = Math.min(w / GAME_W, h / GAME_H);
    this.root.scale.set(scale);
    this.root.x = (w - GAME_W * scale) / 2;
    this.root.y = (h - GAME_H * scale) / 2;
  }

  startLoop() {
    this.last = performance.now();
    const tick = (now) => {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0.0001, (now - this.last) / 1000));
      this.last = now;
      if (document.hidden) return;
      if (!this.frozen) this.update(dt);
      this.app.render();
    };
    requestAnimationFrame(tick);
  }

  /* ================= СОСТОЯНИЯ ================= */

  startNewGame() {
    if (this.starting) return;
    this.starting = true;
    this.audio.init();
    this.audio.resume();
    this.audio.startMusic();
    this.audio.setMode('night');

    const begin = () => {
      this.newWorld();
      this.resetRun();
      this.state = 'story';
      this.cameraFocus = { x: 320, y: 600 };
      this.player.locked = true;
      this.ui.setFade(1);
      this.ui.showNarration(INTRO_PAGES, {
        label: 'МЕДВЕДЕВО · НОЧЬ ПЕРВАЯ',
        onDone: () => this.beginPlay(),
      });
      this.ui.fadeIn(0.9);
      this.audio.playAmbience('crickets', 0.15, 3);
      this.starting = false;
    };

    this.ui.fadeOut(0.5, begin);
  }

  beginPlay() {
    this.state = 'play';
    this.ui.setFade(0.95);
    this.ui.fadeIn(0.9);
    this.ui.showHUD(true);
    this.ui.updateHUD();
    this.ui.setObjective('Собрать ингредиенты: хмель, мёд и вода · 0/9');
    this.player.locked = false;
    this.cameraFocus = null;
    this.ui.toast('Три дня до срока', 'долг — 47 000 ₽', 0xd98f5a);
    this.audio.setMode('night');
  }

  backToTitle() {
    this.ui.fadeOut(0.45, () => {
      this.newWorld();
      this.resetRun();
      this.state = 'title';
      this.cameraFocus = { x: 320, y: 600 };
      this.ui.reset();
      this.ui.showTitle();
      this.ui.setFade(1);
      this.ui.fadeIn(0.8);
      this.audio.setMode('night');
    });
  }

  restart() {
    this.startNewGame();
  }

  togglePause(v) {
    if (v && this.state === 'play' && !this.ui.dialogueActive && !this.respawning) {
      this.state = 'paused';
      this.player.locked = true;
      this.ui.setPrompt(null);
      this.ui.showPause(true);
    } else if (!v && this.state === 'paused') {
      this.state = 'play';
      this.ui.showPause(false);
      this.player.locked = false;
      this.updateHUD();
    }
  }

  toggleMute() {
    this.audio.init();
    const muted = this.audio.toggleMute();
    this.ui.updateHUD();
    const now = this.time;
    if (now - this._lastMuteToast > 0.6) {
      this._lastMuteToast = now;
      this.ui.toast(muted ? 'Звук выключен' : 'Звук включён', muted ? 'тишина — тоже музыка' : 'слышно, как течёт река', 0x9fb6b8);
    }
  }

  toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    } catch (e) {}
  }

  isPlayerLocked() {
    return this.state !== 'play' || this.ui.dialogueActive || this.player.locked || this.respawning;
  }

  shake(mag, dur) {
    this.camera.shakeMag = Math.max(this.camera.shakeMag, mag);
    this.camera.shakeDur = Math.max(this.camera.shakeDur, dur);
    this.camera.shakeTime = Math.max(this.camera.shakeTime, dur);
  }

  /* ================= ВВОД ================= */

  handleGlobalInput() {
    const input = this.input;

    if (input.wasPressed('KeyF')) this.toggleFullscreen();
    if (input.wasPressed('KeyM')) this.toggleMute();

    if (this.ui.helpOverlay.visible) {
      if (input.wasPressed('Escape', 'KeyH', 'Enter')) {
        this.ui.helpOverlay.visible = false;
        this.audio.sfx('ui');
      }
      return;
    }

    if (this.state === 'title') {
      if (input.wasPressed('Space', 'Enter', 'NumpadEnter')) {
        this.startNewGame();
      } else if (input.wasPressed('KeyH')) {
        this.ui.openHelp();
      }
      return;
    }

    if (this.ui.narrationActive) {
      if (input.wasPressed('KeyE', 'Space', 'Enter', 'NumpadEnter')) this.ui.advanceNarration();
      return;
    }

    if (this.ui.dialogueActive) {
      if (input.wasPressed('KeyE', 'Space', 'Enter', 'NumpadEnter')) this.ui.advanceDialogue();
      return;
    }

    if (this.state === 'play') {
      if (input.wasPressed('Escape', 'KeyP')) {
        this.togglePause(true);
        return;
      }
      if (input.wasPressed('KeyR')) {
        this.respawnAtCheckpoint(true);
        return;
      }
      if (input.wasPressed('KeyE', 'Enter', 'NumpadEnter')) {
        this.useInteraction(this.currentInteraction);
      }
    } else if (this.state === 'paused') {
      if (input.wasPressed('Escape', 'KeyP')) this.togglePause(false);
    }
  }

  /* ================= ОБНОВЛЕНИЕ ================= */

  update(dt) {
    this.time += dt;
    this.handleGlobalInput();

    if (this.state === 'play') {
      this.updatePlay(dt);
    } else if (this.state === 'brew') {
      this.updateBrew(dt);
    } else {
      this.updateIdle(dt);
    }

    this.updateCamera(dt);
    this.world.update(dt, this.time, this.camera);
    this.ui.update(dt);
    this.input.clear();
  }

  updateIdle(dt) {
    this.player.locked = true;
    this.player.update(dt, this.time);
    if (this.state === 'title' || this.state === 'story') {
      this.cameraFocus = { x: 320, y: 600 };
    } else if (this.state === 'ending') {
      this.cameraFocus = { x: 5510, y: 600 };
      this.world.brewIntensity = 0.6;
    }
  }

  updatePlay(dt) {
    if (this.respawning) {
      this.player.locked = true;
      return;
    }

    this.player.locked = false;

    // движущаяся платформа несёт героя
    if (this.player.riding && this.player.onGround) {
      this.player.x += this.player.riding.dx || 0;
      this.player.y += this.player.riding.dy || 0;
    }

    this.acc += dt;
    let steps = 0;
    while (this.acc >= 1 / 120 && steps < 7) {
      this.player.update(1 / 120, this.time);
      this.acc -= 1 / 120;
      steps++;
    }

    // вода / падение
    if (this.player.cx > 1885 && this.player.cx < 2870 && this.player.feet > 706) {
      this.onPlayerFall(true);
      return;
    }
    if (this.player.y > 850) {
      this.onPlayerFall(false);
      return;
    }

    // фонари
    this.world.checkCheckpoint(this.player);

    // ингредиенты
    const item = this.world.collectNear(this.player);
    if (item) this.onCollect(item);

    // автоматические сцены
    if (!this.ui.dialogueActive && !this.flags.borisIntro && this.world.borisIntro && !this.world.borisIntro.gone) {
      if (Math.abs(this.player.cx - this.world.borisIntro.x) < 155) {
        this.startNpcDialogue(this.world.borisIntro);
      }
    }

    // маленькие открытия мест
    if (!this.flags.orchard && this.player.cx > 1015) {
      this.flags.orchard = true;
      this.ui.toast('Яблоневый сад', 'мёд прячется на верхних полках', 0xd3b46e);
    }
    if (!this.flags.river && this.player.cx > 1800) {
      this.flags.river = true;
      this.ui.toast('Переправа', 'прыгай по плотам — они ещё держат', 0x9fc8d6);
    }
    if (!this.flags.grove && this.player.cx > 2960) {
      this.flags.grove = true;
      this.ui.toast('Хмелевая роща', 'высоко, колючо, вкусно', 0xb9c97a);
    }
    if (!this.flags.brewery && this.player.cx > 4370) {
      this.flags.brewery = true;
      this.ui.toast('Пивоварня «Тихий берег»', 'здесь варят. здесь не пьют', 0xffca7a);
    }

    // подсказки взаимодействия
    const inter = this.world.nearestInteraction(this.player);
    this.currentInteraction = inter;
    if (inter && !this.ui.dialogueActive && !this.respawning) {
      const ox = inter.type === 'vat' ? 0 : 0;
      const oy = inter.type === 'vat' ? -162 : -112;
      this.ui.setPrompt(
        inter.prompt,
        inter.x - this.camera.x + this.camera.shakeX + ox,
        inter.y - this.camera.y + this.camera.shakeY + oy
      );
    } else {
      this.ui.setPrompt(null);
    }
  }

  updateBrew(dt) {
    this.brewTimer += dt;
    const target = 5435;
    const p = this.player;
    const dx = target - p.cx;
    if (Math.abs(dx) > 4) {
      const dir = Math.sign(dx);
      p.dir = dir;
      p.vx = dir * 55;
      p.x += dir * 55 * dt;
      p.phase += dt * 7;
      p.onGround = true;
      p.vy = 0;
      if (Math.random() < 0.3) this.world.spawnDust(p.cx - dir * 6, p.feet, -dir, 1);
    } else {
      p.vx = U.damp(p.vx, 0, 8, dt);
      p.onGround = true;
      p.vy = 0;
    }
    p.animate(dt, this.time);

    if (this.brewStage === 0 && this.brewTimer > 1.1) {
      this.brewStage = 1;
      this.world.brewIntensity = 1;
      this.shake(2.4, 1.0);
      this.audio.sfx('checkpoint');
      this.ui.toast('Чан закипает', 'мёд, хмель и дым', 0xffb45e);
    }
    if (this.brewStage === 1 && this.brewTimer > 3.4) {
      this.brewStage = 2;
      this.world.spawnBurst(5520, 540, 0xffc36b, 26);
      this.audio.sfx('collectHoney');
      this.ui.toast('Первый запах', 'так пахло детство', 0xffd89a);
      this.shake(1.2, 0.5);
    }
    if (this.brewStage === 2 && this.brewTimer > 5.4) {
      this.brewStage = 3;
      this.audio.sfx('ending');
      this.ui.fadeOut(2.0, () => this.showEnding());
    }
  }

  showEnding() {
    this.state = 'ending';
    this.world.brewIntensity = 0.7;
    this.audio.setMode('ending');
    this.ui.showHUD(false);
    this.ui.setFade(1);
    this.ui.showNarration(ENDING_PAGES, {
      label: 'ГЛАВА ПЕРВАЯ · ТИХИЙ БЕРЕГ',
      warm: true,
      onDone: () => {
        this.ui.setFade(0.85);
        this.ui.showCredits();
        this.ui.fadeIn(1.4);
      },
    });
    this.ui.fadeIn(1.4);
  }

  /* ================= КАМЕРА ================= */

  updateCamera(dt) {
    let fx, fy;
    if (this.state === 'title' || this.state === 'story') {
      fx = 320 + Math.sin(this.time * 0.14) * 10;
      fy = 600;
    } else if (this.state === 'brew' || this.state === 'ending') {
      fx = 5510;
      fy = 600;
    } else if (this.cameraFocus) {
      fx = this.cameraFocus.x;
      fy = this.cameraFocus.y;
    } else {
      fx = this.player.cx + this.player.dir * 26;
      fy = this.player.feet;
    }

    const targetX = U.clamp(fx - GAME_W * 0.44, 0, this.world.width - GAME_W);
    const targetY = U.clamp(fy - 500, 0, 170);
    this.camera.x = U.damp(this.camera.x, targetX, 4.4, dt);
    this.camera.y = U.damp(this.camera.y, targetY, 4.4, dt);

    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= dt;
      const k = Math.max(0, this.camera.shakeTime / this.camera.shakeDur);
      const amp = this.camera.shakeMag * k;
      this.camera.shakeX = (Math.random() * 2 - 1) * amp;
      this.camera.shakeY = (Math.random() * 2 - 1) * amp * 0.7;
    } else {
      this.camera.shakeX = 0;
      this.camera.shakeY = 0;
      this.camera.shakeMag = 0;
    }
  }

  snapCamera() {
    const fx = this.player.cx + this.player.dir * 26;
    this.camera.x = U.clamp(fx - GAME_W * 0.44, 0, this.world.width - GAME_W);
    this.camera.y = U.clamp(this.player.feet - 500, 0, 170);
  }

  /* ================= ВЗАИМОДЕЙСТВИЯ ================= */

  startNpcDialogue(npc) {
    if (!npc || npc.gone) return;
    this.activeNpc = npc;
    this.player.locked = true;
    this.player.vx = 0;
    this.player.riding = null;
    // встаём рядом, чтобы не сливаться с собеседником
    const side = this.player.cx <= npc.x ? -1 : 1;
    const desiredCenter = npc.x + side * 70;
    this.player.x = U.clamp(desiredCenter - this.player.w / 2, 0, this.world.width - this.player.w);
    this.player.dir = -side;
    npc.facing = side;
    npc.container.scale.x = side;
    this.cameraFocus = { x: (this.player.cx + npc.x) / 2, y: 600 };
    this.audio.sfx('ui');
    const lines = npc.getDialogue(this);
    this.ui.showDialogue(lines, () => this.endNpcDialogue(npc));
  }

  endNpcDialogue(npc) {
    this.player.locked = false;
    this.activeNpc = null;
    this.cameraFocus = null;

    if (npc === this.world.borisIntro && !this.flags.borisIntro) {
      this.flags.borisIntro = true;
      npc.walkTo(1190, 78);
      this.setObjectiveForProgress();
      this.ui.toast('Три дня', 'долг — 47 000 ₽', 0xd98f5a);
    }
    if (npc === this.world.borisFinal && this.inventory.total() >= 9 && !this.flags.finalTalk) {
      this.flags.finalTalk = true;
      this.setObjectiveForProgress();
      this.ui.toast('Борисыч ждёт у чана', 'пора варить', 0xffca7a);
    }
  }

  showLine(text, speaker) {
    this.player.locked = true;
    this.player.vx = 0;
    this.ui.showDialogue([{ speaker: speaker || 'Витя', text }], () => {
      this.player.locked = false;
      this.cameraFocus = null;
    });
  }

  useInteraction(inter) {
    if (!inter || this.ui.dialogueActive) return;
    if (inter.type === 'npc') {
      this.startNpcDialogue(inter.npc);
    } else if (inter.type === 'sign') {
      this.player.locked = true;
      this.player.vx = 0;
      this.cameraFocus = null;
      this.ui.showDialogue(inter.sign.lines, () => { this.player.locked = false; });
    } else if (inter.type === 'vat') {
      this.useVat();
    }
  }

  useVat() {
    if (this.inventory.total() < 9) {
      this.showLine('Сварить бы... да не из чего. Нужны хмель, мёд и вода.');
      return;
    }
    if (!this.flags.finalTalk) {
      this.showLine('Сначала поговорю с Борисычем. Он ждёт у пивоварни.');
      return;
    }
    this.startBrew();
  }

  setObjectiveForProgress() {
    const total = this.inventory.total();
    if (total < 9) {
      this.ui.setObjective(`Собрать ингредиенты: хмель, мёд и вода · ${total}/9`);
    } else if (!this.flags.finalTalk) {
      this.ui.setObjective('Вернуться к пивоварне и поговорить с Борисычем');
    } else {
      this.ui.setObjective('Сварить медовуху у медного чана (E)');
    }
  }

  updateHUD() {
    this.ui.updateHUD();
  }

  /* ================= ПРЕДМЕТЫ / СМЕРТЬ ================= */

  onCollect(item) {
    this.inventory[item.type]++;
    const meta = {
      honey: { name: 'Мёд', color: 0xffb35c, sfx: 'collectHoney' },
      hop: { name: 'Хмель', color: 0xc0cf82, sfx: 'collectHop' },
      water: { name: 'Вода', color: 0x9cdcea, sfx: 'collectWater' },
    }[item.type];
    this.world.spawnBurst(item.baseX, item.baseY, meta.color, 18);
    this.audio.sfx(meta.sfx);
    const count = this.inventory[item.type];
    this.ui.updateHUD();
    this.ui.toast(`${meta.name} +1`, `собрано ${count} из 3`, meta.color);
    this.setObjectiveForProgress();

    if (this.inventory.total() === 9) {
      this.audio.sfx('checkpoint');
      this.ui.toast('Всё собрано', 'пора возвращаться к пивоварне', 0xffd38a);
      this.shake(0.8, 0.3);
    }
  }

  setCheckpoint(x, y) {
    this.checkpoint = { x, y };
  }

  onPlayerFall(water) {
    if (this.respawning) return;
    this.respawning = true;
    this.player.locked = true;
    this.player.vx = 0;
    this.ui.setPrompt(null);
    if (water) {
      this.world.spawnSplash(this.player.cx, 700);
      this.audio.sfx('splash');
      this.ui.toast('Витя промок до нитки', 'вернулся к последнему фонарю', 0x9cdcea);
    } else {
      this.ui.toast('Темнота', 'вернулся к последнему фонарю', 0x9fb6b8);
    }
    this.ui.fadeOut(0.4, () => {
      this.player.respawn(this.checkpoint.x, this.checkpoint.y);
      this.snapCamera();
      this.acc = 0;
      this.ui.setFade(0.9);
      this.ui.fadeIn(0.7, () => {
        this.respawning = false;
        this.player.locked = false;
      });
    });
  }

  respawnAtCheckpoint(manual) {
    if (this.state !== 'play' || this.respawning) return;
    this.respawning = true;
    this.player.locked = true;
    this.player.vx = 0;
    this.ui.setPrompt(null);
    if (manual) this.ui.toast('Возвращение', 'к последнему фонарю', 0xffca7a);
    this.ui.fadeOut(0.35, () => {
      this.player.respawn(this.checkpoint.x, this.checkpoint.y);
      this.snapCamera();
      this.acc = 0;
      this.ui.setFade(0.9);
      this.ui.fadeIn(0.6, () => {
        this.respawning = false;
        this.player.locked = false;
      });
    });
  }

  /* ================= ФИНАЛ ================= */

  startBrew() {
    this.state = 'brew';
    this.brewTimer = 0;
    this.brewStage = 0;
    this.player.locked = true;
    this.player.vx = 0;
    this.player.dir = 1;
    this.ui.showHUD(false);
    this.ui.setPrompt(null);
    this.cameraFocus = { x: 5510, y: 600 };
    this.world.startBrew();
    this.audio.sfx('brew');
    this.audio.setMode('ending');
    this.ui.toast('Медовуха', 'хмель · мёд · вода', 0xffc36b);
  }
}

/* ============================================================
   ЗАПУСК
   ============================================================ */

async function waitForFonts() {
  if (!document.fonts) return;
  const samples = [
    ["600 100px 'Cormorant Garamond'", 'Дядя Витя'],
    ["500 40px 'Cormorant Garamond'", 'тихий берег'],
    ["700 20px 'Alegreya Sans'", 'хмель мёд вода долг'],
    ["400 20px 'Alegreya Sans'", 'Борисыч Витя'],
    ["500 20px 'Alegreya Sans'", 'записка три дня'],
  ];
  try {
    await Promise.all(samples.map(([font, text]) => document.fonts.load(font, text)));
    await document.fonts.ready;
  } catch (e) { /* останутся системные шрифты */ }
}

(async function boot() {
  const bootEl = document.getElementById('boot');
  const statusEl = document.getElementById('bootStatus');
  try {
    if (statusEl) statusEl.textContent = 'зажигаем фонари…';
    await waitForFonts();
    buildTextures();

    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x04060c,
      antialias: true,
      transparent: false,
      resolution: 1,
    });
    app.ticker.stop();
    document.getElementById('game').appendChild(app.view);

    const game = new Game(app);
    window.__vitya = game;
    game.layout();
    window.addEventListener('resize', () => game.layout());
    document.addEventListener('fullscreenchange', () => setTimeout(() => game.layout(), 80));

    // отладочные сцены: ?debug=1&scene=play&x=1800
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === '1') {
      bootEl.style.transition = 'none';
      bootEl.style.display = 'none';
      const scene = params.get('scene') || 'play';
      const x = parseFloat(params.get('x') || '220');
      game.ui.hideTitle();
      game.ui.setFade(0);
      game.ui.dialog.visible = false;
      game.ui.narration.visible = false;
      game.state = 'play';
      game.cameraFocus = null;
      game.ui.showHUD(true);
      game.ui.updateHUD();
      game.player.locked = false;
      game.player.respawn(x, 600);
      game.snapCamera();
      if (params.get('all') === '1') {
        game.inventory.hop = 3;
        game.inventory.honey = 3;
        game.inventory.water = 3;
        game.ui.updateHUD();
        game.setObjectiveForProgress();
      }
      if (params.get('npc') === 'zina') {
        const npc = game.world.npcs.find(n => n.kind === 'zina');
        game.startNpcDialogue(npc);
      } else if (params.get('npc') === 'boris') {
        const npc = game.world.borisIntro;
        game.startNpcDialogue(npc);
      }
      if (scene === 'story') {
        game.state = 'story';
        game.cameraFocus = { x: 320, y: 600 };
        game.ui.showHUD(false);
        game.ui.showNarration(INTRO_PAGES, { label: 'МЕДВЕДЕВО · НОЧЬ ПЕРВАЯ', onDone: () => game.beginPlay() });
      } else if (scene === 'brew') {
        game.inventory.hop = 3;
        game.inventory.honey = 3;
        game.inventory.water = 3;
        game.flags.finalTalk = true;
        game.player.respawn(5550, 600);
        game.snapCamera();
        game.startBrew();
      } else if (scene === 'credits') {
        game.ui.setFade(0);
        game.ui.showCredits();
      } else if (scene === 'ending') {
        game.state = 'ending';
        game.inventory.hop = 3; game.inventory.honey = 3; game.inventory.water = 3;
        game.flags.finalTalk = true;
        game.player.respawn(5440, 600);
        game.snapCamera();
        game.ui.showHUD(false);
        game.ui.setFade(0);
        game.ui.showNarration(ENDING_PAGES, {
          label: 'ГЛАВА ПЕРВАЯ · ТИХИЙ БЕРЕГ',
          warm: true,
          onDone: () => { game.ui.setFade(0.85); game.ui.showCredits(); game.ui.fadeIn(1.4); },
        });
      } else if (scene === 'dialogue') {
        const npc = game.world.npcs.find(n => n.kind === 'zina');
        game.player.respawn(1450, 600);
        game.snapCamera();
        game.startNpcDialogue(npc);
      }
      const frames = parseInt(params.get('frames') || '150', 10);
      for (let i = 0; i < frames; i++) game.update(1 / 60);
      if (params.get('onlyvat') === '1') {
        game.worldHolder.visible = false;
        game.ui.root.visible = false;
        const bg = new PIXI.Graphics();
        bg.beginFill(0x101722); bg.drawRect(0, 0, GAME_W, GAME_H); bg.endFill();
        game.root.addChild(bg);
        const vatG = new PIXI.Graphics();
        drawKettle(vatG, 0, 0, 3);
        vatG.x = 640; vatG.y = 660;
        game.root.addChild(vatG);
      }
      if (params.get('freeze') === '1') game.frozen = true;
      game.app.render();
    }

    game.startLoop();

    if (statusEl) statusEl.textContent = 'готово';
    setTimeout(() => {
      bootEl.classList.add('hidden');
    }, 250);
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = 'Не удалось зажечь фонари: ' + (err && err.message ? err.message : err);
  }
})();
