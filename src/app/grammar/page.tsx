"use client";

import { useState } from "react";
import StudySessionHero from "@/components/study-session-hero";
import UserSelectionNotice from "@/components/user-selection-notice";
import type { GeneratedGrammarQuestion } from "@/lib/study-data-types";
import { getDailyStudyItems } from "@/lib/study-plan";
import { useAutoCompleteQuest } from "@/lib/use-auto-complete-quest";
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
  const answeredCount = Math.min(stats.total, dailyQuestions.length);
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const remainingCount = Math.max(dailyQuestions.length - answeredCount, 0);
  const progressPercent =
    dailyQuestions.length > 0
      ? Math.min(100, Math.round((answeredCount / dailyQuestions.length) * 100))
      : 0;

  useAutoCompleteQuest({
    enabled: isSessionComplete,
    quest: "grammar",
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

  const sessionDescription = plan
    ? `${userLabel}의 Day ${currentDay} 문법 ${dailyQuestions.length}개를 순서대로 풉니다. 문제와 예문을 먼저 읽고 보기에서 바로 판단하면 됩니다.`
    : `${userLabel}의 현재 레벨 문법 문제를 바로 이어서 풉니다. 문제와 예문을 읽은 뒤 보기에서 판단하면 됩니다.`;
  const heroBadges = [
    {
      label: `현재 사용자 ${userLabel}`,
      className: "bg-stone-900 text-white",
    },
    {
      label: `설정 레벨 ${supportedLevel}`,
      className: "bg-white text-stone-700",
    },
    ...(plan
      ? [
          {
            label: `Day ${currentDay}`,
            className: "bg-emerald-100 text-emerald-700",
          },
          {
            label: `오늘 분량 ${dailyQuestions.length}개`,
            className: "bg-amber-100 text-amber-700",
          },
        ]
      : []),
    {
      label: questionLabel,
      className: "bg-amber-100 text-amber-700",
    },
  ];
  const summaryItems = [
    {
      label: "세션",
      value: `${answeredCount}/${dailyQuestions.length}문제`,
      detail: dailyQuestions.length > 0 ? `현재 ${Math.min(currentIndex + 1, dailyQuestions.length)}번 문제` : "오늘 묶음 기준",
    },
    {
      label: "정답",
      value: `${accuracy}%`,
      detail: `${stats.correct}/${stats.total}`,
    },
    {
      label: "문항",
      value: questionLabel,
      detail: current?.badge ?? "현재 문형",
    },
    {
      label: "남은",
      value: `${remainingCount}문제`,
      detail: `오늘 묶음 ${dailyQuestions.length}개`,
    },
  ];

  return (
    <div className="space-y-4">
      <StudySessionHero
        eyebrow="Grammar Session"
        title="문법 문제"
        description={sessionDescription}
        progressLabel={`${answeredCount}/${dailyQuestions.length}`}
        progressDetail={`완료율 ${progressPercent}%`}
        progressPercent={progressPercent}
        badges={heroBadges}
        summaryItems={summaryItems}
      />

      {error && (
        <p className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {!current ? (
        dailyQuestions.length === 0 ? (
          <p className="rounded-[1.8rem] border border-dashed border-stone-300 bg-white/72 px-6 py-10 text-center text-stone-500">
            {supportedLevel} 문법 데이터가 없습니다. 현재 연결된 JLPT 통합덱 원본에는 이 레벨의 문법 항목이 비어 있습니다.
          </p>
        ) : (
          <div className="space-y-4 rounded-[1.8rem] border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
            <p className="text-lg font-semibold text-emerald-900">
              오늘 문법 분량을 모두 풀었습니다.
            </p>
            <p className="text-sm text-emerald-700">
              Day {currentDay} 목표 {dailyQuestions.length}개를 마쳤습니다.
            </p>
            <button
              onClick={restartSession}
              className="mx-auto inline-flex rounded-[1.2rem] bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              오늘 분량 다시 풀기
            </button>
          </div>
        )
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
              {questionLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 font-medium text-stone-700 shadow-sm">
              문제 {Math.min(currentIndex + 1, dailyQuestions.length)}/{dailyQuestions.length}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">
              정답률 {accuracy}% ({stats.correct}/{stats.total})
            </span>
          </div>

          <div className="rounded-[1.8rem] border border-stone-200/80 bg-white/88 p-6 shadow-[0_18px_45px_rgba(92,71,47,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              {current.badge}
            </p>
            <p className="mt-3 text-xl leading-relaxed whitespace-pre-wrap text-stone-900">
              {current.question}
            </p>
            {(current.example_jp || current.example_kr) && (() => {
              const parsed = current.example_jp ? parseJapaneseExample(current.example_jp) : null;
              return (
                <div className="mt-5 space-y-1.5 rounded-[1.3rem] border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm">
                  {parsed && (
                    <>
                      <p className="whitespace-pre-wrap font-medium text-stone-900">
                        {parsed.japanese}
                      </p>
                      <p className="whitespace-pre-wrap text-xs text-stone-500">
                        {parsed.yomigana}
                      </p>
                    </>
                  )}
                  {current.example_kr && (
                    <p className="whitespace-pre-wrap text-sm text-sky-700">
                      {current.example_kr}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style = "border border-stone-200 bg-white/82 hover:border-amber-400 hover:bg-white";

              if (showResult) {
                if (choice === current.correct_answer) {
                  style = "border-2 border-green-500 bg-green-50";
                } else if (
                  choice === selectedAnswer &&
                  choice !== current.correct_answer
                ) {
                  style = "border-2 border-red-500 bg-red-50";
                } else {
                  style = "border border-stone-200 bg-white/60 opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={showResult}
                  className={`w-full rounded-[1.3rem] p-4 text-left transition-colors ${style}`}
                >
                  <span className="mr-2 text-sm font-medium text-stone-400">
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
                className={`rounded-[1.4rem] p-4 text-sm ${
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
                className="w-full rounded-[1.3rem] bg-amber-600 py-3 font-medium text-white transition-colors hover:bg-amber-700"
              >
                다음 문제
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
