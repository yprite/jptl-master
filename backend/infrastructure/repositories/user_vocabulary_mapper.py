"""
UserVocabulary 엔티티와 데이터베이스 행 간 매핑
"""

from datetime import date
from typing import Optional
from backend.domain.entities.user_vocabulary import UserVocabulary
from backend.domain.value_objects.jlpt import MemorizationStatus


class UserVocabularyMapper:
    """UserVocabulary 엔티티와 데이터베이스 행 간 매핑"""

    @staticmethod
    def to_entity(row) -> UserVocabulary:
        """
        데이터베이스 행을 UserVocabulary 엔티티로 변환

        Args:
            row: 데이터베이스 행 (튜플 또는 Row 객체)

        Returns:
            UserVocabulary 엔티티
        """
        from datetime import datetime
        
        # SRS 필드 파싱 (기존 스키마와 호환성 유지)
        next_review_date = None
        interval_days = 0
        ease_factor = 2.5
        review_count = 0
        last_review_date = None
        consecutive_correct = 0
        consecutive_incorrect = 0
        
        # row 길이에 따라 필드 존재 여부 확인
        if len(row) > 4:
            # SRS 필드가 있는 경우
            next_review_date_str = row[4] if row[4] else None
            if next_review_date_str:
                if isinstance(next_review_date_str, str):
                    next_review_date = datetime.strptime(next_review_date_str, '%Y-%m-%d').date()
                elif isinstance(next_review_date_str, date):
                    next_review_date = next_review_date_str
            
            interval_days = row[5] if len(row) > 5 and row[5] is not None else 0
            ease_factor = row[6] if len(row) > 6 and row[6] is not None else 2.5
            review_count = row[7] if len(row) > 7 and row[7] is not None else 0
            
            last_review_date_str = row[8] if len(row) > 8 and row[8] else None
            if last_review_date_str:
                if isinstance(last_review_date_str, str):
                    last_review_date = datetime.strptime(last_review_date_str, '%Y-%m-%d').date()
                elif isinstance(last_review_date_str, date):
                    last_review_date = last_review_date_str
            
            consecutive_correct = row[9] if len(row) > 9 and row[9] is not None else 0
            consecutive_incorrect = row[10] if len(row) > 10 and row[10] is not None else 0
        
        return UserVocabulary(
            id=row[0],  # id
            user_id=row[1],  # user_id
            vocabulary_id=row[2],  # vocabulary_id
            memorization_status=MemorizationStatus(row[3]),  # memorization_status
            next_review_date=next_review_date,
            interval_days=interval_days,
            ease_factor=ease_factor,
            review_count=review_count,
            last_review_date=last_review_date,
            consecutive_correct=consecutive_correct,
            consecutive_incorrect=consecutive_incorrect
        )

    @staticmethod
    def to_dict(user_vocabulary: UserVocabulary) -> dict:
        """
        UserVocabulary 엔티티를 딕셔너리로 변환

        Args:
            user_vocabulary: UserVocabulary 엔티티

        Returns:
            딕셔너리
        """
        data = {
            'user_id': user_vocabulary.user_id,
            'vocabulary_id': user_vocabulary.vocabulary_id,
            'memorization_status': user_vocabulary.memorization_status.value,
            'next_review_date': user_vocabulary.next_review_date.isoformat() if user_vocabulary.next_review_date else None,
            'interval_days': user_vocabulary.interval_days,
            'ease_factor': user_vocabulary.ease_factor,
            'review_count': user_vocabulary.review_count,
            'last_review_date': user_vocabulary.last_review_date.isoformat() if user_vocabulary.last_review_date else None,
            'consecutive_correct': user_vocabulary.consecutive_correct,
            'consecutive_incorrect': user_vocabulary.consecutive_incorrect
        }
        if user_vocabulary.id:
            data['id'] = user_vocabulary.id
        return data

