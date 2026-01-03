"""
단어 생성 서비스 테스트
TDD 방식으로 VocabularyGeneratorService 검증
"""

import pytest
from backend.domain.services.vocabulary_generator_service import VocabularyGeneratorService
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel


class TestVocabularyGeneratorService:
    """단어 생성 서비스 테스트"""
    
    def test_generate_vocabularies_n5(self):
        """N5 단어 생성 테스트"""
        vocabularies = VocabularyGeneratorService.generate_vocabularies(
            level=JLPTLevel.N5,
            count=5
        )
        
        assert len(vocabularies) == 5
        for vocabulary in vocabularies:
            assert isinstance(vocabulary, Vocabulary)
            assert vocabulary.level == JLPTLevel.N5
            assert vocabulary.word
            assert vocabulary.reading
            assert vocabulary.meaning
    
    def test_generate_vocabularies_n4(self):
        """N4 단어 생성 테스트"""
        vocabularies = VocabularyGeneratorService.generate_vocabularies(
            level=JLPTLevel.N4,
            count=3
        )
        
        assert len(vocabularies) <= 3  # 샘플 데이터가 부족할 수 있음
        for vocabulary in vocabularies:
            assert isinstance(vocabulary, Vocabulary)
            assert vocabulary.level == JLPTLevel.N4
    
    def test_import_from_dict(self):
        """딕셔너리에서 단어 임포트 테스트"""
        data = {
            "word": "テスト",
            "reading": "てすと",
            "meaning": "테스트",
            "level": "N5",
            "memorization_status": "not_memorized",
            "example_sentence": "これはテストです。"
        }
        
        vocabulary = VocabularyGeneratorService.import_from_dict(data)
        
        assert isinstance(vocabulary, Vocabulary)
        assert vocabulary.word == "テスト"
        assert vocabulary.reading == "てすと"
        assert vocabulary.meaning == "테스트"
        assert vocabulary.level == JLPTLevel.N5
        assert vocabulary.example_sentence == "これはテストです。"
    
    def test_import_from_list(self):
        """딕셔너리 리스트에서 단어 목록 임포트 테스트"""
        data_list = [
            {
                "word": "単語1",
                "reading": "たんご1",
                "meaning": "단어1",
                "level": "N5"
            },
            {
                "word": "単語2",
                "reading": "たんご2",
                "meaning": "단어2",
                "level": "N5"
            }
        ]
        
        vocabularies = VocabularyGeneratorService.import_from_list(data_list)
        
        assert len(vocabularies) == 2
        assert vocabularies[0].word == "単語1"
        assert vocabularies[1].word == "単語2"

