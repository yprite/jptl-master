"""
StudySession 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import json
import sqlite3
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from backend.domain.entities.study_session import StudySession
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class StudySessionMapper:
    """StudySession 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> StudySession:
        """데이터베이스 행을 StudySession 엔티티로 변환"""
        created_at = None
        try:
            created_at_str = row['created_at']
            if created_at_str:
                created_at = StudySessionMapper._parse_datetime(created_at_str)
        except (KeyError, TypeError):
            created_at = None

        # study_date는 DATE 형식으로 저장되므로 파싱
        study_date = None
        try:
            study_date_str = row['study_date']
            if study_date_str:
                study_date = StudySessionMapper._parse_date(study_date_str)
        except (KeyError, TypeError):
            study_date = None

        # level 파싱
        level = None
        try:
            level_str = row['level']
            if level_str:
                level = JLPTLevel(level_str)
        except (KeyError, TypeError, ValueError):
            level = None

        # question_types 파싱 (JSON 배열)
        question_types = None
        try:
            question_types_str = row['question_types']
            if question_types_str:
                question_types_list = json.loads(question_types_str)
                question_types = [QuestionType(qt) for qt in question_types_list]
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            question_types = None

        # question_ids 파싱 (JSON 배열)
        question_ids = None
        try:
            question_ids_str = row['question_ids']
            if question_ids_str:
                question_ids = json.loads(question_ids_str)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            question_ids = None

        study_session = StudySession(
            id=row['id'],
            user_id=row['user_id'],
            study_date=study_date,
            study_hour=row['study_hour'],
            total_questions=row['total_questions'],
            correct_count=row['correct_count'],
            time_spent_minutes=row['time_spent_minutes'],
            level=level,
            question_types=question_types,
            question_ids=question_ids,
            created_at=created_at
        )

        return study_session

    @staticmethod
    def to_dict(study_session: StudySession) -> Dict[str, Any]:
        """StudySession 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'id': study_session.id,
            'user_id': study_session.user_id,
            'study_date': study_session.study_date.isoformat() if study_session.study_date else None,
            'study_hour': study_session.study_hour,
            'total_questions': study_session.total_questions,
            'correct_count': study_session.correct_count,
            'time_spent_minutes': study_session.time_spent_minutes,
            'level': study_session.level.value if study_session.level else None,
            'question_types': json.dumps([qt.value for qt in study_session.question_types]) if study_session.question_types else None,
            'question_ids': json.dumps(study_session.question_ids) if study_session.question_ids else None,
            'created_at': study_session.created_at.isoformat() if study_session.created_at else None
        }
        return data

    @staticmethod
    def _parse_datetime(datetime_str: str) -> datetime:
        """문자열을 datetime으로 파싱"""
        try:
            return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            try:
                return datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return datetime.now()

    @staticmethod
    def _parse_date(date_str: str) -> date:
        """문자열을 date로 파싱"""
        try:
            return date.fromisoformat(date_str)
        except (ValueError, AttributeError):
            try:
                return datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return date.today()

