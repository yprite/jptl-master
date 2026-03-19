"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  completeDailyQuest,
  type DailyQuests,
  type UserId,
} from "@/lib/user-store";

interface AutoCompleteQuestOptions {
  enabled: boolean;
  quest: keyof DailyQuests;
  userId: UserId | null;
}

export function useAutoCompleteQuest({
  enabled,
  quest,
  userId,
}: AutoCompleteQuestOptions) {
  const router = useRouter();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hasTriggeredRef.current = false;
      return;
    }

    if (!userId || hasTriggeredRef.current) {
      return;
    }

    const currentUserId = userId;
    hasTriggeredRef.current = true;
    let cancelled = false;

    async function completeAndReturn() {
      try {
        await completeDailyQuest(currentUserId, quest);
      } finally {
        if (!cancelled) {
          router.replace("/study");
        }
      }
    }

    void completeAndReturn();

    return () => {
      cancelled = true;
    };
  }, [enabled, quest, router, userId]);
}
