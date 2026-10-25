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

    this.progress = this.freshProgress();
    this.inventory = this.freshInventory();
    this.flags = this.freshFlags();
    this.checkpoint = { x: 220, y: 600 };
    this.enemies = [];
    this.defense = null;
    this.playTime = 0;
    this.saveTimer = 0;
    this.lastAutoSave = 0;
    this.pendingDefense = 0;
    this._crowsDay = 0;
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
    this.pixelMode = GRAPHICS_MODE === 'pixel';
    this.pixelFilter = null;

    this.worldHolder = new PIXI.Container();
    this.root.addChild(this.worldHolder);

    this.newWorld();
    this.applyGraphicsMode();

    this.ui = new UI(this);
    this.root.addChild(this.ui.root);

    this.player.locked = true;
    this.ui.showTitle();
    this.ui.setFade(0);
    this.refreshObjective();
    this.ui.updateHUD();

    this.updateCamera(0.2);
    this.world.update(0, 0, this.camera);
  }

  freshInventory() {
    return {
      hop: 0, honey: 0, water: 0, berries: 0, mushroom: 0, herb: 0, yeast: 0, spring: 0,
      total() { return this.hop + this.honey + this.water; },
      baseReady() { return this.hop >= 3 && this.honey >= 3 && this.water >= 3; },
    };
  }

  freshProgress() {
    return {
      day: 1,
      stage: STAGES.INTRO,
      money: 0,
      debtPaid: 0,
      reputation: 20,
      health: 3,
      maxHealth: 3,
      bottles: [],
      recipes: { mead: true, beer: false, festival: false, stout: false },
      upgrades: { boots: false, kettle: false, lamp: false },
      seeds: 0,
      garden: [
        { stage: 0, watered: false },
        { stage: 0, watered: false },
        { stage: 0, watered: false },
      ],
      side: { garden: 'none', lure: 'none', flashlight: 'none', crows: 0 },
      gardenHarvested: 0,
      festivalLanterns: [],
      cityBrews: {},
      unlocked: { home: true, brewery: false, mill: false, village: false, dam: false },
      zones: {},
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
      broomTutorial: false,
      broomTutorialShown: false,
      festivalSeen: false,
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
    this.progress = this.freshProgress();
    this.inventory = this.freshInventory();
    this.flags = this.freshFlags();
    this.enemies = [];
    this.defense = null;
    this.playTime = 0;
    this.saveTimer = 0;
    this.pendingDefense = 0;
    this._crowsDay = 0;
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
    this.player.health = 3;
    this.player.maxHealth = 3;
    this.player.setUpgrades(this.progress.upgrades);
    this.respawning = false;
    this.activeNpc = null;
    this.brewTimer = 0;
    this.brewStage = 0;
    this.acc = 0;
    this.ui.reset();
    this.ui.hud.visible = false;
    this.ui.updateHUD();
    this.refreshObjective();
    this.world.setDay ? this.world.setDay(1, true) : null;
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
    if (this.pixelFilter) this.pixelFilter.setScreenSize(w, h, scale);
  }

  applyGraphicsMode() {
    this.pixelMode = GRAPHICS_MODE === 'pixel';
    // Пиксельный режим теперь рисуется отдельными спрайтами.
    // Глобальный фильтр не используем: он делает картинку грязной.
    this.pixelFilter = null;
    this.worldHolder.filters = null;
    this.worldHolder.filterArea = null;
  }

  toggleGraphicsMode() {
    // Пиксель — демо-режим. В адресе он живёт только пока пользователь
    // явно его выбрал; обычное открытие игры всегда даёт оригинал.
    const next = this.pixelMode ? 'classic' : 'pixel';
    this.saveGame();
    try {
      const url = new URL(location.href);
      if (next === 'pixel') url.searchParams.set('graphics', 'pixel');
      else url.searchParams.delete('graphics');
      location.href = url.toString();
    } catch (e) {
      location.reload();
    }
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
    this.refreshObjective();
    this.player.locked = false;
    this.cameraFocus = null;
    this.ui.toast('Три дня до срока', 'долг — 47 000 ₽', 0xd98f5a);
    this.audio.setMode('night');
    this.saveGame();
  }

  refreshObjective() {
    if (!this.ui || !this.progress) return;
    const s = this.progress.stage;
    const inv = this.inventory;
    const p = this.progress;
    let text = STAGE_OBJECTIVES[s] || '';
    if (s === STAGES.GATHER1) {
      text = `Собрать для медовухи: хмель ${Math.min(inv.hop, 3)}/3 · мёд ${Math.min(inv.honey, 3)}/3 · вода ${Math.min(inv.water, 3)}/3`;
    } else if (s === STAGES.PAY1) {
      text = `Продать бутылки и отдать Борисычу ${formatMoney(PAYMENTS[1])} ₽ · в кармане ${formatMoney(p.money)} ₽`;
    } else if (s === STAGES.BREW2) {
      text = `Для пива: хмель ${Math.min(inv.hop, 2)}/2 · мёд ${Math.min(inv.honey, 1)}/1 · вода ${Math.min(inv.water, 2)}/2 · дрожжи ${Math.min(inv.yeast, 1)}/1`;
    } else if (s === STAGES.PAY2) {
      text = `Отдать Борисычу ${formatMoney(PAYMENTS[2])} ₽ · в кармане ${formatMoney(p.money)} ₽`;
    } else if (s === STAGES.VILLAGE || s === STAGES.BREW3) {
      text = `Для «Зимнего берега»: хмель ${Math.min(inv.hop, 2)}/2 · мёд ${Math.min(inv.honey, 2)}/2 · вода ${Math.min(inv.water, 2)}/2 · ягоды ${Math.min(inv.berries, 2)}/2 · травы ${Math.min(inv.herb, 1)}/1`;
    } else if (s === STAGES.JUDGE) {
      text = 'Отнести медовуху на судейский стол у сцены';
    } else if (s === STAGES.CITY_ORDER) {
      text = 'Поговорить с Аркадием у правого прилавка';
    } else if (s === STAGES.CITY_PREP) {
      const b = p.cityBrews || {};
      text = `Три свежие бочки для города: медовуха ${b.mead ? '✓' : '—'} · пиво ${b.beer ? '✓' : '—'} · «Зимний берег» ${b.festival ? '✓' : '—'}`;
    } else if (s === STAGES.CITY_DAM) {
      if ((inv.spring || 0) >= 2 && (inv.mushroom || 0) >= 2) {
        text = 'Сварить «Плотинный стаут» у чана';
      } else {
        text = `Старая плотина: родник ${Math.min(inv.spring || 0, 2)}/2 · грибы ${Math.min(inv.mushroom || 0, 2)}/2`;
      }
    } else if (s === STAGES.CITY_DELIVER) {
      text = 'Отнести стаут Аркадию на площадь';
    } else if (s === STAGES.SLEEP1 || s === STAGES.SLEEP2) {
      text = 'Вернуться домой, в свою кровать, и лечь спать';
    }
    if (p.day >= 3 && s !== STAGES.FINALE && s !== STAGES.DONE) {
      text += ` · фонарики ${(p.festivalLanterns || []).length}/5`;
    }
    this.objectiveText = text;
    this.ui.setObjective(text);
    this.ui.updateHUD();
  }

  setStage(stage, toastTitle, toastSub, color) {
    if (this.progress.stage === stage) return;
    this.progress.stage = stage;
    this.refreshObjective();
    if (toastTitle) this.ui.toast(toastTitle, toastSub || '', color || 0xffca7a);
    this.saveGame();
  }

  countBottles() {
    return (this.progress.bottles || []).reduce((sum, b) => sum + b.count, 0);
  }

  batchValue(batch, spotMult) {
    const r = RECIPES[batch.recipe];
    const qualityMult = 0.7 + (batch.quality / 100) * 0.8;
    const repMult = 1 + U.clamp(((this.progress.reputation || 20) - 20) / 200, -0.1, 0.4);
    return Math.floor(r.basePrice * batch.count * qualityMult * repMult * (spotMult || 1));
  }

  canBrew(key) {
    const r = RECIPES[key];
    if (!r || !this.progress.recipes[key]) return false;
    return Object.entries(r.ingredients).every(([k, v]) => (this.inventory[k] || 0) >= v);
  }

  consumeIngredients(key) {
    const r = RECIPES[key];
    for (const [k, v] of Object.entries(r.ingredients)) this.inventory[k] -= v;
    this.ui.updateHUD();
  }

  addBottleBatch(result) {
    this.progress.bottles.push({ recipe: result.recipe, count: result.count, quality: result.quality });
    this.ui.updateHUD();
    this.saveGame();
  }

  onBrewComplete(result) {
    const recipe = RECIPES[result.recipe];
    this.addBottleBatch(result);
    const value = this.batchValue(result, 1);
    this.ui.toast(
      `${recipe.short}: ${result.count} бут.`,
      `качество ${result.quality} · примерно ${formatMoney(value)} ₽`,
      recipe.color
    );
    this.audio.sfx('checkpoint');
    this.shake(1.2, 0.35);
    const s = this.progress.stage;

    // городской заказ: три свежие бочки, потом стаут
    if (s === STAGES.CITY_PREP) {
      if (result.quality < 70) {
        this.ui.toast('Город не примет', 'нужно качество не ниже 70', 0xd98f7b);
        this.saveGame();
        return;
      }
      const p = this.progress;
      p.cityBrews = p.cityBrews || {};
      if (['mead', 'beer', 'festival'].includes(result.recipe)) {
        if (!p.cityBrews[result.recipe]) {
          p.cityBrews[result.recipe] = true;
          const done = Object.keys(p.cityBrews).length;
          this.ui.toast('Бочка для города готова', `${done} / 3 · ${recipe.short}`, 0x9ccdd8);
        }
        if (Object.keys(p.cityBrews).length >= 3) {
          p.unlocked.dam = true;
          p.recipes.stout = true;
          this.inventory.hop = Math.max(this.inventory.hop, 3);
          this.inventory.honey = Math.max(this.inventory.honey, 2);
          this.inventory.water = Math.max(this.inventory.water, 3);
          this.inventory.yeast = Math.max(this.inventory.yeast, 1);
          this.world.updateGates && this.world.updateGates();
          this.world.resetDaily && this.world.resetDaily();
          this.setStage(
            STAGES.CITY_DAM,
            'Глава 5 · Старая плотина',
            'три бочки готовы · рецепт «Плотинный стаут»',
            0x9ccdd8
          );
          this.ui.toast('Новый рецепт', '«Плотинный стаут» · нужна родниковая вода', 0xd8a85c);
          this.audio.sfx('buy');
        }
      } else {
        this.ui.toast('Не тот напиток', 'нужны медовуха, пиво и «Зимний берег»', 0xd98f7b);
      }
      this.ui.updateHUD();
      this.refreshObjective();
      this.saveGame();
      return;
    }

    if (s === STAGES.CITY_DAM && result.recipe === 'stout') {
      if (result.quality < 70) {
        this.inventory.hop = Math.max(this.inventory.hop, 2);
        this.inventory.honey = Math.max(this.inventory.honey, 1);
        this.inventory.water = Math.max(this.inventory.water, 2);
        this.inventory.yeast = Math.max(this.inventory.yeast, 1);
        this.inventory.mushroom = Math.max(this.inventory.mushroom, 2);
        this.inventory.spring = Math.max(this.inventory.spring, 2);
        this.ui.toast('Стаут не удался', 'нужно качество не ниже 70 · припасы возвращены', 0xd98f7b);
        this.ui.updateHUD();
        this.saveGame();
        return;
      }
      this.setStage(STAGES.CITY_DELIVER, 'Стаут «Старая плотина» готов', 'отнеси заказ Аркадию на площадь', 0xd8a85c);
      this.audio.sfx('buy');
      this.refreshObjective();
      this.saveGame();
      return;
    }

    if (result.recipe === 'mead' && (s === STAGES.GATHER1 || s === STAGES.BREW1 || s === STAGES.INTRO)) {
      this.setStage(STAGES.PAY1, 'Первая партия готова', 'продай бутылки и рассчитайся с Борисычем', 0xffca7a);
    } else if (result.recipe === 'beer' && s === STAGES.BREW2) {
      this.setStage(STAGES.DEFENSE, 'Пивоварня под угрозой', 'сборщики идут за твоим пивом', 0xd98f5a);
      this.beginDefenseSoon();
    } else if (result.recipe === 'festival' && (s === STAGES.VILLAGE || s === STAGES.BREW3)) {
      this.setStage(STAGES.JUDGE, '«Зимний берег» готов', 'неси медовуху на судейский стол', 0xffca7a);
    } else {
      this.saveGame();
    }
    this.refreshObjective();
  }

  applyUpgrades() {
    if (!this.player) return;
    this.player.setUpgrades(this.progress.upgrades);
    this.progress.maxHealth = this.player.maxHealth;
    this.progress.health = Math.min(this.progress.health, this.progress.maxHealth);
    this.player.health = this.progress.health;
  }

  buyUpgrade(key) {
    const u = UPGRADES[key];
    if (!u) return;
    if (this.progress.upgrades[key]) {
      this.ui.toast('Уже есть', u.name, 0x9faeac);
      return;
    }
    if (this.progress.money < u.cost) {
      this.audio.sfx('deny');
      this.ui.toast('Не хватает денег', `нужно ${formatMoney(u.cost)} ₽`, 0xd98f7b);
      return;
    }
    this.progress.money -= u.cost;
    this.progress.upgrades[key] = true;
    if (key === 'lamp') this.progress.maxHealth = 4;
    this.applyUpgrades();
    this.progress.health = this.progress.maxHealth;
    this.player.health = this.progress.maxHealth;
    this.audio.sfx('buy');
    this.ui.updateHUD();
    this.ui.toast('Куплено', u.name, 0xffca7a);
    this.ui.renderShop && this.ui.renderShop();
    this.saveGame();
  }

  sellBottles(spotMult, label) {
    const batches = this.progress.bottles || [];
    if (!batches.length) {
      this.showLine('Пока нечего продавать. Сначала надо сварить.');
      return false;
    }
    let sellable = batches;
    if (this.progress.stage === STAGES.JUDGE) {
      sellable = batches.filter(b => b.recipe !== 'festival');
      if (!sellable.length) {
        this.showLine('Праздничную медовуху не продаём. Сначала отнеси её на суд к Клаве.');
        return false;
      }
    }
    const total = sellable.reduce((sum, b) => sum + this.batchValue(b, spotMult || 0.9), 0);
    const count = sellable.reduce((sum, b) => sum + b.count, 0);
    this.progress.bottles = this.progress.stage === STAGES.JUDGE
      ? batches.filter(b => b.recipe === 'festival')
      : [];
    this.progress.money += total;
    this.audio.sfx('coin');
    this.ui.toast(`${label || 'Продано'}: ${count} бут.`, `+${formatMoney(total)} ₽`, 0xffca7a);
    this.ui.updateHUD();
    this.refreshObjective();
    this.saveGame();
    return true;
  }

  getSideQuestLines() {
    const side = this.progress.side;
    const lines = [];
    if (side.garden === 'none') lines.push('Баба Зина: посадить хмель в огороде');
    else if (side.garden === 'planted') lines.push('Огород: посадить клубни в грядки');
    else if (side.garden === 'growing') lines.push('Огород: полить хмель и дождаться ростков');
    else if (side.garden === 'ripe') lines.push('Огород: собрать созревший хмель');
    else if (side.garden === 'done') lines.push('Огород: урожай собран ✓');
    if (side.lure === 'none') lines.push('Стас: найти счастливую блесну');
    else if (side.lure === 'search') lines.push('Стас: искать блесну в камышах за рекой');
    else if (side.lure === 'found') lines.push('Стас: отнести блесну ✓');
    if (side.flashlight === 'none') lines.push('Гриша: найти фонарик на старой мельнице');
    else if (side.flashlight === 'search') lines.push('Гриша: фонарик где-то на старой мельнице');
    else if (side.flashlight === 'found') lines.push('Гриша: вернуть фонарик ✓');
    if (side.crows > 0) lines.push(`Вороны в лесу: разогнано ${side.crows}`);
    if (this.defense && this.defense.active) lines.push('Пивоварня: отбить сборщиков');
    if (this.progress.day >= 3) lines.push(`Фестиваль: фонарики ${(this.progress.festivalLanterns || []).length}/5`);
    if (this.progress.stage === STAGES.CITY_PREP) {
      const b = this.progress.cityBrews || {};
      lines.push(`Город: бочки ${['mead','beer','festival'].filter(k=>b[k]).length}/3`);
    } else if (this.progress.stage === STAGES.CITY_DAM) {
      lines.push('Старая плотина: найти родниковую воду');
    } else if (this.progress.stage === STAGES.CITY_DELIVER) {
      lines.push('Город: отнести стаут Аркадию');
    }
    return lines;
  }

  /* ================= СОН И ДНИ ================= */

  trySleep() {
    const s = this.progress.stage;
    if (s === STAGES.SLEEP1 || s === STAGES.SLEEP2) {
      this.advanceDay();
    } else if (s === STAGES.DONE) {
      this.showLine('Спать пока рано. Впереди — новый день и новые бочки.');
    } else {
      this.showLine('Спать рано. Сначала: ' + (this.objectiveText || 'закончи начатое'));
    }
  }

  advanceDay() {
    if (this.progress.day >= 3) return;
    const next = this.progress.day + 1;
    this.player.locked = true;
    this.ui.setPrompt(null);
    this.ui.fadeOut(0.9, () => {
      this.progress.day = next;
      this.progress.stage = next === 2 ? STAGES.DAY2_START : STAGES.DAY3_START;
      this.progress.health = this.progress.maxHealth;
      this.progress.bottles = this.progress.bottles || [];
      this.progress.unlocked.home = true;
      if (next === 3) this.progress.unlocked.village = true;
      this.player.health = this.progress.health;
      this.player.respawn(220, 600);
      this.checkpoint = { x: 220, y: 600 };
      this.snapCamera();
      this.enemies.forEach(e => { if (e.container && e.container.parent) e.container.parent.removeChild(e.container); });
      this.enemies = [];
      this.defense = null;
      this.pendingDefense = 0;
      this._crowsDay = 0;
      this.world.setDay && this.world.setDay(next);
      this.world.resetDaily && this.world.resetDaily();
      this.world.updateGarden && this.world.updateGarden(this.progress.garden);
      this.progress.garden.forEach(b => {
        if (b.stage > 0 && b.stage < 3) b.stage++;
        b.watered = false;
      });
      if (this.progress.garden.some(b => b.stage >= 3)) this.progress.side.garden = 'ripe';
      this.world.updateGarden && this.world.updateGarden(this.progress.garden);
      this.state = 'story';
      this.player.locked = true;
      this.ui.showHUD(false);
      this.refreshObjective();
      this.ui.updateHUD();
      this.ui.setFade(1);
      const pages = next === 2
        ? ['Витя проснулся от запаха мокрой земли. На дворе стоял туман, а в кармане лежал ключ от старой мельницы. Борисыч не шутил: дорога открыта.']
        : ['Медведево готовилось к фестивалю. На площади пахло пирогами и дымом. Сегодня решится не только долг — но и то, останется ли Витя на этом берегу.'];
      this.ui.showNarration(pages, {
        label: next === 2 ? 'ДЕНЬ ВТОРОЙ · СТАРАЯ МЕЛЬНИЦА' : 'ДЕНЬ ТРЕТИЙ · ТИХИЙ БЕРЕГ',
        warm: true,
        onDone: () => {
          this.state = 'play';
          this.player.locked = false;
          this.cameraFocus = null;
          this.ui.showHUD(true);
          this.ui.setFade(0.9);
          this.ui.fadeIn(1.0);
          this.refreshObjective();
          if (next === 3) {
            this.audio.setMode('festival');
            this.world.launchFirework();
            this.ui.toast('День третий · Фестиваль', 'зажги 5 фонариков и свари «Зимний берег»', 0xffca7a);
          } else {
            this.ui.toast('День второй', 'дорога на мельницу открыта', 0xffca7a);
          }
          this.saveGame();
        },
      });
      this.ui.fadeIn(0.9);
      this.saveGame();
    });
  }

  /* ================= ОГОРОД ================= */

  useGarden(bed) {
    if (!bed) return;
    const p = this.progress;
    const b = p.garden[bed.index];
    if (!b) return;
    if (b.stage === 0) {
      if (p.seeds <= 0) {
        this.showLine('Нужны клубни хмеля. Баба Зина обещала дать — поговори с ней.');
        return;
      }
      p.seeds--;
      b.stage = 1;
      b.watered = false;
      p.side.garden = 'growing';
      this.audio.sfx('collectHop');
      this.ui.toast('Хмель посажен', `клубней осталось: ${p.seeds}`, 0x9bbb72);
    } else if (b.stage < 3) {
      if (b.watered) {
        this.showLine('Уже полито. Хмель любит терпение.');
        return;
      }
      b.watered = true;
      b.stage = Math.min(3, b.stage + 1);
      if (b.stage >= 3) p.side.garden = 'ripe';
      this.audio.sfx('collectWater');
      this.ui.toast('Полито', b.stage >= 3 ? 'хмель почти созрел' : 'ростки поднялись', 0x9cdcea);
    } else {
      this.inventory.hop += 3;
      b.stage = 0;
      b.watered = false;
      p.gardenHarvested = (p.gardenHarvested || 0) + 1;
      this.audio.sfx('collectHop');
      this.ui.toast('Урожай', '+3 хмеля', 0x9bbb72);
      if (p.gardenHarvested >= 3 && p.side.garden !== 'done') {
        p.side.garden = 'done';
        p.money += 1500;
        p.reputation += 8;
        this.ui.toast('Баба Зина довольна', '+1 500 ₽ · репутация +8', 0xffca7a);
        this.audio.sfx('buy');
      }
    }
    this.world.updateGarden(p.garden);
    this.ui.updateHUD();
    this.refreshObjective();
    this.saveGame();
  }

  /* ================= БОЙ ================= */

  resolvePlayerAttack() {
    const p = this.player;
    if (!p) return;
    const hx = p.cx + p.dir * 40;
    const hy = p.cy - 4;
    let hitAny = false;
    for (const e of this.enemies) {
      if (!e || e.dead || e.gone) continue;
      if (Math.abs(e.container.x - hx) < 64 && Math.abs((e.container.y - 30) - hy) < 72) {
        e.hit(1, p.dir);
        hitAny = true;
      }
    }
    const d = this.world.tutorialDummy;
    if (d && !d.defeated && Math.abs(d.x - hx) < 72 && Math.abs((d.y - 54) - hy) < 82) {
      this.hitTutorialDummy();
      hitAny = true;
    }
    if (hitAny) this.shake(1.5, 0.12);
  }

  hitTutorialDummy() {
    const d = this.world.tutorialDummy;
    if (!d || d.defeated) return;
    d.hp--;
    this.world.spawnBurst(d.x, d.y - 58, 0xffd58a, 10);
    this.audio.sfx('hit');
    this.shake(1.2, 0.12);
    if (d.hp > 0) {
      d.art.rotation = (Math.random() - 0.5) * 0.08;
      setTimeout(() => { if (d.art) d.art.rotation = 0; }, 90);
      return;
    }
    d.defeated = true;
    d.container.visible = false;
    this.flags.broomTutorial = true;
    this.flags.broomTutorialShown = true;
    this.progress.money += 300;
    this.progress.reputation = Math.min(100, this.progress.reputation + 2);
    this.ui.hideTutorial();
    this.ui.toast('Обучение метле пройдено', '+300 ₽ · метла слушается', 0xffca7a);
    this.audio.sfx('checkpoint');
    this.world.spawnBurst(d.x, d.y - 50, 0xa7c98d, 22);
    this.ui.updateHUD();
    this.saveGame();
  }

  showBroomTutorial() {
    if (this.flags.broomTutorialShown || this.flags.broomTutorial) return;
    this.flags.broomTutorialShown = true;
    this.ui.showTutorial(
      'МЕТЛА · БОЙ',
      'F — удар метлой. Подойди к чучелу и разбей его: три удара.',
      'Метла пригодится в лесу и при защите пивоварни.',
      8.5
    );
    this.saveGame();
  }

  onEnemyDefeated(enemy) {
    if (enemy.kind === 'thug') {
      const reward = 180 + Math.floor(Math.random() * 220);
      this.progress.money += reward;
      this.ui.toast('Сборщик отступил', `+${formatMoney(reward)} ₽`, 0xffca7a);
      this.audio.sfx('coin');
    } else {
      this.progress.side.crows = (this.progress.side.crows || 0) + 1;
      this.progress.money += 80;
      this.ui.toast('Ворона прогнана', '+80 ₽', 0x9fb6c4);
    }
    this.ui.updateHUD();
  }

  onThugSteal(enemy) {
    if (this.progress.bottles.length) {
      const b = this.progress.bottles[0];
      b.count--;
      if (b.count <= 0) this.progress.bottles.shift();
      this.ui.toast('Сборщик стащил бутылку', 'не отдавай им пивоварню', 0xd98f7b);
    } else {
      this.progress.money = Math.max(0, this.progress.money - 500);
      this.ui.toast('Сборщик стащил 500 ₽', 'не отдавай им пивоварню', 0xd98f7b);
    }
    if (this.defense) this.defense.stolen = (this.defense.stolen || 0) + 1;
    this.ui.updateHUD();
    this.saveGame();
  }

  onCrowSteal(enemy) {
    const keys = ['hop', 'honey', 'water', 'berries', 'mushroom', 'herb'];
    const available = keys.filter(k => (this.inventory[k] || 0) > 0);
    if (available.length) {
      const k = available[Math.floor(Math.random() * available.length)];
      this.inventory[k]--;
      this.ui.toast('Ворона утащила припас', `${ITEM_INFO[k].name} −1`, 0x9fb6c4);
    } else {
      this.progress.money = Math.max(0, this.progress.money - 50);
      this.ui.toast('Ворона утащила мелочь', '−50 ₽', 0x9fb6c4);
    }
    this.ui.updateHUD();
    this.refreshObjective();
  }

  updateEnemies(dt) {
    if (!this.enemies.length) return;
    if (this.respawning) return;
    const paused = this.ui.dialogueActive || this.ui.brewingActive || this.ui.journalActive || this.ui.shopActive || this.ui.travelActive || this.ui.narrationActive;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e) { this.enemies.splice(i, 1); continue; }
      if (!paused) e.update(dt, this.time);
      if (e.gone) {
        if (e.container && e.container.parent) e.container.parent.removeChild(e.container);
        this.enemies.splice(i, 1);
      }
    }
  }

  spawnForestCrows() {
    if (this._crowsDay === this.progress.day) return;
    if (this.progress.day < 2) return;
    this._crowsDay = this.progress.day;
    const spots = [[6120, 470], [6480, 500], [6860, 455], [7160, 490]];
    for (const [x, y] of spots) {
      const crow = new Enemy(this, 'crow', x, y);
      this.enemies.push(crow);
      this.world.entityLayer.addChild(crow.container);
    }
  }

  /* ================= ЗАЩИТА ПИВОВАРНИ ================= */

  beginDefenseSoon() {
    this.pendingDefense = 2.2;
    this.ui.toast('Сборщики Борисыча', 'они идут к пивоварне — готовь метлу', 0xd98f5a);
    this.audio.playAmbience && this.audio.playAmbience('crickets', 0.15, 1);
  }

  startDefense() {
    this.pendingDefense = 0;
    this.defense = {
      active: true,
      wave: 0,
      totalWaves: 3,
      state: 'intro',
      timer: 1.0,
      spawned: 0,
      toSpawn: 0,
      stolen: 0,
      defeated: 0,
    };
    this.player.health = this.progress.maxHealth;
    this.progress.health = this.player.health;
    this.ui.updateHUD();
    this.ui.setObjective('Отбить сборщиков: волна 1 / 3');
    this.ui.toast('Держи пивоварню!', 'три волны сборщиков', 0xd98f5a);
    if (!this.flags.broomTutorial) {
      this.ui.showTutorial(
        'БОЙ · МЕТЛА',
        'F — удар метлой. Держи дистанцию и бей сборщиков, пока они идут к чану.',
        'Отбей три волны. Метла бьёт перед собой.',
        11
      );
    }
    this.audio.setMode('night');
    this.cameraFocus = { x: 5150, y: 600 };
  }

  startDefenseWave(n) {
    if (!this.defense) return;
    this.defense.wave = n;
    this.defense.state = 'spawning';
    this.defense.timer = 0.7;
    this.defense.spawned = 0;
    this.defense.toSpawn = 1 + n;
    this.ui.setObjective(`Отбить сборщиков: волна ${n} / 3`);
    this.ui.toast(`Волна ${n} / 3`, n === 3 ? 'последний рывок' : 'сборщики лезут с двух сторон', 0xd98f5a);
    this.audio.sfx('deny');
  }

  spawnThug() {
    const fromRight = Math.random() < 0.6;
    const x = fromRight ? 5720 + Math.random() * 90 : 4820 + Math.random() * 90;
    const e = new Enemy(this, 'thug', x, 600, { targetX: 5520 });
    this.enemies.push(e);
    this.world.entityLayer.addChild(e.container);
    this.world.spawnDust(x, 600, fromRight ? -1 : 1, 3);
  }

  updateDefense(dt) {
    if (this.ui.dialogueActive || this.ui.brewingActive || this.ui.journalActive || this.ui.shopActive || this.ui.travelActive) return;
    if (this.pendingDefense > 0) {
      this.pendingDefense -= dt;
      if (this.pendingDefense <= 0) this.startDefense();
      return;
    }
    const d = this.defense;
    if (!d || !d.active) return;
    d.timer -= dt;
    if (d.state === 'intro') {
      if (d.timer <= 0) this.startDefenseWave(1);
    } else if (d.state === 'spawning') {
      if (d.timer <= 0) {
        if (d.spawned < d.toSpawn) {
          this.spawnThug();
          d.spawned++;
          d.timer = 0.9;
        } else {
          d.state = 'fighting';
        }
      }
    } else if (d.state === 'fighting') {
      const alive = this.enemies.some(e => e.kind === 'thug' && !e.dead && !e.gone && e.stealTimer <= 0);
      if (!alive) {
        d.state = 'break';
        d.timer = 1.6;
        this.audio.sfx('checkpoint');
        this.ui.toast(`Волна ${d.wave} отбита`, d.wave < 3 ? 'следующая на подходе' : 'все ушли', 0xffca7a);
      }
    } else if (d.state === 'break') {
      if (d.timer <= 0) {
        if (d.wave < d.totalWaves) {
          this.startDefenseWave(d.wave + 1);
        } else {
          this.finishDefense();
        }
      }
    }
  }

  finishDefense() {
    if (!this.defense) return;
    const d = this.defense;
    d.active = false;
    this.defense = null;
    this.cameraFocus = null;
    this.progress.money += 2000;
    this.progress.reputation += 10;
    this.setStage(STAGES.PAY2, 'Пивоварня выстояла', '+2 000 ₽ · репутация +10', 0xffca7a);
    this.ui.updateHUD();
    this.audio.sfx('buy');
    this.saveGame();
  }

  /* ================= ФИНАЛ ================= */

  judgeFestival() {
    const p = this.progress;
    let bestIndex = -1;
    let bestQuality = -1;
    (p.bottles || []).forEach((b, i) => {
      if (b.recipe === 'festival' && b.quality > bestQuality) {
        bestQuality = b.quality;
        bestIndex = i;
      }
    });
    if (bestIndex < 0) {
      const req = { hop: 2, honey: 2, water: 2, berries: 2, herb: 1 };
      for (const [k, v] of Object.entries(req)) {
        if ((this.inventory[k] || 0) < v) this.inventory[k] = v;
      }
      this.progress.stage = STAGES.BREW3;
      this.refreshObjective();
      this.ui.updateHUD();
      this.saveGame();
      this.showLine('Где праздничная медовуха? Я оставила тебе набор. Свари «Зимний берег» и возвращайся.');
      return;
    }
    p.bottles.splice(bestIndex, 1);
    const sideBonus = (p.side.garden === 'done' ? 1 : 0) + (p.side.lure === 'done' ? 1 : 0) + (p.side.flashlight === 'done' ? 1 : 0);
    const prize = 18000 + bestQuality * 120 + p.reputation * 50 + sideBonus * 500 + (p.festivalLanterns || []).length * 250;
    p.money += prize;
    p.reputation = Math.min(100, p.reputation + 15);
    this.setStage(STAGES.CITY_ORDER, 'Фестиваль: приз ваш!', `+${formatMoney(prize)} ₽ · городской заказ ждёт`, 0xffca7a);
    this.audio.setMode('festival');
    this.audio.sfx('buy');
    this.world.launchFirework();
    this.world.launchFirework();
    this.world.launchFirework();
    this.ui.updateHUD();
    this.saveGame();
    this.ui.toast('Медовуха «Зимний берег»', `оценка ${bestQuality} · приз ${formatMoney(prize)} ₽`, 0xffca7a);
    this.ui.toast('Городской заказ', 'Аркадий ждёт у правого прилавка', 0x9ccdd8);
  }

  finishStory() {
    this.state = 'ending';    this.player.locked = true;
    this.ui.showHUD(false);
    const remaining = Math.max(0, DEBT_TOTAL - this.progress.debtPaid);
    const paid = remaining <= 0;
    const lines = [
      paid
        ? 'Борисыч пересчитал деньги, сложил их в старую папку и долго молчал. А потом достал из-за стойки вторую кружку.'
        : 'Витя отдал всё, что было. Борисыч пересчитал, вздохнул и убрал папку под стойку. «Остальное — потом. Ты уже не тот, кем был».',
      '«Мы с твоим отцом этот берег начинали, — сказал он. — Он варил, я считал. Потом он умер, а я остался считать один. Долг — это была не жадность. Это был повод не дать тебе пропасть».',
      this.progress.side.garden === 'done'
        ? 'Хмель на Витином огороде поднялся выше забора. Баба Зина говорила, что такого густого ещё не видела.'
        : 'Витя пообещал Зине, что весной засадит огород хмелем. Она сказала: «Вот и хорошо. Весной и начнёшь».',
      this.progress.side.lure === 'done' && this.progress.side.flashlight === 'done'
        ? 'Стас получил свою блесну, Гриша — фонарик, а деревня — повод сидеть у пивоварни до утра.'
        : 'Стас всё ещё искал свою блесну, Гриша — батарейки. Но по вечерам они всё равно приходили к пивоварне.',
      'Аркадий из городской гильдии увёз три бочки и оставил на стойке контракт. В нём было написано: «Тихий берег. Следующая партия — к зимней ярмарке».',
      'На вывеске больше не было слова «долг». Только «Тихий берег». Пивоварня дяди Вити. Три дня позади — и целая жизнь впереди.',
    ];
    this.audio.setMode('ending');
    this.audio.sfx('ending');
    this.ui.setFade(1);
    this.ui.fadeIn(1.4);
    this.ui.showNarration(lines, {
      label: 'ЭПИЛОГ · ТИХИЙ БЕРЕГ',
      warm: true,
      onDone: () => {
        this.ui.setFade(0.85);
        this.ui.showCredits();
        this.ui.fadeIn(1.4);
        this.progress.stage = STAGES.DONE;
        this.saveGame();
      },
    });
  }

  /* ================= БЫСТРЫЕ ПЕРЕХОДЫ ================= */

  fastTravel(key) {
    const point = TRAVEL_POINTS[key];
    if (!point || !this.ui.travelActive) return;
    const unlocked = key === 'home' || !!(this.progress.unlocked && this.progress.unlocked[key]);
    if (!unlocked) {
      this.ui.toast('Дорога закрыта', `откроется по сюжету`, 0xd98f7b);
      this.audio.sfx('deny');
      return;
    }
    if (this.defense && this.defense.active) {
      this.ui.hideTravel();
      this.ui.toast('Не сейчас', 'сборщики уже во дворе', 0xd98f5a);
      return;
    }
    this.ui.hideTravel();
    this.player.locked = true;
    this.ui.fadeOut(0.35, () => {
      this.player.respawn(point.x, 600);
      this.checkpoint = { x: point.x, y: 600 };
      this.snapCamera();
      this.cameraFocus = null;
      this.ui.setFade(0.9);
      this.ui.fadeIn(0.6);
      this.player.locked = false;
      this.ui.toast('В пути', point.name, 0xffca7a);
      this.world.resetCollectiblesAt ? this.world.resetCollectiblesAt(point.x) : null;
      this.saveGame();
    });
  }

  /* ================= СОХРАНЕНИЕ ================= */

  saveKey() { return 'vitya_full_save_v1'; }

  hasSave() {
    try {
      const raw = localStorage.getItem(this.saveKey());
      if (!raw) return false;
      const d = JSON.parse(raw);
      return !!(d && d.version === 3 && d.progress);
    } catch (e) { return false; }
  }

  getSaveInfo() {
    try {
      const raw = localStorage.getItem(this.saveKey());
      if (!raw) return null;
      const d = JSON.parse(raw);
      return d && d.version === 3 ? d : null;
    } catch (e) { return null; }
  }

  saveGame() {
    if (this._debug) return;
    if (!this.progress || this.progress.stage === STAGES.INTRO) return;
    if (!this.ui || this.ui.brewingActive) return;
    if (this.player) {
      this.progress.health = this.player.health;
      this.progress.maxHealth = this.player.maxHealth;
    }
    try {
      const inv = {};
      for (const k of Object.keys(ITEM_INFO)) inv[k] = this.inventory[k] || 0;
      const data = {
        version: 3,
        savedAt: Date.now(),
        day: this.progress.day,
        progress: JSON.parse(JSON.stringify(this.progress)),
        inventory: inv,
        flags: JSON.parse(JSON.stringify(this.flags)),
        checkpoint: { x: this.checkpoint.x, y: this.checkpoint.y },
        playTime: Math.round(this.playTime || 0),
      };
      localStorage.setItem(this.saveKey(), JSON.stringify(data));
    } catch (e) { /* localStorage может быть недоступен */ }
  }

  clearSave() {
    try { localStorage.removeItem(this.saveKey()); } catch (e) {}
  }

  continueGame() {
    if (this.starting) return;
    const data = this.getSaveInfo();
    if (!data) { this.startNewGame(); return; }
    this.starting = true;
    this.audio.init();
    this.audio.resume();
    this.audio.startMusic();
    this.audio.setMode('night');
    this.ui.fadeOut(0.45, () => {
      this.newWorld();
      this.applySaveData(data);
      this.starting = false;
    });
  }

  applySaveData(data) {
    const base = this.freshProgress();
    const p = data.progress || {};
    this.progress = Object.assign(base, p);
    this.progress.bottles = p.bottles || [];
    this.progress.recipes = Object.assign(base.recipes, p.recipes || {});
    this.progress.upgrades = Object.assign(base.upgrades, p.upgrades || {});
    this.progress.side = Object.assign(base.side, p.side || {});
    this.progress.unlocked = Object.assign(base.unlocked, p.unlocked || {});
    this.progress.zones = Object.assign(base.zones, p.zones || {});
    this.progress.cityBrews = Object.assign({}, p.cityBrews || {});
    this.progress.garden = Array.isArray(p.garden) && p.garden.length === 3 ? p.garden : base.garden;
    this.progress.festivalLanterns = Array.isArray(p.festivalLanterns) ? p.festivalLanterns.filter(i => Number.isInteger(i) && i >= 0 && i < 5) : [];
    this.inventory = this.freshInventory();
    for (const k of Object.keys(ITEM_INFO)) this.inventory[k] = (data.inventory && data.inventory[k]) || 0;
    this.flags = Object.assign(this.freshFlags(), data.flags || {});
    this.checkpoint = data.checkpoint && typeof data.checkpoint.x === 'number'
      ? { x: data.checkpoint.x, y: data.checkpoint.y || 600 }
      : { x: 220, y: 600 };
    this.playTime = data.playTime || 0;
    this.enemies = [];
    this.defense = null;
    this.pendingDefense = 0;
    this._crowsDay = 0;
    this.state = 'play';
    this.player.setUpgrades(this.progress.upgrades);
    this.progress.maxHealth = this.progress.upgrades.lamp ? 4 : 3;
    this.progress.health = U.clamp(this.progress.health || this.progress.maxHealth, 1, this.progress.maxHealth);
    this.player.health = this.progress.health;
    this.player.maxHealth = this.progress.maxHealth;
    this.player.respawn(this.checkpoint.x, this.checkpoint.y);
    this.world.setDay && this.world.setDay(this.progress.day);
    this.world.updateGarden && this.world.updateGarden(this.progress.garden);
    this.world.resetDaily && this.world.resetDaily();
    if (this.flags.borisIntro && this.world.borisIntro) {
      this.world.borisIntro.gone = true;
      this.world.borisIntro.container.visible = false;
    }
    this.world.applyProgress ? this.world.applyProgress(this.progress, this.flags) : null;
    this.ui.reset();
    this.ui.hideTitle();
    if (this.progress.stage === STAGES.DONE) {
      this.state = 'ending';
      this.ui.showHUD(false);
      this.ui.showCredits();
      this.audio.setMode('ending');
      this.ui.setFade(1);
      this.ui.fadeIn(1.2);
      return;
    }
    this.ui.showHUD(true);
    this.ui.setFade(1);
    this.ui.fadeIn(1.0);
    this.player.locked = false;
    this.cameraFocus = null;
    this.snapCamera();
    this.refreshObjective();
    this.ui.updateHUD();
    this.audio.playAmbience('crickets', 0.15, 2);
    if (this.progress.day >= 3 && this.progress.stage !== STAGES.DONE) this.audio.setMode('festival');
    if (this.progress.stage === STAGES.DEFENSE) this.pendingDefense = 2.2;
    this.ui.toast(`Продолжаем · день ${this.progress.day}`, this.objectiveText, 0xffca7a);
    const cp = this.world.checkpoints.find(c => Math.abs(c.x - this.checkpoint.x) < 28);
    if (cp && !cp.lit) cp.light(true);
    this.saveTimer = 0;
    this.saveGame();
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
    return this.state !== 'play' || this.ui.dialogueActive || this.ui.brewingActive ||
      this.ui.journalActive || this.ui.shopActive || this.ui.travelActive ||
      this.player.locked || this.respawning;
  }

  shake(mag, dur) {
    this.camera.shakeMag = Math.max(this.camera.shakeMag, mag);
    this.camera.shakeDur = Math.max(this.camera.shakeDur, dur);
    this.camera.shakeTime = Math.max(this.camera.shakeTime, dur);
  }

  /* ================= ВВОД ================= */

  handleGlobalInput() {
    const input = this.input;

    if (input.wasPressed('KeyV')) this.toggleFullscreen();
    if (input.wasPressed('KeyM')) this.toggleMute();
    if (input.wasPressed('KeyG') && (this.state === 'title' || this.state === 'paused')) {
      this.toggleGraphicsMode();
      return;
    }

    // верхние окна
    if (this.ui.brewingActive) {
      if (input.wasPressed('Escape')) this.ui.closeBrewing();
      else if (input.wasPressed('ArrowUp')) this.ui.selectBrewRecipe(-1);
      else if (input.wasPressed('ArrowDown')) this.ui.selectBrewRecipe(1);
      else if (input.wasPressed('Space', 'Enter', 'NumpadEnter', 'KeyE')) this.ui.brewAction();
      return;
    }
    if (this.ui.shopActive) {
      if (input.wasPressed('Escape', 'KeyE')) this.ui.hideShop();
      else if (input.wasPressed('Digit1')) { this.buyUpgrade('boots'); this.ui.renderShop(); }
      else if (input.wasPressed('Digit2')) { this.buyUpgrade('kettle'); this.ui.renderShop(); }
      else if (input.wasPressed('Digit3')) { this.buyUpgrade('lamp'); this.ui.renderShop(); }
      return;
    }
    if (this.ui.travelActive) {
      if (input.wasPressed('Escape', 'KeyT')) this.ui.hideTravel();
      else if (input.wasPressed('Digit1')) this.fastTravel('home');
      else if (input.wasPressed('Digit2')) this.fastTravel('brewery');
      else if (input.wasPressed('Digit3')) this.fastTravel('mill');
      else if (input.wasPressed('Digit4')) this.fastTravel('village');
      else if (input.wasPressed('Digit5')) this.fastTravel('dam');
      return;
    }
    if (this.ui.journalActive) {
      if (input.wasPressed('Tab', 'Escape', 'KeyJ')) this.ui.hideJournal();
      return;
    }

    if (this.ui.helpOverlay.visible) {
      if (input.wasPressed('Escape', 'KeyH', 'Enter')) {
        this.ui.helpOverlay.visible = false;
        this.audio.sfx('ui');
      }
      return;
    }

    if (this.state === 'title') {
      if (input.wasPressed('Space', 'Enter', 'NumpadEnter')) {
        if (this.hasSave()) this.continueGame();
        else this.startNewGame();
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
      if (input.wasPressed('Tab') && !(this.defense && this.defense.active)) {
        this.ui.showJournal();
        return;
      }
      if (input.wasPressed('KeyT') && !(this.defense && this.defense.active)) {
        this.ui.showTravel();
        return;
      }
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
      if (this.player.attackStarted) {
        this.player.attackStarted = false;
        this.resolvePlayerAttack();
      }
      this.updateEnemies(dt);
      this.updateDefense(dt);
      this.playTime += dt;
      this.saveTimer += dt;
      if (this.saveTimer > 15 && !this.ui.dialogueActive && !this.ui.brewingActive && !(this.defense && this.defense.active)) {
        this.saveTimer = 0;
        this.saveGame();
      }
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

    // страховка от перепрыгивания закрытых ворот
    if (this.progress.day < 2 && this.player.cx > 5855) {
      this.player.respawn(5660, 600);
      this.checkpoint = { x: 5660, y: 600 };
      this.snapCamera();
      this.ui.toast('Ворота заперты', 'сначала разберись с долгом', 0xd98f7b);
    }
    if (this.progress.day < 3 && this.player.cx > 7400) {
      this.player.respawn(7180, 600);
      this.checkpoint = { x: 7180, y: 600 };
      this.snapCamera();
      this.ui.toast('Дорога на площадь закрыта', 'фестиваль ещё не начался', 0xd98f7b);
    }
    if (!this.progress.unlocked.dam && this.player.cx > 9240) {
      this.player.respawn(9020, 600);
      this.checkpoint = { x: 9020, y: 600 };
      this.snapCamera();
      this.ui.toast('Дорога на плотину закрыта', 'сначала выполни городской заказ', 0x9ccdd8);
    }

    // фонари
    this.world.checkCheckpoint(this.player);

    // первое знакомство с метлой
    const dummy = this.world.tutorialDummy;
    if (dummy && !dummy.defeated && !this.flags.broomTutorialShown &&
        Math.abs(this.player.cx - dummy.x) < 175) {
      this.showBroomTutorial();
    }

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
      this.progress.unlocked.brewery = true;
      this.ui.toast('Пивоварня «Тихий берег»', 'здесь варят. здесь не пьют', 0xffca7a);
    }
    if (!this.progress.zones.mill && this.player.cx > 5950) {
      this.progress.zones.mill = true;
      this.progress.unlocked.mill = true;
      this.ui.toast('Старая мельница', 'лес, вода и старые рецепты', 0xa7b6a0);
      this.spawnForestCrows();
    }
    if (!this.progress.zones.village && this.player.cx > 7420) {
      this.progress.zones.village = true;
      this.progress.unlocked.village = true;
      this.ui.toast('Площадь «Тихий берег»', 'здесь сегодня варят и судят', 0xffca7a);
    }
    if (!this.progress.zones.dam && this.player.cx > 9300) {
      this.progress.zones.dam = true;
      this.ui.toast('Старая плотина', 'родник, туман и старые камни', 0x9ccdd8);
    }
    if (this.player.cx > 5920) this.spawnForestCrows();

    // подсказки взаимодействия
    const inter = (this.defense && this.defense.active) ? null : this.world.nearestInteraction(this.player);
    this.currentInteraction = inter;
    if (inter && !this.ui.dialogueActive && !this.respawning) {
      let oy = -112;
      if (inter.type === 'vat') oy = -162;
      else if (inter.type === 'garden') oy = -86;
      else if (inter.type === 'bed') oy = -76;
      else if (inter.type === 'trade' || inter.type === 'shop') oy = -104;
      this.ui.setPrompt(
        inter.prompt,
        inter.x - this.camera.x + this.camera.shakeX,
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
    const p = this.progress;
    const s = p.stage;

    if (npc === this.world.borisIntro && !this.flags.borisIntro) {
      this.flags.borisIntro = true;
      npc.walkTo(1190, 78);
      this.setStage(STAGES.GATHER1);
      this.ui.toast('Три дня', 'долг — 47 000 ₽', 0xd98f5a);
      this.refreshObjective();
      this.saveGame();
      return;
    }

    if (npc.kind === 'arkady') {
      if (s === STAGES.CITY_ORDER) {
        p.recipes.mead = true;
        p.recipes.beer = true;
        p.recipes.festival = true;
        p.cityBrews = {};
        p.unlocked.dam = false;
        this.inventory.hop += 10;
        this.inventory.honey += 10;
        this.inventory.water += 12;
        this.inventory.berries += 5;
        this.inventory.herb += 3;
        this.inventory.yeast += 6;
        this.world.resetDaily && this.world.resetDaily();
        this.setStage(
          STAGES.CITY_PREP,
          'Глава 4 · Городской заказ',
          'три свежие бочки · качество 70+',
          0x9ccdd8
        );
        this.ui.toast('Припасы от города', 'хмель, мёд, вода, ягоды и дрожжи', 0x9ccdd8);
        this.audio.sfx('buy');
        this.ui.updateHUD();
        this.refreshObjective();
        this.saveGame();
        return;
      }
      if (s === STAGES.CITY_DELIVER) {
        p.money += 40000;
        p.reputation = Math.min(100, p.reputation + 15);
        // забираем одну партию стаута
        const idx = p.bottles.findIndex(b => b.recipe === 'stout');
        if (idx >= 0) {
          p.bottles[idx].count--;
          if (p.bottles[idx].count <= 0) p.bottles.splice(idx, 1);
        }
        this.setStage(
          STAGES.FINALE,
          'Городской заказ выполнен',
          '+40 000 ₽ · город знает «Тихий берег»',
          0xffca7a
        );
        this.audio.sfx('buy');
        this.world.launchFirework();
        this.world.launchFirework();
        this.ui.updateHUD();
        this.refreshObjective();
        this.saveGame();
        return;
      }
      this.refreshObjective();
      return;
    }

    if (npc === this.world.borisFinal) {
      if (s === STAGES.PAY1) {
        const pay = Math.min(p.money, PAYMENTS[1]);
        p.money -= pay;
        p.debtPaid += pay;
        p.reputation += pay >= PAYMENTS[1] ? 5 : 1;
        this.ui.updateHUD();
        this.setStage(
          STAGES.SLEEP1,
          pay >= PAYMENTS[1] ? 'Первый платёж принят' : 'Борисыч дал отсрочку',
          `отдано ${formatMoney(pay)} ₽ · осталось ${formatMoney(DEBT_TOTAL - p.debtPaid)} ₽`,
          0xffca7a
        );
        this.audio.sfx('coin');
        this.saveGame();
        return;
      }
      if (s === STAGES.PAY2) {
        const pay = Math.min(p.money, PAYMENTS[2]);
        p.money -= pay;
        p.debtPaid += pay;
        p.reputation += pay >= PAYMENTS[2] ? 8 : 2;
        this.ui.updateHUD();
        this.setStage(
          STAGES.SLEEP2,
          pay >= PAYMENTS[2] ? 'Второй платёж принят' : 'Борисыч снова подождал',
          `отдано ${formatMoney(pay)} ₽ · осталось ${formatMoney(DEBT_TOTAL - p.debtPaid)} ₽`,
          0xffca7a
        );
        this.audio.sfx('coin');
        this.saveGame();
        return;
      }
      if (s === STAGES.DAY2_START) {
        p.unlocked.mill = true;
        this.setStage(STAGES.MILL, 'Дорога на мельницу открыта', 'старик Пал Палыч помнит отцовские рецепты', 0xa7b6a0);
        this.world.setDay && this.world.setDay(2, true);
        this.saveGame();
        return;
      }
      if (s === STAGES.FINALE) {
        const remaining = Math.max(0, DEBT_TOTAL - p.debtPaid);
        const pay = Math.min(p.money, remaining);
        p.money -= pay;
        p.debtPaid += pay;
        this.ui.updateHUD();
        this.finishStory();
        return;
      }
    }

    if (npc.kind === 'pavel' && s === STAGES.MILL) {
      p.recipes.beer = true;
      this.inventory.yeast += 1;
      this.setStage(STAGES.BREW2, 'Рецепт «Отцовское» найден', 'дрожжи у тебя · свари пиво', 0xffca7a);
      this.ui.updateHUD();
      this.saveGame();
      return;
    }
    if (npc.kind === 'pavel' && s === STAGES.BREW2) {
      const req = { hop: 2, honey: 1, water: 2 };
      let gave = false;
      for (const [k, v] of Object.entries(req)) {
        if ((this.inventory[k] || 0) < v) { this.inventory[k] = v; gave = true; }
      }
      if (gave) {
        this.ui.toast('Пал Палыч выделил припасы', 'на одну варку «Отцовского»', 0xffca7a);
        this.ui.updateHUD();
        this.refreshObjective();
        this.saveGame();
      }
      return;
    }

    if (npc.kind === 'klava') {
      if (s === STAGES.DAY3_START) {
        p.recipes.festival = true;
        this.setStage(STAGES.VILLAGE, 'Рецепт «Зимний берег» открыт', 'ягоды и травы — в лесу и у площади', 0xffca7a);
        this.saveGame();
        return;
      }
      if (s === STAGES.VILLAGE || s === STAGES.BREW3 || s === STAGES.JUDGE) {
        const req = { hop: 2, honey: 2, water: 2, berries: 2, herb: 1 };
        let gave = false;
        for (const [k, v] of Object.entries(req)) {
          if ((this.inventory[k] || 0) < v) { this.inventory[k] = v; gave = true; }
        }
        if (gave) {
          this.ui.toast('Клава выделила праздничный набор', 'всё для «Зимнего берега»', 0xffca7a);
          this.ui.updateHUD();
          this.refreshObjective();
          this.saveGame();
        }
      }
      if (s === STAGES.JUDGE) {
        this.judgeFestival();
        return;
      }
      return;
    }

    if (npc.kind === 'zina') {
      if (p.side.garden === 'none') {
        p.seeds = 3;
        p.side.garden = 'planted';
        this.ui.toast('Клубни хмеля', 'посади их в грядки у двора', 0x9bbb72);
        this.saveGame();
      }
      return;
    }
    if (npc.kind === 'stas') {
      if (p.side.lure === 'none') {
        p.side.lure = 'search';
        this.ui.toast('Поручение Стаса', 'найди блесну в камышах за рекой', 0xffcf72);
        this.saveGame();
      } else if (p.side.lure === 'found') {
        p.side.lure = 'done';
        p.money += 1200;
        p.reputation += 6;
        this.ui.updateHUD();
        this.ui.toast('Стас доволен', '+1 200 ₽ · репутация +6', 0xffcf72);
        this.saveGame();
      }
      return;
    }
    if (npc.kind === 'grisha') {
      if (p.side.flashlight === 'none') {
        p.side.flashlight = 'search';
        this.ui.toast('Поручение Гриши', 'фонарик остался на старой мельнице', 0xaee8f2);
        this.saveGame();
      } else if (p.side.flashlight === 'found') {
        p.side.flashlight = 'done';
        p.money += 900;
        p.reputation += 5;
        this.ui.updateHUD();
        this.ui.toast('Гриша счастлив', '+900 ₽ · репутация +5', 0xaee8f2);
        this.saveGame();
      }
      return;
    }
    this.refreshObjective();
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
    if (this.defense && this.defense.active) return;
    if (inter.type === 'npc') {
      this.startNpcDialogue(inter.npc);
    } else if (inter.type === 'sign') {
      this.player.locked = true;
      this.player.vx = 0;
      this.cameraFocus = null;
      this.ui.showDialogue(inter.sign.lines, () => { this.player.locked = false; });
    } else if (inter.type === 'vat') {
      this.useVat();
    } else if (inter.type === 'trade') {
      this.sellBottles(inter.spot.mult, inter.spot.label);
    } else if (inter.type === 'shop') {
      if (this.progress.day === 1 && this.progress.debtPaid < PAYMENTS[1]) {
        this.showLine('Сначала разберись с первым платежом. Мастерская никуда не денется.');
        return;
      }
      this.ui.showShop();
    } else if (inter.type === 'bed') {
      this.trySleep();
    } else if (inter.type === 'garden') {
      this.useGarden(inter.bed);
    } else if (inter.type === 'lantern') {
      this.useFestivalLantern(inter.lantern);
    }
  }

  useFestivalLantern(lantern) {
    if (!lantern) return;
    const p = this.progress;
    p.festivalLanterns = p.festivalLanterns || [];
    if (lantern.lit) return;
    if (!this.world.lightFestivalLantern(lantern.index, true)) return;
    if (!p.festivalLanterns.includes(lantern.index)) p.festivalLanterns.push(lantern.index);
    this.audio.sfx('checkpoint');
    this.ui.toast('Фонарик зажжён', `${p.festivalLanterns.length} / 5`, 0xffd38a);
    if (p.festivalLanterns.length >= 5) {
      p.money += 1200;
      p.reputation = Math.min(100, p.reputation + 6);
      this.ui.toast('Площадь сияет', '+1 200 ₽ · репутация +6', 0xffca7a);
      this.world.launchFirework();
      this.world.launchFirework();
      this.audio.sfx('buy');
    }
    this.ui.updateHUD();
    this.refreshObjective();
    this.saveGame();
  }

  useVat() {
    if (this.progress.stage === STAGES.INTRO) {
      this.showLine('Сначала надо поговорить с Борисычем. Он ждёт у ворот.');
      return;
    }
    this.ui.showBrewing(this);
  }

  updateHUD() {
    this.ui.updateHUD();
  }

  /* ================= ПРЕДМЕТЫ / СМЕРТЬ ================= */

  onCollect(item) {
    const type = item.type;
    if (type === 'flashlight') {
      this.progress.side.flashlight = 'found';
      this.world.spawnBurst(item.baseX, item.baseY, 0xaee8f2, 18);
      this.audio.sfx('collectWater');
      this.ui.toast('Фонарик Гриши', 'отнеси его в хмелевую рощу', 0xaee8f2);
      this.saveGame();
      return;
    }
    if (type === 'lure') {
      this.progress.side.lure = 'found';
      this.world.spawnBurst(item.baseX, item.baseY, 0xffcf72, 18);
      this.audio.sfx('collectHoney');
      this.ui.toast('Счастливая блесна', 'Стас будет доволен', 0xffcf72);
      this.saveGame();
      return;
    }
    const meta = ITEM_INFO[type] || ITEM_INFO.hop;
    this.inventory[type] = (this.inventory[type] || 0) + 1;
    const sfx = type === 'honey' ? 'collectHoney' : type === 'water' ? 'collectWater' : type === 'hop' ? 'collectHop' : 'collectWater';
    this.world.spawnBurst(item.baseX, item.baseY, meta.color, 18);
    this.audio.sfx(sfx);
    this.ui.updateHUD();
    this.ui.toast(`${meta.name} +1`, `в сумке: ${this.inventory[type]}`, meta.color);
    if (this.progress.stage === STAGES.GATHER1 && this.inventory.baseReady()) {
      this.setStage(STAGES.BREW1, 'Ингредиенты собраны', 'чан ждёт у пивоварни', 0xffca7a);
      this.audio.sfx('checkpoint');
      this.shake(0.8, 0.3);
    } else {
      this.refreshObjective();
      this.saveGame();
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
      this.player.health = this.progress.maxHealth;
      this.progress.health = this.player.health;
      this.snapCamera();
      this.acc = 0;
      this.ui.updateHUD();
      this.ui.setFade(0.9);
      this.ui.fadeIn(0.7, () => {
        this.respawning = false;
        this.player.locked = false;
      });
    });
  }

  onPlayerDown() {
    if (this.respawning) return;
    const wasDefense = !!(this.defense && this.defense.active);
    this.respawning = true;
    this.player.locked = true;
    this.ui.setPrompt(null);
    this.audio.sfx('splash');
    this.ui.toast('Витя не удержался', 'метла выпала из рук', 0xd98f7b);
    if (wasDefense) {
      for (const e of this.enemies) {
        if (e.container && e.container.parent) e.container.parent.removeChild(e.container);
      }
      this.enemies = [];
      this.defense = null;
      this.pendingDefense = 0;
    }
    this.ui.fadeOut(0.55, () => {
      this.player.respawn(5640, 600);
      this.player.health = this.progress.maxHealth;
      this.progress.health = this.player.health;
      this.checkpoint = { x: 5640, y: 600 };
      this.snapCamera();
      this.acc = 0;
      this.ui.updateHUD();
      this.ui.setFade(0.9);
      this.ui.fadeIn(0.7, () => {
        this.respawning = false;
        this.player.locked = false;
        if (wasDefense && this.progress.stage === STAGES.DEFENSE) {
          this.pendingDefense = 1.6;
          this.ui.toast('Ещё попытка', 'сборщики уже у ворот', 0xd98f5a);
        }
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
      this.player.health = this.progress.maxHealth;
      this.progress.health = this.player.health;
      this.snapCamera();
      this.acc = 0;
      this.ui.updateHUD();
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
    ["400 20px 'DotGothic16'", 'Дядя Витя хмель мёд вода'],
  ];
  try {
    await Promise.all(samples.map(([font, text]) => document.fonts.load(font, text)));
    await document.fonts.ready;
  } catch (e) { /* останутся системные шрифты */ }
}

(async function boot() {
  if (GRAPHICS_MODE === 'pixel') document.documentElement.classList.add('pixel-mode');
  const bootEl = document.getElementById('boot');
  const statusEl = document.getElementById('bootStatus');
  try {
    if (statusEl) statusEl.textContent = 'зажигаем фонари…';
    await waitForFonts();
    buildTextures();
    if (GRAPHICS_MODE === 'pixel' && typeof PixelArt !== 'undefined' && PixelArt.load) {
      await PixelArt.load();
    }

    if (GRAPHICS_MODE === 'pixel' && !PIXI.__pixelRoundedPatched) {
      const origRounded = PIXI.Graphics.prototype.drawRoundedRect;
      PIXI.Graphics.prototype.drawRoundedRect = function (x, y, w, h, r) {
        return this.drawRect(x, y, w, h);
      };
      PIXI.__pixelRoundedPatched = true;
      PIXI.__origRoundedRect = origRounded;
    }

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
    document.documentElement.classList.toggle('pixel-mode', GRAPHICS_MODE === 'pixel');
    game.layout();
    window.addEventListener('resize', () => game.layout());
    document.addEventListener('fullscreenchange', () => setTimeout(() => game.layout(), 80));
    window.addEventListener('beforeunload', () => game.saveGame());
    window.addEventListener('pagehide', () => game.saveGame());

    // отладочные сцены: ?debug=1&scene=play&x=1800&day=2
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === '1') {
      bootEl.style.transition = 'none';
      bootEl.style.display = 'none';
      game._debug = true;
      const scene = params.get('scene') || 'play';
      const x = parseFloat(params.get('x') || '220');
      const day = parseInt(params.get('day') || '1', 10);
      game.ui.hideTitle();
      game.ui.setFade(0);
      game.ui.dialog.visible = false;
      game.ui.narration.visible = false;
      game.state = 'play';
      game.cameraFocus = null;
      game.ui.showHUD(true);
      game.player.locked = false;
      game.player.respawn(x, 600);
      game.snapCamera();
      game.progress.day = day;
      game.world.setDay && game.world.setDay(day);
      if (day === 2) game.progress.stage = STAGES.DAY2_START;
      else if (day === 3) game.progress.stage = STAGES.DAY3_START;
      if (params.get('all') === '1' || scene === 'brew' || scene === 'defense' || scene === 'shop' || scene === 'journal') {
        game.inventory.hop = 8;
        game.inventory.honey = 8;
        game.inventory.water = 8;
        game.inventory.berries = 5;
        game.inventory.herb = 4;
        game.inventory.mushroom = 4;
        game.inventory.yeast = 3;
        game.progress.recipes = { mead: true, beer: true, festival: true };
      }
      if (params.get('rich') === '1' || scene === 'shop') game.progress.money = 50000;
      game.refreshObjective();
      game.ui.updateHUD();
      if (params.get('npc') === 'zina') {
        const npc = game.world.npcs.find(n => n.kind === 'zina');
        game.startNpcDialogue(npc);
      } else if (params.get('npc') === 'boris') {
        const npc = game.world.borisIntro || game.world.borisFinal;
        game.startNpcDialogue(npc);
      } else if (params.get('npc') === 'pavel') {
        game.progress.stage = STAGES.MILL;
        const npc = game.world.npcs.find(n => n.kind === 'pavel');
        game.player.respawn(7070, 600);
        game.snapCamera();
        game.startNpcDialogue(npc);
      } else if (params.get('npc') === 'klava') {
        game.progress.stage = STAGES.DAY3_START;
        const npc = game.world.npcs.find(n => n.kind === 'klava');
        game.player.respawn(7740, 600);
        game.snapCamera();
        game.startNpcDialogue(npc);
      }
      if (scene === 'story') {
        game.state = 'story';
        game.cameraFocus = { x: 320, y: 600 };
        game.ui.showHUD(false);
        game.ui.showNarration(INTRO_PAGES, { label: 'МЕДВЕДЕВО · НОЧЬ ПЕРВАЯ', onDone: () => game.beginPlay() });
      } else if (scene === 'brew') {
        game.progress.stage = STAGES.BREW1;
        game.player.respawn(5460, 600);
        game.snapCamera();
        game.refreshObjective();
        game.ui.showBrewing(game);
      } else if (scene === 'shop') {
        game.player.respawn(4665, 600);
        game.snapCamera();
        game.ui.showShop();
      } else if (scene === 'journal') {
        game.progress.stage = STAGES.BREW2;
        game.progress.bottles = [{ recipe: 'mead', count: 18, quality: 87 }, { recipe: 'beer', count: 24, quality: 71 }];
        game.progress.side.garden = 'growing';
        game.progress.money = 6500;
        game.progress.unlocked = { home: true, brewery: true, mill: true, village: false };
        game.ui.showJournal();
      } else if (scene === 'travel') {
        game.progress.day = 3;
        game.progress.stage = STAGES.DAY3_START;
        game.world.setDay(3);
        game.progress.unlocked = { home: true, brewery: true, mill: true, village: true };
        game.ui.updateHUD();
        game.ui.showTravel();
      } else if (scene === 'defense') {
        game.progress.stage = STAGES.DEFENSE;
        game.player.respawn(5420, 600);
        game.snapCamera();
        game.startDefense();
      } else if (scene === 'credits') {
        game.ui.setFade(0);
        game.ui.showCredits();
      } else if (scene === 'ending') {
        game.progress.debtPaid = 22000;
        game.progress.money = 12000;
        game.progress.stage = STAGES.FINALE;
        game.finishStory();
      } else if (scene === 'dialogue') {
        const npc = game.world.npcs.find(n => n.kind === 'zina');
        game.player.respawn(1450, 600);
        game.snapCamera();
        game.startNpcDialogue(npc);
      } else if (params.get('npc') === 'klava') {
        // сцена уже открыта выше
      }
      const frames = parseInt(params.get('frames') || '150', 10);
      for (let i = 0; i < frames; i++) game.update(1 / 60);
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
