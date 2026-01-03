"""
LearningHistory 도메인 엔티티
학습 이력을 표현하는 도메인 로직
"""

from datetime import datetime, date
from typing import Optional


class LearningHistory:
    """
    학습 이력 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    사용자의 학습 패턴을 날짜별, 시간대별로 추적하여 학습 습관 분석
    """

    def __init__(
        self,
        id: Optional[int],
        user_id: int,
        test_id: int,
        result_id: int,
        study_date: date,
        study_hour: int,
        total_questions: int,
        correct_count: int,
        time_spent_minutes: int,
        created_at: Optional[datetime] = None
    ):
        """
        LearningHistory 엔티티 초기화

        Args:
            id: 고유 식별자
            user_id: 사용자 ID
            test_id: 테스트 ID
            result_id: 결과 ID
            study_date: 학습 날짜
            study_hour: 학습 시간대 (0-23)
            total_questions: 총 문제 수
            correct_count: 정답 개수
            time_spent_minutes: 소요 시간 (분)
            created_at: 생성 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_id(id)
        self._validate_user_id(user_id)
        self._validate_test_id(test_id)
        self._validate_result_id(result_id)
        self._validate_study_hour(study_hour)
        self._validate_total_questions(total_questions)
        self._validate_correct_count(correct_count, total_questions)
        self._validate_time_spent_minutes(time_spent_minutes)

        self.id = id
        self.user_id = user_id
        self.test_id = test_id
        self.result_id = result_id
        self.study_date = study_date
        self.study_hour = study_hour
        self.total_questions = total_questions
        self.correct_count = correct_count
        self.time_spent_minutes = time_spent_minutes
        self.created_at = created_at or datetime.now()

    def _validate_id(self, id: Optional[int]) -> None:
        """ID 검증"""
        if id is not None and (not isinstance(id, int) or id <= 0):
            raise ValueError("id는 양의 정수여야 합니다")

    def _validate_user_id(self, user_id: int) -> None:
        """user_id 검증"""
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("user_id는 양의 정수여야 합니다")

    def _validate_test_id(self, test_id: int) -> None:
        """test_id 검증"""
        if not isinstance(test_id, int) or test_id <= 0:
            raise ValueError("test_id는 양의 정수여야 합니다")

    def _validate_result_id(self, result_id: int) -> None:
        """result_id 검증"""
        if not isinstance(result_id, int) or result_id <= 0:
            raise ValueError("result_id는 양의 정수여야 합니다")

    def _validate_study_hour(self, study_hour: int) -> None:
        """study_hour 검증"""
        if not isinstance(study_hour, int) or study_hour < 0 or study_hour > 23:
            raise ValueError("study_hour는 0-23 사이여야 합니다")

    def _validate_total_questions(self, total_questions: int) -> None:
        """total_questions 검증"""
        if not isinstance(total_questions, int) or total_questions <= 0:
            raise ValueError("total_questions는 양의 정수여야 합니다")

    def _validate_correct_count(self, correct_count: int, total_questions: int) -> None:
        """correct_count 검증"""
        if not isinstance(correct_count, int) or correct_count < 0:
            raise ValueError("correct_count는 0 이상의 정수여야 합니다")

        if correct_count > total_questions:
            raise ValueError("correct_count는 total_questions를 초과할 수 없습니다")

    def _validate_time_spent_minutes(self, time_spent_minutes: int) -> None:
        """time_spent_minutes 검증"""
        if not isinstance(time_spent_minutes, int) or time_spent_minutes <= 0:
            raise ValueError("time_spent_minutes는 양의 정수여야 합니다")

    def get_accuracy_percentage(self) -> float:
        """
        정확도 백분율 반환

        Returns:
            float: 정확도 백분율 (0.0 ~ 100.0)
        """
        if self.total_questions == 0:
            return 0.0
        return (self.correct_count / self.total_questions) * 100.0

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, LearningHistory):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return (
            f"LearningHistory(id={self.id}, user_id={self.user_id}, "
            f"test_id={self.test_id}, study_date={self.study_date}, "
            f"study_hour={self.study_hour}, accuracy={self.get_accuracy_percentage():.1f}%)"
        )

