"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, ArrowRight } from "lucide-react";
import { soundManager } from "@/utils/sound";
import { BirthdayConfig } from "@/types/birthday";
import Cake2D from "./Cake2D";

interface Props {
  config?: BirthdayConfig;
  onNext: () => void;
}

const INTRO_SENTENCES = [
  "Hôm nay là một ngày thật đặc biệt, ngày công chúa nhỏ ra đời...",
  "Chúc em tuổi mới luôn ngập tràn nụ cười, bình an và hạnh phúc...",
  "Và bây giờ, hãy nhắm mắt lại, cùng thổi nến và ước một điều ước nhé! ✨",
];

export default function Scene2Cake({ onNext }: Props) {
  // Trạng thái: 'TYPING' -> 'READY_TO_BLOW'
  const [stage, setStage] = useState<"TYPING" | "READY_TO_BLOW">("TYPING");
  const [sentenceIdx, setSentenceIdx] = useState<number>(0);
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);

  // Micro để thổi nến
  const [canClickToExtinguish, setCanClickToExtinguish] = useState<boolean>(false);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [blowStrength, setBlowStrength] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FFB7C5", "#FF69B4", "#FFD700", "#FFF0F5", "#FF1493"],
    });
  }, []);

  const stopMic = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicListening(false);
  }, []);

  // Nến tắt -> Bừng sáng không gian & Bắn pháo hoa ăn mừng
  const handleExtinguishCandle = useCallback(() => {
    if (isCandleBlown) return;
    setIsCandleBlown(true);
    setBlowStrength(0);
    soundManager.stopCandleCrackle();
    soundManager.playBlowSound();
    stopMic();
    setTimeout(() => {
      soundManager.playCelebrationCheer();
      fireConfetti();
    }, 350);
  }, [isCandleBlown, stopMic, fireConfetti]);

  // Micro thổi nến (Nhận diện chính xác hơi thổi / tiếng phù vào mic)
  const startMic = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCanClickToExtinguish(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      setIsMicListening(true);

      // 🎯 BỘ TỰ ĐỘNG THÍCH ỨNG TIẾNG ỒN PHÒNG & GIÓ QUẠT (ADAPTIVE NOISE FLOOR)
      let calibrationFrames = 0;
      let ambientSum = 0;
      let ambientNoiseFloor = 20;

      const checkAudioLevel = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // 1. Âm lượng trung bình toàn dải
        let sum = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
          sum += freqData[i];
        }
        const avg = sum / analyser.frequencyBinCount;

        // 2. Dải tần số thấp (tiếng gió / hơi thở 20Hz - 400Hz)
        let lowSum = 0;
        const lowBins = Math.min(10, analyser.frequencyBinCount);
        for (let i = 1; i <= lowBins; i++) {
          lowSum += freqData[i];
        }
        const lowAvg = lowSum / lowBins;

        // 3. Biên độ va đập màng mic (Waveform Deviation)
        // TIẾNG QUẠT: Sóng âm đều đặn dạng sin, maxDev thấp (< 25)
        // HƠI NGƯỜI THỔI: Luồng khí áp suất cao làm bão hòa màng mic, maxDev vọt lên 45 - 120
        let maxDev = 0;
        for (let i = 0; i < timeData.length; i++) {
          const dev = Math.abs(timeData[i] - 128);
          if (dev > maxDev) maxDev = dev;
        }

        // Tự động đo độ ồn nền của phòng (tiếng quạt máy, điều hòa) trong 30 frames đầu (~0.5s)
        if (calibrationFrames < 30) {
          ambientSum += avg;
          calibrationFrames++;
          ambientNoiseFloor = Math.max(16, ambientSum / calibrationFrames);
          requestAnimationFrame(checkAudioLevel);
          return;
        }

        // Độ vượt ngưỡng thực tế so với tiếng ồn của quạt
        const effectiveAvg = Math.max(0, avg - ambientNoiseFloor);
        const effectiveLow = Math.max(0, lowAvg - ambientNoiseFloor);

        // Chỉ tính là có hơi thổi khi có luồng khí va đập màng mic (maxDev > 24)
        // và âm lượng vượt trên tiếng quạt nền (effectiveAvg > 10 hoặc effectiveLow > 12)
        let strength = 0;
        if (maxDev > 24 && (effectiveAvg > 10 || effectiveLow > 12)) {
          const normAvg = effectiveAvg / 32;
          const normLow = effectiveLow / 32;
          const normDev = (maxDev - 24) / 36;
          strength = Math.max(0, Math.min(1, Math.max(normAvg, normLow, normDev)));
        }

        setBlowStrength(strength);

        // THỔI MẠNH TẮT NGAY: Cần có luồng khí thổi trực tiếp (maxDev > 48) kèm âm lượng vượt trội
        if ((maxDev > 48 && (avg > 55 || lowAvg > 55)) || maxDev > 75) {
          handleExtinguishCandle();
          return;
        }

        requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();
    } catch {
      setIsMicListening(false);
      setCanClickToExtinguish(true);
    }
  }, [handleExtinguishCandle]);

  // 🎆 PHÁO HOA CHÀO MỪNG KHI DÂY BĂNG RÔN MỞ RA & BÁNH KEM XUẤT HIỆN
  const fireOpeningFireworks = useCallback(() => {
    // 1 & 2. 2 dàn pháo hoa bắn chéo từ 2 góc dưới vút lên trời
    setTimeout(() => {
      confetti({
        particleCount: 75,
        angle: 60,
        spread: 65,
        origin: { x: 0.05, y: 0.85 },
        colors: ["#FFB7C5", "#FF69B4", "#FFD700", "#FFF0F5", "#FF8DA1"],
        startVelocity: 48,
        gravity: 0.8,
      });
      confetti({
        particleCount: 75,
        angle: 120,
        spread: 65,
        origin: { x: 0.95, y: 0.85 },
        colors: ["#FFB7C5", "#FF69B4", "#FFD700", "#FFF0F5", "#FF8DA1"],
        startVelocity: 48,
        gravity: 0.8,
      });
    }, 200);

    // 3. Pháo hoa bung tỏa giữa vòm trời ngay sau đó
    setTimeout(() => {
      confetti({
        particleCount: 95,
        spread: 100,
        origin: { x: 0.5, y: 0.32 },
        colors: ["#FFD700", "#FFF9C4", "#FFB6C1", "#FF69B4", "#E0BBE4"],
        startVelocity: 38,
        ticks: 220,
      });
    }, 550);
  }, []);

  // 2. HIỂN THỊ BÁNH KEM & BẮT ĐẦU CẢNH THỔI NẾN (PHÒNG TỐI ÁNH NẾN LUNG LINH & PHÁO HOA)
  const startCakeDrop = useCallback(() => {
    setStage("READY_TO_BLOW");
    soundManager.playBirthdayMelody();
    soundManager.startCandleCrackle();
    fireOpeningFireworks();
    startMic();
    // Sau 7 giây nếu người dùng không thể thổi mic, tự động cho phép chạm nến để tắt
    setTimeout(() => {
      setCanClickToExtinguish(true);
    }, 7000);
  }, [startMic, fireOpeningFireworks]);

  // 1. HIỆU ỨNG TỪNG DÒNG CHỮ MỜ DẦN VÀ DÒNG TIẾP THEO ĐÈ LÊN
  useEffect(() => {
    if (stage !== "TYPING") return;

    soundManager.playKeypress(520);

    const timer = setInterval(() => {
      setSentenceIdx((prev) => {
        if (prev < INTRO_SENTENCES.length - 1) {
          soundManager.playKeypress(560 + (prev + 1) * 60);
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            startCakeDrop();
          }, 600);
          return prev;
        }
      });
    }, 3600);

    return () => clearInterval(timer);
  }, [stage, startCakeDrop]);

  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      if (!micStreamRef.current && stage === "READY_TO_BLOW" && !isCandleBlown) {
        startMic();
      }
    };
    window.addEventListener("pointerdown", handleUserInteraction);
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleUserInteraction);
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [stage, isCandleBlown, startMic]);

  useEffect(() => {
    return () => {
      stopMic();
      soundManager.stopCandleCrackle();
    };
  }, [stopMic]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-4 max-w-lg mx-auto text-center w-full select-none"
    >
      {/* =================================================================== */}
      {/* LỚP MÀN ĐÊM TỐI OM BAO TRÙM CĂN PHÒNG (THỔI XONG MỚI SÁNG BỪNG LÊN)  */}
      {/* =================================================================== */}
      {stage !== "TYPING" && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isCandleBlown ? 0 : 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 48%, rgba(24, 18, 28, 0.96) 0%, #06040a 100%)",
          }}
        />
      )}

      {/* CÁC ĐỐM TRÁI TIM PASTEL MỜ MỊN (CHỈ HIỆN KHI PHÒNG BẬT SÁNG HOẶC LÚC TYPING) */}
      <motion.div
        animate={{ opacity: stage === "TYPING" || isCandleBlown ? 1 : 0 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      >
        {[
          { top: "12%", left: "8%", size: "w-5 h-5", delay: 0 },
          { top: "20%", right: "10%", size: "w-6 h-6", delay: 1.2 },
          { top: "35%", left: "12%", size: "w-4 h-4", delay: 2.1 },
          { top: "48%", left: "6%", size: "w-6 h-6", delay: 0.6 },
          { top: "52%", right: "8%", size: "w-5 h-5", delay: 1.8 },
          { top: "70%", left: "16%", size: "w-5 h-5", delay: 2.5 },
          { top: "76%", right: "14%", size: "w-7 h-7", delay: 0.9 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            style={{
              position: "absolute",
              top: item.top,
              left: item.left,
              right: item.right,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.65, 0.3],
            }}
            transition={{
              duration: 3.5 + idx * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            }}
            className={`${item.size} text-[#f06292]/45`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
      </motion.div>

      {/* ⚡ NÚT BỎ QUA LỜI DẪN NHANH Ở GÓC TRÊN BÊN TRÁI KHI ĐANG TYPING */}
      {stage === "TYPING" && (
        <div className="fixed top-4 left-4 z-40">
          <button
            type="button"
            onClick={startCakeDrop}
            className="px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-rose-500 hover:text-rose-600 text-xs font-semibold shadow-xs border border-pink-200 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            title="Bỏ qua lời dẫn để xem bánh kem"
          >
            <span>Bỏ qua lời dẫn</span>
            <span>⏩</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 📜 GIAI ĐOẠN 1: 3 DÒNG CHỮ CHẠY MỜ DẦN ĐÈ LÊN NHAU                    */}
      {/* ===================================================================== */}
      {stage === "TYPING" && (
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] px-4 my-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={sentenceIdx}
              initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(10px)" }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="font-dancing text-3xl sm:text-4xl md:text-5xl text-[#942948] font-semibold leading-relaxed tracking-wide drop-shadow-[0_4px_24px_rgba(255,182,193,0.55)] max-w-md mx-auto"
            >
              {INTRO_SENTENCES[sentenceIdx]}
            </motion.p>
          </AnimatePresence>

          {/* ⚡ NÚT BỎ QUA LỜI DẪN ĐỂ XEM BÁNH KEM NGAY */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8"
          >
            <button
              type="button"
              onClick={startCakeDrop}
              className="px-4 py-2 rounded-full bg-white/85 hover:bg-white text-rose-500 hover:text-rose-600 text-xs font-semibold shadow-md shadow-pink-200/50 border border-pink-200 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Bỏ qua lời dẫn</span>
              <span>🎂 ⏩</span>
            </button>
          </motion.div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM 3 TẦNG CHUẨN XÁC, MỀM MẠI, NẾN VỮNG VÀNG    */}
      {/* ===================================================================== */}
      {stage !== "TYPING" && (
        <div className="w-full flex flex-col items-center justify-center min-h-[85vh] py-2 z-10">
          {/* 🍰 BÁNH KEM 2D PHONG CÁCH HÀN QUỐC (ĐỨNG TRỌN VẸN TRUNG TÂM, 100% KHÔNG CÓ CHỮ) */}
          <div className="w-full max-w-lg my-auto py-2 z-10 flex flex-col items-center justify-center">
            <Cake2D
              isCandleBlown={isCandleBlown}
              canClickToExtinguish={canClickToExtinguish}
              onExtinguishCandle={handleExtinguishCandle}
              blowStrength={blowStrength}
              isMicListening={isMicListening}
              onRequestMic={startMic}
            />
          </div>

          {/* CHỈ KHI NẾN TẮT MỚI XUẤT HIỆN NÚT CHUYỂN TIẾP */}
          {isCandleBlown && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full pb-4 max-w-xs mt-2"
            >
              <button
                onClick={onNext}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/40 flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Gift className="w-5 h-5 text-amber-200 animate-spin" />
                Mở 3 Chiếc Hộp Bí Mật
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
