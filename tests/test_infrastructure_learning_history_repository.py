"""
SQLite LearningHistory Repository 인프라 테스트
TDD 방식으로 LearningHistoryRepository 구현 검증
"""

import pytest
import os
import tempfile
from datetime import datetime, date
from backend.domain.entities.learning_history import LearningHistory


class TestSqliteLearningHistoryRepository:
    """SQLite LearningHistory Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_learning_history_repository_save_and_find(self, temp_db):
        """LearningHistoryRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # 새 LearningHistory 생성
        learning_history = LearningHistory(
            id=None,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2024, 1, 1),
            study_hour=14,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=45,
            created_at=datetime.now()
        )

        # 저장
        saved_history = repo.save(learning_history)
        assert saved_history.id is not None
        assert saved_history.id > 0

        # ID로 조회
        found_history = repo.find_by_id(saved_history.id)
        assert found_history is not None
        assert found_history.user_id == 1
        assert found_history.test_id == 1
        assert found_history.result_id == 1
        assert found_history.study_date == date(2024, 1, 1)
        assert found_history.study_hour == 14
        assert found_history.total_questions == 20
        assert found_history.correct_count == 17
        assert found_history.time_spent_minutes == 45

    def test_learning_history_table_creation(self, temp_db):
        """LearningHistory 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='learning_history'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'learning_history'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(learning_history)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'user_id', 'test_id', 'result_id', 'study_date',
                'study_hour', 'total_questions', 'correct_count',
                'time_spent_minutes', 'created_at'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_learning_history_mapper_to_entity(self):
        """LearningHistoryMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.learning_history_mapper import LearningHistoryMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

        row = MockRow({
            'id': 1,
            'user_id': 1,
            'test_id': 1,
            'result_id': 1,
            'study_date': '2024-01-01',
            'study_hour': 14,
            'total_questions': 20,
            'correct_count': 17,
            'time_spent_minutes': 45,
            'created_at': '2024-01-01T14:00:00'
        })

        learning_history = LearningHistoryMapper.to_entity(row)

        assert learning_history.id == 1
        assert learning_history.user_id == 1
        assert learning_history.test_id == 1
        assert learning_history.result_id == 1
        assert learning_history.study_date == date(2024, 1, 1)
        assert learning_history.study_hour == 14
        assert learning_history.total_questions == 20
        assert learning_history.correct_count == 17
        assert learning_history.time_spent_minutes == 45

    def test_learning_history_mapper_to_dict(self):
        """LearningHistoryMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.learning_history_mapper import LearningHistoryMapper

        learning_history = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2024, 1, 1),
            study_hour=14,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=45,
            created_at=datetime.now()
        )

        data = LearningHistoryMapper.to_dict(learning_history)

        assert data['user_id'] == 1
        assert data['test_id'] == 1
        assert data['result_id'] == 1
        assert data['study_date'] == '2024-01-01'
        assert data['study_hour'] == 14
        assert data['total_questions'] == 20
        assert data['correct_count'] == 17
        assert data['time_spent_minutes'] == 45

    def test_learning_history_repository_update(self, temp_db):
        """LearningHistoryRepository 업데이트 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # LearningHistory 생성
        history = LearningHistory(
            id=None, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=14,
            total_questions=20, correct_count=15,
            time_spent_minutes=50
        )
        saved_history = repo.save(history)

        # LearningHistory 업데이트
        updated_history = LearningHistory(
            id=saved_history.id, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=15,
            total_questions=20, correct_count=18,
            time_spent_minutes=45
        )
        updated = repo.save(updated_history)

        # 업데이트 확인
        found_history = repo.find_by_id(updated.id)
        assert found_history.correct_count == 18
        assert found_history.study_hour == 15
        assert found_history.time_spent_minutes == 45

    def test_learning_history_repository_find_all(self, temp_db):
        """LearningHistoryRepository find_all 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # 여러 LearningHistory 생성
        h1 = LearningHistory(
            id=None, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=14,
            total_questions=20, correct_count=17,
            time_spent_minutes=45
        )
        h2 = LearningHistory(
            id=None, user_id=1, test_id=2, result_id=2,
            study_date=date(2024, 1, 2), study_hour=15,
            total_questions=20, correct_count=18,
            time_spent_minutes=40
        )
        h3 = LearningHistory(
            id=None, user_id=2, test_id=1, result_id=3,
            study_date=date(2024, 1, 1), study_hour=10,
            total_questions=20, correct_count=16,
            time_spent_minutes=50
        )

        repo.save(h1)
        repo.save(h2)
        repo.save(h3)

        # 모든 LearningHistory 조회
        all_histories = repo.find_all()
        assert len(all_histories) == 3

    def test_learning_history_repository_delete(self, temp_db):
        """LearningHistoryRepository delete 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # LearningHistory 생성
        history = LearningHistory(
            id=None, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=14,
            total_questions=20, correct_count=17,
            time_spent_minutes=45
        )
        saved_history = repo.save(history)

        # 삭제
        repo.delete(saved_history)

        # 삭제 확인
        found_history = repo.find_by_id(saved_history.id)
        assert found_history is None

    def test_learning_history_repository_exists_by_id(self, temp_db):
        """LearningHistoryRepository exists_by_id 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # LearningHistory 생성
        history = LearningHistory(
            id=None, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=14,
            total_questions=20, correct_count=17,
            time_spent_minutes=45
        )
        saved_history = repo.save(history)

        # 존재 확인
        assert repo.exists_by_id(saved_history.id) is True
        assert repo.exists_by_id(999) is False

    def test_learning_history_repository_find_by_user_id(self, temp_db):
        """LearningHistoryRepository find_by_user_id 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # 여러 LearningHistory 생성
        h1 = LearningHistory(
            id=None, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=14,
            total_questions=20, correct_count=17,
            time_spent_minutes=45
        )
        h2 = LearningHistory(
            id=None, user_id=1, test_id=2, result_id=2,
            study_date=date(2024, 1, 2), study_hour=15,
            total_questions=20, correct_count=18,
            time_spent_minutes=40
        )
        h3 = LearningHistory(
            id=None, user_id=2, test_id=1, result_id=3,
            study_date=date(2024, 1, 1), study_hour=10,
            total_questions=20, correct_count=16,
            time_spent_minutes=50
        )

        repo.save(h1)
        repo.save(h2)
        repo.save(h3)

        # user_id=1의 LearningHistory만 조회
        user_histories = repo.find_by_user_id(1)
        assert len(user_histories) == 2
        assert all(h.user_id == 1 for h in user_histories)

    def test_learning_history_repository_find_by_study_date(self, temp_db):
        """LearningHistoryRepository find_by_study_date 기능 테스트"""
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteLearningHistoryRepository(db=db)

        # 여러 LearningHistory 생성
        h1 = LearningHistory(
            id=None, user_id=1, test_id=1, result_id=1,
            study_date=date(2024, 1, 1), study_hour=14,
            total_questions=20, correct_count=17,
            time_spent_minutes=45
        )
        h2 = LearningHistory(
            id=None, user_id=1, test_id=2, result_id=2,
            study_date=date(2024, 1, 2), study_hour=15,
            total_questions=20, correct_count=18,
            time_spent_minutes=40
        )
        h3 = LearningHistory(
            id=None, user_id=2, test_id=1, result_id=3,
            study_date=date(2024, 1, 1), study_hour=10,
            total_questions=20, correct_count=16,
            time_spent_minutes=50
        )

        repo.save(h1)
        repo.save(h2)
        repo.save(h3)

        # study_date=2024-01-01의 LearningHistory만 조회
        date_histories = repo.find_by_study_date(date(2024, 1, 1))
        assert len(date_histories) == 2
        assert all(h.study_date == date(2024, 1, 1) for h in date_histories)
