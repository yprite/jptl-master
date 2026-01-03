# Core Rules

> ⚠️ **CRITICAL: READ THIS FIRST**
> 
> This file contains **[P0] MANDATORY** rules that **ALWAYS** apply to ALL work.
> 
> **You MUST read this file at the START of every work session.**
> 
> **You MUST re-read the "Work Completion Checklist" section before declaring work complete.**
> 
> Violating these rules results in incomplete work. Do not proceed without understanding these rules.

These rules ALWAYS apply to all work in this repository. They define architectural invariants, safety constraints, and non-negotiable principles.

## Development Principles

### Over-Engineering Prevention [P0]
- **KISS**: Keep It Simple, Stupid - avoid unnecessary complexity
- **YAGNI**: You Aren't Gonna Need It - implement only what's actually needed
- Focus on current requirements, not hypothetical future needs

### Test-Driven Development (TDD) [CRITICAL]
- Follow Red-Green-Refactor cycle
- Write tests BEFORE implementation
- Do not proceed to next step until all tests pass
- Reference: `DEVELOPMENT_GUIDELINES.md#04-개발-프로세스-문서--테스트--개발--커밋--pr--태스크-업데이트`

## Git Workflow

### Branch Strategy [MANDATORY]
- **Never work directly on `main` or `develop`**
- All work branches MUST branch from `develop`
- Branch naming: `feature/`, `bugfix/`, `docs/`, `refactor/`, `test/`
- Before starting work:
  1. Checkout `develop`: `git checkout develop`
  2. Update: `git pull origin develop`
  3. Create new branch: `git checkout -b <type>/<description>`

### Commit Rules [MANDATORY]
- Maximum 100 lines per commit
- One logical change per commit
- Commit frequently
- Commit immediately after any change
- Commit message format:
  ```
  type(scope): subject
  
  body
  
  footer
  ```
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Subject: 50 characters or less

### Push Rules [MANDATORY]
- Push immediately after every commit
- First push: `git push -u origin <branch-name>`
- Subsequent pushes: `git push`

### Pull Request Requirements [CRITICAL]
- **PR creation is MANDATORY** for all feature/bugfix/docs/refactor/test branches
- Create PR before declaring work complete
- Use GitHub CLI: `gh pr create --title "type(scope): subject" --body "description" --base develop`
- Include: work description, changes, test results
- Provide PR URL to user
- If PR creation fails, notify user immediately

## ⚠️ Work Completion Checklist [CRITICAL]

> **MANDATORY**: Before declaring work complete, you MUST verify ALL items below.
> 
> **Re-read this checklist before declaring work complete.**
> 
> **If ANY item is missing, work is NOT complete. Do not declare completion.**

Work is NOT complete until ALL of the following are done:

### 1. [P0] Feature Implementation Complete
- ✅ All planned features implemented
- ✅ Code follows architecture (see `rules/backend.md` or `rules/frontend.md`)

### 2. [CRITICAL] Tests Executed and Passing
**Reference**: See `rules/testing.md` for detailed testing requirements.

- ✅ **Run `./run_tests.sh`** - Exit code MUST be 0
- ✅ All unit tests pass
- ✅ All scenario tests pass (if applicable)
- ✅ Coverage requirements met:
  - Backend: Minimum 80% (see `rules/testing.md`)
  - Frontend: Minimum 80% + 100% for critical flows (see `rules/testing.md`)
- ✅ TypeScript type check passes (if frontend work)

**Violation**: If `run_tests.sh` fails or coverage is insufficient, work is NOT complete.

### 3. [MANDATORY] All Changes Committed and Pushed
- ✅ All changes committed (see commit rules above)
- ✅ All commits pushed to remote
- ✅ Commit messages follow format (see "Commit Rules" above)

### 4. [CRITICAL] Task Management Documents Updated
**Reference**: See "Task Management Updates" section below.

- ✅ `docs/task-management/current-sprint.md` updated
- ✅ `docs/task-management/backlog.md` updated
- ✅ Task status changed to "완료"
- ✅ Progress recalculated
- ✅ Update committed and pushed

**Violation**: Task management update is MANDATORY. Work is incomplete without it.

