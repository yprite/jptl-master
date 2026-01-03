"""
문제 생성 도메인 서비스
JLPT 문제를 대량 생성하는 비즈니스 로직
"""

import random
import json
from pathlib import Path
from typing import List, Dict, Optional
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class QuestionGeneratorService:
    """
    문제 생성 도메인 서비스
    
    JLPT 문제를 대량 생성하는 비즈니스 로직을 담당합니다.
    JSON 파일에서 샘플 데이터를 로드하여 사용합니다.
    """
    
    _vocabulary_samples = None
    _grammar_patterns = None
    _reading_questions = None
    _listening_questions = None
    
    @classmethod
    def _get_data_dir(cls) -> Path:
        """데이터 디렉토리 경로 반환"""
        # backend/domain/services/question_generator_service.py
        # -> backend/domain/services/ -> backend/domain/ -> backend/ -> 프로젝트 루트
        return Path(__file__).parent.parent.parent.parent / "data"
    
    @classmethod
    def _load_vocabulary_samples(cls) -> Dict[JLPTLevel, List[Dict]]:
        """JSON 파일에서 어휘 샘플 로드"""
        if cls._vocabulary_samples is None:
            data_file = cls._get_data_dir() / "sample_vocabulary_for_questions.json"
            
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
    
    @classmethod
    def _load_grammar_patterns(cls) -> Dict[JLPTLevel, List[Dict]]:
        """JSON 파일에서 문법 패턴 로드"""
        if cls._grammar_patterns is None:
            data_file = cls._get_data_dir() / "sample_grammar_patterns.json"
            
            if not data_file.exists():
                # 파일이 없으면 빈 딕셔너리 반환
                cls._grammar_patterns = {}
                return cls._grammar_patterns
            
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cls._grammar_patterns = {}
            for level_str, patterns in data.items():
                try:
                    level = JLPTLevel(level_str)
                    cls._grammar_patterns[level] = patterns
                except ValueError:
                    continue
        
        return cls._grammar_patterns
    
    @classmethod
    def _load_reading_questions(cls) -> Dict[JLPTLevel, List[Dict]]:
        """JSON 파일에서 독해 문제 로드"""
        if cls._reading_questions is None:
            data_file = cls._get_data_dir() / "sample_reading_questions.json"
            
            if not data_file.exists():
                cls._reading_questions = {}
                return cls._reading_questions
            
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cls._reading_questions = {}
            for level_str, questions in data.items():
                try:
                    level = JLPTLevel(level_str)
                    cls._reading_questions[level] = questions
                except ValueError:
                    continue
        
        return cls._reading_questions
    
    @classmethod
    def _load_listening_questions(cls) -> Dict[JLPTLevel, List[Dict]]:
        """JSON 파일에서 청해 문제 로드"""
        if cls._listening_questions is None:
            data_file = cls._get_data_dir() / "sample_listening_questions.json"
            
            if not data_file.exists():
                cls._listening_questions = {}
                return cls._listening_questions
            
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cls._listening_questions = {}
            for level_str, questions in data.items():
                try:
                    level = JLPTLevel(level_str)
                    cls._listening_questions[level] = questions
                except ValueError:
                    continue
        
        return cls._listening_questions
    
    @staticmethod
    def generate_vocabulary_questions(
        level: JLPTLevel,
        count: int = 10
    ) -> List[Question]:
        """
        어휘 문제 생성
        
        Args:
            level: JLPT 레벨
            count: 생성할 문제 수
            
        Returns:
            생성된 문제 목록
        """
        questions = []
        vocab_list = QuestionGeneratorService._load_vocabulary_samples().get(level, [])
        
        if not vocab_list:
            return questions
        
        for i in range(count):
            # 랜덤으로 어휘 선택
            vocab = random.choice(vocab_list)
            
            # 선택지 생성 (정답 + 오답 3개)
            wrong_answers = []
            other_vocabs = [v for v in vocab_list if v != vocab]
            wrong_answers = random.sample(
                [v["meaning"] for v in other_vocabs],
                min(3, len(other_vocabs))
            )
            
            choices = [vocab["meaning"]] + wrong_answers
            random.shuffle(choices)
            
            # 문제 텍스트 생성
            question_type = random.choice([
                "意味",  # 의미
                "読み方"  # 읽기
            ])
            
            if question_type == "意味":
                question_text = f"「{vocab['word']}」の意味は何ですか？"
                correct_answer = vocab["meaning"]
            else:
                question_text = f"「{vocab['word']}」の読み方は何ですか？"
                # 읽기 문제의 경우 선택지를 읽기로 변경
                choices = [vocab["reading"]] + [
                    v["reading"] for v in random.sample(other_vocabs, min(3, len(other_vocabs)))
                ]
                random.shuffle(choices)
                correct_answer = vocab["reading"]
            
            question = Question(
                id=0,
                level=level,
                question_type=QuestionType.VOCABULARY,
                question_text=question_text,
                choices=choices,
                correct_answer=correct_answer,
                explanation=f"「{vocab['word']}」は「{vocab['reading']}」と読み、「{vocab['meaning']}」という意味です。",
                difficulty=1 if level == JLPTLevel.N5 else 2
            )
            questions.append(question)
        
        return questions
    
    @staticmethod
    def generate_grammar_questions(
        level: JLPTLevel,
        count: int = 10
    ) -> List[Question]:
        """
        문법 문제 생성
        
        Args:
            level: JLPT 레벨
            count: 생성할 문제 수
            
        Returns:
            생성된 문제 목록
        """
        questions = []
        patterns = QuestionGeneratorService._load_grammar_patterns().get(level, [])
        
        if not patterns:
            return questions
        
        # pattern에 "___"가 있는 패턴만 필터링
        valid_patterns = [p for p in patterns if "___" in p.get("pattern", "")]
        
        if not valid_patterns:
            return questions
        
        # 기본 조사 선택지
        particles = ["を", "が", "に", "で", "へ", "と", "から", "まで"]
        
        attempts = 0
        max_attempts = count * 10  # 무한 루프 방지
        
        while len(questions) < count and attempts < max_attempts:
            attempts += 1
            pattern = random.choice(valid_patterns)
            
            # 문제 텍스트 생성
            pattern_without_blank = pattern["pattern"].replace("___", "")
            question_text = pattern["example"].replace(pattern_without_blank, "___")
            
            # 생성된 문제 텍스트에 "___"가 없으면 건너뛰기
            if "___" not in question_text:
                continue
            
            # 정답 추출
            correct_particle = pattern_without_blank
            
            # 선택지 생성
            choices = [correct_particle] + random.sample(
                [p for p in particles if p != correct_particle],
                min(3, len(particles) - 1)
            )
            random.shuffle(choices)
            
            question = Question(
                id=0,
                level=level,
                question_type=QuestionType.GRAMMAR,
                question_text=question_text,
                choices=choices,
                correct_answer=correct_particle,
                explanation=pattern["explanation"],
                difficulty=2 if level == JLPTLevel.N5 else 3
            )
            questions.append(question)
        
        return questions
    
    @staticmethod
    def generate_reading_questions(
        level: JLPTLevel,
        count: int = 10
    ) -> List[Question]:
        """
        독해 문제 생성
        
        Args:
            level: JLPT 레벨
            count: 생성할 문제 수
            
        Returns:
            생성된 문제 목록
        """
        questions = []
        reading_list = QuestionGeneratorService._load_reading_questions().get(level, [])
        
        if not reading_list:
            return questions
        
        # 요청한 개수만큼 랜덤으로 선택
        selected_questions = random.sample(
            reading_list,
            min(count, len(reading_list))
        )
        
        for q_data in selected_questions:
            # question_text는 passage + question으로 구성
            question_text = f"{q_data['passage']}\n\n{q_data['question']}"
            
            question = Question(
                id=0,
                level=level,
                question_type=QuestionType.READING,
                question_text=question_text,
                choices=q_data['choices'],
                correct_answer=q_data['correct_answer'],
                explanation=q_data['explanation'],
                difficulty=q_data.get('difficulty', 2)
            )
            questions.append(question)
        
        return questions
    
    @staticmethod
    def generate_listening_questions(
        level: JLPTLevel,
        count: int = 10
    ) -> List[Question]:
        """
        청해 문제 생성
        
        Args:
            level: JLPT 레벨
            count: 생성할 문제 수
            
        Returns:
            생성된 문제 목록
        """
        questions = []
        listening_list = QuestionGeneratorService._load_listening_questions().get(level, [])
        
        if not listening_list:
            return questions
        
        # 요청한 개수만큼 랜덤으로 선택
        selected_questions = random.sample(
            listening_list,
            min(count, len(listening_list))
        )
        
        for q_data in selected_questions:
            # question_text는 dialogue + question으로 구성
            question_text = f"{q_data['dialogue']}\n\n{q_data['question']}"
            
            # TTS 오디오 생성 (audio_text가 있으면 사용, 없으면 dialogue 사용)
            audio_url = None
            audio_text = q_data.get('audio_text', q_data.get('dialogue', ''))
            if audio_text:
                try:
                    from backend.domain.services.tts_service import TTSService
                    # 대화 형식 제거
                    clean_text = audio_text.replace('（会話）', '').replace('\n', ' ').strip()
                    # A:, B: 같은 화자 표시 제거
                    import re
                    clean_text = re.sub(r'[A-Z]:\s*', '', clean_text)
                    audio_url = TTSService.generate_audio(
                        text=clean_text,
                        language='ja',
                        slow=False
                    )
                except Exception as e:
                    # TTS 생성 실패해도 문제 생성은 진행
                    print(f"TTS 생성 실패: {str(e)}")
            
            question = Question(
                id=0,
                level=level,
                question_type=QuestionType.LISTENING,
                question_text=question_text,
                choices=q_data['choices'],
                correct_answer=q_data['correct_answer'],
                explanation=q_data['explanation'],
                difficulty=q_data.get('difficulty', 2),
                audio_url=audio_url
            )
            questions.append(question)
        
        return questions
    
    @staticmethod
    def generate_questions(
        level: JLPTLevel,
        question_type: Optional[QuestionType] = None,
        count: int = 10
    ) -> List[Question]:
        """
        문제 생성 (통합)
        
        Args:
            level: JLPT 레벨
            question_type: 문제 유형 (None이면 모든 유형)
            count: 생성할 문제 수
            
        Returns:
            생성된 문제 목록
        """
        all_questions = []
        
        if question_type is None:
            # 모든 유형 생성 (각 유형별로 균등 분배)
            vocab_count = count // 4
            grammar_count = count // 4
            reading_count = count // 4
            listening_count = count - vocab_count - grammar_count - reading_count
            
            all_questions.extend(
                QuestionGeneratorService.generate_vocabulary_questions(level, vocab_count)
            )
            all_questions.extend(
                QuestionGeneratorService.generate_grammar_questions(level, grammar_count)
            )
            all_questions.extend(
                QuestionGeneratorService.generate_reading_questions(level, reading_count)
            )
            all_questions.extend(
                QuestionGeneratorService.generate_listening_questions(level, listening_count)
            )
        elif question_type == QuestionType.VOCABULARY:
            all_questions.extend(
                QuestionGeneratorService.generate_vocabulary_questions(level, count)
            )
        elif question_type == QuestionType.GRAMMAR:
            all_questions.extend(
                QuestionGeneratorService.generate_grammar_questions(level, count)
            )
        elif question_type == QuestionType.READING:
            all_questions.extend(
                QuestionGeneratorService.generate_reading_questions(level, count)
            )
        elif question_type == QuestionType.LISTENING:
            all_questions.extend(
                QuestionGeneratorService.generate_listening_questions(level, count)
            )
        
        return all_questions
    
    @staticmethod
    def import_from_dict(data: Dict) -> Question:
        """
        딕셔너리에서 문제 임포트
        
        Args:
            data: 문제 데이터 딕셔너리
            
        Returns:
            Question 엔티티
        """
        return Question(
            id=0,
            level=JLPTLevel(data.get("level", "N5")),
            question_type=QuestionType(data.get("question_type", "vocabulary")),
            question_text=data.get("question_text", ""),
            choices=data.get("choices", []),
            correct_answer=data.get("correct_answer", ""),
            explanation=data.get("explanation", ""),
            difficulty=data.get("difficulty", 1),
            audio_url=data.get("audio_url")
        )
    
    @staticmethod
    def import_from_list(data_list: List[Dict]) -> List[Question]:
        """
        딕셔너리 리스트에서 문제 목록 임포트
        
        Args:
            data_list: 문제 데이터 딕셔너리 리스트
            
        Returns:
            Question 엔티티 리스트
        """
        return [
            QuestionGeneratorService.import_from_dict(data)
            for data in data_list
        ]

