"""
JLPT 관련 값 객체
JLPT 레벨과 문제 유형을 표현하는 값 객체들
"""

from enum import Enum


class JLPTLevel(Enum):
    """JLPT 레벨 열거형"""
    N5 = "N5"  # 초급
    N4 = "N4"  # 초중급
    N3 = "N3"  # 중급
    N2 = "N2"  # 중상급
    N1 = "N1"  # 상급

    def __str__(self) -> str:
        return self.value

    def __lt__(self, other) -> bool:
        """레벨 순서 비교 (N5 < N4 < N3 < N2 < N1)"""
        if not isinstance(other, JLPTLevel):
            return NotImplemented
        levels_order = [self.N5, self.N4, self.N3, self.N2, self.N1]
        return levels_order.index(self) < levels_order.index(other)


class QuestionType(Enum):
    """JLPT 문제 유형 열거형"""
    VOCABULARY = "vocabulary"  # 어휘
    GRAMMAR = "grammar"       # 문법
    READING = "reading"       # 독해
    LISTENING = "listening"   # 청해

    def __str__(self) -> str:
        return self.value
