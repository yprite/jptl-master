"""
API 컨트롤러 모듈
"""

from fastapi import APIRouter

from .health import router as health_router
from .users import router as users_router
from .posts import router as posts_router

# 메인 API 라우터
router = APIRouter()

# 서브 라우터 등록
router.include_router(health_router, tags=["health"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(posts_router, prefix="/posts", tags=["posts"])
