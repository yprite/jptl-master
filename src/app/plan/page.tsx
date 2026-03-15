"use client";

import { useState } from "react";

type Level = "N4" | "N3";

interface PlanConfig {
  level: Level;
  totalWeeks: number;
  dailyWords: number;
  dailyReading: number;
}

interface DayProgress {
  vocab: boolean;
  reading: boolean;
}

const defaultPlan: PlanConfig = {
  level: "N4",
  totalWeeks: 12,
  dailyWords: 10,
  dailyReading: 3,
};

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanConfig>(defaultPlan);
  const [started, setStarted] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [progress, setProgress] = useState<Map<number, DayProgress>>(
    new Map()
  );

  const totalDays = plan.totalWeeks * 7;
  const currentWeek = Math.ceil(currentDay / 7);
  const completedDays = Array.from(progress.values()).filter(
    (p) => p.vocab && p.reading
  ).length;
  const progressPercent = Math.round((completedDays / totalDays) * 100);

  const toggleDay = (day: number, type: "vocab" | "reading") => {
    setProgress((prev) => {
      const next = new Map(prev);
      const existing = next.get(day) || { vocab: false, reading: false };
      next.set(day, { ...existing, [type]: !existing[type] });
      return next;
    });
  };

  if (!started) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">학습 계획 만들기</h1>

        <div className="space-y-4 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          {/* Level */}
          <div>
            <label className="block text-sm font-medium mb-2">
              목표 레벨
            </label>
            <div className="flex gap-2">
              {(["N4", "N3"] as Level[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setPlan((p) => ({ ...p, level: l }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    plan.level === l
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2">
              학습 기간: {plan.totalWeeks}주 ({plan.totalWeeks * 7}일)
            </label>
            <input
              type="range"
              min={4}
              max={24}
              value={plan.totalWeeks}
              onChange={(e) =>
                setPlan((p) => ({
                  ...p,
                  totalWeeks: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>4주</span>
              <span>24주</span>
            </div>
          </div>

          {/* Daily words */}
          <div>
            <label className="block text-sm font-medium mb-2">
              일일 새 단어: {plan.dailyWords}개
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={plan.dailyWords}
              onChange={(e) =>
                setPlan((p) => ({
                  ...p,
                  dailyWords: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          {/* Daily reading */}
          <div>
            <label className="block text-sm font-medium mb-2">
              일일 독해 문제: {plan.dailyReading}개
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={plan.dailyReading}
              onChange={(e) =>
                setPlan((p) => ({
                  ...p,
                  dailyReading: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
          >
            학습 시작
          </button>
        </div>
      </div>
    );
  }

  // Weekly view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = (currentWeek - 1) * 7 + i + 1;
    return day <= totalDays ? day : null;
  }).filter((d): d is number => d !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">학습 계획</h1>
        <span className="text-sm px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
          {plan.level}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>진행률 {progressPercent}%</span>
          <span>
            {completedDays}/{totalDays}일
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDay(Math.max(1, (currentWeek - 2) * 7 + 1))}
          disabled={currentWeek <= 1}
          className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 disabled:opacity-30"
        >
          이전 주
        </button>
        <span className="font-semibold">
          {currentWeek}주차 / {Math.ceil(totalDays / 7)}주
        </span>
        <button
          onClick={() =>
            setCurrentDay(
              Math.min(totalDays, currentWeek * 7 + 1)
            )
          }
          disabled={currentWeek >= Math.ceil(totalDays / 7)}
          className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 disabled:opacity-30"
        >
          다음 주
        </button>
      </div>

      {/* Daily checklist */}
      <div className="space-y-2">
        {weekDays.map((day) => {
          const dayProgress = progress.get(day) || {
            vocab: false,
            reading: false,
          };
          const isDone = dayProgress.vocab && dayProgress.reading;
          const dayOfWeek = ["월", "화", "수", "목", "금", "토", "일"][
            (day - 1) % 7
          ];

          return (
            <div
              key={day}
              className={`p-4 rounded-xl border transition-colors ${
                isDone
                  ? "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  Day {day}{" "}
                  <span className="text-sm text-gray-400">({dayOfWeek})</span>
                </span>
                {isDone && (
                  <span className="text-xs text-green-600 font-medium">
                    완료
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleDay(day, "vocab")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dayProgress.vocab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  }`}
                >
                  단어 {plan.dailyWords}개
                </button>
                <button
                  onClick={() => toggleDay(day, "reading")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dayProgress.reading
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                  }`}
                >
                  독해 {plan.dailyReading}문제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
