"""
SQLite Question Repository 인프라 테스트
TDD 방식으로 QuestionRepository 구현 검증
"""

import pytest
import os
import json
import tempfile
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class TestSqliteQuestionRepository:
    """SQLite Question Repository 단위 테스트"""

    @pytest.fixture
    def temp_db(self):
        """임시 데이터베이스 파일 생성"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        yield db_path
        # 테스트 후 정리
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_question_repository_save_and_find(self, temp_db):
        """QuestionRepository 저장 및 조회 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        # 임시 데이터베이스로 리포지토리 생성
        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 새 문제 생성
        question = Question(
            id=0,  # 새 문제이므로 ID는 0
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="これは何ですか？",
            choices=["これは", "それは", "あれは", "どれは"],
            correct_answer="これは",
            explanation="これは = 이것은",
            difficulty=1
        )

        # 저장
        saved_question = repo.save(question)
        assert saved_question.id is not None
        assert saved_question.id > 0

        # ID로 조회
        found_question = repo.find_by_id(saved_question.id)
        assert found_question is not None
        assert found_question.question_text == "これは何ですか？"
        assert found_question.level == JLPTLevel.N5
        assert found_question.question_type == QuestionType.VOCABULARY
        assert found_question.correct_answer == "これは"
        assert len(found_question.choices) == 4

    def test_question_table_creation(self, temp_db):
        """문제 테이블이 올바르게 생성되는지 확인"""
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)

        with db.get_connection() as conn:
            cursor = conn.cursor()

            # 테이블 존재 확인
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='questions'
            """)
            result = cursor.fetchone()
            assert result is not None
            assert result[0] == 'questions'

            # 컬럼 구조 확인
            cursor.execute("PRAGMA table_info(questions)")
            columns = cursor.fetchall()

            column_names = [col[1] for col in columns]
            expected_columns = [
                'id', 'level', 'question_type', 'question_text',
                'choices', 'correct_answer', 'explanation', 'difficulty'
            ]

            for col in expected_columns:
                assert col in column_names

    def test_question_mapper_to_entity(self):
        """QuestionMapper의 to_entity 메서드 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.question_mapper import QuestionMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

        row = MockRow({
            'id': 1,
            'level': 'N5',
            'question_type': 'vocabulary',
            'question_text': 'これは何ですか？',
            'choices': '["これは", "それは", "あれは", "どれは"]',
            'correct_answer': 'これは',
            'explanation': 'これは = 이것은',
            'difficulty': 1
        })

        question = QuestionMapper.to_entity(row)

        assert question.id == 1
        assert question.level == JLPTLevel.N5
        assert question.question_type == QuestionType.VOCABULARY
        assert question.question_text == 'これは何ですか？'
        assert question.correct_answer == 'これは'
        assert len(question.choices) == 4
        assert question.choices[0] == "これは"

    def test_question_mapper_to_dict(self):
        """QuestionMapper의 to_dict 메서드 테스트"""
        from backend.infrastructure.repositories.question_mapper import QuestionMapper

        question = Question(
            id=1,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="これは何ですか？",
            choices=["これは", "それは", "あれは", "どれは"],
            correct_answer="これは",
            explanation="これは = 이것은",
            difficulty=1
        )

        data = QuestionMapper.to_dict(question)

        assert data['question_text'] == "これは何ですか？"
        assert data['level'] == 'N5'
        assert data['question_type'] == 'vocabulary'
        assert data['correct_answer'] == "これは"
        # choices는 JSON 문자열로 저장됨
        import json
        choices = json.loads(data['choices'])
        assert 'これは' in choices
        assert data['difficulty'] == 1

    def test_question_repository_update(self, temp_db):
        """QuestionRepository 업데이트 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 문제 생성
        question = Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="これは何ですか？",
            choices=["これは", "それは"],
            correct_answer="これは",
            explanation="これは = 이것은",
            difficulty=1
        )
        saved_question = repo.save(question)

        # 문제 업데이트 (새 Question 객체 생성)
        updated_question = Question(
            id=saved_question.id,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="これは何ですか？ (수정됨)",
            choices=["これは", "それは", "あれは"],
            correct_answer="これは",
            explanation="これは = 이것은 (수정됨)",
            difficulty=2
        )
        updated = repo.save(updated_question)

        # 업데이트 확인
        found_question = repo.find_by_id(updated.id)
        assert found_question.question_text == "これは何ですか？ (수정됨)"
        assert found_question.difficulty == 2
        assert len(found_question.choices) == 3

    def test_question_repository_find_all(self, temp_db):
        """QuestionRepository find_all 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 여러 문제 생성
        q1 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="E1", difficulty=1)
        q2 = Question(id=0, level=JLPTLevel.N4, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="A",
                    explanation="E2", difficulty=2)
        q3 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.READING,
                    question_text="Q3", choices=["A", "B"], correct_answer="A",
                    explanation="E3", difficulty=1)

        repo.save(q1)
        repo.save(q2)
        repo.save(q3)

        # 모든 문제 조회
        all_questions = repo.find_all()
        assert len(all_questions) == 3

    def test_question_repository_delete(self, temp_db):
        """QuestionRepository delete 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 문제 생성
        question = Question(
            id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
            question_text="Q1", choices=["A", "B"], correct_answer="A",
            explanation="E1", difficulty=1
        )
        saved_question = repo.save(question)

        # 삭제
        repo.delete(saved_question)

        # 삭제 확인
        found_question = repo.find_by_id(saved_question.id)
        assert found_question is None

    def test_question_repository_exists_by_id(self, temp_db):
        """QuestionRepository exists_by_id 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 문제 생성
        question = Question(
            id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
            question_text="Q1", choices=["A", "B"], correct_answer="A",
            explanation="E1", difficulty=1
        )
        saved_question = repo.save(question)

        # 존재 확인
        assert repo.exists_by_id(saved_question.id) is True
        assert repo.exists_by_id(999) is False

    def test_question_repository_find_by_level(self, temp_db):
        """QuestionRepository find_by_level 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 여러 레벨의 문제 생성
        q1 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="E1", difficulty=1)
        q2 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="A",
                    explanation="E2", difficulty=1)
        q3 = Question(id=0, level=JLPTLevel.N4, question_type=QuestionType.VOCABULARY,
                    question_text="Q3", choices=["A", "B"], correct_answer="A",
                    explanation="E3", difficulty=2)

        repo.save(q1)
        repo.save(q2)
        repo.save(q3)

        # N5 레벨 문제만 조회
        n5_questions = repo.find_by_level(JLPTLevel.N5)
        assert len(n5_questions) == 2
        assert all(q.level == JLPTLevel.N5 for q in n5_questions)

    def test_question_repository_find_by_type(self, temp_db):
        """QuestionRepository find_by_type 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 여러 유형의 문제 생성
        q1 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="E1", difficulty=1)
        q2 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="A",
                    explanation="E2", difficulty=1)
        q3 = Question(id=0, level=JLPTLevel.N4, question_type=QuestionType.VOCABULARY,
                    question_text="Q3", choices=["A", "B"], correct_answer="A",
                    explanation="E3", difficulty=2)

        repo.save(q1)
        repo.save(q2)
        repo.save(q3)

        # VOCABULARY 유형 문제만 조회
        vocab_questions = repo.find_by_type(QuestionType.VOCABULARY)
        assert len(vocab_questions) == 2
        assert all(q.question_type == QuestionType.VOCABULARY for q in vocab_questions)

    def test_question_repository_find_by_level_and_type(self, temp_db):
        """QuestionRepository find_by_level_and_type 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 여러 문제 생성
        q1 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                    question_text="Q1", choices=["A", "B"], correct_answer="A",
                    explanation="E1", difficulty=1)
        q2 = Question(id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                    question_text="Q2", choices=["A", "B"], correct_answer="A",
                    explanation="E2", difficulty=1)
        q3 = Question(id=0, level=JLPTLevel.N4, question_type=QuestionType.VOCABULARY,
                    question_text="Q3", choices=["A", "B"], correct_answer="A",
                    explanation="E3", difficulty=2)

        repo.save(q1)
        repo.save(q2)
        repo.save(q3)

        # N5 + VOCABULARY 조회
        questions = repo.find_by_level_and_type(JLPTLevel.N5, QuestionType.VOCABULARY)
        assert len(questions) == 1
        assert questions[0].level == JLPTLevel.N5
        assert questions[0].question_type == QuestionType.VOCABULARY

    def test_question_repository_find_random_by_level(self, temp_db):
        """QuestionRepository find_random_by_level 기능 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # N5 레벨 문제 10개 생성
        for i in range(10):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                question_text=f"Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        # 랜덤으로 5개 조회
        random_questions = repo.find_random_by_level(JLPTLevel.N5, limit=5)
        assert len(random_questions) == 5
        assert all(q.level == JLPTLevel.N5 for q in random_questions)

        # limit보다 적은 경우
        random_questions = repo.find_random_by_level(JLPTLevel.N5, limit=20)
        assert len(random_questions) == 10  # 전체 개수만큼 반환

    def test_question_mapper_edge_cases(self):
        """QuestionMapper edge case 테스트"""
        import sqlite3
        from backend.infrastructure.repositories.question_mapper import QuestionMapper

        # 모의 Row 객체 생성
        class MockRow:
            def __init__(self, data):
                self.data = data

            def __getitem__(self, key):
                return self.data[key]

        # 잘못된 JSON 형식의 choices
        row_invalid_json = MockRow({
            'id': 1,
            'level': 'N5',
            'question_type': 'vocabulary',
            'question_text': 'Q1',
            'choices': 'invalid json',
            'correct_answer': 'A',
            'explanation': 'E1',
            'difficulty': 1
        })

        # 예외가 발생해야 함
        with pytest.raises((ValueError, json.JSONDecodeError)):
            QuestionMapper.to_entity(row_invalid_json)

    def test_question_repository_find_random_by_level_and_types_single_type(self, temp_db):
        """QuestionRepository find_random_by_level_and_types 단일 유형 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # N5 레벨의 여러 유형 문제 생성
        for i in range(5):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                question_text=f"Vocab Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        for i in range(5):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                question_text=f"Grammar Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        # VOCABULARY 유형만 랜덤으로 3개 조회
        questions = repo.find_random_by_level_and_types(
            JLPTLevel.N5, [QuestionType.VOCABULARY], limit=3
        )
        assert len(questions) == 3
        assert all(q.level == JLPTLevel.N5 for q in questions)
        assert all(q.question_type == QuestionType.VOCABULARY for q in questions)

    def test_question_repository_find_random_by_level_and_types_multiple_types(self, temp_db):
        """QuestionRepository find_random_by_level_and_types 다중 유형 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # N5 레벨의 여러 유형 문제 생성
        for i in range(5):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                question_text=f"Vocab Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        for i in range(5):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.GRAMMAR,
                question_text=f"Grammar Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        for i in range(5):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.READING,
                question_text=f"Reading Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        # VOCABULARY와 GRAMMAR 유형만 랜덤으로 8개 조회
        questions = repo.find_random_by_level_and_types(
            JLPTLevel.N5, [QuestionType.VOCABULARY, QuestionType.GRAMMAR], limit=8
        )
        assert len(questions) == 8
        assert all(q.level == JLPTLevel.N5 for q in questions)
        assert all(q.question_type in [QuestionType.VOCABULARY, QuestionType.GRAMMAR] for q in questions)

    def test_question_repository_find_random_by_level_and_types_all_types(self, temp_db):
        """QuestionRepository find_random_by_level_and_types 모든 유형 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # N5 레벨의 모든 유형 문제 생성
        types = [QuestionType.VOCABULARY, QuestionType.GRAMMAR, QuestionType.READING, QuestionType.LISTENING]
        for q_type in types:
            for i in range(3):
                q = Question(
                    id=0, level=JLPTLevel.N5, question_type=q_type,
                    question_text=f"{q_type.value} Q{i+1}", choices=["A", "B"], correct_answer="A",
                    explanation=f"E{i+1}", difficulty=1
                )
                repo.save(q)

        # 모든 유형에서 랜덤으로 10개 조회
        questions = repo.find_random_by_level_and_types(
            JLPTLevel.N5, types, limit=10
        )
        assert len(questions) == 10
        assert all(q.level == JLPTLevel.N5 for q in questions)
        assert all(q.question_type in types for q in questions)

    def test_question_repository_find_random_by_level_and_types_insufficient_questions(self, temp_db):
        """QuestionRepository find_random_by_level_and_types 문제 부족 시 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # N5 레벨의 VOCABULARY 유형 문제 3개만 생성
        for i in range(3):
            q = Question(
                id=0, level=JLPTLevel.N5, question_type=QuestionType.VOCABULARY,
                question_text=f"Vocab Q{i+1}", choices=["A", "B"], correct_answer="A",
                explanation=f"E{i+1}", difficulty=1
            )
            repo.save(q)

        # 10개를 요청하지만 3개만 반환
        questions = repo.find_random_by_level_and_types(
            JLPTLevel.N5, [QuestionType.VOCABULARY], limit=10
        )
        assert len(questions) == 3
        assert all(q.question_type == QuestionType.VOCABULARY for q in questions)

    def test_question_repository_find_random_by_level_and_types_empty_result(self, temp_db):
        """QuestionRepository find_random_by_level_and_types 결과 없음 테스트"""
        from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
        from backend.infrastructure.config.database import Database

        db = Database(db_path=temp_db)
        repo = SqliteQuestionRepository(db=db)

        # 다른 레벨의 문제만 생성
        q = Question(
            id=0, level=JLPTLevel.N4, question_type=QuestionType.VOCABULARY,
            question_text="Q1", choices=["A", "B"], correct_answer="A",
            explanation="E1", difficulty=1
        )
        repo.save(q)

        # N5 레벨의 VOCABULARY 유형 조회 (결과 없음)
        questions = repo.find_random_by_level_and_types(
            JLPTLevel.N5, [QuestionType.VOCABULARY], limit=10
        )
        assert len(questions) == 0

