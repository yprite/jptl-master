import type { StudyPlan } from "./user-store";

const MS_PER_DAY = 86_400_000;

export function getPlanDayNumber(plan: StudyPlan | null, now: Date = new Date()): number {
  if (!plan) return 1;

  const startDate = new Date(`${plan.startDate}T00:00:00`);
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / MS_PER_DAY));

  return Math.min(plan.totalDays, diffDays + 1);
}

export function getDailyStudyItems<T>(
  items: T[],
  currentDay: number,
  dailyCount: number
): T[] {
  const safeCount = Math.max(0, Math.floor(dailyCount));
  if (!items.length || safeCount === 0) {
    return [];
  }

  if (safeCount >= items.length) {
    return items.slice();
  }

  const startIndex = ((Math.max(1, currentDay) - 1) * safeCount) % items.length;
  const endIndex = startIndex + safeCount;

  if (endIndex <= items.length) {
    return items.slice(startIndex, endIndex);
  }

  return items.slice(startIndex).concat(items.slice(0, endIndex - items.length));
}
