"use client";

import { useState } from "react";
import {
  vocabQuestions,
  vocabQuestionTypeLabels,
  type VocabQuestionType,
  type VocabQuestion,
} from "@/lib/vocab-questions";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";

const allTypes: VocabQuestionType[] = [
  "kanji_reading",
  "notation",
  "context",
  "synonym",
  "usage",
];

export default function VocabularyPage() {
  const { isLoading, level, supportedLevel, userLabel } = useActiveStudyProfile();
  const [selectedType, setSelectedType] = useState<VocabQuestionType | "all">(
    "all"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  const filtered = vocabQuestions.filter(
    (q) =>
      q.level === supportedLevel &&
      (selectedType === "all" || q.type === selectedType)
  );
  const current: VocabQuestion | undefined = filtered[currentIndex];

  const handleAnswer = (choice: string) => {
    if (showResult) return;
    setSelectedAnswer(choice);
    setShowResult(true);
    setStats((prev) => ({
      total: prev.total + 1,
      correct:
        choice === current.correct_answer ? prev.correct + 1 : prev.correct,
    }));
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const resetWith = (newType?: VocabQuestionType | "all") => {
    if (newType !== undefined) setSelectedType(newType);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  if (isLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  if (!supportedLevel) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">어휘 문제</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              현재 사용자 {userLabel}
            </span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">
              설정 레벨 {level}
            </span>
          </div>
        </div>
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
          {level} 어휘 문제 데이터는 아직 준비되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">어휘 문제</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            현재 사용자 {userLabel}
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">
            설정 레벨 {supportedLevel}
          </span>
        </div>
      </div>

      {/* Question type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => resetWith("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedType === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          전체
        </button>
        {allTypes.map((t) => (
          <button
            key={t}
            onClick={() => resetWith(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedType === t
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {vocabQuestionTypeLabels[t]}
          </button>
        ))}
      </div>

      {!current ? (
        <p className="text-center text-gray-500 py-8">
          해당 유형의 문제가 없습니다.
        </p>
      ) : (
        <>
          {/* Stats */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              {vocabQuestionTypeLabels[current.type]} |{" "}
              {currentIndex + 1}/{filtered.length}
            </span>
            <span>
              정답률:{" "}
              {stats.total > 0
                ? Math.round((stats.correct / stats.total) * 100)
                : 0}
              % ({stats.correct}/{stats.total})
            </span>
          </div>

          {/* Question */}
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {current.question}
            </p>
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style =
                "border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600";

              if (showResult) {
                if (choice === current.correct_answer) {
                  style =
                    "border-2 border-green-500 bg-green-50 dark:bg-green-900/20";
                } else if (
                  choice === selectedAnswer &&
                  choice !== current.correct_answer
                ) {
                  style =
                    "border-2 border-red-500 bg-red-50 dark:bg-red-900/20";
                } else {
                  style =
                    "border border-gray-200 dark:border-gray-800 opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${style}`}
                >
                  <span className="text-sm font-medium text-gray-400 mr-2">
                    {i + 1}.
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Result */}
          {showResult && (
            <div className="space-y-3">
              <div
                className={`p-4 rounded-xl text-sm ${
                  selectedAnswer === current.correct_answer
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                }`}
              >
                <p className="font-semibold mb-1">
                  {selectedAnswer === current.correct_answer
                    ? "정답입니다!"
                    : `오답입니다. 정답: ${current.correct_answer}`}
                </p>
                <p>{current.explanation}</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                다음 문제
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
