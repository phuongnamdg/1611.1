'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function WavyRibbonBackground() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* Lớp nền cơ sở tông màu kem vintage ấm áp đồng bộ toàn trang */}
      <div className="absolute inset-0 bg-[#FBF6EE]" />

      {/* SVG Hệ thống dải sóng uốn lượn phong cách 70s Retro Vintage sắc nét vô hạn */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-90"
      >
        <defs>
          {/* Dải gradient ánh sáng nhẹ nhàng tạo chiều sâu */}
          <linearGradient id="roseRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EDB8B6" />
            <stop offset="50%" stopColor="#E59FA3" />
            <stop offset="100%" stopColor="#DF8F95" />
          </linearGradient>

          <linearGradient id="creamRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="100%" stopColor="#F9F1E2" />
          </linearGradient>

          <linearGradient id="peachRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7E2C8" />
            <stop offset="50%" stopColor="#F2D5B4" />
            <stop offset="100%" stopColor="#EBC69E" />
          </linearGradient>

          <linearGradient id="blushRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8E5E5" />
            <stop offset="100%" stopColor="#F3D3D3" />
          </linearGradient>
        </defs>

        {/* Hệ thống các dải sóng dọc uốn lượn nhịp nhàng */}
        {/* Dải 1: Hồng bụi ấm */}
        <path
          d="M -40 0 C 80 200, -20 450, 90 700 C 140 820, 80 900, 60 900 L -40 900 Z"
          fill="url(#roseRibbonGrad)"
        />
        {/* Dải 2: Kem giấy */}
        <path
          d="M 40 0 C 160 220, 60 460, 170 700 C 220 810, 160 900, 140 900 L 60 900 C 80 900, 140 820, 90 700 C -20 450, 80 200, -40 0 Z"
          fill="url(#creamRibbonGrad)"
        />
        {/* Dải 3: Đào champagne */}
        <path
          d="M 120 0 C 240 210, 140 450, 250 690 C 300 800, 240 900, 220 900 L 140 900 C 160 900, 220 810, 170 700 C 60 460, 160 220, 40 0 Z"
          fill="url(#peachRibbonGrad)"
        />
        {/* Dải 4: Hồng phấn nhạt */}
        <path
          d="M 200 0 C 320 230, 220 470, 330 710 C 380 820, 320 900, 300 900 L 220 900 C 240 900, 300 800, 250 690 C 140 450, 240 210, 120 0 Z"
          fill="url(#blushRibbonGrad)"
        />
        {/* Dải 5: Hồng bụi */}
        <path
          d="M 280 0 C 400 220, 300 460, 410 700 C 460 810, 400 900, 380 900 L 300 900 C 320 900, 380 820, 330 710 C 220 470, 320 230, 200 0 Z"
          fill="url(#roseRibbonGrad)"
        />
        {/* Dải 6: Kem giấy */}
        <path
          d="M 360 0 C 480 230, 380 470, 490 710 C 540 820, 480 900, 460 900 L 380 900 C 400 900, 460 810, 410 700 C 300 460, 400 220, 280 0 Z"
          fill="url(#creamRibbonGrad)"
        />
        {/* Dải 7: Đào champagne */}
        <path
          d="M 440 0 C 560 210, 460 450, 570 690 C 620 800, 560 900, 540 900 L 460 900 C 480 900, 540 820, 490 710 C 380 470, 480 230, 360 0 Z"
          fill="url(#peachRibbonGrad)"
        />
        {/* Dải 8: Hồng phấn nhạt */}
        <path
          d="M 520 0 C 640 230, 540 470, 650 710 C 700 820, 640 900, 620 900 L 540 900 C 560 900, 620 800, 570 690 C 460 450, 560 210, 440 0 Z"
          fill="url(#blushRibbonGrad)"
        />
        {/* Dải 9: Hồng bụi */}
        <path
          d="M 600 0 C 720 220, 620 460, 730 700 C 780 810, 720 900, 700 900 L 620 900 C 640 900, 700 820, 650 710 C 540 470, 640 230, 520 0 Z"
          fill="url(#roseRibbonGrad)"
        />
        {/* Dải 10: Kem giấy */}
        <path
          d="M 680 0 C 800 230, 700 470, 810 710 C 860 820, 800 900, 780 900 L 700 900 C 720 900, 780 810, 730 700 C 620 460, 720 220, 600 0 Z"
          fill="url(#creamRibbonGrad)"
        />
        {/* Dải 11: Đào champagne */}
        <path
          d="M 760 0 C 880 210, 780 450, 890 690 C 940 800, 880 900, 860 900 L 780 900 C 800 900, 860 820, 810 710 C 700 470, 800 230, 680 0 Z"
          fill="url(#peachRibbonGrad)"
        />
        {/* Dải 12: Hồng phấn nhạt */}
        <path
          d="M 840 0 C 960 230, 860 470, 970 710 C 1020 820, 960 900, 940 900 L 860 900 C 880 900, 940 800, 890 690 C 780 450, 880 210, 760 0 Z"
          fill="url(#blushRibbonGrad)"
        />
        {/* Dải 13: Hồng bụi */}
        <path
          d="M 920 0 C 1040 220, 940 460, 1050 700 C 1100 810, 1040 900, 1020 900 L 940 900 C 960 900, 1020 820, 970 710 C 860 470, 960 230, 840 0 Z"
          fill="url(#roseRibbonGrad)"
        />
        {/* Dải 14: Kem giấy */}
        <path
          d="M 1000 0 C 1120 230, 1020 470, 1130 710 C 1180 820, 1120 900, 1100 900 L 1020 900 C 1040 900, 1100 810, 1050 700 C 940 460, 1040 220, 920 0 Z"
          fill="url(#creamRibbonGrad)"
        />
        {/* Dải 15: Đào champagne */}
        <path
          d="M 1080 0 C 1200 210, 1100 450, 1210 690 C 1260 800, 1200 900, 1180 900 L 1100 900 C 1120 900, 1180 820, 1130 710 C 1020 470, 1120 230, 1000 0 Z"
          fill="url(#peachRibbonGrad)"
        />
        {/* Dải 16: Hồng phấn nhạt */}
        <path
          d="M 1160 0 C 1280 230, 1180 470, 1290 710 C 1340 820, 1280 900, 1260 900 L 1180 900 C 1200 900, 1260 800, 1210 690 C 1100 450, 1200 210, 1080 0 Z"
          fill="url(#blushRibbonGrad)"
        />
        {/* Dải 17: Hồng bụi */}
        <path
          d="M 1240 0 C 1360 220, 1260 460, 1370 700 C 1420 810, 1360 900, 1340 900 L 1260 900 C 1280 900, 1340 820, 1290 710 C 1180 470, 1280 230, 1160 0 Z"
          fill="url(#roseRibbonGrad)"
        />
        {/* Dải 18: Kem giấy */}
        <path
          d="M 1320 0 C 1440 230, 1340 470, 1450 710 C 1500 820, 1440 900, 1420 900 L 1340 900 C 1360 900, 1420 810, 1370 700 C 1260 460, 1360 220, 1240 0 Z"
          fill="url(#creamRibbonGrad)"
        />
        {/* Dải 19: Đào champagne */}
        <path
          d="M 1400 0 C 1520 210, 1420 450, 1530 690 L 1530 900 L 1420 900 C 1440 900, 1500 820, 1450 710 C 1340 470, 1440 230, 1320 0 Z"
          fill="url(#peachRibbonGrad)"
        />
      </svg>

      {/* Lớp hạt chấm mờ vintage mịn nhẹ tạo chất liệu giấy linen cao cấp */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C48F7E_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Vệt sáng ấm áp tự nhiên chiếu nhẹ từ góc trên */}
      <motion.div
        animate={{
          opacity: [0.25, 0.45, 0.25],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-white/70 via-pink-100/30 to-transparent rounded-full filter blur-3xl pointer-events-none"
      />
    </div>
  );
}
