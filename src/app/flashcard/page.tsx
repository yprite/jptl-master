"use client";

import { useEffect, useEffectEvent, useState } from "react";
import {
  buildFlashcardId,
  clearFlashcardPriority,
  getFlashcardSrsState,
  saveFlashcardSrsState,
  type FlashcardReviewRecord,
  type FlashcardSrsState,
} from "@/lib/flashcard-srs-store";
import {
  calculateNextReview,
  formatReviewInterval,
  type Difficulty,
} from "@/lib/spaced-repetition";
import UserSelectionNotice from "@/components/user-selection-notice";
import type { StudyFlashcard } from "@/lib/study-data-types";
import { useAutoCompleteQuest } from "@/lib/use-auto-complete-quest";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

interface FlashcardWithId extends StudyFlashcard {
  cardId: string;
  sourceIndex: number;
}

const EMPTY_FLASHCARDS: StudyFlashcard[] = [];
const EMPTY_SRS_STATE: FlashcardSrsState = {
  updatedAt: "",
  reviews: {},
  priorities: {},
};

function endOfLocalDay(nowMs: number): number {
  const date = new Date(nowMs);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function parseTimestamp(iso: string | null | undefined): number {
  if (!iso) return Number.NaN;
  return Date.parse(iso);
}

function isResolvedForToday(
  review: FlashcardReviewRecord | null | undefined,
  nowMs: number
): boolean {
  const nextReviewAt = parseTimestamp(review?.nextReviewAt);
  return !Number.isNaN(nextReviewAt) && nextReviewAt > endOfLocalDay(nowMs);
}

function isDueNow(review: FlashcardReviewRecord | null | undefined, nowMs: number): boolean {
  if (!review) return true;

  const nextReviewAt = parseTimestamp(review.nextReviewAt);
  return Number.isNaN(nextReviewAt) || nextReviewAt <= nowMs;
}

function isWaitingLaterToday(
  review: FlashcardReviewRecord | null | undefined,
  nowMs: number
): boolean {
  const nextReviewAt = parseTimestamp(review?.nextReviewAt);
  return (
    !Number.isNaN(nextReviewAt) &&
    nextReviewAt > nowMs &&
    nextReviewAt <= endOfLocalDay(nowMs)
  );
}

function formatNextReviewLabel(iso: string | null): string | null {
  if (!iso) return null;

  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return null;

  const diffMs = timestamp - Date.now();
  if (diffMs <= 0) return "지금";

  const diffMinutes = Math.ceil(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 뒤`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 뒤`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays}일 뒤`;
}

function buildCardMap(cards: FlashcardWithId[]): Record<string, FlashcardWithId> {
  return Object.fromEntries(cards.map((card) => [card.cardId, card]));
}

function sortSessionCandidates(
  cards: FlashcardWithId[],
  reviews: Record<string, FlashcardReviewRecord>,
  priorities: FlashcardSrsState["priorities"],
  nowMs: number
): FlashcardWithId[] {
  const candidates = cards.filter((card) => {
    const review = reviews[card.cardId];
    if (!review) {
      return true;
    }

    return !isResolvedForToday(review, nowMs);
  });

  candidates.sort((left, right) => {
    const leftPriority = Boolean(priorities[left.cardId]);
    const rightPriority = Boolean(priorities[right.cardId]);
    if (leftPriority !== rightPriority) {
      return leftPriority ? -1 : 1;
    }

    const leftReview = reviews[left.cardId];
    const rightReview = reviews[right.cardId];
    if (Boolean(leftReview) !== Boolean(rightReview)) {
      return leftReview ? -1 : 1;
    }

    const leftTime = parseTimestamp(leftReview?.nextReviewAt);
    const rightTime = parseTimestamp(rightReview?.nextReviewAt);
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.sourceIndex - right.sourceIndex;
  });

  return candidates;
}

function buildSessionCardIds(
  cards: FlashcardWithId[],
  reviews: Record<string, FlashcardReviewRecord>,
  priorities: FlashcardSrsState["priorities"],
  dailyLimit: number,
  nowMs: number
): string[] {
  const candidates = sortSessionCandidates(cards, reviews, priorities, nowMs);
  const priorityCards = candidates.filter((card) => Boolean(priorities[card.cardId]));
  const selected: string[] = priorityCards.map((card) => card.cardId);
  const selectedIds = new Set(selected);

  for (const card of candidates) {
    if (selectedIds.has(card.cardId)) {
      continue;
    }

    if (selectedIds.size >= dailyLimit) {
      break;
    }

    selectedIds.add(card.cardId);
    selected.push(card.cardId);
  }

  return selected;
}

function getDueNowQueue(
  cards: FlashcardWithId[],
  reviews: Record<string, FlashcardReviewRecord>,
  priorities: FlashcardSrsState["priorities"],
  nowMs: number
): FlashcardWithId[] {
  const queue = cards.filter((card) => isDueNow(reviews[card.cardId], nowMs));

  queue.sort((left, right) => {
    const leftPriority = Boolean(priorities[left.cardId]);
    const rightPriority = Boolean(priorities[right.cardId]);
    if (leftPriority !== rightPriority) {
      return leftPriority ? -1 : 1;
    }

    const leftReview = reviews[left.cardId];
    const rightReview = reviews[right.cardId];
    if (Boolean(leftReview) !== Boolean(rightReview)) {
      return leftReview ? -1 : 1;
    }

    const leftTime = parseTimestamp(leftReview?.nextReviewAt);
    const rightTime = parseTimestamp(rightReview?.nextReviewAt);
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.sourceIndex - right.sourceIndex;
  });

  return queue;
}

function getEarliestFutureReview(
  cards: FlashcardWithId[],
  reviews: Record<string, FlashcardReviewRecord>,
  nowMs: number
): string | null {
  let earliest: number | null = null;

  for (const card of cards) {
    const review = reviews[card.cardId];
    if (!isWaitingLaterToday(review, nowMs)) {
      continue;
    }

    const nextReviewAt = parseTimestamp(review?.nextReviewAt);
    if (Number.isNaN(nextReviewAt)) {
      continue;
    }

    if (earliest === null || nextReviewAt < earliest) {
      earliest = nextReviewAt;
    }
  }

  return earliest ? new Date(earliest).toISOString() : null;
}

export default function FlashcardPage() {
  const {
    isLoading: isProfileLoading,
    supportedLevel,
    userId,
    userLabel,
    requiresSelection,
    plan,
    currentDay,
  } = useActiveStudyProfile();
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ attempts: 0, correct: 0 });
  const [clock, setClock] = useState(() => Date.now());
  const [srsState, setSrsState] = useState<FlashcardSrsState>(EMPTY_SRS_STATE);
  const [isSrsLoading, setIsSrsLoading] = useState(() => Boolean(userId));
  const [srsError, setSrsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);
  const { data: vocabs, error, isLoading: isStudyLoading } = useStudyData<
    StudyFlashcard[]
  >(
    isProfileLoading ? null : `flashcards-${supportedLevel}.json`,
    EMPTY_FLASHCARDS
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(Date.now());
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isProfileLoading || !userId) {
      return;
    }

    const selectedUserId = userId;
    let cancelled = false;

    async function loadSrs() {
      setIsSrsLoading(true);
      setSrsError(null);

      try {
        const state = await getFlashcardSrsState(selectedUserId, supportedLevel);
        if (!cancelled) {
          setSrsState(state);
          setIsSrsLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSrsState(EMPTY_SRS_STATE);
          setSrsError(
            loadError instanceof Error
              ? loadError.message
              : "복습 상태를 불러오지 못했습니다."
          );
          setIsSrsLoading(false);
        }
      }
    }

    void loadSrs();

    return () => {
      cancelled = true;
    };
  }, [isProfileLoading, supportedLevel, userId]);

  const cards: FlashcardWithId[] = vocabs.map((card, index) => ({
    ...card,
    cardId: buildFlashcardId(card, index),
    sourceIndex: index,
  }));
  const cardMap = buildCardMap(cards);
  const reviews = srsState.reviews;
  const priorities = srsState.priorities;
  const dailyCardLimit = Math.min(plan?.dailyFlashcard ?? cards.length, cards.length);
  const todayKey = new Date(clock).toLocaleDateString("ko-KR");
  const priorityKey = Object.keys(priorities).sort().join("|");
  const resetSession = useEffectEvent(() => {
    setSessionCardIds(
      buildSessionCardIds(cards, reviews, priorities, dailyCardLimit || cards.length, clock)
    );
    setFlipped(false);
    setStats({ attempts: 0, correct: 0 });
  });

  useEffect(() => {
    if (isProfileLoading || isStudyLoading || isSrsLoading || !userId) {
      return;
    }

    resetSession();
  }, [
    isProfileLoading,
    isStudyLoading,
    isSrsLoading,
    userId,
    supportedLevel,
    dailyCardLimit,
    priorityKey,
    todayKey,
  ]);

  const sessionCards = sessionCardIds
    .map((cardId) => cardMap[cardId])
    .filter((card): card is FlashcardWithId => Boolean(card));
  const sessionTargetCount = sessionCards.length;
  const completedCardCount = sessionCards.filter((card) =>
    isResolvedForToday(reviews[card.cardId], clock)
  ).length;
  const sessionRemainingCount = Math.max(sessionTargetCount - completedCardCount, 0);
  const sessionQueue = getDueNowQueue(sessionCards, reviews, priorities, clock);
  const current = sessionQueue[0] ?? null;
  const currentReview = current ? reviews[current.cardId] : null;
  const currentPriority = current ? priorities[current.cardId] : null;
  const nextScheduledReview = formatNextReviewLabel(
    getEarliestFutureReview(sessionCards, reviews, clock)
  );
  const dueReviewCount = sessionCards.filter((card) => Boolean(reviews[card.cardId])).length;
  const newCardCount = sessionCards.filter((card) => !reviews[card.cardId]).length;
  const reviewedCardCount = Object.keys(reviews).length;
  const waitingLaterCount = sessionCards.filter((card) =>
    isWaitingLaterToday(reviews[card.cardId], clock)
  ).length;
  const isSessionComplete = sessionTargetCount > 0 && completedCardCount >= sessionTargetCount;
  const isWaitingForRepeat = !current && !isSessionComplete && waitingLaterCount > 0;
  const sessionAccuracy =
    stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
  const sessionProgressPercent =
    sessionTargetCount > 0
      ? Math.min(100, Math.round((completedCardCount / sessionTargetCount) * 100))
      : 0;
  const summaryItems = [
    {
      label: "세션",
      value: `${completedCardCount}/${sessionTargetCount}장`,
      detail: `시도 ${stats.attempts}회`,
    },
    {
      label: "오늘 복습",
      value: `${dueReviewCount}장`,
      detail: waitingLaterCount > 0 ? `같은 날 재등장 ${waitingLaterCount}장` : "오늘 처리할 카드",
    },
    {
      label: "새 카드",
      value: `${newCardCount}장`,
      detail: Object.keys(priorities).length > 0 ? `우선 복습 ${Object.keys(priorities).length}장` : "이번 세션 기준",
    },
    {
      label: "누적 학습",
      value: `${reviewedCardCount}/${cards.length}장`,
      detail: `정답률 ${sessionAccuracy}%`,
    },
  ];

  useAutoCompleteQuest({
    enabled: isSessionComplete,
    quest: "flashcard",
    userId,
  });

  useEffect(() => {
    setFlipped(false);
  }, [current?.cardId]);

  const previewInterval = (difficulty: Difficulty) =>
    formatReviewInterval(
      calculateNextReview(
        currentReview?.easeFactor ?? 2.5,
        currentReview?.intervalDays ?? 0,
        currentReview?.repetitions ?? 0,
        difficulty
      ).intervalDays
    );

  async function handleDifficulty(difficulty: Difficulty) {
    if (!current || isSaving || !userId) {
      return;
    }

    const result = calculateNextReview(
      currentReview?.easeFactor ?? 2.5,
      currentReview?.intervalDays ?? 0,
      currentReview?.repetitions ?? 0,
      difficulty
    );
    const reviewedAt = new Date().toISOString();
    const nextReviewAt = result.nextReview.toISOString();
    const staysInTodayQueue = parseTimestamp(nextReviewAt) <= endOfLocalDay(Date.now());

    let nextState: FlashcardSrsState = {
      updatedAt: reviewedAt,
      reviews: {
        ...reviews,
        [current.cardId]: {
          cardId: current.cardId,
          easeFactor: result.easeFactor,
          intervalDays: result.intervalDays,
          repetitions: result.repetitions,
          nextReviewAt,
          lastReviewedAt: reviewedAt,
          lastDifficulty: difficulty,
          reviewCount: (currentReview?.reviewCount ?? 0) + 1,
        },
      },
      priorities: { ...priorities },
    };

    if (currentPriority && !staysInTodayQueue) {
      nextState = clearFlashcardPriority(nextState, current.cardId);
    }

    setSrsState(nextState);
    setSrsError(null);
    setStats((prev) => ({
      attempts: prev.attempts + 1,
      correct: difficulty !== "again" ? prev.correct + 1 : prev.correct,
    }));
    setFlipped(false);
    setClock(Date.now());
    setIsSaving(true);

    try {
      const persisted = await saveFlashcardSrsState(userId, supportedLevel, nextState);
      setSrsState(persisted);
    } catch (saveError) {
      setSrsError(
        saveError instanceof Error
          ? saveError.message
          : "복습 상태를 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
      setClock(Date.now());
    }
  }

  if (isProfileLoading || isStudyLoading || isSrsLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  if (requiresSelection || !userId || !userLabel) {
    return <UserSelectionNotice />;
  }

  const errorMessage = srsError ?? error;
  const sessionDescription = plan
    ? `${userLabel}의 ${currentDay}일차 분량 ${sessionTargetCount || dailyCardLimit}장을 복습 순서대로 이어갑니다. 오늘 안에 다시 나와야 하는 카드는 사라지지 않고 다시 등장합니다.`
    : `${userLabel}의 현재 레벨 카드를 복습 순서대로 이어갑니다. 오늘 안에 다시 나와야 하는 카드는 대기 후 다시 나타납니다.`;
  const headerBadges = [
    {
      label: `현재 사용자 ${userLabel}`,
      className: "bg-stone-900 text-white",
    },
    {
      label: `설정 레벨 ${supportedLevel}`,
      className: "bg-white text-stone-700",
    },
    ...(plan
      ? [
          {
            label: `${currentDay}일차`,
            className: "bg-emerald-100 text-emerald-700",
          },
          {
            label: `오늘 묶음 ${sessionTargetCount || dailyCardLimit}장`,
            className: "bg-amber-100 text-amber-700",
          },
        ]
      : []),
    ...(Object.keys(priorities).length > 0
      ? [
          {
            label: `우선 복습 ${Object.keys(priorities).length}장`,
            className: "bg-rose-100 text-rose-700",
          },
        ]
      : []),
  ];
  const headerSection = (
    <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,251,245,0.98),rgba(245,236,222,0.98))] p-5 shadow-[0_22px_60px_rgba(97,74,45,0.08)]">
      <div className="absolute -left-10 top-4 h-32 w-32 rounded-full bg-[rgba(255,216,154,0.24)] blur-3xl" />
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(153,191,163,0.18)] blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              단어 복습 세션
            </p>
            <h1 className="font-[family:var(--font-noto-serif-kr)] text-3xl font-semibold text-stone-900">
              단어 학습
            </h1>
            <p className="text-sm leading-7 text-stone-600">{sessionDescription}</p>
          </div>

          <div className="min-w-[8.8rem] rounded-[1.5rem] border border-white/70 bg-white/82 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              오늘 진행
            </div>
            <div className="mt-1 text-2xl font-black text-stone-900">
              {completedCardCount}/{sessionTargetCount}
            </div>
            <div className="mt-1 text-xs text-stone-500">완료율 {sessionProgressPercent}%</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {headerBadges.map((badge) => (
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
              <div
                key={item.label}
                className="rounded-[1.15rem] bg-stone-50/80 px-3 py-3"
              >
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
              style={{ width: `${sessionProgressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );

  if (!cards.length) {
    return (
      <div className="space-y-4">
        {headerSection}
        {errorMessage && (
          <p className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        <p className="rounded-[1.8rem] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center text-stone-500">
          {supportedLevel} 단어 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {headerSection}

      {errorMessage && (
        <p className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {errorMessage}
        </p>
      )}

      {!current ? (
        <div className="rounded-[1.8rem] border border-dashed border-stone-300 bg-white/72 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-stone-900">
            {isSessionComplete
              ? "오늘 단어 분량을 모두 학습했습니다."
              : isWaitingForRepeat
                ? "조금 뒤에 다시 나올 카드가 있습니다."
                : "지금 바로 열 카드가 없습니다."}
          </p>
          <p className="mt-3 text-sm text-stone-600">
            {isSessionComplete
              ? `${currentDay}일차 목표 ${sessionTargetCount}장을 마쳤습니다.`
              : nextScheduledReview
                ? `다음 카드는 ${nextScheduledReview} 다시 나타납니다.`
                : "현재 레벨에서 오늘 안에 다시 볼 카드가 없습니다."}
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-stone-700 shadow-sm">
              남은 카드 {sessionRemainingCount}장
            </span>
            <span
              className={`rounded-full px-3 py-1 font-medium ${
                currentPriority
                  ? "bg-rose-100 text-rose-700"
                  : currentReview
                    ? "bg-sky-100 text-sky-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {currentPriority
                ? "독해에서 올린 우선 카드"
                : currentReview
                  ? "복습 카드"
                  : "새 카드"}
            </span>
            {currentReview?.nextReviewAt && (
              <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">
                직전 예약 간격 {formatReviewInterval(currentReview.intervalDays)}
              </span>
            )}
            {nextScheduledReview && (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                다음 대기 {nextScheduledReview}
              </span>
            )}
          </div>

          <div
            className="flashcard cursor-pointer [touch-action:manipulation]"
            onClick={() => setFlipped((prev) => !prev)}
          >
            <div
              className={`flashcard-inner relative w-full min-h-[21rem] sm:min-h-[26rem] ${
                flipped ? "flipped" : ""
              }`}
            >
              <div className="flashcard-front absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,241,232,0.96))] p-8 text-center shadow-[0_24px_60px_rgba(92,71,47,0.12)]">
                <p className="mb-4 text-5xl font-bold text-stone-900 sm:text-6xl">{current.word}</p>
                {current.reading && (
                  <p className="text-lg text-stone-400 sm:text-xl">{current.reading}</p>
                )}
                <p className="mt-6 text-sm text-stone-400">탭하여 뜻 확인</p>
              </div>

              <div className="flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,250,246,0.98),rgba(244,234,222,0.98))] p-8 text-center shadow-[0_24px_60px_rgba(92,71,47,0.12)]">
                <p className="mb-2 text-3xl font-bold text-stone-900">{current.word}</p>
                {current.reading && (
                  <p className="mb-4 text-lg text-stone-400">{current.reading}</p>
                )}
                <p className="mb-4 text-2xl font-semibold text-sky-700">
                  {current.meaning}
                </p>
                {(current.example_jp || current.example) && (
                  <div className="w-full max-w-xl space-y-1 rounded-[1.1rem] border border-stone-200 bg-white/72 px-4 py-3 text-sm">
                    <p className="font-medium text-stone-900">
                      {current.example_jp ?? current.example}
                    </p>
                    {current.example_reading && (
                      <p className="text-xs text-stone-500">
                        {current.example_reading}
                      </p>
                    )}
                    {current.example_kr && (
                      <p className="text-sm text-sky-700">
                        {current.example_kr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!flipped && (
            <div className="rounded-[1.4rem] border border-dashed border-stone-200 bg-white/72 px-4 py-3 text-sm text-stone-500">
              카드를 눌러 뜻을 확인한 뒤 난도를 선택합니다.
            </div>
          )}

          {flipped && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                onClick={() => void handleDifficulty("again")}
                disabled={isSaving}
                className="rounded-[1.1rem] bg-red-100 py-3 text-red-700 transition-colors hover:bg-red-200 disabled:opacity-60"
              >
                다시
                <span className="block text-xs opacity-70">{previewInterval("again")}</span>
              </button>
              <button
                onClick={() => void handleDifficulty("hard")}
                disabled={isSaving}
                className="rounded-[1.1rem] bg-orange-100 py-3 text-orange-700 transition-colors hover:bg-orange-200 disabled:opacity-60"
              >
                어려움
                <span className="block text-xs opacity-70">{previewInterval("hard")}</span>
              </button>
              <button
                onClick={() => void handleDifficulty("good")}
                disabled={isSaving}
                className="rounded-[1.1rem] bg-green-100 py-3 text-green-700 transition-colors hover:bg-green-200 disabled:opacity-60"
              >
                보통
                <span className="block text-xs opacity-70">{previewInterval("good")}</span>
              </button>
              <button
                onClick={() => void handleDifficulty("easy")}
                disabled={isSaving}
                className="rounded-[1.1rem] bg-blue-100 py-3 text-blue-700 transition-colors hover:bg-blue-200 disabled:opacity-60"
              >
                쉬움
                <span className="block text-xs opacity-70">{previewInterval("easy")}</span>
              </button>
            </div>
          )}

          {isSaving && (
            <p className="text-center text-sm text-stone-500">
              복습 상태를 저장하는 중입니다.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
