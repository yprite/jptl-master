export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          level: "N3" | "N4" | "N5";
          daily_flashcard: number;
          daily_vocab: number;
          daily_grammar: number;
          daily_reading: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          level: "N3" | "N4" | "N5";
          daily_flashcard?: number;
          daily_vocab?: number;
          daily_grammar?: number;
          daily_reading?: number;
        };
        Update: {
          id?: string;
          name?: string;
          level?: "N3" | "N4" | "N5";
          daily_flashcard?: number;
          daily_vocab?: number;
          daily_grammar?: number;
          daily_reading?: number;
        };
      };
      daily_quests: {
        Row: {
          id: number;
          user_id: string;
          date: string;
          flashcard: boolean;
          vocabulary: boolean;
          grammar: boolean;
          reading: boolean;
        };
        Insert: {
          user_id: string;
          date: string;
          flashcard?: boolean;
          vocabulary?: boolean;
          grammar?: boolean;
          reading?: boolean;
        };
        Update: {
          user_id?: string;
          date?: string;
          flashcard?: boolean;
          vocabulary?: boolean;
          grammar?: boolean;
          reading?: boolean;
        };
      };
      vocabularies: {
        Row: {
          id: number;
          word: string;
          reading: string;
          meaning: string;
          level: "N3" | "N4";
          example: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["vocabularies"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["vocabularies"]["Insert"]
        >;
      };
      reading_questions: {
        Row: {
          id: number;
          level: "N3" | "N4";
          passage: string;
          question: string;
          choices: string[];
          correct_answer: string;
          explanation: string;
          difficulty: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["reading_questions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["reading_questions"]["Insert"]
        >;
      };
      user_vocab_progress: {
        Row: {
          id: number;
          user_id: string;
          vocabulary_id: number;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          next_review: string;
          last_reviewed: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_vocab_progress"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["user_vocab_progress"]["Insert"]
        >;
      };
      study_plans: {
        Row: {
          id: number;
          user_id: string;
          level: "N3" | "N4";
          total_days: number;
          current_day: number;
          daily_new_words: number;
          daily_reading_count: number;
          started_at: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["study_plans"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["study_plans"]["Insert"]
        >;
      };
      daily_completions: {
        Row: {
          id: number;
          user_id: string;
          plan_id: number;
          day_number: number;
          vocab_done: boolean;
          reading_done: boolean;
          completed_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daily_completions"]["Row"],
          "id" | "completed_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["daily_completions"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type DailyQuest = Database["public"]["Tables"]["daily_quests"]["Row"];
export type Vocabulary =
  Database["public"]["Tables"]["vocabularies"]["Row"];
export type ReadingQuestion =
  Database["public"]["Tables"]["reading_questions"]["Row"];
export type UserVocabProgress =
  Database["public"]["Tables"]["user_vocab_progress"]["Row"];
export type StudyPlan =
  Database["public"]["Tables"]["study_plans"]["Row"];
export type DailyCompletion =
  Database["public"]["Tables"]["daily_completions"]["Row"];
