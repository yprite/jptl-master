import { NextRequest, NextResponse } from "next/server";
import { saveUserProfile } from "@/lib/home-state-server";
import type { UserId } from "@/lib/user-store";

export const runtime = "nodejs";

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

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { userId?: unknown; profile?: unknown };
    const userId = parseUserId(body.userId);
    if (!isRecord(body.profile)) {
      throw new Error("Invalid profile");
    }

    const { name, level } = body.profile;
    if (typeof name !== "string" || !VALID_LEVELS.has(String(level))) {
      throw new Error("Invalid profile");
    }

    const user = await saveUserProfile(userId, {
      name,
      level: level as "N3" | "N4" | "N5",
      daily_flashcard: Number(body.profile.daily_flashcard ?? 10),
      daily_vocab: Number(body.profile.daily_vocab ?? 5),
      daily_grammar: Number(body.profile.daily_grammar ?? 5),
      daily_reading: Number(body.profile.daily_reading ?? 2),
    });

    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
