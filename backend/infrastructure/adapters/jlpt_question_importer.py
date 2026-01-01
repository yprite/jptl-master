"""
JLPT 기출문제 임포트 어댑터
CSV, JSON 파일에서 기출문제를 임포트하는 기능
"""

import csv
import json
from typing import List, Dict, Optional
from pathlib import Path
from backend.domain.entities.question import Question
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType, MemorizationStatus


class JLPTQuestionImporter:
    """
    JLPT 기출문제 임포트 어댑터
    
    CSV, JSON 파일에서 기출문제를 읽어서 Question 엔티티로 변환합니다.
    """
    
    @staticmethod
    def import_from_json(file_path: str) -> List[Question]:
        """
        JSON 파일에서 문제 임포트
        
        Args:
            file_path: JSON 파일 경로
            
        Returns:
            Question 엔티티 리스트
            
        Raises:
            FileNotFoundError: 파일이 없을 때
            ValueError: JSON 형식이 잘못되었을 때
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            raise ValueError("JSON 파일은 문제 배열이어야 합니다")
        
        questions = []
        for item in data:
            try:
                question = Question(
                    id=0,
                    level=JLPTLevel(item.get("level", "N5")),
                    question_type=QuestionType(item.get("question_type", "vocabulary")),
                    question_text=item.get("question_text", ""),
                    choices=item.get("choices", []),
                    correct_answer=item.get("correct_answer", ""),
                    explanation=item.get("explanation", ""),
                    difficulty=item.get("difficulty", 1),
                    audio_url=item.get("audio_url")
                )
                questions.append(question)
            except Exception as e:
                # 개별 문제 파싱 실패해도 계속 진행
                print(f"문제 파싱 실패: {str(e)}")
                continue
        
        return questions
    
    @staticmethod
    def import_from_csv(file_path: str) -> List[Question]:
        """
        CSV 파일에서 문제 임포트
        
        CSV 형식:
        level,question_type,question_text,choices,correct_answer,explanation,difficulty,audio_url
        N5,vocabulary,「こんにちは」の意味は何ですか？,"안녕하세요,감사합니다,실례합니다,죄송합니다",안녕하세요,説明,1,
        
        Args:
            file_path: CSV 파일 경로
            
        Returns:
            Question 엔티티 리스트
            
        Raises:
            FileNotFoundError: 파일이 없을 때
            ValueError: CSV 형식이 잘못되었을 때
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        questions = []
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # choices는 쉼표로 구분된 문자열
                    choices_str = row.get("choices", "")
                    choices = [c.strip() for c in choices_str.split(",")] if choices_str else []
                    
                    question = Question(
                        id=0,
                        level=JLPTLevel(row.get("level", "N5")),
                        question_type=QuestionType(row.get("question_type", "vocabulary")),
                        question_text=row.get("question_text", ""),
                        choices=choices,
                        correct_answer=row.get("correct_answer", ""),
                        explanation=row.get("explanation", ""),
                        difficulty=int(row.get("difficulty", 1)),
                        audio_url=row.get("audio_url") if row.get("audio_url") else None
                    )
                    questions.append(question)
                except Exception as e:
                    # 개별 문제 파싱 실패해도 계속 진행
                    print(f"문제 파싱 실패: {str(e)}")
                    continue
        
        return questions
    
    @staticmethod
    def import_vocabulary_from_json(file_path: str) -> List[Vocabulary]:
        """
        JSON 파일에서 단어 임포트
        
        Args:
            file_path: JSON 파일 경로
            
        Returns:
            Vocabulary 엔티티 리스트
            
        Raises:
            FileNotFoundError: 파일이 없을 때
            ValueError: JSON 형식이 잘못되었을 때
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            raise ValueError("JSON 파일은 단어 배열이어야 합니다")
        
        vocabularies = []
        for item in data:
            try:
                vocabulary = Vocabulary(
                    id=0,
                    word=item.get("word", ""),
                    reading=item.get("reading", ""),
                    meaning=item.get("meaning", ""),
                    level=JLPTLevel(item.get("level", "N5")),
                    memorization_status=MemorizationStatus(item.get("memorization_status", "not_memorized")),
                    example_sentence=item.get("example_sentence")
                )
                vocabularies.append(vocabulary)
            except Exception as e:
                # 개별 단어 파싱 실패해도 계속 진행
                print(f"단어 파싱 실패: {str(e)}")
                continue
        
        return vocabularies
    
    @staticmethod
    def import_vocabulary_from_csv(file_path: str) -> List[Vocabulary]:
        """
        CSV 파일에서 단어 임포트
        
        CSV 형식:
        word,reading,meaning,level,example_sentence
        こんにちは,こんにちは,안녕하세요,N5,こんにちは、元気ですか？
        
        Args:
            file_path: CSV 파일 경로
            
        Returns:
            Vocabulary 엔티티 리스트
            
        Raises:
            FileNotFoundError: 파일이 없을 때
            ValueError: CSV 형식이 잘못되었을 때
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        vocabularies = []
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    vocabulary = Vocabulary(
                        id=0,
                        word=row.get("word", ""),
                        reading=row.get("reading", ""),
                        meaning=row.get("meaning", ""),
                        level=JLPTLevel(row.get("level", "N5")),
                        memorization_status=MemorizationStatus(row.get("memorization_status", "not_memorized")),
                        example_sentence=row.get("example_sentence") if row.get("example_sentence") else None
                    )
                    vocabularies.append(vocabulary)
                except Exception as e:
                    # 개별 단어 파싱 실패해도 계속 진행
                    print(f"단어 파싱 실패: {str(e)}")
                    continue
        
        return vocabularies

