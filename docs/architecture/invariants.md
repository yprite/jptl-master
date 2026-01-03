# Architectural Invariants

This document defines non-negotiable rules that must never be broken. These invariants ensure system safety, data integrity, and architectural consistency.

## Data Integrity Invariants

### User Data
- **INV-001**: User email addresses MUST be unique across the system
- **INV-002**: User usernames MUST be unique across the system
- **INV-003**: User IDs MUST be immutable once assigned
- **INV-004**: Admin flag (`is_admin`) MUST only be set through explicit admin creation process

### Test and Question Data
- **INV-005**: Question IDs MUST be immutable once assigned
- **INV-006**: Test question lists MUST be immutable after test creation (no modification during test execution)
- **INV-007**: Question `correct_answer` MUST be one of the `choices` values
- **INV-008**: Question choices MUST contain 2-6 unique items
- **INV-009**: Test status transitions MUST follow: CREATED → IN_PROGRESS → COMPLETED (no backward transitions)

### Result and Answer Data
- **INV-010**: Result scores MUST be calculated as: (correct_count / total_questions) * 100
- **INV-011**: AnswerDetail records MUST reference valid Question and Result entities
- **INV-012**: LearningHistory entries MUST reference valid User, Test, and Result entities
- **INV-013**: Result data MUST be immutable after test completion (no modifications allowed)

## Architectural Invariants

### Layer Dependencies
- **INV-014**: Domain layer MUST NOT depend on any other layer
- **INV-015**: Application layer MUST only depend on Domain layer
- **INV-016**: Infrastructure layer MUST implement interfaces defined in Domain/Application layers
- **INV-017**: Presentation layer MUST only depend on Application layer (never directly on Domain or Infrastructure)

### Repository Pattern
- **INV-018**: Domain entities MUST be returned from repositories, never DTOs or database models
- **INV-019**: Repository interfaces MUST be defined in Domain/Application layers, implementations in Infrastructure
- **INV-020**: Direct database access MUST only occur in Infrastructure layer repositories

### API Contracts
- **INV-021**: API endpoints MUST use DTOs for request/response, never expose domain entities directly
- **INV-022**: API versioning MUST be maintained: `/api/v1/` prefix required for all endpoints
- **INV-023**: Admin endpoints MUST verify `is_admin` flag before processing requests

## Business Logic Invariants

### Test Execution
- **INV-024**: Tests MUST have time limits between 1-480 minutes (8 hours)
- **INV-025**: Test completion MUST require answers for all questions
- **INV-026**: Test scores MUST be calculated only after all answers are submitted

### Level Recommendation
- **INV-027**: Level recommendation algorithm MUST follow: 90+ → next level, 70-89 → same level, <70 → previous level
- **INV-028**: N1 level MUST never recommend higher level (stays at N1)
- **INV-029**: N5 level MUST never recommend lower level (stays at N5)

### Data Collection
- **INV-030**: AnswerDetail records MUST be created for every question in a completed test
- **INV-031**: LearningHistory MUST record study_date as the date of test completion
- **INV-032**: UserPerformance aggregates MUST be based on actual AnswerDetail and LearningHistory data

## Security Invariants

### Authentication
- **INV-033**: Session-based authentication MUST be used (no JWT tokens)
- **INV-034**: Admin operations MUST verify session and admin flag
- **INV-035**: User data access MUST be restricted to the authenticated user or admins

### Data Protection
- **INV-036**: Sensitive data (passwords, API keys) MUST NOT be stored in code or committed to version control
- **INV-037**: SQL queries MUST use parameterized statements (no string concatenation)
- **INV-038**: User input MUST be validated and sanitized before processing

## Testing Invariants

### Coverage Requirements
- **INV-039**: Backend test coverage MUST be at least 80%
- **INV-040**: Frontend test coverage MUST be at least 80%
- **INV-041**: Critical user flows MUST have 100% test coverage

### Test Execution
- **INV-042**: All tests MUST pass before code is committed
- **INV-043**: TDD cycle MUST be followed: test → implement → refactor
- **INV-044**: Tests MUST be independent and not rely on execution order

## Backward Compatibility

### API Compatibility
- **INV-045**: Existing API endpoints MUST maintain response structure (fields may be added, not removed)
- **INV-046**: Database schema changes MUST be backward compatible or include migration scripts
- **INV-047**: Breaking changes MUST be versioned (new `/api/v2/` endpoints)

### Data Migration
- **INV-048**: Data migrations MUST preserve all existing data
- **INV-049**: Schema changes MUST not cause data loss
- **INV-050**: Migration scripts MUST be tested before deployment

## Performance Invariants

### Response Times
- **INV-051**: API endpoints MUST respond within 500ms under normal load
- **INV-052**: Database queries MUST avoid N+1 query patterns
- **INV-053**: Test creation and submission MUST complete within acceptable time limits

## Documentation Invariants

### Code Documentation
- **INV-054**: All public functions and classes MUST have docstrings
- **INV-055**: Architecture changes MUST be documented in `docs/architecture/`
- **INV-056**: API changes MUST be documented in `docs/api/`

---

**Note**: Violating any invariant is considered a critical bug and MUST be fixed immediately. These invariants are non-negotiable and form the foundation of system reliability.

