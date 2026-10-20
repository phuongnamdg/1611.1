'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, ArrowRight, Sparkles } from 'lucide-react';
import { soundManager } from '@/utils/sound';

interface Props {
  onNext: () => void;
  onBackToCake?: () => void;
}

// 8 dải sơn đổ chéo từ góc trên-trái xuống dưới-phải
const PAINT_STREAMS = [
  { id: 1, color: '#fce7f3', shadow: '#f472b6', delay: 0.04, widthPct: 24, leftPct: -25 },
  { id: 2, color: '#fbcfe8', shadow: '#fb7185', delay: 0.14, widthPct: 26, leftPct: -10 },
  { id: 3, color: '#f472b6', shadow: '#e11d48', delay: 0.24, widthPct: 25, leftPct: 8 },
  { id: 4, color: '#fb7185', shadow: '#be123c', delay: 0.34, widthPct: 28, leftPct: 24 },
  { id: 5, color: '#fecdd3', shadow: '#f43f5e', delay: 0.44, widthPct: 26, leftPct: 42 },
  { id: 6, color: '#ec4899', shadow: '#9d174d', delay: 0.54, widthPct: 27, leftPct: 60 },
  { id: 7, color: '#db2777', shadow: '#831843', delay: 0.64, widthPct: 28, leftPct: 78 },
  { id: 8, color: '#be185d', shadow: '#500724', delay: 0.74, widthPct: 35, leftPct: 94 },
];