### 5. [CRITICAL] Design Documents Updated
**Reference**: See "Documentation Requirements" section below.

- ✅ Backend changes → Architecture docs updated
- ✅ Frontend changes → Frontend architecture docs updated
- ✅ API changes → `docs/api/` updated
- ✅ `docs/CHANGELOG.md` updated
- ✅ All documentation committed and pushed

**Violation**: Documentation update is MANDATORY. Work is incomplete without it.

### 6. [CRITICAL] Pull Request Created
**Reference**: See "Pull Request Requirements" above.

- ✅ PR created using GitHub CLI
- ✅ PR title follows commit message format
- ✅ PR body includes: work description, changes, test results
- ✅ PR base branch: `develop`
- ✅ PR URL provided to user

**Violation**: PR creation is MANDATORY. Work is incomplete without it.

### 7. [MANDATORY] PR URL Provided to User
- ✅ PR URL explicitly provided to user in response

**Violation**: If any item above is missing, work is NOT complete. Do not declare completion.

## Documentation Requirements

### When to Update [MANDATORY]
- Immediately when code changes
- Before PR creation
- When architecture changes

### What to Update
- **Backend changes**:
  - Entity/Domain Service → `docs/architecture/domain/`
  - Repository → `docs/architecture/repositories.md`
  - API → `docs/api/endpoints/`
  - DTO/Schema → `docs/api/schemas/`
- **Frontend changes**:
  - Component structure → frontend architecture docs
  - API calls → `docs/api/`
- **Architecture changes** → `docs/architecture/overview.md`
- **All changes** → `docs/CHANGELOG.md`

Reference: `docs/README.md`, `docs/CHANGELOG.md`

## Task Management Updates

### Sprint Management
- 1-week sprint cycles for task management
- Priority-based task processing (P0-P3)
- All tasks must meet acceptance criteria and follow templates
- Sprint documents and backlog updated in real-time

### When to Update [CRITICAL]
- Immediately after work completion
- Before PR creation
- Never skip, even for small tasks

### What to Update
1. **`docs/task-management/current-sprint.md`**:
   - Add completed task to "완료된_태스크" section
   - Include: task ID, title, completion date, points
   - Recalculate: completion points, progress percentage
   - Update: "진행중_태스크_수"
   - Add to "최근_활동_로그"

2. **`docs/task-management/backlog.md`**:
   - Change task status to "완료"
   - Recalculate: completion points, progress percentage
   - Update epic status if applicable
   - Update priority distribution

### Update Process
1. Read both documents
2. Extract task information (ID, title, points, epic)
3. Update both documents
4. Recalculate all metadata
5. Commit: `docs(task-management): update task status - <task_id> completed`
6. Push immediately

**Violation**: Task management update is MANDATORY. Work is incomplete without it.

**Related Rules**: See `rules/instructions.md` → "Pre-Completion Final Check" for verification steps.

## Problem-Solving Approach
- Prefer simplest, most direct solution
- Avoid unnecessary abstraction or complexity
- Base implementation on actual requirements
- Only approve changes verified by tests

## Code Review and Feedback

### When Reviewing Code
- Immediately flag violations of `DEVELOPMENT_GUIDELINES.md`
- **MANDATORY**: Check test coverage - backend 80%, frontend 80%
- If coverage is insufficient, stop work immediately
- If coverage is insufficient, write tests and re-run tests
- Review security and performance issues
- Evaluate code readability and maintainability

## Task Specification Documents

### When to Create
- When a task requires detailed explanation
- For complex tasks, analysis documents, design documents
- When task details are too extensive for backlog/current-sprint

### Location and Naming
- Location: `docs/task-management/tasks/`
- Naming: Associate with task ID (e.g., `test-coverage-gap-analysis.md`)
- Reference from: `backlog.md` or `current-sprint.md`

Reference: `docs/task-management/README.md`

## Related Documents
- `DEVELOPMENT_GUIDELINES.md`: Full development guidelines
- `docs/README.md`: Documentation structure
- `docs/requirements.md`: Project requirements
- `docs/development/setup.md`: Development environment setup
- `docs/architecture/overview.md`: Architecture overview
- `docs/task-management/README.md`: Task management guide

