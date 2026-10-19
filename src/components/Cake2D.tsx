'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isCandleBlown: boolean;
  canClickToExtinguish?: boolean;
  onExtinguishCandle: () => void;
  blowStrength?: number; // 0 đến 1 từ micro
}

export default function Cake2D({
  isCandleBlown,
  onExtinguishCandle,
  blowStrength = 0,
}: Props) {
  // Tiến trình nhấn giữ (0 đến 100%)
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Xử lý khi thổi vào mic: tăng tiến trình tự động
  useEffect(() => {
    if (isCandleBlown) return;

    if (blowStrength > 0.15) {
      setHoldProgress((prev) => {
        const next = prev + blowStrength * 18;
        if (next >= 100) {
          onExtinguishCandle();
          return 100;
        }
        return next;
      });
    } else if (!isPressing) {
      // Giảm dần nếu ngừng thổi
      setHoldProgress((prev) => Math.max(0, prev - 4));
    }
  }, [blowStrength, isCandleBlown, isPressing, onExtinguishCandle]);

  // Bắt đầu nhấn giữ ngọn nến
  const handlePointerDown = () => {
    if (isCandleBlown) return;
    setIsPressing(true);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const next = prev + 5; // Cần giữ khoảng 1.2s - 1.5s
        if (next >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          setIsPressing(false);
          onExtinguishCandle();
          return 100;
        }
        return next;
      });
    }, 60);
  };

  // Thả tay ra khi chưa đủ thời gian
  const handlePointerUp = () => {
    setIsPressing(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    // Trở về 0 mượt mà nếu chưa tắt
    if (!isCandleBlown) {
      setHoldProgress(0);
    }
  };

  // Tính toán độ co lại và rung lắc của ngọn lửa theo tiến trình
  const flameScale = isCandleBlown
    ? 0
    : Math.max(0.3, 1 - (holdProgress / 100) * 0.65);
  const flameWobble = holdProgress > 0 ? (holdProgress % 2 === 0 ? 8 : -8) : 0;

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto flex flex-col items-center justify-center select-none pt-12 pb-4">
      
      {/* =================================================================== */}
      {/* DÒNG HƯỚNG DẪN TƯƠNG TÁC THEO PHONG CÁCH TIKTOK LOVEGIFT            */}
      {/* =================================================================== */}
      <div className="min-h-[38px] flex items-center justify-center mb-3 text-center">
        {!isCandleBlown ? (
          <motion.div
            key={isPressing || blowStrength > 0.15 ? 'holding' : 'idle'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              isPressing || blowStrength > 0.15
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-white/90 backdrop-blur-md text-stone-700 shadow-md border border-pink-100'
            }`}
          >
            {isPressing || blowStrength > 0.15
              ? holdProgress > 60
                ? 'giữ nữa… sắp tắt rồi! 💨'
                : 'giữ tiếp… đang thổi nến… 💨'
              : '👆 Nhấn & giữ ngọn nến để thổi (hoặc thổi vào mic)'}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 tracking-wide"
          >
            ✨ Ngọn nến đã tắt, điều ước đang bay lên trời! ✨
          </motion.div>
        )}
      </div>

      {/* =================================================================== */}
      {/* KHUNG BÁNH KEM 2 TẦNG MÀU NƯỚC (WATERCOLOR 2-TIER CAKE)              */}
      {/* =================================================================== */}
      <div className="relative w-full aspect-[494/686] max-w-[290px] sm:max-w-[330px] flex items-center justify-center">
        
        {/* Ảnh bánh kem màu nước nghệ thuật từ mẫu LoveGift */}
        <img
          src="/cake-lovegift.webp"
          alt="Bánh kem sinh nhật"
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_40px_rgba(244,114,182,0.25)]"
        />

        {/* ================================================================= */}
        {/* CÂY NẾN & NGỌN LỬA ĐƯỢC ĐẶT CHÍNH XÁC TRÊN ĐỈNH TẦNG 2            */}
        {/* ================================================================= */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer"
          style={{
            top: '-2%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Vùng cảm ứng nhấn mở rộng (Easy Hit Target) */}
          <div className="absolute -inset-6 z-30 rounded-full cursor-pointer" />

          {/* 1. NGỌN LỬA & HÀO QUANG */}
          <div className="relative flex items-center justify-center mb-1">
            <AnimatePresence>
              {!isCandleBlown && (
                <motion.div
                  key="flame"
                  style={{
                    transformOrigin: 'bottom center',
                  }}
                  animate={{
                    scale: flameScale,
                    rotate: flameWobble + (holdProgress > 0 ? 0 : 2),
                    y: [0, -1, 0.5, -0.5, 0],
                  }}
                  transition={{
                    rotate: { duration: 0.1, repeat: Infinity },
                    y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    scale: { duration: 0.1 },
                  }}
                  exit={{
                    scale: 0,
                    opacity: 0,
                    transition: { duration: 0.35, ease: 'easeOut' },
                  }}
                  className="relative flex items-center justify-center"
                >
                  {/* Quầng sáng vàng cam ấm áp (Radial glow halo) */}
                  <div
                    className="absolute pointer-events-none -z-10 rounded-full"
                    style={{
                      width: '110px',
                      height: '110px',
                      background:
                        'radial-gradient(circle, rgba(255,206,120,0.65) 0%, rgba(255,160,60,0.22) 42%, rgba(255,140,40,0) 72%)',
                    }}
                  />

                  {/* Ngọn lửa đa tầng chân thật (Phong cách LoveGift) */}
                  <div
                    style={{
                      width: '18px',
                      height: '32px',
                      borderRadius: '50% 50% 50% 50% / 62% 62% 40% 40%',
                      background:
                        'radial-gradient(60% 55% at 50% 68%, #ffffff 0%, #fff3c4 25%, #ffb347 55%, #ff7a1a 82%, rgba(255,90,10,0.2) 100%)',
                      boxShadow:
                        '0 0 16px 5px rgba(255,160,60,0.8), 0 0 35px 10px rgba(255,130,40,0.4)',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. LÀN KHÓI TRẮNG UỐN LƯỢN (XUẤT HIỆN KHI VỪA TẮT NẾN) */}
            <AnimatePresence>
              {isCandleBlown && (
                <motion.svg
                  key="smoke"
                  width="40"
                  height="70"
                  viewBox="0 0 40 70"
                  fill="none"
                  className="absolute bottom-6 pointer-events-none z-10"
                >
                  <motion.path
                    d="M 20 65 C 14 50, 26 35, 18 20 C 12 10, 24 0, 19 -10"
                    stroke="#e2e8f0"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.9, y: 10 }}
                    animate={{
                      pathLength: [0, 1],
                      opacity: [0.9, 0.4, 0],
                      y: -25,
                      x: [0, 4, -3, 2],
                    }}
                    transition={{ duration: 2.2, ease: 'easeOut' }}
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>

          {/* 3. TIM NẾN (WICK) */}
          <div className="w-[2px] h-[7px] bg-[#3f3f46] rounded-t-xs -mb-[1px]" />

          {/* 4. THÂN CÂY NẾN (CANDLE STICK) */}
          <div
            className="w-[10px] h-[52px] rounded-full shadow-md border border-amber-100/60"
            style={{
              background:
                'linear-gradient(to right, #fbf7ee 0%, #ffffff 45%, #ede6d8 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
