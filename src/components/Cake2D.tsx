'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mic } from 'lucide-react';

interface Props {
  isCandleBlown: boolean;
  canClickToExtinguish?: boolean;
  onExtinguishCandle: () => void;
  blowStrength?: number; // 0 đến 1 từ micro
  isMicListening?: boolean;
  onRequestMic?: () => void;
}

export default function Cake2D({
  isCandleBlown,
  onExtinguishCandle,
  blowStrength = 0,
  isMicListening = false,
  onRequestMic,
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

  // 1. Tự động tăng tiến trình khi có hơi thổi vào micro (hoặc giảm dần khi ngừng thổi)
  useEffect(() => {
    if (isCandleBlown) return;

    const frameId = requestAnimationFrame(() => {
      if (blowStrength > 0.12) {
        setHoldProgress((prev) => Math.min(100, prev + blowStrength * 20));
      } else if (!isPressing) {
        setHoldProgress((prev) => (prev > 0 ? Math.max(0, prev - 4) : 0));
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [blowStrength, isCandleBlown, isPressing]);

  // 2. Kích hoạt dập nến khi tiến trình đạt 100%
  useEffect(() => {
    if (holdProgress >= 100 && !isCandleBlown) {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      const timer = setTimeout(() => {
        setIsPressing(false);
        onExtinguishCandle();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [holdProgress, isCandleBlown, onExtinguishCandle]);

  // 3. Bắt đầu nhấn giữ ngọn nến
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isCandleBlown) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsPressing(true);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const next = prev + 5; // Cần giữ khoảng 1.1s - 1.2s là thổi tắt
        if (next >= 100) {
          if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
          }
          setIsPressing(false);
          return 100;
        }
        return next;
      });
    }, 55);
  };

  // 4. Thả tay ra khi chưa đủ thời gian
  const handlePointerUp = (e?: React.PointerEvent) => {
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
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
            key={isPressing || blowStrength > 0.12 ? 'holding' : isMicListening ? 'mic-on' : 'idle'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              if (!isCandleBlown) {
                if (!isMicListening && onRequestMic) {
                  onRequestMic();
                } else {
                  setHoldProgress(100);
                }
              }
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer select-none active:scale-95 ${
              isPressing || blowStrength > 0.12
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/40 animate-pulse font-bold'
                : isMicListening
                ? 'bg-emerald-500/90 text-white border border-emerald-300/40 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'bg-black/60 backdrop-blur-md text-[#fde68a] border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:bg-black/80'
            }`}
            title="Nhấn giữ ngọn nến hoặc thổi vào mic để thổi tắt"
          >
            {isPressing || blowStrength > 0.12
              ? holdProgress > 60
                ? 'giữ nữa… sắp tắt rồi! 💨'
                : 'giữ tiếp… đang thổi nến… 💨'
              : isMicListening
              ? '🎙️ Đang nghe micro… Hãy thổi phù vào mic nào! 💨'
              : '👆 Nhấn giữ nến để thổi (hoặc bấm để bật Micro 🎤)'}
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
        {/* 1. BĂNG RÔN DÂY CỜ PASTEL (HẠ THẤP ÔM LẤY ĐỈNH NẾN NHƯ MẪU TIKTOK) */}
        <div className="relative w-[110%] sm:w-[116%] -mb-4 sm:-mb-6 z-10 select-none pointer-events-none">
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

          {/* Dải cờ mở bung từ tâm sang 2 bên bằng scaleX */}
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

        {/* 2. KHUNG CHỨA BÁNH VÀ NẾN */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
          className="relative w-full aspect-[458/557] max-w-[280px] sm:max-w-[310px] flex items-center justify-center z-20"
        >
          {/* Ảnh bánh kem màu nước 2 tầng với chân đế gỗ */}
          <img
            src="/cake-lovegift.webp"
            alt="Bánh kem sinh nhật"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_16px_35px_rgba(0,0,0,0.6)]"
          />

          {/* =============================================================== */}
          {/* 3. CÂY NẾN & NGỌN LỬA CẮM CHUẨN XÁC VÀO MẶT KEM BÁNH TẦNG TRÊN   */}
          {/* =============================================================== */}
          <div
            className="absolute z-40 flex flex-col items-center cursor-pointer select-none touch-none"
            style={{
              top: '6.5%', // Đặt đáy chân nến cắm chính xác vào mặt kem oval tầng trên
              left: '50%',
              transform: 'translate(-50%, -100%)',
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Vùng cảm ứng nhấn mở rộng cho ngón tay (không gây lệch vị trí nến) */}
            <div className="absolute -inset-x-6 -inset-y-4 z-10 rounded-full pointer-events-none" />

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
                        width: '130px',
                        height: '130px',
                        background:
                          'radial-gradient(circle, rgba(255,214,130,0.65) 0%, rgba(255,160,60,0.2) 40%, rgba(255,140,40,0) 70%)',
                      }}
                    />

                    {/* Ngọn lửa hình giọt nước mềm mại tinh tế */}
                    <div
                      style={{
                        width: '14px',
                        height: '26px',
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

            {/* C. TIM NẾN MỎNG MẢNH MAI (WICK) */}
            <div className="w-[1.5px] h-[5px] bg-[#27272a] rounded-t-xs -mb-[1px] relative">
              {!isCandleBlown && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full bg-[#f97316] shadow-[0_0_3px_#ef4444]" />
              )}
            </div>

            {/* D. THÂN NẾN TRẮNG TINH, THON DÀI THANH THOÁT (PURE WHITE TALL SLENDER CANDLE) */}
            <div
              className="w-[7px] sm:w-[8px] h-[52px] sm:h-[58px] rounded-t-[2.5px] rounded-b-[1.5px] relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(to right, #ffffff 0%, #ffffff 42%, #f8fafc 78%, #f1f5f9 100%)',
                boxShadow:
                  'inset -1px 0 1.5px rgba(0, 0, 0, 0.08), inset 1px 0 1px rgba(255, 255, 255, 0.95), 0 2px 5px rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Vệt sáng trắng tinh tế phản quang dọc thân nến */}
              <div className="absolute top-0 bottom-0 left-[1px] w-[1px] bg-white/95 blur-[0.2px] pointer-events-none" />
            </div>

            {/* E. CHÂN NẾN CẮM CHẶT VÀO LỚP KEM BÁNH VỚI VÒNG SÁP TRẮNG & BÓNG ĐỔ */}
            <div className="relative -mt-[2px] flex flex-col items-center pointer-events-none">
              {/* Vòng kem sáp trắng đùn nhẹ quanh gốc nến */}
              <div
                className="w-[13px] sm:w-[14px] h-[3.5px] rounded-full border border-slate-100 shadow-xs"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 40%, #ffffff 0%, #fdfdfd 60%, #f1f5f9 100%)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
                }}
              />
              {/* Vệt bóng đổ êm của nến lên mặt bánh kem */}
              <div className="w-[15px] sm:w-[17px] h-[2.5px] rounded-full bg-[#52525b]/20 blur-[0.8px] -mt-[1px]" />
            </div>
          </div>
        </motion.div>

        {/* 🎙️ NÚT BẬT / TRẠNG THÁI MICRO ĐỂ THỔI NẾN */}
        {!isCandleBlown && (
          <div className="mt-3 flex flex-col items-center gap-1.5 z-30">
            {!isMicListening ? (
              <button
                type="button"
                onClick={onRequestMic}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all border border-pink-300/40"
                title="Bấm để trình duyệt cấp quyền truy cập Micro"
              >
                <Mic className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>Bật Micro để thổi nến 🎙️</span>
              </button>
            ) : (
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-md shadow-emerald-500/30 flex items-center gap-2 border border-emerald-300/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Micro đang lắng nghe… Hãy thổi phù vào mic nào! 💨</span>
              </div>
            )}
          </div>
        )}

        {/* 🔄 NÚT XEM LẠI MỞ BĂNG RÔN & PHÁO HOA (GIÚP TEST TRỰC QUAN MỌI LÚC) */}
        <div className="mt-3 flex justify-center z-30">
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
