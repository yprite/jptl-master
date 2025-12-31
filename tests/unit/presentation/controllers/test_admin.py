"""
Admin API 컨트롤러 테스트
TDD 방식으로 Admin API 엔드포인트 구현 검증
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import tempfile
import os


class TestAdminUsersAPI:
    """Admin Users API 엔드포인트 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        client = TestClient(app)
        yield client

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def admin_user(self, temp_db):
        """테스트용 어드민 사용자 생성"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)
        admin = User(
            id=None,
            email="admin@example.com",
            username="admin",
            target_level=JLPTLevel.N5,
            is_admin=True
        )
        saved_admin = user_repo.save(admin)
        return saved_admin, db

    @pytest.fixture
    def regular_user(self, temp_db):
        """테스트용 일반 사용자 생성"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)
        user = User(
            id=None,
            email="user@example.com",
            username="user",
            target_level=JLPTLevel.N5,
            is_admin=False
        )
        saved_user = user_repo.save(user)
        return saved_user, db

    def test_get_admin_users_list_success(self, app_client, temp_db, admin_user):
        """어드민 사용자 목록 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 여러 사용자 생성
            user_repo = SqliteUserRepository(db=db)
            user1 = User(id=None, email="user1@example.com", username="user1", target_level=JLPTLevel.N5)
            user2 = User(id=None, email="user2@example.com", username="user2", target_level=JLPTLevel.N4)
            user_repo.save(user1)
            user_repo.save(user2)

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 어드민 사용자 목록 조회
            response = app_client.get("/api/v1/admin/users")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert isinstance(data["data"], list)
            assert len(data["data"]) >= 3  # admin + user1 + user2

    def test_get_admin_users_list_unauthorized(self, app_client, temp_db):
        """어드민 사용자 목록 조회 - 인증되지 않은 사용자 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 로그인하지 않고 어드민 사용자 목록 조회 시도
            response = app_client.get("/api/v1/admin/users")
            assert response.status_code == 401

    def test_get_admin_users_list_forbidden(self, app_client, temp_db, regular_user):
        """어드민 사용자 목록 조회 - 일반 사용자 접근 테스트"""
        from backend.infrastructure.config.database import Database

        regular, db = regular_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 일반 사용자 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "user@example.com"}
            )
            assert login_response.status_code == 200

            # 어드민 사용자 목록 조회 시도 (403 에러 발생해야 함)
            response = app_client.get("/api/v1/admin/users")
            assert response.status_code == 403

    def test_get_admin_user_by_id_success(self, app_client, temp_db, admin_user, regular_user):
        """어드민 특정 사용자 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database

        admin, db = admin_user
        regular, _ = regular_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 특정 사용자 조회
            response = app_client.get(f"/api/v1/admin/users/{regular.id}")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert data["data"]["id"] == regular.id
            assert data["data"]["email"] == regular.email

    def test_get_admin_user_by_id_not_found(self, app_client, temp_db, admin_user):
        """어드민 특정 사용자 조회 - 사용자 없음 테스트"""
        from backend.infrastructure.config.database import Database

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 존재하지 않는 사용자 조회
            response = app_client.get("/api/v1/admin/users/99999")
            assert response.status_code == 404

    def test_update_admin_user_success(self, app_client, temp_db, admin_user, regular_user):
        """어드민 사용자 정보 수정 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.domain.value_objects.jlpt import JLPTLevel

        admin, db = admin_user
        regular, _ = regular_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 사용자 정보 수정
            response = app_client.put(
                f"/api/v1/admin/users/{regular.id}",
                json={"username": "updated_user", "target_level": "N4"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert data["data"]["username"] == "updated_user"
            assert data["data"]["target_level"] == "N4"

    def test_delete_admin_user_success(self, app_client, temp_db, admin_user, regular_user):
        """어드민 사용자 삭제 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository

        admin, db = admin_user
        regular, _ = regular_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 사용자 삭제
            response = app_client.delete(f"/api/v1/admin/users/{regular.id}")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data

            # 삭제 확인
            user_repo = SqliteUserRepository(db=db)
            deleted_user = user_repo.find_by_id(regular.id)
            assert deleted_user is None

    def test_delete_admin_user_not_found(self, app_client, temp_db, admin_user):
        """어드민 사용자 삭제 - 사용자 없음 테스트"""
        from backend.infrastructure.config.database import Database

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 존재하지 않는 사용자 삭제
            response = app_client.delete("/api/v1/admin/users/99999")
            assert response.status_code == 404


class TestAdminQuestionsAPI:
    """Admin Questions API 엔드포인트 테스트"""

    @pytest.fixture
    def app_client(self):
        """테스트용 FastAPI 앱 및 클라이언트 생성"""
        from backend.main import app
        client = TestClient(app)
        yield client

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def admin_user(self, temp_db):
        """테스트용 어드민 사용자 생성"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.user_repository import SqliteUserRepository
        from backend.domain.entities.user import User
        from backend.domain.value_objects.jlpt import JLPTLevel

        db = Database(db_path=temp_db)
        user_repo = SqliteUserRepository(db=db)
        admin = User(
            id=None,
            email="admin@example.com",
            username="admin",
            target_level=JLPTLevel.N5,
            is_admin=True
        )
        saved_admin = user_repo.save(admin)
        return saved_admin, db

    def test_get_admin_questions_list_success(self, app_client, temp_db, admin_user):
        """어드민 문제 목록 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            question1 = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="問題1",
                choices=["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                correct_answer="選択肢1",
                explanation="説明1",
                difficulty=1
            )
            question2 = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.GRAMMAR,
                question_text="問題2",
                choices=["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                correct_answer="選択肢2",
                explanation="説明2",
                difficulty=2
            )
            question_repo.save(question1)
            question_repo.save(question2)

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 어드민 문제 목록 조회
            response = app_client.get("/api/v1/admin/questions")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert isinstance(data["data"], list)
            assert len(data["data"]) >= 2

    def test_get_admin_questions_list_unauthorized(self, app_client, temp_db):
        """어드민 문제 목록 조회 - 인증되지 않은 사용자 테스트"""
        from backend.infrastructure.config.database import Database

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            db = Database(db_path=temp_db)
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 로그인하지 않고 어드민 문제 목록 조회 시도
            response = app_client.get("/api/v1/admin/questions")
            assert response.status_code == 401

    def test_create_admin_question_success(self, app_client, temp_db, admin_user):
        """어드민 문제 생성 성공 테스트"""
        from backend.infrastructure.config.database import Database

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 문제 생성
            response = app_client.post(
                "/api/v1/admin/questions",
                json={
                    "level": "N5",
                    "question_type": "vocabulary",
                    "question_text": "新しい問題",
                    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                    "correct_answer": "選択肢1",
                    "explanation": "説明",
                    "difficulty": 1
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert data["data"]["question_text"] == "新しい問題"
            assert data["data"]["level"] == "N5"

    def test_get_admin_question_by_id_success(self, app_client, temp_db, admin_user):
        """어드민 특정 문제 조회 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            question = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="問題",
                choices=["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                correct_answer="選択肢1",
                explanation="説明",
                difficulty=1
            )
            saved_question = question_repo.save(question)

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 특정 문제 조회
            response = app_client.get(f"/api/v1/admin/questions/{saved_question.id}")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            assert data["data"]["id"] == saved_question.id
            assert data["data"]["question_text"] == "問題"

    def test_update_admin_question_success(self, app_client, temp_db, admin_user):
        """어드민 문제 수정 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            question = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="問題",
                choices=["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                correct_answer="選択肢1",
                explanation="説明",
                difficulty=1
            )
            saved_question = question_repo.save(question)

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 문제 수정
            response = app_client.put(
                f"/api/v1/admin/questions/{saved_question.id}",
                json={
                    "question_text": "更新された問題",
                    "difficulty": 2
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert data["data"]["question_text"] == "更新された問題"
            assert data["data"]["difficulty"] == 2

    def test_delete_admin_question_success(self, app_client, temp_db, admin_user):
        """어드민 문제 삭제 성공 테스트"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.domain.entities.question import Question
        from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 문제 생성
            question_repo = SqliteQuestionRepository(db=db)
            question = Question(
                id=0,
                level=JLPTLevel.N5,
                question_type=QuestionType.VOCABULARY,
                question_text="問題",
                choices=["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                correct_answer="選択肢1",
                explanation="説明",
                difficulty=1
            )
            saved_question = question_repo.save(question)

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 문제 삭제
            response = app_client.delete(f"/api/v1/admin/questions/{saved_question.id}")
            assert response.status_code == 200
            data = response.json()
            assert "success" in data

            # 삭제 확인
            deleted_question = question_repo.find_by_id(saved_question.id)
            assert deleted_question is None

    def test_delete_admin_question_not_found(self, app_client, temp_db, admin_user):
        """어드민 문제 삭제 - 문제 없음 테스트"""
        from backend.infrastructure.config.database import Database

        admin, db = admin_user

        with patch('backend.presentation.controllers.admin.get_database') as mock_get_db, \
             patch('backend.presentation.controllers.auth.get_database') as mock_get_db_auth:
            mock_get_db.return_value = db
            mock_get_db_auth.return_value = db

            # 어드민 로그인
            login_response = app_client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com"}
            )
            assert login_response.status_code == 200

            # 존재하지 않는 문제 삭제
            response = app_client.delete("/api/v1/admin/questions/99999")
            assert response.status_code == 404

