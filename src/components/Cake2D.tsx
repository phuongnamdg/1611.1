'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Hand } from 'lucide-react';

interface Props {
  isCandleBlown: boolean;
  canClickToExtinguish: boolean;
  onExtinguishCandle: () => void;
  blowStrength?: number; // 0 (yên tĩnh) đến 1 (thổi mạnh)
}

export default function Cake2D({
  isCandleBlown,
  canClickToExtinguish,
  onExtinguishCandle,
  blowStrength = 0,
}: Props) {
  // Tính độ nghiêng của ngọn lửa khi có gió thổi vào micro
  const isBlowing = blowStrength > 0.05;
  const flameTilt = isBlowing ? Math.min(blowStrength * 38, 42) : 0;
  const flameScaleY = isBlowing ? Math.max(1 - blowStrength * 0.4, 0.6) : 1;
  const flameScaleX = isBlowing ? Math.min(1 + blowStrength * 0.5, 1.45) : 1;

  // Tọa độ các búi kem chân bánh (Piped cream base)
  const bottomCreamPuffs = useMemo(() => {
    return Array.from({ length: 11 }).map((_, i) => {
      const cx = 82 + i * 19.6;
      // Đường cong hình elip theo đáy bánh
      const progress = (i - 5) / 5; // -1 đến 1
      const cy = 308 + (1 - progress * progress) * 11;
      return { cx, cy };
    });
  }, []);

  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[420px] mx-auto flex flex-col items-center justify-center select-none">
      
      {/* =================================================================== */}
      {/* GỢI Ý CHẠM VÀO NẾN (CHỈ XUẤT HIỆN KHI KHÔNG THỔI ĐƯỢC)              */}
      {/* =================================================================== */}
      <AnimatePresence>
        {canClickToExtinguish && !isCandleBlown && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={onExtinguishCandle}
            className="absolute -top-7 z-30 cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-pink-200 text-rose-500 text-xs font-bold tracking-wide hover:scale-105 active:scale-95 transition-all"
          >
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            >
              <Hand className="w-3.5 h-3.5 text-pink-500 fill-pink-100" />
            </motion.div>
            <span>Chạm vào nến để thổi ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* VÙNG CHẠM THỔI NẾN (CLICK HIT AREA TRÊN ĐỈNH NẾN)                   */}
      {/* =================================================================== */}
      {canClickToExtinguish && !isCandleBlown && (
        <button
          type="button"
          onClick={onExtinguishCandle}
          aria-label="Thổi nến"
          className="absolute top-10 z-30 w-28 h-36 rounded-full cursor-pointer opacity-0 focus:outline-none"
        />
      )}

      {/* =================================================================== */}
      {/* ĐỒ HỌA BÁNH KEM 2D VECTOR SVG THUẦN TÚY                             */}
      {/* =================================================================== */}
      <svg
        viewBox="0 0 360 380"
        className="w-full h-auto drop-shadow-[0_15px_35px_rgba(255,182,193,0.45)] overflow-visible"
      >
        <defs>
          {/* Hào quang ấm của ngọn nến */}
          <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
          </radialGradient>

          {/* Cốt bánh bông lan dâu tây Hàn Quốc */}
          <linearGradient id="cakeBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="60%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>

          {/* Lớp sốt kem sữa tươi chảy */}
          <linearGradient id="creamDripGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fff1f2" />
          </linearGradient>

          {/* Màu dâu tây tươi mọng nước */}
          <linearGradient id="strawberryGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>

          {/* Hoa văn sọc nến sinh nhật xoắn pastel */}
          <pattern
            id="candleStripes"
            width="16"
            height="16"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="16" fill="#ffffff" />
            <rect x="8" width="8" height="16" fill="#f472b6" />
          </pattern>

          {/* Bóng đổ mềm cho đĩa và kem */}
          <filter id="softPlateShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#f472b6" floodOpacity="0.28" />
          </filter>
          <filter id="dripShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#fb7185" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* --------------------------------------------------------------- */}
        {/* 1. ĐĨA GỐM SỨ TRẮNG VIỀN BEIGE RETRO                             */}
        {/* --------------------------------------------------------------- */}
        <g id="plate">
          {/* Bóng dưới mặt bàn */}
          <ellipse cx="180" cy="342" rx="148" ry="24" fill="rgba(244, 114, 182, 0.22)" />
          {/* Đĩa sứ chính */}
          <ellipse
            cx="180"
            cy="332"
            rx="142"
            ry="26"
            fill="#ffffff"
            stroke="#fce7f3"
            strokeWidth="3.5"
            filter="url(#softPlateShadow)"
          />
          {/* Lòng đĩa có đường chỉ vàng pastel tinh tế */}
          <ellipse
            cx="180"
            cy="328"
            rx="122"
            ry="20"
            fill="#fff7ed"
            stroke="#fed7aa"
            strokeWidth="1.2"
            strokeDasharray="5 3"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 2. THÂN BÁNH (CỐT BÁNH HỒNG PASTEL BENTO)                        */}
        {/* --------------------------------------------------------------- */}
        <g id="cake-base">
          {/* Khối trụ bánh bo tròn */}
          <path
            d="M 80 248 L 80 306 A 100 23 0 0 0 280 306 L 280 248 Z"
            fill="url(#cakeBodyGrad)"
          />

          {/* Dải chỉ viền hoa văn giữa thân bánh */}
          <path
            d="M 84 278 A 96 22 0 0 0 276 278"
            fill="none"
            stroke="#f472b6"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            opacity="0.45"
          />

          {/* Viền kem sò chân bánh (Piped cream shell border) */}
          {bottomCreamPuffs.map((puff, i) => (
            <g key={i}>
              <circle
                cx={puff.cx}
                cy={puff.cy + 1}
                r="10.5"
                fill="#fbcfe8"
                opacity="0.4"
              />
              <circle
                cx={puff.cx}
                cy={puff.cy}
                r="10"
                fill="#ffffff"
                stroke="#fed7aa"
                strokeWidth="0.8"
              />
              {/* Vết xoáy kem nhỏ */}
              <circle cx={puff.cx - 1.5} cy={puff.cy - 1.5} r="4" fill="#fff7ed" />
            </g>
          ))}
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 3. LỚP SỐT KEM CHẢY (WAVY CREAM DRIP) VÀ MẶT TRÊN CỦA BÁNH       */}
        {/* --------------------------------------------------------------- */}
        <g id="cream-drip" filter="url(#dripShadow)">
          {/* Dòng kem chảy lượn sóng tự nhiên viền xung quanh */}
          <path
            d="
              M 80 244
              C 80 268, 98 268, 98 244
              C 98 284, 118 284, 118 244
              C 118 272, 138 272, 138 244
              C 138 296, 162 296, 162 244
              C 162 278, 180 278, 180 244
              C 180 292, 204 292, 204 244
              C 204 274, 224 274, 224 244
              C 224 286, 244 286, 244 244
              C 244 268, 262 268, 262 244
              C 262 260, 280 260, 280 244
              L 280 244
              A 100 23 0 0 1 80 244
              Z
            "
            fill="url(#creamDripGrad)"
          />

          {/* Mặt phẳng kem phủ đỉnh bánh */}
          <ellipse
            cx="180"
            cy="243"
            rx="98"
            ry="22"
            fill="url(#creamDripGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 4. TOPPING: DÂU TÂY MỌNG NƯỚC & BÚI KEM TƯƠI BỒNG BỀNH           */}
        {/* --------------------------------------------------------------- */}
        <g id="toppings">
          {/* Búi kem tươi (Whipped cream dollops) */}
          {[
            { cx: 108, cy: 236, s: 0.85 },
            { cx: 252, cy: 236, s: 0.85 },
            { cx: 140, cy: 228, s: 0.9 },
            { cx: 220, cy: 228, s: 0.9 },
          ].map((c, idx) => (
            <g key={idx} transform={`translate(${c.cx}, ${c.cy}) scale(${c.s})`}>
              <ellipse cx="0" cy="0" rx="14" ry="10" fill="#ffffff" stroke="#fbcfe8" strokeWidth="1" />
              <path d="M -8 -2 C -4 -10, 4 -10, 8 -2 C 4 -6, -4 -6, -8 -2 Z" fill="#fff1f2" />
              <circle cx="0" cy="-6" r="3" fill="#ffffff" />
            </g>
          ))}

          {/* Dâu tây 1 (Trái phía sau) */}
          <g transform="translate(126, 230) rotate(-14) scale(0.88)">
            <Strawberry />
          </g>
          {/* Dâu tây 2 (Phải phía sau) */}
          <g transform="translate(234, 230) rotate(14) scale(0.88)">
            <Strawberry />
          </g>
          {/* Dâu tây 3 (Trái phía trước) */}
          <g transform="translate(150, 246) rotate(-6) scale(0.96)">
            <Strawberry />
          </g>
          {/* Dâu tây 4 (Phải phía trước) */}
          <g transform="translate(210, 246) rotate(8) scale(0.96)">
            <Strawberry />
          </g>
          {/* Dâu tây 5 (Chính giữa mặt tiền) */}
          <g transform="translate(180, 252) rotate(0) scale(1.02)">
            <Strawberry />
          </g>

          {/* Các hạt cốm đường pastel & trái tim nhỏ rải rác */}
          <circle cx="132" cy="245" r="2" fill="#f43f5e" />
          <circle cx="228" cy="245" r="2" fill="#fbbf24" />
          <circle cx="168" cy="235" r="1.5" fill="#60a5fa" />
          <circle cx="192" cy="235" r="1.8" fill="#f472b6" />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 5. CÂY NẾN SINH NHẬT XOẮN PASTEL                                 */}
        {/* --------------------------------------------------------------- */}
        <g id="candle" className={canClickToExtinguish && !isCandleBlown ? 'cursor-pointer' : ''}>
          {/* Chân nến cắm sâu vào bánh */}
          <ellipse cx="180" cy="226" rx="8" ry="3.5" fill="rgba(244, 114, 182, 0.4)" />

          {/* Thân nến sọc pastel xoắn ốc */}
          <rect
            x="173"
            y="126"
            width="14"
            height="98"
            rx="7"
            fill="url(#candleStripes)"
            stroke="#f472b6"
            strokeWidth="1.2"
          />

          {/* Đỉnh nến bo tròn và lớp sáp bóng */}
          <ellipse cx="180" cy="126" rx="7" ry="3.5" fill="#ffffff" stroke="#f472b6" strokeWidth="1" />

          {/* Tim nến (Wick) */}
          <path
            d="M 180 125 Q 179 116 181 110"
            stroke="#334155"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 6. NGỌN LỬA 2D BẬP BÙNG SINH ĐỘNG (HOẶC LÀN KHÓI KHI NẾN TẮT)   */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {!isCandleBlown && (
            <motion.g
              key="flame-group"
              style={{
                transformOrigin: '180px 110px',
              }}
              animate={{
                rotate: isBlowing ? flameTilt : [-2.5, 2.5, -1.5, 3, 0],
                scaleY: isBlowing ? flameScaleY : [1, 1.07, 0.95, 1.04, 1],
                scaleX: isBlowing ? flameScaleX : [1, 0.95, 1.05, 0.97, 1],
              }}
              transition={{
                duration: isBlowing ? 0.15 : 1.6,
                repeat: isBlowing ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              exit={{
                scale: 0,
                opacity: 0,
                transition: { duration: 0.35, ease: 'easeOut' },
              }}
            >
              {/* Quầng sáng vàng ấm (Radial Halo Glow) */}
              <circle cx="180" cy="85" r="54" fill="url(#haloGlow)" />

              {/* Lửa ngoài (Màu cam hổ phách) */}
              <path
                d="M 180 50 C 166 75, 164 96, 180 108 C 196 96, 194 75, 180 50 Z"
                fill="#f59e0b"
                opacity="0.95"
              />

              {/* Lửa giữa (Màu vàng rực rỡ) */}
              <path
                d="M 180 58 C 170 77, 169 94, 180 104 C 191 94, 190 77, 180 58 Z"
                fill="#fde047"
              />

              {/* Lõi lửa trắng sáng nhất */}
              <path
                d="M 180 72 C 174 83, 174 96, 180 102 C 186 96, 186 83, 180 72 Z"
                fill="#ffffff"
              />

              {/* Chân lửa xanh lam nhạt */}
              <ellipse cx="180" cy="107" rx="4" ry="2" fill="#60a5fa" opacity="0.75" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* --------------------------------------------------------------- */}
        {/* 7. LÀN KHÓI TRẮNG 2D UỐN LƯỢN (XUẤT HIỆN KHI NẾN TẮT)           */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {isCandleBlown && (
            <motion.g key="smoke-group">
              {/* Làn khói chính uốn lượn */}
              <motion.path
                d="M 181 108 C 174 88, 192 68, 180 46 C 170 28, 188 12, 178 -6"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="3.2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.85, y: 0 }}
                animate={{
                  pathLength: [0, 1],
                  opacity: [0.85, 0.4, 0],
                  y: -36,
                  x: [0, 6, -4, 4],
                }}
                transition={{ duration: 2.2, ease: 'easeOut' }}
              />

              {/* Tia khói phụ mảnh mai */}
              <motion.path
                d="M 181 108 C 186 94, 172 78, 184 60 C 190 48, 182 34, 185 20"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.7, y: 0 }}
                animate={{
                  pathLength: [0, 1],
                  opacity: [0.7, 0.3, 0],
                  y: -28,
                  x: [0, -5, 3],
                }}
                transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

// 🍓 COMPONENT VẼ QUẢ DÂU TÂY 2D BÓNG BẨY DỄ THƯƠNG
function Strawberry() {
  return (
    <g>
      {/* Bóng đổ quả dâu */}
      <ellipse cx="0" cy="10" rx="9" ry="3.5" fill="rgba(159, 18, 57, 0.2)" />

      {/* Thân quả dâu (Hình trái tim nhọn tròn) */}
      <path
        d="M 0 -10 C 11 -10, 12 4, 0 11 C -12 4, -11 -10, 0 -10 Z"
        fill="url(#strawberryGrad)"
      />

      {/* Vệt bóng phản chiếu ánh sáng (Glossy Highlight) */}
      <ellipse cx="-4" cy="-2" rx="2.5" ry="5.5" transform="rotate(-20 -4 -2)" fill="#ffffff" opacity="0.6" />
      <circle cx="-1" cy="5" r="1.2" fill="#ffffff" opacity="0.5" />

      {/* Hạt dâu tây vàng nhỏ */}
      {[
        { cx: 3, cy: -3 },
        { cx: 5, cy: 3 },
        { cx: 1, cy: 6 },
        { cx: -2, cy: 2 },
        { cx: 2, cy: -7 },
      ].map((pt, i) => (
        <circle key={i} cx={pt.cx} cy={pt.cy} r="0.75" fill="#fef08a" opacity="0.85" />
      ))}

      {/* Cuống lá xanh (Green Calyx leaves) */}
      <path
        d="
          M 0 -10
          C 4 -15, 6 -13, 0 -10
          C 7 -10, 9 -8, 0 -10
          C -7 -10, -9 -8, 0 -10
          C -4 -15, -6 -13, 0 -10
        "
        fill="#4ade80"
        stroke="#22c55e"
        strokeWidth="0.5"
      />
      <circle cx="0" cy="-10" r="1.5" fill="#16a34a" />
    </g>
  );
}
