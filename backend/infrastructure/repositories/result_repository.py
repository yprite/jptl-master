"""
SQLite 기반 Result Repository 구현
"""

from typing import List, Optional
from backend.domain.entities.result import Result
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.result_mapper import ResultMapper


class SqliteResultRepository:
    """SQLite 기반 Result Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_columns()

    def _ensure_table_columns(self):
        """테이블에 필요한 컬럼이 있는지 확인하고 없으면 추가"""
        import sqlite3
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # 컬럼 존재 여부 확인
            cursor.execute("PRAGMA table_info(results)")
            columns = [col[1] for col in cursor.fetchall()]
            
            # question_type_analysis 컬럼 추가
            if 'question_type_analysis' not in columns:
                try:
                    conn.execute("ALTER TABLE results ADD COLUMN question_type_analysis TEXT")
                except sqlite3.OperationalError:
                    pass  # 이미 존재할 수 있음
            
            conn.commit()

    def save(self, result: Result) -> Result:
        """결과 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = ResultMapper.to_dict(result)

            if result.id is None or result.id == 0:
                # 새 결과 생성
                cursor = conn.execute("""
                    INSERT INTO results (test_id, user_id, attempt_id, score,
                                       assessed_level, recommended_level,
                                       correct_answers_count, total_questions_count,
                                       time_taken_minutes, performance_level, feedback,
                                       question_type_analysis, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['test_id'], data['user_id'], data['attempt_id'],
                    data['score'], data['assessed_level'], data['recommended_level'],
                    data['correct_answers_count'], data['total_questions_count'],
                    data['time_taken_minutes'], data['performance_level'], data['feedback'],
                    data['question_type_analysis'], data['created_at']
                ))

                # 생성된 ID를 결과 객체에 설정
                result.id = cursor.lastrowid
            else:
                # 기존 결과 업데이트
                conn.execute("""
                    UPDATE results
                    SET test_id = ?, user_id = ?, attempt_id = ?, score = ?,
                        assessed_level = ?, recommended_level = ?,
                        correct_answers_count = ?, total_questions_count = ?,
                        time_taken_minutes = ?, performance_level = ?, feedback = ?,
                        question_type_analysis = ?
                    WHERE id = ?
                """, (
                    data['test_id'], data['user_id'], data['attempt_id'],
                    data['score'], data['assessed_level'], data['recommended_level'],
                    data['correct_answers_count'], data['total_questions_count'],
                    data['time_taken_minutes'], data['performance_level'], data['feedback'],
                    data['question_type_analysis'], result.id
                ))

            conn.commit()
            return result

    def find_by_id(self, id: int) -> Optional[Result]:
        """ID로 결과 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM results WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return ResultMapper.to_entity(row)
            return None

    def find_all(self) -> List[Result]:
        """모든 결과 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM results ORDER BY created_at DESC")
            rows = cursor.fetchall()

            return [ResultMapper.to_entity(row) for row in rows]

    def delete(self, result: Result) -> None:
        """결과 삭제"""
        if result.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM results WHERE id = ?", (result.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM results WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_user_id(self, user_id: int) -> List[Result]:
        """사용자별 결과 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rows = cursor.fetchall()

            return [ResultMapper.to_entity(row) for row in rows]

    def find_by_test_id(self, test_id: int) -> List[Result]:
        """테스트별 결과 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM results WHERE test_id = ? ORDER BY created_at DESC", (test_id,))
            rows = cursor.fetchall()

            return [ResultMapper.to_entity(row) for row in rows]

    def find_recent_by_user(self, user_id: int, limit: int = 10) -> List[Result]:
        """사용자의 최근 결과 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit)
            )
            rows = cursor.fetchall()

            return [ResultMapper.to_entity(row) for row in rows]

    def get_user_average_score(self, user_id: int) -> float:
        """사용자의 평균 점수 계산"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT AVG(score) as avg_score FROM results WHERE user_id = ?",
                (user_id,)
            )
            row = cursor.fetchone()

            if row and row['avg_score'] is not None:
                return float(row['avg_score'])
            return 0.0

