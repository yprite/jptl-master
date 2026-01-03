"""
DailyGoal 도메인 엔티티
일일 학습 목표를 표현하는 도메인 로직
"""

from datetime import datetime, date
from typing import Optional


class DailyGoal:
    """
    일일 학습 목표 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    사용자의 일일 학습 목표(문제 수, 학습 시간)를 관리
    """

    def __init__(
        self,
        id: Optional[int],
        user_id: int,
        target_questions: int,
        target_minutes: int,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        """
        DailyGoal 엔티티 초기화

        Args:
            id: 고유 식별자
            user_id: 사용자 ID
            target_questions: 목표 문제 수
            target_minutes: 목표 학습 시간 (분)
            created_at: 생성 일시 (미제공 시 현재 시간)
            updated_at: 수정 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_id(id)
        self._validate_user_id(user_id)
        self._validate_target_questions(target_questions)
        self._validate_target_minutes(target_minutes)

        self.id = id
        self.user_id = user_id
        self.target_questions = target_questions
        self.target_minutes = target_minutes
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def _validate_id(self, id: Optional[int]) -> None:
        """ID 검증"""
        if id is not None and (not isinstance(id, int) or id <= 0):
            raise ValueError("id는 양의 정수여야 합니다")

    def _validate_user_id(self, user_id: int) -> None:
        """user_id 검증"""
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("user_id는 양의 정수여야 합니다")

    def _validate_target_questions(self, target_questions: int) -> None:
        """target_questions 검증"""
        if not isinstance(target_questions, int) or target_questions < 0:
            raise ValueError("목표 문제 수는 0 이상의 정수여야 합니다")

    def _validate_target_minutes(self, target_minutes: int) -> None:
        """target_minutes 검증"""
        if not isinstance(target_minutes, int) or target_minutes < 0:
            raise ValueError("목표 학습 시간은 0 이상의 정수여야 합니다")

    def update_goals(
        self,
        target_questions: Optional[int] = None,
        target_minutes: Optional[int] = None
    ) -> None:
        """
        목표 업데이트

        Args:
            target_questions: 새로운 목표 문제 수 (선택)
            target_minutes: 새로운 목표 학습 시간 (선택)
        """
        if target_questions is not None:
            self._validate_target_questions(target_questions)
            self.target_questions = target_questions

        if target_minutes is not None:
            self._validate_target_minutes(target_minutes)
            self.target_minutes = target_minutes

        self.updated_at = datetime.now()

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, DailyGoal):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return (
            f"DailyGoal(id={self.id}, user_id={self.user_id}, "
            f"target_questions={self.target_questions}, "
            f"target_minutes={self.target_minutes})"
        )