export default function PaintWipeReveal({ onNext, onBackToCake }: Props) {
  // Giai đoạn: 'POURING' (sơn đang đổ chéo) -> 'WIPING' (người dùng lau sơn) -> 'REVEALED' (đã mở xong)
  const [phase, setPhase] = useState<'POURING' | 'WIPING' | 'REVEALED'>('POURING');
  const [wipedPercent, setWipedPercent] = useState<number>(0);
  const [hasStartedWiping, setHasStartedWiping] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const buttonBoxRef = useRef<DOMRect | null>(null);
  const buttonElRef = useRef<HTMLButtonElement | null>(null);
  const wipeGridRef = useRef<Uint8Array | null>(null);
  const gridDimsRef = useRef<{ cols: number; rows: number }>({ cols: 25, rows: 25 });

  // Cập nhật vị trí nút bấm bên dưới
  const updateButtonRect = useCallback(() => {
    if (buttonElRef.current) {
      buttonBoxRef.current = buttonElRef.current.getBoundingClientRect();
    }
  }, []);

  // Khởi tạo Canvas phủ sơn hồng
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vẽ nền sơn hồng bóng bẩy nhiều sắc thái
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(0.3, '#fb7185');
    grad.addColorStop(0.65, '#ec4899');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Vẽ các vệt cọ sơn đổ chéo đặc trưng
    ctx.save();
    for (let i = -width; i < width * 2; i += 65) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height * 0.9, height);
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.14)' : 'rgba(157, 23, 77, 0.16)';
      ctx.lineWidth = 36 + Math.random() * 28;
      ctx.stroke();
    }
    // Một vài vệt sơn bóng lượn sóng
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(
        width * (0.2 + i * 0.14),
        height * (0.3 + (i % 3) * 0.2),
        width * 0.15,
        height * 0.08,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.fill();
    }
    ctx.restore();

    // Khởi tạo lưới tính % đã lau sạch (25x25 ô)
    const { cols, rows } = gridDimsRef.current;
    wipeGridRef.current = new Uint8Array(cols * rows);
  }, []);

  // 1. KHI MOUNT: PHÁT ÂM THANH SƠN ĐỔ ÀO & CHUYỂN SANG CHẾ ĐỘ LAU SAU 1.4s
  useEffect(() => {
    soundManager.playPaintSplashSound();

    const timer = setTimeout(() => {
      setPhase('WIPING');
      initCanvas();
    }, 1350);

    return () => clearTimeout(timer);
  }, [initCanvas]);

  useEffect(() => {
    updateButtonRect();
    window.addEventListener('resize', updateButtonRect);
    return () => window.removeEventListener('resize', updateButtonRect);
  }, [updateButtonRect]);

  // Xóa sơn tại tọa độ (x, y) bằng cọ mềm
  const erasePaint = useCallback((x: number, y: number, prevX?: number, prevY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const brushRadius = Math.max(48, Math.min(width, height) * 0.085);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Vẽ đường nối giữa 2 điểm liên tiếp để khi kéo chuột nhanh không bị đứt đoạn
    if (prevX !== undefined && prevY !== undefined) {
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.lineWidth = brushRadius * 1.8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.stroke();
    }

    // Vết xóa tròn radial mờ viền
    const grad = ctx.createRadialGradient(x, y, brushRadius * 0.2, x, y, brushRadius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Âm thanh ASMR lau sơn
    soundManager.playWipeSound();

    // Đánh dấu lưới % đã lau
    if (wipeGridRef.current) {
      const { cols, rows } = gridDimsRef.current;
      const cellW = width / cols;
      const cellH = height / rows;
      const centerCol = Math.floor(x / cellW);
      const centerRow = Math.floor(y / cellH);
      const span = Math.ceil(brushRadius / Math.min(cellW, cellH));

      let marked = 0;
      for (let r = Math.max(0, centerRow - span); r <= Math.min(rows - 1, centerRow + span); r++) {
        for (let c = Math.max(0, centerCol - span); c <= Math.min(cols - 1, centerCol + span); c++) {
          const idx = r * cols + c;
          if (wipeGridRef.current[idx] === 0) {
            wipeGridRef.current[idx] = 1;
          }
        }
      }
      for (let i = 0; i < wipeGridRef.current.length; i++) {
        if (wipeGridRef.current[i] === 1) marked++;
      }
      const pct = Math.round((marked / wipeGridRef.current.length) * 100);
      setWipedPercent(pct);

      // Nếu lau được > 45% thì tự động mở sạch toàn bộ
      if (pct > 45 && phase === 'WIPING') {
        setPhase('REVEALED');
        soundManager.playCelebrationCheer();
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#fda4af', '#f43f5e', '#fed7aa', '#fef08a'],
        });
      }
    }
  }, [phase]);

  // Xử lý sự kiện kéo / vuốt chuột hoặc ngón tay
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    setHasStartedWiping(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = { x, y };
    setCursorPos({ x: e.clientX, y: e.clientY });
    erasePaint(x, y);

    // Nếu bấm trúng vị trí nút bấm bên dưới
    updateButtonRect();
    if (buttonBoxRef.current) {
      const b = buttonBoxRef.current;
      if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom) {
        // Nếu đã lau thấy nút, bấm vào là chuyển trang luôn
        if (wipedPercent > 18) {
          onNext();
        }
      }
    }
  }, [erasePaint, onNext, updateButtonRect, wipedPercent]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!isPointerDownRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prev = lastPointRef.current || { x, y };
    erasePaint(x, y, prev.x, prev.y);
    lastPointRef.current = { x, y };
  }, [erasePaint]);

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;
    lastPointRef.current = null;
  }, []);

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none bg-stone-950 flex items-center justify-center">
      {/* =================================================================== */}
      {/* 1. LỚP BÊN DƯỚI LỘ RA KHI LAU SƠN: KHÔNG GIAN BÍ MẬT & NÚT CHUYỂN TRANG */}
      {/* =================================================================== */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#fff0f4] via-[#fde2e8] to-[#ffd1dc] overflow-hidden select-none">
        {/* Ánh sáng sao lấp lánh nền */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(20)].map((_, i) => (
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
                top: `${(i * 19) % 95}%`,
                left: `${(i * 29) % 95}%`,
              }}
              className="absolute text-pink-400 text-lg"
            >
              ✦
            </motion.div>
          ))}
        </div>

        {/* Nội dung thông điệp bí mật */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 flex flex-col items-center max-w-sm sm:max-w-md"
        >
          {/* Huy hiệu đỉnh */}
          <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-rose-600 text-xs font-bold shadow-md shadow-pink-200/50 flex items-center gap-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>Điều bí mật đã lộ diện 🌸</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 tracking-tight leading-snug drop-shadow-xs mb-2">
            Em đã mở ra cánh cửa may mắn! 💖
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed max-w-xs mb-8">
            Những điều ngọt ngào nhất đang chờ đón em ở phía trước. Hãy bấm vào nút bên dưới để khám phá ngay nhé!
          </p>

          {/* 🎁 NÚT CHUYỂN TRANG CHÍNH: LỘ RA DƯỚI LỚP SƠN */}
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
        </motion.div>

        {/* Nút nhỏ xem lại bánh kem hoặc bỏ qua */}
        <div className="absolute bottom-6 z-20 flex items-center gap-3">
          {onBackToCake && (
            <button
              type="button"
              onClick={onBackToCake}
              className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-600 text-xs font-semibold shadow-xs border border-pink-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <span>🎂</span>
              <span>Xem lại bánh kem</span>
            </button>
          )}

          {/* Nút bỏ qua lau sơn để chuyển trang ngay */}
          <button
            type="button"
            onClick={onNext}
            className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-rose-600 text-xs font-semibold shadow-xs border border-pink-200 flex items-center gap-1 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>Bỏ qua lau sơn</span>
            <span>⏩</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. GIAI ĐOẠN 1: CÁC DÒNG SƠN MÀU HỒNG ĐỔ CHÉO CHE KÍN MÀN HÌNH       */}
      {/* =================================================================== */}
      <AnimatePresence>
        {phase === 'POURING' && (
          <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
            {PAINT_STREAMS.map((st) => (
              <motion.div
                key={`paint-stream-${st.id}`}
                initial={{
                  x: '-120%',
                  y: '-120%',
                  rotate: -38,
                }}
                animate={{
                  x: '0%',
                  y: '0%',
                  rotate: -38,
                }}
                transition={{
                  duration: 0.85,
                  delay: st.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: 'absolute',
                  top: '-40%',
                  left: `${st.leftPct}%`,
                  width: `${st.widthPct + 10}%`,
                  height: '240%',
                  backgroundColor: st.color,
                  boxShadow: `0 10px 30px ${st.shadow}`,
                  transformOrigin: 'top left',
                }}
                className="rounded-b-[40px] relative overflow-hidden"
              >
                {/* Vệt sơn bóng ướt lướt dọc theo dòng sơn */}
                <div
                  className="absolute inset-y-0 left-2 w-3 bg-white/35 blur-[1px] pointer-events-none"
                  style={{ transform: 'skewX(-10deg)' }}
                />
                {/* Giọt sơn chảy nhô ra ở đầu dòng */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-12 rounded-b-full bg-inherit"
                  style={{ boxShadow: `0 8px 20px ${st.shadow}` }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* 3. GIAI ĐOẠN 2: LỚP CANVAS PHỦ SƠN ĐỂ CON TRỎ LAU SƠN               */}
      {/* =================================================================== */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          opacity: phase === 'REVEALED' ? 0 : 1,
          pointerEvents: phase === 'WIPING' ? 'auto' : 'none',
          transition: 'opacity 0.8s ease-out',
        }}
        className="fixed inset-0 z-30 touch-none cursor-grab active:cursor-grabbing"
      />

      {/* =================================================================== */}
      {/* 4. HƯỚNG DẪN & CON TRỎ MÔ PHỎNG CHIẾC KHĂN LAU / BỌT BIỂN ✨        */}
      {/* =================================================================== */}
      {phase === 'WIPING' && (
        <>
          {/* Lời gợi ý nổi bật ở trên */}
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: hasStartedWiping ? 0.35 : 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="px-5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-stone-700 text-xs sm:text-sm font-bold shadow-lg shadow-pink-300/40 flex items-center gap-2"
            >
              <span className="text-base">🧽</span>
              <span>Dùng con trỏ hoặc ngón tay lau bớt sơn để tìm nút bấm ✨</span>
            </motion.div>

            {/* Tiến trình lau sạch */}
            {wipedPercent > 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 text-[11px] font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
              >
                Đã lau: {wipedPercent}%
              </motion.div>
            )}
          </div>

          {/* Con trỏ lau sơn phát sáng bay theo vị trí chuột */}
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
