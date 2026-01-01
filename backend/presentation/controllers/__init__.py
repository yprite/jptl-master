"""
JLPT API 컨트롤러 모듈
"""

from fastapi import APIRouter

from .health import router as health_router
from .auth import router as auth_router
from .users import router as users_router
from .tests import router as tests_router
from .results import router as results_router
from .admin import router as admin_router
from .study import router as study_router
from .vocabulary import router as vocabulary_router

# 메인 API 라우터
router = APIRouter()

# 서브 라우터 등록
router.include_router(health_router, tags=["health"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(tests_router, prefix="/tests", tags=["tests"])
router.include_router(results_router, prefix="/results", tags=["results"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])
router.include_router(study_router, prefix="/study", tags=["study"])
router.include_router(vocabulary_router, prefix="/vocabulary", tags=["vocabulary"])
