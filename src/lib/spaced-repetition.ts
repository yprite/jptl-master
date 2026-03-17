/**
 * Learning steps + review scheduling inspired by Anki.
 * New cards stay in minute-based learning steps before graduating to day-based review.
 */

export type Difficulty = "again" | "hard" | "good" | "easy";

interface ReviewResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReview: Date;
}

const MINUTE = 1 / (24 * 60);
const LEARNING_STEPS = [1 * MINUTE, 10 * MINUTE];
const HARD_LEARNING_STEP = 6 * MINUTE;
const GRADUATING_INTERVAL = 1;
const EASY_INTERVAL = 4;

function isLearningCard(intervalDays: number, repetitions: number): boolean {
  return intervalDays < 1 && repetitions <= LEARNING_STEPS.length;
}

function formatRoundedDate(offsetDays: number): Date {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
}

export function formatReviewInterval(intervalDays: number): string {
  if (intervalDays < 1 / 24) {
    return `${Math.max(1, Math.round(intervalDays * 24 * 60))}분`;
  }

  if (intervalDays < 1) {
    return `${Math.max(1, Math.round(intervalDays * 24))}시간`;
  }

  return `${Math.max(1, Math.round(intervalDays))}일`;
}

export function calculateNextReview(
  easeFactor: number,
  intervalDays: number,
  repetitions: number,
  difficulty: Difficulty
): ReviewResult {
  let newEase = Math.max(1.3, easeFactor);
  let newInterval: number;
  let newReps = repetitions;

  if (isLearningCard(intervalDays, repetitions)) {
    switch (difficulty) {
      case "again":
        newReps = 0;
        newInterval = LEARNING_STEPS[0];
        break;
      case "hard":
        newReps = repetitions;
        newInterval =
          repetitions === 0
            ? HARD_LEARNING_STEP
            : Math.max(
                intervalDays,
                LEARNING_STEPS[Math.min(repetitions, LEARNING_STEPS.length - 1)]
              );
        break;
      case "good":
        if (repetitions < LEARNING_STEPS.length - 1) {
          newReps = repetitions + 1;
          newInterval = LEARNING_STEPS[newReps];
        } else {
          newReps = LEARNING_STEPS.length;
          newInterval = GRADUATING_INTERVAL;
        }
        break;
      case "easy":
        newReps = LEARNING_STEPS.length + 1;
        newInterval = EASY_INTERVAL;
        break;
    }
  } else {
    switch (difficulty) {
      case "again":
        newEase = Math.max(1.3, easeFactor - 0.2);
        newReps = 0;
        newInterval = LEARNING_STEPS[0];
        break;
      case "hard":
        newEase = Math.max(1.3, easeFactor - 0.15);
        newReps = repetitions + 1;
        newInterval = Math.max(1, Math.round(intervalDays * 1.2));
        break;
      case "good":
        newReps = repetitions + 1;
        newInterval = Math.max(1, Math.round(intervalDays * easeFactor));
        break;
      case "easy":
        newEase = easeFactor + 0.15;
        newReps = repetitions + 1;
        newInterval = Math.max(
          Math.round(intervalDays * easeFactor * 1.3),
          Math.round(intervalDays + 1)
        );
        break;
    }
  }

  return {
    easeFactor: Math.round(Math.max(1.3, newEase) * 100) / 100,
    intervalDays: newInterval,
    repetitions: newReps,
    nextReview: formatRoundedDate(newInterval),
  };
}
