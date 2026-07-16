import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "三人麻雀 牌効率クイズ",
  description: "シャンテン数と受け入れ枚数を学ぶ三人麻雀の牌効率クイズ",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
