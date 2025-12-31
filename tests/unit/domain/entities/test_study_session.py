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
            id=1,
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
        assert study_session.id == 1
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
            id=2,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=15,
            total_questions=10,
            correct_count=8,
            time_spent_minutes=20
        )

        # Then
        assert study_session.id == 2
        assert study_session.level is None
        assert study_session.question_types is None

    def test_create_study_session_with_question_ids(self):
        """question_ids가 있는 StudySession 생성 테스트"""
        # Given & When
        study_session = StudySession(
            id=3,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25,
            level=JLPTLevel.N5,
            question_types=[QuestionType.VOCABULARY],
            question_ids=[1, 2, 3, 4, 5]
        )

        # Then
        assert study_session.question_ids == [1, 2, 3, 4, 5]

    def test_validate_id_negative(self):
        """음수 ID 검증 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="id는 양의 정수여야 합니다"):
            StudySession(
                id=-1,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_user_id_negative(self):
        """음수 user_id 검증 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="user_id는 양의 정수여야 합니다"):
            StudySession(
                id=1,
                user_id=-1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_study_hour_out_of_range(self):
        """study_hour 범위 초과 검증 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="study_hour는 0-23 사이여야 합니다"):
            StudySession(
                id=1,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=24,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=25
            )

    def test_validate_total_questions_zero(self):
        """total_questions가 0인 경우 검증 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="total_questions는 양의 정수여야 합니다"):
            StudySession(
                id=1,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=0,
                correct_count=0,
                time_spent_minutes=25
            )

    def test_validate_correct_count_exceeds_total(self):
        """correct_count가 total_questions를 초과하는 경우 검증 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="correct_count는 total_questions를 초과할 수 없습니다"):
            StudySession(
                id=1,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=21,
                time_spent_minutes=25
            )

    def test_validate_time_spent_minutes_zero(self):
        """time_spent_minutes가 0인 경우 검증 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError, match="time_spent_minutes는 양의 정수여야 합니다"):
            StudySession(
                id=1,
                user_id=1,
                study_date=date(2025, 1, 4),
                study_hour=10,
                total_questions=20,
                correct_count=17,
                time_spent_minutes=0
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
        """문제가 0개인 경우 정확도 계산 테스트"""
        # Given
        study_session = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=1,
            correct_count=0,
            time_spent_minutes=25
        )
        study_session.total_questions = 0  # 테스트를 위해 직접 설정

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
            user_id=2,
            study_date=date(2025, 1, 5),
            study_hour=15,
            total_questions=10,
            correct_count=8,
            time_spent_minutes=20
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

        # When & Then
        assert session1 == session2  # 같은 ID
        assert session1 != session3  # 다른 ID

    def test_hash(self):
        """해시 테스트"""
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
            user_id=2,
            study_date=date(2025, 1, 5),
            study_hour=15,
            total_questions=10,
            correct_count=8,
            time_spent_minutes=20
        )

        # When & Then
        assert hash(session1) == hash(session2)  # 같은 ID는 같은 해시

    def test_repr(self):
        """문자열 표현 테스트"""
        # Given
        study_session = StudySession(
            id=1,
            user_id=1,
            study_date=date(2025, 1, 4),
            study_hour=10,
            total_questions=20,
            correct_count=17,
            time_spent_minutes=25,
            level=JLPTLevel.N5,
            question_types=[QuestionType.VOCABULARY]
        )

        # When
        repr_str = repr(study_session)

        # Then
        assert "StudySession" in repr_str
        assert "id=1" in repr_str
        assert "user_id=1" in repr_str
        assert "accuracy=85.0%" in repr_str
