'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BirthdayConfig } from '@/types/birthday';
import { soundManager } from '@/utils/sound';
import StarCatchingGame from './StarCatchingGame';
import WavyRibbonBackground from './WavyRibbonBackground';

interface Props {
  config?: BirthdayConfig;
  onEnterPassword: () => void;
}

export default function WaitingRoomScene({ onEnterPassword }: Props) {
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [customBg, setCustomBg] = useState<string | null>(null);

  // Tự động nhận diện nếu người dùng thả file ảnh nền custom-bg.jpg hoặc custom-bg.png vào public/
  useEffect(() => {
    const checkBg = (url: string, next?: () => void) => {
      const img = new Image();
      img.src = url;
      img.onload = () => setCustomBg(url);
      if (next) img.onerror = next;
    };
    checkBg('/custom-bg.jpg', () => {
      checkBg('/custom-bg.png');
    });
  }, []);

  // 1. Nhạc nền ambient sảnh chờ
  useEffect(() => {
    soundManager.startWaitingRoomAmbient();

    return () => {
      soundManager.stopWaitingRoomAmbient();
    };
  }, []);

  // 2. Phím tắt ẩn 'P' để vào thẳng trang mật khẩu khi cần test (không hiện nút trên màn hình)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        onEnterPassword();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEnterPassword]);

  // 3. Khi ăn đủ 20 sao hoặc bấm Chuyển màn (kích hoạt thác sao)
  const handleTransition = useCallback(() => {
    setIsTimeUp(true);
    soundManager.stopWaitingRoomAmbient();
    onEnterPassword();
  }, [onEnterPassword]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none flex flex-col justify-between items-center py-2 sm:py-4 px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* 🌊 LAYER 1: NỀN SẢNH CHỜ (TỰ ĐỘNG DÙNG custom-bg NẾU CÓ, HOẶC NỀN RETRO)  */}
      {/* ========================================================================= */}
      {customBg ? (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none select-none z-0 transition-opacity duration-700"
          style={{ backgroundImage: `url(${customBg})` }}
        />
      ) : (
        <WavyRibbonBackground />
      )}

      {/* ========================================================================= */}
      {/* ⭐ LAYER 2: TRÒ CHƠI HỨNG SAO: ĂN ĐỦ 20 SAO TỰ ĐỘNG CHUYỂN MÀN          */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-20 pointer-events-auto">
        <StarCatchingGame
          isTimeUp={isTimeUp}
          targetScore={20}
          onCompleteTransition={handleTransition}
        />
      </div>
    </div>
  );
}
