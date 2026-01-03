"""
도메인 엔티티 테스트
TDD 방식으로 JLPT 학습자(User) 엔티티 구현
"""

import pytest
from datetime import datetime
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class TestUser:
    """JLPT 학습자(User) 엔티티 테스트"""

    def test_user_creation_with_valid_data(self):
        """유효한 데이터로 JLPT 학습자 생성 테스트"""
        # Given
        user_id = 1
        email = "test@example.com"
        username = "testuser"
        target_level = JLPTLevel.N4

        # When
        user = User(id=user_id, email=email, username=username, target_level=target_level)

        # Then
        assert user.id == user_id
        assert user.email == email
        assert user.username == username
        assert user.target_level == target_level
        assert user.current_level is None  # 기본값
        assert user.total_tests_taken == 0
        assert user.study_streak == 0
        assert user.preferred_question_types == []
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_user_creation_with_all_params(self):
        """모든 파라미터로 JLPT 학습자 생성 테스트"""
        # Given
        user_id = 1
        email = "test@example.com"
        username = "testuser"
        target_level = JLPTLevel.N3
        current_level = JLPTLevel.N4
        total_tests_taken = 5
        study_streak = 3
        preferred_types = [QuestionType.VOCABULARY, QuestionType.GRAMMAR]

        # When
        user = User(
            id=user_id,
            email=email,
            username=username,
            target_level=target_level,
            current_level=current_level,
            total_tests_taken=total_tests_taken,
            study_streak=study_streak,
            preferred_question_types=preferred_types
        )

        # Then
        assert user.id == user_id
        assert user.target_level == target_level
        assert user.current_level == current_level
        assert user.total_tests_taken == total_tests_taken
        assert user.study_streak == study_streak
        assert user.preferred_question_types == preferred_types

    def test_user_creation_validation(self):
        """JLPT 학습자 생성 시 유효성 검증 테스트"""

        # 잘못된 이메일
        with pytest.raises(ValueError, match="올바른 이메일 형식이 아닙니다"):
            User(id=1, email="invalid-email", username="testuser")

        # 빈 사용자명
        with pytest.raises(ValueError, match="사용자명은 비어있을 수 없습니다"):
            User(id=1, email="test@example.com", username="")

        # 잘못된 목표 레벨
        with pytest.raises(ValueError, match="목표 레벨은 유효한 JLPTLevel이어야 합니다"):
            User(id=1, email="test@example.com", username="testuser", target_level="invalid")

        # 음수 시험 수
        with pytest.raises(ValueError, match="총 시험 응시 수는 0 이상의 정수여야 합니다"):
            User(id=1, email="test@example.com", username="testuser", total_tests_taken=-1)

        # 음수 연속 학습 일수
        with pytest.raises(ValueError, match="연속 학습 일수는 0 이상의 정수여야 합니다"):
            User(id=1, email="test@example.com", username="testuser", study_streak=-1)

    def test_update_profile(self):
        """학습자 프로필 업데이트 테스트"""
        # Given
        user = User(id=1, email="old@example.com", username="olduser", target_level=JLPTLevel.N5)
        original_updated_at = user.updated_at

        # When
        user.update_profile(
            email="new@example.com",
            username="newuser",
            target_level=JLPTLevel.N3,
            preferred_question_types=[QuestionType.READING]
        )

        # Then
        assert user.email == "new@example.com"
        assert user.username == "newuser"
        assert user.target_level == JLPTLevel.N3
        assert user.preferred_question_types == [QuestionType.READING]
        assert user.updated_at > original_updated_at

    def test_update_learning_progress(self):
        """학습 진행 상황 업데이트 테스트"""
        # Given
        user = User(id=1, email="test@example.com", username="testuser")
        original_updated_at = user.updated_at

        # When
        user.update_learning_progress(JLPTLevel.N4, tests_taken=2)

        # Then
        assert user.current_level == JLPTLevel.N4
        assert user.total_tests_taken == 2
        assert user.updated_at > original_updated_at

    def test_study_streak_operations(self):
        """연속 학습 일수 조작 테스트"""
        # Given
        user = User(id=1, email="test@example.com", username="testuser", study_streak=5)

        # When - 증가
        user.increment_study_streak()

        # Then
        assert user.study_streak == 6

        # When - 초기화
        user.reset_study_streak()

        # Then
        assert user.study_streak == 0

    def test_can_take_test(self):
        """시험 응시 가능 여부 테스트"""
        # Given
        user = User(id=1, email="test@example.com", username="testuser", target_level=JLPTLevel.N3)

        # Then
        assert user.can_take_test(JLPTLevel.N5) is True   # 목표 레벨보다 쉬운 레벨
        assert user.can_take_test(JLPTLevel.N4) is True   # 목표 레벨보다 쉬운 레벨
        assert user.can_take_test(JLPTLevel.N3) is True   # 목표 레벨
        assert user.can_take_test(JLPTLevel.N2) is False  # 목표 레벨보다 어려운 레벨

    def test_get_recommended_level(self):
        """추천 학습 레벨 반환 테스트"""
        # Given
        user_without_current = User(id=1, email="test@example.com", username="testuser", target_level=JLPTLevel.N4)
        user_with_current = User(
            id=2,
            email="test@example.com",
            username="testuser",
            target_level=JLPTLevel.N4,
            current_level=JLPTLevel.N3
        )

        # Then
        assert user_without_current.get_recommended_level() == JLPTLevel.N4  # 목표 레벨
        assert user_with_current.get_recommended_level() == JLPTLevel.N3     # 현재 레벨

    def test_is_level_up_candidate(self):
        """레벨 업 후보 여부 테스트"""
        # Given
        user_new = User(id=1, email="test@example.com", username="testuser")  # 처음 평가
        user_current_n5 = User(id=2, email="test@example.com", username="testuser", current_level=JLPTLevel.N5)

        # Then
        assert user_new.is_level_up_candidate(JLPTLevel.N5) is True      # 처음 평가
        assert user_current_n5.is_level_up_candidate(JLPTLevel.N5) is False  # 같은 레벨
        assert user_current_n5.is_level_up_candidate(JLPTLevel.N4) is True   # N5에서 N4로 레벨 업 (난이도 상승)
        assert user_current_n5.is_level_up_candidate(JLPTLevel.N1) is True   # N5에서 N1로 레벨 업 (난이도 상승)

    def test_user_equality_by_id(self):
        """ID로 학습자 동등성 비교 테스트"""
        # Given
        user1 = User(id=1, email="test@example.com", username="testuser")
        user2 = User(id=1, email="different@example.com", username="different", target_level=JLPTLevel.N3)
        user3 = User(id=2, email="test@example.com", username="testuser")

        # Then
        assert user1 == user2  # 같은 ID
        assert user1 != user3  # 다른 ID

    def test_user_creation_with_none_id(self):
        """ID 없이 User 생성 시 None으로 설정되는지 테스트"""
        # Given & When
        user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)

        # Then
        assert user.id is None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.target_level == JLPTLevel.N5

    def test_user_validation_edge_cases(self):
        """User 검증 edge case 테스트"""
        # Given - 빈 문자열이지만 공백만 있는 경우
        with pytest.raises(ValueError, match="사용자명은 비어있을 수 없습니다"):
            User(id=None, email="test@example.com", username="   ", target_level=JLPTLevel.N5)

        # Given - 이메일 형식이 잘못된 경우
        with pytest.raises(ValueError, match="올바른 이메일 형식이 아닙니다"):
            User(id=None, email="invalid-email", username="testuser", target_level=JLPTLevel.N5)

        # Given - 목표 레벨이 잘못된 경우
        with pytest.raises(ValueError, match="목표 레벨은 유효한 JLPTLevel이어야 합니다"):
            User(id=None, email="test@example.com", username="testuser", target_level="invalid")

    def test_user_learning_progress_operations(self):
        """학습 진행 상황 조작 테스트"""
        # Given
        user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)

        # When - 학습 진행 업데이트
        user.update_learning_progress(JLPTLevel.N4, tests_taken=2)

        # Then
        assert user.current_level == JLPTLevel.N4
        assert user.total_tests_taken == 2

        # When - 연속 학습 증가
        user.increment_study_streak()

        # Then
        assert user.study_streak == 1

        # When - 연속 학습 초기화
        user.reset_study_streak()

        # Then
        assert user.study_streak == 0

    def test_user_level_assessment(self):
        """레벨 평가 관련 메서드 테스트"""
        # Given
        user_n5 = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5, current_level=JLPTLevel.N5)

        # Then - 시험 응시 가능 여부
        assert user_n5.can_take_test(JLPTLevel.N5) is True   # 목표 레벨
        assert user_n5.can_take_test(JLPTLevel.N4) is False  # 더 어려운 레벨
        assert user_n5.can_take_test(JLPTLevel.N3) is False  # 더 어려운 레벨

        # Then - 추천 레벨 (현재 레벨이 있는 경우)
        assert user_n5.get_recommended_level() == JLPTLevel.N5

        # Given - 현재 레벨이 없는 경우
        user_no_current = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N4)

        # Then - 목표 레벨을 추천
        assert user_no_current.get_recommended_level() == JLPTLevel.N4

        # Then - 레벨 업 후보 여부
        assert user_n5.is_level_up_candidate(JLPTLevel.N4) is True   # N5에서 N4로 레벨 업
        assert user_n5.is_level_up_candidate(JLPTLevel.N5) is False  # 같은 레벨
        assert user_n5.is_level_up_candidate(JLPTLevel.N3) is True   # N5에서 N3로 레벨 업

    def test_user_string_representation(self):
        """User 문자열 표현 테스트"""
        # Given
        user = User(
            id=1,
            email="test@example.com",
            username="testuser",
            target_level=JLPTLevel.N5,
            current_level=JLPTLevel.N4,
            total_tests_taken=5,
            study_streak=3
        )

        # When & Then
        expected_repr = "User(id=1, username='testuser', target=N5, current=N4, tests=5)"
        assert repr(user) == expected_repr

    def test_user_validation_edge_cases_detailed(self):
        """User 검증 상세 edge case 테스트"""
        # 이메일이 None인 경우
        with pytest.raises(ValueError, match="이메일은 필수 항목입니다"):
            User(id=1, email=None, username="testuser")

        # 이메일이 빈 문자열인 경우
        with pytest.raises(ValueError, match="이메일은 필수 항목입니다"):
            User(id=1, email="", username="testuser")

        # 사용자명이 None인 경우
        with pytest.raises(ValueError, match="사용자명은 문자열이어야 합니다"):
            User(id=1, email="test@example.com", username=None)

        # 사용자명이 50자 초과
        with pytest.raises(ValueError, match="사용자명은 50자를 초과할 수 없습니다"):
            User(id=1, email="test@example.com", username="a" * 51)

        # ID가 음수인 경우
        with pytest.raises(ValueError, match="ID는 양의 정수여야 합니다"):
            User(id=-1, email="test@example.com", username="testuser")

        # ID가 0인 경우
        with pytest.raises(ValueError, match="ID는 양의 정수여야 합니다"):
            User(id=0, email="test@example.com", username="testuser")

    def test_user_equality_with_none_id(self):
        """ID가 None인 User의 동등성 비교 테스트"""
        # Given
        user1 = User(id=None, email="test@example.com", username="testuser")
        user2 = User(id=None, email="test@example.com", username="testuser")
        user3 = User(id=None, email="different@example.com", username="testuser")

        # Then
        assert user1 == user2  # 같은 이메일
        assert user1 != user3  # 다른 이메일

    def test_user_hash(self):
        """User 해시 테스트"""
        # Given
        user1 = User(id=1, email="test@example.com", username="testuser")
        user2 = User(id=1, email="different@example.com", username="different")
        user3 = User(id=2, email="test@example.com", username="testuser")

        # Then
        assert hash(user1) == hash(user2)  # 같은 ID
        assert hash(user1) != hash(user3)  # 다른 ID

        # ID가 None인 경우
        user4 = User(id=None, email="test@example.com", username="testuser")
        user5 = User(id=None, email="test@example.com", username="testuser")
        # None ID는 해시 가능하지만 동일한 해시를 보장하지 않을 수 있음
        assert isinstance(hash(user4), int)
        assert isinstance(hash(user5), int)

    def test_user_creation_with_is_admin_default(self):
        """User 생성 시 is_admin 기본값이 False인지 테스트"""
        # Given & When
        user = User(id=1, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)

        # Then
        assert user.is_admin is False

    def test_user_creation_with_is_admin_true(self):
        """User 생성 시 is_admin을 True로 설정하는 테스트"""
        # Given & When
        user = User(id=1, email="admin@example.com", username="admin", target_level=JLPTLevel.N5, is_admin=True)

        # Then
        assert user.is_admin is True

    def test_user_creation_with_is_admin_false(self):
        """User 생성 시 is_admin을 False로 명시적으로 설정하는 테스트"""
        # Given & When
        user = User(id=1, email="user@example.com", username="user", target_level=JLPTLevel.N5, is_admin=False)

        # Then
        assert user.is_admin is False

