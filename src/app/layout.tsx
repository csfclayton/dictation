import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "香港小學默書練習 | Cantonese Dictation",
  description: "幫助香港小學生練習中文默書（廣東話）的 Web 應用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
