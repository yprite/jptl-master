"use client";

import { useState } from "react";
import {
  grammarQuestions,
  grammarQuestionTypeLabels,
  type GrammarQuestionType,
  type GrammarQuestion,
} from "@/lib/grammar-questions";

type Level = "N4" | "N3";

const allTypes: GrammarQuestionType[] = [
  "sentence_grammar",
  "sentence_order",
  "passage_grammar",
];

export default function GrammarPage() {
  const [level, setLevel] = useState<Level>("N4");
  const [selectedType, setSelectedType] = useState<
    GrammarQuestionType | "all"
  >("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  const filtered = grammarQuestions.filter(
    (q) =>
      q.level === level &&
      (selectedType === "all" || q.type === selectedType)
  );
  const current: GrammarQuestion | undefined = filtered[currentIndex];

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

  const resetWith = (
    newLevel?: Level,
    newType?: GrammarQuestionType | "all"
  ) => {
    if (newLevel !== undefined) setLevel(newLevel);
    if (newType !== undefined) setSelectedType(newType);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">문법 문제</h1>

      {/* Level */}
      <div className="flex gap-2">
        {(["N4", "N3"] as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => resetWith(l)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              level === l
                ? "bg-amber-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Question type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => resetWith(undefined, "all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedType === "all"
              ? "bg-amber-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          전체
        </button>
        {allTypes.map((t) => (
          <button
            key={t}
            onClick={() => resetWith(undefined, t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedType === t
                ? "bg-amber-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {grammarQuestionTypeLabels[t]}
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
              {grammarQuestionTypeLabels[current.type]} |{" "}
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
            {current.type === "sentence_order" && current.order_parts && (
              <div className="mt-3 flex flex-wrap gap-2">
                {current.order_parts.map((part, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-medium"
                  >
                    {part}
                  </span>
                ))}
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
