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

  if (!cards.length) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">단어 학습</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              현재 사용자 {userLabel}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
              설정 레벨 {supportedLevel}
            </span>
            {plan && (
              <>
                <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">
                  Day {currentDay}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                  오늘 분량 {dailyCardLimit}장
                </span>
              </>
            )}
          </div>
        </div>
        {errorMessage && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
          {supportedLevel} 단어 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어 학습</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            현재 사용자 {userLabel}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
            설정 레벨 {supportedLevel}
          </span>
          {plan && (
            <>
              <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">
                Day {currentDay}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                오늘 분량 {dailyCardLimit}장
              </span>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-3 text-sm md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            세션
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            {stats.reviewed}/{dailyCardLimit || cards.length}장 / 정답률{" "}
            {stats.reviewed > 0
              ? Math.round((stats.correct / stats.reviewed) * 100)
              : 0}
            %
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            복습 대기
          </p>
          <p className="mt-1 font-semibold text-gray-900">{dueReviewCount}장</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            새 카드
          </p>
          <p className="mt-1 font-semibold text-gray-900">{newCardCount}장</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            누적 학습
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            {reviewedCardCount}/{cards.length}장
          </p>
        </div>
      </div>

      {!current ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-gray-900">
            {isSessionComplete ? "오늘 단어 분량을 모두 학습했습니다." : "지금 복습할 카드가 없습니다."}
          </p>
          <p className="mt-3 text-sm text-gray-600">
            {isSessionComplete
              ? `Day ${currentDay} 목표 ${dailyCardLimit}장을 마쳤습니다.`
              : nextScheduledReview
                ? `다음 복습은 ${nextScheduledReview} 예정입니다.`
                : "현재 레벨의 카드 복습이 모두 끝났습니다."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>남은 카드 {sessionRemainingCount}장</span>
            <span>•</span>
            <span>{currentReview ? "복습 카드" : "새 카드"}</span>
            {currentReview?.nextReviewAt && (
              <>
                <span>•</span>
                <span>직전 예약 간격 {formatReviewInterval(currentReview.intervalDays)}</span>
              </>
            )}
          </div>

          <div
            className="flashcard cursor-pointer"
            onClick={() => setFlipped((prev) => !prev)}
          >
            <div
              className={`flashcard-inner relative w-full min-h-[280px] ${
                flipped ? "flipped" : ""
              }`}
            >
              <div className="flashcard-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8">
                <p className="text-5xl font-bold mb-4">{current.word}</p>
                {current.reading && (
                  <p className="text-xl text-gray-400">{current.reading}</p>
                )}
                <p className="mt-6 text-sm text-gray-400">탭하여 뜻 확인</p>
              </div>

              <div className="flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8">
                <p className="text-3xl font-bold mb-2">{current.word}</p>
                {current.reading && (
                  <p className="text-lg text-gray-400 mb-4">{current.reading}</p>
                )}
                <p className="text-2xl text-blue-600 font-semibold mb-4">
                  {current.meaning}
                </p>
                {(current.example_jp || current.example) && (
                  <div className="w-full text-sm bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 space-y-1">
                    <p className="text-gray-900 font-medium">
                      {current.example_jp ?? current.example}
                    </p>
                    {current.example_reading && (
                      <p className="text-gray-500 text-xs">
                        {current.example_reading}
                      </p>
                    )}
                    {current.example_kr && (
                      <p className="text-blue-700 text-sm">
                        {current.example_kr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => void handleDifficulty("again")}
                disabled={isSaving}
                className="py-3 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors disabled:opacity-60"
              >
                다시
                <span className="block text-xs opacity-70">{previewInterval("again")}</span>
              </button>
              <button
                onClick={() => void handleDifficulty("hard")}
                disabled={isSaving}
                className="py-3 rounded-xl bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors disabled:opacity-60"
              >
                어려움
                <span className="block text-xs opacity-70">{previewInterval("hard")}</span>
              </button>
              <button
                onClick={() => void handleDifficulty("good")}
                disabled={isSaving}
                className="py-3 rounded-xl bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors disabled:opacity-60"
              >
                보통
                <span className="block text-xs opacity-70">{previewInterval("good")}</span>
              </button>
              <button
                onClick={() => void handleDifficulty("easy")}
                disabled={isSaving}
                className="py-3 rounded-xl bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors disabled:opacity-60"
              >
                쉬움
                <span className="block text-xs opacity-70">{previewInterval("easy")}</span>
              </button>
            </div>
          )}

          {isSaving && (
            <p className="text-center text-sm text-gray-500">
              복습 상태를 저장하는 중입니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
