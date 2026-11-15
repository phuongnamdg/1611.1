import { BirthdayConfig } from '@/types/birthday';

export const birthdayData: BirthdayConfig = {
  // ==========================================
  // 1. THÔNG TIN CƠ BẢN
  // ==========================================
  recipientName: "",
  birthDatePassword: "1611", // Mật khẩu ngày sinh: 16/11 (nhập 1611)
  birthDateDisplay: "16 Tháng 11",
  senderName: "Người luôn ủng hộ bạn",

  // ==========================================
  // ⏰ CẤU HÌNH THỜI GIAN SINH NHẬT (SẢNH CHỜ VINTAGE)
  // ==========================================
  // Định dạng ISO theo múi giờ Việt Nam (+07:00). Mặc định là 00:00:00 ngày 16/11/2026.
  // Khi đến thời điểm này, đồng hồ chạm 00:00 và điện thoại cổ sẽ reo.
  targetBirthdayTime: "2026-11-16T00:00:00+07:00",
  // Chế độ thử nghiệm: Khi bật true, sảnh chờ sẽ có nút nhỏ "Test: 00:00" và "Test: Còn 10s"
  // để bạn có thể kiểm tra hiệu ứng điện thoại reo ngay lập tức mà không cần đợi đến ngày thật.
  isCountdownTestMode: true,

  // ==========================================
  // 2. CÁC TIÊU ĐỀ LỚN & LỜI THOẠI TRÊN CÁC TRANG
  // ==========================================
  // Màn 1: Cổng nhập mật khẩu
  scene1Title: "Mở để nhận quà !!!!!",
  lockErrorMsg: "Sai mật khẩu nha cưng? 😠😠",

  // Màn 2: Lời dẫn chạy chữ trên bánh kem trước khi thổi nến
  cakeIntroSentences: [
    "Sau này khi có nhà...",
    "Trong nhà sẽ luôn có những món ăn mà em thích...",
    "Vì vậy, em hãy xuất hiện trong chặng đường còn lại cùng anh nhé !!!",
  ],

  // Màn 3: Phong thư mở hoa
  envelopePromptText: "Chạm để mở",

  // ==========================================
  // 3. NỘI DUNG 10 MẢNH GIẤY KẺ Ô LY (MÀN KẾT)
  // Mỗi mảng [] tương ứng với các dòng chữ viết tay trên từng mảnh giấy
  // ==========================================
  paperCardsText: {
    // Mảnh 1: Ảnh munnar (chân dung/phong cảnh)
    munnar: [
      "Chúc em tuổi mới luôn mạnh khỏe...",
      "Bình an, vui tươi",
      "Anh chúc em sẽ mọi thứ...",
      "Anh nghĩ em sẽ làm được tất cả ",
    ],
    // Mảnh 2: Ảnh bird (chú chim)
    bird: [
      "Chỉ có bạn gái là hay bỏ",
      "Hơi tí là bỏ",
    ],
    // Mảnh 3: Ảnh fly (ảnh bạn nữ cầm bánh kem sinh nhật)
    fly: [
      "Yêu là đừng để nhà hoang",
      "Cái ghế biết nhớ, cái bàn biết thương",
    ],
    // Mảnh 4: Ảnh car-style (xe bên hoa)
    "car-style": [
      "Yêu nhau thì ném miếng trầu",
      "Ghét nhau, ném đá vỡ đầu nhau ra",
      "Yêu nhau, cau sáu bổ ba",
      "Ghét nhau, cau sáu bổ ra làm mười",
    ],
    // Mảnh 5: Ảnh boat (du thuyền)
    boat: [
      "Anh sẽ luôn đứng sau ủng những lựa chọn của em ",
    ],
    // Mảnh 6: Ảnh car (xe hơi / ảnh bạn nữ)
    car: [
      "Tương lai của em anh mong sẽ thật bằng phẳng",
      "Để em có thể dễ dàng bước đi tìm lấy những điều em ước",
    ],
    // Mảnh 7: Mảnh chữ nghệ thuật
    "drag-hint": [
      "Happy Birtday cụt cưng",
    ],
    // 🎵 Tờ giấy chứa bài hát YouTube (Ordinary - Alex Warren)
    "song-card": [
      "Our Song",
      "Chạm để nghe !!!",
    ],
  },
};
