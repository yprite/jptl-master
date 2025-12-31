"""
SQLite 기반 StudySession Repository 구현
"""

from typing import List, Optional
from datetime import date
from backend.domain.entities.study_session import StudySession
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.study_session_mapper import StudySessionMapper


class SqliteStudySessionRepository:
    """SQLite 기반 StudySession Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS study_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    study_date DATE NOT NULL,
                    study_hour INTEGER NOT NULL,
                    total_questions INTEGER NOT NULL,
                    correct_count INTEGER NOT NULL,
                    time_spent_minutes INTEGER NOT NULL,
                    level TEXT,
                    question_types TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            conn.commit()

    def save(self, study_session: StudySession) -> StudySession:
        """StudySession 저장"""
        with self.db.get_connection() as conn:
            data = StudySessionMapper.to_dict(study_session)

            if study_session.id is None or study_session.id == 0:
                # 새 StudySession 생성
                cursor = conn.execute("""
                    INSERT INTO study_sessions (user_id, study_date, study_hour,
                                                total_questions, correct_count,
                                                time_spent_minutes, level, question_types, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['user_id'], data['study_date'], data['study_hour'],
                    data['total_questions'], data['correct_count'],
                    data['time_spent_minutes'], data['level'], data['question_types'],
                    data['created_at']
                ))

                # 생성된 ID를 StudySession 객체에 설정
                study_session.id = cursor.lastrowid
            else:
                # 기존 StudySession 업데이트
                conn.execute("""
                    UPDATE study_sessions
                    SET user_id = ?, study_date = ?, study_hour = ?,
                        total_questions = ?, correct_count = ?,
                        time_spent_minutes = ?, level = ?, question_types = ?
                    WHERE id = ?
                """, (
                    data['user_id'], data['study_date'], data['study_hour'],
                    data['total_questions'], data['correct_count'],
                    data['time_spent_minutes'], data['level'], data['question_types'],
                    study_session.id
                ))

            conn.commit()
            return study_session

    def find_by_id(self, id: int) -> Optional[StudySession]:
        """ID로 StudySession 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM study_sessions WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return StudySessionMapper.to_entity(row)
            return None

    def find_by_user_id(self, user_id: int) -> List[StudySession]:
        """사용자 ID로 StudySession 목록 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
            rows = cursor.fetchall()

            return [StudySessionMapper.to_entity(row) for row in rows]

