"use client";

import Link from "next/link";

export default function UserSelectionNotice() {
  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,252,246,0.95)] p-6 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
        기기 설정
      </p>
      <h1 className="mt-2 font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
        먼저 이 기기의 학습 사용자를 선택해 주세요.
      </h1>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        동행 탭에서 용훈 또는 지혜를 고르면, 그다음부터는 이 기기에서 같은 사용자로 바로
        이어집니다.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-[1.6rem] bg-[linear-gradient(135deg,#31473a,#c96f43)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(70,54,36,0.14)] transition hover:brightness-105"
      >
        동행 탭으로 이동
      </Link>
    </section>
  );
}
