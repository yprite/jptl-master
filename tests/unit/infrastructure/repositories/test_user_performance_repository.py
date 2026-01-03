"""
SQLite UserPerformance Repository 인프라 테스트
TDD 방식으로 UserPerformanceRepository 구현 검증
"""

import pytest
import os
import tempfile
import json
from datetime import datetime, date
from backend.domain.entities.user_performance import UserPerformance


class TestSqliteUserPerformanceRepository:
    """SQLite UserPerformance Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_user_performance_repository_save_and_find(self, temp_db):
        """UserPerformanceRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteUserPerformanceRepository(db=db)

        # 새 UserPerformance 생성
        user_performance = UserPerformance(
            id=None,
            user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31),
            type_performance={"vocabulary": {"accuracy": 80.0}},
            difficulty_performance={"easy": {"accuracy": 90.0}},
            level_progression={"N5": {"score": 85.0}},
            repeated_mistakes=[1, 2, 3],
            weaknesses={"grammar": "weak"},
            created_at=datetime.now()
        )

        # 저장
        saved_performance = repo.save(user_performance)
        assert saved_performance.id is not None
        assert saved_performance.id > 0

        # ID로 조회
        found_performance = repo.find_by_id(saved_performance.id)
        assert found_performance is not None
        assert found_performance.user_id == 1
        assert found_performance.analysis_period_start == date(2024, 1, 1)
        assert found_performance.analysis_period_end == date(2024, 1, 31)
        assert found_performance.type_performance == {"vocabulary": {"accuracy": 80.0}}
        assert found_performance.difficulty_performance == {"easy": {"accuracy": 90.0}}
        assert found_performance.level_progression == {"N5": {"score": 85.0}}
        assert found_performance.repeated_mistakes == [1, 2, 3]
        assert found_performance.weaknesses == {"grammar": "weak"}

    def test_user_performance_table_creation(self, temp_db):
        """UserPerformance 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='user_performance'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'user_performance'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(user_performance)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'user_id', 'analysis_period_start', 'analysis_period_end',
                'type_performance', 'difficulty_performance', 'level_progression',
                'repeated_mistakes', 'weaknesses', 'created_at', 'updated_at'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_user_performance_mapper_to_entity(self):
        """UserPerformanceMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.user_performance_mapper import UserPerformanceMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]
            
            def get(self, key, default=None):
                return self.data.get(key, default)

        row = MockRow({
            'id': 1,
            'user_id': 1,
            'analysis_period_start': '2024-01-01',
            'analysis_period_end': '2024-01-31',
            'type_performance': '{"vocabulary": {"accuracy": 80.0}}',
            'difficulty_performance': '{"easy": {"accuracy": 90.0}}',
            'level_progression': '{"N5": {"score": 85.0}}',
            'repeated_mistakes': '[1, 2, 3]',
            'weaknesses': '{"grammar": "weak"}',
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        })

        user_performance = UserPerformanceMapper.to_entity(row)

        assert user_performance.id == 1
        assert user_performance.user_id == 1
        assert user_performance.analysis_period_start == date(2024, 1, 1)
        assert user_performance.analysis_period_end == date(2024, 1, 31)
        assert user_performance.type_performance == {"vocabulary": {"accuracy": 80.0}}
        assert user_performance.difficulty_performance == {"easy": {"accuracy": 90.0}}
        assert user_performance.level_progression == {"N5": {"score": 85.0}}
        assert user_performance.repeated_mistakes == [1, 2, 3]
        assert user_performance.weaknesses == {"grammar": "weak"}

    def test_user_performance_mapper_to_dict(self):
        """UserPerformanceMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.user_performance_mapper import UserPerformanceMapper

        user_performance = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31),
            type_performance={"vocabulary": {"accuracy": 80.0}},
            difficulty_performance={"easy": {"accuracy": 90.0}},
            level_progression={"N5": {"score": 85.0}},
            repeated_mistakes=[1, 2, 3],
            weaknesses={"grammar": "weak"},
            created_at=datetime.now()
        )

        data = UserPerformanceMapper.to_dict(user_performance)

        assert data['user_id'] == 1
        assert data['analysis_period_start'] == '2024-01-01'
        assert data['analysis_period_end'] == '2024-01-31'
        assert json.loads(data['type_performance']) == {"vocabulary": {"accuracy": 80.0}}
        assert json.loads(data['difficulty_performance']) == {"easy": {"accuracy": 90.0}}
        assert json.loads(data['level_progression']) == {"N5": {"score": 85.0}}
        assert json.loads(data['repeated_mistakes']) == [1, 2, 3]
        assert json.loads(data['weaknesses']) == {"grammar": "weak"}

    def test_user_performance_repository_update(self, temp_db):
        """UserPerformanceRepository 업데이트 기능 테스트"""
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteUserPerformanceRepository(db=db)

        # UserPerformance 생성
        performance = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31),
            type_performance={"vocabulary": {"accuracy": 70.0}}
        )
        saved_performance = repo.save(performance)

        # UserPerformance 업데이트
        updated_performance = UserPerformance(
            id=saved_performance.id, user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31),
            type_performance={"vocabulary": {"accuracy": 85.0}},
            difficulty_performance={"easy": {"accuracy": 90.0}}
        )
        updated = repo.save(updated_performance)

        # 업데이트 확인
        found_performance = repo.find_by_id(updated.id)
        assert found_performance.type_performance == {"vocabulary": {"accuracy": 85.0}}
        assert found_performance.difficulty_performance == {"easy": {"accuracy": 90.0}}

    def test_user_performance_repository_find_all(self, temp_db):
        """UserPerformanceRepository find_all 기능 테스트"""
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteUserPerformanceRepository(db=db)

        # 여러 UserPerformance 생성
        p1 = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31)
        )
        p2 = UserPerformance(
            id=None, user_id=2,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31)
        )
        p3 = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 2, 1),
            analysis_period_end=date(2024, 2, 28)
        )

        repo.save(p1)
        repo.save(p2)
        repo.save(p3)

        # 모든 UserPerformance 조회
        all_performances = repo.find_all()
        assert len(all_performances) == 3

    def test_user_performance_repository_delete(self, temp_db):
        """UserPerformanceRepository delete 기능 테스트"""
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteUserPerformanceRepository(db=db)

        # UserPerformance 생성
        performance = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31)
        )
        saved_performance = repo.save(performance)

        # 삭제
        repo.delete(saved_performance)

        # 삭제 확인
        found_performance = repo.find_by_id(saved_performance.id)
        assert found_performance is None

    def test_user_performance_repository_exists_by_id(self, temp_db):
        """UserPerformanceRepository exists_by_id 기능 테스트"""
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteUserPerformanceRepository(db=db)

        # UserPerformance 생성
        performance = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31)
        )
        saved_performance = repo.save(performance)

        # 존재 확인
        assert repo.exists_by_id(saved_performance.id) is True
        assert repo.exists_by_id(999) is False

    def test_user_performance_repository_find_by_user_id(self, temp_db):
        """UserPerformanceRepository find_by_user_id 기능 테스트"""
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteUserPerformanceRepository(db=db)

        # 여러 UserPerformance 생성
        p1 = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31)
        )
        p2 = UserPerformance(
            id=None, user_id=1,
            analysis_period_start=date(2024, 2, 1),
            analysis_period_end=date(2024, 2, 28)
        )
        p3 = UserPerformance(
            id=None, user_id=2,
            analysis_period_start=date(2024, 1, 1),
            analysis_period_end=date(2024, 1, 31)
        )

        repo.save(p1)
        repo.save(p2)
        repo.save(p3)

        # user_id=1의 UserPerformance만 조회
        user_performances = repo.find_by_user_id(1)
        assert len(user_performances) == 2
        assert all(p.user_id == 1 for p in user_performances)
