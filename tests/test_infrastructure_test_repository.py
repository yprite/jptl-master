"""
SQLite Test Repository 인프라 테스트
TDD 방식으로 TestRepository 구현 검증
"""

import pytest
import os
import json
import tempfile
from datetime import datetime
from backend.domain.entities.test import Test
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType, TestStatus


class TestSqliteTestRepository:
    """SQLite Test Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def sample_questions(self):
        """샘플 문제들 생성"""
        return [
            Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="E1", difficulty=1),
            Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="A",
                    explanation="E2", difficulty=1),
        ]

    @pytest.fixture
    def saved_questions(self, temp_db, sample_questions):
        """저장된 샘플 문제들"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        question_repo = SqliteQuestionRepository(db=db)
        
        saved = []
        for q in sample_questions:
            saved_q = question_repo.save(q)
            saved.append(saved_q)
        return saved

    def test_test_repository_save_and_find(self, temp_db, saved_questions):
        """TestRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 새 테스트 생성
        test = Test(
            id=0,
            title="N5 진단 테스트",
            level=JLPTLevel.N5,
            questions=saved_questions,
            time_limit_minutes=60
        )

        # 저장
        saved_test = repo.save(test)
        assert saved_test.id is not None
        assert saved_test.id > 0

        # ID로 조회
        found_test = repo.find_by_id(saved_test.id)
        assert found_test is not None
        assert found_test.title == "N5 진단 테스트"
        assert found_test.level == JLPTLevel.N5
        assert len(found_test.questions) == 2
        assert found_test.time_limit_minutes == 60
        assert found_test.status == TestStatus.CREATED

    def test_test_table_creation(self, temp_db):
        """테스트 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='tests'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'tests'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(tests)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'title', 'level', 'question_ids',
                'time_limit_minutes', 'status', 'created_at',
                'started_at', 'completed_at', 'user_answers', 'score'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_test_mapper_to_entity(self, sample_questions):
        """TestMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.test_mapper import TestMapper
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database
        import tempfile

        # 임시 DB 생성 및 문제 저장
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            db = Database(db_path=db_path)
            question_repo = SqliteQuestionRepository(db=db)
            
            # 문제들을 먼저 저장
            for q in sample_questions:
                question_repo.save(q)

            # 모의 Row 객체 생성
            class MockRow:
                def __init__(self, data):
                    self.data = data

                def __getitem__(self, key):
                    return self.data[key]

            row = MockRow({
                'id': 1,
                'title': 'N5 진단 테스트',
                'level': 'N5',
                'question_ids': '[1, 2]',
                'time_limit_minutes': 60,
                'status': 'created',
                'created_at': '2024-01-01T00:00:00',
                'started_at': None,
                'completed_at': None,
                'user_answers': None,
                'score': None
            })

            test = TestMapper.to_entity(row, question_repo)

            assert test.id == 1
            assert test.title == 'N5 진단 테스트'
            assert test.level == JLPTLevel.N5
            assert len(test.questions) == 2
            assert test.time_limit_minutes == 60
            assert test.status == TestStatus.CREATED
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)

    def test_test_mapper_to_dict(self, saved_questions):
        """TestMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.test_mapper import TestMapper

        test = Test(
            id=1,
            title="N5 진단 테스트",
            level=JLPTLevel.N5,
            questions=saved_questions,
            time_limit_minutes=60
        )

        data = TestMapper.to_dict(test)

        assert data['title'] == "N5 진단 테스트"
        assert data['level'] == 'N5'
        assert data['time_limit_minutes'] == 60
        assert data['status'] == 'created'
        # question_ids는 JSON 배열로 저장됨
        question_ids = json.loads(data['question_ids'])
        assert len(question_ids) == 2
        assert 1 in question_ids
        assert 2 in question_ids

    def test_test_repository_update(self, temp_db, saved_questions):
        """TestRepository 업데이트 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 테스트 생성
        test = Test(
            id=0,
            title="N5 진단 테스트",
            level=JLPTLevel.N5,
            questions=saved_questions,
            time_limit_minutes=60
        )
        saved_test = repo.save(test)

        # 테스트 시작
        saved_test.start_test()
        updated_test = repo.save(saved_test)

        # 업데이트 확인
        found_test = repo.find_by_id(updated_test.id)
        assert found_test.status == TestStatus.IN_PROGRESS
        assert found_test.started_at is not None

    def test_test_repository_find_all(self, temp_db, saved_questions):
        """TestRepository find_all 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 여러 테스트 생성
        t1 = Test(id=0, title="Test 1", level=JLPTLevel.N5,
                 questions=saved_questions, time_limit_minutes=60)
        t2 = Test(id=0, title="Test 2", level=JLPTLevel.N4,
                 questions=saved_questions, time_limit_minutes=90)
        t3 = Test(id=0, title="Test 3", level=JLPTLevel.N5,
                 questions=saved_questions, time_limit_minutes=60)

        repo.save(t1)
        repo.save(t2)
        repo.save(t3)

        # 모든 테스트 조회
        all_tests = repo.find_all()
        assert len(all_tests) == 3

    def test_test_repository_delete(self, temp_db, saved_questions):
        """TestRepository delete 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 테스트 생성
        test = Test(id=0, title="Test 1", level=JLPTLevel.N5,
                   questions=saved_questions, time_limit_minutes=60)
        saved_test = repo.save(test)

        # 삭제
        repo.delete(saved_test)

        # 삭제 확인
        found_test = repo.find_by_id(saved_test.id)
        assert found_test is None

    def test_test_repository_exists_by_id(self, temp_db, saved_questions):
        """TestRepository exists_by_id 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 테스트 생성
        test = Test(id=0, title="Test 1", level=JLPTLevel.N5,
                   questions=saved_questions, time_limit_minutes=60)
        saved_test = repo.save(test)

        # 존재 확인
        assert repo.exists_by_id(saved_test.id) is True
        assert repo.exists_by_id(999) is False

    def test_test_repository_find_by_level(self, temp_db, sample_questions):
        """TestRepository find_by_level 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 여러 레벨의 테스트 생성
        t1 = Test(id=0, title="N5 Test", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)
        t2 = Test(id=0, title="N5 Test 2", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)
        t3 = Test(id=0, title="N4 Test", level=JLPTLevel.N4,
                 questions=sample_questions, time_limit_minutes=90)

        repo.save(t1)
        repo.save(t2)
        repo.save(t3)

        # N5 레벨 테스트만 조회
        n5_tests = repo.find_by_level(JLPTLevel.N5)
        assert len(n5_tests) == 2
        assert all(t.level == JLPTLevel.N5 for t in n5_tests)

    def test_test_repository_find_by_status(self, temp_db, sample_questions):
        """TestRepository find_by_status 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 여러 상태의 테스트 생성
        t1 = Test(id=0, title="Test 1", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)
        t2 = Test(id=0, title="Test 2", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)
        t3 = Test(id=0, title="Test 3", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)

        repo.save(t1)
        repo.save(t2)
        t2.start_test()
        repo.save(t2)
        repo.save(t3)

        # CREATED 상태 테스트만 조회
        created_tests = repo.find_by_status(TestStatus.CREATED)
        assert len(created_tests) == 2

        # IN_PROGRESS 상태 테스트만 조회
        in_progress_tests = repo.find_by_status(TestStatus.IN_PROGRESS)
        assert len(in_progress_tests) == 1

    def test_test_repository_find_active_tests(self, temp_db, sample_questions):
        """TestRepository find_active_tests 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 여러 상태의 테스트 생성
        t1 = Test(id=0, title="Test 1", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)
        t2 = Test(id=0, title="Test 2", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)
        t3 = Test(id=0, title="Test 3", level=JLPTLevel.N5,
                 questions=sample_questions, time_limit_minutes=60)

        repo.save(t1)
        t2.start_test()
        repo.save(t2)
        t3.start_test()
        repo.save(t3)

        # 활성 테스트 조회
        active_tests = repo.find_active_tests()
        assert len(active_tests) == 2
        assert all(t.status == TestStatus.IN_PROGRESS for t in active_tests)

    def test_test_repository_update_status(self, temp_db, saved_questions):
        """TestRepository update_status 기능 테스트"""
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteTestRepository(db=db)

        # 테스트 생성
        test = Test(id=0, title="Test 1", level=JLPTLevel.N5,
                   questions=saved_questions, time_limit_minutes=60)
        saved_test = repo.save(test)

        # 상태 업데이트
        repo.update_status(saved_test.id, TestStatus.IN_PROGRESS)

        # 상태 확인
        found_test = repo.find_by_id(saved_test.id)
        assert found_test.status == TestStatus.IN_PROGRESS

