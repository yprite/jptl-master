"""
UserVocabulary 도메인 엔티티 테스트
TDD 방식으로 UserVocabulary 엔티티의 비즈니스 로직 검증
"""

import pytest
from backend.domain.entities.user_vocabulary import UserVocabulary
from backend.domain.value_objects.jlpt import MemorizationStatus


class TestUserVocabulary:
    """UserVocabulary 엔티티 단위 테스트"""

    def test_create_valid_user_vocabulary(self):
        """유효한 UserVocabulary 생성 테스트"""
        user_vocab = UserVocabulary(
            id=1,
            user_id=1,
            vocabulary_id=1,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert user_vocab.id == 1
        assert user_vocab.user_id == 1
        assert user_vocab.vocabulary_id == 1
        assert user_vocab.memorization_status == MemorizationStatus.NOT_MEMORIZED

    def test_create_user_vocabulary_with_default_status(self):
        """기본 상태로 UserVocabulary 생성 테스트"""
        user_vocab = UserVocabulary(
            id=None,
            user_id=1,
            vocabulary_id=1
        )

        assert user_vocab.user_id == 1
        assert user_vocab.vocabulary_id == 1
        assert user_vocab.memorization_status == MemorizationStatus.NOT_MEMORIZED

    def test_user_vocabulary_creation_validation(self):
        """UserVocabulary 생성 시 유효성 검증 테스트"""

        # 잘못된 user_id
        with pytest.raises(ValueError, match="user_id는 양의 정수여야 합니다"):
            UserVocabulary(
                id=1,
                user_id=0,
                vocabulary_id=1
            )

        # 잘못된 vocabulary_id
        with pytest.raises(ValueError, match="vocabulary_id는 양의 정수여야 합니다"):
            UserVocabulary(
                id=1,
                user_id=1,
                vocabulary_id=0
            )

    def test_update_memorization_status(self):
        """암기 상태 업데이트 테스트"""
        user_vocab = UserVocabulary(
            id=1,
            user_id=1,
            vocabulary_id=1,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert user_vocab.memorization_status == MemorizationStatus.NOT_MEMORIZED

        user_vocab.update_memorization_status(MemorizationStatus.LEARNING)
        assert user_vocab.memorization_status == MemorizationStatus.LEARNING

        user_vocab.update_memorization_status(MemorizationStatus.MEMORIZED)
        assert user_vocab.memorization_status == MemorizationStatus.MEMORIZED

    def test_user_vocabulary_equality(self):
        """UserVocabulary 동등성 비교 테스트"""
        user_vocab1 = UserVocabulary(
            id=1,
            user_id=1,
            vocabulary_id=1,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        user_vocab2 = UserVocabulary(
            id=1,
            user_id=2,
            vocabulary_id=2,
            memorization_status=MemorizationStatus.MEMORIZED
        )

        user_vocab3 = UserVocabulary(
            id=2,
            user_id=1,
            vocabulary_id=1,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert user_vocab1 == user_vocab2  # 같은 ID
        assert user_vocab1 != user_vocab3  # 다른 ID

    def test_user_vocabulary_hash(self):
        """UserVocabulary 해시 테스트"""
        user_vocab1 = UserVocabulary(
            id=1,
            user_id=1,
            vocabulary_id=1,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        user_vocab2 = UserVocabulary(
            id=1,
            user_id=2,
            vocabulary_id=2,
            memorization_status=MemorizationStatus.MEMORIZED
        )

        assert hash(user_vocab1) == hash(user_vocab2)  # 같은 ID는 같은 해시

    def test_user_vocabulary_repr(self):
        """UserVocabulary 문자열 표현 테스트"""
        user_vocab = UserVocabulary(
            id=1,
            user_id=1,
            vocabulary_id=1,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        repr_str = repr(user_vocab)
        assert "UserVocabulary" in repr_str
        assert "id=1" in repr_str
        assert "user_id=1" in repr_str
        assert "vocabulary_id=1" in repr_str
        assert "status=not_memorized" in repr_str

