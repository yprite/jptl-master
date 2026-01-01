#!/bin/bash
# JLPT 프로젝트 테스트 실행 스크립트 (모듈화 버전)

# ============================================================================
# 초기 설정 섹션
# ============================================================================

# PYTHONPATH 설정 및 가상환경 활성화
export PYTHONPATH="/Users/yprite/IdeaProjects/Cursor_pro/AI_DRIVEN_DEVELOP/backend"
source backend/venv/bin/activate

# 커버리지 임계값 설정
BACKEND_COVERAGE_THRESHOLD=80
FRONTEND_COVERAGE_THRESHOLD=80

# ============================================================================
# 함수 정의 섹션
# ============================================================================

# 백엔드 유닛 테스트 실행
run_backend_unit_tests() {
    echo ""
    echo "📊 백엔드 Unit 테스트 실행 및 커버리지 측정 중..."
    UNIT_TEST_OUTPUT=$(python -m pytest tests/unit/ -v --tb=short --cov=backend --cov-report=term-missing --cov-report=json 2>&1)
    UNIT_TEST_EXIT_CODE=$?

    if [ $UNIT_TEST_EXIT_CODE -ne 0 ]; then
        echo "$UNIT_TEST_OUTPUT"
        echo ""
        echo "❌ 백엔드 Unit 테스트가 실패했습니다."
        return $UNIT_TEST_EXIT_CODE
    fi

    echo "$UNIT_TEST_OUTPUT"
    return 0
}

# 백엔드 커버리지 검증
check_backend_coverage() {
    if [ -f "coverage.json" ]; then
        echo ""
        echo "📊 백엔드 커버리지 검증 중..."
        COVERAGE=$(python -c "import json; data = json.load(open('coverage.json')); print(f\"{data['totals']['percent_covered']:.2f}\")")
        
        if (( $(echo "$COVERAGE < $BACKEND_COVERAGE_THRESHOLD" | bc -l) )); then
            echo ""
            echo "❌ 백엔드 커버리지 ${COVERAGE}%가 최소 요구사항 ${BACKEND_COVERAGE_THRESHOLD}% 미만입니다!"
            echo "⚠️  테스트 커버리지를 ${BACKEND_COVERAGE_THRESHOLD}% 이상 달성해야 합니다."
            echo "📝 누락된 테스트를 작성하고 다시 실행해주세요."
            return 1
        else
            echo ""
            echo "✅ 백엔드 커버리지 ${COVERAGE}% (요구사항: ${BACKEND_COVERAGE_THRESHOLD}% 이상)"
            return 0
        fi
    else
        echo ""
        echo "⚠️  백엔드 커버리지 파일을 찾을 수 없습니다. 커버리지 검증을 건너뜁니다."
        return 0
    fi
}

# 백엔드 시나리오 테스트 실행
run_backend_scenario_tests() {
    echo ""
    echo "🎭 백엔드 Scenario 테스트 실행 중..."
    SCENARIO_TEST_OUTPUT=$(python -m pytest tests/scenario/ -v --tb=short 2>&1)
    SCENARIO_TEST_EXIT_CODE=$?

    if [ $SCENARIO_TEST_EXIT_CODE -ne 0 ]; then
        echo "$SCENARIO_TEST_OUTPUT"
        echo ""
        echo "❌ 백엔드 Scenario 테스트가 실패했습니다."
        return $SCENARIO_TEST_EXIT_CODE
    fi

    echo "$SCENARIO_TEST_OUTPUT"
    echo "✅ 백엔드 Scenario 테스트 통과!"
    return 0
}

