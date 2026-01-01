"""
SQLite 기반 UserVocabulary Repository 구현
"""

from typing import List, Optional
from backend.domain.entities.user_vocabulary import UserVocabulary
from backend.domain.value_objects.jlpt import MemorizationStatus
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.user_vocabulary_mapper import UserVocabularyMapper


class SqliteUserVocabularyRepository:
    """SQLite 기반 UserVocabulary Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """user_vocabulary 테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_vocabulary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    vocabulary_id INTEGER NOT NULL,
                    memorization_status TEXT NOT NULL DEFAULT 'not_memorized',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, vocabulary_id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id)
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id 
                ON user_vocabulary(user_id)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_vocabulary_vocabulary_id 
                ON user_vocabulary(vocabulary_id)
            """)
            conn.commit()

    def save(self, user_vocabulary: UserVocabulary) -> UserVocabulary:
        """사용자별 단어 학습 상태 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = UserVocabularyMapper.to_dict(user_vocabulary)

            if user_vocabulary.id is None or user_vocabulary.id == 0:
                # 새 상태 생성
                cursor = conn.execute("""
                    INSERT INTO user_vocabulary (user_id, vocabulary_id, memorization_status)
                    VALUES (?, ?, ?)
                """, (
                    data['user_id'], data['vocabulary_id'], data['memorization_status']
                ))
                user_vocabulary.id = cursor.lastrowid
            else:
                # 기존 상태 업데이트
                conn.execute("""
                    UPDATE user_vocabulary
                    SET memorization_status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (data['memorization_status'], user_vocabulary.id))

            conn.commit()
            return user_vocabulary

    def find_by_user_and_vocabulary(
        self, user_id: int, vocabulary_id: int
    ) -> Optional[UserVocabulary]:
        """사용자 ID와 단어 ID로 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM user_vocabulary WHERE user_id = ? AND vocabulary_id = ?",
                (user_id, vocabulary_id)
            )
            row = cursor.fetchone()

            if row:
                return UserVocabularyMapper.to_entity(row)
            return None

    def find_by_user_id(self, user_id: int) -> List[UserVocabulary]:
        """사용자 ID로 모든 단어 학습 상태 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM user_vocabulary WHERE user_id = ? ORDER BY vocabulary_id",
                (user_id,)
            )
            rows = cursor.fetchall()

            return [UserVocabularyMapper.to_entity(row) for row in rows]

    def find_by_vocabulary_id(self, vocabulary_id: int) -> List[UserVocabulary]:
        """단어 ID로 모든 사용자의 학습 상태 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM user_vocabulary WHERE vocabulary_id = ? ORDER BY user_id",
                (vocabulary_id,)
            )
            rows = cursor.fetchall()

            return [UserVocabularyMapper.to_entity(row) for row in rows]

    def find_by_user_and_status(
        self, user_id: int, status: MemorizationStatus
    ) -> List[UserVocabulary]:
        """사용자 ID와 상태로 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM user_vocabulary WHERE user_id = ? AND memorization_status = ? ORDER BY vocabulary_id",
                (user_id, status.value)
            )
            rows = cursor.fetchall()

            return [UserVocabularyMapper.to_entity(row) for row in rows]

    def upsert(
        self, user_id: int, vocabulary_id: int, status: MemorizationStatus
    ) -> UserVocabulary:
        """사용자별 단어 학습 상태를 저장하거나 업데이트"""
        existing = self.find_by_user_and_vocabulary(user_id, vocabulary_id)
        
        if existing:
            existing.update_memorization_status(status)
            return self.save(existing)
        else:
            new_user_vocab = UserVocabulary(
                id=0,
                user_id=user_id,
                vocabulary_id=vocabulary_id,
                memorization_status=status
            )
            return self.save(new_user_vocab)

    def delete(self, user_vocabulary: UserVocabulary) -> None:
        """사용자별 단어 학습 상태 삭제"""
        if user_vocabulary.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute(
                "DELETE FROM user_vocabulary WHERE id = ?",
                (user_vocabulary.id,)
            )
            conn.commit()

