"""
문제 생성 서비스 테스트
TDD 방식으로 QuestionGeneratorService 검증
"""

import pytest
from backend.domain.services.question_generator_service import QuestionGeneratorService
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class TestQuestionGeneratorService:
    """문제 생성 서비스 테스트"""
    
    def test_generate_vocabulary_questions_n5(self):
        """N5 어휘 문제 생성 테스트"""
        questions = QuestionGeneratorService.generate_vocabulary_questions(
            level=JLPTLevel.N5,
            count=5
        )
        
        assert len(questions) == 5
        for question in questions:
            assert isinstance(question, Question)
            assert question.level == JLPTLevel.N5
            assert question.question_type == QuestionType.VOCABULARY
            assert question.question_text
            assert len(question.choices) >= 2
            assert question.correct_answer in question.choices
            assert question.explanation
            assert 1 <= question.difficulty <= 5
    
    def test_generate_grammar_questions_n5(self):
        """N5 문법 문제 생성 테스트"""
        questions = QuestionGeneratorService.generate_grammar_questions(
            level=JLPTLevel.N5,
            count=5
        )
        
        assert len(questions) == 5
        for question in questions:
            assert isinstance(question, Question)
            assert question.level == JLPTLevel.N5
            assert question.question_type == QuestionType.GRAMMAR
            assert question.question_text
            assert len(question.choices) >= 2
            assert question.correct_answer in question.choices
            assert question.explanation
            assert 1 <= question.difficulty <= 5
    
    def test_generate_questions_all_types(self):
        """모든 유형 문제 생성 테스트"""
        questions = QuestionGeneratorService.generate_questions(
            level=JLPTLevel.N5,
            question_type=None,
            count=10
        )
        
        assert len(questions) == 10
        # 어휘와 문법 문제가 모두 포함되어야 함
        vocab_count = sum(1 for q in questions if q.question_type == QuestionType.VOCABULARY)
        grammar_count = sum(1 for q in questions if q.question_type == QuestionType.GRAMMAR)
        assert vocab_count > 0
        assert grammar_count > 0
    
    def test_generate_questions_specific_type(self):
        """특정 유형 문제 생성 테스트"""
        questions = QuestionGeneratorService.generate_questions(
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            count=5
        )
        
        assert len(questions) == 5
        for question in questions:
            assert question.question_type == QuestionType.VOCABULARY
    
    def test_import_from_dict(self):
        """딕셔너리에서 문제 임포트 테스트"""
        data = {
            "level": "N5",
            "question_type": "vocabulary",
            "question_text": "テスト問題",
            "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
            "correct_answer": "選択肢1",
            "explanation": "説明",
            "difficulty": 2
        }
        
        question = QuestionGeneratorService.import_from_dict(data)
        
        assert isinstance(question, Question)
        assert question.level == JLPTLevel.N5
        assert question.question_type == QuestionType.VOCABULARY
        assert question.question_text == "テスト問題"
        assert len(question.choices) == 4
        assert question.correct_answer == "選択肢1"
        assert question.explanation == "説明"
        assert question.difficulty == 2
    
    def test_import_from_list(self):
        """딕셔너리 리스트에서 문제 목록 임포트 테스트"""
        data_list = [
            {
                "level": "N5",
                "question_type": "vocabulary",
                "question_text": "問題1",
                "choices": ["選択肢1", "選択肢2"],
                "correct_answer": "選択肢1",
                "explanation": "説明1",
                "difficulty": 1
            },
            {
                "level": "N5",
                "question_type": "grammar",
                "question_text": "問題2",
                "choices": ["選択肢1", "選択肢2"],
                "correct_answer": "選択肢2",
                "explanation": "説明2",
                "difficulty": 2
            }
        ]
        
        questions = QuestionGeneratorService.import_from_list(data_list)
        
        assert len(questions) == 2
        assert questions[0].question_text == "問題1"
        assert questions[1].question_text == "問題2"

