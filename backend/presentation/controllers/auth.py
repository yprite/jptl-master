"""
인증 API 컨트롤러
세션 기반 인증을 제공합니다.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional

from backend.domain.entities.user import User
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.infrastructure.config.database import get_database

router = APIRouter()

# Pydantic 요청/응답 모델
class LoginRequest(BaseModel):
    email: str

class LoginResponse(BaseModel):
    user_id: int
    email: str
    username: str

# 의존성 주입 함수
def get_user_repository() -> SqliteUserRepository:
    """사용자 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteUserRepository(db)

@router.post("/login")
async def login(request: LoginRequest, req: Request):
    """사용자 로그인
    
    이메일을 기반으로 사용자를 찾아 세션에 저장합니다.
    """
    repo = get_user_repository()
    
    # 이메일로 사용자 찾기
    user = repo.find_by_email(request.email)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 세션에 사용자 ID 저장
    req.session["user_id"] = user.id
    
    return {
        "success": True,
        "data": {
            "user_id": user.id,
            "email": user.email,
            "username": user.username
        },
        "message": "로그인 성공"
    }

@router.post("/logout")
async def logout(req: Request):
    """사용자 로그아웃
    
    세션에서 사용자 정보를 제거합니다.
    """
    if "user_id" in req.session:
        del req.session["user_id"]
    
    return {
        "success": True,
        "message": "로그아웃 성공"
    }

def get_current_user(req: Request) -> User:
    """현재 로그인된 사용자 조회 (의존성 함수)
    
    세션에서 사용자 ID를 가져와 사용자 정보를 반환합니다.
    
    Raises:
        HTTPException: 인증되지 않은 경우 401 에러
    """
    user_id = req.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="유효하지 않은 세션입니다")
    
    return user

def get_admin_user(req: Request) -> User:
    """어드민 권한이 있는 사용자 조회 (의존성 함수)
    
    세션에서 사용자 ID를 가져와 사용자 정보를 반환하고, 어드민 권한을 확인합니다.
    
    Raises:
        HTTPException: 인증되지 않은 경우 401 에러
        HTTPException: 어드민 권한이 없는 경우 403 에러
    """
    user = get_current_user(req)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="어드민 권한이 필요합니다")
    
    return user

@router.get("/admin/test")
async def test_admin_endpoint(admin_user: User = Depends(get_admin_user)):
    """테스트용 어드민 엔드포인트 (테스트 전용)"""
    return {
        "success": True,
        "data": {
            "user_id": admin_user.id,
            "is_admin": admin_user.is_admin
        },
        "message": "어드민 권한 확인 성공"
    }

