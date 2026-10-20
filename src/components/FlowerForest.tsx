'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, ArrowRight, RotateCw, BookOpen, Eye, X } from 'lucide-react';
import { soundManager } from '@/utils/sound';

interface Props {
  onNext: () => void;
  onBackToCake?: () => void;
}

// ===================================================================
// BẢNG MÀU HOA HỒNG CAO CẤP (8 BẢNG MÀU PASTEL CHUẨN MẪU)
// Tỉ lệ ưu tiên sắc hồng phấn, hồng thắm, cam đào (~65%) xen kẽ kem, bạc hà, xanh ngọc, tím
// ===================================================================
export const ROSE_PALETTES = [
  {
    name: 'blushPink',
    c1: '#fff0f3', // Cánh ngoài nhạt nhất
    c2: '#fecdd3', // Cánh tầng 2
    c3: '#fb7185', // Cánh tầng 3
    c4: '#e11d48', // Cánh trong thắm
    c5: '#9f1239', // Tâm nhung
    stroke: '#be123c',
  },
  {
    name: 'sweetRose',
    c1: '#fdf2f8',
    c2: '#fce7f3',
    c3: '#f472b6',
    c4: '#db2777',
    c5: '#9d174d',
    stroke: '#be185d',
  },
  {
    name: 'softCoral',
    c1: '#fff1f2',
    c2: '#ffe4e6',
    c3: '#fda4af',
    c4: '#f43f5e',
    c5: '#9f1239',
    stroke: '#e11d48',
  },
  {
    name: 'apricotPeach',
    c1: '#fff7ed',
    c2: '#fed7aa',
    c3: '#fdba74',
    c4: '#fb923c',
    c5: '#c2410c',
    stroke: '#ea580c',
  },
  {
    name: 'butterCream',
    c1: '#fefce8',
    c2: '#fef9c3',
    c3: '#fde047',
    c4: '#eab308',
    c5: '#a16207',
    stroke: '#ca8a04',
  },
  {
    name: 'mintGreen',
    c1: '#f0fdf4',
    c2: '#dcfce7',
    c3: '#86efac',
    c4: '#22c55e',
    c5: '#15803d',
    stroke: '#16a34a',
  },
  {
    name: 'skyBlue',
    c1: '#f0f9ff',
    c2: '#e0f2fe',
    c3: '#7dd3fc',
    c4: '#0284c7',
    c5: '#075985',
    stroke: '#0369a1',
  },
  {
    name: 'lavenderLilac',
    c1: '#faf5ff',
    c2: '#f3e8ff',
    c3: '#d8b4fe',
    c4: '#a855f7',
    c5: '#6b21a8',
    stroke: '#7e22ce',
  },
];

// Trọng số phân bổ màu: 65% tông hồng / đào, 35% màu phối dịu mắt
const PALETTE_WEIGHTS = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 0, 1, 3];

type FlowerType = 'rose' | 'bud';

interface FlowerData {
  id: number;
  x: number; // Tọa độ ngang (%)
  heightPct: number; // Chiều cao cành vươn lên (% màn hình, tối đa 68% = 2/3 màn hình)
  flowerSize: number; // Kích thước đóa hoa (px)
  paletteIndex: number;
  type: FlowerType;
  swayDuration: number;
  swayDelay: number;
  swayDeg: number;
  growDelay: number;
  stemCurve: number;
  layer: 'ground' | 'low' | 'midLow' | 'mid' | 'midHigh' | 'canopy';
  zIndex: number;
  brightnessFilter: string;
}

// Hoa đặt trực tiếp sát mép dưới cùng màn hình (bao gồm cả đáy màn hình)
interface GroundBorderRose {
  id: number;
  x: number; // Tọa độ ngang (%)
  bottomOffsetPx: number; // Đặt sát mép dưới cùng (-12px đến 18px)
  size: number;
  paletteIndex: number;
  swayDelay: number;
  growDelay: number;
  zIndex: number;
}

