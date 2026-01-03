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

