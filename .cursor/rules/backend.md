# Backend Rules

> ⚠️ **REMINDER**: Before starting work, read `rules/core.md` FIRST.
> 
> This file applies **ONLY** when modifying backend or service code.
> 
> Core rules in `rules/core.md` ALWAYS apply regardless of context.

**Apply these rules ONLY when modifying backend or service code.**

## When to Apply

- ✅ Modifying Python backend code
- ✅ Working with DDD architecture layers
- ✅ Creating or modifying backend services
- ✅ Working with repositories or infrastructure
- ✅ Modifying API endpoints or controllers

**If you're not doing backend work, see:**
- Frontend work → `rules/frontend.md`
- Writing tests → `rules/testing.md`
- Refactoring → `rules/refactoring.md`

## Code Style

### Python Standards
- Follow PEP 8
- Line length: 88 characters maximum
- Indentation: 4 spaces
- No tabs

### Naming Conventions
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

## Code Structure

### Single Responsibility
- Each module has a single responsibility
- Functions: maximum 20 lines
- Avoid unnecessary comments

## Domain-Driven Design (DDD)

### Layer Structure
- **Domain Layer**: Entity, Value Object, Domain Service, Aggregate
- **Application Layer**: Application Service, Command/Query objects
- **Infrastructure Layer**: Repository implementations, external service adapters
- **Presentation Layer**: Controller, DTO, API documentation

Reference: `docs/architecture/overview.md`, `docs/architecture/repositories.md`

### DDD Principles
- Dependency Inversion Principle
- Single Responsibility Principle
- Open-Closed Principle
- Interface Segregation Principle

## Security

### Data Protection
- Store sensitive information in environment variables
- Never commit secrets to version control

### Input Validation
- Validate all input thoroughly
- Prevent SQL injection, XSS, and other vulnerabilities
- Sanitize user input before processing

## Performance

### Response Time
- API responses: 500ms or less

### Database
- Prevent N+1 query problems
- Use appropriate indexing
- Optimize query patterns

### Memory
- Keep memory usage within reasonable bounds
- Avoid memory leaks
- Monitor resource usage

## Testing

### Test Location
- Backend tests: `tests/backend/`
  - Unit tests: `tests/backend/unit/`
  - Scenario tests: `tests/backend/scenario/`
  - Acceptance tests: `tests/backend/acceptance/`

### Test Naming
- Format: `test_*.py` (e.g., `test_user.py`, `test_auth.py`)

### Coverage
- Minimum 95% code coverage required
- Coverage below 95% causes test failure
- Write tests for all new features

See `rules/testing.md` for detailed testing rules.

