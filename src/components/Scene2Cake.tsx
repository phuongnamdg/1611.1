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
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);
  const [currentWishIndex, setCurrentWishIndex] = useState<number>(0);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const fireConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#FFB7C5', '#FF69B4', '#FFD700', '#FFF0F5', '#FF1493'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  useEffect(() => {
    fireConfetti();
    soundManager.playBirthdayMelody();

    const wishInterval = setInterval(() => {
      setCurrentWishIndex((prev) => (prev + 1) % config.defaultWishes.length);
    }, 4500);

    return () => {
      clearInterval(wishInterval);
      stopMic();
    };
  }, [config.defaultWishes.length]);

  const handleExtinguishCandle = () => {
    if (isCandleBlown) return;
    setIsCandleBlown(true);
    soundManager.playBlowSound();
    stopMic();

    setTimeout(() => {
      fireConfetti();
    }, 200);
  };

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
      className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center"
    >
      {/* Tiêu đề tự sửa trong birthdayData.ts */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-1"
      >
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-2 shadow-sm border border-pink-200">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          Happy Birthday {config.birthDateDisplay}
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent leading-tight py-1 tracking-tight">
          {config.scene2Title}
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 flex items-center justify-center gap-2">
          {config.recipientName}
          <Heart className="w-5 h-5 text-pink-500 fill-pink-500 inline animate-bounce" />
        </h2>
      </motion.div>

      {/* Lời chúc mặc định luân chuyển (Ticker) */}
      <div className="w-full my-3 min-h-[70px] flex items-center justify-center px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWishIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
            className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-pink-200/90 shadow-md shadow-pink-100/50 text-stone-700 text-sm sm:text-base font-semibold leading-relaxed"
          >
            {config.defaultWishes[currentWishIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Khu vực Bánh Kem & Thổi Nến */}
      <div className="relative flex flex-col items-center my-1">
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
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.8, 0], y: -35, scale: 1.5 }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-4 h-8 flex items-center justify-center text-stone-400 font-serif text-sm select-none"
            >
              ☁️
            </motion.div>
          )}

          {/* Thân nến sọc hồng trắng */}
          <div className="w-4 h-14 rounded-t-md bg-gradient-to-b from-pink-200 via-white to-pink-300 border border-pink-400/50 shadow-inner relative overflow-hidden">
            <div className="w-full h-2 bg-pink-400/40 my-1 transform -rotate-12" />
            <div className="w-full h-2 bg-pink-400/40 my-1 transform -rotate-12" />
            <div className="w-full h-2 bg-pink-400/40 my-1 transform -rotate-12" />
          </div>
        </div>

        {/* Bánh kem sinh nhật anh đào 2 tầng */}
        <div className="relative flex flex-col items-center mt-[-2px]">
          <div className="w-36 h-16 rounded-t-2xl bg-gradient-to-b from-pink-100 via-pink-200 to-rose-200 border-2 border-pink-300 shadow-md relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 inset-x-0 h-4 bg-white/90 rounded-b-xl border-b border-pink-200" />
            <div className="flex gap-2 z-10">
              <span className="text-xs">🍓</span>
              <span className="text-xs">🌸</span>
              <span className="text-xs">🍓</span>
            </div>
          </div>

          <div className="w-52 h-20 rounded-t-3xl rounded-b-xl bg-gradient-to-b from-rose-200 via-pink-100 to-pink-200 border-2 border-pink-300 shadow-xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 inset-x-0 h-5 bg-white/90 rounded-b-2xl border-b border-pink-200" />
            <div className="flex gap-4 z-10 mt-2">
              <span className="text-sm">🌸</span>
              <span className="text-xs font-bold text-pink-600 bg-white/80 px-2 py-0.5 rounded-full border border-pink-200">
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <p className="text-lg font-bold text-pink-600 flex items-center justify-center gap-1">
                🎉 Nến đã tắt! Tuổi mới vạn điều như ý! 🎉
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nút chuyển tiếp sang Màn 3 Mở ô quà bí mật */}
      <div className="w-full mt-4 pb-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/50 flex items-center justify-center gap-2 transition-all hover:brightness-105"
        >
          <Gift className="w-5 h-5 text-amber-200 animate-spin" />
          Mở 3 Chiếc Hộp Bí Mật
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
