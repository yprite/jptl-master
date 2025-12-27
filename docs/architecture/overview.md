# JLPT 자격 검증 프로그램 아키텍처 개요

## 시스템 아키텍처

이 프로젝트는 **DDD(Domain-Driven Design)**를 기반으로 하는 **클린 아키텍처(Clean Architecture)**를 채택합니다.
사용자 규모(일별 100명 미만)를 고려하여 **경량화된 기술 스택**을 선택하였습니다.

### 아키텍처 원칙

- **의존성 역전**: 고수준 모듈이 저수준 모듈에 의존하지 않음
- **단일 책임**: 각 모듈은 하나의 책임만 가짐
- **개방 폐쇄**: 확장에는 열려있고, 수정에는 닫혀있음
- **KISS/YAGNI**: 불필요한 복잡성 제거, 실제 필요한 기능만 구현

### 레이어 구조

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  🚪 API, Web UI
│  - Controllers (FastAPI routes)         │
│  - DTOs (Data Transfer Objects)         │
│  - Middleware                           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Application Layer                │  🎯 Use Cases
│  - Application Services                 │
│  - Commands & Queries                   │
│  - Event Handlers                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Domain Layer                   │  🧠 Business Logic
│  - Entities (User, Question, Test)      │
│  - Value Objects (JLPTLevel, etc.)      │
│  - Domain Services                      │
│  - Domain Events                        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │  🔧 External Concerns
│  - Repository Implementations           │
│  - Database Connections                 │
│  - External API Clients                 │
│  - File System Operations               │
└─────────────────────────────────────────┘
```

## 기술 스택 (경량화 버전)

### 백엔드
- **언어**: Python 3.9+ (타입 힌팅 지원)
- **프레임워크**: FastAPI - 비동기 지원, 자동 API 문서화
- **데이터베이스**: SQLite - 파일 기반, 별도 설치/설정 불필요
- **ORM**: SQLAlchemy Core - 복잡한 기능 제거, 간단한 쿼리 중심
- **인증**: 세션 기반 쿠키 인증 - JWT 복잡성 제거
- **테스트**: pytest - 간단하고 강력한 테스트 프레임워크

### 프론트엔드 (MVP)
- **기술**: 순수 HTML/CSS/JavaScript - 외부 의존성 최소화
- **UI**: Bootstrap CSS - 반응형 디자인, 사전 스타일 제공
- **JavaScript**: Vanilla JS + Fetch API - 모던 브라우저 네이티브 API 사용
- **호환성**: ES6+ 지원 브라우저 대상

### 개발 도구
- **버전 관리**: Git + GitHub
- **코드 품질**: Black (포맷팅), flake8 (린팅)
- **문서화**: Markdown 기반 문서
- **배포**: 로컬 파일 서버 또는 Python 내장 서버

## 도메인 모델

### 핵심 엔티티

#### User (학습자)
```python
class User:
    id: int
    email: str
    username: str
    target_level: JLPTLevel  # 목표 레벨
    current_level: Optional[JLPTLevel]  # 현재 평가 레벨
    total_tests_taken: int  # 응시한 총 시험 수
    study_streak: int  # 연속 학습 일수
    preferred_question_types: List[QuestionType]
```

#### Question (문제)
```python
class Question:
    id: int
    level: JLPTLevel
    question_type: QuestionType  # VOCABULARY, GRAMMAR, READING, LISTENING
    question_text: str
    choices: List[str]  # 선택지 (2-6개)
    correct_answer: str
    explanation: str
    difficulty: int  # 1-5
```

#### Test (시험)
```python
class Test:
    id: int
    title: str
    level: JLPTLevel
    questions: List[Question]
    time_limit_minutes: int
    status: TestStatus  # CREATED, IN_PROGRESS, COMPLETED, EXPIRED
    user_answers: Dict[int, str]  # question_id -> answer
    score: Optional[float]
```

#### Result (결과)
```python
class Result:
    id: int
    test_id: int
    user_id: int
    score: float  # 0.0-100.0
    assessed_level: JLPTLevel
    recommended_level: JLPTLevel
    correct_answers_count: int
    total_questions_count: int
    time_taken_minutes: int
