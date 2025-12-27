"""
JLPT Test 도메인 엔티티 테스트
TDD 방식으로 Test 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime, timedelta
from backend.domain.entities.test import Test, TestStatus
from backend.domain.entities.question import Question, JLPTLevel, QuestionType


class TestTestEntity:
    """Test 엔티티 단위 테스트"""

    def test_create_valid_test(self):
        """유효한 Test 생성 테스트"""
        # Given
        questions = [
            Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B", "C", "D"], correct_answer="A",
                    explanation="Exp1", difficulty=1),
            Question(id=2, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B", "C", "D"], correct_answer="B",
                    explanation="Exp2", difficulty=2)
        ]

        # When
        test = Test(
            id=1,
            title="N5 진단 테스트",
            level=JLPTLevel.N5,
            questions=questions,
            time_limit_minutes=30
        )

        # Then
        assert test.id == 1
        assert test.title == "N5 진단 테스트"
        assert test.level == JLPTLevel.N5
        assert len(test.questions) == 2
        assert test.time_limit_minutes == 30
        assert test.status == TestStatus.CREATED
        assert test.score is None

    def test_test_creation_validation(self):
        """Test 생성 시 유효성 검증 테스트"""

        # 빈 제목
        with pytest.raises(ValueError, match="테스트 제목은 필수 항목입니다"):
            Test(id=1, title="", level=JLPTLevel.N5, questions=[], time_limit_minutes=30)

        # 시간 제한 0분
        with pytest.raises(ValueError, match="시간 제한은 1분 이상이어야 합니다"):
            Test(id=1, title="Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=0)

        # 음수 시간 제한
        with pytest.raises(ValueError, match="시간 제한은 1분 이상이어야 합니다"):
            Test(id=1, title="Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=-1)

    def test_start_test(self):
        """테스트 시작 테스트"""
        # Given
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=30)

        # When
        test.start_test()

        # Then
        assert test.status == TestStatus.IN_PROGRESS
        assert test.started_at is not None
        assert isinstance(test.started_at, datetime)

    def test_complete_test(self):
        """테스트 완료 테스트"""
        # Given
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=30)
        test.start_test()
        user_answers = {1: "A", 2: "B"}

        # When
        test.complete_test(user_answers)

        # Then
        assert test.status == TestStatus.COMPLETED
        assert test.completed_at is not None
        assert test.user_answers == user_answers

    def test_calculate_score(self):
        """점수 계산 테스트"""
        # Given
        questions = [
            Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="Exp1", difficulty=1),
            Question(id=2, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="B",
                    explanation="Exp2", difficulty=1)
        ]
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=questions, time_limit_minutes=30)
        test.start_test()  # 테스트 시작

        # When - 1문제 정답, 1문제 오답
        user_answers = {1: "A", 2: "A"}  # Q1 정답, Q2 오답
        test.complete_test(user_answers)
        score = test.calculate_score()

        # Then
        assert score == 50.0  # 1/2 = 50%

    def test_get_time_remaining(self):
        """남은 시간 계산 테스트"""
        # Given
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=30)
        test.start_test()

        # When - 시작 후 10분 경과한 것으로 가정
        test.started_at = datetime.now() - timedelta(minutes=10)
        remaining = test.get_time_remaining()

        # Then
        assert remaining.total_seconds() > 0
        assert remaining.total_seconds() < 20 * 60  # 20분 이내

    def test_is_time_up(self):
        """시간 초과 확인 테스트"""
        # Given
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=30)

        # When - 시작하지 않은 경우
        assert test.is_time_up() is False

        # When - 시작 후 시간 내
        test.start_test()
        assert test.is_time_up() is False

        # When - 시간 초과된 것으로 설정
        test.started_at = datetime.now() - timedelta(minutes=31)
        assert test.is_time_up() is True

    def test_get_question_by_id(self):
        """ID로 문제 조회 테스트"""
        # Given
        questions = [
            Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="Exp1", difficulty=1),
            Question(id=2, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="B",
                    explanation="Exp2", difficulty=1)
        ]
        test = Test(id=1, title="Test", level=JLPTLevel.N5, questions=questions, time_limit_minutes=30)

        # When & Then
        assert test.get_question_by_id(1) == questions[0]
        assert test.get_question_by_id(2) == questions[1]
        assert test.get_question_by_id(999) is None

    def test_test_equality(self):
        """Test 동등성 테스트"""
        # Given
        questions1 = [Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                              question_text="Q", choices=["A", "B"], correct_answer="A",
                              explanation="E", difficulty=1)]
        questions2 = [Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                              question_text="Q", choices=["A", "B"], correct_answer="A",
                              explanation="E", difficulty=1)]

        test1 = Test(id=1, title="Test", level=JLPTLevel.N5, questions=questions1, time_limit_minutes=30)
        test2 = Test(id=1, title="Test", level=JLPTLevel.N5, questions=questions2, time_limit_minutes=30)
        test3 = Test(id=2, title="Test", level=JLPTLevel.N5, questions=questions1, time_limit_minutes=30)

        # Then
        assert test1 == test2  # 같은 ID
        assert test1 != test3  # 다른 ID

    def test_test_representation(self):
        """Test 문자열 표현 테스트"""
        # Given
        test = Test(id=1, title="N5 Test", level=JLPTLevel.N5, questions=[], time_limit_minutes=30)

        # When & Then
        expected_repr = "Test(id=1, title='N5 Test', level=N5, status=created)"
        assert repr(test) == expected_repr


class TestTestStatus:
    """TestStatus 열거형 테스트"""

    def test_status_values(self):
        """테스트 상태 값 검증"""
        assert TestStatus.CREATED.value == "created"
        assert TestStatus.IN_PROGRESS.value == "in_progress"
        assert TestStatus.COMPLETED.value == "completed"
        assert TestStatus.EXPIRED.value == "expired"
