import type { Metadata } from "next";
import { Quicksand, Dancing_Script } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

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
    <html
      lang="vi"
      className={`${quicksand.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className="min-h-screen font-quicksand bg-gradient-to-b from-rose-50 via-pink-50 to-white text-stone-800 selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
