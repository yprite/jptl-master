"""
FastAPI 헬스 체크 API 테스트
통합 테스트로 API 엔드포인트 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app


class TestHealthAPI:
    """헬스 체크 API 테스트"""

    def test_health_check(self):
        """헬스 체크 엔드포인트 테스트"""
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
            assert "timestamp" in data
            assert "version" in data

    def test_health_response_structure(self):
        """헬스 체크 응답 구조 검증"""
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
            assert "timestamp" in data
            assert "version" in data
            assert "database" in data
