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
        from starlette.middleware.sessions import SessionMiddleware
        import secrets

        app = FastAPI()
        app.add_middleware(
            SessionMiddleware,
            secret_key=secrets.token_urlsafe(32),
            max_age=86400,
            same_site="lax"
        )
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/me")
        assert response.status_code == 401
        assert "로그인이 필요합니다" in response.json()["detail"]

    def test_update_current_user_not_implemented(self):
        """현재 사용자 업데이트 미구현 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from starlette.middleware.sessions import SessionMiddleware
        import secrets

        app = FastAPI()
        app.add_middleware(
            SessionMiddleware,
            secret_key=secrets.token_urlsafe(32),
            max_age=86400,
            same_site="lax"
        )
        app.include_router(router)

        client = TestClient(app)
        response = client.put("/me", json={"username": "newuser"})
        assert response.status_code == 401
        assert "로그인이 필요합니다" in response.json()["detail"]

    def test_get_user_performance_success(self, temp_db):
        """사용자 성능 분석 조회 성공 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.domain.entities.user import User
        from backend.domain.entities.user_performance import UserPerformance
        from backend.domain.value_objects.jlpt import JLPTLevel
        from datetime import date, timedelta

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # UserPerformance 생성
            user_performance_repo = SqliteUserPerformanceRepository(db=db)
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
            user_performance = UserPerformance(
                id=None, user_id=saved_user.id,
                analysis_period_start=start_date, analysis_period_end=end_date,
                type_performance={"vocabulary": {"accuracy": 85.0}, "grammar": {"accuracy": 70.0}},
                difficulty_performance={"1": {"accuracy": 90.0}, "2": {"accuracy": 75.0}},
                repeated_mistakes=[1, 2, 3],
                weaknesses={"grammar": "기본 문법 이해 부족"}
            )
            saved_performance = user_performance_repo.save(user_performance)

            # 사용자 성능 분석 조회
            response = client.get(f"/{saved_user.id}/performance")
            assert response.status_code == 200
            response_data = response.json()
            assert response_data["success"] is True
            data = response_data["data"]
            assert data["user_id"] == saved_user.id
            assert "type_performance" in data
            assert "difficulty_performance" in data
            assert "repeated_mistakes" in data
            assert "weaknesses" in data
            assert "analysis_period_start" in data
            assert "analysis_period_end" in data

    def test_get_user_performance_not_found(self, temp_db):
        """존재하지 않는 사용자의 성능 분석 조회 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/999/performance")
            assert response.status_code == 404
            assert "사용자를 찾을 수 없습니다" in response.json()["detail"]

    def test_get_user_history_success(self, temp_db):
        """사용자 학습 이력 조회 성공 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.domain.entities.user import User
        from backend.domain.entities.learning_history import LearningHistory
        from backend.domain.value_objects.jlpt import JLPTLevel
        from datetime import date

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # LearningHistory 생성
            learning_history_repo = SqliteLearningHistoryRepository(db=db)
            history1 = LearningHistory(
                id=None, user_id=saved_user.id, test_id=1, result_id=1,
                study_date=date.today(), study_hour=10, total_questions=20,
                correct_count=15, time_spent_minutes=30
            )
            history2 = LearningHistory(
                id=None, user_id=saved_user.id, test_id=2, result_id=2,
                study_date=date.today(), study_hour=14, total_questions=20,
                correct_count=18, time_spent_minutes=25
            )
            learning_history_repo.save(history1)
            learning_history_repo.save(history2)

            # 학습 이력 조회
            response = client.get(f"/{saved_user.id}/history")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert all(history["user_id"] == saved_user.id for history in data)
            assert "test_id" in data[0]
            assert "result_id" in data[0]
            assert "study_date" in data[0]
            assert "study_hour" in data[0]
            assert "total_questions" in data[0]
            assert "correct_count" in data[0]
            assert "time_spent_minutes" in data[0]

    def test_get_user_history_not_found(self, temp_db):
        """존재하지 않는 사용자의 학습 이력 조회 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.users.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/999/history")
            assert response.status_code == 404
            assert "사용자를 찾을 수 없습니다" in response.json()["detail"]


class TestResultsController:
    """Results 컨트롤러 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_get_results_empty(self, temp_db):
        """결과 목록 조회 (빈 목록) 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_result_not_found(self, temp_db):
        """존재하지 않는 결과 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/999")
            assert response.status_code == 404
            assert "결과를 찾을 수 없습니다" in response.json()["detail"]

    def test_get_result_success(self, temp_db):
        """결과 조회 성공 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.domain.entities.result import Result
        from backend.domain.value_objects.jlpt import JLPTLevel

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 결과 생성
            result_repo = SqliteResultRepository(db=db)
            result = Result(
                id=0, test_id=1, user_id=1, score=85.0,
                assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                correct_answers_count=17, total_questions_count=20,
                time_taken_minutes=45
            )
            saved_result = result_repo.save(result)

            response = client.get(f"/{saved_result.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == saved_result.id
            assert data["score"] == 85.0
            assert data["test_id"] == 1
            assert data["user_id"] == 1

    def test_get_results_by_user_id(self, temp_db):
        """사용자별 결과 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.domain.entities.result import Result
        from backend.domain.value_objects.jlpt import JLPTLevel

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 결과 생성
            result_repo = SqliteResultRepository(db=db)
            r1 = Result(id=0, test_id=1, user_id=1, score=75.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=15, total_questions_count=20,
                       time_taken_minutes=50)
            r2 = Result(id=0, test_id=2, user_id=1, score=85.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                       correct_answers_count=17, total_questions_count=20,
                       time_taken_minutes=45)
            r3 = Result(id=0, test_id=1, user_id=2, score=80.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=16, total_questions_count=20,
                       time_taken_minutes=48)

            result_repo.save(r1)
            result_repo.save(r2)
            result_repo.save(r3)

            # user_id=1의 결과만 조회
            response = client.get("/?user_id=1")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert all(r["user_id"] == 1 for r in data)

    def test_get_results_by_test_id(self, temp_db):
        """테스트별 결과 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.domain.entities.result import Result
        from backend.domain.value_objects.jlpt import JLPTLevel

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 결과 생성
            result_repo = SqliteResultRepository(db=db)
            r1 = Result(id=0, test_id=1, user_id=1, score=75.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=15, total_questions_count=20,
                       time_taken_minutes=50)
            r2 = Result(id=0, test_id=2, user_id=1, score=85.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                       correct_answers_count=17, total_questions_count=20,
                       time_taken_minutes=45)
            r3 = Result(id=0, test_id=1, user_id=2, score=80.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=16, total_questions_count=20,
                       time_taken_minutes=48)

            result_repo.save(r1)
            result_repo.save(r2)
            result_repo.save(r3)

            # test_id=1의 결과만 조회
            response = client.get("/?test_id=1")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert all(r["test_id"] == 1 for r in data)

    def test_get_recent_results_by_user(self, temp_db):
        """사용자의 최근 결과 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.domain.entities.result import Result
        from backend.domain.value_objects.jlpt import JLPTLevel

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 결과 생성
            result_repo = SqliteResultRepository(db=db)
            for i in range(15):
                result = Result(
                    id=0, test_id=1, user_id=1, score=75.0 + i,
                    assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                    correct_answers_count=15, total_questions_count=20,
                    time_taken_minutes=50
                )
                result_repo.save(result)

            # 최근 10개 조회
            response = client.get("/users/1/recent?limit=10")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 10

    def test_get_user_average_score(self, temp_db):
        """사용자 평균 점수 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.domain.entities.result import Result
        from backend.domain.value_objects.jlpt import JLPTLevel

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 결과 생성
            result_repo = SqliteResultRepository(db=db)
            r1 = Result(id=0, test_id=1, user_id=1, score=70.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=14, total_questions_count=20,
                       time_taken_minutes=50)
            r2 = Result(id=0, test_id=2, user_id=1, score=80.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                       correct_answers_count=16, total_questions_count=20,
                       time_taken_minutes=45)
            r3 = Result(id=0, test_id=3, user_id=1, score=90.0,
                       assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                       correct_answers_count=18, total_questions_count=20,
                       time_taken_minutes=40)

            result_repo.save(r1)
            result_repo.save(r2)
            result_repo.save(r3)

            # 평균 점수 조회
            response = client.get("/users/1/average-score")
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == 1
            assert data["average_score"] == 80.0
            assert data["total_results"] == 3

    def test_get_result_analysis_report(self, temp_db):
        """결과 분석 리포트 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.result import Result
        from backend.domain.entities.test import Test
        from backend.domain.entities.user import User
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 테스트 및 결과 생성
            test_repo = SqliteTestRepository(db=db)
            result_repo = SqliteResultRepository(db=db)

            questions = [
                Question(id=1, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                        question_text="Q1", choices=["A", "B", "C", "D"], correct_answer="A",
                        explanation="Exp1", difficulty=1),
                Question(id=2, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                        question_text="Q2", choices=["A", "B", "C", "D"], correct_answer="B",
                        explanation="Exp2", difficulty=2),
                Question(id=3, level=JLPTLevel.N5, question_type=QuestionType.READING,
                        question_text="Q3", choices=["A", "B", "C", "D"], correct_answer="C",
                        explanation="Exp3", difficulty=3)
            ]
            test = Test(id=0, title="N5 Test", level=JLPTLevel.N5, questions=questions, time_limit_minutes=30)
            saved_test = test_repo.save(test)

            # 결과 생성 (문제 유형별 분석 포함)
            question_type_analysis = {
                "vocabulary": {"correct": 1, "total": 1},
                "grammar": {"correct": 0, "total": 1},
                "reading": {"correct": 1, "total": 1}
            }
            result = Result(
                id=0, test_id=saved_test.id, user_id=saved_user.id,
                score=66.67, assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
                correct_answers_count=2, total_questions_count=3, time_taken_minutes=20,
                question_type_analysis=question_type_analysis
            )
            saved_result = result_repo.save(result)

            # 리포트 조회
            response = client.get(f"/{saved_result.id}/report")
            assert response.status_code == 200
            data = response.json()
            
            # 리포트 구조 검증
            assert "summary" in data
            assert "question_type_analysis" in data
            assert "strengths" in data
            assert "weaknesses" in data
            assert "recommendations" in data
            assert "improvement_areas" in data
            
            # 요약 정보 검증
            assert data["summary"]["score"] == 66.67
            assert data["summary"]["performance_level"] == "needs_improvement"
            assert data["summary"]["is_passed"] is False
            
            # 강점/약점 분석 검증
            assert len(data["strengths"]) > 0
            assert len(data["weaknesses"]) > 0
            assert "grammar" in [w["type"] for w in data["weaknesses"]]

    def test_get_result_details_success(self, temp_db):
        """결과 상세 답안 이력 조회 성공 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.domain.entities.result import Result
        from backend.domain.entities.answer_detail import AnswerDetail
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 결과 생성
            result_repo = SqliteResultRepository(db=db)
            result = Result(
                id=0, test_id=1, user_id=1, score=85.0,
                assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N4,
                correct_answers_count=17, total_questions_count=20,
                time_taken_minutes=45
            )
            saved_result = result_repo.save(result)

            # AnswerDetail 생성
            answer_detail_repo = SqliteAnswerDetailRepository(db=db)
            answer_detail1 = AnswerDetail(
                id=None, result_id=saved_result.id, question_id=1,
                user_answer="A", correct_answer="A", is_correct=True,
                time_spent_seconds=30, difficulty=1, question_type=QuestionType.VOCABULARY
            )
            answer_detail2 = AnswerDetail(
                id=None, result_id=saved_result.id, question_id=2,
                user_answer="B", correct_answer="C", is_correct=False,
                time_spent_seconds=45, difficulty=2, question_type=QuestionType.GRAMMAR
            )
            answer_detail_repo.save(answer_detail1)
            answer_detail_repo.save(answer_detail2)

            # 상세 답안 이력 조회
            response = client.get(f"/{saved_result.id}/details")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert all(detail["result_id"] == saved_result.id for detail in data)
            assert data[0]["question_id"] in [1, 2]
            assert "user_answer" in data[0]
            assert "correct_answer" in data[0]
            assert "is_correct" in data[0]
            assert "time_spent_seconds" in data[0]
            assert "difficulty" in data[0]
            assert "question_type" in data[0]

    def test_get_result_details_not_found(self, temp_db):
        """존재하지 않는 결과의 상세 답안 이력 조회 테스트"""
        from backend.presentation.controllers.results import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.results.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/999/details")
            assert response.status_code == 404
            assert "결과를 찾을 수 없습니다" in response.json()["detail"]


class TestTestsController:
    """Tests 컨트롤러 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_get_tests_empty(self, temp_db):
        """시험 목록 조회 (빈 목록) 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_test_not_found(self, temp_db):
        """존재하지 않는 시험 조회 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/999")
            assert response.status_code == 404
            assert "시험을 찾을 수 없습니다" in response.json()["detail"]

    def test_get_test_success(self, temp_db):
        """특정 시험 정보 조회 성공 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.test import Test
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, TestStatus, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            question = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="「こんにちは」の意味は何ですか？",
                choices=["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
                correct_answer="안녕하세요",
                explanation="「こんにちは」は「안녕하세요」という意味です。",
                difficulty=1
            )
            saved_question = question_repo.save(question)

            # 시험 생성
            test_repo = SqliteTestRepository(db=db)
            test = Test(
                id=0,
                title="N5 진단 테스트",
                level=JLPTLevel.N5,
                time_limit_minutes=30,
                questions=[saved_question]
            )
            saved_test = test_repo.save(test)

            # 시험 조회
            response = client.get(f"/{saved_test.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == saved_test.id
            assert data["title"] == "N5 진단 테스트"
            assert data["level"] == "N5"
            assert data["status"] == "created"
            assert data["time_limit_minutes"] == 30
            assert len(data["questions"]) == 1
            assert data["questions"][0]["id"] == saved_question.id
            assert data["questions"][0]["question_text"] == "「こんにちは」の意味は何ですか？"

    def test_create_n5_diagnostic_test(self, temp_db):
        """N5 진단 테스트 생성 전용 엔드포인트 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # N5 문제들을 먼저 생성 (다양한 유형 포함)
            question_repo = SqliteQuestionRepository(db=db)
            for i in range(30):  # 충분한 문제 생성
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY if i % 3 == 0 else (QuestionType.GRAMMAR if i % 3 == 1 else QuestionType.READING),
                    question_text=f"N5 Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # N5 진단 테스트 생성
            response = client.post("/diagnostic/n5")

            assert response.status_code == 200
            data = response.json()
            assert data["id"] > 0
            assert data["title"] == "N5 진단 테스트"
            assert data["level"] == "N5"
            assert len(data["questions"]) == 20  # 기본 20문제
            assert data["time_limit_minutes"] == 30  # 기본 30분

    def test_create_n5_diagnostic_test_insufficient_questions(self, temp_db):
        """N5 진단 테스트 생성 실패 테스트 - 문제 부족"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 문제를 10개만 생성 (20개 필요)
            question_repo = SqliteQuestionRepository(db=db)
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"N5 Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # N5 진단 테스트 생성 시도
            response = client.post("/diagnostic/n5")

            assert response.status_code == 400
            data = response.json()
            assert "충분한 문제가 없습니다" in data["detail"]

    def test_create_test_success(self, temp_db):
        """시험 생성 성공 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 문제들을 먼저 생성
            question_repo = SqliteQuestionRepository(db=db)
            for i in range(20):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            response = client.post(
                "/",
                json={
                    "title": "N5 진단 테스트",
                    "level": "N5",
                    "question_count": 20,
                    "time_limit_minutes": 60
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["id"] > 0
            assert data["title"] == "N5 진단 테스트"
            assert data["level"] == "N5"
            assert len(data["questions"]) == 20

    def test_create_test_with_question_types_filter(self, temp_db):
        """유형 필터링을 사용한 시험 생성 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 유형의 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            
            # VOCABULARY 유형 10개
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"Vocab Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # GRAMMAR 유형 10개
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.GRAMMAR,
                    question_text=f"Grammar Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # READING 유형 10개
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.READING,
                    question_text=f"Reading Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # VOCABULARY와 GRAMMAR 유형만 필터링하여 시험 생성
            response = client.post(
                "/",
                json={
                    "title": "N5 어휘/문법 테스트",
                    "level": "N5",
                    "question_count": 15,
                    "time_limit_minutes": 60,
                    "question_types": ["vocabulary", "grammar"]
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["id"] > 0
            assert data["title"] == "N5 어휘/문법 테스트"
            assert data["level"] == "N5"
            assert len(data["questions"]) == 15
            
            # 모든 문제가 VOCABULARY 또는 GRAMMAR 유형인지 확인
            question_types = [q["question_type"] for q in data["questions"]]
            assert all(qt in ["vocabulary", "grammar"] for qt in question_types)
            assert not any(qt == "reading" for qt in question_types)

    def test_create_test_with_single_question_type(self, temp_db):
        """단일 유형 필터링을 사용한 시험 생성 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 유형의 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            
            # VOCABULARY 유형 10개
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"Vocab Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # GRAMMAR 유형 10개
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.GRAMMAR,
                    question_text=f"Grammar Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # VOCABULARY 유형만 필터링하여 시험 생성
            response = client.post(
                "/",
                json={
                    "title": "N5 어휘 테스트",
                    "level": "N5",
                    "question_count": 8,
                    "time_limit_minutes": 60,
                    "question_types": ["vocabulary"]
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["id"] > 0
            assert data["title"] == "N5 어휘 테스트"
            assert len(data["questions"]) == 8
            
            # 모든 문제가 VOCABULARY 유형인지 확인
            question_types = [q["question_type"] for q in data["questions"]]
            assert all(qt == "vocabulary" for qt in question_types)

    def test_create_test_with_question_type_counts(self, temp_db):
        """유형별 문제 수 조정을 사용한 시험 생성 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 유형의 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            
            # VOCABULARY 유형 15개
            for i in range(15):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"Vocab Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # GRAMMAR 유형 10개
            for i in range(10):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.GRAMMAR,
                    question_text=f"Grammar Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # READING 유형 8개
            for i in range(8):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.READING,
                    question_text=f"Reading Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # 유형별 문제 수 지정하여 시험 생성
            # VOCABULARY: 10개, GRAMMAR: 5개, READING: 5개
            response = client.post(
                "/",
                json={
                    "title": "N5 맞춤형 테스트",
                    "level": "N5",
                    "time_limit_minutes": 60,
                    "question_type_counts": {
                        "vocabulary": 10,
                        "grammar": 5,
                        "reading": 5
                    }
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["id"] > 0
            assert data["title"] == "N5 맞춤형 테스트"
            assert data["level"] == "N5"
            assert len(data["questions"]) == 20  # 총 20개
            
            # 각 유형별 문제 수 확인
            question_types = [q["question_type"] for q in data["questions"]]
            vocab_count = question_types.count("vocabulary")
            grammar_count = question_types.count("grammar")
            reading_count = question_types.count("reading")
            
            assert vocab_count == 10
            assert grammar_count == 5
            assert reading_count == 5

    def test_create_test_with_question_type_counts_insufficient_questions(self, temp_db):
        """유형별 문제 수 조정 시 문제 수 부족 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 여러 유형의 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            
            # VOCABULARY 유형 5개만 생성 (10개 요청)
            for i in range(5):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"Vocab Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # GRAMMAR 유형 3개만 생성 (5개 요청)
            for i in range(3):
                q = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.GRAMMAR,
                    question_text=f"Grammar Question {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation=f"Explanation {i+1}",
                    difficulty=1
                )
                question_repo.save(q)

            # 유형별 문제 수 지정하여 시험 생성 (요청 수가 부족)
            response = client.post(
                "/",
                json={
                    "title": "N5 맞춤형 테스트",
                    "level": "N5",
                    "time_limit_minutes": 60,
                    "question_type_counts": {
                        "vocabulary": 10,
                        "grammar": 5
                    }
                }
            )

            assert response.status_code == 400
            data = response.json()
            assert "부족" in data["detail"] or "insufficient" in data["detail"].lower()

    def test_start_test_success(self, temp_db):
        """시험 시작 성공 테스트"""
        from backend.presentation.controllers.tests import router
        from backend.presentation.controllers.auth import router as auth_router
        from fastapi import FastAPI
        from starlette.middleware.sessions import SessionMiddleware
        import secrets
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.test import Test
        from backend.domain.entities.question import Question
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.add_middleware(
            SessionMiddleware,
            secret_key=secrets.token_urlsafe(32),
            max_age=86400,
            same_site="lax"
        )
        app.include_router(auth_router, prefix="/auth")
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db_tests, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            db = Database(db_path=temp_db)
            mock_get_db_tests.return_value = db
            mock_get_db_auth.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(
                id=None,
                email="test@example.com",
                username="testuser",
                target_level=JLPTLevel.N5
            )
            saved_user = user_repo.save(user)

            # 로그인하여 세션 설정
            login_response = client.post(
                "/auth/login",
                json={"email": "test@example.com"}
            )
            assert login_response.status_code == 200

            # 문제와 테스트 생성
            question_repo = SqliteQuestionRepository(db=db)
            questions = []
            for i in range(5):
                q = Question(
                    id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text=f"Q{i+1}", choices=["A", "B"], correct_answer="A",
                    explanation=f"E{i+1}", difficulty=1
                )
                saved_q = question_repo.save(q)
                questions.append(saved_q)

            test_repo = SqliteTestRepository(db=db)
            test = Test(
                id=0, title="Test", level=JLPTLevel.N5,
                questions=questions, time_limit_minutes=60
            )
            saved_test = test_repo.save(test)

            response = client.post(
                f"/{saved_test.id}/start",
                json={}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "in_progress"
            assert data["started_at"] is not None

    def test_start_test_no_questions(self, temp_db):
        """시험 시작 실패 테스트 - 문제가 없는 경우"""
        from backend.presentation.controllers.tests import router
        from backend.presentation.controllers.auth import router as auth_router
        from fastapi import FastAPI
        from starlette.middleware.sessions import SessionMiddleware
        import secrets
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.test import Test
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        app = FastAPI()
        app.add_middleware(
            SessionMiddleware,
            secret_key=secrets.token_urlsafe(32),
            max_age=86400,
            same_site="lax"
        )
        app.include_router(auth_router, prefix="/auth")
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db_tests, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            db = Database(db_path=temp_db)
            mock_get_db_tests.return_value = db
            mock_get_db_auth.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(
                id=None,
                email="test@example.com",
                username="testuser",
                target_level=JLPTLevel.N5
            )
            saved_user = user_repo.save(user)

            # 로그인하여 세션 설정
            login_response = client.post(
                "/auth/login",
                json={"email": "test@example.com"}
            )
            assert login_response.status_code == 200

            # 문제가 없는 테스트 생성
            test_repo = SqliteTestRepository(db=db)
            test = Test(
                id=0, title="Test", level=JLPTLevel.N5,
                questions=[], time_limit_minutes=60  # 문제 없음
            )
            saved_test = test_repo.save(test)

            # 시험 시작 시도
            response = client.post(
                f"/{saved_test.id}/start",
                json={}
            )

            assert response.status_code == 400
            data = response.json()
            assert "등록된 문제가 없습니다" in data["detail"]

    def test_submit_test_success(self, temp_db):
        """시험 제출 성공 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.test import Test
        from backend.domain.entities.question import Question
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        db = Database(db_path=temp_db)
        client = TestClient(app)
        
        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db, \
             patch('backend.infrastructure.config.database.get_database') as mock_get_db_config:
            mock_get_db.return_value = db
            mock_get_db_config.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)
            
            # get_current_user dependency override
            from backend.presentation.controllers.auth import get_current_user
            def override_get_current_user():
                return saved_user
            app.dependency_overrides[get_current_user] = override_get_current_user
            
            # get_test_repository dependency override
            from backend.presentation.controllers.tests import get_test_repository
            from backend.infrastructure.repositories.test_repository import SqliteTestRepository
            test_repo_instance = SqliteTestRepository(db=db)
            def override_get_test_repository():
                return test_repo_instance
            app.dependency_overrides[get_test_repository] = override_get_test_repository

            try:
                # 문제와 테스트 생성
                question_repo = SqliteQuestionRepository(db=db)
                questions = []
                for i in range(5):
                    q = Question(
                        id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                        question_text=f"Q{i+1}", choices=["A", "B"], correct_answer="A",
                        explanation=f"E{i+1}", difficulty=1
                    )
                    saved_q = question_repo.save(q)
                    questions.append(saved_q)

                # test_repo는 이미 override에서 생성됨
                test = Test(
                    id=0, title="Test", level=JLPTLevel.N5,
                    questions=questions, time_limit_minutes=60
                )
                test.start_test()
                saved_test = test_repo_instance.save(test)

                # 답안 준비
                answers = {q.id: "A" for q in questions}

                response = client.post(
                    f"/{saved_test.id}/submit",
                    json={
                        "user_id": saved_user.id,
                        "answers": answers
                    }
                )

                if response.status_code != 200:
                    print(f"Response status: {response.status_code}")
                    print(f"Response body: {response.json()}")
                
                assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
                data = response.json()
                assert data["success"] is True
                assert data["data"]["score"] == 100.0
                assert data["data"]["correct_answers"] == 5
                assert data["data"]["total_questions"] == 5

                # 학습 데이터 자동 수집 검증
                result_id = data["data"]["result_id"]
                
                # AnswerDetail 자동 생성 검증
                from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
                answer_detail_repo = SqliteAnswerDetailRepository(db=db)
                answer_details = answer_detail_repo.find_by_result_id(result_id)
                assert len(answer_details) == 5, f"Expected 5 AnswerDetails, got {len(answer_details)}"
                for answer_detail in answer_details:
                    assert answer_detail.result_id == result_id
                    assert answer_detail.is_correct is True
                    assert answer_detail.user_answer == "A"
                    assert answer_detail.correct_answer == "A"
                
                # LearningHistory 자동 기록 검증
                from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
                learning_history_repo = SqliteLearningHistoryRepository(db=db)
                learning_histories = learning_history_repo.find_by_user_id(saved_user.id)
                assert len(learning_histories) >= 1, "At least one LearningHistory should be created"
                latest_history = learning_histories[0]
                assert latest_history.user_id == saved_user.id
                assert latest_history.test_id == saved_test.id
                assert latest_history.result_id == result_id
                assert latest_history.total_questions == 5
                assert latest_history.correct_count == 5
                
                # UserPerformance 업데이트 검증 (최소한 하나의 UserPerformance가 존재해야 함)
                from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
                user_performance_repo = SqliteUserPerformanceRepository(db=db)
                user_performances = user_performance_repo.find_by_user_id(saved_user.id)
                # UserPerformance는 주기적으로 업데이트되므로, 최소한 하나가 존재하거나 생성되어야 함
                # (실제 구현에서는 기간별로 생성/업데이트될 수 있음)
                assert len(user_performances) >= 1, "At least one UserPerformance should be created or updated"
            finally:
                # dependency override 정리
                app.dependency_overrides.clear()


class TestStudyController:
    """Study (학습 모드) 컨트롤러 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_get_study_questions_success(self, temp_db):
        """학습 모드 문제 조회 성공 테스트"""
        from backend.presentation.controllers.study import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
        from backend.presentation.controllers.auth import get_current_user
        from backend.domain.entities.user import User

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.study.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            for i in range(5):
                question = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"문제 {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation="해설입니다",
                    difficulty=1
                )
                question_repo.save(question)

            # 사용자 생성 및 인증 모킹
            from backend.infrastructure.repositories.user_repository import SqliteUserRepository
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 인증 의존성 오버라이드
            def get_current_user_override():
                return saved_user

            app.dependency_overrides[get_current_user] = get_current_user_override

            try:
                # 학습 모드 문제 조회
                response = client.get("/questions?level=N5&question_count=5")
                assert response.status_code == 200
                data = response.json()
                assert isinstance(data, list)
                assert len(data) == 5
                assert all("id" in q for q in data)
                assert all("question_text" in q for q in data)
                assert all("choices" in q for q in data)
                assert all("question_type" in q for q in data)
            finally:
                app.dependency_overrides.clear()

    def test_get_study_questions_with_type_filter(self, temp_db):
        """유형별 필터링된 학습 모드 문제 조회 테스트"""
        from backend.presentation.controllers.study import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
        from backend.presentation.controllers.auth import get_current_user
        from backend.domain.entities.user import User

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.study.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 문제 생성 (VOCABULARY와 GRAMMAR 유형)
            question_repo = SqliteQuestionRepository(db=db)
            for i in range(3):
                question = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"어휘 문제 {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation="해설입니다",
                    difficulty=1
                )
                question_repo.save(question)

            for i in range(2):
                question = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.GRAMMAR,
                    question_text=f"문법 문제 {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation="해설입니다",
                    difficulty=1
                )
                question_repo.save(question)

            # 사용자 생성 및 인증 모킹
            from backend.infrastructure.repositories.user_repository import SqliteUserRepository
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 인증 의존성 오버라이드
            def get_current_user_override():
                return saved_user

            app.dependency_overrides[get_current_user] = get_current_user_override

            try:
                # VOCABULARY 유형만 조회
                response = client.get("/questions", params={
                    "level": "N5",
                    "question_types": ["vocabulary"],
                    "question_count": 3
                })
                assert response.status_code == 200
                data = response.json()
                assert isinstance(data, list)
                assert len(data) == 3
                assert all(q["question_type"] == "vocabulary" for q in data)
            finally:
                app.dependency_overrides.clear()

    def test_get_study_questions_unauthorized(self, temp_db):
        """인증되지 않은 사용자의 학습 모드 문제 조회 테스트"""
        from backend.presentation.controllers.study import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from starlette.middleware.sessions import SessionMiddleware

        app = FastAPI()
        app.add_middleware(SessionMiddleware, secret_key="test-secret-key")
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.study.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 인증 없이 요청
            response = client.get("/questions?level=N5")
            assert response.status_code == 401  # 또는 403, 인증 실패

    def test_submit_study_session_success(self, temp_db):
        """학습 모드 세션 제출 성공 테스트"""
        from backend.presentation.controllers.study import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
        from backend.presentation.controllers.auth import get_current_user
        from backend.domain.entities.user import User

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.study.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            questions = []
            for i in range(3):
                question = Question(
                    id=0,
                    level=JLPTLevel.N5,
                    question_type=QuestionType.VOCABULARY,
                    question_text=f"문제 {i+1}",
                    choices=["A", "B", "C", "D"],
                    correct_answer="A",
                    explanation="해설입니다",
                    difficulty=1
                )
                saved_q = question_repo.save(question)
                questions.append(saved_q)

            # 사용자 생성 및 인증 모킹
            from backend.infrastructure.repositories.user_repository import SqliteUserRepository
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

            # 인증 의존성 오버라이드
            def get_current_user_override():
                return saved_user

            app.dependency_overrides[get_current_user] = get_current_user_override

            try:
                # 학습 모드 세션 제출
                answers = {q.id: "A" for q in questions}
                response = client.post(
                    "/submit",
                    json={
                        "answers": answers,
                        "level": "N5",
                        "question_types": ["vocabulary"],
                        "time_spent_minutes": 10
                    }
                )
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "study_session_id" in data["data"]
                assert data["data"]["total_questions"] == 3
                assert data["data"]["correct_count"] == 3
                assert "accuracy" in data["data"]
            finally:
                app.dependency_overrides.clear()


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

            response = client.get("/api/v1/health")
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

