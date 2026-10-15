'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Moon, Stars, ArrowRight } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

interface Props {
  config: BirthdayConfig;
  onWishSubmitted: (wish: string) => void;
  onNext: () => void;
}

export default function Scene4Wish({ config, onWishSubmitted, onNext }: Props) {
  const [wishText, setWishText] = useState<string>('');
  const [isSent, setIsSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSendWish = () => {
    if (!wishText.trim()) {
      setError('Hãy nhập một điều ước nhỏ của bạn trước nhé 🌸');
      return;
    }

    setError('');
    setIsSent(true);
    soundManager.playUnlockSuccess();
    onWishSubmitted(wishText);

    if (typeof window !== 'undefined') {
      localStorage.setItem('birthday_wish_1611', wishText);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center"
    >
      {/* Tiêu đề & Bầu trời đêm */}
      <div className="mt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-1 border border-indigo-200">
          <Moon className="w-3.5 h-3.5 text-indigo-500" />
          Điều Ước Tuổi Mới
          <Stars className="w-3.5 h-3.5 text-amber-500" />
        </span>
        <h1 className="font-dancing text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent py-1">
          Gửi Điều Ước Đến Ngàn Vì Sao
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
          Vũ trụ luôn lắng nghe những điều ước chân thành nhất của bạn
        </p>
      </div>

      {/* KHUNG NHẬP ĐIỀU ƯỚC HOẶC HIỆU ỨNG ĐÈN TRỜI BAY */}
      <div className="w-full my-auto py-4">
        <AnimatePresence mode="wait">
          {!isSent ? (
            <motion.div
              key="input-form"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-pink-200 shadow-xl shadow-pink-200/40 text-left"
            >
              <label
                htmlFor="wish-input"
                className="block text-xs font-bold text-pink-700 uppercase tracking-wider mb-2 flex items-center justify-between"
              >
                <span>Nhập tối đa 1 điều ước (Duy nhất)</span>
                <span className="text-[11px] font-normal text-stone-400">
                  {wishText.length}/150
                </span>
              </label>

              <textarea
                id="wish-input"
                rows={4}
                maxLength={150}
                value={wishText}
                onChange={(e) => {
                  setWishText(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ví dụ: Ước cho tuổi mới luôn bình an, gia đình hạnh phúc và đạt được mọi dự định ấp ủ..."
                className="w-full p-4 rounded-2xl bg-pink-50/50 border border-pink-200 focus:border-pink-500 focus:bg-white text-stone-800 placeholder-stone-400 text-sm focus:outline-none transition-all resize-none font-medium leading-relaxed"
              />

              {error && (
                <p className="text-xs text-rose-500 font-medium mt-1 mb-2">{error}</p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendWish}
                className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-bold text-sm shadow-md shadow-pink-300/40 flex items-center justify-center gap-2 hover:brightness-105 transition-all"
              >
                <Send className="w-4 h-4" />
                Thả Đèn Trời Mang Theo Điều Ước 🏮
              </motion.button>
            </motion.div>
          ) : (
            /* HIỆU ỨNG ĐÈN TRỜI BAY LÊN */
            <motion.div
              key="lantern-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center relative py-6"
            >
              <motion.div
                initial={{ y: 80, scale: 0.8, opacity: 0.7 }}
                animate={{
                  y: [-20, -120, -220],
                  scale: [1, 0.85, 0.5],
                  x: [0, 15, -10],
                  opacity: [1, 0.9, 0.4],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative flex flex-col items-center"
              >
                <div className="w-28 h-36 rounded-3xl bg-gradient-to-t from-amber-400 via-orange-300 to-yellow-100 shadow-[0_0_50px_#f59e0b] flex flex-col items-center justify-center p-2.5 text-center border border-amber-200">
                  <span className="text-3xl animate-pulse">🏮</span>
                  <p className="font-dancing text-sm font-bold text-amber-950 mt-1 line-clamp-2 px-1">
                    &ldquo;{wishText}&rdquo;
                  </p>
                </div>
                <div className="w-4 h-4 rounded-full bg-yellow-300 blur-sm mt-1 animate-ping" />
              </motion.div>

              <div className="mt-8 p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200 shadow-md max-w-xs text-center">
                <p className="font-dancing text-2xl font-bold text-pink-600 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Điều ước đã được gửi đi!
                </p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium">
                  Nguyện ước của bạn đang bay vào dải ngân hà. Tuổi mới nhất định sẽ thật rực rỡ và trọn vẹn!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nút chuyển tiếp sang Màn 5 (Grand Finale) */}
      <div className="w-full mt-4 pb-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!isSent}
          onClick={onNext}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all ${
            isSent
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white shadow-pink-300/50 hover:brightness-105'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Xem Kỷ Niệm & Nhận Ảnh Polaroid</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
