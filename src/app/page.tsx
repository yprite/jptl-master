"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DailyQuests,
  type HomeState,
  type StudyPlan,
  type StudyPlanDraft,
  type UserId,
  getCurrentUserId,
  getHomeState,
  resetUserState,
  saveStudyPlan,
  setCurrentUserId,
  upsertUser,
} from "@/lib/user-store";

const USER_IDS: UserId[] = ["me", "wife"];
const USER_LABELS: Record<UserId, string> = {
  me: "나",
  wife: "와이프",
};
type TargetRange = {
  min: number;
  max: number;
  label: string;
  suffix: string;
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
const PLAN_DAY_RANGE = {
  min: 30,
  max: 180,
};
const TARGET_RANGES = {
  dailyFlashcard: { min: 8, max: 22, label: "단어 암기", suffix: "장" },
  dailyVocabulary: { min: 4, max: 12, label: "어휘 문제", suffix: "개" },
  dailyGrammar: { min: 3, max: 10, label: "문법 문제", suffix: "개" },
  dailyReading: { min: 2, max: 6, label: "독해 문제", suffix: "개" },
} satisfies Record<keyof Omit<StudyPlanDraft, "totalDays">, TargetRange>;
const LEVEL_MULTIPLIER = {
  N5: 0.9,
  N4: 1,
  N3: 1.15,
} as const;

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

function getJourneyNote(id: UserId, states: Record<UserId, HomeState>): string {
  const current = states[id];
  const companion = states[id === "me" ? "wife" : "me"];

  if (!current.user) {
    return "아직 출발 전입니다. 프로필을 정하면 오늘 루틴이 열립니다.";
  }

  if (!companion.user) {
    return "먼저 길을 밝히고 있습니다. 다른 한 사람의 설정이 끝나면 리듬이 맞춰집니다.";
  }

  const currentScore = current.progress.totalDays * 10 + getCompletedCount(current.quests);
  const companionScore = companion.progress.totalDays * 10 + getCompletedCount(companion.quests);

  if (currentScore === companionScore) {
    return "같은 속도로 나란히 가고 있습니다.";
  }

  if (currentScore > companionScore) {
    return "오늘은 한 걸음 앞에서 페이스를 만들어 주고 있습니다.";
  }

  return "상대의 리듬을 따라가며 천천히 간격을 좁히는 중입니다.";
}

function getTogetherHeadline(isOnboarding: boolean): string {
  return isOnboarding ? "JPTL 시작 설정" : "오늘의 학습 동행";
}

function getTogetherCaption(isOnboarding: boolean): string {
  return isOnboarding
    ? "먼저 두 사람의 출발점을 맞추고, 같은 루틴으로 하루를 열어 둡니다."
    : "누가 앞서는지보다, 오늘도 같이 책상 앞에 앉았다는 감각을 남깁니다.";
}

function getSharedMood(states: Record<UserId, HomeState>): string {
  const configured = USER_IDS.filter((id) => states[id].user).length;
  const completedDays = USER_IDS.reduce(
    (sum, id) => sum + states[id].progress.totalDays,
    0
  );

  if (configured < USER_IDS.length) {
    return "두 사람의 이름 대신, 두 사람의 페이스를 맞추는 준비 단계입니다.";
  }

  if (completedDays === 0) {
    return "아직 첫 장면입니다. 루틴이 쌓이면 오늘의 분위기가 자연스럽게 달라집니다.";
  }

  return "서로의 진도가 벽이 아니라 풍경처럼 보이도록, 한 화면에 조용히 나란히 두었습니다.";
}

function CompanionJourneyScene({
  isOnboarding,
  currentDay,
}: {
  isOnboarding: boolean;
  currentDay: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/12 bg-[rgba(249,244,233,0.92)] p-4 text-stone-900 shadow-[0_18px_45px_rgba(53,39,24,0.12),inset_0_1px_0_rgba(255,255,255,0.42)] sm:rounded-[1.8rem] sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[rgba(255,207,128,0.34)] blur-2xl" />
      <div className="pointer-events-none absolute left-0 top-8 h-24 w-24 rounded-full bg-[rgba(152,204,180,0.18)] blur-2xl" />

      <div className="companion-scene">
        <div className="companion-skyline" />
        <div className="companion-hill companion-hill-back" />
        <div className="companion-hill companion-hill-front" />
        <div className="companion-path-ribbon" />
        <div className="companion-goal">
          <div className="companion-goal-core" />
          <div className="companion-goal-ring" />
        </div>
        <div className="companion-pair">
          <div className="companion-figure companion-figure-left">
            <span className="companion-head" />
            <span className="companion-body" />
            <span className="companion-arm companion-arm-forward" />
            <span className="companion-leg companion-leg-left" />
            <span className="companion-leg companion-leg-right" />
          </div>
          <div className="companion-hand-link" />
          <div className="companion-figure companion-figure-right">
            <span className="companion-head" />
            <span className="companion-body" />
            <span className="companion-arm companion-arm-forward" />
            <span className="companion-leg companion-leg-left" />
            <span className="companion-leg companion-leg-right" />
          </div>
        </div>
        <div className="companion-step-chip">
          {isOnboarding ? "출발점 정렬" : `Day ${currentDay}로 향하는 중`}
        </div>
      </div>

      <div className="relative mt-4 sm:mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
          Shared Motion
        </p>
        <h2 className="mt-2.5 font-[family:var(--font-noto-serif-kr)] text-[1.35rem] font-semibold leading-snug text-stone-900 sm:mt-3 sm:text-2xl">
          {isOnboarding
            ? "손을 맞잡기 전, 두 사람의 시작점을 먼저 맞춥니다."
            : "나와 와이프가 같은 목표 쪽으로 천천히 걸어가는 장면입니다."}
        </h2>
        <p className="mt-2.5 text-[13px] leading-6 text-stone-600 sm:mt-3 sm:text-sm sm:leading-7">
          {isOnboarding
            ? "프로필과 계획이 정해지면 이 장면이 하루 루틴 쪽으로 자연스럽게 이어집니다."
            : "빠르게 몰아붙이지 않고, 오늘 해야 할 만큼만 함께 앞으로 간다는 감각을 남겨 두었습니다."}
        </p>
      </div>
    </div>
  );
}

function CompanionStatusCard({
  id,
  active,
  configured,
  completed,
  totalDays,
  ratio,
  note,
  className,
  compact = false,
}: {
  id: UserId;
  active: boolean;
  configured: boolean;
  completed: number;
  totalDays: number;
  ratio: number;
  note: string;
  className: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`${className} ${
        active
          ? "border-white/28 bg-[rgba(255,255,255,0.18)]"
          : "border-white/10 bg-[rgba(0,0,0,0.14)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            {active ? "지금 보고 있는 사람" : "함께 걷는 사람"}
          </p>
          <p className={`mt-1 font-black text-white ${compact ? "text-[1.3rem]" : "text-2xl"}`}>
            {getDisplayName(id)}
          </p>
        </div>
        <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/80">
          {configured ? `${completed}/4 진행` : "대기 중"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/82">
          오늘 {completed}/4
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/82">
          누적 {totalDays}일
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/45">
          <span>Journey line</span>
          <span>{ratio}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#fbf6dd,#f6ad55,#9dd5b0)] transition-all duration-500"
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>

      <p className={`text-white/72 ${compact ? "mt-3 text-[13px] leading-6" : "mt-4 text-sm leading-6"}`}>
        {note}
      </p>
    </div>
  );
}

function getDisplayName(id: UserId): string {
  return USER_LABELS[id];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deriveDailyTargets(totalDays: number, level: "N5" | "N4" | "N3"): StudyPlanDraft {
  const normalized =
    (PLAN_DAY_RANGE.max - clamp(totalDays, PLAN_DAY_RANGE.min, PLAN_DAY_RANGE.max)) /
    (PLAN_DAY_RANGE.max - PLAN_DAY_RANGE.min);
  const levelMultiplier = LEVEL_MULTIPLIER[level];
  const computeValue = ({ min, max }: TargetRange) =>
    clamp(Math.round((min + (max - min) * normalized) * levelMultiplier), min, max);

  return {
    totalDays,
    dailyFlashcard: computeValue(TARGET_RANGES.dailyFlashcard),
    dailyVocabulary: computeValue(TARGET_RANGES.dailyVocabulary),
    dailyGrammar: computeValue(TARGET_RANGES.dailyGrammar),
    dailyReading: computeValue(TARGET_RANGES.dailyReading),
  };
}

function getTargetProgress(value: number, range: TargetRange): number {
  if (range.max === range.min) return 100;
  return ((value - range.min) / (range.max - range.min)) * 100;
}

export default function Home() {
  const [userId, setUserId] = useState<UserId>(() => getCurrentUserId());
  const [states, setStates] = useState<Record<UserId, HomeState>>(createEmptyStates);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showPlanSetup, setShowPlanSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [formLevel, setFormLevel] = useState<"N5" | "N4" | "N3">("N4");

  const [planDays, setPlanDays] = useState(84);

  const hydrateForms = useCallback((state: HomeState) => {
    if (state.user) {
      setFormLevel(state.user.level);
    } else {
      setFormLevel("N4");
    }

    const plan = state.plan;
    setPlanDays(plan?.totalDays ?? 84);
  }, []);

  const loadStates = useCallback(
    async (activeUserId: UserId) => {
      setLoading(true);

      const entries = await Promise.all(
        USER_IDS.map(async (id) => [id, await getHomeState(id)] as const)
      );
      const nextStates = Object.fromEntries(entries) as Record<UserId, HomeState>;
      const activeState = nextStates[activeUserId];

      setStates(nextStates);
      hydrateForms(activeState);
      setShowProfileSetup(!activeState.user);
      setShowPlanSetup(Boolean(activeState.user && !activeState.plan));
      setShowSettings(false);
      setLoading(false);
    },
    [hydrateForms]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStates(userId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStates, userId]);

  const activeState = states[userId] ?? EMPTY_STATE;
  const activeUser = activeState.user;
  const activePlan = activeState.plan;

  const switchUser = (id: UserId) => {
    setCurrentUserId(id);
    setUserId(id);
  };

  const saveProfile = async () => {
    const baselineTargets = deriveDailyTargets(activePlan?.totalDays ?? 84, formLevel);

    await upsertUser(userId, {
      name: USER_LABELS[userId],
      level: formLevel,
      daily_flashcard: baselineTargets.dailyFlashcard,
      daily_vocab: baselineTargets.dailyVocabulary,
      daily_grammar: baselineTargets.dailyGrammar,
      daily_reading: baselineTargets.dailyReading,
    });

    await loadStates(userId);
  };

  const savePlan = async () => {
    const draft = deriveDailyTargets(planDays, activeUser?.level ?? formLevel);

    await saveStudyPlan(userId, draft);
    await loadStates(userId);
  };

  const openProfileEditor = () => {
    hydrateForms(activeState);
    setShowSettings(false);
    setShowPlanSetup(false);
    setShowProfileSetup(true);
  };

  const openPlanEditor = () => {
    hydrateForms(activeState);
    setShowSettings(false);
    setShowProfileSetup(false);
    setShowPlanSetup(true);
  };

  const resetCurrentUser = async () => {
    if (!window.confirm(`${getDisplayName(userId)}의 프로필과 진도를 초기화할까요?`)) {
      return;
    }

    setResetting(true);
    await resetUserState(userId);
    await loadStates(userId);
    setResetting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-stone-400">불러오는 중...</div>
      </div>
    );
  }

  const currentDay = getPlanDayNumber(activePlan);
  const derivedPlanTargets = deriveDailyTargets(planDays, activeUser?.level ?? formLevel);
  const isOnboarding = showProfileSetup || showPlanSetup;
  const configuredCount = USER_IDS.filter((id) => states[id].user).length;
  const sharedCompletedDays = USER_IDS.reduce(
    (sum, id) => sum + states[id].progress.totalDays,
    0
  );
  const sharedTodayCount = USER_IDS.reduce(
    (sum, id) => sum + getCompletedCount(states[id].quests),
    0
  );
  const sharedSummaryCards = [
    {
      label: "함께 설정",
      value: `${configuredCount}/2`,
      note:
        configuredCount === USER_IDS.length ? "두 사람 모두 루틴 준비 완료" : "한 사람의 출발 준비가 남아 있습니다.",
    },
    {
      label: "누적 Day",
      value: `${sharedCompletedDays}`,
      note: "함께 쌓인 날짜만 조용히 남겨 둡니다.",
    },
    {
      label: "오늘의 걸음",
      value: `${sharedTodayCount}`,
      note: "오늘 체크된 단계를 한 줄로 요약했습니다.",
    },
  ];
  const companionSnapshots = USER_IDS.map((id) => {
    const state = states[id];
    const completed = getCompletedCount(state.quests);
    const plan = state.plan;
    const ratio = plan
      ? Math.min(100, Math.round((state.progress.totalDays / plan.totalDays) * 100))
      : 0;

    return {
      id,
      state,
      completed,
      ratio,
      note: getJourneyNote(id, states),
    };
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-[linear-gradient(135deg,rgba(38,52,44,0.96),rgba(72,93,78,0.94)_42%,rgba(201,111,67,0.92)_100%)] p-5 text-white shadow-[0_30px_80px_rgba(83,63,38,0.16)] sm:rounded-[2.2rem] sm:p-8">
        <div className="absolute -left-16 top-6 h-40 w-40 rounded-full bg-[rgba(255,245,220,0.14)] blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[rgba(255,210,133,0.22)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-48 rounded-full bg-[rgba(152,204,180,0.18)] blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2.5 sm:space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/55">
                {isOnboarding ? "Shared Setup" : "Study Companions"}
              </p>
              <h1 className="max-w-xl font-[family:var(--font-noto-serif-kr)] text-[2.15rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
                {getTogetherHeadline(isOnboarding)}
              </h1>
              <p className="max-w-xl text-[13px] leading-6 text-white/76 sm:text-base sm:leading-7">
                {getTogetherCaption(isOnboarding)}
              </p>
            </div>
            {!isOnboarding && activeUser && (
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/18"
              >
                설정
              </button>
            )}
          </div>

          {isOnboarding ? (
            <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-[1.65rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-4 backdrop-blur sm:rounded-[1.8rem] sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {USER_IDS.map((id) => {
                    const isActive = id === userId;

                    return (
                      <button
                        key={id}
                        onClick={() => void switchUser(id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-white text-stone-900 shadow-lg"
                            : "border border-white/15 bg-white/8 text-white/80 hover:bg-white/14"
                        }`}
                      >
                        {USER_LABELS[id]}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
                  {sharedSummaryCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-[1.25rem] border border-white/10 bg-black/10 px-3.5 py-3.5 sm:rounded-[1.4rem] sm:px-4 sm:py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                        {card.label}
                      </p>
                      <p className="mt-1.5 text-[1.7rem] font-black text-white sm:mt-2 sm:text-3xl">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 max-w-2xl text-[13px] leading-6 text-white/72 sm:mt-6 sm:text-sm sm:leading-7">
                  {getSharedMood(states)}
                </p>
              </div>

              <CompanionJourneyScene
                isOnboarding={isOnboarding}
                currentDay={currentDay}
              />
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-3 sm:hidden">
                <div className="rounded-[1.65rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-4 backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                    {USER_IDS.map((id) => {
                      const isActive = id === userId;

                      return (
                        <button
                          key={id}
                          onClick={() => void switchUser(id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "bg-white text-stone-900 shadow-lg"
                              : "border border-white/15 bg-white/8 text-white/80 hover:bg-white/14"
                          }`}
                        >
                          {USER_LABELS[id]}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-[13px] leading-6 text-white/72">
                    {getSharedMood(states)}
                  </p>
                </div>

                <CompanionJourneyScene
                  isOnboarding={isOnboarding}
                  currentDay={currentDay}
                />

                <div>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    Today in one swipe
                  </p>
                  <div className="mobile-rail no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
                    {sharedSummaryCards.map((card) => (
                      <div
                        key={card.label}
                        className="min-w-[12.4rem] snap-start rounded-[1.35rem] border border-white/12 bg-[rgba(255,255,255,0.14)] px-4 py-4 backdrop-blur"
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/48">
                          {card.label}
                        </p>
                        <p className="mt-2 text-[1.9rem] font-black text-white">
                          {card.value}
                        </p>
                        <p className="mt-2 text-[12px] leading-5 text-white/70">
                          {card.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    Side by side
                  </p>
                  <div className="mobile-rail no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
                    {companionSnapshots.map(({ id, state, completed, ratio, note }) => (
                      <CompanionStatusCard
                        key={id}
                        id={id}
                        active={id === userId}
                        configured={Boolean(state.user)}
                        completed={completed}
                        totalDays={state.progress.totalDays}
                        ratio={ratio}
                        note={note}
                        compact
                        className="min-w-[calc(100vw-3rem)] max-w-[22rem] snap-start rounded-[1.55rem] border p-4 backdrop-blur"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-[1.8rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-5 backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                    {USER_IDS.map((id) => {
                      const isActive = id === userId;

                      return (
                        <button
                          key={id}
                          onClick={() => void switchUser(id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "bg-white text-stone-900 shadow-lg"
                              : "border border-white/15 bg-white/8 text-white/80 hover:bg-white/14"
                          }`}
                        >
                          {USER_LABELS[id]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {sharedSummaryCards.map((card) => (
                      <div
                        key={card.label}
                        className="rounded-[1.4rem] border border-white/10 bg-black/10 px-4 py-4"
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                          {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-white">
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 max-w-2xl text-sm leading-7 text-white/72">
                    {getSharedMood(states)}
                  </p>
                </div>

                <CompanionJourneyScene
                  isOnboarding={isOnboarding}
                  currentDay={currentDay}
                />
              </div>

              <div className="mt-6 hidden gap-3 md:grid md:grid-cols-2">
                {companionSnapshots.map(({ id, state, completed, ratio, note }) => (
                  <CompanionStatusCard
                    key={id}
                    id={id}
                    active={id === userId}
                    configured={Boolean(state.user)}
                    completed={completed}
                    totalDays={state.progress.totalDays}
                    ratio={ratio}
                    note={note}
                    className="rounded-[1.8rem] border p-5 transition"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {showSettings && activeUser && (
        <section className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,250,242,0.92)] p-6 shadow-[0_22px_60px_rgba(97,74,45,0.08)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[family:var(--font-noto-serif-kr)] text-2xl font-semibold text-stone-900">
                설정
              </h2>
              <p className="text-sm text-stone-500">
                {getDisplayName(userId)} 학습 루틴을 관리합니다.
              </p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-600"
            >
              닫기
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button
              onClick={openProfileEditor}
              className="rounded-[1.6rem] border border-stone-200 bg-white/80 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white"
            >
              <div className="text-sm font-bold text-stone-900">프로필 수정</div>
              <div className="mt-1 text-sm text-stone-500">목표 레벨을 다시 고릅니다.</div>
            </button>
            <button
              onClick={openPlanEditor}
              className="rounded-[1.6rem] border border-stone-200 bg-white/80 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white"
            >
              <div className="text-sm font-bold text-stone-900">계획 다시 세우기</div>
              <div className="mt-1 text-sm text-stone-500">총 학습 일수와 하루 루틴을 다시 정합니다.</div>
            </button>
            <button
              onClick={() => void resetCurrentUser()}
              disabled={resetting}
              className="rounded-[1.6rem] border border-red-200 bg-red-50/70 px-4 py-4 text-left text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              <div className="text-sm font-bold">초기화</div>
              <div className="mt-1 text-sm text-red-500">
                프로필, 계획, 오늘 진도까지 모두 초기 상태로 되돌립니다.
              </div>
            </button>
          </div>
        </section>
      )}

      {showProfileSetup && (
        <section className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,252,246,0.95)] p-6 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Step 1
            </p>
            <h2 className="font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
              {USER_LABELS[userId]} 프로필 설정
            </h2>
            <p className="text-sm text-stone-500">
              이 단계는 처음 한 번만 필요합니다. 사용자는 이미 {USER_LABELS[userId]}로 고정되어 있고, 목표 레벨만 정하면 학습 일수에 맞춰 하루 루틴은 다음 단계에서 자동으로 잡힙니다.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.7rem] border border-stone-200 bg-[linear-gradient(135deg,#fffdf7,#f3ece1)] px-4 py-4">
              <div className="text-sm font-semibold text-stone-700">지정된 사용자</div>
              <div className="mt-2 text-xl font-black text-stone-900">{USER_LABELS[userId]}</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">목표 레벨</label>
              <div className="grid grid-cols-3 gap-2">
                {(["N5", "N4", "N3"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormLevel(level)}
                    className={`rounded-[1.5rem] px-4 py-3 text-sm font-bold transition ${
                      formLevel === level
                        ? "bg-[linear-gradient(135deg,#31473a,#c96f43)] text-white shadow-[0_10px_30px_rgba(70,54,36,0.16)]"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50/80 px-4 py-4 text-sm text-stone-600">
              저장 후 다음 단계에서 학습 일수를 조절하면 단어 암기, 어휘, 문법, 독해 목표가 자동으로 계산됩니다.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void saveProfile()}
                className="flex-1 rounded-[1.6rem] bg-[linear-gradient(135deg,#31473a,#c96f43)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(70,54,36,0.14)] transition hover:brightness-105"
              >
                저장하고 계속하기
              </button>
              {activeUser && (
                <button
                  onClick={() => setShowProfileSetup(false)}
                  className="rounded-[1.6rem] bg-stone-100 px-4 py-3 text-sm font-bold text-stone-600"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {!showProfileSetup && showPlanSetup && activeUser && (
        <section className="rounded-[2rem] border border-stone-200/80 bg-[rgba(255,252,246,0.95)] p-6 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Step 2
            </p>
            <h2 className="font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
              {USER_LABELS[userId]} 학습 계획
            </h2>
            <p className="text-sm text-stone-500">
              학습 일수만 정하면 하루 목표는 자동으로 맞춰집니다. 슬라이더를 움직이면 루틴 강도가 바로 바뀝니다.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <label className="rounded-[1.7rem] border border-stone-200 bg-[linear-gradient(135deg,#fffef9,#f3ece1)] px-4 py-4 md:col-span-2">
              <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
                <span>완주 기간</span>
                <span>{planDays}일</span>
              </div>
              <input
                type="range"
                min={30}
                max={180}
                step={5}
                value={planDays}
                onChange={(event) => setPlanDays(Number(event.target.value))}
                className="mt-3 w-full"
              />
            </label>

            {(
              Object.entries(TARGET_RANGES) as Array<
                [keyof Omit<StudyPlanDraft, "totalDays">, TargetRange]
              >
            ).map(([key, range]) => {
              const value = derivedPlanTargets[key];
              const progress = getTargetProgress(value, range);

              return (
                <div
                  key={key}
                  className="rounded-[1.6rem] border border-stone-200 bg-stone-50/85 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
                    <span>{range.label}</span>
                    <span className="text-base font-black text-stone-900">
                      {value}
                      {range.suffix}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#7c3aed,#f59e0b)] transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                    <span>느긋한 페이스 {range.min}{range.suffix}</span>
                    <span>빠른 페이스 {range.max}{range.suffix}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[1.7rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(240,251,244,0.96),rgba(255,247,232,0.92))] px-4 py-4 text-sm text-stone-800">
            <div className="font-bold">자동 추천 루틴</div>
            <div className="mt-1 text-stone-600">
              {planDays}일 완주 기준으로 하루에 단어 암기 {derivedPlanTargets.dailyFlashcard}장,
              어휘 {derivedPlanTargets.dailyVocabulary}개, 문법 {derivedPlanTargets.dailyGrammar}개,
              독해 {derivedPlanTargets.dailyReading}개를 진행합니다.
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => void savePlan()}
              className="flex-1 rounded-[1.6rem] bg-[linear-gradient(135deg,#31473a,#c96f43)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(70,54,36,0.14)] transition hover:brightness-105"
            >
              계획 저장하고 시작하기
            </button>
            {activePlan && (
              <button
                onClick={() => setShowPlanSetup(false)}
                className="rounded-[1.6rem] bg-stone-100 px-4 py-3 text-sm font-bold text-stone-600"
              >
                취소
              </button>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
