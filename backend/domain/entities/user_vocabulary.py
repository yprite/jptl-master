"""
UserVocabulary 도메인 엔티티
사용자별 단어 학습 상태를 표현하는 도메인 로직
"""

from typing import Optional
from datetime import datetime, date
from backend.domain.value_objects.jlpt import MemorizationStatus


class UserVocabulary:
    """
    사용자별 단어 학습 상태 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    사용자별 단어 학습 상태를 관리
    Anki 스타일 간격 반복 학습(SRS) 기능 포함
    """

    def __init__(
        self,
        id: Optional[int],
        user_id: int,
        vocabulary_id: int,
        memorization_status: MemorizationStatus = MemorizationStatus.NOT_MEMORIZED,
        next_review_date: Optional[date] = None,
        interval_days: int = 0,
        ease_factor: float = 2.5,
        review_count: int = 0,
        last_review_date: Optional[date] = None,
        consecutive_correct: int = 0,
        consecutive_incorrect: int = 0
    ):
        """
        UserVocabulary 엔티티 초기화

        Args:
            id: 고유 식별자
            user_id: 사용자 ID
            vocabulary_id: 단어 ID
            memorization_status: 암기 상태 (기본값: NOT_MEMORIZED)
            next_review_date: 다음 복습 일정 (기본값: None)
            interval_days: 복습 간격 일수 (기본값: 0)
            ease_factor: 난이도 조정 계수 (기본값: 2.5, Anki 스타일)
            review_count: 총 복습 횟수 (기본값: 0)
            last_review_date: 마지막 복습 날짜 (기본값: None)
            consecutive_correct: 연속 정답 횟수 (기본값: 0)
            consecutive_incorrect: 연속 오답 횟수 (기본값: 0)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_id(id)
        self._validate_user_id(user_id)
        self._validate_vocabulary_id(vocabulary_id)

        self.id = id
        self.user_id = user_id
        self.vocabulary_id = vocabulary_id
        self.memorization_status = memorization_status
        self.next_review_date = next_review_date
        self.interval_days = interval_days
        self.ease_factor = ease_factor
        self.review_count = review_count
        self.last_review_date = last_review_date
        self.consecutive_correct = consecutive_correct
        self.consecutive_incorrect = consecutive_incorrect

    def _validate_id(self, id: Optional[int]) -> None:
        """ID 검증"""
        if id is not None and (not isinstance(id, int) or id <= 0):
            raise ValueError("id는 양의 정수여야 합니다")

    def _validate_user_id(self, user_id: int) -> None:
        """user_id 검증"""
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("user_id는 양의 정수여야 합니다")

    def _validate_vocabulary_id(self, vocabulary_id: int) -> None:
        """vocabulary_id 검증"""
        if not isinstance(vocabulary_id, int) or vocabulary_id <= 0:
            raise ValueError("vocabulary_id는 양의 정수여야 합니다")

    def update_memorization_status(self, status: MemorizationStatus) -> None:
        """
        암기 상태 업데이트

        Args:
            status: 새로운 암기 상태
        """
        self.memorization_status = status

    def is_due_for_review(self, today: Optional[date] = None) -> bool:
        """
        오늘 복습해야 하는지 확인

        Args:
            today: 오늘 날짜 (기본값: None이면 현재 날짜 사용)

        Returns:
            복습해야 하면 True, 아니면 False
        """
        if today is None:
            today = date.today()
        
        if self.next_review_date is None:
            return True  # 복습 일정이 없으면 복습 필요
        
        return self.next_review_date <= today

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, UserVocabulary):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return (
            f"UserVocabulary(id={self.id}, user_id={self.user_id}, "
            f"vocabulary_id={self.vocabulary_id}, status={self.memorization_status}, "
            f"next_review={self.next_review_date}, interval={self.interval_days}, "
            f"ease={self.ease_factor}, reviews={self.review_count})"
        )

