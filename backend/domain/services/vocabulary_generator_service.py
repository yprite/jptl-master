"""
단어 생성 도메인 서비스
JLPT 단어를 대량 생성하는 비즈니스 로직
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel


class VocabularyGeneratorService:
    """
    단어 생성 도메인 서비스
    
    JLPT 단어를 대량 생성하는 비즈니스 로직을 담당합니다.
    JSON 파일에서 샘플 데이터를 로드하여 사용합니다.
    """
    
    _vocabulary_samples = None
    
    @classmethod
    def _get_data_dir(cls) -> Path:
        """데이터 디렉토리 경로 반환"""
        # backend/domain/services/vocabulary_generator_service.py
        # -> backend/domain/services/ -> backend/domain/ -> backend/ -> 프로젝트 루트
        return Path(__file__).parent.parent.parent.parent / "data"
    
    @classmethod
    def _load_vocabulary_samples(cls) -> Dict[JLPTLevel, List[Dict]]:
        """JSON 파일에서 단어 샘플 로드"""
        if cls._vocabulary_samples is None:
            data_file = cls._get_data_dir() / "sample_vocabulary.json"
            
            if not data_file.exists():
                # 파일이 없으면 빈 딕셔너리 반환
                cls._vocabulary_samples = {}
                return cls._vocabulary_samples
            
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cls._vocabulary_samples = {}
            for level_str, words in data.items():
                try:
                    level = JLPTLevel(level_str)
                    cls._vocabulary_samples[level] = words
                except ValueError:
                    continue
        
        return cls._vocabulary_samples
    
    @staticmethod
    def generate_vocabularies(
        level: JLPTLevel,
        count: int = 10
    ) -> List[Vocabulary]:
        """
        단어 생성
        
        Args:
            level: JLPT 레벨
            count: 생성할 단어 수
            
        Returns:
            생성된 단어 목록
        """
        vocab_list = VocabularyGeneratorService._load_vocabulary_samples().get(level, [])
        
        if not vocab_list:
            return []
        
        # 요청한 개수만큼 단어 생성
        selected_vocabs = vocab_list[:count] if count <= len(vocab_list) else vocab_list
        
        vocabularies = []
        for vocab_data in selected_vocabs:
            vocabulary = Vocabulary(
                id=0,
                word=vocab_data["word"],
                reading=vocab_data["reading"],
                meaning=vocab_data["meaning"],
                level=level,
                example_sentence=vocab_data.get("example")
            )
            vocabularies.append(vocabulary)
        
        return vocabularies
    
    @staticmethod
    def import_from_dict(data: Dict) -> Vocabulary:
        """
        딕셔너리에서 단어 임포트
        
        Args:
            data: 단어 데이터 딕셔너리
            
        Returns:
            Vocabulary 엔티티
        """
        return Vocabulary(
            id=0,
            word=data.get("word", ""),
            reading=data.get("reading", ""),
            meaning=data.get("meaning", ""),
            level=JLPTLevel(data.get("level", "N5")),
            example_sentence=data.get("example_sentence")
        )
    
    @staticmethod
    def import_from_list(data_list: List[Dict]) -> List[Vocabulary]:
        """
        딕셔너리 리스트에서 단어 목록 임포트
        
        Args:
            data_list: 단어 데이터 딕셔너리 리스트
            
        Returns:
            Vocabulary 엔티티 리스트
        """
        return [
            VocabularyGeneratorService.import_from_dict(data)
            for data in data_list
        ]

