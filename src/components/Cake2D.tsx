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
    <div className="relative w-full max-w-[360px] sm:max-w-[400px] mx-auto flex flex-col items-center justify-center select-none">
      
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
            className="absolute -top-7 z-30 cursor-pointer px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-amber-200/60 text-stone-700 text-[11px] font-medium tracking-wider uppercase hover:bg-stone-50 active:scale-95 transition-all"
          >
            Chạm để thổi nến ✨
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
          className="absolute top-10 z-30 w-28 h-36 rounded-full cursor-pointer opacity-0 focus:outline-none"
        />
      )}

      {/* =================================================================== */}
      {/* ĐỒ HỌA BÁNH BÔNG LAN BƠ VANI CẮT TẦNG (SEMI-NAKED SPONGE CAKE)      */}
      {/* =================================================================== */}
      <svg
        viewBox="0 0 360 390"
        className="w-full h-auto drop-shadow-[0_16px_35px_rgba(180,120,60,0.18)] overflow-visible"
      >
        <defs>
          {/* Hào quang ấm của ngọn nến */}
          <radialGradient id="warmCandleHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Ánh nến rọi xuống lớp kem mặt bánh */}
          <radialGradient id="topCandleLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0" />
          </radialGradient>

          {/* Cốt bánh bông lan nướng vàng xốp thơm mềm (Golden Vanilla Sponge) */}
          <linearGradient id="spongeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Vỏ bánh nướng viền ngoài (Baked Golden Crust) */}
          <linearGradient id="crustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Lớp kem tươi vani sữa ngà (Fresh Vanilla Cream) */}
          <linearGradient id="creamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFDF9" />
            <stop offset="100%" stopColor="#F7EEDD" />
          </linearGradient>

          {/* Thân nến sinh nhật màu ngà trang nhã */}
          <linearGradient id="candleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5F1E9" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E6DFD3" />
          </linearGradient>

          {/* Bóng đổ đĩa bánh */}
          <filter id="cakePlateShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#78350F" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* --------------------------------------------------------------- */}
        {/* 1. ĐẾ BÁNH & ĐĨA GỐM SỨ TRẮNG MỘC (CERAMIC PLATTER & CAKE BOARD) */}
        {/* --------------------------------------------------------------- */}
        <g id="platter">
          {/* Bóng mờ đĩa trên mặt bàn */}
          <ellipse cx="180" cy="344" rx="146" ry="20" fill="rgba(120, 53, 15, 0.12)" />

          {/* Đĩa sứ tròn dày dặn, sang trọng */}
          <ellipse
            cx="180"
            cy="334"
            rx="140"
            ry="22"
            fill="#FFFFFF"
            stroke="#E7E1D6"
            strokeWidth="1.8"
            filter="url(#cakePlateShadow)"
          />

          {/* Lòng đĩa sứ trắng ngà */}
          <ellipse
            cx="180"
            cy="331"
            rx="124"
            ry="17"
            fill="#FAF7F2"
            stroke="#EFE8DC"
            strokeWidth="1"
          />

          {/* Đế lót bánh bằng bìa vàng kim sang trọng (Gold Cake Board) */}
          <ellipse
            cx="180"
            cy="326"
            rx="106"
            ry="14"
            fill="#FEF3C7"
            stroke="#F59E0B"
            strokeWidth="0.8"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 2. CẤU TRÚC BÁNH BÔNG LAN 3 TẦNG KẸP KEM (3-TIER SPONGE & CREAM) */}
        {/* --------------------------------------------------------------- */}
        <g id="layered-cake">

          {/* --- TẦNG 1: CỐT BÔNG LAN ĐÁY (BOTTOM SPONGE LAYER) --- */}
          <path
            d="M 88 285 L 88 318 A 92 19 0 0 0 272 318 L 272 285 Z"
            fill="url(#spongeGrad)"
          />
          {/* Họa tiết xốp nhẹ của bông lan nướng */}
          <path
            d="M 94 300 C 120 306, 150 298, 180 304 C 210 299, 240 306, 266 300"
            fill="none"
            stroke="#D97706"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.4"
          />

          {/* --- LỚP KEM TƯƠI KẸP 1 (CREAM FILLING 1) --- */}
          <path
            d="M 86 273 L 86 288 A 94 19 0 0 0 274 288 L 274 273 Z"
            fill="url(#creamGrad)"
          />
          {/* Lớp kem phết mềm hơi tràn ra mép bánh tự nhiên */}
          <ellipse cx="180" cy="274" rx="93" ry="18" fill="url(#creamGrad)" />

          {/* --- TẦNG 2: CỐT BÔNG LAN GIỮA (MIDDLE SPONGE LAYER) --- */}
          <path
            d="M 88 245 L 88 274 A 92 19 0 0 0 272 274 L 272 245 Z"
            fill="url(#spongeGrad)"
          />
          {/* Vân xốp cốt bánh nướng */}
          <path
            d="M 92 260 C 130 264, 170 258, 210 264 C 235 259, 255 263, 268 260"
            fill="none"
            stroke="#B45309"
            strokeWidth="0.8"
            strokeDasharray="3 5"
            opacity="0.35"
          />

          {/* --- LỚP KEM TƯƠI KẸP 2 (CREAM FILLING 2) --- */}
          <path
            d="M 86 233 L 86 248 A 94 19 0 0 0 274 248 L 274 233 Z"
            fill="url(#creamGrad)"
          />
          <ellipse cx="180" cy="234" rx="93" ry="18" fill="url(#creamGrad)" />

          {/* --- TẦNG 3: CỐT BÔNG LAN TRÊN CÙNG (TOP SPONGE LAYER) --- */}
          <path
            d="M 88 212 L 88 235 A 92 18 0 0 0 272 235 L 272 212 Z"
            fill="url(#spongeGrad)"
          />

          {/* --- LỚP KEM TƯƠI PHỦ MẶT BÁNH (TOP FROSTING & SPATULA SWIRL) --- */}
          {/* Lớp kem bơ tươi mịn phủ kín mặt trên cùng */}
          <ellipse
            cx="180"
            cy="212"
            rx="93"
            ry="19"
            fill="url(#creamGrad)"
            stroke="#F7EEDD"
            strokeWidth="1.2"
          />

          {/* Vết miết dao làm bánh (Spatula Swirl Texture) - Tạo hồn cho chiếc bánh kem thật */}
          <path
            d="M 112 214 C 135 223, 175 223, 215 215 C 235 211, 248 216, 256 213"
            fill="none"
            stroke="#EFE3D0"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 132 208 C 155 216, 185 216, 222 208"
            fill="none"
            stroke="#EFE3D0"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Vệt ánh nến rọi phản chiếu lên lớp kem tươi khi nến đang sáng */}
          {!isCandleBlown && (
            <ellipse
              cx="180"
              cy="212"
              rx="46"
              ry="11"
              fill="url(#topCandleLight)"
            />
          )}
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 3. CÂY NẾN SINH NHẬT CẮM GIỮA BÁNH (ELEGANT BIRTHDAY CANDLE)     */}
        {/* --------------------------------------------------------------- */}
        <g id="candle" className={canClickToExtinguish && !isCandleBlown ? 'cursor-pointer' : ''}>
          {/* Chân nến cắm sâu vào lớp kem */}
          <ellipse cx="180" cy="212" rx="6" ry="2.5" fill="rgba(120, 53, 15, 0.18)" />

          {/* Thân nến ngà thanh mảnh, chuẩn form bánh sinh nhật */}
          <rect
            x="176"
            y="124"
            width="8"
            height="90"
            rx="4"
            fill="url(#candleGrad)"
            stroke="#E5DECF"
            strokeWidth="0.8"
          />

          {/* Đỉnh nến bo tròn và sáp nến chảy nhẹ tự nhiên */}
          <ellipse cx="180" cy="124" rx="4" ry="1.8" fill="#FFFFFF" />

          {/* Tim nến mộc (Charcoal wick) */}
          <path
            d="M 180 124 L 180 112"
            stroke="#3F3F46"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* --------------------------------------------------------------- */}
        {/* 4. NGỌN LỬA VÀNG ẤM BẬP BÙNG SINH ĐỘNG (WARM FLICKERING FLAME)   */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {!isCandleBlown && (
            <motion.g
              key="flame-group"
              style={{
                transformOrigin: '180px 112px',
              }}
              animate={{
                rotate: isBlowing ? flameTilt : [-2, 2.5, -1.2, 2.8, 0],
                scaleY: isBlowing ? flameScaleY : [1, 1.07, 0.95, 1.04, 1],
                scaleX: isBlowing ? flameScaleX : [1, 0.95, 1.05, 0.97, 1],
              }}
              transition={{
                duration: isBlowing ? 0.15 : 1.7,
                repeat: isBlowing ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              exit={{
                scale: 0,
                opacity: 0,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
            >
              {/* Quầng sáng vàng ấm tỏa ra từ nến */}
              <circle cx="180" cy="90" r="52" fill="url(#warmCandleHalo)" />

              {/* Ngọn lửa ngoài (Màu vàng mật ong ấm áp) */}
              <path
                d="M 180 58 C 167 79, 165 98, 180 110 C 195 98, 193 79, 180 58 Z"
                fill="#F59E0B"
                opacity="0.95"
              />

              {/* Ngọn lửa giữa (Màu vàng tươi rực rỡ) */}
              <path
                d="M 180 66 C 170 82, 169 97, 180 106 C 191 97, 190 82, 180 66 Z"
                fill="#FDE047"
              />

              {/* Lõi lửa trắng sáng */}
              <path
                d="M 180 80 C 175 90, 175 100, 180 104 C 185 100, 185 90, 180 80 Z"
                fill="#FFFFFF"
              />

              {/* Chân lửa xanh lam mờ tự nhiên */}
              <ellipse cx="180" cy="109" rx="3.5" ry="1.5" fill="#60A5FA" opacity="0.65" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* --------------------------------------------------------------- */}
        {/* 5. LÀN KHÓI TRẮNG UỐN LƯỢN KHI NẾN TẮT (SMOKE WISP)              */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {isCandleBlown && (
            <motion.path
              key="vanilla-smoke"
              d="M 180 112 C 174 92, 188 74, 180 52 C 172 36, 184 18, 178 2"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="2.4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.85, y: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0.85, 0.35, 0],
                y: -32,
                x: [0, 5, -4, 3],
              }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