# 백엔드 Acceptance 테스트 실행
run_backend_acceptance_tests() {
    if [ -d "tests/acceptance" ] && [ "$(ls -A tests/acceptance 2>/dev/null)" ]; then
        echo ""
        echo "✅ 백엔드 Acceptance 테스트 실행 중..."
        ACCEPTANCE_TEST_OUTPUT=$(python -m pytest tests/acceptance/ -v --tb=short 2>&1)
        ACCEPTANCE_TEST_EXIT_CODE=$?

        # exit code 5는 테스트 없음을 의미하므로 제외
        if [ $ACCEPTANCE_TEST_EXIT_CODE -ne 0 ] && [ $ACCEPTANCE_TEST_EXIT_CODE -ne 5 ]; then
            echo "$ACCEPTANCE_TEST_OUTPUT"
            echo ""
            echo "❌ 백엔드 Acceptance 테스트가 실패했습니다."
            return $ACCEPTANCE_TEST_EXIT_CODE
        fi

        if [ $ACCEPTANCE_TEST_EXIT_CODE -eq 5 ]; then
            echo ""
            echo "ℹ️  백엔드 Acceptance 테스트가 없습니다. 건너뜁니다."
            return 0
        else
            echo "$ACCEPTANCE_TEST_OUTPUT"
            echo "✅ 백엔드 Acceptance 테스트 통과!"
            return 0
        fi
    else
        echo ""
        echo "ℹ️  백엔드 Acceptance 테스트가 없습니다. 건너뜁니다."
        return 0
    fi
}

# 프론트엔드 TypeScript 타입 체크
run_frontend_typecheck() {
    echo ""
    echo "🔍 프론트엔드 TypeScript 타입 체크 중..."
    cd frontend

    TYPE_CHECK_OUTPUT=$(npm run typecheck 2>&1)
    TYPE_CHECK_EXIT_CODE=$?

    if [ $TYPE_CHECK_EXIT_CODE -ne 0 ]; then
        echo "$TYPE_CHECK_OUTPUT"
        echo ""
        echo "❌ 프론트엔드 TypeScript 타입 체크가 실패했습니다."
        echo "⚠️  타입 에러를 수정하고 다시 실행해주세요."
        cd ..
        return $TYPE_CHECK_EXIT_CODE
    fi

    echo "$TYPE_CHECK_OUTPUT"
    echo "✅ 프론트엔드 타입 체크 통과!"
    cd ..
    return 0
}

# 프론트엔드 유닛 테스트 실행 (타입 체크 포함 여부를 인자로 받음)
run_frontend_unit_tests() {
    local INCLUDE_TYPECHECK=${1:-true}
    
    echo ""
    echo "🎨 프론트엔드 Unit 테스트 실행 중..."
    cd frontend

    if [ "$INCLUDE_TYPECHECK" = "true" ]; then
        # 타입 체크 포함 (test:ci 사용)
        FRONTEND_TEST_OUTPUT=$(npm run test:ci 2>&1)
    else
        # 타입 체크 제외 (test만 사용)
        FRONTEND_TEST_OUTPUT=$(npm test -- --coverage --coverageDirectory=../coverage/frontend --coverageThreshold='{"global":{"branches":65,"functions":75,"lines":70,"statements":70}}' 2>&1)
    fi
    FRONTEND_TEST_EXIT_CODE=$?

    if [ $FRONTEND_TEST_EXIT_CODE -ne 0 ]; then
        echo "$FRONTEND_TEST_OUTPUT"
        echo ""
        echo "❌ 프론트엔드 Unit 테스트가 실패했습니다."
        cd ..
        return $FRONTEND_TEST_EXIT_CODE
    fi

    echo "$FRONTEND_TEST_OUTPUT"
    echo "✅ 프론트엔드 Unit 테스트 통과!"

    # 프론트엔드 커버리지 확인
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
            return 1
        else
            echo ""
            echo "✅ 프론트엔드 커버리지 ${FRONTEND_COVERAGE}% (요구사항: ${FRONTEND_COVERAGE_THRESHOLD}% 이상)"
        fi
    else
        echo ""
        echo "⚠️  프론트엔드 커버리지 파일을 찾을 수 없습니다. 커버리지 검증을 건너뜁니다."
    fi

    cd ..
    return 0
}

