import { NextRequest, NextResponse } from "next/server";
import { completeRemoteQuest } from "@/lib/home-state-server";
import type { DailyQuests, UserId } from "@/lib/user-store";

export const runtime = "nodejs";

const VALID_USER_IDS = new Set<UserId>(["me", "wife"]);
const VALID_QUESTS = new Set<keyof DailyQuests>([
  "flashcard",
  "vocabulary",
  "grammar",
  "reading",
]);

function parseUserId(value: unknown): UserId {
  if (typeof value === "string" && VALID_USER_IDS.has(value as UserId)) {
    return value as UserId;
  }
  throw new Error("Invalid userId");
}

function parseQuest(value: unknown): keyof DailyQuests {
  if (typeof value === "string" && VALID_QUESTS.has(value as keyof DailyQuests)) {
    return value as keyof DailyQuests;
  }
  throw new Error("Invalid quest");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { userId?: unknown; quest?: unknown };
    const userId = parseUserId(body.userId);
    const quest = parseQuest(body.quest);
    const result = await completeRemoteQuest(userId, quest);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
