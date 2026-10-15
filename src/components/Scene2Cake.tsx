'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mic, MicOff, Gift, ArrowRight } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

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
  const [stage, setStage] = useState<'TYPING' | 'CAKE_DROPPING' | 'READY_TO_BLOW'>('TYPING');
  const [sentenceIdx, setSentenceIdx] = useState<number>(0);

  // Từng bước rơi bánh kem mềm mại (Squash & Stretch jelly bounce)
  const [cakeStep, setCakeStep] = useState<number>(0);
  const [isCandleBlown, setIsCandleBlown] = useState<boolean>(false);

  // Micro để thổi nến
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 1. HIỆU ỨNG TỪNG DÒNG CHỮ MỜ DẦN VÀ DÒNG TIẾP THEO ĐÈ LÊN
  useEffect(() => {
    if (stage !== 'TYPING') return;

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
          }, 1000);
          return prev;
        }
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [stage]);

  // 2. CHUỖI RƠI TỪNG TẦNG BÁNH KEM PASTRY NHÚN NHẢY ĐÀN HỒI (JELLY BOUNCE)
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Đĩa sứ mềm mại xuất hiện
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(350);
    }, 200);

    // 0.8s: Tầng bánh dưới rơi xuống đàn hồi
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(440);
    }, 800);

    // 1.5s: Tầng bánh trên rơi xuống nhún nảy
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(523);
    }, 1500);

    // 2.1s: Kem xốp, dâu tây mọng nước & anh đào rơi xuống bồng bềnh
    setTimeout(() => {
      setCakeStep(4);
      soundManager.playKeypress(659);
    }, 2100);

    // 2.7s: Cây nến mềm mại cắm vào bánh
    setTimeout(() => {
      setCakeStep(5);
      soundManager.playKeypress(784);
    }, 2700);

    // 3.2s: Ngọn lửa bừng sáng + Nổ pháo hoa + Bật nhạc sinh nhật
    setTimeout(() => {
      setCakeStep(6);
      setStage('READY_TO_BLOW');
      fireConfetti();
      soundManager.playBirthdayMelody();
    }, 3200);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
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
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-6 max-w-lg mx-auto text-center w-full select-none"
    >
      {/* ===================================================================== */}
      {/* 📜 GIAI ĐOẠN 1: 3 DÒNG CHỮ UỐN LƯỢN CHẠY MỜ DẦN ĐÈ LÊN NHAU           */}
      {/* (Hoàn toàn không có khung, không nút bỏ qua, không sọc gạch)         */}
      {/* ===================================================================== */}
      {stage === 'TYPING' && (
        <div className="w-full flex items-center justify-center min-h-[60vh] px-4 my-auto relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={sentenceIdx}
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(10px)' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="font-dancing text-3xl sm:text-4xl md:text-5xl text-[#b83b5e] font-semibold leading-relaxed tracking-wide drop-shadow-[0_4px_24px_rgba(255,182,193,0.55)] max-w-md mx-auto"
            >
              {introSentences[sentenceIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM PASTRY DỄ THƯƠNG & DÒNG CHÚC MỀM MẠI         */}
      {/* ===================================================================== */}
      {stage !== 'TYPING' && (
        <motion.div
          key="cake-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh] py-2"
        >
          {/* ✨ DÒNG CHÚC MỪNG MỀM MẠI DUY NHẤT (KHÔNG CÒN 2 DÒNG THÔ CỨNG) ✨ */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-1 text-center"
          >
            <h1 className="font-dancing text-4xl sm:text-5xl md:text-6xl text-[#b83b5e] font-bold tracking-wide drop-shadow-[0_4px_20px_rgba(255,182,193,0.5)]">
              Chúc Mừng Sinh Nhật {config.recipientName} 🌸
            </h1>
          </motion.div>

          {/* 🍰 TÁC PHẨM BÁNH KEM PASTRY THIẾT KẾ CỰC KỲ DỄ THƯƠNG & MỀM MẠI (3D SVG) */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg
              viewBox="0 0 340 310"
              className="w-[300px] sm:w-[350px] h-auto overflow-visible select-none drop-shadow-[0_18px_40px_rgba(255,170,185,0.38)]"
            >
              <defs>
                {/* 1. Gradient Đĩa Sứ Ngọc Trai */}
                <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#fff5f7" />
                  <stop offset="100%" stopColor="#fed7e2" />
                </linearGradient>

                {/* 2. Gradient Tầng Bánh 1 (Dưới - Dâu sữa chiffon) */}
                <linearGradient id="tier1BodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffe4e8" />
                  <stop offset="35%" stopColor="#fca5b9" />
                  <stop offset="85%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>

                <linearGradient id="tier1TopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#fff0f3" />
                  <stop offset="100%" stopColor="#fbcfe8" />
                </linearGradient>

                {/* 3. Gradient Tầng Bánh 2 (Trên - Vani hồng phấn) */}
                <linearGradient id="tier2BodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff1f3" />
                  <stop offset="40%" stopColor="#fbcfe8" />
                  <stop offset="85%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>

                <linearGradient id="tier2TopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="80%" stopColor="#fff5f7" />
                  <stop offset="100%" stopColor="#ffe4e8" />
                </linearGradient>

                {/* 4. Lớp Kem Vani Sóng Lượn Tan Chảy */}
                <linearGradient id="creamDripGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="75%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#ffe4e8" />
                </linearGradient>

                {/* 5. Cây Nến Xoắn Sọc Dễ Thương */}
                <linearGradient id="candleBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffb3c6" />
                  <stop offset="35%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#ffccd5" />
                  <stop offset="100%" stopColor="#ff8fab" />
                </linearGradient>

                {/* 6. Quả Dâu Tây 3D Mọng Nước */}
                <radialGradient id="strawberryGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff6b8b" />
                  <stop offset="40%" stopColor="#e63946" />
                  <stop offset="90%" stopColor="#9d0208" />
                  <stop offset="100%" stopColor="#6a040f" />
                </radialGradient>

                {/* 7. Quả Cherry Anh Đào Đỏ Bóng */}
                <radialGradient id="cherryGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff4d6d" />
                  <stop offset="45%" stopColor="#d90429" />
                  <stop offset="95%" stopColor="#590d22" />
                </radialGradient>

                {/* 8. Vầng Sáng Ấm Áp Của Ngọn Lửa */}
                <radialGradient id="flameAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffbe0b" stopOpacity="0.9" />
                  <stop offset="45%" stopColor="#fb5607" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ff006e" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* BÓNG ĐỔ TRÊN BÀN */}
              <ellipse cx="170" cy="285" rx="125" ry="12" fill="rgba(244, 114, 182, 0.22)" />

              {/* ----------------------------------------------------------- */}
              {/* BƯỚC 1: ĐĨA SỨ CHÂN CAO NGỌC TRAI TINH TẾ                   */}
              {/* ----------------------------------------------------------- */}
              {cakeStep >= 1 && (
                <motion.g
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Chân đế đĩa sứ */}
                  <path
                    d="M 135 252 Q 170 274 205 252 L 195 276 Q 170 282 145 276 Z"
                    fill="#fed7e2"
                    stroke="#fbcfe8"
                    strokeWidth="1.2"
                  />
                  {/* Mặt đĩa lớn */}
                  <ellipse
                    cx="170"
                    cy="252"
                    rx="138"
                    ry="20"
                    fill="url(#plateGrad)"
                    stroke="#fbcfe8"
                    strokeWidth="1.5"
                  />
                  {/* Đường viền ngọc trai phản chiếu bên trong */}
                  <ellipse
                    cx="170"
                    cy="251"
                    rx="124"
                    ry="15"
                    fill="none"
                    stroke="rgba(255, 182, 193, 0.5)"
                    strokeWidth="1.2"
                  />
                  {/* Bóng bánh kem lên đĩa */}
                  <ellipse cx="170" cy="242" rx="100" ry="11" fill="rgba(190, 80, 110, 0.16)" />
                </motion.g>
              )}

              {/* ----------------------------------------------------------- */}
              {/* BƯỚC 2: TẦNG BÁNH DƯỚI RƠI NHÚN NHẢY ĐÀN HỒI (JELLY BOUNCE)  */}
              {/* ----------------------------------------------------------- */}
              {cakeStep >= 2 && (
                <motion.g
                  initial={{ y: -340, opacity: 0, scaleY: 1.4, scaleX: 0.72 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.4, 0.76, 1.15, 0.95, 1],
                    scaleX: [0.72, 1.25, 0.9, 1.04, 1],
                  }}
                  transition={{
                    duration: 0.85,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '170px', originY: '245px' }}
                >
                  {/* Thân bánh hình trụ tròn 3D */}
                  <path
                    d="M 75 182
                       L 75 230
                       A 95 19 0 0 0 265 230
                       L 265 182
                       A 95 19 0 0 1 75 182 Z"
                    fill="url(#tier1BodyGrad)"
                  />

                  {/* Mặt trên tầng 1 */}
                  <ellipse cx="170" cy="182" rx="95" ry="19" fill="url(#tier1TopGrad)" />

                  {/* Lớp kem tươi vani chảy viền sóng tự nhiên quanh tầng 1 */}
                  <path
                    d="M 75 182
                       C 75 192, 84 206, 92 206
                       C 98 206, 102 189, 108 189
                       C 114 189, 118 214, 126 214
                       C 134 214, 138 190, 146 190
                       C 154 190, 160 216, 170 216
                       C 180 216, 186 190, 194 190
                       C 202 190, 206 214, 214 214
                       C 222 214, 226 189, 232 189
                       C 238 189, 242 206, 248 206
                       C 256 206, 265 192, 265 182
                       A 95 19 0 0 1 75 182 Z"
                    fill="url(#creamDripGrad)"
                    filter="drop-shadow(0 3px 4px rgba(219, 112, 147, 0.28))"
                  />

                  {/* Chuỗi hạt kem tròn bo chân bánh (Pearly piping) */}
                  {[
                    [84, 222], [98, 228], [114, 233], [132, 236], [151, 238],
                    [170, 238.5], [189, 238], [208, 236], [226, 233], [242, 228], [256, 222]
                  ].map(([x, y], idx) => (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4.2"
                      fill="#ffffff"
                      stroke="#fbcfe8"
                      strokeWidth="0.8"
                      filter="drop-shadow(0 1px 2px rgba(255, 182, 193, 0.5))"
                    />
                  ))}

                  {/* Điểm xuyết hoa đường dâu pastel xinh xắn trên thân bánh */}
                  <g transform="translate(140, 206)">
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffd166" />
                  </g>
                  <g transform="translate(200, 206)">
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffd166" />
                  </g>
                </motion.g>
              )}

              {/* ----------------------------------------------------------- */}
              {/* BƯỚC 3: TẦNG BÁNH TRÊN RƠI XUỐNG ĐÀN HỒI                      */}
              {/* ----------------------------------------------------------- */}
              {cakeStep >= 3 && (
                <motion.g
                  initial={{ y: -300, opacity: 0, scaleY: 1.35, scaleX: 0.75 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.35, 0.78, 1.12, 0.96, 1],
                    scaleX: [0.75, 1.22, 0.92, 1.04, 1],
                  }}
                  transition={{
                    duration: 0.75,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '170px', originY: '180px' }}
                >
                  {/* Thân bánh tầng 2 */}
                  <path
                    d="M 105 125
                       L 105 170
                       A 65 14 0 0 0 235 170
                       L 235 125
                       A 65 14 0 0 1 105 125 Z"
                    fill="url(#tier2BodyGrad)"
                  />

                  {/* Mặt trên tầng 2 */}
                  <ellipse cx="170" cy="125" rx="65" ry="14" fill="url(#tier2TopGrad)" />

                  {/* Lớp kem vani sóng lượn tầng 2 */}
                  <path
                    d="M 105 125
                       C 105 133, 112 147, 118 147
                       C 124 147, 128 131, 134 131
                       C 140 131, 145 152, 153 152
                       C 161 152, 164 132, 170 132
                       C 176 132, 180 153, 188 153
                       C 195 153, 199 131, 206 131
                       C 212 131, 217 147, 223 147
                       C 229 147, 235 133, 235 125
                       A 65 14 0 0 1 105 125 Z"
                    fill="url(#creamDripGrad)"
                    filter="drop-shadow(0 3px 4px rgba(219, 112, 147, 0.3))"
                  />

                  {/* Hạt kem bo viền chân tầng 2 */}
                  {[
                    [112, 165], [124, 168.5], [138, 171], [154, 172.5],
                    [170, 173], [186, 172.5], [202, 171], [216, 168.5], [228, 165]
                  ].map(([x, y], idx) => (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#fbcfe8"
                      strokeWidth="0.7"
                    />
                  ))}
                </motion.g>
              )}

              {/* ----------------------------------------------------------- */}
              {/* BƯỚC 4: KEM TƯƠI, DÂU TÂY MỌNG NƯỚC & ANH ĐÀO BỒNG BỀNH    */}
              {/* ----------------------------------------------------------- */}
              {cakeStep >= 4 && (
                <motion.g
                  initial={{ y: -260, opacity: 0, scale: 0.6 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: [0.6, 1.25, 0.9, 1.05, 1],
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '170px', originY: '125px' }}
                >
                  {/* Bông kem xoắn meringue trên đỉnh */}
                  {[
                    [120, 120], [142, 126], [198, 126], [220, 120]
                  ].map(([cx, cy], idx) => (
                    <g key={idx} transform={`translate(${cx}, ${cy})`}>
                      <ellipse cx="0" cy="0" rx="8" ry="6" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(255, 182, 193, 0.4))" />
                      <path d="M -5 0 Q 0 -9 5 0 Q 0 -5 -5 0 Z" fill="#fff0f3" />
                      <circle cx="0" cy="-6" r="1.5" fill="#ffffff" />
                    </g>
                  ))}

                  {/* 🍓 QUẢ DÂU TÂY 1 (TRÁI - TO MỌNG NƯỚC) */}
                  <g transform="translate(133, 92) rotate(-8)">
                    {/* Thân dâu */}
                    <path
                      d="M 16 0 C 29 0 33 16 27 28 C 22 36 16 42 16 42 C 16 42 10 36 5 28 C -1 16 3 0 16 0 Z"
                      fill="url(#strawberryGrad)"
                      filter="drop-shadow(0 4px 6px rgba(180, 20, 50, 0.45))"
                    />
                    {/* Hạt dâu tây lấp lánh */}
                    <ellipse cx="10" cy="14" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="20" cy="14" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="15" cy="22" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="9" cy="27" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="21" cy="27" rx="0.9" ry="1.4" fill="#ffea79" />
                    {/* Vết bóng sáng trên vỏ dâu căng mọng */}
                    <path d="M 7 12 Q 9 6 15 4" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    {/* Cuống lá xanh */}
                    <path d="M 16 2 L 9 -3 Q 16 0 23 -3 Z" fill="#2d6a4f" />
                    <circle cx="16" cy="1" r="2.2" fill="#52b788" />
                  </g>

                  {/* 🍓 QUẢ DÂU TÂY 2 (PHẢI - XINH XẮN) */}
                  <g transform="translate(186, 96) rotate(12) scale(0.9)">
                    <path
                      d="M 16 0 C 29 0 33 16 27 28 C 22 36 16 42 16 42 C 16 42 10 36 5 28 C -1 16 3 0 16 0 Z"
                      fill="url(#strawberryGrad)"
                      filter="drop-shadow(0 4px 6px rgba(180, 20, 50, 0.4))"
                    />
                    <ellipse cx="10" cy="14" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="20" cy="14" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="15" cy="22" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="9" cy="27" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="21" cy="27" rx="0.9" ry="1.4" fill="#ffea79" />
                    <path d="M 7 12 Q 9 6 15 4" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <path d="M 16 2 L 9 -3 Q 16 0 23 -3 Z" fill="#2d6a4f" />
                    <circle cx="16" cy="1" r="2.2" fill="#52b788" />
                  </g>

                  {/* 🍒 QUẢ ANH ĐÀO ĐỎ NGỌT NGÀO CÓ CUỐNG UỐN LƯỢN */}
                  <g transform="translate(170, 94)">
                    <ellipse
                      cx="0"
                      cy="12"
                      rx="8"
                      ry="7.5"
                      fill="url(#cherryGrad)"
                      filter="drop-shadow(0 3px 5px rgba(150, 0, 30, 0.45))"
                    />
                    <ellipse cx="-2.5" cy="9.5" rx="2" ry="1.2" fill="rgba(255,255,255,0.75)" />
                    {/* Cuống cong mềm mại */}
                    <path
                      d="M 0 6 C 5 -4 14 -8 18 -16"
                      fill="none"
                      stroke="#40916c"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    {/* Chiếc lá nhỏ ở cuống */}
                    <path d="M 15 -12 Q 22 -16 20 -9 Z" fill="#74c69d" />
                  </g>
                </motion.g>
              )}

              {/* ----------------------------------------------------------- */}
              {/* BƯỚC 5: CÂY NẾN SLENDER CẮM VÀO GIỮA BÁNH                    */}
              {/* ----------------------------------------------------------- */}
              {cakeStep >= 5 && (
                <motion.g
                  initial={{ y: -220, opacity: 0, scaleY: 1.4 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.4, 0.82, 1.06, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  onClick={handleExtinguishCandle}
                  className="cursor-pointer"
                >
                  {/* Bấc nến */}
                  <line x1="170" y1="62" x2="170" y2="52" stroke="#44403c" strokeWidth="2" strokeLinecap="round" />

                  {/* Thân nến sọc pastel hồng trắng */}
                  <rect
                    x="165.5"
                    y="62"
                    width="9"
                    height="46"
                    rx="4.5"
                    fill="url(#candleBodyGrad)"
                    stroke="#f472b6"
                    strokeWidth="0.8"
                    filter="drop-shadow(0 2px 4px rgba(255, 150, 170, 0.4))"
                  />
                  {/* Sọc trang trí xoắn */}
                  <line x1="166" y1="72" x2="174" y2="76" stroke="#ffffff" strokeWidth="2.2" opacity="0.85" />
                  <line x1="166" y1="84" x2="174" y2="88" stroke="#ffffff" strokeWidth="2.2" opacity="0.85" />
                  <line x1="166" y1="96" x2="174" y2="100" stroke="#ffffff" strokeWidth="2.2" opacity="0.85" />

                  {/* ------------------------------------------------------- */}
                  {/* BƯỚC 6: NGỌN LỬA VÀNG ẤM ÁP BỪNG SÁNG LUNG LINH         */}
                  {/* ------------------------------------------------------- */}
                  {cakeStep >= 6 && !isCandleBlown && (
                    <motion.g
                      animate={{
                        scale: [1, 1.14, 0.96, 1.1, 1],
                        rotate: [-2, 3, -1, 2, -2],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: 'easeInOut',
                      }}
                      style={{ originX: '170px', originY: '52px' }}
                    >
                      {/* Vầng sáng vàng cam bao quanh */}
                      <circle cx="170" cy="38" r="32" fill="url(#flameAura)" />

                      {/* Ngọn lửa vàng ngoài */}
                      <path
                        d="M 170 20 C 177 30 181 38 175 46 C 168 52 159 48 162 40 C 165 32 161 28 170 20 Z"
                        fill="#ffb703"
                      />

                      {/* Lõi lửa trắng sáng bên trong */}
                      <path
                        d="M 170 28 C 174 34 176 40 172 44 C 168 47 165 44 167 39 C 169 35 167 32 170 28 Z"
                        fill="#ffffff"
                      />
                    </motion.g>
                  )}

                  {/* Làn khói mềm mại khi nến tắt */}
                  {isCandleBlown && (
                    <motion.path
                      d="M 170 48 Q 163 36 172 24 T 167 10"
                      fill="none"
                      stroke="#a8a29e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: [0, 1, 1], opacity: [0, 0.75, 0], y: -22 }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                  )}
                </motion.g>
              )}
            </svg>
          </div>

          {/* DÒNG NHẮC NHẸ NHÀNG (HOÀN TOÀN KHÔNG CÓ KHUNG NỀN THÔ CỨNG) */}
          {stage === 'READY_TO_BLOW' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center mt-2 mb-4"
            >
              {!isCandleBlown ? (
                <>
                  <p className="font-dancing text-2xl sm:text-3xl text-[#c24660] font-semibold drop-shadow-sm animate-pulse">
                    ✨ Thổi vào micro hoặc chạm vào nến để ước nha ✨
                  </p>

                  <div className="flex items-center gap-2 mt-3">
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
                  {micError && <p className="text-[11px] text-rose-500 mt-1">{micError}</p>}
                </>
              ) : (
                <p className="font-dancing text-2xl sm:text-3xl font-bold text-[#b83b5e] flex items-center justify-center gap-1 drop-shadow-sm">
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
        </motion.div>
      )}
    </motion.div>
  );
}
