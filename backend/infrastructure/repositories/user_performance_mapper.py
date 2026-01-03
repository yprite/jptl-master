"""
UserPerformance 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import json
import sqlite3
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from backend.domain.entities.user_performance import UserPerformance


class UserPerformanceMapper:
    """UserPerformance 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> UserPerformance:
        """데이터베이스 행을 UserPerformance 엔티티로 변환"""
        created_at = None
        try:
            created_at_str = row['created_at']
            if created_at_str:
                created_at = UserPerformanceMapper._parse_datetime(created_at_str)
        except (KeyError, TypeError):
            created_at = None

        updated_at = None
        try:
            updated_at_str = row['updated_at']
            if updated_at_str:
                updated_at = UserPerformanceMapper._parse_datetime(updated_at_str)
        except (KeyError, TypeError):
            updated_at = None

        # analysis_period_start와 analysis_period_end는 DATE 형식으로 저장
        analysis_period_start = None
        try:
            start_str = row['analysis_period_start']
            if start_str:
                analysis_period_start = UserPerformanceMapper._parse_date(start_str)
        except (KeyError, TypeError):
            analysis_period_start = None

        analysis_period_end = None
        try:
            end_str = row['analysis_period_end']
            if end_str:
                analysis_period_end = UserPerformanceMapper._parse_date(end_str)
        except (KeyError, TypeError):
            analysis_period_end = None

        # JSON 필드 파싱
        type_performance = None
        try:
            type_performance = UserPerformanceMapper._parse_json(row['type_performance'])
        except (KeyError, TypeError):
            type_performance = {}
        
        difficulty_performance = None
        try:
            difficulty_performance = UserPerformanceMapper._parse_json(row['difficulty_performance'])
        except (KeyError, TypeError):
            difficulty_performance = {}
        
        level_progression = None
        try:
            level_progression = UserPerformanceMapper._parse_json(row['level_progression'])
        except (KeyError, TypeError):
            level_progression = {}
        
        repeated_mistakes = None
        try:
            repeated_mistakes = UserPerformanceMapper._parse_json(row['repeated_mistakes'], default=[])
        except (KeyError, TypeError):
            repeated_mistakes = []
        
        weaknesses = None
        try:
            weaknesses = UserPerformanceMapper._parse_json(row['weaknesses'])
        except (KeyError, TypeError):
            weaknesses = {}

        user_performance = UserPerformance(
            id=row['id'],
            user_id=row['user_id'],
            analysis_period_start=analysis_period_start,
            analysis_period_end=analysis_period_end,
            type_performance=type_performance,
            difficulty_performance=difficulty_performance,
            level_progression=level_progression,
            repeated_mistakes=repeated_mistakes if isinstance(repeated_mistakes, list) else [],
            weaknesses=weaknesses,
            created_at=created_at,
            updated_at=updated_at
        )

        return user_performance

    @staticmethod
    def to_dict(user_performance: UserPerformance) -> Dict[str, Any]:
        """UserPerformance 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'user_id': user_performance.user_id,
            'analysis_period_start': user_performance.analysis_period_start.isoformat() if user_performance.analysis_period_start else None,
            'analysis_period_end': user_performance.analysis_period_end.isoformat() if user_performance.analysis_period_end else None,
            'type_performance': json.dumps(user_performance.type_performance) if user_performance.type_performance else None,
            'difficulty_performance': json.dumps(user_performance.difficulty_performance) if user_performance.difficulty_performance else None,
            'level_progression': json.dumps(user_performance.level_progression) if user_performance.level_progression else None,
            'repeated_mistakes': json.dumps(user_performance.repeated_mistakes) if user_performance.repeated_mistakes else None,
            'weaknesses': json.dumps(user_performance.weaknesses) if user_performance.weaknesses else None,
            'created_at': user_performance.created_at.isoformat() if user_performance.created_at else None,
            'updated_at': user_performance.updated_at.isoformat() if user_performance.updated_at else None
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

    @staticmethod
    def _parse_json(json_str: Optional[str], default: Any = None) -> Any:
        """JSON 문자열을 파이썬 객체로 변환"""
        if not json_str:
            return default if default is not None else {}
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, ValueError, TypeError):
            return default if default is not None else {}
