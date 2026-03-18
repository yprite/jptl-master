"use client";

import { useState } from "react";
import UserSelectionNotice from "@/components/user-selection-notice";
import {
  type GeneratedVocabularyQuestion,
  type GeneratedVocabularyQuestionType,
} from "@/lib/study-data-types";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

const EMPTY_QUESTIONS: GeneratedVocabularyQuestion[] = [];
const allTypes: GeneratedVocabularyQuestionType[] = ["meaning", "reading"];
const vocabQuestionTypeLabels: Record<GeneratedVocabularyQuestionType, string> = {
  meaning: "뜻 맞히기",
  reading: "읽기",
};

export default function VocabularyPage() {
  const { isLoading: isProfileLoading, supportedLevel, userLabel, requiresSelection } =
    useActiveStudyProfile();
  const [selectedType, setSelectedType] = useState<
    GeneratedVocabularyQuestionType | "all"
  >("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const { data: vocabQuestions, error, isLoading: isStudyLoading } = useStudyData<
    GeneratedVocabularyQuestion[]
  >(
    isProfileLoading ? null : `vocabulary-questions-${supportedLevel}.json`,
    EMPTY_QUESTIONS
  );

  const filtered = vocabQuestions.filter(
    (q) =>
      q.level === supportedLevel &&
      (selectedType === "all" || q.type === selectedType)
  );
  const current = filtered[currentIndex];

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
    if (filtered.length === 0) return;
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const resetWith = (newType?: GeneratedVocabularyQuestionType | "all") => {
    if (newType !== undefined) setSelectedType(newType);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
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

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {/* Question type filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => resetWith("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedType === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
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
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {vocabQuestionTypeLabels[t]}
          </button>
        ))}
      </div>

      {!current ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
          해당 유형의 어휘 문제가 없습니다.
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
          <div className="p-6 rounded-xl bg-white border border-gray-200">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {current.prompt}
            </p>
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-gray-900">
              {current.question}
            </p>
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style =
                "border border-gray-200 hover:border-indigo-400";

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
