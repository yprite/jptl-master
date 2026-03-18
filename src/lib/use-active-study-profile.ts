"use client";

import { useEffect, useState } from "react";
import {
  getSelectedUserId,
  getHomeState,
  type StudyPlan,
  type UserId,
} from "@/lib/user-store";
import { getPlanDayNumber } from "@/lib/study-plan";

export type StudyLevel = "N5" | "N4" | "N3";
export type SupportedStudyLevel = StudyLevel;

const USER_LABELS: Record<UserId, string> = {
  me: "용훈",
  wife: "지혜",
};

export function useActiveStudyProfile() {
  const [userId, setUserId] = useState<UserId | null>(null);
  const [level, setLevel] = useState<StudyLevel | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [requiresSelection, setRequiresSelection] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const nextUserId = getSelectedUserId();
      if (!nextUserId) {
        if (!cancelled) {
          setUserId(null);
          setLevel("N4");
          setPlan(null);
          setCurrentDay(1);
          setRequiresSelection(true);
        }
        return;
      }

      if (!cancelled) {
        setRequiresSelection(false);
      }
      setUserId(nextUserId);

      try {
        const state = await getHomeState(nextUserId);
        if (!cancelled) {
          setLevel(state.user?.level ?? "N4");
          setPlan(state.plan);
          setCurrentDay(getPlanDayNumber(state.plan));
        }
      } catch {
        if (!cancelled) {
          setLevel("N4");
          setPlan(null);
          setCurrentDay(1);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading: level === null && !requiresSelection,
    requiresSelection,
    level: level ?? "N4",
    supportedLevel: (level ?? "N4") as SupportedStudyLevel,
    userId,
    userLabel: userId ? USER_LABELS[userId] : null,
    plan,
    currentDay,
  };
}
