"use client";

import { useState } from "react";
import UserSelectionNotice from "@/components/user-selection-notice";
import type { GeneratedGrammarQuestion } from "@/lib/study-data-types";
import { getDailyStudyItems } from "@/lib/study-plan";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

function parseJapaneseExample(text: string): { japanese: string; yomigana: string } {
  const clean = text.replace(/\[/g, "").replace(/\]/g, "");
  const japanese = clean.replace(/\(([^)]+)\)/g, "");
  const yomigana = clean.replace(/([^\s(,、。！？～〜「」…·]+)\(([^)]+)\)/g, "$2");
  return { japanese, yomigana };
}

const EMPTY_QUESTIONS: GeneratedGrammarQuestion[] = [];

export default function GrammarPage() {
  const {
    isLoading: isProfileLoading,
    supportedLevel,
    userLabel,
    requiresSelection,
    plan,
    currentDay,
  } = useActiveStudyProfile();
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

  const dailyQuestions = plan
    ? getDailyStudyItems(grammarQuestions, currentDay, plan.dailyGrammar)
    : grammarQuestions;
  const isSessionComplete = dailyQuestions.length > 0 && currentIndex >= dailyQuestions.length;
  const current = isSessionComplete ? null : dailyQuestions[currentIndex] ?? null;
  const questionLabel = current?.type === "pattern" ? "예문 문법" : "문형 의미";

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

      {!current ? (
        dailyQuestions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
            {supportedLevel} 문법 데이터가 없습니다. 현재 연결된 JLPT 통합덱 원본에는 이 레벨의 문법 항목이 비어 있습니다.
          </p>
        ) : (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
            <p className="text-lg font-semibold text-emerald-900">
              오늘 문법 분량을 모두 풀었습니다.
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
        )
      ) : (
        <>
          {/* Stats */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              {questionLabel} | {Math.min(currentIndex + 1, dailyQuestions.length)}/{dailyQuestions.length}
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
          <div className="p-6 rounded-xl bg-white border border-gray-200">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              {current.badge}
            </p>
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-gray-900">
              {current.question}
            </p>
            {(current.example_jp || current.example_kr) && (() => {
              const parsed = current.example_jp ? parseJapaneseExample(current.example_jp) : null;
              return (
                <div className="mt-4 space-y-1.5 rounded-xl bg-gray-50 px-4 py-3 text-sm border border-gray-100">
                  {parsed && (
                    <>
                      <p className="whitespace-pre-wrap text-gray-900 font-medium">
                        {parsed.japanese}
                      </p>
                      <p className="whitespace-pre-wrap text-gray-500 text-xs">
                        {parsed.yomigana}
                      </p>
                    </>
                  )}
                  {current.example_kr && (
                    <p className="whitespace-pre-wrap text-blue-700 text-sm">
                      {current.example_kr}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style =
                "border border-gray-200 hover:border-amber-400";

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

          {/* Result */}
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
