import type { ReactNode } from "react";

interface StudySessionHeroBadge {
  label: string;
  className: string;
}

interface StudySessionHeroSummaryItem {
  label: string;
  value: string;
  detail: string;
}

interface StudySessionHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  progressLabel: string;
  progressDetail: string;
  progressPercent: number;
  badges: StudySessionHeroBadge[];
  summaryItems: StudySessionHeroSummaryItem[];
  children?: ReactNode;
}

export default function StudySessionHero({
  eyebrow,
  title,
  description,
  progressLabel,
  progressDetail,
  progressPercent,
  badges,
  summaryItems,
  children,
}: StudySessionHeroProps) {
  const safeProgressPercent = Math.max(0, Math.min(100, progressPercent));

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,251,245,0.98),rgba(245,236,222,0.98))] p-5 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
      <div className="absolute -left-10 top-4 h-32 w-32 rounded-full bg-[rgba(255,216,154,0.24)] blur-3xl" />
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(153,191,163,0.18)] blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              {eyebrow}
            </p>
            <h1 className="font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
              {title}
            </h1>
            <p className="text-sm leading-7 text-stone-600">{description}</p>
          </div>

          <div className="min-w-[8.8rem] rounded-[1.5rem] border border-white/70 bg-white/82 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              오늘 진행
            </div>
            <div className="mt-1 text-2xl font-black text-stone-900">{progressLabel}</div>
            <div className="mt-1 text-xs text-stone-500">{progressDetail}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`rounded-full px-3 py-1 text-sm font-medium shadow-sm ${badge.className}`}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-stone-200/70 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-[1.15rem] bg-stone-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  {item.label}
                </p>
                <p className="mt-1 text-base font-semibold leading-none text-stone-900">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] leading-none text-stone-500">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#31473a,#c96f43)] transition-[width]"
              style={{ width: `${safeProgressPercent}%` }}
            />
          </div>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </section>
  );
}