# 프론트엔드 컴포넌트 테스트 실행
run_frontend_component_tests() {
    local INCLUDE_TYPECHECK=${1:-true}
    
    echo ""
    echo "🎨 프론트엔드 Component 테스트 실행 중..."
    cd frontend

    if [ "$INCLUDE_TYPECHECK" = "true" ]; then
        # 타입 체크 포함
        run_frontend_typecheck || return $?
    fi

    # 컴포넌트 테스트만 실행 (src/__tests__/component/ 디렉토리)
    # 커버리지 임계값은 components/organisms에만 적용
    FRONTEND_TEST_OUTPUT=$(npm test -- --testPathPattern="__tests__/component" --coverage --coverageDirectory=../coverage/frontend --collectCoverageFrom="src/components/organisms/**/*.{ts,tsx}" --coverageThreshold='{"global":{"branches":65,"functions":75,"lines":70,"statements":70}}' 2>&1)
    FRONTEND_TEST_EXIT_CODE=$?

    if [ $FRONTEND_TEST_EXIT_CODE -ne 0 ]; then
        echo "$FRONTEND_TEST_OUTPUT"
        echo ""
        echo "❌ 프론트엔드 Component 테스트가 실패했습니다."
        cd ..
        return $FRONTEND_TEST_EXIT_CODE
    fi

    echo "$FRONTEND_TEST_OUTPUT"
    echo "✅ 프론트엔드 Component 테스트 통과!"

    # 프론트엔드 커버리지 확인 (컴포넌트 테스트용 - components/organisms만 계산)
    if [ -f "../coverage/frontend/coverage-final.json" ]; then
        FRONTEND_COVERAGE=$(node -e "
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('../coverage/frontend/coverage-final.json', 'utf8'));
          const files = Object.values(data);
          let totalStatements = 0, totalFunctions = 0, totalBranches = 0, totalLines = 0;
          let coveredStatements = 0, coveredFunctions = 0, coveredBranches = 0, coveredLines = 0;
          
          files.forEach(file => {
            // components/organisms 디렉토리만 포함
            if (!file.path || !file.path.includes('components/organisms')) {
              return;
            }
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
            return 1
        else
            echo ""
            echo "✅ 프론트엔드 커버리지 ${FRONTEND_COVERAGE}% (요구사항: ${FRONTEND_COVERAGE_THRESHOLD}% 이상)"
        fi
    else
        echo ""
        echo "⚠️  프론트엔드 커버리지 파일을 찾을 수 없습니다. 커버리지 검증을 건너뜁니다."
    fi

    cd ..
    return 0
}

# 프론트엔드 유닛 테스트만 실행 (unit 디렉토리만)
run_frontend_unit_only_tests() {
    local INCLUDE_TYPECHECK=${1:-true}
    
    echo ""
    echo "🎨 프론트엔드 Unit 테스트만 실행 중..."
    cd frontend

    if [ "$INCLUDE_TYPECHECK" = "true" ]; then
        # 타입 체크 포함
        run_frontend_typecheck || return $?
    fi

    # 유닛 테스트만 실행 (src/__tests__/unit/ 디렉토리)
    # 커버리지 임계값은 services에만 적용
    FRONTEND_TEST_OUTPUT=$(npm test -- --testPathPattern="__tests__/unit" --coverage --coverageDirectory=../coverage/frontend --collectCoverageFrom="src/services/**/*.{ts,tsx}" --coverageThreshold='{"global":{"branches":65,"functions":75,"lines":70,"statements":70}}' 2>&1)
    FRONTEND_TEST_EXIT_CODE=$?

    if [ $FRONTEND_TEST_EXIT_CODE -ne 0 ]; then
        echo "$FRONTEND_TEST_OUTPUT"
        echo ""
        echo "❌ 프론트엔드 Unit 테스트가 실패했습니다."
        cd ..
        return $FRONTEND_TEST_EXIT_CODE
    fi

    echo "$FRONTEND_TEST_OUTPUT"
    echo "✅ 프론트엔드 Unit 테스트 통과!"

    # 프론트엔드 커버리지 확인 (유닛 테스트용 - services만 계산)
    if [ -f "../coverage/frontend/coverage-final.json" ]; then
        FRONTEND_COVERAGE=$(node -e "
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('../coverage/frontend/coverage-final.json', 'utf8'));
          const files = Object.values(data);
          let totalStatements = 0, totalFunctions = 0, totalBranches = 0, totalLines = 0;
          let coveredStatements = 0, coveredFunctions = 0, coveredBranches = 0, coveredLines = 0;
          
          files.forEach(file => {
            // services 디렉토리만 포함
            if (!file.path || !file.path.includes('services/')) {
              return;
            }
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
            return 1
        else
            echo ""
            echo "✅ 프론트엔드 커버리지 ${FRONTEND_COVERAGE}% (요구사항: ${FRONTEND_COVERAGE_THRESHOLD}% 이상)"
        fi
    else
        echo ""
        echo "⚠️  프론트엔드 커버리지 파일을 찾을 수 없습니다. 커버리지 검증을 건너뜁니다."
    fi

    cd ..
    return 0
}

# 프론트엔드 E2E 테스트 실행
run_frontend_e2e_tests() {
    echo ""
    echo "🌐 프론트엔드 E2E 테스트 실행 중..."

    # 백엔드 서버 시작 (E2E 테스트에 필요)
    echo ""
    echo "🔧 백엔드 서버 시작 중 (E2E 테스트용)..."

    # E2E에 필요한 최소 데이터(예: N5 문제)가 없으면 테스트 시작 단계에서 실패할 수 있으므로,
    # 대화형 프롬프트 없이 최소 문제 수를 보장하도록 시드합니다.
    echo ""
    echo "🌱 E2E 테스트용 N5 문제 시딩(최소 20개 보장) 중..."
    python scripts/seed_n5_questions.py --ensure-minimum 20 --non-interactive 2>&1 || true

    # 기존 백엔드 서버 프로세스 확인 및 종료
    BACKEND_PID_FILE=".backend.pid"
    if [ -f "$BACKEND_PID_FILE" ]; then
        OLD_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo "⚠️  기존 Backend 서버 발견 (PID: $OLD_PID). 종료합니다..."
            kill "$OLD_PID" 2>/dev/null || true
            sleep 1
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # 백엔드 서버 백그라운드 실행
    python run.py > .backend.e2e.log 2>&1 &
    BACKEND_PID=$!
    echo "$BACKEND_PID" > "$BACKEND_PID_FILE"

    # 서버가 준비될 때까지 대기 (최대 30초)
    echo "⏳ 백엔드 서버 준비 대기 중..."
    MAX_WAIT=30
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ 백엔드 서버가 준비되었습니다 (PID: $BACKEND_PID)"
            break
        fi
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
        echo -n "."
    done
    echo ""

    # 서버가 시작되지 않았으면 종료
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        echo "❌ 백엔드 서버가 30초 내에 시작되지 않았습니다."
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            kill "$BACKEND_PID" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
        return 1
    fi

    # E2E 테스트 실행
    cd frontend
    # NODE_PATH를 설정하여 frontend/node_modules를 모듈 해석 경로에 추가
    export NODE_PATH="$(pwd)/node_modules:${NODE_PATH:-}"
    # CI 환경 변수 설정 (헤드리스 모드 및 기존 서버 재사용 방지)
    export CI=true

    # Playwright webServer는 CI 환경에서 reuseExistingServer=false 이므로
    # 3000 포트에 다른 프로세스가 떠 있으면 즉시 실패합니다. E2E 직전에 정리합니다.
    echo ""
    echo "🧹 프론트엔드 3000 포트 점유 프로세스 정리 중..."
    FRONTEND_PORT_PIDS=$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "${FRONTEND_PORT_PIDS}" ]; then
        echo "⚠️  3000 포트 점유 프로세스 발견: ${FRONTEND_PORT_PIDS}"
        # 여러 PID가 반환될 수 있으므로 공백/개행 기준으로 안전하게 kill
        for pid in ${FRONTEND_PORT_PIDS}; do
            kill "${pid}" 2>/dev/null || true
        done
        sleep 1
    else
        echo "✅ 3000 포트가 비어 있습니다."
    fi

    # Playwright 브라우저 설치 확인 및 설치 (최초 실행/업데이트 후 필요)
    echo ""
    echo "⬇️  Playwright 브라우저 설치 확인/설치 중..."
    echo "ℹ️  이미 설치되어 있으면 빠르게 완료되고, 설치가 필요하면 다운로드 진행 상황이 표시됩니다."

    # 설치 로그를 실시간으로 출력하면서 파일로도 저장
    PLAYWRIGHT_INSTALL_LOG="../.playwright-install.log"
    rm -f "$PLAYWRIGHT_INSTALL_LOG"

    # 설치 시작 시간 기록
    INSTALL_START_TIME=$(date +%s)
    echo "⏳ 시작 시간: $(date '+%H:%M:%S')"
    echo ""

    # 설치 실행 (진행 상황을 실시간으로 표시)
    # --with-deps 옵션으로 의존성도 함께 설치하고 더 자세한 출력
    # stdbuf를 사용하여 출력 버퍼링 비활성화 (실시간 출력 보장)
    if command -v stdbuf > /dev/null 2>&1; then
        stdbuf -oL -eL npx playwright install --with-deps chromium 2>&1 | tee "$PLAYWRIGHT_INSTALL_LOG"
    else
        # stdbuf가 없으면 일반 tee 사용
        npx playwright install --with-deps chromium 2>&1 | tee "$PLAYWRIGHT_INSTALL_LOG"
    fi
    PLAYWRIGHT_INSTALL_EXIT_CODE=${PIPESTATUS[0]}

    # 설치 종료 시간 기록
    INSTALL_END_TIME=$(date +%s)
    INSTALL_DURATION=$((INSTALL_END_TIME - INSTALL_START_TIME))

    echo ""
    if [ $PLAYWRIGHT_INSTALL_EXIT_CODE -eq 0 ]; then
        if [ $INSTALL_DURATION -lt 5 ]; then
            echo "✅ Playwright 브라우저가 이미 설치되어 있었습니다. (확인 시간: ${INSTALL_DURATION}초)"
        else
            echo "✅ Playwright 브라우저 설치 완료 (소요 시간: ${INSTALL_DURATION}초)"
        fi
    else
        echo "❌ Playwright 브라우저 설치가 실패했습니다. (exit code: $PLAYWRIGHT_INSTALL_EXIT_CODE, 소요 시간: ${INSTALL_DURATION}초)"
        echo "📄 설치 로그: $PLAYWRIGHT_INSTALL_LOG"
        cd ..
        # 백엔드 서버 종료
        if [ -f "$BACKEND_PID_FILE" ]; then
            BACKEND_PID=$(cat "$BACKEND_PID_FILE")
            if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
                kill "$BACKEND_PID" 2>/dev/null || true
            fi
            rm -f "$BACKEND_PID_FILE"
            rm -f .backend.e2e.log
        fi
        return $PLAYWRIGHT_INSTALL_EXIT_CODE
    fi

    # E2E 테스트 실행 (진행 상황을 실시간으로 표시)
    echo ""
    echo "🧪 E2E 테스트 실행 중..."
    echo "ℹ️  테스트 진행 상황이 실시간으로 표시됩니다."
    echo "⏳ 테스트 시작: $(date '+%H:%M:%S')"
    echo ""

    # E2E 테스트 로그 파일
    E2E_TEST_LOG="../.e2e-test.log"
    rm -f "$E2E_TEST_LOG"

    # 테스트 시작 시간 기록
    E2E_START_TIME=$(date +%s)

    # 테스트 실행 (진행 상황을 실시간으로 표시하면서 파일로도 저장)
    # stdbuf를 사용하여 출력 버퍼링 비활성화 (실시간 출력 보장)
    if command -v stdbuf > /dev/null 2>&1; then
        stdbuf -oL -eL npm run test:e2e 2>&1 | tee "$E2E_TEST_LOG"
    else
        # stdbuf가 없으면 일반 tee 사용
        npm run test:e2e 2>&1 | tee "$E2E_TEST_LOG"
    fi
    E2E_TEST_EXIT_CODE=${PIPESTATUS[0]}

    # 테스트 종료 시간 기록
    E2E_END_TIME=$(date +%s)
    E2E_DURATION=$((E2E_END_TIME - E2E_START_TIME))
    E2E_MINUTES=$((E2E_DURATION / 60))
    E2E_SECONDS=$((E2E_DURATION % 60))

    echo ""
    echo "⏰ 테스트 종료: $(date '+%H:%M:%S') (소요 시간: ${E2E_MINUTES}분 ${E2E_SECONDS}초)"

    # 백엔드 서버 종료
    cd ..
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            echo ""
            echo "🛑 백엔드 서버 종료 중 (PID: $BACKEND_PID)..."
            kill "$BACKEND_PID" 2>/dev/null || true
            sleep 1
        fi
        rm -f "$BACKEND_PID_FILE"
        rm -f .backend.e2e.log
    fi

    # E2E 테스트 결과 확인
    if [ $E2E_TEST_EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 프론트엔드 E2E 테스트가 실패했습니다. (exit code: $E2E_TEST_EXIT_CODE)"
        echo "📄 테스트 로그: $E2E_TEST_LOG"
        echo ""
        echo "💡 실패한 테스트를 확인하려면:"
        echo "   - 로그 파일 확인: cat $E2E_TEST_LOG"
        echo "   - Playwright 리포트 확인: cd frontend && npx playwright show-report"
        return $E2E_TEST_EXIT_CODE
    fi

    echo ""
    echo "✅ 프론트엔드 E2E 테스트 통과!"
    return 0
}

# 도움말 출력
show_help() {
    cat << EOF
사용법: $0 [옵션]

옵션:
  --backend-unit          백엔드 유닛 테스트만 실행
  --backend-scenario      백엔드 시나리오 테스트만 실행
  --backend-acceptance    백엔드 acceptance 테스트만 실행
  --backend-all           백엔드 모든 테스트 실행 (unit + scenario + acceptance)
  --frontend-unit         프론트엔드 유닛 테스트만 실행 (unit 디렉토리)
  --frontend-component    프론트엔드 컴포넌트 테스트만 실행 (component 디렉토리)
  --frontend-e2e          프론트엔드 E2E 테스트만 실행
  --frontend-all          프론트엔드 모든 테스트 실행 (unit + component + e2e)
  --all                   모든 테스트 실행 (기본값)
  --help, -h              이 도움말 표시

예시:
  $0                                    # 모든 테스트 실행
  $0 --backend-unit                     # 백엔드 유닛 테스트만
  $0 --backend-scenario                 # 백엔드 시나리오 테스트만
  $0 --frontend-component                # 프론트엔드 컴포넌트 테스트만
  $0 --frontend-unit                     # 프론트엔드 유닛 테스트만
  $0 --backend-unit --frontend-unit      # 백엔드와 프론트엔드 유닛 테스트
  $0 --backend-all                       # 백엔드 전체 테스트
EOF
}

# ============================================================================
# 인자 파싱 섹션
# ============================================================================

# 플래그 초기화
RUN_BACKEND_UNIT=false
RUN_BACKEND_SCENARIO=false
RUN_BACKEND_ACCEPTANCE=false
RUN_BACKEND_ALL=false
RUN_FRONTEND_UNIT=false
RUN_FRONTEND_COMPONENT=false
RUN_FRONTEND_E2E=false
RUN_FRONTEND_ALL=false
RUN_ALL=false

# 인자가 없으면 모든 테스트 실행
if [ $# -eq 0 ]; then
    RUN_ALL=true
fi

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-unit)
            RUN_BACKEND_UNIT=true
            shift
            ;;
        --backend-scenario)
            RUN_BACKEND_SCENARIO=true
            shift
            ;;
        --backend-acceptance)
            RUN_BACKEND_ACCEPTANCE=true
            shift
            ;;
        --backend-all)
            RUN_BACKEND_ALL=true
            shift
            ;;
        --frontend-unit)
            RUN_FRONTEND_UNIT=true
            shift
            ;;
        --frontend-component)
            RUN_FRONTEND_COMPONENT=true
            shift
            ;;
        --frontend-e2e)
            RUN_FRONTEND_E2E=true
            shift
            ;;
        --frontend-all)
            RUN_FRONTEND_ALL=true
            shift
            ;;
        --all)
            RUN_ALL=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "❌ 알 수 없는 옵션: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

