"""
JLPT 사용자 관리 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.infrastructure.config.database import get_database

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

@router.post("/")
async def create_user(request: UserCreateRequest):
    """새 사용자 등록"""
    repo = get_user_repository()

    # 이메일 중복 확인
    if repo.exists_by_email(request.email):
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다")

    # 사용자명 중복 확인
    if repo.exists_by_username(request.username):
        raise HTTPException(status_code=400, detail="이미 사용중인 사용자명입니다")

    # 사용자 생성
    user = User(
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
async def get_current_user():
    """현재 로그인된 사용자 정보 조회"""
    # TODO: 세션 기반 인증 구현 후 사용자 정보 반환
    # 현재는 임시로 404 반환
    raise HTTPException(status_code=404, detail="사용자 인증 시스템이 아직 구현되지 않았습니다")

@router.put("/me")
async def update_current_user(request: UserUpdateRequest):
    """현재 사용자 정보 업데이트"""
    # TODO: 세션 기반 인증 구현 후 사용자 정보 업데이트
    raise HTTPException(status_code=404, detail="사용자 인증 시스템이 아직 구현되지 않았습니다")
