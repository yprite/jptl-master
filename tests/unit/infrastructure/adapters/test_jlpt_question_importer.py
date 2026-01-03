"""
JLPT 기출문제 임포트 어댑터 테스트
TDD 방식으로 JLPTQuestionImporter 검증
"""

import pytest
import tempfile
import json
import csv
from pathlib import Path
from backend.infrastructure.adapters.jlpt_question_importer import JLPTQuestionImporter
from backend.domain.entities.question import Question
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType, MemorizationStatus


class TestJLPTQuestionImporter:
    """JLPT 기출문제 임포트 어댑터 테스트"""
    
    def test_import_from_json(self):
        """JSON 파일에서 문제 임포트 테스트"""
        data = [
            {
                "level": "N5",
                "question_type": "vocabulary",
                "question_text": "テスト問題",
                "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
                "correct_answer": "選択肢1",
                "explanation": "説明",
                "difficulty": 2
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
            tmp_file = f.name
        
        try:
            questions = JLPTQuestionImporter.import_from_json(tmp_file)
            
            assert len(questions) == 1
            assert isinstance(questions[0], Question)
            assert questions[0].level == JLPTLevel.N5
            assert questions[0].question_type == QuestionType.VOCABULARY
            assert questions[0].question_text == "テスト問題"
        finally:
            Path(tmp_file).unlink()
    
    def test_import_from_csv(self):
        """CSV 파일에서 문제 임포트 테스트"""
        data = [
            {
                "level": "N5",
                "question_type": "vocabulary",
                "question_text": "テスト問題",
                "choices": "選択肢1,選択肢2,選択肢3,選択肢4",
                "correct_answer": "選択肢1",
                "explanation": "説明",
                "difficulty": "2",
                "audio_url": ""
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            tmp_file = f.name
        
        try:
            questions = JLPTQuestionImporter.import_from_csv(tmp_file)
            
            assert len(questions) == 1
            assert isinstance(questions[0], Question)
            assert questions[0].level == JLPTLevel.N5
            assert len(questions[0].choices) == 4
        finally:
            Path(tmp_file).unlink()
    
    def test_import_vocabulary_from_json(self):
        """JSON 파일에서 단어 임포트 테스트"""
        data = [
            {
                "word": "テスト",
                "reading": "てすと",
                "meaning": "테스트",
                "level": "N5",
                "memorization_status": "not_memorized",
                "example_sentence": "これはテストです。"
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
            tmp_file = f.name
        
        try:
            vocabularies = JLPTQuestionImporter.import_vocabulary_from_json(tmp_file)
            
            assert len(vocabularies) == 1
            assert isinstance(vocabularies[0], Vocabulary)
            assert vocabularies[0].word == "テスト"
            assert vocabularies[0].level == JLPTLevel.N5
        finally:
            Path(tmp_file).unlink()
    
    def test_import_vocabulary_from_csv(self):
        """CSV 파일에서 단어 임포트 테스트"""
        data = [
            {
                "word": "テスト",
                "reading": "てすと",
                "meaning": "테스트",
                "level": "N5",
                "memorization_status": "not_memorized",
                "example_sentence": "これはテストです。"
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            tmp_file = f.name
        
        try:
            vocabularies = JLPTQuestionImporter.import_vocabulary_from_csv(tmp_file)
            
            assert len(vocabularies) == 1
            assert isinstance(vocabularies[0], Vocabulary)
            assert vocabularies[0].word == "テスト"
        finally:
            Path(tmp_file).unlink()
    
    def test_import_from_json_file_not_found(self):
        """파일이 없을 때 예외 발생 테스트"""
        with pytest.raises(FileNotFoundError):
            JLPTQuestionImporter.import_from_json("nonexistent.json")
    
    def test_import_from_json_invalid_format(self):
        """잘못된 JSON 형식 테스트"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
            f.write("invalid json")
            tmp_file = f.name
        
        try:
            with pytest.raises((ValueError, json.JSONDecodeError)):
                JLPTQuestionImporter.import_from_json(tmp_file)
        finally:
            Path(tmp_file).unlink()

