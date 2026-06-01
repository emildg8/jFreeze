import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const geist = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "jFreeze — умный холодильник и корзина",
  description:
    "История покупок, содержимое холодильника и умная корзина в одном приложении",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "jFreeze",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e7490",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geist.variable} h-full`}>
      <body className="min-h-full font-sans text-slate-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
