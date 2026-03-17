"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  type DailyQuests,
  type HomeState,
  type StudyPlan,
  type UserId,
  completeDailyQuest,
  getCurrentUserId,
  getHomeState,
  setCurrentUserId,
} from "@/lib/user-store";

const USER_IDS: UserId[] = ["me", "wife"];
const USER_LABELS: Record<UserId, string> = {
  me: "나",
  wife: "와이프",
};

const EMPTY_STATE: HomeState = {
  user: null,
  plan: null,
  quests: {
    flashcard: false,
    vocabulary: false,
    grammar: false,
    reading: false,
  },
  progress: {
    totalDays: 0,
    flashcardCount: 0,
    vocabCount: 0,
    grammarCount: 0,
    readingCount: 0,
  },
};

function createEmptyStates(): Record<UserId, HomeState> {
  return {
    me: {
      user: null,
      plan: null,
      quests: { ...EMPTY_STATE.quests },
      progress: { ...EMPTY_STATE.progress },
    },
    wife: {
      user: null,
      plan: null,
      quests: { ...EMPTY_STATE.quests },
      progress: { ...EMPTY_STATE.progress },
    },
  };
}

function getCompletedCount(quests: DailyQuests): number {
  return Object.values(quests).filter(Boolean).length;
}

function getPlanDayNumber(plan: StudyPlan | null): number {
  if (!plan) return 1;

  const currentDate = new Date();
  const startDate = new Date(`${plan.startDate}T00:00:00`);
  const diffMs = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));
  return Math.min(plan.totalDays, diffDays + 1);
}

function getDisplayName(id: UserId): string {
  return USER_LABELS[id];
}

