"use client";

import { useState } from "react";
import { sampleReadingQuestions } from "@/lib/sample-data";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";

export default function ReadingPage() {
  const { isLoading, level, supportedLevel, userLabel } = useActiveStudyProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  const questions = sampleReadingQuestions.filter((q) => q.level === supportedLevel);
  const current = questions[currentIndex];

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
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  if (isLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  if (!supportedLevel) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">독해</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              현재 사용자 {userLabel}
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
              설정 레벨 {level}
            </span>
          </div>
        </div>
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
          {level} 독해 데이터는 아직 준비되지 않았습니다.
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">독해</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              현재 사용자 {userLabel}
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
              설정 레벨 {supportedLevel}
            </span>
          </div>
        </div>
        <p className="text-center text-gray-500">해당 레벨의 문제가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">독해</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            현재 사용자 {userLabel}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
            설정 레벨 {supportedLevel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        문제 {currentIndex + 1}/{questions.length} | 정답률:{" "}
        {stats.total > 0
          ? Math.round((stats.correct / stats.total) * 100)
          : 0}
        % ({stats.correct}/{stats.total})
      </div>

      {/* Passage */}
      <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">
          {current.passage}
        </p>
      </div>

      {/* Question */}
      <h2 className="text-lg font-semibold">{current.question}</h2>

      {/* Choices */}
      <div className="space-y-2">
        {current.choices.map((choice, i) => {
          let style =
            "border border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-600";

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

      {/* Explanation */}
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
            className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
}
