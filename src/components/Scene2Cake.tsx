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

  // 2. CHUỖI RƠI TỪNG TẦNG BÁNH KEM CHUẨN XÁC 100% THEO HÌNH MẪU CỦA BẠN
  const startCakeDrop = () => {
    setStage('CAKE_DROPPING');

    // 0.2s: Tầng bánh dưới rơi xuống đàn hồi (nhún nảy như thạch)
    setTimeout(() => {
      setCakeStep(1);
      soundManager.playKeypress(440);
    }, 200);

    // 0.8s: Tầng bánh trên kèm lớp kem chảy rơi xuống nhún nảy
    setTimeout(() => {
      setCakeStep(2);
      soundManager.playKeypress(523);
    }, 800);

    // 1.4s: Cây nến pastel cắm vào giữa bánh
    setTimeout(() => {
      setCakeStep(3);
      soundManager.playKeypress(784);
    }, 1400);

    // 1.9s: Ngọn nến lung linh bừng sáng + Nổ pháo hoa + Bật nhạc sinh nhật
    setTimeout(() => {
      setCakeStep(4);
      setStage('READY_TO_BLOW');
      fireConfetti();
      soundManager.playBirthdayMelody();
    }, 1900);
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
      {/* CÁC ĐỐM TRÁI TIM PASTEL MỜ MỊN TRÔI LƠ LỬNG TRONG KHÔNG GIAN (Y HỆT HÌNH BẠN GỬI) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { top: '12%', left: '8%', size: 'w-5 h-5', delay: 0 },
          { top: '20%', right: '10%', size: 'w-6 h-6', delay: 1.2 },
          { top: '35%', left: '12%', size: 'w-4 h-4', delay: 2.1 },
          { top: '48%', left: '6%', size: 'w-6 h-6', delay: 0.6 },
          { top: '52%', right: '8%', size: 'w-5 h-5', delay: 1.8 },
          { top: '70%', left: '16%', size: 'w-5 h-5', delay: 2.5 },
          { top: '76%', right: '14%', size: 'w-7 h-7', delay: 0.9 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            style={{ position: 'absolute', top: item.top, left: item.left, right: item.right }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3.2 + idx * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            className={`${item.size} text-[#f06292]/50`}
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
      {/* 🎂 GIAI ĐOẠN 2: BÁNH KEM CHUẨN XÁC 100% THEO ẢNH BẠN VỪA GỬI         */}
      {/* ===================================================================== */}
      {stage !== 'TYPING' && (
        <motion.div
          key="cake-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-between min-h-[85vh] py-2 z-10"
        >
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
                Nhật {config.recipientName ? config.recipientName : ''}
              </span>
              <span className="text-3xl sm:text-4xl animate-pulse">🌸</span>
            </div>
          </motion.div>

          {/* 🍰 BÁNH KEM CHUẨN XÁC 100% THEO HÌNH ẢNH BẠN GỬI (ĐƠN GIẢN, ĐẸP, MỀM MẠI) */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg
              viewBox="0 0 320 250"
              className="w-[290px] sm:w-[340px] h-auto overflow-visible select-none drop-shadow-[0_15px_35px_rgba(255,170,185,0.4)]"
            >
              <defs>
                {/* Vầng hào quang ngọn nến lung linh ấm áp */}
                <radialGradient id="cakeFlameAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffb703" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#ff8a00" stopOpacity="0.7" />
                  <stop offset="65%" stopColor="#ff5d8f" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ff758c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* BÓNG ĐỔ MỀM MẠI DƯỚI ĐÁY BÁNH */}
              <ellipse cx="160" cy="224" rx="115" ry="9" fill="rgba(244, 114, 182, 0.25)" filter="blur(5px)" />

              {/* ============================================================= */}
              {/* BƯỚC 1: TẦNG BÁNH DƯỚI RƠI NHÚN NẢY ĐÀN HỒI (JELLY BOUNCE)    */}
              {/* ============================================================= */}
              {cakeStep >= 1 && (
                <motion.g
                  initial={{ y: -300, opacity: 0, scaleY: 1.35, scaleX: 0.75 }}
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
                  style={{ originX: '160px', originY: '215px' }}
                >
                  {/* Đế bánh viền trắng ngà ở đáy (chuẩn như ảnh) */}
                  <rect x="50" y="215" width="220" height="4" rx="2" fill="#fff5eb" />

                  {/* Thân bánh dâu hồng phấn (khối chính tầng 1) */}
                  <rect x="50" y="170" width="220" height="46" rx="5" fill="#f8a5b8" />

                  {/* Dải nhân mứt dâu đậm chạy ngang giữa bánh (chuẩn như ảnh) */}
                  <rect x="50" y="191" width="220" height="9" fill="#f06292" />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 2: TẦNG BÁNH TRÊN KÈM LỚP KEM CHẢY RƠI XUỐNG ĐÀN HỒI    */}
              {/* ============================================================= */}
              {cakeStep >= 2 && (
                <motion.g
                  initial={{ y: -260, opacity: 0, scaleY: 1.3, scaleX: 0.75 }}
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
                  {/* Thân bánh tầng 2 (khối màu hồng phấn) */}
                  <rect x="90" y="132" width="140" height="38" rx="5" fill="#f8a5b8" />

                  {/* Dải nhân mứt dâu đậm giữa tầng 2 */}
                  <rect x="90" y="149" width="140" height="7" fill="#f06292" />

                  {/* LỚP KEM SỮA TƯƠI TRẮNG CHẢY TRÀN (CÓ VỆT KEM DÀI RỦ XUỐNG TẦNG DƯỚI CHUẨN ẢNH) */}
                  <path
                    d="M 88 135
                       C 88 128 92 126 98 126
                       L 222 126
                       C 228 126 232 128 232 135
                       L 232 144
                       C 232 148 226 150 224 146
                       C 220 138 212 138 210 146
                       L 208 152
                       C 206 156 200 156 198 150
                       C 194 140 186 140 184 154
                       L 182 164
                       C 180 168 174 168 172 160
                       C 168 144 158 144 156 152
                       L 154 154
                       C 152 158 146 158 144 152
                       C 140 142 132 142 130 156
                       L 128 160
                       C 126 164 120 164 118 154
                       C 114 140 108 140 106 150
                       L 106 198
                       C 106 202 98 202 98 198
                       L 98 148
                       C 96 142 88 144 88 135 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 2px 4px rgba(220, 100, 130, 0.22))"
                  />
                </motion.g>
              )}

              {/* ============================================================= */}
              {/* BƯỚC 3: CÂY NẾN SLENDER SỌC HỒNG TRẮNG CẮM VÀO GIỮA BÁNH     */}
              {/* ============================================================= */}
              {cakeStep >= 3 && (
                <motion.g
                  initial={{ y: -180, opacity: 0, scaleY: 1.4 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scaleY: [1.4, 0.82, 1.06, 1],
                  }}
                  transition={{
                    duration: 0.55,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  onClick={handleExtinguishCandle}
                  className="cursor-pointer"
                >
                  {/* Bấc nến */}
                  <line x1="160" y1="102" x2="160" y2="94" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />

                  {/* Thân nến mảnh màu trắng có sọc hồng (chuẩn như ảnh) */}
                  <rect
                    x="157"
                    y="102"
                    width="6"
                    height="28"
                    rx="3"
                    fill="#ffffff"
                    stroke="#f472b6"
                    strokeWidth="0.8"
                    filter="drop-shadow(0 1px 3px rgba(255, 150, 170, 0.4))"
                  />
                  {/* Sọc trang trí nến */}
                  <line x1="157.5" y1="110" x2="162.5" y2="114" stroke="#f06292" strokeWidth="2" strokeLinecap="round" />
                  <line x1="157.5" y1="120" x2="162.5" y2="124" stroke="#f06292" strokeWidth="2" strokeLinecap="round" />

                  {/* ========================================================= */}
                  {/* BƯỚC 4: NGỌN NẾN LUNG LINH & VẦNG HÀO QUANG TOẢ SÁNG ẤM ÁP */}
                  {/* ========================================================= */}
                  {cakeStep >= 4 && !isCandleBlown && (
                    <g>
                      {/* 🌟 1. VẦNG HÀO QUANG TO TRÒN MỜ ẢO LUNG LINH */}
                      <motion.circle
                        cx="160"
                        cy="76"
                        r="44"
                        fill="url(#cakeFlameAura)"
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
                        style={{ originX: '160px', originY: '76px' }}
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
                        style={{ originX: '160px', originY: '94px' }}
                      >
                        {/* Ngọn lửa vàng ngoài */}
                        <path
                          d="M 160 56 C 166 66 170 73 164 81 C 158 87 150 83 153 76 C 156 69 152 64 160 56 Z"
                          fill="#ffbe0b"
                          filter="drop-shadow(0 0 5px #ffb703)"
                        />

                        {/* Lõi lửa trắng sáng bên trong */}
                        <path
                          d="M 160 64 C 163 70 165 74 162 78 C 159 81 156 79 157 75 C 159 71 157 68 160 64 Z"
                          fill="#ffffff"
                        />

                        {/* Đốm lửa xanh lam chân thực */}
                        <ellipse cx="160" cy="89" rx="2.2" ry="1.2" fill="#3a86ff" opacity="0.8" />
                      </motion.g>

                      {/* 🌟 3. CÁC ĐỐM SAO LẤP LÁNH BAY LƯỢN QUANH NẾN */}
                      <motion.g
                        transform="translate(182, 58)"
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
                        transform="translate(138, 62)"
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
                      d="M 160 88 Q 152 72 162 56 T 156 36"
                      fill="none"
                      stroke="#a8a29e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: [0, 1, 1], opacity: [0, 0.75, 0], y: -20 }}
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
