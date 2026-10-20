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

// Danh sách các bảng màu hoa Tulip pastel phong cách Hàn Quốc
const TULIP_PALETTES = [
  {
    name: 'blushPink',
    outer: '#fda4af',
    mid: '#fb7185',
    inner: '#f43f5e',
    dark: '#9f1239',
    tip: '#ffe4e6',
  },
  {
    name: 'sunsetPeach',
    outer: '#fed7aa',
    mid: '#fb923c',
    inner: '#ea580c',
    dark: '#9a3412',
    tip: '#fff7ed',
  },
  {
    name: 'butterYellow',
    outer: '#fef08a',
    mid: '#facc15',
    inner: '#eab308',
    dark: '#854d0e',
    tip: '#fefce8',
  },
  {
    name: 'softLavender',
    outer: '#e9d5ff',
    mid: '#c084fc',
    inner: '#9333ea',
    dark: '#581c87',
    tip: '#faf5ff',
  },
  {
    name: 'skyAzure',
    outer: '#bae6fd',
    mid: '#38bdf8',
    inner: '#0284c7',
    dark: '#075985',
    tip: '#f0f9ff',
  },
  {
    name: 'pearlWhite',
    outer: '#f8fafc',
    mid: '#e2e8f0',
    inner: '#cbd5e1',
    dark: '#64748b',
    tip: '#ffffff',
  },
  {
    name: 'rubyRose',
    outer: '#fecdd3',
    mid: '#f43f5e',
    inner: '#e11d48',
    dark: '#881337',
    tip: '#fff1f2',
  },
];

interface TulipData {
  id: number;
  x: number; // Tọa độ ngang (%)
  heightPct: number; // Chiều cao cành (%)
  flowerSize: number; // Kích thước đóa hoa (px)
  paletteIndex: number;
  type: 'bloom' | 'bud' | 'open';
  swayDuration: number;
  swayDelay: number;
  swayDeg: number;
  growDelay: number;
  stemCurve: number;
  layer: 'back' | 'mid' | 'front';
}

