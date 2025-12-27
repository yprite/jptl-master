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
