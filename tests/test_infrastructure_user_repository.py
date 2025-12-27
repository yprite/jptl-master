"""
SQLite User Repository 인프라 테스트
TDD 방식으로 UserRepository 구현 검증
"""

import pytest
import os
import tempfile
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class TestSqliteUserRepository:
    """SQLite User Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_user_repository_save_and_find(self, temp_db):
        """UserRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteUserRepository(db=db)

        # 새 사용자 생성
        user = User(
            id=None,  # 새 사용자이므로 ID는 None
            email="test@example.com",
            username="testuser",
            target_level=JLPTLevel.N5
        )

        # 저장
        saved_user = repo.save(user)
        assert saved_user.id is not None

        # ID로 조회
        found_user = repo.find_by_id(saved_user.id)
        assert found_user is not None
        assert found_user.email == "test@example.com"
        assert found_user.username == "testuser"
        assert found_user.target_level == JLPTLevel.N5

        # 이메일로 조회
        found_by_email = repo.find_by_email("test@example.com")
        assert found_by_email is not None
        assert found_by_email.id == saved_user.id

        # 사용자명으로 조회
        found_by_username = repo.find_by_username("testuser")
        assert found_by_username is not None
        assert found_by_username.id == saved_user.id

    def test_database_connection(self, temp_db):
        """데이터베이스 연결이 정상 작동하는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        # 연결 테스트
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            assert result[0] == 1

    def test_user_table_creation(self, temp_db):
        """사용자 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='users'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'users'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'email', 'username', 'target_level',
                'current_level', 'total_tests_taken', 'study_streak',
                'preferred_question_types', 'created_at', 'updated_at'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_user_mapper_to_entity(self):
        """UserMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.user_mapper import UserMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

        row = MockRow({
            'id': 1,
            'email': 'test@example.com',
            'username': 'testuser',
            'target_level': 'N5',
            'current_level': 'N4',
            'total_tests_taken': 5,
            'study_streak': 3,
            'preferred_question_types': '["vocabulary", "grammar"]',
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-02T00:00:00'
        })

        user = UserMapper.to_entity(row)

        assert user.id == 1
        assert user.email == 'test@example.com'
        assert user.username == 'testuser'
        assert user.target_level == JLPTLevel.N5
        assert user.current_level == JLPTLevel.N4
        assert user.total_tests_taken == 5
        assert user.study_streak == 3
        assert len(user.preferred_question_types) == 2
        assert user.preferred_question_types[0] == QuestionType.VOCABULARY

    def test_user_mapper_to_dict(self):
        """UserMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.user_mapper import UserMapper
        from datetime import datetime

        user = User(
            id=1,
            email='test@example.com',
            username='testuser',
            target_level=JLPTLevel.N5,
            current_level=JLPTLevel.N4,
            total_tests_taken=5,
            study_streak=3,
            preferred_question_types=[QuestionType.VOCABULARY, QuestionType.GRAMMAR],
            created_at=datetime(2024, 1, 1),
            updated_at=datetime(2024, 1, 2)
        )

        data = UserMapper.to_dict(user)

        assert data['email'] == 'test@example.com'
        assert data['username'] == 'testuser'
        assert data['target_level'] == 'N5'
        assert data['current_level'] == 'N4'
        assert data['total_tests_taken'] == 5
        assert data['study_streak'] == 3
        assert 'vocabulary' in data['preferred_question_types']
        assert 'grammar' in data['preferred_question_types']
