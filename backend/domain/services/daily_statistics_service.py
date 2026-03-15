"""
일일 학습 통계 서비스
일일 학습 통계를 집계하고 목표 달성률을 계산하는 도메인 서비스
"""

from datetime import date, datetime
from typing import Optional, Dict, Any
from backend.domain.entities.daily_goal import DailyGoal
from backend.domain.entities.learning_history import LearningHistory
from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository


class DailyStatisticsService:
    """일일 학습 통계 서비스"""

    def __init__(self, learning_history_repo: SqliteLearningHistoryRepository):
        """
        DailyStatisticsService 초기화

        Args:
            learning_history_repo: LearningHistory Repository
        """
        self.learning_history_repo = learning_history_repo

    def get_daily_statistics(
        self,
        user_id: int,
        target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        일일 학습 통계 조회

        Args:
            user_id: 사용자 ID
            target_date: 조회할 날짜 (None이면 오늘)

        Returns:
            Dict[str, Any]: 일일 학습 통계
                - total_questions: 오늘 푼 문제 수
                - total_minutes: 오늘 학습 시간 (분)
                - study_sessions: 학습 세션 수
        """
        if target_date is None:
            target_date = date.today()

        # 해당 날짜의 학습 이력 조회
        histories = self.learning_history_repo.find_by_study_date(target_date)
        user_histories = [h for h in histories if h.user_id == user_id]

        total_questions = sum(h.total_questions for h in user_histories)
        total_minutes = sum(h.time_spent_minutes for h in user_histories)
        study_sessions = len(user_histories)

        return {
            'date': target_date.isoformat(),
            'total_questions': total_questions,
            'total_minutes': total_minutes,
            'study_sessions': study_sessions
        }

    def calculate_goal_achievement(
        self,
        daily_goal: Optional[DailyGoal],
        daily_statistics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        목표 달성률 계산

        Args:
            daily_goal: 일일 목표 (None이면 목표 없음)
            daily_statistics: 일일 학습 통계

        Returns:
            Dict[str, Any]: 목표 달성률 정보
                - questions_achievement_rate: 문제 수 달성률 (0.0 ~ 100.0)
                - minutes_achievement_rate: 학습 시간 달성률 (0.0 ~ 100.0)
                - overall_achievement_rate: 전체 달성률 (평균)
                - is_questions_achieved: 문제 수 목표 달성 여부
                - is_minutes_achieved: 학습 시간 목표 달성 여부
                - is_fully_achieved: 모든 목표 달성 여부
        """
        if daily_goal is None:
            return {
                'questions_achievement_rate': 0.0,
                'minutes_achievement_rate': 0.0,
                'overall_achievement_rate': 0.0,
                'is_questions_achieved': False,
                'is_minutes_achieved': False,
                'is_fully_achieved': False,
                'has_goal': False
            }

        total_questions = daily_statistics.get('total_questions', 0)
        total_minutes = daily_statistics.get('total_minutes', 0)

        # 문제 수 달성률 계산
        if daily_goal.target_questions > 0:
            questions_achievement_rate = min(
                (total_questions / daily_goal.target_questions) * 100.0,
                100.0
            )
        else:
            questions_achievement_rate = 100.0 if total_questions == 0 else 0.0

        # 학습 시간 달성률 계산
        if daily_goal.target_minutes > 0:
            minutes_achievement_rate = min(
                (total_minutes / daily_goal.target_minutes) * 100.0,
                100.0
            )
        else:
            minutes_achievement_rate = 100.0 if total_minutes == 0 else 0.0

        # 전체 달성률 (평균)
        overall_achievement_rate = (questions_achievement_rate + minutes_achievement_rate) / 2.0

        # 목표 달성 여부
        is_questions_achieved = total_questions >= daily_goal.target_questions
        is_minutes_achieved = total_minutes >= daily_goal.target_minutes
        is_fully_achieved = is_questions_achieved and is_minutes_achieved

        return {
            'questions_achievement_rate': round(questions_achievement_rate, 2),
            'minutes_achievement_rate': round(minutes_achievement_rate, 2),
            'overall_achievement_rate': round(overall_achievement_rate, 2),
            'is_questions_achieved': is_questions_achieved,
            'is_minutes_achieved': is_minutes_achieved,
            'is_fully_achieved': is_fully_achieved,
            'has_goal': True
        }

    def get_daily_goal_with_statistics(
        self,
        daily_goal: Optional[DailyGoal],
        user_id: int,
        target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        일일 목표와 통계를 함께 조회

        Args:
            daily_goal: 일일 목표 (None이면 기본값 사용)
            user_id: 사용자 ID
            target_date: 조회할 날짜 (None이면 오늘)

        Returns:
            Dict[str, Any]: 일일 목표와 통계 정보
        """
        # 일일 통계 조회
        daily_statistics = self.get_daily_statistics(user_id, target_date)

        # 목표가 없으면 기본값 사용
        if daily_goal is None:
            daily_goal = DailyGoal(
                id=None,
                user_id=user_id,
                target_questions=10,
                target_minutes=30
            )

        # 목표 달성률 계산
        achievement = self.calculate_goal_achievement(daily_goal, daily_statistics)

        return {
            'goal': {
                'target_questions': daily_goal.target_questions,
                'target_minutes': daily_goal.target_minutes
            },
            'statistics': daily_statistics,
            'achievement': achievement
        }

