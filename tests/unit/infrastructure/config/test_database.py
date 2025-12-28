"""
Database 인프라 테스트
TDD 방식으로 Database 클래스 구현 검증
"""

import pytest
import os
import tempfile
import sqlite3


class TestDatabase:
    """Database 클래스 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_database_initialization(self, temp_db):
        """Database 초기화 테스트"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        assert db.db_path == temp_db

    def test_database_connection_context_manager(self, temp_db):
        """데이터베이스 연결 컨텍스트 매니저 테스트"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            assert isinstance(conn, sqlite3.Connection)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            assert result[0] == 1

    def test_database_table_creation(self, temp_db):
        """데이터베이스 테이블 생성 테스트"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 모든 테이블 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table'
            """)
            tables = [row[0] for row in cursor.fetchall()]

            expected_tables = ['users', 'questions', 'tests', 'test_attempts', 'results']
            for table in expected_tables:
                assert table in tables

    def test_database_get_database_singleton(self):
        """get_database 싱글톤 패턴 테스트"""
        from backend.infrastructure.config.database import get_database

        # 싱글톤 인스턴스 확인
        db1 = get_database()
        db2 = get_database()
        assert db1 is db2

    def test_database_ensure_directory_exists(self):
        """데이터베이스 디렉토리 생성 테스트"""
        import tempfile
        import os
        from backend.infrastructure.config.database import Database

        # 임시 디렉토리 생성
        temp_dir = tempfile.mkdtemp()
        db_path = os.path.join(temp_dir, "subdir", "test.db")

        try:
            db = Database(db_path=db_path)
            # 디렉토리가 생성되었는지 확인
            assert os.path.exists(os.path.dirname(db_path))
        finally:
            # 정리
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)

