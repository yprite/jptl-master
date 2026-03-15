"""
DailyGoal Repository 테스트
"""

import pytest
import os
import tempfile
from datetime import datetime
from backend.domain.entities.daily_goal import DailyGoal
from backend.infrastructure.repositories.daily_goal_repository import SqliteDailyGoalRepository
from backend.infrastructure.config.database import Database


class TestDailyGoalRepository:
    """DailyGoal Repository 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def repository(self, temp_db):
        """Repository 인스턴스 생성"""
        db = Database(db_path=temp_db)
        return SqliteDailyGoalRepository(db=db)

    @pytest.fixture
    def sample_goal(self):
        """샘플 DailyGoal 생성"""
        return DailyGoal(
            id=None,
            user_id=1,
            target_questions=10,
            target_minutes=30
        )

    def test_save_new_daily_goal(self, repository, sample_goal):
        """새 DailyGoal 저장 테스트"""
        # When
        saved_goal = repository.save(sample_goal)

        # Then
        assert saved_goal.id is not None
        assert saved_goal.user_id == 1
        assert saved_goal.target_questions == 10
        assert saved_goal.target_minutes == 30

    def test_save_update_existing_goal(self, repository, sample_goal):
        """기존 DailyGoal 업데이트 테스트"""
        # Given
        saved_goal = repository.save(sample_goal)
        saved_goal.update_goals(target_questions=20, target_minutes=60)

        # When
        updated_goal = repository.save(saved_goal)

        # Then
        assert updated_goal.id == saved_goal.id
        assert updated_goal.target_questions == 20
        assert updated_goal.target_minutes == 60

    def test_find_by_id(self, repository, sample_goal):
        """ID로 DailyGoal 조회 테스트"""
        # Given
        saved_goal = repository.save(sample_goal)

        # When
        found_goal = repository.find_by_id(saved_goal.id)

        # Then
        assert found_goal is not None
        assert found_goal.id == saved_goal.id
        assert found_goal.user_id == saved_goal.user_id
        assert found_goal.target_questions == saved_goal.target_questions
        assert found_goal.target_minutes == saved_goal.target_minutes

    def test_find_by_id_not_found(self, repository):
        """존재하지 않는 ID로 조회 테스트"""
        # When
        found_goal = repository.find_by_id(99999)

        # Then
        assert found_goal is None

    def test_find_by_user_id(self, repository, sample_goal):
        """user_id로 DailyGoal 조회 테스트"""
        # Given
        saved_goal = repository.save(sample_goal)

        # When
        found_goal = repository.find_by_user_id(saved_goal.user_id)

        # Then
        assert found_goal is not None
        assert found_goal.id == saved_goal.id
        assert found_goal.user_id == saved_goal.user_id

    def test_find_by_user_id_not_found(self, repository):
        """존재하지 않는 user_id로 조회 테스트"""
        # When
        found_goal = repository.find_by_user_id(99999)

        # Then
        assert found_goal is None

    def test_exists_by_user_id(self, repository, sample_goal):
        """user_id 존재 여부 확인 테스트"""
        # Given
        saved_goal = repository.save(sample_goal)

        # When
        exists = repository.exists_by_user_id(saved_goal.user_id)
        not_exists = repository.exists_by_user_id(99999)

        # Then
        assert exists is True
        assert not_exists is False

    def test_delete_daily_goal(self, repository, sample_goal):
        """DailyGoal 삭제 테스트"""
        # Given
        saved_goal = repository.save(sample_goal)

        # When
        repository.delete(saved_goal)

        # Then
        found_goal = repository.find_by_id(saved_goal.id)
        assert found_goal is None

    def test_delete_goal_without_id(self, repository):
        """ID가 없는 DailyGoal 삭제 테스트 (무시되어야 함)"""
        # Given
        goal_without_id = DailyGoal(
            id=None,
            user_id=1,
            target_questions=10,
            target_minutes=30
        )

        # When/Then - 예외가 발생하지 않아야 함
        repository.delete(goal_without_id)

