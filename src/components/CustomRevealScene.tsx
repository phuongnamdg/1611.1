"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { Music } from "lucide-react";
import { BirthdayConfig } from "@/types/birthday";
import { soundManager } from "@/utils/sound";

interface Props {
  config?: BirthdayConfig;
  onNext?: () => void;
  onBack?: () => void;
}

interface PaperCardData {
  id: string;
  variant: "heart" | "image" | "red" | "text" | "song";
  lines?: string[];
  image?: string;
  initialRotation: number;
  youtubeId?: string;
  songTitle?: string;
}

// Danh sách các mảnh giấy kỷ niệm & tờ giấy bài hát YouTube
const ORIGINAL_PAPERS: PaperCardData[] = [
  {
    id: "heart",
    variant: "heart",
    initialRotation: -5,
  },
  {
    id: "munnar",
    variant: "image",
    lines: [
      "Your smile doesn’t ",
      "just light up the room…",
      "It lights up ",
      "my entire world",
    ],
    image: "/code-with-love/munnar.jpg",
    initialRotation: 7,
  },
  {
    id: "bird",
    variant: "image",
    lines: ["Every time I see you,", "my heart smiles ❤️"],
    image: "/code-with-love/bird.jpg",
    initialRotation: -11,
  },
  {
    id: "fly",
    variant: "image",
    lines: ["You’re that rare", "kind of magic ❤️"],
    image: "/code-with-love/fly.jpg",
    initialRotation: 9,
  },
  {
    id: "car-style",
    variant: "image",
    lines: ["I wasn’t chasing sunsets…", "I was chasing moments", "with you"],
    image: "/code-with-love/car-style.jpg",
    initialRotation: -6,
  },
  {
    id: "song-card",
    variant: "song",
    youtubeId: "A8dH4cKGa6s",
    songTitle: "Alex Warren - Ordinary",
    lines: [
      'Our Song',
      'I don’t wanna live an ordinary life without you',
    ],
    initialRotation: 6,
  },
  {
    id: "boat",
    variant: "image",
    lines: [
      "Meeting you was like finding",
      "WiFi in a forest — unexpected",
      ", magical, and suddenly everything ",
      "started to connect.",
    ],
    image: "/code-with-love/boat.jpg",
    initialRotation: 12,
  },
  {
    id: "car",
    variant: "image",
    lines: [" and My Favorite", "Person 😍"],
    image: "/code-with-love/car.jpg",
    initialRotation: -9,
  },
  {
    id: "drag-hint",
    variant: "text",
    lines: ["Drag the papers to move!"],
    initialRotation: -4,
  },
];

// Danh sách các góc offset vị trí background để mỗi mảnh giấy có nếp nhăn khác nhau, tự nhiên
const CRUMPLED_PAPER_POSITIONS = [
  "center center",
  "top left",
  "bottom right",
  "top center",
  "bottom left",
  "top right",
  "bottom center",
  "left center",
  "right center",
  "center center",
  "top left",
  "bottom right",
];

// Nền chất liệu giấy kẻ ô nhăn thực tế từ ảnh người dùng tải lên (/paper-grid-crumpled.jpg)
const CRUMPLED_PAPER_STYLE: React.CSSProperties = {
  backgroundColor: "#f3ede2",
  backgroundImage: "url('/paper-grid-crumpled.jpg')",
  backgroundSize: "cover",
  boxShadow: "1px 15px 22px 0px rgba(0, 0, 0, 0.42)",
};

interface DragState {
  holding: boolean;
  initialX: number;
  initialY: number;
  initialPaperX: number;
  initialPaperY: number;
  currentPaperX: number;
  currentPaperY: number;
  rotation: number;
}

