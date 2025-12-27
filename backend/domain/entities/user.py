"""
User 도메인 엔티티
JLPT 자격 검증 프로그램의 학습자 도메인을 표현
"""

from datetime import datetime
import re
from typing import Optional, List
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class User:
    """
    JLPT 학습자 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    JLPT 학습자의 프로필과 학습 상태를 관리
    """

    def __init__(
        self,
        id: Optional[int],
        email: str,
        username: str,
        target_level: JLPTLevel = JLPTLevel.N5,
        current_level: Optional[JLPTLevel] = None,
        total_tests_taken: int = 0,
        study_streak: int = 0,
        preferred_question_types: Optional[List[QuestionType]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        """
        User 엔티티 초기화

        Args:
            id: 고유 식별자
            email: 이메일 주소
            username: 사용자명
            target_level: 목표 JLPT 레벨 (기본값: N5)
            current_level: 현재 추정 레벨 (None: 아직 평가되지 않음)
            total_tests_taken: 응시한 총 시험 수
            study_streak: 연속 학습 일수
            preferred_question_types: 선호하는 문제 유형들
            created_at: 생성 일시 (미제공 시 현재 시간)
            updated_at: 수정 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_email(email)
        self._validate_username(username)
        self._validate_target_level(target_level)
        self._validate_total_tests_taken(total_tests_taken)
        self._validate_study_streak(study_streak)

        self.id = id
        self._validate_id(id)
        self.email = email
        self.username = username
        self.target_level = target_level
        self.current_level = current_level
        self.total_tests_taken = total_tests_taken
        self.study_streak = study_streak
        self.preferred_question_types = preferred_question_types or []
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def _validate_email(self, email: str) -> None:
        """이메일 형식 검증"""
        if not email or not isinstance(email, str):
            raise ValueError("이메일은 필수 항목입니다")

        # 간단한 이메일 형식 검증
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("올바른 이메일 형식이 아닙니다")

    def _validate_username(self, username: str) -> None:
        """사용자명 검증"""
        if not isinstance(username, str):
            raise ValueError("사용자명은 문자열이어야 합니다")

        username_stripped = username.strip()
        if not username_stripped:
            raise ValueError("사용자명은 비어있을 수 없습니다")

        if len(username) > 50:
            raise ValueError("사용자명은 50자를 초과할 수 없습니다")

    def _validate_target_level(self, target_level: JLPTLevel) -> None:
        """목표 레벨 검증"""
        if not isinstance(target_level, JLPTLevel):
            raise ValueError("목표 레벨은 유효한 JLPTLevel이어야 합니다")

    def _validate_total_tests_taken(self, total_tests_taken: int) -> None:
        """총 시험 응시 수 검증"""
        if not isinstance(total_tests_taken, int) or total_tests_taken < 0:
            raise ValueError("총 시험 응시 수는 0 이상의 정수여야 합니다")

    def _validate_study_streak(self, study_streak: int) -> None:
        """연속 학습 일수 검증"""
        if not isinstance(study_streak, int) or study_streak < 0:
            raise ValueError("연속 학습 일수는 0 이상의 정수여야 합니다")

    def _validate_id(self, id: Optional[int]) -> None:
        """ID 검증"""
        if id is not None and (not isinstance(id, int) or id <= 0):
            raise ValueError("ID는 양의 정수여야 합니다")

    def update_profile(
        self,
        email: Optional[str] = None,
        username: Optional[str] = None,
        target_level: Optional[JLPTLevel] = None,
        preferred_question_types: Optional[List[QuestionType]] = None
    ) -> None:
        """
        학습자 프로필 업데이트

        Args:
            email: 새로운 이메일 (선택)
            username: 새로운 사용자명 (선택)
            target_level: 새로운 목표 레벨 (선택)
            preferred_question_types: 새로운 선호 문제 유형들 (선택)
        """
        if email is not None:
            self._validate_email(email)
            self.email = email

        if username is not None:
            self._validate_username(username)
            self.username = username

        if target_level is not None:
            self._validate_target_level(target_level)
            self.target_level = target_level

        if preferred_question_types is not None:
            self.preferred_question_types = preferred_question_types.copy()

        self.updated_at = datetime.now()

    def update_learning_progress(self, current_level: JLPTLevel, tests_taken: int = 1) -> None:
        """
        학습 진행 상황 업데이트

        Args:
            current_level: 새로 평가된 현재 레벨
            tests_taken: 추가로 응시한 시험 수 (기본값: 1)
        """
        self._validate_target_level(current_level)
        self.current_level = current_level
        self.total_tests_taken += tests_taken
        self.updated_at = datetime.now()

    def increment_study_streak(self) -> None:
        """연속 학습 일수 증가"""
        self.study_streak += 1
        self.updated_at = datetime.now()

    def reset_study_streak(self) -> None:
        """연속 학습 일수 초기화"""
        self.study_streak = 0
        self.updated_at = datetime.now()

    def can_take_test(self, test_level: JLPTLevel) -> bool:
        """
        특정 레벨의 시험을 응시할 수 있는지 확인

        Args:
            test_level: 시험 레벨

        Returns:
            bool: 응시 가능 여부
        """
        # 목표 레벨보다 어려운(높은) 레벨의 시험은 응시할 수 없음
        if test_level > self.target_level:
            return False
        return True

    def get_recommended_level(self) -> JLPTLevel:
        """
        추천 학습 레벨 반환

        Returns:
            JLPTLevel: 추천 레벨 (현재 레벨이 있으면 그 레벨, 없으면 목표 레벨)
        """
        return self.current_level or self.target_level

    def is_level_up_candidate(self, new_assessment_level: JLPTLevel) -> bool:
        """
        레벨 업 후보인지 확인

        Args:
            new_assessment_level: 새로운 평가 레벨

        Returns:
            bool: 레벨 업 가능 여부
        """
        if not self.current_level:
            return True  # 처음 평가받는 경우
        return new_assessment_level > self.current_level

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, User):
            return False
        # 둘 다 None이거나 같은 값인 경우
        if self.id is None and other.id is None:
            return self.email == other.email  # 이메일로 비교
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        current_level_str = self.current_level.value if self.current_level else "None"
        return f"User(id={self.id}, username='{self.username}', target={self.target_level.value}, current={current_level_str}, tests={self.total_tests_taken})"
