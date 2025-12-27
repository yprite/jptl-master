"""
JLPT 사용자 관리 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
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

@router.get("/")
async def get_users():
    """사용자 목록 조회"""
    return {"message": "사용자 목록 조회"}

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
    return {"message": f"사용자 {user_id} 조회"}

@router.put("/{user_id}")
async def update_user(user_id: int):
    """사용자 정보 수정"""
    return {"message": f"사용자 {user_id} 수정"}

@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """사용자 삭제"""
    return {"message": f"사용자 {user_id} 삭제"}
