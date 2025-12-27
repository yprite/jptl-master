"""
시나리오 테스트
여러 API 엔드포인트 간 상호작용 및 실제 사용자 플로우 검증

시나리오 테스트는 실제 사용자가 수행하는 순서대로 API를 호출하여
전체 플로우를 검증합니다.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import tempfile
import os


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
        from unittest.mock import patch

        # 데이터베이스 패치 설정
        db = Database(db_path=temp_db)
        
        # 모든 컨트롤러의 get_database를 패치
        with patch('backend.presentation.controllers.users.get_database', return_value=db), \
             patch('backend.presentation.controllers.tests.get_database', return_value=db), \
             patch('backend.presentation.controllers.results.get_database', return_value=db):
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

        # 2. 시험 생성
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

        # 3. 시험 시작
        start_response = app_client.post(
            f"/api/v1/tests/{test_id}/start",
            json={"user_id": user_id}
        )
        assert start_response.status_code == 200
        start_data = start_response.json()
        assert start_data["status"] == "in_progress"
        assert start_data["started_at"] is not None

        # 4. 문제 조회 (시험 정보 조회로 확인)
        get_test_response = app_client.get(f"/api/v1/tests/{test_id}")
        assert get_test_response.status_code == 200
        test_info = get_test_response.json()
        assert len(test_info["questions"]) == 20
        assert test_info["status"] == "in_progress"

        # 5. 답안 제출 (일부 정답, 일부 오답)
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
                "user_id": user_id,
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

        # 6. 결과 조회
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
        from unittest.mock import patch

        # 데이터베이스 패치 설정
        db = Database(db_path=temp_db)
        
        # 모든 컨트롤러의 get_database를 패치
        with patch('backend.presentation.controllers.users.get_database', return_value=db), \
             patch('backend.presentation.controllers.tests.get_database', return_value=db), \
             patch('backend.presentation.controllers.results.get_database', return_value=db):
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

        # 2. 첫 번째 시험 응시 및 결과 조회
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
        app_client.post(
            f"/api/v1/tests/{test1_id}/start",
            json={"user_id": user_id}
        )

        # 답안 제출 (10개 정답)
        test1_info = app_client.get(f"/api/v1/tests/{test1_id}").json()
        answers1 = {}
        for i, question in enumerate(test1_info["questions"]):
            answers1[question["id"]] = "A" if i < 10 else "B"

        submit1_response = app_client.post(
            f"/api/v1/tests/{test1_id}/submit",
            json={"user_id": user_id, "answers": answers1}
        )
        assert submit1_response.status_code == 200
        result1_id = submit1_response.json()["data"]["result_id"]

        # 첫 번째 결과 조회
        result1_detail = app_client.get(f"/api/v1/results/{result1_id}").json()
        assert result1_detail["score"] == 50.0

        # 3. 두 번째 시험 응시 및 결과 조회
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
        app_client.post(
            f"/api/v1/tests/{test2_id}/start",
            json={"user_id": user_id}
        )

        # 답안 제출 (15개 정답 - 더 좋은 성적)
        test2_info = app_client.get(f"/api/v1/tests/{test2_id}").json()
        answers2 = {}
        for i, question in enumerate(test2_info["questions"]):
            answers2[question["id"]] = "A" if i < 15 else "B"

        submit2_response = app_client.post(
            f"/api/v1/tests/{test2_id}/submit",
            json={"user_id": user_id, "answers": answers2}
        )
        assert submit2_response.status_code == 200
        result2_id = submit2_response.json()["data"]["result_id"]

        # 두 번째 결과 조회
        result2_detail = app_client.get(f"/api/v1/results/{result2_id}").json()
        assert result2_detail["score"] == 75.0

        # 4. 평균 점수 조회
        avg_response = app_client.get(f"/api/v1/results/users/{user_id}/average-score")
        assert avg_response.status_code == 200
        avg_data = avg_response.json()
        assert avg_data["user_id"] == user_id
        assert avg_data["average_score"] == 62.5  # (50 + 75) / 2
        assert avg_data["total_results"] == 2

        # 5. 최근 결과 목록 조회
        recent_response = app_client.get(f"/api/v1/results/users/{user_id}/recent?limit=10")
        assert recent_response.status_code == 200
        recent_data = recent_response.json()
        assert len(recent_data) == 2
        # 최신 결과가 먼저 나와야 함
        assert recent_data[0]["id"] == result2_id
        assert recent_data[1]["id"] == result1_id

        # 6. 전체 결과 목록 조회 (user_id 필터)
        all_results_response = app_client.get(f"/api/v1/results/?user_id={user_id}")
        assert all_results_response.status_code == 200
        all_results = all_results_response.json()
        assert len(all_results) == 2