export default function StudyPage() {
  const [userId, setUserId] = useState<UserId>(() => getCurrentUserId());
  const [states, setStates] = useState<Record<UserId, HomeState>>(createEmptyStates);
  const [loading, setLoading] = useState(true);

  const loadStates = useCallback(async () => {
    setLoading(true);
    const entries = await Promise.all(
      USER_IDS.map(async (id) => [id, await getHomeState(id)] as const)
    );
    const nextStates = Object.fromEntries(entries) as Record<UserId, HomeState>;
    setStates(nextStates);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStates();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStates, userId]);

  const activeState = states[userId] ?? EMPTY_STATE;
  const activeUser = activeState.user;
  const activePlan = activeState.plan;
  const activeQuests = activeState.quests;
  const activeProgress = activeState.progress;

  const switchUser = (id: UserId) => {
    setCurrentUserId(id);
    setUserId(id);
  };

  const markComplete = async (quest: keyof DailyQuests) => {
    const updated = await completeDailyQuest(userId, quest);
    setStates((prev) => ({
      ...prev,
      [userId]: updated,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-stone-400">불러오는 중...</div>
      </div>
    );
  }

  if (!activeUser || !activePlan) {
    return (
      <section className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,252,246,0.95)] p-6 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
          Study Page
        </p>
        <h1 className="mt-2 font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
          먼저 동행 탭에서 시작 설정을 마쳐 주세요.
        </h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          프로필과 계획이 준비되어야 오늘 루틴이 열립니다. 동행 탭에서 두 사람의 시작점을 맞춘 뒤,
          다시 학습 탭으로 오면 됩니다.
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

  const currentDay = getPlanDayNumber(activePlan);
  const completedCount = getCompletedCount(activeQuests);
  const questDefs = [
    {
      key: "flashcard" as const,
      title: "단어 암기",
      desc: `플래시카드 ${activePlan.dailyFlashcard}장`,
      href: "/flashcard",
      accent: "from-sky-500 to-blue-600",
    },
    {
      key: "vocabulary" as const,
      title: "어휘 문제",
      desc: `어휘 문제 ${activePlan.dailyVocabulary}개`,
      href: "/vocabulary",
      accent: "from-indigo-500 to-violet-600",
    },
    {
      key: "grammar" as const,
      title: "문법 문제",
      desc: `문법 문제 ${activePlan.dailyGrammar}개`,
      href: "/grammar",
      accent: "from-amber-400 to-orange-500",
    },
    {
      key: "reading" as const,
      title: "독해",
      desc: `독해 문제 ${activePlan.dailyReading}개`,
      href: "/reading",
      accent: "from-emerald-400 to-green-600",
    },
  ];
  const currentQuestIdx = questDefs.findIndex((quest) => !activeQuests[quest.key]);
  const allDone = completedCount === questDefs.length;
  const planProgressPercent = Math.min(
    100,
    Math.round((activeProgress.totalDays / activePlan.totalDays) * 100)
  );

  return (
    <div className="space-y-5">
      <section className="rounded-[2.1rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,251,244,0.96),rgba(244,236,222,0.96))] p-5 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Study Page
            </p>
            <h1 className="mt-2 font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
              Day {currentDay} 루틴
            </h1>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              {getDisplayName(userId)}는 오늘 암기에서 시작해 어휘, 문법, 독해 순서로 천천히 이어갑니다.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white/80 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Today
            </div>
            <div className="mt-1 text-lg font-black text-stone-900">
              {completedCount}/{questDefs.length}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {USER_IDS.map((id) => {
            const isActive = id === userId;

            return (
              <button
                key={id}
                onClick={() => void switchUser(id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-stone-900 text-white shadow-[0_10px_24px_rgba(47,39,29,0.18)]"
                    : "bg-white/75 text-stone-500 hover:bg-white"
                }`}
              >
                {USER_LABELS[id]}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">현재 사용자</div>
            <div className="mt-2 text-lg font-black text-stone-900">{getDisplayName(userId)}</div>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">완주 일수</div>
            <div className="mt-2 text-lg font-black text-stone-900">{activeProgress.totalDays}</div>
          </div>
          <div className="col-span-2 rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-4 sm:col-span-1">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">누적 진행</div>
            <div className="mt-2 text-lg font-black text-stone-900">{planProgressPercent}%</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-stone-600">
            <span>학습 흐름</span>
            <span>{planProgressPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#f6ad55,#c96f43,#31473a)] transition-all"
              style={{ width: `${planProgressPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {questDefs.map((quest, index) => {
          const done = activeQuests[quest.key];
          const isCurrent = index === currentQuestIdx;
          const locked = !done && index > currentQuestIdx && currentQuestIdx >= 0;

          return (
            <div
              key={quest.key}
              className={`rounded-[1.8rem] border p-5 shadow-[0_12px_34px_rgba(90,68,40,0.06)] transition ${
                done
                  ? "border-emerald-200 bg-[linear-gradient(135deg,#f2fbf4,#ecf7ef)]"
                  : isCurrent
                  ? "border-stone-300 bg-white"
                  : "border-stone-200 bg-[rgba(249,245,238,0.85)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white ${
                      done ? "from-emerald-500 to-green-600" : quest.accent
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-stone-900">{quest.title}</h3>
                    <p className="text-sm text-stone-500">{quest.desc}</p>
                  </div>
                </div>

                {done ? (
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                    오늘 완료
                  </span>
                ) : isCurrent ? (
                  <Link
                    href={quest.href}
                    className="rounded-full bg-[linear-gradient(135deg,#31473a,#c96f43)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-105"
                  >
                    시작
                  </Link>
                ) : locked ? (
                  <span className="rounded-full bg-stone-200 px-4 py-2 text-sm font-bold text-stone-500">
                    잠김
                  </span>
                ) : (
                  <Link
                    href={quest.href}
                    className="rounded-full bg-stone-200 px-4 py-2 text-sm font-bold text-stone-700"
                  >
                    이동
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {allDone ? (
        <section className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#effaf1,#fff6ea)] px-6 py-8 text-center shadow-[0_18px_44px_rgba(102,120,84,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-500">
            Quiet Finish
          </p>
          <h2 className="mt-2 font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-emerald-700">
            오늘 루틴 완료
          </h2>
          <p className="mt-2 text-sm text-emerald-700">
            오늘의 한 장면이 저장되었습니다. 내일 Day{" "}
            {Math.min(activePlan.totalDays, currentDay + 1)}로 이어집니다.
          </p>
        </section>
      ) : currentQuestIdx >= 0 ? (
        <button
          onClick={() => void markComplete(questDefs[currentQuestIdx].key)}
          className="w-full rounded-[1.8rem] bg-[linear-gradient(135deg,#31473a,#c96f43)] px-4 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(70,54,36,0.14)] transition hover:brightness-105"
        >
          지금 단계 마무리하기
        </button>
      ) : null}
    </div>
  );
}
