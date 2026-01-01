"""
단어 생성 도메인 서비스
JLPT 단어를 대량 생성하는 비즈니스 로직
"""

from typing import List, Dict, Optional
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel, MemorizationStatus


class VocabularyGeneratorService:
    """
    단어 생성 도메인 서비스
    
    JLPT 단어를 대량 생성하는 비즈니스 로직을 담당합니다.
    샘플 데이터 생성 및 기출단어 임포트 기능을 제공합니다.
    """
    
    # 레벨별 샘플 단어 데이터
    VOCABULARY_SAMPLES = {
        JLPTLevel.N5: [
            {"word": "こんにちは", "reading": "こんにちは", "meaning": "안녕하세요", "example": "こんにちは、元気ですか？"},
            {"word": "ありがとう", "reading": "ありがとう", "meaning": "감사합니다", "example": "ありがとうございます。"},
            {"word": "本", "reading": "ほん", "meaning": "책", "example": "この本は面白いです。"},
            {"word": "水", "reading": "みず", "meaning": "물", "example": "水を飲みます。"},
            {"word": "食べる", "reading": "たべる", "meaning": "먹다", "example": "ご飯を食べます。"},
            {"word": "学校", "reading": "がっこう", "meaning": "학교", "example": "学校に行きます。"},
            {"word": "友達", "reading": "ともだち", "meaning": "친구", "example": "友達と遊びます。"},
            {"word": "見る", "reading": "みる", "meaning": "보다", "example": "映画を見ます。"},
            {"word": "行く", "reading": "いく", "meaning": "가다", "example": "公園に行きます。"},
            {"word": "来る", "reading": "くる", "meaning": "오다", "example": "日本に来ます。"},
            {"word": "大きい", "reading": "おおきい", "meaning": "크다", "example": "大きい家です。"},
            {"word": "小さい", "reading": "ちいさい", "meaning": "작다", "example": "小さい犬です。"},
            {"word": "新しい", "reading": "あたらしい", "meaning": "새로운", "example": "新しい車です。"},
            {"word": "古い", "reading": "ふるい", "meaning": "오래된", "example": "古い建物です。"},
            {"word": "高い", "reading": "たかい", "meaning": "높다, 비싸다", "example": "高い山です。"},
        ],
        JLPTLevel.N4: [
            {"word": "勉強", "reading": "べんきょう", "meaning": "공부", "example": "日本語を勉強します。"},
            {"word": "旅行", "reading": "りょこう", "meaning": "여행", "example": "旅行に行きます。"},
            {"word": "病気", "reading": "びょうき", "meaning": "병", "example": "病気になりました。"},
            {"word": "準備", "reading": "じゅんび", "meaning": "준비", "example": "試験の準備をします。"},
            {"word": "約束", "reading": "やくそく", "meaning": "약속", "example": "友達と約束しました。"},
            {"word": "経験", "reading": "けいけん", "meaning": "경험", "example": "良い経験になりました。"},
            {"word": "練習", "reading": "れんしゅう", "meaning": "연습", "example": "毎日練習します。"},
            {"word": "質問", "reading": "しつもん", "meaning": "질문", "example": "質問があります。"},
        ],
        JLPTLevel.N3: [
            {"word": "経験", "reading": "けいけん", "meaning": "경험", "example": "貴重な経験をしました。"},
            {"word": "影響", "reading": "えいきょう", "meaning": "영향", "example": "環境への影響を考えます。"},
            {"word": "環境", "reading": "かんきょう", "meaning": "환경", "example": "自然環境を守ります。"},
            {"word": "開発", "reading": "かいはつ", "meaning": "개발", "example": "新しい技術を開発します。"},
            {"word": "改善", "reading": "かいぜん", "meaning": "개선", "example": "サービスを改善します。"},
        ],
        JLPTLevel.N2: [
            {"word": "改善", "reading": "かいぜん", "meaning": "개선", "example": "品質を改善します。"},
            {"word": "開発", "reading": "かいはつ", "meaning": "개발", "example": "ソフトウェアを開発します。"},
            {"word": "複雑", "reading": "ふくざつ", "meaning": "복잡", "example": "複雑な問題です。"},
            {"word": "具体的", "reading": "ぐたいてき", "meaning": "구체적", "example": "具体的な計画を立てます。"},
        ],
        JLPTLevel.N1: [
            {"word": "抽象的", "reading": "ちゅうしょうてき", "meaning": "추상적", "example": "抽象的な概念を理解します。"},
            {"word": "複雑", "reading": "ふくざつ", "meaning": "복잡", "example": "複雑な状況を分析します。"},
            {"word": "分析", "reading": "ぶんせき", "meaning": "분석", "example": "データを分析します。"},
        ],
    }
    
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
        vocab_list = VocabularyGeneratorService.VOCABULARY_SAMPLES.get(level, [])
        
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
                memorization_status=MemorizationStatus.NOT_MEMORIZED,
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
            memorization_status=MemorizationStatus(data.get("memorization_status", "not_memorized")),
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

