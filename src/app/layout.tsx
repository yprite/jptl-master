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
      <body className="antialiased">
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="text-lg font-bold">
              JPTL
            </Link>
            <Link
              href="/flashcard"
              className="text-sm hover:text-blue-600 transition-colors"
            >
              단어 학습
            </Link>
            <Link
              href="/reading"
              className="text-sm hover:text-blue-600 transition-colors"
            >
              독해
            </Link>
            <Link
              href="/plan"
              className="text-sm hover:text-blue-600 transition-colors"
            >
              학습 계획
            </Link>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
