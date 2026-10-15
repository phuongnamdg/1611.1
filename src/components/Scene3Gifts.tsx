'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music, Mail, Flower2, Heart, ArrowRight, Disc3, CheckCircle2 } from 'lucide-react';
import { soundManager } from '@/utils/sound';
import { BirthdayConfig } from '@/types/birthday';

interface Props {
  config: BirthdayConfig;
  onNext: () => void;
}

type GiftType = 'FLOWER' | 'MUSIC' | 'LETTER' | null;

export default function Scene3Gifts({ config, onNext }: Props) {
  const [selectedGift, setSelectedGift] = useState<GiftType>(null);
  const [openedGifts, setOpenedGifts] = useState<{ [key: string]: boolean }>({});

  const handleOpenGift = (type: GiftType) => {
    if (!type) return;
    soundManager.playUnlockSuccess();
    setSelectedGift(type);
    setOpenedGifts((prev) => ({ ...prev, [type]: true }));

    if (type === 'MUSIC') {
      soundManager.playBirthdayMelody();
    }
  };

  const closeGiftModal = () => {
    soundManager.playKeypress(400);
    setSelectedGift(null);
  };

  const totalOpened = Object.keys(openedGifts).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex flex-col items-center justify-between min-h-screen px-4 py-8 max-w-lg mx-auto text-center"
    >
      {/* Tiêu đề */}
      <div className="mt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-1 border border-pink-200">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          Món Quà Dành Cho Bạn
        </span>
        <h1 className="font-dancing text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent py-1">
          3 Chiếc Hộp Bí Mật
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
          Chạm vào chiếc hộp bạn muốn mở trước (bạn có thể khám phá cả 3 hộp nhé!)
        </p>
      </div>

      {/* 3 Chiếc Hộp Quà */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full my-6">
        {/* Hộp 1: Bó hoa tươi thắm */}
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenGift('FLOWER')}
          className="cursor-pointer relative p-5 rounded-3xl bg-white/85 backdrop-blur-md border-2 border-pink-200 shadow-lg shadow-pink-100/60 flex flex-col items-center group transition-all"
        >
          {openedGifts['FLOWER'] && (
            <div className="absolute top-2.5 right-2.5 text-emerald-500">
              <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
            </div>
          )}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center shadow-md shadow-pink-300/50 mb-3 group-hover:rotate-6 transition-transform">
            <Flower2 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">
            Hộp Quà 1
          </span>
          <h3 className="font-dancing text-xl font-bold text-stone-800">Bó Hoa Tươi Thắm</h3>
          <p className="text-xs text-pink-500 mt-0.5 font-medium">Rạng ngời & Ngát hương</p>
        </motion.div>

        {/* Hộp 2: Ô Âm Nhạc */}
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenGift('MUSIC')}
          className="cursor-pointer relative p-5 rounded-3xl bg-white/85 backdrop-blur-md border-2 border-pink-200 shadow-lg shadow-pink-100/60 flex flex-col items-center group transition-all"
        >
          {openedGifts['MUSIC'] && (
            <div className="absolute top-2.5 right-2.5 text-emerald-500">
              <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
            </div>
          )}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center shadow-md shadow-purple-300/50 mb-3 group-hover:rotate-6 transition-transform">
            <Music className="w-10 h-10 text-white animate-bounce" />
          </div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            Hộp Quà 2
          </span>
          <h3 className="font-dancing text-xl font-bold text-stone-800">Giai Điệu Tuổi Mới</h3>
          <p className="text-xs text-purple-500 mt-0.5 font-medium">Âm vang ngọt ngào</p>
        </motion.div>

        {/* Hộp 3: Bức Thư Chúc Mừng */}
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenGift('LETTER')}
          className="cursor-pointer relative p-5 rounded-3xl bg-white/85 backdrop-blur-md border-2 border-pink-200 shadow-lg shadow-pink-100/60 flex flex-col items-center group transition-all"
        >
          {openedGifts['LETTER'] && (
            <div className="absolute top-2.5 right-2.5 text-emerald-500">
              <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
            </div>
          )}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 flex items-center justify-center shadow-md shadow-rose-300/50 mb-3 group-hover:rotate-6 transition-transform">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            Hộp Quà 3
          </span>
          <h3 className="font-dancing text-xl font-bold text-stone-800">Bức Thư Tay Bí Mật</h3>
          <p className="text-xs text-rose-500 mt-0.5 font-medium">Gửi gắm chân thành</p>
        </motion.div>
      </div>

      <p className="text-sm text-pink-700 font-semibold">
        Đã khám phá: <span className="font-bold text-pink-600">{totalOpened}/3</span> món quà 🌸
      </p>

      {/* Nút chuyển sang Màn 4 Nhập Điều Ước */}
      <div className="w-full mt-4 pb-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-pink-300/50 flex items-center justify-center gap-2 transition-all hover:brightness-105"
        >
          <Sparkles className="w-5 h-5 text-amber-200" />
          Gửi Gắm Điều Ước Tuổi Mới
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* POPUP MODAL MỞ CHI TIẾT TỪNG MÓN QUÀ */}
      <AnimatePresence>
        {selectedGift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-white border border-pink-200 shadow-2xl flex flex-col items-center text-center max-h-[85vh] overflow-y-auto"
            >
              {/* NỘI DUNG HỘP 1: BÓ HOA TƯƠI THẮM */}
              {selectedGift === 'FLOWER' && (
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-5xl mb-3 shadow-inner"
                  >
                    💐
                  </motion.div>
                  <h3 className="font-dancing text-2xl font-bold text-pink-600">Bó Hoa Tươi Thắm Nhất</h3>
                  <p className="text-xs text-pink-400 mt-1 mb-4 font-medium">Dành riêng cho {config.recipientName}</p>
                  <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 text-stone-700 text-sm leading-relaxed font-medium">
                    {config.flowerMessage}
                  </div>
                  <div className="flex gap-2 text-2xl mt-4">
                    <span>🌷</span>
                    <span>🌹</span>
                    <span>🌸</span>
                    <span>🌺</span>
                    <span>🌻</span>
                  </div>
                </div>
              )}

              {/* NỘI DUNG HỘP 2: Ô ÂM NHẠC */}
              {selectedGift === 'MUSIC' && (
                <div className="flex flex-col items-center w-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="w-24 h-24 rounded-full bg-stone-900 border-4 border-stone-700 flex items-center justify-center shadow-xl mb-3 relative"
                  >
                    <Disc3 className="w-14 h-14 text-pink-400" />
                    <div className="w-5 h-5 rounded-full bg-pink-500 absolute" />
                  </motion.div>
                  <h3 className="font-dancing text-2xl font-bold text-purple-700">{config.songTitle}</h3>
                  <p className="text-xs text-purple-400 mb-4">{config.songArtist}</p>

                  <div className="w-full p-4 rounded-2xl bg-purple-50 border border-purple-100 text-stone-700 text-sm leading-relaxed">
                    <p className="font-dancing text-xl text-purple-900 leading-relaxed font-semibold">
                      &ldquo;Happy Birthday to You,<br />
                      Happy Birthday to You,<br />
                      Happy Birthday dear {config.recipientName},<br />
                      Happy Birthday to You!&rdquo; 🎵
                    </p>
                  </div>

                  <button
                    onClick={() => soundManager.playBirthdayMelody()}
                    className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors"
                  >
                    <Music className="w-3.5 h-3.5" />
                    Phát Lại Giai Điệu Hộp Nhạc
                  </button>
                </div>
              )}

              {/* NỘI DUNG HỘP 3: THIỆP CHÚC MỪNG TỰ VIẾT */}
              {selectedGift === 'LETTER' && (
                <div className="flex flex-col items-center w-full text-left">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-3xl mb-2 mx-auto">
                    💌
                  </div>
                  <h3 className="font-dancing text-2xl font-bold text-rose-600 text-center w-full mb-3">
                    Thư Gửi {config.recipientName}
                  </h3>

                  <div className="w-full p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-sm leading-relaxed space-y-3 font-medium">
                    {config.letterContent.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                    <div className="pt-3 text-right font-dancing text-xl font-bold text-rose-600">
                      — {config.senderName} ❤️
                    </div>
                  </div>
                </div>
              )}

              {/* Nút đóng modal */}
              <button
                onClick={closeGiftModal}
                className="mt-5 w-full py-2.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold transition-colors"
              >
                Đóng hộp quà & Khám phá tiếp 🌸
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
