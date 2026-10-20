'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, ArrowRight, RotateCw, BookOpen, Eye } from 'lucide-react';
import { soundManager } from '@/utils/sound';

interface Props {
  onNext: () => void;
  onBackToCake?: () => void;
}

// Bảng màu hoa giấy Origami/Paper-cut pastel chuẩn xác theo mẫu ảnh TikTok
const FLOWER_PALETTES = [
  {
    name: 'pinkRose',
    outer: '#fda4af',
    mid: '#fb7185',
    inner: '#f43f5e',
    core: '#be123c',
    stroke: '#9f1239',
    highlight: '#ffffff',
  },
  {
    name: 'mintGreen',
    outer: '#bbf7d0',
    mid: '#86efac',
    inner: '#4ade80',
    core: '#16a34a',
    stroke: '#15803d',
    highlight: '#f0fdf4',
  },
  {
    name: 'skyBlue',
    outer: '#bae6fd',
    mid: '#7dd3fc',
    inner: '#38bdf8',
    core: '#0284c7',
    stroke: '#0369a1',
    highlight: '#f0f9ff',
  },
  {
    name: 'apricotPeach',
    outer: '#fed7aa',
    mid: '#fdba74',
    inner: '#fb923c',
    core: '#ea580c',
    stroke: '#c2410c',
    highlight: '#fff7ed',
  },
  {
    name: 'sunnyYellow',
    outer: '#fef08a',
    mid: '#fde047',
    inner: '#facc15',
    core: '#eab308',
    stroke: '#ca8a04',
    highlight: '#fefce8',
  },
  {
    name: 'salmonCoral',
    outer: '#fecdd3',
    mid: '#fda4af',
    inner: '#fb7185',
    core: '#e11d48',
    stroke: '#be123c',
    highlight: '#fff1f2',
  },
];

interface FlowerData {
  id: number;
  x: number; // Tọa độ ngang (%)
  heightPct: number; // Chiều cao cành (%)
  flowerSize: number; // Kích thước đóa hoa (px)
  paletteIndex: number;
  type: 'rose' | 'disc' | 'bud';
  swayDuration: number;
  swayDelay: number;
  swayDeg: number;
  growDelay: number;
  stemCurve: number;
  layer: 'back' | 'mid' | 'front';
}

