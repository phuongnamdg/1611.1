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

  // 2. CHUỖI RƠI TỪNG TẦNG BÁNH KEM CHUẨN TIKTOK (SQUASH & STRETCH BOUNCE)
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Đĩa sứ chân cao xuất hiện
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

    // 2.8s: Ngọn nến lung linh bừng sáng + Nổ pháo hoa + Nhạc sinh nhật
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
      {/* CÁC ĐỐM TRÁI TIM MỜ MỊN TRÔI LƠ LỬNG TRONG KHÔNG GIAN (GIỐNG HÌNH MẪU TIKTOK) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { top: '15%', left: '10%', size: 'w-4 h-4', delay: 0 },
          { top: '25%', right: '12%', size: 'w-5 h-5', delay: 1.2 },
          { top: '45%', left: '8%', size: 'w-6 h-6', delay: 0.6 },
          { top: '48%', right: '9%', size: 'w-5 h-5', delay: 1.8 },
          { top: '75%', left: '14%', size: 'w-4 h-4', delay: 2.2 },
          { top: '80%', right: '15%', size: 'w-6 h-6', delay: 0.9 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            style={{ position: 'absolute', top: item.top, left: item.left, right: item.right }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.35, 0.7, 0.35],
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
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM & TIÊU ĐỀ CHUẨN XÁC 100% THEO ẢNH TIKTOK       */}
      {/* ===================================================================== */}
      {stage !== 'TYPING' && (
        <motion.div
          key="cake-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh] py-2 z-10"
        >
          {/* ✨ TIÊU ĐỀ 2 DÒNG UỐN LƯỢN + HOA ANH ĐÀO (CHUẨN 100% NHƯ HÌNH MẪU TIKTOK) ✨ */}
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

              {/* 🌸 Vector Bông Hoa Anh Đào 5 Cánh Chuẩn Như Trong Ảnh */}
              <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10 inline-block drop-shadow-sm ml-0.5">
                <defs>
                  <radialGradient id="cherryPetalGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffb3c6" />
                    <stop offset="70%" stopColor="#ff6384" />
                    <stop offset="100%" stopColor="#d81b60" />
                  </radialGradient>
                </defs>
                {[0, 72, 144, 216, 288].map((deg, i) => (
                  <ellipse
                    key={i}
                    cx="20"
                    cy="11"
                    rx="5.8"
                    ry="8"
                    fill="url(#cherryPetalGrad)"
                    transform={`rotate(${deg} 20 20)`}
                  />
                ))}
                <circle cx="20" cy="20" r="4.2" fill="#ffffff" />
                <circle cx="20" cy="20" r="2.2" fill="#ffd166" />
              </svg>
            </div>
          </motion.div>

          {/* 🍰 BÁNH KEM CHUẨN XÁC THEO HÌNH MẪU TIKTOK: 2 TẦNG HỒNG PASTEL, SCALLOP ICING & LUNG LINH */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg
              viewBox="0 0 380 340"
              className="w-[310px] sm:w-[370px] h-auto overflow-visible select-none drop-shadow-[0_20px_45px_rgba(255,170,185,0.45)]"
            >
              <defs>
                {/* 1. Gradient thân bánh hồng phấn pastel (3D mịn màng) */}
                <linearGradient id="tiktokCakeTierGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f78da7" />
                  <stop offset="25%" stopColor="#ffaec0" />
                  <stop offset="55%" stopColor="#fca5b9" />
                  <stop offset="85%" stopColor="#f6829e" />
                  <stop offset="100%" stopColor="#ec5f82" />
                </linearGradient>

                {/* 2. Gradient mặt trên của tầng bánh (trắng kem vani) */}
                <linearGradient id="tiktokTopIcingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="80%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#ffeef2" />
                </linearGradient>

                {/* 3. Gradient đĩa sứ ngọc trai viền hồng */}
                <linearGradient id="tiktokPlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="65%" stopColor="#fff5f7" />
                  <stop offset="100%" stopColor="#fed7e2" />
                </linearGradient>

                {/* 4. Gradient quả dâu tây đỏ đậm 3D */}
                <radialGradient id="tiktokStrawberryGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#e63946" />
                  <stop offset="50%" stopColor="#ba181b" />
                  <stop offset="90%" stopColor="#780000" />
                  <stop offset="100%" stopColor="#4a0404" />
                </radialGradient>

                {/* 5. Gradient quả cherry đỏ bóng */}
                <radialGradient id="tiktokCherryGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff4d6d" />
                  <stop offset="45%" stopColor="#c1121f" />
                  <stop offset="95%" stopColor="#590d22" />
                </radialGradient>

                {/* 6. VẦNG HÀO QUANG TO TRÒN ẤM ÁP CỰC KỲ LUNG LINH (CHUẨN ẢNH TIKTOK) */}
                <radialGradient id="tiktokFlameGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffb703" stopOpacity="0.95" />
                  <stop offset="25%" stopColor="#ff8a00" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#ff5d8f" stopOpacity="0.4" />
                  <stop offset="85%" stopColor="#ff758c" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ff758c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* BÓNG ĐỔ MỀM DƯỚI BÀN */}
              <ellipse cx="190" cy="298" rx="140" ry="12" fill="rgba(244, 114, 182, 0.25)" filter="blur(6px)" />

              {/* ============================================================= */}
              {/* BƯỚC 1: ĐĨA SỨ CHÂN CAO HOÀNG GIA VIỀN HỒNG CÁNH SEN          */}
              {/* ============================================================= */}
              {cakeStep >= 1 && (
                <motion.g
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Chân đế đĩa sứ */}
                  <path
                    d="M 160 278 Q 190 292 220 278 L 210 292 Q 190 298 170 292 Z"
                    fill="#fed7e2"
                    stroke="#f472b6"
                    strokeWidth="1.2"
                  />
                  {/* Mặt đĩa lớn */}
                  <ellipse cx="190" cy="272" rx="150" ry="24" fill="#ffffff" stroke="#f472b6" strokeWidth="1.8" />
                  {/* Viền nổi phản chiếu trong đĩa */}
                  <ellipse cx="190" cy="271" rx="136" ry="19" fill="#fff5f7" stroke="#fbcfe8" strokeWidth="1" />
                  {/* Bóng bánh kem lên đĩa */}
                  <ellipse cx="190" cy="262" rx="112" ry="12" fill="rgba(219, 112, 147, 0.18)" />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 2: TẦNG BÁNH DƯỚI RƠI NHÚN NẢY ĐÀN HỒI (JELLY BOUNCE)    */}
              {/* ============================================================= */}
              {cakeStep >= 2 && (
                <motion.g
                  initial={{ y: -340, opacity: 0, scaleY: 1.35, scaleX: 0.72 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.35, 0.78, 1.14, 0.96, 1],
                    scaleX: [0.72, 1.24, 0.92, 1.03, 1],
                  }}
                  transition={{
                    duration: 0.85,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '190px', originY: '265px' }}
                >
                  {/* Đáy cong của khối trụ tầng 1 */}
                  <ellipse cx="190" cy="250" rx="110" ry="22" fill="url(#tiktokCakeTierGrad)" />

                  {/* Thân phẳng của khối trụ tầng 1 */}
                  <rect x="80" y="195" width="220" height="55" fill="url(#tiktokCakeTierGrad)" />

                  {/* Mặt trên cong của tầng 1 */}
                  <ellipse cx="190" cy="195" rx="110" ry="22" fill="url(#tiktokTopIcingGrad)" />

                  {/* LỚP KEM TRẮNG UỐN LƯỢN RỦ XUỐNG DẠNG RÈM (5 SCALLOP DRAPES CHUẨN ẢNH) */}
                  <path
                    d="M 80 195
                       Q 102 224 124 206
                       Q 146 227 168 208
                       Q 190 229 212 208
                       Q 234 227 256 206
                       Q 278 224 300 195
                       A 110 22 0 0 1 80 195 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 4px rgba(219, 112, 147, 0.28))"
                  />

                  {/* Các hạt tròn nhỏ lấp lánh tại đỉnh giao nhau của rèm kem */}
                  {[
                    [124, 206], [168, 208], [212, 208], [256, 206]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="2" fill="#ffe599" />
                  ))}

                  {/* CHUỖI HẠT NGỌC TRAI TRÒN TRĨNH TRẮNG TINH BO CHÂN TẦNG 1 */}
                  {[
                    [86, 253], [104, 259], [126, 265], [152, 269], [178, 271],
                    [190, 272], [202, 271], [228, 269], [254, 265], [276, 259], [294, 253]
                  ].map(([x, y], idx) => (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(219, 112, 147, 0.35))" />
                      <circle cx={x - 1.2} cy={y - 1.2} r="1.4" fill="#ffffff" />
                    </g>
                  ))}
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 3: TẦNG BÁNH TRÊN RƠI XUỐNG ĐÀN HỒI (JELLY BOUNCE)       */}
              {/* ============================================================= */}
              {cakeStep >= 3 && (
                <motion.g
                  initial={{ y: -300, opacity: 0, scaleY: 1.3, scaleX: 0.75 }}
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
                  style={{ originX: '190px', originY: '190px' }}
                >
                  {/* Đáy cong của tầng 2 */}
                  <ellipse cx="190" cy="190" rx="75" ry="16" fill="url(#tiktokCakeTierGrad)" />

                  {/* Thân phẳng của tầng 2 */}
                  <rect x="115" y="135" width="150" height="55" fill="url(#tiktokCakeTierGrad)" />

                  {/* Mặt trên cong của tầng 2 */}
                  <ellipse cx="190" cy="135" rx="75" ry="16" fill="url(#tiktokTopIcingGrad)" />

                  {/* LỚP KEM TRẮNG UỐN LƯỢN RỦ XUỐNG (4 SCALLOP DRAPES CHUẨN ẢNH) */}
                  <path
                    d="M 115 135
                       Q 134 162 152.5 146
                       Q 171 164 190 148
                       Q 209 164 227.5 146
                       Q 246 162 265 135
                       A 75 16 0 0 1 115 135 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 4px rgba(219, 112, 147, 0.3))"
                  />

                  {/* Điểm hạt tròn tại đỉnh rèm kem tầng 2 */}
                  {[
                    [152.5, 146], [190, 148], [227.5, 146]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="1.8" fill="#ffe599" />
                  ))}

                  {/* CHUỖI HẠT NGỌC TRAI BO VIỀN CHÂN TẦNG 2 */}
                  {[
                    [120, 191], [136, 196], [158, 201], [180, 203], [190, 204],
                    [200, 203], [222, 201], [244, 196], [260, 191]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="4.2" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(219, 112, 147, 0.3))" />
                  ))}

                  {/* Bông kem xốp nhỏ quanh mặt trên */}
                  {[
                    [125, 134], [148, 138], [232, 138], [255, 134]
                  ].map(([cx, cy], idx) => (
                    <ellipse key={idx} cx={cx} cy={cy} rx="6" ry="4.5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(255, 182, 193, 0.5))" />
                  ))}
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 4: 2 QUẢ DÂU TÂY ĐỎ ĐẬM & QUẢ CHERRY RƠI BỒNG BỀNH       */}
              {/* ============================================================= */}
              {cakeStep >= 4 && (
                <motion.g
                  initial={{ y: -260, opacity: 0, scale: 0.6 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: [0.6, 1.24, 0.92, 1.04, 1],
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{ originX: '190px', originY: '135px' }}
                >
                  {/* 🍓 QUẢ DÂU TÂY 1 (BÊN TRÁI - NGHIÊNG NHẸ SANG TRÁI NHƯ ẢNH) */}
                  <g transform="translate(162, 102) rotate(-14)">
                    <path
                      d="M 16 0 C 30 0 34 18 28 30 C 23 39 16 45 16 45 C 16 45 9 39 4 30 C -2 18 2 0 16 0 Z"
                      fill="url(#tiktokStrawberryGrad)"
                      filter="drop-shadow(0 4px 6px rgba(120, 0, 0, 0.5))"
                    />
                    {/* Hạt dâu vàng li ti */}
                    <ellipse cx="10" cy="15" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="20" cy="15" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="15" cy="24" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="9" cy="29" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="21" cy="29" rx="0.9" ry="1.4" fill="#ffea79" />
                    {/* Ánh sáng bóng trên vỏ */}
                    <path d="M 8 12 Q 10 6 15 4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    {/* Cuống lá xanh */}
                    <path d="M 16 2 L 9 -3 Q 16 0 23 -3 Z" fill="#2d6a4f" />
                    <circle cx="16" cy="1" r="2.2" fill="#52b788" />
                  </g>

                  {/* 🍓 QUẢ DÂU TÂY 2 (BÊN PHẢI - NGHIÊNG NHẸ SANG PHẢI NHƯ ẢNH) */}
                  <g transform="translate(216, 108) rotate(14) scale(0.92)">
                    <path
                      d="M 16 0 C 30 0 34 18 28 30 C 23 39 16 45 16 45 C 16 45 9 39 4 30 C -2 18 2 0 16 0 Z"
                      fill="url(#tiktokStrawberryGrad)"
                      filter="drop-shadow(0 4px 6px rgba(120, 0, 0, 0.45))"
                    />
                    <ellipse cx="10" cy="15" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="20" cy="15" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="15" cy="24" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="9" cy="29" rx="0.9" ry="1.4" fill="#ffea79" />
                    <ellipse cx="21" cy="29" rx="0.9" ry="1.4" fill="#ffea79" />
                    <path d="M 8 12 Q 10 6 15 4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <path d="M 16 2 L 9 -3 Q 16 0 23 -3 Z" fill="#2d6a4f" />
                    <circle cx="16" cy="1" r="2.2" fill="#52b788" />
                  </g>

                  {/* 🍒 QUẢ CHERRY ĐỎ BÓNG CẮM Ở GIỮA */}
                  <g transform="translate(182, 126)">
                    <circle cx="0" cy="0" r="7.5" fill="url(#tiktokCherryGrad)" filter="drop-shadow(0 2px 4px rgba(100, 0, 20, 0.5))" />
                    <ellipse cx="-2.2" cy="-2.5" rx="2" ry="1.2" fill="rgba(255,255,255,0.85)" />
                  </g>
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 5: CÂY NẾN SLENDER SỌC HỒNG & VẦNG HÀO QUANG TO TRÒN     */}
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
                  <line x1="190" y1="84" x2="190" y2="76" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />

                  {/* Thân nến mảnh trắng sọc hồng (Slender candle stick) */}
                  <rect
                    x="186.5"
                    y="84"
                    width="7"
                    height="46"
                    rx="3.5"
                    fill="#ffffff"
                    stroke="#f472b6"
                    strokeWidth="0.8"
                    filter="drop-shadow(0 2px 4px rgba(255, 150, 170, 0.4))"
                  />
                  {/* Sọc trang trí xoắn hồng pastel */}
                  <line x1="187" y1="92" x2="193" y2="96" stroke="#ff8fab" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="187" y1="104" x2="193" y2="108" stroke="#ff8fab" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="187" y1="116" x2="193" y2="120" stroke="#ff8fab" strokeWidth="2.2" strokeLinecap="round" />

                  {/* Chiếc mầm xanh nhỏ bên cạnh nến (y hệt hình mẫu TikTok) */}
                  <path d="M 194 98 Q 200 95 197 103 Z" fill="#52b788" />

                  {/* ========================================================= */}
                  {/* BƯỚC 6: VẦNG HÀO QUANG TO TRÒN & NGỌN LỬA VÀNG LUNG LINH  */}
                  {/* (CHUẨN XÁC 100% NHƯ HÌNH BẠN VỪA GỬI)                     */}
                  {/* ========================================================= */}
                  {cakeStep >= 6 && !isCandleBlown && (
                    <g>
                      {/* 🌟 1. VẦNG HÀO QUANG TO TRÒN MỜ ẢO LUNG LINH (BẢN SAO ẢNH MẪU) */}
                      <motion.circle
                        cx="190"
                        cy="60"
                        r="52"
                        fill="url(#tiktokFlameGlow)"
                        filter="blur(10px)"
                        animate={{
                          scale: [1, 1.2, 0.96, 1.15, 1],
                          opacity: [0.85, 1, 0.8, 1, 0.85],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '190px', originY: '60px' }}
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
                        style={{ originX: '190px', originY: '76px' }}
                      >
                        {/* Ngọn lửa vàng ngoài */}
                        <path
                          d="M 190 38 C 197 48 201 56 195 64 C 189 71 180 67 183 59 C 186 51 182 46 190 38 Z"
                          fill="#ffbe0b"
                          filter="drop-shadow(0 0 5px #ffb703)"
                        />

                        {/* Lõi lửa trắng sáng bên trong */}
                        <path
                          d="M 190 46 C 194 52 196 57 192 61 C 188 64 185 62 187 57 C 189 53 187 50 190 46 Z"
                          fill="#ffffff"
                        />

                        {/* Đốm lửa xanh lam chân thực */}
                        <ellipse cx="190" cy="72" rx="2.5" ry="1.5" fill="#3a86ff" opacity="0.8" />
                      </motion.g>

                      {/* 🌟 3. CÁC ĐỐM SÁNG LẤP LÁNH BAY LƯỢN QUANH NẾN */}
                      <motion.g
                        transform="translate(214, 40)"
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
                        <path d="M 0 -7 Q 1 -1 7 0 Q 1 1 0 7 Q -1 1 -7 0 Q -1 -1 0 -7 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1.5" fill="#ffd166" />
                      </motion.g>

                      <motion.g
                        transform="translate(166, 44)"
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
                        <path d="M 0 -6 Q 1 -1 6 0 Q 1 1 0 6 Q -1 1 -6 0 Q -1 -1 0 -6 Z" fill="#ffffff" />
                        <circle cx="0" cy="0" r="1.2" fill="#ffd166" />
                      </motion.g>
                    </g>
                  )}

                  {/* Làn khói mềm mại khi nến tắt */}
                  {isCandleBlown && (
                    <motion.path
                      d="M 190 70 Q 182 54 192 38 T 186 18"
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

          {/* DÒNG NHẮC NHẸ NHÀNG (CHUẨN PHÔNG CHỮ & CÂU CHỮ NHƯ HÌNH MẪU TIKTOK) */}
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
