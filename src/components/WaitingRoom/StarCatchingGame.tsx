"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";
import { soundManager } from "@/utils/sound";

interface Props {
  isTimeUp: boolean;
  targetScore?: number;
  onCompleteTransition?: () => void;
}

// Bảng màu pastel whimsical ngọt ngào chuẩn TikTok video
const STAR_COLORS = [
  "#FFF07C", // Butter Yellow
  "#FFEAA7", // Soft Cream Gold
  "#FF8E9E", // Candy Pink
  "#FFB6C1", // Sakura Blush
  "#7ED6DF", // Sky Pastel Blue
  "#A0E7E5", // Mint Pastel
  "#D5AAFF", // Dreamy Lavender
  "#FFBE76", // Soft Peach
  "#FFFFFF", // Pearl White
];

const FLOWER_CENTER_COLORS = [
  "#FF4D6D", // Rose Red
  "#FFA502", // Orange
  "#FF6B8B", // Hot Pink
  "#70A1FF", // Blue
  "#7BED9F", // Spring Green
  "#9B59B6", // Violet
];

// =========================================================================
// 🌸 CẤU HÌNH KÍCH THƯỚC HOA / SAO (BẠN CÓ THỂ CHỈNH TRỰC TIẾP TẠI ĐÂY)
// =========================================================================
export const FLOWER_SIZE_CONFIG = {
  // 1. Tỉ lệ phóng to/thu nhỏ hoa (1.0 = bình thường, 1.4 = to hơn 40%, 0.8 = nhỏ lại 20%)
  imageScale: 1.0,

  // 2. Kích thước hoa lúc bình thường (bán kính tính bằng pixel px: nhỏ nhất và lớn nhất)
  normalMinRadius: 25, // Hoa nhỏ nhất lúc rơi
  normalMaxRadius: 25, // Hoa to nhất lúc rơi

  // 3. Kích thước hoa trong thác hoa lúc 00:00 (to nhỏ đan xen tạo chiều sâu 3D)
  cascadeMinRadius: 55,
  cascadeMaxRadius: 66,
};

// =========================================================================
// 💣 CẤU HÌNH QUẢ MÌN & HIỆU ỨNG SÁNG 2S RỒI CHỚP
// =========================================================================
export const MINE_CONFIG = {
  // 1. Số điểm để bắt đầu xuất hiện mìn (40 điểm như bạn yêu cầu)
  triggerScore: 4,

  // 2. Tần suất mìn rơi: mỗi khoảng 2s rơi 1 trái mìn (2000ms)
  spawnIntervalMs: 2000,

  // 3. Mìn chỉ ăn được đúng 1 lần duy nhất trong toàn bộ ván chơi
  onlyEatOnce: true,

  // 4. Thời gian màn hình sáng trắng tinh giữ nguyên trước khi chớp (2.0 giây)
  solidWhiteDurationSec: 2.0,

  // 5. Thời gian chớp chớp giật sau khi sáng 2s (1.2 giây)
  flickerDurationSec: 1.2,

  // 6. Kích thước quả mìn (bán kính pixel)
  radius: 24,

  // 7. Tốc độ quả mìn rơi xuống
  fallSpeed: 2.3,
};

type StarType = "star4" | "star5" | "star8" | "starCandy" | "flower";

interface FallingMine {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  isTriggered: boolean;
  followPlayer?: boolean;
}

