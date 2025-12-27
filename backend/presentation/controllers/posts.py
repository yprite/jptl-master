"""
게시글 관련 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.domain.entities.post import Post
from backend.infrastructure.repositories.post_repository import SqlitePostRepository
from backend.infrastructure.config.database import get_database

router = APIRouter()

# Pydantic 요청/응답 모델
class PostCreateRequest(BaseModel):
    title: str
    content: str
    author_id: int
    published: bool = False

class PostUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    published: Optional[bool] = None

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    published: bool
    created_at: datetime
    updated_at: datetime

# 의존성 주입 함수
def get_post_repository() -> SqlitePostRepository:
    """게시글 리포지토리 의존성 주입"""
    db = get_database()
    return SqlitePostRepository(db)

@router.get("/", response_model=List[PostResponse])
async def get_posts(published_only: bool = Query(False, description="공개된 게시글만 조회")):
    """게시글 목록 조회"""
    repo = get_post_repository()
    posts = repo.find_all(published_only=published_only)
    
    return [
        PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            author_id=post.author_id,
            published=post.published,
            created_at=post.created_at,
            updated_at=post.updated_at
        )
        for post in posts
    ]

@router.post("/", response_model=PostResponse, status_code=201)
async def create_post(request: PostCreateRequest):
    """게시글 생성"""
    repo = get_post_repository()
    
    # 게시글 생성
    post = Post(
        id=None,
        title=request.title,
        content=request.content,
        author_id=request.author_id,
        published=request.published
    )
    
    saved_post = repo.save(post)
    
    return PostResponse(
        id=saved_post.id,
        title=saved_post.title,
        content=saved_post.content,
        author_id=saved_post.author_id,
        published=saved_post.published,
        created_at=saved_post.created_at,
        updated_at=saved_post.updated_at
    )

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: int):
    """특정 게시글 조회"""
    repo = get_post_repository()
    post = repo.find_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        author_id=post.author_id,
        published=post.published,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(post_id: int, request: PostUpdateRequest):
    """게시글 수정"""
    repo = get_post_repository()
    post = repo.find_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    # 게시글 내용 업데이트
    if request.title is not None or request.content is not None:
        post.update_content(
            title=request.title,
            content=request.content
        )
    
    # 게시 상태 업데이트
    if request.published is not None:
        if request.published:
            post.publish()
        else:
            post.unpublish()
    
    saved_post = repo.save(post)
    
    return PostResponse(
        id=saved_post.id,
        title=saved_post.title,
        content=saved_post.content,
        author_id=saved_post.author_id,
        published=saved_post.published,
        created_at=saved_post.created_at,
        updated_at=saved_post.updated_at
    )

@router.delete("/{post_id}", status_code=204)
async def delete_post(post_id: int):
    """게시글 삭제"""
    repo = get_post_repository()
    post = repo.find_by_id(post_id)
    
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    repo.delete(post)
    return None
