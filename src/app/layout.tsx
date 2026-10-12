import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/toaster";
import "./globals.css";

export const metadata: Metadata = { title: "نکسورا | مدیریت لایسنس سایت‌ها", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&family=Outfit:wght@800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
