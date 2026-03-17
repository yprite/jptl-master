/**
 * 2-user storage for the personalized home screen.
 * Defaults to localStorage so the app still works before Supabase tables exist.
 */

import { getSupabase } from "./supabase";
import type { DailyQuest, User } from "./database.types";

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

export interface UserProgress {
  totalDays: number;
  flashcardCount: number;
  vocabCount: number;
  grammarCount: number;
  readingCount: number;
}

type PersistenceMode = "local" | "supabase";
type LocalQuestRow = Pick<
  DailyQuest,
  "user_id" | "date" | "flashcard" | "vocabulary" | "grammar" | "reading"
>;

const STORAGE_KEY_USER = "jptl-current-user";
const STORAGE_KEY_USERS = "jptl-users";
const STORAGE_KEY_QUESTS = "jptl-daily-quests";
const DEFAULT_DAILY_QUESTS: DailyQuests = {
  flashcard: false,
  vocabulary: false,
  grammar: false,
  reading: false,
};
const CONFIGURED_MODE: PersistenceMode =
  process.env.NEXT_PUBLIC_PERSISTENCE_MODE === "supabase" ? "supabase" : "local";

let runtimeMode: PersistenceMode = CONFIGURED_MODE;
let loggedFallback = false;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private mode failures and keep the UI usable.
  }
}

function getLocalUsers(): Partial<Record<UserId, User>> {
  return readJson<Partial<Record<UserId, User>>>(STORAGE_KEY_USERS, {});
}

function setLocalUsers(users: Partial<Record<UserId, User>>): void {
  writeJson(STORAGE_KEY_USERS, users);
}

function getLocalQuestRows(): LocalQuestRow[] {
  return readJson<LocalQuestRow[]>(STORAGE_KEY_QUESTS, []);
}

function setLocalQuestRows(rows: LocalQuestRow[]): void {
  writeJson(STORAGE_KEY_QUESTS, rows);
}

function toLocalUser(
  id: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>,
  existing?: User | null
): User {
  return {
    id,
    name: profile.name,
    level: profile.level,
    daily_flashcard: profile.daily_flashcard ?? existing?.daily_flashcard ?? 10,
    daily_vocab: profile.daily_vocab ?? existing?.daily_vocab ?? 5,
    daily_grammar: profile.daily_grammar ?? existing?.daily_grammar ?? 5,
    daily_reading: profile.daily_reading ?? existing?.daily_reading ?? 2,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
}

function getLocalUser(id: UserId): User | null {
  return getLocalUsers()[id] ?? null;
}

function upsertLocalUser(
  id: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>
): User {
  const users = getLocalUsers();
  const user = toLocalUser(id, profile, users[id] ?? null);
  users[id] = user;
  setLocalUsers(users);
  return user;
}

function getLocalDailyQuests(userId: UserId): DailyQuests {
  const row = getLocalQuestRows().find(
    (entry) => entry.user_id === userId && entry.date === today()
  );
  return row
    ? {
        flashcard: row.flashcard,
        vocabulary: row.vocabulary,
        grammar: row.grammar,
        reading: row.reading,
      }
    : { ...DEFAULT_DAILY_QUESTS };
}

function upsertLocalDailyQuest(userId: UserId, quest: keyof DailyQuests): DailyQuests {
  const rows = getLocalQuestRows();
  const date = today();
  const existingIndex = rows.findIndex(
    (entry) => entry.user_id === userId && entry.date === date
  );
  const existing =
    existingIndex >= 0
      ? rows[existingIndex]
      : { user_id: userId, date, ...DEFAULT_DAILY_QUESTS };
  const updated = { ...existing, [quest]: true };

  if (existingIndex >= 0) {
    rows[existingIndex] = updated;
  } else {
    rows.push(updated);
  }

  setLocalQuestRows(rows);
  return {
    flashcard: updated.flashcard,
    vocabulary: updated.vocabulary,
    grammar: updated.grammar,
    reading: updated.reading,
  };
}

function summarizeProgress(rows: LocalQuestRow[]): UserProgress {
  if (rows.length === 0) {
    return { totalDays: 0, flashcardCount: 0, vocabCount: 0, grammarCount: 0, readingCount: 0 };
  }

  let totalDays = 0;
  let flashcardCount = 0;
  let vocabCount = 0;
  let grammarCount = 0;
  let readingCount = 0;

  for (const row of rows) {
    if (row.flashcard) flashcardCount += 1;
    if (row.vocabulary) vocabCount += 1;
    if (row.grammar) grammarCount += 1;
    if (row.reading) readingCount += 1;
    if (row.flashcard && row.vocabulary && row.grammar && row.reading) {
      totalDays += 1;
    }
  }

  return { totalDays, flashcardCount, vocabCount, grammarCount, readingCount };
}

function getLocalProgress(userId: UserId): UserProgress {
  return summarizeProgress(getLocalQuestRows().filter((row) => row.user_id === userId));
}

function shouldUseLocalFallback(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("Failed to fetch")
  );
}

