"""
LearningHistory 도메인 엔티티 테스트
TDD 방식으로 LearningHistory 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime, date
from backend.domain.entities.learning_history import LearningHistory


class TestLearningHistory:
    """LearningHistory 엔티티 단위 테스트"""

    def test_create_valid_learning_history(self):
        """유효한 LearningHistory 생성 테스트"""
        # Given & When
        learning_history = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # Then
        assert learning_history.id == 1
        assert learning_history.user_id == 1
        assert learning_history.test_id == 1
        assert learning_history.result_id == 1
        assert learning_history.study_date == date(2025, 1, 4)
        assert learning_history.study_hour == 10
        assert learning_history.total_questions == 20
        assert learning_history.correct_count == 17
        assert learning_history.time_spent_minutes == 25
        assert isinstance(learning_history.created_at, datetime)

    def test_create_learning_history_with_optional_created_at(self):
        """created_at을 지정한 LearningHistory 생성 테스트"""
        # Given
        created_at = datetime(2025, 1, 4, 10, 0, 0)

        # When
        learning_history = LearningHistory(
            id=2,
            user_id=1,
            test_id=2,
            result_id=2,
            study_date=date(2025, 1, 4),
            study_hour=14,
            total_questions=15,
            correct_count=12,
            time_spent_minutes=20,
            created_at=created_at
        )

        # Then
        assert learning_history.created_at == created_at

    def test_validate_user_id_must_be_positive(self):
        """user_id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="user_id는 양의 정수여야 합니다"):
            LearningHistory(
                id=1,
                user_id=0,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_test_id_must_be_positive(self):
        """test_id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="test_id는 양의 정수여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=-1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_result_id_must_be_positive(self):
        """result_id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="result_id는 양의 정수여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=0,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_study_hour_range(self):
        """study_hour는 0-23 사이여야 함"""
        # Given & When & Then - 최소값 미만
        with pytest.raises(ValueError, match="study_hour는 0-23 사이여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=-1,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

        # Given & When & Then - 최대값 초과
        with pytest.raises(ValueError, match="study_hour는 0-23 사이여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=24,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_total_questions_must_be_positive(self):
        """total_questions는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="total_questions는 양의 정수여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=0,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_correct_count_must_be_non_negative(self):
        """correct_count는 0 이상이어야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="correct_count는 0 이상의 정수여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=-1,
                time_spent_minutes=25
            )

    def test_validate_correct_count_not_exceed_total(self):
        """correct_count는 total_questions를 초과할 수 없음"""
        # Given & When & Then
        with pytest.raises(ValueError, match="correct_count는 total_questions를 초과할 수 없습니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=21,
                time_spent_minutes=25
            )

    def test_validate_time_spent_minutes_must_be_positive(self):
        """time_spent_minutes는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="time_spent_minutes는 양의 정수여야 합니다"):
            LearningHistory(
                id=1,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=0
            )

    def test_validate_id_must_be_positive(self):
        """id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="id는 양의 정수여야 합니다"):
            LearningHistory(
                id=0,
                user_id=1,
                test_id=1,
                result_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_get_accuracy_percentage(self):
        """정확도 백분율 계산 테스트"""
        # Given
        learning_history = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # When
        accuracy = learning_history.get_accuracy_percentage()

        # Then
        assert accuracy == 85.0  # 17/20 * 100

    def test_get_accuracy_percentage_all_correct(self):
        """모든 문제를 맞춘 경우 정확도는 100%"""
        # Given
        learning_history = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=20,
            time_spent_minutes=25
        )

        # When
        accuracy = learning_history.get_accuracy_percentage()

        # Then
        assert accuracy == 100.0

    def test_equality_by_id(self):
        """ID 기반 동등성 비교 테스트"""
        # Given
        history1 = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        history2 = LearningHistory(
            id=1,
            user_id=2,
            test_id=2,
            result_id=2,
            study_date=date(2025, 1, 5),
            study_hour=14,
            total_questions=15,
            correct_count=12,
            time_spent_minutes=20
        )

        history3 = LearningHistory(
            id=2,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # Then
        assert history1 == history2  # 같은 ID
        assert history1 != history3  # 다른 ID

    def test_hash_by_id(self):
        """ID 기반 해시 테스트"""
        # Given
        history1 = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        history2 = LearningHistory(
            id=1,
            user_id=2,
            test_id=2,
            result_id=2,
            study_date=date(2025, 1, 5),
            study_hour=14,
            total_questions=15,
            correct_count=12,
            time_spent_minutes=20
        )

        # Then
        assert hash(history1) == hash(history2)

    def test_repr(self):
        """문자열 표현 테스트"""
        # Given
        learning_history = LearningHistory(
            id=1,
            user_id=1,
            test_id=1,
            result_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # When
        repr_str = repr(learning_history)

        # Then
        assert "LearningHistory" in repr_str
        assert "id=1" in repr_str
        assert "user_id=1" in repr_str
        assert "study_date=2025-01-04" in repr_str

