"""
FastAPI 헬스 체크 API 테스트
통합 테스트로 API 엔드포인트 검증
"""

import pytest
from httpx import AsyncClient
from backend.main import app


@pytest.mark.asyncio
class TestHealthAPI:
    """헬스 체크 API 테스트"""

    async def test_health_check(self, client: AsyncClient):
        """헬스 체크 엔드포인트 테스트"""
        # 아직 구현되지 않았으므로 404 예상
        response = await client.get("/api/health")
        assert response.status_code == 404  # Not Found (아직 구현 전)

    async def test_health_response_structure(self, client: AsyncClient):
        """헬스 체크 응답 구조 검증 (구현 후)"""
        # 구현 후에는 다음과 같은 구조 검증
        # response = await client.get("/api/health")
        # assert response.status_code == 200
        # data = response.json()
        # assert data["status"] == "healthy"
        # assert "timestamp" in data
        # assert "version" in data
        pass


@pytest.fixture
async def client():
    """테스트용 HTTP 클라이언트"""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
