"""
AnswerDetail 도메인 엔티티
문제별 상세 답안 이력을 표현하는 도메인 로직
"""

from datetime import datetime
from typing import Optional
from backend.domain.value_objects.jlpt import QuestionType


class AnswerDetail:
    """
    문제별 상세 답안 이력 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    각 문제에 대한 사용자의 상세 답안 정보를 저장하여 문제별 성취도 및 소요 시간을 분석
    """

    def __init__(
        self,
        id: int,
        result_id: int,
        question_id: int,
        user_answer: str,
        correct_answer: str,
        is_correct: bool,
        time_spent_seconds: int,
        difficulty: int,
        question_type: QuestionType,
        created_at: Optional[datetime] = None
    ):
        """
        AnswerDetail 엔티티 초기화

        Args:
            id: 고유 식별자
            result_id: 결과 ID (어떤 시험 결과인지)
            question_id: 문제 ID
            user_answer: 사용자가 선택한 답안
            correct_answer: 정답
            is_correct: 정답 여부
            time_spent_seconds: 문제별 소요 시간 (초)
            difficulty: 문제 난이도 (1-5)
            question_type: 문제 유형 (VOCABULARY, GRAMMAR, READING, LISTENING)
            created_at: 생성 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_id(id)
        self._validate_result_id(result_id)
        self._validate_question_id(question_id)
        self._validate_user_answer(user_answer)
        self._validate_correct_answer(correct_answer)
        self._validate_time_spent_seconds(time_spent_seconds)
        self._validate_difficulty(difficulty)
        self._validate_question_type(question_type)

        self.id = id
        self.result_id = result_id
        self.question_id = question_id
        self.user_answer = user_answer
        self.correct_answer = correct_answer
        self.is_correct = is_correct
        self.time_spent_seconds = time_spent_seconds
        self.difficulty = difficulty
        self.question_type = question_type
        self.created_at = created_at or datetime.now()

    def _validate_id(self, id: int) -> None:
        """ID 검증"""
        if not isinstance(id, int) or id <= 0:
            raise ValueError("id는 양의 정수여야 합니다")

    def _validate_result_id(self, result_id: int) -> None:
        """result_id 검증"""
        if not isinstance(result_id, int) or result_id <= 0:
            raise ValueError("result_id는 양의 정수여야 합니다")

    def _validate_question_id(self, question_id: int) -> None:
        """question_id 검증"""
        if not isinstance(question_id, int) or question_id <= 0:
            raise ValueError("question_id는 양의 정수여야 합니다")

    def _validate_user_answer(self, user_answer: str) -> None:
        """user_answer 검증"""
        if not isinstance(user_answer, str) or not user_answer.strip():
            raise ValueError("user_answer는 비어있을 수 없습니다")

    def _validate_correct_answer(self, correct_answer: str) -> None:
        """correct_answer 검증"""
        if not isinstance(correct_answer, str) or not correct_answer.strip():
            raise ValueError("correct_answer는 비어있을 수 없습니다")

    def _validate_time_spent_seconds(self, time_spent_seconds: int) -> None:
        """time_spent_seconds 검증"""
        if not isinstance(time_spent_seconds, int) or time_spent_seconds <= 0:
            raise ValueError("time_spent_seconds는 양의 정수여야 합니다")

    def _validate_difficulty(self, difficulty: int) -> None:
        """difficulty 검증"""
        if not isinstance(difficulty, int) or difficulty < 1 or difficulty > 5:
            raise ValueError("difficulty는 1-5 사이여야 합니다")

    def _validate_question_type(self, question_type: QuestionType) -> None:
        """question_type 검증"""
        if not isinstance(question_type, QuestionType):
            raise ValueError("question_type은 유효한 QuestionType이어야 합니다")

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, AnswerDetail):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return (
            f"AnswerDetail(id={self.id}, result_id={self.result_id}, "
            f"question_id={self.question_id}, is_correct={self.is_correct}, "
            f"question_type={self.question_type.value})"
        )

