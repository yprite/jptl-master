"""
SQLite 데이터베이스 설정 및 연결 관리
경량화를 위해 SQLAlchemy 대신 순수 SQLite3 사용
"""

import sqlite3
import os
from contextlib import contextmanager
from typing import Generator


def _get_project_root() -> str:
    """프로젝트 루트 디렉토리 경로 반환"""
    # 이 파일의 위치를 기준으로 프로젝트 루트 찾기
    current_file = os.path.abspath(__file__)
    # backend/infrastructure/config/database.py -> 프로젝트 루트
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
    return backend_dir


class Database:
    """SQLite 데이터베이스 연결 관리"""

    def __init__(self, db_path: str = None):
        if db_path is None:
            # 프로젝트 루트 기준으로 data/jlpt.db 경로 설정
            project_root = _get_project_root()
            db_path = os.path.join(project_root, "data", "jlpt.db")
        self.db_path = os.path.abspath(db_path)  # 절대 경로로 변환
        self._ensure_directory_exists()
        self._create_tables()

    def _ensure_directory_exists(self):
        """데이터베이스 디렉토리 생성"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """데이터베이스 연결 컨텍스트 매니저"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 컬럼명으로 접근 가능
        try:
            yield conn
        finally:
            conn.close()

    def _create_tables(self):
        """테이블 생성"""
        with self.get_connection() as conn:
            # 사용자 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    target_level TEXT NOT NULL,
                    current_level TEXT,
                    total_tests_taken INTEGER DEFAULT 0,
                    study_streak INTEGER DEFAULT 0,
                    preferred_question_types TEXT,
                    is_admin INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 기존 테이블에 is_admin 컬럼이 없는 경우 마이그레이션
            try:
                cursor = conn.execute("PRAGMA table_info(users)")
                columns = [col[1] for col in cursor.fetchall()]
                if 'is_admin' not in columns:
                    conn.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
            except Exception:
                # 테이블이 없거나 다른 오류가 발생한 경우 무시 (CREATE TABLE IF NOT EXISTS가 처리함)
                pass

            # 문제 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    level TEXT NOT NULL,
                    question_type TEXT NOT NULL,
                    question_text TEXT NOT NULL,
                    choices TEXT NOT NULL,
                    correct_answer TEXT NOT NULL,
                    explanation TEXT NOT NULL,
                    difficulty INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 테스트 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    level TEXT NOT NULL,
                    question_ids TEXT NOT NULL,
                    time_limit_minutes INTEGER NOT NULL,
                    status TEXT DEFAULT 'created',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    user_answers TEXT,
                    score REAL
                )
            """)

            # 테스트 응시 기록 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS test_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    user_answers TEXT,
                    score REAL,
                    time_taken_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (test_id) REFERENCES tests(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            # 결과 분석 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    attempt_id INTEGER DEFAULT 0,
                    score REAL NOT NULL,
                    assessed_level TEXT NOT NULL,
                    recommended_level TEXT NOT NULL,
                    correct_answers_count INTEGER NOT NULL,
                    total_questions_count INTEGER NOT NULL,
                    time_taken_minutes INTEGER NOT NULL,
                    performance_level TEXT,
                    feedback TEXT,
                    question_type_analysis TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (test_id) REFERENCES tests(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            # 게시글 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    author_id INTEGER NOT NULL,
                    published BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (author_id) REFERENCES users(id)
                )
            """)

            # 문제별 상세 답안 이력 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS answer_details (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    result_id INTEGER NOT NULL,
                    question_id INTEGER NOT NULL,
                    user_answer TEXT NOT NULL,
                    correct_answer TEXT NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    time_spent_seconds INTEGER NOT NULL,
                    difficulty INTEGER NOT NULL,
                    question_type TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (result_id) REFERENCES results(id),
                    FOREIGN KEY (question_id) REFERENCES questions(id)
                )
            """)

            # 학습 이력 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS learning_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    test_id INTEGER NOT NULL,
                    result_id INTEGER NOT NULL,
                    study_date DATE NOT NULL,
                    study_hour INTEGER NOT NULL,
                    total_questions INTEGER NOT NULL,
                    correct_count INTEGER NOT NULL,
                    time_spent_minutes INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (test_id) REFERENCES tests(id),
                    FOREIGN KEY (result_id) REFERENCES results(id)
                )
            """)

            # 사용자 성능 분석 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    analysis_period_start DATE NOT NULL,
                    analysis_period_end DATE NOT NULL,
                    type_performance TEXT,
                    difficulty_performance TEXT,
                    level_progression TEXT,
                    repeated_mistakes TEXT,
                    weaknesses TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            conn.commit()


# 전역 데이터베이스 인스턴스
_db_instance = None

def get_database() -> Database:
    """데이터베이스 인스턴스 싱글톤"""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance
