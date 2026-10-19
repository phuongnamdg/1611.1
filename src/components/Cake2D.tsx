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
      setHoldProgress((prev) => Math.max(0, prev - 5));
    }
  }, [blowStrength, isCandleBlown, isPressing, onExtinguishCandle]);

  // Bắt đầu nhấn giữ ngọn nến
  const handlePointerDown = () => {
    if (isCandleBlown) return;
    setIsPressing(true);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const next = prev + 5; // Cần giữ khoảng 1.2s
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
    if (!isCandleBlown) {
      setHoldProgress(0);
    }
  };

  // Tính toán độ co lại và rung lắc của ngọn lửa theo tiến trình
  const flameScale = isCandleBlown
    ? 0
    : Math.max(0.28, 1 - (holdProgress / 100) * 0.7);
  const flameWobble = holdProgress > 0 ? (holdProgress % 2 === 0 ? 8 : -8) : 0;

  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[420px] mx-auto flex flex-col items-center justify-center select-none py-2">
      
      {/* =================================================================== */}
      {/* DÒNG HƯỚNG DẪN TƯƠNG TÁC (TỰ ĐỘNG CHUYỂN TRẠNG THÁI)                */}
      {/* =================================================================== */}
      <div className="min-h-[38px] flex items-center justify-center mb-1 text-center z-30">
        {!isCandleBlown ? (
          <motion.div
            key={isPressing || blowStrength > 0.15 ? 'holding' : 'idle'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              isPressing || blowStrength > 0.15
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/40 animate-pulse font-bold'
                : 'bg-black/60 backdrop-blur-md text-[#fde68a] border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
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
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30 tracking-wide"
          >
            ✨ Ngọn nến đã tắt, chúc điều ước của em thành hiện thực! ✨
          </motion.div>
        )}
      </div>

      {/* =================================================================== */}
      {/* KHUNG BĂNG RÔN & BÁNH KEM CHUẨN MẪU TIKTOK                          */}
      {/* =================================================================== */}
      <div className="relative w-full flex flex-col items-center justify-center">
        
        {/* 1. BĂNG RÔN DÂY CỜ PASTEL (GARLAND BUNTING) VẮNG NGANG PHÍA TRÊN */}
        <div className="w-[110%] sm:w-[116%] -mb-10 sm:-mb-12 z-10 pointer-events-none select-none">
          <img
            src="/garland-bunting.webp"
            alt="Băng rôn trang trí"
            className="w-full h-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* 2. KHUNG CHỨA BÁNH VÀ NẾN */}
        <div className="relative w-full aspect-[494/686] max-w-[280px] sm:max-w-[310px] flex items-center justify-center">
          
          {/* Ảnh bánh kem màu nước 2 tầng (Lật ngang để hoa khớp y hệt ảnh mẫu TikTok) */}
          <img
            src="/cake-lovegift.webp"
            alt="Bánh kem sinh nhật"
            className="w-full h-full object-contain pointer-events-none -scale-x-100 drop-shadow-[0_16px_35px_rgba(0,0,0,0.6)]"
          />

          {/* 3. ĐẾ LÓT CHÂN BÁNH BO TRÒN TỰ NHIÊN (KHẮC PHỤC ĐẾ BÁNH BỊ CẮT PHẲNG) */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-3.5 rounded-full bg-[#c4a683] shadow-inner opacity-90 pointer-events-none -z-10" />
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-36 h-4 rounded-full bg-black/60 blur-[3px] pointer-events-none -z-20" />

          {/* =============================================================== */}
          {/* 4. CÂY NẾN THANH MẢNH & NGỌN LỬA TINH TẾ (KHÔNG CÒN BỊ THÔ)      */}
          {/* =============================================================== */}
          <div
            className="absolute z-20 flex flex-col items-center cursor-pointer"
            style={{
              top: '-3.5%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Vùng cảm ứng nhấn mở rộng cho ngón tay */}
            <div className="absolute -inset-6 z-30 rounded-full cursor-pointer" />

            {/* A. NGỌN LỬA VÀ QUẦNG HÀO QUANG ÁNH SÁNG */}
            <div className="relative flex items-center justify-center mb-0.5">
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
                      y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
                      scale: { duration: 0.1 },
                    }}
                    exit={{
                      scale: 0,
                      opacity: 0,
                      transition: { duration: 0.35, ease: 'easeOut' },
                    }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Quầng sáng vàng ấm lan tỏa soi sáng băng rôn và bánh */}
                    <div
                      className="absolute pointer-events-none -z-10 rounded-full"
                      style={{
                        width: '120px',
                        height: '120px',
                        background:
                          'radial-gradient(circle, rgba(255,206,120,0.7) 0%, rgba(255,160,60,0.25) 45%, rgba(255,140,40,0) 75%)',
                      }}
                    />

                    {/* Ngọn lửa hình giọt nước mềm mại tinh tế */}
                    <div
                      style={{
                        width: '15px',
                        height: '27px',
                        borderRadius: '50% 50% 50% 50% / 62% 62% 40% 40%',
                        background:
                          'radial-gradient(60% 55% at 50% 68%, #ffffff 0%, #fff3c4 22%, #ffb347 52%, #ff7a1a 80%, rgba(255,90,10,0.2) 100%)',
                        boxShadow:
                          '0 0 14px 4px rgba(255,160,60,0.85), 0 0 32px 10px rgba(255,130,40,0.4)',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* B. LÀN KHÓI TRẮNG UỐN LƯỢN KHI NẾN TẮT */}
              <AnimatePresence>
                {isCandleBlown && (
                  <motion.svg
                    key="smoke"
                    width="40"
                    height="70"
                    viewBox="0 0 40 70"
                    fill="none"
                    className="absolute bottom-5 pointer-events-none z-10"
                  >
                    <motion.path
                      d="M 20 65 C 14 50, 26 35, 18 20 C 12 10, 24 0, 19 -10"
                      stroke="#f1f5f9"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0.9, y: 10 }}
                      animate={{
                        pathLength: [0, 1],
                        opacity: [0.9, 0.35, 0],
                        y: -30,
                        x: [0, 4, -3, 2],
                      }}
                      transition={{ duration: 2.2, ease: 'easeOut' }}
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>

            {/* C. TIM NẾN MẢNH MAI (WICK) */}
            <div className="w-[1.5px] h-[6px] bg-[#27272a] rounded-t-xs -mb-[1px]" />

            {/* D. THÂN NẾN THON GỌN, VUỐT NHẸ ĐẸP MẮT (TAPERED CANDLE) */}
            <div
              className="w-[7px] sm:w-[8px] h-[40px] sm:h-[44px] rounded-t-[3px] rounded-b-[4px] shadow-sm"
              style={{
                background:
                  'linear-gradient(to right, #fbf7ee 0%, #ffffff 45%, #eadeca 100%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
