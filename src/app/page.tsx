'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import SakuraPetals from '@/components/SakuraPetals';
import HeartCursorTrail from '@/components/HeartCursorTrail';
import WaitingRoomScene from '@/components/WaitingRoom/WaitingRoomScene';
import Scene1Lock from '@/components/Scene1Lock';
import Scene2Cake from '@/components/Scene2Cake';
import CustomRevealScene from '@/components/CustomRevealScene';
import { birthdayData } from '@/config/birthdayData';
import { soundManager } from '@/utils/sound';
import { SceneState } from '@/types/birthday';
import FlowerBloomBurst, { FlowerTheme } from '@/components/FlowerBloomBurst';
import StarCascadeBurst from '@/components/StarCascadeBurst';

export default function BirthdayPage() {
  const [scene, setScene] = useState<SceneState>('WAITING_ROOM');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [flowerBurstTheme, setFlowerBurstTheme] = useState<FlowerTheme | null>(null);
  const [isStarBurstActive, setIsStarBurstActive] = useState<boolean>(false);

  const handleStartStarCascade = () => {
    setIsStarBurstActive(true);
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  return (
    <main className={`relative min-h-screen w-full flex flex-col items-center ${scene === 'CUSTOM_SCENE' ? 'overflow-y-auto' : 'justify-center overflow-hidden'} font-sans bg-[#f6eee0]`}>
      {/* 📜 Họa tiết giấy linen / parchment vintage chấm mờ nhẹ đồng bộ toàn trang */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#d3c3a9_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      {/* 🌸 Hiệu ứng cánh hoa đào bay thoang thoảng chút chút thôi */}
      <SakuraPetals />

      {/* 💖 Hiệu ứng vệt trái tim bay theo con trỏ chuột */}
      <HeartCursorTrail />

      {/* 🔊 Nút điều khiển âm thanh ở góc trên bên phải */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={toggleSound}
          aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-pink-200/80 shadow-md text-pink-600 transition-all hover:scale-105 active:scale-95"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-stone-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-pink-500 animate-pulse" />
          )}
        </button>
      </div>



      {/* 🎬 ĐIỀU PHỐI 6 MÀN HÌNH TỪNG FILE RIÊNG BIỆT */}
      <div className={`w-full ${scene === 'CUSTOM_SCENE' ? 'min-h-screen flex flex-col items-center justify-start' : 'h-screen flex items-center justify-center'}`}>
        <AnimatePresence mode="wait">
          {/* SẢNH CHỜ: CĂN PHÒNG VINTAGE & MINIGAME TÌM ĐỒ VẬT */}
          {scene === 'WAITING_ROOM' && (
            <motion.div
              key="scene-waiting-room"
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WaitingRoomScene
                config={birthdayData}
                onEnterPassword={handleStartStarCascade}
              />
            </motion.div>
          )}

          {/* MÀN 1: ĐĂNG NHẬP (File riêng: src/components/Scene1Lock.tsx) */}
          {scene === 'LOCK' && (
            <motion.div
              key="scene-lock"
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Scene1Lock
                config={birthdayData}
                onUnlock={() => setScene('CELEBRATION')}
              />
            </motion.div>
          )}

          {/* MÀN 2: BÁNH KEM & NẾN (File riêng: src/components/Scene2Cake.tsx) */}
          {scene === 'CELEBRATION' && (
            <motion.div
              key="scene-celebration"
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <Scene2Cake
                config={birthdayData}
                onNext={() => setScene('CUSTOM_SCENE')}
                onStartFlowerBloom={(theme) => setFlowerBurstTheme(theme)}
              />
            </motion.div>
          )}

          {/* MÀN MỚI SAU KHI HOA NỞ (Mảnh giấy & ảnh kỷ niệm vintage) */}
          {scene === 'CUSTOM_SCENE' && (
            <motion.div
              key="scene-custom"
              className="w-full"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <CustomRevealScene
                config={birthdayData}
                onBack={() => setScene('CELEBRATION')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🌸 HIỆU ỨNG HOA BUNG NỞ KÍN MÀN HÌNH RỒI RƠI XUỐNG ĐỂ LỘ RA MÀN TIẾP THEO */}
      {flowerBurstTheme && (
        <FlowerBloomBurst
          theme={flowerBurstTheme}
          onFullCoverage={() => {
            // Khi hoa nở bung kín 100% màn hình, chuyển scene sang CUSTOM_SCENE ngay dưới lớp hoa dày cộp!
            setScene('CUSTOM_SCENE');
          }}
          onComplete={() => {
            // Khi toàn bộ hoa đã rơi xuống hết khỏi màn hình, gỡ bỏ canvas để tương tác màn mới
            setFlowerBurstTheme(null);
          }}
        />
      )}

      {/* 🌌 HIỆU ỨNG THÁC SAO PHỦ KÍN 100% MÀN HÌNH RỒI RƠI XUỐNG ĐỂ LỘ RA MÀN HÌNH KHÓA */}
      {isStarBurstActive && (
        <StarCascadeBurst
          onFullCoverage={() => {
            // Khi sao phủ kín 100% màn hình: chuyển ngay sang LOCK ở phía dưới lớp sao
            setScene('LOCK');
          }}
          onComplete={() => {
            // Khi toàn bộ sao đã rơi xuống hết khỏi màn hình: gỡ bỏ canvas để tương tác
            setIsStarBurstActive(false);
          }}
        />
      )}
    </main>
  );
}
