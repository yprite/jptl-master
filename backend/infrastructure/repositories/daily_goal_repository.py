"""
SQLite 기반 DailyGoal Repository 구현
"""

from typing import Optional
from backend.domain.entities.daily_goal import DailyGoal
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.daily_goal_mapper import DailyGoalMapper


class SqliteDailyGoalRepository:
    """SQLite 기반 DailyGoal Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS daily_goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    target_questions INTEGER NOT NULL DEFAULT 10,
                    target_minutes INTEGER NOT NULL DEFAULT 30,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            conn.commit()

    def save(self, daily_goal: DailyGoal) -> DailyGoal:
        """DailyGoal 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = DailyGoalMapper.to_dict(daily_goal)

            if daily_goal.id is None or daily_goal.id == 0:
                # 새 DailyGoal 생성
                cursor = conn.execute("""
                    INSERT INTO daily_goals (user_id, target_questions, target_minutes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    data['user_id'], data['target_questions'], data['target_minutes'],
                    data['created_at'], data['updated_at']
                ))

                # 생성된 ID를 DailyGoal 객체에 설정
                daily_goal.id = cursor.lastrowid
            else:
                # 기존 DailyGoal 업데이트
                conn.execute("""
                    UPDATE daily_goals
                    SET target_questions = ?, target_minutes = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    data['target_questions'], data['target_minutes'],
                    data['updated_at'], daily_goal.id
                ))

            conn.commit()
            return daily_goal

    def find_by_id(self, id: int) -> Optional[DailyGoal]:
        """ID로 DailyGoal 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM daily_goals WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return DailyGoalMapper.to_entity(row)
            return None

    def find_by_user_id(self, user_id: int) -> Optional[DailyGoal]:
        """user_id로 DailyGoal 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM daily_goals WHERE user_id = ?",
                (user_id,)
            )
            row = cursor.fetchone()

            if row:
                return DailyGoalMapper.to_entity(row)
            return None

    def delete(self, daily_goal: DailyGoal) -> None:
        """DailyGoal 삭제"""
        if daily_goal.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM daily_goals WHERE id = ?", (daily_goal.id,))
            conn.commit()

    def exists_by_user_id(self, user_id: int) -> bool:
        """user_id로 DailyGoal 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT 1 FROM daily_goals WHERE user_id = ? LIMIT 1",
                (user_id,)
            )
            return cursor.fetchone() is not None

