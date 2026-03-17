import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JPTL - JLPT 학습",
  description: "Anki 스타일 JLPT N4/N3 단어 & 독해 학습",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-stone-50 text-stone-950">
        <nav className="border-b border-stone-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-black tracking-[0.24em]">
              JPTL
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              Daily Race
            </span>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
