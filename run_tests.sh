#!/bin/bash
# JLPT 프로젝트 테스트 실행 스크립트

echo "🚀 JLPT 프로젝트 테스트 실행 중..."

# PYTHONPATH 설정 및 가상환경 활성화
export PYTHONPATH="/Users/yprite/IdeaProjects/Cursor_pro/AI_DRIVEN_DEVELOP/backend"
source backend/venv/bin/activate

# 테스트 실행 (커버리지 포함)
python -m pytest tests/ -v --tb=short --cov --cov-report=term-missing

echo "✅ 테스트 완료!"
