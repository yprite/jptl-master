"""
JLPT 결과 조회 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

from backend.domain.entities.result import Result
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.repositories.result_repository import SqliteResultRepository
from backend.infrastructure.config.database import get_database

router = APIRouter()

# Pydantic 응답 모델
class ResultResponse(BaseModel):
    id: int
    test_id: int
    user_id: int
    score: float
    assessed_level: str
    recommended_level: str
    correct_answers_count: int
    total_questions_count: int
    time_taken_minutes: int
    performance_level: str
    is_passed: bool
    accuracy_percentage: float
    time_efficiency: str
    level_progression: str
    question_type_analysis: Dict[str, Dict[str, int]]
    feedback: Dict[str, str]
    created_at: datetime

class ResultListResponse(BaseModel):
    id: int
    test_id: int
    user_id: int
    score: float
    assessed_level: str
    recommended_level: str
    performance_level: str
    is_passed: bool
    created_at: datetime

# 의존성 주입 함수
def get_result_repository() -> SqliteResultRepository:
    """결과 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteResultRepository(db)

@router.get("/", response_model=List[ResultListResponse])
async def get_results(
    user_id: Optional[int] = Query(None, description="사용자 ID로 필터링"),
    test_id: Optional[int] = Query(None, description="테스트 ID로 필터링")
):
    """결과 목록 조회"""
    repo = get_result_repository()

    if user_id:
        results = repo.find_by_user_id(user_id)
    elif test_id:
        results = repo.find_by_test_id(test_id)
    else:
        results = repo.find_all()

    return [
        ResultListResponse(
            id=result.id,
            test_id=result.test_id,
            user_id=result.user_id,
            score=result.score,
            assessed_level=result.assessed_level.value,
            recommended_level=result.recommended_level.value,
            performance_level=result.get_performance_level(),
            is_passed=result.is_passed(),
            created_at=result.created_at
        )
        for result in results
    ]

@router.get("/{result_id}", response_model=ResultResponse)
async def get_result(result_id: int):
    """상세 결과 조회"""
    repo = get_result_repository()
    result = repo.find_by_id(result_id)

    if not result:
        raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다")

    return ResultResponse(
        id=result.id,
        test_id=result.test_id,
        user_id=result.user_id,
        score=result.score,
        assessed_level=result.assessed_level.value,
        recommended_level=result.recommended_level.value,
        correct_answers_count=result.correct_answers_count,
        total_questions_count=result.total_questions_count,
        time_taken_minutes=result.time_taken_minutes,
        performance_level=result.get_performance_level(),
        is_passed=result.is_passed(),
        accuracy_percentage=result.get_accuracy_percentage(),
        time_efficiency=result.get_time_efficiency(),
        level_progression=result.get_level_progression(),
        question_type_analysis=result.question_type_analysis,
        feedback=result.get_detailed_feedback(),
        created_at=result.created_at
    )

@router.get("/users/{user_id}/recent", response_model=List[ResultListResponse])
async def get_recent_results_by_user(
    user_id: int,
    limit: int = Query(10, ge=1, le=100, description="조회할 결과 개수")
):
    """사용자의 최근 결과 조회"""
    repo = get_result_repository()
    results = repo.find_recent_by_user(user_id, limit=limit)

    return [
        ResultListResponse(
            id=result.id,
            test_id=result.test_id,
            user_id=result.user_id,
            score=result.score,
            assessed_level=result.assessed_level.value,
            recommended_level=result.recommended_level.value,
            performance_level=result.get_performance_level(),
            is_passed=result.is_passed(),
            created_at=result.created_at
        )
        for result in results
    ]

@router.get("/users/{user_id}/average-score")
async def get_user_average_score(user_id: int):
    """사용자의 평균 점수 조회"""
    repo = get_result_repository()
    avg_score = repo.get_user_average_score(user_id)

    return {
        "user_id": user_id,
        "average_score": round(avg_score, 2),
        "total_results": len(repo.find_by_user_id(user_id))
    }

@router.get("/{result_id}/report")
async def get_result_analysis_report(result_id: int):
    """결과 분석 리포트 생성
    
    테스트 결과를 기반으로 상세한 분석 리포트를 생성합니다.
    리포트에는 다음이 포함됩니다:
    - 전체 성취도 요약
    - 문제 유형별 상세 분석
    - 강점/약점 분석
    - 개선 방향 제시
    - 학습 추천
    """
    repo = get_result_repository()
    result = repo.find_by_id(result_id)

    if not result:
        raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다")

    # 리포트 생성
    report = _generate_analysis_report(result)
    return report

def _generate_analysis_report(result: Result) -> Dict:
    """결과 분석 리포트 생성"""
    # 요약 정보
    summary = {
        "score": result.score,
        "correct_answers_count": result.correct_answers_count,
        "total_questions_count": result.total_questions_count,
        "accuracy_percentage": result.get_accuracy_percentage(),
        "performance_level": result.get_performance_level(),
        "is_passed": result.is_passed(),
        "time_taken_minutes": result.time_taken_minutes,
        "time_efficiency": result.get_time_efficiency(),
        "assessed_level": result.assessed_level.value,
        "recommended_level": result.recommended_level.value,
        "level_progression": result.get_level_progression()
    }

    # 문제 유형별 상세 분석
    question_type_analysis = {}
    for q_type, stats in result.question_type_analysis.items():
        accuracy = (stats["correct"] / stats["total"] * 100) if stats["total"] > 0 else 0
        question_type_analysis[q_type] = {
            "correct": stats["correct"],
            "total": stats["total"],
            "accuracy": round(accuracy, 2),
            "performance": "excellent" if accuracy >= 85 else ("good" if accuracy >= 70 else "needs_improvement")
        }

    # 강점/약점 분석
    strengths = []
    weaknesses = []
    improvement_areas = []

    for q_type, analysis in question_type_analysis.items():
        if analysis["performance"] == "excellent":
            strengths.append({
                "type": q_type,
                "accuracy": analysis["accuracy"],
                "message": f"{q_type.capitalize()} 영역에서 우수한 성과를 보였습니다."
            })
        elif analysis["performance"] == "needs_improvement":
            weaknesses.append({
                "type": q_type,
                "accuracy": analysis["accuracy"],
                "message": f"{q_type.capitalize()} 영역에서 개선이 필요합니다."
            })
            improvement_areas.append({
                "type": q_type,
                "current_accuracy": analysis["accuracy"],
                "target_accuracy": 70.0,
                "recommendation": f"{q_type.capitalize()} 문제를 더 많이 연습하세요."
            })

    # 학습 추천
    recommendations = []
    if result.score < 70:
        recommendations.append({
            "priority": "high",
            "category": "overall",
            "message": "기본 문법과 어휘를 복습하고 정기적으로 연습하세요."
        })
    elif result.score < 85:
        recommendations.append({
            "priority": "medium",
            "category": "improvement",
            "message": "약점 영역에 집중하고 더 복잡한 문장 구조를 연습하세요."
        })
    else:
        recommendations.append({
            "priority": "low",
            "category": "maintenance",
            "message": "우수한 성과를 유지하고 더 높은 레벨의 콘텐츠에 도전하세요."
        })

    # 약점 영역별 추천 추가
    for area in improvement_areas:
        recommendations.append({
            "priority": "high",
            "category": area["type"],
            "message": area["recommendation"]
        })

    # 상세 피드백
    feedback = result.get_detailed_feedback()

    return {
        "summary": summary,
        "question_type_analysis": question_type_analysis,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "improvement_areas": improvement_areas,
        "recommendations": recommendations,
        "feedback": feedback
    }
