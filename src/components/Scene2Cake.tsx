"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Mic, MicOff, Gift, ArrowRight, Sparkles } from "lucide-react";
import { soundManager } from "@/utils/sound";
import { BirthdayConfig } from "@/types/birthday";
import Cake2D from "./Cake2D";

interface Props {
  config: BirthdayConfig;
  onNext: () => void;
}

export default function Scene2Cake({ config, onNext }: Props) {
  // =========================================================================
  // 📜 3 DÒNG CHỮ UỐN LƯỢN CHẠY MỜ DẦN ĐÈ LÊN NHAU (HOÀN TOÀN KHÔNG CÓ KHUNG)
  // =========================================================================
  const introSentences = [
    "Hôm nay là một ngày thật đặc biệt, ngày công chúa nhỏ ra đời...",
    "Chúc em tuổi mới luôn ngập tràn nụ cười, bình an và hạnh phúc...",
    "Và bây giờ, hãy nhắm mắt lại, cùng thổi nến và ước một điều ước nhé! ✨",
  ];

  // Trạng thái: 'TYPING' -> 'READY_TO_BLOW'
  const [stage, setStage] = useState<"TYPING" | "READY_TO_BLOW">("TYPING");
  const [sentenceIdx, setSentenceIdx] = useState<number>(0);
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);

  // Micro để thổi nến
  const [canClickToExtinguish, setCanClickToExtinguish] = useState<boolean>(false);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>("");
  const [blowStrength, setBlowStrength] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 1. HIỆU ỨNG TỪNG DÒNG CHỮ MỜ DẦN VÀ DÒNG TIẾP THEO ĐÈ LÊN
  useEffect(() => {
    if (stage !== "TYPING") return;

    soundManager.playKeypress(520);

    const timer = setInterval(() => {
      setSentenceIdx((prev) => {
        if (prev < introSentences.length - 1) {
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
  }, [stage]);

  // 2. HIỂN THỊ BÁNH KEM 2D XINH XẮN + BẬT NHẠC & BẮN PHÁO BÔNG
  const startCakeDrop = () => {
    setStage("READY_TO_BLOW");
    fireConfetti();
    soundManager.playBirthdayMelody();
    startMic();
    // Sau 7 giây nếu người dùng không thể thổi mic, tự động cho phép chạm nến để tắt
    setTimeout(() => {
      setCanClickToExtinguish(true);
    }, 7000);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 160,
      spread: 75,
      origin: { y: 0.65 },
      colors: ["#FFB7C5", "#FF69B4", "#FFD700", "#FFF0F5", "#FF1493"],
    });
  };

  // Nến tắt
  const handleExtinguishCandle = () => {
    if (isCandleBlown) return;
    setIsCandleBlown(true);
    setBlowStrength(0);
    soundManager.playBlowSound();
    stopMic();
    setTimeout(() => {
      fireConfetti();
    }, 200);
  };

  // Micro thổi nến
  const startMic = async () => {
    try {
      setMicError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
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
        for (let i = 0; i < analyser.frequencyBinCount; i++)
          sum += dataArray[i];
        const avg = sum / analyser.frequencyBinCount;

        // Chuẩn hóa độ mạnh hơi thở từ 0 đến 1
        const normalized = Math.max(0, Math.min(1, (avg - 18) / 42));
        setBlowStrength(normalized);

        if (avg > 60) {
          handleExtinguishCandle();
          return;
        }
        requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();
    } catch {
      setMicError("Microphone không khả dụng. Đã bật chế độ chạm vào nến để tắt!");
      setIsMicListening(false);
      setCanClickToExtinguish(true);
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
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-4 max-w-lg mx-auto text-center w-full select-none"
    >
      {/* CÁC ĐỐM TRÁI TIM PASTEL MỜ MỊN TRÔI LƠ LỬNG TRONG KHÔNG GIAN (Y HỆT HÌNH BẠN GỬI) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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
      </div>

      {/* ===================================================================== */}
      {/* 📜 GIAI ĐOẠN 1: 3 DÒNG CHỮ CHẠY MỜ DẦN ĐÈ LÊN NHAU                    */}
      {/* ===================================================================== */}
      {stage === "TYPING" && (
        <div className="w-full flex items-center justify-center min-h-[60vh] px-4 my-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={sentenceIdx}
              initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(10px)" }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="font-dancing text-3xl sm:text-4xl md:text-5xl text-[#942948] font-semibold leading-relaxed tracking-wide drop-shadow-[0_4px_24px_rgba(255,182,193,0.55)] max-w-md mx-auto"
            >
              {introSentences[sentenceIdx]}
            </motion.p>
          </AnimatePresence>
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
