'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const flameTilt = isBlowing ? Math.min(blowStrength * 36, 40) : 0;
  const flameScaleY = isBlowing ? Math.max(1 - blowStrength * 0.35, 0.65) : 1;
  const flameScaleX = isBlowing ? Math.min(1 + blowStrength * 0.45, 1.4) : 1;

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto flex flex-col items-center justify-center select-none">
      
      {/* =================================================================== */}
      {/* GỢI Ý CHẠM TỐI GIẢN (CHỈ XUẤT HIỆN KHI KHÔNG THỔI ĐƯỢC)              */}
      {/* =================================================================== */}
      <AnimatePresence>
        {canClickToExtinguish && !isCandleBlown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            onClick={onExtinguishCandle}
            className="absolute -top-7 z-30 cursor-pointer px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-stone-200 text-stone-600 text-[11px] font-medium tracking-wider uppercase hover:bg-stone-50 transition-all"
          >
            Chạm để thổi nến
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* VÙNG CHẠM THỔI NẾN (CLICK HIT AREA)                                 */}
      {/* =================================================================== */}
      {canClickToExtinguish && !isCandleBlown && (
        <button
          type="button"
          onClick={onExtinguishCandle}
          aria-label="Thổi nến"
          className="absolute top-12 z-30 w-24 h-36 rounded-full cursor-pointer opacity-0 focus:outline-none"
        />
      )}

      {/* =================================================================== */}
      {/* ĐỒ HỌA BÁNH KEM TỐI GIẢN KINFOLK (MINIMALIST PURE WHITE)           */}
      {/* =================================================================== */}
      <svg
        viewBox="0 0 360 380"
        className="w-full h-auto drop-shadow-[0_12px_30px_rgba(0,0,0,0.06)] overflow-visible"
      >
        <defs>
          {/* Hào quang ấm của ngọn nến */}
          <radialGradient id="candleHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Vệt ánh nến rọi xuống mặt bánh kem trắng */}
          <radialGradient id="topReflectGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
          </radialGradient>

          {/* Thân bánh kem trắng ngà (Ivory / Warm White) */}
          <linearGradient id="minimalCakeBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAF8F5" />
            <stop offset="60%" stopColor="#F3EFE9" />
            <stop offset="100%" stopColor="#E8E2D8" />
          </linearGradient>

          {/* Mặt trên bánh phẳng lì */}
          <linearGradient id="minimalCakeTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FAF7F2" />
          </linearGradient>

          {/* Thân nến trắng thanh mảnh */}
          <linearGradient id="candleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5F3EF" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EAE5DC" />
          </linearGradient>

          {/* Bóng đổ gốm mộc dưới sàn */}
          <filter id="neutralShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.07" />
          </filter>
        </defs>

        {/* --------------------------------------------------------------- */}
        {/* 1. ĐĨA SỨ TRẮNG TỐI GIẢN (MINIMAL CERAMIC PLATE)                */}
        {/* --------------------------------------------------------------- */}
        <g id="plate">
          {/* Bóng mờ đĩa trên mặt bàn */}
          <ellipse cx="180" cy="336" rx="136" ry="18" fill="rgba(0, 0, 0, 0.05)" />
          {/* Đĩa sứ chính */}
          <ellipse
            cx="180"
            cy="328"
            rx="130"
            ry="20"
            fill="#FFFFFF"
            stroke="#EDE8E1"
            strokeWidth="1.5"
            filter="url(#neutralShadow)"
          />
          {/* Lòng đĩa mộc */}
          <ellipse
            cx="180"
            cy="326"
            rx="116"
            ry="15"
            fill="#FAF8F5"
            stroke="#EFEBE4"
            strokeWidth="1"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 2. THÂN BÁNH TRỤ TRÒN PHẲNG MỊN (CLEAN CYLINDRICAL CAKE)        */}
        {/* --------------------------------------------------------------- */}
        <g id="cake-body">
          {/* Thân bánh kem trắng ngà, không viền rườm rà */}
          <path
            d="M 88 235 L 88 302 A 92 20 0 0 0 272 302 L 272 235 Z"
            fill="url(#minimalCakeBody)"
          />

          {/* Đáy bánh tiếp giáp đĩa */}
          <path
            d="M 88 302 A 92 20 0 0 0 272 302"
            fill="none"
            stroke="#DFD8CC"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Mặt trên bánh phẳng lì (Flat top) */}
          <ellipse
            cx="180"
            cy="235"
            rx="92"
            ry="20"
            fill="url(#minimalCakeTop)"
            stroke="#EFEBE4"
            strokeWidth="1"
          />

          {/* Vệt ánh nến rọi nhẹ lên mặt bánh khi nến còn sáng */}
          {!isCandleBlown && (
            <ellipse
              cx="180"
              cy="235"
              rx="42"
              ry="11"
              fill="url(#topReflectGlow)"
            />
          )}
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 3. CÂY NẾN TRẮNG THANH MẢNH DUY NHẤT (SINGLE SLENDER CANDLE)    */}
        {/* --------------------------------------------------------------- */}
        <g id="candle" className={canClickToExtinguish && !isCandleBlown ? 'cursor-pointer' : ''}>
          {/* Chân nến cắm vào tâm bánh */}
          <ellipse cx="180" cy="235" rx="5" ry="2" fill="rgba(0, 0, 0, 0.08)" />

          {/* Thân nến trắng thanh mảnh, sắc nét */}
          <rect
            x="176.5"
            y="138"
            width="7"
            height="98"
            rx="3.5"
            fill="url(#candleGrad)"
            stroke="#E8E2D8"
            strokeWidth="0.8"
          />

          {/* Đỉnh nến */}
          <ellipse cx="180" cy="138" rx="3.5" ry="1.5" fill="#FFFFFF" />

          {/* Tim nến mộc (Charcoal wick) */}
          <path
            d="M 180 138 L 180 126"
            stroke="#44403C"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 4. NGỌN LỬA ẤM ÁP BẬP BÙNG (TÂM ĐIỂM THỊ GIÁC DUY NHẤT)          */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {!isCandleBlown && (
            <motion.g
              key="flame-group"
              style={{
                transformOrigin: '180px 126px',
              }}
              animate={{
                rotate: isBlowing ? flameTilt : [-2, 2, -1.2, 2.5, 0],
                scaleY: isBlowing ? flameScaleY : [1, 1.06, 0.96, 1.03, 1],
                scaleX: isBlowing ? flameScaleX : [1, 0.96, 1.04, 0.98, 1],
              }}
              transition={{
                duration: isBlowing ? 0.15 : 1.8,
                repeat: isBlowing ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              exit={{
                scale: 0,
                opacity: 0,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
            >
              {/* Quầng sáng vàng ấm lan tỏa nhẹ */}
              <circle cx="180" cy="104" r="50" fill="url(#candleHalo)" />

              {/* Ngọn lửa ngoài (Vàng hổ phách) */}
              <path
                d="M 180 74 C 168 94, 166 112, 180 124 C 194 112, 192 94, 180 74 Z"
                fill="#F59E0B"
                opacity="0.95"
              />

              {/* Ngọn lửa giữa (Vàng ấm) */}
              <path
                d="M 180 82 C 171 97, 170 111, 180 120 C 190 111, 189 97, 180 82 Z"
                fill="#FDE047"
              />

              {/* Lõi lửa trắng tinh */}
              <path
                d="M 180 94 C 175 103, 175 113, 180 118 C 185 113, 185 103, 180 94 Z"
                fill="#FFFFFF"
              />

              {/* Chân lửa xanh lam mờ tự nhiên */}
              <ellipse cx="180" cy="123" rx="3" ry="1.5" fill="#60A5FA" opacity="0.6" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* --------------------------------------------------------------- */}
        {/* 5. LÀN KHÓI TRẮNG TỐI GIẢN KHI NẾN TẮT                          */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {isCandleBlown && (
            <motion.path
              key="minimal-smoke"
              d="M 180 126 C 175 106, 188 88, 180 66 C 173 50, 184 32, 179 16"
              fill="none"
              stroke="#D6D3D1"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.8, y: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0.8, 0.35, 0],
                y: -32,
                x: [0, 4, -3, 2],
              }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
