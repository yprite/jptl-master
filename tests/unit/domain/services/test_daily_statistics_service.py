"""
DailyStatisticsService 테스트
"""

import pytest
from datetime import date
from backend.domain.entities.daily_goal import DailyGoal
from backend.domain.services.daily_statistics_service import DailyStatisticsService
from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
from backend.infrastructure.repositories.learning_history_mapper import LearningHistoryMapper
from backend.domain.entities.learning_history import LearningHistory


class TestDailyStatisticsService:
    """DailyStatisticsService 테스트"""

    @pytest.fixture
    def learning_history_repo(self):
        """LearningHistory Repository 인스턴스 생성"""
        return SqliteLearningHistoryRepository()

    @pytest.fixture
    def service(self, learning_history_repo):
        """DailyStatisticsService 인스턴스 생성"""
        return DailyStatisticsService(learning_history_repo)

    @pytest.fixture
    def sample_daily_goal(self):
        """샘플 DailyGoal 생성"""
        return DailyGoal(
            id=1,
            user_id=1,
            target_questions=10,
            target_minutes=30
        )

    def test_get_daily_statistics_no_data(self, service):
        """학습 이력이 없는 경우 통계 조회 테스트"""
        # When
        stats = service.get_daily_statistics(user_id=999, target_date=date.today())

        # Then
        assert stats['total_questions'] == 0
        assert stats['total_minutes'] == 0
        assert stats['study_sessions'] == 0
        assert stats['date'] == date.today().isoformat()

    def test_calculate_goal_achievement_no_goal(self, service):
        """목표가 없는 경우 달성률 계산 테스트"""
        # Given
        stats = {'total_questions': 5, 'total_minutes': 15}

        # When
        achievement = service.calculate_goal_achievement(None, stats)

        # Then
        assert achievement['has_goal'] is False
        assert achievement['questions_achievement_rate'] == 0.0
        assert achievement['minutes_achievement_rate'] == 0.0
        assert achievement['is_fully_achieved'] is False

    def test_calculate_goal_achievement_fully_achieved(self, service, sample_daily_goal):
        """목표를 완전히 달성한 경우 테스트"""
        # Given
        stats = {'total_questions': 10, 'total_minutes': 30}

        # When
        achievement = service.calculate_goal_achievement(sample_daily_goal, stats)

        # Then
        assert achievement['has_goal'] is True
        assert achievement['questions_achievement_rate'] == 100.0
        assert achievement['minutes_achievement_rate'] == 100.0
        assert achievement['is_questions_achieved'] is True
        assert achievement['is_minutes_achieved'] is True
        assert achievement['is_fully_achieved'] is True

    def test_calculate_goal_achievement_partial(self, service, sample_daily_goal):
        """목표를 부분적으로 달성한 경우 테스트"""
        # Given
        stats = {'total_questions': 5, 'total_minutes': 15}

        # When
        achievement = service.calculate_goal_achievement(sample_daily_goal, stats)

        # Then
        assert achievement['has_goal'] is True
        assert achievement['questions_achievement_rate'] == 50.0
        assert achievement['minutes_achievement_rate'] == 50.0
        assert achievement['is_questions_achieved'] is False
        assert achievement['is_minutes_achieved'] is False
        assert achievement['is_fully_achieved'] is False

    def test_calculate_goal_achievement_over_achieved(self, service, sample_daily_goal):
        """목표를 초과 달성한 경우 테스트 (100%로 제한)"""
        # Given
        stats = {'total_questions': 20, 'total_minutes': 60}

        # When
        achievement = service.calculate_goal_achievement(sample_daily_goal, stats)

        # Then
        assert achievement['questions_achievement_rate'] == 100.0
        assert achievement['minutes_achievement_rate'] == 100.0
        assert achievement['is_questions_achieved'] is True
        assert achievement['is_minutes_achieved'] is True

    def test_calculate_goal_achievement_zero_target(self, service):
        """목표가 0인 경우 테스트"""
        # Given
        goal = DailyGoal(id=1, user_id=1, target_questions=0, target_minutes=0)
        stats = {'total_questions': 0, 'total_minutes': 0}

        # When
        achievement = service.calculate_goal_achievement(goal, stats)

        # Then
        assert achievement['questions_achievement_rate'] == 100.0
        assert achievement['minutes_achievement_rate'] == 100.0

    def test_get_daily_goal_with_statistics_no_goal(self, service):
        """목표가 없는 경우 기본값 사용 테스트"""
        # When
        result = service.get_daily_goal_with_statistics(
            daily_goal=None,
            user_id=1,
            target_date=date.today()
        )

        # Then
        assert result['goal']['target_questions'] == 10  # 기본값
        assert result['goal']['target_minutes'] == 30  # 기본값
        assert 'statistics' in result
        assert 'achievement' in result

    def test_get_daily_goal_with_statistics_with_goal(self, service, sample_daily_goal):
        """목표가 있는 경우 테스트"""
        # When
        result = service.get_daily_goal_with_statistics(
            daily_goal=sample_daily_goal,
            user_id=1,
            target_date=date.today()
        )

        # Then
        assert result['goal']['target_questions'] == 10
        assert result['goal']['target_minutes'] == 30
        assert 'statistics' in result
        assert 'achievement' in result
        assert result['achievement']['has_goal'] is True

