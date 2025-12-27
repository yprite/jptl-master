"""
게시글 관련 API 컨트롤러
"""

from fastapi import APIRouter

router = APIRouter()

# TODO: 게시글 CRUD API 구현
@router.get("/")
async def get_posts():
    """게시글 목록 조회"""
    return {"message": "게시글 목록 조회 API"}

@router.post("/")
async def create_post():
    """게시글 생성"""
    return {"message": "게시글 생성 API"}

@router.get("/{post_id}")
async def get_post(post_id: int):
    """특정 게시글 조회"""
    return {"message": f"게시글 {post_id} 조회 API"}

@router.put("/{post_id}")
async def update_post(post_id: int):
    """게시글 수정"""
    return {"message": f"게시글 {post_id} 수정 API"}

@router.delete("/{post_id}")
async def delete_post(post_id: int):
    """게시글 삭제"""
    return {"message": f"게시글 {post_id} 삭제 API"}
