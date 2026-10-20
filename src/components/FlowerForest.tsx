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

// Bảng màu hoa giấy Origami/Paper-cut pastel chuẩn xác theo ảnh mẫu
export const FLOWER_PALETTES = [
  {
    name: 'pink',
    l1: '#fecdd3', // Hồng phấn nhạt viền ngoài
    l2: '#f472b6', // Hồng tươi
    l3: '#fb7185', // Hồng cánh sen
    l4: '#e11d48', // Hồng thắm
    l5: '#be123c', // Lõi đỏ nhung
    stroke: '#9f1239', // Nét viền đậm tương phản
    shadow: 'rgba(159,18,57,0.32)',
  },
  {
    name: 'green',
    l1: '#dcfce7', // Xanh bơ / bạc hà pastel
    l2: '#86efac', // Xanh nõn
    l3: '#4ade80', // Xanh lá non
    l4: '#22c55e', // Xanh tươi
    l5: '#16a34a', // Lõi xanh đậm
    stroke: '#15803d', // Nét viền lá
    shadow: 'rgba(21,128,61,0.32)',
  },
  {
    name: 'blue',
    l1: '#e0f2fe', // Xanh da trời pastel
    l2: '#7dd3fc', // Xanh ngọc
    l3: '#38bdf8', // Xanh cerulean
    l4: '#0284c7', // Xanh đậm
    l5: '#0369a1', // Lõi xanh biển sâu
    stroke: '#075985', // Nét viền xanh
    shadow: 'rgba(7,89,133,0.32)',
  },
  {
    name: 'peach',
    l1: '#ffedd5', // Cam đào pastel
    l2: '#fdba74', // Cam mơ dịu
    l3: '#fb923c', // Cam san hô
    l4: '#f97316', // Cam rực rỡ
    l5: '#ea580c', // Lõi cam đỏ
    stroke: '#c2410c', // Nét viền cam
    shadow: 'rgba(194,65,12,0.32)',
  },
  {
    name: 'yellow',
    l1: '#fef9c3', // Vàng kem pastel
    l2: '#fef08a', // Vàng hoa cúc
    l3: '#fde047', // Vàng nắng
    l4: '#eab308', // Vàng nghệ
    l5: '#ca8a04', // Lõi vàng hổ phách
    stroke: '#a16207', // Nét viền vàng
    shadow: 'rgba(161,98,7,0.32)',
  },
  {
    name: 'lavender',
    l1: '#f3e8ff', // Tím oải hương nhạt
    l2: '#e9d5ff', // Tím hoa cà
    l3: '#d8b4fe', // Tím pastel
    l4: '#a855f7', // Tím thắm
    l5: '#7e22ce', // Lõi tím sẫm
    stroke: '#6b21a8', // Nét viền tím
    shadow: 'rgba(107,33,168,0.32)',
  },
];

type FlowerType = 'rose' | 'spiral' | 'bud';

interface FlowerData {
  id: number;
  x: number; // Tọa độ ngang (%)
  heightPct: number; // Chiều cao cành (%)
  flowerSize: number; // Kích thước đóa hoa (px)
  paletteIndex: number;
  type: FlowerType;
  swayDuration: number;
  swayDelay: number;
  swayDeg: number;
  growDelay: number;
  stemCurve: number;
  layer: 'deep' | 'back' | 'mid' | 'front1' | 'front2';
  zIndex: number;
  opacity: number;
}

