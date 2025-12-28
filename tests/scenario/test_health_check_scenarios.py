"""
헬스 체크 관련 시나리오 테스트
시스템 헬스 체크 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestHealthCheckScenarios:
    """헬스 체크 관련 시나리오 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        from backend.infrastructure.config.database import Database

        client = TestClient(app)
        yield client

    def test_scenario_health_check_flow(self, app_client):
        """시나리오: 시스템 헬스 체크 플로우"""
        # 1. 루트 엔드포인트 확인
        response = app_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "message" in data

        # 2. 헬스 체크 엔드포인트 확인
        response = app_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

        # 3. API 헬스 체크 엔드포인트 확인
        with patch('backend.presentation.controllers.health.get_database') as mock_get_db:
            from backend.infrastructure.config.database import Database
            db = Database()
            mock_get_db.return_value = db
            response = app_client.get("/api/v1/health")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert "database" in data

        # 4. Readiness 체크 엔드포인트 확인
        response = app_client.get("/api/v1/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"

