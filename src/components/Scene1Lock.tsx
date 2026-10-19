'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Sparkles } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

interface Props {
  config?: BirthdayConfig;
  onUnlock: () => void;
}

export default function Scene1Lock({ config, onUnlock }: Props) {
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const targetPassword = config?.birthDatePassword || '1611';

  const handleKeyPress = (num: string) => {
    soundManager.playKeypress();
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setPinError('');

      if (nextPin.length === 4) {
        // 👇 MẬT KHẨU MẶC ĐỊNH LÀ 1611 (16/11) 👇
        if (nextPin === targetPassword.replace(/[^0-9]/g, '')) {
          soundManager.playUnlockSuccess();
          setTimeout(() => {
            onUnlock();
          }, 600);
        } else {
          setPinError('Sai mật khẩu nha cưng? 😠😠');
          soundManager.playKeypress(200);
          setIsShaking(true);
          setTimeout(() => {
            setPin('');
            setIsShaking(false);
          }, 750);
        }
      }
    }
  };

  const handleClear = () => {
    soundManager.playKeypress(400);
    setPin('');
    setPinError('');
  };

  const handleDelete = () => {
    soundManager.playKeypress(400);
    setPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  return (
    <motion.div
      key="scene-1"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8 w-full font-sans"
    >
      {/* ⚡ NÚT SKIP NHANH Ở GÓC TRÊN BÊN TRÁI */}
      <div className="fixed top-4 left-4 z-40">
        <button
          type="button"
          onClick={onUnlock}
          className="px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-rose-500 hover:text-rose-600 text-xs font-semibold shadow-xs border border-pink-200 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
          title="Bỏ qua mật khẩu để xem nhanh"
        >
          <span>Bỏ qua</span>
          <span>⏩</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* KHUNG CARD CHÍNH 2 CỘT                 */}
      {/* ===================================================================== */}
      <div className="w-full max-w-lg sm:max-w-xl bg-white/95 backdrop-blur-xl rounded-[32px] p-5 sm:p-7 shadow-[0_20px_50px_rgba(255,182,193,0.35)] border border-pink-100 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        
        {/* CỘT TRÁI: KHUNG ẢNH CÔNG CHÚA VỚI WASHI TAPE & NGÔI SAO LẤP LÁNH */}
        <div className="w-44 sm:w-[200px] flex-shrink-0 flex flex-col items-center relative">
          {/* Băng dính Washi Tape dễ thương dán mép trên khung ảnh */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-24 h-5 bg-[#fed7aa]/90 backdrop-blur-xs border-y border-dashed border-[#fb923c]/50 shadow-xs -rotate-2 rounded-[2px] pointer-events-none flex items-center justify-center">
            <span className="text-[10px] tracking-widest text-[#ea580c]/70 font-mono select-none">♥ ♥ ♥</span>
          </div>

          <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border-2 border-pink-100 bg-pink-50 relative group">
            {/* ✨ Ngôi sao lấp lánh góc trên phải */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.15, 0.85], rotate: [0, 15, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-2.5 right-2.5 z-10 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.8)] pointer-events-none"
            >
              <Sparkles className="w-4 h-4 fill-amber-300" />
            </motion.div>

            {/* ✨ Ngôi sao lấp lánh góc dưới trái */}
            <motion.div
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.1, 0.8], rotate: [0, -15, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
              className="absolute bottom-2.5 left-2.5 z-10 text-pink-300 drop-shadow-[0_0_6px_rgba(244,114,182,0.8)] pointer-events-none"
            >
              <Sparkles className="w-3.5 h-3.5 fill-pink-300" />
            </motion.div>

            {/* 👇 THAY ẢNH BẰNG CÁCH THẢ FILE VÀO public/avatar.jpg HOẶC SỬA LINK DƯỚI 👇 */}
            <img
              src="/avt.jpg"
              alt="Công chúa"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* CỘT PHẢI: BÀN PHÍM NHẬP NGÀY SINH CÔNG CHÚA */}
        <div className="w-full flex flex-col items-center sm:items-start flex-1">
          {/* 👇 BẠN CÓ THỂ SỬA DÒNG TIÊU ĐỀ NÀY 👇 */}
          <h2 className="text-[#db6e6e] font-bold text-sm sm:text-base mb-3 text-center sm:text-left w-full tracking-wide">
            {config?.scene1Title || 'Hãy nhập ngày sinh của công chúa'}
          </h2>

          {/* Ô hiển thị số nhập vào (Tone màu cam/đào pastel) với hiệu ứng rung lắc khi sai */}
          <motion.div
            animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-11 sm:h-12 rounded-xl bg-[#fedfd2] border border-[#faccc0] flex items-center justify-center text-[#c25e5e] font-bold text-xl tracking-[0.25em] px-4 shadow-inner mb-3"
          >
            {pin.length > 0 ? (
              pin.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0.4, y: -4, opacity: 0 }}
                  animate={{ scale: [1.3, 1], y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="mx-1 inline-block"
                >
                  {char}
                </motion.span>
              ))
            ) : (
              <span className="text-[#e2a898] tracking-normal text-sm font-semibold">
                ••••
              </span>
            )}
          </motion.div>

          {/* Thông báo lỗi nếu bấm sai ngày sinh */}
          {pinError && (
            <p className="text-xs text-rose-500 font-semibold mb-2 text-center w-full">
              {pinError}
            </p>
          )}

          {/* BÀN PHÍM SỐ CẢM ỨNG 3x4 (TONE MÀU BEIGE / CAM ĐÀO) */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl bg-[#fff7f2] hover:bg-[#ffede2] text-[#b36363] font-bold text-base border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
              >
                {digit}
              </button>
            ))}

            {/* Nút C (Clear / Xóa hết) */}
            <button
              onClick={handleClear}
              className="h-11 rounded-xl bg-[#fff7f2] hover:bg-rose-50 text-[#c25e5e] font-bold text-sm border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
            >
              C
            </button>

            {/* Phím 0 */}
            <button
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl bg-[#fff7f2] hover:bg-[#ffede2] text-[#b36363] font-bold text-base border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
            >
              0
            </button>

            {/* Phím Xóa 1 số (Backspace) */}
            <button
              onClick={handleDelete}
              className="h-11 rounded-xl bg-[#fff7f2] hover:bg-rose-50 text-[#c25e5e] font-bold text-base border border-[#fae5d9] shadow-sm flex items-center justify-center transition-all active:scale-95"
              aria-label="Xóa"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* ⚡ NÚT BỎ QUA MẬT KHẨU (TIỆN LỢI ĐỂ TEST / XEM BÁNH KEM NGAY) */}
          <div className="mt-3.5 w-full flex justify-center">
            <button
              type="button"
              onClick={onUnlock}
              className="px-4 py-1.5 rounded-full bg-white/80 hover:bg-white text-rose-500 hover:text-rose-600 text-xs font-semibold shadow-xs border border-pink-200/80 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Bỏ qua mật khẩu</span>
              <span className="text-[10px]">⏩</span>
            </button>
          </div>
        </div>
      </div>

      {/* 👇 DÒNG CHỮ QUOTE LÃNG MẠN PHÍA DƯỚI (GIỐNG HỆT ẢNH MẪU) 👇 */}
      <div className="mt-6 text-center tracking-[0.25em] text-xs sm:text-sm font-semibold uppercase text-stone-700/80">
        <p className="text-stone-400 text-lg mb-0.5">&ldquo;</p>
        <p className="leading-relaxed">Happy Birthday</p>
        <p className="leading-relaxed"></p>
        <p className="text-stone-400 text-lg mt-0.5">&rdquo;</p>
      </div>
    </motion.div>
  );
}
