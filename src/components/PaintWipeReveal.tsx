'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, ArrowRight, Sparkles } from 'lucide-react';
import { soundManager } from '@/utils/sound';

interface Props {
  onNext: () => void;
  onBackToCake?: () => void;
}

// 9 dải sơn đổ chéo từ góc trên-trái xuống dưới-phải (gối đè lên nhau kín 100% màn hình)
const PAINT_STREAMS = [
  { color: '#fce7f3', shadow: 'rgba(244,114,182,0.45)', delay: 0.04, widthRatio: 0.19, offsetRatio: -0.28 },
  { color: '#fbcfe8', shadow: 'rgba(251,113,133,0.45)', delay: 0.12, widthRatio: 0.20, offsetRatio: -0.12 },
  { color: '#f472b6', shadow: 'rgba(225,29,72,0.45)', delay: 0.20, widthRatio: 0.20, offsetRatio: 0.04 },
  { color: '#fb7185', shadow: 'rgba(190,18,60,0.45)', delay: 0.28, widthRatio: 0.22, offsetRatio: 0.20 },
  { color: '#fecdd3', shadow: 'rgba(244,63,94,0.45)', delay: 0.36, widthRatio: 0.21, offsetRatio: 0.38 },
  { color: '#ec4899', shadow: 'rgba(157,23,77,0.45)', delay: 0.44, widthRatio: 0.22, offsetRatio: 0.54 },
  { color: '#db2777', shadow: 'rgba(131,24,67,0.45)', delay: 0.52, widthRatio: 0.23, offsetRatio: 0.70 },
  { color: '#be185d', shadow: 'rgba(80,7,36,0.45)', delay: 0.60, widthRatio: 0.25, offsetRatio: 0.86 },
  { color: '#9d174d', shadow: 'rgba(50,5,22,0.45)', delay: 0.68, widthRatio: 0.32, offsetRatio: 1.02 },
];

