"""
JLPT Result 도메인 엔티티
JLPT 테스트 결과를 분석하고 평가하는 도메인 로직
"""

from datetime import datetime
from typing import Optional, Dict
from backend.domain.value_objects.jlpt import JLPTLevel


class Result:
    """
    JLPT 테스트 결과 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    테스트 결과를 분석하여 레벨 평가와 학습 추천을 제공
    """

    def __init__(
        self,
        id: int,
        test_id: int,
        user_id: int,
        score: float,
        assessed_level: JLPTLevel,
        recommended_level: JLPTLevel,
        correct_answers_count: int,
        total_questions_count: int,
        time_taken_minutes: int,
        created_at: Optional[datetime] = None,
        question_type_analysis: Optional[Dict[str, Dict[str, int]]] = None
    ):
        """
        Result 엔티티 초기화

        Args:
            id: 고유 식별자
            test_id: 테스트 ID
            user_id: 사용자 ID
            score: 점수 (0.0 ~ 100.0)
            assessed_level: 평가된 현재 레벨
            recommended_level: 추천 학습 레벨
            correct_answers_count: 정답 개수
            total_questions_count: 총 문제 개수
            time_taken_minutes: 소요 시간 (분)
            created_at: 생성 일시
            question_type_analysis: 문제 유형별 분석 결과

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_score(score)
        self._validate_answer_counts(correct_answers_count, total_questions_count)
        self._validate_time_taken(time_taken_minutes)

        self.id = id
        self.test_id = test_id
        self.user_id = user_id
        self.score = score
        self.assessed_level = assessed_level
        self.recommended_level = recommended_level
        self.correct_answers_count = correct_answers_count
        self.total_questions_count = total_questions_count
        self.time_taken_minutes = time_taken_minutes
        self.created_at = created_at or datetime.now()
        self.question_type_analysis = question_type_analysis or {}

    def _validate_score(self, score: float) -> None:
        """점수 검증"""
        if not isinstance(score, (int, float)) or score < 0.0 or score > 100.0:
            raise ValueError("점수는 0.0에서 100.0 사이여야 합니다")

    def _validate_answer_counts(self, correct_answers_count: int, total_questions_count: int) -> None:
        """답안 개수 검증"""
        if not isinstance(correct_answers_count, int) or correct_answers_count < 0:
            raise ValueError("정답 개수는 0 이상의 정수여야 합니다")

        if not isinstance(total_questions_count, int) or total_questions_count <= 0:
            raise ValueError("총 문제 개수는 1 이상의 정수여야 합니다")

        if correct_answers_count > total_questions_count:
            raise ValueError("정답 개수는 총 문제 수를 초과할 수 없습니다")

    def _validate_time_taken(self, time_taken_minutes: int) -> None:
        """소요 시간 검증"""
        if not isinstance(time_taken_minutes, int) or time_taken_minutes < 1:
            raise ValueError("소요 시간은 1분 이상이어야 합니다")

    def get_accuracy_percentage(self) -> float:
        """
        정확도 백분율 반환

        Returns:
            float: 정확도 백분율
        """
        if self.total_questions_count == 0:
            return 0.0
        return self.score

    def get_performance_level(self) -> str:
        """
        성취도 레벨 반환

        Returns:
            str: 성취도 레벨 ("excellent", "good", "needs_improvement")
        """
        if self.score >= 85:
            return "excellent"
        elif self.score >= 70:
            return "good"
        else:
            return "needs_improvement"

    def is_passed(self) -> bool:
        """
        합격 여부 판정

        Returns:
            bool: 합격 여부 (70% 이상이면 합격)
        """
        return self.score >= 70.0

    def get_time_efficiency(self) -> str:
        """
        시간 효율성 평가

        Returns:
            str: 시간 효율성 ("efficient", "could_improve")
        """
        # 평균적으로 1분에 2-3문제를 풀 수 있다고 가정
        expected_time = max(self.total_questions_count * 0.5, 5)  # 최소 5분

        if self.time_taken_minutes <= expected_time:
            return "efficient"
        else:
            return "could_improve"

    def get_level_progression(self) -> str:
        """
        레벨 진전 상태 반환

        Returns:
            str: 레벨 진전 상태 ("level_up", "maintain", "level_down")
        """
        if self.recommended_level > self.assessed_level:
            return "level_up"
        elif self.recommended_level < self.assessed_level:
            return "level_down"
        else:
            return "maintain"

    def get_detailed_feedback(self) -> Dict[str, str]:
        """
        상세 피드백 생성

        Returns:
            Dict[str, str]: 상세 피드백
        """
        feedback = {
            "overall_performance": self._get_overall_performance_feedback(),
            "time_management": self._get_time_management_feedback(),
            "level_recommendation": self._get_level_recommendation_feedback(),
            "study_suggestions": self._get_study_suggestions()
        }
        return feedback

    def _get_overall_performance_feedback(self) -> str:
        """전체 성취도 피드백"""
        performance = self.get_performance_level()
        if performance == "excellent":
            return "Outstanding performance! You have excellent command of JLPT content."
        elif performance == "good":
            return "Good performance! You have solid foundation with some areas to improve."
        else:
            return "Performance needs improvement. Focus on building fundamental skills."

    def _get_time_management_feedback(self) -> str:
        """시간 관리 피드백"""
        efficiency = self.get_time_efficiency()
        if efficiency == "efficient":
            return "Excellent time management. You completed the test efficiently."
        else:
            return "Consider improving time management to complete tests more efficiently."

    def _get_level_recommendation_feedback(self) -> str:
        """레벨 추천 피드백"""
        progression = self.get_level_progression()
        if progression == "level_up":
            return f"Great progress! Consider advancing to JLPT {self.recommended_level.value}."
        elif progression == "level_down":
            return f"Focus on strengthening JLPT {self.assessed_level.value} skills before advancing."
        else:
            return f"Continue practicing at JLPT {self.recommended_level.value} level."

    def _get_study_suggestions(self) -> str:
        """학습 제안"""
        if self.score < 70:
            return "Review basic grammar and vocabulary. Practice regularly with JLPT materials."
        elif self.score < 85:
            return "Focus on weak areas and practice more complex sentence structures."
        else:
            return "Maintain your excellent performance. Challenge yourself with higher level content."

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, Result):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return f"Result(id={self.id}, test_id={self.test_id}, user_id={self.user_id}, score={self.score}, assessed_level={self.assessed_level.value}, recommended={self.recommended_level.value})"
