'use strict';

/* ============================================================
   Звук: атмосфера из wbwwb (CC0) + оригинальная генеративная
   музыка на Web Audio (тёплые пэды, музыкальная шкатулка, бас)
   ============================================================ */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.reverb = null;
    this.reverbGain = null;
    this.delay = null;
    this.noiseBuf = null;
    this.started = false;
    this.muted = false;
    this.timer = null;
    this.nextBar = 0;
    this.barIndex = 0;
    this.mode = 'night';
    this.ambience = {};
    this.volume = 0.8;

    try { this.muted = localStorage.getItem('vitya_muted') === '1'; } catch (e) {}
    this.bpm = 62;
    this.beat = 60 / this.bpm;
    this.barDur = this.beat * 4;

    this.nightProg = [
      { root: 'A2', notes: ['A3', 'C4', 'E4', 'B4'], chord: 'Am9' },
      { root: 'F2', notes: ['F3', 'A3', 'C4', 'E4'], chord: 'Fmaj7' },
      { root: 'C3', notes: ['C4', 'E4', 'G4', 'B4'], chord: 'Cmaj7' },
      { root: 'G2', notes: ['G3', 'B3', 'D4', 'E4'], chord: 'G6' },
      { root: 'A2', notes: ['A3', 'C4', 'E4', 'G4'], chord: 'Am7' },
      { root: 'F2', notes: ['F3', 'A3', 'C4', 'E4'], chord: 'Fmaj7' },
      { root: 'C3', notes: ['C4', 'E4', 'G4', 'B4'], chord: 'Cmaj7' },
      { root: 'E2', notes: ['E3', 'G3', 'B3', 'D4'], chord: 'Em7' },
    ];
    this.nightMelody = [
      [[0, 'A4'], [1.5, 'C5'], [2.25, 'E5'], [3.0, 'D5']],
      [[0.5, 'C5'], [1.5, 'A4'], [2.5, 'F4'], [3.25, 'A4']],
      [[0, 'G4'], [1.5, 'E5'], [2.5, 'G5'], [3.25, 'E5']],
      [[0.5, 'D5'], [1.5, 'B4'], [2.75, 'G4']],
      [[0, 'A4'], [1.0, 'E5'], [2.0, 'D5'], [3.0, 'C5']],
      [[0.5, 'C5'], [2.0, 'A4'], [3.0, 'F4']],
      [[0, 'E5'], [1.5, 'G5'], [2.5, 'E5'], [3.0, 'D5']],
      [[0.5, 'B4'], [1.5, 'E5'], [2.5, 'G4'], [3.5, 'B4']],
    ];
    this.endProg = [
      { root: 'C3', notes: ['C4', 'E4', 'G4', 'D5'], chord: 'Cadd9' },
      { root: 'G2', notes: ['G3', 'B3', 'D4', 'A4'], chord: 'Gadd9' },
      { root: 'A2', notes: ['A3', 'C4', 'E4', 'B4'], chord: 'Am9' },
      { root: 'F2', notes: ['F3', 'A3', 'C4', 'G4'], chord: 'Fmaj9' },
    ];
    this.endMelody = [
      [[0, 'G4'], [1.5, 'C5'], [2.5, 'E5'], [3.25, 'D5']],
      [[0, 'D5'], [1.5, 'B4'], [2.5, 'G4'], [3.25, 'A4']],
      [[0.5, 'C5'], [1.5, 'E5'], [2.5, 'A4'], [3.0, 'G4']],
      [[0, 'A4'], [1.25, 'C5'], [2.25, 'F4'], [3.0, 'G4']],
    ];
  }

  init() {
    if (this.started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      const ctx = this.ctx;

      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 3;
      comp.attack.value = 0.02;
      comp.release.value = 0.35;
      this.master.connect(comp);
      comp.connect(ctx.destination);

      // мягкая реверберация
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(3.2, 2.4);
      this.reverbGain = ctx.createGain();
      this.reverbGain.gain.value = 0.5;
      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.master);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.9;
      this.musicBus.connect(this.master);
      const musicSend = ctx.createGain();
      musicSend.gain.value = 0.55;
      this.musicBus.connect(musicSend);
      musicSend.connect(this.reverb);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      const sfxSend = ctx.createGain();
      sfxSend.gain.value = 0.22;
      this.sfxBus.connect(sfxSend);
      sfxSend.connect(this.reverb);

      this.delay = ctx.createDelay(1.0);
      this.delay.delayTime.value = 0.34;
      const fb = ctx.createGain();
      fb.gain.value = 0.23;
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      this.delay.connect(fb); fb.connect(this.delay);
      this.delay.connect(wet);
      wet.connect(this.musicBus);

      this.noiseBuf = this.makeNoise(4);
      this.started = true;
      if (window.Howler) Howler.mute(this.muted);
      this.resume();

      if (this.ctx.state === 'running') this.startMusic();
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (Howler && Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
  }

  makeImpulse(seconds, decay) {
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  makeNoise(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }

  noteFreq(name) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    if (!m) return 440;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    const semi = base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (parseInt(m[3], 10) + 1) * 12 + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextBar = this.ctx.currentTime + 0.12;
    this.barIndex = 0;
    this.timer = setInterval(() => this.schedule(), 90);
    this.startAmbience();
    this.schedule();
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.barIndex = 0;
    if (this.ctx) this.nextBar = Math.max(this.nextBar, this.ctx.currentTime + 0.2);
    if (mode === 'ending') {
      this.fadeAmbience('night', 0, 3.5);
      this.fadeAmbience('crickets', 0, 3.5);
      this.playAmbience('park', 0.34, 4);
    } else if (mode === 'festival') {
      this.fadeAmbience('park', 0, 2.5);
      this.playAmbience('crickets', 0.12, 2.5);
    } else if (mode === 'night') {
      this.fadeAmbience('park', 0, 2.5);
      this.playAmbience('night', 0.36, 2.5);
      this.playAmbience('crickets', 0.15, 2.5);
    }
  }

  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const horizon = this.ctx.currentTime + 1.0;
    let guard = 0;
    while (this.nextBar < horizon && guard++ < 8) {
      this.scheduleBar(this.barIndex, this.nextBar);
      this.nextBar += this.barDur;
      this.barIndex++;
    }
  }

  scheduleBar(index, when) {
    const ending = this.mode === 'ending' || this.mode === 'festival';
    const prog = ending ? this.endProg : this.nightProg;
    const mel = ending ? this.endMelody : this.nightMelody;
    const ch = prog[index % prog.length];
    const bar = Math.floor(index / prog.length);
    const melody = mel[index % mel.length];

    // пэд
    ch.notes.forEach((n, i) => {
      this.pad(this.noteFreq(n) * (ending ? 1 : 0.999), when, this.barDur + 0.5, i === 0 ? 0.032 : 0.022, 900 + i * 180);
    });

    // бас
    const root = this.noteFreq(ch.root);
    this.pluck(root, when, 2.4, 0.085, 'sine', 220);
    this.pluck(root, when + this.beat * 2.5, 2.0, 0.055, 'sine', 200);
    if (ending && bar % 2 === 0) this.pluck(root * 2, when + this.beat * 1.5, 1.2, 0.03, 'triangle', 400);

    // мелодия — музыкальная шкатулка
    melody.forEach(([beat, note]) => {
      if (ending && beat === 3.5) return;
      const t = when + beat * this.beat + (index % 2) * 0.012;
      this.bell(this.noteFreq(note) * (ending ? 2 : 1), t, 2.8, 0.052 + (beat % 1 === 0 ? 0.012 : 0));
    });

    // редкие высокие искры
    if (index % 4 === 2) {
      this.bell(this.noteFreq('E6'), when + this.beat * 3.5, 3.5, 0.012);
    }
  }

  pad(freq, when, dur, gain, cutoff) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 1.4);
    g.gain.setValueAtTime(gain, when + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.8);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = 0.3;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) pan.pan.value = (Math.random() - 0.5) * 0.5;
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = freq;
    o1.detune.value = -4;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq;
    o2.detune.value = 4;
    o1.connect(f); o2.connect(f);
    f.connect(g);
    (pan ? (g.connect(pan), pan.connect(this.musicBus)) : g.connect(this.musicBus));
    o1.start(when); o2.start(when);
    o1.stop(when + dur + 1.0); o2.stop(when + dur + 1.0);
  }

  pluck(freq, when, dur, gain, type, cutoff) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff || 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(f); f.connect(g); g.connect(this.musicBus);
    o.start(when); o.stop(when + dur + 0.05);
  }

  bell(freq, when, dur, gain) {
    const ctx = this.ctx;
    const c = ctx.createOscillator();
    c.type = 'sine'; c.frequency.value = freq;
    const m = ctx.createOscillator();
    m.type = 'sine'; m.frequency.value = freq * 2.01;
    const mg = ctx.createGain(); mg.gain.value = freq * 0.9;
    m.connect(mg); mg.connect(c.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    c.connect(g);
    g.connect(this.musicBus);
    if (this.delay) g.connect(this.delay);
    c.start(when); m.start(when);
    c.stop(when + dur + 0.05); m.stop(when + dur + 0.05);
  }

  startAmbience() {
    if (!window.Howl) return;
    const defs = [
      ['night', 'audio/bg_nighttime.mp3', 0.36, 3],
      ['crickets', 'audio/crickets.mp3', 0.15, 4],
    ];
    defs.forEach(([key, src, vol, delay]) => {
      if (this.ambience[key]) return;
      try {
        const s = new Howl({ src: [src], loop: true, volume: 0, preload: true });
        s.once('load', () => {
          s.play();
          s.fade(0, vol, delay * 1000);
        });
        s.on('loaderror', () => console.warn('Не загрузился звук', src));
        this.ambience[key] = s;
      } catch (e) { console.warn(e); }
    });
  }

  playAmbience(key, volume, fade) {
    if (!window.Howl) return;
    if (this.ambience[key]) {
      const s = this.ambience[key];
      if (!s.playing()) s.play();
      s.fade(s.volume(), volume, (fade || 2) * 1000);
      return;
    }
    const sources = {
      park: 'audio/bg_park.mp3',
      night: 'audio/bg_nighttime.mp3',
      crickets: 'audio/crickets.mp3',
    };
    if (!sources[key]) return;
    try {
      const s = new Howl({ src: [sources[key]], loop: true, volume: 0 });
      s.once('load', () => { s.play(); s.fade(0, volume, (fade || 2) * 1000); });
      this.ambience[key] = s;
    } catch (e) {}
  }

  fadeAmbience(key, to, sec) {
    const s = this.ambience[key];
    if (s) s.fade(s.volume(), to, (sec || 2) * 1000);
    if (to <= 0 && s) setTimeout(() => { try { s.stop(); } catch (e) {} }, (sec || 2) * 1000 + 150);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.06);
    if (window.Howler) Howler.mute(this.muted);
    try { localStorage.setItem('vitya_muted', this.muted ? '1' : '0'); } catch (e) {}
    return this.muted;
  }

  /* ---------- эффекты ---------- */
  tone(freq, dur, gain, type, slideTo, when) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, gain, freq, type) {
    if (!this.ctx || !this.noiseBuf) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.value = freq || 900;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'jump':
        this.tone(220, 0.18, 0.055, 'sine', 420);
        this.noise(0.1, 0.02, 1600, 'highpass');
        break;
      case 'swing':
        this.noise(0.16, 0.045, 900, 'highpass');
        this.tone(180, 0.1, 0.025, 'triangle', 90);
        break;
      case 'hurt':
        this.tone(130, 0.22, 0.07, 'sawtooth', 70);
        this.noise(0.12, 0.03, 500);
        break;
      case 'hit':
        this.noise(0.1, 0.06, 1300, 'highpass');
        this.tone(210, 0.08, 0.045, 'square', 140);
        break;
      case 'thud':
        this.tone(80, 0.18, 0.08, 'sine', 48);
        this.noise(0.1, 0.04, 300);
        break;
      case 'squeak':
        this.tone(900, 0.1, 0.025, 'square', 1300);
        break;
      case 'coin':
        this.tone(880, 0.16, 0.04, 'sine');
        this.tone(1174.66, 0.3, 0.035, 'sine', null, this.ctx.currentTime + 0.06);
        break;
      case 'buy':
        this.tone(392, 0.4, 0.04, 'sine');
        this.tone(523.25, 0.5, 0.035, 'sine', null, this.ctx.currentTime + 0.08);
        this.tone(659.25, 0.6, 0.03, 'sine', null, this.ctx.currentTime + 0.16);
        break;
      case 'land':
        this.tone(96, 0.16, 0.075, 'sine', 54);
        this.noise(0.12, 0.03, 420);
        break;
      case 'step':
        this.noise(0.06, 0.012, 700);
        break;
      case 'collectHoney':
        this.tone(523.25, 0.35, 0.05, 'sine');
        this.tone(783.99, 0.5, 0.04, 'sine', null, this.ctx.currentTime + 0.08);
        this.tone(1046.5, 0.6, 0.025, 'sine', null, this.ctx.currentTime + 0.16);
        break;
      case 'collectHop':
        this.tone(392, 0.3, 0.045, 'triangle');
        this.tone(587.33, 0.4, 0.035, 'sine', null, this.ctx.currentTime + 0.06);
        break;
      case 'collectWater':
        this.tone(880, 0.25, 0.04, 'sine');
        this.tone(1174.66, 0.45, 0.03, 'sine', null, this.ctx.currentTime + 0.07);
        break;
      case 'checkpoint':
        [392, 493.88, 587.33].forEach((f, i) => this.tone(f, 1.2, 0.035, 'sine', null, this.ctx.currentTime + i * 0.1));
        break;
      case 'splash':
        this.noise(0.5, 0.11, 1200, 'lowpass');
        this.tone(180, 0.35, 0.04, 'sine', 60);
        break;
      case 'click':
        this.tone(660, 0.07, 0.035, 'sine', 880);
        break;
      case 'talk':
        this.tone(260 + Math.random() * 90, 0.045, 0.012, 'square', 220);
        break;
      case 'deny':
        this.tone(180, 0.16, 0.035, 'triangle', 140);
        break;
      case 'brew':
        this.tone(65, 2.4, 0.055, 'sine', 45);
        this.noise(2.0, 0.02, 600);
        [261.63, 329.63, 392, 523.25].forEach((f, i) => this.tone(f, 2.6, 0.028, 'sine', null, this.ctx.currentTime + 0.5 + i * 0.18));
        break;
      case 'ending':
        [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) => this.tone(f, 4.0, 0.026, 'sine', null, this.ctx.currentTime + i * 0.22));
        break;
      case 'ui':
        this.tone(440, 0.08, 0.02, 'sine', 520);
        break;
    }
  }
}
