#!/bin/bash

# JLPT 프로젝트 개발 서버 실행 스크립트
# Backend와 Frontend를 동시에 실행합니다

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# PID 파일 경로
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

# 종료 함수
cleanup() {
    echo -e "\n${YELLOW}서버 종료 중...${NC}"
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            echo -e "${BLUE}Backend 서버 종료 중 (PID: $BACKEND_PID)...${NC}"
            kill "$BACKEND_PID" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            echo -e "${BLUE}Frontend 서버 종료 중 (PID: $FRONTEND_PID)...${NC}"
            kill "$FRONTEND_PID" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    echo -e "${GREEN}모든 서버가 종료되었습니다.${NC}"
    exit 0
}

# 시그널 핸들러 등록
trap cleanup SIGINT SIGTERM

# Backend 실행 함수
start_backend() {
    echo -e "${GREEN}🚀 Backend 서버 시작 중...${NC}"
    
    # 가상환경 확인 및 활성화
    if [ -d "$PROJECT_ROOT/backend/venv" ]; then
        echo -e "${BLUE}Python 가상환경 활성화 중...${NC}"
        source "$PROJECT_ROOT/backend/venv/bin/activate"
    elif [ -d "$PROJECT_ROOT/venv" ]; then
        echo -e "${BLUE}Python 가상환경 활성화 중...${NC}"
        source "$PROJECT_ROOT/venv/bin/activate"
    else
        echo -e "${YELLOW}경고: Python 가상환경을 찾을 수 없습니다.${NC}"
    fi
    
    cd "$BACKEND_DIR"
    
    # Backend 서버 실행 (백그라운드)
    python "$PROJECT_ROOT/run.py" > "$PROJECT_ROOT/.backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "$BACKEND_PID" > "$BACKEND_PID_FILE"
    
    echo -e "${GREEN}✅ Backend 서버가 시작되었습니다 (PID: $BACKEND_PID)${NC}"
    echo -e "${BLUE}   API 문서: http://localhost:8000/docs${NC}"
    echo -e "${BLUE}   헬스 체크: http://localhost:8000/health${NC}"
    echo -e "${BLUE}   로그: $PROJECT_ROOT/.backend.log${NC}"
}

# Frontend 실행 함수
start_frontend() {
    echo -e "${GREEN}🚀 Frontend 서버 시작 중...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # node_modules 확인
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules가 없습니다. npm install을 실행합니다...${NC}"
        npm install
    fi
    
    # Frontend 서버 실행 (백그라운드)
    npm start > "$PROJECT_ROOT/.frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
    
    echo -e "${GREEN}✅ Frontend 서버가 시작되었습니다 (PID: $FRONTEND_PID)${NC}"
    echo -e "${BLUE}   URL: http://localhost:3000${NC}"
    echo -e "${BLUE}   로그: $PROJECT_ROOT/.frontend.log${NC}"
}

# 메인 실행
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  JLPT 프로젝트 개발 서버 시작${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # 기존 프로세스 확인 및 종료
    if [ -f "$BACKEND_PID_FILE" ]; then
        OLD_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}기존 Backend 프로세스 발견 (PID: $OLD_PID). 종료합니다...${NC}"
            kill "$OLD_PID" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        OLD_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}기존 Frontend 프로세스 발견 (PID: $OLD_PID). 종료합니다...${NC}"
            kill "$OLD_PID" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # 서버 시작
    start_backend
    sleep 2  # Backend가 먼저 시작되도록 대기
    
    start_frontend
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  모든 서버가 실행 중입니다!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요.${NC}"
    echo ""
    
    # 프로세스가 종료될 때까지 대기
    wait
}

# 스크립트 실행
main

