import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AppTabBar from "@/components/app-tab-bar";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: "JPTL - JLPT 학습",
  description: "둘이 함께 이어가는 JLPT N5/N4/N3 학습 루틴",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf7ef",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} ${notoSerifKr.variable} jptl-shell min-h-screen antialiased text-stone-950`}
      >
        <nav className="sticky top-0 z-20 border-b border-stone-200/60 bg-[rgba(251,247,239,0.82)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex items-end gap-3">
              <span className="font-[family:var(--font-noto-serif-kr)] text-2xl font-bold tracking-[0.18em] text-stone-900">
                JPTL
              </span>
              <span className="pb-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-stone-400">
                Shared Journey
              </span>
            </Link>
            <span className="rounded-full border border-stone-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Together Mode
            </span>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-10 sm:pb-32">
          {children}
        </main>
        <AppTabBar />
      </body>
    </html>
  );
}
