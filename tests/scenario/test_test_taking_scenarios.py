"""
시험 응시 관련 시나리오 테스트
사용자가 시험을 응시하고 결과를 조회하는 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import tempfile
import os


class TestTestTakingScenarios:
    """시험 응시 관련 시나리오 테스트"""

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

    def test_scenario_user_takes_test_and_views_result(self, app_client, temp_db):
        """시나리오: 사용자가 시험을 응시하고 결과를 조회"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        # 테스트 데이터 준비: 문제 생성
        db = Database(db_path=temp_db)
        question_repo = SqliteQuestionRepository(db=db)
        
        # 20개의 N5 문제 생성
        questions = []
        for i in range(20):
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
            saved_q = question_repo.save(q)
            questions.append(saved_q)

        # 1. 사용자 생성
        user_response = app_client.post(
            "/api/v1/users/",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "target_level": "N5"
            }
        )
        assert user_response.status_code == 200
        user_data = user_response.json()
        assert user_data["success"] is True
        user_id = user_data["data"]["id"]
        assert user_id > 0

        # 2. 로그인하여 세션 설정
        login_response = app_client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"}
        )
        assert login_response.status_code == 200

        # 3. 시험 생성
        test_response = app_client.post(
            "/api/v1/tests/",
            json={
                "title": "N5 진단 테스트",
                "level": "N5",
                "question_count": 20,
                "time_limit_minutes": 60
            }
        )
        assert test_response.status_code == 200
        test_data = test_response.json()
        test_id = test_data["id"]
        assert test_id > 0
        assert len(test_data["questions"]) == 20

        # 4. 시험 시작
        start_response = app_client.post(
            f"/api/v1/tests/{test_id}/start",
            json={}
        )
        assert start_response.status_code == 200
        start_data = start_response.json()
        assert start_data["status"] == "in_progress"
        assert start_data["started_at"] is not None

        # 5. 문제 조회 (시험 정보 조회로 확인)
        get_test_response = app_client.get(f"/api/v1/tests/{test_id}")
        assert get_test_response.status_code == 200
        test_info = get_test_response.json()
        assert len(test_info["questions"]) == 20
        assert test_info["status"] == "in_progress"

        # 6. 답안 제출 (일부 정답, 일부 오답)
        answers = {}
        for i, question in enumerate(test_info["questions"]):
            # 절반은 정답, 절반은 오답
            if i < 10:
                answers[question["id"]] = "A"  # 정답
            else:
                answers[question["id"]] = "B"  # 오답

        submit_response = app_client.post(
            f"/api/v1/tests/{test_id}/submit",
            json={
                "answers": answers
            }
        )
        assert submit_response.status_code == 200
        submit_data = submit_response.json()
        assert submit_data["success"] is True
        assert "result_id" in submit_data["data"]
        assert submit_data["data"]["score"] > 0
        assert submit_data["data"]["correct_answers"] == 10  # 절반 정답
        assert submit_data["data"]["total_questions"] == 20
        result_id = submit_data["data"]["result_id"]

        # 7. 결과 조회
        result_response = app_client.get(f"/api/v1/results/{result_id}")
        assert result_response.status_code == 200
        result_data = result_response.json()
        assert result_data["id"] == result_id
        assert result_data["test_id"] == test_id
        assert result_data["user_id"] == user_id
        assert result_data["score"] == 50.0  # 10/20 = 50%
        assert result_data["correct_answers_count"] == 10
        assert result_data["total_questions_count"] == 20
        assert "question_type_analysis" in result_data
        assert "feedback" in result_data

