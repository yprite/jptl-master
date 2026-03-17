"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  type DailyQuests,
  type HomeState,
  type StudyPlan,
  type StudyPlanDraft,
  type UserId,
  completeDailyQuest,
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

function getLeader(states: Record<UserId, HomeState>): UserId | null {
  const score = (state: HomeState) => state.progress.totalDays * 10 + getCompletedCount(state.quests);
  const meScore = score(states.me);
  const wifeScore = score(states.wife);
  if (meScore === wifeScore) return null;
  return meScore > wifeScore ? "me" : "wife";
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
  const activeQuests = activeState.quests;
  const activeProgress = activeState.progress;
  const leader = getLeader(states);

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

  const markComplete = async (quest: keyof DailyQuests) => {
    const updated = await completeDailyQuest(userId, quest);
    setStates((prev) => ({
      ...prev,
      [userId]: updated,
    }));
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

  const questDefs = activePlan
    ? [
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
      ]
    : [];

  const completedCount = getCompletedCount(activeQuests);
  const allDone = completedCount === questDefs.length && questDefs.length > 0;
  const currentQuestIdx = questDefs.findIndex((quest) => !activeQuests[quest.key]);
  const currentDay = getPlanDayNumber(activePlan);
  const planProgressPercent = activePlan
    ? Math.min(100, Math.round((activeProgress.totalDays / activePlan.totalDays) * 100))
    : 0;
  const derivedPlanTargets = deriveDailyTargets(planDays, activeUser?.level ?? formLevel);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.18),_transparent_35%),linear-gradient(135deg,_#111827,_#1f2937_55%,_#312e81)] p-6 text-white shadow-xl shadow-stone-300/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
              Daily Rivalry
            </p>
            <h1 className="text-3xl font-black tracking-tight">오늘의 학습 레이스</h1>
            <p className="text-sm text-white/70">
              프로필 설정은 한 번만, 이후엔 계획대로 하루 루틴만 진행합니다.
            </p>
          </div>
          {activeUser && (
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              설정
            </button>
          )}
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
                    ? "bg-white text-stone-900 shadow-lg"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {USER_LABELS[id]}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {USER_IDS.map((id) => {
            const state = states[id];
            const completed = getCompletedCount(state.quests);
            const isLeader = leader === id;

            return (
              <div
                key={id}
                className={`rounded-3xl border px-5 py-4 ${
                  id === userId
                    ? "border-white/40 bg-white/14"
                    : "border-white/10 bg-black/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                      지정 사용자
                    </p>
                    <p className="text-xl font-bold">{getDisplayName(id)}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {state.user ? `${completed}/4 완료` : "미설정"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="text-xs text-white/55">완주 일수</div>
                    <div className="mt-1 text-2xl font-black">{state.progress.totalDays}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="text-xs text-white/55">오늘 진행</div>
                    <div className="mt-1 text-2xl font-black">{completed}</div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-white/70">
                  {isLeader
                    ? "현재 선두입니다."
                    : leader === null
                    ? "현재 동률입니다."
                    : "조금만 더 하면 따라잡을 수 있습니다."}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {showSettings && activeUser && (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-stone-900">설정</h2>
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
              className="rounded-2xl border border-stone-200 px-4 py-4 text-left transition hover:border-stone-300 hover:bg-stone-50"
            >
              <div className="text-sm font-bold text-stone-900">프로필 수정</div>
              <div className="mt-1 text-sm text-stone-500">이름과 기본 목표량을 바꿉니다.</div>
            </button>
            <button
              onClick={openPlanEditor}
              className="rounded-2xl border border-stone-200 px-4 py-4 text-left transition hover:border-stone-300 hover:bg-stone-50"
            >
              <div className="text-sm font-bold text-stone-900">계획 다시 세우기</div>
              <div className="mt-1 text-sm text-stone-500">총 학습 일수와 하루 루틴을 다시 정합니다.</div>
            </button>
            <button
              onClick={() => void resetCurrentUser()}
              disabled={resetting}
              className="rounded-2xl border border-red-200 px-4 py-4 text-left text-red-700 transition hover:bg-red-50 disabled:opacity-50"
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
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Step 1
            </p>
            <h2 className="text-2xl font-black text-stone-900">{USER_LABELS[userId]} 프로필 설정</h2>
            <p className="text-sm text-stone-500">
              이 단계는 처음 한 번만 필요합니다. 사용자는 이미 {USER_LABELS[userId]}로 고정되어 있고, 목표 레벨만 정하면 학습 일수에 맞춰 하루 루틴은 다음 단계에서 자동으로 잡힙니다.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
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
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      formLevel === level
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
              저장 후 다음 단계에서 학습 일수를 조절하면 단어 암기, 어휘, 문법, 독해 목표가 자동으로 계산됩니다.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void saveProfile()}
                className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
              >
                저장하고 계속하기
              </button>
              {activeUser && (
                <button
                  onClick={() => setShowProfileSetup(false)}
                  className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-600"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {!showProfileSetup && showPlanSetup && activeUser && (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Step 2
            </p>
            <h2 className="text-2xl font-black text-stone-900">{USER_LABELS[userId]} 학습 계획</h2>
            <p className="text-sm text-stone-500">
              학습 일수만 정하면 하루 목표는 자동으로 맞춰집니다. 슬라이더를 움직이면 루틴 강도가 바로 바뀝니다.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <label className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 md:col-span-2">
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
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
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

          <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-900">
            <div className="font-bold">자동 추천 루틴</div>
            <div className="mt-1 text-violet-700">
              {planDays}일 완주 기준으로 하루에 단어 암기 {derivedPlanTargets.dailyFlashcard}장,
              어휘 {derivedPlanTargets.dailyVocabulary}개, 문법 {derivedPlanTargets.dailyGrammar}개,
              독해 {derivedPlanTargets.dailyReading}개를 진행합니다.
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => void savePlan()}
              className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              계획 저장하고 시작하기
            </button>
            {activePlan && (
              <button
                onClick={() => setShowPlanSetup(false)}
                className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-600"
              >
                취소
              </button>
            )}
          </div>
        </section>
      )}

      {!showProfileSetup && !showPlanSetup && activeUser && activePlan && (
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
                  Step 3
                </p>
                <h2 className="mt-1 text-2xl font-black text-stone-900">
                  Day {currentDay} 루틴
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {getDisplayName(userId)}는 오늘{" "}
                  <span className="font-semibold text-stone-900">암기 → 어휘 → 문법 → 독해</span>{" "}
                  순서로 진행합니다.
                </p>
              </div>
              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-right">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Challenge
                </div>
                <div className="mt-1 text-lg font-black text-stone-900">
                  {activeProgress.totalDays}/{activePlan.totalDays}일
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-stone-600">
                <span>누적 진행률</span>
                <span>{planProgressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#7c3aed)] transition-all"
                  style={{ width: `${planProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {questDefs.map((quest, index) => {
              const done = activeQuests[quest.key];
              const isCurrent = index === currentQuestIdx;
              const locked = !done && index > currentQuestIdx && currentQuestIdx >= 0;

              return (
                <div
                  key={quest.key}
                  className={`rounded-[1.75rem] border p-5 shadow-sm transition ${
                    done
                      ? "border-emerald-200 bg-emerald-50"
                      : isCurrent
                      ? "border-stone-300 bg-white"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white ${
                          done ? "from-emerald-500 to-green-600" : quest.accent
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-stone-900">{quest.title}</h3>
                        <p className="text-sm text-stone-500">{quest.desc}</p>
                      </div>
                    </div>

                    {done ? (
                      <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                        완료
                      </span>
                    ) : isCurrent ? (
                      <Link
                        href={quest.href}
                        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800"
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
          </div>

          {allDone ? (
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-500">
                Perfect Day
              </p>
              <h3 className="mt-2 text-3xl font-black text-emerald-700">오늘 루틴 완료</h3>
              <p className="mt-2 text-sm text-emerald-600">내일 Day {Math.min(activePlan.totalDays, currentDay + 1)}로 이어집니다.</p>
            </div>
          ) : currentQuestIdx >= 0 ? (
            <button
              onClick={() => void markComplete(questDefs[currentQuestIdx].key)}
              className="w-full rounded-[1.75rem] bg-stone-900 px-4 py-4 text-sm font-black text-white transition hover:bg-stone-800"
            >
              현재 단계 완료 체크
            </button>
          ) : null}
        </section>
      )}
    </div>
  );
}
