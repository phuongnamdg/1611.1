'use client';

import React, { useEffect, useRef } from 'react';
import { soundManager } from '@/utils/sound';

export type FlowerTheme = 'WILDFLOWER' | 'PEONY' | 'LAVENDER';

interface Props {
  onFullCoverage?: () => void;
  onComplete: () => void;
  theme?: FlowerTheme;
}

const THEME_CONFIG: Record<
  FlowerTheme,
  {
    src: string;
    glowR: number;
    glowG: number;
    glowB: number;
    washColor: string;
    petalColors: string[];
    sparkleColor: string;
  }
> = {
  WILDFLOWER: {
    src: '/flower-wildflower-cluster.png',
    glowR: 254,
    glowG: 228,
    glowB: 195,
    washColor: 'rgba(250, 243, 230, 0.96)',
    petalColors: ['#fff8f0', '#fed7aa', '#fde047', '#bbf7d0', '#fbcfe8'],
    sparkleColor: '#fde047',
  },
  PEONY: {
    src: '/flower-bloom-cluster.png',
    glowR: 255,
    glowG: 215,
    glowB: 228,
    washColor: 'rgba(255, 238, 242, 0.96)',
    petalColors: ['#ffe4e6', '#fbcfe8', '#fda4af', '#f472b6', '#fff1f2'],
    sparkleColor: '#fbcfe8',
  },
  LAVENDER: {
    src: '/flower-lavender-cluster.png',
    glowR: 235,
    glowG: 215,
    glowB: 255,
    washColor: 'rgba(247, 240, 255, 0.96)',
    petalColors: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#c084fc', '#e0e7ff'],
    sparkleColor: '#e9d5ff',
  },
};

interface FlowerParticle {
  targetX: number;
  targetY: number;
  baseSize: number;
  finalScale: number;
  flipX: boolean;
  targetRot: number;
  bloomDelay: number;

  fallDelay: number;
  fallSpeedY: number;
  gravity: number;
  driftAmp: number;
  driftFreq: number;
  phase: number;
  rotSpeed: number;
}

interface PetalParticle {
  angle: number;
  speed: number;
  rotSpeed: number;
  size: number;
  color: string;
  isSparkle: boolean;
  phase: number;
  fallDelay: number;
}

