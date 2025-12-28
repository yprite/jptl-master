"""
SQLite Result Repository 인프라 테스트
TDD 방식으로 ResultRepository 구현 검증
"""

import pytest
import os
import json
import tempfile
from datetime import datetime
from backend.domain.entities.result import Result
from backend.domain.value_objects.jlpt import JLPTLevel


class TestSqliteResultRepository:
    """SQLite Result Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_result_repository_save_and_find(self, temp_db):
        """ResultRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 새 결과 생성
        result = Result(
            id=0,
            test_id=1,
            user_id=1,
            score=85.5,
            assessed_level=JLPTLevel.N5,
            recommended_level=JLPTLevel.N4,
            correct_answers_count=17,
            total_questions_count=20,
            time_taken_minutes=45,
            question_type_analysis={
                "vocabulary": {"correct": 8, "total": 10},
                "grammar": {"correct": 9, "total": 10}
            }
        )

        # 저장
        saved_result = repo.save(result)
        assert saved_result.id is not None
        assert saved_result.id > 0

        # ID로 조회
        found_result = repo.find_by_id(saved_result.id)
        assert found_result is not None
        assert found_result.test_id == 1
        assert found_result.user_id == 1
        assert found_result.score == 85.5
        assert found_result.assessed_level == JLPTLevel.N5
        assert found_result.recommended_level == JLPTLevel.N4
        assert found_result.correct_answers_count == 17
        assert found_result.total_questions_count == 20
        assert found_result.time_taken_minutes == 45

    def test_result_table_creation(self, temp_db):
        """결과 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='results'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'results'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(results)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'test_id', 'user_id', 'attempt_id',
                'score', 'assessed_level', 'recommended_level',
                'correct_answers_count', 'total_questions_count',
                'time_taken_minutes', 'performance_level', 'feedback',
                'created_at', 'question_type_analysis'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_result_mapper_to_entity(self):
        """ResultMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.result_mapper import ResultMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

        row = MockRow({
            'id': 1,
            'test_id': 1,
            'user_id': 1,
            'attempt_id': 1,
            'score': 85.5,
            'assessed_level': 'N5',
            'recommended_level': 'N4',
            'correct_answers_count': 17,
            'total_questions_count': 20,
            'time_taken_minutes': 45,
            'question_type_analysis': '{"vocabulary": {"correct": 8, "total": 10}}',
            'created_at': '2024-01-01T00:00:00'
        })

        result = ResultMapper.to_entity(row)

        assert result.id == 1
        assert result.test_id == 1
        assert result.user_id == 1
        assert result.score == 85.5
        assert result.assessed_level == JLPTLevel.N5
        assert result.recommended_level == JLPTLevel.N4
        assert result.correct_answers_count == 17
        assert result.total_questions_count == 20
        assert result.time_taken_minutes == 45
        assert 'vocabulary' in result.question_type_analysis

    def test_result_mapper_to_dict(self):
        """ResultMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.result_mapper import ResultMapper

        result = Result(
            id=1,
            test_id=1,
            user_id=1,
            score=85.5,
            assessed_level=JLPTLevel.N5,
            recommended_level=JLPTLevel.N4,
            correct_answers_count=17,
            total_questions_count=20,
            time_taken_minutes=45,
            question_type_analysis={
                "vocabulary": {"correct": 8, "total": 10}
            }
        )

        data = ResultMapper.to_dict(result)

        assert data['test_id'] == 1
        assert data['user_id'] == 1
        assert data['score'] == 85.5
        assert data['assessed_level'] == 'N5'
        assert data['recommended_level'] == 'N4'
        assert data['correct_answers_count'] == 17
        assert data['total_questions_count'] == 20
        assert data['time_taken_minutes'] == 45
        # question_type_analysis는 JSON 문자열로 저장됨
        analysis = json.loads(data['question_type_analysis'])
        assert 'vocabulary' in analysis

    def test_result_repository_update(self, temp_db):
        """ResultRepository 업데이트 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 결과 생성
        result = Result(
            id=0, test_id=1, user_id=1, score=75.0,
            assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
            correct_answers_count=15, total_questions_count=20,
            time_taken_minutes=50
        )
        saved_result = repo.save(result)

        # 결과 업데이트 (새 Result 객체 생성)
        updated_result = Result(
            id=saved_result.id, test_id=1, user_id=1, score=90.0,
            assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
            correct_answers_count=18, total_questions_count=20,
            time_taken_minutes=45
        )
        updated = repo.save(updated_result)

        # 업데이트 확인
        found_result = repo.find_by_id(updated.id)
        assert found_result.score == 90.0
        assert found_result.recommended_level == JLPTLevel.N4
        assert found_result.correct_answers_count == 18

    def test_result_repository_find_all(self, temp_db):
        """ResultRepository find_all 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 여러 결과 생성
        r1 = Result(id=0, test_id=1, user_id=1, score=75.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=15, total_questions_count=20,
                   time_taken_minutes=50)
        r2 = Result(id=0, test_id=2, user_id=1, score=85.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                   correct_answers_count=17, total_questions_count=20,
                   time_taken_minutes=45)
        r3 = Result(id=0, test_id=1, user_id=2, score=80.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=16, total_questions_count=20,
                   time_taken_minutes=48)

        repo.save(r1)
        repo.save(r2)
        repo.save(r3)

        # 모든 결과 조회
        all_results = repo.find_all()
        assert len(all_results) == 3

    def test_result_repository_delete(self, temp_db):
        """ResultRepository delete 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 결과 생성
        result = Result(id=0, test_id=1, user_id=1, score=75.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=15, total_questions_count=20,
                       time_taken_minutes=50)
        saved_result = repo.save(result)

        # 삭제
        repo.delete(saved_result)

        # 삭제 확인
        found_result = repo.find_by_id(saved_result.id)
        assert found_result is None

    def test_result_repository_exists_by_id(self, temp_db):
        """ResultRepository exists_by_id 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 결과 생성
        result = Result(id=0, test_id=1, user_id=1, score=75.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=15, total_questions_count=20,
                       time_taken_minutes=50)
        saved_result = repo.save(result)

        # 존재 확인
        assert repo.exists_by_id(saved_result.id) is True
        assert repo.exists_by_id(999) is False

    def test_result_repository_find_by_user_id(self, temp_db):
        """ResultRepository find_by_user_id 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 여러 결과 생성
        r1 = Result(id=0, test_id=1, user_id=1, score=75.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=15, total_questions_count=20,
                   time_taken_minutes=50)
        r2 = Result(id=0, test_id=2, user_id=1, score=85.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                   correct_answers_count=17, total_questions_count=20,
                   time_taken_minutes=45)
        r3 = Result(id=0, test_id=1, user_id=2, score=80.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=16, total_questions_count=20,
                   time_taken_minutes=48)

        repo.save(r1)
        repo.save(r2)
        repo.save(r3)

        # user_id=1의 결과만 조회
        user_results = repo.find_by_user_id(1)
        assert len(user_results) == 2
        assert all(r.user_id == 1 for r in user_results)

    def test_result_repository_find_by_test_id(self, temp_db):
        """ResultRepository find_by_test_id 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 여러 결과 생성
        r1 = Result(id=0, test_id=1, user_id=1, score=75.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=15, total_questions_count=20,
                   time_taken_minutes=50)
        r2 = Result(id=0, test_id=2, user_id=1, score=85.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                   correct_answers_count=17, total_questions_count=20,
                   time_taken_minutes=45)
        r3 = Result(id=0, test_id=1, user_id=2, score=80.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=16, total_questions_count=20,
                   time_taken_minutes=48)

        repo.save(r1)
        repo.save(r2)
        repo.save(r3)

        # test_id=1의 결과만 조회
        test_results = repo.find_by_test_id(1)
        assert len(test_results) == 2
        assert all(r.test_id == 1 for r in test_results)

    def test_result_repository_find_recent_by_user(self, temp_db):
        """ResultRepository find_recent_by_user 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 여러 결과 생성
        for i in range(15):
            result = Result(
                id=0, test_id=1, user_id=1, score=75.0 + i,
                assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                correct_answers_count=15, total_questions_count=20,
                time_taken_minutes=50
            )
            repo.save(result)

        # 최근 10개 조회
        recent_results = repo.find_recent_by_user(1, limit=10)
        assert len(recent_results) == 10

        # limit보다 적은 경우
        recent_results = repo.find_recent_by_user(1, limit=20)
        assert len(recent_results) == 15  # 전체 개수만큼 반환

    def test_result_repository_get_user_average_score(self, temp_db):
        """ResultRepository get_user_average_score 기능 테스트"""
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteResultRepository(db=db)

        # 여러 결과 생성
        r1 = Result(id=0, test_id=1, user_id=1, score=70.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=14, total_questions_count=20,
                   time_taken_minutes=50)
        r2 = Result(id=0, test_id=2, user_id=1, score=80.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                   correct_answers_count=16, total_questions_count=20,
                   time_taken_minutes=45)
        r3 = Result(id=0, test_id=3, user_id=1, score=90.0,
                   assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                   correct_answers_count=18, total_questions_count=20,
                   time_taken_minutes=40)

        repo.save(r1)
        repo.save(r2)
        repo.save(r3)

        # 평균 점수 계산
        avg_score = repo.get_user_average_score(1)
        assert avg_score == 80.0  # (70 + 80 + 90) / 3

        # 결과가 없는 경우
        avg_score = repo.get_user_average_score(999)
        assert avg_score == 0.0

