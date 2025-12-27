"""
Test 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, List
from backend.domain.entities.test import Test
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, TestStatus
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository


class TestMapper:
    """Test 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row, question_repo: SqliteQuestionRepository) -> Test:
        """데이터베이스 행을 Test 엔티티로 변환"""
        question_ids: List[int] = []
        if row['question_ids']:
            try:
                question_ids = json.loads(row['question_ids'])
            except (json.JSONDecodeError, ValueError) as e:
                raise ValueError(f"Invalid question_ids JSON: {e}")

        # Question 객체들 로드
        questions: List[Question] = []
        for q_id in question_ids:
            question = question_repo.find_by_id(q_id)
            if question:
                questions.append(question)

        user_answers: Optional[Dict[int, str]] = None
        if row['user_answers']:
            try:
                user_answers = json.loads(row['user_answers'])
            except (json.JSONDecodeError, ValueError):
                user_answers = {}

        test = Test(
            id=row['id'],
            title=row['title'],
            level=JLPTLevel(row['level']),
            questions=questions,
            time_limit_minutes=row['time_limit_minutes'],
            created_at=TestMapper._parse_datetime(row['created_at']),
            started_at=TestMapper._parse_datetime(row['started_at']) if row['started_at'] else None,
            completed_at=TestMapper._parse_datetime(row['completed_at']) if row['completed_at'] else None
        )

        # 상태 설정
        test.status = TestStatus(row['status'])

        # user_answers와 score 설정
        if user_answers:
            test.user_answers = user_answers
        if row['score'] is not None:
            test.score = float(row['score'])

        return test

    @staticmethod
    def to_dict(test: Test) -> Dict[str, Any]:
        """Test 엔티티를 데이터베이스 행으로 변환"""
        question_ids = [q.id for q in test.questions]

        data = {
            'title': test.title,
            'level': test.level.value,
            'question_ids': json.dumps(question_ids),
            'time_limit_minutes': test.time_limit_minutes,
            'status': test.status.value,
            'created_at': test.created_at.isoformat() if test.created_at else None,
            'started_at': test.started_at.isoformat() if test.started_at else None,
            'completed_at': test.completed_at.isoformat() if test.completed_at else None,
            'user_answers': json.dumps(test.user_answers) if test.user_answers else None,
            'score': test.score
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

