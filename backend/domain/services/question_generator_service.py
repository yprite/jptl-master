"""
문제 생성 도메인 서비스
JLPT 문제를 대량 생성하는 비즈니스 로직
"""

import random
from typing import List, Dict, Optional
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType


class QuestionGeneratorService:
    """
    문제 생성 도메인 서비스
    
    JLPT 문제를 대량 생성하는 비즈니스 로직을 담당합니다.
    샘플 데이터 생성 및 기출문제 임포트 기능을 제공합니다.
    """
    
    # 레벨별 샘플 어휘 데이터
    VOCABULARY_SAMPLES = {
        JLPTLevel.N5: [
            {"word": "こんにちは", "meaning": "안녕하세요", "reading": "こんにちは"},
            {"word": "ありがとう", "meaning": "감사합니다", "reading": "ありがとう"},
            {"word": "本", "meaning": "책", "reading": "ほん"},
            {"word": "水", "meaning": "물", "reading": "みず"},
            {"word": "食べる", "meaning": "먹다", "reading": "たべる"},
            {"word": "学校", "meaning": "학교", "reading": "がっこう"},
            {"word": "友達", "meaning": "친구", "reading": "ともだち"},
            {"word": "見る", "meaning": "보다", "reading": "みる"},
            {"word": "行く", "meaning": "가다", "reading": "いく"},
            {"word": "来る", "meaning": "오다", "reading": "くる"},
        ],
        JLPTLevel.N4: [
            {"word": "勉強", "meaning": "공부", "reading": "べんきょう"},
            {"word": "旅行", "meaning": "여행", "reading": "りょこう"},
            {"word": "病気", "meaning": "병", "reading": "びょうき"},
            {"word": "準備", "meaning": "준비", "reading": "じゅんび"},
            {"word": "約束", "meaning": "약속", "reading": "やくそく"},
        ],
        JLPTLevel.N3: [
            {"word": "経験", "meaning": "경험", "reading": "けいけん"},
            {"word": "影響", "meaning": "영향", "reading": "えいきょう"},
            {"word": "環境", "meaning": "환경", "reading": "かんきょう"},
        ],
        JLPTLevel.N2: [
            {"word": "改善", "meaning": "개선", "reading": "かいぜん"},
            {"word": "開発", "meaning": "개발", "reading": "かいはつ"},
        ],
        JLPTLevel.N1: [
            {"word": "抽象的", "meaning": "추상적", "reading": "ちゅうしょうてき"},
            {"word": "複雑", "meaning": "복잡", "reading": "ふくざつ"},
        ],
    }
    
    # 문법 패턴 샘플
    GRAMMAR_PATTERNS = {
        JLPTLevel.N5: [
            {"pattern": "___を", "example": "コーヒーを飲みます", "explanation": "목적어를 나타내는 조사"},
            {"pattern": "___に", "example": "学校に行きます", "explanation": "방향이나 목적지를 나타내는 조사"},
            {"pattern": "___で", "example": "電車で行きます", "explanation": "수단이나 방법을 나타내는 조사"},
        ],
        JLPTLevel.N4: [
            {"pattern": "___たい", "example": "食べたい", "explanation": "~하고 싶다"},
            {"pattern": "___てください", "example": "読んでください", "explanation": "~해 주세요"},
        ],
    }
    
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
        vocab_list = QuestionGeneratorService.VOCABULARY_SAMPLES.get(level, [])
        
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
        patterns = QuestionGeneratorService.GRAMMAR_PATTERNS.get(level, [])
        
        if not patterns:
            return questions
        
        # 기본 조사 선택지
        particles = ["を", "が", "に", "で", "へ", "と", "から", "まで"]
        
        for i in range(count):
            pattern = random.choice(patterns)
            
            # 문제 텍스트 생성
            question_text = pattern["example"].replace(pattern["pattern"].replace("___", ""), "___")
            
            # 정답 추출
            correct_particle = pattern["pattern"].replace("___", "")
            
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
            # 모든 유형 생성
            vocab_count = count // 2
            grammar_count = count - vocab_count
            
            all_questions.extend(
                QuestionGeneratorService.generate_vocabulary_questions(level, vocab_count)
            )
            all_questions.extend(
                QuestionGeneratorService.generate_grammar_questions(level, grammar_count)
            )
        elif question_type == QuestionType.VOCABULARY:
            all_questions.extend(
                QuestionGeneratorService.generate_vocabulary_questions(level, count)
            )
        elif question_type == QuestionType.GRAMMAR:
            all_questions.extend(
                QuestionGeneratorService.generate_grammar_questions(level, count)
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

