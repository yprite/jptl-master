"""
헬스 체크 컨트롤러
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.config.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """시스템 헬스 체크"""
    # 데이터베이스 연결 테스트
    try:
        await db.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "version": "1.0.0",
        "timestamp": "2024-12-27"
    }

@router.get("/ready")
async def readiness_check():
    """컨테이너 readiness probe"""
    return {"status": "ready"}
