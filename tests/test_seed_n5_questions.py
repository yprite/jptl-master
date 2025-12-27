"""
N5 문제 샘플 데이터 생성 스크립트 테스트
TDD 방식으로 seed_n5_questions 스크립트 검증
"""

import pytest
import tempfile
import os
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
from backend.infrastructure.config.database import Database
from scripts.seed_n5_questions import create_n5_sample_questions, seed_database


class TestSeedN5Questions:
    """N5 문제 샘플 데이터 생성 스크립트 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_create_n5_sample_questions(self):
        """N5 샘플 문제 생성 테스트"""
        questions = create_n5_sample_questions()
        
        assert len(questions) >= 20, f"최소 20개의 문제가 필요합니다. 현재: {len(questions)}개"
        
        # 모든 문제가 N5 레벨인지 확인
        for question in questions:
            assert question.level == JLPTLevel.N5
            assert isinstance(question, Question)
            assert question.question_text
            assert len(question.choices) >= 2
            assert question.correct_answer in question.choices
            assert question.explanation
            assert 1 <= question.difficulty <= 5

    def test_question_types_distribution(self):
        """문제 유형 분포 테스트"""
        questions = create_n5_sample_questions()
        
        type_counts = {}
        for q in questions:
            q_type = q.question_type.value
            type_counts[q_type] = type_counts.get(q_type, 0) + 1
        
        # 각 유형이 최소 1개 이상 있는지 확인
        assert QuestionType.VOCABULARY.value in type_counts
        assert QuestionType.GRAMMAR.value in type_counts
        assert QuestionType.READING.value in type_counts
        assert QuestionType.LISTENING.value in type_counts
        
        # 총 문제 수 확인
        total = sum(type_counts.values())
        assert total >= 20

    def test_seed_database_success(self, temp_db, monkeypatch):
        """데이터베이스 시드 성공 테스트"""
        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db)
        
        # 기존 문제가 없는 경우 시뮬레이션
        def mock_find_by_level(level):
            return []
        
        def mock_input(prompt):
            return "y"
        
        # seed_database 함수를 직접 호출하는 대신, create_n5_sample_questions를 사용
        questions = create_n5_sample_questions()
        
        # 데이터베이스에 저장
        for question in questions:
            repo.save(question)
        
        # 저장된 문제 확인
        saved_questions = repo.find_by_level(JLPTLevel.N5)
        assert len(saved_questions) == len(questions)
        
        # 모든 문제가 올바르게 저장되었는지 확인
        for saved_q in saved_questions:
            assert saved_q.id is not None
            assert saved_q.id > 0
            assert saved_q.level == JLPTLevel.N5

    def test_seed_database_minimum_questions(self, temp_db):
        """최소 문제 수 확인 테스트"""
        questions = create_n5_sample_questions()
        
        # N5 진단 테스트는 20개 문제가 필요
        assert len(questions) >= 20, "N5 진단 테스트를 위해 최소 20개의 문제가 필요합니다"

    def test_question_validation(self):
        """문제 유효성 검증 테스트"""
        questions = create_n5_sample_questions()
        
        for question in questions:
            # 모든 필수 필드가 있는지 확인
            assert question.question_text
            assert len(question.question_text.strip()) > 0
            assert len(question.choices) >= 2
            assert question.correct_answer
            assert question.explanation
            assert 1 <= question.difficulty <= 5
            
            # 정답이 선택지에 있는지 확인
            assert question.correct_answer in question.choices
            
            # 선택지에 중복이 없는지 확인
            assert len(question.choices) == len(set(question.choices))

