"""
Users API 컨트롤러 테스트
TDD 방식으로 Users API 엔드포인트 구현 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import tempfile
import os


class TestUsersAPI:
    """Users API 엔드포인트 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        client = TestClient(app)
        yield client

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def test_user(self, temp_db):
        """테스트용 사용자 생성"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)
        user = User(
            id=None,
            email="test@example.com",
            username="testuser",
            target_level=JLPTLevel.N5
        )
        saved_user = user_repo.save(user)
        return saved_user, db

    def test_get_users_list_success(self, app_client, temp_db):
        """사용자 목록 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user1 = User(id=None, email="user1@example.com", username="user1", target_level=JLPTLevel.N5)
            user2 = User(id=None, email="user2@example.com", username="user2", target_level=JLPTLevel.N4)
            user_repo.save(user1)
            user_repo.save(user2)

            # 사용자 목록 조회
            response = app_client.get("/api/v1/users/")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert isinstance(data["data"], list)
            assert len(data["data"]) == 2
            assert data["data"][0]["email"] in ["user1@example.com", "user2@example.com"]
            assert data["data"][1]["email"] in ["user1@example.com", "user2@example.com"]

    def test_get_users_list_empty(self, app_client, temp_db):
        """빈 사용자 목록 조회 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 목록 조회
            response = app_client.get("/api/v1/users/")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert isinstance(data["data"], list)
            assert len(data["data"]) == 0

    def test_get_user_by_id_success(self, app_client, temp_db):
        """특정 사용자 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 특정 사용자 조회
            response = app_client.get(f"/api/v1/users/{saved_user.id}")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert data["data"]["id"] == saved_user.id
            assert data["data"]["email"] == "test@example.com"
            assert data["data"]["username"] == "testuser"

    def test_get_user_by_id_not_found(self, app_client, temp_db):
        """존재하지 않는 사용자 조회 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 존재하지 않는 사용자 조회
            response = app_client.get("/api/v1/users/999")
            assert response.status_code == 404
            data = response.json()
            assert "사용자를 찾을 수 없습니다" in data["detail"]

    def test_update_user_success(self, app_client, temp_db):
        """사용자 정보 수정 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 사용자 정보 수정
            response = app_client.put(
                f"/api/v1/users/{saved_user.id}",
                json={
                    "username": "updateduser",
                    "target_level": "N4"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert data["data"]["username"] == "updateduser"
            assert data["data"]["target_level"] == "N4"
            assert data["data"]["email"] == "test@example.com"  # 이메일은 변경되지 않음

    def test_update_user_not_found(self, app_client, temp_db):
        """존재하지 않는 사용자 수정 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 존재하지 않는 사용자 수정
            response = app_client.put(
                "/api/v1/users/999",
                json={"username": "updateduser"}
            )
            assert response.status_code == 404
            data = response.json()
            assert "사용자를 찾을 수 없습니다" in data["detail"]

    def test_update_user_username_duplicate(self, app_client, temp_db):
        """사용자명 중복 수정 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 두 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user1 = User(id=None, email="user1@example.com", username="user1", target_level=JLPTLevel.N5)
            user2 = User(id=None, email="user2@example.com", username="user2", target_level=JLPTLevel.N5)
            saved_user1 = user_repo.save(user1)
            saved_user2 = user_repo.save(user2)

            # user2의 사용자명을 user1의 사용자명으로 변경 시도
            response = app_client.put(
                f"/api/v1/users/{saved_user2.id}",
                json={"username": "user1"}
            )
            assert response.status_code == 400
            data = response.json()
            assert "이미 사용중인 사용자명입니다" in data["detail"]

    def test_delete_user_success(self, app_client, temp_db):
        """사용자 삭제 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 사용자 삭제
            response = app_client.delete(f"/api/v1/users/{saved_user.id}")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert data["success"] is True

            # 삭제 확인
            deleted_user = user_repo.find_by_id(saved_user.id)
            assert deleted_user is None

    def test_delete_user_not_found(self, app_client, temp_db):
        """존재하지 않는 사용자 삭제 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 존재하지 않는 사용자 삭제
            response = app_client.delete("/api/v1/users/999")
            assert response.status_code == 404
            data = response.json()
            assert "사용자를 찾을 수 없습니다" in data["detail"]

    def test_get_daily_goal_success(self, app_client, temp_db):
        """일일 목표 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.daily_goal_repository import SqliteDailyGoalRepository
        from backend.domain.entities.user import User
        from backend.domain.entities.daily_goal import DailyGoal
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.users.get_current_user') as mock_get_user, \
             patch('backend.presentation.controllers.users.get_learning_history_repository') as mock_get_learning_history:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)
            mock_get_user.return_value = saved_user

            # LearningHistory Repository 모킹
            from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
            learning_history_repo = SqliteLearningHistoryRepository(db=db)
            mock_get_learning_history.return_value = learning_history_repo

            # 일일 목표 생성
            daily_goal_repo = SqliteDailyGoalRepository(db=db)
            daily_goal = DailyGoal(id=None, user_id=saved_user.id, target_questions=10, target_minutes=30)
            daily_goal_repo.save(daily_goal)

            # 일일 목표 조회
            response = app_client.get(f"/api/v1/users/{saved_user.id}/daily-goal")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert "goal" in data["data"]
            assert "statistics" in data["data"]
            assert "achievement" in data["data"]
            assert data["data"]["goal"]["target_questions"] == 10
            assert data["data"]["goal"]["target_minutes"] == 30

    def test_get_daily_goal_no_goal(self, app_client, temp_db):
        """일일 목표가 없는 경우 조회 테스트 (기본값 사용)"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.users.get_current_user') as mock_get_user, \
             patch('backend.presentation.controllers.users.get_learning_history_repository') as mock_get_learning_history:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)
            mock_get_user.return_value = saved_user

            # LearningHistory Repository 모킹
            from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
            learning_history_repo = SqliteLearningHistoryRepository(db=db)
            mock_get_learning_history.return_value = learning_history_repo

            # 일일 목표 조회 (목표 없음)
            response = app_client.get(f"/api/v1/users/{saved_user.id}/daily-goal")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert "goal" in data["data"]
            # 기본값 사용
            assert data["data"]["goal"]["target_questions"] == 10
            assert data["data"]["goal"]["target_minutes"] == 30

    def test_update_daily_goal_create_new(self, app_client, temp_db):
        """새 일일 목표 생성 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.daily_goal_repository import SqliteDailyGoalRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.users.get_current_user') as mock_get_user:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)
            mock_get_user.return_value = saved_user

            # 일일 목표 설정
            response = app_client.put(
                f"/api/v1/users/{saved_user.id}/daily-goal",
                json={
                    "target_questions": 20,
                    "target_minutes": 60
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert data["data"]["target_questions"] == 20
            assert data["data"]["target_minutes"] == 60

            # 저장 확인
            daily_goal_repo = SqliteDailyGoalRepository(db=db)
            saved_goal = daily_goal_repo.find_by_user_id(saved_user.id)
            assert saved_goal is not None
            assert saved_goal.target_questions == 20
            assert saved_goal.target_minutes == 60

    def test_update_daily_goal_update_existing(self, app_client, temp_db):
        """기존 일일 목표 업데이트 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.daily_goal_repository import SqliteDailyGoalRepository
        from backend.domain.entities.user import User
        from backend.domain.entities.daily_goal import DailyGoal
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.users.get_current_user') as mock_get_user:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)
            mock_get_user.return_value = saved_user

            # 기존 일일 목표 생성
            daily_goal_repo = SqliteDailyGoalRepository(db=db)
            daily_goal = DailyGoal(id=None, user_id=saved_user.id, target_questions=10, target_minutes=30)
            daily_goal_repo.save(daily_goal)

            # 일일 목표 업데이트
            response = app_client.put(
                f"/api/v1/users/{saved_user.id}/daily-goal",
                json={
                    "target_questions": 25,
                    "target_minutes": 90
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert data["data"]["target_questions"] == 25
            assert data["data"]["target_minutes"] == 90

    def test_get_daily_goal_unauthorized(self, app_client, temp_db):
        """다른 사용자의 일일 목표 조회 시도 테스트 (권한 없음)"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.users.get_current_user') as mock_get_user:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 1 생성
            user_repo = SqliteUserRepository(db=db)
            user1 = User(id=None, email="user1@example.com", username="user1", target_level=JLPTLevel.N5)
            user2 = User(id=None, email="user2@example.com", username="user2", target_level=JLPTLevel.N5)
            saved_user1 = user_repo.save(user1)
            saved_user2 = user_repo.save(user2)
            
            # user1로 로그인했지만 user2의 목표 조회 시도
            mock_get_user.return_value = saved_user1

            response = app_client.get(f"/api/v1/users/{saved_user2.id}/daily-goal")
            assert response.status_code == 403
            data = response.json()
            assert "다른 사용자의 목표를 조회할 수 없습니다" in data["detail"]

