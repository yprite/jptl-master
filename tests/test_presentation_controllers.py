"""
Presentation 레이어 컨트롤러 테스트
TDD 방식으로 API 컨트롤러 구현 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import tempfile
import os


class TestHealthController:
    """Health 컨트롤러 테스트"""

    def test_health_check(self):
        """헬스 체크 엔드포인트 테스트"""
        from backend.presentation.controllers.health import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.health.get_database') as mock_db:
            # 데이터베이스 연결 성공 시뮬레이션
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            mock_cursor.execute.return_value = None
            mock_conn.cursor.return_value = mock_cursor
            mock_conn.__enter__ = MagicMock(return_value=mock_conn)
            mock_conn.__exit__ = MagicMock(return_value=None)
            mock_db_instance = MagicMock()
            mock_db_instance.get_connection.return_value = mock_conn
            mock_db.return_value = mock_db_instance

            response = client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["database"] == "healthy"
            assert "version" in data
            assert "timestamp" in data

    def test_readiness_check(self):
        """Readiness 체크 엔드포인트 테스트"""
        from backend.presentation.controllers.health import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"


class TestUsersController:
    """Users 컨트롤러 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_create_user_success(self, temp_db):
        """사용자 생성 성공 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.post(
                "/",
                json={
                    "email": "test@example.com",
                    "username": "testuser",
                    "target_level": "N5"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["email"] == "test@example.com"
            assert data["data"]["username"] == "testuser"

    def test_create_user_duplicate_email(self, temp_db):
        """중복 이메일로 사용자 생성 실패 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 먼저 사용자 생성
            repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            repo.save(user)

            # 중복 이메일로 생성 시도
            response = client.post(
                "/",
                json={
                    "email": "test@example.com",
                    "username": "anotheruser",
                    "target_level": "N5"
                }
            )

            assert response.status_code == 400
            assert "이미 등록된 이메일입니다" in response.json()["detail"]

    def test_get_current_user_not_implemented(self):
        """현재 사용자 조회 미구현 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/me")
        assert response.status_code == 404
        assert "사용자 인증 시스템이 아직 구현되지 않았습니다" in response.json()["detail"]

    def test_update_current_user_not_implemented(self):
        """현재 사용자 업데이트 미구현 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.put("/me", json={"username": "newuser"})
        assert response.status_code == 404
        assert "사용자 인증 시스템이 아직 구현되지 않았습니다" in response.json()["detail"]


class TestPostsController:
    """Posts 컨트롤러 테스트"""

    def test_get_posts(self):
        """게시글 목록 조회 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 200
        assert "게시글 목록 조회 API" in response.json()["message"]

    def test_create_post(self):
        """게시글 생성 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.post("/")
        assert response.status_code == 200
        assert "게시글 생성 API" in response.json()["message"]

    def test_get_post(self):
        """특정 게시글 조회 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/1")
        assert response.status_code == 200
        assert "게시글 1 조회 API" in response.json()["message"]

    def test_update_post(self):
        """게시글 수정 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.put("/1")
        assert response.status_code == 200
        assert "게시글 1 수정 API" in response.json()["message"]

    def test_delete_post(self):
        """게시글 삭제 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.delete("/1")
        assert response.status_code == 200
        assert "게시글 1 삭제 API" in response.json()["message"]


class TestResultsController:
    """Results 컨트롤러 테스트"""

    def test_get_results_not_implemented(self):
        """결과 목록 조회 미구현 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 404
        assert "결과 조회 API가 아직 구현되지 않았습니다" in response.json()["detail"]

    def test_get_result_not_implemented(self):
        """상세 결과 조회 미구현 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/1")
        assert response.status_code == 404
        assert "결과 조회 API가 아직 구현되지 않았습니다" in response.json()["detail"]


class TestTestsController:
    """Tests 컨트롤러 테스트"""

    def test_get_tests_not_implemented(self):
        """시험 목록 조회 미구현 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 404
        assert "시험 관리 API가 아직 구현되지 않았습니다" in response.json()["detail"]

    def test_get_test_not_implemented(self):
        """특정 시험 정보 조회 미구현 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/1")
        assert response.status_code == 404
        assert "시험 관리 API가 아직 구현되지 않았습니다" in response.json()["detail"]

    def test_start_test_not_implemented(self):
        """시험 시작 미구현 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.post("/1/start")
        assert response.status_code == 404
        assert "시험 관리 API가 아직 구현되지 않았습니다" in response.json()["detail"]

    def test_submit_test_not_implemented(self):
        """시험 제출 미구현 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.post("/1/submit")
        assert response.status_code == 404
        assert "시험 관리 API가 아직 구현되지 않았습니다" in response.json()["detail"]


class TestMainApp:
    """메인 애플리케이션 테스트"""

    def test_root_endpoint(self):
        """루트 엔드포인트 테스트"""
        from backend.main import app

        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "JLPT Skill Assessment Platform API"
        assert data["status"] == "running"

    def test_api_health_endpoint(self):
        """API 헬스 체크 엔드포인트 테스트"""
        from backend.main import app

        client = TestClient(app)

        with patch('backend.main.get_database') as mock_db:
            # 데이터베이스 연결 성공 시뮬레이션
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            mock_cursor.execute.return_value = None
            mock_conn.cursor.return_value = mock_cursor
            mock_conn.__enter__ = MagicMock(return_value=mock_conn)
            mock_conn.__exit__ = MagicMock(return_value=None)
            mock_db_instance = MagicMock()
            mock_db_instance.get_connection.return_value = mock_conn
            mock_db.return_value = mock_db_instance

            response = client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["database"] == "healthy"

    def test_startup_event(self):
        """애플리케이션 시작 이벤트 테스트"""
        from backend.main import app
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            temp_db_path = f.name

        try:
            with patch('backend.main.get_database') as mock_db:
                from backend.infrastructure.config.database import Database
                db = Database(db_path=temp_db_path)
                mock_db.return_value = db

                # FastAPI startup 이벤트는 TestClient로 자동 실행되지 않으므로
                # TestClient를 생성하면 자동으로 startup 이벤트가 실행됨
                client = TestClient(app)
                # startup 이벤트가 실행되었는지 확인하기 위해 간단한 요청
                response = client.get("/")
                assert response.status_code == 200
        finally:
            if os.path.exists(temp_db_path):
                os.unlink(temp_db_path)

