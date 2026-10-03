import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://riftbound-live-overlay.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zberus Rift Service — Riftbound TCG: Overlay, เด็ค, ราคาการ์ด และ Meta",
    template: "%s | Zberus Rift Service",
  },
  description:
    "ศูนย์รวมเครื่องมือสำหรับผู้เล่นเกมการ์ด Riftbound: ฐานข้อมูลการ์ดครบทุกใบ, Deck Builder, Live Overlay สำหรับสตรีม, Points Tracker, Meta Report จากทัวร์นาเมนต์จริง และร้านค้าการ์ด",
  keywords: [
    "Riftbound",
    "Riftbound TCG",
    "การ์ด Riftbound",
    "Riftbound ไทย",
    "Riftbound deck builder",
    "Riftbound overlay",
    "Riftbound meta",
    "ราคาการ์ด Riftbound",
    "ซื้อการ์ด Riftbound",
    "League of Legends card game",
  ],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "Zberus Rift Service",
    title: "Zberus Rift Service — เครื่องมือครบวงจรสำหรับผู้เล่น Riftbound",
    description:
      "ฐานข้อมูลการ์ด, Deck Builder, Live Overlay, Meta Report และร้านค้าการ์ด Riftbound ในที่เดียว",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Zberus Rift Service — Riftbound TCG Tools",
    description: "Card database, deck builder, live overlay, meta report and shop for Riftbound TCG",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  // Google Search Console verification — set GOOGLE_SITE_VERIFICATION in Vercel env
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col pb-16 md:pb-0`}
      >
        {children}
      </body>
    </html>
  );
}
