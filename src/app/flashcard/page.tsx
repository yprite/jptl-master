"use client";

import { useState, useCallback } from "react";
import { sampleVocabularies } from "@/lib/sample-data";
import {
  calculateNextReview,
  type Difficulty,
} from "@/lib/spaced-repetition";

type Level = "N4" | "N3";

interface CardState {
  vocabIndex: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export default function FlashcardPage() {
  const [level, setLevel] = useState<Level>("N4");
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 });
  const [cardStates, setCardStates] = useState<Map<number, CardState>>(
    new Map()
  );

  const vocabs = sampleVocabularies.filter((v) => v.level === level);
  const current = vocabs[currentIndex];

  const handleDifficulty = useCallback(
    (difficulty: Difficulty) => {
      const state = cardStates.get(currentIndex) || {
        vocabIndex: currentIndex,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      const result = calculateNextReview(
        state.easeFactor,
        state.interval,
        state.repetitions,
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
    },
    [currentIndex, cardStates, vocabs.length]
  );

  if (!current) {
    return (
      <p className="text-center text-gray-500">
        해당 레벨의 단어가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어 학습</h1>
        <div className="flex gap-2">
          {(["N4", "N3"] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                setCurrentIndex(0);
                setFlipped(false);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                level === l
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

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
            <p className="text-xl text-gray-400">{current.reading}</p>
            <p className="mt-6 text-sm text-gray-400">
              탭하여 뜻 확인
            </p>
          </div>

          {/* Back */}
          <div className="flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
            <p className="text-3xl font-bold mb-2">{current.word}</p>
            <p className="text-lg text-gray-400 mb-4">{current.reading}</p>
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
            <span className="block text-xs opacity-70">1일</span>
          </button>
          <button
            onClick={() => handleDifficulty("hard")}
            className="py-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
          >
            어려움
            <span className="block text-xs opacity-70">~3일</span>
          </button>
          <button
            onClick={() => handleDifficulty("good")}
            className="py-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            보통
            <span className="block text-xs opacity-70">~7일</span>
          </button>
          <button
            onClick={() => handleDifficulty("easy")}
            className="py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            쉬움
            <span className="block text-xs opacity-70">~14일</span>
          </button>
        </div>
      )}
    </div>
  );
}
