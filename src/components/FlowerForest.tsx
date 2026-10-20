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
// BẢNG MÀU HOA GIẤY CUỘN (QUILLED PAPER ROSES)
// 8 bảng màu: 3 biến thể hồng (chiếm ưu thế) + xanh bạc hà + xanh dương
// + cam đào + vàng kem + tím oải hương — chuẩn xác ảnh mẫu TikTok
// Mỗi bảng có 5 cấp sáng tối: l1 (ngoài cùng, nhạt nhất) → l5 (tâm, đậm nhất)
// ===================================================================
const PALETTES = [
  {
    name: 'pk1',
    l1: '#fce7f3', l2: '#fbcfe8', l3: '#f9a8d4', l4: '#ec4899', l5: '#be185d',
    stroke: '#9d174d',
  },
  {
    name: 'pk2',
    l1: '#ffe4e6', l2: '#fecdd3', l3: '#fda4af', l4: '#f43f5e', l5: '#be123c',
    stroke: '#881337',
  },
  {
    name: 'pk3',
    l1: '#fce4ec', l2: '#f8bbd0', l3: '#f48fb1', l4: '#e91e63', l5: '#ad1457',
    stroke: '#880e4f',
  },
  {
    name: 'mint',
    l1: '#dcfce7', l2: '#bbf7d0', l3: '#86efac', l4: '#22c55e', l5: '#15803d',
    stroke: '#14532d',
  },
  {
    name: 'sky',
    l1: '#e0f2fe', l2: '#bae6fd', l3: '#7dd3fc', l4: '#0ea5e9', l5: '#0369a1',
    stroke: '#0c4a6e',
  },
  {
    name: 'peach',
    l1: '#fff7ed', l2: '#fed7aa', l3: '#fdba74', l4: '#f97316', l5: '#c2410c',
    stroke: '#7c2d12',
  },
  {
    name: 'cream',
    l1: '#fefce8', l2: '#fef9c3', l3: '#fef08a', l4: '#eab308', l5: '#a16207',
    stroke: '#713f12',
  },
  {
    name: 'lilac',
    l1: '#faf5ff', l2: '#f3e8ff', l3: '#e9d5ff', l4: '#a855f7', l5: '#7e22ce',
    stroke: '#581c87',
  },
];

// Phân bổ ưu tiên hồng (~50%), giống ảnh mẫu
const PALETTE_WEIGHTS = [0, 0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 0];

type FlowerType = 'rose' | 'bud';

interface FlowerData {
  id: number;
  x: number;
  heightPct: number;
  flowerSize: number;
  paletteIndex: number;
  type: FlowerType;
  swayDuration: number;
  swayDelay: number;
  swayDeg: number;
  growDelay: number;
  stemCurve: number;
  layer: 'deep' | 'back' | 'mid' | 'front1' | 'front2';
  zIndex: number;
  brightnessFilter: string;
  ringCount: number;
}