export default function FlowerBloomBurst({
  onFullCoverage,
  onComplete,
  theme = 'WILDFLOWER',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // QUAN TRỌNG: Dùng Ref để lưu trữ callback, TUYỆT ĐỐI KHÔNG đưa vào dependency array của useEffect
  // Giúp animation Canvas chạy liên tục 1 mạch duy nhất, không bị re-render từ cha làm ngắt quãng hoặc nở 2 lần!
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

    // Reset cờ kiểm soát cho phiên chạy mới
    hasTriggeredFullCoverageRef.current = false;
    hasPlayedFallSoundRef.current = false;

    // Phát âm thanh hoa nở du dương
    soundManager.playFlowerBloomSound();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const activeConfig = THEME_CONFIG[theme] || THEME_CONFIG.WILDFLOWER;

    const flowerImg = new Image();
    flowerImg.src = activeConfig.src;

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const diag = Math.hypot(width, height);

    // Kích thước chùm hoa tự động tỷ lệ theo khung hình (đảm bảo che phủ 100% mọi màn hình)
    const baseClusterSize = Math.max(340, Math.min(width, height) * 0.46);
    const fallGravity = Math.max(2400, height * 2.2);

    const flowers: FlowerParticle[] = [];

    const createFlower = (
      targetX: number,
      targetY: number,
      size: number,
      finalScale: number,
      bloomDelay: number,
      targetRot: number,
      seed: number
    ): FlowerParticle => {
      return {
        targetX,
        targetY,
        baseSize: size,
        finalScale,
        flipX: seed % 2 === 0,
        targetRot,
        bloomDelay,
        fallDelay: (seed % 6) * 0.035,
        fallSpeedY: 200 + (seed % 4) * 45,
        gravity: fallGravity + (seed % 3) * 160,
        driftAmp: 24 + (seed % 4) * 12,
        driftFreq: 4.2 + (seed % 3) * 1.0,
        phase: seed * 1.15,
        rotSpeed: (seed % 2 === 0 ? 1 : -1) * (1.1 + (seed % 3) * 0.4),
      };
    };

    let seedCounter = 0;

    // 1. CỤM TRUNG TÂM (1 chùm lớn ở tâm + 5 chùm quanh tâm)
    flowers.push(
      createFlower(centerX, centerY, baseClusterSize * 1.4, 2.4, 0, 0.05, seedCounter++)
    );
    for (let i = 0; i < 5; i++) {
      const ang = (i * Math.PI * 2) / 5;
      const r = 60;
      flowers.push(
        createFlower(
          centerX + Math.cos(ang) * r,
          centerY + Math.sin(ang) * r,
          baseClusterSize * 1.25,
          2.15,
          0.02 + i * 0.015,
          (i % 2 === 0 ? 1 : -1) * 0.25,
          seedCounter++
        )
      );
    }

    // 2. VÒNG TRONG (8 chùm hoa, bán kính 0.22 * diag)
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8 + 0.15;
      const r = diag * 0.22;
      flowers.push(
        createFlower(
          centerX + Math.cos(ang) * r,
          centerY + Math.sin(ang) * r,
          baseClusterSize * 1.35,
          2.25,
          0.05 + i * 0.012,
          (i % 2 === 0 ? 1 : -1) * 0.35,
          seedCounter++
        )
      );
    }

    // 3. VÒNG NGOÀI (12 chùm hoa, bán kính 0.44 * diag)
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI * 2) / 12 + 0.25;
      const r = diag * 0.44;
      flowers.push(
        createFlower(
          centerX + Math.cos(ang) * r,
          centerY + Math.sin(ang) * r,
          baseClusterSize * 1.45,
          2.45,
          0.09 + i * 0.01,
          (i % 2 === 0 ? -1 : 1) * 0.45,
          seedCounter++
        )
      );
    }

    // 4. CHỐT CHẶN 4 GÓC MÀN HÌNH (4 chùm hoa lớn phủ kín góc)
    const cornerOffsets = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: height },
      { x: width, y: height },
      { x: width * 0.5, y: -20 },
      { x: width * 0.5, y: height + 20 },
      { x: -20, y: height * 0.5 },
      { x: width + 20, y: height * 0.5 },
    ];
    cornerOffsets.forEach((pos, idx) => {
      flowers.push(
        createFlower(
          pos.x,
          pos.y,
          baseClusterSize * 1.5,
          2.5,
          0.14 + idx * 0.01,
          idx * 0.6,
          seedCounter++
        )
      );
    });

    // 25 cánh hoa và ánh sao lấp lánh rơi theo gió
    const petals: PetalParticle[] = Array.from({ length: 25 }, (_, i) => ({
      angle: (i * Math.PI * 2) / 25 + Math.sin(i) * 0.4,
      speed: 180 + (i % 5) * 80,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (1.8 + (i % 3) * 0.8),
      size: 11 + (i % 4) * 4,
      color: activeConfig.petalColors[i % activeConfig.petalColors.length],
      isSparkle: i % 3 === 0,
      phase: i * 0.6,
      fallDelay: (i % 6) * 0.04,
    }));

    const startTime = performance.now();
    const BLOOM_DURATION = 1550; // 1.55s hoa bung nở cực nhanh và dày đặc phủ kín màn hình
    const PEAK_HOLD = 250;       // 0.25s giữ đỉnh toàn màn hoa rực rỡ
    const FALL_START = BLOOM_DURATION + PEAK_HOLD; // 1800ms bắt đầu rơi xuống
    const FALL_DURATION = 1400;  // 1.4s hoa rơi xuống thần tốc như bức rèm hoa hạ màn
    const TOTAL_TIME = FALL_START + FALL_DURATION;

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // GIAI ĐOẠN 1: HOA BUNG NỞ (0 -> BLOOM_DURATION)
      // -------------------------------------------------------------
      const bloomProgress = Math.min(1, elapsed / BLOOM_DURATION);
      const easeBloom = 1 - Math.pow(1 - bloomProgress, 3);

      // KHI HOA VỪA PHỦ KÍN MÀN HÌNH (>= 0.96) -> GỌI onFullCoverage() ĐÚNG 1 LẦN DUY NHẤT!
      if (bloomProgress >= 0.96 && !hasTriggeredFullCoverageRef.current) {
        hasTriggeredFullCoverageRef.current = true;
        onFullCoverageRef.current?.();
      }

      // KHI BẮT ĐẦU HIỆU ỨNG RƠI XUỐNG -> PHÁT ÂM THANH HOA RƠI ÊM ÁI
      if (elapsed >= FALL_START && !hasPlayedFallSoundRef.current) {
        hasPlayedFallSoundRef.current = true;
        soundManager.playFlowerFallSound();
      }

      // -------------------------------------------------------------
      // VẼ LỚP NỀN WATERCOLOR (CHẮC CHẮN PHỦ KÍN 100%)
      // Khi bắt đầu rơi (elapsed > FALL_START), nền mờ nhanh trong 200ms để thấy cảnh mới
      // -------------------------------------------------------------
      let washAlpha = 1;
      if (elapsed < BLOOM_DURATION) {
        washAlpha = Math.min(1, easeBloom * 1.5);
      } else if (elapsed > FALL_START) {
        const fallFade = Math.min(1, (elapsed - FALL_START) / 200);
        washAlpha = Math.max(0, 1 - fallFade);
      }

      if (washAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = washAlpha;
        ctx.fillStyle = activeConfig.washColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // -------------------------------------------------------------
      // VẼ TẤT CẢ CÁC BÓ HOA DÀY ĐẶC (BUNG NỞ RỒI RƠI XUỐNG DƯỚI ĐÁY)
      // -------------------------------------------------------------
      if (flowerImg.complete && flowerImg.naturalWidth > 0) {
        flowers.forEach((fl) => {
          const p = Math.max(0, Math.min(1, (bloomProgress - fl.bloomDelay) / (1 - fl.bloomDelay)));
          if (p <= 0) return;

          const easeP = 1 - Math.pow(1 - p, 3);
          const currentScale = fl.finalScale * easeP;
          const currentRot = fl.targetRot * easeP;

          let curX = centerX + (fl.targetX - centerX) * easeP;
          let curY = centerY + (fl.targetY - centerY) * easeP;
          let rot = currentRot;

          // Hiệu ứng rơi xuống với gia tốc trọng trường
          if (elapsed > FALL_START) {
            const fallSec = Math.max(0, (elapsed - FALL_START) / 1000 - fl.fallDelay);
            if (fallSec > 0) {
              const deltaY = fl.fallSpeedY * fallSec + 0.5 * fl.gravity * fallSec * fallSec;
              const deltaX = Math.sin(fallSec * fl.driftFreq + fl.phase) * fl.driftAmp;
              curY += deltaY;
              curX += deltaX;
              rot += fl.rotSpeed * fallSec;
            }
          }

          const drawSize = fl.baseSize * currentScale;

          // Bỏ qua nếu đã rơi khỏi màn hình đáy
          if (curY - drawSize * 0.5 > height + 80) return;

          ctx.save();
          ctx.translate(curX, curY);
          ctx.rotate(rot);
          if (fl.flipX) {
            ctx.scale(-1, 1);
          }
          ctx.drawImage(
            flowerImg,
            -drawSize * 0.5,
            -drawSize * 0.5,
            drawSize,
            drawSize
          );
          ctx.restore();
        });
      }

      // -------------------------------------------------------------
      // VẼ CÁC CÁNH HOA LI TI VÀ ÁNH SAO LẤP LÁNH RƠI THEO GIÓ
      // -------------------------------------------------------------
      petals.forEach((pt) => {
        const t = Math.min(1, elapsed / BLOOM_DURATION);
        const easeT = 1 - Math.pow(1 - t, 2.2);

        let curX = centerX + Math.cos(pt.angle) * (pt.speed * easeT);
        let curY = centerY + Math.sin(pt.angle) * (pt.speed * easeT) - easeT * 35;
        let rot = pt.rotSpeed * t * 4;

        if (elapsed > FALL_START) {
          const fallSec = Math.max(0, (elapsed - FALL_START) / 1000 - pt.fallDelay);
          if (fallSec > 0) {
            curY += 150 * fallSec + 0.5 * 1800 * fallSec * fallSec;
            curX += Math.sin(fallSec * 6 + pt.phase) * 30;
            rot += pt.rotSpeed * fallSec * 3;
          }
        }

        if (curY > height + 50) return;

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(rot);

        if (pt.isSparkle) {
          ctx.fillStyle = activeConfig.sparkleColor;
          ctx.beginPath();
          const s = pt.size * 0.75;
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size * 0.6, pt.size * 0.95, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // -------------------------------------------------------------
      // HOÀN TẤT VÀ DỌN DẸP CANVAS
      // -------------------------------------------------------------
      if (elapsed < TOTAL_TIME) {
        animFrameIdRef.current = requestAnimationFrame(render);
      } else {
        onCompleteRef.current?.();
      }
    };

    if (flowerImg.complete) {
      animFrameIdRef.current = requestAnimationFrame(render);
    } else {
      flowerImg.onload = () => {
        animFrameIdRef.current = requestAnimationFrame(render);
      };
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [theme]); // CHỈ PHỤ THUỘC VÀO THEME, TUYỆT ĐỐI KHÔNG PHỤ THUỘC CALLBACK ĐỂ TRÁNH RE-RENDER KHỞI ĐỘNG LẠI

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none touch-none"
    />
  );
}