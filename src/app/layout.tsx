import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🌸 Chúc Mừng Sinh Nhật - Món Quà Bí Mật 🎂",
  description: "Trang thiệp sinh nhật tương tác tone hồng trắng hoa anh đào dành riêng cho bạn!",
  openGraph: {
    title: "🌸 Món Quà Sinh Nhật Bí Mật Dành Riêng Cho Bạn 🎂",
    description: "Chạm để mở cánh cửa bí mật và khám phá món quà sinh nhật bất ngờ!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-screen font-sans bg-gradient-to-b from-rose-50 via-pink-50 to-white text-stone-800 selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
