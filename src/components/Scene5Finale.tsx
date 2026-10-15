'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, RotateCcw, Sparkles, Check, Share2 } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

interface Props {
  config: BirthdayConfig;
  userWish: string;
  onRestart: () => void;
}

export default function Scene5Finale({ config, userWish, onRestart }: Props) {
  const [heartCount, setHeartCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleSendHearts = () => {
    soundManager.playKeypress(659.25);
    setHeartCount((prev) => prev + 1);

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB'],
      shapes: ['circle'],
    });
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center"
    >
      {/* Tiêu đề tự sửa trong birthdayData.ts */}
      <div className="mt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-1 border border-pink-200">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          Kỷ Niệm Đẹp Đẽ
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent py-1 tracking-tight">
          {config.scene5Title}
        </h1>
      </div>

      {/* TẤM THẺ POLAROID KỶ NIỆM (THIỆP CUỐI TRANG) - Tự sửa trong birthdayData.ts */}
      <motion.div
        initial={{ rotate: -2, scale: 0.95 }}
        animate={{ rotate: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xs my-auto p-4 pb-6 rounded-2xl bg-white border border-stone-200 shadow-2xl shadow-pink-200/50 flex flex-col items-center text-center transform hover:rotate-0 transition-transform"
      >
        <div className="w-full h-56 rounded-xl bg-gradient-to-tr from-pink-200 via-pink-100 to-rose-200 border border-pink-300 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-xs">🌸</div>
          <div className="absolute bottom-2 left-2 text-xs">✨</div>

          <div className="w-20 h-20 rounded-full bg-white/90 shadow-md flex items-center justify-center text-4xl mb-2">
            🎂
          </div>

          <h3 className="text-xl font-bold text-pink-700">
            {config.recipientName}
          </h3>
          <p className="text-xs font-semibold text-pink-500">
            Sinh nhật: {config.birthDateDisplay}
          </p>

          {userWish && (
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-white/80 text-xs text-stone-700 font-medium italic line-clamp-2">
              🏮 &ldquo;{userWish}&rdquo;
            </div>
          )}
        </div>

        {/* Chữ viết tay dưới khung ảnh - Sửa tại finaleCardQuote & finaleCardHashtag */}
        <div className="w-full mt-3 text-stone-600 text-xs italic flex items-center justify-between px-1 font-semibold">
          <span>{config.finaleCardQuote}</span>
          <span className="text-xs text-pink-500 not-italic font-bold">
            {config.finaleCardHashtag}
          </span>
        </div>
      </motion.div>

      {/* TƯƠNG TÁC: BẮN TIM CHO NGƯỜI TẶNG */}
      <div className="w-full space-y-3 pb-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSendHearts}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-rose-300/50 flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
          <span>Bắn Tim Cho Người Tặng ({heartCount})</span>
        </motion.button>

        {heartCount > 0 && (
          <p className="text-sm text-rose-500 font-bold animate-bounce">
            💖 Đã gửi {heartCount} trái tim đến {config.senderName}!
          </p>
        )}

        <div className="flex gap-2 w-full pt-1">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {isCopied ? 'Đã sao chép link!' : 'Chia sẻ link'}
          </button>

          <button
            onClick={onRestart}
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-stone-700 text-xs font-bold border border-pink-200 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
            Xem lại từ đầu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
