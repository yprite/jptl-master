"""
Anki 스타일 간격 반복 학습(SRS) 도메인 서비스
단어 학습에 간격 반복 알고리즘을 적용하여 효율적인 암기 지원
"""

from datetime import date, timedelta
from typing import Literal, Optional
from backend.domain.entities.user_vocabulary import UserVocabulary


class SpacedRepetitionService:
    """
    Anki 스타일 간격 반복 학습(SRS) 도메인 서비스
    
    Anki의 SM-2 알고리즘을 기반으로 한 간격 반복 학습 알고리즘을 구현합니다.
    복습 난이도(쉬움/보통/어려움)에 따라 다음 복습 일정을 계산합니다.
    """

    # 초기 간격 설정 (일수)
    INITIAL_INTERVAL = 1  # 첫 복습: 1일 후
    MIN_INTERVAL = 1  # 최소 간격: 1일
    MAX_INTERVAL = 365  # 최대 간격: 365일

    # 난이도별 간격 조정 계수
    EASY_MULTIPLIER = 1.3  # 쉬움: 30% 증가
    NORMAL_MULTIPLIER = 1.0  # 보통: 그대로
    HARD_MULTIPLIER = 0.7  # 어려움: 30% 감소

    # Ease Factor 조정
    EASE_FACTOR_INCREASE = 0.15  # 정답 시 증가량
    EASE_FACTOR_DECREASE = 0.20  # 오답 시 감소량
    MIN_EASE_FACTOR = 1.3  # 최소 Ease Factor
    MAX_EASE_FACTOR = 2.5  # 최대 Ease Factor

    def calculate_next_review(
        self,
        user_vocab: UserVocabulary,
        difficulty: Literal["easy", "normal", "hard"],
        today: Optional[date] = None
    ) -> UserVocabulary:
        """
        복습 결과에 따라 다음 복습 일정 계산 및 업데이트
        
        Args:
            user_vocab: 사용자 단어 학습 상태
            difficulty: 복습 난이도 ("easy", "normal", "hard")
            today: 오늘 날짜 (기본값: None이면 현재 날짜)
        
        Returns:
            업데이트된 UserVocabulary 엔티티
        """
        if today is None:
            today = date.today()

        # 복습 횟수 증가
        user_vocab.review_count += 1
        user_vocab.last_review_date = today

        # 난이도에 따른 처리
        if difficulty == "easy":
            user_vocab.consecutive_correct += 1
            user_vocab.consecutive_incorrect = 0
            # Ease Factor 증가
            user_vocab.ease_factor = min(
                user_vocab.ease_factor + self.EASE_FACTOR_INCREASE,
                self.MAX_EASE_FACTOR
            )
            # 간격 계산 (쉬움: 더 긴 간격)
            multiplier = self.EASY_MULTIPLIER
            
        elif difficulty == "normal":
            user_vocab.consecutive_correct += 1
            user_vocab.consecutive_incorrect = 0
            # Ease Factor는 유지 또는 약간 증가
            multiplier = self.NORMAL_MULTIPLIER
            
        else:  # hard
            user_vocab.consecutive_incorrect += 1
            user_vocab.consecutive_correct = 0
            # Ease Factor 감소
            user_vocab.ease_factor = max(
                user_vocab.ease_factor - self.EASE_FACTOR_DECREASE,
                self.MIN_EASE_FACTOR
            )
            # 간격 계산 (어려움: 더 짧은 간격)
            multiplier = self.HARD_MULTIPLIER

        # 다음 간격 계산
        if user_vocab.interval_days == 0:
            # 첫 복습
            new_interval = self.INITIAL_INTERVAL
        else:
            # 기존 간격에 난이도 조정 및 Ease Factor 적용
            new_interval = int(user_vocab.interval_days * user_vocab.ease_factor * multiplier)
            new_interval = max(self.MIN_INTERVAL, min(new_interval, self.MAX_INTERVAL))

        user_vocab.interval_days = new_interval
        user_vocab.next_review_date = today + timedelta(days=new_interval)

        # 암기 상태 업데이트
        if user_vocab.consecutive_correct >= 3:
            from backend.domain.value_objects.jlpt import MemorizationStatus
            user_vocab.memorization_status = MemorizationStatus.MEMORIZED
        elif user_vocab.consecutive_correct >= 1:
            from backend.domain.value_objects.jlpt import MemorizationStatus
            user_vocab.memorization_status = MemorizationStatus.LEARNING
        elif user_vocab.consecutive_incorrect >= 2:
            from backend.domain.value_objects.jlpt import MemorizationStatus
            user_vocab.memorization_status = MemorizationStatus.NOT_MEMORIZED

        return user_vocab

    def initialize_review_schedule(
        self,
        user_vocab: UserVocabulary,
        today: Optional[date] = None
    ) -> UserVocabulary:
        """
        새로운 단어의 복습 스케줄 초기화
        
        Args:
            user_vocab: 사용자 단어 학습 상태
            today: 오늘 날짜 (기본값: None이면 현재 날짜)
        
        Returns:
            초기화된 UserVocabulary 엔티티
        """
        if today is None:
            today = date.today()

        # 초기값 설정
        user_vocab.interval_days = 0
        user_vocab.ease_factor = 2.5
        user_vocab.next_review_date = today  # 즉시 복습 가능
        user_vocab.review_count = 0
        user_vocab.last_review_date = None
        user_vocab.consecutive_correct = 0
        user_vocab.consecutive_incorrect = 0

        return user_vocab

