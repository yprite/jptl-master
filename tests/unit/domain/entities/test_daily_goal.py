"""
DailyGoal 도메인 엔티티 테스트
"""

import pytest
from datetime import datetime
from backend.domain.entities.daily_goal import DailyGoal


class TestDailyGoal:
    """DailyGoal 엔티티 테스트"""

    def test_daily_goal_creation_with_valid_data(self):
        """유효한 데이터로 DailyGoal 생성 테스트"""
        # Given
        user_id = 1
        target_questions = 10
        target_minutes = 30

        # When
        daily_goal = DailyGoal(
            id=None,
            user_id=user_id,
            target_questions=target_questions,
            target_minutes=target_minutes
        )

        # Then
        assert daily_goal.id is None
        assert daily_goal.user_id == user_id
        assert daily_goal.target_questions == target_questions
        assert daily_goal.target_minutes == target_minutes
        assert isinstance(daily_goal.created_at, datetime)
        assert isinstance(daily_goal.updated_at, datetime)

    def test_daily_goal_creation_with_id(self):
        """ID를 포함한 DailyGoal 생성 테스트"""
        # Given
        goal_id = 1
        user_id = 1
        target_questions = 20
        target_minutes = 60

        # When
        daily_goal = DailyGoal(
            id=goal_id,
            user_id=user_id,
            target_questions=target_questions,
            target_minutes=target_minutes
        )

        # Then
        assert daily_goal.id == goal_id
        assert daily_goal.user_id == user_id
        assert daily_goal.target_questions == target_questions
        assert daily_goal.target_minutes == target_minutes

    def test_daily_goal_update_goals(self):
        """목표 업데이트 테스트"""
        # Given
        daily_goal = DailyGoal(
            id=1,
            user_id=1,
            target_questions=10,
            target_minutes=30
        )
        original_updated_at = daily_goal.updated_at

        # When
        daily_goal.update_goals(
            target_questions=20,
            target_minutes=60
        )

        # Then
        assert daily_goal.target_questions == 20
        assert daily_goal.target_minutes == 60
        assert daily_goal.updated_at > original_updated_at

    def test_daily_goal_update_partial(self):
        """부분 업데이트 테스트"""
        # Given
        daily_goal = DailyGoal(
            id=1,
            user_id=1,
            target_questions=10,
            target_minutes=30
        )

        # When
        daily_goal.update_goals(target_questions=15)

        # Then
        assert daily_goal.target_questions == 15
        assert daily_goal.target_minutes == 30  # 변경되지 않음

    def test_daily_goal_validation_invalid_user_id(self):
        """잘못된 user_id 검증 테스트"""
        # Then
        with pytest.raises(ValueError, match="user_id는 양의 정수여야 합니다"):
            DailyGoal(
                id=None,
                user_id=0,
                target_questions=10,
                target_minutes=30
            )

    def test_daily_goal_validation_invalid_target_questions(self):
        """잘못된 target_questions 검증 테스트"""
        # Then
        with pytest.raises(ValueError, match="목표 문제 수는 0 이상의 정수여야 합니다"):
            DailyGoal(
                id=None,
                user_id=1,
                target_questions=-1,
                target_minutes=30
            )

    def test_daily_goal_validation_invalid_target_minutes(self):
        """잘못된 target_minutes 검증 테스트"""
        # Then
        with pytest.raises(ValueError, match="목표 학습 시간은 0 이상의 정수여야 합니다"):
            DailyGoal(
                id=None,
                user_id=1,
                target_questions=10,
                target_minutes=-1
            )

    def test_daily_goal_equality(self):
        """동등성 비교 테스트"""
        # Given
        goal1 = DailyGoal(id=1, user_id=1, target_questions=10, target_minutes=30)
        goal2 = DailyGoal(id=1, user_id=1, target_questions=10, target_minutes=30)
        goal3 = DailyGoal(id=2, user_id=1, target_questions=10, target_minutes=30)

        # Then
        assert goal1 == goal2
        assert goal1 != goal3

    def test_daily_goal_repr(self):
        """문자열 표현 테스트"""
        # Given
        daily_goal = DailyGoal(
            id=1,
            user_id=1,
            target_questions=10,
            target_minutes=30
        )

        # When
        repr_str = repr(daily_goal)

        # Then
        assert "DailyGoal" in repr_str
        assert "user_id=1" in repr_str
        assert "target_questions=10" in repr_str
        assert "target_minutes=30" in repr_str

