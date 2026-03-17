import type { Difficulty } from "./spaced-repetition";
import type { StudyFlashcard, StudyLevel } from "./study-data-types";

export type FlashcardSrsUserId = "me" | "wife";

export interface FlashcardReviewRecord {
  cardId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string;
  lastDifficulty: Difficulty;
  reviewCount: number;
}

export interface FlashcardSrsState {
  updatedAt: string;
  reviews: Record<string, FlashcardReviewRecord>;
}

type PersistenceMode = "local" | "remote";

const VALID_LEVELS: StudyLevel[] = ["N5", "N4", "N3"];
const VALID_DIFFICULTIES: Difficulty[] = ["again", "hard", "good", "easy"];
const CONFIGURED_MODE: PersistenceMode =
  process.env.NEXT_PUBLIC_PERSISTENCE_MODE === "local" ? "local" : "remote";

let runtimeMode: PersistenceMode = CONFIGURED_MODE;
let loggedFallback = false;

function createEmptyState(): FlashcardSrsState {
  return {
    updatedAt: "",
    reviews: {},
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function localStorageKey(userId: FlashcardSrsUserId, level: StudyLevel): string {
  return `jptl-flashcard-srs:${userId}:${level}`;
}

function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value === "string" && VALID_DIFFICULTIES.includes(value as Difficulty)) {
    return value as Difficulty;
  }

  return "good";
}

function normalizeReviewRecord(value: unknown): FlashcardReviewRecord | null {
  if (!isRecord(value) || typeof value.cardId !== "string") {
    return null;
  }

  return {
    cardId: value.cardId,
    easeFactor: Number(value.easeFactor ?? 2.5),
    intervalDays: Number(value.intervalDays ?? 0),
    repetitions: Number(value.repetitions ?? 0),
    nextReviewAt:
      typeof value.nextReviewAt === "string"
        ? value.nextReviewAt
        : new Date().toISOString(),
    lastReviewedAt:
      typeof value.lastReviewedAt === "string"
        ? value.lastReviewedAt
        : new Date().toISOString(),
    lastDifficulty: normalizeDifficulty(value.lastDifficulty),
    reviewCount: Math.max(1, Number(value.reviewCount ?? 1)),
  };
}

function normalizeFlashcardSrsState(value: unknown): FlashcardSrsState {
  if (!isRecord(value)) {
    return createEmptyState();
  }

  const sourceReviews = isRecord(value.reviews) ? value.reviews : {};
  const reviews: Record<string, FlashcardReviewRecord> = {};

  for (const [cardId, rawRecord] of Object.entries(sourceReviews)) {
    const normalized = normalizeReviewRecord(rawRecord);
    if (!normalized) continue;
    reviews[cardId] = normalized;
  }

  return {
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    reviews,
  };
}

function readLocalState(userId: FlashcardSrsUserId, level: StudyLevel): FlashcardSrsState {
  if (!canUseStorage()) {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(localStorageKey(userId, level));
    return raw ? normalizeFlashcardSrsState(JSON.parse(raw)) : createEmptyState();
  } catch {
    return createEmptyState();
  }
}

function writeLocalState(
  userId: FlashcardSrsUserId,
  level: StudyLevel,
  state: FlashcardSrsState
): FlashcardSrsState {
  const normalized = normalizeFlashcardSrsState(state);
  if (!canUseStorage()) {
    return normalized;
  }

  try {
    window.localStorage.setItem(
      localStorageKey(userId, level),
      JSON.stringify(normalized)
    );
  } catch {
    // Ignore storage failures and keep the page usable.
  }

  return normalized;
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
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "unknown";
  console.warn(`[flashcard-srs] Falling back to localStorage: ${message}`);
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

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

export function buildFlashcardId(card: StudyFlashcard, index: number): string {
  const seed = `${card.level}|${index}|${card.word}|${card.reading ?? ""}|${card.meaning}|${card.example ?? ""}`;
  return `fc-${card.level.toLowerCase()}-${index.toString(36)}-${hashString(seed)}`;
}

export async function getFlashcardSrsState(
  userId: FlashcardSrsUserId,
  level: StudyLevel
): Promise<FlashcardSrsState> {
  if (!VALID_LEVELS.includes(level)) {
    return createEmptyState();
  }

  const localState = readLocalState(userId, level);
  if (isLocalMode()) {
    return localState;
  }

  try {
    const remoteState = await requestJson<FlashcardSrsState>(
      `/api/home/flashcard-srs?user_id=${userId}&level=${level}&ts=${Date.now()}`
    );
    return writeLocalState(userId, level, remoteState);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return localState;
    }
    throw error;
  }
}

export async function saveFlashcardSrsState(
  userId: FlashcardSrsUserId,
  level: StudyLevel,
  state: FlashcardSrsState
): Promise<FlashcardSrsState> {
  const normalized = normalizeFlashcardSrsState(state);

  if (isLocalMode()) {
    return writeLocalState(userId, level, normalized);
  }

  try {
    const remoteState = await requestJson<FlashcardSrsState>("/api/home/flashcard-srs", {
      method: "PUT",
      body: JSON.stringify({ userId, level, state: normalized }),
    });
    return writeLocalState(userId, level, remoteState);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      activateLocalFallback(error);
      return writeLocalState(userId, level, normalized);
    }
    throw error;
  }
}

export function resetLocalFlashcardSrs(userId: FlashcardSrsUserId): void {
  if (!canUseStorage()) return;

  for (const level of VALID_LEVELS) {
    window.localStorage.removeItem(localStorageKey(userId, level));
  }
}
