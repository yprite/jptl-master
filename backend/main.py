"""
JLPT 자격 검증 프로그램 메인 애플리케이션
DDD(Domain-Driven Design) 기반으로 구현
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from backend.presentation.controllers import router as api_router
from backend.infrastructure.config.database import get_database

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="JLPT Skill Assessment Platform API",
    description="JLPT 자격 검증 및 실력 향상 지원 플랫폼",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행"""
    # 데이터베이스 연결 확인 (자동으로 테이블 생성됨)
    db = get_database()
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
    print("Database connection established")

@app.get("/")
async def root():
    """기본 헬스 체크 엔드포인트"""
    return {"message": "JLPT Skill Assessment Platform API", "status": "running"}

@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
