"""
SQLite 기반 User Repository 구현
"""

from typing import List, Optional
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.user_mapper import UserMapper


class SqliteUserRepository:
    """SQLite 기반 User Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()

    def save(self, user: User) -> User:
        """사용자 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = UserMapper.to_dict(user)

            if user.id is None or user.id == 0:
                # 새 사용자 생성
                cursor = conn.execute("""
                    INSERT INTO users (email, username, target_level, current_level,
                                     total_tests_taken, study_streak, preferred_question_types,
                                     created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['email'], data['username'], data['target_level'], data['current_level'],
                    data['total_tests_taken'], data['study_streak'], data['preferred_question_types'],
                    data['created_at'], data['updated_at']
                ))

                # 생성된 ID를 사용자 객체에 설정
                user.id = cursor.lastrowid
            else:
                # 기존 사용자 업데이트
                conn.execute("""
                    UPDATE users
                    SET email = ?, username = ?, target_level = ?, current_level = ?,
                        total_tests_taken = ?, study_streak = ?, preferred_question_types = ?,
                        updated_at = ?
                    WHERE id = ?
                """, (
                    data['email'], data['username'], data['target_level'], data['current_level'],
                    data['total_tests_taken'], data['study_streak'], data['preferred_question_types'],
                    data['updated_at'], user.id
                ))

            conn.commit()
            return user

    def find_by_id(self, id: int) -> Optional[User]:
        """ID로 사용자 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM users WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return UserMapper.to_entity(row)
            return None

    def find_all(self) -> List[User]:
        """모든 사용자 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM users ORDER BY created_at DESC")
            rows = cursor.fetchall()

            return [UserMapper.to_entity(row) for row in rows]

    def delete(self, user: User) -> None:
        """사용자 삭제"""
        if user.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM users WHERE id = ?", (user.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM users WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()

            if row:
                return UserMapper.to_entity(row)
            return None

    def find_by_username(self, username: str) -> Optional[User]:
        """사용자명으로 사용자 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()

            if row:
                return UserMapper.to_entity(row)
            return None

    def exists_by_email(self, email: str) -> bool:
        """이메일 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM users WHERE email = ? LIMIT 1", (email,))
            return cursor.fetchone() is not None

    def exists_by_username(self, username: str) -> bool:
        """사용자명 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM users WHERE username = ? LIMIT 1", (username,))
            return cursor.fetchone() is not None
