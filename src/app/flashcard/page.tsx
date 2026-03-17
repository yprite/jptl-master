"use client";

import { useState } from "react";
import {
  calculateNextReview,
  formatReviewInterval,
  type Difficulty,
} from "@/lib/spaced-repetition";
import type { StudyFlashcard } from "@/lib/study-data-types";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

interface CardState {
  vocabIndex: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

const EMPTY_FLASHCARDS: StudyFlashcard[] = [];

export default function FlashcardPage() {
  const { isLoading: isProfileLoading, supportedLevel, userLabel } =
    useActiveStudyProfile();
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 });
  const [cardStates, setCardStates] = useState<Map<number, CardState>>(
    new Map()
  );
  const { data: vocabs, error, isLoading: isStudyLoading } = useStudyData<
    StudyFlashcard[]
  >(
    isProfileLoading ? null : `flashcards-${supportedLevel}.json`,
    EMPTY_FLASHCARDS
  );

  const current = vocabs[currentIndex];
  const currentCardState = cardStates.get(currentIndex) || {
    vocabIndex: currentIndex,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  };

  const previewInterval = (difficulty: Difficulty) =>
    formatReviewInterval(
      calculateNextReview(
        currentCardState.easeFactor,
        currentCardState.interval,
        currentCardState.repetitions,
        difficulty
      ).intervalDays
    );

  function handleDifficulty(difficulty: Difficulty) {
    if (!current || vocabs.length === 0) {
      return;
    }

    const result = calculateNextReview(
      currentCardState.easeFactor,
      currentCardState.interval,
      currentCardState.repetitions,
      difficulty
    );

    setCardStates((prev) => {
      const next = new Map(prev);
      next.set(currentIndex, {
        vocabIndex: currentIndex,
        easeFactor: result.easeFactor,
        interval: result.intervalDays,
        repetitions: result.repetitions,
      });
      return next;
    });

    setStats((prev) => ({
      reviewed: prev.reviewed + 1,
      correct: difficulty !== "again" ? prev.correct + 1 : prev.correct,
    }));

    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % vocabs.length);
  }

  if (isProfileLoading || isStudyLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  if (!current) {
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
          </div>
        </div>
        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
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
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>
          학습: {stats.reviewed}장 | 정답률:{" "}
          {stats.reviewed > 0
            ? Math.round((stats.correct / stats.reviewed) * 100)
            : 0}
          %
        </span>
        <span>
          {currentIndex + 1} / {vocabs.length}
        </span>
        <span>초기 학습 단계는 분 단위로 진행됩니다.</span>
      </div>

      {/* Flashcard */}
      <div
        className="flashcard cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className={`flashcard-inner relative w-full min-h-[280px] ${
            flipped ? "flipped" : ""
          }`}
        >
          {/* Front */}
          <div className="flashcard-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
            <p className="text-5xl font-bold mb-4">{current.word}</p>
            {current.reading && (
              <p className="text-xl text-gray-400">{current.reading}</p>
            )}
            <p className="mt-6 text-sm text-gray-400">
              탭하여 뜻 확인
            </p>
          </div>

          {/* Back */}
          <div className="flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
            <p className="text-3xl font-bold mb-2">{current.word}</p>
            {current.reading && (
              <p className="text-lg text-gray-400 mb-4">{current.reading}</p>
            )}
            <p className="text-2xl text-blue-600 dark:text-blue-400 font-semibold mb-4">
              {current.meaning}
            </p>
            {current.example && (
              <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-2">
                {current.example}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleDifficulty("again")}
            className="py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            다시
            <span className="block text-xs opacity-70">{previewInterval("again")}</span>
          </button>
          <button
            onClick={() => handleDifficulty("hard")}
            className="py-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
          >
            어려움
            <span className="block text-xs opacity-70">{previewInterval("hard")}</span>
          </button>
          <button
            onClick={() => handleDifficulty("good")}
            className="py-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            보통
            <span className="block text-xs opacity-70">{previewInterval("good")}</span>
          </button>
          <button
            onClick={() => handleDifficulty("easy")}
            className="py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            쉬움
            <span className="block text-xs opacity-70">{previewInterval("easy")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
