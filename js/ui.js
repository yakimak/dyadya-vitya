'use strict';

/* ============================================================
   ИНТЕРФЕЙС: титул, HUD, диалоги, заставки, пауза, финал
   ============================================================ */

class UI {
  constructor(game) {
    this.game = game;
    this.dialogueActive = false;
    this.narrationActive = false;
    this.paused = false;
    this.journalActive = false;
    this.brewingActive = false;
    this.shopActive = false;
    this.travelActive = false;
    this.root = new PIXI.Container();

    this.hud = new PIXI.Container();
    this.prompt = new PIXI.Container();
    this.toastLayer = new PIXI.Container();
    this.tutorial = new PIXI.Container();
    this.dialog = new PIXI.Container();
    this.narration = new PIXI.Container();
    this.titleOverlay = new PIXI.Container();
    this.helpOverlay = new PIXI.Container();
    this.pauseOverlay = new PIXI.Container();
    this.journalOverlay = new PIXI.Container();
    this.brewingOverlay = new PIXI.Container();
    this.shopOverlay = new PIXI.Container();
    this.travelOverlay = new PIXI.Container();
    this.creditsOverlay = new PIXI.Container();
    this.fade = new PIXI.Graphics();

    this.root.addChild(this.hud);
    this.root.addChild(this.prompt);
    this.root.addChild(this.toastLayer);
    this.root.addChild(this.tutorial);
    this.root.addChild(this.dialog);
    this.root.addChild(this.narration);
    this.root.addChild(this.journalOverlay);
    this.root.addChild(this.brewingOverlay);
    this.root.addChild(this.shopOverlay);
    this.root.addChild(this.travelOverlay);
    this.root.addChild(this.titleOverlay);
    this.root.addChild(this.helpOverlay);
    this.root.addChild(this.pauseOverlay);
    this.root.addChild(this.creditsOverlay);
    this.root.addChild(this.fade);

    this.prompt.visible = false;
    this.dialog.visible = false;
    this.narration.visible = false;
    this.tutorial.visible = false;
    this.helpOverlay.visible = false;
    this.pauseOverlay.visible = false;
    this.titleOverlay.visible = false;
    this.journalOverlay.visible = false;
    this.brewingOverlay.visible = false;
    this.shopOverlay.visible = false;
    this.travelOverlay.visible = false;
    this.creditsOverlay.visible = false;

    this.toastQueue = [];
    this.toastActive = null;
    this.narrationState = null;
    this.dialogState = null;
    this.titleTime = 0;
    this.fadeTween = null;
    this.objectiveText = '';
    this.promptText = '';

    this.buildFade();
    this.buildHUD();
    this.buildPrompt();
    this.buildTutorial();
    this.buildDialogue();
    this.buildNarration();
    this.buildTitle();
    this.buildHelp();
    this.buildPause();
    this.buildJournal();
    this.buildBrewing();
    this.buildShop();
    this.buildTravel();
    this.buildCredits();

    this.fade.alpha = 0;
  }

  /* ================= ОБЩЕЕ ================= */

  buildFade() {
    this.fade.clear();
    this.fade.beginFill(0x02040a, 1);
    this.fade.drawRect(0, 0, GAME_W, GAME_H);
    this.fade.endFill();
    this.fade.alpha = 0;
  }

  setFade(a) { this.fade.alpha = U.clamp(a, 0, 1); }

  fadeOut(a, b) {
    let dur = 0.7, cb = null;
    if (typeof a === 'function') { cb = a; dur = typeof b === 'number' ? b : 0.7; }
    else { dur = typeof a === 'number' ? a : 0.7; cb = typeof b === 'function' ? b : null; }
    this.fadeTween = { from: this.fade.alpha, to: 1, t: 0, dur: Math.max(0.01, dur), cb };
  }

  fadeIn(a, b) {
    let dur = 0.8, cb = null;
    if (typeof a === 'function') { cb = a; dur = typeof b === 'number' ? b : 0.8; }
    else { dur = typeof a === 'number' ? a : 0.8; cb = typeof b === 'function' ? b : null; }
    this.fadeTween = { from: this.fade.alpha, to: 0, t: 0, dur: Math.max(0.01, dur), cb };
  }

  updateFade(dt) {
    if (!this.fadeTween) return;
    const f = this.fadeTween;
    f.t += dt;
    const k = U.clamp(f.t / f.dur, 0, 1);
    this.fade.alpha = U.lerp(f.from, f.to, U.smooth(k));
    if (k >= 1) {
      this.fadeTween = null;
      if (f.cb) f.cb();
    }
  }

