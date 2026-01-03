/**
 * API 응답 타입 정의
 */

export interface Question {
  id: number;
  level: string;
  question_type: string;
  question_text: string;
  choices: string[];
  difficulty: number;
  audio_url?: string | null;
  correct_answer?: string; // 학습 모드에서 사용
  explanation?: string; // 학습 모드에서 사용
}

export interface Test {
  id: number;
  title: string;
  level: string;
  status: string;
  time_limit_minutes: number;
  questions: Question[];
  started_at?: string;
  completed_at?: string;
}

export interface TestList {
  id: number;
  title: string;
  level: string;
  status: string;
  time_limit_minutes: number;
  question_count: number;
}

export interface Result {
  id: number;
  test_id: number;
  user_id: number;
  score: number;
  assessed_level: string;
  recommended_level: string;
  correct_answers_count: number;
  total_questions_count: number;
  time_taken_minutes: number;
  performance_level: string;
  is_passed: boolean;
  accuracy_percentage: number;
  time_efficiency: string;
  level_progression: string;
  question_type_analysis: Record<string, { correct: number; total: number }>;
  feedback: Record<string, string>;
  created_at: string;
}

export interface ResultList {
  id: number;
  test_id: number;
  user_id: number;
  score: number;
  assessed_level: string;
  recommended_level: string;
  performance_level: string;
  is_passed: boolean;
  created_at: string;
}

export interface UserPerformance {
  id: number;
  user_id: number;
  analysis_period_start: string;
  analysis_period_end: string;
  type_performance: Record<string, { accuracy: number }>;
  difficulty_performance: Record<string, { accuracy: number }>;
  // 백엔드 구현에 따라 level_progression 형태가 다를 수 있어(평균 점수 vs 날짜별 점수 리스트)
  // 프론트에서 둘 다 처리할 수 있도록 유니온으로 둡니다.
  level_progression: Record<
    string,
    | { average_score: number }
    | Array<{ date: string; score: number }>
  >;
  repeated_mistakes: number[];
  weaknesses: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface UserHistory {
  id: number;
  user_id: number;
  test_id: number;
  result_id: number;
  study_date: string;
  study_hour: number;
  total_questions: number;
  correct_count: number;
  time_spent_minutes: number;
  accuracy_percentage: number;
  created_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  target_level: string;
  current_level: string | null;
  total_tests_taken: number;
  study_streak: number;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  target_level: string;
  current_level: string | null;
  total_tests_taken: number;
  study_streak: number;
  is_admin: boolean;
}

export interface AdminQuestion {
  id: number;
  level: string;
  question_type: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
  audio_url?: string | null;
}

export interface AdminStatistics {
  users: {
    total_users: number;
    active_users: number;
  };
  tests: {
    total_tests: number;
    average_score: number;
  };
  questions: {
    total_questions: number;
    by_level: Record<string, number>;
  };
  learning_data: {
    total_results: number;
  };
}

export interface Vocabulary {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  level: string;
  memorization_status: string;
  example_sentence?: string | null;
}

export interface VocabularyReview {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  level: string;
  memorization_status: string;
  example_sentence?: string | null;
  next_review_date?: string | null;
  interval_days: number;
  review_count: number;
}

export interface ReviewStatistics {
  total_due: number;
  reviewed_today: number;
  success_rate: number;
}

