"""
UserPerformance 도메인 엔티티
사용자 성능 분석 데이터를 표현하는 도메인 로직
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List


class UserPerformance:
    """
    사용자 성능 분석 데이터 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    일정 기간 동안의 사용자 성능을 집계하여 종합적인 분석 데이터 제공
    """

    def __init__(
        self,
        id: int,
        user_id: int,
        analysis_period_start: date,
        analysis_period_end: date,
        type_performance: Optional[Dict[str, Any]] = None,
        difficulty_performance: Optional[Dict[str, Any]] = None,
        level_progression: Optional[Dict[str, Any]] = None,
        repeated_mistakes: Optional[List[int]] = None,
        weaknesses: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        """
        UserPerformance 엔티티 초기화

        Args:
            id: 고유 식별자
            user_id: 사용자 ID
            analysis_period_start: 분석 기간 시작일
            analysis_period_end: 분석 기간 종료일
            type_performance: 유형별 성취도 (JSON 딕셔너리)
            difficulty_performance: 난이도별 성취도 (JSON 딕셔너리)
            level_progression: 레벨별 성취도 추이 (JSON 딕셔너리)
            repeated_mistakes: 반복 오답 문제 ID 리스트
            weaknesses: 약점 분석 데이터 (JSON 딕셔너리, ChatGPT 분석용)
            created_at: 생성 일시 (미제공 시 현재 시간)
            updated_at: 수정 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_id(id)
        self._validate_user_id(user_id)
        self._validate_analysis_period(analysis_period_start, analysis_period_end)

        self.id = id
        self.user_id = user_id
        self.analysis_period_start = analysis_period_start
        self.analysis_period_end = analysis_period_end
        self.type_performance = type_performance or {}
        self.difficulty_performance = difficulty_performance or {}
        self.level_progression = level_progression or {}
        self.repeated_mistakes = repeated_mistakes or []
        self.weaknesses = weaknesses or {}
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def _validate_id(self, id: int) -> None:
        """ID 검증"""
        if not isinstance(id, int) or id <= 0:
            raise ValueError("id는 양의 정수여야 합니다")

    def _validate_user_id(self, user_id: int) -> None:
        """user_id 검증"""
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("user_id는 양의 정수여야 합니다")

    def _validate_analysis_period(self, start: date, end: date) -> None:
        """분석 기간 검증"""
        if not isinstance(start, date):
            raise ValueError("analysis_period_start는 date 타입이어야 합니다")

        if not isinstance(end, date):
            raise ValueError("analysis_period_end는 date 타입이어야 합니다")

        if start > end:
            raise ValueError("analysis_period_start는 analysis_period_end보다 이전이어야 합니다")

    def update_performance_data(
        self,
        type_performance: Optional[Dict[str, Any]] = None,
        difficulty_performance: Optional[Dict[str, Any]] = None,
        level_progression: Optional[Dict[str, Any]] = None,
        repeated_mistakes: Optional[List[int]] = None,
        weaknesses: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        성능 데이터 업데이트

        Args:
            type_performance: 유형별 성취도
            difficulty_performance: 난이도별 성취도
            level_progression: 레벨별 성취도 추이
            repeated_mistakes: 반복 오답 문제 ID 리스트
            weaknesses: 약점 분석 데이터
        """
        if type_performance is not None:
            self.type_performance = type_performance

        if difficulty_performance is not None:
            self.difficulty_performance = difficulty_performance

        if level_progression is not None:
            self.level_progression = level_progression

        if repeated_mistakes is not None:
            self.repeated_mistakes = repeated_mistakes

        if weaknesses is not None:
            self.weaknesses = weaknesses

        self.updated_at = datetime.now()

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, UserPerformance):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return (
            f"UserPerformance(id={self.id}, user_id={self.user_id}, "
            f"period={self.analysis_period_start}~{self.analysis_period_end})"
        )

