"""
AnswerDetail 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional
from backend.domain.entities.answer_detail import AnswerDetail
from backend.domain.value_objects.jlpt import QuestionType


class AnswerDetailMapper:
    """AnswerDetail 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> AnswerDetail:
        """데이터베이스 행을 AnswerDetail 엔티티로 변환"""
        created_at = None
        try:
            created_at_str = row['created_at']
            if created_at_str:
                created_at = AnswerDetailMapper._parse_datetime(created_at_str)
        except (KeyError, TypeError):
            created_at = None

        # is_correct는 SQLite에서 INTEGER로 저장되므로 0/1을 bool로 변환
        is_correct = bool(row['is_correct']) if row['is_correct'] else False

        answer_detail = AnswerDetail(
            id=row['id'],
            result_id=row['result_id'],
            question_id=row['question_id'],
            user_answer=row['user_answer'],
            correct_answer=row['correct_answer'],
            is_correct=is_correct,
            time_spent_seconds=row['time_spent_seconds'],
            difficulty=row['difficulty'],
            question_type=QuestionType(row['question_type']),
            created_at=created_at
        )

        return answer_detail

    @staticmethod
    def to_dict(answer_detail: AnswerDetail) -> Dict[str, Any]:
        """AnswerDetail 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'result_id': answer_detail.result_id,
            'question_id': answer_detail.question_id,
            'user_answer': answer_detail.user_answer,
            'correct_answer': answer_detail.correct_answer,
            'is_correct': 1 if answer_detail.is_correct else 0,
            'time_spent_seconds': answer_detail.time_spent_seconds,
            'difficulty': answer_detail.difficulty,
            'question_type': answer_detail.question_type.value,
            'created_at': answer_detail.created_at.isoformat() if answer_detail.created_at else None
        }
        return data

    @staticmethod
    def _parse_datetime(datetime_str: Optional[str]) -> Optional[datetime]:
        """ISO 형식의 datetime 문자열을 datetime 객체로 변환"""
        if not datetime_str:
            return None
        try:
            return datetime.fromisoformat(datetime_str)
        except (ValueError, TypeError):
            return None
