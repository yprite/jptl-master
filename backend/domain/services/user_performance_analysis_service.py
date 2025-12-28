"""
사용자 성능 분석 도메인 서비스
유형별/난이도별 성취도 집계, 반복 오답 문제 식별, 약점 영역 분석 등의 비즈니스 로직
"""

from typing import List, Dict, Any
from collections import defaultdict
from backend.domain.entities.answer_detail import AnswerDetail
from backend.domain.value_objects.jlpt import QuestionType


class UserPerformanceAnalysisService:
    """
    사용자 성능 분석 도메인 서비스
    
    AnswerDetail 데이터를 기반으로 사용자 성능을 분석합니다.
    - 유형별 성취도 집계
    - 난이도별 성취도 집계
    - 반복 오답 문제 식별
    - 약점 영역 분석
    """

    def analyze_type_performance(self, answer_details: List[AnswerDetail]) -> Dict[str, Dict[str, Any]]:
        """
        유형별 성취도 집계
        
        Args:
            answer_details: 답안 상세 정보 리스트
            
        Returns:
            Dict[str, Dict[str, Any]]: 유형별 성취도 데이터
                {
                    "vocabulary": {"correct": 2, "total": 3, "accuracy": 66.67},
                    "grammar": {"correct": 1, "total": 2, "accuracy": 50.0},
                    ...
                }
        """
        type_stats = defaultdict(lambda: {"correct": 0, "total": 0})
        
        for answer_detail in answer_details:
            q_type = answer_detail.question_type.value
            type_stats[q_type]["total"] += 1
            if answer_detail.is_correct:
                type_stats[q_type]["correct"] += 1
        
        # 정확도 계산
        result = {}
        for q_type, stats in type_stats.items():
            accuracy = (stats["correct"] / stats["total"] * 100.0) if stats["total"] > 0 else 0.0
            result[q_type] = {
                "correct": stats["correct"],
                "total": stats["total"],
                "accuracy": round(accuracy, 2)
            }
        
        return result

    def analyze_difficulty_performance(self, answer_details: List[AnswerDetail]) -> Dict[str, Dict[str, Any]]:
        """
        난이도별 성취도 집계
        
        Args:
            answer_details: 답안 상세 정보 리스트
            
        Returns:
            Dict[str, Dict[str, Any]]: 난이도별 성취도 데이터
                {
                    "1": {"correct": 2, "total": 3, "accuracy": 66.67},
                    "2": {"correct": 1, "total": 2, "accuracy": 50.0},
                    ...
                }
        """
        difficulty_stats = defaultdict(lambda: {"correct": 0, "total": 0})
        
        for answer_detail in answer_details:
            diff = str(answer_detail.difficulty)
            difficulty_stats[diff]["total"] += 1
            if answer_detail.is_correct:
                difficulty_stats[diff]["correct"] += 1
        
        # 정확도 계산
        result = {}
        for diff, stats in difficulty_stats.items():
            accuracy = (stats["correct"] / stats["total"] * 100.0) if stats["total"] > 0 else 0.0
            result[diff] = {
                "correct": stats["correct"],
                "total": stats["total"],
                "accuracy": round(accuracy, 2)
            }
        
        return result

    def identify_repeated_mistakes(
        self, 
        answer_details: List[AnswerDetail], 
        threshold: int = 2
    ) -> List[int]:
        """
        반복 오답 문제 식별
        
        같은 문제를 여러 번 틀린 경우를 식별합니다.
        
        Args:
            answer_details: 답안 상세 정보 리스트
            threshold: 반복 오답으로 간주할 최소 오답 횟수 (기본값: 2)
            
        Returns:
            List[int]: 반복 오답 문제 ID 리스트
        """
        question_mistakes = defaultdict(int)
        
        for answer_detail in answer_details:
            if not answer_detail.is_correct:
                question_mistakes[answer_detail.question_id] += 1
        
        # threshold 이상 틀린 문제만 반환
        repeated_mistakes = [
            question_id 
            for question_id, mistake_count in question_mistakes.items()
            if mistake_count >= threshold
        ]
        
        return repeated_mistakes

    def identify_weaknesses(
        self, 
        answer_details: List[AnswerDetail], 
        accuracy_threshold: float = 60.0
    ) -> Dict[str, Dict[str, Any]]:
        """
        약점 영역 분석
        
        유형별 및 난이도별 성취도가 임계값 이하인 영역을 약점으로 식별합니다.
        
        Args:
            answer_details: 답안 상세 정보 리스트
            accuracy_threshold: 약점으로 간주할 정확도 임계값 (기본값: 60.0)
            
        Returns:
            Dict[str, Dict[str, Any]]: 약점 영역 데이터
                {
                    "type_weaknesses": {
                        "grammar": {"correct": 1, "total": 2, "accuracy": 50.0},
                        ...
                    },
                    "difficulty_weaknesses": {
                        "2": {"correct": 1, "total": 2, "accuracy": 50.0},
                        ...
                    }
                }
        """
        type_performance = self.analyze_type_performance(answer_details)
        difficulty_performance = self.analyze_difficulty_performance(answer_details)
        
        type_weaknesses = {
            q_type: stats
            for q_type, stats in type_performance.items()
            if stats["accuracy"] < accuracy_threshold
        }
        
        difficulty_weaknesses = {
            diff: stats
            for diff, stats in difficulty_performance.items()
            if stats["accuracy"] < accuracy_threshold
        }
        
        return {
            "type_weaknesses": type_weaknesses,
            "difficulty_weaknesses": difficulty_weaknesses
        }

