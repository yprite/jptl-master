"""
UserVocabulary 도메인 엔티티
사용자별 단어 학습 상태를 표현하는 도메인 로직
"""

from typing import Optional
from backend.domain.value_objects.jlpt import MemorizationStatus


class UserVocabulary:
    """
    사용자별 단어 학습 상태 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    사용자별 단어 학습 상태를 관리
    """

    def __init__(
        self,
        id: Optional[int],
        user_id: int,
        vocabulary_id: int,
        memorization_status: MemorizationStatus = MemorizationStatus.NOT_MEMORIZED
    ):
        """
        UserVocabulary 엔티티 초기화

        Args:
            id: 고유 식별자
            user_id: 사용자 ID
            vocabulary_id: 단어 ID
            memorization_status: 암기 상태 (기본값: NOT_MEMORIZED)

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
            f"vocabulary_id={self.vocabulary_id}, status={self.memorization_status})"
        )

