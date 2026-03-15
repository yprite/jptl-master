"""
DailyGoal Mapper 구현
데이터베이스 행과 DailyGoal 엔티티 간 변환
"""

import sqlite3
from typing import Dict, Any, Optional
from datetime import datetime
from backend.domain.entities.daily_goal import DailyGoal


class DailyGoalMapper:
    """DailyGoal 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_dict(daily_goal: DailyGoal) -> Dict[str, Any]:
        """
        DailyGoal 엔티티를 딕셔너리로 변환

        Args:
            daily_goal: DailyGoal 엔티티

        Returns:
            Dict[str, Any]: 딕셔너리
        """
        return {
            'id': daily_goal.id,
            'user_id': daily_goal.user_id,
            'target_questions': daily_goal.target_questions,
            'target_minutes': daily_goal.target_minutes,
            'created_at': daily_goal.created_at.isoformat() if daily_goal.created_at else None,
            'updated_at': daily_goal.updated_at.isoformat() if daily_goal.updated_at else None
        }

    @staticmethod
    def to_entity(row: sqlite3.Row) -> DailyGoal:
        """
        데이터베이스 행을 DailyGoal 엔티티로 변환

        Args:
            row: 데이터베이스 행 (sqlite3.Row)

        Returns:
            DailyGoal: DailyGoal 엔티티
        """
        created_at = None
        try:
            created_at_str = row['created_at']
            if created_at_str:
                created_at = DailyGoalMapper._parse_datetime(created_at_str)
        except (KeyError, TypeError):
            created_at = None

        updated_at = None
        try:
            updated_at_str = row['updated_at']
            if updated_at_str:
                updated_at = DailyGoalMapper._parse_datetime(updated_at_str)
        except (KeyError, TypeError):
            updated_at = None

        return DailyGoal(
            id=row['id'],
            user_id=row['user_id'],
            target_questions=row['target_questions'],
            target_minutes=row['target_minutes'],
            created_at=created_at,
            updated_at=updated_at
        )

    @staticmethod
    def _parse_datetime(datetime_str: Optional[str]) -> Optional[datetime]:
        """ISO 형식의 datetime 문자열을 datetime 객체로 변환"""
        if not datetime_str:
            return None
        try:
            return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return None

