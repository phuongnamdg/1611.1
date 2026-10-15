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
          }, 800);
          return prev;
        }
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [stage]);

  // 2. CHUỖI RƠI BÁNH KEM TỐI GIẢN & MỀM MẠI (JELLY SPRING BOUNCE)
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Đĩa bánh sứ xuất hiện
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(350);
    }, 200);

    // 0.7s: Tầng bánh dưới rơi xuống đàn hồi (nhún nảy như thạch)
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(440);
    }, 700);

    // 1.3s: Tầng bánh trên rơi xuống nhún nảy
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(523);
    }, 1300);

    // 1.8s: Dâu tây & Cherry rơi xuống đỉnh bánh
    setTimeout(() => {
      setCakeStep(4);
      soundManager.playKeypress(659);
    }, 1800);

    // 2.3s: Cây nến pastel cắm vào giữa bánh
    setTimeout(() => {
      setCakeStep(5);
      soundManager.playKeypress(784);
    }, 2300);

    // 2.8s: Ngọn nến lung linh bừng sáng + Nổ pháo hoa + Bật nhạc sinh nhật
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
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-4 max-w-lg mx-auto text-center w-full select-none"
    >
      {/* CÁC ĐỐM TRÁI TIM PASTEL MỜ MỊN TRÔI LƠ LỬNG TRONG KHÔNG GIAN */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { top: '15%', left: '10%', size: 'w-4 h-4', delay: 0 },
          { top: '25%', right: '12%', size: 'w-5 h-5', delay: 1.2 },
          { top: '45%', left: '8%', size: 'w-6 h-6', delay: 0.6 },
          { top: '50%', right: '9%', size: 'w-5 h-5', delay: 1.8 },
          { top: '75%', left: '14%', size: 'w-4 h-4', delay: 2.2 },
          { top: '80%', right: '15%', size: 'w-6 h-6', delay: 0.9 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            style={{ position: 'absolute', top: item.top, left: item.left, right: item.right }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.35, 0.65, 0.35],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3 + idx * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            className={`${item.size} text-pink-300/60`}
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
      {stage === 'TYPING' && (
        <div className="w-full flex items-center justify-center min-h-[60vh] px-4 my-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={sentenceIdx}
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(10px)' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="font-dancing text-3xl sm:text-4xl md:text-5xl text-[#942948] font-semibold leading-relaxed tracking-wide drop-shadow-[0_4px_24px_rgba(255,182,193,0.55)] max-w-md mx-auto"
            >
              {introSentences[sentenceIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM ĐƠN GIẢN MÀ ĐẸP MẮT (KOREAN BENTO STYLE)      */}
      {/* ===================================================================== */}
      {stage !== 'TYPING' && (
        <motion.div
          key="cake-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh] py-2 z-10"
        >
          {/* ✨ TIÊU ĐỀ UỐN LƯỢN ĐƠN GIẢN, TINH TẾ & MỀM MẠI ✨ */}
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
                Nhật {config.recipientName ? config.recipientName : ''}
              </span>
              <span className="text-3xl sm:text-4xl animate-pulse">🌸</span>
            </div>
          </motion.div>

          {/* 🍰 BÁNH KEM ĐƠN GIẢN MÀ HIỆU QUẢ ĐẸP (3D PASTEL CHIFFON CAKE) */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg
              viewBox="0 0 320 290"
              className="w-[300px] sm:w-[350px] h-auto overflow-visible select-none drop-shadow-[0_20px_45px_rgba(255,170,185,0.4)]"
            >
              <defs>
                {/* 1. Gradient thân bánh hồng dâu sữa mịn màng */}
                <linearGradient id="simpleCakeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f78da7" />
                  <stop offset="25%" stopColor="#ffccd5" />
                  <stop offset="65%" stopColor="#fca5b9" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>

                {/* 2. Gradient đĩa sứ ngọc trai chân cao */}
                <linearGradient id="simplePlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#fff5f7" />
                  <stop offset="100%" stopColor="#fed7e2" />
                </linearGradient>

                {/* 3. Gradient quả dâu tây đỏ tươi mọng nước */}
                <radialGradient id="simpleBerryGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff4d6d" />
                  <stop offset="45%" stopColor="#d90429" />
                  <stop offset="90%" stopColor="#800f2f" />
                </radialGradient>

                {/* 4. Gradient quả cherry đỏ bóng */}
                <radialGradient id="simpleCherryGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff758f" />
                  <stop offset="50%" stopColor="#c1121f" />
                  <stop offset="100%" stopColor="#590d22" />
                </radialGradient>

                {/* 5. VẦNG HÀO QUANG NGỌN NẾN LUNG LINH ẤM ÁP */}
                <radialGradient id="simpleFlameGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffb703" stopOpacity="0.9" />
                  <stop offset="30%" stopColor="#ff8a00" stopOpacity="0.65" />
                  <stop offset="65%" stopColor="#ff5d8f" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ff758c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* BÓNG ĐỔ MỀM DƯỚI BÀN */}
              <ellipse cx="160" cy="265" rx="120" ry="12" fill="rgba(244, 114, 182, 0.22)" filter="blur(6px)" />

              {/* ============================================================= */}
              {/* BƯỚC 1: ĐĨA SỨ CHÂN CAO TRẮNG TINH VIỀN HỒNG                  */}
              {/* ============================================================= */}
              {cakeStep >= 1 && (
                <motion.g
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Chân đế đĩa sứ */}
                  <path
                    d="M 135 244 Q 160 258 185 244 L 178 260 Q 160 266 142 260 Z"
                    fill="#ffd6e0"
                    stroke="#f472b6"
                    strokeWidth="1.2"
                  />
                  {/* Mặt đĩa lớn */}
                  <ellipse cx="160" cy="242" rx="130" ry="20" fill="#ffffff" stroke="#f472b6" strokeWidth="1.6" />
                  {/* Viền phản chiếu trong đĩa */}
                  <ellipse cx="160" cy="241" rx="116" ry="15" fill="#fff5f7" stroke="#fbcfe8" strokeWidth="0.8" />
                  {/* Bóng bánh kem lên đĩa */}
                  <ellipse cx="160" cy="233" rx="98" ry="10" fill="rgba(219, 112, 147, 0.16)" />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 2: TẦNG BÁNH DƯỚI RƠI NHÚN NẢY ĐÀN HỒI (JELLY BOUNCE)    */}
              {/* ============================================================= */}
              {cakeStep >= 2 && (
                <motion.g
                  initial={{ y: -320, opacity: 0, scaleY: 1.35, scaleX: 0.75 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.35, 0.78, 1.14, 0.96, 1],
                    scaleX: [0.75, 1.24, 0.92, 1.03, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '160px', originY: '235px' }}
                >
                  {/* Đáy cong tầng 1 */}
                  <ellipse cx="160" cy="225" rx="95" ry="18" fill="url(#simpleCakeGrad)" />

                  {/* Thân phẳng tầng 1 */}
                  <rect x="65" y="176" width="190" height="49" fill="url(#simpleCakeGrad)" />

                  {/* Mặt trên cong tầng 1 */}
                  <ellipse cx="160" cy="176" rx="95" ry="18" fill="#ffffff" />

                  {/* LỚP KEM SỮA TƯƠI TRẮNG CHẢY TRÀN TỰ NHIÊN (CLEAN DRIP ICING) */}
                  <path
                    d="M 65 176
                       C 65 188, 75 204, 82 204
                       C 89 204, 93 186, 100 186
                       C 107 186, 112 210, 120 210
                       C 128 210, 132 186, 140 186
                       C 148 186, 153 212, 162 212
                       C 171 212, 176 186, 184 186
                       C 192 186, 197 210, 205 210
                       C 213 210, 218 186, 225 186
                       C 232 186, 237 204, 244 204
                       C 251 204, 255 188, 255 176
                       A 95 18 0 0 1 65 176 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 4px rgba(220, 100, 130, 0.26))"
                  />

                  {/* HÀNG HẠT NGỌC TRAI TRẮNG TINH BO CHÂN BÁNH */}
                  {[
                    [72, 227], [90, 233], [112, 238], [136, 241], [160, 242],
                    [184, 241], [208, 238], [230, 233], [248, 227]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="4.2" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(219, 112, 147, 0.3))" />
                  ))}
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 3: TẦNG BÁNH TRÊN RƠI XUỐNG ĐÀN HỒI                      */}
              {/* ============================================================= */}
              {cakeStep >= 3 && (
                <motion.g
                  initial={{ y: -280, opacity: 0, scaleY: 1.3, scaleX: 0.75 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.3, 0.8, 1.12, 0.97, 1],
                    scaleX: [0.75, 1.22, 0.93, 1.03, 1],
                  }}
                  transition={{
                    duration: 0.75,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '160px', originY: '170px' }}
                >
                  {/* Đáy cong tầng 2 */}
                  <ellipse cx="160" cy="170" rx="65" ry="14" fill="url(#simpleCakeGrad)" />

                  {/* Thân phẳng tầng 2 */}
                  <rect x="95" y="124" width="130" height="46" fill="url(#simpleCakeGrad)" />

                  {/* Mặt trên cong tầng 2 */}
                  <ellipse cx="160" cy="124" rx="65" ry="14" fill="#ffffff" />

                  {/* LỚP KEM SỮA TƯƠI TRẮNG CHẢY TẦNG 2 */}
                  <path
                    d="M 95 124
                       C 95 134, 102 148, 108 148
                       C 114 148, 118 134, 125 134
                       C 132 134, 137 152, 146 152
                       C 155 152, 159 134, 166 134
                       C 173 134, 178 152, 186 152
                       C 194 152, 199 134, 206 134
                       C 213 134, 218 146, 225 124
                       A 65 14 0 0 1 95 124 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 4px rgba(220, 100, 130, 0.28))"
                  />

                  {/* HẠT NGỌC TRAI BO CHÂN TẦNG 2 */}
                  {[
                    [102, 172], [120, 177], [140, 180], [160, 181],
                    [180, 180], [200, 177], [218, 172]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="3.5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(219, 112, 147, 0.3))" />
                  ))}

                  {/* 4 BÔNG KEM XỐP TRẮNG ĐỈNH BÁNH */}
                  {[
                    [106, 124], [126, 129], [194, 129], [214, 124]
                  ].map(([cx, cy], idx) => (
                    <ellipse key={idx} cx={cx} cy={cy} rx="5.5" ry="4" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(255, 182, 193, 0.5))" />
                  ))}
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 4: DÂU TÂY & CHERRY RƠI BỒNG BỀNH                         */}
              {/* ============================================================= */}
              {cakeStep >= 4 && (
                <motion.g
                  initial={{ y: -240, opacity: 0, scale: 0.6 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: [0.6, 1.24, 0.92, 1.04, 1],
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '160px', originY: '125px' }}
                >
                  {/* 🍓 QUẢ DÂU TÂY 1 (TRÁI) */}
                  <g transform="translate(136, 92) rotate(-12)">
                    <path
                      d="M 14 0 C 26 0 29 16 24 26 C 20 34 14 39 14 39 C 14 39 8 34 4 26 C -1 16 2 0 14 0 Z"
                      fill="url(#simpleBerryGrad)"
                      filter="drop-shadow(0 3px 5px rgba(120, 0, 0, 0.45))"
                    />
                    <circle cx="9" cy="13" r="0.8" fill="#ffea79" />
                    <circle cx="18" cy="13" r="0.8" fill="#ffea79" />
                    <circle cx="13" cy="21" r="0.8" fill="#ffea79" />
                    <circle cx="8" cy="25" r="0.8" fill="#ffea79" />
                    <circle cx="19" cy="25" r="0.8" fill="#ffea79" />
                    <path d="M 7 10 Q 9 5 14 3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                    <path d="M 14 2 L 8 -3 Q 14 0 20 -3 Z" fill="#2d6a4f" />
                    <circle cx="14" cy="1" r="2" fill="#52b788" />
                  </g>

                  {/* 🍓 QUẢ DÂU TÂY 2 (PHẢI) */}
                  <g transform="translate(184, 96) rotate(12) scale(0.92)">
                    <path
                      d="M 14 0 C 26 0 29 16 24 26 C 20 34 14 39 14 39 C 14 39 8 34 4 26 C -1 16 2 0 14 0 Z"
                      fill="url(#simpleBerryGrad)"
                      filter="drop-shadow(0 3px 5px rgba(120, 0, 0, 0.4))"
                    />
                    <circle cx="9" cy="13" r="0.8" fill="#ffea79" />
                    <circle cx="18" cy="13" r="0.8" fill="#ffea79" />
                    <circle cx="13" cy="21" r="0.8" fill="#ffea79" />
                    <circle cx="8" cy="25" r="0.8" fill="#ffea79" />
                    <circle cx="19" cy="25" r="0.8" fill="#ffea79" />
                    <path d="M 7 10 Q 9 5 14 3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                    <path d="M 14 2 L 8 -3 Q 14 0 20 -3 Z" fill="#2d6a4f" />
                    <circle cx="14" cy="1" r="2" fill="#52b788" />
                  </g>

                  {/* 🍒 QUẢ CHERRY ĐỎ BÓNG Ở GIỮA */}
                  <g transform="translate(153, 114)">
                    <circle cx="0" cy="0" r="7" fill="url(#simpleCherryGrad)" filter="drop-shadow(0 2px 4px rgba(100, 0, 20, 0.45))" />
                    <ellipse cx="-2" cy="-2.2" rx="1.8" ry="1.1" fill="rgba(255,255,255,0.85)" />
                  </g>
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 5: CÂY NẾN SLENDER SỌC HỒNG & NGỌN NẾN LUNG LINH          */}
              {/* ============================================================= */}
              {cakeStep >= 5 && (
                <motion.g
                  initial={{ y: -200, opacity: 0, scaleY: 1.4 }}
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
                  <line x1="160" y1="74" x2="160" y2="66" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />

                  {/* Thân nến mảnh trắng sọc hồng */}
                  <rect
                    x="156.5"
                    y="74"
                    width="7"
                    height="46"
                    rx="3.5"
                    fill="#ffffff"
                    stroke="#f472b6"
                    strokeWidth="0.8"
                    filter="drop-shadow(0 2px 4px rgba(255, 150, 170, 0.4))"
                  />
                  {/* Sọc trang trí xoắn hồng pastel */}
                  <line x1="157" y1="82" x2="163" y2="86" stroke="#ff8fab" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="157" y1="94" x2="163" y2="98" stroke="#ff8fab" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="157" y1="106" x2="163" y2="110" stroke="#ff8fab" strokeWidth="2.2" strokeLinecap="round" />

                  {/* ========================================================= */}
                  {/* BƯỚC 6: VẦNG HÀO QUANG TO TRÒN & NGỌN LỬA VÀNG LUNG LINH  */}
                  {/* ========================================================= */}
                  {cakeStep >= 6 && !isCandleBlown && (
                    <g>
                      {/* 🌟 1. VẦNG HÀO QUANG TO TRÒN MỜ ẢO LUNG LINH */}
                      <motion.circle
                        cx="160"
                        cy="50"
                        r="48"
                        fill="url(#simpleFlameGlow)"
                        filter="blur(8px)"
                        animate={{
                          scale: [1, 1.2, 0.96, 1.15, 1],
                          opacity: [0.85, 1, 0.8, 1, 0.85],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '160px', originY: '50px' }}
                      />

                      {/* 🌟 2. NGỌN LỬA VÀNG DẬP DỜN SỐNG ĐỘNG */}
                      <motion.g
                        animate={{
                          scale: [1, 1.15, 0.95, 1.1, 1],
                          rotate: [-3, 4, -2, 3, -3],
                          y: [0, -2, 1, -1, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.4,
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '160px', originY: '66px' }}
                      >
                        {/* Ngọn lửa vàng ngoài */}
                        <path
                          d="M 160 28 C 167 38 171 46 165 54 C 159 61 150 57 153 49 C 156 41 152 36 160 28 Z"
                          fill="#ffbe0b"
                          filter="drop-shadow(0 0 5px #ffb703)"
                        />

                        {/* Lõi lửa trắng sáng bên trong */}
                        <path
                          d="M 160 36 C 164 42 166 47 162 51 C 158 54 155 52 157 47 C 159 43 157 40 160 36 Z"
                          fill="#ffffff"
                        />

                        {/* Đốm lửa xanh lam chân thực */}
                        <ellipse cx="160" cy="62" rx="2.5" ry="1.4" fill="#3a86ff" opacity="0.8" />
                      </motion.g>

                      {/* 🌟 3. CÁC ĐỐM SAO LẤP LÁNH BAY LƯỢN QUANH NẾN */}
                      <motion.g
                        transform="translate(182, 30)"
                        animate={{
                          scale: [0, 1.3, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 90, 180],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.9,
                          ease: 'easeInOut',
                          delay: 0.2,
                        }}
                      >
                        <path d="M 0 -6 Q 1 -1 6 0 Q 1 1 0 6 Q -1 1 -6 0 Q -1 -1 0 -6 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1.3" fill="#ffd166" />
                      </motion.g>

                      <motion.g
                        transform="translate(138, 34)"
                        animate={{
                          scale: [0, 1.2, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, -90, -180],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.2,
                          ease: 'easeInOut',
                          delay: 0.8,
                        }}
                      >
                        <path d="M 0 -5 Q 1 -1 5 0 Q 1 1 0 5 Q -1 1 -5 0 Q -1 -1 0 -5 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1" fill="#ffd166" />
                      </motion.g>
                    </g>
                  )}

                  {/* Làn khói mềm mại khi nến tắt */}
                  {isCandleBlown && (
                    <motion.path
                      d="M 160 60 Q 152 44 162 28 T 156 8"
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

          {/* DÒNG NHẮC NHẸ NHÀNG (PHÔNG CHỮ UỐN LƯỢN MỀM MẠI) */}
          {stage === 'READY_TO_BLOW' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
                  {micError && <p className="text-[11px] text-rose-500 mt-1">{micError}</p>}
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
        </motion.div>
      )}
    </motion.div>
  );
}