export default function CustomRevealScene({ config, onBack }: Props) {
  const paperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStatesRef = useRef<DragState[]>([]);
  const iframeWrapRef = useRef<HTMLDivElement | null>(null);

  // Áp dụng nội dung tùy chỉnh từ config (birthdayData.ts) nếu có
  const papers = useMemo(() => {
    return ORIGINAL_PAPERS.map((card) => {
      const customLines = config?.paperCardsText?.[card.id];
      if (customLines) {
        return {
          ...card,
          lines: customLines,
        };
      }
      return card;
    });
  }, [config?.paperCardsText]);

  const highestZRef = useRef<number>(papers.length + 1);

  // Khởi tạo góc nghiêng theo initialRotation và xử lý kéo thả chuột + cảm ứng
  useEffect(() => {
    dragStatesRef.current = ORIGINAL_PAPERS.map((card, idx) => {
      const rot = card.initialRotation;
      const el = paperRefs.current[idx];
      if (el) {
        el.style.zIndex = String(idx + 1);
        el.style.transform = `translateX(0px) translateY(0px) rotateZ(${rot}deg)`;
      }
      return {
        holding: false,
        initialX: 0,
        initialY: 0,
        initialPaperX: 0,
        initialPaperY: 0,
        currentPaperX: 0,
        currentPaperY: 0,
        rotation: rot,
      };
    });

    const getPoint = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      const me = e as MouseEvent;
      return { x: me.clientX, y: me.clientY };
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      let anyHolding = false;
      const pt = getPoint(e);

      dragStatesRef.current.forEach((state, idx) => {
        if (!state.holding) return;
        anyHolding = true;
        state.currentPaperX = state.initialPaperX + (pt.x - state.initialX);
        state.currentPaperY = state.initialPaperY + (pt.y - state.initialY);
        const el = paperRefs.current[idx];
        if (el) {
          el.style.transform = `translateX(${state.currentPaperX}px) translateY(${state.currentPaperY}px) rotateZ(${state.rotation}deg)`;
        }
      });

      if (anyHolding && e.cancelable) {
        e.preventDefault();
      }
    };

    const handleEnd = () => {
      dragStatesRef.current.forEach((state) => {
        state.holding = false;
      });
      if (iframeWrapRef.current) {
        iframeWrapRef.current.style.pointerEvents = "auto";
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, []);

  const handleStartDrag = (
    idx: number,
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    const state = dragStatesRef.current[idx];
    const el = paperRefs.current[idx];
    if (!state || !el || state.holding) return;

    state.holding = true;
    if (iframeWrapRef.current) {
      iframeWrapRef.current.style.pointerEvents = "none";
    }
    el.style.zIndex = String(highestZRef.current);
    highestZRef.current += 1;

    const pt =
      "touches" in e && e.touches.length > 0
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : {
            x: (e as React.MouseEvent).clientX,
            y: (e as React.MouseEvent).clientY,
          };

    state.initialX = pt.x;
    state.initialY = pt.y;
    state.initialPaperX = state.currentPaperX;
    state.initialPaperY = state.currentPaperY;

    if (e.cancelable) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative z-20 w-full h-screen overflow-hidden flex items-center justify-center select-none touch-none">
      {/* Các mảnh giấy kỷ niệm & tờ giấy bài hát */}
      {papers.map((card, idx) => {
        const isHeart = card.variant === "heart";
        const isImage = card.variant === "image";
        const isRed = card.variant === "red";
        const isSong = card.variant === "song";

        // Phân bổ vị trí background texture để mỗi mảnh giấy có nếp nhăn riêng biệt
        const bgPos =
          CRUMPLED_PAPER_POSITIONS[idx % CRUMPLED_PAPER_POSITIONS.length];

        return (
          <div
            key={card.id}
            ref={(el) => {
              paperRefs.current[idx] = el;
              if (el && !el.dataset.initialized) {
                el.dataset.initialized = "true";
                el.style.transform = `rotateZ(${card.initialRotation}deg)`;
              }
            }}
            onMouseDown={(e) => handleStartDrag(idx, e)}
            onTouchStart={(e) => handleStartDrag(idx, e)}
            style={{
              ...CRUMPLED_PAPER_STYLE,
              backgroundPosition: bgPos,
            }}
            className={
              isHeart
                ? "relative w-[200px] h-[200px] p-0 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
                : isSong
                  ? "absolute p-[12px] sm:p-[16px] max-w-[90vw] sm:max-w-[420px] w-full cursor-grab active:cursor-grabbing text-center"
                  : isImage
                    ? "absolute p-[10px] max-w-[88vw] sm:max-w-[390px] w-full cursor-grab active:cursor-grabbing"
                    : "absolute py-4 px-6 sm:py-5 sm:px-8 max-w-[88vw] sm:max-w-[380px] w-auto cursor-grab active:cursor-grabbing text-center"
            }
          >
            {/* 🎵 1. TỜ GIẤY BÀI HÁT YOUTUBE (ORDINARY - ALEX WARREN) */}
            {isSong && (
              <div className="w-full flex flex-col items-center justify-center select-none py-1 px-1">
                {/* Tiêu đề viết tay phông Zeyada */}
                <div className="text-center w-full mb-1">
                  <p
                    style={{
                      fontFamily: "var(--font-zeyada), 'Zeyada', cursive",
                      color: "rgb(0, 0, 100)",
                      opacity: 0.85,
                      lineHeight: "1.1em",
                      userSelect: "none",
                    }}
                    className="text-[28px] sm:text-[34px] my-0"
                  >
                    {card.lines?.[0] || 'Our Song'}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-500 mt-0.5">
                    <Music className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>{card.songTitle || "Alex Warren - Ordinary"}</span>
                  </div>
                </div>

                {/* Video YouTube bài hát */}
                <div
                  ref={iframeWrapRef}
                  className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md my-1.5 border border-stone-300/80 bg-black pointer-events-auto"
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${card.youtubeId || "A8dH4cKGa6s"}?rel=0&playsinline=1`}
                    title={card.songTitle || "Alex Warren - Ordinary"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0 block"
                  />
                </div>

                {/* Lời nhắn viết tay dưới video */}
                {card.lines && card.lines[1] && (
                  <p
                    style={{
                      fontFamily: "var(--font-zeyada), 'Zeyada', cursive",
                      color: "rgb(0, 0, 100)",
                      opacity: 0.85,
                      lineHeight: "1.1em",
                      userSelect: "none",
                    }}
                    className="text-[24px] sm:text-[28px] text-center mt-1 mb-0 px-2"
                  >
                    {card.lines[1]}
                  </p>
                )}
              </div>
            )}

            {/* ❤️ 2. Tờ trái tim tròn ở đáy: Sticker hình trái tim đỏ Pixabay nguyên bản */}
            {isHeart && (
              <div
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "url('https://cdn.pixabay.com/photo/2016/03/31/19/25/cartoon-1294994__340.png')",
                  backgroundSize: "150px",
                  backgroundPosition: "center center",
                  backgroundRepeat: "no-repeat",
                }}
                className="absolute inset-0 w-full h-full opacity-60 pointer-events-none flex items-center justify-center"
              >
                {/* Fallback SVG trái tim đỏ nếu ảnh Pixabay không tải được */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-28 h-28 fill-red-500 opacity-20 pointer-events-none"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            )}

            {/* ✍️ 3. Chữ viết tay phông Zeyada cho các mảnh giấy thông thường */}
            {!isHeart &&
              !isSong &&
              card.lines &&
              card.lines.some((l) => l.trim() !== "") && (
                <div
                  className={
                    isImage
                      ? "mb-0 pb-[5px] text-center"
                      : isRed
                        ? "text-center"
                        : "text-center"
                  }
                >
                  {card.lines.map((line, lineIdx) => (
                    <p
                      key={lineIdx}
                      style={{
                        fontFamily: "var(--font-zeyada), 'Zeyada', cursive",
                        color: "rgb(0, 0, 100)",
                        opacity: 0.75,
                        lineHeight: isImage ? "1.05em" : "1.15em",
                        marginBottom: "0px",
                        paddingBottom: isImage ? "6px" : "0px",
                        userSelect: "none",
                      }}
                      className={
                        isImage
                          ? "text-[26px] sm:text-[30px] break-words"
                          : "text-[26px] sm:text-[32px] break-words"
                      }
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}

            {/* 🖼️ 4. Ảnh kỷ niệm: width 100%, height 200px, object-fit cover, border-radius 8px */}
            {isImage && card.image && (
              <img
                src={card.image}
                alt={card.id}
                draggable={false}
                decoding="async"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  userSelect: "none",
                  backgroundColor: "#eee",
                }}
                className="pointer-events-none select-none block"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
