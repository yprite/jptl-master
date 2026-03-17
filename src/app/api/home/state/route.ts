import { NextRequest, NextResponse } from "next/server";
import { getRemoteState, replaceRemoteState } from "@/lib/home-state-server";
import type { User } from "@/lib/database.types";
import type {
  DailyQuests,
  HomeState,
  StudyPlan,
  UserId,
  UserProgress,
} from "@/lib/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_USER_IDS = new Set<UserId>(["me", "wife"]);
const VALID_LEVELS = new Set(["N3", "N4", "N5"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseUserId(value: unknown): UserId {
  if (typeof value === "string" && VALID_USER_IDS.has(value as UserId)) {
    return value as UserId;
  }
  throw new Error("Invalid userId");
}

function parseQuests(value: unknown): DailyQuests {
  if (!isRecord(value)) throw new Error("Invalid quests");

  return {
    flashcard: value.flashcard === true,
    vocabulary: value.vocabulary === true,
    grammar: value.grammar === true,
    reading: value.reading === true,
  };
}

function parseProgress(value: unknown): UserProgress {
  if (!isRecord(value)) throw new Error("Invalid progress");

  return {
    totalDays: Number(value.totalDays ?? 0),
    flashcardCount: Number(value.flashcardCount ?? 0),
    vocabCount: Number(value.vocabCount ?? 0),
    grammarCount: Number(value.grammarCount ?? 0),
    readingCount: Number(value.readingCount ?? 0),
  };
}

function parseUser(value: unknown, userId: UserId): User | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) throw new Error("Invalid user");
  if (typeof value.name !== "string" || !VALID_LEVELS.has(String(value.level))) {
    throw new Error("Invalid user");
  }

  return {
    id: userId,
    name: value.name,
    level: value.level as User["level"],
    daily_flashcard: Number(value.daily_flashcard ?? 10),
    daily_vocab: Number(value.daily_vocab ?? 5),
    daily_grammar: Number(value.daily_grammar ?? 5),
    daily_reading: Number(value.daily_reading ?? 2),
    created_at:
      typeof value.created_at === "string" ? value.created_at : new Date().toISOString(),
  };
}

function parsePlan(value: unknown): StudyPlan | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) throw new Error("Invalid plan");

  return {
    totalDays: Number(value.totalDays ?? 84),
    dailyFlashcard: Number(value.dailyFlashcard ?? 10),
    dailyVocabulary: Number(value.dailyVocabulary ?? 5),
    dailyGrammar: Number(value.dailyGrammar ?? 5),
    dailyReading: Number(value.dailyReading ?? 2),
    startDate: typeof value.startDate === "string" ? value.startDate : new Date().toISOString(),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

function jsonError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ message }, { status: 500 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = parseUserId(request.nextUrl.searchParams.get("user_id"));
    const state = await getRemoteState(userId);
    return NextResponse.json(state satisfies HomeState, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { userId?: unknown; state?: unknown };
    const userId = parseUserId(body.userId);
    if (!isRecord(body.state)) {
      throw new Error("Invalid state");
    }

    const state: HomeState = {
      user: parseUser(body.state.user, userId),
      plan: parsePlan(body.state.plan),
      quests: parseQuests(body.state.quests),
      progress: parseProgress(body.state.progress),
    };

    const saved = await replaceRemoteState(userId, state);
    return NextResponse.json(saved);
  } catch (error) {
    return jsonError(error);
  }
}
