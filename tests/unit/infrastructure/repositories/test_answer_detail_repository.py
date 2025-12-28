"""
SQLite AnswerDetail Repository 인프라 테스트
TDD 방식으로 AnswerDetailRepository 구현 검증
"""

import pytest
import os
import tempfile
from datetime import datetime
from backend.domain.entities.answer_detail import AnswerDetail
from backend.domain.value_objects.jlpt import QuestionType


class TestSqliteAnswerDetailRepository:
    """SQLite AnswerDetail Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_answer_detail_repository_save_and_find(self, temp_db):
        """AnswerDetailRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # 새 AnswerDetail 생성
        answer_detail = AnswerDetail(
            id=None,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=3,
            question_type=QuestionType.VOCABULARY,
            created_at=datetime.now()
        )

        # 저장
        saved_detail = repo.save(answer_detail)
        assert saved_detail.id is not None
        assert saved_detail.id > 0

        # ID로 조회
        found_detail = repo.find_by_id(saved_detail.id)
        assert found_detail is not None
        assert found_detail.result_id == 1
        assert found_detail.question_id == 1
        assert found_detail.user_answer == "A"
        assert found_detail.correct_answer == "A"
        assert found_detail.is_correct is True
        assert found_detail.time_spent_seconds == 30
        assert found_detail.difficulty == 3
        assert found_detail.question_type == QuestionType.VOCABULARY

    def test_answer_detail_table_creation(self, temp_db):
        """AnswerDetail 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='answer_details'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'answer_details'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(answer_details)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'result_id', 'question_id', 'user_answer',
                'correct_answer', 'is_correct', 'time_spent_seconds',
                'difficulty', 'question_type', 'created_at'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_answer_detail_mapper_to_entity(self):
        """AnswerDetailMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.answer_detail_mapper import AnswerDetailMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

        row = MockRow({
            'id': 1,
            'result_id': 1,
            'question_id': 1,
            'user_answer': 'A',
            'correct_answer': 'A',
            'is_correct': 1,
            'time_spent_seconds': 30,
            'difficulty': 3,
            'question_type': 'vocabulary',
            'created_at': '2024-01-01T00:00:00'
        })

        answer_detail = AnswerDetailMapper.to_entity(row)

        assert answer_detail.id == 1
        assert answer_detail.result_id == 1
        assert answer_detail.question_id == 1
        assert answer_detail.user_answer == 'A'
        assert answer_detail.correct_answer == 'A'
        assert answer_detail.is_correct is True
        assert answer_detail.time_spent_seconds == 30
        assert answer_detail.difficulty == 3
        assert answer_detail.question_type == QuestionType.VOCABULARY

    def test_answer_detail_mapper_to_dict(self):
        """AnswerDetailMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.answer_detail_mapper import AnswerDetailMapper

        answer_detail = AnswerDetail(
            id=1,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=3,
            question_type=QuestionType.VOCABULARY,
            created_at=datetime.now()
        )

        data = AnswerDetailMapper.to_dict(answer_detail)

        assert data['result_id'] == 1
        assert data['question_id'] == 1
        assert data['user_answer'] == 'A'
        assert data['correct_answer'] == 'A'
        assert data['is_correct'] == 1
        assert data['time_spent_seconds'] == 30
        assert data['difficulty'] == 3
        assert data['question_type'] == 'vocabulary'

    def test_answer_detail_repository_update(self, temp_db):
        """AnswerDetailRepository 업데이트 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # AnswerDetail 생성
        detail = AnswerDetail(
            id=None, result_id=1, question_id=1,
            user_answer="A", correct_answer="B", is_correct=False,
            time_spent_seconds=30, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        saved_detail = repo.save(detail)

        # AnswerDetail 업데이트
        updated_detail = AnswerDetail(
            id=saved_detail.id, result_id=1, question_id=1,
            user_answer="B", correct_answer="B", is_correct=True,
            time_spent_seconds=25, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        updated = repo.save(updated_detail)

        # 업데이트 확인
        found_detail = repo.find_by_id(updated.id)
        assert found_detail.is_correct is True
        assert found_detail.user_answer == "B"
        assert found_detail.time_spent_seconds == 25

    def test_answer_detail_repository_find_all(self, temp_db):
        """AnswerDetailRepository find_all 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # 여러 AnswerDetail 생성
        d1 = AnswerDetail(
            id=None, result_id=1, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=30, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        d2 = AnswerDetail(
            id=None, result_id=1, question_id=2,
            user_answer="B", correct_answer="C", is_correct=False,
            time_spent_seconds=45, difficulty=4,
            question_type=QuestionType.GRAMMAR
        )
        d3 = AnswerDetail(
            id=None, result_id=2, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=20, difficulty=2,
            question_type=QuestionType.VOCABULARY
        )

        repo.save(d1)
        repo.save(d2)
        repo.save(d3)

        # 모든 AnswerDetail 조회
        all_details = repo.find_all()
        assert len(all_details) == 3

    def test_answer_detail_repository_delete(self, temp_db):
        """AnswerDetailRepository delete 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # AnswerDetail 생성
        detail = AnswerDetail(
            id=None, result_id=1, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=30, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        saved_detail = repo.save(detail)

        # 삭제
        repo.delete(saved_detail)

        # 삭제 확인
        found_detail = repo.find_by_id(saved_detail.id)
        assert found_detail is None

    def test_answer_detail_repository_exists_by_id(self, temp_db):
        """AnswerDetailRepository exists_by_id 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # AnswerDetail 생성
        detail = AnswerDetail(
            id=None, result_id=1, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=30, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        saved_detail = repo.save(detail)

        # 존재 확인
        assert repo.exists_by_id(saved_detail.id) is True
        assert repo.exists_by_id(999) is False

    def test_answer_detail_repository_find_by_result_id(self, temp_db):
        """AnswerDetailRepository find_by_result_id 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # 여러 AnswerDetail 생성
        d1 = AnswerDetail(
            id=None, result_id=1, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=30, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        d2 = AnswerDetail(
            id=None, result_id=1, question_id=2,
            user_answer="B", correct_answer="C", is_correct=False,
            time_spent_seconds=45, difficulty=4,
            question_type=QuestionType.GRAMMAR
        )
        d3 = AnswerDetail(
            id=None, result_id=2, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=20, difficulty=2,
            question_type=QuestionType.VOCABULARY
        )

        repo.save(d1)
        repo.save(d2)
        repo.save(d3)

        # result_id=1의 AnswerDetail만 조회
        result_details = repo.find_by_result_id(1)
        assert len(result_details) == 2
        assert all(d.result_id == 1 for d in result_details)

    def test_answer_detail_repository_find_by_question_id(self, temp_db):
        """AnswerDetailRepository find_by_question_id 기능 테스트"""
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteAnswerDetailRepository(db=db)

        # 여러 AnswerDetail 생성
        d1 = AnswerDetail(
            id=None, result_id=1, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=30, difficulty=3,
            question_type=QuestionType.VOCABULARY
        )
        d2 = AnswerDetail(
            id=None, result_id=1, question_id=2,
            user_answer="B", correct_answer="C", is_correct=False,
            time_spent_seconds=45, difficulty=4,
            question_type=QuestionType.GRAMMAR
        )
        d3 = AnswerDetail(
            id=None, result_id=2, question_id=1,
            user_answer="A", correct_answer="A", is_correct=True,
            time_spent_seconds=20, difficulty=2,
            question_type=QuestionType.VOCABULARY
        )

        repo.save(d1)
        repo.save(d2)
        repo.save(d3)

        # question_id=1의 AnswerDetail만 조회
        question_details = repo.find_by_question_id(1)
        assert len(question_details) == 2
        assert all(d.question_id == 1 for d in question_details)