interface FallingStar {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  color: string;
  centerColor?: string;
  type: StarType;
  phase: number;
  opacity: number;
  customImgIndex?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function StarCatchingGame({
  isTimeUp,
  targetScore = 20,
  onCompleteTransition,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const hasReachedTargetRef = useRef(false);
  const targetScoreRef = useRef(targetScore);
  const onCompleteTransitionRef = useRef(onCompleteTransition);

  useEffect(() => {
    targetScoreRef.current = targetScore;
    onCompleteTransitionRef.current = onCompleteTransition;
  }, [targetScore, onCompleteTransition]);

  const streakRef = useRef(0);
  const [latestMsg, setLatestMsg] = useState<string | null>(null);
  const isTransitioning = isTimeUp;

  // Vị trí người chơi (chú cún + giỏ hứng sao)
  const playerPosRef = useRef({
    x: 0,
    targetX: 0,
    y: 0,
    width: 140,
    height: 160,
    squashY: 1,
  });

  const dogImgRef = useRef<HTMLImageElement | null>(null);
  const catOpenImgRef = useRef<HTMLImageElement | null>(null);
  const catClosedImgRef = useRef<HTMLImageElement | null>(null);
  const isMouthClosedRef = useRef(false);
  const mouthTimeoutRef = useRef<number | null>(null);
  const customFlowerImgsRef = useRef<HTMLImageElement[]>([]);
  const starsRef = useRef<FallingStar[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextStarId = useRef(1);
  const lastSpawnTime = useRef(0);
  const isTimeUpRef = useRef(isTimeUp);

  // 💣 State & Refs cho danh sách mìn rơi liên tục & hiệu ứng trắng tinh chớp chớp
  const mineImgRef = useRef<HTMLImageElement | null>(null);
  const minesRef = useRef<FallingMine[]>([]);
  const lastMineSpawnTimeRef = useRef<number>(0);
  const nextMineId = useRef<number>(1);
  const hasEatenMineRef = useRef<boolean>(false);
  const [isWhiteout, setIsWhiteout] = useState<boolean>(false);
  const isWhiteoutRef = useRef<boolean>(false);

  useEffect(() => {
    isTimeUpRef.current = isTimeUp;
    if (isTimeUp) {
      hasReachedTargetRef.current = true;
    }
  }, [isTimeUp]);

  // Load ảnh nhân vật & hoa & mìn trực tiếp (loại bỏ 70+ request 404 gây lag/nghẽn mạng)
  useEffect(() => {
    soundManager.preloadExplosionSound();

    // 1. Ảnh mèo há / ngậm miệng
    const catOpen = new Image();
    catOpen.src = "/custom-cat-open.png";
    catOpen.onload = () => {
      catOpenImgRef.current = catOpen;
    };

    const catClosed = new Image();
    catClosed.src = "/custom-cat-closed.png";
    catClosed.onload = () => {
      catClosedImgRef.current = catClosed;
    };

    // 2. Chú cún Schnauzer (fallback)
    const dogImg = new Image();
    dogImg.src = "/dog-layer-hd.png";
    dogImg.onload = () => {
      dogImgRef.current = dogImg;
    };

    // 3. Quét nạp trực tiếp danh sách hoa thực tế trong public
    const flowerFiles = [
      "/custom-flower-1.png",
      "/custom-flower-2.png",
      "/custom-flower-3.png",
      "/custom-flower-4.png",
      "/custom-flower-5.png",
      "/custom-flower-6.png",
    ];
    const loadedImgs: HTMLImageElement[] = [];
    flowerFiles.forEach((fileUrl) => {
      const img = new Image();
      img.src = fileUrl;
      img.onload = () => {
        loadedImgs.push(img);
        customFlowerImgsRef.current = loadedImgs;
      };
    });

    // 4. Ảnh quả mìn thực tế
    const mineImg = new Image();
    mineImg.src = "/custom-mine.png";
    mineImg.onload = () => {
      mineImgRef.current = mineImg;
    };
  }, []);

  // Vẽ quả mìn tròn đen bóng + tia lửa ngòi nổ
  const drawCanvasBomb = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Thân cầu đen bóng kim loại
    const grad = ctx.createRadialGradient(
      -r * 0.25,
      -r * 0.25,
      r * 0.1,
      0,
      0,
      r,
    );
    grad.addColorStop(0, "#69717D");
    grad.addColorStop(0.35, "#2D323B");
    grad.addColorStop(1, "#0F1115");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vệt sáng phản chiếu
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.ellipse(
      -r * 0.35,
      -r * 0.35,
      r * 0.28,
      r * 0.14,
      -Math.PI / 4,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // 3. Nắp ngòi nổ kim loại vàng đồng
    ctx.fillStyle = "#E5A65E";
    ctx.strokeStyle = "#8C5824";
    ctx.lineWidth = 1.5;
    ctx.fillRect(-r * 0.22, -r - 5, r * 0.44, 6);
    ctx.strokeRect(-r * 0.22, -r - 5, r * 0.44, 6);

    // 4. Dây cháy uốn cong
    ctx.strokeStyle = "#A67C52";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r - 5);
    ctx.quadraticCurveTo(r * 0.35, -r - 16, r * 0.45, -r - 24);
    ctx.stroke();

    // 5. Tia lửa ngòi nổ nhấp nháy lách tách
    ctx.fillStyle = "#FFF07C";
    ctx.beginPath();
    ctx.arc(r * 0.45, -r - 24, 6 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FF5722";
    ctx.beginPath();
    ctx.arc(r * 0.45, -r - 24, 3, 0, Math.PI * 2);
    ctx.fill();

    // 6. Biểu tượng cảnh báo nguy hiểm tam giác vàng
    ctx.fillStyle = "#FFF07C";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.28);
    ctx.lineTo(r * 0.28, r * 0.24);
    ctx.lineTo(-r * 0.28, r * 0.24);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0F1115";
    ctx.font = `bold ${Math.round(r * 0.32)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", 0, r * 0.06);

    ctx.restore();
  };

  // Vẽ sao 4 cánh mềm (✦)
  const draw4PointStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.closePath();
    ctx.fill();

    // Điểm sáng trung tâm
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Vẽ sao 5 cánh tròn trịa đáng yêu (★)
  const draw5PointRoundStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    const points = 5;
    const innerR = r * 0.48;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Điểm highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Vẽ hoa sao 5 cánh kẹo ngọt (Star-flower như trong video TikTok)
  const draw5PetalFlower = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    petalColor: string,
    centerColor: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    const petalCount = 5;
    const petalDist = r * 0.55;
    const petalRadius = r * 0.52;

    ctx.fillStyle = petalColor;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * 2 * Math.PI) / petalCount - Math.PI / 2;
      const px = Math.cos(angle) * petalDist;
      const py = Math.sin(angle) * petalDist;
      ctx.beginPath();
      ctx.arc(px, py, petalRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nhụy hoa rực rỡ ở giữa
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Điểm sáng trắng
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Vẽ sao 8 cánh thiên hà lấp lánh (✧)
  const draw8PointStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const radius = i % 2 === 0 ? r : i % 4 === 1 ? r * 0.38 : r * 0.22;
      const angle = (i * Math.PI) / 8 - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Vầng hào quang trắng sáng ở giữa
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Vẽ sao kẹo ngọt ngào pastel có má hồng & mắt cười đáng yêu
  const drawCuteStarWithFace = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Thân sao 5 cánh bầu bĩnh
    ctx.fillStyle = color;
    ctx.beginPath();
    const points = 5;
    const innerR = r * 0.52;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 2 mắt cười nhắm tít đáng yêu ^^
    ctx.strokeStyle = "#4A3222";
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.lineCap = "round";

    // Mắt trái
    ctx.beginPath();
    ctx.arc(-r * 0.22, -r * 0.06, r * 0.1, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Mắt phải
    ctx.beginPath();
    ctx.arc(r * 0.22, -r * 0.06, r * 0.1, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Má hồng đào phúng phính
    ctx.fillStyle = "rgba(255, 110, 140, 0.7)";
    ctx.beginPath();
    ctx.arc(-r * 0.32, r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.32, r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Đốm sáng trên trán
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.3, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Bắn hạt lấp lánh khi hứng trúng
  const spawnCatchParticles = useCallback(
    (x: number, y: number, color: string) => {
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 4.5;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 3 + Math.random() * 5,
          color: Math.random() > 0.4 ? color : "#FFFFFF",
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03,
        });
      }
    },
    [],
  );

  // 💥 KÍCH HOẠT NỔ MÌN NGAY LẬP TỨC (0ms LATENCY)
  const triggerExplosion = useCallback((x?: number, y?: number) => {
    hasEatenMineRef.current = true;
    minesRef.current = [];

    // 1. Phát âm thanh nổ NGAY LẬP TỨC (0ms không độ trễ từ Web Audio Buffer)
    soundManager.playMineExplosionSound();

    // 2. Kích hoạt màn hình sáng trắng NGAY LẬP TỨC
    isWhiteoutRef.current = true;
    setIsWhiteout(true);

    // 3. Mèo ngậm mồm
    isMouthClosedRef.current = true;
    if (mouthTimeoutRef.current !== null) {
      window.clearTimeout(mouthTimeoutRef.current);
    }
    mouthTimeoutRef.current = window.setTimeout(() => {
      isMouthClosedRef.current = false;
    }, 2000);

    // 4. Bắn tia lửa nổ rực rỡ
    const player = playerPosRef.current;
    const isCat =
      catOpenImgRef.current !== null || catClosedImgRef.current !== null;
    const catchY = isCat ? player.y + player.height * 0.38 : player.y + 15;
    const spawnX = x ?? player.x;
    const spawnY = y ?? catchY;

    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particlesRef.current.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 4 + Math.random() * 8,
        color:
          Math.random() > 0.4
            ? "#FFF07C"
            : Math.random() > 0.5
              ? "#FF5722"
              : "#FFFFFF",
        alpha: 1,
        decay: 0.02,
      });
    }
  }, []);

  const triggerExplosionRef = useRef(triggerExplosion);
  useEffect(() => {
    triggerExplosionRef.current = triggerExplosion;
  }, [triggerExplosion]);

  // Main Game Loop (Canvas 2D 60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      // Kích thước nhân vật (mèo hoặc cún) theo màn hình
      const isMobile = w < 640;
      const isCat =
        catOpenImgRef.current !== null || catClosedImgRef.current !== null;
      const pW = isMobile ? (isCat ? 120 : 110) : isCat ? 160 : 150;
      const pH = isCat ? pW * 1.06 : (pW * 860) / 712;
      playerPosRef.current.width = pW;
      playerPosRef.current.height = pH;
      playerPosRef.current.y = isMobile ? h - pH - 65 : h - pH - 50;

      if (playerPosRef.current.x === 0) {
        playerPosRef.current.x = w / 2;
        playerPosRef.current.targetX = w / 2;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // =========================================================================
    // 🔄 VÒNG LẶP RENDER CHÍNH
    // =========================================================================
    const render = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // Nếu đang trong trạng thái nổ mìn: phủ trắng tinh trực tiếp trên Canvas (0ms delay)
      if (isWhiteoutRef.current) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
      }

      const player = playerPosRef.current;
      player.x += (player.targetX - player.x) * 0.18;
      // Spring squash decay
      player.squashY += (1 - player.squashY) * 0.15;

      const isCascading = isTimeUpRef.current;

      // 0. SINH QUẢ MÌN KHI ĐẠT ĐỦ ĐIỂM (MỖI 2 GIÂY RƠI 1 TRÁI MÌN)
      // Mìn chỉ xuất hiện nếu chưa bị ăn (khi onlyEatOnce = true)
      if (
        scoreRef.current >= MINE_CONFIG.triggerScore &&
        !isCascading &&
        (!MINE_CONFIG.onlyEatOnce || !hasEatenMineRef.current)
      ) {
        if (now - lastMineSpawnTimeRef.current >= MINE_CONFIG.spawnIntervalMs) {
          lastMineSpawnTimeRef.current = now;
          // Vị trí mìn rơi: xen kẽ giữa rơi ngắm vào người chơi và rơi ngẫu nhiên
          const spawnX =
            Math.random() > 0.4
              ? Math.min(
                  w - 70,
                  Math.max(70, player.x + (Math.random() - 0.5) * 140),
                )
              : 50 + Math.random() * (w - 100);

          minesRef.current.push({
            id: nextMineId.current++,
            x: spawnX,
            y: -60,
            vx: (Math.random() - 0.5) * 0.4,
            vy: MINE_CONFIG.fallSpeed + (Math.random() - 0.5) * 0.3,
            radius: MINE_CONFIG.radius,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.05,
            isTriggered: false,
          });
        }
      }

      // 1. SINH NGÔI SAO CÁC LOẠI ĐA DẠNG CHO MÈO HỨNG ĂN (✦, ★, ✧, sao mắt cười, hoa sao)
      if (!isCascading) {
        if (now - lastSpawnTime.current > 330) {
          lastSpawnTime.current = now;
          const starTypeRand = Math.random();
          const type: StarType =
            starTypeRand < 0.28
              ? "star5"
              : starTypeRand < 0.52
                ? "star4"
                : starTypeRand < 0.72
                  ? "star8"
                  : starTypeRand < 0.88
                    ? "starCandy"
                    : "flower";

          const color =
            STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
          const centerColor =
            FLOWER_CENTER_COLORS[
              Math.floor(Math.random() * FLOWER_CENTER_COLORS.length)
            ];

          starsRef.current.push({
            id: nextStarId.current++,
            x: 30 + Math.random() * (w - 60),
            y: -35,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 2.2 + Math.random() * 1.6,
            radius: 20 + Math.random() * 8, // Kích thước ngôi sao lung linh vừa vặn
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.04,
            color,
            centerColor,
            type,
            phase: Math.random() * Math.PI * 2,
            opacity: 1,
          });
        }
      }

      // 2. CẬP NHẬT & VẼ CÁC NGÔI SAO
      const remainingStars: FallingStar[] = [];
      const isCat =
        catOpenImgRef.current !== null || catClosedImgRef.current !== null;
      // Miệng hứng sao: Nếu là mèo thì đớp trực tiếp bằng mồm (khoảng 38% từ đỉnh đầu xuống)
      const catchY = isCat ? player.y + player.height * 0.38 : player.y + 15;
      const catchRadius = player.width * 0.52;

      // 💣 1.5 CẬP NHẬT & VẼ CÁC QUẢ MÌN ĐANG RƠI (MỖI 2S RƠI 1 TRÁI)
      const remainingMines: FallingMine[] = [];

      for (const m of minesRef.current) {
        if (m.isTriggered) continue;

        if (m.followPlayer) {
          m.x = player.x;
        }

        m.y += m.vy;
        m.x += m.vx + Math.sin(now * 0.003 + m.id) * 0.5;
        m.rotation += m.vRot;

        // Kiểm tra mèo đớp phải mìn (mìn chỉ ăn được 1 lần duy nhất)
        // 💥 Chạm vào cái là nổ ngay lập tức 0ms (ngay khi đáy quả mìn chạm tới đỉnh đầu/miệng mèo)
        if (
          !isCascading &&
          (!MINE_CONFIG.onlyEatOnce || !hasEatenMineRef.current)
        ) {
          const distX = Math.abs(m.x - player.x);
          const isTouchingX = distX < catchRadius;
          // Đáy quả mìn (m.y + m.radius * 0.75) vừa chạm mép trên của miệng/đầu (catchY - 20)
          const isTouchingY =
            m.y + m.radius * 0.75 >= catchY - 20 && m.y <= catchY + 45;

          if (isTouchingX && isTouchingY) {
            m.isTriggered = true;
            triggerExplosionRef.current(m.x, m.y);
            break;
          }
        }

        // Vẽ quả mìn
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rotation);

        if (mineImgRef.current) {
          const img = mineImgRef.current;
          const aspect =
            img.naturalWidth && img.naturalHeight
              ? img.naturalWidth / img.naturalHeight
              : 1;
          const targetSize = m.radius * 2.4; // Kích thước hiển thị quả mìn rõ nét
          let drawW = targetSize;
          let drawH = targetSize;
          if (aspect > 1) {
            drawH = targetSize / aspect;
          } else {
            drawW = targetSize * aspect;
          }
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          drawCanvasBomb(ctx, 0, 0, m.radius);
        }
        ctx.restore();

        // Giữ lại mìn nếu chưa rơi khỏi đáy màn hình
        if (m.y <= h + 70) {
          remainingMines.push(m);
        }
      }

      if (hasEatenMineRef.current && MINE_CONFIG.onlyEatOnce) {
        minesRef.current = [];
      } else {
        minesRef.current = remainingMines;
      }

      for (const s of starsRef.current) {
        s.y += s.vy;
        s.x += s.vx + Math.sin(now * 0.003 + s.phase) * 0.8;
        s.rotation += s.vRot;

        // Kiểm tra hứng / đớp sao (chỉ kích hoạt khi chưa vào chế độ thác sao)
        if (!isCascading) {
          const distToCatch = Math.hypot(s.x - player.x, s.y - catchY);
          if (
            distToCatch < catchRadius &&
            s.y >= catchY - 25 &&
            s.y <= catchY + 45
          ) {
            // HỨNG / ĐỚP TRÚNG SAO!
            setScore((prev) => {
              const next = prev + 1;
              scoreRef.current = next;

              // ⭐ KHI ĂN ĐỦ 20 SAO: TỰ ĐỘNG CHUYỂN MÀN (THAY VÌ ĐẾM NGƯỢC THỜI GIAN)
              if (
                next >= targetScoreRef.current &&
                !hasReachedTargetRef.current
              ) {
                hasReachedTargetRef.current = true;
                soundManager.playKeypress(880);
                window.setTimeout(() => {
                  if (onCompleteTransitionRef.current) {
                    onCompleteTransitionRef.current();
                  }
                }, 350);
              }

              return next;
            });
            streakRef.current += 1;
            soundManager.playStarCatchSound(streakRef.current);
            player.squashY = 0.7; // Nhún mèo/cún vui sướng

            // 🐱 HIỆU ỨNG ĐỚP SAO NGẬM MỒM (KHI ĂN ĐƯỢC SAO THÌ NGẬM MỒM LẠI):
            isMouthClosedRef.current = true;
            if (mouthTimeoutRef.current !== null) {
              window.clearTimeout(mouthTimeoutRef.current);
            }
            mouthTimeoutRef.current = window.setTimeout(() => {
              isMouthClosedRef.current = false;
            }, 300); // Ngậm mồm trong 300ms rồi lại há mồm chờ sao tiếp theo!

            spawnCatchParticles(s.x, s.y, s.color);

            // Lời nhắn đáng yêu thỉnh thoảng hiện
            const wishes = isCat ? [] : [];
            setLatestMsg(wishes[Math.floor(Math.random() * wishes.length)]);
            continue; // Bỏ qua không vẽ sao này nữa
          }
        }

        // ⭐ VẼ NGÔI SAO CÁC LOẠI ĐA DẠNG (✦, ★, ✧, SAO MẮT CƯỜI, HOA SAO KẸO NGỌT)
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        const drawRadius = s.radius;
        if (s.type === "starCandy") {
          drawCuteStarWithFace(ctx, 0, 0, drawRadius, s.color);
        } else if (s.type === "star8") {
          draw8PointStar(ctx, 0, 0, drawRadius, s.color);
        } else if (s.type === "star4") {
          draw4PointStar(ctx, 0, 0, drawRadius, s.color);
        } else if (s.type === "flower") {
          draw5PetalFlower(ctx, 0, 0, drawRadius, s.color, s.centerColor || "#FF4D6D");
        } else {
          draw5PointRoundStar(ctx, 0, 0, drawRadius, s.color);
        }
        ctx.restore();

        // Giữ lại sao nếu chưa rơi khỏi đáy màn hình
        if (s.y < h + 60) {
          remainingStars.push(s);
        }
      }
      starsRef.current = remainingStars;

      // 3. CẬP NHẬT & VẼ CÁC HẠT BỤI SAO (PARTICLES)
      const activeParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // trọng lực nhẹ
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          activeParticles.push(p);
        }
      }
      particlesRef.current = activeParticles;

      // 4. VẼ NHÂN VẬT (CHÚ MÈO HÁ/NGẬM MỒM HOẶC CÚN SCHNAUZER)
      const hasCatActive =
        catOpenImgRef.current !== null || catClosedImgRef.current !== null;

      if (hasCatActive) {
        ctx.save();
        ctx.translate(player.x, player.y + player.height);
        ctx.scale(1, player.squashY);

        // Chọn ảnh mèo: Đang ngậm mồm khi vừa ăn sao hay đang há mồm chờ sao
        const catImg = isMouthClosedRef.current
          ? catClosedImgRef.current || catOpenImgRef.current
          : catOpenImgRef.current || catClosedImgRef.current;

        if (catImg) {
          const aspect =
            catImg.naturalWidth && catImg.naturalHeight
              ? catImg.naturalWidth / catImg.naturalHeight
              : 300 / 320;
          const drawW = player.width * 1.15;
          const drawH = drawW / aspect;

          ctx.drawImage(catImg, -drawW / 2, -drawH, drawW, drawH);

          // Khi đớp trúng sao (ngậm mồm): vẽ chữ Nom nom dễ thương
          if (isMouthClosedRef.current) {
            ctx.save();
            ctx.fillStyle = "#fff835";
            ctx.font = "bold 15px Caveat, cursive, sans-serif";
            ctx.fillText(" Nhom nhom", drawW * 0.22, -drawH * 0.6);
            ctx.restore();
          }
        }
        ctx.restore();
      } else if (dogImgRef.current) {
        ctx.save();
        ctx.translate(player.x, player.y + player.height);
        ctx.scale(1, player.squashY);

        // Hoa trang trí nhỏ gắn trên thành giỏ (dùng ảnh custom nếu có)
        const customList = customFlowerImgsRef.current;
        if (customList.length > 0) {
          const imgLeft = customList[0];
          const imgRight = customList[1] || customList[0];
          ctx.drawImage(imgLeft, -player.width * 0.28, -9, 16, 16);
          ctx.drawImage(imgRight, player.width * 0.18, -9, 16, 16);
        } else {
          draw5PetalFlower(
            ctx,
            -player.width * 0.24,
            -2,
            7,
            "#FFB6C1",
            "#FF4D6D",
          );
          draw5PetalFlower(
            ctx,
            player.width * 0.24,
            -2,
            7,
            "#A0E7E5",
            "#FFA502",
          );
        }

        ctx.restore();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isTimeUp, spawnCatchParticles]);

  // =========================================================================
  // 🎮 BỘ ĐIỀU KHIỂN: CHUỘT / CẢM ỨNG VUỐT / PHÍM
  // =========================================================================
  const handlePointerMove = (clientX: number) => {
    const w = window.innerWidth;
    const halfW = playerPosRef.current.width / 2;
    playerPosRef.current.targetX = Math.max(
      halfW,
      Math.min(w - halfW, clientX),
    );
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const step = 45;
      const w = window.innerWidth;
      const halfW = playerPosRef.current.width / 2;
      if (e.key === "ArrowLeft") {
        playerPosRef.current.targetX = Math.max(
          halfW,
          playerPosRef.current.targetX - step,
        );
      } else if (e.key === "ArrowRight") {
        playerPosRef.current.targetX = Math.min(
          w - halfW,
          playerPosRef.current.targetX + step,
        );
      }
    };

    // Bắt sự kiện chạm/bấm: nếu chạm trực tiếp trúng quả mìn trên màn hình -> Nổ tức thì 0ms
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in e && e.touches.length > 0
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
      const clientY =
        "touches" in e && e.touches.length > 0
          ? e.touches[0].clientY
          : (e as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;

      for (const m of minesRef.current) {
        if (
          !m.isTriggered &&
          Math.hypot(clientX - m.x, clientY - m.y) < m.radius * 1.5
        ) {
          m.isTriggered = true;
          triggerExplosionRef.current(m.x, m.y);
          break;
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full inset-0 overflow-hidden select-none touch-none ${isWhiteout ? "filter contrast-125" : ""}`}
    >
      {/* Canvas hứng sao 60fps */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-auto cursor-ew-resize"
      />

      {/* ========================================================================= */}
      {/* ⭐ ĐIỂM SỐ Ở GIỮA TRÊN ĐẦU TRANG (TIẾN ĐỘ ĂN ĐỦ 20 SAO ĐỂ CHUYỂN MÀN)   */}
      {/* ========================================================================= */}
      <div className={`absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <motion.div
          key={score}
          initial={{ scale: 0.85 }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex items-baseline gap-1.5 font-caveat font-extrabold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] tracking-wider"
        >
          <span className="text-5xl sm:text-6xl">
            {score}
          </span>
          <span className="text-3xl sm:text-4xl opacity-80">
            / {targetScore}
          </span>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* 💬 LỜI NHẮN NGỌT NGÀO KHI HỨNG TRÚNG SAO                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {latestMsg && !isTransitioning && (
          <motion.div
            key={latestMsg + score}
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-40 sm:bottom-48 left-1/2 -translate-x-1/2 z-30 bg-[#FFFDF9]/95 text-[#7A2838] px-4 py-1.5 rounded-full border border-pink-200 shadow-md font-caveat text-sm sm:text-base font-bold pointer-events-none whitespace-nowrap flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{latestMsg}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-400" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ========================================================================= */}
      {/* 💥 HIỆU ỨNG MÀN HÌNH SÁNG TRẮNG 2S RỒI MỚI CHỚP (KHI ĂN PHẢI MÌN)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWhiteout && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{
              // Sáng trắng tinh 100% giữ nguyên trong 2 giây (0 -> 62.5%), rồi sau đó mới chớp chớp giật liên tục
              opacity: [
                1,
                1,
                1, // 0 -> 2.0s: Sáng trắng tinh 100% tuyệt đối không chớp
                0.15,
                1,
                0.35,
                1,
                0.1,
                1,
                0.45,
                1,
                0.2,
                1,
                0, // 2.0s -> 3.2s: Chớp chớp mạnh rồi mờ dần
              ],
            }}
            transition={{
              duration:
                MINE_CONFIG.solidWhiteDurationSec +
                MINE_CONFIG.flickerDurationSec,
              times: [
                0,
                0.35,
                0.625, // Giai đoạn 1: 0s -> 2.0s (giữ nguyên trắng tinh)
                0.66,
                0.7,
                0.74,
                0.78,
                0.82,
                0.86,
                0.9,
                0.94,
                0.97,
                0.99,
                1, // Giai đoạn 2: 2.0s -> 3.2s (chớp chớp)
              ],
              ease: "easeInOut",
            }}
            onAnimationComplete={() => {
              isWhiteoutRef.current = false;
              setIsWhiteout(false);
            }}
            className="fixed inset-0 z-50 bg-white pointer-events-none flex flex-col items-center justify-center select-none"
          >
            {/* Lớp nền trắng tinh chói lòa */}
            <div className="absolute inset-0 bg-white" />

            {/* Quầng sáng nổ ở trung tâm */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1.1, 1.5, 1],
                opacity: [1, 0.8, 1, 0.6, 0],
              }}
              transition={{
                duration:
                  MINE_CONFIG.solidWhiteDurationSec +
                  MINE_CONFIG.flickerDurationSec,
                times: [0, 0.4, 0.625, 0.85, 1],
              }}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              <div className="w-40 h-40 rounded-full bg-yellow-200/90 blur-3xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