export default function FlowerForest({ onNext, onBackToCake }: Props) {
  // Trạng thái thiệp chúc mừng: Mặc định KHÔNG tự động mở để người dùng ngắm trọn vẹn rừng hoa
  const [showLetter, setShowLetter] = useState<boolean>(false);
  const [gardenCycle, setGardenCycle] = useState<number>(0);

  // ===================================================================
  // 1. SINH DỮ LIỆU RỪNG HOA CHI TIẾM 2/3 MÀN HÌNH (135 ĐÓA HOA CÓ CÀNH)
  // Chiều cao phân bố từ 12% đến 68% (chuẩn xác 2/3 màn hình), không có bông nào cao vượt trội hẳn
  // ===================================================================
  const flowers: FlowerData[] = useMemo(() => {
    const list: FlowerData[] = [];
    const layerConfigs: Array<{
      name: 'ground' | 'low' | 'midLow' | 'mid' | 'midHigh' | 'canopy';
      count: number;
      z: number;
      hMin: number;
      hMax: number;
      sMin: number;
      sMax: number;
      brightness: string;
    }> = [
      { name: 'ground',  count: 22, z: 8,  hMin: 12, hMax: 24, sMin: 38, sMax: 50, brightness: 'brightness(1.05) saturate(0.92)' },
      { name: 'low',     count: 25, z: 12, hMin: 22, hMax: 36, sMin: 44, sMax: 56, brightness: 'brightness(1.03) saturate(0.95)' },
      { name: 'midLow',  count: 26, z: 16, hMin: 34, hMax: 48, sMin: 48, sMax: 62, brightness: 'none' },
      { name: 'mid',     count: 25, z: 20, hMin: 44, hMax: 57, sMin: 54, sMax: 68, brightness: 'none' },
      { name: 'midHigh', count: 22, z: 24, hMin: 52, hMax: 64, sMin: 60, sMax: 76, brightness: 'none' },
      { name: 'canopy',  count: 18, z: 28, hMin: 58, hMax: 68, sMin: 64, sMax: 82, brightness: 'none' },
    ];

    let idCounter = 0;
    layerConfigs.forEach((lc) => {
      for (let i = 0; i < lc.count; i++) {
        const step = 100 / lc.count;
        const jitter = Math.sin(idCounter * 3.7 + 0.5) * step * 0.48;
        const x = Math.min(99.2, Math.max(0.8, i * step + step * 0.5 + jitter));

        const heightPct = lc.hMin + ((idCounter * 17 + 3) % (lc.hMax - lc.hMin + 1));
        const flowerSize = lc.sMin + ((idCounter * 13 + 5) % (lc.sMax - lc.sMin + 1));

        // Phân bổ 85% hoa hồng nở đa tầng, 15% nụ hoa vươn cao
        const typeSeed = (idCounter * 7 + 3) % 20;
        const type: FlowerType = typeSeed < 3 ? 'bud' : 'rose';

        const paletteIndex = PALETTE_WEIGHTS[(idCounter * 3 + 1) % PALETTE_WEIGHTS.length];
        const stemCurve = ((idCounter * 11 + 2) % 26) - 13;

        const swayDuration = 2.8 + ((idCounter * 3 + 1) % 15) * 0.12;
        const swayDelay = ((idCounter * 7 + 2) % 22) * 0.09;
        const swayDeg = (idCounter % 2 === 0 ? 1 : -1) * (1.2 + ((idCounter * 2 + 1) % 5) * 0.3);

        // Nở so le mượt mà trong vòng 1.2s từ khi vào màn hình
        const growDelay = 0.04 + ((idCounter * 13 + 5) % 45) * 0.026;

        list.push({
          id: idCounter++,
          x,
          heightPct: type === 'bud' ? Math.min(68, heightPct + 5) : heightPct,
          flowerSize: type === 'bud' ? Math.round(flowerSize * 0.55) : flowerSize,
          paletteIndex,
          type,
          swayDuration,
          swayDelay,
          swayDeg,
          growDelay,
          stemCurve,
          layer: lc.name,
          zIndex: lc.z,
          brightnessFilter: lc.brightness,
        });
      }
    });

    return list.sort((a, b) => a.zIndex - b.zIndex);
  }, []);

  // ===================================================================
  // 2. LỚP HOA KHỔNG LỒ PHỦ KÍN MÉP DƯỚI CÙNG MÀN HÌNH (24 ĐÓA HOA ĐÁY)
  // Đảm bảo mép dưới cùng màn hình 100% là hoa nở và lá xanh mướt, không có khoảng hở
  // ===================================================================
  const groundRoses: GroundBorderRose[] = useMemo(() => {
    const list: GroundBorderRose[] = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const step = 100 / count;
      const x = Math.min(99.5, Math.max(0.5, i * step + (step * 0.5) + (Math.sin(i * 2.8) * step * 0.35)));
      const bottomOffsetPx = -10 + ((i * 7) % 24); // Nằm sát ngay mép đáy màn hình
      const size = 62 + ((i * 11) % 32); // Kích thước to (62px - 94px)
      const paletteIndex = PALETTE_WEIGHTS[(i * 5 + 2) % PALETTE_WEIGHTS.length];
      const swayDelay = (i * 0.15) % 2;
      const growDelay = 0.3 + ((i * 9) % 20) * 0.04;

      list.push({
        id: i,
        x,
        bottomOffsetPx,
        size,
        paletteIndex,
        swayDelay,
        growDelay,
        zIndex: 32 + (i % 2),
      });
    }
    return list;
  }, []);

  // Âm thanh nở hoa & pháo hoa giấy chúc mừng
  useEffect(() => {
    soundManager.playFlowerBloomSound();
    confetti({
      particleCount: 65,
      spread: 95,
      origin: { y: 0.72 },
      colors: ['#fda4af', '#f472b6', '#fbcfe8', '#fecdd3', '#fce7f3', '#fecaca'],
    });
  }, [gardenCycle]);

  // Cho hoa nở lại từ đầu
  const handleReplayGarden = useCallback(() => {
    soundManager.playFlowerBloomSound();
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.78 },
      colors: ['#fda4af', '#f472b6', '#fbcfe8', '#fecdd3'],
    });
    setGardenCycle((prev) => prev + 1);
  }, []);

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none flex flex-col items-center justify-between">
      {/* =================================================================== */}
      {/* 0. BỘ LỌC ĐỔ BÓNG SVG DÙNG CHUNG (TỐI ƯU HIỆU NĂNG 60FPS)            */}
      {/* =================================================================== */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {ROSE_PALETTES.map((p) => (
            <React.Fragment key={`defs-rose-${p.name}`}>
              <filter id={`rose-sh-${p.name}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="0.9" floodColor={p.stroke} floodOpacity="0.28" />
              </filter>
              <linearGradient id={`bud-grad-${p.name}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor={p.c1} />
                <stop offset="70%" stopColor={p.c2} />
                <stop offset="100%" stopColor={p.c4} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
      </svg>

      {/* =================================================================== */}
      {/* 1. PHÔNG NỀN HỒNG PHẤN PASTEL DỊU DÀNG, LÃNG MẠN (THEO YÊU CẦU)     */}
      {/* =================================================================== */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[#fff0f4] via-[#fde4ec] to-[#f9c2d3]" />

      {/* Ánh sáng mây hồng trắng mờ ảo phía sau */}
      <div className="absolute inset-0 -z-20 pointer-events-none opacity-45">
        <div className="absolute top-[4%] left-[6%] w-84 h-28 rounded-full bg-white/70 blur-2xl" />
        <div className="absolute top-[12%] right-[5%] w-[28rem] h-36 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute top-[26%] left-[28%] w-96 h-32 rounded-full bg-white/50 blur-2xl" />
      </div>

      {/* Cánh hoa hồng rơi lất phất trong không gian hồng phấn */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={`falling-petal-${i}`}
            initial={{
              y: -30,
              x: `${(i * 7.5) % 100}%`,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: ['0vh', '105vh'],
              x: [`${(i * 7.5) % 100}%`, `${((i * 7.5) % 100) + (i % 2 === 0 ? 12 : -12)}%`],
              rotate: [0, 360 + i * 45],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: 8 + (i % 4) * 1.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
            className="absolute"
          >
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{
                background:
                  i % 3 === 0
                    ? 'radial-gradient(circle, #fecdd3 0%, #fb7185 100%)'
                    : i % 3 === 1
                    ? 'radial-gradient(circle, #ffedd5 0%, #fb923c 100%)'
                    : 'radial-gradient(circle, #ffe4e6 0%, #f43f5e 100%)',
                borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* 2. DÒNG TIÊU ĐỀ THANH LỊCH TRÊN CÙNG */}
      <header className="relative z-30 pt-4 sm:pt-6 px-4 text-center max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-pink-200/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-stone-700">
              Rừng hoa hồng nở rộ chúc mừng sinh nhật em 🌸
            </span>
          </div>
        </motion.div>
      </header>

      {/* =================================================================== */}
      {/* 3. THẢM HOA HỒNG CHIẾM 2/3 MÀN HÌNH & PHỦ KÍN MÉP ĐÁY DƯỚI CÙNG     */}
      {/* =================================================================== */}
      <div
        key={`garden-${gardenCycle}`}
        className="relative w-full flex-1 flex items-end justify-center pointer-events-none overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* A. 135 ĐÓA HOA CÓ CÀNH LÁ VƯƠN CAO CHIẾM 2/3 MÀN HÌNH */}
          {flowers.map((fl) => {
            const pal = ROSE_PALETTES[fl.paletteIndex];
            return (
              <div
                key={`flower-${fl.id}`}
                style={{
                  position: 'absolute',
                  left: `${fl.x}%`,
                  bottom: 0,
                  height: `${fl.heightPct}%`, // Chiều cao tối đa 68% = 2/3 màn hình
                  width: `${fl.flowerSize + 6}px`,
                  transform: 'translateX(-50%)',
                  zIndex: fl.zIndex,
                  filter: fl.brightnessFilter,
                }}
              >
                {/* Khối lắc lư theo gió tự nhiên */}
                <div
                  style={
                    {
                      width: '100%',
                      height: '100%',
                      transformOrigin: 'bottom center',
                      animation: `gardenSway ${fl.swayDuration}s ease-in-out infinite alternate`,
                      animationDelay: `${fl.swayDelay}s`,
                      '--sway-angle': `${fl.swayDeg}deg`,
                    } as React.CSSProperties
                  }
                  className="flex flex-col items-center justify-between"
                >
                  {/* ĐÓA HOA HỒNG NỞ TRÊN ĐỈNH */}
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: [0, 1.12, 1], rotate: 0 }}
                    transition={{
                      duration: 0.85,
                      delay: fl.growDelay + 0.32,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative z-20 flex items-center justify-center -mb-2"
                    style={{
                      width: `${fl.flowerSize}px`,
                      height: `${fl.flowerSize}px`,
                    }}
                  >
                    {fl.type === 'rose' && (
                      <BotanicalEnglishRose size={fl.flowerSize} palette={pal} />
                    )}
                    {fl.type === 'bud' && (
                      <SlenderTeardropBud size={fl.flowerSize} palette={pal} />
                    )}
                  </motion.div>

                  {/* THÂN CÀNH VÀ LÁ MỌC VÚT LÊN TỪ ĐÁY */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.88,
                      delay: fl.growDelay,
                      ease: 'easeOut',
                    }}
                    style={{ transformOrigin: 'bottom center' }}
                    className="relative w-full flex-1 flex justify-center overflow-visible"
                  >
                    <svg
                      width={Math.max(42, fl.flowerSize)}
                      height="100%"
                      viewBox="0 0 60 300"
                      preserveAspectRatio="none"
                      className="overflow-visible"
                    >
                      {/* Thân cành */}
                      <path
                        d={`M 30 300 Q ${30 + fl.stemCurve} 150 30 0`}
                        fill="none"
                        stroke={fl.zIndex < 15 ? '#22c55e' : '#15803d'}
                        strokeWidth={fl.zIndex < 15 ? '2.6' : '3.4'}
                        strokeLinecap="round"
                      />
                      {/* Lá trái với gân lá */}
                      <path
                        d="M 30 155 Q 10 138 4 115 Q 16 128 30 148"
                        fill="#16a34a"
                        stroke="#14532d"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M 30 148 Q 18 135 8 120"
                        fill="none"
                        stroke="#14532d"
                        strokeWidth="0.5"
                        opacity="0.6"
                      />
                      {/* Lá phải với gân lá */}
                      <path
                        d="M 30 225 Q 50 208 56 185 Q 44 198 30 218"
                        fill="#15803d"
                        stroke="#14532d"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M 30 218 Q 42 205 52 190"
                        fill="none"
                        stroke="#14532d"
                        strokeWidth="0.5"
                        opacity="0.6"
                      />
                      {/* Lá phụ cho hoa lớn */}
                      {fl.flowerSize > 55 && (
                        <path
                          d="M 30 95 Q 16 85 10 70 Q 20 78 30 90"
                          fill="#22c55e"
                          stroke="#14532d"
                          strokeWidth="0.7"
                        />
                      )}
                    </svg>
                  </motion.div>
                </div>
              </div>
            );
          })}

          {/* B. 24 HOA HỒNG LỚN NỞ SÁT MÉP ĐÁY DƯỚI CÙNG (KHÔNG ĐỂ LỘ KHOẢNG TRỐNG ĐÁY) */}
          {groundRoses.map((gr) => {
            const pal = ROSE_PALETTES[gr.paletteIndex];
            return (
              <motion.div
                key={`ground-rose-${gr.id}`}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.1, 1], rotate: 0 }}
                transition={{
                  duration: 0.8,
                  delay: gr.growDelay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: 'absolute',
                  left: `${gr.x}%`,
                  bottom: `${gr.bottomOffsetPx}px`,
                  transform: 'translateX(-50%)',
                  zIndex: gr.zIndex,
                  width: `${gr.size}px`,
                  height: `${gr.size}px`,
                }}
              >
                <div
                  style={{
                    animation: `gardenSway 3.2s ease-in-out infinite alternate`,
                    animationDelay: `${gr.swayDelay}s`,
                    '--sway-angle': '1.5deg',
                  } as React.CSSProperties}
                >
                  <BotanicalEnglishRose size={gr.size} palette={pal} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Lớp bóng đổ xanh ngọc & lá xanh ôm trọn chân đáy màn hình */}
        <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-30 bg-gradient-to-t from-[#15803d]/30 via-[#16a34a]/10 to-transparent" />
      </div>

      {/* =================================================================== */}
      {/* 4. TẤM THIỆP CHÚC MỪNG (CHỈ MỞ KHI BẤM NÚT 'ĐỌC LẠI THIỆP')         */}
      {/* =================================================================== */}
      <AnimatePresence>
        {showLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-md rounded-[28px] bg-gradient-to-b from-[#fffefc]/95 via-[#fff8f9]/95 to-[#fff2f5]/95 p-6 sm:p-7 text-center shadow-[0_20px_60px_rgba(244,114,182,0.35)] border-2 border-pink-200/90 overflow-hidden"
            >
              {/* Nút đóng góc phải */}
              <button
                type="button"
                onClick={() => setShowLetter(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-pink-100/60 transition-colors cursor-pointer"
                title="Đóng thiệp"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Trang trí góc */}
              <div className="absolute top-3 left-3 text-xs opacity-60">🌸</div>
              <div className="absolute bottom-3 left-3 text-xs opacity-60">🌿</div>
              <div className="absolute bottom-3 right-3 text-xs opacity-60">💖</div>

              {/* Huy hiệu đỉnh thiệp */}
              <div className="flex justify-center -mt-1 mb-2">
                <span className="px-3.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-200/80 shadow-2xs">
                  Gửi bạn thương mến 🌸
                </span>
              </div>

              {/* Tiêu đề chính bức thư */}
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-800 tracking-tight leading-snug">
                Mong những điều đẹp đẽ<br />luôn nở bên bạn.
              </h3>

              {/* Nội dung lời chúc ý nghĩa */}
              <div className="mt-3.5 text-xs sm:text-[13px] text-stone-600 leading-relaxed space-y-2.5 font-medium px-1 sm:px-2">
                <p>
                  Mỗi bông hoa có thể tàn một ngày không đẹp. Còn bạn, làm thế giới này dịu dàng hơn.
                </p>
                <p className="p-2.5 rounded-xl bg-pink-100/60 border border-pink-200/60 text-stone-700 font-semibold text-xs">
                  Nhân ngày sinh nhật 16/11, chúc bạn luôn được yêu thương, trân trọng và có thật nhiều niềm vui. Không bao giờ phải cô đơn trong bất kỳ hành trình nào, hãy cứ tự tin theo đuổi những điều bạn yêu.
                </p>
                <p className="italic text-stone-500 text-[11px]">
                  Hôm nay và cả những ngày sau, hãy cứ rạng rỡ theo cách riêng của mình nhé.
                </p>
              </div>

              {/* Lời kết ngọt ngào */}
              <div className="mt-3 pt-2 border-t border-pink-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                <span>Gửi bạn thật nhiều thương yêu ♡</span>
                <span className="font-bold text-rose-500">ngàn đóa hoa</span>
              </div>

              {/* Các nút bấm tương tác */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowLetter(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-pink-500" />
                  <span>Ngắm rừng hoa 🌸</span>
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:brightness-105 text-white text-xs font-bold shadow-md shadow-pink-300/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                  <span>Mở 3 Hộp Quà Bí Mật</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* 5. NÚT ĐIỀU KHIỂN DƯỚI ĐÁY CHUẨN XÁC THEO ẢNH MẪU                   */}
      {/* =================================================================== */}
      <footer className="relative z-40 pb-5 px-4 flex flex-wrap items-center justify-center gap-2.5 max-w-lg w-full">
        {/* Nút 'Đọc lại thiệp' */}
        <button
          type="button"
          onClick={() => setShowLetter(true)}
          className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-md shadow-black/10 border border-white/80 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Mở thiệp chúc mừng sinh nhật"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-500" />
          <span>Đọc lại thiệp</span>
        </button>

        {/* Nút 'Cho hoa nở lại' */}
        <button
          type="button"
          onClick={handleReplayGarden}
          className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-md shadow-black/10 border border-white/80 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Xem lại hiệu ứng hoa mọc từ đầu"
        >
          <RotateCw className="w-3.5 h-3.5 text-sky-500" />
          <span>Cho hoa nở lại</span>
        </button>

        {/* Nút xem lại bánh kem */}
        {onBackToCake && (
          <button
            type="button"
            onClick={onBackToCake}
            className="px-3.5 py-2 rounded-full bg-white/80 hover:bg-white text-stone-600 text-xs font-semibold shadow-xs border border-pink-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>🎂</span>
            <span>Xem lại bánh kem</span>
          </button>
        )}

        {/* Nút chuyển tiếp sang Mở 3 Chiếc Hộp Bí Mật */}
        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-400/40 flex items-center gap-1.5 hover:brightness-105 active:scale-95 cursor-pointer transition-all"
        >
          <Gift className="w-3.5 h-3.5 text-amber-200" />
          <span>Mở 3 Chiếc Hộp Bí Mật</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </footer>

      {/* Global CSS keyframes cho hiệu ứng đung đưa cành hoa mượt mà */}
      <style jsx global>{`
        @keyframes gardenSway {
          0% {
            transform: rotate(calc(-1 * var(--sway-angle, 2deg)));
          }
          100% {
            transform: rotate(var(--sway-angle, 2deg));
          }
        }
      `}</style>
    </div>
  );
}

// ===================================================================
// HOA HỒNG ANH QUỐC NỞ ĐA TẦNG CÁNH UỐN LƯỢN (BOTANICAL ENGLISH ROSE)
// Thiết kế tinh tế, không bị thô: Cánh hoa vỏ sò mềm mại, xếp đan xen so le,
// có lá xanh lấp ló viền ngoài và lõi xoắn ốc hoa hồng đặc trưng
// ===================================================================

interface FlowerHeadProps {
  size: number;
  palette: (typeof ROSE_PALETTES)[0];
}

function BotanicalEnglishRose({ size, palette }: FlowerHeadProps) {
  const { c1, c2, c3, c4, c5, stroke } = palette;

  // 6 tầng cánh từ ngoài vào trong: Cánh rộng cuộn hình vỏ sò, có nếp hõm nhẹ ở giữa cánh hoa hồng
  const layers = [
    { n: 7, rOut: 48, rIn: 28, dip: 3.5, spread: 0.68, fill: c1, strokeW: 0.75, rot: 0 },
    { n: 7, rOut: 42, rIn: 22, dip: 3.0, spread: 0.65, fill: c2, strokeW: 0.70, rot: 0.42 },
    { n: 6, rOut: 35, rIn: 17, dip: 2.6, spread: 0.66, fill: c1, strokeW: 0.65, rot: 0.88 },
    { n: 6, rOut: 28, rIn: 13, dip: 2.2, spread: 0.64, fill: c3, strokeW: 0.60, rot: 1.35 },
    { n: 5, rOut: 21, rIn: 9,  dip: 1.8, spread: 0.66, fill: c4, strokeW: 0.55, rot: 1.85 },
    { n: 5, rOut: 15, rIn: 6,  dip: 1.4, spread: 0.68, fill: c4, strokeW: 0.50, rot: 2.38 },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-xs">
      {/* Lá xanh lấp ló quanh viền cánh ngoài cùng tạo nét tự nhiên sống động */}
      <g filter={`url(#rose-sh-${palette.name})`}>
        <path d="M 50 50 C 35 70 12 72 2 62 C 10 50 30 48 50 50 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.7" />
        <path d="M 50 50 C 65 70 88 72 98 62 C 90 50 70 48 50 50 Z" fill="#16a34a" stroke="#14532d" strokeWidth="0.7" />
        <path d="M 50 50 C 60 25 80 12 88 20 C 82 32 68 40 50 50 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.7" />
      </g>

      {/* 6 tầng cánh hoa xếp so le xoắn ốc */}
      {layers.map((layer, lIdx) => {
        let d = '';
        let foldLines = '';
        const count = layer.n;
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
          const aMid = i * angleStep + layer.rot;
          const aLeft = aMid - angleStep * layer.spread;
          const aRight = aMid + angleStep * layer.spread;

          const aPeakL = aMid - angleStep * 0.26;
          const aPeakR = aMid + angleStep * 0.26;

          // Điểm neo trong
          const bx1 = 50 + layer.rIn * Math.cos(aLeft);
          const by1 = 50 + layer.rIn * Math.sin(aLeft);

          const bx2 = 50 + layer.rIn * Math.cos(aRight);
          const by2 = 50 + layer.rIn * Math.sin(aRight);

          // Điểm đỉnh cánh hoa uốn lượn
          const pxL = 50 + layer.rOut * Math.cos(aPeakL);
          const pyL = 50 + layer.rOut * Math.sin(aPeakL);

          const pxDip = 50 + (layer.rOut - layer.dip) * Math.cos(aMid);
          const pyDip = 50 + (layer.rOut - layer.dip) * Math.sin(aMid);

          const pxR = 50 + layer.rOut * Math.cos(aPeakR);
          const pyR = 50 + layer.rOut * Math.sin(aPeakR);

          d += `M ${bx1.toFixed(1)} ${by1.toFixed(1)} ` +
            `C ${bx1.toFixed(1)} ${by1.toFixed(1)} ${pxL.toFixed(1)} ${pyL.toFixed(1)} ${pxDip.toFixed(1)} ${pyDip.toFixed(1)} ` +
            `C ${pxDip.toFixed(1)} ${pyDip.toFixed(1)} ${pxR.toFixed(1)} ${pyR.toFixed(1)} ${bx2.toFixed(1)} ${by2.toFixed(1)} ` +
            `Q 50 50 ${bx1.toFixed(1)} ${by1.toFixed(1)} Z `;

          foldLines += `M ${pxDip.toFixed(1)} ${pyDip.toFixed(1)} Q 50 50 ${((bx1 + bx2) / 2).toFixed(1)} ${((by1 + by2) / 2).toFixed(1)} `;
        }

        return (
          <g key={`rose-layer-${lIdx}`} filter={`url(#rose-sh-${palette.name})`}>
            <path d={d} fill={layer.fill} stroke={stroke} strokeWidth={layer.strokeW} strokeLinejoin="round" />
            <path d={foldLines} fill="none" stroke="#ffffff" strokeWidth="0.45" strokeLinecap="round" opacity="0.4" />
          </g>
        );
      })}

      {/* Tâm hoa hồng cuộn chặt (Rose Bud Core) */}
      <g filter={`url(#rose-sh-${palette.name})`}>
        {/* Vỏ bao nhụy */}
        <path d="M 43 49 C 41 42 47 37 54 39 C 60 41 60 48 57 53 C 53 58 45 57 43 49 Z" fill={c4} stroke={stroke} strokeWidth="0.55" />
        {/* Cánh cuộn trăng khuyết 1 */}
        <path d="M 46 47 C 45 42 51 40 55 42 C 58 44 57 49 54 51 C 51 53 47 52 46 47 Z" fill={c5} stroke={stroke} strokeWidth="0.55" />
        {/* Cánh cuộn trăng khuyết 2 */}
        <path d="M 48 46 C 48 43 52 42 54 44 C 55 46 54 49 52 50 C 50 50 48 49 48 46 Z" fill={c4} stroke={stroke} strokeWidth="0.5" />
        {/* Nét uốn xoắn ốc highlight tinh tế */}
        <path d="M 52 43 C 55 44 55 47 53 49 C 51 51 49 49 49 47 C 49 45 52 44 53 45" fill="none" stroke="#ffffff" strokeWidth="0.85" strokeLinecap="round" opacity="0.85" />
      </g>
    </svg>
  );
}

// ===================================================================
// NỤ HOA HỒNG GIỌT NƯỚC THANH MẢNH TRÊN ĐÀI XANH (SLENDER TEARDROP BUD)
// ===================================================================

function SlenderTeardropBud({ size, palette }: FlowerHeadProps) {
  const { stroke, c1 } = palette;
  const w = size * 0.72;
  const h = size * 1.15;

  return (
    <svg width={w} height={h} viewBox="0 0 60 90" className="overflow-visible drop-shadow-xs">
      {/* Thân búp hoa giọt nước chuyển màu mượt mà */}
      <path
        d="M 30 10 C 15 28 12 55 30 72 C 48 55 45 28 30 10 Z"
        fill={`url(#bud-grad-${palette.name})`}
        stroke={stroke}
        strokeWidth="0.75"
        filter={`url(#rose-sh-${palette.name})`}
      />
      {/* Nếp gấp gân nụ hoa */}
      <path d="M 30 10 Q 32 40 30 72" fill="none" stroke={stroke} strokeWidth="0.65" opacity="0.5" />
      <path d="M 30 72 C 22 62 18 45 22 30" fill="none" stroke={c1} strokeWidth="1.1" opacity="0.6" />
      {/* Đài hoa xanh ôm giữ gốc búp */}
      <path d="M 30 72 C 24 74 16 68 14 54 C 18 64 24 68 30 72 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.65" />
      <path d="M 30 72 C 36 74 44 68 46 54 C 42 64 36 68 30 72 Z" fill="#16a34a" stroke="#14532d" strokeWidth="0.65" />
      <path d="M 30 70 L 30 84" stroke="#15803d" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
