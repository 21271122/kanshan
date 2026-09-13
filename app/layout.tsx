import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "看山沃野｜让收藏重新长出来",
  description: "知乎收藏回顾农场 Demo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
