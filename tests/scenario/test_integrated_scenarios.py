"""
통합 시나리오 테스트
전체 API 탐색 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestIntegratedScenarios:
    """통합 시나리오 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        client = TestClient(app)
        yield client

    def test_scenario_complete_api_exploration(self, app_client):
        """시나리오: 전체 API 탐색 플로우"""
        # 1. 시스템 상태 확인
        response = app_client.get("/health")
        assert response.status_code == 200

        # 2. 사용자 API 확인
        response = app_client.get("/api/v1/users/")
        assert response.status_code == 200

        # 3. 헬스 체크 API 확인
        with patch('backend.presentation.controllers.health.get_database') as mock_get_db:
            from backend.infrastructure.config.database import Database
            db = Database()
            mock_get_db.return_value = db
            response = app_client.get("/api/v1/health")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert "database" in data

        # 4. Readiness 체크 확인
        response = app_client.get("/api/v1/ready")
        assert response.status_code == 200

