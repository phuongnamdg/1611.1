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
    color: '#9e2a4b', // Mâm xôi chín mọng (tương phản rõ rệt trên nền kem)
    shadow: 'rgba(75, 12, 30, 0.40)',
    xRatio: -0.42,
    widthRatio: 0.26,
    delay: 0.02,
    duration: 1.5,
    waviness: 16,
    waveFreq: 0.009,
    phase: 0.5,
    headBulge: 1.35,
    dripDrops: 2,
  },
  {
    color: '#b0345b', // Dâu rừng quyến rũ
    shadow: 'rgba(85, 15, 36, 0.38)',
    xRatio: -0.28,
    widthRatio: 0.28,
    delay: 0.08,
    duration: 1.6,
    waviness: 20,
    waveFreq: 0.011,
    phase: 1.8,
    headBulge: 1.40,
    dripDrops: 3,
  },
  {
    color: '#c2426c', // Hồng mận velvet sang trọng
    shadow: 'rgba(95, 18, 42, 0.36)',
    xRatio: -0.14,
    widthRatio: 0.30,
    delay: 0.15,
    duration: 1.55,
    waviness: 18,
    waveFreq: 0.008,
    phase: 3.2,
    headBulge: 1.32,
    dripDrops: 2,
  },
  {
    color: '#8c2240', // Cherry thẫm đậm đà
    shadow: 'rgba(65, 10, 26, 0.42)',
    xRatio: 0.02,
    widthRatio: 0.29,
    delay: 0.22,
    duration: 1.65,
    waviness: 22,
    waveFreq: 0.012,
    phase: 4.5,
    headBulge: 1.42,
    dripDrops: 3,
  },
  {
    color: '#a82e53', // Mứt dâu tằm sánh bóng
    shadow: 'rgba(80, 14, 34, 0.40)',
    xRatio: 0.18,
    widthRatio: 0.31,
    delay: 0.28,
    duration: 1.55,
    waviness: 19,
    waveFreq: 0.010,
    phase: 0.8,
    headBulge: 1.36,
    dripDrops: 2,
  },
  {
    color: '#ba3c66', // Rượu vang ngọt mâm xôi
    shadow: 'rgba(90, 16, 38, 0.38)',
    xRatio: 0.34,
    widthRatio: 0.32,
    delay: 0.35,
    duration: 1.68,
    waviness: 24,
    waveFreq: 0.013,
    phase: 2.4,
    headBulge: 1.45,
    dripDrops: 3,
  },
  {
    color: '#7a1b36', // Dâu rừng đen trĩu mọng
    shadow: 'rgba(55, 8, 22, 0.45)',
    xRatio: 0.48,
    widthRatio: 0.32,
    delay: 0.42,
    duration: 1.60,
    waviness: 17,
    waveFreq: 0.009,
    phase: 5.1,
    headBulge: 1.34,
    dripDrops: 2,
  },
  {
    color: '#ab3258', // Berry Glaze ấm áp
    shadow: 'rgba(85, 15, 36, 0.38)',
    xRatio: 0.62,
    widthRatio: 0.35,
    delay: 0.48,
    duration: 1.65,
    waviness: 21,
    waveFreq: 0.011,
    phase: 1.2,
    headBulge: 1.38,
    dripDrops: 3,
  },
  {
    color: '#be4670', // Mận hồng chín ngọt
    shadow: 'rgba(95, 18, 42, 0.35)',
    xRatio: 0.76,
    widthRatio: 0.36,
    delay: 0.54,
    duration: 1.58,
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
  const [isEnvelopeRevealed, setIsEnvelopeRevealed] = useState<boolean>(false);
  const [openStage, setOpenStage] = useState<'IDLE' | 'SHAKING' | 'OPENING' | 'OPENED' | 'MINIMIZED'>('IDLE');
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const buttonElRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Phân biệt rõ ràng giữa hành động LAU SƠN (kéo chuột/vuốt tay) và CLICK MỞ THƯ (chạm dứt khoát)
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const hasTriggeredNextRef = useRef<boolean>(false);
  const finishPourRef = useRef<(() => void) | null>(null);

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

    // Hẹn giờ phát tiếng bloop giọt sơn rơi ngộ nghĩnh theo nhịp chảy nhanh và mượt hơn (~2.1s)
    const dripTimers = [
      setTimeout(() => soundManager.playLiquidDripSound(), 200),
      setTimeout(() => soundManager.playLiquidDripSound(), 550),
      setTimeout(() => soundManager.playLiquidDripSound(), 950),
      setTimeout(() => soundManager.playLiquidDripSound(), 1400),
      setTimeout(() => soundManager.playLiquidDripSound(), 1850),
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
      // Tốc độ phủ sơn mượt mà, dứt khoát hơn (rút ngắn xuống ~2.1s)
      const baseProgress = Math.min(1, Math.max(0, (elapsed - 0.15) / 1.85));
      if (baseProgress > 0) {
        const floodFrontY = startY + (1 - Math.pow(1 - baseProgress, 2.3)) * totalTravel;
        ctx.save();
        ctx.fillStyle = '#8f2545'; // Nền mâm xôi đậm đà, tương phản nổi bật trên nền giấy kem
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

    // Hàm cho phép chạm để hoàn thành đổ sơn tức thì nếu người dùng muốn thao tác ngay
    const finishPour = () => {
      dripTimers.forEach((t) => clearTimeout(t));
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderPourFrame(startTime + 10000);
      setIsPouring(false);
    };
    finishPourRef.current = finishPour;

    animFrameIdRef.current = requestAnimationFrame(renderPourFrame);

    return () => {
      finishPourRef.current = null;
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

  // Tính toán diện tích phong bì đã được lau lộ ra (tỉ lệ 0 đến 1)
  const getEnvelopeWipeProgress = useCallback((): number => {
    if (!buttonElRef.current || !canvasRef.current) return 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;

    const b = buttonElRef.current.getBoundingClientRect();
    const bx = Math.max(0, Math.floor(b.left));
    const by = Math.max(0, Math.floor(b.top));
    const bw = Math.min(canvas.width - bx, Math.floor(b.width));
    const bh = Math.min(canvas.height - by, Math.floor(b.height));

    if (bw <= 0 || bh <= 0) return 0;

    const imgData = ctx.getImageData(bx, by, bw, bh);
    const data = imgData.data;
    const totalPixels = data.length / 4;
    const step = Math.max(1, Math.floor(totalPixels / 80)) * 4;
    let transparentCount = 0;
    let sampleCount = 0;

    for (let i = 3; i < data.length; i += step) {
      sampleCount++;
      if (data[i] < 120) {
        transparentCount++;
      }
    }

    const ratio = sampleCount > 0 ? transparentCount / sampleCount : 0;
    if (ratio >= 0.28) {
      setIsEnvelopeRevealed(true);
    }
    return ratio;
  }, []);

  // Hàm kích hoạt: Bấm vào sẽ rung rung một chút rồi bật mở phong thư và thiệp chúc mừng
  const triggerOpenEnvelope = useCallback(() => {
    if (openStage === 'SHAKING' || openStage === 'OPENING') return;

    if (openStage === 'MINIMIZED') {
      // Đang thu nhỏ xem phong bì -> bấm vào mở lại thiệp ngay
      setOpenStage('OPENED');
      soundManager.playUnlockSuccess();
      return;
    }

    if (openStage !== 'IDLE') return;

    // Giai đoạn 1: Bấm vào thì phong bì rung rung hồi hộp (~550ms)
    setOpenStage('SHAKING');
    soundManager.playKeypress(450);

    // Giai đoạn 2: Sau 550ms rung -> Nắp phong bì bật mở (chuyển sang ảnh letter-opened.png) & nổ pháo hoa!
    setTimeout(() => {
      setOpenStage('OPENING');
      soundManager.playUnlockSuccess();
      confetti({
        particleCount: 85,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#cbb3d4', '#fbcfe8', '#fed7aa', '#f472b6', '#a78bfa', '#ffd700'],
      });

      // Giai đoạn 3: Sau 600ms tiếp theo -> Lá thiệp rút ra và mở to lên toàn màn hình
      setTimeout(() => {
        setOpenStage('OPENED');
      }, 600);
    }, 550);
  }, [openStage]);

  // Kiểm tra xem vị trí click có trúng phong bì VÀ phong bì đã được lau lộ diện (>= 28%) hay chưa
  const checkButtonClick = useCallback((x: number, y: number) => {
    if (openStage === 'SHAKING' || openStage === 'OPENING') return;
    if (!buttonElRef.current) return;
    const b = buttonElRef.current.getBoundingClientRect();
    const pad = 16;
    if (x >= b.left - pad && x <= b.right + pad && y >= b.top - pad && y <= b.bottom + pad) {
      if (openStage === 'MINIMIZED') {
        triggerOpenEnvelope();
        return;
      }

      // BẮT BUỘC: Kiểm tra tỉ lệ lau sạch phong bì
      const wipeRatio = getEnvelopeWipeProgress();
      
      // Nếu chưa lau sạch tối thiểu 28% diện tích phong bì -> TUYỆT ĐỐI KHÔNG MỞ!
      if (wipeRatio < 0.28) {
        return;
      }

      // ĐÃ LAU LỘ DIỆN VÀ NGƯỜI DÙNG CLICK DỨT KHOÁT -> RUNG VÀ MỞ THIỆP!
      triggerOpenEnvelope();
    }
  }, [getEnvelopeWipeProgress, triggerOpenEnvelope, openStage]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPouring) {
      if (finishPourRef.current) {
        finishPourRef.current();
      }
      return;
    }
    isPointerDownRef.current = true;
    setHasStartedWiping(true);

    // Ghi nhận vị trí bắt đầu chạm để phân biệt giữa CLICK (chạm dứt khoát) và DRAG (kéo lau sơn)
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointRef.current = { x, y };
    setCursorPos({ x: e.clientX, y: e.clientY });
    erasePaint(x, y);

    // TUYỆT ĐỐI KHÔNG gọi checkButtonClick ở pointerDown!
  }, [erasePaint, isPouring]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!isPointerDownRef.current || isPouring) return;

    // Nếu con trỏ di chuyển quá 8px -> Đây là hành vi LAU SƠN (dragging), không phải click mở thư
    if (pointerStartPosRef.current) {
      const dist = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y);
      if (dist > 8) {
        hasDraggedRef.current = true;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prev = lastPointRef.current || { x, y };

    erasePaint(x, y, prev.x, prev.y);
    lastPointRef.current = { x, y };

    // Cập nhật trạng thái hiển thị phong bì khi người dùng lau
    getEnvelopeWipeProgress();
  }, [erasePaint, isPouring, getEnvelopeWipeProgress]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    lastPointRef.current = null;

    // QUAN TRỌNG: Nếu người dùng vừa thực hiện thao tác kéo/rê để LAU SƠN -> DỪNG LẠI, TUYỆT ĐỐI KHÔNG TỰ ĐỘNG MỞ!
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      pointerStartPosRef.current = null;
      getEnvelopeWipeProgress();
      return;
    }

    // CHỈ KHI NGƯỜI DÙNG CHẠM DỨT KHOÁT (TAP / CLICK CỐ ĐỊNH, KHÔNG RÊ CHUỘT) THÌ MỚI KIỂM TRA MỞ THƯ!
    pointerStartPosRef.current = null;
    checkButtonClick(e.clientX, e.clientY);
  }, [checkButtonClick, getEnvelopeWipeProgress]);

  return (
    <div className="fixed inset-0 z-20 w-full h-full overflow-hidden select-none bg-transparent flex items-center justify-center pointer-events-auto">
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

          {/* 💌 PHONG BÌ THƯ VINTAGE VẼ TAY (DÙNG FILE ẢNH PUBLIC/LETTER.PNG VÀ PUBLIC/LETTER-OPENED.PNG) */}
          <div
            ref={buttonElRef}
            onClick={() => {
              if (openStage === 'MINIMIZED') {
                triggerOpenEnvelope();
                return;
              }
              // BẮT BUỘC: Chỉ mở khi phong bì đã được lau lộ diện thật sự (>= 28%)
              if (getEnvelopeWipeProgress() < 0.28) return;
              triggerOpenEnvelope();
            }}
            className="relative z-20 group cursor-pointer flex flex-col items-center select-none my-auto"
          >
            {/* THÂN PHONG BÌ THƯ: KHI BẤM VÀO SẼ RUNG RUNG HỒI HỘP RỒI BẬT MỞ THƯ */}
            <motion.div
              key={openStage === 'IDLE' || openStage === 'SHAKING' ? 'closed-env' : 'opened-env'}
              initial={openStage === 'OPENING' ? { scale: 0.9, rotate: -4 } : false}
              animate={
                openStage === 'SHAKING'
                  ? {
                      rotate: [0, -6, 6, -6, 6, -3, 3, -1, 1, 0],
                      x: [0, -4, 4, -4, 4, -2, 2, 0],
                      scale: [1, 1.08, 1.12, 1.08, 1],
                    }
                  : openStage === 'OPENING'
                  ? {
                      scale: [0.92, 1.15, 1],
                      rotate: [-4, 3, -1, 0],
                    }
                  : openStage === 'OPENED'
                  ? { scale: 0.92, opacity: 0.35, y: 20 }
                  : { y: [0, -5, 0] }
              }
              transition={
                openStage === 'SHAKING'
                  ? { duration: 0.55, ease: 'easeInOut' }
                  : openStage === 'OPENING'
                  ? { duration: 0.5, ease: 'easeOut' }
                  : openStage === 'OPENED'
                  ? { duration: 0.4 }
                  : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
              }
              whileHover={openStage === 'IDLE' || openStage === 'MINIMIZED' ? { scale: 1.05 } : {}}
              whileTap={openStage === 'IDLE' || openStage === 'MINIMIZED' ? { scale: 0.96 } : {}}
              className="relative w-44 sm:w-52 aspect-[4/3] drop-shadow-[0_12px_24px_rgba(145,115,80,0.22)] transition-transform duration-300 flex items-center justify-center"
            >
              <img
                src={
                  openStage === 'OPENING' || openStage === 'OPENED' || openStage === 'MINIMIZED'
                    ? '/letter-opened.png'
                    : '/letter.png'
                }
                alt="Phong thư"
                className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
                draggable={false}
              />
            </motion.div>

            {/* ✍️ DÒNG CHỮ VIẾT TAY HƯỚNG DẪN */}
            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="font-dancing text-xl sm:text-2xl text-[#b85b6a] font-semibold tracking-wider italic mt-4 select-none transition-all group-hover:scale-105 group-hover:text-[#9e4352]"
            >
              {openStage === 'SHAKING'
                ? 'Đang mở thư... ✨'
                : openStage === 'OPENING'
                ? 'Đã mở phong thư! 🌸'
                : openStage === 'MINIMIZED'
                ? 'Chạm để đọc lại thiệp 💌'
                : 'Tap to open'}
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

      {/* Gợi ý trong lúc đang đổ sơn: có thể chạm để phủ nhanh */}
      {isPouring && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-pink-200/80 text-stone-600 text-xs font-medium shadow-sm flex items-center gap-1.5"
          >
            <span>🍧</span>
            <span>Chạm màn hình để phủ nhanh...</span>
          </motion.div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. LỜI GỢI Ý & HIỆU ỨNG CON TRỎ LAU SƠN ✨                          */}
      {/* =================================================================== */}
      {!isPouring && (
        <>
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-stone-700 text-xs sm:text-sm font-bold shadow-lg shadow-pink-300/40 flex items-center gap-2"
            >
              <span className="text-base">{isEnvelopeRevealed ? '💌' : '🧽'}</span>
              <span>
                {isEnvelopeRevealed
                  ? 'Bức thư đã lộ diện! Hãy chạm vào phong bì để mở nhé ✨'
                  : 'Dùng con trỏ hoặc ngón tay lau bớt sơn để tìm bức thư bí mật ✨'}
              </span>
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

      {/* =================================================================== */}
      {/* 4. TẤM THIỆP CHÚC MỪNG MỞ RA TỪ PHONG BÌ (RUNG RUNG RỒI MỞ THIỆP RA) */}
      {/* =================================================================== */}
      <AnimatePresence>
        {openStage === 'OPENED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none"
          >
            <motion.div
              initial={{ scale: 0.65, y: 70, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="relative w-full max-w-sm sm:max-w-md p-5 sm:p-7 rounded-[32px] bg-[#fffcf5] border-2 border-[#e6d1b8] shadow-[0_25px_60px_rgba(110,75,40,0.32)] flex flex-col items-center text-center max-h-[92vh] overflow-y-auto"
            >
              {/* Ánh sáng lung linh trên góc thiệp */}
              <div className="absolute top-3 right-4 text-amber-400 text-lg animate-pulse">✦</div>
              <div className="absolute top-4 left-4 text-pink-400 text-sm animate-pulse">✦</div>

              {/* Biểu tượng hoa dại xinh xắn trên đầu thiệp */}
              <div className="w-12 h-12 rounded-full bg-[#faefe1] border border-[#ebd6be] flex items-center justify-center text-xl shadow-inner mb-1.5">
                🌸
              </div>

              <span className="text-[11px] font-bold tracking-widest text-[#a85061] uppercase mb-0.5">
                Happy Birthday
              </span>

              <h2 className="font-dancing text-2xl sm:text-3xl text-[#94394c] font-bold tracking-wide mb-1.5 drop-shadow-xs">
                Gửi Công Chúa Nhỏ Của Hôm Nay! ✨
              </h2>

              {/* Khung ảnh Polaroid kỷ niệm chèn vào sau khi mở thư (tự động tải /letter-photo.png hoặc /avt.jpg) */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="relative my-2 group"
              >
                <div className="p-2 pb-2.5 bg-white rounded-xl shadow-[0_6px_20px_rgba(150,105,70,0.16)] border border-[#e8dbc9] rotate-[-2deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-300">
                  <div className="w-36 sm:w-44 aspect-square overflow-hidden rounded-lg bg-[#f7efe3] flex items-center justify-center relative">
                    <img
                      src="/letter-photo.png"
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('avt.jpg')) {
                          e.currentTarget.src = '/avt.jpg';
                        }
                      }}
                      alt="Ảnh kỷ niệm đính kèm trong thư"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1.5 text-[#94394c] font-dancing text-xs sm:text-sm font-semibold">
                    <span>✨</span>
                    <span>Moments of Us</span>
                    <span>✨</span>
                  </div>
                </div>
              </motion.div>

              <div className="my-2 px-4 py-3 rounded-2xl bg-[#fcf6ec] border border-[#ecd9c2] text-stone-700 leading-relaxed font-medium shadow-inner">
                <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                  Chúc em một tuổi mới ngập tràn nụ cười, bình an và hạnh phúc rạng ngời. Mong rằng những điều dịu dàng và ngọt ngào nhất đều sẽ đến với em! 💖
                </p>
              </div>

              {/* Các nút bấm điều khiển */}
              <div className="mt-2.5 w-full flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={onNext}
                  className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#d96a84] via-[#c9536e] to-[#d96a84] hover:brightness-105 text-white font-bold text-sm sm:text-base shadow-[0_8px_25px_rgba(201,83,110,0.38)] border border-white/60 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Gift className="w-5 h-5 text-amber-200 animate-bounce" />
                  <span>Mở 3 Chiếc Hộp Bí Mật</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <button
                  type="button"
                  onClick={() => setOpenStage('MINIMIZED')}
                  className="py-1 text-xs text-[#a3795b] hover:text-[#7f5a3e] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>💌</span>
                  <span>Thu nhỏ để ngắm phong bì</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
