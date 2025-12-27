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

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.get("/me")
        assert response.status_code == 404
        assert "사용자 인증 시스템이 아직 구현되지 않았습니다" in response.json()["detail"]

    def test_update_current_user_not_implemented(self):
        """현재 사용자 업데이트 미구현 테스트"""
        from backend.presentation.controllers.users import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)
        response = client.put("/me", json={"username": "newuser"})
        assert response.status_code == 404
        assert "사용자 인증 시스템이 아직 구현되지 않았습니다" in response.json()["detail"]


class TestPostsController:
    """Posts 컨트롤러 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def test_user(self, temp_db):
        """테스트용 사용자 생성"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        db = Database(db_path=temp_db)
        repo = SqliteUserRepository(db)
        user = User(
            id=None,
            email="author@example.com",
            username="author",
            target_level=JLPTLevel.N5
        )
        return repo.save(user)

    def test_get_posts_empty(self, temp_db):
        """게시글 목록 조회 테스트 (빈 목록)"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.posts.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_create_post_success(self, temp_db, test_user):
        """게시글 생성 성공 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.posts.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.post(
                "/",
                json={
                    "title": "Test Post",
                    "content": "This is a test post content",
                    "author_id": test_user.id,
                    "published": False
                }
            )

            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Test Post"
            assert data["content"] == "This is a test post content"
            assert data["author_id"] == test_user.id
            assert data["published"] is False
            assert "id" in data

    def test_get_post_success(self, temp_db, test_user):
        """특정 게시글 조회 성공 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.post_repository import SqlitePostRepository
        from backend.domain.entities.post import Post

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.posts.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 게시글 생성
            post_repo = SqlitePostRepository(db)
            post = Post(
                id=None,
                title="Test Post",
                content="Test content",
                author_id=test_user.id,
                published=True
            )
            saved_post = post_repo.save(post)

            # 게시글 조회
            response = client.get(f"/{saved_post.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == saved_post.id
            assert data["title"] == "Test Post"
            assert data["content"] == "Test content"

    def test_get_post_not_found(self, temp_db):
        """게시글 조회 실패 테스트 (존재하지 않는 게시글)"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.posts.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            response = client.get("/999")
            assert response.status_code == 404
            assert "게시글을 찾을 수 없습니다" in response.json()["detail"]

    def test_update_post_success(self, temp_db, test_user):
        """게시글 수정 성공 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.post_repository import SqlitePostRepository
        from backend.domain.entities.post import Post

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.posts.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 게시글 생성
            post_repo = SqlitePostRepository(db)
            post = Post(
                id=None,
                title="Original Title",
                content="Original content",
                author_id=test_user.id,
                published=False
            )
            saved_post = post_repo.save(post)

            # 게시글 수정
            response = client.put(
                f"/{saved_post.id}",
                json={
                    "title": "Updated Title",
                    "content": "Updated content",
                    "published": True
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Updated Title"
            assert data["content"] == "Updated content"
            assert data["published"] is True

    def test_delete_post_success(self, temp_db, test_user):
        """게시글 삭제 성공 테스트"""
        from backend.presentation.controllers.posts import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.post_repository import SqlitePostRepository
        from backend.domain.entities.post import Post

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.posts.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 게시글 생성
            post_repo = SqlitePostRepository(db)
            post = Post(
                id=None,
                title="Test Post",
                content="Test content",
                author_id=test_user.id,
                published=False
            )
            saved_post = post_repo.save(post)

            # 게시글 삭제
            response = client.delete(f"/{saved_post.id}")
            assert response.status_code == 204

            # 삭제 확인
            response = client.get(f"/{saved_post.id}")
            assert response.status_code == 404


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

    def test_start_test_success(self, temp_db):
        """시험 시작 성공 테스트"""
        from backend.presentation.controllers.tests import router
        from fastapi import FastAPI
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.test_repository import SqliteTestRepository
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.test import Test
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        app = FastAPI()
        app.include_router(router)

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

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
                json={"user_id": 1}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "in_progress"
            assert data["started_at"] is not None

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

        client = TestClient(app)

        with patch('backend.presentation.controllers.tests.get_database') as mock_get_db:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db

            # 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user = User(id=None, email="test@example.com", username="testuser", target_level=JLPTLevel.N5)
            saved_user = user_repo.save(user)

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
            test.start_test()
            saved_test = test_repo.save(test)

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

