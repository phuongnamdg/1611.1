export interface BirthdayConfig {
  // Thông tin cơ bản
  recipientName: string;
  birthDatePassword: string; // Mật khẩu (ví dụ "1611")
  birthDateDisplay: string;  // Hiển thị (ví dụ "16 Tháng 11")
  senderName: string;

  // Tiêu đề các màn hình
  scene1Title: string; // Tiêu đề Màn 1 (Cổng bí mật)
  scene2Title: string; // Tiêu đề Màn 2 (Chúc mừng & Thổi nến)
  scene3Title: string; // Tiêu đề Màn 3 (3 Hộp quà)
  scene4Title: string; // Tiêu đề Màn 4 (Thả đèn trời)
  scene5Title: string; // Tiêu đề Màn 5 (Kỷ niệm kết thúc)

  // Nội dung chi tiết các món quà
  defaultWishes: string[];
  flowerMessage: string;
  songTitle: string;
  songArtist: string;
  letterContent: string[];

  // Thiệp cuối trang (Màn 5 Polaroid)
  finaleCardQuote: string;
  finaleCardHashtag: string;
}

export type SceneState = 'LOCK' | 'CELEBRATION' | 'GIFTS' | 'WISH' | 'FINALE';
