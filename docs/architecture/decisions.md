# Architectural Decisions

This document records important architectural and technical decisions, their rationale, and implications for future development.

## ADR-001: Domain-Driven Design (DDD) Architecture

**Decision**: Adopt DDD-based Clean Architecture with four distinct layers (Domain, Application, Infrastructure, Presentation).

**Rationale**:
- Separates business logic from technical concerns
- Enables testability through dependency inversion
- Supports future scalability and maintainability
- Aligns with project's complexity level

**Implications**:
- All business logic must live in Domain layer
- Infrastructure implementations must follow interfaces defined in Domain/Application
- Changes to business rules require Domain layer modifications, not infrastructure changes

**Alternatives Considered**:
- MVC pattern: Rejected due to tight coupling and difficulty testing business logic
- Monolithic service layer: Rejected due to lack of separation of concerns

---

## ADR-002: SQLite as Primary Database

**Decision**: Use SQLite for data persistence instead of PostgreSQL or MySQL.

**Rationale**:
- Project targets small scale (under 100 users/day)
- No separate database server setup required
- File-based storage simplifies deployment and backup
- Sufficient performance for current requirements

**Implications**:
- Database file must be backed up regularly
- Concurrent write limitations acceptable for current scale
- Future migration to PostgreSQL possible if scale increases

**Alternatives Considered**:
- PostgreSQL: Rejected due to unnecessary complexity for current scale
- In-memory database: Rejected due to data persistence requirements

---

## ADR-003: Session-Based Authentication

**Decision**: Use session-based cookie authentication instead of JWT tokens.

**Rationale**:
- Simpler implementation and debugging
- Built-in session management through FastAPI middleware
- No token expiration/refresh complexity
- Sufficient for single-domain application

**Implications**:
- Session state stored server-side (or in secure cookies)
- CORS configuration must allow credentials
- Future multi-domain support would require JWT migration

**Alternatives Considered**:
- JWT tokens: Rejected due to added complexity and no current multi-domain requirement
- OAuth providers: Rejected due to unnecessary external dependencies

---

## ADR-004: Test-Driven Development (TDD)

**Decision**: Mandate TDD workflow: write tests before implementation.

**Rationale**:
- Ensures code correctness and prevents regressions
- Forces clear requirements understanding before coding
- Maintains high test coverage (80% minimum)
- Aligns with project quality goals

**Implications**:
- All features must have tests before implementation
- Test failures block commits
- Refactoring is safer with test coverage

**Alternatives Considered**:
- Test-after development: Rejected due to lower coverage and delayed bug detection
- No testing mandate: Rejected due to quality requirements

---

## ADR-005: React with TypeScript

**Decision**: Use React 19 with TypeScript for frontend development.

**Rationale**:
- Type safety catches errors at compile time
- React ecosystem provides robust component libraries
- TypeScript interfaces align with backend DTOs
- Modern tooling supports excellent developer experience

**Implications**:
- All components must have TypeScript types
- Type mismatches between frontend and backend must be resolved
- Type checking is part of test validation

**Alternatives Considered**:
- Plain JavaScript: Rejected due to lack of type safety
- Vue.js: Rejected due to team familiarity with React

---

## ADR-006: CSS Modules for Styling

**Decision**: Use CSS Modules instead of styled-components or Tailwind CSS.

**Rationale**:
- Component-scoped styles prevent conflicts
- No runtime overhead
- Simple and maintainable
- Works well with React component structure

**Implications**:
- Styles are co-located with components
- Global styles require separate handling
- No dynamic styling at runtime (use CSS variables if needed)

**Alternatives Considered**:
- Styled-components: Rejected due to runtime overhead and bundle size
- Tailwind CSS: Rejected due to learning curve and utility-first approach complexity

---

## ADR-007: FastAPI for Backend Framework

**Decision**: Use FastAPI instead of Django or Flask.

**Rationale**:
- Automatic API documentation (OpenAPI/Swagger)
- Modern async/await support
- Type hints and validation through Pydantic
- Fast performance and simple structure

**Implications**:
- API documentation is auto-generated
- Request/response validation through Pydantic models
- Async operations supported throughout stack

**Alternatives Considered**:
- Django: Rejected due to heavier framework and unnecessary features (admin, ORM)
- Flask: Rejected due to lack of built-in async support and manual documentation

---

## ADR-008: Maximum 100 Lines Per Commit

**Decision**: Enforce maximum 100 lines of code changes per commit.

**Rationale**:
- Smaller commits are easier to review and understand
- Easier to identify and revert problematic changes
- Encourages frequent commits and incremental progress
- Better git history and debugging

**Implications**:
- Large features must be split into multiple commits
- Each commit should represent one logical change
- Commit messages must clearly describe the change

**Alternatives Considered**:
- No size limit: Rejected due to difficulty reviewing large changes
- 50 line limit: Rejected as too restrictive for some refactorings

---

## ADR-009: KISS/YAGNI Principles

**Decision**: Prioritize simplicity and avoid over-engineering.

**Rationale**:
- Current requirements are well-defined
- Premature optimization adds complexity
- Simple solutions are easier to maintain and understand
- Future requirements can be addressed when they arise

**Implications**:
- Avoid abstract patterns until actually needed
- Reject "nice to have" features not in requirements
- Prefer direct solutions over generic abstractions

**Alternatives Considered**:
- Design for future extensibility: Rejected due to YAGNI principle
- Generic framework approach: Rejected due to unnecessary complexity

---

## ADR-010: Separate Admin UI from User UI

**Decision**: Completely separate admin interface from regular user interface.

**Rationale**:
- Clear separation of concerns
- Different user experiences for different roles
- Easier to maintain and extend independently
- Security through UI isolation

**Implications**:
- Admin pages must not show regular user navigation
- Regular user pages must not show admin features
- Role-based routing and component rendering required

**Alternatives Considered**:
- Shared UI with role-based visibility: Rejected due to complexity and security concerns
- Admin-only features in same UI: Rejected due to user experience and security

---

**Note**: When making changes that affect these decisions, update this document and consider the implications carefully. Breaking these decisions requires strong justification and team discussion.

