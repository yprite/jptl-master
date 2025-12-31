"""
어드민 관련 시나리오 테스트
어드민 API 상호작용 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient


class TestAdminScenarios:
    """어드민 관련 시나리오 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        client = TestClient(app)
        yield client

    def test_scenario_admin_login_and_access_admin_pages(self, app_client):
        """시나리오: 어드민 로그인 및 어드민 페이지 접근"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel
        from unittest.mock import patch
        import tempfile

        # 임시 데이터베이스 생성
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            with patch('backend.presentation.controllers.auth.get_database') as mock_auth_db, \
                 patch('backend.presentation.controllers.users.get_database') as mock_users_db, \
                 patch('backend.presentation.controllers.admin.get_database') as mock_admin_db:
                db = Database(db_path=db_path)
                mock_auth_db.return_value = db
                mock_users_db.return_value = db
                mock_admin_db.return_value = db

                # 1. 어드민 사용자 생성
                user_repo = SqliteUserRepository(db=db)
                admin_user = User(
                    id=None,
                    email="admin@example.com",
                    username="admin",
                    target_level=JLPTLevel.N5,
                    is_admin=True
                )
                saved_admin = user_repo.save(admin_user)

                # 2. 일반 사용자 생성
                regular_user = User(
                    id=None,
                    email="user@example.com",
                    username="user",
                    target_level=JLPTLevel.N5,
                    is_admin=False
                )
                saved_regular = user_repo.save(regular_user)

                # 3. 어드민 계정으로 로그인
                login_response = app_client.post(
                    "/api/v1/auth/login",
                    json={"email": "admin@example.com"}
                )
                assert login_response.status_code == 200
                login_data = login_response.json()
                assert login_data["success"] is True

                # 4. 현재 사용자 정보 조회 (is_admin 필드 확인)
                current_user_response = app_client.get("/api/v1/users/me")
                assert current_user_response.status_code == 200
                current_user_data = current_user_response.json()
                assert current_user_data["success"] is True
                assert "data" in current_user_data
                user_data = current_user_data["data"]
                assert user_data["email"] == "admin@example.com"
                assert user_data["is_admin"] is True  # is_admin 필드 확인

                # 5. 어드민 대시보드 접근
                stats_response = app_client.get("/api/v1/admin/statistics")
                assert stats_response.status_code == 200
                stats_data = stats_response.json()
                assert stats_data["success"] is True
                assert "data" in stats_data

                # 6. 어드민 사용자 목록 조회
                users_response = app_client.get("/api/v1/admin/users")
                assert users_response.status_code == 200
                users_data = users_response.json()
                assert users_data["success"] is True
                assert "data" in users_data
                assert isinstance(users_data["data"], list)
                assert len(users_data["data"]) >= 2  # 어드민 + 일반 사용자

                # 7. 일반 사용자로 로그인
                logout_response = app_client.post("/api/v1/auth/logout")
                assert logout_response.status_code == 200

                regular_login_response = app_client.post(
                    "/api/v1/auth/login",
                    json={"email": "user@example.com"}
                )
                assert regular_login_response.status_code == 200

                # 8. 일반 사용자의 is_admin 필드 확인
                regular_current_user_response = app_client.get("/api/v1/users/me")
                assert regular_current_user_response.status_code == 200
                regular_user_data = regular_current_user_response.json()
                assert regular_user_data["success"] is True
                assert regular_user_data["data"]["is_admin"] is False  # 일반 사용자는 False

                # 9. 일반 사용자가 어드민 API 접근 시도 (403 Forbidden)
                forbidden_response = app_client.get("/api/v1/admin/users")
                assert forbidden_response.status_code == 403

        finally:
            # 임시 파일 삭제
            import os
            if os.path.exists(db_path):
                os.unlink(db_path)

    def test_scenario_admin_user_management_flow(self, app_client):
        """시나리오: 어드민 사용자 관리 플로우"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel
        from unittest.mock import patch
        import tempfile

        # 임시 데이터베이스 생성
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        try:
            with patch('backend.presentation.controllers.auth.get_database') as mock_auth_db, \
                 patch('backend.presentation.controllers.admin.get_database') as mock_admin_db:
                db = Database(db_path=db_path)
                mock_auth_db.return_value = db
                mock_admin_db.return_value = db

                # 1. 어드민 사용자 생성 및 로그인
                user_repo = SqliteUserRepository(db=db)
                admin_user = User(
                    id=None,
                    email="admin@example.com",
                    username="admin",
                    target_level=JLPTLevel.N5,
                    is_admin=True
                )
                saved_admin = user_repo.save(admin_user)

                login_response = app_client.post(
                    "/api/v1/auth/login",
                    json={"email": "admin@example.com"}
                )
                assert login_response.status_code == 200

                # 2. 사용자 목록 조회
                users_response = app_client.get("/api/v1/admin/users")
                assert users_response.status_code == 200
                users_data = users_response.json()
                assert users_data["success"] is True
                assert len(users_data["data"]) == 1

                # 3. 특정 사용자 조회
                user_detail_response = app_client.get(f"/api/v1/admin/users/{saved_admin.id}")
                assert user_detail_response.status_code == 200
                user_detail_data = user_detail_response.json()
                assert user_detail_data["success"] is True
                assert user_detail_data["data"]["id"] == saved_admin.id
                assert user_detail_data["data"]["is_admin"] is True

                # 4. 사용자 정보 수정
                update_response = app_client.put(
                    f"/api/v1/admin/users/{saved_admin.id}",
                    json={"username": "updated_admin"}
                )
                assert update_response.status_code == 200
                update_data = update_response.json()
                assert update_data["success"] is True
                assert update_data["data"]["username"] == "updated_admin"

        finally:
            # 임시 파일 삭제
            import os
            if os.path.exists(db_path):
                os.unlink(db_path)

