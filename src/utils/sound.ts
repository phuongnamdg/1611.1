'use client';

// Web Audio API Sound Synthesizer: 100% tự sinh âm thanh, không phụ thuộc file MP3 ngoài
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMelodyPlaying: boolean = false;
  private melodyTimeoutIds: number[] = [];

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
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
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
