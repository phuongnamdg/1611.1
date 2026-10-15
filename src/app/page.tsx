'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Lock,
  Heart,
  Sparkles,
  Delete,
  KeyRound,
  Mic,
  MicOff,
  Gift,
  ArrowRight,
  Music,
  Mail,
  Flower2,
  Disc3,
  CheckCircle2,
  Send,
  Moon,
  Stars,
  RotateCcw,
  Check,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';

// =============================================================================
// 🎵 1. BỘ TẠO ÂM THANH TỰ ĐỘNG (WEB AUDIO API - KHÔNG CẦN TẢI FILE MP3 NGOÀI)
// =============================================================================
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMelodyPlaying: boolean = false;
  private melodyTimeoutIds: number[] = [];

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopMelody();
  }

  public playKeypress(freq = 523.25) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  public playUnlockSuccess() {
    if (this.isMuted) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playKeypress(freq), idx * 120);
    });
  }

  public playBlowSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

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
    } catch {}
  }

  public playBirthdayMelody() {
    if (this.isMuted) return;
    this.stopMelody();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isMelodyPlaying = true;
    const notes = [
      { f: 392.0, d: 350 }, { f: 392.0, d: 350 }, { f: 440.0, d: 700 }, { f: 392.0, d: 700 }, { f: 523.25, d: 700 }, { f: 493.88, d: 1400 },
      { f: 392.0, d: 350 }, { f: 392.0, d: 350 }, { f: 440.0, d: 700 }, { f: 392.0, d: 700 }, { f: 587.33, d: 700 }, { f: 523.25, d: 1400 },
      { f: 392.0, d: 350 }, { f: 392.0, d: 350 }, { f: 783.99, d: 700 }, { f: 659.25, d: 700 }, { f: 523.25, d: 700 }, { f: 493.88, d: 700 }, { f: 440.0, d: 1400 },
      { f: 698.46, d: 350 }, { f: 698.46, d: 350 }, { f: 659.25, d: 700 }, { f: 523.25, d: 700 }, { f: 587.33, d: 700 }, { f: 523.25, d: 1600 },
    ];

    let accumulatedTime = 0;
    notes.forEach((note) => {
      const timerId = window.setTimeout(() => {
        if (!this.isMelodyPlaying || this.isMuted) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(note.d / 1000, 0.8));
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + Math.max(note.d / 1000, 0.8));
        } catch {}
      }, accumulatedTime);
      this.melodyTimeoutIds.push(timerId);
      accumulatedTime += note.d * 0.9;
    });
  }

  public stopMelody() {
    this.isMelodyPlaying = false;
    this.melodyTimeoutIds.forEach((id) => clearTimeout(id));
    this.melodyTimeoutIds = [];
  }
}

const sound = new SoundManager();

// =============================================================================
// 🌸 2. HIỆU ỨNG CÁNH HOA ANH ĐÀO RƠI 60FPS
// =============================================================================
function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const colors = [
      'rgba(255, 183, 197, 0.75)',
      'rgba(255, 192, 203, 0.65)',
      'rgba(255, 220, 228, 0.8)',
      'rgba(255, 240, 245, 0.7)',
      'rgba(255, 160, 180, 0.6)',
    ];

    const count = Math.min(32, Math.floor(width / 35));
    const petals = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 8,
      speedX: Math.random() * 1.5 - 0.5,
      speedY: Math.random() * 1.2 + 0.8,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) * 0.8 + p.speedX;
        p.rot += p.rotSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        else if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, p.size / 3, 0, p.size);
        ctx.bezierCurveTo(-p.size, p.size / 3, -p.size / 2, -p.size / 2, 0, 0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = 'rgba(255, 182, 193, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" aria-hidden="true" />;
}

