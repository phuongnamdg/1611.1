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
  // 👇 3 DÒNG CHỮ CHẠY LẦN LƯỢT SAU KHI ĐĂNG NHẬP (BẠN CÓ THỂ TỰ SỬA Ở ĐÂY) 👇
  // =========================================================================
  const introLines = [
    "Hôm nay là một ngày thật đặc biệt, ngày công chúa nhỏ ra đời... 🌸",
    "Chúc em một tuổi mới luôn ngập tràn nụ cười, bình an và hạnh phúc... 💖",
    "Và bây giờ, hãy cùng thổi nến và ước một điều ước thật đẹp nhé! 🎂✨",
  ];

  // Trạng thái: đang chạy 3 dòng chữ (intro) hay đã vào màn thổi nến
  const [introStep, setIntroStep] = useState<number>(1); // 1 -> 2 -> 3 -> 4 (xong intro)
  const [isIntroFinished, setIsIntroFinished] = useState<boolean>(false);

  // Màn thổi nến
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Bắn pháo hoa Confetti
  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FFB7C5', '#FF69B4', '#FFD700', '#FFF0F5', '#FF1493'],
    });
  };

  // Tự động chạy lần lượt 3 dòng chữ
  useEffect(() => {
    // Dòng 1 hiện ngay từ đầu (step 1)
    soundManager.playKeypress(523.25);

    // Sau 2.5s -> Hiện dòng 2
    const timer1 = setTimeout(() => {
      setIntroStep(2);
      soundManager.playKeypress(659.25);
    }, 2500);

    // Sau 5s -> Hiện dòng 3
    const timer2 = setTimeout(() => {
      setIntroStep(3);
      soundManager.playKeypress(783.99);
    }, 5000);

    // Sau 7.5s -> Hoàn thành intro, nổ pháo hoa và hiện bánh kem
    const timer3 = setTimeout(() => {
      finishIntro();
    }, 7500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      stopMic();
    };
  }, []);

  const finishIntro = () => {
    setIsIntroFinished(true);
    fireConfetti();
    soundManager.playBirthdayMelody();
  };

  // Xử lý khi nến tắt
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
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setIsMicListening(true);

      const checkAudioLevel = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average > 65) {
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
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicListening(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full font-sans"
    >
      {/* ===================================================================== */}
      {/* 📜 GIAI ĐOẠN 1: CHẠY LẦN LƯỢT 3 DÒNG CHỮ SAU KHI ĐĂNG NHẬP           */}
      {/* ===================================================================== */}
      {!isIntroFinished ? (
        <div className="w-full flex flex-col items-center justify-center my-auto px-2">
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-pink-200 shadow-[0_20px_50px_rgba(255,182,193,0.35)] space-y-5">
            {/* Dòng 1 */}
            {introStep >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="p-4 rounded-2xl bg-pink-50/80 border border-pink-100 text-[#b35353] font-semibold text-base sm:text-lg leading-relaxed shadow-sm"
              >
                {introLines[0]}
              </motion.div>
            )}

            {/* Dòng 2 */}
            {introStep >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 text-[#c24b61] font-semibold text-base sm:text-lg leading-relaxed shadow-sm"
              >
                {introLines[1]}
              </motion.div>
            )}

            {/* Dòng 3 */}
            {introStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100 text-[#b06020] font-bold text-base sm:text-lg leading-relaxed shadow-sm"
              >
                {introLines[2]}
              </motion.div>
            )}
          </div>

          {/* Nút bấm để xem ngay bánh kem nếu không muốn đợi */}
          <button
            onClick={finishIntro}
            className="mt-6 px-6 py-2.5 rounded-full bg-white/80 hover:bg-white text-pink-600 border border-pink-200 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <span>Xem Bánh Kem Ngay 🎂</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh]"
        >
          {/* Tiêu đề chúc mừng sinh nhật */}
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

          {/* Bánh kem & Ngọn nến thổi tắt */}
          <div className="relative flex flex-col items-center my-auto py-2">
            <div
              onClick={handleExtinguishCandle}
              className="relative cursor-pointer group flex flex-col items-center"
              title="Chạm vào để thổi tắt nến!"
            >
              {!isCandleBlown ? (
                <motion.div
                  animate={{
                    scale: [1, 1.15, 0.95, 1.1, 1],
                    rotate: [-2, 3, -1, 2, -2],
                  }}
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

              {/* Thân nến sọc hồng trắng */}
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

            {/* Hướng dẫn thổi nến / Nút bật Mic */}
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
                  {micError && <p className="text-[11px] text-rose-500 mt-1">{micError}</p>}
                </>
              ) : (
                <p className="text-base font-bold text-pink-600 flex items-center justify-center gap-1">
                  🎉 Nến đã tắt! Tuổi mới vạn điều như ý! 🎉
                </p>
              )}
            </div>
          </div>

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
