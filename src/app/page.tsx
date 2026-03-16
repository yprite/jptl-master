"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  type UserId,
  type DailyQuests,
  type UserProgress,
  USERS,
  getCurrentUser,
  setCurrentUser,
  getDailyQuests,
  completeDailyQuest,
  getProgress,
} from "@/lib/user-store";

const QUESTS = [
  {
    key: "flashcard" as const,
    title: "단어 암기",
    desc: "플래시카드 10장 학습",
    href: "/flashcard",
    icon: "1",
    color: "blue",
  },
  {
    key: "vocabulary" as const,
    title: "어휘 문제",
    desc: "어휘 문제 5개 풀기",
    href: "/vocabulary",
    icon: "2",
    color: "indigo",
  },
  {
    key: "grammar" as const,
    title: "문법 문제",
    desc: "문법 문제 5개 풀기",
    href: "/grammar",
    icon: "3",
    color: "amber",
  },
  {
    key: "reading" as const,
    title: "독해",
    desc: "독해 문제 2개 풀기",
    href: "/reading",
    icon: "4",
    color: "green",
  },
];

export default function Home() {
  const [userId, setUserId] = useState<UserId>("me");
  const [quests, setQuests] = useState<DailyQuests | null>(null);
  const [progress, setProgressState] = useState<UserProgress | null>(null);

  useEffect(() => {
    const id = getCurrentUser();
    setUserId(id);
    setQuests(getDailyQuests(id));
    setProgressState(getProgress(id));
  }, []);

  const switchUser = (id: UserId) => {
    setCurrentUser(id);
    setUserId(id);
    setQuests(getDailyQuests(id));
    setProgressState(getProgress(id));
  };

  const markComplete = (quest: keyof DailyQuests) => {
    const updated = completeDailyQuest(userId, quest);
    setQuests(updated);
    setProgressState(getProgress(userId));
  };

  if (!quests || !progress) return null;

  const user = USERS[userId];
  const completedCount = Object.values(quests).filter(Boolean).length;
  const allDone = completedCount === 4;

  // 현재 진행해야 할 퀘스트 (첫 번째 미완료)
  const currentQuestIdx = QUESTS.findIndex((q) => !quests[q.key]);

  return (
    <div className="space-y-6">
      {/* 유저 선택 */}
      <div className="flex gap-2 justify-center">
        {(Object.keys(USERS) as UserId[]).map((id) => (
          <button
            key={id}
            onClick={() => switchUser(id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              userId === id
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-105"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {USERS[id].name}
          </button>
        ))}
      </div>

      {/* 인사 & 진도 */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">
          {user.name}의 학습
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          목표: {user.level} · 총 {progress.totalDays}일 학습
        </p>
      </div>

      {/* 누적 통계 */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "암기", value: progress.flashcardCount, color: "text-blue-600 dark:text-blue-400" },
          { label: "어휘", value: progress.vocabCount, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "문법", value: progress.grammarCount, color: "text-amber-600 dark:text-amber-400" },
          { label: "독해", value: progress.readingCount, color: "text-green-600 dark:text-green-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900"
          >
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 오늘의 진행률 */}
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-medium">오늘의 퀘스트</span>
          <span className="text-gray-500">{completedCount}/4</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allDone ? "bg-green-500" : "bg-violet-600"
            }`}
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* 올클리어 */}
      {allDone && (
        <div className="text-center py-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-3xl mb-2">&#x2705;</div>
          <p className="font-bold text-green-700 dark:text-green-400">
            오늘 퀘스트 올클리어!
          </p>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            내일도 화이팅!
          </p>
        </div>
      )}

      {/* 퀘스트 목록 */}
      <div className="space-y-3">
        {QUESTS.map((q, idx) => {
          const done = quests[q.key];
          const isCurrent = idx === currentQuestIdx;
          const isLocked = !done && idx > currentQuestIdx && currentQuestIdx >= 0;

          return (
            <div
              key={q.key}
              className={`relative rounded-xl border p-4 transition-all ${
                done
                  ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                  : isCurrent
                  ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10 shadow-sm"
                  : "border-gray-200 dark:border-gray-800 opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 번호/상태 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    done
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {done ? "\u2713" : q.icon}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{q.title}</div>
                  <div className="text-xs text-gray-500">{q.desc}</div>
                </div>

                {/* 액션 */}
                {done ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
                    완료
                  </span>
                ) : isCurrent ? (
                  <Link
                    href={q.href}
                    className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shrink-0"
                  >
                    시작
                  </Link>
                ) : isLocked ? (
                  <span className="text-xs text-gray-400 shrink-0">
                    잠김
                  </span>
                ) : (
                  <Link
                    href={q.href}
                    className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors shrink-0"
                  >
                    시작
                  </Link>
                )}
              </div>

              {/* 현재 퀘스트 연결선 */}
              {isCurrent && (
                <div className="absolute -left-px top-0 bottom-0 w-1 rounded-full bg-violet-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* 퀘스트 완료 버튼 (학습 후 돌아와서 체크) */}
      {currentQuestIdx >= 0 && (
        <button
          onClick={() => markComplete(QUESTS[currentQuestIdx].key)}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
        >
          &quot;{QUESTS[currentQuestIdx].title}&quot; 완료 체크
        </button>
      )}
    </div>
  );
}
