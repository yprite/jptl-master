"""
Question 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import json
import sqlite3
from typing import Dict, Any
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class QuestionMapper:
    """Question 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> Question:
        """데이터베이스 행을 Question 엔티티로 변환"""
        choices: list[str] = []
        if row['choices']:
            try:
                choices = json.loads(row['choices'])
            except (json.JSONDecodeError, ValueError) as e:
                raise ValueError(f"Invalid choices JSON: {e}")

        # audio_url은 선택적 필드이므로 키가 없을 수 있음
        audio_url = None
        try:
            # sqlite3.Row나 MockRow 모두 처리
            if hasattr(row, 'keys') and 'audio_url' in row.keys():
                audio_url = row['audio_url']
            elif hasattr(row, '__getitem__'):
                try:
                    audio_url = row['audio_url']
                except (KeyError, IndexError):
                    pass
        except Exception:
            pass

        return Question(
            id=row['id'],
            level=JLPTLevel(row['level']),
            question_type=QuestionType(row['question_type']),
            question_text=row['question_text'],
            choices=choices,
            correct_answer=row['correct_answer'],
            explanation=row['explanation'],
            difficulty=row['difficulty'],
            audio_url=audio_url
        )

    @staticmethod
    def to_dict(question: Question) -> Dict[str, Any]:
        """Question 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'level': question.level.value,
            'question_type': question.question_type.value,
            'question_text': question.question_text,
            'choices': json.dumps(question.choices),
            'correct_answer': question.correct_answer,
            'explanation': question.explanation,
            'difficulty': question.difficulty,
            'audio_url': question.audio_url
        }
        return data

