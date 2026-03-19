import "server-only";

import type { Difficulty } from "./spaced-repetition";
import type { StudyLevel } from "./study-data-types";
import { readLatestJsonInFolder, writeJsonAtPath } from "./home-state-server";

type UserId = "me" | "wife";
type FlashcardPrioritySource = "reading-unknown-word";

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

export interface FlashcardPriorityRecord {
  cardId: string;
  source: FlashcardPrioritySource;
  boostedAt: string;
  boostCount: number;
  lastQuestionId: string | null;
}

export interface FlashcardSrsState {
  updatedAt: string;
  reviews: Record<string, FlashcardReviewRecord>;
  priorities: Record<string, FlashcardPriorityRecord>;
}

const VALID_LEVELS: StudyLevel[] = ["N5", "N4", "N3"];
const VALID_DIFFICULTIES: Difficulty[] = ["again", "hard", "good", "easy"];

function createEmptyState(): FlashcardSrsState {
  return {
    updatedAt: "",
    reviews: {},
    priorities: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function reviewStatePath(userId: UserId, level: StudyLevel): string {
  return `${reviewStateFolder(userId, level)}/${Date.now()}.json`;
}

function reviewStateFolder(userId: UserId, level: StudyLevel): string {
  return `srs-v2/${userId}/${level}`;
}

function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value === "string" && VALID_DIFFICULTIES.includes(value as Difficulty)) {
    return value as Difficulty;
  }

  return "good";
}

function normalizePrioritySource(value: unknown): FlashcardPrioritySource {
  return value === "reading-unknown-word" ? value : "reading-unknown-word";
}

function normalizeRecord(value: unknown): FlashcardReviewRecord | null {
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

function normalizePriorityRecord(value: unknown): FlashcardPriorityRecord | null {
  if (!isRecord(value) || typeof value.cardId !== "string") {
    return null;
  }

  return {
    cardId: value.cardId,
    source: normalizePrioritySource(value.source),
    boostedAt:
      typeof value.boostedAt === "string" ? value.boostedAt : new Date().toISOString(),
    boostCount: Math.max(1, Number(value.boostCount ?? 1)),
    lastQuestionId:
      typeof value.lastQuestionId === "string" ? value.lastQuestionId : null,
  };
}

export function normalizeFlashcardSrsState(value: unknown): FlashcardSrsState {
  if (!isRecord(value)) {
    return createEmptyState();
  }

  const sourceReviews = isRecord(value.reviews) ? value.reviews : {};
  const sourcePriorities = isRecord(value.priorities) ? value.priorities : {};
  const reviews: Record<string, FlashcardReviewRecord> = {};
  const priorities: Record<string, FlashcardPriorityRecord> = {};

  for (const [cardId, rawRecord] of Object.entries(sourceReviews)) {
    const normalized = normalizeRecord(rawRecord);
    if (!normalized) continue;
    reviews[cardId] = normalized;
  }

  for (const [cardId, rawRecord] of Object.entries(sourcePriorities)) {
    const normalized = normalizePriorityRecord(rawRecord);
    if (!normalized) continue;
    priorities[cardId] = normalized;
  }

  return {
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    reviews,
    priorities,
  };
}

export async function getRemoteFlashcardSrs(
  userId: UserId,
  level: StudyLevel
): Promise<FlashcardSrsState> {
  if (!VALID_LEVELS.includes(level)) {
    return createEmptyState();
  }

  const state = await readLatestJsonInFolder<FlashcardSrsState>(
    reviewStateFolder(userId, level)
  );
  return normalizeFlashcardSrsState(state);
}

export async function saveRemoteFlashcardSrs(
  userId: UserId,
  level: StudyLevel,
  state: unknown
): Promise<FlashcardSrsState> {
  const normalized = normalizeFlashcardSrsState(state);
  await writeJsonAtPath(reviewStatePath(userId, level), normalized);
  return normalized;
}

export async function resetRemoteFlashcardSrs(userId: UserId): Promise<void> {
  await Promise.all(
    VALID_LEVELS.map((level) => writeJsonAtPath(reviewStatePath(userId, level), createEmptyState()))
  );
}
