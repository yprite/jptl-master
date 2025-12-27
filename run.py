#!/usr/bin/env python3
"""
블로그 시스템 실행 스크립트
개발용 서버를 빠르게 시작하기 위한 스크립트
"""

import uvicorn
from backend.main import app

if __name__ == "__main__":
    print("🚀 블로그 시스템 서버 시작...")
    print("📍 API 문서: http://localhost:8000/docs")
    print("💓 헬스 체크: http://localhost:8000/health")

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