  makeButton(label, w, h, primary, onClick) {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    c.addChild(bg);
    const t = makeText(label, {
      fontFamily: FONT_UI,
      fontSize: primary ? 18 : 15,
      fontWeight: primary ? '700' : '500',
      fill: primary ? 0x1b140d : 0xe8dcc4,
      letterSpacing: primary ? 2.6 : 2,
      align: 'center',
    }, 0.5);
    c.addChild(t);

    let hover = 0;
    const redraw = () => {
      bg.clear();
      if (primary) {
        bg.beginFill(0xd6ad68, 0.96);
        bg.drawRoundedRect(-w / 2, -h / 2, w, h, 9);
        bg.endFill();
        bg.lineStyle(1, 0xffe6b6, 0.7);
        bg.drawRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 7);
      } else {
        bg.beginFill(0x0d1521, 0.82);
        bg.drawRoundedRect(-w / 2, -h / 2, w, h, 7);
        bg.endFill();
        bg.lineStyle(1, 0xd8b06a, 0.35 + hover * 0.3);
        bg.drawRoundedRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 6);
      }
      c.alpha = 0.88 + hover * 0.12;
      c.scale.set(1 + hover * 0.02);
    };
    redraw();
    c.interactive = true;
    c.buttonMode = true;
    c.hitArea = new PIXI.Rectangle(-w / 2, -h / 2, w, h);
    c.on('pointerover', () => { hover = 1; redraw(); });
    c.on('pointerout', () => { hover = 0; redraw(); });
    c.on('pointerdown', (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      try { this.game.audio.init(); this.game.audio.sfx('click'); } catch (err) {}
      onClick();
    });
    c.label = t;
    c.bg = bg;
    c.baseW = w;
    return c;
  }

  /* ================= HUD ================= */

  buildHUD() {
    const h = this.hud;

    // панель ингредиентов
    const panel = new PIXI.Graphics();
    panel.beginFill(0x08101a, 0.76);
    panel.drawRoundedRect(26, 22, 356, 88, 10);
    panel.endFill();
    panel.lineStyle(1, 0xd8b06a, 0.22);
    panel.drawRoundedRect(27, 23, 354, 86, 9);
    panel.lineStyle(1, 0x8da3b8, 0.08);
    panel.drawRoundedRect(30, 26, 348, 80, 8);
    h.addChild(panel);

    const cap = makeText('ИНГРЕДИЕНТЫ', {
      fontFamily: FONT_UI, fontSize: 10, fontWeight: '700', fill: 0xb99a67, letterSpacing: 3,
    });
    cap.x = 44; cap.y = 33;
    h.addChild(cap);

    this.ingredientCounts = {};
    const defs = [['hop', 44, 'хмель'], ['honey', 154, 'мёд'], ['water', 264, 'вода']];
    for (const [type, x, name] of defs) {
      const icon = new PIXI.Graphics();
      if (type === 'hop') drawHopIcon(icon, x + 10, 76, 0.82);
      else if (type === 'honey') drawHoneyIcon(icon, x + 10, 76, 0.86);
      else drawWaterIcon(icon, x + 10, 76, 0.9);
      h.addChild(icon);

      const count = makeText('0', {
        fontFamily: FONT_UI, fontSize: 21, fontWeight: '700', fill: 0xecdfc8,
      });
      count.x = x + 28; count.y = 58;
      h.addChild(count);
      const nm = makeText(name, {
        fontFamily: FONT_UI, fontSize: 10, fontWeight: '500', fill: 0x8493a4, letterSpacing: 1.5,
      });
      nm.x = x + 28; nm.y = 79;
      h.addChild(nm);
      this.ingredientCounts[type] = count;
    }

    // сердца
    this.hearts = [];
    for (let i = 0; i < 4; i++) {
      const hg = new PIXI.Graphics();
      hg.x = 44 + i * 22;
      hg.y = 118;
      h.addChild(hg);
      this.hearts.push(hg);
    }
    // бутылки
    const bottleIcon = new PIXI.Graphics();
    drawWaterIcon(bottleIcon, 182, 126, 0.62);
    h.addChild(bottleIcon);
    this.bottleText = makeText('0', {
      fontFamily: FONT_UI, fontSize: 14, fontWeight: '700', fill: 0xe7d6b4,
    });
    this.bottleText.x = 194; this.bottleText.y = 117;
    h.addChild(this.bottleText);
    const bottleLabel = makeText('бут.', {
      fontFamily: FONT_UI, fontSize: 9, fontWeight: '500', fill: 0x8493a4, letterSpacing: 0.5,
    });
    bottleLabel.x = 207; bottleLabel.y = 122;
    h.addChild(bottleLabel);

    const objLabel = makeText('ЗАДАЧА', {
      fontFamily: FONT_UI, fontSize: 9.5, fontWeight: '700', fill: 0xb99a67, letterSpacing: 3,
    });
    objLabel.x = 30; objLabel.y = 140;
    h.addChild(objLabel);

    this.objective = makeText('', {
      fontFamily: FONT_UI, fontSize: 16, fontWeight: '500', fill: 0xd9d0bd,
      wordWrap: true, wordWrapWidth: 430, lineHeight: 21,
    });
    this.objective.x = 30; this.objective.y = 156;
    h.addChild(this.objective);

    // карточка долга
    const debt = new PIXI.Container();
    debt.x = 1004; debt.y = 18; debt.rotation = 0.028;
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.28);
    shadow.drawRoundedRect(4, 7, 244, 107, 3);
    shadow.endFill();
    debt.addChild(shadow);
    const paper = new PIXI.Sprite(buildTextures().paper);
    paper.width = 242; paper.height = 104;
    debt.addChild(paper);
    const pin = new PIXI.Graphics();
    circle(pin, 30, 4, 4, 0x7a2e24, 0.8);
    circle(pin, 29, 2, 1.2, 0xd98570, 0.7);
    debt.addChild(pin);
    const dl = makeText('ДОЛГ', {
      fontFamily: FONT_UI, fontSize: 10, fontWeight: '700', fill: 0x6b4c31, letterSpacing: 3,
    });
    dl.x = 20; dl.y = 18; debt.addChild(dl);
    this.debtAmount = makeText('47 000 ₽', {
      fontFamily: FONT_DISPLAY, fontSize: 29, fontWeight: '600', fill: 0x332318,
    });
    this.debtAmount.x = 18; this.debtAmount.y = 31; debt.addChild(this.debtAmount);
    this.moneyText = makeText('в кармане: 0 ₽', {
      fontFamily: FONT_UI, fontSize: 11.5, fontWeight: '500', fill: 0x6c5138, letterSpacing: 0.5,
    });
    this.moneyText.x = 21; this.moneyText.y = 70; debt.addChild(this.moneyText);
    this.dayText = makeText('день 1 · срок 3 дня', {
      fontFamily: FONT_UI, fontSize: 10, fontWeight: '500', fill: 0x82684b, letterSpacing: 0.5,
    });
    this.dayText.x = 21; this.dayText.y = 86; debt.addChild(this.dayText);
    const stamp = new PIXI.Graphics();
    stamp.lineStyle(1.6, 0x9c3d2f, 0.6);
    stamp.drawCircle(0, 0, 30);
    stamp.drawCircle(0, 0, 26);
    stamp.rotation = -0.17;
    stamp.x = 198; stamp.y = 48;
    debt.addChild(stamp);
    const st = makeText('СРОК', {
      fontFamily: FONT_UI, fontSize: 12, fontWeight: '700', fill: 0x9c3d2f, letterSpacing: 1.5,
    }, 0.5);
    st.rotation = -0.17; st.x = 198; st.y = 48;
    debt.addChild(st);
    h.addChild(debt);

    // подсказка управления
    this.hint = new PIXI.Container();
    const hb = new PIXI.Graphics();
    hb.beginFill(0x060b13, 0.45);
    hb.drawRoundedRect(28, 682, 790, 24, 5);
    hb.endFill();
    this.hint.addChild(hb);
    this.hintText = makeText('A / D — идти   ПРОБЕЛ — прыжок   E — действие   F — метла   TAB — журнал   T — дороги   M — звук', {
      fontFamily: FONT_UI, fontSize: 10.5, fontWeight: '500', fill: 0x9faeac, letterSpacing: 0.4,
    });
    this.hintText.x = 40; this.hintText.y = 686;
    this.hint.addChild(this.hintText);
    this.hint.alpha = 0.62;
    h.addChild(this.hint);

    this.hud.visible = false;
  }

  setObjective(text) {
    this.objectiveText = text;
    this.objective.text = text;
  }

  updateHUD() {
    const inv = this.game.inventory;
    const p = this.game.progress || { money: 0, debtPaid: 0, day: 1, health: 3, maxHealth: 3, bottles: [] };
    for (const t of ['hop', 'honey', 'water']) {
      const c = this.ingredientCounts[t];
      if (c) c.text = String(inv[t] || 0);
    }
    const hp = Math.max(0, p.health !== undefined ? p.health : 3);
    const maxHp = Math.max(3, p.maxHealth || 3);
    for (let i = 0; i < 4; i++) {
      const hg = this.hearts[i];
      if (!hg) continue;
      hg.clear();
      if (i < maxHp) drawHeart(hg, 0, 0, 15, i < hp, i < hp ? 0xc85b4f : 0x2a303a);
    }
    const bottles = this.game.countBottles ? this.game.countBottles() : 0;
    this.bottleText.text = String(bottles);
    const debtLeft = Math.max(0, DEBT_TOTAL - (p.debtPaid || 0));
    this.debtAmount.text = formatMoney(debtLeft) + ' ₽';
    this.moneyText.text = `в кармане: ${formatMoney(p.money || 0)} ₽`;
    const daysLeft = Math.max(1, 4 - (p.day || 1));
    const cityStage = ['city_order', 'city_prep', 'city_dam', 'city_deliver'].includes(p.stage);
    this.dayText.text = cityStage
      ? 'день 3 / 3 · городской заказ'
      : `день ${p.day || 1} / 3 · до срока ${daysLeft} дн.`;
    const muted = this.game.audio.muted;
    this.hintText.text = muted
      ? 'A / D — идти   ПРОБЕЛ — прыжок   E — действие   F — метла   TAB — журнал   T — дороги   M — звук выкл.'
      : 'A / D — идти   ПРОБЕЛ — прыжок   E — действие   F — метла   TAB — журнал   T — дороги   M — звук';
  }

  showHUD(v) { this.hud.visible = !!v; if (v && this.hint) this.hint.visible = true; }

  /* ================= ПОДСКАЗКА ================= */

  buildPrompt() {
    const bg = new PIXI.Graphics();
    this.prompt.addChild(bg);
    this.promptKey = new PIXI.Graphics();
    this.prompt.addChild(this.promptKey);
    this.promptTextObj = makeText('поговорить', {
      fontFamily: FONT_UI, fontSize: 14, fontWeight: '500', fill: 0xefe3ca,
    });
    this.promptTextObj.anchor.set(0, 0.5);
    this.prompt.addChild(this.promptTextObj);
    this.promptKeyLabel = makeText('E', {
      fontFamily: FONT_UI, fontSize: 13, fontWeight: '700', fill: 0x23180f,
    }, 0.5);
    this.prompt.addChild(this.promptKeyLabel);
    this.promptBg = bg;
    this.promptWidth = 0;
  }

  setPrompt(text, sx, sy) {
    if (!text) { this.prompt.visible = false; return; }
    this.prompt.visible = true;
    const label = text.replace(/^E\s*—\s*/, '');
    if (label !== this.promptText) {
      this.promptText = label;
      this.promptTextObj.text = label;
      const w = Math.max(154, this.promptTextObj.width + 74);
      this.promptWidth = w;
      const bg = this.promptBg;
      bg.clear();
      bg.beginFill(0x060b13, 0.86);
      bg.drawRoundedRect(-w / 2, -17, w, 34, 7);
      bg.endFill();
      bg.lineStyle(1, 0xd8b06a, 0.4);
      bg.drawRoundedRect(-w / 2 + 1, -16, w - 2, 32, 6);
      const key = this.promptKey;
      key.clear();
      key.beginFill(0xd8b06a, 0.92);
      key.drawRoundedRect(-w / 2 + 8, -10, 22, 20, 4);
      key.endFill();
      this.promptTextObj.x = -w / 2 + 40;
      this.promptTextObj.y = 0;
      this.promptKeyLabel.x = -w / 2 + 19;
      this.promptKeyLabel.y = 0;
    }
    this.prompt.x = U.clamp(sx, 100, GAME_W - 100);
    this.prompt.y = sy;
    this.prompt.alpha = 0.96;
  }

  /* ================= ОБУЧЕНИЕ ================= */

  buildTutorial() {
    const c = this.tutorial;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x060d16, 0.94);
    bg.drawRoundedRect(-330, -50, 660, 102, 9);
    bg.endFill();
    bg.lineStyle(1.2, 0xd8b06a, 0.5);
    bg.drawRoundedRect(-329, -49, 658, 100, 8);
    bg.endFill();
    bg.beginFill(0xd8b06a, 0.9);
    bg.drawRoundedRect(-330, -50, 5, 102, 2);
    bg.endFill();
    c.addChild(bg);

    const label = makeText('ОБУЧЕНИЕ', {
      fontFamily: FONT_UI, fontSize: 9.5, fontWeight: '700', fill: 0xb99a67, letterSpacing: 2.6,
    });
    label.x = -304; label.y = -35;
    c.addChild(label);

    const keyBg = new PIXI.Graphics();
    keyBg.beginFill(0xd8b06a, 0.94);
    keyBg.drawRoundedRect(-304, -14, 34, 34, 5);
    keyBg.endFill();
    c.addChild(keyBg);
    this.tutorialKey = makeText('F', {
      fontFamily: FONT_UI, fontSize: 17, fontWeight: '700', fill: 0x21170e,
    }, 0.5);
    this.tutorialKey.x = -287; this.tutorialKey.y = 3;
    c.addChild(this.tutorialKey);

    this.tutorialTitle = makeText('', {
      fontFamily: FONT_UI, fontSize: 16, fontWeight: '700', fill: 0xf1e5cf,
    });
    this.tutorialTitle.x = -254; this.tutorialTitle.y = -24;
    c.addChild(this.tutorialTitle);

    this.tutorialText = makeText('', {
      fontFamily: FONT_UI, fontSize: 12.5, fontWeight: '400', fill: 0xc5b9a5,
      wordWrap: true, wordWrapWidth: 545, lineHeight: 17,
    });
    this.tutorialText.x = -254; this.tutorialText.y = 1;
    c.addChild(this.tutorialText);

    this.tutorialSub = makeText('', {
      fontFamily: FONT_UI, fontSize: 10, fontWeight: '400', fill: 0x8f9b9e,
    });
    this.tutorialSub.x = -254; this.tutorialSub.y = 30;
    c.addChild(this.tutorialSub);

    c.x = 640; c.y = 300;
    c.visible = false;
    this.tutorialState = null;
  }

  showTutorial(title, text, sub, dur) {
    this.tutorialTitle.text = title || '';
    this.tutorialText.text = text || '';
    this.tutorialSub.text = sub || '';
    this.tutorial.visible = true;
    this.tutorial.alpha = 0;
    this.tutorial.x = 640;
    this.tutorial.y = 300;
    this.tutorialState = { life: 0, dur: dur || 8 };
  }

  hideTutorial() {
    this.tutorial.visible = false;
    this.tutorialState = null;
  }

  updateTutorial(dt) {
    if (!this.tutorialState || !this.tutorial.visible) return;
    const s = this.tutorialState;
    s.life += dt;
    this.tutorial.alpha = Math.min(1, s.life * 5);
    if (s.life > s.dur) {
      this.tutorial.alpha = Math.max(0, 1 - (s.life - s.dur) * 2.4);
      if (this.tutorial.alpha <= 0) this.hideTutorial();
    }
    if (this.tutorial.alpha > 0) this.tutorial.y = 300 + Math.sin(this.game.time * 1.5) * 1.2;
  }

  /* ================= ДИАЛОГ ================= */

  buildDialogue() {
    const d = this.dialog;
    d.visible = false;

    const panel = new PIXI.Graphics();
    panel.beginFill(0x070d16, 0.93);
    panel.drawRoundedRect(58, 500, 1164, 198, 10);
    panel.endFill();
    panel.lineStyle(1.4, 0xd8b06a, 0.45);
    panel.drawRoundedRect(59, 501, 1162, 196, 9);
    panel.lineStyle(1, 0x8fa1b6, 0.08);
    panel.drawRoundedRect(64, 506, 1152, 186, 7);
    // уголки
    [[74, 516], [1206, 516], [74, 682], [1206, 682]].forEach(([x, y]) => {
      panel.lineStyle(1, 0xd8b06a, 0.55);
      panel.moveTo(x - 6, y); panel.lineTo(x + 6, y); panel.moveTo(x, y - 6); panel.lineTo(x, y + 6);
    });
    d.addChild(panel);

    this.portrait = new PIXI.Sprite(portraitTexture('vitya'));
    this.portrait.anchor.set(0.5);
    this.portrait.width = this.portrait.height = 140;
    this.portrait.x = 124; this.portrait.y = 598;
    const pm = new PIXI.Graphics();
    pm.beginFill(0xffffff);
    pm.drawRoundedRect(54, 528, 140, 140, 5);
    pm.endFill();
    this.portrait.mask = pm;
    d.addChild(pm);
    d.addChild(this.portrait);

    const pf = new PIXI.Graphics();
    pf.lineStyle(1.4, 0xd8b06a, 0.5);
    pf.drawRoundedRect(53, 527, 142, 142, 6);
    pf.lineStyle(1, 0x000000, 0.25);
    pf.drawRoundedRect(48, 522, 152, 152, 8);
    d.addChild(pf);

    this.dialogName = makeText('', {
      fontFamily: FONT_DISPLAY, fontSize: 27, fontWeight: '600', fill: 0xe2bd7d, letterSpacing: 1,
    });
    this.dialogName.x = 210; this.dialogName.y = 520;
    d.addChild(this.dialogName);

    this.dialogRule = new PIXI.Graphics();
    d.addChild(this.dialogRule);

    this.dialogTextObj = makeText('', {
      fontFamily: FONT_UI, fontSize: 21, fontWeight: '400', fill: 0xe9dfcc,
      wordWrap: true, wordWrapWidth: 880, lineHeight: 29, padding: 2,
    });
    this.dialogTextObj.x = 210; this.dialogTextObj.y = 563;
    d.addChild(this.dialogTextObj);

    this.dialogHint = makeText('E — далее', {
      fontFamily: FONT_UI, fontSize: 11.5, fontWeight: '500', fill: 0x9faeac, letterSpacing: 1.4,
    });
    this.dialogHint.anchor.set(1, 0);
    this.dialogHint.x = 1196; this.dialogHint.y = 669;
    d.addChild(this.dialogHint);

    this.dialogDiamond = new PIXI.Graphics();
    this.dialogDiamond.x = 1206; this.dialogDiamond.y = 675;
    d.addChild(this.dialogDiamond);

    d.interactive = true;
    d.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    d.on('pointerdown', () => { if (this.dialogueActive) this.advanceDialogue(); });
  }

  showDialogue(lines, onDone) {
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    this.dialogState = {
      lines, index: 0, onDone, chars: 0, shown: -1, full: lines[0].text,
      speaker: lines[0].speaker || '', portrait: lines[0].portrait || this.portraitFor(lines[0].speaker),
    };
    this.dialogueActive = true;
    this.dialog.visible = true;
    this.dialog.alpha = 1;
    this.hideTutorial();
    if (this.hint) this.hint.visible = false;
    this.setDialogueLine(this.dialogState);
    this.prompt.visible = false;
  }

  portraitFor(speaker) {
    if (!speaker) return 'narrator';
    if (speaker.includes('Борисыч')) return 'boris';
    if (speaker.includes('Зина')) return 'zina';
    if (speaker.includes('Стас')) return 'stas';
    if (speaker.includes('Гриша')) return 'grisha';
    if (speaker.includes('Аркадий')) return 'arkady';
    if (speaker.includes('Витя')) return 'vitya';
    return 'narrator';
  }

  setDialogueLine(state) {
    const line = state.lines[state.index];
    state.full = line.text || '';
    state.chars = 0;
    state.shown = -1;
    state.speaker = line.speaker || '';
    const pk = line.portrait || this.portraitFor(line.speaker);
    const tex = portraitTexture(pk);
    this.portrait.texture = tex;
    this.portrait.visible = pk !== 'none';
    this.dialogName.text = line.speaker || '';
    this.dialogName.visible = !!line.speaker;
    this.dialogRule.clear();
    if (line.speaker) {
      this.dialogRule.lineStyle(1, 0xd8b06a, 0.24);
      this.dialogRule.moveTo(212, 550);
      this.dialogRule.lineTo(500, 550);
    }
    this.dialogHint.visible = false;
    this.dialogDiamond.visible = false;
    this.dialogTextObj.text = '';
  }

  advanceDialogue() {
    const s = this.dialogState;
    if (!s) return;
    if (s.shown < s.full.length - 1) {
      s.shown = s.full.length;
      this.dialogTextObj.text = s.full;
      this.dialogHint.visible = true;
      this.dialogDiamond.visible = true;
      this.game.audio.sfx('ui');
      return;
    }
    s.index++;
    if (s.index >= s.lines.length) {
      this.dialogueActive = false;
      this.dialog.visible = false;
      if (this.hint) this.hint.visible = true;
      const cb = s.onDone;
      this.dialogState = null;
      if (cb) cb();
      return;
    }
    this.setDialogueLine(s);
    this.game.audio.sfx('ui');
  }

  updateDialogue(dt) {
    const s = this.dialogState;
    if (!s) return;
    if (s.shown < s.full.length) {
      s.chars += dt * 52;
      const shown = Math.min(s.full.length, Math.floor(s.chars));
      if (shown !== s.shown) {
        if (shown > 0 && shown % 6 < 2) this.game.audio.sfx('talk');
        s.shown = shown;
        this.dialogTextObj.text = s.full.slice(0, shown);
      }
      if (shown >= s.full.length) {
        this.dialogHint.visible = true;
        this.dialogDiamond.visible = true;
      }
    }
    const pulse = 0.55 + Math.sin(this.game.time * 3) * 0.25;
    this.dialogHint.alpha = pulse;
    this.dialogDiamond.clear();
    this.dialogDiamond.lineStyle(1.2, 0xd8b06a, pulse);
    this.dialogDiamond.moveTo(0, -4); this.dialogDiamond.lineTo(4, 0); this.dialogDiamond.lineTo(0, 4); this.dialogDiamond.lineTo(-4, 0); this.dialogDiamond.closePath();
  }

  /* ================= ЗАСТАВКИ ================= */

  buildNarration() {
    const n = this.narration;
    n.visible = false;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x03060d, 0.86);
    bg.drawRect(0, 0, GAME_W, GAME_H);
    bg.endFill();
    const warm = fogSprite(900, 520, 0.18);
    warm.tint = 0x8a6a52;
    warm.x = 640; warm.y = 360;
    n.addChild(bg);
    n.addChild(warm);
    this.narrationWarm = warm;

    const halo = softGlow(0xffb668, 760, 0.07);
    halo.x = 640; halo.y = 350;
    n.addChild(halo);

    // рамка-виньетка
    const frame = new PIXI.Graphics();
    frame.lineStyle(1, 0xd8b06a, 0.18);
    frame.drawRect(70, 74, 1140, 572);
    frame.lineStyle(1, 0xd8b06a, 0.08);
    frame.drawRect(76, 80, 1128, 560);
    n.addChild(frame);

    this.narrationLabel = makeText('', {
      fontFamily: FONT_UI, fontSize: 11, fontWeight: '700', fill: 0xb99a67, letterSpacing: 4,
    }, 0.5);
    this.narrationLabel.x = 640; this.narrationLabel.y = 112;
    n.addChild(this.narrationLabel);

    const orn = new PIXI.Graphics();
    orn.lineStyle(1, 0xd8b06a, 0.32);
    orn.moveTo(550, 136); orn.lineTo(610, 136);
    orn.moveTo(670, 136); orn.lineTo(730, 136);
    orn.beginFill(0xd8b06a, 0.7);
    orn.drawCircle(640, 136, 2.2);
    orn.endFill();
    n.addChild(orn);

    this.narrationText = makeText('', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 35, fontWeight: '500',
      fill: 0xeee2ca, align: 'center', wordWrap: true, wordWrapWidth: 900, lineHeight: 48,
    }, 0.5);
    this.narrationText.x = 640; this.narrationText.y = 335;
    n.addChild(this.narrationText);

    this.narrationPage = makeText('', {
      fontFamily: FONT_UI, fontSize: 12, fontWeight: '500', fill: 0x8897a6, letterSpacing: 2,
    }, 0.5);
    this.narrationPage.x = 640; this.narrationPage.y = 596;
    n.addChild(this.narrationPage);

    this.narrationHint = makeText('E — далее', {
      fontFamily: FONT_UI, fontSize: 11, fontWeight: '500', fill: 0x9faeac, letterSpacing: 2,
    }, 0.5);
    this.narrationHint.x = 640; this.narrationHint.y = 654;
    n.addChild(this.narrationHint);

    this.narrationDots = new PIXI.Container();
    n.addChild(this.narrationDots);

    n.interactive = true;
    n.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    n.on('pointerdown', () => { if (this.narrationActive) this.advanceNarration(); });
  }

  showNarration(pages, options) {
    options = options || {};
    this.narrationState = {
      pages, index: 0, chars: 0, shown: -1, onDone: options.onDone,
      label: options.label || 'МЕДВЕДЕВО · НОЧЬ ПЕРВАЯ',
      warm: options.warm || false,
    };
    this.narrationActive = true;
    this.narration.visible = true;
    this.narration.alpha = 1;
    this.narrationLabel.text = this.narrationState.label;
    this.narrationText.style.fill = options.warm ? 0xf3ddba : 0xeee2ca;
    this.narrationWarm.alpha = options.warm ? 0.28 : 0.12;
    this.setNarrationPage(0);
  }

  setNarrationPage(index) {
    const s = this.narrationState;
    s.index = index;
    s.chars = 0;
    s.shown = -1;
    this.narrationText.text = '';
    this.narrationPage.text = `${index + 1} / ${s.pages.length}`;
    this.narrationHint.visible = false;
    this.narrationDots.removeChildren();
    for (let i = 0; i < s.pages.length; i++) {
      const d = new PIXI.Graphics();
      d.beginFill(0xd8b06a, i === index ? 0.8 : 0.22);
      d.drawCircle(-((s.pages.length - 1) * 9) / 2 + i * 9 + 640, 622, i === index ? 2.6 : 1.8);
      d.endFill();
      this.narrationDots.addChild(d);
    }
  }

  advanceNarration() {
    const s = this.narrationState;
    if (!s) return;
    const full = s.pages[s.index];
    if (s.shown < full.length) {
      s.shown = full.length;
      this.narrationText.text = full;
      this.narrationHint.visible = true;
      this.game.audio.sfx('ui');
      return;
    }
    if (s.index + 1 >= s.pages.length) {
      this.narrationActive = false;
      this.narration.visible = false;
      const cb = s.onDone;
      this.narrationState = null;
      if (cb) cb();
      return;
    }
    this.setNarrationPage(s.index + 1);
    this.game.audio.sfx('ui');
  }

  updateNarration(dt) {
    const s = this.narrationState;
    if (!s) return;
    const full = s.pages[s.index] || '';
    if (s.shown < full.length) {
      s.chars += dt * 42;
      const shown = Math.min(full.length, Math.floor(s.chars));
      if (shown !== s.shown) {
        s.shown = shown;
        this.narrationText.text = full.slice(0, shown);
      }
      if (shown >= full.length) this.narrationHint.visible = true;
    }
    this.narrationHint.alpha = 0.68 + Math.sin(this.game.time * 3) * 0.16;
  }

  /* ================= ТИТУЛ ================= */

  buildTitle() {
    const t = this.titleOverlay;
    t.visible = false;

    const grad = canvasTexture(GAME_W, GAME_H, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(3,6,12,.88)');
      g.addColorStop(0.4, 'rgba(3,6,12,.55)');
      g.addColorStop(0.72, 'rgba(3,6,12,.30)');
      g.addColorStop(1, 'rgba(3,6,12,.78)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const r = ctx.createRadialGradient(640, 300, 40, 640, 300, 520);
      r.addColorStop(0, 'rgba(255,181,94,.10)');
      r.addColorStop(0.6, 'rgba(255,150,70,.03)');
      r.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
    });
    const bg = new PIXI.Sprite(grad);
    t.addChild(bg);

    const glow = softGlow(0xffb45e, 500, 0.16);
    glow.x = 640; glow.y = 245;
    t.addChild(glow);
    this.titleGlow = glow;

    const eyebrow = makeText('ИСТОРИЯ В ТРЁХ ДЕЙСТВИЯХ', {
      fontFamily: FONT_UI, fontSize: 11, fontWeight: '700', fill: 0xc6a674, letterSpacing: 5,
    }, 0.5);
    eyebrow.x = 640; eyebrow.y = 122;
    t.addChild(eyebrow);

    const shadow = makeText('ДЯДЯ ВИТЯ', {
      fontFamily: FONT_DISPLAY, fontSize: 104, fontWeight: '600', fill: 0x000000,
      letterSpacing: 5,
    }, 0.5);
    shadow.x = 645; shadow.y = 207;
    shadow.alpha = 0.55;
    t.addChild(shadow);

    const title = makeText('ДЯДЯ ВИТЯ', {
      fontFamily: FONT_DISPLAY, fontSize: 104, fontWeight: '600', fill: 0xf2e5cc,
      letterSpacing: 5,
    }, 0.5);
    title.x = 640; title.y = 200;
    t.addChild(title);
    this.titleText = title;

    const sub = makeText('и тихий берег', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 42, fontWeight: '500',
      fill: 0xd6b582, letterSpacing: 1,
    }, 0.5);
    sub.x = 640; sub.y = 287;
    t.addChild(sub);

    const rule = new PIXI.Graphics();
    rule.lineStyle(1, 0xd8b06a, 0.4);
    rule.moveTo(455, 330); rule.lineTo(610, 330);
    rule.moveTo(670, 330); rule.lineTo(825, 330);
    rule.beginFill(0xd8b06a, 0.8); rule.drawCircle(640, 330, 2.4); rule.endFill();
    t.addChild(rule);

    const tag = makeText('пять глав · один долг · сорок семь тысяч', {
      fontFamily: FONT_UI, fontSize: 13.5, fontWeight: '500', fill: 0xaeb6b8, letterSpacing: 2.6,
    }, 0.5);
    tag.x = 640; tag.y = 356;
    t.addChild(tag);

    const startBtn = this.makeButton('НАЧАТЬ ИСТОРИЮ', 292, 56, true, () => {
      this.game.startNewGame();
    });
    startBtn.x = 640; startBtn.y = 460;
    t.addChild(startBtn);
    this.startBtn = startBtn;

    const continueBtn = this.makeButton('ПРОДОЛЖИТЬ', 292, 50, false, () => {
      this.game.continueGame();
    });
    continueBtn.x = 640; continueBtn.y = 448;
    continueBtn.visible = false;
    t.addChild(continueBtn);
    this.continueBtn = continueBtn;

    const helpBtn = this.makeButton('УПРАВЛЕНИЕ', 210, 44, false, () => {
      this.openHelp();
    });
    helpBtn.x = 640; helpBtn.y = 530;
    t.addChild(helpBtn);
    this.helpBtn = helpBtn;

    const note = makeText('Наденьте наушники. Здесь важна тишина.', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 16, fill: 0x8e9aa4,
    }, 0.5);
    note.x = 640; note.y = 610;
    t.addChild(note);
    this.titleNote = note;

    const credit = makeText('PixiJS · Howler · музыка и атмосфера: ncase/wbwwb (CC0)', {
      fontFamily: FONT_UI, fontSize: 10, fontWeight: '500', fill: 0x6e7c88, letterSpacing: 1.2,
    }, 0.5);
    credit.x = 640; credit.y = 678;
    t.addChild(credit);

    // парящие пылинки на титуле
    this.titleMotes = [];
    const rng = mulberry32(510);
    for (let i = 0; i < 22; i++) {
      const s = glowSprite(i % 3 ? 0xffd99a : 0x9fc6d8, 3 + rng() * 7, 0.2 + rng() * 0.4);
      s.x = rng() * 1280; s.y = rng() * 720;
      s.baseX = s.x; s.baseY = s.y;
      s.ph = rng() * TAU;
      s.sp = 0.15 + rng() * 0.35;
      t.addChild(s);
      this.titleMotes.push(s);
    }
  }

  showTitle() {
    this.titleOverlay.visible = true;
    this.titleOverlay.alpha = 1;
    this.hud.visible = false;
    this.prompt.visible = false;
    this.dialog.visible = false;
    this.creditsOverlay.visible = false;
    this.narration.visible = false;
    this.titleTime = 0;

    const info = this.game.getSaveInfo ? this.game.getSaveInfo() : null;
    const hasSave = !!info;
    this.continueBtn.visible = hasSave;
    if (hasSave) {
      this.continueBtn.label.text = `ПРОДОЛЖИТЬ · ДЕНЬ ${info.day || 1}`;
      this.continueBtn.y = 446;
      this.startBtn.label.text = 'НОВАЯ ИСТОРИЯ';
      this.startBtn.y = 508;
      this.helpBtn.y = 568;
      this.titleNote.y = 616;
    } else {
      this.startBtn.label.text = 'НАЧАТЬ ИСТОРИЮ';
      this.startBtn.y = 460;
      this.helpBtn.y = 530;
      this.titleNote.y = 610;
    }
  }

  hideTitle() { this.titleOverlay.visible = false; }

  openHelp() {
    this.helpOverlay.visible = true;
  }

  /* ================= ПОМОЩЬ ================= */

  buildHelp() {
    const h = this.helpOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050c, 0.82);
    bg.drawRect(0, 0, GAME_W, GAME_H);
    bg.endFill();
    h.addChild(bg);
    const panel = new PIXI.Graphics();
    panel.beginFill(0x09111c, 0.96);
    panel.drawRoundedRect(320, 120, 640, 480, 12);
    panel.endFill();
    panel.lineStyle(1.2, 0xd8b06a, 0.4);
    panel.drawRoundedRect(321, 121, 638, 478, 11);
    h.addChild(panel);

    const title = makeText('УПРАВЛЕНИЕ', {
      fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: '600', fill: 0xe3c48d, letterSpacing: 3,
    }, 0.5);
    title.x = 640; title.y = 174;
    h.addChild(title);

    const rule = new PIXI.Graphics();
    rule.lineStyle(1, 0xd8b06a, 0.3);
    rule.moveTo(520, 201); rule.lineTo(760, 201);
    h.addChild(rule);

    const lines = [
      ['A / D', 'идти влево и вправо'],
      ['ПРОБЕЛ', 'прыжок'],
      ['E', 'говорить, читать, варить'],
      ['F', 'удар метлой'],
      ['TAB', 'журнал и рецепты'],
      ['T', 'быстрые переходы'],
      ['R', 'вернуться к последнему фонарю'],
      ['ESC / M', 'пауза · звук'],
    ];
    let y = 216;
    for (const [key, text] of lines) {
      const k = makeText(key, {
        fontFamily: FONT_UI, fontSize: 14, fontWeight: '700', fill: 0xe0c08a, letterSpacing: 1,
      });
      k.x = 390; k.y = y;
      h.addChild(k);
      const v = makeText(text, {
        fontFamily: FONT_UI, fontSize: 15, fontWeight: '400', fill: 0xd5cbb9,
      });
      v.x = 540; v.y = y;
      h.addChild(v);
      y += 33;
    }

    const goal = makeText('ЦЕЛЬ: собрать хмель, мёд и воду, сварить медовуху и расплатиться с долгом.', {
      fontFamily: FONT_UI, fontSize: 14, fontWeight: '500', fill: 0xaeb6b8,
      wordWrap: true, wordWrapWidth: 520, lineHeight: 20,
    });
    goal.x = 380; goal.y = 466;
    h.addChild(goal);

    const btn = this.makeButton('ПОНЯТНО', 190, 42, true, () => {
      this.helpOverlay.visible = false;
    });
    btn.x = 640; btn.y = 550;
    h.addChild(btn);

    h.interactive = true;
    h.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    h.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
  }

  /* ================= ПАУЗА ================= */

  buildPause() {
    const p = this.pauseOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050c, 0.72);
    bg.drawRect(0, 0, GAME_W, GAME_H);
    bg.endFill();
    p.addChild(bg);

    const panel = new PIXI.Graphics();
    panel.beginFill(0x09111c, 0.97);
    panel.drawRoundedRect(430, 190, 420, 330, 12);
    panel.endFill();
    panel.lineStyle(1.2, 0xd8b06a, 0.42);
    panel.drawRoundedRect(431, 191, 418, 328, 11);
    p.addChild(panel);

    const title = makeText('ПАУЗА', {
      fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: '600', fill: 0xe3c48d, letterSpacing: 5,
    }, 0.5);
    title.x = 640; title.y = 246;
    p.addChild(title);

    const sub = makeText('Тихий берег никуда не денется.', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 17, fill: 0x95a3af,
    }, 0.5);
    sub.x = 640; sub.y = 288;
    p.addChild(sub);

    const resume = this.makeButton('ПРОДОЛЖИТЬ', 230, 46, true, () => this.game.togglePause(false));
    resume.x = 640; resume.y = 350;
    p.addChild(resume);

    const restart = this.makeButton('НАЧАТЬ ЗАНОВО', 230, 42, false, () => {
      this.game.togglePause(false);
      this.game.restart();
    });
    restart.x = 640; restart.y = 410;
    p.addChild(restart);

    this.pauseMute = this.makeButton('ВЫКЛЮЧИТЬ ЗВУК', 230, 42, false, () => {
      this.game.toggleMute();
      this.pauseMute.label.text = this.game.audio.muted ? 'ВКЛЮЧИТЬ ЗВУК' : 'ВЫКЛЮЧИТЬ ЗВУК';
    });
    this.pauseMute.x = 640; this.pauseMute.y = 466;
    p.addChild(this.pauseMute);

    const hint = makeText('ESC — вернуться', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x7d8b98, letterSpacing: 1.5,
    }, 0.5);
    hint.x = 640; hint.y = 508;
    p.addChild(hint);

    p.interactive = true;
    p.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    p.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
  }

  showPause(v) {
    this.paused = v;
    this.pauseOverlay.visible = v;
    this.pauseMute.label.text = this.game.audio.muted ? 'ВКЛЮЧИТЬ ЗВУК' : 'ВЫКЛЮЧИТЬ ЗВУК';
  }

  /* ================= ЖУРНАЛ ================= */

  buildJournal() {
    const j = this.journalOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050b, 0.85);
    bg.drawRect(0, 0, GAME_W, GAME_H);
    bg.endFill();
    j.addChild(bg);
    const panel = new PIXI.Graphics();
    panel.beginFill(0x08101a, 0.97);
    panel.drawRoundedRect(90, 42, 1100, 636, 12);
    panel.endFill();
    panel.lineStyle(1.3, 0xd8b06a, 0.45);
    panel.drawRoundedRect(91, 43, 1098, 634, 11);
    panel.lineStyle(1, 0x8fa1b6, 0.09);
    panel.drawRoundedRect(97, 49, 1086, 622, 9);
    j.addChild(panel);

    const title = makeText('ДНЕВНИК', {
      fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '600', fill: 0xe3c48d, letterSpacing: 4,
    }, 0.5);
    title.x = 640; title.y = 80;
    j.addChild(title);
    const sub = makeText('Tab — закрыть   ·   всё, что Витя помнит и должен', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x8c9aa6, letterSpacing: 1.4,
    }, 0.5);
    sub.x = 640; sub.y = 108;
    j.addChild(sub);

    this.journalContent = new PIXI.Container();
    j.addChild(this.journalContent);

    const close = this.makeButton('ЗАКРЫТЬ', 180, 38, false, () => this.hideJournal());
    close.x = 640; close.y = 638;
    j.addChild(close);

    j.interactive = true;
    j.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    j.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
    j.visible = false;
  }

  showJournal() {
    this.journalActive = true;
    this.journalOverlay.visible = true;
    if (this.game.refreshObjective) this.game.refreshObjective();
    this.renderJournal();
    this.game.audio.sfx('ui');
  }

  hideJournal() {
    this.journalActive = false;
    this.journalOverlay.visible = false;
  }

  journalText(str, x, y, opts) {
    const t = makeText(str, Object.assign({
      fontFamily: FONT_UI, fontSize: 13.5, fontWeight: '400', fill: 0xd9d0bd,
      wordWrap: true, wordWrapWidth: 310, lineHeight: 19,
    }, opts || {}));
    t.x = x; t.y = y;
    this.journalContent.addChild(t);
    return t;
  }

  journalHeader(str, x, y) {
    return this.journalText(str, x, y, {
      fontFamily: FONT_UI, fontSize: 10, fontWeight: '700', fill: 0xb99a67,
      letterSpacing: 2.4, wordWrap: false,
    });
  }

  renderJournal() {
    while (this.journalContent.children.length) {
      const c = this.journalContent.children[0];
      this.journalContent.removeChild(c);
      c.destroy();
    }
    const g = this.game;
    const p = g.progress || {};
    const day = DAY_INFO[p.day] || DAY_INFO[1];
    const inv = g.inventory || {};
    const remaining = Math.max(0, DEBT_TOTAL - (p.debtPaid || 0));

    this.journalText(`ДЕНЬ ${p.day || 1} ИЗ 3  ·  ${day.label.toUpperCase()}`, 120, 136, {
      fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '600', fill: 0xe2c48f,
      letterSpacing: 1, wordWrap: false,
    });

    // левая колонка — задачи
    this.journalHeader('ГЛАВНОЕ', 120, 178);
    this.journalText(g.objectiveText || (g.ui && g.ui.objective && g.ui.objective.text) || '', 120, 198, {
      fontSize: 14.5, fill: 0xeee4d2, wordWrapWidth: 310, lineHeight: 20,
    });

    this.journalHeader('ПОРУЧЕНИЯ', 120, 272);
    const sides = g.getSideQuestLines ? g.getSideQuestLines() : [];
    let sy = 292;
    if (!sides.length) {
      this.journalText('Пока тихо. Поговори с людьми — у каждого своя забота.', 120, sy, {
        fill: 0x8c9aa6, fontSize: 12.5, wordWrapWidth: 310,
      });
    } else {
      for (const line of sides) {
        this.journalText('— ' + line, 120, sy, { fontSize: 12.5, fill: 0xc6cdc7, wordWrapWidth: 310 });
        sy += 38;
      }
    }

    this.journalHeader('ПОДСКАЗКА', 120, 540);
    this.journalText('F — метла. Вороны в лесу воруют припасы. Сборщиков у пивоварни лучше встречать с метлой.', 120, 560, {
      fontSize: 12, fill: 0x8e9da8, wordWrapWidth: 310, lineHeight: 17,
    });

    // средняя — рецепты и бутылки
    this.journalHeader('ВАРКА', 460, 178);
    let ry = 198;
    for (const key of ['mead', 'beer', 'festival', 'stout']) {
      const r = RECIPES[key];
      const unlocked = !!(p.recipes && p.recipes[key]);
      this.journalText(unlocked ? r.name : '??? — рецепт ещё не найден', 460, ry, {
        fontSize: 14, fill: unlocked ? 0xe8d7b7 : 0x69737c, fontWeight: '500', wordWrapWidth: 320,
      });
      const ing = Object.entries(r.ingredients).map(([k, v]) => `${ITEM_INFO[k].short} ×${v}`).join(' · ');
      this.journalText(unlocked ? `${ing}  →  ${r.bottles} бут.` : 'Нужно найти человека, который помнит рецепт.', 460, ry + 22, {
        fontSize: 11.5, fill: unlocked ? 0x9fb0a9 : 0x5f6971, wordWrapWidth: 330, lineHeight: 16,
      });
      ry += 48;
    }

    this.journalHeader('БУТЫЛКИ', 460, 402);
    let by = 422;
    const batches = p.bottles || [];
    if (!batches.length) {
      this.journalText('Пусто. Пора варить.', 460, by, { fontSize: 12.5, fill: 0x8c9aa6 });
    } else {
      for (const b of batches) {
        this.journalText(`${RECIPES[b.recipe].short} ×${b.count}  ·  качество ${b.quality}`, 460, by, {
          fontSize: 12.5, fill: 0xd6c29d, wordWrapWidth: 320,
        });
        by += 21;
      }
    }
    this.journalText(`Всего: ${g.countBottles ? g.countBottles() : 0} бут.`, 460, Math.max(by + 8, 520), {
      fontSize: 12.5, fill: 0x9fb0a9, fontWeight: '700',
    });

    // правая — деньги и запасы
    this.journalHeader('ДЕНЬГИ', 820, 178);
    this.journalText(`В кармане: ${formatMoney(p.money || 0)} ₽`, 820, 198, {
      fontSize: 14, fill: 0xe4d3b2, wordWrapWidth: 300,
    });
    this.journalText(`Долг: ${formatMoney(remaining)} ₽ из 47 000 ₽`, 820, 222, {
      fontSize: 14, fill: 0xe4d3b2, wordWrapWidth: 300,
    });
    this.journalText(`Репутация: ${p.reputation || 20} / 100`, 820, 246, {
      fontSize: 12.5, fill: 0xaeb9bd, wordWrapWidth: 300,
    });

    this.journalHeader('ЗАПАСЫ', 820, 286);
    let iy = 306;
    for (const key of ['hop', 'honey', 'water', 'berries', 'mushroom', 'herb', 'yeast']) {
      const info = ITEM_INFO[key];
      this.journalText(`${info.name}: ${inv[key] || 0}`, 820, iy, {
        fontSize: 12.5, fill: 0xc9d0c9, wordWrapWidth: 300,
      });
      iy += 21;
    }

    this.journalHeader('УЛУЧШЕНИЯ', 820, 468);
    let uy = 488;
    const up = p.upgrades || {};
    for (const key of ['boots', 'kettle', 'lamp']) {
      const u = UPGRADES[key];
      this.journalText((up[key] ? '✓ ' : '· ') + u.name, 820, uy, {
        fontSize: 12.5, fill: up[key] ? 0xbcd0a5 : 0x6f7a82, wordWrapWidth: 300,
      });
      uy += 21;
    }
    this.journalText('Сердце: ' + (p.health || 3) + ' / ' + (p.maxHealth || 3), 820, 558, {
      fontSize: 12.5, fill: 0xaeb9bd,
    });
  }

  /* ================= ВАРКА ================= */

  buildBrewing() {
    const b = this.brewingOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050b, 0.88);
    bg.drawRect(0, 0, GAME_W, GAME_H);
    bg.endFill();
    b.addChild(bg);
    const panel = new PIXI.Graphics();
    panel.beginFill(0x08101a, 0.98);
    panel.drawRoundedRect(140, 45, 1000, 620, 12);
    panel.endFill();
    panel.lineStyle(1.3, 0xd8b06a, 0.45);
    panel.drawRoundedRect(141, 46, 998, 618, 11);
    b.addChild(panel);

    const title = makeText('ВАРКА', {
      fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: '600', fill: 0xe3c48d, letterSpacing: 5,
    }, 0.5);
    title.x = 640; title.y = 86;
    b.addChild(title);
    const sub = makeText('медный чан · хмель · мёд · вода', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x8c9aa6, letterSpacing: 2,
    }, 0.5);
    sub.x = 640; sub.y = 112;
    b.addChild(sub);

    // строки рецептов
    this.brewRows = {};
    const keys = ['mead', 'beer', 'festival', 'stout'];
    keys.forEach((key, i) => {
      const row = new PIXI.Container();
      row.x = 180; row.y = 150 + i * 87;
      const rowBg = new PIXI.Graphics();
      row.addChild(rowBg);
      const name = makeText('', {
        fontFamily: FONT_UI, fontSize: 15, fontWeight: '700', fill: 0xe7d7b8,
        wordWrap: true, wordWrapWidth: 310,
      });
      name.x = 16; name.y = 12;
      row.addChild(name);
      const ing = makeText('', {
        fontFamily: FONT_UI, fontSize: 11.5, fontWeight: '400', fill: 0x9fb0a9,
        wordWrap: true, wordWrapWidth: 320, lineHeight: 16,
      });
      ing.x = 16; ing.y = 37;
      row.addChild(ing);
      const count = makeText('', {
        fontFamily: FONT_UI, fontSize: 11, fontWeight: '500', fill: 0x8f9d96,
      });
      count.x = 16; count.y = 62;
      row.addChild(count);
      row.interactive = true;
      row.buttonMode = true;
      row.hitArea = new PIXI.Rectangle(0, 0, 360, 82);
      row.on('pointerdown', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (this.brewingActive && this.brew && this.brew.phase === 'select') {
          this.brew.selected = key;
          this.brew.selected = key;
          this.renderBrewRecipes();
          this.game.audio.sfx('ui');
        }
      });
      b.addChild(row);
      this.brewRows[key] = { row, rowBg, name, ing, count };
    });

    this.brewSelectGroup = new PIXI.Container();
    this.brewProcessGroup = new PIXI.Container();
    this.brewResultGroup = new PIXI.Container();
    b.addChild(this.brewSelectGroup, this.brewProcessGroup, this.brewResultGroup);

    this.brewRecipeName = makeText('', {
      fontFamily: FONT_DISPLAY, fontSize: 27, fontWeight: '600', fill: 0xe5c897,
      wordWrap: true, wordWrapWidth: 380, lineHeight: 31,
    });
    this.brewRecipeName.x = 590; this.brewRecipeName.y = 156;
    this.brewSelectGroup.addChild(this.brewRecipeName);
    this.brewRecipeIngredients = makeText('', {
      fontFamily: FONT_UI, fontSize: 13, fontWeight: '400', fill: 0xaebcae,
      wordWrap: true, wordWrapWidth: 390, lineHeight: 19,
    });
    this.brewRecipeIngredients.x = 590; this.brewRecipeIngredients.y = 220;
    this.brewSelectGroup.addChild(this.brewRecipeIngredients);
    this.brewRecipeDesc = makeText('', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 18, fill: 0xb8ad96,
      wordWrap: true, wordWrapWidth: 390, lineHeight: 24,
    });
    this.brewRecipeDesc.x = 590; this.brewRecipeDesc.y = 285;
    this.brewSelectGroup.addChild(this.brewRecipeDesc);
    this.brewRecipeProcess = makeText('', {
      fontFamily: FONT_UI, fontSize: 10.5, fontWeight: '500', fill: 0x9d8a6d,
      wordWrap: true, wordWrapWidth: 400, lineHeight: 15,
    });
    this.brewRecipeProcess.x = 590; this.brewRecipeProcess.y = 345;
    this.brewSelectGroup.addChild(this.brewRecipeProcess);
    this.brewSelectHint = makeText('↑ / ↓ — выбрать   ·   ПРОБЕЛ — варить   ·   ESC — выйти', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x7f8d98, letterSpacing: 1.2,
    });
    this.brewSelectHint.x = 590; this.brewSelectHint.y = 535;
    this.brewSelectGroup.addChild(this.brewSelectHint);
    this.brewMissing = makeText('', {
      fontFamily: FONT_UI, fontSize: 12.5, fill: 0xd98f7b,
    });
    this.brewMissing.x = 590; this.brewMissing.y = 563;
    this.brewSelectGroup.addChild(this.brewMissing);

    // процесс
    this.brewStepNum = makeText('', {
      fontFamily: FONT_UI, fontSize: 10.5, fontWeight: '700', fill: 0xb99a67, letterSpacing: 2.8,
    }, 0.5);
    this.brewStepNum.x = 840; this.brewStepNum.y = 160;
    this.brewProcessGroup.addChild(this.brewStepNum);
    this.brewStageName = makeText('', {
      fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '600', fill: 0xe5c897, letterSpacing: 3,
    }, 0.5);
    this.brewStageName.x = 840; this.brewStageName.y = 188;
    this.brewProcessGroup.addChild(this.brewStageName);
    this.brewStageHint = makeText('', {
      fontFamily: FONT_UI, fontSize: 14, fill: 0xb8c3bc,
      wordWrap: true, wordWrapWidth: 520, align: 'center', lineHeight: 18,
    }, 0.5);
    this.brewStageHint.x = 840; this.brewStageHint.y = 224;
    this.brewProcessGroup.addChild(this.brewStageHint);
    this.brewBarG = new PIXI.Graphics();
    this.brewProcessGroup.addChild(this.brewBarG);
    this.brewGaugeText = makeText('', {
      fontFamily: FONT_UI, fontSize: 13, fontWeight: '500', fill: 0xd8c7a9,
    }, 0.5);
    this.brewGaugeText.x = 840; this.brewGaugeText.y = 370;
    this.brewProcessGroup.addChild(this.brewGaugeText);
    this.brewFeedback = makeText('', {
      fontFamily: FONT_UI, fontSize: 16, fontWeight: '700', fill: 0xe0c889,
    }, 0.5);
    this.brewFeedback.x = 840; this.brewFeedback.y = 405;
    this.brewProcessGroup.addChild(this.brewFeedback);
    this.brewProcessHint = makeText('ПРОБЕЛ — остановить метку в зелёной зоне', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x7f8d98, letterSpacing: 1.1,
    }, 0.5);
    this.brewProcessHint.x = 840; this.brewProcessHint.y = 442;
    this.brewProcessGroup.addChild(this.brewProcessHint);

    // результат
    this.brewResultTitle = makeText('', {
      fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: '600', fill: 0xe5c897, letterSpacing: 1,
    }, 0.5);
    this.brewResultTitle.x = 840; this.brewResultTitle.y = 190;
    this.brewResultGroup.addChild(this.brewResultTitle);
    this.brewResultQuality = makeText('', {
      fontFamily: FONT_DISPLAY, fontSize: 64, fontWeight: '600', fill: 0xf0d39c,
    }, 0.5);
    this.brewResultQuality.x = 840; this.brewResultQuality.y = 275;
    this.brewResultGroup.addChild(this.brewResultQuality);
    this.brewResultLabel = makeText('качество', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x8f9d96, letterSpacing: 3,
    }, 0.5);
    this.brewResultLabel.x = 840; this.brewResultLabel.y = 318;
    this.brewResultGroup.addChild(this.brewResultLabel);
    this.brewResultInfo = makeText('', {
      fontFamily: FONT_UI, fontSize: 15, fill: 0xd6c7ac, align: 'center',
      wordWrap: true, wordWrapWidth: 420, lineHeight: 22,
    }, 0.5);
    this.brewResultInfo.x = 840; this.brewResultInfo.y = 365;
    this.brewResultGroup.addChild(this.brewResultInfo);
    this.brewResultHint = makeText('ПРОБЕЛ — забрать бутылки', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x7f8d98, letterSpacing: 1.2,
    }, 0.5);
    this.brewResultHint.x = 840; this.brewResultHint.y = 448;
    this.brewResultGroup.addChild(this.brewResultHint);

    this.brewActionBtn = this.makeButton('ВАРИТЬ', 210, 44, true, () => this.brewAction());
    this.brewActionBtn.x = 835; this.brewActionBtn.y = 610;
    b.addChild(this.brewActionBtn);
    this.brewCloseBtn = this.makeButton('ЗАКРЫТЬ', 170, 40, false, () => this.closeBrewing());
    this.brewCloseBtn.x = 410; this.brewCloseBtn.y = 610;
    b.addChild(this.brewCloseBtn);

    b.interactive = true;
    b.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    b.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
    b.visible = false;
  }

  showBrewing(game) {
    this.brewingActive = true;
    this.brewingOverlay.visible = true;
    this.hideTutorial();
    const unlocked = Object.keys(RECIPES).filter(k => game.progress.recipes[k]);
    this.brew = {
      phase: 'select',
      selected: unlocked[0] || 'mead',
      stepIdx: 0,
      steps: null,
      step: null,
      score: 0,
      stepScore: 0,
      marker: 0.06,
      dir: 1,
      value: 0.5,
      timeLeft: 0,
      inZone: 0,
      hitsDone: 0,
      result: null,
    };
    this.brewSelectGroup.visible = true;
    this.brewProcessGroup.visible = false;
    this.brewResultGroup.visible = false;
    this.brewCloseBtn.visible = true;
    this.brewActionBtn.label.text = 'ВАРИТЬ';
    this.brewActionBtn.alpha = 1;
    this.renderBrewRecipes();
    this.game.audio.sfx('ui');
  }

  closeBrewing() {
    if (!this.brewingActive) return;
    if (this.brew && (this.brew.phase === 'process' || this.brew.phase === 'result')) return;
    this.brewingActive = false;
    this.brewingOverlay.visible = false;
    this.brew = null;
    this.game.player.locked = false;
    this.game.ui.setPrompt(null);
  }

  renderBrewRecipes() {
    if (!this.brew) return;
    for (const key of ['mead', 'beer', 'festival', 'stout']) {
      const r = RECIPES[key];
      const ui = this.brewRows[key];
      if (!ui) continue;
      const unlocked = !!this.game.progress.recipes[key];
      const selected = this.brew.selected === key;
      const can = unlocked && this.game.canBrew(key);
      ui.rowBg.clear();
      ui.rowBg.beginFill(selected ? 0x1c2a38 : 0x0b141f, selected ? 0.95 : 0.6);
      ui.rowBg.drawRoundedRect(0, 0, 360, 82, 8);
      ui.rowBg.endFill();
      ui.rowBg.lineStyle(1, selected ? 0xd8b06a : 0x7f8fa0, selected ? 0.6 : 0.14);
      ui.rowBg.drawRoundedRect(1, 1, 358, 80, 7);
      ui.row.alpha = unlocked ? 1 : 0.48;
      ui.name.text = unlocked ? r.short : '??? — рецепт не найден';
      const ing = Object.entries(r.ingredients).map(([k, v]) => `${ITEM_INFO[k].short} ×${v}`).join(' · ');
      ui.ing.text = unlocked ? ing : 'Расспроси людей. Кто-то помнит, как варил твой отец.';
      ui.count.text = unlocked ? `${r.bottles} бут.  ·  ${r.steps.length} этапа  ·  ${can ? 'можно варить' : 'не хватает припасов'}` : 'закрыто';
      ui.count.style.fill = can ? 0x9fc0a1 : 0x8f7c70;
    }
    const r = RECIPES[this.brew.selected];
    const unlocked = !!this.game.progress.recipes[this.brew.selected];
    this.brewRecipeName.text = unlocked ? r.name : 'Рецепт ещё не найден';
    this.brewRecipeIngredients.text = unlocked
      ? Object.entries(r.ingredients).map(([k, v]) => `${ITEM_INFO[k].name} ×${v}   (есть ${this.game.inventory[k] || 0})`).join('\n')
      : 'Старые рецепты живут в памяти людей. Иногда — на старой мельнице.';
    this.brewRecipeDesc.text = unlocked ? r.desc : '';
    this.brewRecipeProcess.text = unlocked ? 'ПРОЦЕСС: ' + r.steps.map(s => s.name.toLowerCase()).join(' → ') : '';
    this.brewSelectGroup.visible = true;
    this.brewProcessGroup.visible = false;
    this.brewResultGroup.visible = false;
    this.brewCloseBtn.visible = true;
    this.brewActionBtn.label.text = 'ВАРИТЬ';
    if (!unlocked) this.brewMissing.text = 'Рецепт закрыт';
    else if (!this.game.canBrew(this.brew.selected)) this.brewMissing.text = 'Не хватает ингредиентов — ищи в саду, у реки и в лесу';
    else this.brewMissing.text = '';
    this.brewActionBtn.alpha = unlocked && this.game.canBrew(this.brew.selected) ? 1 : 0.55;
  }

  selectBrewRecipe(dir) {
    if (!this.brew || this.brew.phase !== 'select') return;
    const keys = ['mead', 'beer', 'festival', 'stout'];
    let idx = keys.indexOf(this.brew.selected);
    idx = (idx + dir + keys.length) % keys.length;
    this.brew.selected = keys[idx];
    this.renderBrewRecipes();
    this.game.audio.sfx('ui');
  }

  brewAction() {
    if (!this.brew) return;
    if (this.brew.phase === 'select') {
      const key = this.brew.selected;
      if (!this.game.progress.recipes[key]) {
        this.brewMissing.text = 'Этот рецепт ещё не найден.';
        this.game.audio.sfx('deny');
        return;
      }
      if (!this.game.canBrew(key)) {
        this.brewMissing.text = 'Не хватает ингредиентов.';
        this.game.audio.sfx('deny');
        return;
      }
      this.game.consumeIngredients(key);
      const r = RECIPES[key];
      this.brew.phase = 'process';
      this.brew.steps = r.steps;
      this.brew.stepIdx = 0;
      this.brew.score = 0;
      this.brew.stepScore = 0;
      this.brewSelectGroup.visible = false;
      this.brewProcessGroup.visible = true;
      this.brewResultGroup.visible = false;
      this.brewCloseBtn.visible = false;
      this.initBrewStep();
      this.game.audio.sfx('brew');
    } else if (this.brew.phase === 'process') {
      const s = this.brew.step;
      if (!s) return;
      if (s.type === 'timing') this.hitBrewMarker();
      else if (s.type === 'balance') this.confirmBrewBalance();
      else this.brewFeedback.text = 'Держи A / D в зелёной зоне';
    } else if (this.brew.phase === 'result') {
      this.completeBrew();
    }
  }

  initBrewStep() {
    const s = this.brew.steps[this.brew.stepIdx];
    this.brew.step = s;
    this.brew.marker = 0.06;
    this.brew.dir = 1;
    this.brew.value = 0.5;
    this.brew.hitsDone = 0;
    this.brew.stepScore = 0;
    this.brew.timeLeft = s.duration || 4;
    this.brew.inZone = 0;
    this.brew.zonePulse = 0;
    this.brewStepNum.text = `ШАГ ${this.brew.stepIdx + 1} / ${this.brew.steps.length}`;
    this.brewStageName.text = s.name;
    this.brewStageHint.text = s.hint;
    this.brewFeedback.text = '';
    this.brewGaugeText.text = '';
    this.brewProcessHint.text = s.type === 'hold'
      ? 'A / D — держать в зелёной зоне'
      : s.type === 'balance'
        ? 'A / D — регулировать   ·   ПРОБЕЛ — подтвердить'
        : 'ПРОБЕЛ — добавить в нужный момент';
    this.brewActionBtn.label.text = s.type === 'timing' ? 'ДОБАВИТЬ' : s.type === 'balance' ? 'ПОДТВЕРДИТЬ' : 'ДЕРЖИ';
    this.brewActionBtn.alpha = s.type === 'hold' ? 0.55 : 1;
    this.drawBrewBar();
  }

  brewValueText(s, value) {
    if (!s.scale) return '';
    const v = s.scale[0] + value * (s.scale[1] - s.scale[0]);
    return `${v.toFixed(1)}${s.scale[2]}`;
  }

  brewTargetText(s) {
    if (!s.scale) return '';
    const lo = s.scale[0] + (s.target - s.span) * (s.scale[1] - s.scale[0]);
    const hi = s.scale[0] + (s.target + s.span) * (s.scale[1] - s.scale[0]);
    return `${lo.toFixed(0)}–${hi.toFixed(0)}${s.scale[2]}`;
  }

  drawBrewBar() {
    const g = this.brewBarG;
    const s = this.brew.step;
    if (!s) return;
    const x = 570, y = 330, w = 540, h = 22;
    g.clear();
    g.beginFill(0x050a11, 0.96);
    g.drawRoundedRect(x, y, w, h, 11);
    g.endFill();
    g.lineStyle(1, 0x9fb0b5, 0.22);
    g.drawRoundedRect(x, y, w, h, 11);
    // деления
    for (let i = 0; i <= 10; i++) {
      const tx = x + i / 10 * w;
      g.lineStyle(1, 0x9fb0b5, i % 5 === 0 ? 0.25 : 0.10);
      g.moveTo(tx, y + h + 2);
      g.lineTo(tx, y + h + (i % 5 === 0 ? 9 : 5));
    }
    const tx = x + (s.target - s.span) * w;
    const tw = s.span * 2 * w;
    g.beginFill(0x6f8f5e, 0.44);
    g.drawRoundedRect(tx, y + 1, tw, h - 2, 8);
    g.endFill();
    g.beginFill(0xa7c98d, 0.70);
    g.drawRoundedRect(tx + tw * 0.36, y + 2, tw * 0.28, h - 4, 6);
    g.endFill();
    const pos = s.type === 'timing' ? this.brew.marker : this.brew.value;
    const mx = x + pos * w;
    g.beginFill(s.type === 'hold' && Math.abs(pos - s.target) <= s.span ? 0xb9dc96 : 0xffd58a, 1);
    g.drawRoundedRect(mx - 2, y - 8, 4, h + 16, 2);
    g.endFill();
    g.beginFill(0xffe8b4, 0.55);
    g.drawCircle(mx, y - 10, 4.2);
    g.endFill();
    // точки этапов
    const total = this.brew.steps.length;
    for (let i = 0; i < total; i++) {
      const dx = 840 - (total - 1) * 9 + i * 18;
      g.beginFill(i < this.brew.stepIdx ? 0xd8b06a : i === this.brew.stepIdx ? 0xffe2ab : 0x3a444e, i <= this.brew.stepIdx ? 0.9 : 0.6);
      g.drawCircle(dx, 472, i === this.brew.stepIdx ? 3.8 : 2.8);
      g.endFill();
    }
  }

  updateBrewGaugeText() {
    const s = this.brew.step;
    if (!s) return;
    const value = s.type === 'timing' ? this.brew.marker : this.brew.value;
    if (s.type === 'hold') {
      const inZone = Math.abs(value - s.target) <= s.span;
      this.brewGaugeText.text = `${this.brewValueText(s, value)}   ·   цель ${this.brewTargetText(s)}   ·   ${Math.max(0, this.brew.timeLeft).toFixed(1)} с`;
      this.brewGaugeText.style.fill = inZone ? 0xb9dc96 : 0xd6b18d;
    } else if (s.type === 'balance') {
      const diff = Math.abs(value - s.target);
      this.brewGaugeText.text = `${this.brewValueText(s, value)}   ·   цель ${this.brewTargetText(s)}`;
      this.brewGaugeText.style.fill = diff <= s.span ? 0xb9dc96 : 0xd6b18d;
    } else {
      this.brewGaugeText.text = `добавка ${this.brew.hitsDone + 1} / ${s.hits || 1}   ·   лови момент`;
      this.brewGaugeText.style.fill = 0xd8c7a9;
    }
  }

  hitBrewMarker() {
    const s = this.brew.step;
    if (!s || s.type !== 'timing') return;
    const diff = Math.abs(this.brew.marker - s.target);
    const per = s.points / (s.hits || 1);
    let mult = 0;
    let text = 'Мимо…';
    let col = 0xb87a6a;
    if (diff <= s.span * 0.35) { mult = 1; text = 'Идеально!'; col = 0xa8d08d; }
    else if (diff <= s.span * 0.85) { mult = 0.76; text = 'Хорошо.'; col = 0xd8c27a; }
    else if (diff <= s.span * 1.45) { mult = 0.42; text = 'Почти.'; col = 0xc1a06a; }
    const pts = Math.round(per * mult);
    this.brew.stepScore += pts;
    this.brew.hitsDone++;
    this.brewFeedback.text = `${text}  +${pts}`;
    this.brewFeedback.style.fill = col;
    this.game.audio.sfx(pts >= per * 0.7 ? 'collectHoney' : pts > 0 ? 'ui' : 'deny');
    if (this.brew.hitsDone >= (s.hits || 1)) {
      this.completeBrewStep();
    } else {
      this.brew.marker = 0.06;
      this.brew.dir = 1;
      this.updateBrewGaugeText();
    }
  }

  confirmBrewBalance() {
    const s = this.brew.step;
    if (!s || s.type !== 'balance') return;
    const diff = Math.abs(this.brew.value - s.target);
    let mult = 0;
    let text = 'Мимо…';
    let col = 0xb87a6a;
    if (diff <= s.span * 0.35) { mult = 1; text = 'Точно!'; col = 0xa8d08d; }
    else if (diff <= s.span * 0.85) { mult = 0.76; text = 'Хорошо.'; col = 0xd8c27a; }
    else if (diff <= s.span * 1.45) { mult = 0.42; text = 'Почти.'; col = 0xc1a06a; }
    this.brew.stepScore = Math.round(s.points * mult);
    this.brewFeedback.text = `${text}  +${this.brew.stepScore}`;
    this.brewFeedback.style.fill = col;
    this.game.audio.sfx(mult >= 0.7 ? 'collectHoney' : mult > 0 ? 'ui' : 'deny');
    this.completeBrewStep();
  }

  completeBrewStep() {
    this.brew.score += this.brew.stepScore;
    this.brew.stepIdx++;
    if (this.brew.stepIdx >= this.brew.steps.length) {
      this.finishBrew();
    } else {
      this.initBrewStep();
    }
  }

  finishBrew() {
    const key = this.brew.selected;
    const r = RECIPES[key];
    const kettle = this.game.progress.upgrades.kettle ? 8 : 0;
    const quality = U.clamp(40 + this.brew.score + kettle, 40, 100);
    const result = { recipe: key, count: r.bottles, quality };
    this.brew.result = result;
    this.brew.phase = 'result';
    this.brewProcessGroup.visible = false;
    this.brewResultGroup.visible = true;
    this.brewResultTitle.text = r.name;
    this.brewResultQuality.text = String(quality);
    const value = this.game.batchValue(result);
    this.brewResultInfo.text = `${r.bottles} бутылок\n${r.tasting || 'вкус берега'}\nОриентировочно ${formatMoney(value)} ₽ при продаже`;
    this.brewResultHint.text = 'ПРОБЕЛ — забрать бутылки';
    this.brewActionBtn.label.text = 'ЗАБРАТЬ';
    this.brewActionBtn.alpha = 1;
    this.brewCloseBtn.visible = false;
    this.game.audio.sfx('checkpoint');
  }

  completeBrew() {
    if (!this.brew || !this.brew.result) return;
    const result = this.brew.result;
    this.brewingActive = false;
    this.brewingOverlay.visible = false;
    this.brew = null;
    this.game.player.locked = false;
    this.game.onBrewComplete(result);
  }

  updateBrewing(dt) {
    if (!this.brewingActive || !this.brew) return;
    if (this.brew.phase !== 'process') return;
    const s = this.brew.step;
    if (!s) return;
    const input = this.game.input;
    if (s.type === 'timing') {
      const speed = 0.40 + this.brew.stepIdx * 0.09 + (this.brew.hitsDone * 0.04);
      this.brew.marker += this.brew.dir * speed * dt;
      if (this.brew.marker >= 1) { this.brew.marker = 1; this.brew.dir = -1; }
      if (this.brew.marker <= 0) { this.brew.marker = 0; this.brew.dir = 1; }
    } else if (s.type === 'hold') {
      const dir = (input.isDown('ArrowRight', 'KeyD') ? 1 : 0) - (input.isDown('ArrowLeft', 'KeyA') ? 1 : 0);
      this.brew.value += dir * 0.46 * dt - 0.026 * dt;
      this.brew.value = U.clamp(this.brew.value, 0.02, 0.98);
      this.brew.timeLeft -= dt;
      if (Math.abs(this.brew.value - s.target) <= s.span) this.brew.inZone += dt;
      this.brew.stepScore = Math.max(0, Math.round(s.points * (this.brew.inZone / (s.duration || 1))));
      this.brewFeedback.text = Math.abs(this.brew.value - s.target) <= s.span ? 'В зоне — держи' : 'Регулируй A / D';
      this.brewFeedback.style.fill = Math.abs(this.brew.value - s.target) <= s.span ? 0xa8d08d : 0xc1a06a;
      if (this.brew.timeLeft <= 0) {
        this.brewFeedback.text = `Этап +${this.brew.stepScore}`;
        this.game.audio.sfx(this.brew.stepScore >= s.points * 0.65 ? 'collectHoney' : 'ui');
        this.completeBrewStep();
        return;
      }
    } else if (s.type === 'balance') {
      const dir = (input.isDown('ArrowRight', 'KeyD') ? 1 : 0) - (input.isDown('ArrowLeft', 'KeyA') ? 1 : 0);
      this.brew.value += dir * 0.34 * dt;
      this.brew.value = U.clamp(this.brew.value, 0.02, 0.98);
    }
    this.drawBrewBar();
    this.updateBrewGaugeText();
  }

  /* ================= МАГАЗИН ================= */

  buildShop() {
    this.shopActive = false;
    const s = this.shopOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050b, 0.86); bg.drawRect(0, 0, GAME_W, GAME_H); bg.endFill();
    s.addChild(bg);
    const panel = new PIXI.Graphics();
    panel.beginFill(0x08101a, 0.98);
    panel.drawRoundedRect(240, 90, 800, 540, 12);
    panel.endFill();
    panel.lineStyle(1.2, 0xd8b06a, 0.42);
    panel.drawRoundedRect(241, 91, 798, 538, 11);
    s.addChild(panel);
    const title = makeText('МАСТЕРСКАЯ', {
      fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: '600', fill: 0xe3c48d, letterSpacing: 4,
    }, 0.5);
    title.x = 640; title.y = 134;
    s.addChild(title);
    const sub = makeText('вещи, которые делают работу легче', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x8c9aa6, letterSpacing: 1.6,
    }, 0.5);
    sub.x = 640; sub.y = 160;
    s.addChild(sub);

    this.shopRows = [];
    const keys = ['boots', 'kettle', 'lamp'];
    keys.forEach((key, i) => {
      const u = UPGRADES[key];
      const row = new PIXI.Container();
      row.x = 300; row.y = 196 + i * 92;
      const rb = new PIXI.Graphics();
      row.addChild(rb);
      const nm = makeText(u.name, {
        fontFamily: FONT_UI, fontSize: 18, fontWeight: '700', fill: 0xe4d2b1,
      });
      nm.x = 20; nm.y = 13; row.addChild(nm);
      const ds = makeText(u.desc, {
        fontFamily: FONT_UI, fontSize: 12.5, fill: 0xaeb9bd,
        wordWrap: true, wordWrapWidth: 470, lineHeight: 17,
      });
      ds.x = 20; ds.y = 38; row.addChild(ds);
      const price = makeText(formatMoney(u.cost) + ' ₽', {
        fontFamily: FONT_UI, fontSize: 16, fontWeight: '700', fill: 0xd8b06a,
      });
      price.anchor.set(1, 0);
      price.x = 660; price.y = 18; row.addChild(price);
      const state = makeText('', {
        fontFamily: FONT_UI, fontSize: 11, fill: 0x8f9d96,
      });
      state.anchor.set(1, 0);
      state.x = 660; state.y = 46; row.addChild(state);
      row.interactive = true;
      row.buttonMode = true;
      row.hitArea = new PIXI.Rectangle(0, 0, 680, 80);
      row.on('pointerdown', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (this.shopActive) this.game.buyUpgrade(key);
        this.renderShop();
      });
      s.addChild(row);
      this.shopRows.push({ key, row, rb, nm, ds, price, state });
    });

    this.shopMoney = makeText('', {
      fontFamily: FONT_UI, fontSize: 14, fill: 0xd8cbb2, letterSpacing: 1,
    }, 0.5);
    this.shopMoney.x = 640; this.shopMoney.y = 492;
    s.addChild(this.shopMoney);
    const hint = makeText('1 / 2 / 3 — купить   ·   ESC — закрыть', {
      fontFamily: FONT_UI, fontSize: 10.5, fill: 0x7f8d98, letterSpacing: 1.3,
    }, 0.5);
    hint.x = 640; hint.y = 516;
    s.addChild(hint);

    const close = this.makeButton('ЗАКРЫТЬ', 180, 40, false, () => this.hideShop());
    close.x = 640; close.y = 558;
    s.addChild(close);

    s.interactive = true;
    s.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    s.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
    s.visible = false;
  }

  showShop() {
    this.shopActive = true;
    this.shopOverlay.visible = true;
    this.renderShop();
    this.game.audio.sfx('ui');
  }

  hideShop() {
    this.shopActive = false;
    this.shopOverlay.visible = false;
  }

  renderShop() {
    if (!this.shopActive) return;
    const p = this.game.progress;
    for (const r of this.shopRows) {
      const u = UPGRADES[r.key];
      const bought = !!p.upgrades[r.key];
      r.rb.clear();
      r.rb.beginFill(0x0c1621, 0.75);
      r.rb.drawRoundedRect(0, 0, 680, 80, 8);
      r.rb.endFill();
      r.rb.lineStyle(1, bought ? 0x6f875f : 0x8d9aa7, bought ? 0.35 : 0.16);
      r.rb.drawRoundedRect(1, 1, 678, 78, 7);
      r.state.text = bought ? 'куплено' : (p.money >= u.cost ? 'нажми, чтобы купить' : 'не хватает денег');
      r.state.style.fill = bought ? 0x9fbe8d : (p.money >= u.cost ? 0xd8b06a : 0x8f7c70);
      r.price.style.fill = bought ? 0x6e7c70 : 0xd8b06a;
      r.row.alpha = bought ? 0.6 : 1;
    }
    this.shopMoney.text = `В кармане: ${formatMoney(p.money || 0)} ₽`;
  }

  /* ================= БЫСТРЫЕ ПЕРЕХОДЫ ================= */

  buildTravel() {
    this.travelActive = false;
    const t = this.travelOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050b, 0.84); bg.drawRect(0, 0, GAME_W, GAME_H); bg.endFill();
    t.addChild(bg);
    const panel = new PIXI.Graphics();
    panel.beginFill(0x08101a, 0.98);
    panel.drawRoundedRect(340, 130, 600, 460, 12);
    panel.endFill();
    panel.lineStyle(1.2, 0xd8b06a, 0.42);
    panel.drawRoundedRect(341, 131, 598, 458, 11);
    t.addChild(panel);
    const title = makeText('ДОРОГИ', {
      fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: '600', fill: 0xe3c48d, letterSpacing: 4,
    }, 0.5);
    title.x = 640; title.y = 176;
    t.addChild(title);
    const sub = makeText('T — закрыть  ·  выбери, куда идти', {
      fontFamily: FONT_UI, fontSize: 11, fill: 0x8c9aa6, letterSpacing: 1.4,
    }, 0.5);
    sub.x = 640; sub.y = 204;
    t.addChild(sub);

    this.travelRows = [];
    const keys = ['home', 'brewery', 'mill', 'village', 'dam'];
    keys.forEach((key, i) => {
      const p = TRAVEL_POINTS[key];
      const row = new PIXI.Container();
      row.x = 390; row.y = 226 + i * 62;
      const rb = new PIXI.Graphics();
      row.addChild(rb);
      const nm = makeText(p.name, {
        fontFamily: FONT_UI, fontSize: 17, fontWeight: '700', fill: 0xe2d0af,
      });
      nm.x = 18; nm.y = 9; row.addChild(nm);
      const sb = makeText(p.sub, {
        fontFamily: FONT_UI, fontSize: 11, fill: 0x93a2a6,
      });
      sb.x = 18; sb.y = 32; row.addChild(sb);
      const keyT = makeText(String(i + 1), {
        fontFamily: FONT_UI, fontSize: 13, fontWeight: '700', fill: 0xd8b06a,
      });
      keyT.anchor.set(1, 0.5);
      keyT.x = 492; keyT.y = 20; row.addChild(keyT);
      row.interactive = true;
      row.buttonMode = true;
      row.hitArea = new PIXI.Rectangle(0, 0, 500, 56);
      row.on('pointerdown', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (this.travelActive) this.game.fastTravel(key);
      });
      t.addChild(row);
      this.travelRows.push({ key, row, rb, nm, sb });
    });

    const close = this.makeButton('ЗАКРЫТЬ', 170, 38, false, () => this.hideTravel());
    close.x = 640; close.y = 552;
    t.addChild(close);
    t.interactive = true;
    t.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    t.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
    t.visible = false;
  }

  showTravel() {
    this.travelActive = true;
    this.travelOverlay.visible = true;
    this.renderTravel();
    this.game.audio.sfx('ui');
  }

  hideTravel() {
    this.travelActive = false;
    this.travelOverlay.visible = false;
  }

  renderTravel() {
    if (!this.travelActive) return;
    const p = this.game.progress;
    for (const r of this.travelRows) {
      const point = TRAVEL_POINTS[r.key];
      const unlocked = r.key === 'home' || !!(p.unlocked && p.unlocked[r.key]);
      r.rb.clear();
      r.rb.beginFill(unlocked ? 0x0c1621 : 0x090d14, unlocked ? 0.8 : 0.45);
      r.rb.drawRoundedRect(0, 0, 500, 56, 7);
      r.rb.endFill();
      r.rb.lineStyle(1, unlocked ? 0x8d9aa7 : 0x3d4650, unlocked ? 0.2 : 0.12);
      r.rb.drawRoundedRect(1, 1, 498, 54, 6);
      r.row.alpha = unlocked ? 1 : 0.42;
      r.sb.text = unlocked
        ? point.sub
        : r.key === 'brewery'
          ? 'сначала дойди до пивоварни'
          : r.key === 'dam'
            ? 'после городского заказа'
            : `откроется по сюжету · день ${point.minDay}`;
    }
  }


  /* ================= ФИНАЛ ================= */

  buildCredits() {
    const c = this.creditsOverlay;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x02050b, 0.93);
    bg.drawRect(0, 0, GAME_W, GAME_H);
    bg.endFill();
    c.addChild(bg);

    const warm = fogSprite(900, 600, 0.26);
    warm.tint = 0x9a6b43;
    warm.x = 640; warm.y = 390;
    c.addChild(warm);

    const halo = softGlow(0xffa356, 780, 0.12);
    halo.x = 640; halo.y = 390;
    c.addChild(halo);

    const title = makeText('ТИХИЙ БЕРЕГ', {
      fontFamily: FONT_DISPLAY, fontSize: 62, fontWeight: '600', fill: 0xf0dfc1, letterSpacing: 7,
    }, 0.5);
    title.x = 640; title.y = 196;
    c.addChild(title);

    const sub = makeText('пивоварня дяди Вити', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, fill: 0xd3b17b,
    }, 0.5);
    sub.x = 640; sub.y = 244;
    c.addChild(sub);

    const rule = new PIXI.Graphics();
    rule.lineStyle(1, 0xd8b06a, 0.4);
    rule.moveTo(470, 280); rule.lineTo(810, 280);
    rule.beginFill(0xd8b06a, 0.8); rule.drawCircle(640, 280, 2); rule.endFill();
    c.addChild(rule);

    const lines = [
      ['История', 'пять глав · один берег'],
      ['Графика', 'PixiJS · процедурная живопись'],
      ['Звук', 'Howler.js · Web Audio'],
      ['Атмосфера и музыка', 'ncase/wbwwb · CC0'],
      ['Спасибо', 'что дошли до берега'],
    ];
    let y = 320;
    for (const [a, b] of lines) {
      const ta = makeText(a, {
        fontFamily: FONT_UI, fontSize: 13, fontWeight: '700', fill: 0xc9a771, letterSpacing: 2.5,
      }, 1);
      ta.x = 520; ta.y = y;
      c.addChild(ta);
      const tb = makeText(b, {
        fontFamily: FONT_UI, fontSize: 14, fontWeight: '400', fill: 0xaeb6b8,
      });
      tb.x = 560; tb.y = y - 1;
      c.addChild(tb);
      y += 36;
    }

    const final = makeText('«Я не пью. Я варю».', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 22, fill: 0xe1c9a0,
    }, 0.5);
    final.x = 640; final.y = 536;
    c.addChild(final);

    const btn = this.makeButton('СЫГРАТЬ ЕЩЁ РАЗ', 240, 48, true, () => {
      this.game.startNewGame();
    });
    btn.x = 640; btn.y = 604;
    c.addChild(btn);

    const small = makeText('Пять глав. Один берег. Одна история.', {
      fontFamily: FONT_UI, fontSize: 10.5, fill: 0x6e7c88, letterSpacing: 1.5,
    }, 0.5);
    small.x = 640; small.y = 666;
    c.addChild(small);

    c.interactive = true;
    c.hitArea = new PIXI.Rectangle(0, 0, GAME_W, GAME_H);
    c.on('pointerdown', (e) => { if (e && e.stopPropagation) e.stopPropagation(); });
  }

  showCredits() {
    this.creditsOverlay.visible = true;
    this.creditsOverlay.alpha = 1;
    this.hud.visible = false;
    this.prompt.visible = false;
  }

  reset() {
    this.dialogueActive = false;
    this.narrationActive = false;
    this.paused = false;
    this.journalActive = false;
    this.brewingActive = false;
    this.shopActive = false;
    this.travelActive = false;
    this.dialogState = null;
    this.narrationState = null;
    this.brew = null;
    this.dialog.visible = false;
    this.narration.visible = false;
    this.pauseOverlay.visible = false;
    this.helpOverlay.visible = false;
    this.journalOverlay.visible = false;
    this.brewingOverlay.visible = false;
    this.shopOverlay.visible = false;
    this.travelOverlay.visible = false;
    this.creditsOverlay.visible = false;
    this.titleOverlay.visible = false;
    this.prompt.visible = false;
    this.tutorial.visible = false;
    this.tutorialState = null;
    this.promptText = '';
    this.toastQueue.length = 0;
    this.toastActive = null;
    this.toastLayer.removeChildren();
    this.fadeTween = null;
    this.fade.alpha = 0;
    this.hud.visible = false;
  }

  /* ================= ТОСТЫ ================= */

  toast(title, sub, color) {
    if (this.toastQueue.length > 3) return;
    this.toastQueue.push({ title, sub, color: color || 0xffca7a });
    if (!this.toastActive) this.nextToast();
  }

  nextToast() {
    if (!this.toastQueue.length) { this.toastActive = null; return; }
    const data = this.toastQueue.shift();
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    const title = makeText(data.title, {
      fontFamily: FONT_UI, fontSize: 17, fontWeight: '700', fill: 0xf0e4cd, letterSpacing: 0.8,
    }, 0.5);
    const sub = makeText(data.sub || '', {
      fontFamily: FONT_UI, fontSize: 11, fontWeight: '500', fill: 0xb7a284, letterSpacing: 1,
    }, 0.5);
    const w = Math.max(title.width, sub.width) + 84;
    bg.beginFill(0x070d16, 0.86);
    bg.drawRoundedRect(-w / 2, -30, w, 60, 8);
    bg.endFill();
    bg.lineStyle(1, data.color, 0.35);
    bg.drawRoundedRect(-w / 2 + 1, -29, w - 2, 58, 7);
    bg.beginFill(data.color, 0.8);
    bg.drawCircle(-w / 2 + 22, 0, 3);
    bg.endFill();
    c.addChild(bg);
    title.y = data.sub ? -10 : 0;
    c.addChild(title);
    if (data.sub) { sub.y = 12; c.addChild(sub); }
    c.x = 640; c.y = 120; c.alpha = 0;
    this.toastLayer.addChild(c);
    this.toastActive = { c, life: 0, dur: 2.8, out: false, title };
  }

  updateToasts(dt) {
    const t = this.toastActive;
    if (!t) return;
    t.life += dt;
    if (!t.out && t.life > 0.2) {
      t.c.alpha = Math.min(1, t.c.alpha + dt * 4);
      t.c.y = U.damp(t.c.y, 128, 8, dt);
    }
    if (t.life > t.dur) t.out = true;
    if (t.out) {
      t.c.alpha -= dt * 2.2;
      t.c.y -= dt * 18;
      if (t.c.alpha <= 0) {
        this.toastLayer.removeChild(t.c);
        this.toastActive = null;
        this.nextToast();
      }
    }
  }

  /* ================= ОБНОВЛЕНИЕ ================= */

  update(dt) {
    this.titleTime += dt;
    this.updateFade(dt);
    this.updateToasts(dt);
    this.updateTutorial(dt);
    if (this.dialogueActive) this.updateDialogue(dt);
    if (this.narrationActive) this.updateNarration(dt);
    if (this.brewingActive) this.updateBrewing(dt);

    if (this.prompt.visible) {
      this.prompt.y += Math.sin(this.game.time * 2.4) * 0.07;
    }

    if (this.titleOverlay.visible) {
      this.titleGlow.alpha = 0.14 + Math.sin(this.titleTime * 1.1) * 0.03;
      this.titleText.y = 200 + Math.sin(this.titleTime * 0.7) * 2;
      for (const m of this.titleMotes) {
        m.y = m.baseY + Math.sin(this.titleTime * m.sp + m.ph) * 14;
        m.x = m.baseX + Math.cos(this.titleTime * m.sp * 0.6 + m.ph) * 9;
        m.alpha = 0.16 + 0.22 * (0.5 + 0.5 * Math.sin(this.titleTime * 1.4 + m.ph));
      }
    }
  }
}
