'use client';

// Web Audio API Sound Synthesizer: 100% tự sinh âm thanh, không phụ thuộc file MP3 ngoài
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMelodyPlaying: boolean = false;
  private melodyTimeoutIds: number[] = [];

  private crackleIntervalId: number | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopMelody();
      this.stopCandleCrackle();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 🕯️ Âm thanh ASMR nến cháy lách tách nhẹ nhàng trong phòng tối
  public startCandleCrackle() {
    if (this.isMuted) return;
    this.stopCandleCrackle();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const triggerPop = () => {
      if (this.isMuted) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + Math.random() * 1600, ctx.currentTime);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, ctx.currentTime);
        filter.Q.setValueAtTime(3.5, ctx.currentTime);

        const popVol = 0.015 + Math.random() * 0.02;
        gain.gain.setValueAtTime(popVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch {
        // Ignore
      }

      const nextDelay = 140 + Math.random() * 320;
      this.crackleIntervalId = window.setTimeout(triggerPop, nextDelay);
    };

    triggerPop();
  }

  public stopCandleCrackle() {
    if (this.crackleIntervalId !== null) {
      clearTimeout(this.crackleIntervalId);
      this.crackleIntervalId = null;
    }
  }

  // 🎉 Chuỗi hợp âm ngân vang ăn mừng khi nến tắt
  public playCelebrationCheer() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isMuted) return;
        this.playMusicBoxNote(freq, 1.2);
      }, idx * 75);
    });
  }

  // Tiếng ting ting chuông gió nhẹ nhàng khi bấm phím
  public playKeypress(frequency = 523.25) { // C5
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore audio error
    }
  }

  // Tiếng chuông mở khóa ma thuật (Chime chord)
  public playUnlockSuccess() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playKeypress(freq), idx * 120);
    });
  }

  // 🍰 Tiếng cắt bánh kem ngọt ngào + chuông ma thuật
  public playCakeSliceSound() {
    if (this.isMuted) return;
    const notes = [659.25, 880.00, 1046.50, 1318.51]; // E5, A5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playKeypress(freq), idx * 80);
    });
  }

  // 🌸 Tiếng rừng hoa nở rộ lấp lánh (Harp arpeggio blooming chord)
  public playFlowerBloomSound() {
    if (this.isMuted) return;
    const notes = [392.00, 440.00, 523.25, 659.25, 783.99, 880.00, 1046.50, 1318.51]; // G4, A4, C5, E5, G5, A5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.isMuted) this.playMusicBoxNote(freq, 1.4);
      }, idx * 110);
    });
  }

  // Tiếng thổi phù / nến tắt
  public playBlowSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Noise buffer for whoosh/blow sound
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch {
      // Ignore
    }
  }

  // 🎨 Tiếng sơn đổ ào êm dịu (Liquid paint splash swoosh)
  public playPaintSplashSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.8);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  // 💧 Tiếng giọt sơn / chất lỏng nhỏ giọt bloop bloop ASMR cực dễ thương
  public playLiquidDripSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const baseFreq = 420 + Math.random() * 220;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.85, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  // ✨ Tiếng lau kính / lau sơn ASMR nhẹ nhàng
  private lastWipeSoundTime = 0;
  public playWipeSound() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastWipeSoundTime < 120) return;
    this.lastWipeSoundTime = now;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700 + Math.random() * 400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1300 + Math.random() * 300, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignore
    }
  }

  // Giai điệu Happy Birthday (Music Box / Hộp nhạc lấp lánh)
  public playBirthdayMelody() {
    if (this.isMuted) return;
    this.stopMelody();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isMelodyPlaying = true;

    // Frequencies for Happy Birthday in key of C
    // G4 G4 A4 G4 C5 B4 | G4 G4 A4 G4 D5 C5 | G4 G4 G5 E5 C5 B4 A4 | F5 F5 E5 C5 D5 C5
    const notes = [
      { f: 392.00, d: 350 }, { f: 392.00, d: 350 }, { f: 440.00, d: 700 }, { f: 392.00, d: 700 }, { f: 523.25, d: 700 }, { f: 493.88, d: 1400 },
      { f: 392.00, d: 350 }, { f: 392.00, d: 350 }, { f: 440.00, d: 700 }, { f: 392.00, d: 700 }, { f: 587.33, d: 700 }, { f: 523.25, d: 1400 },
      { f: 392.00, d: 350 }, { f: 392.00, d: 350 }, { f: 783.99, d: 700 }, { f: 659.25, d: 700 }, { f: 523.25, d: 700 }, { f: 493.88, d: 700 }, { f: 440.00, d: 1400 },
      { f: 698.46, d: 350 }, { f: 698.46, d: 350 }, { f: 659.25, d: 700 }, { f: 523.25, d: 700 }, { f: 587.33, d: 700 }, { f: 523.25, d: 1600 },
    ];

    let accumulatedTime = 0;
    notes.forEach((note) => {
      const timerId = window.setTimeout(() => {
        if (!this.isMelodyPlaying || this.isMuted) return;
        this.playMusicBoxNote(note.f, note.d / 1000);
      }, accumulatedTime);

      this.melodyTimeoutIds.push(timerId);
      accumulatedTime += note.d * 0.9;
    });
  }

  private playMusicBoxNote(freq: number, duration: number) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine + slightly bell-like harmonic
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(duration, 0.8));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + Math.max(duration, 0.8));
    } catch {
      // Ignore
    }
  }

  public stopMelody() {
    this.isMelodyPlaying = false;
    this.melodyTimeoutIds.forEach((id) => clearTimeout(id));
    this.melodyTimeoutIds = [];
  }
}

export const soundManager = new SoundManager();
