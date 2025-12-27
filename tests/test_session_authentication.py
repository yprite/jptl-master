"""
세션 인증 테스트
TDD 방식으로 세션 기반 인증 구현 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import tempfile
import os


class TestSessionAuthentication:
    """세션 인증 테스트"""

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

    def test_login_success(self, app_client, temp_db):
        """로그인 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.auth.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.users.get_database') as mock_get_db_users:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db
            mock_get_db_users.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(
                id=None,
                email="test@example.com",
                username="testuser",
                target_level=JLPTLevel.N5
            )
            saved_user = user_repo.save(user)

            # 로그인 요청
            response = app_client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["user_id"] == saved_user.id
            assert data["data"]["email"] == "test@example.com"
            
            # 세션 쿠키 확인
            assert "session" in response.cookies

    def test_login_user_not_found(self, app_client, temp_db):
        """존재하지 않는 사용자 로그인 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.auth.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 존재하지 않는 이메일로 로그인 시도
            response = app_client.post(
                "/api/v1/auth/login",
                json={
                    "email": "nonexistent@example.com"
                }
            )

            assert response.status_code == 404
            data = response.json()
            assert "사용자를 찾을 수 없습니다" in data["detail"]

    def test_logout_success(self, app_client, temp_db):
        """로그아웃 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.auth.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성 및 로그인
            user_repo = SqliteUserRepository(db=db)
            user = User(
                id=None,
                email="test@example.com",
                username="testuser",
                target_level=JLPTLevel.N5
            )
            saved_user = user_repo.save(user)

            # 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com"}
            )
            assert login_response.status_code == 200

            # 로그아웃
            response = app_client.post("/api/v1/auth/logout")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_get_current_user_authenticated(self, app_client, temp_db):
        """인증된 사용자 정보 조회 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        with patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth, \
             patch('backend.presentation.controllers.users.get_database') as mock_get_db_users:
            db = Database(db_path=temp_db)
            mock_get_db_auth.return_value = db
            mock_get_db_users.return_value = db

            # 사용자 생성 및 로그인
            user_repo = SqliteUserRepository(db=db)
            user = User(
                id=None,
                email="test@example.com",
                username="testuser",
                target_level=JLPTLevel.N5
            )
            saved_user = user_repo.save(user)

            # 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com"}
            )
            assert login_response.status_code == 200

            # 현재 사용자 정보 조회
            response = app_client.get("/api/v1/users/me")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["id"] == saved_user.id
            assert data["data"]["email"] == "test@example.com"

    def test_get_current_user_unauthenticated(self, app_client):
        """인증되지 않은 사용자 정보 조회 테스트"""
        # 로그인하지 않고 현재 사용자 정보 조회
        response = app_client.get("/api/v1/users/me")
        assert response.status_code == 401
        data = response.json()
        assert "인증" in data["detail"] or "로그인" in data["detail"]

