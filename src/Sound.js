// Sound.js — Procedural Web Audio sound effects (no external files needed)
// All sounds are generated with oscillators + noise buffers.

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.unlocked = false;
  }

  // Must be called after first user gesture (click) to unlock audio
  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.unlocked = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  _env(gain, peak, attack, decay, time) {
    const t = time || this.ctx.currentTime;
    gain.setValueAtTime(0, t);
    gain.linearRampToValueAtTime(peak, t + attack);
    gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  }

  _noise(duration) {
    const len = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  // ─── Bark (Obi) ──────────────────────────────────────────────────────
  bark() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    this._env(gain, 0.15, 0.01, 0.15, t);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // ─── Cluck (chicken) ─────────────────────────────────────────────────
  cluck() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const base = 600 + i * 50;
      osc.frequency.setValueAtTime(base, t + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(base * 0.7, t + i * 0.08 + 0.05);
      this._env(gain, 0.08, 0.005, 0.06, t + i * 0.08);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.08);
    }
  }

  // ─── Giggle (tag Obi) ────────────────────────────────────────────────
  giggle() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const freq = 400 + i * 80;
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + i * 0.06 + 0.04);
      this._env(gain, 0.1, 0.005, 0.05, t + i * 0.06);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.06);
    }
  }

  // ─── Spray (skunk) ───────────────────────────────────────────────────
  spray() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Pssst sound — filtered noise burst
    const noise = this._noise(0.4);
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    filter.Q.value = 5;
    this._env(gain, 0.2, 0.02, 0.35, t);
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.4);
  }

  // ─── Win fanfare ─────────────────────────────────────────────────────
  win() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);
      this._env(gain, 0.15, 0.01, 0.3, t + i * 0.12);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.35);
    });
  }

  // ─── Sad sound (chicken caught) ──────────────────────────────────────
  sad() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.5);
    this._env(gain, 0.12, 0.02, 0.5, t);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // ─── Evening cricket ambience start ──────────────────────────────────
  evening() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    // A soft descending tone for sunset
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 1.5);
    this._env(gain, 0.08, 0.1, 1.5, t);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 1.8);
  }
}