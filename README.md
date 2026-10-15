# 🌸 Sakura Birthday Journey (Thiệp Sinh Nhật Hoa Anh Đào)
> **Trải nghiệm thiệp chúc mừng sinh nhật kỹ thuật số tương tác cao với tone màu Hồng Trắng Anh Đào.**

---

## 🎨 Phong Cách Thiết Kế (Look & Feel)
- **Chủ đề màu sắc:** Hồng phấn hoa anh đào (`#FFB7C5`, `#F8C8DC`) kết hợp Trắng tinh khôi (`#FFFFFF`, `#FFF5F7`) và Ánh kim vàng sang trọng.
- **Hiệu ứng môi trường:** Cánh hoa anh đào rơi chao lượn nhẹ nhàng xuyên suốt toàn bộ hành trình.
- **Âm nhạc:** Nhạc nền Piano/Lofi du dương lúc mở đầu, chuyển sang Happy Birthday acoustic khi thổi nến và mở quà.

---

## 🎬 Kịch Bản Trải Nghiệm 5 Màn (Interactive Storyboard)

```
[Màn 1: Cổng Bí Mật (Mật khẩu Ngày Sinh)]
                  │
                  ▼
[Màn 2: Đại Tiệc Pháo Bông & Thổi Nến Bánh Kem]
                  │
                  ▼
[Màn 3: 3 Chiếc Hộp Bí Mật (Bó Hoa - Hộp Nhạc - Bức Thư)]
                  │
                  ▼
[Màn 4: Nguyện Ước Tuổi Mới & Thả Đèn Trời]
                  │
                  ▼
[Màn 5: Tấm Ảnh Polaroid Kỷ Niệm & Bắn Tim Cảm Ơn]
```

### 1. 🔒 Màn 1: Cổng Bí Mật (Sakura Lock Screen)
- Giao diện kính mờ sang trọng, yêu cầu nhập ngày tháng sinh (DD/MM) làm mật mã mở cửa.
- Nhập đúng ngày sinh sẽ kích hoạt hiệu ứng bung tỏa cánh hoa và khởi động nhạc nền.

### 2. 🎂 Màn 2: Đại Tiệc & Thổi Nến Bánh Kem
- Pháo hoa giấy (Confetti) màu hồng - kim tuyến bung nở rực rỡ.
- Các lời chúc mừng sinh nhật mặc định chạy hiệu ứng gõ chữ (Typewriter).
- Bánh sinh nhật nhiều tầng: Cho phép **thổi tắt nến bằng micro điện thoại** hoặc chạm tay vào ngọn nến.

### 3. 🎁 Màn 3: Khám Phá 3 Chiếc Hộp Bí Mật
- Người nhận được tương tác mở 3 hộp quà bí mật:
  - **Hộp 1 (💐 Bó Hoa):** Bó hoa tươi thắm nở rộ kèm lời chúc rạng ngời.
  - **Hộp 2 (🎵 Ô Âm Nhạc):** Đĩa than cổ điển xoay tròn phát bài hát kỷ niệm kèm lời nhạc.
  - **Hộp 3 (💌 Bức Thư):** Phong bao thư mở ra bức tâm thư dài do chính bạn viết riêng.

### 4. 🌟 Màn 4: Điều Ước Tuổi Mới & Thả Đèn Trời
- Cho phép người nhận gõ **duy nhất 1 điều ước** cho tuổi mới.
- Khi bấm gửi, điều ước được gắn vào chiếc **Đèn Trời Phát Sáng** (Sky Lantern) bay vút lên bầu trời đêm sao lung linh.

### 5. 📸 Màn 5: Ảnh Kỷ Niệm Polaroid & Bắn Tim
- Tự động xuất ra một tấm ảnh phong cách Polaroid xinh xắn lưu lại cột mốc sinh nhật để tải về máy.
- Nút "Bắn Tim Cảm Ơn" gửi thông báo phản hồi ngọt ngào đến người tặng.

---

## 🛠️ Công Nghệ Phát Triển & Triển Khai (Tech Stack)

- **Frontend Framework:** `Next.js 15` (React 19, TypeScript)
- **Styling:** `Tailwind CSS` (Tone hồng pastel & trắng tuyết)
- **Hiệu ứng chuyển động:** `Framer Motion`
- **Pháo hoa giấy:** `Canvas Confetti`
- **Xử lý âm thanh & Micro:** `Web Audio API`
- **Nền tảng triển khai:** `Vercel` (Hỗ trợ HTTPS miễn phí cho Micro, load ảnh cực nhanh)

---

## 🚀 Hướng Dẫn Chạy Thử (Getting Started)

```bash
# Cài đặt dependencies
npm install

# Khởi chạy môi trường phát triển
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt.
