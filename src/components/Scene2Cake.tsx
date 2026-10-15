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
  // 📜 3 DÒNG CHỮ CHẠY MỜ DẦN ĐÈ LÊN NHAU (HOÀN TOÀN KHÔNG CÓ KHUNG)
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
          }, 900);
          return prev;
        }
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [stage]);

  // 2. CHUỖI RƠI BÁNH KEM MỀM MẠI (SQUASH & STRETCH JELLY BOUNCE)
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Đĩa sứ chân cao xuất hiện mềm mại
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(350);
    }, 200);

    // 0.7s: Tầng bánh dưới rơi xuống đàn hồi (nhún nảy)
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(440);
    }, 700);

    // 1.3s: Tầng bánh trên rơi xuống nhún nảy
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(523);
    }, 1300);

    // 1.9s: Kem xốp, dâu tây mọng nước & anh đào rơi xuống bồng bềnh
    setTimeout(() => {
      setCakeStep(4);
      soundManager.playKeypress(659);
    }, 1900);

    // 2.5s: Cây nến pastel cắm vào giữa bánh
    setTimeout(() => {
      setCakeStep(5);
      soundManager.playKeypress(784);
    }, 2500);

    // 3.0s: Ngọn nến lung linh bừng sáng + Nổ pháo hoa + Bật nhạc sinh nhật
    setTimeout(() => {
      setCakeStep(6);
      setStage('READY_TO_BLOW');
      fireConfetti();
      soundManager.playBirthdayMelody();
    }, 3000);
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
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM PASTRY DỄ THƯƠNG & NGỌN NẾN LUNG LINH        */}
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

          {/* 🍰 BÁNH KEM MỚI HOÀN TOÀN: CHUẨN 3D VỚI CÁC KHỐI TRỤ HOÀN HẢO & NGỌN NẾN LUNG LINH */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg
              viewBox="0 0 360 340"
              className="w-[310px] sm:w-[360px] h-auto overflow-visible select-none drop-shadow-[0_20px_45px_rgba(255,170,185,0.4)]"
            >
              <defs>
                {/* Gradient đĩa sứ ngọc trai chân cao */}
                <linearGradient id="plateNewGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#fff5f7" />
                  <stop offset="100%" stopColor="#fed7e2" />
                </linearGradient>

                {/* Gradient Tầng 1 (Dưới - Dâu sữa pastel đa chiều 3D) */}
                <linearGradient id="tier1CylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f8a5c2" />
                  <stop offset="25%" stopColor="#ffccd5" />
                  <stop offset="70%" stopColor="#fca5b9" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>

                <linearGradient id="tier1TopNewGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#fff0f3" />
                  <stop offset="100%" stopColor="#ffd6e0" />
                </linearGradient>

                {/* Gradient Tầng 2 (Trên - Vani hồng phấn) */}
                <linearGradient id="tier2CylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fca5b9" />
                  <stop offset="25%" stopColor="#fbcfe8" />
                  <stop offset="70%" stopColor="#fda4af" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>

                <linearGradient id="tier2TopNewGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="75%" stopColor="#fff5f7" />
                  <stop offset="100%" stopColor="#fed7e2" />
                </linearGradient>

                {/* Gradient Nến kẻ sọc hồng trắng */}
                <linearGradient id="candleNewGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffb3c6" />
                  <stop offset="35%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#ffccd5" />
                  <stop offset="100%" stopColor="#ff8fab" />
                </linearGradient>

                {/* Gradient Dâu tây 3D mọng nước */}
                <radialGradient id="strawberryNewGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff6b8b" />
                  <stop offset="40%" stopColor="#e63946" />
                  <stop offset="90%" stopColor="#9d0208" />
                  <stop offset="100%" stopColor="#6a040f" />
                </radialGradient>

                {/* Gradient Cherry đỏ bóng */}
                <radialGradient id="cherryNewGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff4d6d" />
                  <stop offset="45%" stopColor="#d90429" />
                  <stop offset="95%" stopColor="#590d22" />
                </radialGradient>

                {/* Vầng hào quang lung linh của ngọn nến */}
                <radialGradient id="flameLuminousAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffeaa7" stopOpacity="0.95" />
                  <stop offset="30%" stopColor="#ffbe0b" stopOpacity="0.7" />
                  <stop offset="65%" stopColor="#fb5607" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ff006e" stopOpacity="0" />
                </radialGradient>

                {/* Điểm sáng lấp lánh (Sparkle Star) */}
                <radialGradient id="sparkleCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#ffb703" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* BÓNG ĐỔ MỀM DƯỚI BÀN */}
              <ellipse cx="180" cy="305" rx="130" ry="12" fill="rgba(244, 114, 182, 0.22)" filter="blur(6px)" />

              {/* ============================================================= */}
              {/* BƯỚC 1: ĐĨA SỨ CHÂN CAO HOÀNG GIA PASTEL                       */}
              {/* ============================================================= */}
              {cakeStep >= 1 && (
                <motion.g
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Chân đế đĩa sứ */}
                  <ellipse cx="180" cy="296" rx="55" ry="9" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
                  <path
                    d="M 152 272 C 160 286 162 292 145 296 L 215 296 C 198 292 200 286 208 272 Z"
                    fill="url(#plateNewGrad)"
                    stroke="#fbcfe8"
                    strokeWidth="1"
                  />
                  {/* Mặt đĩa lớn */}
                  <ellipse cx="180" cy="272" rx="145" ry="22" fill="url(#plateNewGrad)" stroke="#f472b6" strokeWidth="1.5" />
                  {/* Viền nổi phản chiếu trong đĩa */}
                  <ellipse cx="180" cy="271" rx="130" ry="17" fill="none" stroke="rgba(255, 182, 193, 0.6)" strokeWidth="1.2" />
                  {/* Bóng bánh kem lên đĩa */}
                  <ellipse cx="180" cy="262" rx="105" ry="12" fill="rgba(190, 80, 110, 0.16)" />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 2: TẦNG BÁNH DƯỚI RƠI NHÚN NẢY ĐÀN HỒI (JELLY BOUNCE)    */}
              {/* ============================================================= */}
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
                  style={{ originX: '180px', originY: '265px' }}
                >
                  {/* Đáy cong của khối trụ tầng 1 */}
                  <ellipse cx="180" cy="250" rx="100" ry="20" fill="url(#tier1CylinderGrad)" />

                  {/* Thân thẳng của khối trụ tầng 1 */}
                  <rect x="80" y="195" width="200" height="55" fill="url(#tier1CylinderGrad)" />

                  {/* Mặt trên cong của tầng 1 */}
                  <ellipse cx="180" cy="195" rx="100" ry="20" fill="url(#tier1TopNewGrad)" />

                  {/* Lớp kem tươi vani chảy viền sóng tự nhiên quanh tầng 1 */}
                  <path
                    d="M 80 195
                       C 80 205 90 222 98 222
                       C 106 222 110 202 116 202
                       C 122 202 126 228 135 228
                       C 144 228 148 204 156 204
                       C 164 204 170 230 180 230
                       C 190 230 196 204 204 204
                       C 212 204 216 228 225 228
                       C 234 228 238 202 244 202
                       C 250 202 254 222 262 222
                       C 270 222 280 205 280 195
                       A 100 20 0 0 1 80 195 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 4px rgba(219, 112, 147, 0.28))"
                  />

                  {/* Chuỗi hạt kem ngọc trai bo quanh chân tầng 1 */}
                  {[
                    [86, 255], [102, 261], [125, 266], [152, 269], [180, 270],
                    [208, 269], [235, 266], [258, 261], [274, 255]
                  ].map(([x, y], idx) => (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="4.6" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.8" />
                      <circle cx={x - 1.2} cy={y - 1.2} r="1.3" fill="#ffffff" />
                    </g>
                  ))}

                  {/* Điểm hoa đường trang trí tầng 1 */}
                  <g transform="translate(145, 218)">
                    <circle cx="0" cy="0" r="3.2" fill="#ffffff" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffd166" />
                  </g>
                  <g transform="translate(215, 218)">
                    <circle cx="0" cy="0" r="3.2" fill="#ffffff" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffd166" />
                  </g>
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 3: TẦNG BÁNH TRÊN RƠI XUỐNG ĐÀN HỒI (JELLY BOUNCE)       */}
              {/* ============================================================= */}
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
                  style={{ originX: '180px', originY: '190px' }}
                >
                  {/* Đáy cong của tầng 2 */}
                  <ellipse cx="180" cy="185" rx="70" ry="15" fill="url(#tier2CylinderGrad)" />

                  {/* Thân thẳng của tầng 2 */}
                  <rect x="110" y="135" width="140" height="50" fill="url(#tier2CylinderGrad)" />

                  {/* Mặt trên cong của tầng 2 */}
                  <ellipse cx="180" cy="135" rx="70" ry="15" fill="url(#tier2TopNewGrad)" />

                  {/* Lớp kem vani sóng lượn chảy tầng 2 */}
                  <path
                    d="M 110 135
                       C 110 144 118 160 125 160
                       C 132 160 136 142 142 142
                       C 148 142 153 166 162 166
                       C 171 166 174 144 180 144
                       C 186 144 190 166 198 166
                       C 207 166 211 142 218 142
                       C 224 142 228 160 235 160
                       C 242 160 250 144 250 135
                       A 70 15 0 0 1 110 135 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 4px rgba(219, 112, 147, 0.3))"
                  />

                  {/* Hạt kem bo viền chân tầng 2 */}
                  {[
                    [114, 189], [128, 194], [152, 198], [180, 200],
                    [208, 198], [232, 194], [246, 189]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="3.6" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.7" />
                  ))}
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 4: KEM TƯƠI, DÂU TÂY MỌNG NƯỚC & ANH ĐÀO BỒNG BỀNH       */}
              {/* ============================================================= */}
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
                  style={{ originX: '180px', originY: '135px' }}
                >
                  {/* 4 Bông kem xoắn meringue trên đỉnh */}
                  {[
                    [128, 130], [152, 136], [208, 136], [232, 130]
                  ].map(([cx, cy], idx) => (
                    <g key={idx} transform={`translate(${cx}, ${cy})`}>
                      <ellipse cx="0" cy="0" rx="9" ry="6.5" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(255, 182, 193, 0.4))" />
                      <path d="M -6 0 Q 0 -10 6 0 Q 0 -5 -6 0 Z" fill="#fff0f3" />
                      <circle cx="0" cy="-7" r="1.8" fill="#ffffff" />
                    </g>
                  ))}

                  {/* 🍓 QUẢ DÂU TÂY 1 (TRÁI - TO MỌNG NƯỚC) */}
                  <g transform="translate(142, 100) rotate(-10)">
                    <path
                      d="M 16 0 C 30 0 34 18 28 30 C 23 39 16 45 16 45 C 16 45 9 39 4 30 C -2 18 2 0 16 0 Z"
                      fill="url(#strawberryNewGrad)"
                      filter="drop-shadow(0 4px 6px rgba(180, 20, 50, 0.45))"
                    />
                    {/* Hạt dâu tây lấp lánh */}
                    <ellipse cx="10" cy="15" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="20" cy="15" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="15" cy="24" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="9" cy="29" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="21" cy="29" rx="1" ry="1.5" fill="#ffea79" />
                    {/* Độ bóng vỏ dâu căng mọng */}
                    <path d="M 8 13 Q 10 7 16 5" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none" />
                    {/* Cuống lá xanh */}
                    <path d="M 16 2 L 9 -3 Q 16 0 23 -3 Z" fill="#2d6a4f" />
                    <circle cx="16" cy="1" r="2.2" fill="#52b788" />
                  </g>

                  {/* 🍓 QUẢ DÂU TÂY 2 (PHẢI - XINH XẮN) */}
                  <g transform="translate(202, 104) rotate(12) scale(0.9)">
                    <path
                      d="M 16 0 C 30 0 34 18 28 30 C 23 39 16 45 16 45 C 16 45 9 39 4 30 C -2 18 2 0 16 0 Z"
                      fill="url(#strawberryNewGrad)"
                      filter="drop-shadow(0 4px 6px rgba(180, 20, 50, 0.4))"
                    />
                    <ellipse cx="10" cy="15" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="20" cy="15" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="15" cy="24" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="9" cy="29" rx="1" ry="1.5" fill="#ffea79" />
                    <ellipse cx="21" cy="29" rx="1" ry="1.5" fill="#ffea79" />
                    <path d="M 8 13 Q 10 7 16 5" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M 16 2 L 9 -3 Q 16 0 23 -3 Z" fill="#2d6a4f" />
                    <circle cx="16" cy="1" r="2.2" fill="#52b788" />
                  </g>

                  {/* 🍒 QUẢ ANH ĐÀO ĐỎ NGỌT NGÀO CÓ CUỐNG UỐN LƯỢN */}
                  <g transform="translate(172, 102)">
                    <ellipse cx="0" cy="14" rx="8.5" ry="8" fill="url(#cherryNewGrad)" filter="drop-shadow(0 3px 5px rgba(150, 0, 30, 0.45))" />
                    <ellipse cx="-2.5" cy="11.5" rx="2" ry="1.2" fill="rgba(255,255,255,0.85)" />
                    <path d="M 0 7 C 6 -3 15 -7 20 -16" fill="none" stroke="#40916c" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M 17 -12 Q 24 -16 22 -9 Z" fill="#74c69d" />
                  </g>
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 5: CÂY NẾN SLENDER & NGỌN NẾN LUNG LINH HUY HOÀNG         */}
              {/* ============================================================= */}
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
                  <line x1="180" y1="68" x2="180" y2="58" stroke="#333333" strokeWidth="2" strokeLinecap="round" />

                  {/* Thân nến sọc pastel hồng trắng */}
                  <rect
                    x="175.5"
                    y="68"
                    width="9"
                    height="50"
                    rx="4.5"
                    fill="url(#candleNewGrad)"
                    stroke="#f472b6"
                    strokeWidth="0.8"
                    filter="drop-shadow(0 2px 4px rgba(255, 150, 170, 0.4))"
                  />
                  {/* Sọc trang trí xoắn */}
                  <line x1="176" y1="78" x2="184" y2="82" stroke="#ffffff" strokeWidth="2.2" opacity="0.85" />
                  <line x1="176" y1="90" x2="184" y2="94" stroke="#ffffff" strokeWidth="2.2" opacity="0.85" />
                  <line x1="176" y1="102" x2="184" y2="106" stroke="#ffffff" strokeWidth="2.2" opacity="0.85" />

                  {/* Giọt nến tan chảy mềm mại */}
                  <circle cx="175" cy="82" r="1.5" fill="#ffb3c6" />

                  {/* ========================================================= */}
                  {/* BƯỚC 6: NGỌN NẾN LUNG LINH & CÁC NGÔI SAO TỎA SÁNG KỲ DIỆU */}
                  {/* ========================================================= */}
                  {cakeStep >= 6 && !isCandleBlown && (
                    <g>
                      {/* 🌟 1. VẦNG HÀO QUANG TOẢ SÁNG LUNG LINH (PULSING AURA) */}
                      <motion.circle
                        cx="180"
                        cy="42"
                        r="48"
                        fill="url(#flameLuminousAura)"
                        animate={{
                          scale: [1, 1.24, 0.96, 1.18, 1],
                          opacity: [0.85, 1, 0.75, 1, 0.85],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.6,
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '180px', originY: '42px' }}
                      />

                      {/* 🌟 2. TIA SÁNG CHỮ THẬP LẤP LÁNH (CROSS LIGHT FLARE) */}
                      <motion.g
                        animate={{
                          rotate: [0, 90, 180, 270, 360],
                          scale: [0.9, 1.15, 0.9],
                          opacity: [0.6, 0.9, 0.6],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 6,
                          ease: 'linear',
                        }}
                        style={{ originX: '180px', originY: '42px' }}
                      >
                        <line x1="150" y1="42" x2="210" y2="42" stroke="rgba(255, 235, 160, 0.5)" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="180" y1="12" x2="180" y2="72" stroke="rgba(255, 235, 160, 0.5)" strokeWidth="1.2" strokeLinecap="round" />
                      </motion.g>

                      {/* 🌟 3. NGỌN LỬA DẬP DỜN SỐNG ĐỘNG (DANCING FLAME) */}
                      <motion.g
                        animate={{
                          scale: [1, 1.16, 0.94, 1.12, 1],
                          rotate: [-3, 4, -2, 3, -3],
                          y: [0, -2, 1, -1, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.3,
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '180px', originY: '58px' }}
                      >
                        {/* Ngọn lửa vàng ngoài */}
                        <path
                          d="M 180 20 C 188 32 193 42 186 50 C 178 57 168 52 171 44 C 174 35 170 30 180 20 Z"
                          fill="#ffb703"
                          filter="drop-shadow(0 0 6px #ffbe0b)"
                        />

                        {/* Lõi lửa trắng sáng bên trong */}
                        <path
                          d="M 180 28 C 185 35 188 42 183 47 C 178 50 174 47 176 42 C 178 38 176 34 180 28 Z"
                          fill="#ffffff"
                        />

                        {/* Đốm lửa xanh lam chân nến chân thực */}
                        <ellipse cx="180" cy="53" rx="3" ry="1.6" fill="#3a86ff" opacity="0.75" />
                      </motion.g>

                      {/* 🌟 4. CÁC NGÔI SAO LẤP LÁNH BAY LƯỢN QUANH NẾN (LUNG LINH) */}
                      {/* Ngôi sao 1: Phía trên bên phải */}
                      <motion.g
                        transform="translate(204, 24)"
                        animate={{
                          scale: [0, 1.3, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 90, 180],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          ease: 'easeInOut',
                          delay: 0.1,
                        }}
                      >
                        <path d="M 0 -7 Q 1 -1 7 0 Q 1 1 0 7 Q -1 1 -7 0 Q -1 -1 0 -7 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1.5" fill="#ffd166" />
                      </motion.g>

                      {/* Ngôi sao 2: Phía trên bên trái */}
                      <motion.g
                        transform="translate(156, 28)"
                        animate={{
                          scale: [0, 1.2, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, -90, -180],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.1,
                          ease: 'easeInOut',
                          delay: 0.7,
                        }}
                      >
                        <path d="M 0 -6 Q 1 -1 6 0 Q 1 1 0 6 Q -1 1 -6 0 Q -1 -1 0 -6 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1.2" fill="#ffd166" />
                      </motion.g>

                      {/* Ngôi sao 3: Đỉnh cao nhất */}
                      <motion.g
                        transform="translate(180, 10)"
                        animate={{
                          scale: [0, 1.4, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.9,
                          ease: 'easeInOut',
                          delay: 1.2,
                        }}
                      >
                        <path d="M 0 -8 Q 1.2 -1.2 8 0 Q 1.2 1.2 0 8 Q -1.2 1.2 -8 0 Q -1.2 -1.2 0 -8 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1.8" fill="#ffd166" />
                      </motion.g>

                      {/* Ngôi sao 4: Phía dưới bên phải */}
                      <motion.g
                        transform="translate(212, 46)"
                        animate={{
                          scale: [0, 1.1, 0],
                          opacity: [0, 0.9, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.3,
                          ease: 'easeInOut',
                          delay: 0.4,
                        }}
                      >
                        <path d="M 0 -5 Q 1 -1 5 0 Q 1 1 0 5 Q -1 1 -5 0 Q -1 -1 0 -5 Z" fill="#ffe599" />
                      </motion.g>

                      {/* Ngôi sao 5: Phía dưới bên trái */}
                      <motion.g
                        transform="translate(148, 50)"
                        animate={{
                          scale: [0, 1.1, 0],
                          opacity: [0, 0.9, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.0,
                          ease: 'easeInOut',
                          delay: 1.0,
                        }}
                      >
                        <path d="M 0 -5 Q 1 -1 5 0 Q 1 1 0 5 Q -1 1 -5 0 Q -1 -1 0 -5 Z" fill="#ffccd5" />
                      </motion.g>
                    </g>
                  )}

                  {/* Làn khói mềm mại khi nến tắt */}
                  {isCandleBlown && (
                    <motion.path
                      d="M 180 54 Q 172 40 182 26 T 176 10"
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