```

### 값 객체 (Value Objects)

#### JLPTLevel
- N5, N4, N3, N2, N1 (초급 → 고급)
- 레벨 간 순서 비교 지원

#### QuestionType
- VOCABULARY (어휘)
- GRAMMAR (문법)
- READING (독해)
- LISTENING (청해)

#### TestStatus
- CREATED (생성됨)
- IN_PROGRESS (진행 중)
- COMPLETED (완료됨)
- EXPIRED (만료됨)

## 데이터베이스 설계

### SQLite 스키마 (경량화)

```sql
-- 사용자 테이블
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    target_level TEXT NOT NULL,
    current_level TEXT,
    total_tests_taken INTEGER DEFAULT 0,
    study_streak INTEGER DEFAULT 0,
    preferred_question_types TEXT, -- JSON 문자열
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 문제 테이블
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    question_type TEXT NOT NULL,
    question_text TEXT NOT NULL,
    choices TEXT NOT NULL, -- JSON 배열
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 시험 테이블
CREATE TABLE tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    question_ids TEXT NOT NULL, -- JSON 배열
    time_limit_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 시험 응시 기록 테이블
CREATE TABLE test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_answers TEXT, -- JSON 객체
    score REAL,
    time_taken_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 결과 분석 테이블
CREATE TABLE results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    attempt_id INTEGER NOT NULL,
    score REAL NOT NULL,
    assessed_level TEXT NOT NULL,
    recommended_level TEXT NOT NULL,
    correct_answers_count INTEGER NOT NULL,
    total_questions_count INTEGER NOT NULL,
    time_taken_minutes INTEGER NOT NULL,
    performance_level TEXT NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id)
);
```

## API 설계

### RESTful API 엔드포인트

```
GET    /api/health           # 헬스 체크
POST   /api/auth/login       # 로그인
POST   /api/auth/logout      # 로그아웃
GET    /api/auth/me          # 현재 사용자 정보

GET    /api/users/profile    # 사용자 프로필 조회
PUT    /api/users/profile    # 사용자 프로필 업데이트

GET    /api/questions        # 문제 목록 조회 (페이지네이션)
GET    /api/questions/{id}   # 특정 문제 조회

POST   /api/tests             # 새 시험 생성
GET    /api/tests/{id}        # 시험 정보 조회
POST   /api/tests/{id}/start  # 시험 시작
POST   /api/tests/{id}/submit # 시험 제출

GET    /api/results           # 결과 목록 조회
GET    /api/results/{id}      # 결과 상세 조회
```

### 응답 형식 표준화

```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지",
  "errors": null
}
```

```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "errors": ["상세 에러 목록"]
}
```

## 배포 및 운영 전략

### 개발 환경
- **로컬 실행**: `python main.py` 또는 `uvicorn main:app`
- **데이터베이스**: `./data/jlpt.db` (SQLite 파일)
- **포트**: 8000 (FastAPI 기본)

### 프로덕션 배포 (경량화)
- **서버**: Python 내장 HTTP 서버 또는 간단한 WSGI 서버
- **정적 파일**: Nginx 또는 Apache로 서빙
- **백업**: SQLite 파일 정기 백업
- **모니터링**: 간단한 로그 파일 분석

### 확장성 고려사항
- **현재 규모**: 일별 100명 미만 → 단일 서버로 충분
- **미래 확장**: 사용자 증가 시 PostgreSQL로 마이그레이션 가능
- **API 버전관리**: URL 경로에 버전 포함 (`/api/v1/`)

## 보안 고려사항

### 인증 및 권한
- 세션 기반 쿠키 인증 (복잡한 JWT 대신)
- 민감한 정보 암호화 저장
- SQL 인젝션 방지 (SQLAlchemy 파라미터화)
- XSS 방지 (HTML 이스케이프)

### 데이터 보호
- 사용자 비밀번호 해싱 (필요 시)
- 개인정보 최소 수집
- 데이터 백업 및 복구 계획

## 개발 프로세스

### 1. 문서 작성 → 2. 테스트 작성 → 3. 코드 구현 → 4. 문서 업데이트 → 5. 커밋 → 6. PR → 7. 태스크 업데이트

상세 프로세스는 `DEVELOPMENT_GUIDELINES.md` 참고
