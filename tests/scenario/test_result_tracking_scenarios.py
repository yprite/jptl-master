"""
결과 추적 관련 시나리오 테스트
사용자가 여러 시험을 응시하고 진행 상황을 추적하는 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import tempfile
import os


class TestResultTrackingScenarios:
    """결과 추적 관련 시나리오 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def app_client(self, temp_db):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        from backend.infrastructure.config.database import Database

        # 데이터베이스 패치 설정
        db = Database(db_path=temp_db)
        
        # 모든 컨트롤러의 get_database를 패치
        with patch('backend.presentation.controllers.users.get_database', return_value=db), \
             patch('backend.presentation.controllers.tests.get_database', return_value=db), \
             patch('backend.presentation.controllers.results.get_database', return_value=db), \
             patch('backend.presentation.controllers.auth.get_database', return_value=db):
            client = TestClient(app)
            yield client

    def test_scenario_user_tracks_progress_over_multiple_tests(self, app_client, temp_db):
        """시나리오: 사용자가 여러 시험을 응시하고 진행 상황을 추적"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        # 테스트 데이터 준비: 문제 생성
        db = Database(db_path=temp_db)
        question_repo = SqliteQuestionRepository(db=db)
        
        # 40개의 N5 문제 생성 (2개의 시험에 사용)
        for i in range(40):
            q = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY if i % 2 == 0 else QuestionType.GRAMMAR,
                question_text=f"Question {i+1}",
                choices=["A", "B", "C", "D"],
                correct_answer="A",
                explanation=f"Explanation {i+1}",
                difficulty=1
            )
            question_repo.save(q)

        # 1. 사용자 생성
        user_response = app_client.post(
            "/api/v1/users/",
            json={
                "email": "tracking@example.com",
                "username": "trackinguser",
                "target_level": "N5"
            }
        )
        assert user_response.status_code == 200
        user_data = user_response.json()
        user_id = user_data["data"]["id"]

        # 2. 로그인하여 세션 설정
        login_response = app_client.post(
            "/api/v1/auth/login",
            json={"email": "tracking@example.com"}
        )
        assert login_response.status_code == 200

        # 3. 첫 번째 시험 응시 및 결과 조회
        # 시험 생성
        test1_response = app_client.post(
            "/api/v1/tests/",
            json={
                "title": "첫 번째 N5 테스트",
                "level": "N5",
                "question_count": 20,
                "time_limit_minutes": 60
            }
        )
        assert test1_response.status_code == 200
        test1_id = test1_response.json()["id"]

        # 시험 시작
        start1_response = app_client.post(
            f"/api/v1/tests/{test1_id}/start",
            json={}
        )
        assert start1_response.status_code == 200

        # 답안 제출 (10개 정답)
        test1_info = app_client.get(f"/api/v1/tests/{test1_id}").json()
        answers1 = {}
        for i, question in enumerate(test1_info["questions"]):
            answers1[question["id"]] = "A" if i < 10 else "B"

        submit1_response = app_client.post(
            f"/api/v1/tests/{test1_id}/submit",
            json={"answers": answers1}
        )
        assert submit1_response.status_code == 200
        result1_id = submit1_response.json()["data"]["result_id"]

        # 첫 번째 결과 조회
        result1_detail = app_client.get(f"/api/v1/results/{result1_id}").json()
        assert result1_detail["score"] == 50.0

        # 4. 두 번째 시험 응시 및 결과 조회
        # 시험 생성
        test2_response = app_client.post(
            "/api/v1/tests/",
            json={
                "title": "두 번째 N5 테스트",
                "level": "N5",
                "question_count": 20,
                "time_limit_minutes": 60
            }
        )
        assert test2_response.status_code == 200
        test2_id = test2_response.json()["id"]

        # 시험 시작
        start2_response = app_client.post(
            f"/api/v1/tests/{test2_id}/start",
            json={}
        )
        assert start2_response.status_code == 200

        # 답안 제출 (15개 정답 - 더 좋은 성적)
        test2_info = app_client.get(f"/api/v1/tests/{test2_id}").json()
        answers2 = {}
        for i, question in enumerate(test2_info["questions"]):
            answers2[question["id"]] = "A" if i < 15 else "B"

        submit2_response = app_client.post(
            f"/api/v1/tests/{test2_id}/submit",
            json={"answers": answers2}
        )
        assert submit2_response.status_code == 200
        result2_id = submit2_response.json()["data"]["result_id"]

        # 두 번째 결과 조회
        result2_detail = app_client.get(f"/api/v1/results/{result2_id}").json()
        assert result2_detail["score"] == 75.0

        # 5. 평균 점수 조회
        avg_response = app_client.get(f"/api/v1/results/users/{user_id}/average-score")
        assert avg_response.status_code == 200
        avg_data = avg_response.json()
        assert avg_data["user_id"] == user_id
        assert avg_data["average_score"] == 62.5  # (50 + 75) / 2
        assert avg_data["total_results"] == 2

        # 6. 최근 결과 목록 조회
        recent_response = app_client.get(f"/api/v1/results/users/{user_id}/recent?limit=10")
        assert recent_response.status_code == 200
        recent_data = recent_response.json()
        assert len(recent_data) == 2
        # 최신 결과가 먼저 나와야 함
        assert recent_data[0]["id"] == result2_id
        assert recent_data[1]["id"] == result1_id

        # 7. 전체 결과 목록 조회 (user_id 필터)
        all_results_response = app_client.get(f"/api/v1/results/?user_id={user_id}")
        assert all_results_response.status_code == 200
        all_results = all_results_response.json()
        assert len(all_results) == 2

