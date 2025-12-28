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
  level_progression: Record<string, { average_score: number }>;
  repeated_mistakes: number[];
  weaknesses: Record<string, string>;
  created_at: string;
  updated_at: string;
}

