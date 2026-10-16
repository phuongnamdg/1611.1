'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  color: string;
}

// 🌸 BẢNG MÀU HỒNG PHẤN PASTEL DỊU DÀNG & NHẸ NHÀNG
const PASTEL_PINK_COLORS = [
  '#f472b6', // Hồng phấn tươi
  '#fbcfe8', // Hồng phấn nhạt
  '#ffccd5', // Hồng dâu sữa
  '#ffb3c6', // Hồng hoa đào
  '#f8bbd0', // Hồng phấn baby
];

export default function HeartCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = false;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    const particles: Particle[] = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Vẽ hình trái tim viền thanh mảnh nhẹ nhàng
    const drawSoftHeart = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      opacity: number,
      rot: number
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.scale(size, size);
      c.globalAlpha = opacity;

      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-5, -5, -10, 2, 0, 9);
      c.bezierCurveTo(10, 2, 5, -5, 0, 0);

      // Nền trong suốt phớt hồng nhẹ
      c.fillStyle = color;
      c.fill();

      // Viền hồng phấn thanh thoát
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.8;
      c.stroke();

      c.restore();
    };

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.015; // Bay nhẹ bồng bềnh lên trên
        p.rotation += p.rotSpeed;
        p.opacity -= 0.018; // Tan biến êm dịu

        if (p.opacity <= 0) {
          particles.splice(i, 1);
        } else {
          drawSoftHeart(ctx, p.x, p.y, p.size, p.color, p.opacity, p.rotation);
        }
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(updateAndDraw);
      } else {
        isRunning = false;
      }
    };

    const spawnParticles = (x: number, y: number) => {
      const dist = Math.hypot(x - lastX, y - lastY);
      const now = performance.now();

      // Chỉ tạo khi chuột di chuyển mượt mà
      if (dist > 10 || now - lastTime > 50) {
        lastX = x;
        lastY = y;
        lastTime = now;

        // Sinh 1-2 đốm tim hồng phấn li ti
        const count = Math.random() > 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.6 - Math.random() * 0.8, // Bay lượn nhẹ lên trên
            size: 0.4 + Math.random() * 0.35, // Kích cỡ nhỏ xinh li ti
            opacity: 0.75,
            rotation: (Math.random() - 0.5) * 0.5,
            rotSpeed: (Math.random() - 0.5) * 0.04,
            color: PASTEL_PINK_COLORS[Math.floor(Math.random() * PASTEL_PINK_COLORS.length)],
          });
        }

        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(updateAndDraw);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      spawnParticles(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 select-none"
    />
  );
}
