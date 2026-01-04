# Testing Rules

> ⚠️ **REMINDER**: Before starting work, read `rules/core.md` FIRST.
> 
> This file applies **ONLY** when adding or modifying tests.
> 
> Core rules in `rules/core.md` ALWAYS apply regardless of context.
> 
> **CRITICAL**: Test execution is MANDATORY before work completion (see `rules/core.md` → "Work Completion Checklist").

**Apply these rules ONLY when adding or modifying tests.**

## When to Apply

- ✅ Writing new tests (unit, component, scenario, E2E)
- ✅ Modifying existing tests
- ✅ Working with test infrastructure
- ✅ Setting up test mocks or fixtures
- ✅ Verifying test coverage

**If you're not writing tests, see:**
- Backend work → `rules/backend.md`
- Frontend work → `rules/frontend.md`
- Refactoring → `rules/refactoring.md`

## Test Directory Structure

### Backend Tests
- Location: `tests/backend/`
- Unit tests: `tests/backend/unit/` (domain, infrastructure, presentation layers)
- Scenario tests: `tests/backend/scenario/` (API endpoint interactions)
- Acceptance tests: `tests/backend/acceptance/` (full system validation)
- Naming: `test_*.py` (e.g., `test_user.py`, `test_auth.py`)

### Frontend Tests
- Location: `tests/frontend/`
- Unit tests: `tests/frontend/unit/` (utilities, business logic)
- Component tests: `tests/frontend/component/` (React components)
- E2E tests: `tests/frontend/e2e/` (Playwright)
- Naming: `*.test.ts`, `*.test.tsx` (e.g., `User.test.tsx`, `utils.test.ts`)

## Coverage Requirements

### Backend [CRITICAL]
- **Minimum 95% code coverage required**
- Coverage below 95% causes test failure
- All new features must include tests

### Frontend [CRITICAL]
- **Minimum 95% code coverage required**
- **100% coverage for critical user flows**
- Coverage below 95% causes test failure

### Enforcement
- `run_tests.sh` validates coverage thresholds
- Work cannot proceed if coverage is insufficient
- Fix coverage issues before continuing

## Scenario Tests

### When Required [MANDATORY]
- **MANDATORY** for all major user flows
- Required when adding new features that involve multiple API endpoints

### Location
- `tests/backend/scenario/`
- Separate file per feature (e.g., `test_user_scenarios.py`, `test_test_taking_scenarios.py`)

### Scope
- Verify interactions between multiple API endpoints
- Validate complete user flows (e.g., user creation → test start → question fetch → answer submission → result view)
- Verify data flow and state transitions

### Writing Principles
- One scenario test = one complete user flow
- Naming: `test_scenario_<user_action>_<expected_result>` (e.g., `test_scenario_user_takes_test_and_views_result`)
- Call APIs in the order a real user would
- Validate each step's response
- Extract data from responses for next steps

### Execution
- Scenario tests run with all unit tests
- Failure blocks all work progress

Reference: `DEVELOPMENT_GUIDELINES.md#31-백엔드-테스트-종류`

## Test Anti-Patterns (FORBIDDEN)

### Backend
- ❌ Direct database testing (use mocks)
- ❌ External API calls (use mocks)
- ❌ Time-dependent tests
- ❌ Non-deterministic tests
- ❌ Shared state between tests

### Frontend
- ❌ Direct DOM manipulation
- ❌ Testing implementation details
- ❌ Shared state between tests

## Frontend Testing Strategy

### Tool Stack
- Unit/Component: Vitest (or Jest) + Testing Library
- E2E: Playwright
- API Mocking: MSW (Mock Service Worker)

### Test Scope Decision
1. **Logic → Unit, UI Interaction → Component, Full Flow → E2E**
   - Unit: Pure functions, utilities, business logic
   - Component: React component rendering and interaction
   - E2E: Complete user flows in real browser

2. **Test What Users See**
   - Verify visible text, roles, labels
   - Forbid testing implementation details (internal state, props structure)
   - Consider accessibility: ARIA roles, labels, names

3. **Network: Use MSW for Success/Failure/Delay Cases**
   - Use MSW to intercept real network requests
   - Test success, failure, delay, timeout scenarios
   - Reflect actual API spec: write handlers based on OpenAPI spec

4. **Snapshot Tests: Use Sparingly**
   - Only for: important UI components, complex layouts, design system components
   - Forbid for: simple components, frequently changing components, components with dynamic data

### TypeScript Type Checking [CRITICAL]
- **MANDATORY** for all frontend code changes
- Type check runs automatically in `run_tests.sh` before frontend tests
- Type check failure (exit code != 0) blocks work completion
- Manual check: `npm run typecheck`
- CI check: `npm run test:ci` includes type checking

**Violation**: TypeScript type check failure stops all work. Fix type errors before proceeding.

Reference: `docs/development/frontend-testing.md`

## Test Execution

### Before Work Completion [CRITICAL]
- **MANDATORY**: Run `./run_tests.sh` before declaring work complete
- Exit code MUST be 0
- All tests must pass
- Coverage requirements must be met
- **Reference**: See `rules/core.md` → "Work Completion Checklist" for full verification steps

### Failure Handling
- If `run_tests.sh` fails (exit code != 0), work is NOT complete
- Identify failure cause
- Fix tests or add missing tests
- Re-run until success
- Do not declare completion until tests pass

**Violation**: Test execution and success verification is MANDATORY. Work is incomplete without it.

