'use strict';

/* ============================================================
   ИНТЕРФЕЙС: титул, HUD, диалоги, заставки, пауза, финал
   ============================================================ */

class UI {
  constructor(game) {
    this.game = game;
    this.root = new PIXI.Container();
    this.dialogueActive = false;
    this.narrationActive = false;
    this.paused = false;

    this.hud = new PIXI.Container();
    this.prompt = new PIXI.Container();
    this.toastLayer = new PIXI.Container();
    this.dialog = new PIXI.Container();
    this.narration = new PIXI.Container();
    this.titleOverlay = new PIXI.Container();
    this.helpOverlay = new PIXI.Container();
    this.pauseOverlay = new PIXI.Container();
    this.creditsOverlay = new PIXI.Container();
    this.fade = new PIXI.Graphics();

    this.root.addChild(this.hud);
    this.root.addChild(this.prompt);
    this.root.addChild(this.toastLayer);
    this.root.addChild(this.dialog);
    this.root.addChild(this.narration);
    this.root.addChild(this.titleOverlay);
    this.root.addChild(this.helpOverlay);
    this.root.addChild(this.pauseOverlay);
    this.root.addChild(this.creditsOverlay);
    this.root.addChild(this.fade);

    this.prompt.visible = false;
    this.dialog.visible = false;
    this.narration.visible = false;
    this.helpOverlay.visible = false;
    this.pauseOverlay.visible = false;
    this.titleOverlay.visible = false;
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
    this.buildDialogue();
    this.buildNarration();
    this.buildTitle();
    this.buildHelp();
    this.buildPause();
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

      const count = makeText('0/3', {
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

    const objLabel = makeText('ЗАДАЧА', {
      fontFamily: FONT_UI, fontSize: 9.5, fontWeight: '700', fill: 0xb99a67, letterSpacing: 3,
    });
    objLabel.x = 30; objLabel.y = 126;
    h.addChild(objLabel);

    this.objective = makeText('', {
      fontFamily: FONT_UI, fontSize: 16, fontWeight: '500', fill: 0xd9d0bd,
      wordWrap: true, wordWrapWidth: 430, lineHeight: 21,
    });
    this.objective.x = 30; this.objective.y = 142;
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
    dl.x = 20; dl.y = 20; debt.addChild(dl);
    const amount = makeText('47 000 ₽', {
      fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: '600', fill: 0x332318,
    });
    amount.x = 18; amount.y = 33; debt.addChild(amount);
    const term = makeText('осталось 3 дня', {
      fontFamily: FONT_UI, fontSize: 11.5, fontWeight: '500', fill: 0x6c5138, letterSpacing: 1,
    });
    term.x = 21; term.y = 76; debt.addChild(term);
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
    hb.drawRoundedRect(28, 682, 560, 24, 5);
    hb.endFill();
    this.hint.addChild(hb);
    this.hintText = makeText('A / D — идти    ПРОБЕЛ — прыжок    E — говорить    M — звук', {
      fontFamily: FONT_UI, fontSize: 11, fontWeight: '500', fill: 0x9faeac, letterSpacing: 0.7,
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
    for (const t of ['hop', 'honey', 'water']) {
      const c = this.ingredientCounts[t];
      if (c) c.text = `${inv[t]}/3`;
    }
    const muted = this.game.audio.muted;
    this.hintText.text = muted
      ? 'A / D — идти    ПРОБЕЛ — прыжок    E — говорить    M — звук выкл.'
      : 'A / D — идти    ПРОБЕЛ — прыжок    E — говорить    M — звук';
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

    const eyebrow = makeText('АТМОСФЕРНАЯ ИСТОРИЯ В ОДНОМ ДЕЙСТВИИ', {
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

    const tag = makeText('одна ночь · три ингредиента · сорок семь тысяч', {
      fontFamily: FONT_UI, fontSize: 13.5, fontWeight: '500', fill: 0xaeb6b8, letterSpacing: 2.6,
    }, 0.5);
    tag.x = 640; tag.y = 356;
    t.addChild(tag);

    const startBtn = this.makeButton('НАЧАТЬ ИСТОРИЮ', 292, 56, true, () => {
      this.game.startNewGame();
    });
    startBtn.x = 640; startBtn.y = 460;
    t.addChild(startBtn);

    const helpBtn = this.makeButton('УПРАВЛЕНИЕ', 210, 44, false, () => {
      this.openHelp();
    });
    helpBtn.x = 640; helpBtn.y = 530;
    t.addChild(helpBtn);

    const note = makeText('Наденьте наушники. Здесь важна тишина.', {
      fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 16, fill: 0x8e9aa4,
    }, 0.5);
    note.x = 640; note.y = 610;
    t.addChild(note);

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
      ['R', 'вернуться к последнему фонарю'],
      ['ESC', 'пауза'],
      ['M', 'звук вкл / выкл'],
    ];
    let y = 230;
    for (const [key, text] of lines) {
      const k = makeText(key, {
        fontFamily: FONT_UI, fontSize: 15, fontWeight: '700', fill: 0xe0c08a, letterSpacing: 1,
      });
      k.x = 390; k.y = y;
      h.addChild(k);
      const v = makeText(text, {
        fontFamily: FONT_UI, fontSize: 16, fontWeight: '400', fill: 0xd5cbb9,
      });
      v.x = 540; v.y = y;
      h.addChild(v);
      y += 38;
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
      ['Глава первая', 'закончена'],
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

    const small = makeText('Одна ночь. Один уровень. Одна история.', {
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
    this.dialogState = null;
    this.narrationState = null;
    this.dialog.visible = false;
    this.narration.visible = false;
    this.pauseOverlay.visible = false;
    this.helpOverlay.visible = false;
    this.creditsOverlay.visible = false;
    this.titleOverlay.visible = false;
    this.prompt.visible = false;
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
    if (this.dialogueActive) this.updateDialogue(dt);
    if (this.narrationActive) this.updateNarration(dt);

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
