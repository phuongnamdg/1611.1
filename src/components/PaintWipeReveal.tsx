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

// Cấu hình các dòng sơn lỏng hữu cơ (Viscous Organic Drip)
// Mỗi dòng có độ nhớt, đầu giọt trĩu nặng (bulbous head), giọt sơn bắn trước và độ sóng tự nhiên
interface OrganicDripStream {
  color: string;
  shadow: string;
  xRatio: number;      // Tọa độ ngang trên mặt phẳng nghiêng (-0.5 đến 0.5)
  widthRatio: number;  // Độ rộng dải sơn
  delay: number;       // Thời gian chờ trước khi chảy (giây)
  duration: number;    // Thời gian hoàn thành dòng chảy (giây)
  waviness: number;    // Biên độ lượn sóng của mép sơn (px)
  waveFreq: number;    // Tần số lượn sóng
  phase: number;       // Pha sóng để các dòng không bị trùng nhau
  headBulge: number;   // Độ phình to của đầu giọt sơn (1.2 - 1.45 lần thân)
  dripDrops: number;   // Số giọt sơn nhỏ bắn rơi trước
}

const DRIP_STREAMS: OrganicDripStream[] = [
  {
    color: '#ffe4e8',
    shadow: 'rgba(251, 113, 133, 0.35)',
    xRatio: -0.42,
    widthRatio: 0.26,
    delay: 0.05,
    duration: 2.6,
    waviness: 16,
    waveFreq: 0.009,
    phase: 0.5,
    headBulge: 1.35,
    dripDrops: 2,
  },
  {
    color: '#fbcfe8',
    shadow: 'rgba(244, 63, 94, 0.38)',
    xRatio: -0.28,
    widthRatio: 0.28,
    delay: 0.18,
    duration: 2.8,
    waviness: 20,
    waveFreq: 0.011,
    phase: 1.8,
    headBulge: 1.40,
    dripDrops: 3,
  },
  {
    color: '#f472b6',
    shadow: 'rgba(219, 39, 119, 0.42)',
    xRatio: -0.14,
    widthRatio: 0.30,
    delay: 0.32,
    duration: 2.7,
    waviness: 18,
    waveFreq: 0.008,
    phase: 3.2,
    headBulge: 1.32,
    dripDrops: 2,
  },
  {
    color: '#fda4af',
    shadow: 'rgba(225, 29, 72, 0.38)',
    xRatio: 0.02,
    widthRatio: 0.29,
    delay: 0.45,
    duration: 2.9,
    waviness: 22,
    waveFreq: 0.012,
    phase: 4.5,
    headBulge: 1.42,
    dripDrops: 3,
  },
  {
    color: '#fb7185',
    shadow: 'rgba(190, 18, 60, 0.44)',
    xRatio: 0.18,
    widthRatio: 0.31,
    delay: 0.58,
    duration: 2.7,
    waviness: 19,
    waveFreq: 0.010,
    phase: 0.8,
    headBulge: 1.36,
    dripDrops: 2,
  },
  {
    color: '#ec4899',
    shadow: 'rgba(157, 23, 77, 0.46)',
    xRatio: 0.34,
    widthRatio: 0.32,
    delay: 0.72,
    duration: 3.0,
    waviness: 24,
    waveFreq: 0.013,
    phase: 2.4,
    headBulge: 1.45,
    dripDrops: 3,
  },
  {
    color: '#db2777',
    shadow: 'rgba(131, 24, 67, 0.48)',
    xRatio: 0.48,
    widthRatio: 0.32,
    delay: 0.85,
    duration: 2.8,
    waviness: 17,
    waveFreq: 0.009,
    phase: 5.1,
    headBulge: 1.34,
    dripDrops: 2,
  },
  {
    color: '#f43f5e',
    shadow: 'rgba(110, 15, 45, 0.48)',
    xRatio: 0.62,
    widthRatio: 0.35,
    delay: 0.98,
    duration: 2.9,
    waviness: 21,
    waveFreq: 0.011,
    phase: 1.2,
    headBulge: 1.38,
    dripDrops: 3,
  },
  {
    color: '#fce7f3',
    shadow: 'rgba(244, 114, 182, 0.40)',
    xRatio: 0.76,
    widthRatio: 0.36,
    delay: 1.10,
    duration: 2.7,
    waviness: 18,
    waveFreq: 0.010,
    phase: 3.7,
    headBulge: 1.30,
    dripDrops: 1,
  },
];

