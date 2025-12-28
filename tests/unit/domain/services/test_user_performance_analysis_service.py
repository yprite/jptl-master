"""
UserPerformanceAnalysisService 도메인 서비스 테스트
사용자 성능 분석 로직을 검증하는 테스트
"""

import pytest
from datetime import date, datetime, timedelta
from backend.domain.services.user_performance_analysis_service import UserPerformanceAnalysisService
from backend.domain.entities.answer_detail import AnswerDetail
from backend.domain.value_objects.jlpt import QuestionType


class TestUserPerformanceAnalysisService:
    """UserPerformanceAnalysisService 테스트 클래스"""

    def test_analyze_type_performance(self):
        """유형별 성취도 집계 테스트"""
        service = UserPerformanceAnalysisService()
        
        # 테스트 데이터: vocabulary 2개 정답, grammar 1개 정답 1개 오답
        answer_details = [
            AnswerDetail(
                id=1, result_id=1, question_id=1,
                user_answer="A", correct_answer="A", is_correct=True,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=2, result_id=1, question_id=2,
                user_answer="B", correct_answer="B", is_correct=True,
                time_spent_seconds=25, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=3, result_id=1, question_id=3,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=40, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
            AnswerDetail(
                id=4, result_id=1, question_id=4,
                user_answer="C", correct_answer="C", is_correct=True,
                time_spent_seconds=35, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
        ]
        
        type_performance = service.analyze_type_performance(answer_details)
        
        assert "vocabulary" in type_performance
        assert type_performance["vocabulary"]["correct"] == 2
        assert type_performance["vocabulary"]["total"] == 2
        assert type_performance["vocabulary"]["accuracy"] == 100.0
        
        assert "grammar" in type_performance
        assert type_performance["grammar"]["correct"] == 1
        assert type_performance["grammar"]["total"] == 2
        assert type_performance["grammar"]["accuracy"] == 50.0

    def test_analyze_difficulty_performance(self):
        """난이도별 성취도 집계 테스트"""
        service = UserPerformanceAnalysisService()
        
        # 테스트 데이터: 난이도 1은 2개 정답, 난이도 2는 1개 정답 1개 오답
        answer_details = [
            AnswerDetail(
                id=1, result_id=1, question_id=1,
                user_answer="A", correct_answer="A", is_correct=True,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=2, result_id=1, question_id=2,
                user_answer="B", correct_answer="B", is_correct=True,
                time_spent_seconds=25, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=3, result_id=1, question_id=3,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=40, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
            AnswerDetail(
                id=4, result_id=1, question_id=4,
                user_answer="C", correct_answer="C", is_correct=True,
                time_spent_seconds=35, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
        ]
        
        difficulty_performance = service.analyze_difficulty_performance(answer_details)
        
        assert "1" in difficulty_performance
        assert difficulty_performance["1"]["correct"] == 2
        assert difficulty_performance["1"]["total"] == 2
        assert difficulty_performance["1"]["accuracy"] == 100.0
        
        assert "2" in difficulty_performance
        assert difficulty_performance["2"]["correct"] == 1
        assert difficulty_performance["2"]["total"] == 2
        assert difficulty_performance["2"]["accuracy"] == 50.0

    def test_identify_repeated_mistakes(self):
        """반복 오답 문제 식별 테스트"""
        service = UserPerformanceAnalysisService()
        
        # 테스트 데이터: question_id=1을 2번 틀림, question_id=2를 1번 틀림
        answer_details = [
            AnswerDetail(
                id=1, result_id=1, question_id=1,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=2, result_id=2, question_id=1,
                user_answer="C", correct_answer="B", is_correct=False,
                time_spent_seconds=25, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=3, result_id=1, question_id=2,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=40, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
            AnswerDetail(
                id=4, result_id=2, question_id=3,
                user_answer="C", correct_answer="C", is_correct=True,
                time_spent_seconds=35, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
        ]
        
        repeated_mistakes = service.identify_repeated_mistakes(answer_details)
        
        # question_id=1은 2번 틀렸으므로 반복 오답
        assert 1 in repeated_mistakes
        # question_id=2는 1번만 틀렸으므로 반복 오답 아님
        assert 2 not in repeated_mistakes

    def test_identify_repeated_mistakes_with_threshold(self):
        """반복 오답 문제 식별 테스트 (임계값 3회)"""
        service = UserPerformanceAnalysisService()
        
        # 테스트 데이터: question_id=1을 3번 틀림, question_id=2를 2번 틀림
        answer_details = [
            AnswerDetail(
                id=1, result_id=1, question_id=1,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=2, result_id=2, question_id=1,
                user_answer="C", correct_answer="B", is_correct=False,
                time_spent_seconds=25, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=3, result_id=3, question_id=1,
                user_answer="D", correct_answer="B", is_correct=False,
                time_spent_seconds=20, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=4, result_id=1, question_id=2,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=40, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
            AnswerDetail(
                id=5, result_id=2, question_id=2,
                user_answer="C", correct_answer="B", is_correct=False,
                time_spent_seconds=35, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
        ]
        
        repeated_mistakes = service.identify_repeated_mistakes(answer_details, threshold=3)
        
        # question_id=1은 3번 틀렸으므로 반복 오답
        assert 1 in repeated_mistakes
        # question_id=2는 2번만 틀렸으므로 반복 오답 아님 (임계값 3)
        assert 2 not in repeated_mistakes

    def test_identify_weaknesses(self):
        """약점 영역 분석 테스트"""
        service = UserPerformanceAnalysisService()
        
        # 테스트 데이터: grammar는 50% 정확도, 난이도 2는 50% 정확도
        answer_details = [
            AnswerDetail(
                id=1, result_id=1, question_id=1,
                user_answer="A", correct_answer="A", is_correct=True,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=2, result_id=1, question_id=2,
                user_answer="B", correct_answer="B", is_correct=True,
                time_spent_seconds=25, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=3, result_id=1, question_id=3,
                user_answer="A", correct_answer="B", is_correct=False,
                time_spent_seconds=40, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
            AnswerDetail(
                id=4, result_id=1, question_id=4,
                user_answer="C", correct_answer="C", is_correct=True,
                time_spent_seconds=35, difficulty=2, question_type=QuestionType.GRAMMAR
            ),
        ]
        
        weaknesses = service.identify_weaknesses(answer_details, accuracy_threshold=60.0)
        
        # grammar는 50% 정확도로 약점으로 식별됨
        assert "grammar" in weaknesses["type_weaknesses"]
        assert weaknesses["type_weaknesses"]["grammar"]["accuracy"] == 50.0
        
        # 난이도 2는 50% 정확도로 약점으로 식별됨
        assert "2" in weaknesses["difficulty_weaknesses"]
        assert weaknesses["difficulty_weaknesses"]["2"]["accuracy"] == 50.0
        
        # vocabulary는 100% 정확도로 약점 아님
        assert "vocabulary" not in weaknesses["type_weaknesses"]
        
        # 난이도 1은 100% 정확도로 약점 아님
        assert "1" not in weaknesses["difficulty_weaknesses"]

    def test_analyze_type_performance_empty_list(self):
        """빈 리스트에 대한 유형별 성취도 집계 테스트"""
        service = UserPerformanceAnalysisService()
        
        type_performance = service.analyze_type_performance([])
        
        assert type_performance == {}

    def test_analyze_difficulty_performance_empty_list(self):
        """빈 리스트에 대한 난이도별 성취도 집계 테스트"""
        service = UserPerformanceAnalysisService()
        
        difficulty_performance = service.analyze_difficulty_performance([])
        
        assert difficulty_performance == {}

    def test_identify_repeated_mistakes_empty_list(self):
        """빈 리스트에 대한 반복 오답 문제 식별 테스트"""
        service = UserPerformanceAnalysisService()
        
        repeated_mistakes = service.identify_repeated_mistakes([])
        
        assert repeated_mistakes == []

    def test_identify_weaknesses_empty_list(self):
        """빈 리스트에 대한 약점 영역 분석 테스트"""
        service = UserPerformanceAnalysisService()
        
        weaknesses = service.identify_weaknesses([])
        
        assert weaknesses == {"type_weaknesses": {}, "difficulty_weaknesses": {}}

    def test_analyze_type_performance_all_types(self):
        """모든 유형에 대한 성취도 집계 테스트"""
        service = UserPerformanceAnalysisService()
        
        answer_details = [
            AnswerDetail(
                id=1, result_id=1, question_id=1,
                user_answer="A", correct_answer="A", is_correct=True,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            ),
            AnswerDetail(
                id=2, result_id=1, question_id=2,
                user_answer="B", correct_answer="B", is_correct=True,
                time_spent_seconds=25, difficulty=1, question_type=QuestionType.GRAMMAR
            ),
            AnswerDetail(
                id=3, result_id=1, question_id=3,
                user_answer="A", correct_answer="A", is_correct=True,
                time_spent_seconds=40, difficulty=2, question_type=QuestionType.READING
            ),
            AnswerDetail(
                id=4, result_id=1, question_id=4,
                user_answer="C", correct_answer="C", is_correct=True,
                time_spent_seconds=35, difficulty=2, question_type=QuestionType.LISTENING
            ),
        ]
        
        type_performance = service.analyze_type_performance(answer_details)
        
        assert "vocabulary" in type_performance
        assert "grammar" in type_performance
        assert "reading" in type_performance
        assert "listening" in type_performance
        
        # 모든 유형이 100% 정확도
        for q_type in type_performance:
            assert type_performance[q_type]["accuracy"] == 100.0

