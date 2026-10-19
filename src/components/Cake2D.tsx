'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

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
  // Key hiệu ứng để xem lại mở băng rôn bất kỳ lúc nào
  const [bannerKey, setBannerKey] = useState<number>(0);

  const handleReplayBanner = () => {
    setBannerKey((k) => k + 1);
    confetti({
      particleCount: 65,
      angle: 60,
      spread: 60,
      origin: { x: 0.05, y: 0.85 },
      colors: ["#FFB7C5", "#FF69B4", "#FFD700", "#FFF0F5", "#FF8DA1"],
      startVelocity: 45,
    });
    confetti({
      particleCount: 65,
      angle: 120,
      spread: 60,
      origin: { x: 0.95, y: 0.85 },
      colors: ["#FFB7C5", "#FF69B4", "#FFD700", "#FFF0F5", "#FF8DA1"],
      startVelocity: 45,
    });
  };

  // Tiến trình nhấn giữ (0 đến 100%)
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (!isCandleBlown) {
      onExtinguishCandle();
    }
  };

  // 1. Tự động tăng tiến trình khi có hơi thổi vào micro
  useEffect(() => {
    if (isCandleBlown) return;

    if (blowStrength > 0.15) {
      const frameId = requestAnimationFrame(() => {
        setHoldProgress((prev) => Math.min(100, prev + blowStrength * 18));
      });
      return () => cancelAnimationFrame(frameId);
    } else if (!isPressing && holdProgress > 0) {
      const frameId = requestAnimationFrame(() => {
        setHoldProgress((prev) => Math.max(0, prev - 5));
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [blowStrength, isCandleBlown, isPressing, holdProgress]);

  // 2. Kích hoạt dập nến khi tiến trình đạt 100% trong effect riêng (tránh update parent lúc render)
  useEffect(() => {
    if (holdProgress >= 100 && !isCandleBlown) {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      onExtinguishCandle();
    }
  }, [holdProgress, isCandleBlown, onExtinguishCandle]);

  // 3. Bắt đầu nhấn giữ ngọn nến
  const handlePointerDown = () => {
    if (isCandleBlown) return;
    setIsPressing(true);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => Math.min(100, prev + 5)); // Cần giữ khoảng 1.2s
    }, 60);
  };

  // 4. Thả tay ra khi chưa đủ thời gian
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
            onClick={handleClick}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer active:scale-95 ${
              isPressing || blowStrength > 0.15
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/40 animate-pulse font-bold'
                : 'bg-black/60 backdrop-blur-md text-[#fde68a] border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:bg-black/80'
            }`}
            title="Bấm để thổi tắt nến ngay lập tức"
          >
            {isPressing || blowStrength > 0.15
              ? holdProgress > 60
                ? 'giữ nữa… sắp tắt rồi! 💨'
                : 'giữ tiếp… đang thổi nến… 💨'
              : '👆 Chạm vào nến để thổi (hoặc thổi vào mic 💨)'}
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
        
        {/* 1. BĂNG RÔN DÂY CỜ PASTEL (KÉO MỞ TỪ TÂM RA 2 BÊN RÕ NÉT 100%) */}
        <div className="relative w-[110%] sm:w-[116%] mb-2 sm:mb-3 z-10 select-none pointer-events-none">
          {/* Nơ vàng trung tâm mở tung khi khai màn */}
          <motion.div
            key={`bow-${bannerKey}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1.2, 0],
              opacity: [0, 1, 1, 0],
              rotate: [0, 0, -8, 12],
            }}
            transition={{ duration: 0.85, times: [0, 0.25, 0.55, 1], ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center"
          >
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-amber-300 text-stone-900 text-xs font-bold shadow-lg shadow-amber-300/60 border border-amber-200 flex items-center gap-1.5">
              <span>🎀</span>
              <span className="tracking-wide text-[11px] font-semibold text-rose-800">Happy Birthday</span>
            </div>
          </motion.div>

          {/* Dải cờ mở bung từ tâm sang 2 bên bằng scaleX (100% rõ nét, mượt mà trên mọi thiết bị) */}
          <motion.div
            key={`banner-${bannerKey}`}
            style={{ transformOrigin: '50% 20%' }}
            initial={{ scaleX: 0, opacity: 0.9 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: 1.4,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.25,
            }}
            className="relative w-full aspect-[850/171] overflow-visible"
          >
            <img
              src="/garland-bunting.webp"
              alt="Băng rôn trang trí"
              className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            />

            {/* ✨ DÂY ĐÈN FAIRY LIGHTS & ĐÈN LỒNG BỪNG SÁNG KHI THỔI TẮT NẾN */}
            {isCandleBlown && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {[
                  { x: 3, y: 22 },
                  { x: 10, y: 26 },
                  { x: 18, y: 36 },
                  { x: 26, y: 46 },
                  { x: 34, y: 54 },
                  { x: 42, y: 60 },
                  { x: 50, y: 62 },
                  { x: 58, y: 60 },
                  { x: 66, y: 54 },
                  { x: 74, y: 46 },
                  { x: 82, y: 36 },
                  { x: 90, y: 26 },
                  { x: 97, y: 20 },
                ].map((pt, idx) => (
                  <motion.div
                    key={`fairy-${idx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.4, 1],
                      opacity: [0, 1, 0.95],
                    }}
                    transition={{
                      duration: 0.35,
                      delay: 0.15 + idx * 0.06,
                      ease: 'easeOut',
                    }}
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#fef08a] shadow-[0_0_8px_3px_rgba(250,204,21,0.95),0_0_16px_5px_rgba(245,158,11,0.6)]" />
                  </motion.div>
                ))}

                {/* 2 quả cầu đèn lồng sáng ấm áp */}
                {[
                  { x: 13.5, y: 76 },
                  { x: 81.5, y: 76 },
                ].map((lt, idx) => (
                  <motion.div
                    key={`lantern-${idx}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{
                      scale: [0.6, 1.1, 1],
                      opacity: [0, 0.9, 0.8],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.3 + idx * 0.25,
                      ease: 'easeOut',
                    }}
                    style={{ left: `${lt.x}%`, top: `${lt.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[radial-gradient(circle,_rgba(254,240,138,0.75)_0%,_rgba(245,158,11,0.35)_45%,_transparent_75%)]"
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* 🌟 2 Điểm sao sáng lướt mở từ tâm sang 2 bên */}
          <motion.div
            key={`star-l-${bannerKey}`}
            initial={{ left: '50%', opacity: 0 }}
            animate={{
              left: ['50%', '50%', '0%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.4,
              times: [0, 0.18, 1],
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center"
          >
            <div className="w-4 h-4 rounded-full bg-amber-200 shadow-[0_0_16px_6px_rgba(251,191,36,0.95)]" />
          </motion.div>

          <motion.div
            key={`star-r-${bannerKey}`}
            initial={{ left: '50%', opacity: 0 }}
            animate={{
              left: ['50%', '50%', '100%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.4,
              times: [0, 0.18, 1],
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center"
          >
            <div className="w-4 h-4 rounded-full bg-amber-200 shadow-[0_0_16px_6px_rgba(251,191,36,0.95)]" />
          </motion.div>
        </div>

        {/* 2. KHUNG CHỨA BÁNH VÀ NẾN (NÂNG BỒNG BỀNH TỪ DƯỚI LÊN KHI VÀO TIẾT MỤC) */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
          className="relative w-full aspect-[458/557] max-w-[280px] sm:max-w-[310px] flex items-center justify-center"
        >
          {/* Ảnh bánh kem màu nước 2 tầng với chân đế gỗ uốn lượn tinh xảo (ĐẾ TRÒN TỰ NHIÊN, KHÔNG CẮT NGANG) */}
          <img
            src="/cake-lovegift.webp"
            alt="Bánh kem sinh nhật"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_16px_35px_rgba(0,0,0,0.6)]"
          />

          {/* =============================================================== */}
          {/* 3. CÂY NẾN THANH MẢNH & NGỌN LỬA TINH TẾ CẮM VÀNG MẶT KEM TẦNG TRÊN */}
          {/* =============================================================== */}
          <div
            className="absolute z-40 flex flex-col items-center cursor-pointer select-none"
            style={{
              top: '4.5%',
              left: '50%',
              transform: 'translate(-50%, -100%)',
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleClick}
          >
            {/* Vùng cảm ứng nhấn mở rộng cho ngón tay */}
            <div className="absolute -inset-10 z-40 rounded-full cursor-pointer" />

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
            <div className="w-[1.5px] h-[5px] bg-[#27272a] rounded-t-xs -mb-[1px]" />

            {/* D. THÂN NẾN THON GỌN, VÂN XOẮN PASTEL HÀN QUỐC (SLENDER SPIRAL CANDLE) */}
            <div
              className="w-[6px] sm:w-[7px] h-[36px] sm:h-[40px] rounded-t-[2px] rounded-b-[2px] shadow-sm relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, #fffdf8 0%, #fff1f2 40%, #ffedd5 70%, #fce7f3 100%)',
                boxShadow:
                  '0 2px 5px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.9)',
              }}
            >
              {/* Vân sọc xoắn ánh hồng pastel tinh tế */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background:
                    'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(244,114,182,0.6) 3px, rgba(244,114,182,0.6) 6px)',
                }}
              />
            </div>

            {/* E. CHÂN NẾN CẮM VÀO KEM (ĐẢM BẢO KHÔNG BỊ TRÔI LƠ LỬNG) */}
            <div className="w-[11px] h-[3.5px] rounded-full bg-white/90 shadow-xs -mt-[1.5px] border border-pink-100/80 pointer-events-none" />
          </div>
        </motion.div>

        {/* 🔄 NÚT XEM LẠI MỞ BĂNG RÔN & PHÁO HOA (GIÚP TEST TRỰC QUAN MỌI LÚC) */}
        <div className="mt-4 flex justify-center z-30">
          <button
            type="button"
            onClick={handleReplayBanner}
            className="px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white text-rose-500 hover:text-rose-600 text-xs font-semibold border border-pink-200/80 shadow-xs backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            title="Bấm để phát lại hoạt ảnh mở dải cờ từ tâm và bắn pháo hoa"
          >
            <span>🔄</span>
            <span>Xem lại mở băng rôn & pháo hoa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
