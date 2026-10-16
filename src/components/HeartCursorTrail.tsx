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

const HEART_COLORS = ['#ff4d6d', '#ff758f', '#f72585', '#ff85a1', '#ffb3c6', '#ffd166'];

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

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number, rot: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.scale(size, size);
      c.globalAlpha = opacity;
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-5, -5, -10, 2, 0, 9);
      c.bezierCurveTo(10, 2, 5, -5, 0, 0);
      c.fill();
      c.restore();
    };

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // Trọng lực nhẹ rơi xuống hoặc lơ lửng
        p.rotation += p.rotSpeed;
        p.opacity -= 0.022;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
        } else {
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.opacity, p.rotation);
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
      // Chỉ tạo đốm tim khi di chuyển đủ xa hoặc sau một khoảng thời gian ngắn
      if (dist > 12 || now - lastTime > 60) {
        lastX = x;
        lastY = y;
        lastTime = now;

        const count = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -0.8 - Math.random() * 1.2, // Bay nhẹ lên trên
            size: 0.55 + Math.random() * 0.45,
            opacity: 0.9,
            rotation: (Math.random() - 0.5) * 0.6,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
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
