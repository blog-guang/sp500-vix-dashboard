import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S&P 500 vs VIX",
  description: "标普500指数与VIX恐慌指数实时图表",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
