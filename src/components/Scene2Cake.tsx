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
  // 👇 3 DÒNG CHỮ CHẠY MỜ DẦN ĐÈ LÊN NHAU (BẠN CÓ THỂ SỬA Ở ĐÂY) 👇
  // =========================================================================
  const introSentences = [
    "Hôm nay là một ngày thật đặc biệt, ngày công chúa nhỏ ra đời...",
    "Chúc em tuổi mới luôn ngập tràn nụ cười, bình an và hạnh phúc...",
    "Và bây giờ, hãy nhắm mắt lại, cùng thổi nến và ước một điều ước nhé! ✨",
  ];

  // Trạng thái: 'TYPING' (chạy chữ) -> 'CAKE_DROPPING' (rơi bánh) -> 'READY_TO_BLOW' (thổi nến)
  const [stage, setStage] = useState<'TYPING' | 'CAKE_DROPPING' | 'READY_TO_BLOW'>('TYPING');
  const [sentenceIdx, setSentenceIdx] = useState<number>(0);

  // Các bước rơi bánh kem mềm mại từng tầng
  const [cakeStep, setCakeStep] = useState<number>(0);
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);

  // Micro
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 1. HIỆU ỨNG TỪNG DÒNG CHỮ MỜ DẦN CHO DÒNG TIẾP THEO ĐÈ LÊN
  useEffect(() => {
    if (stage !== 'TYPING') return;

    soundManager.playKeypress(520);

    // Mỗi dòng hiển thị khoảng 3.8s (mờ vào -> dừng để đọc -> mờ dần đi)
    const timer = setInterval(() => {
      setSentenceIdx((prev) => {
        if (prev < introSentences.length - 1) {
          soundManager.playKeypress(560 + (prev + 1) * 60);
          return prev + 1;
        } else {
          clearInterval(timer);
          // Sau khi dòng 3 mờ dần kết thúc -> Chuyển sang thả rơi bánh kem
          setTimeout(() => {
            startCakeDrop();
          }, 1000);
          return prev;
        }
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [stage]);

  // 2. BẮT ĐẦU CHUỖI RƠI BÁNH KEM TỪNG TẦNG CỰC KỲ MỀM MẠI (SQUASH & STRETCH)
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Đĩa sứ mềm mại xuất hiện
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(350);
    }, 200);

    // 0.8s: Tầng bánh dưới rơi xuống và nhún nảy như thạch (Jelly bounce)
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(440);
    }, 800);

    // 1.5s: Tầng bánh trên rơi xuống nhún đàn hồi
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(523);
    }, 1500);

    // 2.1s: Kem xốp, dâu tây & hoa nở nảy bồng bềnh
    setTimeout(() => {
      setCakeStep(4);
      soundManager.playKeypress(659);
    }, 2100);

    // 2.7s: Cây nến mềm mại cắm vào bánh
    setTimeout(() => {
      setCakeStep(5);
      soundManager.playKeypress(784);
    }, 2700);

    // 3.2s: Ngọn lửa bừng sáng + Nổ pháo hoa + Bật nhạc
    setTimeout(() => {
      setCakeStep(6);
      setStage('READY_TO_BLOW');
      fireConfetti();
      soundManager.playBirthdayMelody();
    }, 3200);
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
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-lg mx-auto text-center w-full"
    >
      {/* ===================================================================== */}
      {/* 📜 GIAI ĐOẠN 1: DÒNG CHỮ UỐN LƯỢN MỜ DẦN CHO DÒNG SAU ĐÈ LÊN         */}
      {/* (Hoàn toàn không có khung, không có nút bỏ qua, không có 3 sọc gạch)   */}
      {/* ===================================================================== */}
      {stage === 'TYPING' && (
        <div className="w-full flex items-center justify-center min-h-[55vh] px-4 my-auto relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={sentenceIdx}
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="font-dancing text-3xl sm:text-4xl md:text-5xl text-[#b84358] font-bold leading-relaxed tracking-wide drop-shadow-[0_4px_20px_rgba(255,182,193,0.5)] max-w-md mx-auto"
            >
              {introSentences[sentenceIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM RƠI XUỐNG TỪNG TẦNG CỰC KỲ MỀM MẠI          */}
      {/* ===================================================================== */}
      {stage !== 'TYPING' && (
        <motion.div
          key="cake-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh]"
        >
          {/* Tiêu đề uốn lượn ngọt ngào */}
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-100/90 text-pink-600 text-xs font-medium mb-1 shadow-sm border border-pink-200">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Happy Birthday {config.birthDateDisplay}
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            </span>
            <h1 className="font-dancing text-4xl sm:text-5xl font-bold text-[#b83b52] leading-tight py-1 drop-shadow-[0_2px_12px_rgba(255,182,193,0.4)]">
              Chúc Mừng Sinh Nhật
            </h1>
            <h2 className="font-dancing text-3xl sm:text-4xl font-bold text-rose-500 mt-0.5 flex items-center justify-center gap-2">
              {config.recipientName}
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500 inline animate-bounce" />
            </h2>
          </div>

          {/* KHU VỰC BÁNH KEM SIÊU MỀM MẠI (SQUASH & STRETCH BOUNCE) */}
          <div className="relative flex flex-col items-center justify-center my-auto py-8 min-h-[290px]">
            {/* 1. NGỌN NẾN MỀM MẠI RƠI CẮM VÀO BÁNH */}
            {cakeStep >= 5 && (
              <motion.div
                initial={{ y: -260, opacity: 0, scaleY: 1.5, scaleX: 0.7 }}
                animate={{
                  y: [null, 0, -8, 0],
                  opacity: 1,
                  scaleY: [1.5, 0.85, 1.05, 1],
                  scaleX: [0.7, 1.15, 0.95, 1],
                }}
                transition={{
                  duration: 0.7,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                onClick={handleExtinguishCandle}
                className="relative cursor-pointer group flex flex-col items-center z-30"
                title="Chạm vào để thổi tắt nến!"
              >
                {/* Ánh lửa bập bùng lung linh */}
                {cakeStep >= 6 && !isCandleBlown && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.2, 0.95, 1.15, 1],
                      rotate: [-3, 3, -2, 2, -3],
                      opacity: 1,
                    }}
                    transition={{
                      scale: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
                      rotate: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
                      default: { duration: 0.4 },
                    }}
                    className="relative w-7 h-11 mb-[-4px]"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-400 via-amber-300 to-yellow-100 blur-[3px] shadow-[0_0_25px_#f59e0b]" />
                    <div className="absolute top-1.5 left-2 w-3 h-7 rounded-full bg-white/90" />
                  </motion.div>
                )}

                {/* Khói bay mềm mại khi tắt nến */}
                {isCandleBlown && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 0.7, 0], y: -35, x: [0, 4, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-4 h-8 flex items-center justify-center text-stone-400 text-sm select-none"
                  >
                    ☁️
                  </motion.div>
                )}

                {/* Thân nến mềm mại bo tròn */}
                <div className="w-4 h-14 rounded-full bg-gradient-to-b from-rose-200 via-white to-pink-200 shadow-md relative overflow-hidden border border-pink-300/40">
                  <div className="w-full h-2.5 bg-pink-400/30 transform -rotate-12 mt-1.5" />
                  <div className="w-full h-2.5 bg-pink-400/30 transform -rotate-12 mt-2" />
                </div>
              </motion.div>
            )}

            {/* 2. TẦNG BÁNH TRÊN: MỀM NHƯ BÔNG LAN, NHÚN NẢY ĐÀN HỒI KHI TIẾP ĐẤT */}
            {cakeStep >= 3 && (
              <motion.div
                initial={{ y: -320, opacity: 0, scaleY: 1.6, scaleX: 0.7 }}
                animate={{
                  y: [null, 0, -14, 0],
                  opacity: 1,
                  scaleY: [1.6, 0.78, 1.12, 0.96, 1],
                  scaleX: [0.7, 1.25, 0.92, 1.04, 1],
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="w-36 h-18 rounded-[36px] bg-gradient-to-b from-pink-100 via-[#ffd5de] to-[#fca5b9] shadow-[0_12px_30px_rgba(255,182,193,0.45)] relative overflow-visible flex items-center justify-center z-20 mt-[-4px]"
              >
                {/* Lớp kem dâu mềm chảy viền bồng bềnh */}
                <div className="absolute top-0 inset-x-0 h-6 bg-white/95 rounded-t-[36px] rounded-b-2xl shadow-sm flex justify-around items-center px-1">
                  <span className="w-3 h-3 rounded-full bg-white shadow-sm inline-block -mb-2" />
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block -mb-3" />
                  <span className="w-3 h-3 rounded-full bg-white shadow-sm inline-block -mb-2" />
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block -mb-3" />
                  <span className="w-3 h-3 rounded-full bg-white shadow-sm inline-block -mb-2" />
                </div>

                {/* 3. DÂU TÂY & HOA ANH ĐÀO BỒNG BỀNH NẢY LÊN */}
                {cakeStep >= 4 && (
                  <motion.div
                    initial={{ scale: 0, y: 15 }}
                    animate={{
                      scale: [0, 1.25, 0.95, 1],
                      y: [15, -4, 2, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      ease: 'backOut',
                    }}
                    className="flex gap-2.5 z-10 text-sm mt-1"
                  >
                    <span className="animate-bounce drop-shadow-sm">🍓</span>
                    <span className="drop-shadow-sm">🌸</span>
                    <span className="animate-bounce drop-shadow-sm">🍓</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 4. TẦNG BÁNH DƯỚI: NẢY LÚN ĐÀN HỒI NHƯ THẠCH KHI CHẠM ĐĨA */}
            {cakeStep >= 2 && (
              <motion.div
                initial={{ y: -380, opacity: 0, scaleY: 1.6, scaleX: 0.7 }}
                animate={{
                  y: [null, 0, -16, 0],
                  opacity: 1,
                  scaleY: [1.6, 0.75, 1.15, 0.95, 1],
                  scaleX: [0.7, 1.28, 0.9, 1.05, 1],
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="w-56 h-22 rounded-[42px] bg-gradient-to-b from-[#ffd3dc] via-[#fba2b7] to-[#f47290] shadow-[0_15px_40px_rgba(255,160,180,0.5)] relative overflow-visible flex items-center justify-center z-10 mt-[-8px]"
              >
                {/* Lớp kem bồng bềnh viền bánh */}
                <div className="absolute top-0 inset-x-0 h-6 bg-white/95 rounded-t-[42px] rounded-b-2xl shadow-sm flex justify-around items-center px-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block -mb-2" />
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm inline-block -mb-3" />
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block -mb-2" />
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm inline-block -mb-3" />
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block -mb-2" />
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm inline-block -mb-3" />
                </div>

                <div className="flex gap-4 z-10 mt-2.5">
                  <span className="text-sm">🌸</span>
                  <span className="font-dancing text-base font-bold text-pink-600 bg-white/90 px-3 py-0.5 rounded-full shadow-sm">
                    {config.birthDatePassword === '1611' ? '16.11' : config.birthDateDisplay}
                  </span>
                  <span className="text-sm">🌸</span>
                </div>
              </motion.div>
            )}

            {/* 5. ĐĨA SỨ MỀM MẠI DƯỚI ĐÁY */}
            {cakeStep >= 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-68 h-4 rounded-full bg-gradient-to-r from-amber-100 via-white to-amber-100 shadow-[0_10px_25px_rgba(255,200,210,0.4)] border border-amber-200/60 z-0 mt-[-4px]"
              />
            )}
          </div>

          {/* Hướng dẫn thổi nến / Nút bật Micro */}
          {stage === 'READY_TO_BLOW' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 flex flex-col items-center"
            >
              {!isCandleBlown ? (
                <>
                  <p className="font-dancing text-lg text-pink-700 bg-pink-100/70 px-4 py-1 rounded-full border border-pink-200/80 animate-pulse">
                    ✨ Thổi vào Micro hoặc chạm vào ngọn nến để ước nha! ✨
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {!isMicListening ? (
                      <button
                        onClick={startMic}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-pink-600 text-xs font-bold border border-pink-200 shadow-sm transition-all"
                      >
                        <Mic className="w-3.5 h-3.5 text-pink-500" />
                        Bật Micro để thổi nến
                      </button>
                    ) : (
                      <button
                        onClick={stopMic}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 shadow-sm animate-bounce"
                      >
                        <MicOff className="w-3.5 h-3.5 text-rose-500" />
                        Đang lắng nghe... Thổi vào mic đi nào!
                      </button>
                    )}
                  </div>
                  {micError && <p className="text-[11px] text-rose-500 mt-1">{micError}</p>}
                </>
              ) : (
                <p className="font-dancing text-2xl font-bold text-pink-600 flex items-center justify-center gap-1">
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