// =============================================================================
// 🎂 3. TRANG CHÍNH: GỘP TOÀN BỘ 5 MÀN HÌNH VÀO 1 NƠI DUY NHẤT
// =============================================================================
export default function BirthdayAllInOnePage() {
  // Trạng thái màn hình hiện tại: 1 -> 2 -> 3 -> 4 -> 5
  const [scene, setScene] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Màn 1: Mã PIN
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Màn 2: Nến & Mic
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);
  const [currentWishIndex, setCurrentWishIndex] = useState<number>(0);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Màn 3: 3 Hộp Quà
  const [selectedGift, setSelectedGift] = useState<'FLOWER' | 'MUSIC' | 'LETTER' | null>(null);
  const [openedGifts, setOpenedGifts] = useState<{ [key: string]: boolean }>({});

  // Màn 4: Điều ước
  const [wishInput, setWishInput] = useState<string>('');
  const [isWishSent, setIsWishSent] = useState<boolean>(false);
  const [wishError, setWishError] = useState<string>('');

  // Màn 5: Thiệp cuối & Bắn tim
  const [heartCount, setHeartCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Bật/Tắt âm thanh
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // Hàm bắn pháo hoa Confetti
  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FFB7C5', '#FF69B4', '#FFD700', '#FFF0F5', '#FF1493'],
    });
  };

  // Tự xoay lời chúc ở Màn 2
  useEffect(() => {
    if (scene === 2) {
      fireConfetti();
      sound.playBirthdayMelody();
      const interval = setInterval(() => {
        setCurrentWishIndex((prev) => (prev + 1) % 4);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [scene]);

  // Xử lý nến tắt
  const handleBlowCandle = () => {
    if (isCandleBlown) return;
    setIsCandleBlown(true);
    sound.playBlowSound();
    stopMic();
    setTimeout(() => fireConfetti(), 200);
  };

  // Micro thổi nến
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsMicListening(true);

      const loop = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((acc, v) => acc + v, 0) / dataArray.length;
        if (avg > 65) {
          handleBlowCandle();
          return;
        }
        requestAnimationFrame(loop);
      };
      loop();
    } catch {
      alert('Em không mở micro sao?. Em chạm tay trực tiếp vào ngọn nến nha!');
      setIsMicListening(false);
    }
  };

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsMicListening(false);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* 🌸 Hiệu ứng cánh hoa anh đào bay */}
      <SakuraPetals />

      {/* 🔊 Nút Bật/Tắt Âm Thanh Góc Phải */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={toggleSound}
          className="p-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-pink-200 shadow-md text-pink-600 transition-all hover:scale-105 active:scale-95"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-pink-500 animate-pulse" />}
        </button>
      </div>

      {/* 🧭 Thanh Tiến Trình 5 Bước */}
      {scene !== 1 && (
        <div className="fixed top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-pink-200 text-xs font-bold text-pink-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          <span>
            {scene === 2 && '1. Chúc Mừng & Thổi Nến'}
            {scene === 3 && '2. Mở Hộp Quà'}
            {scene === 4 && '3. Thả Đèn Ước'}
            {scene === 5 && '4. Kỷ Niệm'}
          </span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🔒 [PHẦN 1] MÀN HÌNH ĐĂNG NHẬP MẬT MÃ NGÀY SINH                       */}
      {/* ===================================================================== */}
      <AnimatePresence mode="wait">
        {scene === 1 && (
          <motion.div
            key="scene-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8 w-full"
          >
            {/* KHUNG CARD CHÍNH 2 CỘT (GIỐNG HỆT VIDEO TIKTOK MẪU) */}
            <div className="w-full max-w-lg sm:max-w-xl bg-white/95 backdrop-blur-xl rounded-[32px] p-5 sm:p-7 shadow-[0_20px_50px_rgba(255,182,193,0.35)] border border-pink-100 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              
              {/* CỘT TRÁI: KHUNG ẢNH CÔNG CHÚA (TỰ ĐỘNG LẤY TỪ public/avatar.jpg) */}
              <div className="w-44 sm:w-[200px] flex-shrink-0 flex flex-col items-center">
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border-2 border-pink-100 bg-pink-50 relative group">
                  {/* 👇 ĐƯỜNG DẪN ẢNH: Bạn có thể đổi ảnh khác bằng cách ghi đè file public/avatar.jpg 👇 */}
                  <img
                    src="/avatar.jpg"
                    alt="Công chúa"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* CỘT PHẢI: BÀN PHÍM NHẬP NGÀY SINH CÔNG CHÚA */}
              <div className="w-full flex flex-col items-center sm:items-start flex-1">
                {/* 👇 BẠN CÓ THỂ SỬA DÒNG TIÊU ĐỀ NÀY 👇 */}
                <h2 className="text-[#db6e6e] font-bold text-sm sm:text-base mb-3 text-center sm:text-left w-full tracking-wide">
                  Hãy nhập ngày sinh của công chúa
                </h2>

                {/* Ô hiển thị số nhập vào (Tone màu cam/đào pastel) */}
                <div className="w-full h-11 sm:h-12 rounded-xl bg-[#fedfd2] border border-[#faccc0] flex items-center justify-center text-[#c25e5e] font-bold text-xl tracking-[0.25em] px-4 shadow-inner mb-3">
                  {pin.length > 0 ? (
                    pin.split('').map((char, i) => (
                      <span key={i} className="mx-1">
                        {char}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#e2a898] tracking-normal text-sm font-semibold">
                      ••••
                    </span>
                  )}
                </div>

                {/* Thông báo lỗi nếu bấm sai ngày sinh */}
                {pinError && (
                  <p className="text-xs text-rose-500 font-semibold mb-2 text-center w-full animate-shake">
                    {pinError}
                  </p>
                )}

                {/* BÀN PHÍM SỐ CẢM ỨNG 3x4 (TONE MÀU BEIGE / CAM ĐÀO) */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => {
                        sound.playKeypress();
                        if (pin.length < 4) {
                          const next = pin + digit;
                          setPin(next);
                          setPinError('');
                          if (next.length === 4) {
                            // 👇 MẬT KHẨU MẶC ĐỊNH LÀ 1611 (16/11) 👇
                            if (next === '1611') {
                              sound.playUnlockSuccess();
                              setTimeout(() => setScene(2), 600);
                            } else {
                              setPinError('Ủa ủa! Ngày sinh của công chúa mà cũng quên sao? 🌸');
                              sound.playKeypress(200);
                              setTimeout(() => setPin(''), 800);
                            }
                          }
                        }
                      }}
                      className="h-11 rounded-xl bg-[#fff7f2] hover:bg-[#ffede2] text-[#b36363] font-bold text-base border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
                    >
                      {digit}
                    </button>
                  ))}

                  {/* Nút C (Clear / Xóa hết) */}
                  <button
                    onClick={() => {
                      sound.playKeypress(400);
                      setPin('');
                      setPinError('');
                    }}
                    className="h-11 rounded-xl bg-[#fff7f2] hover:bg-rose-50 text-[#c25e5e] font-bold text-sm border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
                  >
                    C
                  </button>

                  {/* Phím 0 */}
                  <button
                    onClick={() => {
                      sound.playKeypress();
                      if (pin.length < 4) {
                        const next = pin + '0';
                        setPin(next);
                        setPinError('');
                        if (next.length === 4) {
                          if (next === '1611') {
                            sound.playUnlockSuccess();
                            setTimeout(() => setScene(2), 600);
                          } else {
                            setPinError('Ủa ủa! Ngày sinh của công chúa mà cũng quên sao? 🌸');
                            sound.playKeypress(200);
                            setTimeout(() => setPin(''), 800);
                          }
                        }
                      }
                    }}
                    className="h-11 rounded-xl bg-[#fff7f2] hover:bg-[#ffede2] text-[#b36363] font-bold text-base border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
                  >
                    0
                  </button>

                  {/* Phím Xóa 1 số (Backspace) */}
                  <button
                    onClick={() => {
                      sound.playKeypress(400);
                      setPin((prev) => prev.slice(0, -1));
                      setPinError('');
                    }}
                    className="h-11 rounded-xl bg-[#fff7f2] hover:bg-rose-50 text-[#c25e5e] font-bold text-base border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
                    aria-label="Xóa"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 👇 DÒNG CHỮ QUOTE LÃNG MẠN PHÍA DƯỚI (GIỐNG ẢNH MẪU) 👇 */}
            <div className="mt-8 text-center tracking-[0.25em] text-xs sm:text-sm font-semibold uppercase text-stone-700/80">
              <p className="text-stone-400 text-lg mb-0.5">&ldquo;</p>
              <p className="leading-relaxed">VẠN CÁI</p>
              <p className="leading-relaxed">NẮM ĐÔI BÀN TAY</p>
              <p className="text-stone-400 text-lg mt-0.5">&rdquo;</p>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* 🎂 [PHẦN 2] MÀN HÌNH BÁNH KEM, THỔI NẾN VÀ BẮN PHÁO BÔNG             */}
        {/* ===================================================================== */}
        {scene === 2 && (
          <motion.div
            key="scene-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full"
          >
            {/* 👇 BẠN CÓ THỂ SỬA TIÊU ĐỀ MÀN 2 VÀ TÊN NGƯỜI NHẬN TẠI ĐÂY 👇 */}
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-2 shadow-sm border border-pink-200">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                Happy Birthday 16 Tháng 11
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent leading-tight py-1">
                Chúc Mừng Sinh Nhật
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 flex items-center justify-center gap-2">
                Bé Yêu
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500 inline animate-bounce" />
              </h2>
            </div>

            {/* 👇 BẠN CÓ THỂ SỬA 4 LỜI CHÚC MẶC ĐỊNH CHẠY LƯỚT TẠI ĐÂY 👇 */}
            <div className="w-full my-3 min-h-[70px] flex items-center justify-center px-2">
              <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-pink-200/90 shadow-md text-stone-700 text-sm sm:text-base font-semibold leading-relaxed">
                {currentWishIndex === 0 && '🌸 Chúc bạn một tuổi mới luôn ngập tràn nụ cười và hạnh phúc rạng ngời!'}
                {currentWishIndex === 1 && '🎂 Tuổi mới thêm nhiều niềm vui mới, thành công mới và luôn là chính mình!'}
                {currentWishIndex === 2 && '✨ Mong cho tất cả những ước mơ dịu dàng nhất của bạn đều trở thành hiện thực!'}
                {currentWishIndex === 3 && '💖 Cảm ơn vì bạn đã xuất hiện và làm cho thế giới này trở nên dễ thương hơn!'}
              </div>
            </div>

            {/* Bánh kem & Ngọn nến thổi tắt */}
            <div className="relative flex flex-col items-center my-1">
              {/* Ngọn nến */}
              <div
                onClick={handleBlowCandle}
                className="relative cursor-pointer group flex flex-col items-center"
                title="Chạm vào để thổi tắt nến!"
              >
                {!isCandleBlown ? (
                  <motion.div
                    animate={{ scale: [1, 1.15, 0.95, 1.1, 1], rotate: [-2, 3, -1, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    className="relative w-6 h-10 mb-[-4px]"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100 blur-[2px] shadow-[0_0_15px_#f59e0b]" />
                    <div className="absolute top-1 left-1.5 w-3 h-6 rounded-full bg-white/80" />
                  </motion.div>
                ) : (
                  <div className="w-4 h-8 flex items-center justify-center text-stone-400 text-sm select-none">
                    ☁️
                  </div>
                )}
                {/* Thân nến */}
                <div className="w-4 h-14 rounded-t-md bg-gradient-to-b from-pink-200 via-white to-pink-300 border border-pink-400/50 shadow-inner relative overflow-hidden" />
              </div>

              {/* Bánh kem 2 tầng */}
              <div className="relative flex flex-col items-center mt-[-2px]">
                <div className="w-36 h-16 rounded-t-2xl bg-gradient-to-b from-pink-100 via-pink-200 to-rose-200 border-2 border-pink-300 shadow-md relative overflow-hidden flex items-center justify-center">
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/90 rounded-b-xl border-b border-pink-200" />
                  <div className="flex gap-2 z-10 text-xs">
                    <span>🍓</span>
                    <span>🌸</span>
                    <span>🍓</span>
                  </div>
                </div>

                <div className="w-52 h-20 rounded-t-3xl rounded-b-xl bg-gradient-to-b from-rose-200 via-pink-100 to-pink-200 border-2 border-pink-300 shadow-xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute top-0 inset-x-0 h-5 bg-white/90 rounded-b-2xl border-b border-pink-200" />
                  <div className="flex gap-4 z-10 mt-2">
                    <span className="text-sm">🌸</span>
                    <span className="text-xs font-bold text-pink-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-pink-200">
                      16.11
                    </span>
                    <span className="text-sm">🌸</span>
                  </div>
                </div>

                <div className="w-64 h-3.5 rounded-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 shadow-md border border-amber-300" />
              </div>

              {/* Nút bật Micro hoặc hướng dẫn chạm */}
              <div className="mt-4 flex flex-col items-center">
                {!isCandleBlown ? (
                  <>
                    <p className="text-xs font-semibold text-pink-700 bg-pink-100/80 px-3.5 py-1 rounded-full border border-pink-200 animate-pulse">
                      👉 Chạm vào nến hoặc dùng Micro để thổi tắt nến nhé!
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {!isMicListening ? (
                        <button
                          onClick={startMic}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-pink-600 text-xs font-bold border border-pink-200 shadow-sm transition-all"
                        >
                          <Mic className="w-3.5 h-3.5 text-pink-500" />
                          Bật Micro để thổi nến
                        </button>
                      ) : (
                        <button
                          onClick={stopMic}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 shadow-sm animate-bounce"
                        >
                          <MicOff className="w-3.5 h-3.5 text-rose-500" />
                          Đang lắng nghe... Thổi vào mic đi nào!
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-base font-bold text-pink-600 flex items-center justify-center gap-1">
                    🎉 Nến đã tắt! Tuổi mới vạn điều như ý! 🎉
                  </p>
                )}
              </div>
            </div>

            {/* Nút Chuyển Màn 3 */}
            <div className="w-full mt-4 pb-2">
              <button
                onClick={() => setScene(3)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/50 flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
              >
                <Gift className="w-5 h-5 text-amber-200 animate-spin" />
                Mở 3 Chiếc Hộp Bí Mật
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* 🎁 [PHẦN 3] MÀN HÌNH 3 CHIẾC HỘP BÍ MẬT (HOA - NHẠC - THIỆP TỰ VIẾT)  */}
        {/* ===================================================================== */}
        {scene === 3 && (
          <motion.div
            key="scene-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full"
          >
            {/* 👇 BẠN CÓ THỂ SỬA TIÊU ĐỀ MÀN 3 TẠI ĐÂY 👇 */}
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-1 border border-pink-200">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                Món Quà Dành Cho Bạn
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent py-1">
                3 Chiếc Hộp Bí Mật
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5 font-medium">
                Chạm vào chiếc hộp bạn muốn mở trước (bạn có thể khám phá cả 3 hộp nhé!)
              </p>
            </div>

            {/* 3 Hộp Quà */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full my-6">
              {/* HỘP 1: BÓ HOA */}
              <div
                onClick={() => {
                  sound.playUnlockSuccess();
                  setSelectedGift('FLOWER');
                  setOpenedGifts((p) => ({ ...p, FLOWER: true }));
                }}
                className="cursor-pointer relative p-5 rounded-3xl bg-white/85 backdrop-blur-md border-2 border-pink-200 shadow-lg flex flex-col items-center hover:scale-105 active:scale-95 transition-all"
              >
                {openedGifts['FLOWER'] && (
                  <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-500 absolute top-2.5 right-2.5" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center shadow-md mb-3">
                  <Flower2 className="w-10 h-10 text-white animate-pulse" />
                </div>
                <span className="text-xs font-bold text-pink-600 uppercase mb-1">Hộp Quà 1</span>
                <h3 className="text-sm font-bold text-stone-800">Bó Hoa Tươi Thắm</h3>
                <p className="text-xs text-pink-500 mt-0.5 font-medium">Rạng ngời & Ngát hương</p>
              </div>

              {/* HỘP 2: ÂM NHẠC */}
              <div
                onClick={() => {
                  sound.playUnlockSuccess();
                  sound.playBirthdayMelody();
                  setSelectedGift('MUSIC');
                  setOpenedGifts((p) => ({ ...p, MUSIC: true }));
                }}
                className="cursor-pointer relative p-5 rounded-3xl bg-white/85 backdrop-blur-md border-2 border-pink-200 shadow-lg flex flex-col items-center hover:scale-105 active:scale-95 transition-all"
              >
                {openedGifts['MUSIC'] && (
                  <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-500 absolute top-2.5 right-2.5" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center shadow-md mb-3">
                  <Music className="w-10 h-10 text-white animate-bounce" />
                </div>
                <span className="text-xs font-bold text-purple-600 uppercase mb-1">Hộp Quà 2</span>
                <h3 className="text-sm font-bold text-stone-800">Giai Điệu Tuổi Mới</h3>
                <p className="text-xs text-purple-500 mt-0.5 font-medium">Âm vang ngọt ngào</p>
              </div>

              {/* HỘP 3: BỨC THƯ TAY */}
              <div
                onClick={() => {
                  sound.playUnlockSuccess();
                  setSelectedGift('LETTER');
                  setOpenedGifts((p) => ({ ...p, LETTER: true }));
                }}
                className="cursor-pointer relative p-5 rounded-3xl bg-white/85 backdrop-blur-md border-2 border-pink-200 shadow-lg flex flex-col items-center hover:scale-105 active:scale-95 transition-all"
              >
                {openedGifts['LETTER'] && (
                  <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-500 absolute top-2.5 right-2.5" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 flex items-center justify-center shadow-md mb-3">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <span className="text-xs font-bold text-rose-600 uppercase mb-1">Hộp Quà 3</span>
                <h3 className="text-sm font-bold text-stone-800">Bức Thư Tay Bí Mật</h3>
                <p className="text-xs text-rose-500 mt-0.5 font-medium">Gửi gắm chân thành</p>
              </div>
            </div>

            <p className="text-sm text-pink-700 font-semibold">
              Đã khám phá: <span className="font-bold text-pink-600">{Object.keys(openedGifts).length}/3</span> món quà 🌸
            </p>

            {/* Nút Chuyển Màn 4 */}
            <div className="w-full mt-4 pb-2">
              <button
                onClick={() => setScene(4)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/50 flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-200" />
                Gửi Gắm Điều Ước Tuổi Mới
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL CHI TIẾT MÓN QUÀ (TỰ SỬA LỜI NHẮN, THƯ TAY Ở ĐÂY) */}
            <AnimatePresence>
              {selectedGift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
                  <div className="relative w-full max-w-sm p-6 rounded-3xl bg-white border border-pink-200 shadow-2xl flex flex-col items-center text-center max-h-[85vh] overflow-y-auto">
                    {/* 👇 NỘI DUNG HỘP 1: BÓ HOA TƯƠI 👇 */}
                    {selectedGift === 'FLOWER' && (
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-5xl mb-3">
                          💐
                        </div>
                        <h3 className="text-xl font-bold text-pink-600">Bó Hoa Tươi Thắm Nhất</h3>
                        <p className="text-xs text-pink-400 mt-1 mb-4 font-medium">Dành riêng cho Bé Yêu</p>
                        <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 text-stone-700 text-sm leading-relaxed font-medium">
                          Gửi tặng bạn một bó hoa tươi thắm nhất! Mong nụ cười của bạn sẽ mãi rạng ngời, ngọt ngào và tươi tắn như những đóa hoa mùa xuân.
                        </div>
                        <div className="flex gap-2 text-2xl mt-4">
                          <span>🌷</span>
                          <span>🌹</span>
                          <span>🌸</span>
                          <span>🌺</span>
                          <span>🌻</span>
                        </div>
                      </div>
                    )}

                    {/* 👇 NỘI DUNG HỘP 2: ÂM NHẠC 👇 */}
                    {selectedGift === 'MUSIC' && (
                      <div className="flex flex-col items-center w-full">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                          className="w-24 h-24 rounded-full bg-stone-900 border-4 border-stone-700 flex items-center justify-center shadow-xl mb-3 relative"
                        >
                          <Disc3 className="w-14 h-14 text-pink-400" />
                          <div className="w-5 h-5 rounded-full bg-pink-500 absolute" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-purple-700">Happy Birthday to You 🎵</h3>
                        <p className="text-xs text-purple-400 mb-4 font-medium">Melody of Love & Joy</p>
                        <div className="w-full p-4 rounded-2xl bg-purple-50 border border-purple-100 text-stone-700 text-sm leading-relaxed">
                          <p className="text-base text-purple-900 leading-relaxed font-semibold italic">
                            &ldquo;Happy Birthday to You,<br />
                            Happy Birthday to You,<br />
                            Happy Birthday dear Bé Yêu,<br />
                            Happy Birthday to You!&rdquo; 🎵
                          </p>
                        </div>
                        <button
                          onClick={() => sound.playBirthdayMelody()}
                          className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-2"
                        >
                          <Music className="w-3.5 h-3.5" />
                          Phát Lại Giai Điệu
                        </button>
                      </div>
                    )}

                    {/* 👇 NỘI DUNG HỘP 3: THIỆP TÂM THƯ BÍ MẬT DO CHÍNH BẠN VIẾT 👇 */}
                    {selectedGift === 'LETTER' && (
                      <div className="flex flex-col items-center w-full text-left">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-3xl mb-2 mx-auto">
                          💌
                        </div>
                        <h3 className="text-xl font-bold text-rose-600 text-center w-full mb-3">
                          Thư Gửi Bé Yêu
                        </h3>
                        <div className="w-full p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-sm leading-relaxed space-y-3 font-medium">
                          <p>Gửi bạn,</p>
                          <p>
                            Hôm nay là một ngày vô cùng đặc biệt — ngày mà một thiên thần nhỏ đáng yêu đã có mặt trên thế giới này.
                          </p>
                          <p>
                            Mình tự tay làm trang web nhỏ này, gấp từng dòng code như gấp những cánh hoa anh đào gửi trao đến bạn. Mong rằng bạn sẽ cảm nhận được sự ấm áp và chân thành nhất trong từng khoảnh khắc.
                          </p>
                          <p>
                            Chúc bạn tuổi mới luôn bình an trong tâm hồn, kiên định với ước mơ và luôn được bao bọc bởi tình yêu thương của mọi người xung quanh.
                          </p>
                          <p>Happy Birthday! Mong nụ cười luôn nở trên môi bạn mỗi ngày! 🌸🎂</p>
                          <div className="pt-3 text-right text-base font-bold text-rose-600">
                            — Người luôn ủng hộ bạn ❤️
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedGift(null)}
                      className="mt-5 w-full py-2.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold"
                    >
                      Đóng hộp quà & Khám phá tiếp 🌸
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* 🌟 [PHẦN 4] MÀN HÌNH NHẬP DUY NHẤT 1 ĐIỀU ƯỚC & THẢ ĐÈN TRỜI          */}
        {/* ===================================================================== */}
        {scene === 4 && (
          <motion.div
            key="scene-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full"
          >
            {/* 👇 BẠN CÓ THỂ SỬA TIÊU ĐỀ MÀN 4 TẠI ĐÂY 👇 */}
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-1 border border-indigo-200">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                Điều Ước Tuổi Mới
                <Stars className="w-3.5 h-3.5 text-amber-500" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent py-1">
                Gửi Điều Ước Đến Ngàn Vì Sao
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5 font-medium">
                Vũ trụ luôn lắng nghe những điều ước chân thành nhất của bạn
              </p>
            </div>

            <div className="w-full my-auto py-4">
              {!isWishSent ? (
                <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-pink-200 shadow-xl text-left">
                  <label className="block text-xs font-bold text-pink-700 uppercase mb-2 flex items-center justify-between">
                    <span>Nhập tối đa 1 điều ước (Duy nhất)</span>
                    <span className="text-[11px] font-normal text-stone-400">{wishInput.length}/150</span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={150}
                    value={wishInput}
                    onChange={(e) => {
                      setWishInput(e.target.value);
                      setWishError('');
                    }}
                    placeholder="Ví dụ: Ước cho tuổi mới luôn bình an, gia đình hạnh phúc và đạt được mọi dự định ấp ủ..."
                    className="w-full p-4 rounded-2xl bg-pink-50/50 border border-pink-200 focus:border-pink-500 focus:bg-white text-stone-800 text-sm focus:outline-none transition-all resize-none font-medium leading-relaxed"
                  />
                  {wishError && <p className="text-xs text-rose-500 font-medium mt-1 mb-2">{wishError}</p>}
                  <button
                    onClick={() => {
                      if (!wishInput.trim()) {
                        setWishError('Hãy nhập một điều ước nhỏ của bạn trước nhé 🌸');
                        return;
                      }
                      sound.playUnlockSuccess();
                      setIsWishSent(true);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('birthday_wish_1611', wishInput);
                      }
                    }}
                    className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Thả Đèn Trời Mang Theo Điều Ước 🏮
                  </button>
                </div>
              ) : (
                /* HIỆU ỨNG ĐÈN TRỜI BAY VÀO VŨ TRỤ */
                <div className="flex flex-col items-center py-6">
                  <motion.div
                    animate={{ y: [-20, -120, -220], scale: [1, 0.85, 0.5], opacity: [1, 0.9, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-28 h-36 rounded-3xl bg-gradient-to-t from-amber-400 via-orange-300 to-yellow-100 shadow-[0_0_50px_#f59e0b] flex flex-col items-center justify-center p-2.5 text-center border border-amber-200">
                      <span className="text-3xl animate-pulse">🏮</span>
                      <p className="text-xs font-bold text-amber-950 mt-1 line-clamp-2 px-1">
                        &ldquo;{wishInput}&rdquo;
                      </p>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-yellow-300 blur-sm mt-1 animate-ping" />
                  </motion.div>

                  <div className="mt-8 p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200 shadow-md max-w-xs text-center">
                    <p className="text-lg font-bold text-pink-600 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Điều ước đã được gửi đi!
                    </p>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium">
                      Nguyện ước của bạn đang bay vào dải ngân hà. Tuổi mới nhất định sẽ thật rực rỡ và trọn vẹn!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Chuyển Màn 5 */}
            <div className="w-full mt-4 pb-2">
              <button
                disabled={!isWishSent}
                onClick={() => setScene(5)}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isWishSent
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white shadow-pink-300/50 hover:brightness-105 active:scale-98'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>Xem Kỷ Niệm & Nhận Ảnh Polaroid</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* 📸 [PHẦN 5] MÀN HÌNH THIỆP CUỐI TRANG POLAROID & BẮN TIM CẢM ƠN       */}
        {/* ===================================================================== */}
        {scene === 5 && (
          <motion.div
            key="scene-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full"
          >
            {/* 👇 BẠN CÓ THỂ SỬA TIÊU ĐỀ MÀN 5 TẠI ĐÂY 👇 */}
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-1 border border-pink-200">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                Kỷ Niệm Đẹp Đẽ
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent py-1">
                Tuổi Mới Thật Rực Rỡ Nhé!
              </h1>
            </div>

            {/* 👇 TẤM THẺ POLAROID KỶ NIỆM (THIỆP CUỐI TRANG) - SỬA TRỰC TIẾP TẠI ĐÂY 👇 */}
            <div className="w-full max-w-xs my-auto p-4 pb-6 rounded-2xl bg-white border border-stone-200 shadow-2xl flex flex-col items-center text-center">
              <div className="w-full h-56 rounded-xl bg-gradient-to-tr from-pink-200 via-pink-100 to-rose-200 border border-pink-300 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-2 right-2 text-xs">🌸</div>
                <div className="absolute bottom-2 left-2 text-xs">✨</div>
                <div className="w-20 h-20 rounded-full bg-white/90 shadow-md flex items-center justify-center text-4xl mb-2">
                  🎂
                </div>
                {/* Tên và ngày sinh */}
                <h3 className="text-xl font-bold text-pink-700">Bé Yêu</h3>
                <p className="text-xs font-semibold text-pink-500">Sinh nhật: 16 Tháng 11</p>
                {wishInput && (
                  <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-white/80 text-xs text-stone-700 font-medium italic line-clamp-2">
                    🏮 &ldquo;{wishInput}&rdquo;
                  </div>
                )}
              </div>

              {/* Dòng chữ in dưới ảnh Polaroid */}
              <div className="w-full mt-3 text-stone-600 text-xs italic flex items-center justify-between px-1 font-semibold">
                <span>Forever Young & Happy</span>
                <span className="text-xs text-pink-500 not-italic font-bold">#SakuraBirthday</span>
              </div>
            </div>

            {/* Tương tác bắn tim & sao chép link */}
            <div className="w-full space-y-3 pb-2">
              <button
                onClick={() => {
                  sound.playKeypress(659.25);
                  setHeartCount((c) => c + 1);
                  confetti({
                    particleCount: 25,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB'],
                  });
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
                <span>Bắn Tim Cho Người Tặng ({heartCount})</span>
              </button>

              {heartCount > 0 && (
                <p className="text-sm text-rose-500 font-bold animate-bounce">
                  💖 Đã gửi {heartCount} trái tim đến Người luôn ủng hộ bạn!
                </p>
              )}

              <div className="flex gap-2 w-full pt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {isCopied ? 'Đã sao chép link!' : 'Chia sẻ link'}
                </button>

                <button
                  onClick={() => {
                    sound.stopMelody();
                    setPin('');
                    setWishInput('');
                    setIsWishSent(false);
                    setIsCandleBlown(false);
                    setScene(1);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
                  Xem lại từ đầu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