export default function FlowerForest({ onNext, onBackToCake }: Props) {
  // Các giai đoạn: 'SINGLE_ROSE' -> 'BLOOMING_GARDEN' -> 'LETTER_REVEALED'
  const [phase, setPhase] = useState<'SINGLE_ROSE' | 'BLOOMING_GARDEN'>('SINGLE_ROSE');
  const [showLetter, setShowLetter] = useState<boolean>(false);
  const [gardenCycle, setGardenCycle] = useState<number>(0);

  // Sinh ngẫu nhiên dữ liệu cho rừng hoa Tulip
  const flowers: TulipData[] = useMemo(() => {
    const list: TulipData[] = [];
    const count = 48; // Mật độ dày dặn tạo thành cánh đồng Tulip bát ngát

    for (let i = 0; i < count; i++) {
      const segment = 98 / count;
      const x = Math.min(98, Math.max(2, i * segment + Math.sin(i * 3.7) * segment * 0.45));

      // 3 lớp độ sâu phối cảnh
      const layerRank = (i * 7) % 3;
      const layer = layerRank === 0 ? 'back' : layerRank === 1 ? 'mid' : 'front';

      let heightPct = 40;
      let flowerSize = 46;
      if (layer === 'back') {
        heightPct = 26 + ((i * 13) % 24); // 26% - 50%
        flowerSize = 34 + ((i * 5) % 10); // 34px - 44px
      } else if (layer === 'mid') {
        heightPct = 46 + ((i * 17) % 24); // 46% - 70%
        flowerSize = 46 + ((i * 7) % 14); // 46px - 60px
      } else {
        heightPct = 62 + ((i * 19) % 26); // 62% - 88%
        flowerSize = 58 + ((i * 9) % 18); // 58px - 76px
      }

      const types: ('bloom' | 'bud' | 'open')[] = ['bloom', 'bloom', 'bud', 'open'];
      const type = types[i % types.length];
      const paletteIndex = (i * 3) % TULIP_PALETTES.length;

      // Độ đung đưa trong gió
      const swayDuration = 2.8 + ((i * 3) % 18) * 0.1;
      const swayDelay = ((i * 7) % 20) * 0.1;
      const swayDeg = (i % 2 === 0 ? 1 : -1) * (2.2 + ((i * 2) % 3) * 0.7);

      // Thời gian nở so le
      const distFromCenter = Math.abs(x - 50);
      const growDelay = 0.12 + (distFromCenter / 50) * 1.1 + Math.sin(i) * 0.2;

      const stemCurve = ((i * 11) % 24) - 12;

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

    return list.sort((a, b) => {
      const order = { back: 1, mid: 2, front: 3 };
      return order[a.layer] - order[b.layer];
    });
  }, []);

  // Tự động chuyển từ đóa tulip đơn sang cả cánh đồng tulip sau 2.4 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase === 'SINGLE_ROSE') {
        setPhase('BLOOMING_GARDEN');
        soundManager.playFlowerBloomSound();
        confetti({
          particleCount: 55,
          spread: 85,
          origin: { y: 0.8 },
          colors: ['#fda4af', '#f43f5e', '#fed7aa', '#fef08a', '#e9d5ff', '#bae6fd'],
        });
      }
    }, 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  // Tự động mở thiệp chúc sau khi cả rừng hoa tulip đã mọc lên
  useEffect(() => {
    if (phase === 'BLOOMING_GARDEN') {
      const letterTimer = setTimeout(() => {
        setShowLetter(true);
      }, 3600);
      return () => clearTimeout(letterTimer);
    }
  }, [phase, gardenCycle]);

  // Kích hoạt cho tulip nở lại từ đầu
  const handleReplayGarden = () => {
    soundManager.playKeypress(600);
    setPhase('SINGLE_ROSE');
    setShowLetter(false);
    setGardenCycle((c) => c + 1);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none flex flex-col items-center justify-between">
      {/* 1. NỀN BẦU TRỜI XANH DỊU DÀNG VỚI MÂY TRẮNG PASTEL */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[#aedcf4] via-[#ceeaf8] to-[#e8f5fc]" />

      {/* Những vệt mây lững lờ trôi */}
      <div className="absolute inset-0 -z-20 pointer-events-none opacity-45">
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
              className="w-3.5 h-4.5 rounded-full"
              style={{
                background:
                  i % 3 === 0
                    ? 'radial-gradient(circle, #fda4af 0%, #f43f5e 100%)'
                    : i % 3 === 1
                    ? 'radial-gradient(circle, #fed7aa 0%, #fb923c 100%)'
                    : 'radial-gradient(circle, #fef08a 0%, #facc15 100%)',
                borderRadius: '50% 50% 60% 40% / 60% 60% 40% 40%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* 2. DÒNG CHỮ DẪN DẮT TRÊN CÙNG */}
      <header className="relative z-30 pt-6 sm:pt-8 px-4 text-center max-w-md w-full">
        <AnimatePresence mode="wait">
          {phase === 'SINGLE_ROSE' ? (
            <motion.div
              key="intro-quote"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#2563eb]/80 uppercase">
                Dành tặng riêng em • 16 Tháng 11
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 drop-shadow-xs">
                Từ một đóa Tulip nhỏ… 🌷
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                (Chạm vào đóa hoa hoặc đợi hoa thức giấc nhé)
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="garden-quote"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-sky-200/80 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] font-bold text-[#0284c7]">
                  Cả một cánh đồng hoa Tulip đang thức giấc tặng em
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 drop-shadow-xs">
                Từ một đóa hoa, cả một vườn hoa nở rộ… 🌷
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =================================================================== */}
      {/* 3. KHU VỰC HIỂN THỊ HOA TULIP                                        */}
      {/* =================================================================== */}
      <div className="relative w-full flex-1 flex items-end justify-center pointer-events-none">
        
        {/* A. ĐÓA HOA TULIP TRUNG TÂM NỞ ĐẦU TIÊN (GIAI ĐOẠN 1) */}
        {phase === 'SINGLE_ROSE' && (
          <div
            onClick={() => {
              setPhase('BLOOMING_GARDEN');
              soundManager.playFlowerBloomSound();
            }}
            className="absolute bottom-0 z-40 flex flex-col items-center cursor-pointer pointer-events-auto group"
            style={{ width: '160px', height: '64vh' }}
          >
            {/* Đóa hoa Tulip kiêu sa ở đỉnh */}
            <motion.div
              initial={{ scale: 0, y: 30 }}
              animate={{ scale: [0, 1.15, 1], y: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="relative -mb-3 z-20 group-hover:scale-110 transition-transform duration-300"
            >
              <TulipBloom size={105} palette={TULIP_PALETTES[0]} />
            </motion.div>

            {/* Thân cành hoa và lá tulip vươn lên */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              style={{ transformOrigin: 'bottom center' }}
              className="relative w-full flex-1 flex justify-center"
            >
              <svg
                width="140"
                height="100%"
                viewBox="0 0 140 400"
                preserveAspectRatio="none"
                className="overflow-visible"
              >
                {/* Cuống hoa xanh mướt */}
                <path
                  d="M 70 400 Q 66 200 70 0"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Lá tulip dài hình lưỡi kiếm đặc trưng bên trái */}
                <path
                  d="M 70 320 C 30 280 10 180 20 80 C 40 140 55 220 70 300 Z"
                  fill="#22c55e"
                  stroke="#15803d"
                  strokeWidth="1.5"
                  opacity="0.95"
                />
                {/* Lá tulip bên phải */}
                <path
                  d="M 70 350 C 105 310 130 210 120 110 C 105 170 88 250 70 330 Z"
                  fill="#16a34a"
                  stroke="#14532d"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
              </svg>
            </motion.div>

            {/* Lời nhắc chạm vào hoa */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -top-10 px-3 py-1 rounded-full bg-white/90 shadow-md text-[11px] font-bold text-rose-600 border border-pink-200 animate-bounce"
            >
              👆 Chạm để nở cả vườn Tulip!
            </motion.div>
          </div>
        )}

        {/* B. TOÀN BỘ CÁNH ĐỒNG HOA TULIP MỌC TỪ ĐÁY LÊN (GIAI ĐOẠN 2 & 3) */}
        {phase === 'BLOOMING_GARDEN' && (
          <div key={`garden-cycle-${gardenCycle}`} className="absolute inset-0 overflow-hidden pointer-events-none">
            {flowers.map((fl) => {
              const pal = TULIP_PALETTES[fl.paletteIndex];
              return (
                <div
                  key={`tulip-${fl.id}`}
                  style={{
                    position: 'absolute',
                    left: `${fl.x}%`,
                    bottom: 0,
                    height: `${fl.heightPct}%`,
                    width: `${fl.flowerSize}px`,
                    transform: 'translateX(-50%)',
                    zIndex: fl.layer === 'back' ? 10 : fl.layer === 'mid' ? 20 : 30,
                    opacity: fl.layer === 'back' ? 0.85 : 1,
                    filter: fl.layer === 'back' ? 'brightness(1.04) saturate(0.95)' : 'none',
                  }}
                >
                  {/* Container đung đưa trong gió bằng CSS transform */}
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
                    {/* 1. ĐÓA HOA TULIP TRÊN ĐỈNH */}
                    <motion.div
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: [0, 1.15, 1], y: 0 }}
                      transition={{
                        duration: 0.85,
                        delay: fl.growDelay + 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="relative z-20 flex items-center justify-center -mb-2"
                      style={{
                        width: `${fl.flowerSize}px`,
                        height: `${fl.flowerSize * 1.15}px`,
                      }}
                    >
                      {fl.type === 'bloom' && (
                        <TulipBloom size={fl.flowerSize} palette={pal} />
                      )}
                      {fl.type === 'bud' && (
                        <TulipBud size={fl.flowerSize} palette={pal} />
                      )}
                      {fl.type === 'open' && (
                        <TulipOpen size={fl.flowerSize} palette={pal} />
                      )}
                    </motion.div>

                    {/* 2. THÂN CÀNH VÀ LÁ TULIP MỌC TỪ ĐÁY LÊN */}
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
                          stroke={fl.layer === 'back' ? '#4ade80' : '#16a34a'}
                          strokeWidth={fl.layer === 'back' ? '3' : '4'}
                          strokeLinecap="round"
                        />
                        {/* Lá tulip trái ôm thân */}
                        <path
                          d="M 30 250 C 10 210 2 130 8 60 C 20 110 26 180 30 230 Z"
                          fill="#22c55e"
                          stroke="#15803d"
                          strokeWidth="1"
                          opacity={fl.layer === 'back' ? 0.8 : 0.95}
                        />
                        {/* Lá tulip phải */}
                        <path
                          d="M 30 270 C 50 230 58 150 52 80 C 44 130 38 190 30 250 Z"
                          fill="#16a34a"
                          stroke="#14532d"
                          strokeWidth="1"
                          opacity={fl.layer === 'back' ? 0.75 : 0.9}
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. TẤM THIỆP / BỨC THƯ TÌNH CHÚC MỪNG SINH NHẬT VỚI HOA TULIP         */}
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
              <div className="absolute top-3 left-3 text-xs opacity-60">🌷</div>
              <div className="absolute top-3 right-3 text-xs opacity-60">✨</div>
              <div className="absolute bottom-3 left-3 text-xs opacity-60">🌿</div>
              <div className="absolute bottom-3 right-3 text-xs opacity-60">💖</div>

              {/* Huy hiệu đỉnh thiệp */}
              <div className="flex justify-center -mt-1 mb-2">
                <span className="px-3.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-200/80 shadow-2xs">
                  Gửi bạn thương mến 🌷
                </span>
              </div>

              {/* Tiêu đề chính bức thư */}
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-800 tracking-tight leading-snug">
                Mong những điều dịu dàng<br />luôn nở rộ bên bạn.
              </h3>

              {/* Nội dung lời chúc ý nghĩa */}
              <div className="mt-3.5 text-xs sm:text-[13px] text-stone-600 leading-relaxed space-y-2.5 font-medium px-1 sm:px-2">
                <p>
                  Mỗi đóa hoa tulip có thể tàn một ngày không đẹp. Còn bạn, làm thế giới này dịu dàng hơn.
                </p>
                <p className="p-2.5 rounded-xl bg-pink-100/60 border border-pink-200/60 text-stone-700 font-semibold text-xs">
                  Nhân ngày sinh nhật 16/11, chúc bạn luôn được yêu thương, trân trọng và có thật nhiều niềm vui. Giống như những đóa tulip kiêu hãnh và thanh thuần, hãy cứ tự tin tỏa sáng theo cách của riêng mình nhé.
                </p>
                <p className="italic text-stone-500 text-[11px]">
                  Hôm nay và cả những ngày sau, hãy cứ rạng rỡ và hạnh phúc theo cách của bạn.
                </p>
              </div>

              {/* Lời kết ngọt ngào */}
              <div className="mt-3 pt-2 border-t border-pink-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                <span>Gửi bạn thật nhiều thương yêu ♡</span>
                <span className="font-bold text-rose-500">ngàn đóa tulip</span>
              </div>

              {/* Các nút bấm tương tác */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                {/* Nút ngắm toàn cảnh vườn tulip (tạm ẩn thiệp) */}
                <button
                  type="button"
                  onClick={() => setShowLetter(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-pink-500" />
                  <span>Ngắm vườn Tulip 🌷</span>
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
      {/* 5. THANH ĐIỀU KHIỂN DƯỚI ĐÁY KHI ĐANG NGẮM VƯỜN TULIP                */}
      {/* =================================================================== */}
      {phase === 'BLOOMING_GARDEN' && (
        <footer className="relative z-30 pb-4 px-4 flex flex-wrap items-center justify-center gap-2 max-w-lg w-full">
          {/* Nút mở lại thiệp chúc nếu đang đóng */}
          {!showLetter && (
            <button
              type="button"
              onClick={() => {
                soundManager.playKeypress(700);
                setShowLetter(true);
              }}
              className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-rose-600 text-xs font-bold shadow-md shadow-pink-300/30 border border-pink-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Đọc lại bức thư 💌</span>
            </button>
          )}

          {/* Nút cho hoa nở lại */}
          <button
            type="button"
            onClick={handleReplayGarden}
            className="px-3.5 py-2 rounded-full bg-white/80 hover:bg-white text-stone-600 text-xs font-semibold shadow-xs border border-sky-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            title="Xem lại hiệu ứng hoa mọc từ đầu"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-500" />
            <span>Cho Tulip nở lại 🌷</span>
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
      )}

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
// CÁC THÀNH PHẦN HOA TULIP SVG VẼ THỦ CÔNG TINH XẢO
// ===================================================================

interface TulipHeadProps {
  size: number;
  palette: (typeof TULIP_PALETTES)[0];
}

// 1. HOA TULIP NỞ DÁNG CHÉN HOÀNG GIA (CLASSIC TULIP BLOOM)
function TulipBloom({ size, palette }: TulipHeadProps) {
  const gradId = `tulip-grad-${palette.name}-${size}`;
  const darkGradId = `tulip-dark-${palette.name}-${size}`;

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" className="overflow-visible drop-shadow-sm">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.inner} />
          <stop offset="40%" stopColor={palette.mid} />
          <stop offset="80%" stopColor={palette.outer} />
          <stop offset="100%" stopColor={palette.tip} />
        </linearGradient>
        <linearGradient id={darkGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.dark} />
          <stop offset="60%" stopColor={palette.inner} />
          <stop offset="100%" stopColor={palette.mid} />
        </linearGradient>
      </defs>

      {/* Cánh sau trung tâm hé mở */}
      <path
        d="M 50 12 C 40 22 36 55 50 88 C 64 55 60 22 50 12 Z"
        fill={`url(#${darkGradId})`}
      />

      {/* Cánh trái ôm dáng chén */}
      <path
        d="M 50 88 C 28 84 14 62 18 36 C 20 22 32 18 42 30 C 47 48 48 70 50 88 Z"
        fill={`url(#${gradId})`}
      />

      {/* Cánh phải ôm đè lên cánh trái */}
      <path
        d="M 50 88 C 72 84 86 62 82 36 C 80 22 68 18 58 30 C 53 48 52 70 50 88 Z"
        fill={`url(#${gradId})`}
        opacity="0.95"
      />

      {/* Cánh trước trung tâm tạo khối nổi 3D */}
      <path
        d="M 50 90 C 34 86 28 66 32 44 C 35 28 44 24 50 32 C 56 24 65 28 68 44 C 72 66 66 86 50 90 Z"
        fill={`url(#${gradId})`}
      />

      {/* Sống gân sáng nổi bật phản chiếu ánh mặt trời */}
      <path
        d="M 49 40 Q 48 62 50 82"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* Đài hoa xanh nối vào cuống */}
      <path d="M 44 90 C 46 95 54 95 56 90 Z" fill="#15803d" />
    </svg>
  );
}

// 2. BÚP HOA TULIP THON THẢ E ẤP (SLENDER TULIP BUD)
function TulipBud({ size, palette }: TulipHeadProps) {
  const gradId = `tbud-grad-${palette.name}-${size}`;
  const darkGradId = `tbud-dark-${palette.name}-${size}`;

  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" className="overflow-visible drop-shadow-sm">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.inner} />
          <stop offset="45%" stopColor={palette.mid} />
          <stop offset="85%" stopColor={palette.outer} />
          <stop offset="100%" stopColor={palette.tip} />
        </linearGradient>
        <linearGradient id={darkGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.dark} />
          <stop offset="65%" stopColor={palette.inner} />
          <stop offset="100%" stopColor={palette.mid} />
        </linearGradient>
      </defs>

      {/* Cánh sau */}
      <path d="M 50 16 C 42 24 38 55 50 90 C 62 55 58 24 50 16 Z" fill={`url(#${darkGradId})`} />

      {/* Cánh trái */}
      <path d="M 50 90 C 32 86 22 64 25 40 C 27 26 38 22 45 34 C 48 52 49 72 50 90 Z" fill={`url(#${gradId})`} />

      {/* Cánh phải */}
      <path d="M 50 90 C 68 86 78 64 75 40 C 73 26 62 22 55 34 C 52 52 51 72 50 90 Z" fill={`url(#${gradId})`} opacity="0.96" />

      {/* Cánh giữa khép búp */}
      <path d="M 50 91 C 38 88 34 68 37 48 C 40 34 46 30 50 38 C 54 30 60 34 63 48 C 66 68 62 88 50 91 Z" fill={`url(#${gradId})`} />

      {/* Vệt phản quang */}
      <path d="M 50 44 Q 49 66 50 84" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M 45 91 C 47 95 53 95 55 91 Z" fill="#15803d" />
    </svg>
  );
}

// 3. HOA TULIP NỞ RỘ CÁNH XÒE TỰ DO (OPEN TULIP BLOOM)
function TulipOpen({ size, palette }: TulipHeadProps) {
  const gradId = `topen-grad-${palette.name}-${size}`;
  const darkGradId = `topen-dark-${palette.name}-${size}`;

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" className="overflow-visible drop-shadow-sm">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.inner} />
          <stop offset="40%" stopColor={palette.mid} />
          <stop offset="80%" stopColor={palette.outer} />
          <stop offset="100%" stopColor={palette.tip} />
        </linearGradient>
        <linearGradient id={darkGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={palette.dark} />
          <stop offset="60%" stopColor={palette.inner} />
          <stop offset="100%" stopColor={palette.mid} />
        </linearGradient>
      </defs>

      {/* Cánh sau */}
      <path d="M 50 10 C 38 20 34 55 50 88 C 66 55 62 20 50 10 Z" fill={`url(#${darkGradId})`} />

      {/* Cánh trái xòe nhẹ */}
      <path d="M 50 88 C 26 82 12 58 16 32 C 18 18 30 14 42 28 C 46 48 48 70 50 88 Z" fill={`url(#${gradId})`} />

      {/* Cánh phải xòe nhẹ */}
      <path d="M 50 88 C 74 82 88 58 84 32 C 82 18 70 14 58 28 C 54 48 52 70 50 88 Z" fill={`url(#${gradId})`} opacity="0.95" />

      {/* Cánh trước xòe */}
      <path d="M 50 90 C 32 85 26 64 30 42 C 34 26 43 22 50 30 C 57 22 66 26 70 42 C 74 64 68 85 50 90 Z" fill={`url(#${gradId})`} />

      {/* Vệt sáng */}
      <path d="M 49 38 Q 48 60 50 82" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M 44 90 C 46 95 54 95 56 90 Z" fill="#15803d" />
    </svg>
  );
}
