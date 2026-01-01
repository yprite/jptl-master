"""
SQLite Vocabulary Repository 인프라 테스트
TDD 방식으로 VocabularyRepository 구현 검증
"""

import pytest
import os
import tempfile
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel


class TestSqliteVocabularyRepository:
    """SQLite Vocabulary Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_vocabulary_repository_save_and_find(self, temp_db):
        """VocabularyRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteVocabularyRepository(db=db)

        # 새 단어 생성
        vocabulary = Vocabulary(
            id=0,  # 새 단어이므로 ID는 0
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            example_sentence="ありがとうございます。"
        )

        # 저장
        saved_vocabulary = repo.save(vocabulary)
        assert saved_vocabulary.id is not None
        assert saved_vocabulary.id > 0

        # ID로 조회
        found_vocabulary = repo.find_by_id(saved_vocabulary.id)
        assert found_vocabulary is not None
        assert found_vocabulary.word == "ありがとう"
        assert found_vocabulary.reading == "ありがとう"
        assert found_vocabulary.meaning == "감사합니다"
        assert found_vocabulary.level == JLPTLevel.N5
        assert found_vocabulary.example_sentence == "ありがとうございます。"

    def test_vocabulary_table_creation(self, temp_db):
        """단어 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database
        from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository

        db = Database(db_path=temp_db)
        repo = SqliteVocabularyRepository(db=db)

        # 테이블 생성 트리거 (save 호출)
        vocabulary = Vocabulary(
            id=0,
            word="こんにちは",
            reading="こんにちは",
            meaning="안녕하세요",
            level=JLPTLevel.N5
        )
        repo.save(vocabulary)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='vocabulary'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'vocabulary'

            # 컬럼 구조 확인 (memorization_status는 더 이상 사용하지 않지만 호환성을 위해 존재)
            cursor.execute("PRAGMA table_info(vocabulary)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'word', 'reading', 'meaning', 'level',
                'memorization_status', 'example_sentence'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_vocabulary_mapper_to_entity(self):
        """VocabularyMapper의 to_entity 메서드 테스트"""
        from backend.infrastructure.repositories.vocabulary_mapper import VocabularyMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

            def keys(self):
                return self.data.keys()

        row = MockRow({
            'id': 1,
            'word': 'ありがとう',
            'reading': 'ありがとう',
            'meaning': '감사합니다',
            'level': 'N5',
            'memorization_status': 'not_memorized',
            'example_sentence': 'ありがとうございます。'
        })

        vocabulary = VocabularyMapper.to_entity(row)

        assert vocabulary.id == 1
        assert vocabulary.word == 'ありがとう'
        assert vocabulary.reading == 'ありがとう'
        assert vocabulary.meaning == '감사합니다'
        assert vocabulary.level == JLPTLevel.N5
        assert vocabulary.memorization_status == MemorizationStatus.NOT_MEMORIZED
        assert vocabulary.example_sentence == 'ありがとうございます。'

    def test_vocabulary_mapper_to_dict(self):
        """VocabularyMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.vocabulary_mapper import VocabularyMapper

        vocabulary = Vocabulary(
            id=1,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED,
            example_sentence="ありがとうございます。"
        )

        data = VocabularyMapper.to_dict(vocabulary)

        assert data['word'] == "ありがとう"
        assert data['reading'] == "ありがとう"
        assert data['meaning'] == "감사합니다"
        assert data['level'] == 'N5'
        assert data['memorization_status'] == 'not_memorized'
        assert data['example_sentence'] == "ありがとうございます。"

    def test_vocabulary_find_by_level(self, temp_db):
        """레벨별 단어 조회 테스트"""
        from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteVocabularyRepository(db=db)

        # N5 단어 생성
        vocab_n5_1 = Vocabulary(
            id=0,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )
        vocab_n5_2 = Vocabulary(
            id=0,
            word="こんにちは",
            reading="こんにちは",
            meaning="안녕하세요",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        # N4 단어 생성
        vocab_n4 = Vocabulary(
            id=0,
            word="おはよう",
            reading="おはよう",
            meaning="좋은 아침",
            level=JLPTLevel.N4,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        repo.save(vocab_n5_1)
        repo.save(vocab_n5_2)
        repo.save(vocab_n4)

        # N5 단어만 조회
        n5_vocabularies = repo.find_by_level(JLPTLevel.N5)
        assert len(n5_vocabularies) == 2
        assert all(v.level == JLPTLevel.N5 for v in n5_vocabularies)

    def test_vocabulary_find_all(self, temp_db):
        """모든 단어 조회 테스트"""
        from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteVocabularyRepository(db=db)

        # 여러 단어 생성
        vocab1 = Vocabulary(
            id=0,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )
        vocab2 = Vocabulary(
            id=0,
            word="こんにちは",
            reading="こんにちは",
            meaning="안녕하세요",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )

        repo.save(vocab1)
        repo.save(vocab2)

        # 모든 단어 조회
        all_vocabularies = repo.find_all()
        assert len(all_vocabularies) == 2

    def test_vocabulary_delete(self, temp_db):
        """단어 삭제 테스트"""
        from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteVocabularyRepository(db=db)

        # 단어 생성 및 저장
        vocabulary = Vocabulary(
            id=0,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5,
            memorization_status=MemorizationStatus.NOT_MEMORIZED
        )
        saved_vocab = repo.save(vocabulary)

        # 삭제
        repo.delete(saved_vocab)

        # 삭제 확인
        found_vocab = repo.find_by_id(saved_vocab.id)
        assert found_vocab is None

    def test_vocabulary_update(self, temp_db):
        """단어 업데이트 테스트"""
        from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteVocabularyRepository(db=db)

        # 단어 생성 및 저장
        vocabulary = Vocabulary(
            id=0,
            word="ありがとう",
            reading="ありがとう",
            meaning="감사합니다",
            level=JLPTLevel.N5
        )
        saved_vocab = repo.save(vocabulary)

        # 단어 정보 업데이트
        saved_vocab.word = "こんにちは"
        saved_vocab.meaning = "안녕하세요"
        updated_vocab = repo.save(saved_vocab)

        # 업데이트 확인
        found_vocab = repo.find_by_id(updated_vocab.id)
        assert found_vocab.word == "こんにちは"
        assert found_vocab.meaning == "안녕하세요"

