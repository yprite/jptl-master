# Rule System Instructions

This document explains how to use the rule system in `.cursor/rules/`.

## ⚠️ CRITICAL: Pre-Work Checklist

**BEFORE starting ANY work, you MUST:**

1. [ ] **Read `rules/core.md` FIRST** - These rules ALWAYS apply
2. [ ] **Identify work context** - Determine which additional rule files apply:
   - Backend work → Read `rules/backend.md`
   - Frontend work → Read `rules/frontend.md`
   - Writing tests → Read `rules/testing.md`
   - Refactoring → Read `rules/refactoring.md`
   - Legacy systems → Read `rules/legacy.md`
3. [ ] **Review Work Completion Checklist** - See `rules/core.md` → "Work Completion Checklist"
4. [ ] **Confirm understanding** - Ensure you understand all applicable rules before proceeding

**Violation**: Starting work without reading `rules/core.md` is FORBIDDEN.

## Rule File Organization

Rules are organized by context to reduce cognitive load and improve agent autonomy:

- **`core.md`**: Always applies. Read first.
- **`backend.md`**: Apply when modifying backend/service code.
- **`frontend.md`**: Apply when modifying frontend code or UI components.
- **`testing.md`**: Apply when adding or modifying tests.
- **`refactoring.md`**: Apply when refactoring existing code.
- **`legacy.md`**: Apply when touching legacy systems or migrations.

## When to Consult Which Rules

### Always Start Here
1. **Read `core.md` first** - These rules always apply.

### Context-Based Rules
2. **If modifying backend code** → Read `backend.md`
3. **If modifying frontend code** → Read `frontend.md`
4. **If writing or modifying tests** → Read `testing.md`
5. **If refactoring code** → Read `refactoring.md`
6. **If working with legacy systems** → Read `legacy.md`

### Multiple Contexts
- If a task involves multiple contexts (e.g., refactoring backend code with tests), read all relevant rule files.
- Core rules always apply regardless of context.

## Rule Application Logic

### Priority Order
1. **Core rules** (highest priority - always apply)
2. **Context-specific rules** (apply when in that context)
3. **Conflicts**: Core rules override context-specific rules if they conflict

### Rule Interpretation
- Rules are **declarative statements** - they state what must be done, not suggestions.
- Words like "MUST", "REQUIRED", "MANDATORY" indicate non-negotiable requirements.
- Words like "SHOULD", "RECOMMENDED" indicate best practices.
- Violation markers (❌) indicate forbidden practices.

### Work Completion
- Work is NOT complete until ALL applicable rules are satisfied.
- See `core.md` → "Work Completion Checklist" for mandatory items.
- Do not declare work complete if any mandatory item is missing.

## ⚠️ CRITICAL: Mid-Work Checkpoints

**At key points during work, you MUST re-check rules:**

### Before Committing
- [ ] Re-read relevant rule files for the changes you're committing
- [ ] Verify commit message follows format in `rules/core.md`
- [ ] Ensure tests pass (if applicable)
- [ ] Check coverage requirements (if applicable)

### Before Creating PR
- [ ] **MANDATORY**: Re-read `rules/core.md` → "Work Completion Checklist"
- [ ] Verify ALL checklist items are complete
- [ ] Confirm tests executed and passed
- [ ] Verify documentation updated
- [ ] Confirm task management documents updated
- [ ] Ensure PR follows format in `rules/core.md`

**Violation**: Creating PR without completing ALL checklist items is FORBIDDEN.

## ⚠️ CRITICAL: Pre-Completion Final Check

**BEFORE declaring work complete, you MUST:**

1. [ ] **Re-read `rules/core.md` → "Work Completion Checklist"** - Verify every item
2. [ ] **Run `./run_tests.sh`** - Exit code MUST be 0
3. [ ] **Verify coverage** - Backend 80%, Frontend 80%
4. [ ] **Check all commits pushed** - All changes must be in remote
5. [ ] **Verify documentation updated** - See `rules/core.md` → "Documentation Requirements"
6. [ ] **Confirm task management updated** - See `rules/core.md` → "Task Management Updates"
7. [ ] **Verify PR created** - See `rules/core.md` → "Pull Request Requirements"
8. [ ] **Provide PR URL to user** - This is MANDATORY

**Violation**: Declaring work complete without ALL items above is FORBIDDEN. Work is incomplete.

## Common Workflows

### Starting New Feature
1. Read `core.md` (Git workflow, TDD, etc.)
2. Read `backend.md` (if backend feature)
3. Read `frontend.md` (if frontend feature)
4. Read `testing.md` (tests required)
5. Follow core workflow: branch → test → implement → test → commit → PR

### Writing Tests
1. Read `core.md` (TDD, test execution)
2. Read `testing.md` (coverage, structure, anti-patterns)
3. Read `backend.md` or frontend testing section (if applicable)

### Refactoring
1. Read `core.md` (workflow, documentation)
2. Read `refactoring.md` (behavior preservation, incremental steps)
3. Read `testing.md` (ensure tests pass)

### Bug Fixes
1. Read `core.md` (workflow, PR requirements)
2. Read `backend.md` (if backend bug)
3. Read `frontend.md` (if frontend bug)
4. Read `testing.md` (write regression test)

## Rule Updates

### When Rules Change
- Rules should be updated when project practices evolve
- Keep rules concise and high-signal
- Remove redundant or outdated rules
- Add rules only when necessary

### Rule Conflicts
- If rules conflict, prioritize `core.md`
- If conflict persists, ask user for clarification
- Document resolution in rule files

## Autonomy Guidelines

### Agent Autonomy
- Rules are designed to enable autonomous work
- Follow rules without asking for permission unless:
  - Rules conflict
  - Situation is not covered by rules
  - User explicitly asks for clarification

### Progress Over Perfection
- Prefer making progress over asking for clarification
- Use best judgment when rules don't cover a situation
- Document decisions in commit messages or PR descriptions

## Related Documents

- `DEVELOPMENT_GUIDELINES.md`: Detailed development process
- `docs/README.md`: Documentation structure
- `docs/architecture/overview.md`: Architecture overview
- `docs/task-management/README.md`: Task management

