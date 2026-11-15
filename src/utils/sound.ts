'use client';

// Web Audio API Sound Synthesizer: 100% tự sinh âm thanh, không phụ thuộc file MP3 ngoài
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMelodyPlaying: boolean = false;
  private melodyTimeoutIds: number[] = [];

  private crackleIntervalId: number | null = null;
  private phoneIntervalId: number | null = null;
  private ambientIntervalId: number | null = null;
  private isPhoneRinging: boolean = false;
  private isAmbientPlaying: boolean = false;

  // 💣 Cache âm thanh nổ mìn sẵn trong RAM để phát ngay lập tức 0ms không độ trễ
  private explosionAudioBuffer: AudioBuffer | null = null;
  private preloadedExplosionAudio: HTMLAudioElement | null = null;
  private isPreloadingExplosion: boolean = false;

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
      this.stopPhoneRinging();
      this.stopWaitingRoomAmbient();
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

  // ✏️ Tiếng bút chì / mực viết nhẹ lên trang giấy (Pencil Paper Scratch)
  public playPencilWrite() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 600, now);
      filter.Q.setValueAtTime(4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Ignore
    }
  }

  // ⌨️ Âm thanh phím máy đánh chữ cổ điển (Vintage Typewriter Clack)
  public playTypewriterClick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Tiếng va chạm cơ học ngón tay ấn vào phím kim loại (Sharp snappy click)
      const bufferSize = Math.floor(ctx.sampleRate * 0.025);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      filter.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.09, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // 2. Tiếng búa kim loại gõ vào con lăn giấy (Metallic typebar strike)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      // Tần số kim loại hơi biến thiên ngẫu nhiên như máy chữ thật
      const strikeFreq = 620 + Math.random() * 120;
      osc.frequency.setValueAtTime(strikeFreq, now);
      osc.frequency.exponentialRampToValueAtTime(strikeFreq * 0.5, now + 0.045);

      oscGain.gain.setValueAtTime(0.08, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  // 🔔 Tiếng chuông máy đánh chữ "Ding!" ngân vang khi gõ đúng mật khẩu
  public playTypewriterBell() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Chuông đồng thau A6 (~1760Hz) kèm bồi âm kim loại
      const bellFreqs = [1760, 2980, 4720];
      const bellGains = [0.12, 0.05, 0.025];

      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(bellGains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch {
      // Ignore
    }
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

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

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
    // Phát tiếng chuông Ding máy chữ trước, sau đó là hợp âm ma thuật
    this.playTypewriterBell();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playKeypress(freq), 180 + idx * 110);
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

  // 🌸 Tiếng hoa xòe nở êm dịu, du dương, ngọt ngào (Soft ethereal music box chime)
  public playFlowerBloomSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Chỉ 4 nốt êm ái, thanh thoát: F5, A5, C6, E6
    const notes = [698.46, 880.00, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isMuted) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine'; // Dùng sine wave tròn trịa, êm dịu, hoàn toàn không chói tai
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Âm lượng siêu nhẹ nhàng (0.025), êm ái như tiếng thì thầm
          gain.gain.setValueAtTime(0.025, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 1.2);
        } catch {
          // Ignore
        }
      }, idx * 160);
    });
  }

  // 🌸 Tiếng hoa rơi lãng mạn, êm ái như gió thoảng (Descending harp / wind chime)
  public playFlowerFallSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Chuỗi nốt ngũ cung êm dịu rơi dần: G5 -> E5 -> D5 -> C5 -> A4
    const notes = [783.99, 659.25, 587.33, 523.25, 440.00];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isMuted) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.02, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.9);
        } catch {
          // Ignore
        }
      }, idx * 130);
    });
  }

  // 📖 Tiếng lật trang sổ giấy vintage ASMR (Crisp paper rustle / page flip)
  public playPageFlipSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.15);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.16);
    } catch {
      // Ignore
    }
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

  // ==========================================
  // 🏰 ÂM THANH SẢNH CHỜ VINTAGE (WAITING ROOM)
  // ==========================================

  // 0. ✉️ Tiếng cộp đóng dấu sáp & dán tem giấy vintage (Tactile stamp press & paper pop)
  public playStampSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tiếng thịch trầm của con dấu kim loại ấn xuống giấy
      const oscThud = ctx.createOscillator();
      const gainThud = ctx.createGain();
      oscThud.type = 'sine';
      oscThud.frequency.setValueAtTime(140, now);
      oscThud.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gainThud.gain.setValueAtTime(0.06, now);
      gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      oscThud.connect(gainThud);
      gainThud.connect(ctx.destination);

      oscThud.start(now);
      oscThud.stop(now + 0.09);

      // Tiếng ma sát giấy sột soạt nhẹ
      const oscCrisp = ctx.createOscillator();
      const gainCrisp = ctx.createGain();
      oscCrisp.type = 'triangle';
      oscCrisp.frequency.setValueAtTime(850, now);
      oscCrisp.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gainCrisp.gain.setValueAtTime(0.02, now);
      gainCrisp.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      oscCrisp.connect(gainCrisp);
      gainCrisp.connect(ctx.destination);

      oscCrisp.start(now);
      oscCrisp.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // 1. ✨ Âm thanh khi tìm thấy một món đồ bí mật (Chime pha lê nhẹ nhàng)
  public playItemFoundSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Chuỗi 3 nốt nhạc thần tiên nhẹ tênh: E5 -> G#5 -> B5 -> E6
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isMuted) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.035, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.7);
        } catch {
          // Ignore
        }
      }, idx * 110);
    });
  }

  // 2. 📞 Âm thanh tiếng chuông điện thoại cổ (Dual-bell rotary phone ring)
  public startPhoneRinging() {
    if (this.isMuted || this.isPhoneRinging) return;
    this.stopPhoneRinging();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPhoneRinging = true;

    const playOneRingCycle = () => {
      if (!this.isPhoneRinging || this.isMuted) return;

      try {
        // Chuông đôi điện thoại cổ: 440Hz + 480Hz dao động 20 lần/giây (búa gõ 20Hz)
        const dur = 1.6; // Đổ chuông trong 1.6 giây
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const amMod = ctx.createOscillator(); // Bộ dao động búa gõ
        const amGain = ctx.createGain();
        const mainGain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        // Búa gõ rung cơ học 20Hz
        amMod.type = 'square';
        amMod.frequency.setValueAtTime(20, now);

        amGain.gain.setValueAtTime(0.5, now);
        amMod.connect(amGain.gain);

        mainGain.gain.setValueAtTime(0.065, now);
        mainGain.gain.linearRampToValueAtTime(0.075, now + 0.1);
        mainGain.gain.setValueAtTime(0.075, now + dur - 0.2);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc1.connect(amGain);
        osc2.connect(amGain);
        amGain.connect(mainGain);
        mainGain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        amMod.start(now);

        osc1.stop(now + dur);
        osc2.stop(now + dur);
        amMod.stop(now + dur);
      } catch {
        // Ignore
      }

      // Khoảng nghỉ giữa các hồi chuông là 2.4 giây (chu kỳ 4 giây)
      if (this.isPhoneRinging) {
        this.phoneIntervalId = window.setTimeout(playOneRingCycle, 4000);
      }
    };

    playOneRingCycle();
  }

  public stopPhoneRinging() {
    this.isPhoneRinging = false;
    if (this.phoneIntervalId !== null) {
      clearTimeout(this.phoneIntervalId);
      this.phoneIntervalId = null;
    }
  }

  // 3. 📞 Tiếng nhấc ống nghe điện thoại cơ học (Pickup click & line hum)
  public playPhonePickupSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tiếng cạch cơ học khi nhấc cần gạt
      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      oscClick.type = 'triangle';
      oscClick.frequency.setValueAtTime(950, now);
      oscClick.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gainClick.gain.setValueAtTime(0.07, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      oscClick.connect(gainClick);
      gainClick.connect(ctx.destination);

      oscClick.start(now);
      oscClick.stop(now + 0.06);

      // Tiếng tút thông tuyến nhẹ
      const oscHum = ctx.createOscillator();
      const gainHum = ctx.createGain();
      oscHum.type = 'sine';
      oscHum.frequency.setValueAtTime(425, now + 0.06);

      gainHum.gain.setValueAtTime(0.02, now + 0.06);
      gainHum.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      oscHum.connect(gainHum);
      gainHum.connect(ctx.destination);

      oscHum.start(now + 0.06);
      oscHum.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }

  // 4. 📞 Tiếng nhấp điện thoại khi chưa đến giờ (Idle click + subtle tone)
  public playPhoneIdleClick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  // 5. 📻 Nhạc nền sảnh chờ nhẹ nhàng, du dương (Ambient vintage music box)
  public startWaitingRoomAmbient() {
    if (this.isMuted || this.isAmbientPlaying) return;
    this.stopWaitingRoomAmbient();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isAmbientPlaying = true;

    // Chuỗi hợp âm nhẹ tênh gợi cảm giác ấm cúng, tò mò
    const chords = [
      [392.00, 493.88, 587.33], // G major
      [329.63, 392.00, 493.88], // E minor
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D major
    ];

    let chordIdx = 0;

    const playAmbientChord = () => {
      if (!this.isAmbientPlaying || this.isMuted) return;

      const currentChord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      currentChord.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.isAmbientPlaying || this.isMuted) return;
          try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Âm lượng siêu nhỏ (0.012) để làm nền êm ái
            gain.gain.setValueAtTime(0.012, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 1.9);
          } catch {
            // Ignore
          }
        }, i * 220);
      });

      if (this.isAmbientPlaying) {
        this.ambientIntervalId = window.setTimeout(playAmbientChord, 3400);
      }
    };

    playAmbientChord();
  }

  public stopWaitingRoomAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientIntervalId !== null) {
      clearTimeout(this.ambientIntervalId);
      this.ambientIntervalId = null;
    }
  }

  // ⭐ Tiếng hứng trúng ngôi sao (Crystal Chime ngọt ngào thang âm ngũ cung)
  public playStarCatchSound(streak = 0) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const pentatonicScale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const baseFreq = pentatonicScale[streak % pentatonicScale.length];
      const now = ctx.currentTime;

      // Nốt chính sine êm dịu
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);

      // Nốt bội âm chuông pha lê (chime sparkle harmonic)
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(baseFreq * 2, now);

      chimeGain.gain.setValueAtTime(0.015, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now);
      chimeOsc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  // 🌌 Tiếng thác sao bùng nổ khi đến 00:00 (Magical Star Waterfall & Celestial Chime Glissando)
  public playStarCascadeSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // 1. Dải âm chuông gió thiên hà lướt nhanh vút lên (Celestial harp & wind chime glissando)
      const celestialNotes = [
        523.25, 659.25, 783.99, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00, 2637.02,
      ];

      celestialNotes.forEach((freq, idx) => {
        setTimeout(() => {
          if (this.isMuted) return;
          try {
            const now = ctx.currentTime;

            // Âm chính (Sine mềm trong trẻo, êm dịu)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Âm bổng lấp lánh (Triangle shimmer overtone dịu nhẹ)
            const oscOvertone = ctx.createOscillator();
            const gainOvertone = ctx.createGain();
            oscOvertone.type = 'triangle';
            oscOvertone.frequency.setValueAtTime(freq * 2, now);

            gain.gain.setValueAtTime(0.025, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

            gainOvertone.gain.setValueAtTime(0.008, now);
            gainOvertone.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

            osc.connect(gain);
            gain.connect(ctx.destination);
            oscOvertone.connect(gainOvertone);
            gainOvertone.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 1.9);
            oscOvertone.start(now);
            oscOvertone.stop(now + 1.3);
          } catch {
            // Ignore
          }
        }, idx * 60);
      });

      // 2. Hợp âm ngân vang ấm áp kéo dài kết nối liền mạch qua thời khắc che kín màn hình
      setTimeout(() => {
        if (this.isMuted) return;
        try {
          const warmChord = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
          const now = ctx.currentTime;
          warmChord.forEach((f) => {
            const chordOsc = ctx.createOscillator();
            const chordGain = ctx.createGain();
            chordOsc.type = 'sine';
            chordOsc.frequency.setValueAtTime(f, now);
            chordGain.gain.setValueAtTime(0.02, now);
            chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

            chordOsc.connect(chordGain);
            chordGain.connect(ctx.destination);
            chordOsc.start(now);
            chordOsc.stop(now + 2.5);
          });
        } catch {
          // Ignore
        }
      }, 500);
    } catch {
      // Ignore
    }
  }

  // 💣 Tải trước và giải mã âm thanh nổ mìn sẵn vào RAM để phát với độ trễ 0ms (Zero-latency)
  public preloadExplosionSound() {
    if (typeof window === 'undefined') return;
    if (this.explosionAudioBuffer || this.isPreloadingExplosion) return;
    this.isPreloadingExplosion = true;

    // 1. Tạo sẵn thẻ Audio preloaded
    if (!this.preloadedExplosionAudio) {
      try {
        const audio = new Audio('/mine-explosion.mp3');
        audio.preload = 'auto';
        audio.volume = 1.0;
        audio.load();
        this.preloadedExplosionAudio = audio;
      } catch {
        // Ignore
      }
    }

    // 2. Fetch & giải mã nhị phân vào Web Audio Buffer (độ trễ tuyệt đối 0ms)
    const ctx = this.getAudioContext();
    if (!ctx) {
      this.isPreloadingExplosion = false;
      return;
    }

    fetch('/mine-explosion.mp3')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load mine-explosion.mp3');
        return res.arrayBuffer();
      })
      .then((arrayBuf) => {
        ctx.decodeAudioData(
          arrayBuf,
          (decoded) => {
            this.explosionAudioBuffer = decoded;
            this.isPreloadingExplosion = false;
          },
          () => {
            this.isPreloadingExplosion = false;
          }
        );
      })
      .catch(() => {
        this.isPreloadingExplosion = false;
      });
  }

  // 💣 Âm thanh nổ mìn: Phát tức thì 0ms không độ trễ ngay khi chạm
  public playMineExplosionSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();

    // 1. ƯU TIÊN SỐ 1: Web Audio Buffer đã giải mã sẵn trong RAM (0ms latency tuyệt đối)
    if (ctx && this.explosionAudioBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = this.explosionAudioBuffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        return;
      } catch (e) {
        console.warn('Web Audio buffer error, fallback to HTML5 Audio', e);
      }
    }

    // 2. ƯU TIÊN SỐ 2: HTMLAudioElement đã preload sẵn
    if (this.preloadedExplosionAudio) {
      try {
        this.preloadedExplosionAudio.currentTime = 0;
        this.preloadedExplosionAudio.volume = 1.0;
        const p = this.preloadedExplosionAudio.play();
        if (p) {
          p.catch(() => {
            this.playSyntheticExplosion();
          });
        }
        return;
      } catch {
        // Fallback
      }
    }

    // 3. Fallback: Phát trực tiếp file mp3 mới hoặc âm tổng hợp
    try {
      const audio = new Audio('/mine-explosion.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {
        this.playSyntheticExplosion();
      });
    } catch {
      this.playSyntheticExplosion();
    }
  }

  // Tiếng nổ bùm mô phỏng bằng Web Audio Synthesizer (tiếng nổ trầm chấn động)
  public playSyntheticExplosion() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Tiếng sub-bass chấn động (rơi từ 140Hz xuống 25Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.8);

      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.3);

      // 2. Tiếng nổ rền vang (White noise qua lowpass filter)
      const bufferSize = Math.floor(ctx.sampleRate * 1.0);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(45, now + 0.9);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 1.2);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();
