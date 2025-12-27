"""
SQLite 기반 Question Repository 구현
"""

import random
from typing import List, Optional
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.question_mapper import QuestionMapper


class SqliteQuestionRepository:
    """SQLite 기반 Question Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()

    def save(self, question: Question) -> Question:
        """문제 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = QuestionMapper.to_dict(question)

            if question.id is None or question.id == 0:
                # 새 문제 생성
                cursor = conn.execute("""
                    INSERT INTO questions (level, question_type, question_text,
                                         choices, correct_answer, explanation, difficulty)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['level'], data['question_type'], data['question_text'],
                    data['choices'], data['correct_answer'], data['explanation'],
                    data['difficulty']
                ))

                # 생성된 ID를 문제 객체에 설정
                question.id = cursor.lastrowid
            else:
                # 기존 문제 업데이트
                conn.execute("""
                    UPDATE questions
                    SET level = ?, question_type = ?, question_text = ?,
                        choices = ?, correct_answer = ?, explanation = ?, difficulty = ?
                    WHERE id = ?
                """, (
                    data['level'], data['question_type'], data['question_text'],
                    data['choices'], data['correct_answer'], data['explanation'],
                    data['difficulty'], question.id
                ))

            conn.commit()
            return question

    def find_by_id(self, id: int) -> Optional[Question]:
        """ID로 문제 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM questions WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return QuestionMapper.to_entity(row)
            return None

    def find_all(self) -> List[Question]:
        """모든 문제 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM questions ORDER BY id DESC")
            rows = cursor.fetchall()

            return [QuestionMapper.to_entity(row) for row in rows]

    def delete(self, question: Question) -> None:
        """문제 삭제"""
        if question.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM questions WHERE id = ?", (question.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM questions WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_level(self, level: JLPTLevel) -> List[Question]:
        """레벨별 문제 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM questions WHERE level = ? ORDER BY id DESC", (level.value,))
            rows = cursor.fetchall()

            return [QuestionMapper.to_entity(row) for row in rows]

    def find_by_type(self, question_type: QuestionType) -> List[Question]:
        """유형별 문제 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM questions WHERE question_type = ? ORDER BY id DESC", (question_type.value,))
            rows = cursor.fetchall()

            return [QuestionMapper.to_entity(row) for row in rows]

    def find_by_level_and_type(self, level: JLPTLevel, question_type: QuestionType) -> List[Question]:
        """레벨과 유형으로 문제 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM questions WHERE level = ? AND question_type = ? ORDER BY id DESC",
                (level.value, question_type.value)
            )
            rows = cursor.fetchall()

            return [QuestionMapper.to_entity(row) for row in rows]

    def find_random_by_level(self, level: JLPTLevel, limit: int = 10) -> List[Question]:
        """레벨별 랜덤 문제 조회"""
        with self.db.get_connection() as conn:
            # 먼저 해당 레벨의 모든 문제 조회
            cursor = conn.execute("SELECT * FROM questions WHERE level = ?", (level.value,))
            rows = cursor.fetchall()

            if not rows:
                return []

            # 랜덤으로 선택
            questions = [QuestionMapper.to_entity(row) for row in rows]
            random.shuffle(questions)

            # limit만큼 반환
            return questions[:limit]

