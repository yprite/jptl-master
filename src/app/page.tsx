"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { User } from "@/lib/database.types";
import {
  type UserId,
  type DailyQuests,
  type UserProgress,
  getCurrentUserId,
  setCurrentUserId,
  getUser,
  upsertUser,
  getDailyQuests,
  completeDailyQuest,
  getProgress,
} from "@/lib/user-store";

const USER_IDS: UserId[] = ["me", "wife"];

export default function Home() {
  const [userId, setUserId] = useState<UserId>(() => getCurrentUserId());
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<DailyQuests | null>(null);
  const [progress, setProgressState] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // 설정 폼 state
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState<"N5" | "N4" | "N3">("N4");
  const [formFlashcard, setFormFlashcard] = useState(10);
  const [formVocab, setFormVocab] = useState(5);
  const [formGrammar, setFormGrammar] = useState(5);
  const [formReading, setFormReading] = useState(2);

  const loadUser = useCallback(async (id: UserId) => {
    setLoading(true);
    const [u, q, p] = await Promise.all([
      getUser(id),
      getDailyQuests(id),
      getProgress(id),
    ]);
    setUser(u);
    setQuests(q);
    setProgressState(p);

    // 유저가 없으면 셋업 모드
    if (!u) {
      setFormName(id === "me" ? "" : "");
      setFormLevel("N4");
      setFormFlashcard(10);
      setFormVocab(5);
      setFormGrammar(5);
      setFormReading(2);
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUser(userId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUser, userId]);

  const switchUser = (id: UserId) => {
    setCurrentUserId(id);
    setUserId(id);
  };

  const openEdit = () => {
    if (!user) return;
    setFormName(user.name);
    setFormLevel(user.level);
    setFormFlashcard(user.daily_flashcard);
    setFormVocab(user.daily_vocab);
    setFormGrammar(user.daily_grammar);
    setFormReading(user.daily_reading);
    setShowSetup(true);
  };

  const saveProfile = async () => {
    if (!formName.trim()) return;
    const saved = await upsertUser(userId, {
      name: formName.trim(),
      level: formLevel,
      daily_flashcard: formFlashcard,
      daily_vocab: formVocab,
      daily_grammar: formGrammar,
      daily_reading: formReading,
    });
    setUser(saved);
    setShowSetup(false);
  };

  const markComplete = async (quest: keyof DailyQuests) => {
    const updated = await completeDailyQuest(userId, quest);
    setQuests(updated);
    const p = await getProgress(userId);
    setProgressState(p);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  // --- 프로필 설정 화면 ---
  if (showSetup) {
    return (
      <div className="space-y-6">
        {/* 유저 선택 (항상 상단에) */}
        <div className="flex gap-2 justify-center">
          {USER_IDS.map((id) => (
            <button
              key={id}
              onClick={() => switchUser(id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                userId === id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-105"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {id === "me" ? "유저 1" : "유저 2"}
            </button>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-center">
          {user ? "목표 수정" : "프로필 설정"}
        </h1>

        <div className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">이름</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          {/* 목표 레벨 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">목표 레벨</label>
            <div className="flex gap-2">
              {(["N5", "N4", "N3"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setFormLevel(l)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formLevel === l
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* 일일 목표량 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">일일 목표량</label>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">단어 암기</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={formFlashcard}
                  onChange={(e) => setFormFlashcard(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-10 text-right">{formFlashcard}장</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">어휘 문제</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={formVocab}
                  onChange={(e) => setFormVocab(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-10 text-right">{formVocab}개</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">문법 문제</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={formGrammar}
                  onChange={(e) => setFormGrammar(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-10 text-right">{formGrammar}개</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">독해 문제</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={formReading}
                  onChange={(e) => setFormReading(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-10 text-right">{formReading}개</span>
              </div>
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={!formName.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-40"
          >
            {user ? "저장" : "시작하기"}
          </button>

          {user && (
            <button
              onClick={() => setShowSetup(false)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- 메인 대시보드 ---
  if (!user || !quests || !progress) return null;

  const questDefs = [
    {
      key: "flashcard" as const,
      title: "단어 암기",
      desc: `플래시카드 ${user.daily_flashcard}장 학습`,
      href: "/flashcard",
      icon: "1",
    },
    {
      key: "vocabulary" as const,
      title: "어휘 문제",
      desc: `어휘 문제 ${user.daily_vocab}개 풀기`,
      href: "/vocabulary",
      icon: "2",
    },
    {
      key: "grammar" as const,
      title: "문법 문제",
      desc: `문법 문제 ${user.daily_grammar}개 풀기`,
      href: "/grammar",
      icon: "3",
    },
    {
      key: "reading" as const,
      title: "독해",
      desc: `독해 문제 ${user.daily_reading}개 풀기`,
      href: "/reading",
      icon: "4",
    },
  ];

  const completedCount = Object.values(quests).filter(Boolean).length;
  const allDone = completedCount === 4;
  const currentQuestIdx = questDefs.findIndex((q) => !quests[q.key]);

  return (
    <div className="space-y-6">
      {/* 유저 선택 */}
      <div className="flex gap-2 justify-center">
        {USER_IDS.map((id) => (
          <button
            key={id}
            onClick={() => switchUser(id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              userId === id
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-105"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {id === userId && user ? user.name : id === "me" ? "유저 1" : "유저 2"}
          </button>
        ))}
      </div>

      {/* 인사 & 진도 */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold">{user.name}의 학습</h1>
          <button
            onClick={openEdit}
            className="text-gray-400 hover:text-violet-500 transition-colors"
            title="목표 수정"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
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
          <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
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
          <p className="font-bold text-green-700 dark:text-green-400">오늘 퀘스트 올클리어!</p>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">내일도 화이팅!</p>
        </div>
      )}

      {/* 퀘스트 목록 */}
      <div className="space-y-3">
        {questDefs.map((q, idx) => {
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
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{q.title}</div>
                  <div className="text-xs text-gray-500">{q.desc}</div>
                </div>
                {done ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">완료</span>
                ) : isCurrent ? (
                  <Link
                    href={q.href}
                    className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shrink-0"
                  >
                    시작
                  </Link>
                ) : isLocked ? (
                  <span className="text-xs text-gray-400 shrink-0">잠김</span>
                ) : (
                  <Link
                    href={q.href}
                    className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors shrink-0"
                  >
                    시작
                  </Link>
                )}
              </div>
              {isCurrent && (
                <div className="absolute -left-px top-0 bottom-0 w-1 rounded-full bg-violet-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* 퀘스트 완료 버튼 */}
      {currentQuestIdx >= 0 && (
        <button
          onClick={() => markComplete(questDefs[currentQuestIdx].key)}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
        >
          &quot;{questDefs[currentQuestIdx].title}&quot; 완료 체크
        </button>
      )}
    </div>
  );
}
