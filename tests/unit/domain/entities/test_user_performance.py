"""
UserPerformance 도메인 엔티티 테스트
TDD 방식으로 UserPerformance 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime, date
from backend.domain.entities.user_performance import UserPerformance
from typing import Dict, Any


class TestUserPerformance:
    """UserPerformance 엔티티 단위 테스트"""

    def test_create_valid_user_performance(self):
        """유효한 UserPerformance 생성 테스트"""
        # Given
        type_performance = {
            "vocabulary": {"accuracy": 0.85, "avg_time": 120, "total": 50},
            "grammar": {"accuracy": 0.72, "avg_time": 150, "total": 45}
        }
        difficulty_performance = {
            "1": {"accuracy": 0.95, "total": 20},
            "2": {"accuracy": 0.80, "total": 30}
        }
        level_progression = {
            "N5": {"avg_score": 85.0, "test_count": 5},
            "N4": {"avg_score": 72.0, "test_count": 3}
        }
        repeated_mistakes = [1, 2, 3]
        weaknesses = {
            "weak_types": ["grammar", "reading"],
            "weak_difficulties": [4, 5]
        }

        # When
        user_performance = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31),
            type_performance=type_performance,
            difficulty_performance=difficulty_performance,
            level_progression=level_progression,
            repeated_mistakes=repeated_mistakes,
            weaknesses=weaknesses
        )

        # Then
        assert user_performance.id == 1
        assert user_performance.user_id == 1
        assert user_performance.analysis_period_start == date(2025, 1, 1)
        assert user_performance.analysis_period_end == date(2025, 1, 31)
        assert user_performance.type_performance == type_performance
        assert user_performance.difficulty_performance == difficulty_performance
        assert user_performance.level_progression == level_progression
        assert user_performance.repeated_mistakes == repeated_mistakes
        assert user_performance.weaknesses == weaknesses
        assert isinstance(user_performance.created_at, datetime)
        assert isinstance(user_performance.updated_at, datetime)

    def test_create_user_performance_with_optional_fields(self):
        """선택적 필드가 None인 UserPerformance 생성 테스트"""
        # Given & When
        user_performance = UserPerformance(
            id=2,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31)
        )

        # Then
        assert user_performance.type_performance == {}
        assert user_performance.difficulty_performance == {}
        assert user_performance.level_progression == {}
        assert user_performance.repeated_mistakes == []
        assert user_performance.weaknesses == {}

    def test_create_user_performance_with_optional_datetimes(self):
        """created_at과 updated_at을 지정한 UserPerformance 생성 테스트"""
        # Given
        created_at = datetime(2025, 1, 1, 10, 0, 0)
        updated_at = datetime(2025, 1, 31, 15, 0, 0)

        # When
        user_performance = UserPerformance(
            id=3,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31),
            created_at=created_at,
            updated_at=updated_at
        )

        # Then
        assert user_performance.created_at == created_at
        assert user_performance.updated_at == updated_at

    def test_validate_user_id_must_be_positive(self):
        """user_id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="user_id는 양의 정수여야 합니다"):
            UserPerformance(
                id=1,
                user_id=0,
                analysis_period_start=date(2025, 1, 1),
                analysis_period_end=date(2025, 1, 31)
            )

    def test_validate_analysis_period_start_before_end(self):
        """analysis_period_start는 analysis_period_end보다 이전이어야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="analysis_period_start는 analysis_period_end보다 이전이어야 합니다"):
            UserPerformance(
                id=1,
                user_id=1,
                analysis_period_start=date(2025, 1, 31),
                analysis_period_end=date(2025, 1, 1)
            )

    def test_validate_analysis_period_same_date_allowed(self):
        """analysis_period_start와 analysis_period_end가 같은 날짜는 허용됨"""
        # Given & When
        user_performance = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 1)
        )

        # Then
        assert user_performance.analysis_period_start == user_performance.analysis_period_end

    def test_validate_id_must_be_positive(self):
        """id는 양수여야 함"""
        # Given & When & Then
        with pytest.raises(ValueError, match="id는 양의 정수여야 합니다"):
            UserPerformance(
                id=0,
                user_id=1,
                analysis_period_start=date(2025, 1, 1),
                analysis_period_end=date(2025, 1, 31)
            )

    def test_update_performance_data(self):
        """성능 데이터 업데이트 테스트"""
        # Given
        user_performance = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31)
        )

        original_updated_at = user_performance.updated_at

        # When
        new_type_performance = {"vocabulary": {"accuracy": 0.90, "avg_time": 100, "total": 60}}
        user_performance.update_performance_data(
            type_performance=new_type_performance,
            difficulty_performance={"1": {"accuracy": 0.98, "total": 25}},
            level_progression={"N5": {"avg_score": 90.0, "test_count": 6}}
        )

        # Then
        assert user_performance.type_performance == new_type_performance
        assert user_performance.difficulty_performance == {"1": {"accuracy": 0.98, "total": 25}}
        assert user_performance.level_progression == {"N5": {"avg_score": 90.0, "test_count": 6}}
        assert user_performance.updated_at > original_updated_at

    def test_equality_by_id(self):
        """ID 기반 동등성 비교 테스트"""
        # Given
        perf1 = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31)
        )

        perf2 = UserPerformance(
            id=1,
            user_id=2,
            analysis_period_start=date(2025, 2, 1),
            analysis_period_end=date(2025, 2, 28)
        )

        perf3 = UserPerformance(
            id=2,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31)
        )

        # Then
        assert perf1 == perf2  # 같은 ID
        assert perf1 != perf3  # 다른 ID

    def test_hash_by_id(self):
        """ID 기반 해시 테스트"""
        # Given
        perf1 = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31)
        )

        perf2 = UserPerformance(
            id=1,
            user_id=2,
            analysis_period_start=date(2025, 2, 1),
            analysis_period_end=date(2025, 2, 28)
        )

        # Then
        assert hash(perf1) == hash(perf2)

    def test_repr(self):
        """문자열 표현 테스트"""
        # Given
        user_performance = UserPerformance(
            id=1,
            user_id=1,
            analysis_period_start=date(2025, 1, 1),
            analysis_period_end=date(2025, 1, 31)
        )

        # When
        repr_str = repr(user_performance)

        # Then
        assert "UserPerformance" in repr_str
        assert "id=1" in repr_str
        assert "user_id=1" in repr_str

