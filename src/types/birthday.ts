export interface BirthdayConfig {
  // Thông tin cơ bản
  recipientName: string;
  birthDatePassword: string; // Mật khẩu (ví dụ "1611")
  birthDateDisplay: string;  // Hiển thị (ví dụ "16 Tháng 11")
  senderName: string;

  // Tiêu đề các màn hình
  scene1Title: string; // Tiêu đề Màn 1 (Cổng bí mật)
  scene2Title?: string;

  // Tùy chỉnh lời thoại các màn
  lockErrorMsg?: string;
  cakeIntroSentences?: string[];
  envelopePromptText?: string;
  paperCardsText?: {
    [cardId: string]: string[];
  };

  // Cấu hình Sảnh chờ (The Waiting Room)
  targetBirthdayTime?: string; // Múi giờ Asia/Ho_Chi_Minh (ví dụ "2026-11-16T00:00:00+07:00")
  isCountdownTestMode?: boolean; // Bật nút test nhanh
}

export type SceneState = 'WAITING_ROOM' | 'LOCK' | 'CELEBRATION' | 'CUSTOM_SCENE';
