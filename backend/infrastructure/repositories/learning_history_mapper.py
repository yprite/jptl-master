"""
LearningHistory 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import sqlite3
from datetime import datetime, date
from typing import Dict, Any, Optional
from backend.domain.entities.learning_history import LearningHistory


class LearningHistoryMapper:
    """LearningHistory 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> LearningHistory:
        """데이터베이스 행을 LearningHistory 엔티티로 변환"""
        created_at = None
        try:
            created_at_str = row['created_at']
            if created_at_str:
                created_at = LearningHistoryMapper._parse_datetime(created_at_str)
        except (KeyError, TypeError):
            created_at = None

        # study_date는 DATE 형식으로 저장되므로 파싱
        study_date = None
        try:
            study_date_str = row['study_date']
            if study_date_str:
                study_date = LearningHistoryMapper._parse_date(study_date_str)
        except (KeyError, TypeError):
            study_date = None

        learning_history = LearningHistory(
            id=row['id'],
            user_id=row['user_id'],
            test_id=row['test_id'],
            result_id=row['result_id'],
            study_date=study_date,
            study_hour=row['study_hour'],
            total_questions=row['total_questions'],
            correct_count=row['correct_count'],
            time_spent_minutes=row['time_spent_minutes'],
            created_at=created_at
        )

        return learning_history

    @staticmethod
    def to_dict(learning_history: LearningHistory) -> Dict[str, Any]:
        """LearningHistory 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'user_id': learning_history.user_id,
            'test_id': learning_history.test_id,
            'result_id': learning_history.result_id,
            'study_date': learning_history.study_date.isoformat() if learning_history.study_date else None,
            'study_hour': learning_history.study_hour,
            'total_questions': learning_history.total_questions,
            'correct_count': learning_history.correct_count,
            'time_spent_minutes': learning_history.time_spent_minutes,
            'created_at': learning_history.created_at.isoformat() if learning_history.created_at else None
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

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[date]:
        """ISO 형식의 date 문자열을 date 객체로 변환"""
        if not date_str:
            return None
        try:
            return date.fromisoformat(date_str)
        except (ValueError, TypeError):
            return None
