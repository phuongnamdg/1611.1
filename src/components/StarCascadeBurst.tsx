'use client';

import React, { useEffect, useRef } from 'react';
import { soundManager } from '@/utils/sound';

interface Props {
  onFullCoverage: () => void;
  onComplete: () => void;
}

type StarShape = 'star4' | 'star5' | 'flower' | 'shootingStar' | 'glowDot';
type LayerType = 'bg' | 'mid' | 'fg';

interface StarParticle {
  id: number;
  layer: LayerType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  shape: StarShape;
  paletteIndex: number;
  rotation: number;
  vRot: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  alpha: number;
  tailLength?: number;
}

// Bảng màu 8 sắc độ pastel & vàng kim ngọc trai rực rỡ
const STAR_PALETTES = [
  { main: '#FFF176', center: '#FFFFFF', sub: '#FBC02D' }, // Vàng bơ tươi sáng
  { main: '#FFE082', center: '#FFFFFF', sub: '#FFA000' }, // Vàng kem sữa ấm áp
  { main: '#FF80AB', center: '#FFFFFF', sub: '#F50057' }, // Hồng kẹo bông
  { main: '#F8BBD0', center: '#FFFFFF', sub: '#EC407A' }, // Hồng anh đào dịu ngọt
  { main: '#E1BEE7', center: '#FFFFFF', sub: '#AB47BC' }, // Tím oải hương mơ màng
  { main: '#B2EBF2', center: '#FFFFFF', sub: '#00BCD4' }, // Xanh băng tuyết
  { main: '#FFCCBC', center: '#FFFFFF', sub: '#FF7043' }, // Cam đào pastel
  { main: '#FFFFFF', center: '#FFFFFF', sub: '#FFF9C4' }, // Trắng ngọc trai kim cương
];

