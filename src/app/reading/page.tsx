"use client";

import { useState } from "react";
import UserSelectionNotice from "@/components/user-selection-notice";
import type { GeneratedReadingQuestion } from "@/lib/study-data-types";
import { getDailyStudyItems } from "@/lib/study-plan";
import { useAutoCompleteQuest } from "@/lib/use-auto-complete-quest";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

const EMPTY_READING_QUESTIONS: GeneratedReadingQuestion[] = [];

export default function ReadingPage() {
  const {
    isLoading: isProfileLoading,
    supportedLevel,
    userId,
    userLabel,
    requiresSelection,
    plan,
    currentDay,
  } = useActiveStudyProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const { data: questions, error, isLoading: isStudyLoading } = useStudyData<
    GeneratedReadingQuestion[]
  >(
    isProfileLoading ? null : `reading-questions-${supportedLevel}.json`,
    EMPTY_READING_QUESTIONS
  );

  const dailyQuestions = plan
    ? getDailyStudyItems(questions, currentDay, plan.dailyReading)
    : questions;
  const isSessionComplete = dailyQuestions.length > 0 && currentIndex >= dailyQuestions.length;
  const current = isSessionComplete ? null : dailyQuestions[currentIndex] ?? null;

  useAutoCompleteQuest({
    enabled: isSessionComplete,
    quest: "reading",
    userId,
  });

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
    if (dailyQuestions.length === 0) return;
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) =>
      prev + 1 >= dailyQuestions.length ? dailyQuestions.length : prev + 1
    );
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setStats({ total: 0, correct: 0 });
  };

  if (isProfileLoading || isStudyLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  if (requiresSelection || !userLabel) {
    return <UserSelectionNotice />;
  }

  if (isSessionComplete) {
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
            {plan && (
              <>
                <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">
                  Day {currentDay}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                  오늘 분량 {dailyQuestions.length}개
                </span>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </p>
        )}

        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
          <p className="text-lg font-semibold text-emerald-900">
            오늘 독해 분량을 모두 풀었습니다.
          </p>
          <p className="text-sm text-emerald-700">
            Day {currentDay} 목표 {dailyQuestions.length}개를 마쳤습니다.
          </p>
          <button
            onClick={restartSession}
            className="mx-auto inline-flex rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            오늘 분량 다시 풀기
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
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
            {plan && (
              <>
                <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">
                  Day {currentDay}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                  오늘 분량 {dailyQuestions.length}개
                </span>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-600">
          <p className="text-lg font-semibold text-gray-900">
            {supportedLevel} 독해 데이터는 아직 비어 있습니다.
          </p>
          <p className="mt-3 leading-7">
            사용할 수 있는 독해 문제가 아직 생성되지 않았습니다.
          </p>
        </div>
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
          {plan && (
            <>
              <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">
                Day {currentDay}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                오늘 분량 {dailyQuestions.length}개
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      <div className="text-sm text-gray-500">
        문제 {Math.min(currentIndex + 1, dailyQuestions.length)}/{dailyQuestions.length} | 정답률:{" "}
        {stats.total > 0
          ? Math.round((stats.correct / stats.total) * 100)
          : 0}
        % ({stats.correct}/{stats.total})
      </div>

      <div className="p-6 rounded-xl bg-white border border-gray-200">
        <p className="text-lg leading-relaxed whitespace-pre-wrap text-gray-900">
          {current.passage}
        </p>
      </div>

      <h2 className="text-lg font-semibold">{current.question}</h2>

      <div className="space-y-2">
        {current.choices.map((choice, i) => {
          let style =
            "border border-gray-200 hover:border-green-400";

          if (showResult) {
            if (choice === current.correct_answer) {
              style =
                "border-2 border-green-500 bg-green-50";
            } else if (
              choice === selectedAnswer &&
              choice !== current.correct_answer
            ) {
              style =
                "border-2 border-red-500 bg-red-50";
            } else {
              style =
                "border border-gray-200 opacity-50";
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

      {showResult && (
        <div className="space-y-3">
          <div
            className={`p-4 rounded-xl text-sm ${
              selectedAnswer === current.correct_answer
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
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
