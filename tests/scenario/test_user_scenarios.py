"""
사용자 관련 시나리오 테스트
사용자 API 상호작용 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient


class TestUserScenarios:
    """사용자 관련 시나리오 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        client = TestClient(app)
        yield client

    def test_scenario_user_api_interaction(self, app_client):
        """시나리오: 사용자 API 상호작용 플로우"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel
        from unittest.mock import patch
        import tempfile
        import os

        # 임시 데이터베이스 생성
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
                db = Database(db_path=db_path)
                mock_get_db.return_value = db

                # 1. 사용자 목록 조회 (빈 목록)
                response = app_client.get("/api/v1/users/")
                assert response.status_code == 200
                data = response.json()
                assert "success" in data
                assert data["success"] is True
                assert "data" in data
                assert isinstance(data["data"], list)
                assert len(data["data"]) == 0

                # 2. 사용자 생성
                user_repo = SqliteUserRepository(db=db)
                user = User(
                    id=None,
                    email="test@example.com",
                    username="testuser",
                    target_level=JLPTLevel.N5
                )
                saved_user = user_repo.save(user)
                user_id = saved_user.id

                response = app_client.post(
                    "/api/v1/users/",
                    json={
                        "email": "test2@example.com",
                        "username": "testuser2",
                        "target_level": "N5"
                    }
                )
                assert response.status_code == 200
                data = response.json()
                assert "success" in data
                assert data["success"] is True
                assert "data" in data
                assert "id" in data["data"]

                # 3. 특정 사용자 조회
                response = app_client.get(f"/api/v1/users/{user_id}")
                assert response.status_code == 200
                data = response.json()
                assert "success" in data
                assert data["success"] is True
                assert "data" in data
                assert data["data"]["id"] == user_id
                assert data["data"]["email"] == "test@example.com"

                # 4. 사용자 정보 수정
                response = app_client.put(
                    f"/api/v1/users/{user_id}",
                    json={
                        "username": "updateduser",
                        "target_level": "N4"
                    }
                )
                assert response.status_code == 200
                data = response.json()
                assert "success" in data
                assert data["success"] is True
                assert "data" in data
                assert data["data"]["username"] == "updateduser"
                assert data["data"]["target_level"] == "N4"

                # 5. 사용자 삭제
                response = app_client.delete(f"/api/v1/users/{user_id}")
                assert response.status_code == 200
                data = response.json()
                assert "success" in data
                assert data["success"] is True

                # 삭제 확인
                response = app_client.get(f"/api/v1/users/{user_id}")
                assert response.status_code == 404
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)

