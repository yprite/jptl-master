import type { FlashcardSrsUserId } from "./flashcard-srs-store";
import type { StudyLevel } from "./study-data-types";

export interface ReadingUnknownWordNote {
  cardId: string;
  word: string;
  reading: string | null;
  meaning: string;
}

export interface ReadingMistakeNote {
  questionId: string;
  level: StudyLevel;
  question: string;
  passage: string;
  correctAnswer: string;
  selectedAnswer: string;
  explanation: string;
  wrongCount: number;
  lastWrongAt: string;
  unknownWords: ReadingUnknownWordNote[];
}

export interface ReadingNotesState {
  updatedAt: string;
  notes: Record<string, ReadingMistakeNote>;
}

const STORAGE_PREFIX = "jptl-reading-notes";

function createEmptyState(): ReadingNotesState {
  return {
    updatedAt: "",
    notes: {},
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function storageKey(userId: FlashcardSrsUserId): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function normalizeUnknownWord(value: unknown): ReadingUnknownWordNote | null {
  if (
    !isRecord(value) ||
    typeof value.cardId !== "string" ||
    typeof value.word !== "string" ||
    typeof value.meaning !== "string"
  ) {
    return null;
  }

  return {
    cardId: value.cardId,
    word: value.word,
    reading: typeof value.reading === "string" ? value.reading : null,
    meaning: value.meaning,
  };
}

function normalizeReadingMistakeNote(value: unknown): ReadingMistakeNote | null {
  if (
    !isRecord(value) ||
    typeof value.questionId !== "string" ||
    typeof value.level !== "string" ||
    typeof value.question !== "string" ||
    typeof value.passage !== "string" ||
    typeof value.correctAnswer !== "string" ||
    typeof value.selectedAnswer !== "string" ||
    typeof value.explanation !== "string"
  ) {
    return null;
  }

  const unknownWords = Array.isArray(value.unknownWords)
    ? value.unknownWords
        .map(normalizeUnknownWord)
        .filter((item): item is ReadingUnknownWordNote => Boolean(item))
    : [];

  return {
    questionId: value.questionId,
    level: value.level as StudyLevel,
    question: value.question,
    passage: value.passage,
    correctAnswer: value.correctAnswer,
    selectedAnswer: value.selectedAnswer,
    explanation: value.explanation,
    wrongCount: Math.max(1, Number(value.wrongCount ?? 1)),
    lastWrongAt:
      typeof value.lastWrongAt === "string" ? value.lastWrongAt : new Date().toISOString(),
    unknownWords,
  };
}

function normalizeReadingNotesState(value: unknown): ReadingNotesState {
  if (!isRecord(value)) {
    return createEmptyState();
  }

  const sourceNotes = isRecord(value.notes) ? value.notes : {};
  const notes: Record<string, ReadingMistakeNote> = {};

  for (const [questionId, rawNote] of Object.entries(sourceNotes)) {
    const normalized = normalizeReadingMistakeNote(rawNote);
    if (!normalized) continue;
    notes[questionId] = normalized;
  }

  return {
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    notes,
  };
}

export function getReadingNotesState(userId: FlashcardSrsUserId): ReadingNotesState {
  if (!canUseStorage()) {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? normalizeReadingNotesState(JSON.parse(raw)) : createEmptyState();
  } catch {
    return createEmptyState();
  }
}

export function saveReadingNotesState(
  userId: FlashcardSrsUserId,
  state: ReadingNotesState
): ReadingNotesState {
  const normalized = normalizeReadingNotesState(state);
  if (!canUseStorage()) {
    return normalized;
  }

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(normalized));
  } catch {
    // Ignore storage failures so the reading session can continue.
  }

  return normalized;
}

export function upsertReadingMistakeNote(
  userId: FlashcardSrsUserId,
  note: Omit<ReadingMistakeNote, "wrongCount" | "lastWrongAt" | "unknownWords"> &
    Partial<Pick<ReadingMistakeNote, "unknownWords">>
): ReadingNotesState {
  const state = getReadingNotesState(userId);
  const previous = state.notes[note.questionId];
  const nextNote: ReadingMistakeNote = {
    questionId: note.questionId,
    level: note.level,
    question: note.question,
    passage: note.passage,
    correctAnswer: note.correctAnswer,
    selectedAnswer: note.selectedAnswer,
    explanation: note.explanation,
    wrongCount: (previous?.wrongCount ?? 0) + 1,
    lastWrongAt: new Date().toISOString(),
    unknownWords: note.unknownWords ?? previous?.unknownWords ?? [],
  };

  return saveReadingNotesState(userId, {
    updatedAt: nextNote.lastWrongAt,
    notes: {
      ...state.notes,
      [note.questionId]: nextNote,
    },
  });
}

export function updateReadingMistakeWords(
  userId: FlashcardSrsUserId,
  questionId: string,
  unknownWords: ReadingUnknownWordNote[]
): ReadingNotesState {
  const state = getReadingNotesState(userId);
  const existing = state.notes[questionId];
  if (!existing) {
    return state;
  }

  const updatedAt = new Date().toISOString();
  return saveReadingNotesState(userId, {
    updatedAt,
    notes: {
      ...state.notes,
      [questionId]: {
        ...existing,
        unknownWords,
        lastWrongAt: updatedAt,
      },
    },
  });
}
