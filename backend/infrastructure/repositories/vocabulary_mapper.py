"""
Vocabulary 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import sqlite3
from typing import Dict, Any
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel


class VocabularyMapper:
    """Vocabulary 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> Vocabulary:
        """데이터베이스 행을 Vocabulary 엔티티로 변환"""
        # example_sentence는 선택적 필드이므로 키가 없을 수 있음
        example_sentence = None
        try:
            # sqlite3.Row나 MockRow 모두 처리
            if hasattr(row, 'keys') and 'example_sentence' in row.keys():
                example_sentence = row['example_sentence']
            elif hasattr(row, '__getitem__'):
                try:
                    example_sentence = row['example_sentence']
                except (KeyError, IndexError):
                    pass
        except Exception:
            pass

        return Vocabulary(
            id=row['id'],
            word=row['word'],
            reading=row['reading'],
            meaning=row['meaning'],
            level=JLPTLevel(row['level']),
            example_sentence=example_sentence
        )

    @staticmethod
    def to_dict(vocabulary: Vocabulary) -> Dict[str, Any]:
        """Vocabulary 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'word': vocabulary.word,
            'reading': vocabulary.reading,
            'meaning': vocabulary.meaning,
            'level': vocabulary.level.value,
            'example_sentence': vocabulary.example_sentence
        }
        return data

