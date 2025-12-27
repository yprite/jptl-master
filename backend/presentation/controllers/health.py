"""
JLPT 헬스 체크 컨트롤러
"""

from fastapi import APIRouter
from datetime import datetime

from backend.infrastructure.config.database import get_database

router = APIRouter()

@router.get("/health")
async def health_check():
    """시스템 헬스 체크"""
    # 데이터베이스 연결 테스트
    try:
        db = get_database()
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/ready")
async def readiness_check():
    """컨테이너 readiness probe"""
    return {"status": "ready"}
