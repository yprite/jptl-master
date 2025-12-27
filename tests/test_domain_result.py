"""
JLPT Result 도메인 엔티티 테스트
TDD 방식으로 Result 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime
from backend.domain.entities.result import Result
from backend.domain.entities.test import Test
from backend.domain.entities.question import Question, JLPTLevel, QuestionType


class TestResult:
    """Result 엔티티 단위 테스트"""

    def test_create_valid_result(self):
        """유효한 Result 생성 테스트"""
        # Given
        questions = [
            Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="Exp1", difficulty=1),
            Question(id=2, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="B",
                    explanation="Exp2", difficulty=2)
        ]
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=questions, time_limit_minutes=30)
        test.start_test()
        test.complete_test({1: "A", 2: "B"})  # 100% 정답

        # When
        result = Result(
            id=1,
            test_id=1,
            user_id=1,
            score=100.0,
            assessed_level=JLPTLevel.N5,
            recommended_level=JLPTLevel.N4,
            correct_answers_count=2,
            total_questions_count=2,
            time_taken_minutes=15
        )

        # Then
        assert result.id == 1
        assert result.test_id == 1
        assert result.user_id == 1
        assert result.score == 100.0
        assert result.assessed_level == JLPTLevel.N5
        assert result.recommended_level == JLPTLevel.N4
        assert result.correct_answers_count == 2
        assert result.total_questions_count == 2
        assert result.time_taken_minutes == 15

    def test_result_creation_validation(self):
        """Result 생성 시 유효성 검증 테스트"""

        # 점수 범위 초과
        with pytest.raises(ValueError, match="점수는 0.0에서 100.0 사이여야 합니다"):
            Result(id=1, test_id=1, user_id=1, score=150.0, assessed_level=JLPTLevel.N5,
                  recommended_level=JLPTLevel.N5, correct_answers_count=1, total_questions_count=2,
                  time_taken_minutes=10)

        # 음수 점수
        with pytest.raises(ValueError, match="점수는 0.0에서 100.0 사이여야 합니다"):
            Result(id=1, test_id=1, user_id=1, score=-10.0, assessed_level=JLPTLevel.N5,
                  recommended_level=JLPTLevel.N5, correct_answers_count=1, total_questions_count=2,
                  time_taken_minutes=10)

        # 정답 개수가 총 문제 수보다 많음
        with pytest.raises(ValueError, match="정답 개수는 총 문제 수를 초과할 수 없습니다"):
            Result(id=1, test_id=1, user_id=1, score=50.0, assessed_level=JLPTLevel.N5,
                  recommended_level=JLPTLevel.N5, correct_answers_count=3, total_questions_count=2,
                  time_taken_minutes=10)

        # 시간 0분
        with pytest.raises(ValueError, match="소요 시간은 1분 이상이어야 합니다"):
            Result(id=1, test_id=1, user_id=1, score=50.0, assessed_level=JLPTLevel.N5,
                  recommended_level=JLPTLevel.N5, correct_answers_count=1, total_questions_count=2,
                  time_taken_minutes=0)

    def test_get_accuracy_percentage(self):
        """정확도 백분율 계산 테스트"""
        # Given
        result = Result(id=1, test_id=1, user_id=1, score=75.0, assessed_level=JLPTLevel.N5,
                       recommended_level=JLPTLevel.N5, correct_answers_count=15, total_questions_count=20,
                       time_taken_minutes=25)

        # When & Then
        assert result.get_accuracy_percentage() == 75.0

    def test_get_performance_level(self):
        """성취도 레벨 반환 테스트"""
        # Given
        result_high = Result(id=1, test_id=1, user_id=1, score=90.0, assessed_level=JLPTLevel.N5,
                            recommended_level=JLPTLevel.N4, correct_answers_count=18, total_questions_count=20,
                            time_taken_minutes=20)

        result_medium = Result(id=2, test_id=1, user_id=1, score=70.0, assessed_level=JLPTLevel.N5,
                              recommended_level=JLPTLevel.N5, correct_answers_count=14, total_questions_count=20,
                              time_taken_minutes=20)

        result_low = Result(id=3, test_id=1, user_id=1, score=40.0, assessed_level=JLPTLevel.N5,
                           recommended_level=JLPTLevel.N5, correct_answers_count=8, total_questions_count=20,
                           time_taken_minutes=20)

        # When & Then
        assert result_high.get_performance_level() == "excellent"
        assert result_medium.get_performance_level() == "good"
        assert result_low.get_performance_level() == "needs_improvement"

    def test_is_passed(self):
        """합격 여부 판정 테스트"""
        # Given
        result_pass = Result(id=1, test_id=1, user_id=1, score=70.0, assessed_level=JLPTLevel.N5,
                            recommended_level=JLPTLevel.N4, correct_answers_count=14, total_questions_count=20,
                            time_taken_minutes=20)

        result_fail = Result(id=2, test_id=1, user_id=1, score=50.0, assessed_level=JLPTLevel.N5,
                            recommended_level=JLPTLevel.N5, correct_answers_count=10, total_questions_count=20,
                            time_taken_minutes=20)

        # When & Then
        assert result_pass.is_passed() is True   # 70% 이상
        assert result_fail.is_passed() is False  # 70% 미만

    def test_get_time_efficiency(self):
        """시간 효율성 평가 테스트"""
        # Given
        result_fast = Result(id=1, test_id=1, user_id=1, score=80.0, assessed_level=JLPTLevel.N5,
                            recommended_level=JLPTLevel.N4, correct_answers_count=16, total_questions_count=20,
                            time_taken_minutes=10)  # 빠른 시간

        result_slow = Result(id=2, test_id=1, user_id=1, score=80.0, assessed_level=JLPTLevel.N5,
                            recommended_level=JLPTLevel.N4, correct_answers_count=16, total_questions_count=20,
                            time_taken_minutes=50)  # 느린 시간

        # When & Then
        assert result_fast.get_time_efficiency() == "efficient"
        assert result_slow.get_time_efficiency() == "could_improve"

    def test_result_equality(self):
        """Result 동등성 테스트"""
        # Given
        result1 = Result(id=1, test_id=1, user_id=1, score=80.0, assessed_level=JLPTLevel.N5,
                        recommended_level=JLPTLevel.N4, correct_answers_count=16, total_questions_count=20,
                        time_taken_minutes=20)

        result2 = Result(id=1, test_id=1, user_id=1, score=80.0, assessed_level=JLPTLevel.N5,
                        recommended_level=JLPTLevel.N4, correct_answers_count=16, total_questions_count=20,
                        time_taken_minutes=20)

        result3 = Result(id=2, test_id=1, user_id=1, score=80.0, assessed_level=JLPTLevel.N5,
                        recommended_level=JLPTLevel.N4, correct_answers_count=16, total_questions_count=20,
                        time_taken_minutes=20)

        # Then
        assert result1 == result2  # 같은 ID
        assert result1 != result3  # 다른 ID

    def test_result_representation(self):
        """Result 문자열 표현 테스트"""
        # Given
        result = Result(id=1, test_id=1, user_id=1, score=85.5, assessed_level=JLPTLevel.N5,
                       recommended_level=JLPTLevel.N4, correct_answers_count=17, total_questions_count=20,
                       time_taken_minutes=25)

        # When & Then
        expected_repr = "Result(id=1, test_id=1, user_id=1, score=85.5, assessed_level=N5, recommended=N4)"
        assert repr(result) == expected_repr
