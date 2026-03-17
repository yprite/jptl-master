import { NextRequest, NextResponse } from "next/server";
import { resetRemoteFlashcardSrs } from "@/lib/flashcard-srs-server";
import { resetRemoteState } from "@/lib/home-state-server";
import type { UserId } from "@/lib/user-store";

export const runtime = "nodejs";

const VALID_USER_IDS = new Set<UserId>(["me", "wife"]);

function parseUserId(value: unknown): UserId {
  if (typeof value === "string" && VALID_USER_IDS.has(value as UserId)) {
    return value as UserId;
  }
  throw new Error("Invalid userId");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { userId?: unknown };
    const userId = parseUserId(body.userId);
    const [state] = await Promise.all([
      resetRemoteState(userId),
      resetRemoteFlashcardSrs(userId),
    ]);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
