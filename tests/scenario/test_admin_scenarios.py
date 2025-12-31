"""
어드민 관련 시나리오 테스트
어드민이 시스템을 관리하는 플로우 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import tempfile
import os


class TestAdminScenarios:
    """어드민 관련 시나리오 테스트"""

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
        with patch('backend.presentation.controllers.admin.get_database', return_value=db), \
             patch('backend.presentation.controllers.auth.get_database', return_value=db), \
             patch('backend.presentation.controllers.users.get_database', return_value=db), \
             patch('backend.presentation.controllers.tests.get_database', return_value=db), \
             patch('backend.presentation.controllers.results.get_database', return_value=db):
            client = TestClient(app)
            yield client

    def test_scenario_admin_views_dashboard_statistics(self, app_client, temp_db):
        """시나리오: 어드민이 대시보드 통계를 조회"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.result_repository import SqliteResultRepository
        from backend.domain.entities.user import User
        from backend.domain.entities.question import Question
        from backend.domain.entities.test import Test
        from backend.domain.entities.result import Result
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        # 테스트 데이터 준비
        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)
        question_repo = SqliteQuestionRepository(db=db)
        test_repo = SqliteTestRepository(db=db)
        result_repo = SqliteResultRepository(db=db)

        # 1. 어드민 사용자 생성
        admin = User(
            id=None,
            email="admin@example.com",
            username="admin",
            target_level=JLPTLevel.N5,
            is_admin=True
        )
        admin = user_repo.save(admin)

        # 2. 일반 사용자 2명 생성 (1명은 활성, 1명은 비활성)
        user1 = User(
            id=None,
            email="user1@example.com",
            username="user1",
            target_level=JLPTLevel.N5,
            is_admin=False
        )
        user1 = user_repo.save(user1)
        user1.total_tests_taken = 2  # 활성 사용자
        user1 = user_repo.save(user1)

        user2 = User(
            id=None,
            email="user2@example.com",
            username="user2",
            target_level=JLPTLevel.N4,
            is_admin=False
        )
        user2 = user_repo.save(user2)  # 비활성 사용자

        # 3. 문제 생성 (N5 3개, N4 2개)
        question1 = Question(
            id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
            question_text="問題1", choices=["1", "2", "3", "4"], correct_answer="1",
            explanation="説明1", difficulty=1
        )
        question2 = Question(
            id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
            question_text="問題2", choices=["1", "2", "3", "4"], correct_answer="2",
            explanation="説明2", difficulty=2
        )
        question3 = Question(
            id=0, level=JLPTLevel.N5, question_type=QuestionType.READING,
            question_text="問題3", choices=["1", "2", "3", "4"], correct_answer="3",
            explanation="説明3", difficulty=1
        )
        question4 = Question(
            id=0, level=JLPTLevel.N4, question_type=QuestionType.VOCABULARY,
            question_text="問題4", choices=["1", "2", "3", "4"], correct_answer="1",
            explanation="説明4", difficulty=3
        )
        question5 = Question(
            id=0, level=JLPTLevel.N4, question_type=QuestionType.GRAMMAR,
            question_text="問題5", choices=["1", "2", "3", "4"], correct_answer="2",
            explanation="説明5", difficulty=4
        )
        question1 = question_repo.save(question1)
        question2 = question_repo.save(question2)
        question3 = question_repo.save(question3)
        question4 = question_repo.save(question4)
        question5 = question_repo.save(question5)

        # 4. 테스트 생성
        test1 = Test(
            id=0, title="Test 1", level=JLPTLevel.N5,
            questions=[question1, question2, question3], time_limit_minutes=60
        )
        test1 = test_repo.save(test1)

        test2 = Test(
            id=0, title="Test 2", level=JLPTLevel.N4,
            questions=[question4, question5], time_limit_minutes=60
        )
        test2 = test_repo.save(test2)

        # 5. 결과 생성 (평균 점수: (70 + 80) / 2 = 75)
        result1 = Result(
            id=0, test_id=test1.id, user_id=user1.id, score=70.0,
            assessed_level=JLPTLevel.N5, recommended_level=JLPTLevel.N5,
            correct_answers_count=14, total_questions_count=20, time_taken_minutes=50
        )
        result2 = Result(
            id=0, test_id=test2.id, user_id=user1.id, score=80.0,
            assessed_level=JLPTLevel.N4, recommended_level=JLPTLevel.N4,
            correct_answers_count=16, total_questions_count=20, time_taken_minutes=45
        )
        result_repo.save(result1)
        result_repo.save(result2)

        # 6. 어드민 로그인
        login_response = app_client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.com"}
        )
        assert login_response.status_code == 200

        # 7. 통계 조회
        stats_response = app_client.get("/api/v1/admin/statistics")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert stats_data["success"] is True
        assert "data" in stats_data

        stats = stats_data["data"]

        # 8. 통계 데이터 검증
        # 사용자 통계
        assert stats["users"]["total_users"] == 3  # admin + user1 + user2
        assert stats["users"]["active_users"] == 1  # user1만 활성

        # 테스트 통계
        assert stats["tests"]["total_tests"] == 2
        assert stats["tests"]["average_score"] == 75.0

        # 문제 통계
        assert stats["questions"]["total_questions"] == 5
        assert stats["questions"]["by_level"]["N5"] == 3
        assert stats["questions"]["by_level"]["N4"] == 2

        # 학습 데이터 통계
        assert stats["learning_data"]["total_results"] == 2

    def test_scenario_admin_manages_users_and_views_statistics(self, app_client, temp_db):
        """시나리오: 어드민이 사용자를 관리하고 통계를 확인"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        # 테스트 데이터 준비
        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)

        # 1. 어드민 사용자 생성
        admin = User(
            id=None,
            email="admin@example.com",
            username="admin",
            target_level=JLPTLevel.N5,
            is_admin=True
        )
        admin = user_repo.save(admin)

        # 2. 일반 사용자 생성
        user1 = User(
            id=None,
            email="user1@example.com",
            username="user1",
            target_level=JLPTLevel.N5,
            is_admin=False
        )
        user1 = user_repo.save(user1)

        # 3. 어드민 로그인
        login_response = app_client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.com"}
        )
        assert login_response.status_code == 200

        # 4. 사용자 목록 조회
        users_response = app_client.get("/api/v1/admin/users")
        assert users_response.status_code == 200
        users_data = users_response.json()
        assert users_data["success"] is True
        assert len(users_data["data"]) == 2  # admin + user1

        # 5. 통계 조회 (사용자 수 확인)
        stats_response = app_client.get("/api/v1/admin/statistics")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert stats_data["data"]["users"]["total_users"] == 2

        # 6. 사용자 정보 수정
        update_response = app_client.put(
            f"/api/v1/admin/users/{user1.id}",
            json={"username": "updated_user1", "target_level": "N4"}
        )
        assert update_response.status_code == 200
        updated_user = update_response.json()["data"]
        assert updated_user["username"] == "updated_user1"
        assert updated_user["target_level"] == "N4"

        # 7. 통계 재조회 (사용자 수는 동일)
        stats_response2 = app_client.get("/api/v1/admin/statistics")
        assert stats_response2.status_code == 200
        stats_data2 = stats_response2.json()
        assert stats_data2["data"]["users"]["total_users"] == 2

    def test_scenario_admin_manages_questions_and_views_statistics(self, app_client, temp_db):
        """시나리오: 어드민이 문제를 관리하고 통계를 확인"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.user import User
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        # 테스트 데이터 준비
        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)
        question_repo = SqliteQuestionRepository(db=db)

        # 1. 어드민 사용자 생성
        admin = User(
            id=None,
            email="admin@example.com",
            username="admin",
            target_level=JLPTLevel.N5,
            is_admin=True
        )
        admin = user_repo.save(admin)

        # 2. 기존 문제 생성
        question1 = Question(
            id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
            question_text="問題1", choices=["1", "2", "3", "4"], correct_answer="1",
            explanation="説明1", difficulty=1
        )
        question1 = question_repo.save(question1)

        # 3. 어드민 로그인
        login_response = app_client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.com"}
        )
        assert login_response.status_code == 200

        # 4. 통계 조회 (초기 문제 수)
        stats_response = app_client.get("/api/v1/admin/statistics")
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        initial_count = stats_data["data"]["questions"]["total_questions"]
        assert initial_count == 1

        # 5. 새 문제 생성
        create_response = app_client.post(
            "/api/v1/admin/questions",
            json={
                "level": "N5",
                "question_type": "grammar",
                "question_text": "新しい問題",
                "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                "correct_answer": "選択肢1",
                "explanation": "説明",
                "difficulty": 2
            }
        )
        assert create_response.status_code == 200

        # 6. 통계 재조회 (문제 수 증가 확인)
        stats_response2 = app_client.get("/api/v1/admin/statistics")
        assert stats_response2.status_code == 200
        stats_data2 = stats_response2.json()
        new_count = stats_data2["data"]["questions"]["total_questions"]
        assert new_count == initial_count + 1
        assert stats_data2["data"]["questions"]["by_level"]["N5"] == 2

