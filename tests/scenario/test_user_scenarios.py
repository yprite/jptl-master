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
        # 1. 사용자 목록 조회 (현재는 메시지만 반환)
        response = app_client.get("/api/v1/users/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "사용자 목록 조회" in data["message"]

        # 2. 사용자 생성 (현재는 메시지만 반환)
        response = app_client.post("/api/v1/users/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "사용자 생성" in data["message"]

        # 3. 특정 사용자 조회 (현재는 메시지만 반환)
        user_id = 1
        response = app_client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert str(user_id) in data["message"]

        # 4. 사용자 정보 수정 (현재는 메시지만 반환)
        response = app_client.put(f"/api/v1/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert str(user_id) in data["message"]

        # 5. 사용자 삭제 (현재는 메시지만 반환)
        response = app_client.delete(f"/api/v1/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert str(user_id) in data["message"]

