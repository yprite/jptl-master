"""
SQLite 기반 UserVocabulary Repository 구현
"""

from typing import List, Optional
from datetime import date
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
            # 기존 테이블 확인
            cursor = conn.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='user_vocabulary'
            """)
            table_exists = cursor.fetchone() is not None
            
            if not table_exists:
                # 새 테이블 생성 (SRS 필드 포함)
                conn.execute("""
                    CREATE TABLE user_vocabulary (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        vocabulary_id INTEGER NOT NULL,
                        memorization_status TEXT NOT NULL DEFAULT 'not_memorized',
                        next_review_date DATE,
                        interval_days INTEGER DEFAULT 0,
                        ease_factor REAL DEFAULT 2.5,
                        review_count INTEGER DEFAULT 0,
                        last_review_date DATE,
                        consecutive_correct INTEGER DEFAULT 0,
                        consecutive_incorrect INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, vocabulary_id),
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id)
                    )
                """)
            else:
                # 기존 테이블에 SRS 필드 추가 (마이그레이션)
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN next_review_date DATE")
                except:
                    pass  # 이미 존재하는 경우 무시
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN interval_days INTEGER DEFAULT 0")
                except:
                    pass
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN ease_factor REAL DEFAULT 2.5")
                except:
                    pass
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN review_count INTEGER DEFAULT 0")
                except:
                    pass
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN last_review_date DATE")
                except:
                    pass
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN consecutive_correct INTEGER DEFAULT 0")
                except:
                    pass
                try:
                    conn.execute("ALTER TABLE user_vocabulary ADD COLUMN consecutive_incorrect INTEGER DEFAULT 0")
                except:
                    pass
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id 
                ON user_vocabulary(user_id)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_vocabulary_vocabulary_id 
                ON user_vocabulary(vocabulary_id)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_vocabulary_next_review_date 
                ON user_vocabulary(next_review_date)
            """)
            conn.commit()

    def save(self, user_vocabulary: UserVocabulary) -> UserVocabulary:
        """사용자별 단어 학습 상태 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = UserVocabularyMapper.to_dict(user_vocabulary)

            if user_vocabulary.id is None or user_vocabulary.id == 0:
                # 새 상태 생성
                cursor = conn.execute("""
                    INSERT INTO user_vocabulary (
                        user_id, vocabulary_id, memorization_status,
                        next_review_date, interval_days, ease_factor,
                        review_count, last_review_date,
                        consecutive_correct, consecutive_incorrect
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data['user_id'], data['vocabulary_id'], data['memorization_status'],
                    data['next_review_date'], data['interval_days'], data['ease_factor'],
                    data['review_count'], data['last_review_date'],
                    data['consecutive_correct'], data['consecutive_incorrect']
                ))
                user_vocabulary.id = cursor.lastrowid
            else:
                # 기존 상태 업데이트
                conn.execute("""
                    UPDATE user_vocabulary
                    SET memorization_status = ?,
                        next_review_date = ?,
                        interval_days = ?,
                        ease_factor = ?,
                        review_count = ?,
                        last_review_date = ?,
                        consecutive_correct = ?,
                        consecutive_incorrect = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (
                    data['memorization_status'],
                    data['next_review_date'],
                    data['interval_days'],
                    data['ease_factor'],
                    data['review_count'],
                    data['last_review_date'],
                    data['consecutive_correct'],
                    data['consecutive_incorrect'],
                    user_vocabulary.id
                ))

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

    def find_due_for_review(self, user_id: int, today: Optional[str] = None) -> List[UserVocabulary]:
        """
        오늘 복습해야 하는 단어 목록 조회
        
        Args:
            user_id: 사용자 ID
            today: 오늘 날짜 (YYYY-MM-DD 형식, 기본값: None이면 현재 날짜)
        
        Returns:
            복습해야 하는 단어 목록
        """
        from datetime import date
        if today is None:
            today = date.today().isoformat()
        
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM user_vocabulary
                WHERE user_id = ?
                AND (next_review_date IS NULL OR next_review_date <= ?)
                ORDER BY 
                    CASE WHEN next_review_date IS NULL THEN 0 ELSE 1 END,
                    next_review_date ASC,
                    consecutive_incorrect DESC,
                    review_count ASC
            """, (user_id, today))
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
                id=None,
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

