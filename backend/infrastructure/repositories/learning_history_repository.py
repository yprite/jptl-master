"""
SQLite 기반 LearningHistory Repository 구현
"""

from typing import List, Optional
from datetime import date
from backend.domain.entities.learning_history import LearningHistory
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.learning_history_mapper import LearningHistoryMapper


class SqliteLearningHistoryRepository:
    """SQLite 기반 LearningHistory Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
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
            conn.commit()

    def save(self, learning_history: LearningHistory) -> LearningHistory:
        """LearningHistory 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = LearningHistoryMapper.to_dict(learning_history)

            if learning_history.id is None or learning_history.id == 0:
                # 새 LearningHistory 생성
                cursor = conn.execute("""
                    INSERT INTO learning_history (user_id, test_id, result_id, study_date,
                                                study_hour, total_questions, correct_count,
                                                time_spent_minutes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['user_id'], data['test_id'], data['result_id'], data['study_date'],
                    data['study_hour'], data['total_questions'], data['correct_count'],
                    data['time_spent_minutes'], data['created_at']
                ))

                # 생성된 ID를 LearningHistory 객체에 설정
                learning_history.id = cursor.lastrowid
            else:
                # 기존 LearningHistory 업데이트
                conn.execute("""
                    UPDATE learning_history
                    SET user_id = ?, test_id = ?, result_id = ?, study_date = ?,
                        study_hour = ?, total_questions = ?, correct_count = ?,
                        time_spent_minutes = ?
                    WHERE id = ?
                """, (
                    data['user_id'], data['test_id'], data['result_id'], data['study_date'],
                    data['study_hour'], data['total_questions'], data['correct_count'],
                    data['time_spent_minutes'], learning_history.id
                ))

            conn.commit()
            return learning_history

    def find_by_id(self, id: int) -> Optional[LearningHistory]:
        """ID로 LearningHistory 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM learning_history WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return LearningHistoryMapper.to_entity(row)
            return None

    def find_all(self) -> List[LearningHistory]:
        """모든 LearningHistory 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM learning_history ORDER BY created_at DESC")
            rows = cursor.fetchall()

            return [LearningHistoryMapper.to_entity(row) for row in rows]

    def delete(self, learning_history: LearningHistory) -> None:
        """LearningHistory 삭제"""
        if learning_history.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM learning_history WHERE id = ?", (learning_history.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM learning_history WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_user_id(self, user_id: int) -> List[LearningHistory]:
        """user_id로 LearningHistory 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM learning_history WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
            rows = cursor.fetchall()

            return [LearningHistoryMapper.to_entity(row) for row in rows]

    def find_by_study_date(self, study_date: date) -> List[LearningHistory]:
        """study_date로 LearningHistory 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM learning_history WHERE study_date = ? ORDER BY created_at DESC",
                (study_date.isoformat(),)
            )
            rows = cursor.fetchall()

            return [LearningHistoryMapper.to_entity(row) for row in rows]
