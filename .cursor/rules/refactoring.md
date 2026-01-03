# Refactoring Rules

> ⚠️ **REMINDER**: Before starting work, read `rules/core.md` FIRST.
> 
> This file applies **ONLY** when refactoring existing code.
> 
> Core rules in `rules/core.md` ALWAYS apply regardless of context.

**Apply these rules ONLY when refactoring existing code.**

## When to Apply

- ✅ Refactoring existing code structure
- ✅ Improving code without changing behavior
- ✅ Incremental code improvements
- ✅ Code cleanup and optimization

**If you're not refactoring, see:**
- Backend work → `rules/backend.md`
- Frontend work → `rules/frontend.md`
- Writing tests → `rules/testing.md`

## Behavior Preservation

### Core Principle [P0]
- **Never change behavior when refactoring**
- Refactoring improves code structure without changing functionality
- All existing tests must continue to pass

### Verification
- Run all tests before refactoring
- Run all tests after refactoring
- Tests should pass with identical results
- If tests fail, the refactoring changed behavior (fix or revert)

## Incremental Refactoring

### Small Steps
- Make small, incremental changes
- Commit after each successful refactoring step
- Each commit should maintain passing tests

### Test-Driven Refactoring
- Write tests for behavior you want to preserve
- Refactor while keeping tests green
- Use tests as safety net

## Refactoring Process

### Before Refactoring
1. Ensure all tests pass
2. Understand current code behavior
3. Identify refactoring goals
4. Plan incremental steps

### During Refactoring
1. Make one small change
2. Run tests
3. If tests pass, commit
4. Repeat

### After Refactoring
1. Run full test suite
2. Verify coverage maintained
3. Update documentation if structure changed
4. Commit final state

## When NOT to Refactor

### Avoid Refactoring When
- Tests are failing (fix tests first)
- Under time pressure for new features
- Code is about to be deleted
- Refactoring would break backward compatibility unnecessarily

### Refactoring vs. Feature Work
- Separate refactoring from feature work
- Use `refactor/` branch prefix
- Create separate PRs for refactoring

## Documentation Updates

### When Structure Changes
- Update architecture diagrams if layer structure changes
- Update API documentation if interface changes
- Update code comments if logic flow changes
- Update `docs/CHANGELOG.md`

### When Behavior Changes
- If behavior changes, it's not refactoring—it's a feature or bug fix
- Document behavior changes appropriately
- Update tests to reflect new behavior