function activateLocalFallback(error: unknown): void {
  runtimeMode = "local";
  if (loggedFallback) return;
  loggedFallback = true;

  const message =
    error && typeof error === "object" && "message" in error ? String(error.message) : "unknown";
  console.warn(`[user-store] Falling back to localStorage: ${message}`);
}

function isLocalMode(): boolean {
  return runtimeMode === "local";
}

function syncLocalUser(user: User): User {
  const users = getLocalUsers();
  users[user.id as UserId] = user;
  setLocalUsers(users);
  return user;
}

function syncLocalQuest(userId: UserId, quests: DailyQuests): void {
  const rows = getLocalQuestRows();
  const date = today();
  const nextRow: LocalQuestRow = { user_id: userId, date, ...quests };
  const existingIndex = rows.findIndex(
    (entry) => entry.user_id === userId && entry.date === date
  );

  if (existingIndex >= 0) {
    rows[existingIndex] = nextRow;
  } else {
    rows.push(nextRow);
  }

  setLocalQuestRows(rows);
}

export function getCurrentUserId(): UserId {
  if (!canUseStorage()) return "me";
  return (window.localStorage.getItem(STORAGE_KEY_USER) as UserId) || "me";
}

export function setCurrentUserId(id: UserId): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY_USER, id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabase();
}

export async function getUser(id: UserId): Promise<User | null> {
  if (isLocalMode()) return getLocalUser(id);

  try {
    const { data, error } = await db().from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? syncLocalUser(data as User) : null;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return getLocalUser(id);
    }
    throw error;
  }
}

export async function upsertUser(
  id: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>
): Promise<User> {
  if (isLocalMode()) return upsertLocalUser(id, profile);

  try {
    const payload = {
      id,
      name: profile.name,
      level: profile.level,
      daily_flashcard: profile.daily_flashcard ?? 10,
      daily_vocab: profile.daily_vocab ?? 5,
      daily_grammar: profile.daily_grammar ?? 5,
      daily_reading: profile.daily_reading ?? 2,
    };

    const { data, error } = await db().from("users").upsert(payload).select().single();
    if (error) throw error;
    return syncLocalUser(data as User);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return upsertLocalUser(id, profile);
    }
    throw error;
  }
}

export async function getDailyQuests(userId: UserId): Promise<DailyQuests> {
  if (isLocalMode()) return getLocalDailyQuests(userId);

  try {
    const { data, error } = await db()
      .from("daily_quests")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today())
      .maybeSingle();
    if (error) throw error;

    const row = data as DailyQuest | null;
    const quests = row
      ? {
          flashcard: row.flashcard,
          vocabulary: row.vocabulary,
          grammar: row.grammar,
          reading: row.reading,
        }
      : { ...DEFAULT_DAILY_QUESTS };

    syncLocalQuest(userId, quests);
    return quests;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return getLocalDailyQuests(userId);
    }
    throw error;
  }
}

export async function completeDailyQuest(
  userId: UserId,
  quest: keyof DailyQuests
): Promise<DailyQuests> {
  if (isLocalMode()) return upsertLocalDailyQuest(userId, quest);

  const existing = await getDailyQuests(userId);
  const updated = { ...existing, [quest]: true };

  try {
    const { error } = await db().from("daily_quests").upsert({
      user_id: userId,
      date: today(),
      flashcard: updated.flashcard,
      vocabulary: updated.vocabulary,
      grammar: updated.grammar,
      reading: updated.reading,
    });
    if (error) throw error;

    syncLocalQuest(userId, updated);
    return updated;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return upsertLocalDailyQuest(userId, quest);
    }
    throw error;
  }
}

export async function getProgress(userId: UserId): Promise<UserProgress> {
  if (isLocalMode()) return getLocalProgress(userId);

  try {
    const { data, error } = await db().from("daily_quests").select("*").eq("user_id", userId);
    if (error) throw error;

    const rows = (data as DailyQuest[] | null) || [];
    writeJson(
      STORAGE_KEY_QUESTS,
      rows.map((row) => ({
        user_id: row.user_id,
        date: row.date,
        flashcard: row.flashcard,
        vocabulary: row.vocabulary,
        grammar: row.grammar,
        reading: row.reading,
      }))
    );
    return summarizeProgress(rows);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return getLocalProgress(userId);
    }
    throw error;
  }
}