# ============================================================================
# 메인 실행 로직
# ============================================================================

echo "🚀 JLPT 프로젝트 테스트 실행 중..."

# 실행할 테스트가 없으면 도움말 표시
if [ "$RUN_ALL" = false ] && [ "$RUN_BACKEND_UNIT" = false ] && [ "$RUN_BACKEND_SCENARIO" = false ] && \
   [ "$RUN_BACKEND_ACCEPTANCE" = false ] && [ "$RUN_BACKEND_ALL" = false ] && \
   [ "$RUN_FRONTEND_UNIT" = false ] && [ "$RUN_FRONTEND_COMPONENT" = false ] && \
   [ "$RUN_FRONTEND_E2E" = false ] && [ "$RUN_FRONTEND_ALL" = false ]; then
    echo "❌ 실행할 테스트를 지정해주세요."
    echo ""
    show_help
    exit 1
fi

# 종료 코드 추적
EXIT_CODE=0

# 모든 테스트 실행
if [ "$RUN_ALL" = true ]; then
    # 백엔드 테스트
    run_backend_unit_tests || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    check_backend_coverage || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    run_backend_scenario_tests || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    run_backend_acceptance_tests || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    # 프론트엔드 테스트
    run_frontend_typecheck || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    run_frontend_unit_only_tests false || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    run_frontend_component_tests false || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
    
    run_frontend_e2e_tests || EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ 테스트 실행이 중단되었습니다."
        exit $EXIT_CODE
    fi
