/**
 * 2-user storage for the personalized home screen.
 * Uses same-origin API routes for remote persistence and falls back to localStorage.
 */

import type { User } from "./database.types";

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

export interface StudyPlan {
  totalDays: number;
  dailyFlashcard: number;
  dailyVocabulary: number;
  dailyGrammar: number;
  dailyReading: number;
  startDate: string;
  createdAt: string;
}

export interface StudyPlanDraft {
  totalDays: number;
  dailyFlashcard: number;
  dailyVocabulary: number;
  dailyGrammar: number;
  dailyReading: number;
}

export interface HomeState {
  user: User | null;
  plan: StudyPlan | null;
  quests: DailyQuests;
  progress: UserProgress;
}

type PersistenceMode = "local" | "remote";
type LocalQuestRow = {
  user_id: UserId;
  date: string;
  flashcard: boolean;
  vocabulary: boolean;
  grammar: boolean;
  reading: boolean;
};

const STORAGE_KEY_USER = "jptl-current-user";
const STORAGE_KEY_USERS = "jptl-users";
const STORAGE_KEY_PLANS = "jptl-study-plans";
const STORAGE_KEY_QUESTS = "jptl-daily-quests";
const STORAGE_KEY_PROGRESS = "jptl-progress-cache";
const DEFAULT_DAILY_QUESTS: DailyQuests = {
  flashcard: false,
  vocabulary: false,
  grammar: false,
  reading: false,
};
const DEFAULT_PROGRESS: UserProgress = {
  totalDays: 0,
  flashcardCount: 0,
  vocabCount: 0,
  grammarCount: 0,
  readingCount: 0,
};
const CONFIGURED_MODE: PersistenceMode =
  process.env.NEXT_PUBLIC_PERSISTENCE_MODE === "local" ? "local" : "remote";

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

function clearLocalUser(id: UserId): void {
  const users = getLocalUsers();
  delete users[id];
  setLocalUsers(users);
}

function getLocalPlans(): Partial<Record<UserId, StudyPlan | null>> {
  return readJson<Partial<Record<UserId, StudyPlan | null>>>(STORAGE_KEY_PLANS, {});
}

function setLocalPlans(plans: Partial<Record<UserId, StudyPlan | null>>): void {
  writeJson(STORAGE_KEY_PLANS, plans);
}

function getLocalQuestRows(): LocalQuestRow[] {
  return readJson<LocalQuestRow[]>(STORAGE_KEY_QUESTS, []);
}

function setLocalQuestRows(rows: LocalQuestRow[]): void {
  writeJson(STORAGE_KEY_QUESTS, rows);
}

function getLocalProgressCache(): Partial<Record<UserId, UserProgress>> {
  return readJson<Partial<Record<UserId, UserProgress>>>(STORAGE_KEY_PROGRESS, {});
}

