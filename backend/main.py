"""
JLPT 자격 검증 프로그램 메인 애플리케이션
DDD(Domain-Driven Design) 기반으로 구현
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime
import secrets
import os

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

# 세션 미들웨어 설정
app.add_middleware(
    SessionMiddleware,
    secret_key=secrets.token_urlsafe(32),  # 세션 암호화를 위한 시크릿 키
    max_age=86400,  # 세션 유효 기간: 24시간
    same_site="lax"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    # NOTE: 세션(쿠키) 기반 인증을 사용하므로 allow_credentials=True와 함께
    # 브라우저(E2E 포함)에서 CORS가 정상 동작하려면 allow_origins에 와일드카드("*")를
    # 쓰지 말고 명시적인 origin을 허용해야 합니다.
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix="/api/v1")

# 정적 파일 서빙 설정 (오디오 파일용)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
audio_dir = os.path.join(static_dir, "audio")
os.makedirs(audio_dir, exist_ok=True)  # 오디오 디렉토리 생성

app.mount("/static", StaticFiles(directory=static_dir), name="static")

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
