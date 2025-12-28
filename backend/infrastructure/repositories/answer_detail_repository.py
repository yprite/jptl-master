"""
SQLite 기반 AnswerDetail Repository 구현
"""

from typing import List, Optional
from datetime import date
from backend.domain.entities.answer_detail import AnswerDetail
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.answer_detail_mapper import AnswerDetailMapper


class SqliteAnswerDetailRepository:
    """SQLite 기반 AnswerDetail Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
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
            conn.commit()

    def save(self, answer_detail: AnswerDetail) -> AnswerDetail:
        """AnswerDetail 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = AnswerDetailMapper.to_dict(answer_detail)

            if answer_detail.id is None or answer_detail.id == 0:
                # 새 AnswerDetail 생성
                cursor = conn.execute("""
                    INSERT INTO answer_details (result_id, question_id, user_answer,
                                              correct_answer, is_correct, time_spent_seconds,
                                              difficulty, question_type, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['result_id'], data['question_id'], data['user_answer'],
                    data['correct_answer'], data['is_correct'], data['time_spent_seconds'],
                    data['difficulty'], data['question_type'], data['created_at']
                ))

                # 생성된 ID를 AnswerDetail 객체에 설정
                answer_detail.id = cursor.lastrowid
            else:
                # 기존 AnswerDetail 업데이트
                conn.execute("""
                    UPDATE answer_details
                    SET result_id = ?, question_id = ?, user_answer = ?,
                        correct_answer = ?, is_correct = ?, time_spent_seconds = ?,
                        difficulty = ?, question_type = ?
                    WHERE id = ?
                """, (
                    data['result_id'], data['question_id'], data['user_answer'],
                    data['correct_answer'], data['is_correct'], data['time_spent_seconds'],
                    data['difficulty'], data['question_type'], answer_detail.id
                ))

            conn.commit()
            return answer_detail

    def find_by_id(self, id: int) -> Optional[AnswerDetail]:
        """ID로 AnswerDetail 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM answer_details WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return AnswerDetailMapper.to_entity(row)
            return None

    def find_all(self) -> List[AnswerDetail]:
        """모든 AnswerDetail 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM answer_details ORDER BY created_at DESC")
            rows = cursor.fetchall()

            return [AnswerDetailMapper.to_entity(row) for row in rows]

    def delete(self, answer_detail: AnswerDetail) -> None:
        """AnswerDetail 삭제"""
        if answer_detail.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM answer_details WHERE id = ?", (answer_detail.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM answer_details WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_result_id(self, result_id: int) -> List[AnswerDetail]:
        """result_id로 AnswerDetail 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM answer_details WHERE result_id = ? ORDER BY created_at DESC",
                (result_id,)
            )
            rows = cursor.fetchall()

            return [AnswerDetailMapper.to_entity(row) for row in rows]

    def find_by_question_id(self, question_id: int) -> List[AnswerDetail]:
        """question_id로 AnswerDetail 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM answer_details WHERE question_id = ? ORDER BY created_at DESC",
                (question_id,)
            )
            rows = cursor.fetchall()

            return [AnswerDetailMapper.to_entity(row) for row in rows]

    def find_by_user_id_and_period(self, user_id: int, period_start: date, period_end: date) -> List[AnswerDetail]:
        """
        사용자 ID와 기간으로 AnswerDetail 조회
        
        result 테이블과 조인하여 해당 기간의 사용자 답안을 조회합니다.
        
        Args:
            user_id: 사용자 ID
            period_start: 기간 시작일
            period_end: 기간 종료일
            
        Returns:
            List[AnswerDetail]: 해당 기간의 답안 상세 정보 리스트
        """
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT ad.* FROM answer_details ad
                INNER JOIN results r ON ad.result_id = r.id
                WHERE r.user_id = ? 
                AND DATE(ad.created_at) >= ? 
                AND DATE(ad.created_at) <= ?
                ORDER BY ad.created_at DESC
            """, (user_id, period_start.isoformat(), period_end.isoformat()))
            rows = cursor.fetchall()

            return [AnswerDetailMapper.to_entity(row) for row in rows]
