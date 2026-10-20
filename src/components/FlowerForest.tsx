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

// Danh sách các bảng màu hoa pastel phong phú như video TikTok
const FLOWER_PALETTES = [
  {
    name: 'pink',
    outer: '#fbcfe8',
    mid: '#f472b6',
    inner: '#db2777',
    center: '#9d174d',
    highlight: '#fdf2f8',
  },
  {
    name: 'deepRose',
    outer: '#fda4af',
    mid: '#fb7185',
    inner: '#e11d48',
    center: '#9f1239',
    highlight: '#fff1f2',
  },
  {
    name: 'peach',
    outer: '#fed7aa',
    mid: '#fb923c',
    inner: '#ea580c',
    center: '#9a3412',
    highlight: '#fff7ed',
  },
  {
    name: 'yellow',
    outer: '#fef08a',
    mid: '#facc15',
    inner: '#eab308',
    center: '#854d0e',
    highlight: '#fefce8',
  },
  {
    name: 'skyBlue',
    outer: '#bae6fd',
    mid: '#38bdf8',
    inner: '#0284c7',
    center: '#075985',
    highlight: '#f0f9ff',
  },
  {
    name: 'lavender',
    outer: '#e9d5ff',
    mid: '#c084fc',
    inner: '#9333ea',
    center: '#581c87',
    highlight: '#faf5ff',
  },
  {
    name: 'mint',
    outer: '#bbf7d0',
    mid: '#4ade80',
    inner: '#16a34a',
    center: '#14532d',
    highlight: '#f0fdf4',
  },
];

interface FlowerData {
  id: number;
  x: number; // Tọa độ ngang (%)
  heightPct: number; // Chiều cao cành (%)
  flowerSize: number; // Kích thước đóa hoa (px)
  paletteIndex: number;
  type: 'rose' | 'ranunculus' | 'pompom';
  swayDuration: number;
  swayDelay: number;
  swayDeg: number;
  growDelay: number;
  stemCurve: number; // Độ cong của thân (-15 đến +15)
  layer: 'back' | 'mid' | 'front';
}

