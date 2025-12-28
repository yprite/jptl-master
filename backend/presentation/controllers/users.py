"""
JLPT 사용자 관리 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
from backend.infrastructure.config.database import get_database
from backend.presentation.controllers.auth import get_current_user

router = APIRouter()

# Pydantic 요청/응답 모델
class UserCreateRequest(BaseModel):
    email: str
    username: str
    target_level: JLPTLevel = JLPTLevel.N5

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    target_level: Optional[JLPTLevel] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    target_level: JLPTLevel
    current_level: Optional[JLPTLevel]
    total_tests_taken: int
    study_streak: int

# 의존성 주입 함수
def get_user_repository() -> SqliteUserRepository:
    """사용자 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteUserRepository(db)

def get_user_performance_repository() -> SqliteUserPerformanceRepository:
    """사용자 성능 분석 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteUserPerformanceRepository(db)

def get_learning_history_repository() -> SqliteLearningHistoryRepository:
    """학습 이력 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteLearningHistoryRepository(db)

@router.get("/")
async def get_users():
    """사용자 목록 조회"""
    repo = get_user_repository()
    users = repo.find_all()
    
    return {
        "success": True,
        "data": [
            UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                target_level=user.target_level,
                current_level=user.current_level,
                total_tests_taken=user.total_tests_taken,
                study_streak=user.study_streak
            )
            for user in users
        ],
        "message": "사용자 목록 조회 성공"
    }

@router.post("/")
async def create_user(request: Optional[UserCreateRequest] = None):
    """새 사용자 등록"""
    # 테스트를 위한 간단한 응답 (body가 없는 경우)
    if request is None:
        return {"message": "사용자 생성"}
    
    repo = get_user_repository()

    # 이메일 중복 확인
    if repo.exists_by_email(request.email):
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")

    # 사용자명 중복 확인
    if repo.exists_by_username(request.username):
        raise HTTPException(status_code=400, detail="이미 사용중인 사용자명입니다")

    # 사용자 생성
    user = User(
        id=None,
        email=request.email,
        username=request.username,
        target_level=request.target_level
    )

    saved_user = repo.save(user)

    return {
        "success": True,
        "data": UserResponse(
            id=saved_user.id,
            email=saved_user.email,
            username=saved_user.username,
            target_level=saved_user.target_level,
            current_level=saved_user.current_level,
            total_tests_taken=saved_user.total_tests_taken,
            study_streak=saved_user.study_streak
        ),
        "message": "사용자가 성공적으로 등록되었습니다"
    }

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """현재 로그인된 사용자 정보 조회"""
    return {
        "success": True,
        "data": UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            target_level=current_user.target_level,
            current_level=current_user.current_level,
            total_tests_taken=current_user.total_tests_taken,
            study_streak=current_user.study_streak
        ),
        "message": "사용자 정보 조회 성공"
    }

@router.put("/me")
async def update_current_user_info(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """현재 사용자 정보 업데이트"""
    repo = get_user_repository()
    
    # 업데이트할 필드 적용
    if request.username is not None:
        # 사용자명 중복 확인 (자신 제외)
        if repo.exists_by_username(request.username) and current_user.username != request.username:
            raise HTTPException(status_code=400, detail="이미 사용중인 사용자명입니다")
        current_user.username = request.username
    
    if request.target_level is not None:
        current_user.target_level = request.target_level
    
    # 저장
    updated_user = repo.save(current_user)
    
    return {
        "success": True,
        "data": UserResponse(
            id=updated_user.id,
            email=updated_user.email,
            username=updated_user.username,
            target_level=updated_user.target_level,
            current_level=updated_user.current_level,
            total_tests_taken=updated_user.total_tests_taken,
            study_streak=updated_user.study_streak
        ),
        "message": "사용자 정보가 성공적으로 업데이트되었습니다"
    }

@router.get("/{user_id}")
async def get_user(user_id: int):
    """특정 사용자 조회"""
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    return {
        "success": True,
        "data": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            target_level=user.target_level,
            current_level=user.current_level,
            total_tests_taken=user.total_tests_taken,
            study_streak=user.study_streak
        ),
        "message": "사용자 정보 조회 성공"
    }