export default function FlowerForest({ onNext, onBackToCake }: Props) {
  const [showLetter, setShowLetter] = useState<boolean>(false);
  const [gardenCycle, setGardenCycle] = useState<number>(0);

  // ===================================================================
  // SINH DỮ LIỆU 130 ĐÓA HOA DÀY ĐẶC PHỦ KÍN MÀN HÌNH
  // 5 tầng chiều sâu, hoa chồng lấp nặng — chuẩn xác ảnh mẫu
  // ===================================================================
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
      brightness: string;
    }> = [
      { name: 'deep', count: 22, z: 5, hMin: 30, hMax: 45, sMin: 32, sMax: 44, brightness: 'brightness(1.06) saturate(0.9)' },
      { name: 'back', count: 26, z: 10, hMin: 38, hMax: 55, sMin: 40, sMax: 54, brightness: 'brightness(1.03) saturate(0.95)' },
      { name: 'mid', count: 30, z: 15, hMin: 46, hMax: 64, sMin: 50, sMax: 66, brightness: 'none' },
      { name: 'front1', count: 28, z: 20, hMin: 52, hMax: 70, sMin: 58, sMax: 76, brightness: 'none' },
      { name: 'front2', count: 20, z: 25, hMin: 56, hMax: 74, sMin: 68, sMax: 88, brightness: 'none' },
    ];

    let id = 0;
    layerConfigs.forEach((lc) => {
      for (let i = 0; i < lc.count; i++) {
        const step = 100 / lc.count;
        // Jitter tạo phân bố tự nhiên, hoa chồng lấp nhau
        const jitter = Math.sin(id * 3.7 + 0.5) * step * 0.48;
        const x = Math.min(99, Math.max(1, i * step + step * 0.5 + jitter));

        const heightPct = lc.hMin + ((id * 17 + 3) % (lc.hMax - lc.hMin + 1));
        const flowerSize = lc.sMin + ((id * 13 + 5) % (lc.sMax - lc.sMin + 1));

        // 85% hoa hồng cuộn tròn, 15% nụ nhọn — chuẩn ảnh mẫu
        const typeSeed = (id * 7 + 3) % 20;
        const type: FlowerType = typeSeed < 3 ? 'bud' : 'rose';

        // Lấy palette từ bảng phân bổ ưu tiên hồng
        const paletteIndex = PALETTE_WEIGHTS[(id * 3 + 1) % PALETTE_WEIGHTS.length];

        const stemCurve = ((id * 11 + 2) % 28) - 14;
        const swayDuration = 2.8 + ((id * 3 + 1) % 14) * 0.13;
        const swayDelay = ((id * 7 + 2) % 22) * 0.09;
        const swayDeg = (id % 2 === 0 ? 1 : -1) * (1.2 + ((id * 2 + 1) % 5) * 0.3);
        const growDelay = 0.03 + ((id * 13 + 7) % 45) * 0.028;

        // Số vòng đồng tâm tỉ lệ với kích thước hoa
        const ringCount = flowerSize >= 70 ? 12 : flowerSize >= 55 ? 10 : flowerSize >= 42 ? 8 : 7;

        list.push({
          id: id++,
          x,
          heightPct: type === 'bud' ? Math.min(80, heightPct + 8) : heightPct,
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
          ringCount,
        });
      }
    });

    return list.sort((a, b) => a.zIndex - b.zIndex);
  }, []);

  // Âm thanh & pháo hoa khi rừng hoa mọc
  useEffect(() => {
    soundManager.playFlowerBloomSound();
    confetti({
      particleCount: 65,
      spread: 100,
      origin: { y: 0.75 },
      colors: ['#fda4af', '#f472b6', '#fed7aa', '#fef08a', '#86efac', '#7dd3fc'],
    });
  }, [gardenCycle]);

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
      {/* ================ GLOBAL SVG DEFS ================ */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {PALETTES.map((p) => (
            <React.Fragment key={`defs-${p.name}`}>
              <filter id={`sh-${p.name}`} x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodColor={p.stroke} floodOpacity="0.28" />
              </filter>
              <linearGradient id={`bud-g-${p.name}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor={p.l1} />
                <stop offset="65%" stopColor={p.l2} />
                <stop offset="100%" stopColor={p.l4} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
      </svg>

      {/* ================ 1. NỀN TRỜI XANH PASTEL ================ */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[#a0d4ef] via-[#c6e6f7] to-[#e4f3fa]" />

      {/* Mây trắng */}
      <div className="absolute inset-0 -z-20 pointer-events-none opacity-40">
        <div className="absolute top-[5%] left-[6%] w-80 h-24 rounded-full bg-white/70 blur-2xl" />
        <div className="absolute top-[14%] right-[4%] w-[28rem] h-32 rounded-full bg-white/55 blur-3xl" />
        <div className="absolute top-[28%] left-[30%] w-96 h-28 rounded-full bg-white/45 blur-2xl" />
      </div>

      {/* Cánh hoa rơi */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`petal-${i}`}
            initial={{ y: -30, x: `${(i * 8.5) % 100}%`, rotate: 0, opacity: 0 }}
            animate={{
              y: ['0vh', '105vh'],
              x: [`${(i * 8.5) % 100}%`, `${((i * 8.5) % 100) + (i % 2 === 0 ? 12 : -12)}%`],
              rotate: [0, 360 + i * 40],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: 8 + (i % 4) * 1.5,
              repeat: Infinity,
              delay: i * 0.55,
              ease: 'linear',
            }}
            className="absolute"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  i % 3 === 0
                    ? 'radial-gradient(circle, #fecdd3, #fb7185)'
                    : i % 3 === 1
                    ? 'radial-gradient(circle, #ffedd5, #fb923c)'
                    : 'radial-gradient(circle, #fef9c3, #facc15)',
                borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* ================ 2. TIÊU ĐỀ ================ */}
      <header className="relative z-30 pt-4 sm:pt-5 px-4 text-center max-w-md w-full">
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

      {/* ================ 3. VƯỜN HOA 130 ĐÓA DÀY ĐẶC ================ */}
      <div
        key={`garden-${gardenCycle}`}
        className="relative w-full flex-1 flex items-end justify-center pointer-events-none overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {flowers.map((fl) => {
            const pal = PALETTES[fl.paletteIndex];
            return (
              <div
                key={`f-${fl.id}`}
                style={{
                  position: 'absolute',
                  left: `${fl.x}%`,
                  bottom: 0,
                  height: `${fl.heightPct}%`,
                  width: `${fl.flowerSize + 4}px`,
                  transform: 'translateX(-50%)',
                  zIndex: fl.zIndex,
                  filter: fl.brightnessFilter,
                }}
              >
                {/* Lắc lư trong gió */}
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
                  {/* ĐÓA HOA / NỤ */}
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: [0, 1.12, 1], rotate: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: fl.growDelay + 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative z-20 flex items-center justify-center -mb-1"
                    style={{
                      width: `${fl.flowerSize}px`,
                      height: `${fl.flowerSize}px`,
                    }}
                  >
                    {fl.type === 'rose' && (
                      <QuilledPaperRose size={fl.flowerSize} palette={pal} ringCount={fl.ringCount} />
                    )}
                    {fl.type === 'bud' && (
                      <TeardropBud size={fl.flowerSize} palette={pal} />
                    )}
                  </motion.div>

                  {/* THÂN CÀNH + LÁ */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.85,
                      delay: fl.growDelay,
                      ease: 'easeOut',
                    }}
                    style={{ transformOrigin: 'bottom center' }}
                    className="relative w-full flex-1 flex justify-center overflow-visible"
                  >
                    <svg
                      width={Math.max(40, fl.flowerSize)}
                      height="100%"
                      viewBox="0 0 60 300"
                      preserveAspectRatio="none"
                      className="overflow-visible"
                    >
                      {/* Thân */}
                      <path
                        d={`M 30 300 Q ${30 + fl.stemCurve} 150 30 0`}
                        fill="none"
                        stroke={fl.zIndex < 12 ? '#22c55e' : '#15803d'}
                        strokeWidth={fl.zIndex < 12 ? '2.5' : '3.2'}
                        strokeLinecap="round"
                      />
                      {/* Lá trái */}
                      <path
                        d="M 30 155 Q 10 138 4 115 Q 16 128 30 148"
                        fill="#16a34a"
                        stroke="#14532d"
                        strokeWidth="0.8"
                      />
                      {/* Lá phải */}
                      <path
                        d="M 30 225 Q 50 208 56 185 Q 44 198 30 218"
                        fill="#15803d"
                        stroke="#14532d"
                        strokeWidth="0.8"
                      />
                      {/* Lá nhỏ phụ */}
                      {fl.flowerSize > 55 && (
                        <path
                          d="M 30 100 Q 18 90 12 74 Q 20 82 30 95"
                          fill="#22c55e"
                          stroke="#14532d"
                          strokeWidth="0.6"
                        />
                      )}
                    </svg>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thảm cỏ chân đáy */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-[35] bg-gradient-to-t from-[#15803d]/35 via-[#16a34a]/12 to-transparent" />
      </div>

      {/* ================ 4. THIỆP CHÚC MỪNG (CHỈ MỞ KHI BẤM NÚT) ================ */}
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
              <button
                type="button"
                onClick={() => setShowLetter(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-pink-100/60 transition-colors cursor-pointer"
                title="Đóng thiệp"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-3 left-3 text-xs opacity-60">🌸</div>
              <div className="absolute bottom-3 left-3 text-xs opacity-60">🌿</div>
              <div className="absolute bottom-3 right-3 text-xs opacity-60">💖</div>

              <div className="flex justify-center -mt-1 mb-2">
                <span className="px-3.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-200/80 shadow-2xs">
                  Gửi bạn thương mến 🌸
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-800 tracking-tight leading-snug">
                Mong những điều đẹp đẽ<br />luôn nở bên bạn.
              </h3>

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

              <div className="mt-3 pt-2 border-t border-pink-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                <span>Gửi bạn thật nhiều thương yêu ♡</span>
                <span className="font-bold text-rose-500">ngàn đóa hoa</span>
              </div>

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

      {/* ================ 5. NÚT ĐIỀU KHIỂN ĐÁY MÀN HÌNH ================ */}
      <footer className="relative z-40 pb-5 px-4 flex flex-wrap items-center justify-center gap-2.5 max-w-lg w-full">
        <button
          type="button"
          onClick={() => setShowLetter(true)}
          className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-md shadow-black/10 border border-white/80 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Mở thiệp chúc mừng sinh nhật"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-500" />
          <span>Đọc lại thiệp</span>
        </button>

        <button
          type="button"
          onClick={handleReplayGarden}
          className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-md shadow-black/10 border border-white/80 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Xem lại hiệu ứng hoa mọc từ đầu"
        >
          <RotateCw className="w-3.5 h-3.5 text-sky-500" />
          <span>Cho hoa nở lại</span>
        </button>

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

      <style jsx global>{`
        @keyframes gardenSway {
          0% { transform: rotate(calc(-1 * var(--sway-angle, 2deg))); }
          100% { transform: rotate(var(--sway-angle, 2deg)); }
        }
      `}</style>
    </div>
  );
}

// ===================================================================
// HOA HỒNG GIẤY CUỘN TRÒN ĐỒNG TÂM (QUILLED CONCENTRIC PAPER ROSE)
// Mô phỏng chính xác hoa cuộn giấy trong ảnh mẫu TikTok:
// Nhiều vòng tròn đồng tâm xếp chồng nhau, tạo hiệu ứng cuộn giấy xoắn ốc 3D
// Vòng ngoài nhạt nhất → vòng trong đậm dần → tâm đậm nhất kèm xoắn trắng
// ===================================================================
interface FlowerHeadProps {
  size: number;
  palette: (typeof PALETTES)[0];
}

function QuilledPaperRose({ size, palette, ringCount }: FlowerHeadProps & { ringCount: number }) {
  const p = palette;
  const maxR = 47;
  const minR = 6;
  const step = (maxR - minR) / ringCount;

  // Bảng màu vòng tròn: luân phiên nhạt/đậm, tối dần vào tâm
  const getColor = (i: number): string => {
    const t = i / ringCount;
    if (t < 0.25) return i % 2 === 0 ? p.l1 : p.l2;
    if (t < 0.5) return i % 2 === 0 ? p.l2 : p.l3;
    if (t < 0.75) return i % 2 === 0 ? p.l2 : p.l4;
    return i % 2 === 0 ? p.l3 : p.l5;
  };

  // Tính trước tất cả vòng tròn để tránh tạo mảng trong render
  const circles: React.ReactElement[] = [];
  for (let i = 0; i <= ringCount; i++) {
    const r = maxR - i * step;
    // Offset xoắn ốc nhẹ: mỗi vòng lệch tâm một chút tạo hiệu ứng cuộn giấy
    const angle = i * 0.55;
    const mag = i * 0.22;
    const cx = 50 + Math.cos(angle) * mag;
    const cy = 50 + Math.sin(angle) * mag;

    circles.push(
      <circle
        key={i}
        cx={cx.toFixed(1)}
        cy={cy.toFixed(1)}
        r={r.toFixed(1)}
        fill={getColor(i)}
        stroke={p.stroke}
        strokeWidth="0.5"
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
      <g filter={`url(#sh-${p.name})`}>
        {circles}
        {/* Tâm hoa đậm nhất */}
        <circle cx="50" cy="50" r={(minR * 0.7).toFixed(1)} fill={p.l5} stroke={p.stroke} strokeWidth="0.4" />
        {/* Xoắn ốc trắng ở tâm — dấu ấn đặc trưng quilled paper rose */}
        <path
          d="M 50 44 C 54 44 56.5 47 55.5 51 C 54.5 55 49 56 46 52.5 C 43.5 49.5 44.5 46 48 45.5 C 51 45 52.5 48 51 50.5 C 49.5 52.5 47.5 51.5 48 50"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}

// ===================================================================
// NỤ HOA GIỌT NƯỚC VƯƠN CAO XEN KẼ (TEARDROP BUD)
// Nụ nhọn thanh mảnh trên cành cao, giống ảnh mẫu TikTok
// ===================================================================
function TeardropBud({ size, palette }: FlowerHeadProps) {
  const p = palette;
  const w = size * 0.8;
  const h = size * 1.3;
  return (
    <svg width={w} height={h} viewBox="0 0 60 90" className="overflow-visible">
      <g filter={`url(#sh-${p.name})`}>
        {/* Thân nụ giọt nước */}
        <path
          d="M 30 8 C 14 26 10 56 30 74 C 50 56 46 26 30 8 Z"
          fill={`url(#bud-g-${p.name})`}
          stroke={p.stroke}
          strokeWidth="0.7"
        />
        {/* Gân nếp gấp */}
        <path d="M 30 8 Q 32 40 30 74" fill="none" stroke={p.stroke} strokeWidth="0.6" opacity="0.5" />
        <path d="M 30 74 C 22 64 18 46 22 28" fill="none" stroke={p.l1} strokeWidth="1" opacity="0.6" />
      </g>
      {/* Đài hoa xanh */}
      <path d="M 30 74 C 23 76 14 68 12 52 C 17 64 24 70 30 74 Z" fill="#15803d" stroke="#14532d" strokeWidth="0.6" />
      <path d="M 30 74 C 37 76 46 68 48 52 C 43 64 36 70 30 74 Z" fill="#16a34a" stroke="#14532d" strokeWidth="0.6" />
      <path d="M 30 72 L 30 86" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
