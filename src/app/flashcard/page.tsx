"use client";

import { useEffect, useState } from "react";
import {
  buildFlashcardId,
  getFlashcardSrsState,
  saveFlashcardSrsState,
  type FlashcardReviewRecord,
  type FlashcardSrsUserId,
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
};

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

function getReviewQueue(
  cards: FlashcardWithId[],
  reviews: Record<string, FlashcardReviewRecord>,
  nowMs: number
): FlashcardWithId[] {
  const queue = cards.filter((card) => {
    const review = reviews[card.cardId];
    if (!review) {
      return true;
    }

    const nextReviewAt = Date.parse(review.nextReviewAt);
    return Number.isNaN(nextReviewAt) || nextReviewAt <= nowMs;
  });

  queue.sort((left, right) => {
    const leftReview = reviews[left.cardId];
    const rightReview = reviews[right.cardId];

    if (leftReview && !rightReview) return -1;
    if (!leftReview && rightReview) return 1;
    if (!leftReview && !rightReview) return left.sourceIndex - right.sourceIndex;

    const leftTime = Date.parse(leftReview.nextReviewAt);
    const rightTime = Date.parse(rightReview.nextReviewAt);
    if (leftTime !== rightTime) {
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
    if (!review) continue;

    const nextReviewAt = Date.parse(review.nextReviewAt);
    if (Number.isNaN(nextReviewAt) || nextReviewAt <= nowMs) {
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
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 });
  const [clock, setClock] = useState(() => Date.now());
  const [srsState, setSrsState] = useState<FlashcardSrsState>(EMPTY_SRS_STATE);
  const [isSrsLoading, setIsSrsLoading] = useState(() => Boolean(userId));
  const [srsError, setSrsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
    const selectedUserId: FlashcardSrsUserId = userId;

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
              : "SRS 상태를 불러오지 못했습니다."
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

  useEffect(() => {
    setFlipped(false);
    setStats({ reviewed: 0, correct: 0 });
  }, [supportedLevel, userId]);

  const cards: FlashcardWithId[] = vocabs.map((card, index) => ({
    ...card,
    cardId: buildFlashcardId(card, index),
    sourceIndex: index,
  }));

  const reviews = srsState.reviews;
  const queue = getReviewQueue(cards, reviews, clock);
  const dailyCardLimit = Math.min(plan?.dailyFlashcard ?? cards.length, cards.length);
  const sessionRemainingCount = Math.max(dailyCardLimit - stats.reviewed, 0);
  const sessionQueue = sessionRemainingCount > 0 ? queue.slice(0, sessionRemainingCount) : [];
  const current = sessionQueue[0];
  const currentReview = current ? reviews[current.cardId] : null;
  const nextScheduledReview = formatNextReviewLabel(
    getEarliestFutureReview(cards, reviews, clock)
  );
  const dueReviewCount = sessionQueue.filter((card) => Boolean(reviews[card.cardId])).length;
  const newCardCount = sessionQueue.filter((card) => !reviews[card.cardId]).length;
  const reviewedCardCount = Object.keys(reviews).length;
  const isSessionComplete = dailyCardLimit > 0 && stats.reviewed >= dailyCardLimit;
  const sessionAccuracy =
    stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;
  const sessionCardTarget = dailyCardLimit || cards.length;
  const sessionProgressPercent =
    sessionCardTarget > 0 ? Math.min(100, Math.round((stats.reviewed / sessionCardTarget) * 100)) : 0;
  const summaryItems = [
    {
      label: "세션",
      value: `${stats.reviewed}/${sessionCardTarget}장`,
      detail: `정답률 ${sessionAccuracy}%`,
    },
    {
      label: "복습 대기",
      value: `${dueReviewCount}장`,
      detail: "오늘 처리할 복습",
    },
    {
      label: "새 카드",
      value: `${newCardCount}장`,
      detail: "이번 세션 기준",
    },
    {
      label: "누적 학습",
      value: `${reviewedCardCount}/${cards.length}장`,
      detail: "전체 카드 기준",
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

    const nextState: FlashcardSrsState = {
      updatedAt: reviewedAt,
      reviews: {
        ...reviews,
        [current.cardId]: {
          cardId: current.cardId,
          easeFactor: result.easeFactor,
          intervalDays: result.intervalDays,
          repetitions: result.repetitions,
          nextReviewAt: result.nextReview.toISOString(),
          lastReviewedAt: reviewedAt,
          lastDifficulty: difficulty,
          reviewCount: (currentReview?.reviewCount ?? 0) + 1,
        },
      },
    };

    setSrsState(nextState);
    setSrsError(null);
    setStats((prev) => ({
      reviewed: prev.reviewed + 1,
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
          : "SRS 상태를 저장하지 못했습니다."
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
    ? `${userLabel}의 Day ${currentDay} 분량 ${sessionCardTarget}장을 SRS 순서대로 이어갑니다. 카드를 먼저 보고, 뒤집은 다음 난도를 선택합니다.`
    : `${userLabel}의 현재 레벨 카드를 SRS 순서대로 이어갑니다. 카드를 먼저 보고, 뒤집은 다음 난도를 선택합니다.`;
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
            label: `Day ${currentDay}`,
            className: "bg-emerald-100 text-emerald-700",
          },
          {
            label: `오늘 분량 ${sessionCardTarget}장`,
            className: "bg-amber-100 text-amber-700",
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
              Flashcard Session
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
              {stats.reviewed}/{sessionCardTarget}
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
            {isSessionComplete ? "오늘 단어 분량을 모두 학습했습니다." : "지금 복습할 카드가 없습니다."}
          </p>
          <p className="mt-3 text-sm text-stone-600">
            {isSessionComplete
              ? `Day ${currentDay} 목표 ${dailyCardLimit}장을 마쳤습니다.`
              : nextScheduledReview
                ? `다음 복습은 ${nextScheduledReview} 예정입니다.`
                : "현재 레벨의 카드 복습이 모두 끝났습니다."}
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-stone-700 shadow-sm">
              남은 카드 {sessionRemainingCount}장
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
              {currentReview ? "복습 카드" : "새 카드"}
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
