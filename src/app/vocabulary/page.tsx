"use client";

import { useState } from "react";
import StudySessionHero from "@/components/study-session-hero";
import UserSelectionNotice from "@/components/user-selection-notice";
import {
  type GeneratedVocabularyQuestion,
  type GeneratedVocabularyQuestionType,
} from "@/lib/study-data-types";
import { getDailyStudyItems } from "@/lib/study-plan";
import { useAutoCompleteQuest } from "@/lib/use-auto-complete-quest";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

const EMPTY_QUESTIONS: GeneratedVocabularyQuestion[] = [];
const allTypes: GeneratedVocabularyQuestionType[] = ["meaning", "reading"];
const vocabQuestionTypeLabels: Record<GeneratedVocabularyQuestionType, string> = {
  meaning: "뜻 맞히기",
  reading: "읽기",
};

export default function VocabularyPage() {
  const {
    isLoading: isProfileLoading,
    supportedLevel,
    userId,
    userLabel,
    requiresSelection,
    plan,
    currentDay,
  } = useActiveStudyProfile();
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

  const levelQuestions = vocabQuestions.filter((q) => q.level === supportedLevel);
  const dailyQuestions = plan
    ? getDailyStudyItems(levelQuestions, currentDay, plan.dailyVocabulary)
    : levelQuestions;
  const filtered = dailyQuestions.filter(
    (q) =>
      (selectedType === "all" || q.type === selectedType)
  );
  const isSessionComplete = filtered.length > 0 && currentIndex >= filtered.length;
  const isDailySessionComplete =
    selectedType === "all" &&
    dailyQuestions.length > 0 &&
    currentIndex >= dailyQuestions.length;
  const current = isSessionComplete ? null : filtered[currentIndex] ?? null;
  const progressCount = Math.min(currentIndex + 1, filtered.length);
  const answeredCount = Math.min(stats.total, filtered.length);
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const remainingCount = Math.max(filtered.length - answeredCount, 0);
  const progressPercent =
    filtered.length > 0 ? Math.min(100, Math.round((answeredCount / filtered.length) * 100)) : 0;

  useAutoCompleteQuest({
    enabled: isDailySessionComplete,
    quest: "vocabulary",
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
    if (filtered.length === 0) return;
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) => (prev + 1 >= filtered.length ? filtered.length : prev + 1));
  };

  const resetWith = (newType?: GeneratedVocabularyQuestionType | "all") => {
    if (newType !== undefined) setSelectedType(newType);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
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
    ? `${userLabel}의 Day ${currentDay} 어휘 ${dailyQuestions.length}개를 풉니다. 유형을 바꾸면 같은 분량 안에서 바로 묶어 볼 수 있습니다.`
    : `${userLabel}의 현재 레벨 어휘 문제를 바로 이어서 풉니다. 유형을 바꾸면 필요한 묶음만 빠르게 볼 수 있습니다.`;
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
      label: selectedType === "all" ? "유형 전체" : vocabQuestionTypeLabels[selectedType],
      className: "bg-indigo-100 text-indigo-700",
    },
  ];
  const summaryItems = [
    {
      label: "세션",
      value: `${answeredCount}/${filtered.length}문제`,
      detail: filtered.length > 0 ? `현재 ${progressCount}번 문제` : "선택한 유형 기준",
    },
    {
      label: "정답",
      value: `${accuracy}%`,
      detail: `${stats.correct}/${stats.total}`,
    },
    {
      label: "유형",
      value: selectedType === "all" ? "전체" : vocabQuestionTypeLabels[selectedType],
      detail: current ? `현재 ${vocabQuestionTypeLabels[current.type]}` : "세션 필터",
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
        eyebrow="Vocabulary Session"
        title="어휘 문제"
        description={sessionDescription}
        progressLabel={`${answeredCount}/${filtered.length}`}
        progressDetail={`완료율 ${progressPercent}%`}
        progressPercent={progressPercent}
        badges={heroBadges}
        summaryItems={summaryItems}
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => resetWith("all")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedType === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            전체
          </button>
          {allTypes.map((t) => (
            <button
              key={t}
              onClick={() => resetWith(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedType === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {vocabQuestionTypeLabels[t]}
            </button>
          ))}
        </div>
      </StudySessionHero>

      {error && (
        <p className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {!current ? (
        filtered.length === 0 ? (
          <div className="space-y-3 rounded-[1.8rem] border border-dashed border-stone-300 bg-white/72 px-6 py-10 text-center text-stone-500">
            <p>해당 유형의 어휘 문제가 없습니다.</p>
            {selectedType !== "all" && (
              <button
                onClick={() => resetWith("all")}
                className="mx-auto inline-flex rounded-[1.2rem] bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                전체 문제로 돌아가기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-[1.8rem] border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
            <p className="text-lg font-semibold text-emerald-900">
              오늘 어휘 분량을 모두 풀었습니다.
            </p>
            <p className="text-sm text-emerald-700">
              Day {currentDay} 목표 {filtered.length}개를 마쳤습니다.
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
            <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">
              {vocabQuestionTypeLabels[current.type]}
            </span>
            <span className="rounded-full bg-white px-3 py-1 font-medium text-stone-700 shadow-sm">
              문제 {progressCount}/{filtered.length}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">
              정답률 {accuracy}% ({stats.correct}/{stats.total})
            </span>
          </div>

          <div className="rounded-[1.8rem] border border-stone-200/80 bg-white/88 p-6 shadow-[0_18px_45px_rgba(92,71,47,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {current.prompt}
            </p>
            <p className="mt-3 text-xl leading-relaxed whitespace-pre-wrap text-stone-900">
              {current.question}
            </p>
          </div>

          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style = "border border-stone-200 bg-white/82 hover:border-indigo-400 hover:bg-white";

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
                className="w-full rounded-[1.3rem] bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
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