function setLocalProgressCache(progress: Partial<Record<UserId, UserProgress>>): void {
  writeJson(STORAGE_KEY_PROGRESS, progress);
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

function toLocalPlan(draft: StudyPlanDraft): StudyPlan {
  return {
    totalDays: draft.totalDays,
    dailyFlashcard: draft.dailyFlashcard,
    dailyVocabulary: draft.dailyVocabulary,
    dailyGrammar: draft.dailyGrammar,
    dailyReading: draft.dailyReading,
    startDate: today(),
    createdAt: new Date().toISOString(),
  };
}

function getLocalUser(id: UserId): User | null {
  return getLocalUsers()[id] ?? null;
}

function setLocalUser(user: User): User {
  const users = getLocalUsers();
  users[user.id as UserId] = user;
  setLocalUsers(users);
  return user;
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

function getLocalPlan(userId: UserId): StudyPlan | null {
  return getLocalPlans()[userId] ?? null;
}

function setLocalPlan(userId: UserId, plan: StudyPlan | null): StudyPlan | null {
  const plans = getLocalPlans();
  plans[userId] = plan;
  setLocalPlans(plans);
  return plan;
}

function saveLocalPlan(userId: UserId, draft: StudyPlanDraft): StudyPlan {
  const plan = toLocalPlan(draft);
  setLocalPlan(userId, plan);
  return plan;
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

function syncLocalProgress(userId: UserId, progress: UserProgress): void {
  const cache = getLocalProgressCache();
  cache[userId] = progress;
  setLocalProgressCache(cache);
}

function resetLocalState(userId: UserId): HomeState {
  const users = getLocalUsers();
  delete users[userId];
  setLocalUsers(users);

  const plans = getLocalPlans();
  delete plans[userId];
  setLocalPlans(plans);

  const progress = getLocalProgressCache();
  delete progress[userId];
  setLocalProgressCache(progress);

  setLocalQuestRows(getLocalQuestRows().filter((row) => row.user_id !== userId));

  return {
    user: null,
    plan: null,
    quests: { ...DEFAULT_DAILY_QUESTS },
    progress: { ...DEFAULT_PROGRESS },
  };
}

function upsertLocalDailyQuest(userId: UserId, quest: keyof DailyQuests): HomeState {
  const rows = getLocalQuestRows();
  const date = today();
  const existingIndex = rows.findIndex(
    (entry) => entry.user_id === userId && entry.date === date
  );
  const existing =
    existingIndex >= 0
      ? rows[existingIndex]
      : { user_id: userId, date, ...DEFAULT_DAILY_QUESTS };

  if (existing[quest]) {
    return {
      user: getLocalUser(userId),
      plan: getLocalPlan(userId),
      quests: getLocalDailyQuests(userId),
      progress: getLocalProgress(userId),
    };
  }

  const updated = { ...existing, [quest]: true };
  if (existingIndex >= 0) {
    rows[existingIndex] = updated;
  } else {
    rows.push(updated);
  }
  setLocalQuestRows(rows);

  const progress = getLocalProgress(userId);
  const updatedProgress: UserProgress = { ...progress };
  if (quest === "flashcard") updatedProgress.flashcardCount += 1;
  if (quest === "vocabulary") updatedProgress.vocabCount += 1;
  if (quest === "grammar") updatedProgress.grammarCount += 1;
  if (quest === "reading") updatedProgress.readingCount += 1;

  const beforeComplete =
    existing.flashcard && existing.vocabulary && existing.grammar && existing.reading;
  const afterComplete =
    updated.flashcard && updated.vocabulary && updated.grammar && updated.reading;
  if (!beforeComplete && afterComplete) {
    updatedProgress.totalDays += 1;
  }

  syncLocalProgress(userId, updatedProgress);
  return {
    user: getLocalUser(userId),
    plan: getLocalPlan(userId),
    quests: {
      flashcard: updated.flashcard,
      vocabulary: updated.vocabulary,
      grammar: updated.grammar,
      reading: updated.reading,
    },
    progress: updatedProgress,
  };
}

function summarizeProgress(rows: LocalQuestRow[]): UserProgress {
  if (rows.length === 0) {
    return { ...DEFAULT_PROGRESS };
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
  const cached = getLocalProgressCache()[userId];
  if (cached) return cached;
  return summarizeProgress(getLocalQuestRows().filter((row) => row.user_id === userId));
}

function getLocalState(userId: UserId): HomeState {
  return {
    user: getLocalUser(userId),
    plan: getLocalPlan(userId),
    quests: getLocalDailyQuests(userId),
    progress: getLocalProgress(userId),
  };
}

function syncLocalState(userId: UserId, state: HomeState): HomeState {
  if (state.user) {
    setLocalUser(state.user);
  } else {
    clearLocalUser(userId);
  }
  setLocalPlan(userId, state.plan);
  syncLocalQuest(userId, state.quests);
  syncLocalProgress(userId, state.progress);
  return state;
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
    message.includes("Failed to fetch") ||
    message.includes("Missing SUPABASE") ||
    message.includes("Unexpected token <")
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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | { message?: string; code?: string }) : null;
  if (!response.ok) {
    const error = new Error(
      payload && typeof payload === "object" && payload && "message" in payload
        ? String(payload.message)
        : `Request failed: ${response.status}`
    ) as Error & { code?: string; status?: number };
    if (payload && typeof payload === "object" && "code" in payload) {
      error.code = String(payload.code);
    }
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

async function fetchRemoteState(userId: UserId): Promise<HomeState> {
  return requestJson<HomeState>(`/api/home/state?user_id=${userId}`);
}

export function getCurrentUserId(): UserId {
  if (!canUseStorage()) return "me";
  return (window.localStorage.getItem(STORAGE_KEY_USER) as UserId) || "me";
}

export function setCurrentUserId(id: UserId): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY_USER, id);
}

export async function getHomeState(userId: UserId): Promise<HomeState> {
  if (isLocalMode()) return getLocalState(userId);

  const localState = getLocalState(userId);

  try {
    const remoteState = await fetchRemoteState(userId);
    return syncLocalState(userId, remoteState);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return localState;
    }
    throw error;
  }
}

export async function getUser(id: UserId): Promise<User | null> {
  const state = await getHomeState(id);
  return state.user;
}

export async function upsertUser(
  id: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>
): Promise<User> {
  if (isLocalMode()) return upsertLocalUser(id, profile);

  try {
    const user = await requestJson<User>("/api/home/profile", {
      method: "PUT",
      body: JSON.stringify({ userId: id, profile }),
    });
    return setLocalUser(user);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return upsertLocalUser(id, profile);
    }
    throw error;
  }
}

export async function saveStudyPlan(userId: UserId, draft: StudyPlanDraft): Promise<StudyPlan> {
  if (isLocalMode()) return saveLocalPlan(userId, draft);

  try {
    const plan = await requestJson<StudyPlan>("/api/home/plan", {
      method: "PUT",
      body: JSON.stringify({ userId, plan: draft }),
    });
    setLocalPlan(userId, plan);
    return plan;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return saveLocalPlan(userId, draft);
    }
    throw error;
  }
}

export async function getDailyQuests(userId: UserId): Promise<DailyQuests> {
  const state = await getHomeState(userId);
  return state.quests;
}

export async function completeDailyQuest(
  userId: UserId,
  quest: keyof DailyQuests
): Promise<HomeState> {
  if (isLocalMode()) return upsertLocalDailyQuest(userId, quest);

  try {
    const payload = await requestJson<Pick<HomeState, "quests" | "progress">>("/api/home/quest", {
      method: "POST",
      body: JSON.stringify({ userId, quest }),
    });
    return syncLocalState(userId, {
      user: getLocalUser(userId),
      plan: getLocalPlan(userId),
      quests: payload.quests,
      progress: payload.progress,
    });
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return upsertLocalDailyQuest(userId, quest);
    }
    throw error;
  }
}

export async function getProgress(userId: UserId): Promise<UserProgress> {
  const state = await getHomeState(userId);
  return state.progress;
}

export async function resetUserState(userId: UserId): Promise<HomeState> {
  if (isLocalMode()) return resetLocalState(userId);

  try {
    const state = await requestJson<HomeState>("/api/home/reset", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    return syncLocalState(userId, state);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return resetLocalState(userId);
    }
    throw error;
  }
}
