/**
 * 2인 유저 시스템 (Supabase 기반)
 * 유저는 "me"와 "wife" 둘뿐. 인증 없이 simple text ID.
 */

import { getSupabase } from "./supabase";
import type { User, DailyQuest } from "./database.types";

export type UserId = "me" | "wife";

export interface DailyQuests {
  flashcard: boolean;
  vocabulary: boolean;
  grammar: boolean;
  reading: boolean;
}

export interface UserGoals {
  daily_flashcard: number;
  daily_vocab: number;
  daily_grammar: number;
  daily_reading: number;
}

const STORAGE_KEY_USER = "jptl-current-user";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- 현재 유저 (localStorage로 빠른 전환) ---

export function getCurrentUserId(): UserId {
  if (typeof window === "undefined") return "me";
  return (localStorage.getItem(STORAGE_KEY_USER) as UserId) || "me";
}

export function setCurrentUserId(id: UserId): void {
  localStorage.setItem(STORAGE_KEY_USER, id);
}

// --- 유저 프로필 (Supabase) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabase();
}

export async function getUser(id: UserId): Promise<User | null> {
  const { data } = await db()
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data as User | null;
}

export async function upsertUser(
  id: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>
): Promise<User> {
  const { data, error } = await db()
    .from("users")
    .upsert({
      id,
      name: profile.name,
      level: profile.level,
      daily_flashcard: profile.daily_flashcard ?? 10,
      daily_vocab: profile.daily_vocab ?? 5,
      daily_grammar: profile.daily_grammar ?? 5,
      daily_reading: profile.daily_reading ?? 2,
    })
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

// --- 오늘의 퀘스트 (Supabase) ---

export async function getDailyQuests(userId: UserId): Promise<DailyQuests> {
  const { data } = await db()
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today())
    .single();

  const row = data as DailyQuest | null;
  if (!row) {
    return { flashcard: false, vocabulary: false, grammar: false, reading: false };
  }
  return {
    flashcard: row.flashcard,
    vocabulary: row.vocabulary,
    grammar: row.grammar,
    reading: row.reading,
  };
}

export async function completeDailyQuest(
  userId: UserId,
  quest: keyof DailyQuests
): Promise<DailyQuests> {
  const existing = await getDailyQuests(userId);
  const updated = { ...existing, [quest]: true };

  await db().from("daily_quests").upsert({
    user_id: userId,
    date: today(),
    flashcard: updated.flashcard,
    vocabulary: updated.vocabulary,
    grammar: updated.grammar,
    reading: updated.reading,
  });

  return updated;
}

// --- 누적 통계 (Supabase에서 집계) ---

export interface UserProgress {
  totalDays: number;
  flashcardCount: number;
  vocabCount: number;
  grammarCount: number;
  readingCount: number;
}

export async function getProgress(userId: UserId): Promise<UserProgress> {
  const { data } = await db()
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId);

  const rows = (data as DailyQuest[] | null) || [];
  if (rows.length === 0) {
    return { totalDays: 0, flashcardCount: 0, vocabCount: 0, grammarCount: 0, readingCount: 0 };
  }

  let totalDays = 0;
  let flashcardCount = 0;
  let vocabCount = 0;
  let grammarCount = 0;
  let readingCount = 0;

  for (const row of rows) {
    if (row.flashcard) flashcardCount++;
    if (row.vocabulary) vocabCount++;
    if (row.grammar) grammarCount++;
    if (row.reading) readingCount++;
    if (row.flashcard && row.vocabulary && row.grammar && row.reading) totalDays++;
  }

  return { totalDays, flashcardCount, vocabCount, grammarCount, readingCount };
}
