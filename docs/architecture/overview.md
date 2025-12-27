# 아키텍처 개요

## 시스템 아키텍처

이 프로젝트는 DDD(Domain-Driven Design)를 기반으로 하는 클린 아키텍처를 채택합니다.

### 레이어 구조

```
Presentation Layer (API, Web UI)
    ↓
Application Layer (Use Cases, Commands)
    ↓
Domain Layer (Business Logic, Entities)
    ↓
Infrastructure Layer (Database, External APIs)
```

### 기술 스택

#### 백엔드
- **언어**: Python 3.9+
- **프레임워크**: FastAPI (DDD 구현용)
- **데이터베이스**: PostgreSQL
- **ORM**: SQLAlchemy
- **테스트**: pytest

#### 프론트엔드
- **언어**: TypeScript
- **프레임워크**: React + Next.js
- **상태관리**: Zustand
- **테스트**: Jest + React Testing Library
- **스타일링**: Tailwind CSS

### 개발 방식
- **TDD**: Test-Driven Development
- **DDD**: Domain-Driven Design
- **Git Flow**: 브랜치 전략

## 도메인 모델

(프로젝트 진행에 따라 도메인별로 세부 모델링 문서 추가 예정)

## 인프라 구성

- **CI/CD**: GitHub Actions
- **컨테이너화**: Docker
- **배포**: AWS ECS 또는 Railway
- **모니터링**: Sentry, CloudWatch