export default function FlowerForest({ onNext, onBackToCake }: Props) {
  // Trạng thái hiển thị thiệp chúc mừng: Mặc định KHÔNG tự động mở để người dùng ngắm rừng hoa
  const [showLetter, setShowLetter] = useState<boolean>(false);
  const [gardenCycle, setGardenCycle] = useState<number>(0);

  // Sinh ngẫu nhiên dữ liệu cho 105 đóa hoa phủ kín màn hình dày đặc,
  // Không có một bông nào nhô cao bất thường, tạo thành thảm hoa lượn sóng tự nhiên chuẩn ảnh mẫu
  const flowers: FlowerData[] = useMemo(() => {
    const list: FlowerData[] = [];
    const layerConfigs: Array<{
      name: 'deep' | 'back' | 'mid' | 'front1' | 'front2';
      count: number;
      z: number;
      hMin: number;
      hMax: number;
      sMin: number;
      sMax: number;
      opacity: number;
    }> = [
      { name: 'deep', count: 20, z: 10, hMin: 32, hMax: 48, sMin: 36, sMax: 46, opacity: 0.88 },
      { name: 'back', count: 22, z: 15, hMin: 42, hMax: 58, sMin: 44, sMax: 54, opacity: 0.94 },
      { name: 'mid', count: 25, z: 20, hMin: 50, hMax: 66, sMin: 52, sMax: 64, opacity: 1 },
      { name: 'front1', count: 22, z: 25, hMin: 56, hMax: 72, sMin: 58, sMax: 72, opacity: 1 },
      { name: 'front2', count: 16, z: 30, hMin: 60, hMax: 75, sMin: 66, sMax: 82, opacity: 1 },
    ];

    let idCounter = 0;
    layerConfigs.forEach((lc) => {
      for (let i = 0; i < lc.count; i++) {
        const step = 98 / lc.count;
        const jitter = Math.sin(idCounter * 4.3) * step * 0.42;
        const x = Math.min(98.5, Math.max(1.5, i * step + step * 0.5 + jitter));

        const heightPct = lc.hMin + ((idCounter * 17) % (lc.hMax - lc.hMin + 1));
        const flowerSize = lc.sMin + ((idCounter * 11) % (lc.sMax - lc.sMin + 1));

        // Phân bổ loại hoa theo mẫu: 70% hoa hồng xếp cánh, 15% hoa cúc xoắn, 15% nụ vươn cao
        const typeSeed = (idCounter * 7) % 10;
        const type: FlowerType =
          typeSeed === 1 || typeSeed === 6 ? 'bud' : typeSeed === 4 ? 'spiral' : 'rose';

        const paletteIndex = (idCounter * 5) % FLOWER_PALETTES.length;
        const stemCurve = ((idCounter * 9) % 24) - 12;

        const swayDuration = 2.6 + ((idCounter * 3) % 15) * 0.12;
        const swayDelay = ((idCounter * 7) % 20) * 0.1;
        const swayDeg = (idCounter % 2 === 0 ? 1 : -1) * (1.4 + ((idCounter * 2) % 4) * 0.35);

        // Nở so le liên tục trong 1.3 giây từ khi vào màn hình
        const growDelay = 0.04 + ((idCounter * 13) % 40) * 0.03;

        list.push({
          id: idCounter++,
          x,
          heightPct: type === 'bud' ? Math.min(76, heightPct + 5) : heightPct,
          flowerSize: type === 'bud' ? Math.round(flowerSize * 0.75) : flowerSize,
          paletteIndex,
          type,
          swayDuration,
          swayDelay,
          swayDeg,
          growDelay,
          stemCurve,
          layer: lc.name,
          zIndex: lc.z,
          opacity: lc.opacity,
        });
      }
    });

    // Vẽ từ tầng xa nhất (deep) đến gần nhất (front2)
    return list.sort((a, b) => a.zIndex - b.zIndex);
  }, []);

  // Kích hoạt âm thanh & pháo hoa khi rừng hoa mọc lên
  useEffect(() => {
    soundManager.playFlowerBloomSound();
    confetti({
      particleCount: 60,
      spread: 90,
      origin: { y: 0.75 },
      colors: ['#fda4af', '#f472b6', '#fed7aa', '#fef08a', '#86efac', '#7dd3fc'],
    });
  }, [gardenCycle]);

  // Cho hoa nở lại từ đầu
  const handleReplayGarden = useCallback(() => {
    soundManager.playFlowerBloomSound();
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.8 },
      colors: ['#fda4af', '#f472b6', '#fed7aa', '#86efac', '#7dd3fc'],
    });
    setGardenCycle((prev) => prev + 1);
  }, []);

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none flex flex-col items-center justify-between">
      {/* =================================================================== */}
      {/* 0. GLOBAL SVG DEFS (BỘ LỌC ĐỔ BÓNG & GRADIENT DÙNG CHUNG HIỆU SUẤT CAO) */}
      {/* =================================================================== */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {FLOWER_PALETTES.map((p) => (
            <React.Fragment key={`defs-${p.name}`}>
              <filter id={`paper-sh-${p.name}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="0.9" floodColor={p.stroke} floodOpacity="0.32" />
              </filter>
              <linearGradient id={`bud-grad-${p.name}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor={p.l1} />
                <stop offset="70%" stopColor={p.l2} />
                <stop offset="100%" stopColor={p.l4} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
      </svg>

      {/* =================================================================== */}
      {/* 1. NỀN BẦU TRỜI XANH DỊU DÀNG VỚI MÂY TRẮNG PASTEL (CHUẨN THEO ẢNH) */}
      {/* =================================================================== */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[#a0d4ef] via-[#c6e6f7] to-[#e4f3fa]" />

      {/* Mây trắng trôi bồng bềnh êm dịu */}
      <div className="absolute inset-0 -z-20 pointer-events-none opacity-45">
        <div className="absolute top-[6%] left-[8%] w-80 h-24 rounded-full bg-white/70 blur-2xl" />
        <div className="absolute top-[16%] right-[6%] w-[26rem] h-32 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute top-[32%] left-[28%] w-88 h-28 rounded-full bg-white/50 blur-2xl" />
      </div>

      {/* Cánh hoa rơi lất phất trong gió */}
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
              x: [`${(i * 7.5) % 100}%`, `${((i * 7.5) % 100) + (i % 2 === 0 ? 10 : -10)}%`],
              rotate: [0, 360 + i * 45],
              opacity: [0, 0.75, 0.75, 0],
            }}
            transition={{
              duration: 7.5 + (i % 5) * 1.5,
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
                    : 'radial-gradient(circle, #fef9c3 0%, #facc15 100%)',
                borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* 2. DÒNG CHỮ NHẸ NHÀNG TRÊN CÙNG */}
      <header className="relative z-30 pt-4 sm:pt-6 px-4 text-center max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-sky-200/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-stone-700">
              Rừng hoa nở rộ chúc mừng sinh nhật em 🌸
            </span>
          </div>
        </motion.div>
      </header>

      {/* =================================================================== */}
      {/* 3. TOÀN BỘ RỪNG HOA MỌC DÀY ĐẶC PHỦ KÍN ĐÁY MÀN HÌNH (105 ĐÓA HOA)  */}
      {/* =================================================================== */}
      <div
        key={`garden-${gardenCycle}`}
        className="relative w-full flex-1 flex items-end justify-center pointer-events-none overflow-hidden"
      >
        {/* Rừng hoa 105 bông đa tầng */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {flowers.map((fl) => {
            const pal = FLOWER_PALETTES[fl.paletteIndex];
            return (
              <div
                key={`flower-${fl.id}`}
                style={{
                  position: 'absolute',
                  left: `${fl.x}%`,
                  bottom: 0,
                  height: `${fl.heightPct}%`,
                  width: `${fl.flowerSize}px`,
                  transform: 'translateX(-50%)',
                  zIndex: fl.zIndex,
                  opacity: fl.opacity,
                  filter: fl.layer === 'deep' ? 'brightness(1.04) saturate(0.95)' : 'none',
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
                  {/* Đóa hoa trên đỉnh cành */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: [0, 1.15, 1], rotate: 0 }}
                    transition={{
                      duration: 0.85,
                      delay: fl.growDelay + 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative z-20 flex items-center justify-center -mb-2"
                    style={{
                      width: `${fl.flowerSize}px`,
                      height: `${fl.flowerSize}px`,
                    }}
                  >
                    {fl.type === 'rose' && (
                      <ScallopedPaperRose size={fl.flowerSize} palette={pal} />
                    )}
                    {fl.type === 'spiral' && (
                      <SpiralPaperBlossom size={fl.flowerSize} palette={pal} />
                    )}
                    {fl.type === 'bud' && (
                      <FlameTeardropBud size={fl.flowerSize} palette={pal} />
                    )}
                  </motion.div>

                  {/* Cành hoa xanh mướt & lá mọc vút lên từ đáy */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.9,
                      delay: fl.growDelay,
                      ease: 'easeOut',
                    }}
                    style={{ transformOrigin: 'bottom center' }}
                    className="relative w-full flex-1 flex justify-center overflow-visible"
                  >
                    <svg
                      width={Math.max(45, fl.flowerSize)}
                      height="100%"
                      viewBox="0 0 60 300"
                      preserveAspectRatio="none"
                      className="overflow-visible"
                    >
                      {/* Thân cành */}
                      <path
                        d={`M 30 300 Q ${30 + fl.stemCurve} 150 30 0`}
                        fill="none"
                        stroke={fl.layer === 'deep' ? '#22c55e' : '#15803d'}
                        strokeWidth={fl.layer === 'deep' ? '2.8' : '3.6'}
                        strokeLinecap="round"
                      />
                      {/* Lá trái */}
                      <path
                        d="M 30 160 Q 12 145 6 125 Q 18 135 30 155"
                        fill="#16a34a"
                        stroke="#14532d"
                        strokeWidth="0.9"
                      />
                      {/* Lá phải */}
                      <path
                        d="M 30 220 Q 48 205 54 185 Q 42 195 30 215"
                        fill="#15803d"
                        stroke="#14532d"
                        strokeWidth="0.9"
                      />
                    </svg>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lớp thảm cỏ xanh mướt ôm trọn chân đáy màn hình */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-35 bg-gradient-to-t from-[#15803d]/40 via-[#16a34a]/15 to-transparent" />
      </div>

      {/* =================================================================== */}
      {/* 4. TẤM THIỆP CHÚC MỪNG (CHỈ MỞ KHI NGƯỜI DÙNG BẤM 'ĐỌC LẠI THIỆP') */}
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

              {/* Nội dung lời chúc ý nghĩa (chuẩn văn phong video) */}
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

              {/* Các nút bấm tương tác bên trong thiệp */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                {/* Nút ngắm toàn cảnh rừng hoa (ẩn thiệp) */}
                <button
                  type="button"
                  onClick={() => setShowLetter(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-pink-500" />
                  <span>Ngắm rừng hoa 🌸</span>
                </button>

                {/* Nút tiếp tục sang mở 3 hộp quà bí mật */}
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
      {/* 5. CÁC NÚT ĐIỀU KHIỂN DƯỚI ĐÁY CHUẨN XÁC THEO ẢNH NGƯỜI DÙNG CUNG CẤP */}
      {/* =================================================================== */}
      <footer className="relative z-40 pb-5 px-4 flex flex-wrap items-center justify-center gap-2.5 max-w-lg w-full">
        {/* Nút 'Đọc lại thiệp' chuẩn theo ảnh mẫu */}
        <button
          type="button"
          onClick={() => setShowLetter(true)}
          className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-md shadow-black/10 border border-white/80 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Mở thiệp chúc mừng sinh nhật"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-500" />
          <span>Đọc lại thiệp</span>
        </button>

        {/* Nút 'Cho hoa nở lại' chuẩn theo ảnh mẫu */}
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
// CÁC ĐÓA HOA SVG PAPER-CUT / SCALLOPED THEO ĐÚNG ẢNH MẪU
// ===================================================================

interface FlowerHeadProps {
  size: number;
  palette: (typeof FLOWER_PALETTES)[0];
}

// 1. ĐÓA HOA HỒNG GIẤY ORIGAMI ĐA TẦNG CÁNH CÓ VIỀN TƯƠNG PHẢN (SCALLOPED PAPER ROSE)
function ScallopedPaperRose({ size, palette }: FlowerHeadProps) {
  const p = palette;

  // 6 lớp cánh xếp so le đồng tâm với nét viền & đổ bóng đa tầng
  const layers = [
    { n: 8, r: 47, amp: 4.5, fill: p.l1, strokeW: 0.9, rot: 0 },
    { n: 8, r: 40, amp: 4.0, fill: p.l2, strokeW: 0.85, rot: 0.38 },
    { n: 7, r: 33, amp: 3.5, fill: p.l1, strokeW: 0.8, rot: 0.75 },
    { n: 7, r: 26, amp: 3.0, fill: p.l3, strokeW: 0.8, rot: 1.15 },
    { n: 6, r: 19, amp: 2.2, fill: p.l4, strokeW: 0.75, rot: 1.55 },
    { n: 5, r: 13, amp: 1.8, fill: p.l5, strokeW: 0.75, rot: 1.95 },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-xs">
      <g>
        {layers.map((l, lIdx) => {
          let d = '';
          const count = l.n;
          for (let i = 0; i < count; i++) {
            const a1 = (i / count) * Math.PI * 2 + l.rot;
            const a2 = ((i + 1) / count) * Math.PI * 2 + l.rot;
            const amid = (a1 + a2) / 2;

            const rInner = l.r - l.amp;
            const rOuter = l.r + l.amp;

            const p1x = 50 + rInner * Math.cos(a1);
            const p1y = 50 + rInner * Math.sin(a1);

            const cpx = 50 + rOuter * 1.12 * Math.cos(amid);
            const cpy = 50 + rOuter * 1.12 * Math.sin(amid);

            const p2x = 50 + rInner * Math.cos(a2);
            const p2y = 50 + rInner * Math.sin(a2);

            if (i === 0) d += `M ${p1x.toFixed(1)} ${p1y.toFixed(1)} `;
            d += `Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${p2x.toFixed(1)} ${p2y.toFixed(1)} `;
          }
          d += 'Z';

          return (
            <path
              key={`rose-l-${lIdx}`}
              d={d}
              fill={l.fill}
              stroke={p.stroke}
              strokeWidth={l.strokeW}
              strokeLinejoin="round"
              filter={`url(#paper-sh-${p.name})`}
            />
          );
        })}

        {/* Lõi xoắn origami trung tâm */}
        <circle cx="50" cy="50" r="7.5" fill={p.l5} stroke={p.stroke} strokeWidth="0.75" />
        <path
          d="M 50 44 C 54 44 56 47 55 51 C 54 55 48 56 45 52 C 43 49 44 46 48 46 C 51 46 52 49 50 51"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

// 2. HOA CÚC XOẮN GIẤY QUILLING ĐỒNG TÂM (SPIRAL PAPER BLOSSOM)
function SpiralPaperBlossom({ size, palette }: FlowerHeadProps) {
  const p = palette;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-xs">
      <circle cx="50" cy="50" r="47" fill={p.l1} stroke={p.stroke} strokeWidth="0.9" filter={`url(#paper-sh-${p.name})`} />
      <circle cx="50" cy="50" r="39" fill={p.l2} stroke={p.stroke} strokeWidth="0.85" filter={`url(#paper-sh-${p.name})`} />
      <circle cx="50" cy="50" r="31" fill={p.l1} stroke={p.stroke} strokeWidth="0.8" filter={`url(#paper-sh-${p.name})`} />
      <circle cx="50" cy="50" r="23" fill={p.l3} stroke={p.stroke} strokeWidth="0.8" filter={`url(#paper-sh-${p.name})`} />
      <circle cx="50" cy="50" r="15" fill={p.l4} stroke={p.stroke} strokeWidth="0.75" filter={`url(#paper-sh-${p.name})`} />
      <circle cx="50" cy="50" r="8" fill={p.l5} stroke={p.stroke} strokeWidth="0.75" />
      {/* Vòng xoắn cúc cuộn giấy */}
      <path
        d="M 50 20 C 66 20 78 32 78 48 C 78 64 64 78 48 78 C 32 78 22 66 22 50 C 22 36 34 28 48 28 C 60 28 68 36 68 48 C 68 58 58 66 48 66 C 40 66 34 60 34 50 C 34 42 42 36 50 36 C 56 36 60 42 60 48 C 60 52 54 56 50 56 C 46 56 44 52 46 48 C 48 46 50 48 50 50"
        fill="none"
        stroke={p.stroke}
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

// 3. NỤ HOA VƯƠN CAO TRÊN ĐÀI XANH (FLAME / TEARDROP BUD)
function FlameTeardropBud({ size, palette }: FlowerHeadProps) {
  const p = palette;
  const w = size * 0.72;
  const h = size * 1.15;
  return (
    <svg width={w} height={h} viewBox="0 0 60 90" className="overflow-visible drop-shadow-xs">
      {/* Thân búp hoa giọt nước chuyển màu */}
      <path
        d="M 30 10 C 15 28 12 55 30 72 C 48 55 45 28 30 10 Z"
        fill={`url(#bud-grad-${p.name})`}
        stroke={p.stroke}
        strokeWidth="0.8"
        filter={`url(#paper-sh-${p.name})`}
      />
      {/* Gân nếp gấp giữa cánh nụ */}
      <path d="M 30 10 Q 32 40 30 72" fill="none" stroke={p.stroke} strokeWidth="0.75" opacity="0.6" />
      <path d="M 30 72 C 22 62 18 45 22 30" fill="none" stroke={p.l1} strokeWidth="1.2" opacity="0.7" />
      {/* Đài hoa xanh ôm giữ gốc búp */}
      <path d="M 30 72 C 24 74 16 68 14 54 C 18 64 24 68 30 72 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.7" />
      <path d="M 30 72 C 36 74 44 68 46 54 C 42 64 36 68 30 72 Z" fill="#16a34a" stroke="#14532d" strokeWidth="0.7" />
      <path d="M 30 70 L 30 84" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
