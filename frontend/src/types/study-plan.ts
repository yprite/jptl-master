/**
 * 6주 학습 계획 타입 정의
 */

export interface DailyTask {
  day: number;
  week: number;
  tasks: {
    vocabulary: number; // 단어 개수
    grammar: number; // 문법 개수
    reading?: number; // 독해 문제 수 (해당 주차에만)
    listening?: number; // 청해 문제 수 (해당 주차에만)
    mockTest?: number; // 모의고사 횟수 (6주차에만)
  };
  completed: boolean;
}

export interface WeekPlan {
  week: number;
  title: string;
  learningGoals: string[];
  studyMethods: {
    grammar: string[];
    vocabulary: string[];
    practice: string[];
  };
  keyPoint: string;
  dailyTasks: DailyTask[];
}

export interface StudyPlan {
  totalWeeks: number;
  totalDays: number;
  weeks: WeekPlan[];
  startDate?: string;
  currentDay?: number;
  currentWeek?: number;
}

export interface StudyProgress {
  day: number;
  week: number;
  completedTasks: {
    vocabulary: boolean;
    grammar: boolean;
    reading?: boolean;
    listening?: boolean;
    mockTest?: boolean;
  };
  completedAt?: string;
}

