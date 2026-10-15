'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Mic, MicOff, Gift, Heart, ArrowRight } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

interface Props {
  config: BirthdayConfig;
  onNext: () => void;
}

export default function Scene2Cake({ config, onNext }: Props) {
  // =========================================================================
  // 👇 3 DÒNG CHỮ CHẠY ĐÁNH CHỮ (TYPEWRITER) SAU KHI ĐĂNG NHẬP 👇
  // =========================================================================
  const introSentences = [
    "Hôm nay là một ngày thật đặc biệt, ngày công chúa nhỏ ra đời... 🌸",
    "Chúc em tuổi mới luôn ngập tràn nụ cười, bình an và hạnh phúc... 💖",
    "Và bây giờ, hãy nhắm mắt lại, cùng thổi nến và ước một điều ước nhé! 🎂✨",
  ];

  // Trạng thái chạy chữ:
  // stage: 'TYPING' -> 'CAKE_DROPPING' -> 'READY_TO_BLOW'
  const [stage, setStage] = useState<'TYPING' | 'CAKE_DROPPING' | 'READY_TO_BLOW'>('TYPING');
  const [sentenceIdx, setSentenceIdx] = useState<number>(0);
  const [charIdx, setCharIdx] = useState<number>(0);

  // Hiệu ứng rơi từng tầng bánh kem mềm mại (Bouncy Spring)
  const [cakeStep, setCakeStep] = useState<number>(0); // 0: chưa có, 1: đĩa, 2: tầng 1, 3: tầng 2, 4: dâu tây, 5: nến, 6: lửa thắp sáng
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);

  // Microphone
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 1. HIỆU ỨNG ĐÁNH CHỮ TỪNG KÝ TỰ (TYPEWRITER EFFECT)
  useEffect(() => {
    if (stage !== 'TYPING') return;

    const currentSentence = introSentences[sentenceIdx];

    if (charIdx < currentSentence.length) {
      // Đang gõ từng chữ
      const timer = setTimeout(() => {
        setCharIdx((prev) => prev + 1);
        if (charIdx % 3 === 0) {
          soundManager.playKeypress(600 + Math.random() * 100);
        }
      }, 50); // Tốc độ gõ 50ms/ký tự
      return () => clearTimeout(timer);
    } else {
      // Đã gõ xong 1 câu -> Chờ 1.8 giây để người đọc ngẫm
      const waitTimer = setTimeout(() => {
        if (sentenceIdx < introSentences.length - 1) {
          setSentenceIdx((prev) => prev + 1);
          setCharIdx(0);
        } else {
          // Gõ xong cả 3 câu -> Bắt đầu thả rơi bánh kem từng tầng!
          startCakeDrop();
        }
      }, 1800);
      return () => clearTimeout(waitTimer);
    }
  }, [stage, sentenceIdx, charIdx]);

  // Bắt đầu chuỗi rơi từng tầng bánh kem mềm mại
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Đĩa bánh xuất hiện
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(350);
    }, 200);

    // 0.7s: Tầng bánh dưới rơi từ trên trời xuống (Spring bounce)
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(440);
    }, 700);

    // 1.3s: Tầng bánh trên rơi xuống nhún nhảy
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(523);
    }, 1300);

    // 1.8s: Dâu tây & hoa nở rộ nảy lên
    setTimeout(() => {
      setCakeStep(4);
      soundManager.playKeypress(659);
    }, 1800);

    // 2.3s: Cây nến rơi cắm phập vào giữa bánh
    setTimeout(() => {
      setCakeStep(5);
      soundManager.playKeypress(784);
    }, 2300);

    // 2.8s: Ngọn lửa bừng sáng + Nổ pháo hoa + Bật nhạc sinh nhật
    setTimeout(() => {
      setCakeStep(6);
      setStage('READY_TO_BLOW');
      fireConfetti();
      soundManager.playBirthdayMelody();
    }, 2800);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 160,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#FFB7C5', '#FF69B4', '#FFD700', '#FFF0F5', '#FF1493'],
    });
  };

  // Nến tắt
  const handleExtinguishCandle = () => {
    if (isCandleBlown) return;
    setIsCandleBlown(true);
    soundManager.playBlowSound();
    stopMic();
    setTimeout(() => {
      fireConfetti();
    }, 200);
  };

  // Micro thổi nến
  const startMic = async () => {
    try {
      setMicError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsMicListening(true);

      const checkAudioLevel = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++) sum += dataArray[i];
        const avg = sum / analyser.frequencyBinCount;

        if (avg > 65) {
          handleExtinguishCandle();
          return;
        }
        requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();
    } catch {
      setMicError('Không thể mở micro. Bạn có thể chạm trực tiếp vào nến nha!');
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

  useEffect(() => {
    return () => stopMic();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full font-sans"
    >
      {/* ===================================================================== */}
      {/* 📜 GIAI ĐOẠN 1: DÒNG CHỮ CHẠY ĐÁNH CHỮ TỪNG KÝ TỰ (TYPEWRITER STYLE) */}
      {/* ===================================================================== */}
      {stage === 'TYPING' && (
        <motion.div
          key="typing-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="w-full flex flex-col items-center justify-center px-3"
        >
          <div className="w-full p-7 sm:p-9 rounded-[32px] bg-white/90 backdrop-blur-xl border border-pink-200 shadow-[0_20px_50px_rgba(255,182,193,0.35)] min-h-[220px] flex flex-col items-center justify-center relative">
            <span className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-3">
              Lời nhắn gửi {sentenceIdx + 1}/3 ✨
            </span>

            {/* Dòng chữ đang gõ ra từng ký tự */}
            <p className="text-lg sm:text-xl font-bold text-[#b04a5a] leading-relaxed tracking-wide min-h-[64px] flex items-center justify-center">
              <span>{introSentences[sentenceIdx].slice(0, charIdx)}</span>
              <span className="w-0.5 h-6 bg-pink-500 inline-block ml-1 animate-pulse" />
            </p>

            {/* Chấm tròn biểu thị tiến trình 3 câu */}
            <div className="flex gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === sentenceIdx
                      ? 'w-6 bg-pink-500'
                      : i < sentenceIdx
                      ? 'w-2 bg-pink-300'
                      : 'w-2 bg-pink-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Nút bấm bỏ qua gõ chữ để xem bánh kem ngay */}
          <button
            onClick={startCakeDrop}
            className="mt-6 px-5 py-2 rounded-full bg-white/80 hover:bg-white text-pink-600 border border-pink-200 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <span>Bỏ qua & Xem bánh kem ngay 🎂</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM RƠI XUỐNG TỪNG TẦNG MỀM MẠI (SPRING BOUNCE)   */}
      {/* ===================================================================== */}
      {stage !== 'TYPING' && (
        <motion.div
          key="cake-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh]"
        >
          {/* Tiêu đề chúc mừng */}
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-2 shadow-sm border border-pink-200">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Happy Birthday {config.birthDateDisplay}
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent leading-tight py-1">
              Chúc Mừng Sinh Nhật
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 flex items-center justify-center gap-2">
              {config.recipientName}
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500 inline animate-bounce" />
            </h2>
          </div>

          {/* KHU VỰC BÁNH KEM RƠI TỪNG TẦNG VỚI HIỆU ỨNG LÒ XO (SPRING PHYSICS) */}
          <div className="relative flex flex-col items-center justify-center my-auto py-6 min-h-[260px]">
            {/* 1. NGỌN NẾN & ÁNH LỬA RƠI XUỐNG */}
            {cakeStep >= 5 && (
              <motion.div
                initial={{ y: -250, opacity: 0, scaleY: 1.4 }}
                animate={{ y: 0, opacity: 1, scaleY: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 14,
                  mass: 0.6,
                }}
                onClick={handleExtinguishCandle}
                className="relative cursor-pointer group flex flex-col items-center z-30"
                title="Chạm vào để thổi tắt nến!"
              >
                {/* Ánh lửa bừng sáng */}
                {cakeStep >= 6 && !isCandleBlown && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.15, 0.95, 1.1, 1],
                      rotate: [-2, 3, -1, 2, -2],
                      opacity: 1,
                    }}
                    transition={{
                      scale: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
                      rotate: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
                      default: { duration: 0.3 },
                    }}
                    className="relative w-6 h-10 mb-[-4px]"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100 blur-[2px] shadow-[0_0_20px_#f59e0b]" />
                    <div className="absolute top-1 left-1.5 w-3 h-6 rounded-full bg-white/90" />
                  </motion.div>
                )}

                {/* Khói bay lên khi nến tắt */}
                {isCandleBlown && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 0.8, 0], y: -30 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="w-4 h-8 flex items-center justify-center text-stone-400 text-sm select-none"
                  >
                    ☁️
                  </motion.div>
                )}

                {/* Thân nến sọc đỏ trắng mềm mại */}
                <div className="w-3.5 h-12 rounded-t-md bg-gradient-to-b from-rose-200 via-white to-pink-300 border border-pink-400/50 shadow-md relative overflow-hidden" />
              </motion.div>
            )}

            {/* 2. TẦNG BÁNH TRÊN (RƠI TỪ TRÊN TRỜI XUỐNG VỚI LỰC NHÚN NHẢY) */}
            {cakeStep >= 3 && (
              <motion.div
                initial={{ y: -300, opacity: 0, scaleY: 1.3, scaleX: 0.8 }}
                animate={{ y: 0, opacity: 1, scaleY: 1, scaleX: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 160,
                  damping: 11,
                  mass: 0.9,
                }}
                className="w-36 h-16 rounded-t-2xl bg-gradient-to-b from-pink-100 via-pink-200 to-rose-200 border-2 border-pink-300 shadow-md relative overflow-hidden flex items-center justify-center z-20 mt-[-2px]"
              >
                {/* Lớp kem dâu viền sóng */}
                <div className="absolute top-0 inset-x-0 h-4 bg-white/95 rounded-b-xl border-b border-pink-200" />

                {/* 3. DÂU TÂY & HOA NỞ RỘ NẢY LÊN */}
                {cakeStep >= 4 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 12,
                    }}
                    className="flex gap-2 z-10 text-xs"
                  >
                    <span className="animate-bounce">🍓</span>
                    <span>🌸</span>
                    <span className="animate-bounce">🍓</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 4. TẦNG BÁNH DƯỚI (RƠI TỪ TRÊN TRỜI XUỐNG ĐẦU TIÊN VỚI LỰC NHÚN NẢY) */}
            {cakeStep >= 2 && (
              <motion.div
                initial={{ y: -350, opacity: 0, scaleY: 1.4, scaleX: 0.8 }}
                animate={{ y: 0, opacity: 1, scaleY: 1, scaleX: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 11,
                  mass: 1.1,
                }}
                className="w-52 h-20 rounded-t-3xl rounded-b-xl bg-gradient-to-b from-rose-200 via-pink-100 to-pink-200 border-2 border-pink-300 shadow-xl relative overflow-hidden flex items-center justify-center z-10 mt-[-4px]"
              >
                <div className="absolute top-0 inset-x-0 h-5 bg-white/95 rounded-b-2xl border-b border-pink-200" />
                <div className="flex gap-4 z-10 mt-2">
                  <span className="text-sm">🌸</span>
                  <span className="text-xs font-bold text-pink-600 bg-white/90 px-2.5 py-0.5 rounded-full border border-pink-200 shadow-sm">
                    {config.birthDatePassword === '1611' ? '16.11' : config.birthDateDisplay}
                  </span>
                  <span className="text-sm">🌸</span>
                </div>
              </motion.div>
            )}

            {/* 5. ĐĨA ĐỰNG BÁNH XUẤT HIỆN DƯỚI ĐÁY */}
            {cakeStep >= 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="w-64 h-3.5 rounded-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 shadow-lg border border-amber-300 z-0 mt-[-2px]"
              />
            )}
          </div>

          {/* Hướng dẫn thổi nến / Nút bật Micro */}
          {stage === 'READY_TO_BLOW' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex flex-col items-center"
            >
              {!isCandleBlown ? (
                <>
                  <p className="text-xs font-semibold text-pink-700 bg-pink-100/80 px-3.5 py-1.5 rounded-full border border-pink-200 animate-pulse">
                    👉 Hãy thổi vào Micro hoặc chạm vào ngọn nến để dập tắt nến nhé!
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
                  {micError && <p className="text-[11px] text-rose-500 mt-1">{micError}</p>}
                </>
              ) : (
                <p className="text-base font-bold text-pink-600 flex items-center justify-center gap-1">
                  🎉 Nến đã tắt! Tuổi mới vạn điều như ý! 🎉
                </p>
              )}
            </motion.div>
          )}

          {/* Nút chuyển tiếp sang Màn 3 Mở ô quà bí mật */}
          <div className="w-full mt-4 pb-2">
            <button
              onClick={onNext}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/50 flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
            >
              <Gift className="w-5 h-5 text-amber-200 animate-spin" />
              Mở 3 Chiếc Hộp Bí Mật
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
