'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import SakuraPetals from '@/components/SakuraPetals';
import Scene1Lock from '@/components/Scene1Lock';
import Scene2Cake from '@/components/Scene2Cake';
import Scene3Gifts from '@/components/Scene3Gifts';
import Scene4Wish from '@/components/Scene4Wish';
import Scene5Finale from '@/components/Scene5Finale';
import { birthdayData } from '@/config/birthdayData';
import { soundManager } from '@/utils/sound';
import { SceneState } from '@/types/birthday';

export default function BirthdayPage() {
  const [scene, setScene] = useState<SceneState>('LOCK');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [userWish, setUserWish] = useState<string>('');

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden">
      {/* Hiệu ứng cánh hoa anh đào rơi liên tục 60fps */}
      <SakuraPetals />

      {/* Nút điều khiển âm thanh ở góc trên bên phải */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={toggleSound}
          aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-pink-200/80 shadow-md shadow-pink-200/50 text-pink-600 transition-all hover:scale-105 active:scale-95"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-pink-500 animate-pulse" />}
        </button>
      </div>

      {/* Dải tiến trình nhỏ hiển thị các bước */}
      {scene !== 'LOCK' && (
        <div className="fixed top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-pink-200/80 shadow-sm text-xs font-semibold text-pink-700">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          <span>
            {scene === 'CELEBRATION' && '1. Chúc Mừng & Thổi Nến'}
            {scene === 'GIFTS' && '2. Mở Hộp Quà'}
            {scene === 'WISH' && '3. Thả Đèn Ước'}
            {scene === 'FINALE' && '4. Kỷ Niệm'}
          </span>
        </div>
      )}

      {/* Điều phối các màn hình với AnimatePresence */}
      <div className="w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {scene === 'LOCK' && (
            <motion.div
              key="scene-lock"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Scene1Lock
                config={birthdayData}
                onUnlock={() => setScene('CELEBRATION')}
              />
            </motion.div>
          )}

          {scene === 'CELEBRATION' && (
            <motion.div
              key="scene-celebration"
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Scene2Cake
                config={birthdayData}
                onNext={() => setScene('GIFTS')}
              />
            </motion.div>
          )}

          {scene === 'GIFTS' && (
            <motion.div
              key="scene-gifts"
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Scene3Gifts
                config={birthdayData}
                onNext={() => setScene('WISH')}
              />
            </motion.div>
          )}

          {scene === 'WISH' && (
            <motion.div
              key="scene-wish"
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Scene4Wish
                config={birthdayData}
                onWishSubmitted={(wish) => setUserWish(wish)}
                onNext={() => setScene('FINALE')}
              />
            </motion.div>
          )}

          {scene === 'FINALE' && (
            <motion.div
              key="scene-finale"
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Scene5Finale
                config={birthdayData}
                userWish={userWish}
                onRestart={() => {
                  soundManager.stopMelody();
                  setScene('LOCK');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
