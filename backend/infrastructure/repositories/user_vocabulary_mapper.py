"""
UserVocabulary 엔티티와 데이터베이스 행 간 매핑
"""

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
        return UserVocabulary(
            id=row[0],  # id
            user_id=row[1],  # user_id
            vocabulary_id=row[2],  # vocabulary_id
            memorization_status=MemorizationStatus(row[3])  # memorization_status
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
            'memorization_status': user_vocabulary.memorization_status.value
        }
        if user_vocabulary.id:
            data['id'] = user_vocabulary.id
        return data

