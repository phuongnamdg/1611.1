import type { Metadata } from "next";
import { Dancing_Script, Quicksand, Playfair_Display, Caveat, Zeyada } from "next/font/google";
import "./globals.css";

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
});

const zeyada = Zeyada({
  variable: "--font-zeyada",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "🌸 Chúc Mừng Sinh Nhật - Món Quà Bí Mật 🎂",
  description: "Trang thiệp sinh nhật tương tác tone hồng trắng hoa anh đào dành riêng cho bạn!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${dancingScript.variable} ${quicksand.variable} ${playfair.variable} ${caveat.variable} ${zeyada.variable} h-full antialiased`}>
      <body className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white text-stone-800 selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
