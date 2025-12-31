"""
StudySession 도메인 엔티티 테스트
TDD 방식으로 StudySession 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime, date
from backend.domain.entities.study_session import StudySession
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class TestStudySession:
    """StudySession 엔티티 단위 테스트"""

    def test_create_valid_study_session(self):
        """유효한 StudySession 생성 테스트"""
        # Given & When
        study_session = StudySession(
            id=None,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25,
            level=JLPTLevel.N5,
            question_types=[QuestionType.VOCABULARY, QuestionType.GRAMMAR]
        )

        # Then
        assert study_session.id is None
        assert study_session.user_id == 1
        assert study_session.study_date == date(2025, 1, 4)
        assert study_session.study_hour == 10
        assert study_session.total_questions == 20
        assert study_session.correct_count == 17
        assert study_session.time_spent_minutes == 25
        assert study_session.level == JLPTLevel.N5
        assert study_session.question_types == [QuestionType.VOCABULARY, QuestionType.GRAMMAR]
        assert isinstance(study_session.created_at, datetime)

    def test_create_study_session_with_optional_fields(self):
        """선택적 필드가 없는 StudySession 생성 테스트"""
        # Given & When
        study_session = StudySession(
            id=None,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # Then
        assert study_session.level is None
        assert study_session.question_types is None

    def test_create_study_session_with_optional_created_at(self):
        """created_at을 지정한 StudySession 생성 테스트"""
        # Given
        created_at = datetime(2025, 1, 4, 10, 0, 0)

        # When
        study_session = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25,
            created_at=created_at
        )

        # Then
        assert study_session.created_at == created_at

    def test_create_study_session_invalid_user_id(self):
        """잘못된 user_id로 StudySession 생성 시도 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="user_id는 양의 정수여야 합니다"):
            StudySession(
                id=None,
                user_id=0,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_create_study_session_invalid_study_hour(self):
        """잘못된 study_hour로 StudySession 생성 시도 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="study_hour는 0-23 사이여야 합니다"):
            StudySession(
                id=None,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=24,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_create_study_session_invalid_total_questions(self):
        """잘못된 total_questions로 StudySession 생성 시도 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="total_questions는 양의 정수여야 합니다"):
            StudySession(
                id=None,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=0,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_create_study_session_invalid_correct_count(self):
        """잘못된 correct_count로 StudySession 생성 시도 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="correct_count는 total_questions를 초과할 수 없습니다"):
            StudySession(
                id=None,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=21,
                time_spent_minutes=25
            )

    def test_get_accuracy_percentage(self):
        """정확도 백분율 계산 테스트"""
        # Given
        study_session = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # When
        accuracy = study_session.get_accuracy_percentage()

        # Then
        assert accuracy == 85.0

    def test_get_accuracy_percentage_zero_questions(self):
        """문제가 0개일 때 정확도 계산 테스트"""
        # Given - total_questions가 0일 때는 validation에서 막히므로, 
        # 대신 total_questions가 1이고 correct_count가 0인 경우로 테스트
        study_session = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=1,
            correct_count=0,
            time_spent_minutes=25
        )

        # When
        accuracy = study_session.get_accuracy_percentage()

        # Then
        assert accuracy == 0.0

    def test_equality(self):
        """동등성 비교 테스트"""
        # Given
        session1 = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )
        session2 = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )
        session3 = StudySession(
            id=2,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25
        )

        # Then
        assert session1 == session2
        assert session1 != session3

