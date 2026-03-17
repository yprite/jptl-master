"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUserId,
  getHomeState,
  type UserId,
} from "@/lib/user-store";

export type StudyLevel = "N5" | "N4" | "N3";
export type SupportedStudyLevel = StudyLevel;

const USER_LABELS: Record<UserId, string> = {
  me: "나",
  wife: "와이프",
};

export function useActiveStudyProfile() {
  const [userId, setUserId] = useState<UserId>("me");
  const [level, setLevel] = useState<StudyLevel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const nextUserId = getCurrentUserId();
      setUserId(nextUserId);

      try {
        const state = await getHomeState(nextUserId);
        if (!cancelled) {
          setLevel(state.user?.level ?? "N4");
        }
      } catch {
        if (!cancelled) {
          setLevel("N4");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading: level === null,
    level: level ?? "N4",
    supportedLevel: (level ?? "N4") as SupportedStudyLevel,
    userId,
    userLabel: USER_LABELS[userId],
  };
}
