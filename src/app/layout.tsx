import type { Metadata } from "next";
import "./globals.css";
import VisitTracker from "@/components/site/VisitTracker";

export const metadata: Metadata = {
  title: "赛播云 SportCast",
  description: "赛事直播录播管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Noto+Sans+SC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
