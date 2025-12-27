"""
사용자 관련 API 컨트롤러
"""

from fastapi import APIRouter

router = APIRouter()

# TODO: 사용자 CRUD API 구현
@router.get("/")
async def get_users():
    """사용자 목록 조회"""
    return {"message": "사용자 목록 조회 API"}

@router.post("/")
async def create_user():
    """사용자 생성"""
    return {"message": "사용자 생성 API"}

@router.get("/{user_id}")
async def get_user(user_id: int):
    """특정 사용자 조회"""
    return {"message": f"사용자 {user_id} 조회 API"}

@router.put("/{user_id}")
async def update_user(user_id: int):
    """사용자 정보 수정"""
    return {"message": f"사용자 {user_id} 수정 API"}

@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """사용자 삭제"""
    return {"message": f"사용자 {user_id} 삭제 API"}
