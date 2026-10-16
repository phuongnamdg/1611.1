"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Mic, MicOff, Gift, ArrowRight, Sparkles } from "lucide-react";
import { soundManager } from "@/utils/sound";
import { BirthdayConfig } from "@/types/birthday";
import SplineCake3D from "./SplineCake3D";

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

  // Trạng thái: 'TYPING' -> 'CAKE_DROPPING' -> 'READY_TO_BLOW'
  const [stage, setStage] = useState<
    "TYPING" | "CAKE_DROPPING" | "READY_TO_BLOW"
  >("TYPING");
  const [sentenceIdx, setSentenceIdx] = useState<number>(0);

  // Chế độ hiển thị bánh: 2D Pastel (mặc định nhẹ êm) hoặc 3D Spline
  const [cakeMode, setCakeMode] = useState<"2D_PASTEL" | "3D_SPLINE">("2D_PASTEL");

  // Từng bước rơi bánh kem 3 tầng mềm mại
  const [cakeStep, setCakeStep] = useState<number>(0);
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);

  // Micro để thổi nến
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>("");
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

  // 2. CHUỖI RƠI BÁNH KEM 3 TẦNG MỀM MẠI, LIỀN MẠCH, KHÔNG BỊ TRỐNG HÌNH
  const startCakeDrop = () => {
    setStage("CAKE_DROPPING");

    // 0.1s: Tầng 1 (đáy) rơi xuống êm dịu
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(400);
    }, 100);

    // 0.35s: Tầng 2 (giữa) rơi xuống nhẹ nhàng đáp lên tầng 1
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(480);
    }, 350);

    // 0.6s: Tầng 3 (trên cùng kèm lớp kem) rơi xuống êm ái đáp lên tầng 2
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(560);
    }, 600);

    // 0.85s: Cây nến cắm thẳng đứng vào giữa bánh
    setTimeout(() => {
      setCakeStep(4);
      soundManager.playKeypress(680);
    }, 850);

    // 1.1s: Ngọn nến bừng sáng lung linh + Bật nhạc + Sẵn sàng ước
    setTimeout(() => {
      setCakeStep(5);
      setStage("READY_TO_BLOW");
      fireConfetti();
      soundManager.playBirthdayMelody();
    }, 1100);
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

        if (avg > 65) {
          handleExtinguishCandle();
          return;
        }
        requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();
    } catch {
      setMicError("Không thể mở micro. Bạn có thể chạm trực tiếp vào nến nha!");
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
        <div className="w-full flex flex-col items-center justify-between min-h-[85vh] py-2 z-10">
          {/* ✨ TIÊU ĐỀ UỐN LƯỢN MỀM MẠI ✨ */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-1 flex flex-col items-center justify-center select-none"
          >
            <h1 className="font-dancing text-4xl sm:text-5xl text-[#942948] font-bold leading-tight tracking-wide drop-shadow-[0_2px_12px_rgba(255,182,193,0.45)]">
              Chúc Mừng Sinh
            </h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="font-dancing text-4xl sm:text-5xl text-[#942948] font-bold leading-tight tracking-wide drop-shadow-[0_2px_12px_rgba(255,182,193,0.45)]">
                Nhật {config.recipientName ? config.recipientName : ""}
              </span>
              <span className="text-3xl sm:text-4xl animate-pulse">🌸</span>
            </div>
          </motion.div>

          {/* 🎛️ NÚT CHUYỂN ĐỔI CHẾ ĐỘ BÁNH (3D SPLINE HOẶC 3 TẦNG PASTEL) */}
          {stage === "READY_TO_BLOW" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 mt-2 mb-1 z-20"
            >
              <button
                onClick={() => setCakeMode("2D_PASTEL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  cakeMode === "2D_PASTEL"
                    ? "bg-pink-500 text-white shadow-pink-200 scale-105"
                    : "bg-white/85 text-pink-600 hover:bg-white border border-pink-200"
                }`}
              >
                🌸 Bánh 3 Tầng Pastel
              </button>
              <button
                onClick={() => setCakeMode("3D_SPLINE")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  cakeMode === "3D_SPLINE"
                    ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-pink-200 scale-105"
                    : "bg-white/85 text-pink-600 hover:bg-white border border-pink-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                ✨ Bánh 3D Spline (Xoay 360°)
              </button>
            </motion.div>
          )}

          {/* 🍰 VÙNG HIỂN THỊ BÁNH: HOẶC 3D SPLINE HOẶC 3 TẦNG PASTEL */}
          {cakeMode === "3D_SPLINE" ? (
            <div className="w-full max-w-md my-auto py-2 z-10">
              <SplineCake3D
                isCandleBlown={isCandleBlown}
                onExtinguishCandle={handleExtinguishCandle}
              />
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center my-auto py-2">
              <svg
                viewBox="0 0 320 270"
                className="w-[290px] sm:w-[350px] h-auto overflow-visible select-none drop-shadow-[0_15px_35px_rgba(255,170,185,0.4)]"
              >
                <defs>
                  {/* Vầng hào quang ngọn nến lung linh ấm áp */}
                  <radialGradient
                    id="cakeFlameAura3Tier"
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                  <stop offset="0%" stopColor="#ffb703" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#ff8a00" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#ff5d8f" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ff758c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* BÓNG ĐỔ MỀM DƯỚI ĐÁY BÁNH */}
              <ellipse
                cx="160"
                cy="235"
                rx="120"
                ry="8"
                fill="rgba(244, 114, 182, 0.25)"
                style={{ filter: "blur(5px)" }}
              />

              {/* ============================================================= */}
              {/* BƯỚC 1: TẦNG 1 (ĐÁY - RỘNG NHẤT 230px) RƠI THẲNG ĐỨNG         */}
              {/* ============================================================= */}
              {cakeStep >= 1 && (
                <motion.g
                  initial={{ y: -120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Đế viền trắng ngà mỏng ở đáy */}
                  <rect
                    x="45"
                    y="226"
                    width="230"
                    height="4"
                    rx="2"
                    fill="#fff5ea"
                  />

                  {/* Thân bánh tầng 1 (hồng pastel) */}
                  <rect
                    x="45"
                    y="190"
                    width="230"
                    height="38"
                    rx="5"
                    fill="#f8a5b8"
                  />

                  {/* Dải nhân mứt dâu đậm chạy ngang */}
                  <rect x="45" y="205" width="230" height="8" fill="#f06292" />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 2: TẦNG 2 (GIỮA - RỘNG 164px) RƠI THẲNG ĐỨNG             */}
              {/* ============================================================= */}
              {cakeStep >= 2 && (
                <motion.g
                  initial={{ y: -120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Thân bánh tầng 2 */}
                  <rect
                    x="78"
                    y="156"
                    width="164"
                    height="34"
                    rx="5"
                    fill="#f8a5b8"
                  />

                  {/* Dải nhân mứt dâu đậm tầng 2 */}
                  <rect x="78" y="169" width="164" height="7" fill="#f06292" />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 3: TẦNG 3 (TRÊN CÙNG KÈM KEM CHẢY) RƠI THẲNG ĐỨNG        */}
              {/* ============================================================= */}
              {cakeStep >= 3 && (
                <motion.g
                  initial={{ y: -120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Thân bánh tầng 3 */}
                  <rect
                    x="108"
                    y="126"
                    width="104"
                    height="30"
                    rx="5"
                    fill="#f8a5b8"
                  />

                  {/* Dải nhân mứt dâu đậm tầng 3 */}
                  <rect x="108" y="137" width="104" height="6" fill="#f06292" />

                  {/* LỚP KEM SỮA TƯƠI TRẮNG CHẢY TRÀN (VỆT KEM DÀI RỦ XUỐNG TẦNG DƯỚI CHUẨN ẢNH) */}
                  <path
                    d="M 106 130
                       C 106 123 110 121 116 121
                       L 204 121
                       C 210 121 214 123 214 130
                       L 214 138
                       C 214 142 208 144 206 140
                       C 202 133 196 133 194 140
                       L 192 146
                       C 190 150 184 150 182 144
                       C 178 135 172 135 170 148
                       L 168 156
                       C 166 160 160 160 158 152
                       C 154 138 146 138 144 146
                       L 142 148
                       C 140 152 134 152 132 146
                       C 128 136 122 136 120 150
                       L 118 178
                       C 118 182 110 182 110 178
                       L 110 140
                       C 109 135 106 137 106 130 Z"
                    fill="#ffffff"
                    style={{
                      filter:
                        "drop-shadow(0 2px 4px rgba(220, 100, 130, 0.22))",
                    }}
                  />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 4: CÂY NẾN ĐỨNG YÊN VỮNG VÀNG Ở GIỮA BÁNH               */}
              {/* ============================================================= */}
              {cakeStep >= 4 && (
                <motion.g
                  initial={{ y: -80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={handleExtinguishCandle}
                  className="cursor-pointer"
                >
                  {/* Bấc nến */}
                  <line
                    x1="160"
                    y1="96"
                    x2="160"
                    y2="88"
                    stroke="#2b2b2b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Thân nến mảnh màu trắng có sọc hồng */}
                  <rect
                    x="157"
                    y="96"
                    width="6"
                    height="28"
                    rx="3"
                    fill="#ffffff"
                    stroke="#f472b6"
                    strokeWidth="0.8"
                    style={{
                      filter: "drop-shadow(0 1px 3px rgba(255, 150, 170, 0.4))",
                    }}
                  />
                  {/* Sọc trang trí nến */}
                  <line
                    x1="157.5"
                    y1="104"
                    x2="162.5"
                    y2="108"
                    stroke="#f06292"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="157.5"
                    y1="114"
                    x2="162.5"
                    y2="118"
                    stroke="#f06292"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* ========================================================= */}
                  {/* BƯỚC 5: NGỌN LỬA LUNG LINH ẤM ÁP (HIỂN THỊ CHUẨN XÁC 100%) */}
                  {/* ========================================================= */}
                  {cakeStep >= 5 && !isCandleBlown && (
                    <g>
                      {/* 🌟 1. VẦNG HÀO QUANG TO TRÒN ẤM ÁP (TỎA SÁNG TỰ NHIÊN) */}
                      <circle
                        cx="160"
                        cy="74"
                        r="42"
                        fill="url(#cakeFlameAura3Tier)"
                        style={{ filter: "blur(8px)" }}
                        className="animate-pulse"
                      />

                      {/* 🌟 2. NGỌN LỬA VÀNG ẤM ÁP (ĐỨNG YÊN CỐ ĐỊNH TRÊN ĐẦU BẤC NẾN Y=88) */}
                      <g>
                        {/* Ngọn lửa vàng ngoài */}
                        <path
                          d="M 160 58 C 168 68 172 76 166 84 C 160 90 152 86 154 79 C 156 71 152 66 160 58 Z"
                          fill="#ffbe0b"
                          style={{ filter: "drop-shadow(0 0 6px #ffb703)" }}
                        />

                        {/* Lõi lửa trắng sáng bên trong */}
                        <path
                          d="M 160 66 C 164 72 166 77 163 81 C 160 84 157 82 158 78 C 160 74 158 70 160 66 Z"
                          fill="#ffffff"
                        />

                        {/* Đốm lửa xanh lam chân thực tại bấc nến */}
                        <ellipse
                          cx="160"
                          cy="87"
                          rx="2.5"
                          ry="1.5"
                          fill="#3a86ff"
                          opacity="0.85"
                        />
                      </g>

                      {/* 🌟 3. CÁC ĐỐM SAO LẤP LÁNH CHỚP TẮT ÊM DỊU TẠI CHỖ */}
                      <motion.g
                        transform="translate(184, 60)"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.2,
                          ease: "easeInOut",
                          delay: 0.3,
                        }}
                      >
                        <path
                          d="M 0 -5 Q 1 -1 5 0 Q 1 1 0 5 Q -1 1 -5 0 Q -1 -1 0 -5 Z"
                          fill="#ffffff"
                        />
                        <circle cx="0" cy="0" r="1.2" fill="#ffd166" />
                      </motion.g>

                      <motion.g
                        transform="translate(136, 64)"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut",
                          delay: 1.1,
                        }}
                      >
                        <path
                          d="M 0 -4 Q 1 -1 4 0 Q 1 1 0 4 Q -1 1 -4 0 Q -1 -1 0 -4 Z"
                          fill="#ffffff"
                        />
                        <circle cx="0" cy="0" r="1" fill="#ffd166" />
                      </motion.g>
                    </g>
                  )}

                  {/* Làn khói mềm mại khi nến tắt */}
                  {isCandleBlown && (
                    <motion.path
                      d="M 160 88 Q 152 70 162 52 T 156 30"
                      fill="none"
                      stroke="#a8a29e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: [0, 1, 1],
                        opacity: [0, 0.75, 0],
                        y: -20,
                      }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                  )}
                </motion.g>
              )}
            </svg>
          </div>
        )}

          {/* DÒNG NHẮC NHẸ NHÀNG (PHÔNG CHỮ UỐN LƯỢN MỀM MẠI) */}
          {stage === "READY_TO_BLOW" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center mt-1 mb-3"
            >
              {!isCandleBlown ? (
                <>
                  <p className="font-dancing text-2xl sm:text-3xl text-[#942948] font-semibold drop-shadow-sm animate-pulse tracking-wide">
                    ✨ Thổi vào micro hoặc chạm vào nến để ước nha ✨
                  </p>

                  <div className="flex items-center gap-2 mt-2.5">
                    {!isMicListening ? (
                      <button
                        onClick={startMic}
                        className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 hover:bg-white text-pink-600 text-xs sm:text-sm font-bold border border-pink-200 shadow-md shadow-pink-100 transition-all hover:scale-105 active:scale-95"
                      >
                        <Mic className="w-4 h-4 text-pink-500" />
                        Bật Micro để thổi nến
                      </button>
                    ) : (
                      <button
                        onClick={stopMic}
                        className="flex items-center gap-2 px-5 py-2 rounded-full bg-rose-50 text-rose-600 text-xs sm:text-sm font-bold border border-rose-200 shadow-md animate-bounce"
                      >
                        <MicOff className="w-4 h-4 text-rose-500" />
                        Đang lắng nghe... Thổi vào mic đi nào!
                      </button>
                    )}
                  </div>
                  {micError && (
                    <p className="text-[11px] text-rose-500 mt-1">{micError}</p>
                  )}
                </>
              ) : (
                <p className="font-dancing text-2xl sm:text-3xl font-bold text-[#942948] flex items-center justify-center gap-1 drop-shadow-sm">
                  🎉 Nến đã tắt rồi! Tuổi mới vạn điều như ý! 🎉
                </p>
              )}
            </motion.div>
          )}

          {/* NÚT CHUYỂN TIẾP SANG MÀN 3 MỞ HỘP QUÀ BÍ MẬT */}
          <div className="w-full pb-2">
            <button
              onClick={onNext}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/40 flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all"
            >
              <Gift className="w-5 h-5 text-amber-200 animate-spin" />
              Mở 3 Chiếc Hộp Bí Mật
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
