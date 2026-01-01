"""
JLPT Vocabulary 도메인 엔티티 테스트
TDD 방식으로 Vocabulary 엔티티의 비즈니스 로직 검증
"""

import pytest
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel, MemorizationStatus


class TestVocabulary:
    """Vocabulary 엔티티 단위 테스트"""

    def test_create_valid_vocabulary(self):
        """유효한 Vocabulary 생성 테스트"""
        vocabulary = Vocabulary(
            id=1,
            word="こんにちは",
            reading="こんにちは",
            meaning="안녕하세요",
            level=JLPTLevel.N5,
            example_sentence="こんにちは、元気ですか？",
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert vocabulary.id == 1
        assert vocabulary.word == "こんにちは"
        assert vocabulary.reading == "こんにちは"
        assert vocabulary.meaning == "안녕하세요"
        assert vocabulary.level == JLPTLevel.N5
        assert vocabulary.example_sentence == "こんにちは、元気ですか？"
        assert vocabulary.memorization_status == MemorizationStatus.NOT_MEMORIZED

    def test_create_vocabulary_without_example_sentence(self):
        """예문 없이 Vocabulary 생성 테스트"""
        vocabulary = Vocabulary(
            id=1,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert vocabulary.id == 1
        assert vocabulary.word == "ありがとう"
        assert vocabulary.example_sentence is None

    def test_vocabulary_creation_validation(self):
        """Vocabulary 생성 시 유효성 검증 테스트"""

        # 빈 단어
        with pytest.raises(ValueError, match="단어는 필수 항목입니다"):
            Vocabulary(
                id=1,
                word="",
                reading="ありがとう",
                meaning="감사합니다",
                level=JLPTLevel.N5,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

        # 빈 읽기
        with pytest.raises(ValueError, match="읽기는 필수 항목입니다"):
            Vocabulary(
                id=1,
                word="ありがとう",
                reading="",
                meaning="감사합니다",
                level=JLPTLevel.N5,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

        # 빈 의미
        with pytest.raises(ValueError, match="의미는 필수 항목입니다"):
            Vocabulary(
                id=1,
                word="ありがとう",
                reading="ありがとう",
                meaning="",
                level=JLPTLevel.N5,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

        # 단어 길이 초과
        with pytest.raises(ValueError, match="단어는 100자를 초과할 수 없습니다"):
            Vocabulary(
                id=1,
                word="あ" * 101,
                reading="ありがとう",
                meaning="감사합니다",
                level=JLPTLevel.N5,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

        # 읽기 길이 초과
        with pytest.raises(ValueError, match="읽기는 200자를 초과할 수 없습니다"):
            Vocabulary(
                id=1,
                word="ありがとう",
                reading="あ" * 201,
                meaning="감사합니다",
                level=JLPTLevel.N5,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

        # 의미 길이 초과
        with pytest.raises(ValueError, match="의미는 500자를 초과할 수 없습니다"):
            Vocabulary(
                id=1,
                word="ありがとう",
                reading="ありがとう",
                meaning="가" * 501,
                level=JLPTLevel.N5,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

        # 예문 길이 초과
        with pytest.raises(ValueError, match="예문은 1000자를 초과할 수 없습니다"):
            Vocabulary(
                id=1,
                word="ありがとう",
                reading="ありがとう",
                meaning="감사합니다",
                level=JLPTLevel.N5,
                example_sentence="あ" * 1001,
                memorization_status=MemorizationStatus.NOT_MEMORIZED
            )

    def test_update_memorization_status(self):
        """암기 상태 업데이트 테스트"""
        vocabulary = Vocabulary(
            id=1,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert vocabulary.memorization_status == MemorizationStatus.NOT_MEMORIZED

        vocabulary.update_memorization_status(MemorizationStatus.LEARNING)
        assert vocabulary.memorization_status == MemorizationStatus.LEARNING

        vocabulary.update_memorization_status(MemorizationStatus.MEMORIZED)
        assert vocabulary.memorization_status == MemorizationStatus.MEMORIZED

    def test_vocabulary_equality(self):
        """Vocabulary 동등성 비교 테스트"""
        vocab1 = Vocabulary(
            id=1,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        vocab2 = Vocabulary(
            id=1,
            word="こんにちは",
            reading="こんにちは",
            meaning="안녕하세요",
            level=JLPTLevel.N4,
            memorization_status=MemorizationStatus.MEMORIZED
        )

        vocab3 = Vocabulary(
            id=2,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        assert vocab1 == vocab2  # 같은 ID
        assert vocab1 != vocab3  # 다른 ID

    def test_vocabulary_hash(self):
        """Vocabulary 해시 테스트"""
        vocab1 = Vocabulary(
            id=1,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        vocab2 = Vocabulary(
            id=1,
            word="こんにちは",
            reading="こんにちは",
            meaning="안녕하세요",
            level=JLPTLevel.N4,
            memorization_status=MemorizationStatus.MEMORIZED
        )

        assert hash(vocab1) == hash(vocab2)  # 같은 ID는 같은 해시

    def test_vocabulary_repr(self):
        """Vocabulary 문자열 표현 테스트"""
        vocabulary = Vocabulary(
            id=1,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        repr_str = repr(vocabulary)
        assert "Vocabulary" in repr_str
        assert "id=1" in repr_str
        assert "level=N5" in repr_str
        assert "status=not_memorized" in repr_str

