"""
JLPT Vocabulary 도메인 엔티티
JLPT 단어 학습의 도메인 로직을 표현
"""

from typing import Optional
from backend.domain.value_objects.jlpt import JLPTLevel


class Vocabulary:
    """
    JLPT 단어 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    JLPT 단어 학습을 위한 단어 정보를 표현
    사용자별 암기 상태는 UserVocabulary 엔티티에서 관리
    """

    def __init__(
        self,
        id: int,
        word: str,
        reading: str,
        meaning: str,
        level: JLPTLevel,
        example_sentence: Optional[str] = None
    ):
        """
        Vocabulary 엔티티 초기화

        Args:
            id: 고유 식별자
            word: 일본어 단어
            reading: 읽기 (히라가나/가타카나)
            meaning: 의미 (한국어)
            level: JLPT 레벨 (N1-N5)
            example_sentence: 예문 (선택적)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_word(word)
        self._validate_reading(reading)
        self._validate_meaning(meaning)
        self._validate_example_sentence(example_sentence)

        self.id = id
        self.word = word
        self.reading = reading
        self.meaning = meaning
        self.level = level
        self.example_sentence = example_sentence

    def _validate_word(self, word: str) -> None:
        """단어 검증"""
        if not word or not isinstance(word, str):
            raise ValueError("단어는 필수 항목입니다")

        if len(word.strip()) == 0:
            raise ValueError("단어는 비어있을 수 없습니다")

        if len(word) > 100:
            raise ValueError("단어는 100자를 초과할 수 없습니다")

    def _validate_reading(self, reading: str) -> None:
        """읽기 검증"""
        if not reading or not isinstance(reading, str):
            raise ValueError("읽기는 필수 항목입니다")

        if len(reading.strip()) == 0:
            raise ValueError("읽기는 비어있을 수 없습니다")

        if len(reading) > 200:
            raise ValueError("읽기는 200자를 초과할 수 없습니다")

    def _validate_meaning(self, meaning: str) -> None:
        """의미 검증"""
        if not meaning or not isinstance(meaning, str):
            raise ValueError("의미는 필수 항목입니다")

        if len(meaning.strip()) == 0:
            raise ValueError("의미는 비어있을 수 없습니다")

        if len(meaning) > 500:
            raise ValueError("의미는 500자를 초과할 수 없습니다")

    def _validate_example_sentence(self, example_sentence: Optional[str]) -> None:
        """예문 검증"""
        if example_sentence is not None:
            if not isinstance(example_sentence, str):
                raise ValueError("예문은 문자열이어야 합니다")

            if len(example_sentence) > 1000:
                raise ValueError("예문은 1000자를 초과할 수 없습니다")

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, Vocabulary):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return f"Vocabulary(id={self.id}, word={self.word}, level={self.level})"

