"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Link2, Check, RefreshCw } from "lucide-react";

// Tải động Spline với ssr: false để 100% không bị lỗi SSR trên Vercel
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-[320px] text-pink-600">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-pink-500" />
      <span className="font-dancing text-xl font-bold tracking-wide">
        Đang tải mô hình 3D Spline lung linh...
      </span>
      <span className="text-xs text-stone-500 mt-1">
        (Xoay 360° bằng chuột hoặc chạm ngón tay)
      </span>
    </div>
  ),
});

interface Props {
  isCandleBlown: boolean;
  onExtinguishCandle: () => void;
}

export default function SplineCake3D({ isCandleBlown, onExtinguishCandle }: Props) {
  // URL mẫu Spline 3D mặc định
  const [sceneUrl, setSceneUrl] = useState<string>(
    "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
  );
  const [customInput, setCustomInput] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [splineKey, setSplineKey] = useState<number>(0);

  const handleApplyCustomUrl = () => {
    if (customInput.trim().startsWith("http")) {
      setSceneUrl(customInput.trim());
      setSplineKey((prev) => prev + 1);
      setShowUrlInput(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* VÙNG KHÔNG GIAN 3D SPLINE TƯƠNG TÁC */}
      <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden bg-gradient-to-b from-pink-50/60 to-white/70 shadow-inner flex items-center justify-center border border-pink-100">
        <div className="absolute inset-0 z-0">
          <Spline
            key={splineKey}
            scene={sceneUrl}
            onMouseDown={() => {
              if (!isCandleBlown) {
                onExtinguishCandle();
              }
            }}
          />
        </div>

        {/* Hướng dẫn tương tác xoay 3D */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none z-10 text-[11px] text-stone-500 bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-pink-100 shadow-xs">
          <span className="flex items-center gap-1 font-medium text-pink-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Giữ chuột / ngón tay để xoay 3D 360°
          </span>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="pointer-events-auto text-[11px] text-pink-600 hover:text-pink-800 underline font-semibold flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" />
            Đổi link Spline
          </button>
        </div>

        {/* Lớp phủ khi nến tắt */}
        {isCandleBlown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-pink-500/90 text-white text-xs font-bold shadow-md backdrop-blur-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Đã thổi nến 3D thành công!
          </motion.div>
        )}
      </div>

      {/* MODAL / INPUT NHẬP LINK SPLINE CỦA BẠN NẾU CÓ */}
      {showUrlInput && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-2 p-3 bg-white/95 rounded-xl border border-pink-200 shadow-md text-xs z-30"
        >
          <p className="font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
            <span>🎨 Nhập link scene.splinecode từ Spline.design của bạn:</span>
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="https://prod.spline.design/xxx/scene.splinecode"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-pink-200 focus:outline-hidden focus:border-pink-500 text-stone-700 text-xs"
            />
            <button
              onClick={handleApplyCustomUrl}
              className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Lưu
            </button>
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            Mẹo: Bạn có thể vào{" "}
            <a
              href="https://spline.design/community"
              target="_blank"
              rel="noreferrer"
              className="text-pink-600 underline font-semibold"
            >
              Spline Community
            </a>
            , tìm &quot;cake&quot;, bấm Export &gt; Code &gt; sao chép URL dán vào đây!
          </p>
        </motion.div>
      )}
    </div>
  );
}