export default function FlowerForest({ onNext, onBackToCake }: Props) {
  // Các giai đoạn: 'SINGLE_ROSE' -> 'BLOOMING_GARDEN' -> 'LETTER_REVEALED'
  const [phase, setPhase] = useState<'SINGLE_ROSE' | 'BLOOMING_GARDEN'>('SINGLE_ROSE');
  const [showLetter, setShowLetter] = useState<boolean>(false);
  const [gardenCycle, setGardenCycle] = useState<number>(0);

  // Sinh ngẫu nhiên dữ liệu cho rừng hoa (ổn định qua useMemo)
  const flowers: FlowerData[] = useMemo(() => {
    const list: FlowerData[] = [];
    const count = 48; // Đủ dày đặc để tạo thành một "rừng hoa"

    for (let i = 0; i < count; i++) {
      // Phân bố đều từ 1% đến 99% màn hình có độ xê dịch tự nhiên
      const segment = 98 / count;
      const x = Math.min(98, Math.max(2, i * segment + (Math.sin(i * 3.7) * segment * 0.4)));
      
      // 3 lớp chiều sâu: xa (back), vừa (mid), gần (front)
      const layerRank = (i * 7) % 3;
      const layer = layerRank === 0 ? 'back' : layerRank === 1 ? 'mid' : 'front';

      // Chiều cao cành tương ứng với lớp
      let heightPct = 40;
      let flowerSize = 48;
      if (layer === 'back') {
        heightPct = 25 + ((i * 13) % 25); // 25% - 50%
        flowerSize = 34 + ((i * 5) % 12); // 34px - 46px
      } else if (layer === 'mid') {
        heightPct = 45 + ((i * 17) % 25); // 45% - 70%
        flowerSize = 46 + ((i * 7) % 16); // 46px - 62px
      } else {
        heightPct = 60 + ((i * 19) % 28); // 60% - 88%
        flowerSize = 58 + ((i * 9) % 22); // 58px - 80px
      }

      const types: ('rose' | 'ranunculus' | 'pompom')[] = ['rose', 'rose', 'ranunculus', 'pompom'];
      const type = types[i % types.length];
      const paletteIndex = (i * 3) % FLOWER_PALETTES.length;

      // Độ đung đưa trong gió
      const swayDuration = 2.8 + ((i * 3) % 18) * 0.1; // 2.8s - 4.6s
      const swayDelay = ((i * 7) % 20) * 0.1;
      const swayDeg = (i % 2 === 0 ? 1 : -1) * (2.2 + ((i * 2) % 3) * 0.8); // ±2.2° đến ±4°

      // Thời gian nở so le (stagger)
      // Tỏa từ trung tâm ra 2 bên hoặc nở nối tiếp
      const distFromCenter = Math.abs(x - 50);
      const growDelay = 0.15 + (distFromCenter / 50) * 1.2 + (Math.sin(i) * 0.2);

      const stemCurve = ((i * 11) % 25) - 12; // -12 đến +12px

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

    // Sắp xếp vẽ lớp xa trước, lớp gần sau để tạo chiều sâu 3D tự nhiên
    return list.sort((a, b) => {
      const order = { back: 1, mid: 2, front: 3 };
      return order[a.layer] - order[b.layer];
    });
  }, []);

  // Tự động chuyển từ bông hoa đơn sang cả rừng hoa sau 2.2 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase === 'SINGLE_ROSE') {
        setPhase('BLOOMING_GARDEN');
        soundManager.playFlowerBloomSound();
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.8 },
          colors: ['#fda4af', '#f472b6', '#fef08a', '#bae6fd', '#bbf7d0'],
        });
      }
    }, 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  // Tự động mở thiệp chúc sau khi cả rừng hoa đã mọc lên
  useEffect(() => {
    if (phase === 'BLOOMING_GARDEN') {
      const letterTimer = setTimeout(() => {
        setShowLetter(true);
      }, 3600);
      return () => clearTimeout(letterTimer);
    }
  }, [phase, gardenCycle]);

  // Kích hoạt rừng hoa nở lại từ đầu
  const handleReplayGarden = () => {
    soundManager.playKeypress(600);
    setPhase('SINGLE_ROSE');
    setShowLetter(false);
    setGardenCycle((c) => c + 1);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none flex flex-col items-center justify-between">
      {/* 1. NỀN BẦU TRỜI XANH DỊU DÀNG VỚI MÂY TRẮNG PASTEL (NHƯ VIDEO GỐC) */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[#aedcf4] via-[#ceeaf8] to-[#e8f5fc]" />

      {/* Những vệt mây lững lờ trôi */}
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

      {/* 2. DÒNG CHỮ DẪN DẮT TRÊN CÙNG (DÀNH HẾT TỰ HÀO & NÉT THƯƠNG YÊU) */}
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
                Từ một đóa hoa nhỏ…
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
                  Cả một rừng hoa đang thức giấc tặng em
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 drop-shadow-xs">
                Từ một bông hoa, cả một vườn hoa nở rộ… 🌸
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =================================================================== */}
      {/* 3. KHU VỰC HIỂN THỊ HOA                                              */}
      {/* =================================================================== */}
      <div className="relative w-full flex-1 flex items-end justify-center pointer-events-none">
        
        {/* A. BÔNG HOA HỒNG TRUNG TÂM NỞ ĐẦU TIÊN (GIAI ĐOẠN 1) */}
        {phase === 'SINGLE_ROSE' && (
          <div
            onClick={() => {
              setPhase('BLOOMING_GARDEN');
              soundManager.playFlowerBloomSound();
            }}
            className="absolute bottom-0 z-40 flex flex-col items-center cursor-pointer pointer-events-auto group"
            style={{ width: '160px', height: '62vh' }}
          >
            {/* Đóa hoa hồng xoắn cánh lớn ở đỉnh */}
            <motion.div
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: [0, 1.15, 1], rotate: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="relative -mb-4 z-20 group-hover:scale-110 transition-transform duration-300"
            >
              <RoseHead size={110} palette={FLOWER_PALETTES[0]} />
            </motion.div>

            {/* Thân cành hoa mọc vút lên từ đáy */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ transformOrigin: 'bottom center' }}
              className="relative w-full flex-1 flex justify-center"
            >
              <svg
                width="120"
                height="100%"
                viewBox="0 0 120 400"
                preserveAspectRatio="none"
                className="overflow-visible"
              >
                {/* Cuống hoa xanh mướt */}
                <path
                  d="M 60 400 Q 56 200 60 0"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Lá bên trái */}
                <path
                  d="M 58 220 Q 20 200 15 170 Q 35 185 58 215"
                  fill="#22c55e"
                  stroke="#15803d"
                  strokeWidth="1.5"
                />
                {/* Lá bên phải */}
                <path
                  d="M 60 280 Q 100 260 105 230 Q 85 245 60 275"
                  fill="#22c55e"
                  stroke="#15803d"
                  strokeWidth="1.5"
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
              👆 Chạm để nở cả rừng hoa!
            </motion.div>
          </div>
        )}

        {/* B. TOÀN BỘ RỪNG HOA MỌC TỪ ĐÁY LÊN (GIAI ĐOẠN 2 & 3) */}
        {phase === 'BLOOMING_GARDEN' && (
          <div key={`garden-cycle-${gardenCycle}`} className="absolute inset-0 overflow-hidden pointer-events-none">
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
                    zIndex: fl.layer === 'back' ? 10 : fl.layer === 'mid' ? 20 : 30,
                    opacity: fl.layer === 'back' ? 0.85 : 1,
                    filter: fl.layer === 'back' ? 'brightness(1.05) saturate(0.95)' : 'none',
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
                        <RoseHead size={fl.flowerSize} palette={pal} />
                      )}
                      {fl.type === 'ranunculus' && (
                        <RanunculusHead size={fl.flowerSize} palette={pal} />
                      )}
                      {fl.type === 'pompom' && (
                        <PompomHead size={fl.flowerSize} palette={pal} />
                      )}
                    </motion.div>

                    {/* 2. THÂN CÀNH VÀ LÁ MỌC TỪ ĐÁY LÊN */}
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
                        width={Math.max(40, fl.flowerSize)}
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
                        {/* Lá trái */}
                        <path
                          d="M 30 160 Q 10 145 5 125 Q 18 135 30 155"
                          fill="#22c55e"
                          stroke="#15803d"
                          strokeWidth="1"
                        />
                        {/* Lá phải */}
                        <path
                          d="M 30 210 Q 50 195 55 175 Q 42 185 30 205"
                          fill="#22c55e"
                          stroke="#15803d"
                          strokeWidth="1"
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
      {/* 4. TẤM THIỆP / BỨC THƯ TÌNH CHÚC MỪNG SINH NHẬT (NHƯ VIDEO)          */}
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
              {/* Nơ trang trí góc */}
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

              {/* Nội dung lời chúc ý nghĩa (như video TikTok) */}
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
      {/* 5. THANH ĐIỀU KHIỂN DƯỚI ĐÁY KHI ĐANG NGẮM RỪNG HOA                  */}
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
            <span>Cho hoa nở lại 🌸</span>
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
// CÁC THÀNH PHẦN HOA SVG NGHỆ THUẬT VẼ CHI TIẾT
// ===================================================================

