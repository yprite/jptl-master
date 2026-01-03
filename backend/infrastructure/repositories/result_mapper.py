"""
Result 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional
from backend.domain.entities.result import Result
from backend.domain.value_objects.jlpt import JLPTLevel


class ResultMapper:
    """Result 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> Result:
        """데이터베이스 행을 Result 엔티티로 변환"""
        question_type_analysis: Optional[Dict[str, Dict[str, int]]] = None
        try:
            question_type_analysis_str = row['question_type_analysis']
            if question_type_analysis_str:
                try:
                    question_type_analysis = json.loads(question_type_analysis_str)
                except (json.JSONDecodeError, ValueError):
                    question_type_analysis = {}
        except (KeyError, TypeError):
            question_type_analysis = {}

        created_at = None
        try:
            created_at_str = row['created_at']
            if created_at_str:
                created_at = ResultMapper._parse_datetime(created_at_str)
        except (KeyError, TypeError):
            created_at = None

        result = Result(
            id=row['id'],
            test_id=row['test_id'],
            user_id=row['user_id'],
            score=float(row['score']),
            assessed_level=JLPTLevel(row['assessed_level']),
            recommended_level=JLPTLevel(row['recommended_level']),
            correct_answers_count=row['correct_answers_count'],
            total_questions_count=row['total_questions_count'],
            time_taken_minutes=row['time_taken_minutes'],
            created_at=created_at,
            question_type_analysis=question_type_analysis
        )

        return result

    @staticmethod
    def to_dict(result: Result) -> Dict[str, Any]:
        """Result 엔티티를 데이터베이스 행으로 변환"""
        # performance_level과 feedback은 Result 엔티티의 메서드로 계산
        performance_level = result.get_performance_level()
        feedback_dict = result.get_detailed_feedback()
        feedback = json.dumps(feedback_dict) if feedback_dict else None

        data = {
            'test_id': result.test_id,
            'user_id': result.user_id,
            'attempt_id': 0,  # 기본값
            'score': result.score,
            'assessed_level': result.assessed_level.value,
            'recommended_level': result.recommended_level.value,
            'correct_answers_count': result.correct_answers_count,
            'total_questions_count': result.total_questions_count,
            'time_taken_minutes': result.time_taken_minutes,
            'performance_level': performance_level,
            'feedback': feedback,
            'question_type_analysis': json.dumps(result.question_type_analysis) if result.question_type_analysis else None,
            'created_at': result.created_at.isoformat() if result.created_at else None
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

