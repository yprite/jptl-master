#!/bin/bash
# JLPT 프로젝트 테스트 실행 스크립트

echo "🚀 JLPT 프로젝트 테스트 실행 중..."

# PYTHONPATH 설정 및 가상환경 활성화
export PYTHONPATH="/Users/yprite/IdeaProjects/Cursor_pro/AI_DRIVEN_DEVELOP/backend"
source backend/venv/bin/activate

# 커버리지 임계값 설정
BACKEND_COVERAGE_THRESHOLD=80
FRONTEND_COVERAGE_THRESHOLD=80

# 1. Unit 테스트 실행 (커버리지 포함)
echo ""
echo "📊 Unit 테스트 실행 및 커버리지 측정 중..."
UNIT_TEST_OUTPUT=$(python -m pytest tests/unit/ -v --tb=short --cov=backend --cov-report=term-missing --cov-report=json 2>&1)
UNIT_TEST_EXIT_CODE=$?

# Unit 테스트 실패 시 종료
if [ $UNIT_TEST_EXIT_CODE -ne 0 ]; then
    echo "$UNIT_TEST_OUTPUT"
    echo ""
    echo "❌ Unit 테스트가 실패했습니다. 커버리지 검증을 건너뜁니다."
    exit $UNIT_TEST_EXIT_CODE
fi

echo "$UNIT_TEST_OUTPUT"

# 2. Scenario 테스트 실행
echo ""
echo "🎭 Scenario 테스트 실행 중..."
SCENARIO_TEST_OUTPUT=$(python -m pytest tests/scenario/ -v --tb=short 2>&1)
SCENARIO_TEST_EXIT_CODE=$?

# Scenario 테스트 실패 시 종료
if [ $SCENARIO_TEST_EXIT_CODE -ne 0 ]; then
    echo "$SCENARIO_TEST_OUTPUT"
    echo ""
    echo "❌ Scenario 테스트가 실패했습니다."
    exit $SCENARIO_TEST_EXIT_CODE
fi

echo "$SCENARIO_TEST_OUTPUT"
echo "✅ Scenario 테스트 통과!"

# 3. Acceptance 테스트 실행 (있는 경우)
if [ -d "tests/acceptance" ] && [ "$(ls -A tests/acceptance 2>/dev/null)" ]; then
    echo ""
    echo "✅ Acceptance 테스트 실행 중..."
    ACCEPTANCE_TEST_OUTPUT=$(python -m pytest tests/acceptance/ -v --tb=short 2>&1)
    ACCEPTANCE_TEST_EXIT_CODE=$?

    # Acceptance 테스트 실패 시 종료 (exit code 5는 테스트 없음을 의미하므로 제외)
    if [ $ACCEPTANCE_TEST_EXIT_CODE -ne 0 ] && [ $ACCEPTANCE_TEST_EXIT_CODE -ne 5 ]; then
        echo "$ACCEPTANCE_TEST_OUTPUT"
        echo ""
        echo "❌ Acceptance 테스트가 실패했습니다."
        exit $ACCEPTANCE_TEST_EXIT_CODE
    fi

    if [ $ACCEPTANCE_TEST_EXIT_CODE -eq 5 ]; then
        echo ""
        echo "ℹ️  Acceptance 테스트가 없습니다. 건너뜁니다."
    else
        echo "$ACCEPTANCE_TEST_OUTPUT"
        echo "✅ Acceptance 테스트 통과!"
    fi
else
    echo ""
    echo "ℹ️  Acceptance 테스트가 없습니다. 건너뜁니다."
fi

# 4. 커버리지 결과 파싱
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

# 5. 프론트엔드 테스트 실행
echo ""
echo "🎨 프론트엔드 테스트 실행 중..."
cd frontend

# 프론트엔드 테스트 실행
FRONTEND_TEST_OUTPUT=$(npm run test:ci 2>&1)
FRONTEND_TEST_EXIT_CODE=$?

# 프론트엔드 테스트 실패 시 종료
if [ $FRONTEND_TEST_EXIT_CODE -ne 0 ]; then
    echo "$FRONTEND_TEST_OUTPUT"
    echo ""
    echo "❌ 프론트엔드 테스트가 실패했습니다."
    cd ..
    exit $FRONTEND_TEST_EXIT_CODE
fi

echo "$FRONTEND_TEST_OUTPUT"
echo "✅ 프론트엔드 테스트 통과!"

# 프론트엔드 커버리지 확인
# Jest는 coverage-final.json만 생성하므로, 이를 파싱하여 커버리지 계산
if [ -f "../coverage/frontend/coverage-final.json" ]; then
    FRONTEND_COVERAGE=$(node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('../coverage/frontend/coverage-final.json', 'utf8'));
      const files = Object.values(data);
      let totalStatements = 0, totalFunctions = 0, totalBranches = 0, totalLines = 0;
      let coveredStatements = 0, coveredFunctions = 0, coveredBranches = 0, coveredLines = 0;
      
      files.forEach(file => {
        if (file.s) {
          const statements = Object.keys(file.s);
          totalStatements += statements.length;
          coveredStatements += statements.filter(stmt => file.s[stmt] > 0).length;
        }
        if (file.f) {
          const functions = Object.keys(file.f);
          totalFunctions += functions.length;
          coveredFunctions += functions.filter(fn => file.f[fn] > 0).length;
        }
        if (file.b) {
          const branches = Object.keys(file.b);
          totalBranches += branches.length;
          coveredBranches += branches.filter(br => {
            const branchData = file.b[br];
            return Array.isArray(branchData) && branchData.some(c => c > 0);
          }).length;
        }
        if (file.statementMap && file.s) {
          Object.keys(file.s).forEach(stmt => {
            const stmtData = file.statementMap[stmt];
            if (stmtData && stmtData.start && stmtData.end) {
              const lines = stmtData.end.line - stmtData.start.line + 1;
              totalLines += lines;
              if (file.s[stmt] > 0) {
                coveredLines += lines;
              }
            }
          });
        }
      });
      
      const statementsPct = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
      const functionsPct = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
      const branchesPct = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
      const linesPct = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
      const coverage = (statementsPct + functionsPct + branchesPct + linesPct) / 4;
      console.log(coverage.toFixed(2));
    ")
    
    if (( $(echo "$FRONTEND_COVERAGE < $FRONTEND_COVERAGE_THRESHOLD" | bc -l) )); then
        echo ""
        echo "❌ 프론트엔드 커버리지 ${FRONTEND_COVERAGE}%가 최소 요구사항 ${FRONTEND_COVERAGE_THRESHOLD}% 미만입니다!"
        echo "⚠️  테스트 커버리지를 ${FRONTEND_COVERAGE_THRESHOLD}% 이상 달성해야 합니다."
        echo "📝 누락된 테스트를 작성하고 다시 실행해주세요."
        cd ..
        exit 1
    else
        echo ""
        echo "✅ 프론트엔드 커버리지 ${FRONTEND_COVERAGE}% (요구사항: ${FRONTEND_COVERAGE_THRESHOLD}% 이상)"
    fi
else
    echo ""
    echo "⚠️  프론트엔드 커버리지 파일을 찾을 수 없습니다. 커버리지 검증을 건너뜁니다."
fi

cd ..

echo ""
echo "✅ 모든 테스트 완료!"
