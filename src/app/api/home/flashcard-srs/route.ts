import { NextRequest, NextResponse } from "next/server";
import {
  getRemoteFlashcardSrs,
  normalizeFlashcardSrsState,
  resetRemoteFlashcardSrs,
  saveRemoteFlashcardSrs,
} from "@/lib/flashcard-srs-server";
import type { StudyLevel } from "@/lib/study-data-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type UserId = "me" | "wife";

const VALID_USER_IDS = new Set<UserId>(["me", "wife"]);
const VALID_LEVELS = new Set<StudyLevel>(["N5", "N4", "N3"]);

function parseUserId(value: unknown): UserId {
  if (typeof value === "string" && VALID_USER_IDS.has(value as UserId)) {
    return value as UserId;
  }

  throw new Error("Invalid userId");
}

function parseLevel(value: unknown): StudyLevel {
  if (typeof value === "string" && VALID_LEVELS.has(value as StudyLevel)) {
    return value as StudyLevel;
  }

  throw new Error("Invalid level");
}

function jsonError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ message }, { status: 500 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = parseUserId(request.nextUrl.searchParams.get("user_id"));
    const level = parseLevel(request.nextUrl.searchParams.get("level"));
    const state = await getRemoteFlashcardSrs(userId, level);
    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      userId?: unknown;
      level?: unknown;
      state?: unknown;
    };
    const userId = parseUserId(body.userId);
    const level = parseLevel(body.level);
    const state = normalizeFlashcardSrsState(body.state);
    const saved = await saveRemoteFlashcardSrs(userId, level, state);
    return NextResponse.json(saved);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = parseUserId(request.nextUrl.searchParams.get("user_id"));
    await resetRemoteFlashcardSrs(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
