"use client";

import { useState } from "react";
import type { GeneratedGrammarQuestion } from "@/lib/study-data-types";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

const EMPTY_QUESTIONS: GeneratedGrammarQuestion[] = [];

export default function GrammarPage() {
  const { isLoading: isProfileLoading, supportedLevel, userLabel } =
    useActiveStudyProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const { data: grammarQuestions, error, isLoading: isStudyLoading } = useStudyData<
    GeneratedGrammarQuestion[]
  >(
    isProfileLoading ? null : `grammar-questions-${supportedLevel}.json`,
    EMPTY_QUESTIONS
  );

  const current = grammarQuestions[currentIndex];

  const handleAnswer = (choice: string) => {
    if (showResult || !current) return;
    setSelectedAnswer(choice);
    setShowResult(true);
    setStats((prev) => ({
      total: prev.total + 1,
      correct:
        choice === current.correct_answer ? prev.correct + 1 : prev.correct,
    }));
  };

  const handleNext = () => {
    if (grammarQuestions.length === 0) return;
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) => (prev + 1) % grammarQuestions.length);
  };

  if (isProfileLoading || isStudyLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">문법 문제</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            현재 사용자 {userLabel}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
            설정 레벨 {supportedLevel}
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {!current ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
          {supportedLevel} 문법 데이터가 없습니다. 현재 연결된 JLPT 통합덱 원본에는 이 레벨의 문법 항목이 비어 있습니다.
        </p>
      ) : (
        <>
          {/* Stats */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              문형 의미 | {currentIndex + 1}/{grammarQuestions.length}
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              {current.pattern}
            </p>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {current.question}
            </p>
            {(current.example_jp || current.example_kr) && (
              <div className="mt-4 space-y-2 rounded-xl bg-white/70 px-4 py-3 text-sm text-gray-600 dark:bg-gray-950/40 dark:text-gray-300">
                {current.example_jp && (
                  <p className="whitespace-pre-wrap">{current.example_jp}</p>
                )}
                {current.example_kr && (
                  <p className="whitespace-pre-wrap text-gray-500 dark:text-gray-400">
                    {current.example_kr}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style =
                "border border-gray-200 dark:border-gray-800 hover:border-amber-400 dark:hover:border-amber-600";

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
                className="w-full py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
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
