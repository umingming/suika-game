import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "박병호 만들기 - 키움 히어로즈 수박게임",
  description:
    "키움 히어로즈 선수들을 합쳐서 박병호을 만들어보세요! 임병옥부터 시작해서 박병호까지, 선수를 합쳐 최고의 스타를 완성하세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