export default function FlowerForest({ onNext, onBackToCake }: Props) {
  // Trạng thái hiển thị thiệp chúc mừng
  const [showLetter, setShowLetter] = useState<boolean>(false);
  const [gardenCycle, setGardenCycle] = useState<number>(0);

  // Sinh ngẫu nhiên dữ liệu cho hơn 52 đóa hoa phủ kín màn hình
  // Không có 1 bông nào nhô cao bất thường, tạo thành thảm hoa lượn sóng tự nhiên
  const flowers: FlowerData[] = useMemo(() => {
    const list: FlowerData[] = [];
    const count = 52; // Mật độ dày đặc bao phủ toàn bộ đáy màn hình

    for (let i = 0; i < count; i++) {
      const segment = 98 / count;
      const x = Math.min(98, Math.max(2, i * segment + Math.sin(i * 3.7) * segment * 0.45));

      // 3 lớp chiều sâu phối cảnh
      const layerRank = (i * 7) % 3;
      const layer = layerRank === 0 ? 'back' : layerRank === 1 ? 'mid' : 'front';

      let heightPct = 45;
      let flowerSize = 52;

      // Chiều cao phân bố đồng đều, không có bông nào cao vượt trội hẳn
      if (layer === 'back') {
        heightPct = 32 + ((i * 13) % 20); // 32% - 52%
        flowerSize = 36 + ((i * 5) % 12); // 36px - 48px
      } else if (layer === 'mid') {
        heightPct = 48 + ((i * 17) % 20); // 48% - 68%
        flowerSize = 48 + ((i * 7) % 14); // 48px - 62px
      } else {
        heightPct = 56 + ((i * 19) % 20); // 56% - 76%
        flowerSize = 58 + ((i * 9) % 16); // 58px - 74px
      }

      // Tỉ lệ các loại hoa: đa số là hoa hồng xoắn cánh, xen kẽ hoa cúc xoắn và nụ vươn cao
      const typeRank = i % 8;
      const type: 'rose' | 'disc' | 'bud' =
        typeRank === 2 || typeRank === 6 ? 'bud' : typeRank === 4 ? 'disc' : 'rose';

      // Nụ hoa có thể vươn cao thanh mảnh như trong ảnh
      if (type === 'bud') {
        heightPct += 8;
        flowerSize = 28 + (i % 6);
      }

      const paletteIndex = (i * 3) % FLOWER_PALETTES.length;

      // Độ đung đưa trong gió
      const swayDuration = 2.8 + ((i * 3) % 18) * 0.1;
      const swayDelay = ((i * 7) % 20) * 0.1;
      const swayDeg = (i % 2 === 0 ? 1 : -1) * (1.8 + ((i * 2) % 3) * 0.6);

      // Thời gian mọc liên tục so le từ đáy lên (trong vòng 1.2s là phủ kín)
      const growDelay = 0.05 + ((i * 13) % count) * 0.025;
      const stemCurve = ((i * 11) % 20) - 10;

      list.push({
        id: i,
        x,
        heightPct,
        flowerSize,
        paletteIndex,
        type,
        swayDuration,
        swayDelay,
        swayDeg,
        growDelay,
        stemCurve,
        layer,
      });
    }

    // Vẽ lớp xa trước, lớp gần sau
    return list.sort((a, b) => {
      const order = { back: 1, mid: 2, front: 3 };
      return order[a.layer] - order[b.layer];
    });
  }, []);

  // Khi component xuất hiện (ngay sau khi thổi nến): mọc rừng hoa ngay lập tức, không cần tương tác
  useEffect(() => {
    soundManager.playFlowerBloomSound();
    confetti({
      particleCount: 65,
      spread: 90,
      origin: { y: 0.75 },
      colors: ['#fda4af', '#f43f5e', '#fed7aa', '#fef08a', '#86efac', '#7dd3fc'],
    });

    // Sau khi rừng hoa nở rộ trọn vẹn (khoảng 3.2s) thì mở thiệp chúc mừng
    const letterTimer = setTimeout(() => {
      setShowLetter(true);
    }, 3200);

    return () => clearTimeout(letterTimer);
  }, [gardenCycle]);

  // Cho hoa nở lại
  const handleReplayGarden = () => {
    soundManager.playKeypress(600);
    setShowLetter(false);
    setGardenCycle((c) => c + 1);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none flex flex-col items-center justify-between">
      {/* 1. NỀN BẦU TRỜI XANH DỊU DÀNG VỚI MÂY TRẮNG PASTEL (CHUẨN THEO ẢNH) */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[#a0d4ef] via-[#c6e6f7] to-[#e4f3fa]" />

      {/* Mây trắng trôi nhẹ */}
      <div className="absolute inset-0 -z-20 pointer-events-none opacity-40">
        <div className="absolute top-[8%] left-[10%] w-72 h-20 rounded-full bg-white/70 blur-xl" />
        <div className="absolute top-[18%] right-[8%] w-96 h-28 rounded-full bg-white/60 blur-2xl" />
        <div className="absolute top-[35%] left-[25%] w-80 h-24 rounded-full bg-white/50 blur-xl" />
      </div>

      {/* Cánh hoa rơi lất phất trong gió */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={`petal-${i}`}
            initial={{
              y: -30,
              x: `${(i * 6.5) % 100}%`,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: ['0vh', '105vh'],
              x: [`${(i * 6.5) % 100}%`, `${((i * 6.5) % 100) + (i % 2 === 0 ? 12 : -12)}%`],
              rotate: [0, 360 + i * 45],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 7 + (i % 5) * 1.5,
              repeat: Infinity,
              delay: i * 0.45,
              ease: 'linear',
            }}
            className="absolute"
          >
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{
                background:
                  i % 3 === 0
                    ? 'radial-gradient(circle, #fda4af 0%, #f43f5e 100%)'
                    : i % 3 === 1
                    ? 'radial-gradient(circle, #fed7aa 0%, #fb923c 100%)'
                    : 'radial-gradient(circle, #fef08a 0%, #facc15 100%)',
                borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* 2. DÒNG CHỮ TRÊN CÙNG */}
      <header className="relative z-30 pt-6 sm:pt-8 px-4 text-center max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/75 backdrop-blur-md border border-sky-200/80 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[11px] font-bold text-[#0284c7]">
              Rừng hoa thức giấc chúc mừng sinh nhật em
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 drop-shadow-xs">
            Cả một rừng hoa tươi thắm tặng em 🌸
          </h2>
        </motion.div>
      </header>

      {/* =================================================================== */}
      {/* 3. TOÀN BỘ RỪNG HOA MỌC ĐỒNG LOẠT TỪ ĐÁY LÊN KHÔNG CẦN TƯƠNG TÁC    */}
      {/* =================================================================== */}
      <div
        key={`garden-${gardenCycle}`}
        className="relative w-full flex-1 flex items-end justify-center pointer-events-none overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {flowers.map((fl) => {
            const pal = FLOWER_PALETTES[fl.paletteIndex];
            return (
              <div
                key={`fl-${fl.id}`}
                style={{
                  position: 'absolute',
                  left: `${fl.x}%`,
                  bottom: 0,
                  height: `${fl.heightPct}%`,
                  width: `${fl.flowerSize}px`,
                  transform: 'translateX(-50%)',
                  zIndex: fl.layer === 'back' ? 10 : fl.layer === 'mid' ? 20 : 30,
                  opacity: fl.layer === 'back' ? 0.9 : 1,
                  filter: fl.layer === 'back' ? 'brightness(1.02) saturate(0.95)' : 'none',
                }}
              >
                {/* Container đung đưa tự nhiên trong gió */}
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
                  {/* 1. ĐÓA HOA NỞ TRÊN ĐỈNH */}
                  <motion.div
                    initial={{ scale: 0, rotate: -25 }}
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
                      <ScallopedRose size={fl.flowerSize} palette={pal} />
                    )}
                    {fl.type === 'disc' && (
                      <SpiralDisc size={fl.flowerSize} palette={pal} />
                    )}
                    {fl.type === 'bud' && (
                      <FlameBud size={fl.flowerSize} palette={pal} />
                    )}
                  </motion.div>

                  {/* 2. THÂN CÀNH VÀ LÁ CÂY MỌC VÚT TỪ ĐÁY LÊN */}
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
                      {/* Thân cành xanh mướt */}
                      <path
                        d={`M 30 300 Q ${30 + fl.stemCurve} 150 30 0`}
                        fill="none"
                        stroke={fl.layer === 'back' ? '#22c55e' : '#15803d'}
                        strokeWidth={fl.layer === 'back' ? '3' : '4'}
                        strokeLinecap="round"
                      />
                      {/* Lá trái botanical */}
                      <path
                        d="M 30 160 Q 12 145 6 125 Q 18 135 30 155"
                        fill="#16a34a"
                        stroke="#14532d"
                        strokeWidth="1"
                      />
                      {/* Lá phải botanical */}
                      <path
                        d="M 30 220 Q 48 205 54 185 Q 42 195 30 215"
                        fill="#15803d"
                        stroke="#14532d"
                        strokeWidth="1"
                      />
                    </svg>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. TẤM THIỆP / BỨC THƯ TÌNH TỰ ĐỘNG HIỆN LÊN KHI HOA NỞ XONG          */}
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
              {/* Trang trí góc */}
              <div className="absolute top-3 left-3 text-xs opacity-60">🌸</div>
              <div className="absolute top-3 right-3 text-xs opacity-60">✨</div>
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

              {/* Các nút bấm tương tác */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                {/* Nút ngắm toàn cảnh rừng hoa (tạm ẩn thiệp) */}
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
      {/* 5. NÚT ĐIỀU KHIỂN DƯỚI ĐÁY CHUẨN XÁC THEO ẢNH NGƯỜI DÙNG CUNG CẤP    */}
      {/* =================================================================== */}
      <footer className="relative z-30 pb-4 px-4 flex flex-wrap items-center justify-center gap-2 max-w-lg w-full">
        {/* Nút 'Đọc lại thiệp' chuẩn theo ảnh */}
        {!showLetter && (
          <button
            type="button"
            onClick={() => {
              soundManager.playKeypress(700);
              setShowLetter(true);
            }}
            className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-md shadow-black/10 border border-white/80 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-500" />
            <span>Đọc lại thiệp</span>
          </button>
        )}

        {/* Nút 'Cho hoa nở lại' chuẩn theo ảnh */}
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
            transform: rotate(calc(-1 * var(--sway-angle, 3deg)));
          }
          100% {
            transform: rotate(var(--sway-angle, 3deg));
          }
        }
      `}</style>
    </div>
  );
}

// ===================================================================
// CÁC ĐÓA HOA SVG PAPER-CUT / SCALLOPED THEO ĐÚNG ẢNH TIKTOK
// ===================================================================

interface FlowerHeadProps {
  size: number;
  palette: (typeof FLOWER_PALETTES)[0];
}

// 1. ĐÓA HOA HỒNG GIẤY XOẮN CÁNH ĐA TẦNG (SCALLOPED PAPER-CUT ROSE)
function ScallopedRose({ size, palette }: FlowerHeadProps) {
  const { outer, mid, inner, core, stroke, highlight } = palette;

  // 6 lớp cánh lượn sóng so le
  const layers = [
    { r: 47, count: 8, amp: 4, fill: outer, rot: 0 },
    { r: 40, count: 7, amp: 3.5, fill: mid, rot: 0.4 },
    { r: 33, count: 7, amp: 3, fill: outer, rot: 0.8 },
    { r: 26, count: 6, amp: 2.5, fill: mid, rot: 1.2 },
    { r: 19, count: 5, amp: 2, fill: inner, rot: 1.6 },
    { r: 12, count: 4, amp: 1.5, fill: core, rot: 2.0 },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-sm">
      <defs>
        <filter id={`sh-${palette.name}-${size}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor={core} floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter={`url(#sh-${palette.name}-${size})`}>
        {layers.map((l, lIdx) => {
          let d = '';
          const n = l.count;
          for (let i = 0; i < n; i++) {
            const a1 = (i / n) * Math.PI * 2 + l.rot;
            const a2 = ((i + 1) / n) * Math.PI * 2 + l.rot;
            const amid = (a1 + a2) / 2;

            const rJoint = l.r - l.amp;
            const rPeak = l.r + l.amp;

            const p1x = 50 + rJoint * Math.cos(a1);
            const p1y = 50 + rJoint * Math.sin(a1);

            const cpx = 50 + rPeak * 1.15 * Math.cos(amid);
            const cpy = 50 + rPeak * 1.15 * Math.sin(amid);

            const p2x = 50 + rJoint * Math.cos(a2);
            const p2y = 50 + rJoint * Math.sin(a2);

            if (i === 0) d += `M ${p1x.toFixed(1)} ${p1y.toFixed(1)} `;
            d += `Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${p2x.toFixed(1)} ${p2y.toFixed(1)} `;
          }
          d += 'Z';
          return (
            <path
              key={`layer-${lIdx}`}
              d={d}
              fill={l.fill}
              stroke={stroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Nhụy xoắn tâm origami */}
        <circle cx="50" cy="50" r="6" fill={core} />
        <path
          d="M 50 46 C 53 46 54 48 53 51 C 52 54 48 54 47 52 C 45 49 47 47 49 47 C 51 47 51 49 50 50"
          fill="none"
          stroke={highlight}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// 2. HOA CÚC XOẮN TRÒN (SPIRAL BLOSSOM DISC)
function SpiralDisc({ size, palette }: FlowerHeadProps) {
  const { outer, mid, inner, core, stroke } = palette;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-sm">
      <circle cx="50" cy="50" r="46" fill={outer} stroke={stroke} strokeWidth="1.2" />
      <circle cx="50" cy="50" r="38" fill={mid} stroke={stroke} strokeWidth="1.1" />
      <circle cx="50" cy="50" r="30" fill={outer} stroke={stroke} strokeWidth="1" />
      <circle cx="50" cy="50" r="22" fill={inner} stroke={stroke} strokeWidth="1" />
      <circle cx="50" cy="50" r="14" fill={core} stroke={stroke} strokeWidth="1" />
      {/* Vòng xoắn cúc */}
      <path
        d="M 50 36 C 58 36 62 42 60 48 C 58 54 52 58 46 58 C 40 58 36 52 38 46 C 40 40 46 38 50 40"
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. BÚP HOA VƯƠN CAO XEN KẼ (FLAME / CUP BUD)
function FlameBud({ size, palette }: FlowerHeadProps) {
  const { outer, mid, inner } = palette;
  return (
    <svg width={size * 0.85} height={size * 1.3} viewBox="0 0 70 110" className="overflow-visible drop-shadow-sm">
      {/* Cánh búp sau */}
      <path d="M 35 15 C 26 28 20 60 35 90 C 50 60 44 28 35 15 Z" fill={inner} />
      {/* Cánh búp trái */}
      <path d="M 35 90 C 18 84 10 60 16 38 C 22 28 30 35 35 50 Z" fill={mid} />
      {/* Cánh búp phải */}
      <path d="M 35 90 C 52 84 60 60 54 38 C 48 28 40 35 35 50 Z" fill={outer} />
      {/* Cánh giữa khép búp */}
      <path d="M 35 92 C 24 88 20 66 26 48 C 30 38 40 38 44 48 C 50 66 46 88 35 92 Z" fill={mid} />
      {/* Đài hoa xanh ôm gốc búp */}
      <path d="M 22 90 C 26 100 35 104 35 104 C 35 104 44 100 48 90 C 44 94 35 96 22 90 Z" fill="#15803d" />
      <path d="M 35 92 L 35 106" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
