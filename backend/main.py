"""
블로그 시스템 메인 애플리케이션
DDD(Domain-Driven Design) 기반으로 구현
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from presentation.controllers import router as api_router
from infrastructure.config.database import create_tables

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="블로그 시스템 API",
    description="DDD 기반 블로그 시스템",
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
    await create_tables()

@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    return {"message": "블로그 시스템 API", "status": "running"}

@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2024-12-27"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
