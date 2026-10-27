'use strict';
/* ============================================================
 * NCT DREAM 连连看 - 音效系统（WebAudio 实时合成，零音频文件）
 * ============================================================ */

const SFX = {
  ctx: null,
  master: null,
  musicGain: null,
  enabled: true,      // 音效总开关
  musicOn: true,      // 背景音乐开关
  musicTimer: null,
  step: 0,

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.14;
    this.musicGain.connect(this.master);
  },

  tone(freq, dur, type, vol, when, dest, glideTo) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.4, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(dest || this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.06);
  },

  select()  { this.tone(680, 0.07, 'triangle', 0.3); },
  mismatch(){ this.tone(200, 0.16, 'sawtooth', 0.18, 0, null, 120); },
  hintFx()  { this.tone(990, 0.1, 'sine', 0.3); this.tone(1320, 0.12, 'sine', 0.25, 0.09); },
  shuffleFx() {
    for (let k = 0; k < 6; k++) this.tone(300 + k * 90, 0.05, 'square', 0.1, k * 0.045);
  },
  clockFx() { this.tone(520, 0.1, 'sine', 0.3); this.tone(780, 0.14, 'sine', 0.3, 0.1); },
  tick()    { this.tone(880, 0.045, 'square', 0.1); },

  match(combo) {
    const base = 500 + Math.min(combo || 1, 12) * 28;
    this.tone(base, 0.1, 'triangle', 0.36);
    this.tone(base * 1.25, 0.11, 'triangle', 0.3, 0.06);
    this.tone(base * 1.5, 0.15, 'triangle', 0.26, 0.12);
    if (combo >= 4) { this.tone(base * 2, 0.2, 'sine', 0.22, 0.18); }
  },

  win() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, k) => this.tone(f, 0.22, 'triangle', 0.34, k * 0.13));
  },
  lose() {
    [440, 392, 330, 262].forEach((f, k) => this.tone(f, 0.3, 'triangle', 0.3, k * 0.2));
  },

  /* 背景音乐：轻松愉快的十六步音序器（C 大调五声音阶） */
  MELODY: [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587],
  BASS:   [262, 0,   196, 0,   220, 0,   175, 0,   262, 0,   196, 0,    165, 0,   196, 0],

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicTimer || !this.musicOn) return;
    this.step = 0;
    this.musicTimer = setInterval(() => {
      if (!this.enabled) return;
      const s = this.step % 16;
      if (this.MELODY[s]) this.tone(this.MELODY[s], 0.2, 'triangle', 0.22, 0, this.musicGain);
      if (this.BASS[s])   this.tone(this.BASS[s],   0.32, 'sine',    0.3,  0, this.musicGain);
      if (s % 4 === 2)    this.tone(330, 0.05, 'square', 0.06, 0, this.musicGain);
      this.step++;
    }, 220);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },

  toggleSfx()   { this.enabled = !this.enabled; return this.enabled; },
  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.startMusic(); else this.stopMusic();
    return this.musicOn;
  }
};
