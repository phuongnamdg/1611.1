'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Heart, Sparkles, Delete, KeyRound } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

interface Props {
  config: BirthdayConfig;
  onUnlock: () => void;
}

export default function Scene1Lock({ config, onUnlock }: Props) {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const maxDigits = 4; // e.g. 1611

  const handleKeyPress = (num: string) => {
    soundManager.playKeypress();
    if (pin.length < maxDigits) {
      const newPin = pin + num;
      setPin(newPin);
      setIsError(false);

      if (newPin.length === maxDigits) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    soundManager.playKeypress(400);
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const verifyPin = (enteredPin: string) => {
    // Chuẩn hóa mật khẩu: bỏ dấu cách, gạch chéo
    const cleanEntered = enteredPin.replace(/[^0-9]/g, '');
    const cleanPassword = config.birthDatePassword.replace(/[^0-9]/g, '');

    if (cleanEntered === cleanPassword) {
      soundManager.playUnlockSuccess();
      setTimeout(() => {
        onUnlock();
      }, 600);
    } else {
      setIsError(true);
      setErrorMessage('Ủa ủa! Ngày sinh nhật của mình mà cũng bấm nhầm hả? Thử lại nha 🌸');
      soundManager.playKeypress(200);
      setTimeout(() => {
        setPin('');
      }, 800);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center"
    >
      {/* Khung kính mờ Glassmorphism */}
      <motion.div
        animate={isError ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pink-200/80 shadow-[0_15px_40px_rgba(255,182,193,0.35)]"
      >
        {/* Biểu tượng ổ khóa hoa */}
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center shadow-lg shadow-pink-300/50">
          <Lock className="w-8 h-8 text-white animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
            className="absolute -top-1 -right-1 text-pink-500"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
          Cổng Mở Quà Bí Mật
        </h1>
        <p className="mt-1 text-sm text-pink-700/80 flex items-center justify-center gap-1 font-medium">
          Dành riêng cho <span className="font-bold text-pink-600">{config.recipientName}</span>
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500 inline" />
        </p>

        <p className="mt-4 text-xs text-stone-500 font-medium flex items-center justify-center gap-1">
          <KeyRound className="w-3.5 h-3.5 text-pink-400" />
          Nhập ngày tháng sinh của bạn để mở khóa (DDMM)
        </p>

        {/* Ô hiển thị mã PIN */}
        <div className="flex justify-center items-center gap-3 my-6">
          {Array.from({ length: maxDigits }).map((_, index) => {
            const hasDigit = index < pin.length;
            return (
              <motion.div
                key={index}
                animate={hasDigit ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                  hasDigit
                    ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-md shadow-pink-200'
                    : 'border-pink-200 bg-white/60 text-stone-300'
                }`}
              >
                {hasDigit ? pin[index] : '•'}
              </motion.div>
            );
          })}
        </div>

        {/* Thông báo lỗi */}
        <AnimatePresence>
          {isError && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-rose-500 font-semibold mb-3 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Bàn phím số Numpad tiện lợi cho cả mobile và desktop */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[260px] mx-auto mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <motion.button
              key={digit}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-white/90 hover:bg-pink-50 text-stone-700 font-semibold text-lg border border-pink-100 shadow-sm shadow-pink-100/50 flex items-center justify-center transition-colors"
            >
              {digit}
            </motion.button>
          ))}

          {/* Nút gợi ý */}
          <div className="h-12 flex items-center justify-center text-xs text-pink-400 font-medium">
            16.11 🌸
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-white/90 hover:bg-pink-50 text-stone-700 font-semibold text-lg border border-pink-100 shadow-sm shadow-pink-100/50 flex items-center justify-center transition-colors"
          >
            0
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleDelete}
            aria-label="Xóa số"
            className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-500 font-semibold border border-rose-100 flex items-center justify-center transition-colors"
          >
            <Delete className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="mt-6 pt-4 border-t border-pink-100/70 text-[11px] text-pink-400">
          Chạm vào các phím số hoặc dùng bàn phím để mở quà ✨
        </div>
      </motion.div>
    </motion.div>
  );
}
