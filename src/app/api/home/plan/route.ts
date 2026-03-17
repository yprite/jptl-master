import { NextRequest, NextResponse } from "next/server";
import { saveSharedRemotePlan } from "@/lib/home-state-server";
import type { StudyPlanDraft, UserId } from "@/lib/user-store";

export const runtime = "nodejs";

const VALID_USER_IDS = new Set<UserId>(["me", "wife"]);

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
    const body = (await request.json()) as { userId?: unknown; plan?: unknown };
    parseUserId(body.userId);
    if (!isRecord(body.plan)) {
      throw new Error("Invalid plan");
    }

    const plan: StudyPlanDraft = {
      totalDays: Number(body.plan.totalDays ?? 84),
      dailyFlashcard: Number(body.plan.dailyFlashcard ?? 10),
      dailyVocabulary: Number(body.plan.dailyVocabulary ?? 5),
      dailyGrammar: Number(body.plan.dailyGrammar ?? 5),
      dailyReading: Number(body.plan.dailyReading ?? 2),
    };

    const saved = await saveSharedRemotePlan(plan);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
