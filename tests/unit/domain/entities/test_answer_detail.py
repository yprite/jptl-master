"""
AnswerDetail 도메인 엔티티 테스트
TDD 방식으로 AnswerDetail 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime
from backend.domain.entities.answer_detail import AnswerDetail
from backend.domain.value_objects.jlpt import QuestionType


class TestAnswerDetail:
    """AnswerDetail 엔티티 단위 테스트"""

    def test_create_valid_answer_detail(self):
        """유효한 AnswerDetail 생성 테스트"""
        # Given & When
        answer_detail = AnswerDetail(
            id=1,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=1,
            question_type=QuestionType.VOCABULARY
        )

        # Then
        assert answer_detail.id == 1
        assert answer_detail.result_id == 1
        assert answer_detail.question_id == 1
        assert answer_detail.user_answer == "A"
        assert answer_detail.correct_answer == "A"
        assert answer_detail.is_correct is True
        assert answer_detail.time_spent_seconds == 30
        assert answer_detail.difficulty == 1
        assert answer_detail.question_type == QuestionType.VOCABULARY
        assert isinstance(answer_detail.created_at, datetime)

    def test_create_answer_detail_with_incorrect_answer(self):
        """오답인 AnswerDetail 생성 테스트"""
        # Given & When
        answer_detail = AnswerDetail(
            id=2,
            result_id=1,
            question_id=2,
            user_answer="B",
            correct_answer="A",
            is_correct=False,
            time_spent_seconds=45,
            difficulty=2,
            question_type=QuestionType.GRAMMAR
        )

        # Then
        assert answer_detail.is_correct is False
        assert answer_detail.user_answer != answer_detail.correct_answer

    def test_create_answer_detail_with_optional_created_at(self):
        """created_at을 지정한 AnswerDetail 생성 테스트"""
        # Given
        created_at = datetime(2025, 1, 4, 10, 0, 0)

        # When
        answer_detail = AnswerDetail(
            id=3,
            result_id=1,
            question_id=3,
            user_answer="C",
            correct_answer="C",
            is_correct=True,
            time_spent_seconds=20,
            difficulty=1,
            question_type=QuestionType.READING,
            created_at=created_at
        )

        # Then
        assert answer_detail.created_at == created_at

    def test_validate_result_id_must_be_positive(self):
        """result_id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="result_id는 양의 정수여야 합니다"):
            AnswerDetail(
                id=1,
                result_id=0,
                question_id=1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=1,
                question_type=QuestionType.VOCABULARY
            )

    def test_validate_question_id_must_be_positive(self):
        """question_id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="question_id는 양의 정수여야 합니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=-1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=1,
                question_type=QuestionType.VOCABULARY
            )

    def test_validate_user_answer_not_empty(self):
        """user_answer는 비어있을 수 없음"""
        # Given & When & Then
        with pytest.raises(ValueError, match="user_answer는 비어있을 수 없습니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=1,
                user_answer="",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=1,
                question_type=QuestionType.VOCABULARY
            )

    def test_validate_correct_answer_not_empty(self):
        """correct_answer는 비어있을 수 없음"""
        # Given & When & Then
        with pytest.raises(ValueError, match="correct_answer는 비어있을 수 없습니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=1,
                user_answer="A",
                correct_answer="",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=1,
                question_type=QuestionType.VOCABULARY
            )

    def test_validate_time_spent_seconds_must_be_positive(self):
        """time_spent_seconds는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="time_spent_seconds는 양의 정수여야 합니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=0,
                difficulty=1,
                question_type=QuestionType.VOCABULARY
            )

    def test_validate_difficulty_range(self):
        """difficulty는 1-5 사이여야 함"""
        # Given & When & Then - 최소값
        with pytest.raises(ValueError, match="difficulty는 1-5 사이여야 합니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=0,
                question_type=QuestionType.VOCABULARY
            )

        # Given & When & Then - 최대값
        with pytest.raises(ValueError, match="difficulty는 1-5 사이여야 합니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=6,
                question_type=QuestionType.VOCABULARY
            )

    def test_validate_question_type_must_be_valid(self):
        """question_type은 유효한 QuestionType이어야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="question_type은 유효한 QuestionType이어야 합니다"):
            AnswerDetail(
                id=1,
                result_id=1,
                question_id=1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=1,
                question_type="invalid_type"  # type: ignore
            )

    def test_validate_id_must_be_positive(self):
        """id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="id는 양의 정수여야 합니다"):
            AnswerDetail(
                id=0,
                result_id=1,
                question_id=1,
                user_answer="A",
                correct_answer="A",
                is_correct=True,
                time_spent_seconds=30,
                difficulty=1,
                question_type=QuestionType.VOCABULARY
            )

    def test_equality_by_id(self):
        """ID 기반 동등성 비교 테스트"""
        # Given
        answer_detail1 = AnswerDetail(
            id=1,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=1,
            question_type=QuestionType.VOCABULARY
        )

        answer_detail2 = AnswerDetail(
            id=1,
            result_id=2,
            question_id=2,
            user_answer="B",
            correct_answer="B",
            is_correct=True,
            time_spent_seconds=60,
            difficulty=2,
            question_type=QuestionType.GRAMMAR
        )

        answer_detail3 = AnswerDetail(
            id=2,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=1,
            question_type=QuestionType.VOCABULARY
        )

        # Then
        assert answer_detail1 == answer_detail2  # 같은 ID
        assert answer_detail1 != answer_detail3  # 다른 ID

    def test_hash_by_id(self):
        """ID 기반 해시 테스트"""
        # Given
        answer_detail1 = AnswerDetail(
            id=1,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=1,
            question_type=QuestionType.VOCABULARY
        )

        answer_detail2 = AnswerDetail(
            id=1,
            result_id=2,
            question_id=2,
            user_answer="B",
            correct_answer="B",
            is_correct=True,
            time_spent_seconds=60,
            difficulty=2,
            question_type=QuestionType.GRAMMAR
        )

        # Then
        assert hash(answer_detail1) == hash(answer_detail2)

    def test_repr(self):
        """문자열 표현 테스트"""
        # Given
        answer_detail = AnswerDetail(
            id=1,
            result_id=1,
            question_id=1,
            user_answer="A",
            correct_answer="A",
            is_correct=True,
            time_spent_seconds=30,
            difficulty=1,
            question_type=QuestionType.VOCABULARY
        )

        # When
        repr_str = repr(answer_detail)

        # Then
        assert "AnswerDetail" in repr_str
        assert "id=1" in repr_str
        assert "result_id=1" in repr_str
        assert "question_id=1" in repr_str