interface HeadProps {
  size: number;
  palette: (typeof FLOWER_PALETTES)[0];
}

// 1. ĐÓA HOA HỒNG ANH QUỐC XOẮN CÁNH (ENGLISH SPIRAL ROSE)
function RoseHead({ size, palette }: HeadProps) {
  const gradId = `rose-grad-${palette.name}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-sm">
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.center} />
          <stop offset="35%" stopColor={palette.inner} />
          <stop offset="70%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.outer} />
        </radialGradient>
      </defs>

      {/* Vành cánh hoa ngoài cùng lượn sóng */}
      <path
        d="M 50 5 C 65 5 78 12 88 24 C 98 36 98 55 93 68 C 88 81 75 92 60 95 C 45 98 28 95 18 84 C 8 73 3 58 6 42 C 9 26 22 10 38 6 Z"
        fill={palette.outer}
        stroke={palette.mid}
        strokeWidth="1.2"
        opacity="0.95"
      />

      {/* Lớp cánh hoa thứ hai */}
      <path
        d="M 50 14 C 62 14 74 20 80 30 C 86 40 85 55 80 65 C 75 75 64 83 52 84 C 40 85 28 80 20 71 C 12 62 12 48 16 37 C 20 26 34 14 50 14 Z"
        fill={palette.mid}
        stroke={palette.inner}
        strokeWidth="1"
      />

      {/* Lớp cánh hoa thứ ba lượn xoắn */}
      <path
        d="M 50 24 C 58 24 68 28 72 36 C 76 44 74 54 70 61 C 66 68 56 73 47 73 C 38 73 30 68 25 60 C 20 52 21 42 26 34 C 31 26 40 24 50 24 Z"
        fill={palette.inner}
        opacity="0.9"
      />

      {/* Vòng xoắn tâm hoa hồng (Rose Spiral Core) */}
      <path
        d="M 50 34 C 58 34 62 40 60 46 C 58 52 52 56 46 56 C 40 56 36 50 38 45 C 40 40 45 38 49 40 C 53 42 52 47 49 48"
        fill="none"
        stroke={palette.highlight}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="46" r="3.5" fill={palette.center} />
    </svg>
  );
}

// 2. ĐÓA HOA MAO LƯƠNG TRÒN NHIỀU LỚP (RANUNCULUS)
function RanunculusHead({ size, palette }: HeadProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-sm">
      {/* Vòng cánh ngoài */}
      <circle cx="50" cy="50" r="46" fill={palette.outer} opacity="0.9" />
      {/* Các vệt cánh tròn bao quanh */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="26"
          rx="18"
          ry="12"
          fill={palette.mid}
          opacity="0.75"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="32" fill={palette.mid} />
      {[22, 67, 112, 157, 202, 247, 292, 337].map((angle, i) => (
        <ellipse
          key={`in-${i}`}
          cx="50"
          cy="34"
          rx="12"
          ry="9"
          fill={palette.inner}
          opacity="0.85"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="18" fill={palette.inner} />
      <circle cx="50" cy="50" r="8" fill={palette.center} />
      <circle cx="48" cy="48" r="2.5" fill={palette.highlight} />
    </svg>
  );
}

// 3. ĐÓA CÚC CẦU XINH XẮN (POMPOM BLOSSOM)
function PompomHead({ size, palette }: HeadProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible drop-shadow-sm">
      <circle cx="50" cy="50" r="44" fill={palette.outer} />
      {/* Các tia cánh hoa nhỏ tròn tủa đều */}
      {[...Array(16)].map((_, i) => (
        <circle
          key={i}
          cx={50 + 34 * Math.cos((i * Math.PI) / 8)}
          cy={50 + 34 * Math.sin((i * Math.PI) / 8)}
          r="8"
          fill={palette.mid}
          opacity="0.9"
        />
      ))}
      <circle cx="50" cy="50" r="30" fill={palette.mid} />
      {[...Array(12)].map((_, i) => (
        <circle
          key={`mid-${i}`}
          cx={50 + 20 * Math.cos((i * Math.PI) / 6)}
          cy={50 + 20 * Math.sin((i * Math.PI) / 6)}
          r="6.5"
          fill={palette.inner}
        />
      ))}
      <circle cx="50" cy="50" r="16" fill={palette.inner} />
      <circle cx="50" cy="50" r="8" fill={palette.center} />
    </svg>
  );
}
