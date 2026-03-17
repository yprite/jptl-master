export type StudyLevel = "N5" | "N4" | "N3";

export interface StudyFlashcard {
  word: string;
  reading: string | null;
  meaning: string;
  level: StudyLevel;
  example: string | null;
}

export type GeneratedVocabularyQuestionType = "meaning" | "reading";

export interface GeneratedVocabularyQuestion {
  id: string;
  level: StudyLevel;
  type: GeneratedVocabularyQuestionType;
  prompt: string;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

export interface GeneratedGrammarQuestion {
  id: string;
  level: StudyLevel;
  type: "meaning";
  pattern: string;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  example_jp: string | null;
  example_kr: string | null;
}
