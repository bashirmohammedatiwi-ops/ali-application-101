import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { Providers } from "@/components/providers/session-provider";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "بوابة الحداثة | Modernity Gate",
  description: "نظام إدارة طلبات الاستيراد من الصين",
  manifest: "/manifest.json?v=2026062613",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Modernity Gate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#3C3C3B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body className={`${cairo.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