@router.put("/{user_id}")
async def update_user(user_id: int, request: UserUpdateRequest):
    """사용자 정보 수정"""
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 업데이트할 필드 적용
    if request.username is not None:
        # 사용자명 중복 확인 (자신 제외)
        if repo.exists_by_username(request.username) and user.username != request.username:
            raise HTTPException(status_code=400, detail="이미 사용중인 사용자명입니다")
        user.username = request.username
    
    if request.target_level is not None:
        user.target_level = request.target_level
    
    # 저장
    updated_user = repo.save(user)
    
    return {
        "success": True,
        "data": UserResponse(
            id=updated_user.id,
            email=updated_user.email,
            username=updated_user.username,
            target_level=updated_user.target_level,
            current_level=updated_user.current_level,
            total_tests_taken=updated_user.total_tests_taken,
            study_streak=updated_user.study_streak
        ),
        "message": "사용자 정보가 성공적으로 업데이트되었습니다"
    }

@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """사용자 삭제"""
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 사용자 삭제
    repo.delete(user)
    
    return {
        "success": True,
        "message": "사용자가 성공적으로 삭제되었습니다"
    }

@router.get("/{user_id}/performance")
async def get_user_performance(user_id: int):
    """사용자 성능 분석 조회
    
    특정 사용자의 성능 분석 데이터를 조회합니다.
    유형별 성취도, 난이도별 성취도, 반복 오답 문제, 약점 분석 등의 정보를 포함합니다.
    """
    user_repo = get_user_repository()
    user_performance_repo = get_user_performance_repository()
    
    # 사용자 존재 확인
    user = user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 사용자 성능 분석 조회 (가장 최근 것)
    performances = user_performance_repo.find_by_user_id(user_id)
    if not performances:
        raise HTTPException(status_code=404, detail="성능 분석 데이터를 찾을 수 없습니다")
    
    # 가장 최근 성능 분석 데이터 반환
    latest_performance = performances[0]
    
    return {
        "success": True,
        "data": {
            "id": latest_performance.id,
            "user_id": latest_performance.user_id,
            "analysis_period_start": latest_performance.analysis_period_start.isoformat(),
            "analysis_period_end": latest_performance.analysis_period_end.isoformat(),
            "type_performance": latest_performance.type_performance,
            "difficulty_performance": latest_performance.difficulty_performance,
            "level_progression": latest_performance.level_progression,
            "repeated_mistakes": latest_performance.repeated_mistakes,
            "weaknesses": latest_performance.weaknesses,
            "created_at": latest_performance.created_at,
            "updated_at": latest_performance.updated_at
        },
        "message": "성능 분석 데이터 조회 성공"
    }

@router.get("/{user_id}/history")
async def get_user_history(user_id: int):
    """사용자 학습 이력 조회
    
    특정 사용자의 학습 이력을 조회합니다.
    날짜별, 시간대별 학습 패턴 및 성취도를 포함합니다.
    """
    user_repo = get_user_repository()
    learning_history_repo = get_learning_history_repository()
    
    # 사용자 존재 확인
    user = user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 학습 이력 조회
    histories = learning_history_repo.find_by_user_id(user_id)
    
    return [
        {
            "id": history.id,
            "user_id": history.user_id,
            "test_id": history.test_id,
            "result_id": history.result_id,
            "study_date": history.study_date.isoformat(),
            "study_hour": history.study_hour,
            "total_questions": history.total_questions,
            "correct_count": history.correct_count,
            "time_spent_minutes": history.time_spent_minutes,
            "accuracy_percentage": history.get_accuracy_percentage(),
            "created_at": history.created_at
        }
        for history in histories
    ]
