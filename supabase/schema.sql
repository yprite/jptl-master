-- JPTL MVP: Supabase Schema

-- 단어 테이블
CREATE TABLE vocabularies (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('N3', 'N4')),
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 독해 문제 테이블
CREATE TABLE reading_questions (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('N3', 'N4')),
  passage TEXT NOT NULL,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자별 단어 학습 진도 (Anki SM-2)
CREATE TABLE user_vocab_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  vocabulary_id INTEGER NOT NULL REFERENCES vocabularies(id),
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, vocabulary_id)
);

-- 학습 계획
CREATE TABLE study_plans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('N3', 'N4')),
  total_days INTEGER NOT NULL DEFAULT 90,
  current_day INTEGER NOT NULL DEFAULT 1,
  daily_new_words INTEGER NOT NULL DEFAULT 10,
  daily_reading_count INTEGER NOT NULL DEFAULT 3,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일별 학습 완료 기록
CREATE TABLE daily_completions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id INTEGER NOT NULL REFERENCES study_plans(id),
  day_number INTEGER NOT NULL,
  vocab_done BOOLEAN DEFAULT FALSE,
  reading_done BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, plan_id, day_number)
);

-- 인덱스
CREATE INDEX idx_vocab_level ON vocabularies(level);
CREATE INDEX idx_reading_level ON reading_questions(level);
CREATE INDEX idx_progress_user ON user_vocab_progress(user_id);
CREATE INDEX idx_progress_review ON user_vocab_progress(user_id, next_review);
CREATE INDEX idx_plan_user ON study_plans(user_id);
CREATE INDEX idx_completion_user ON daily_completions(user_id, plan_id);