export default function PaintWipeReveal({ onNext, onBackToCake }: Props) {
  const [isPouring, setIsPouring] = useState<boolean>(true);
  const [hasStartedWiping, setHasStartedWiping] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const buttonElRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // ===================================================================
  // 1. VẼ HIỆU ỨNG SƠN LỎNG CHẢY HỮU CƠ (ORGANIC VISCOUS DRIP)
  // ĐẦU GIỌT TRĨU NẶNG, MÃI SÓNG LƯỢN TỰ NHIÊN, GIỌT BẮN LI TI
  // KHI ĐỔ XONG GIỮ NGUYÊN BẢN SƠN TRÊN CANVAS ĐỂ NGƯỜI DÙNG LAU
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

    // Âm thanh đổ ào sơn ban đầu
    soundManager.playPaintSplashSound();

    // Hẹn giờ phát tiếng bloop giọt sơn rơi ngộ nghĩnh theo nhịp chảy chậm rãi
    const dripTimers = [
      setTimeout(() => soundManager.playLiquidDripSound(), 400),
      setTimeout(() => soundManager.playLiquidDripSound(), 900),
      setTimeout(() => soundManager.playLiquidDripSound(), 1500),
      setTimeout(() => soundManager.playLiquidDripSound(), 2200),
      setTimeout(() => soundManager.playLiquidDripSound(), 2900),
    ];

    const startTime = performance.now();
    // Góc chảy nghiêng chéo tự nhiên
    const angle = (-32 * Math.PI) / 180;
    const diagDist = Math.sqrt(width * width + height * height) * 1.5;
    const startY = -diagDist * 0.58;
    const targetY = diagDist * 0.62;
    const totalTravel = targetY - startY;

    const renderPourFrame = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      let allCompleted = true;

      // Toàn bộ vẽ trên hệ tọa độ xoay chéo theo hướng dòng chảy
      ctx.save();
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(angle);

      // --- A. DÒNG CHẢY NỀN HỮU CƠ TIẾN DẦN ĐẰNG SAU (ĐẢM BẢO PHỦ KÍN 100%) ---
      // Tốc độ phủ sơn chậm rãi, êm ái hơn để thưởng thức trọn vẹn chất lỏng
      const baseProgress = Math.min(1, Math.max(0, (elapsed - 0.35) / 3.4));
      if (baseProgress > 0) {
        const floodFrontY = startY + (1 - Math.pow(1 - baseProgress, 2.5)) * totalTravel;
        ctx.save();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.moveTo(-diagDist, startY);
        ctx.lineTo(-diagDist, floodFrontY);

        // Mép sóng hữu cơ của dòng nền
        const segs = 20;
        for (let i = 0; i <= segs; i++) {
          const px = -diagDist + (i / segs) * (diagDist * 2);
          const py = floodFrontY + Math.sin(i * 0.8 + elapsed * 3) * 18;
          ctx.lineTo(px, py);
        }

        ctx.lineTo(diagDist, startY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // --- B. TỪNG DÒNG SƠN LỎNG CHẢY GIỌT XẾP LỚP (DRIP TONGUES) ---
      DRIP_STREAMS.forEach((st) => {
        const streamElapsed = elapsed - st.delay;
        const p = streamElapsed <= 0 ? 0 : Math.min(1, streamElapsed / st.duration);
        if (p < 1) allCompleted = false;

        // Easing nhớt tự nhiên: chất lỏng chảy đầm, lướt êm ái
        const ease = 1 - Math.pow(1 - p, 2.2);
        const currentHeadY = startY + ease * totalTravel;

        if (currentHeadY <= startY + 10) return;

        const streamWidth = width * st.widthRatio;
        const streamX = st.xRatio * width * 1.5;
        const headRadius = (streamWidth * 0.5) * st.headBulge;
        const neckWidth = streamWidth * 0.72;
        const neckY = currentHeadY - headRadius * 1.6;

        ctx.save();

        // 1. Bóng đổ 3D dưới mỗi dải sơn tạo cảm giác lớp sơn dày cộp, bóng bẩy
        ctx.shadowColor = st.shadow;
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 8;

        // 2. Vẽ thân dải sơn lượn sóng hữu cơ & đầu giọt trĩu nặng
        ctx.fillStyle = st.color;
        ctx.beginPath();

        // Bắt đầu từ mép trên-trái
        ctx.moveTo(streamX - streamWidth * 0.5, startY);

        // Men theo mép trái lượn sóng tự nhiên xuống đến cổ giọt sơn
        const step = 28;
        for (let y = startY; y < neckY; y += step) {
          const wave = Math.sin(y * st.waveFreq + st.phase) * st.waviness;
          ctx.lineTo(streamX - streamWidth * 0.5 + wave, y);
        }

        // Lượn thắt vào cổ giọt sơn (neck)
        ctx.lineTo(streamX - neckWidth * 0.5, neckY);

        // Nở phình to ra thành đầu giọt sơn tròn trĩu nặng (bulbous teardrop head)
        ctx.bezierCurveTo(
          streamX - neckWidth * 0.5,
          neckY + headRadius * 0.4,
          streamX - headRadius,
          currentHeadY - headRadius * 0.5,
          streamX - headRadius,
          currentHeadY - headRadius * 0.1
        );

        // Vòng cung đáy giọt tròn bóng bẩy
        ctx.arc(
          streamX,
          currentHeadY - headRadius * 0.1,
          headRadius,
          Math.PI,
          0,
          true
        );

        // Lượn từ bên phải đầu giọt về lại cổ giọt bên phải
        ctx.bezierCurveTo(
          streamX + headRadius,
          currentHeadY - headRadius * 0.5,
          streamX + neckWidth * 0.5,
          neckY + headRadius * 0.4,
          streamX + neckWidth * 0.5,
          neckY
        );

        // Men theo mép phải lượn sóng ngược lên trên
        for (let y = neckY; y > startY; y -= step) {
          const wave = Math.sin(y * st.waveFreq + st.phase + 1.2) * st.waviness;
          ctx.lineTo(streamX + streamWidth * 0.5 + wave, y);
        }

        ctx.lineTo(streamX + streamWidth * 0.5, startY);
        ctx.closePath();
        ctx.fill();

        // 3. Giọt sơn bắn rơi rớt trước (flying detached droplets)
        if (currentHeadY < targetY - 60 && st.dripDrops > 0) {
          for (let d = 1; d <= st.dripDrops; d++) {
            const dropDist = headRadius + d * 38 + Math.sin(elapsed * 6 + d) * 8;
            const dropY = currentHeadY + dropDist;
            const dropX = streamX + Math.sin(dropY * 0.01 + st.phase) * (st.waviness * 0.6);
            const dropRadiusX = Math.max(4, 11 - d * 2.5);
            const dropRadiusY = Math.max(6, 17 - d * 3.5); // Giọt thuôn dài vì đang rơi

            ctx.beginPath();
            ctx.ellipse(dropX, dropY, dropRadiusX, dropRadiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            // Đốm sáng trên giọt nhỏ
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(dropX - dropRadiusX * 0.3, dropY - dropRadiusY * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Tắt bóng đổ để vẽ vệt sáng bóng dầu ướt (specular wet gloss)
        ctx.shadowColor = 'transparent';

        // 4. Vệt sáng bóng dầu dọc theo thân dòng sơn
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let y = startY + 40; y < neckY - 20; y += step) {
          const wave = Math.sin(y * st.waveFreq + st.phase) * st.waviness;
          const gx = streamX - streamWidth * 0.5 + wave + 12;
          if (y === startY + 40) ctx.moveTo(gx, y);
          else ctx.lineTo(gx, y);
        }
        ctx.stroke();

        // 5. Vệt phản chiếu ánh sáng hình lưỡi liềm trên đầu giọt sơn tròn
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          streamX - headRadius * 0.22,
          currentHeadY - headRadius * 0.15,
          headRadius * 0.62,
          0.7 * Math.PI,
          1.15 * Math.PI
        );
        ctx.stroke();

        // Đốm sáng điểm lấp lánh (specular glint)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(
          streamX - headRadius * 0.45,
          currentHeadY - headRadius * 0.35,
          3.5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      });

      ctx.restore();

      // Kiểm tra hoàn tất toàn bộ dòng chảy
      if (!allCompleted || baseProgress < 1) {
        animFrameIdRef.current = requestAnimationFrame(renderPourFrame);
      } else {
        // ĐỔ SƠN HOÀN TẤT: GIỮ NGUYÊN NÉT VẼ ĐẸP NÀY TRÊN CANVAS ĐỂ LAU SƠN
        setIsPouring(false);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderPourFrame);

    return () => {
      dripTimers.forEach((t) => clearTimeout(t));
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // ===================================================================
  // 2. XÓA / LAU BỚT SƠN BẰNG CỌ MỀM TỰ NHIÊN
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

    // Nối giữa 2 điểm liên tiếp để đường lau liền mạch mềm mại
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

  // Kiểm tra xem vị trí bấm có trúng phong bì đã lau lộ diện hay không
  const checkButtonClick = useCallback((x: number, y: number) => {
    if (!buttonElRef.current) return;
    const b = buttonElRef.current.getBoundingClientRect();
    const pad = 16;
    if (x >= b.left - pad && x <= b.right + pad && y >= b.top - pad && y <= b.bottom + pad) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Đọc pixel tại vị trí bấm: Nếu alpha < 155 nghĩa là sơn ở đây đã được lau sạch
      const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      if (pixel[3] < 155) {
        soundManager.playUnlockSuccess();
        confetti({
          particleCount: 75,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#cbb3d4', '#fbcfe8', '#fed7aa', '#f472b6', '#a78bfa'],
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
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none bg-transparent flex items-center justify-center pointer-events-auto">
      {/* =================================================================== */}
      {/* 1. LỚP BÊN DƯỚI: PHONG BÌ THƯ VINTAGE HOA DẠI & CON DẤU SÁP TÍM     */}
      {/* (CHUẨN 100% THEO ẢNH MẪU: KRAFT ENVELOPE + BOTANICAL + TAP TO OPEN)  */}
      {/* CHỈ XUẤT HIỆN KHI ĐÃ ĐỔ SƠN PHỦ KÍN 100% MÀN HÌNH (!isPouring)      */}
      {/* =================================================================== */}
      {!isPouring && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#f6eee0] overflow-hidden select-none">
          {/* Họa tiết giấy linen / parchment vintage mờ nhẹ */}
          <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#d3c3a9_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Ánh sáng lung linh màu mơ / pastel mờ ảo xung quanh */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                animate={{
                  scale: [0.7, 1.2, 0.7],
                  opacity: [0.2, 0.7, 0.2],
                }}
                transition={{
                  duration: 2.5 + (i % 3) * 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{
                  top: `${(i * 19) % 92}%`,
                  left: `${(i * 29) % 92}%`,
                }}
                className="absolute text-amber-600/40 text-sm"
              >
                ✦
              </motion.div>
            ))}
          </div>

          {/* 💌 PHONG BÌ THƯ VINTAGE VẼ TAY NHỎ NHẮN & NGHỆ THUẬT (CHUẨN ẢNH MẪU 1) */}
          <div
            ref={buttonElRef}
            onClick={() => {
              soundManager.playUnlockSuccess();
              confetti({
                particleCount: 65,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#cbb3d4', '#fbcfe8', '#fed7aa', '#f472b6', '#a78bfa'],
              });
              onNext();
            }}
            className="relative z-20 group cursor-pointer flex flex-col items-center select-none my-auto"
          >
            {/* THÂN PHONG BÌ THƯ SỬ DỤNG FILE ẢNH (public/letter.png) */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="relative w-44 sm:w-52 aspect-[4/3] drop-shadow-[0_12px_24px_rgba(145,115,80,0.22)] transition-transform duration-300 flex items-center justify-center"
            >
              <img
                src="/letter.png"
                alt="Phong thư bí mật"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </motion.div>

            {/* ✍️ DÒNG CHỮ VIẾT TAY "Tap to open" NHỎ NHẮN, MỀM MẠI (CHUẨN ẢNH MẪU 1) */}
            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="font-dancing text-xl sm:text-2xl text-[#b85b6a] font-semibold tracking-wider italic mt-4 select-none transition-all group-hover:scale-105 group-hover:text-[#9e4352]"
            >
              Tap to open
            </motion.p>
          </div>

          {/* Các nút bấm điều hướng góc dưới (Tone màu Kraft Vintage thanh nhã) */}
          <div className="absolute bottom-6 z-20 flex items-center gap-3">
            {onBackToCake && (
              <button
                type="button"
                onClick={onBackToCake}
                className="px-3.5 py-1.5 rounded-full bg-[#ede1cc]/80 hover:bg-[#ede1cc] text-[#785b40] text-xs font-semibold shadow-xs border border-[#d8c3a1] flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <span>🎂</span>
                <span>Xem lại bánh kem</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              className="px-3.5 py-1.5 rounded-full bg-[#ede1cc]/80 hover:bg-[#ede1cc] text-[#a04554] text-xs font-semibold shadow-xs border border-[#d8c3a1] flex items-center gap-1 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <span>Bỏ qua</span>
              <span>⏩</span>
            </button>
          </div>
        </div>
      )}

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
              <span>Dùng con trỏ hoặc ngón tay lau bớt sơn để tìm bức thư bí mật ✨</span>
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
