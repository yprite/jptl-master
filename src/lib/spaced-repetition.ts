/**
 * SM-2 기반 간격 반복 알고리즘 (Anki 스타일)
 * difficulty: "again" | "hard" | "good" | "easy"
 */

export type Difficulty = "again" | "hard" | "good" | "easy";

interface ReviewResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReview: Date;
}

export function calculateNextReview(
  easeFactor: number,
  intervalDays: number,
  repetitions: number,
  difficulty: Difficulty
): ReviewResult {
  let newEase = easeFactor;
  let newInterval: number;
  let newReps = repetitions;

  const qualityMap: Record<Difficulty, number> = {
    again: 0,
    hard: 2,
    good: 3,
    easy: 5,
  };
  const quality = qualityMap[difficulty];

  if (quality < 2) {
    // 틀렸을 때: 처음부터
    newReps = 0;
    newInterval = 1;
  } else {
    newReps += 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * newEase);
    }
  }

  // ease factor 조정
  newEase = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (difficulty === "hard") {
    newInterval = Math.max(1, Math.round(newInterval * 0.8));
  } else if (difficulty === "easy") {
    newInterval = Math.round(newInterval * 1.3);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEase * 100) / 100,
    intervalDays: newInterval,
    repetitions: newReps,
    nextReview,
  };
}