export default function StarCascadeBurst({ onFullCoverage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const onFullCoverageRef = useRef(onFullCoverage);
  const onCompleteRef = useRef(onComplete);
  const hasTriggeredFullCoverageRef = useRef(false);
  const hasPlayedFallSoundRef = useRef(false);

  useEffect(() => {
    onFullCoverageRef.current = onFullCoverage;
  }, [onFullCoverage]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    hasTriggeredFullCoverageRef.current = false;
    hasPlayedFallSoundRef.current = false;

    // Âm thanh chuông gió thiên hà ngân nga
    soundManager.playStarCascadeSound();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // =========================================================================
    // ⚡ PRE-RENDER SPRITES (VẼ SẴN HỆ THỐNG SPRITE ĐỂ RENDER 500+ SAO 60FPS)
    // =========================================================================
    const spriteMap = new Map<string, HTMLCanvasElement>();

    const getSprite = (shape: StarShape, paletteIdx: number, sizeLevel: number): HTMLCanvasElement => {
      const key = `${shape}-${paletteIdx}-${sizeLevel}`;
      if (spriteMap.has(key)) return spriteMap.get(key)!;

      const size = sizeLevel === 0 ? 32 : sizeLevel === 1 ? 64 : 96;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = size * dpr;
      offCanvas.height = size * dpr;
      const oCtx = offCanvas.getContext('2d');
      if (!oCtx) return offCanvas;
      oCtx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const r = (size / 2) * 0.88;
      const pal = STAR_PALETTES[paletteIdx % STAR_PALETTES.length];

      if (shape === 'star4') {
        oCtx.fillStyle = pal.main;
        oCtx.beginPath();
        oCtx.moveTo(cx, cy - r);
        oCtx.quadraticCurveTo(cx, cy, cx + r, cy);
        oCtx.quadraticCurveTo(cx, cy, cx, cy + r);
        oCtx.quadraticCurveTo(cx, cy, cx - r, cy);
        oCtx.quadraticCurveTo(cx, cy, cx, cy - r);
        oCtx.closePath();
        oCtx.fill();

        // Tâm sáng ngọc trai
        oCtx.fillStyle = pal.center;
        oCtx.beginPath();
        oCtx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
        oCtx.fill();
      } else if (shape === 'star5') {
        oCtx.fillStyle = pal.main;
        oCtx.beginPath();
        const points = 5;
        const innerR = r * 0.52;
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? r : innerR;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          if (i === 0) oCtx.moveTo(px, py);
          else oCtx.lineTo(px, py);
        }
        oCtx.closePath();
        oCtx.fill();

        // Đốm phản chiếu dễ thương
        oCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        oCtx.beginPath();
        oCtx.arc(cx - r * 0.16, cy - r * 0.16, r * 0.22, 0, Math.PI * 2);
        oCtx.fill();
      } else if (shape === 'flower') {
        const petalCount = 5;
        const petalDist = r * 0.55;
        const petalRadius = r * 0.48;
        oCtx.fillStyle = pal.main;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i * 2 * Math.PI) / petalCount - Math.PI / 2;
          oCtx.beginPath();
          oCtx.arc(
            cx + Math.cos(angle) * petalDist,
            cy + Math.sin(angle) * petalDist,
            petalRadius,
            0,
            Math.PI * 2
          );
          oCtx.fill();
        }
        oCtx.fillStyle = pal.sub;
        oCtx.beginPath();
        oCtx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
        oCtx.fill();

        oCtx.fillStyle = '#FFFFFF';
        oCtx.beginPath();
        oCtx.arc(cx - r * 0.1, cy - r * 0.1, r * 0.16, 0, Math.PI * 2);
        oCtx.fill();
      } else {
        // glowDot
        const grad = oCtx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.85);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.45, pal.main);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        oCtx.fillStyle = grad;
        oCtx.beginPath();
        oCtx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
        oCtx.fill();
      }

      spriteMap.set(key, offCanvas);
      return offCanvas;
    };

    // =========================================================================
    // 🌌 KHỞI TẠO ĐÀN SAO DÀY ĐẶC (350 - 500 SAO ĐAN XEN)
    // =========================================================================
    const stars: StarParticle[] = [];
    let nextStarId = 1;

    const createStar = (startY?: number, forceTop: boolean = false): StarParticle => {
      const rand = Math.random();
      // Phân bổ 3 tầng: 50% xa, 35% giữa, 15% gần
      const layer: LayerType = rand < 0.5 ? 'bg' : rand < 0.85 ? 'mid' : 'fg';

      let radius: number;
      let vy: number;
      let alpha: number;
      let shape: StarShape;
      let swayAmp: number;
      let swaySpeed: number;

      if (layer === 'bg') {
        radius = 8 + Math.random() * 8;
        vy = 5.0 + Math.random() * 3.5;
        alpha = 0.55 + Math.random() * 0.35;
        shape = Math.random() < 0.55 ? 'glowDot' : 'star4';
        swayAmp = 1.2 + Math.random() * 1.8;
        swaySpeed = 0.002 + Math.random() * 0.002;
      } else if (layer === 'mid') {
        radius = 20 + Math.random() * 18;
        vy = 8.5 + Math.random() * 4.2;
        alpha = 0.88 + Math.random() * 0.12;
        const rS = Math.random();
        shape = rS < 0.4 ? 'star4' : rS < 0.75 ? 'star5' : 'flower';
        swayAmp = 1.4 + Math.random() * 1.6;
        swaySpeed = 0.0025 + Math.random() * 0.002;
      } else {
        // Cận cảnh: Sao to và sao băng vút nhanh
        radius = 42 + Math.random() * 26;
        vy = 12.5 + Math.random() * 5.5;
        alpha = 0.96 + Math.random() * 0.04;
        const rS = Math.random();
        shape = rS < 0.35 ? 'shootingStar' : rS < 0.7 ? 'star4' : 'star5';
        swayAmp = 1.0 + Math.random() * 1.2;
        swaySpeed = 0.003 + Math.random() * 0.002;
      }

      const paletteIndex = Math.floor(Math.random() * STAR_PALETTES.length);
      const tailLength = shape === 'shootingStar' ? 55 + Math.random() * 50 : undefined;

      const yPos =
        startY !== undefined
          ? startY
          : forceTop
          ? -radius - 40 - Math.random() * 60
          : -radius - Math.random() * (height * 0.5);

      return {
        id: nextStarId++,
        layer,
        x: Math.random() * width,
        y: yPos,
        vx: (Math.random() - 0.5) * 1.0,
        vy,
        radius,
        shape,
        paletteIndex,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * (layer === 'fg' ? 0.09 : 0.05),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed,
        swayAmp,
        alpha,
        tailLength,
      };
    };

    // Khởi tạo ngay 120 sao ban đầu trải khắp để không có 1 giây nào bị thưa!
    for (let i = 0; i < 120; i++) {
      stars.push(createStar(Math.random() * height * 0.85 - 40));
    }

    // --- TIMELINE KIỂM SOÁT THÁC SAO ---
    // 0ms -> 1100ms: Cơn mưa sao tuôn trào dày đặc, rèm pastel dâng lên che kín 100%
    // 1100ms: onFullCoverage() kích hoạt đổi Scene1Lock ngầm bên dưới
    // 1100ms -> 1550ms: Giữ đỉnh 450ms che kín 100% (đủ thời gian để React mount Scene1Lock trơn tru 0ms lag)
    // 1550ms -> 2600ms: Rèm sáng tan biến êm dịu, đàn sao tiếp tục lướt rơi xuống dưới chân hé lộ trọn vẹn màn khóa
    const startTime = performance.now();
    let lastFrameTime = startTime;
    const FULL_COVER_TIME = 1100;
    const PEAK_HOLD = 450;
    const REVEAL_START = FULL_COVER_TIME + PEAK_HOLD; // 1550ms
    const TOTAL_DURATION = 2600;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const dt = Math.min(2.0, Math.max(0.5, (now - lastFrameTime) / 16.67)); // Chuẩn hóa Delta Time
      lastFrameTime = now;

      ctx.clearRect(0, 0, width, height);

      // =========================================================================
      // 🌟 1. TẤM RÈM THÁC SAO PASTEL CHE KÍN 100% (TUYỆT ĐỐI KHÔNG HỞ)
      // =========================================================================
      let washAlpha = 0;
      if (elapsed < FULL_COVER_TIME) {
        // Dâng lên phủ kín với hàm Smoothstep
        const t = Math.min(1, elapsed / 900);
        washAlpha = t * t * (3 - 2 * t);
      } else if (elapsed < REVEAL_START) {
        // Đỉnh cao che kín 100% hoàn toàn
        washAlpha = 1.0;
      } else {
        // Tan biến siêu êm với hàm Cosine
        const fadeT = Math.min(1, (elapsed - REVEAL_START) / 950);
        washAlpha = Math.cos(fadeT * Math.PI * 0.5);
      }

      if (washAlpha > 0.005) {
        ctx.save();
        const washGrad = ctx.createLinearGradient(0, 0, 0, height);
        // Tone vàng kem sữa & hồng đào ngọc trai sang trọng, hòa quyện tuyệt đẹp
        washGrad.addColorStop(0, `rgba(255, 252, 245, ${washAlpha})`);
        washGrad.addColorStop(0.35, `rgba(255, 240, 246, ${washAlpha})`);
        washGrad.addColorStop(0.7, `rgba(254, 243, 228, ${washAlpha})`);
        washGrad.addColorStop(1, `rgba(255, 246, 240, ${washAlpha})`);
        ctx.fillStyle = washGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // =========================================================================
      // 🎬 2. CHUYỂN SANG MÀN KHÓA NGẦM KHI VỪA PHỦ KÍN 100%
      // =========================================================================
      if (elapsed >= FULL_COVER_TIME && !hasTriggeredFullCoverageRef.current) {
        hasTriggeredFullCoverageRef.current = true;
        onFullCoverageRef.current?.();
      }

      // Phát tiếng chuông hoa rơi du dương khi rèm sáng hé mở
      if (elapsed >= REVEAL_START && !hasPlayedFallSoundRef.current) {
        hasPlayedFallSoundRef.current = true;
        soundManager.playFlowerFallSound();
      }

      // =========================================================================
      // 🌠 3. SINH ĐÀN SAO MỚI TUÔN TRÀO KHỦNG (10 - 15 SAO MỖI FRAME)
      // =========================================================================
      if (elapsed < FULL_COVER_TIME + 200) {
        // Mỗi frame sinh dồn dập 10 - 15 sao mới từ đỉnh màn hình để tạo thác sao đặc quánh
        const spawnCount = Math.floor(10 + Math.random() * 6);
        for (let i = 0; i < spawnCount; i++) {
          stars.push(createStar(undefined, true));
        }
      }

      // =========================================================================
      // 💫 4. CẬP NHẬT VẬT LÝ & VẼ ĐÀN SAO KHỔNG LỒ BẰNG GPU BLITTING
      // =========================================================================
      const remainingStars: StarParticle[] = [];

      for (const s of stars) {
        s.y += s.vy * dt;
        s.x += (s.vx + Math.sin(now * s.swaySpeed + s.swayPhase) * s.swayAmp) * dt;
        s.rotation += s.vRot * dt;

        // Khi sang giai đoạn hé mở màn khóa: gia tốc rơi nhẹ tự nhiên
        if (elapsed >= REVEAL_START) {
          s.vy += (s.layer === 'fg' ? 0.4 : s.layer === 'mid' ? 0.28 : 0.2) * dt;
        }

        if (s.y <= height + s.radius + (s.tailLength || 60) + 50) {
          remainingStars.push(s);
        }
      }

      stars.length = 0;
      stars.push(...remainingStars);

      // Phân tách 3 tầng không gian Parallax
      const bgStars: StarParticle[] = [];
      const midStars: StarParticle[] = [];
      const fgStars: StarParticle[] = [];

      for (const s of stars) {
        if (s.layer === 'bg') bgStars.push(s);
        else if (s.layer === 'mid') midStars.push(s);
        else fgStars.push(s);
      }

      const drawStarParticle = (s: StarParticle) => {
        // 1. Nếu là sao băng có đuôi sáng
        if (s.shape === 'shootingStar' && s.tailLength) {
          ctx.save();
          ctx.globalAlpha = s.alpha;
          const tailGrad = ctx.createLinearGradient(s.x, s.y - s.tailLength, s.x, s.y);
          tailGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          tailGrad.addColorStop(0.65, STAR_PALETTES[s.paletteIndex].main);
          tailGrad.addColorStop(1, '#FFFFFF');

          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = s.radius * 0.35;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - s.tailLength);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();

          // Đầu sao băng
          const spr = getSprite('star4', s.paletteIndex, 1);
          const drawD = s.radius * 1.8;
          ctx.drawImage(spr, s.x - drawD / 2, s.y - drawD / 2, drawD, drawD);
          ctx.restore();
          return;
        }

        // 2. Các loại sao & hoa khác: Vẽ trực tiếp bằng Sprite đã cache (Hardware Accelerated)
        const sizeLevel = s.layer === 'bg' ? 0 : s.layer === 'mid' ? 1 : 2;
        const spr = getSprite(s.shape, s.paletteIndex, sizeLevel);
        const drawD = s.radius * 2;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.drawImage(spr, -drawD / 2, -drawD / 2, drawD, drawD);
        ctx.restore();
      };

      // Vẽ tuần tự các tầng (Tầng xa -> Tầng giữa -> Tầng gần)
      for (const s of bgStars) drawStarParticle(s);
      for (const s of midStars) drawStarParticle(s);
      for (const s of fgStars) drawStarParticle(s);

      // =========================================================================
      // 🏁 5. HOÀN TẤT KHI TOÀN BỘ THÁC SAO ĐÃ RƠI QUA HẾT
      // =========================================================================
      if (elapsed >= TOTAL_DURATION) {
        onCompleteRef.current?.();
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-50 pointer-events-none select-none"
    />
  );
}