export default function PaintWipeReveal({ onNext, onBackToCake }: Props) {
  const [isPouring, setIsPouring] = useState<boolean>(true);
  const [hasStartedWiping, setHasStartedWiping] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const buttonElRef = useRef<HTMLButtonElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // ===================================================================
  // 1. VẼ HIỆU ỨNG ĐỔ SƠN TRỰC TIẾP LÊN CANVAS
  // KHI ĐỔ XONG GIỮ NGUYÊN BẢN SƠN ĐÓ ĐỂ LAU, KHÔNG ĐỔI SANG LỚP NÀO KHÁC
  // ===================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    soundManager.playPaintSplashSound();

    const startTime = performance.now();
    const angle = (-36 * Math.PI) / 180;
    const diagDist = Math.sqrt(width * width + height * height) * 1.55;

    const renderPourFrame = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      let allCompleted = true;

      PAINT_STREAMS.forEach((st) => {
        const streamElapsed = elapsed - st.delay;
        const duration = 0.82;
        const p = streamElapsed <= 0 ? 0 : Math.min(1, streamElapsed / duration);
        if (p < 1) allCompleted = false;

        // Easing mượt mà
        const ease = 1 - Math.pow(1 - p, 3);
        const currentDist = ease * diagDist;

        if (currentDist <= 0) return;

        ctx.save();
        ctx.translate(width * 0.5, height * 0.5);
        ctx.rotate(angle);

        const bandWidth = width * st.widthRatio + 40;
        const bandX = (st.offsetRatio - 0.5) * width * 1.4;
        const startY = -diagDist * 0.72;
        const bandHeight = currentDist;

        // Bóng đổ dưới mép dải sơn
        ctx.fillStyle = st.shadow;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bandX - 4, startY, bandWidth + 8, bandHeight + 10, [0, 0, 36, 36]);
        } else {
          ctx.rect(bandX - 4, startY, bandWidth + 8, bandHeight + 10);
        }
        ctx.fill();

        // Thân dải sơn hồng bóng bẩy
        ctx.fillStyle = st.color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bandX, startY, bandWidth, bandHeight, [0, 0, 32, 32]);
        } else {
          ctx.rect(bandX, startY, bandWidth, bandHeight);
        }
        ctx.fill();

        // Vệt sáng bóng dầu ướt dọc theo dòng sơn
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.fillRect(bandX + 6, startY, 7, Math.max(0, bandHeight - 16));

        // Đầu giọt sơn bo tròn chảy nhô ra
        ctx.beginPath();
        ctx.arc(bandX + bandWidth * 0.5, startY + bandHeight, 20, 0, Math.PI);
        ctx.fillStyle = st.color;
        ctx.fill();

        ctx.restore();
      });

      if (!allCompleted) {
        animFrameIdRef.current = requestAnimationFrame(renderPourFrame);
      } else {
        // ĐỔ SƠN HOÀN TẤT -> GIỮ NGUYÊN NÉT VẼ NÀY TRÊN CANVAS ĐỂ NGƯỜI DÙNG LAU
        setIsPouring(false);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderPourFrame);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // ===================================================================
  // 2. XÓA / LAU BỚT SƠN BẰNG CỌ MỀM
  // CHỈ LỘ PHẦN CON TRỎ LAU QUA, KHÔNG TỰ ĐỘNG XÓA HẾT
  // ===================================================================
  const erasePaint = useCallback((x: number, y: number, prevX?: number, prevY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const brushRadius = Math.max(45, Math.min(width, height) * 0.08);

    ctx.save();
    // Destination-out: Khoét trong suốt lớp sơn đúng tại vị trí con trỏ lau qua
    ctx.globalCompositeOperation = 'destination-out';

    // Nối giữa 2 điểm liên tiếp để đường lau liền mạch
    if (prevX !== undefined && prevY !== undefined) {
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.lineWidth = brushRadius * 1.8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      ctx.stroke();
    }

    // Vết xóa radial mờ mép tạo cảm giác lau sơn mềm mại
    const grad = ctx.createRadialGradient(x, y, brushRadius * 0.2, x, y, brushRadius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    soundManager.playWipeSound();
  }, []);

  // Kiểm tra xem vị trí bấm có trúng nút bấm đã lau lộ diện hay không
  const checkButtonClick = useCallback((x: number, y: number) => {
    if (!buttonElRef.current) return;
    const b = buttonElRef.current.getBoundingClientRect();
    if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Đọc pixel tại vị trí bấm: Nếu alpha < 140 nghĩa là sơn ở đây đã được lau sạch
      const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      if (pixel[3] < 140) {
        soundManager.playCelebrationCheer();
        confetti({
          particleCount: 85,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#fda4af', '#f43f5e', '#fed7aa', '#fef08a'],
        });
        onNext();
      }
    }
  }, [onNext]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPouring) return;
    isPointerDownRef.current = true;
    setHasStartedWiping(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointRef.current = { x, y };
    setCursorPos({ x: e.clientX, y: e.clientY });
    erasePaint(x, y);

    // Kiểm tra bấm nút
    checkButtonClick(e.clientX, e.clientY);
  }, [erasePaint, isPouring, checkButtonClick]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!isPointerDownRef.current || isPouring) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prev = lastPointRef.current || { x, y };

    erasePaint(x, y, prev.x, prev.y);
    lastPointRef.current = { x, y };
  }, [erasePaint, isPouring]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    lastPointRef.current = null;
    checkButtonClick(e.clientX, e.clientY);
  }, [checkButtonClick]);

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none bg-stone-950 flex items-center justify-center">
      {/* =================================================================== */}
      {/* 1. LỚP BÊN DƯỚI: NÚT CHUYỂN TRANG & KHÔNG GIAN BÍ MẬT LỘ RA KHI LAU */}
      {/* =================================================================== */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#fff0f4] via-[#fde2e8] to-[#ffd1dc] overflow-hidden select-none">
        {/* Ánh sao lung linh */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(22)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              animate={{
                scale: [0.8, 1.3, 0.8],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 2.2 + (i % 4) * 0.5,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              style={{
                top: `${(i * 17) % 95}%`,
                left: `${(i * 27) % 95}%`,
              }}
              className="absolute text-pink-400 text-lg"
            >
              ✦
            </motion.div>
          ))}
        </div>

        {/* Nội dung bên dưới lộ dần theo từng nét lau */}
        <div className="relative z-20 flex flex-col items-center max-w-sm sm:max-w-md">
          <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-rose-600 text-xs font-bold shadow-md shadow-pink-200/50 flex items-center gap-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>Điều bí mật đã lộ diện 🌸</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 tracking-tight leading-snug drop-shadow-xs mb-2">
            Em đã tìm thấy điều ước bí mật! 💖
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed max-w-xs mb-8">
            Hãy bấm vào nút bên dưới để mở những món quà bất ngờ tiếp theo nhé!
          </p>

          {/* 🎁 NÚT CHUYỂN TRANG: LỘ RA DƯỚI NÉT LAU */}
          <button
            ref={buttonElRef}
            type="button"
            onClick={onNext}
            className="group relative px-8 py-4 sm:py-4.5 sm:px-10 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:brightness-105 text-white font-extrabold text-base sm:text-lg shadow-[0_12px_40px_rgba(244,63,94,0.5)] border-2 border-white/80 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            <Gift className="w-6 h-6 text-amber-200 animate-bounce" />
            <span>Mở 3 Chiếc Hộp Bí Mật</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Các nút bấm điều hướng góc dưới */}
        <div className="absolute bottom-6 z-20 flex items-center gap-3">
          {onBackToCake && (
            <button
              type="button"
              onClick={onBackToCake}
              className="px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-stone-600 text-xs font-semibold shadow-xs border border-pink-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <span>🎂</span>
              <span>Xem lại bánh kem</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-rose-600 text-xs font-semibold shadow-xs border border-pink-200 flex items-center gap-1 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>Bỏ qua lau sơn</span>
            <span>⏩</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. CANVAS CHỨA ĐÚNG NÉT SƠN ĐÃ ĐỔ XONG (GIỮ NGUYÊN ĐỂ LAU)           */}
      {/* =================================================================== */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="fixed inset-0 z-30 touch-none cursor-grab active:cursor-grabbing"
      />

      {/* =================================================================== */}
      {/* 3. LỜI GỢI Ý & HIỆU ỨNG CON TRỎ LAU SƠN ✨                          */}
      {/* =================================================================== */}
      {!isPouring && (
        <>
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: hasStartedWiping ? 0.4 : 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="px-5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-stone-700 text-xs sm:text-sm font-bold shadow-lg shadow-pink-300/40 flex items-center gap-2"
            >
              <span className="text-base">🧽</span>
              <span>Dùng con trỏ hoặc ngón tay lau bớt sơn để tìm nút bấm ✨</span>
            </motion.div>
          </div>

          {/* Vệt sáng lấp lánh đi theo con trỏ khi lau */}
          {cursorPos && (
            <div
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
              }}
              className="fixed pointer-events-none z-45 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-xs shadow-[0_0_20px_rgba(255,255,255,0.7)] animate-ping opacity-60" />
              <span className="absolute text-xl drop-shadow-md">✨</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
