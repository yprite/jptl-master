"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isStudyPath(pathname: string): boolean {
  return (
    pathname === "/study" ||
    pathname === "/flashcard" ||
    pathname === "/vocabulary" ||
    pathname === "/grammar" ||
    pathname === "/reading"
  );
}

function TabIcon({ active, variant }: { active: boolean; variant: "journey" | "study" }) {
  if (variant === "journey") {
    return (
      <span
        aria-hidden="true"
        className={`relative h-5 w-5 rounded-full border transition ${
          active ? "border-stone-900 bg-stone-900/10" : "border-stone-400/60"
        }`}
      >
        <span
          className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
            active ? "bg-stone-900" : "bg-stone-400/70"
          }`}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="relative h-5 w-5">
      <span
        className={`absolute bottom-0 left-0 h-2.5 w-2.5 rounded-md transition ${
          active ? "bg-stone-900" : "bg-stone-400/70"
        }`}
      />
      <span
        className={`absolute bottom-0 left-3 h-4 w-2 rounded-md transition ${
          active ? "bg-stone-900" : "bg-stone-400/70"
        }`}
      />
      <span
        className={`absolute bottom-0 right-0 h-3.5 w-2 rounded-md transition ${
          active ? "bg-stone-900" : "bg-stone-400/70"
        }`}
      />
    </span>
  );
}

export default function AppTabBar() {
  const pathname = usePathname();
  const tabs = [
    {
      href: "/",
      label: "동행",
      description: "분위기와 페이스",
      active: pathname === "/",
      variant: "journey" as const,
    },
    {
      href: "/study",
      label: "학습",
      description: "오늘의 루틴",
      active: isStudyPath(pathname),
      variant: "study" as const,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 sm:px-6">
      <div
        className="pointer-events-auto mb-[calc(0.8rem+env(safe-area-inset-bottom))] flex w-full max-w-[26rem] items-center gap-2 rounded-[1.9rem] border border-stone-200/80 bg-[rgba(255,250,242,0.92)] p-2 shadow-[0_18px_40px_rgba(84,65,39,0.12)] backdrop-blur-xl"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-[1.4rem] px-3 py-3 transition ${
              tab.active
                ? "bg-stone-900 text-white shadow-[0_14px_30px_rgba(43,36,28,0.22)]"
                : "text-stone-500 hover:bg-white/70 hover:text-stone-900"
            }`}
          >
            <TabIcon active={tab.active} variant={tab.variant} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{tab.label}</span>
              <span
                className={`block truncate text-[11px] ${
                  tab.active ? "text-white/72" : "text-stone-400"
                }`}
              >
                {tab.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
