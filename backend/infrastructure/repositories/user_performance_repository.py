"""
SQLite 기반 UserPerformance Repository 구현
"""

from typing import List, Optional
from backend.domain.entities.user_performance import UserPerformance
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.user_performance_mapper import UserPerformanceMapper


class SqliteUserPerformanceRepository:
    """SQLite 기반 UserPerformance Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
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

    def save(self, user_performance: UserPerformance) -> UserPerformance:
        """UserPerformance 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = UserPerformanceMapper.to_dict(user_performance)

            if user_performance.id is None or user_performance.id == 0:
                # 새 UserPerformance 생성
                cursor = conn.execute("""
                    INSERT INTO user_performance (user_id, analysis_period_start, analysis_period_end,
                                                 type_performance, difficulty_performance, level_progression,
                                                 repeated_mistakes, weaknesses, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['user_id'], data['analysis_period_start'], data['analysis_period_end'],
                    data['type_performance'], data['difficulty_performance'], data['level_progression'],
                    data['repeated_mistakes'], data['weaknesses'], data['created_at'], data['updated_at']
                ))

                # 생성된 ID를 UserPerformance 객체에 설정
                user_performance.id = cursor.lastrowid
            else:
                # 기존 UserPerformance 업데이트
                conn.execute("""
                    UPDATE user_performance
                    SET user_id = ?, analysis_period_start = ?, analysis_period_end = ?,
                        type_performance = ?, difficulty_performance = ?, level_progression = ?,
                        repeated_mistakes = ?, weaknesses = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    data['user_id'], data['analysis_period_start'], data['analysis_period_end'],
                    data['type_performance'], data['difficulty_performance'], data['level_progression'],
                    data['repeated_mistakes'], data['weaknesses'], data['updated_at'], user_performance.id
                ))

            conn.commit()
            return user_performance

    def find_by_id(self, id: int) -> Optional[UserPerformance]:
        """ID로 UserPerformance 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM user_performance WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return UserPerformanceMapper.to_entity(row)
            return None

    def find_all(self) -> List[UserPerformance]:
        """모든 UserPerformance 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM user_performance ORDER BY created_at DESC")
            rows = cursor.fetchall()

            return [UserPerformanceMapper.to_entity(row) for row in rows]

    def delete(self, user_performance: UserPerformance) -> None:
        """UserPerformance 삭제"""
        if user_performance.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM user_performance WHERE id = ?", (user_performance.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM user_performance WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_user_id(self, user_id: int) -> List[UserPerformance]:
        """user_id로 UserPerformance 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM user_performance WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
            rows = cursor.fetchall()

            return [UserPerformanceMapper.to_entity(row) for row in rows]
