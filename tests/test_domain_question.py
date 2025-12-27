"""
JLPT Question 도메인 엔티티 테스트
TDD 방식으로 Question 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime
from backend.domain.entities.question import Question, JLPTLevel, QuestionType


class TestQuestion:
    """Question 엔티티 단위 테스트"""

    def test_create_valid_question(self):
        """유효한 Question 생성 테스트"""
        question = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「こんにちは」の意味は何ですか？",
            choices=["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
            correct_answer="안녕하세요",
            explanation="「こんにちは」は日本語で「こんにちは」という意味です。",
            difficulty=1
        )

        assert question.id == 1
        assert question.level == JLPTLevel.N5
        assert question.question_type == QuestionType.VOCABULARY
        assert question.question_text == "「こんにちは」の意味は何ですか？"
        assert len(question.choices) == 4
        assert question.correct_answer == "안녕하세요"
        assert question.difficulty == 1

    def test_question_creation_validation(self):
        """Question 생성 시 유효성 검증 테스트"""

        # 빈 문제 텍스트
        with pytest.raises(ValueError, match="문제 내용은 필수 항목입니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="",
                choices=["A", "B", "C", "D"],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 선택지 개수 부족
        with pytest.raises(ValueError, match="선택지는 최소 2개 이상이어야 합니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A"],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 정답이 선택지에 없는 경우
        with pytest.raises(ValueError, match="정답은 선택지 중 하나여야 합니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "B", "C", "D"],
                correct_answer="E",
                explanation="설명",
                difficulty=1
            )

        # 난이도 범위 초과
        with pytest.raises(ValueError, match="난이도는 1-5 사이여야 합니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "B", "C", "D"],
                correct_answer="A",
                explanation="설명",
                difficulty=6
            )

    def test_answer_validation(self):
        """답안 검증 테스트"""
        question = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="질문",
            choices=["A", "B", "C", "D"],
            correct_answer="A",
            explanation="설명",
            difficulty=1
        )

        # 정답인 경우
        assert question.is_correct_answer("A") is True

        # 오답인 경우
        assert question.is_correct_answer("B") is False

        # 유효하지 않은 답안
        assert question.is_correct_answer("E") is False

    def test_question_equality(self):
        """Question 동등성 테스트"""
        question1 = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="질문",
            choices=["A", "B"],
            correct_answer="A",
            explanation="설명",
            difficulty=1
        )

        question2 = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="질문",
            choices=["A", "B"],
            correct_answer="A",
            explanation="설명",
            difficulty=1
        )

        question3 = Question(
            id=2,
            level=JLPTLevel.N4,
            question_type=QuestionType.GRAMMAR,
            question_text="다른 질문",
            choices=["C", "D"],
            correct_answer="C",
            explanation="다른 설명",
            difficulty=2
        )

        assert question1 == question2
        assert question1 != question3

    def test_question_representation(self):
        """Question 문자열 표현 테스트"""
        question = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="こんにちは",
            choices=["안녕", "감사"],
            correct_answer="안녕",
            explanation="인사",
            difficulty=1
        )

        expected_repr = "Question(id=1, level=N5, type=vocabulary, difficulty=1)"
        assert repr(question) == expected_repr


class TestJLPTLevel:
    """JLPTLevel 열거형 테스트"""

    def test_level_values(self):
        """JLPT 레벨 값 검증"""
        assert JLPTLevel.N5.value == "N5"
        assert JLPTLevel.N4.value == "N4"
        assert JLPTLevel.N3.value == "N3"
        assert JLPTLevel.N2.value == "N2"
        assert JLPTLevel.N1.value == "N1"

    def test_level_order(self):
        """JLPT 레벨 순서 검증"""
        levels = [JLPTLevel.N5, JLPTLevel.N4, JLPTLevel.N3, JLPTLevel.N2, JLPTLevel.N1]
        assert levels == sorted(levels, key=lambda x: x.value, reverse=True)

    def test_level_comparison(self):
        """JLPT 레벨 비교 연산 테스트"""
        # N5 < N4 < N3 < N2 < N1
        assert JLPTLevel.N5 < JLPTLevel.N4
        assert JLPTLevel.N4 < JLPTLevel.N3
        assert JLPTLevel.N3 < JLPTLevel.N2
        assert JLPTLevel.N2 < JLPTLevel.N1
        assert not (JLPTLevel.N1 < JLPTLevel.N5)

    def test_level_string_representation(self):
        """JLPT 레벨 문자열 표현 테스트"""
        assert str(JLPTLevel.N5) == "N5"
        assert str(JLPTLevel.N1) == "N1"


class TestQuestionType:
    """QuestionType 열거형 테스트"""

    def test_type_values(self):
        """문제 유형 값 검증"""
        assert QuestionType.VOCABULARY.value == "vocabulary"
        assert QuestionType.GRAMMAR.value == "grammar"
        assert QuestionType.READING.value == "reading"
        assert QuestionType.LISTENING.value == "listening"

    def test_question_validation_edge_cases(self):
        """Question 검증 edge case 테스트"""
        # 문제 텍스트가 공백만 있는 경우
        with pytest.raises(ValueError, match="문제 내용은 비어있을 수 없습니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="   ",
                choices=["A", "B"],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 문제 텍스트가 2000자 초과
        with pytest.raises(ValueError, match="문제 내용은 2000자를 초과할 수 없습니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="a" * 2001,
                choices=["A", "B"],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 선택지가 6개 초과
        with pytest.raises(ValueError, match="선택지는 최대 6개까지 가능합니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "B", "C", "D", "E", "F", "G"],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 중복 선택지
        with pytest.raises(ValueError, match="선택지에는 중복된 값이 있을 수 없습니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "B", "A"],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 빈 선택지
        with pytest.raises(ValueError, match="각 선택지는 비어있을 수 없습니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", ""],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 선택지가 공백만 있는 경우
        with pytest.raises(ValueError, match="각 선택지는 공백만으로 구성될 수 없습니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "   "],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 선택지가 500자 초과
        with pytest.raises(ValueError, match="각 선택지는 500자를 초과할 수 없습니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "b" * 501],
                correct_answer="A",
                explanation="설명",
                difficulty=1
            )

        # 난이도가 1 미만
        with pytest.raises(ValueError, match="난이도는 1-5 사이여야 합니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "B"],
                correct_answer="A",
                explanation="설명",
                difficulty=0
            )

        # 정답이 None인 경우
        with pytest.raises(ValueError, match="정답은 필수 항목입니다"):
            Question(
                id=1,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="질문",
                choices=["A", "B"],
                correct_answer=None,
                explanation="설명",
                difficulty=1
            )

    def test_get_choice_index(self):
        """선택지 인덱스 반환 테스트"""
        # Given
        question = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="질문",
            choices=["A", "B", "C", "D"],
            correct_answer="A",
            explanation="설명",
            difficulty=1
        )

        # When & Then
        assert question.get_choice_index("A") == 0
        assert question.get_choice_index("B") == 1
        assert question.get_choice_index("C") == 2
        assert question.get_choice_index("D") == 3

        # 유효하지 않은 답안
        with pytest.raises(ValueError, match="'E'은 유효한 선택지가 아닙니다"):
            question.get_choice_index("E")

    def test_question_hash(self):
        """Question 해시 테스트"""
        # Given
        question1 = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="질문",
            choices=["A", "B"],
            correct_answer="A",
            explanation="설명",
            difficulty=1
        )

        question2 = Question(
            id=1,
            level=JLPTLevel.N4,
            question_type=QuestionType.GRAMMAR,
            question_text="다른 질문",
            choices=["C", "D"],
            correct_answer="C",
            explanation="다른 설명",
            difficulty=2
        )

        question3 = Question(
            id=2,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="질문",
            choices=["A", "B"],
            correct_answer="A",
            explanation="설명",
            difficulty=1
        )

        # Then
        assert hash(question1) == hash(question2)  # 같은 ID
        assert hash(question1) != hash(question3)  # 다른 ID
