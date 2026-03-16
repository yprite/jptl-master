/**
 * 간단한 2인 유저 시스템 (localStorage 기반)
 * 유저는 "나"와 "와이프" 둘뿐.
 */

export type UserId = "me" | "wife";

export interface UserProfile {
  id: UserId;
  name: string;
  level: "N4" | "N3";
}

export const USERS: Record<UserId, UserProfile> = {
  me: { id: "me", name: "나", level: "N3" },
  wife: { id: "wife", name: "와이프", level: "N4" },
};

// 오늘의 퀘스트 완료 상태
export interface DailyQuests {
  flashcard: boolean;
  vocabulary: boolean;
  grammar: boolean;
  reading: boolean;
}

const STORAGE_KEY_USER = "jptl-current-user";
const STORAGE_KEY_QUESTS = "jptl-daily-quests";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function questKey(userId: UserId): string {
  return `${STORAGE_KEY_QUESTS}-${userId}-${today()}`;
}

// 누적 진도 키
function progressKey(userId: UserId): string {
  return `jptl-progress-${userId}`;
}

export interface UserProgress {
  totalDays: number; // 총 학습일수
  flashcardCount: number;
  vocabCount: number;
  grammarCount: number;
  readingCount: number;
}

export function getCurrentUser(): UserId {
  if (typeof window === "undefined") return "me";
  return (localStorage.getItem(STORAGE_KEY_USER) as UserId) || "me";
}

export function setCurrentUser(id: UserId): void {
  localStorage.setItem(STORAGE_KEY_USER, id);
}

export function getDailyQuests(userId: UserId): DailyQuests {
  if (typeof window === "undefined")
    return { flashcard: false, vocabulary: false, grammar: false, reading: false };
  const raw = localStorage.getItem(questKey(userId));
  if (!raw) return { flashcard: false, vocabulary: false, grammar: false, reading: false };
  return JSON.parse(raw);
}

export function completeDailyQuest(
  userId: UserId,
  quest: keyof DailyQuests
): DailyQuests {
  const quests = getDailyQuests(userId);
  const wasAllDone = Object.values(quests).every(Boolean);
  quests[quest] = true;
  localStorage.setItem(questKey(userId), JSON.stringify(quests));

  // 누적 진도 업데이트
  const prog = getProgress(userId);
  const countKey = quest === "flashcard" ? "flashcardCount"
    : quest === "vocabulary" ? "vocabCount"
    : quest === "grammar" ? "grammarCount"
    : "readingCount";
  prog[countKey]++;

  // 오늘 전부 완료하면 학습일수 +1
  const allDone = Object.values(quests).every(Boolean);
  if (allDone && !wasAllDone) {
    prog.totalDays++;
  }
  localStorage.setItem(progressKey(userId), JSON.stringify(prog));

  return quests;
}

export function getProgress(userId: UserId): UserProgress {
  if (typeof window === "undefined")
    return { totalDays: 0, flashcardCount: 0, vocabCount: 0, grammarCount: 0, readingCount: 0 };
  const raw = localStorage.getItem(progressKey(userId));
  if (!raw) return { totalDays: 0, flashcardCount: 0, vocabCount: 0, grammarCount: 0, readingCount: 0 };
  return JSON.parse(raw);
}
