"""
JLPT Test 도메인 엔티티
JLPT 진단 테스트나 모의 시험을 표현하는 도메인 로직
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from backend.domain.entities.question import Question, JLPTLevel
from backend.domain.value_objects.jlpt import TestStatus


class Test:
    """
    JLPT 테스트 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    JLPT 진단 테스트나 모의 시험의 상태와 결과를 관리
    """

    def __init__(
        self,
        id: int,
        title: str,
        level: JLPTLevel,
        questions: List[Question],
        time_limit_minutes: int,
        created_at: Optional[datetime] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None
    ):
        """
        Test 엔티티 초기화

        Args:
            id: 고유 식별자
            title: 테스트 제목
            level: JLPT 레벨
            questions: 테스트에 포함된 문제들
            time_limit_minutes: 시간 제한 (분)
            created_at: 생성 일시
            started_at: 시작 일시
            completed_at: 완료 일시

        Raises:
            ValueError: 유효성 검증 실패 시
        """
        self._validate_title(title)
        self._validate_time_limit(time_limit_minutes)

        self.id = id
        self.title = title
        self.level = level
        self.questions = questions.copy()  # 불변성 보장
        self.time_limit_minutes = time_limit_minutes
        self.created_at = created_at or datetime.now()
        self.started_at = started_at
        self.completed_at = completed_at
        self.status = TestStatus.CREATED
        self.user_answers: Dict[int, str] = {}  # question_id -> answer
        self.score: Optional[float] = None

    def _validate_title(self, title: str) -> None:
        """제목 검증"""
        if not title or not isinstance(title, str):
            raise ValueError("테스트 제목은 필수 항목입니다")

        title_stripped = title.strip()
        if not title_stripped:
            raise ValueError("테스트 제목은 비어있을 수 없습니다")

        if len(title) > 200:
            raise ValueError("테스트 제목은 200자를 초과할 수 없습니다")

    def _validate_time_limit(self, time_limit_minutes: int) -> None:
        """시간 제한 검증"""
        if not isinstance(time_limit_minutes, int) or time_limit_minutes < 1:
            raise ValueError("시간 제한은 1분 이상이어야 합니다")

        if time_limit_minutes > 480:  # 8시간
            raise ValueError("시간 제한은 480분(8시간)을 초과할 수 없습니다")

    def start_test(self) -> None:
        """
        테스트 시작

        Raises:
            ValueError: 이미 시작했거나 완료된 테스트인 경우
        """
        if self.status != TestStatus.CREATED:
            raise ValueError(f"테스트를 시작할 수 없는 상태입니다: {self.status.value}")

        self.status = TestStatus.IN_PROGRESS
        self.started_at = datetime.now()

    def complete_test(self, user_answers: Dict[int, str]) -> None:
        """
        테스트 완료

        Args:
            user_answers: 사용자 답안 (question_id -> answer)

        Raises:
            ValueError: 테스트가 진행 중이 아닌 경우
        """
        if self.status != TestStatus.IN_PROGRESS:
            raise ValueError(f"테스트를 완료할 수 없는 상태입니다: {self.status.value}")

        self.status = TestStatus.COMPLETED
        self.completed_at = datetime.now()
        self.user_answers = user_answers.copy()
        self.score = self.calculate_score()

    def calculate_score(self) -> float:
        """
        점수 계산

        Returns:
            float: 백분율 점수 (0.0 ~ 100.0)

        Raises:
            ValueError: 테스트가 완료되지 않은 경우
        """
        if self.status != TestStatus.COMPLETED:
            raise ValueError("완료된 테스트만 점수를 계산할 수 있습니다")

        if not self.questions:
            return 0.0

        correct_count = 0
        for question in self.questions:
            user_answer = self.user_answers.get(question.id)
            if user_answer and question.is_correct_answer(user_answer):
                correct_count += 1

        return (correct_count / len(self.questions)) * 100.0

    def get_time_remaining(self) -> timedelta:
        """
        남은 시간 계산

        Returns:
            timedelta: 남은 시간

        Raises:
            ValueError: 테스트가 시작되지 않은 경우
        """
        if not self.started_at:
            raise ValueError("시작되지 않은 테스트입니다")

        elapsed = datetime.now() - self.started_at
        total_limit = timedelta(minutes=self.time_limit_minutes)

        if elapsed >= total_limit:
            return timedelta(0)

        return total_limit - elapsed

    def is_time_up(self) -> bool:
        """
        시간 초과 여부 확인

        Returns:
            bool: 시간 초과 여부
        """
        if not self.started_at:
            return False

        elapsed = datetime.now() - self.started_at
        total_limit = timedelta(minutes=self.time_limit_minutes)

        return elapsed >= total_limit

    def get_question_by_id(self, question_id: int) -> Optional[Question]:
        """
        ID로 문제 조회

        Args:
            question_id: 문제 ID

        Returns:
            Optional[Question]: 찾은 문제 또는 None
        """
        for question in self.questions:
            if question.id == question_id:
                return question
        return None

    def get_correct_answers_count(self) -> int:
        """
        정답 개수 반환

        Returns:
            int: 맞은 문제 개수

        Raises:
            ValueError: 테스트가 완료되지 않은 경우
        """
        if self.status != TestStatus.COMPLETED:
            raise ValueError("완료된 테스트만 정답 개수를 확인할 수 있습니다")

        correct_count = 0
        for question in self.questions:
            user_answer = self.user_answers.get(question.id)
            if user_answer and question.is_correct_answer(user_answer):
                correct_count += 1

        return correct_count

    def get_incorrect_answers_count(self) -> int:
        """
        오답 개수 반환

        Returns:
            int: 틀린 문제 개수

        Raises:
            ValueError: 테스트가 완료되지 않은 경우
        """
        if self.status != TestStatus.COMPLETED:
            raise ValueError("완료된 테스트만 오답 개수를 확인할 수 있습니다")

        return len(self.questions) - self.get_correct_answers_count()

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, Test):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return f"Test(id={self.id}, title='{self.title}', level={self.level.value}, status={self.status.value})"
