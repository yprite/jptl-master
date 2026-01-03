"""
SQLite StudySession Repository 인프라 테스트
TDD 방식으로 StudySessionRepository 구현 검증
"""

import pytest
import os
import tempfile
from datetime import datetime, date
from backend.domain.entities.study_session import StudySession
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class TestSqliteStudySessionRepository:
    """SQLite StudySession Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_study_session_repository_save_and_find(self, temp_db):
        """StudySessionRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.study_session_repository import SqliteStudySessionRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteStudySessionRepository(db=db)

        # 새 StudySession 생성
        study_session = StudySession(
            id=None,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=14,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=45,
            level=JLPTLevel.N5,
            question_types=[QuestionType.VOCABULARY, QuestionType.GRAMMAR],
            created_at=datetime.now()
        )

        # 저장
        saved_session = repo.save(study_session)
        assert saved_session.id is not None
        assert saved_session.id > 0

        # ID로 조회
        found_session = repo.find_by_id(saved_session.id)
        assert found_session is not None
        assert found_session.user_id == 1
        assert found_session.study_date == date(2025, 1, 4)
        assert found_session.study_hour == 14
        assert found_session.total_questions == 20
        assert found_session.correct_count == 17
        assert found_session.time_spent_minutes == 45
        assert found_session.level == JLPTLevel.N5
        assert found_session.question_types == [QuestionType.VOCABULARY, QuestionType.GRAMMAR]

    def test_study_session_repository_find_by_user_id(self, temp_db):
        """사용자 ID로 StudySession 조회 테스트"""
        from backend.infrastructure.repositories.study_session_repository import SqliteStudySessionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteStudySessionRepository(db=db)

        # 여러 StudySession 생성
        session1 = StudySession(
            id=None, user_id=1, study_date=date(2025, 1, 4), study_hour=10,
            total_questions=20, correct_count=17, time_spent_minutes=25
        )
        session2 = StudySession(
            id=None, user_id=1, study_date=date(2025, 1, 5), study_hour=14,
            total_questions=15, correct_count=12, time_spent_minutes=20
        )
        session3 = StudySession(
            id=None, user_id=2, study_date=date(2025, 1, 4), study_hour=10,
            total_questions=20, correct_count=17, time_spent_minutes=25
        )

        repo.save(session1)
        repo.save(session2)
        repo.save(session3)

        # user_id=1의 세션만 조회
        sessions = repo.find_by_user_id(1)
        assert len(sessions) == 2
        assert all(s.user_id == 1 for s in sessions)

    def test_study_session_table_creation(self, temp_db):
        """StudySession 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        # Repository를 생성하면 테이블이 자동 생성됨
        from backend.infrastructure.repositories.study_session_repository import SqliteStudySessionRepository
        repo = SqliteStudySessionRepository(db=db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='study_sessions'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'study_sessions'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(study_sessions)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'user_id', 'study_date', 'study_hour',
                'total_questions', 'correct_count', 'time_spent_minutes',
                'level', 'question_types', 'created_at'
            ]

            for col in expected_columns:
                assert col in column_names

