"""
User 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, List
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class UserMapper:
    """User 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> User:
        """데이터베이스 행을 User 엔티티로 변환"""
        preferred_types: Optional[List[QuestionType]] = None
        if row['preferred_question_types']:
            try:
                preferred_types = [QuestionType(t) for t in json.loads(row['preferred_question_types'])]
            except (json.JSONDecodeError, ValueError):
                preferred_types = []

        return User(
            id=row['id'],
            email=row['email'],
            username=row['username'],
            target_level=JLPTLevel(row['target_level']),
            current_level=JLPTLevel(row['current_level']) if row['current_level'] else None,
            total_tests_taken=row['total_tests_taken'] or 0,
            study_streak=row['study_streak'] or 0,
            preferred_question_types=preferred_types,
            created_at=UserMapper._parse_datetime(row['created_at']),
            updated_at=UserMapper._parse_datetime(row['updated_at'])
        )

    @staticmethod
    def to_dict(user: User) -> Dict[str, Any]:
        """User 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'email': user.email,
            'username': user.username,
            'target_level': user.target_level.value,
            'current_level': user.current_level.value if user.current_level else None,
            'total_tests_taken': user.total_tests_taken,
            'study_streak': user.study_streak,
            'preferred_question_types': json.dumps([t.value for t in user.preferred_question_types]) if user.preferred_question_types else None,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat()
        }
        return data

    @staticmethod
    def _parse_datetime(datetime_str: str) -> datetime:
        """ISO 형식의 datetime 문자열을 datetime 객체로 변환"""
        if not datetime_str:
            return datetime.now()
        try:
            return datetime.fromisoformat(datetime_str)
        except (ValueError, TypeError):
            return datetime.now()
