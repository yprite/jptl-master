"""
SQLite 기반 Test Repository 구현
"""

import sqlite3
from typing import List, Optional
from backend.domain.entities.test import Test
from backend.domain.value_objects.jlpt import JLPTLevel, TestStatus
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.test_mapper import TestMapper
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository


class SqliteTestRepository:
    """SQLite 기반 Test Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self.question_repo = SqliteQuestionRepository(db=self.db)
        self._ensure_table_columns()

    def _ensure_table_columns(self):
        """테이블에 필요한 컬럼이 있는지 확인하고 없으면 추가"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # 컬럼 존재 여부 확인
            cursor.execute("PRAGMA table_info(tests)")
            columns = [col[1] for col in cursor.fetchall()]
            
            # user_answers 컬럼 추가
            if 'user_answers' not in columns:
                try:
                    conn.execute("ALTER TABLE tests ADD COLUMN user_answers TEXT")
                except sqlite3.OperationalError:
                    pass  # 이미 존재할 수 있음
            
            # score 컬럼 추가
            if 'score' not in columns:
                try:
                    conn.execute("ALTER TABLE tests ADD COLUMN score REAL")
                except sqlite3.OperationalError:
                    pass  # 이미 존재할 수 있음
            
            conn.commit()

    def save(self, test: Test) -> Test:
        """테스트 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = TestMapper.to_dict(test)

            if test.id is None or test.id == 0:
                # 새 테스트 생성
                cursor = conn.execute("""
                    INSERT INTO tests (title, level, question_ids, time_limit_minutes,
                                     status, created_at, started_at, completed_at,
                                     user_answers, score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['title'], data['level'], data['question_ids'],
                    data['time_limit_minutes'], data['status'],
                    data['created_at'], data['started_at'], data['completed_at'],
                    data['user_answers'], data['score']
                ))

                # 생성된 ID를 테스트 객체에 설정
                test.id = cursor.lastrowid
            else:
                # 기존 테스트 업데이트
                conn.execute("""
                    UPDATE tests
                    SET title = ?, level = ?, question_ids = ?, time_limit_minutes = ?,
                        status = ?, started_at = ?, completed_at = ?,
                        user_answers = ?, score = ?
                    WHERE id = ?
                """, (
                    data['title'], data['level'], data['question_ids'],
                    data['time_limit_minutes'], data['status'],
                    data['started_at'], data['completed_at'],
                    data['user_answers'], data['score'], test.id
                ))

            conn.commit()
            return test

    def find_by_id(self, id: int) -> Optional[Test]:
        """ID로 테스트 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM tests WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return TestMapper.to_entity(row, self.question_repo)
            return None

    def find_all(self) -> List[Test]:
        """모든 테스트 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM tests ORDER BY created_at DESC")
            rows = cursor.fetchall()

            return [TestMapper.to_entity(row, self.question_repo) for row in rows]

    def delete(self, test: Test) -> None:
        """테스트 삭제"""
        if test.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM tests WHERE id = ?", (test.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM tests WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_level(self, level: JLPTLevel) -> List[Test]:
        """레벨별 테스트 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM tests WHERE level = ? ORDER BY created_at DESC", (level.value,))
            rows = cursor.fetchall()

            return [TestMapper.to_entity(row, self.question_repo) for row in rows]

    def find_by_status(self, status: TestStatus) -> List[Test]:
        """상태별 테스트 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM tests WHERE status = ? ORDER BY created_at DESC", (status.value,))
            rows = cursor.fetchall()

            return [TestMapper.to_entity(row, self.question_repo) for row in rows]

    def find_active_tests(self) -> List[Test]:
        """활성 테스트 조회 (IN_PROGRESS 상태)"""
        return self.find_by_status(TestStatus.IN_PROGRESS)

    def update_status(self, test_id: int, status: TestStatus) -> None:
        """테스트 상태 업데이트"""
        with self.db.get_connection() as conn:
            conn.execute("UPDATE tests SET status = ? WHERE id = ?", (status.value, test_id))
            conn.commit()

