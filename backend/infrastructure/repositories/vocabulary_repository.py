"""
SQLite 기반 Vocabulary Repository 구현
"""

from typing import List, Optional
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.vocabulary_mapper import VocabularyMapper


class SqliteVocabularyRepository:
    """SQLite 기반 Vocabulary Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """vocabulary 테이블이 존재하는지 확인하고 없으면 생성"""
        with self.db.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS vocabulary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    word TEXT NOT NULL,
                    reading TEXT NOT NULL,
                    meaning TEXT NOT NULL,
                    level TEXT NOT NULL,
                    memorization_status TEXT NOT NULL DEFAULT 'not_memorized',
                    example_sentence TEXT
                )
            """)
            conn.commit()

    def save(self, vocabulary: Vocabulary) -> Vocabulary:
        """단어 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = VocabularyMapper.to_dict(vocabulary)

            if vocabulary.id is None or vocabulary.id == 0:
                # 새 단어 생성
                cursor = conn.execute("""
                    INSERT INTO vocabulary (word, reading, meaning, level, memorization_status, example_sentence)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    data['word'], data['reading'], data['meaning'],
                    data['level'], data['memorization_status'], data.get('example_sentence')
                ))

                # 생성된 ID를 단어 객체에 설정
                vocabulary.id = cursor.lastrowid
            else:
                # 기존 단어 업데이트
                conn.execute("""
                    UPDATE vocabulary
                    SET word = ?, reading = ?, meaning = ?, level = ?,
                        memorization_status = ?, example_sentence = ?
                    WHERE id = ?
                """, (
                    data['word'], data['reading'], data['meaning'],
                    data['level'], data['memorization_status'],
                    data.get('example_sentence'), vocabulary.id
                ))

            conn.commit()
            return vocabulary

    def find_by_id(self, id: int) -> Optional[Vocabulary]:
        """ID로 단어 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM vocabulary WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return VocabularyMapper.to_entity(row)
            return None

    def find_all(self) -> List[Vocabulary]:
        """모든 단어 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM vocabulary ORDER BY id DESC")
            rows = cursor.fetchall()

            return [VocabularyMapper.to_entity(row) for row in rows]

    def delete(self, vocabulary: Vocabulary) -> None:
        """단어 삭제"""
        if vocabulary.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM vocabulary WHERE id = ?", (vocabulary.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM vocabulary WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

    def find_by_level(self, level: JLPTLevel) -> List[Vocabulary]:
        """레벨별 단어 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM vocabulary WHERE level = ? ORDER BY id DESC", (level.value,))
            rows = cursor.fetchall()

            return [VocabularyMapper.to_entity(row) for row in rows]

    def find_by_status(self, status: str) -> List[Vocabulary]:
        """암기 상태별 단어 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM vocabulary WHERE memorization_status = ? ORDER BY id DESC",
                (status,)
            )
            rows = cursor.fetchall()

            return [VocabularyMapper.to_entity(row) for row in rows]

    def search_by_word(self, word: str) -> List[Vocabulary]:
        """단어로 검색 (부분 일치)"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM vocabulary WHERE word LIKE ? ORDER BY id DESC",
                (f"%{word}%",)
            )
            rows = cursor.fetchall()

            return [VocabularyMapper.to_entity(row) for row in rows]

    def search_by_meaning(self, meaning: str) -> List[Vocabulary]:
        """의미로 검색 (부분 일치)"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM vocabulary WHERE meaning LIKE ? ORDER BY id DESC",
                (f"%{meaning}%",)
            )
            rows = cursor.fetchall()

            return [VocabularyMapper.to_entity(row) for row in rows]

