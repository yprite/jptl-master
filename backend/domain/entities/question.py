"""
JLPT Question 도메인 엔티티
JLPT 문제의 도메인 로직을 표현
"""

from typing import List, Optional
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class Question:
    """
    JLPT 문제 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    JLPT 시험 문제를 표현하며 답안 검증 등의 비즈니스 로직을 포함
    """

    def __init__(
        self,
        id: int,
        level: JLPTLevel,
        question_type: QuestionType,
        question_text: str,
        choices: List[str],
        correct_answer: str,
        explanation: str,
        difficulty: int,
        audio_url: Optional[str] = None
    ):
        """
        Question 엔티티 초기화

        Args:
            id: 고유 식별자
            level: JLPT 레벨 (N1-N5)
            question_type: 문제 유형 (어휘/문법/독해/청해)
            question_text: 문제 내용
            choices: 선택지 목록 (최소 2개)
            correct_answer: 정답
            explanation: 해설
            difficulty: 난이도 (1-5)
            audio_url: 오디오 파일 URL (선택적, 리스닝 문제용)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_question_text(question_text)
        self._validate_choices(choices)
        self._validate_correct_answer(correct_answer, choices)
        self._validate_difficulty(difficulty)

        self.id = id
        self.level = level
        self.question_type = question_type
        self.question_text = question_text
        self.choices = choices.copy()  # 불변성 보장
        self.correct_answer = correct_answer
        self.explanation = explanation
        self.difficulty = difficulty
        self.audio_url = audio_url

    def _validate_question_text(self, question_text: str) -> None:
        """문제 내용 검증"""
        if not question_text or not isinstance(question_text, str):
            raise ValueError("문제 내용은 필수 항목입니다")

        if len(question_text.strip()) == 0:
            raise ValueError("문제 내용은 비어있을 수 없습니다")

        if len(question_text) > 2000:
            raise ValueError("문제 내용은 2000자를 초과할 수 없습니다")

    def _validate_choices(self, choices: List[str]) -> None:
        """선택지 검증"""
        if not choices or not isinstance(choices, list):
            raise ValueError("선택지는 필수 항목입니다")

        if len(choices) < 2:
            raise ValueError("선택지는 최소 2개 이상이어야 합니다")

        if len(choices) > 6:
            raise ValueError("선택지는 최대 6개까지 가능합니다")

        # 중복 선택지 확인
        if len(set(choices)) != len(choices):
            raise ValueError("선택지에는 중복된 값이 있을 수 없습니다")

        # 각 선택지 검증
        for choice in choices:
            if not choice or not isinstance(choice, str):
                raise ValueError("각 선택지는 비어있을 수 없습니다")
            if len(choice.strip()) == 0:
                raise ValueError("각 선택지는 공백만으로 구성될 수 없습니다")
            if len(choice) > 500:
                raise ValueError("각 선택지는 500자를 초과할 수 없습니다")

    def _validate_correct_answer(self, correct_answer: str, choices: List[str]) -> None:
        """정답 검증"""
        if not correct_answer or not isinstance(correct_answer, str):
            raise ValueError("정답은 필수 항목입니다")

        if correct_answer not in choices:
            raise ValueError("정답은 선택지 중 하나여야 합니다")

    def _validate_difficulty(self, difficulty: int) -> None:
        """난이도 검증"""
        if not isinstance(difficulty, int):
            raise ValueError("난이도는 정수여야 합니다")

        if difficulty < 1 or difficulty > 5:
            raise ValueError("난이도는 1-5 사이여야 합니다")

    def is_correct_answer(self, answer: str) -> bool:
        """
        사용자의 답안이 정답인지 검증

        Args:
            answer: 사용자가 선택한 답안

        Returns:
            bool: 정답 여부
        """
        return answer == self.correct_answer

    def get_choice_index(self, answer: str) -> int:
        """
        답안의 선택지 인덱스 반환

        Args:
            answer: 답안

        Returns:
            int: 선택지 인덱스 (0부터 시작)

        Raises:
            ValueError: 유효하지 않은 답안인 경우
        """
        try:
            return self.choices.index(answer)
        except ValueError:
            raise ValueError(f"'{answer}'은 유효한 선택지가 아닙니다")

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, Question):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return f"Question(id={self.id}, level={self.level}, type={self.question_type}, difficulty={self.difficulty})"
