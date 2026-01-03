# Development Validation Commands

This document lists standard commands to validate changes. Use these commands based on the scope and risk of your modifications.

## Command Categories

### Backend Validation

#### Unit Tests
```bash
# Run all backend unit tests with coverage
./run_tests.sh --backend-unit

# Or directly:
cd backend
source venv/bin/activate
pytest tests/unit/ -v --cov=backend --cov-report=term-missing
```

#### Scenario Tests
```bash
# Run backend scenario/integration tests
./run_tests.sh --backend-scenario

# Or directly:
pytest tests/scenario/ -v
```

#### All Backend Tests
```bash
# Run all backend tests (unit + scenario + acceptance)
./run_tests.sh --backend-all
```

#### Type Checking (Python)
```bash
# Python type checking (if mypy is configured)
# Note: Currently not configured, but can be added
mypy backend/ --ignore-missing-imports
```

### Frontend Validation

#### TypeScript Type Check
```bash
# Check TypeScript types without running tests
cd frontend
npm run typecheck

# Or directly:
tsc --noEmit
```

#### Unit Tests
```bash
# Run frontend unit tests (services only)
./run_tests.sh --frontend-unit

# Or directly:
cd frontend
npm test -- --testPathPattern="__tests__/unit" --coverage
```

#### Component Tests
```bash
# Run frontend component tests
./run_tests.sh --frontend-component

# Or directly:
cd frontend
npm test -- --testPathPattern="__tests__/component" --coverage
```

#### E2E Tests
```bash
# Run end-to-end tests (requires backend server)
./run_tests.sh --frontend-e2e

# Or directly:
cd frontend
npm run test:e2e
```

#### All Frontend Tests
```bash
# Run all frontend tests (typecheck + unit + component + e2e)
./run_tests.sh --frontend-all
```

### Full Validation

#### All Tests
```bash
# Run all tests (backend + frontend)
./run_tests.sh

# Or explicitly:
./run_tests.sh --all
```

## When to Run Which Commands

### Small Changes (Single File, Bug Fixes)

**Required Commands:**
- Relevant unit tests for the modified file
- Type check (if frontend): `cd frontend && npm run typecheck`

**Example:**
- Fixing a bug in a single backend service:
  ```bash
  pytest tests/unit/infrastructure/repositories/test_user_repository.py -v
  ```
- Fixing a frontend component:
  ```bash
  cd frontend
  npm run typecheck
  npm test -- --testPathPattern="__tests__/component/YourComponent.test" --coverage
  ```

### Refactoring (Multiple Files, Same Module)

**Required Commands:**
- All unit tests for the affected module
- All component tests (if frontend refactoring)
- Type check (if frontend): `cd frontend && npm run typecheck`

**Example:**
- Refactoring backend repository layer:
  ```bash
  pytest tests/unit/infrastructure/repositories/ -v --cov=backend.infrastructure.repositories
  ```
- Refactoring frontend services:
  ```bash
  cd frontend
  npm run typecheck
  ./run_tests.sh --frontend-unit
  ```

### Risky or Cross-Module Changes

**Required Commands:**
- **MANDATORY**: `./run_tests.sh` (all tests)
- Verify coverage meets thresholds (Backend: 80%, Frontend: 80%)
- E2E tests (if affecting user flows)

**Example:**
- Changing authentication logic:
  ```bash
  ./run_tests.sh --backend-all
  ./run_tests.sh --frontend-all
  ```
- Modifying API contracts:
  ```bash
  ./run_tests.sh  # Full test suite
  ```

### Architecture Changes

**Required Commands:**
- **MANDATORY**: `./run_tests.sh` (all tests)
- All scenario tests
- All E2E tests
- Coverage verification

**Example:**
- Adding new domain entity:
  ```bash
  ./run_tests.sh --backend-all
  # Verify new entity tests pass
  ```
- Changing API structure:
  ```bash
  ./run_tests.sh  # Full validation
  ```

## Coverage Requirements

### Backend Coverage
- **Minimum**: 80% overall coverage
- **Command to check**: Coverage is reported when running `./run_tests.sh --backend-unit`
- **Verification**: Check output for "✅ 백엔드 커버리지 X% (요구사항: 80% 이상)"

### Frontend Coverage
- **Minimum**: 80% overall coverage
- **Critical flows**: 100% coverage required
- **Command to check**: Coverage is reported when running frontend tests
- **Verification**: Check output for coverage percentages

## Pre-Commit Validation

**Before every commit, run:**
```bash
# For backend changes:
pytest tests/unit/ -v --tb=short

# For frontend changes:
cd frontend && npm run typecheck && npm test -- --watchAll=false

# For any change affecting both:
./run_tests.sh
```

## Pre-PR Validation

**Before creating PR, MANDATORY:**
```bash
# Full test suite
./run_tests.sh

# Verify exit code is 0
echo $?  # Should be 0
```

## Quick Validation Commands

### Backend Quick Check
```bash
# Fast unit tests only (no coverage)
pytest tests/unit/ -v --tb=line -q
```

### Frontend Quick Check
```bash
# Type check only
cd frontend && npm run typecheck
```

### Full Quick Check
```bash
# All tests but faster (no coverage reports)
pytest tests/ -v --tb=line -q
cd frontend && npm run typecheck && npm test -- --watchAll=false --coverage=false
```

## Troubleshooting

### Tests Fail Locally
1. Ensure virtual environment is activated: `source backend/venv/bin/activate`
2. Ensure dependencies are installed: `pip install -r backend/requirements.txt`
3. Check database is initialized: `python -m backend.infrastructure.config.database`
4. For frontend: `cd frontend && npm install`

### Coverage Below Threshold
1. Identify uncovered code from coverage report
2. Write tests for uncovered code
3. Re-run tests and verify coverage increases

### E2E Tests Fail
1. Ensure backend server is running: `python run.py`
2. Check backend health: `curl http://localhost:8000/health`
3. Verify test data is seeded: `python scripts/seed_n5_questions.py`
4. Check Playwright browsers are installed: `cd frontend && npx playwright install`

## Command Reference Summary

| Change Type | Required Commands | Optional Commands |
|------------|------------------|-------------------|
| Small bug fix | Unit tests for file | Type check |
| Refactoring | Module tests + type check | Component tests |
| Cross-module | `./run_tests.sh` | E2E tests |
| Architecture | `./run_tests.sh` + E2E | Full coverage report |
| Pre-commit | Relevant unit tests | Type check |
| Pre-PR | `./run_tests.sh` | - |

---

**Note**: When in doubt, run `./run_tests.sh` to ensure all changes are validated. It's better to catch issues early than to discover them in production.