else
    # 백엔드 전체 테스트
    if [ "$RUN_BACKEND_ALL" = true ]; then
        run_backend_unit_tests || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        
        check_backend_coverage || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        
        run_backend_scenario_tests || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        
        run_backend_acceptance_tests || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
    else
        # 개별 백엔드 테스트
        if [ "$RUN_BACKEND_UNIT" = true ]; then
            run_backend_unit_tests || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
            
            check_backend_coverage || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        fi
        
        if [ "$RUN_BACKEND_SCENARIO" = true ]; then
            run_backend_scenario_tests || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        fi
        
        if [ "$RUN_BACKEND_ACCEPTANCE" = true ]; then
            run_backend_acceptance_tests || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        fi
    fi
    
    # 프론트엔드 전체 테스트
    if [ "$RUN_FRONTEND_ALL" = true ]; then
        run_frontend_typecheck || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        
        run_frontend_unit_only_tests false || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        
        run_frontend_component_tests false || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        
        run_frontend_e2e_tests || EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
    else
        # 개별 프론트엔드 테스트
        if [ "$RUN_FRONTEND_UNIT" = true ]; then
            run_frontend_typecheck || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
            
            run_frontend_unit_only_tests false || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        fi
        
        if [ "$RUN_FRONTEND_COMPONENT" = true ]; then
            run_frontend_typecheck || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
            
            run_frontend_component_tests false || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        fi
        
        if [ "$RUN_FRONTEND_E2E" = true ]; then
            run_frontend_e2e_tests || EXIT_CODE=$?
            if [ $EXIT_CODE -ne 0 ]; then exit $EXIT_CODE; fi
        fi
    fi
fi

# 모든 테스트 완료
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ 모든 테스트 완료!"
fi

exit $EXIT_CODE
