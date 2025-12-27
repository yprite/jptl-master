#!/bin/bash
# JLPT 프로젝트 테스트 실행 스크립트

echo "🚀 JLPT 프로젝트 테스트 실행 중..."

# PYTHONPATH 설정 및 가상환경 활성화
export PYTHONPATH="/Users/yprite/IdeaProjects/Cursor_pro/AI_DRIVEN_DEVELOP/backend"
source backend/venv/bin/activate

# 커버리지 임계값 설정
BACKEND_COVERAGE_THRESHOLD=80

# 모든 테스트 실행 (커버리지 포함)
echo "📊 테스트 실행 및 커버리지 측정 중..."
TEST_OUTPUT=$(python -m pytest tests/ -v --tb=short --cov --cov-report=term-missing --cov-report=json 2>&1)
TEST_EXIT_CODE=$?

# 테스트 실패 시 종료
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "$TEST_OUTPUT"
    echo ""
    echo "❌ 테스트가 실패했습니다. 커버리지 검증을 건너뜁니다."
    exit $TEST_EXIT_CODE
fi

echo "$TEST_OUTPUT"

# 시나리오 테스트 실행
echo ""
echo "🎭 시나리오 테스트 실행 중..."
SCENARIO_OUTPUT=$(python -m pytest tests/test_scenarios.py -v --tb=short 2>&1)
SCENARIO_EXIT_CODE=$?

# 시나리오 테스트 실패 시 종료
if [ $SCENARIO_EXIT_CODE -ne 0 ]; then
    echo "$SCENARIO_OUTPUT"
    echo ""
    echo "❌ 시나리오 테스트가 실패했습니다."
    exit $SCENARIO_EXIT_CODE
fi

echo "$SCENARIO_OUTPUT"
echo "✅ 시나리오 테스트 통과!"

# 커버리지 결과 파싱
if [ -f "coverage.json" ]; then
    # coverage.json에서 전체 커버리지 추출
    COVERAGE=$(python -c "import json; data = json.load(open('coverage.json')); print(f\"{data['totals']['percent_covered']:.2f}\")")
    
    # 커버리지 임계값 검증
    if (( $(echo "$COVERAGE < $BACKEND_COVERAGE_THRESHOLD" | bc -l) )); then
        echo ""
        echo "❌ 커버리지 ${COVERAGE}%가 최소 요구사항 ${BACKEND_COVERAGE_THRESHOLD}% 미만입니다!"
        echo "⚠️  테스트 커버리지를 ${BACKEND_COVERAGE_THRESHOLD}% 이상 달성해야 합니다."
        echo "📝 누락된 테스트를 작성하고 다시 실행해주세요."
        exit 1
    else
        echo ""
        echo "✅ 커버리지 ${COVERAGE}% (요구사항: ${BACKEND_COVERAGE_THRESHOLD}% 이상)"
    fi
else
    echo ""
    echo "⚠️  커버리지 파일을 찾을 수 없습니다. 커버리지 검증을 건너뜁니다."
fi

echo "✅ 테스트 완료!"
