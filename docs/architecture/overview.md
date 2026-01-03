# Architecture Overview

## Purpose

JLPT Skill Assessment Platform is a web-based learning platform that helps Japanese language learners assess and improve their JLPT (Japanese Language Proficiency Test) skills. The platform provides diagnostic tests, performance analysis, and personalized learning recommendations for levels N1 through N5.

## High-Level Responsibilities

### Core Responsibilities
- **User Management**: Registration, authentication, profile management, and learning goal tracking
- **Test Administration**: Create and manage JLPT diagnostic tests (N1-N5) with multiple question types
- **Performance Analysis**: Collect detailed answer history, learning patterns, and generate performance reports
- **Learning Support**: Provide study plans, recommendations, and progress tracking
- **Admin Management**: User administration, question management, and system statistics

### System Boundaries
- **In Scope**: Test creation, execution, scoring, and analysis; user data collection and aggregation
- **Out of Scope**: External payment processing, third-party authentication providers, mobile native apps (future consideration)

## Main Data/Control Flow

### Test Taking Flow
1. User requests test creation → Application Service creates Test entity
2. User starts test → Test status changes to IN_PROGRESS, timer begins
3. User submits answers → Test calculates score, creates Result entity
4. System saves AnswerDetail records for each question
5. System creates LearningHistory entry
6. System updates UserPerformance aggregates
7. User views result with analysis and recommendations

### Data Collection Flow
1. Test submission triggers AnswerDetail creation (per question)
2. LearningHistory records study session metadata
3. UserPerformance aggregates data periodically
4. Analysis services process aggregates for recommendations

### Admin Flow
1. Admin authenticates → Session-based authentication validates admin role
2. Admin accesses admin endpoints → Middleware checks `is_admin` flag
3. Admin performs CRUD operations → Controllers delegate to Application Services
4. Changes persist through Repository layer to SQLite database

## Key Modules and Directories

### Backend Structure (`backend/`)

#### Domain Layer (`domain/`)
- **Entities** (`entities/`): Core business objects (User, Test, Question, Result, AnswerDetail, LearningHistory, UserPerformance)
- **Value Objects** (`value_objects/`): Immutable domain concepts (JLPTLevel, QuestionType)
- **Services** (`services/`): Domain logic that doesn't belong to a single entity

#### Application Layer (`application/`)
- **Services** (`services/`): Use case orchestration
- **Commands** (`commands/`): Write operations (create, update, delete)
- **Queries** (`queries/`): Read operations (get, list, search)

#### Infrastructure Layer (`infrastructure/`)
- **Repositories** (`repositories/`): Data persistence implementations (SQLite)
- **Adapters** (`adapters/`): External service integrations
- **Config** (`config/`): Database configuration and initialization

#### Presentation Layer (`presentation/`)
- **Controllers** (`controllers/`): FastAPI route handlers
- **DTOs** (`dto/`): Data transfer objects for API requests/responses
- **Middleware** (`middleware/`): Authentication, authorization, error handling

### Frontend Structure (`frontend/src/`)

#### Components (`components/`)
- **Organisms**: Complex UI components (Test UI, Result UI, Admin Dashboard)
- **Molecules**: Medium complexity components
- **Atoms**: Basic reusable components

#### Services (`services/`)
- API client services for backend communication
- Business logic services

#### Types (`types/`)
- TypeScript type definitions matching backend DTOs

## Architecture Principles

- **DDD (Domain-Driven Design)**: Business logic isolated in domain layer
- **Clean Architecture**: Dependency inversion, layers depend inward
- **TDD (Test-Driven Development)**: Tests written before implementation
- **KISS/YAGNI**: Simplicity over complexity, implement only what's needed

## Technology Stack

- **Backend**: Python 3.13+, FastAPI, SQLite, pytest
- **Frontend**: React 19, TypeScript, CSS Modules, React Testing Library, Playwright
- **Architecture**: DDD-based clean architecture with 4 layers
