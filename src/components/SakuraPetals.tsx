'use client';

import React, { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export default function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Bảng màu cánh hoa anh đào
    const petalColors = [
      'rgba(255, 183, 197, 0.75)', // Sakura pink
      'rgba(255, 192, 203, 0.65)', // Light pink
      'rgba(255, 220, 228, 0.8)',  // Pale pink
      'rgba(255, 240, 245, 0.7)',  // Lavender blush
      'rgba(255, 160, 180, 0.6)',  // Deep sakura
    ];

    const petalCount = Math.min(35, Math.floor(width / 35));
    const petals: Petal[] = [];

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 8,
        speedX: Math.random() * 1.5 - 0.5,
        speedY: Math.random() * 1.2 + 0.8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.5,
        opacity: Math.random() * 0.4 + 0.5,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
      });
    }

    const drawPetal = (petal: Petal) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate((petal.rotation * Math.PI) / 180);

      ctx.beginPath();
      // Vẽ hình dạng cánh hoa anh đào (Sakura petal)
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        petal.size / 2,
        -petal.size / 2,
        petal.size,
        petal.size / 3,
        0,
        petal.size
      );
      ctx.bezierCurveTo(
        -petal.size,
        petal.size / 3,
        -petal.size / 2,
        -petal.size / 2,
        0,
        0
      );

      ctx.fillStyle = petal.color;
      ctx.shadowColor = 'rgba(255, 182, 193, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((petal) => {
        petal.y += petal.speedY;
        petal.x += Math.sin(petal.y * 0.01) * 0.8 + petal.speedX;
        petal.rotation += petal.rotationSpeed;

        // Reset lại khi cánh hoa bay ra ngoài màn hình
        if (petal.y > height + 20) {
          petal.y = -20;
          petal.x = Math.random() * width;
        }
        if (petal.x > width + 20) {
          petal.x = -20;
        } else if (petal.x < -20) {
          petal.x = width + 20;
        }

        drawPetal(petal);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      aria-hidden="true"
    />
  );
}
