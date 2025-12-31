# JLPT 자격 검증 프로그램 아키텍처 개요

## 프로젝트 개요

### JLPT 자격 검증 프로그램
**프로젝트명**: JLPT Skill Assessment Platform  
**목적**: 일본어 학습자를 위한 JLPT 자격 검증 및 실력 향상 지원 플랫폼  
**대상 사용자**: JLPT 시험 준비생, 일본어 학습자, 교육 기관

### 프로젝트 상태
- **현재 상황**: 규칙 준수하여 충분한 논의 후 개발 진행
- **진행 방식**: TDD + DDD 준수

## 핵심 기능 요구사항

### 1. 사용자 관리
- 사용자 등록/로그인
- 학습 프로필 관리
- JLPT 목표 레벨 설정
- 학습 이력 추적

### 2. JLPT 진단 및 평가
- **레벨별 진단 테스트**: N1~N5 각 레벨별 실력 평가
- **문제 유형별 평가**: 어휘/문법/독해/청해 각 영역별 분석
- **유형별 문제 풀이**: 단일 또는 여러 유형 조합으로 테스트 생성 가능
- **실시간 피드백**: 정답/오답 표시 및 해설 제공
- **진단 리포트**: 강점/약점 분석 및 개선 방향 제시

### 3. 학습 콘텐츠 제공
- **문제 은행**: 레벨별, 유형별 문제 데이터베이스
- **학습 추천 시스템**: 약점 영역에 대한 맞춤형 문제 추천
- **진행도 추적**: 학습량, 정확도, 시간 추이 분석

### 4. 개인 학습 데이터 수집 및 분석
- **상세 답안 이력**: 문제별 답안, 소요 시간, 정답 여부 기록
- **학습 이력 추적**: 날짜별, 시간대별 학습 패턴 분석
- **성능 데이터 집계**: 유형별, 난이도별, 레벨별 성취도 분석
- **오답 패턴 분석**: 반복적으로 틀리는 문제 및 유형 식별
- **ChatGPT 기반 분석**: 수집된 데이터를 기반으로 AI 분석 및 학습 추천 (향후 구현)

### 5. 모의 시험 기능
- **실전 모의고사**: 실제 시험과 유사한 환경 제공
- **시간 제한**: 실제 시험 시간 준수
- **결과 분석**: 점수, 순위, 영역별 성취도

### 6. 주기적 배치 분석
- **일일 분석**: 사용자별 일일 학습 데이터 집계
- **주간 분석**: 주간 성능 추이 및 약점 분석
- **ChatGPT 분석 준비**: 수집된 데이터를 ChatGPT API로 분석할 수 있도록 데이터 구조화

### 7. 어드민 관리 기능
- **어드민 인증 및 권한 관리**: 어드민 권한이 있는 사용자만 어드민 기능 접근 가능
- **사용자 관리**: 전체 사용자 목록 조회, 상세 조회, 정보 수정, 삭제
- **문제 관리**: 문제 목록 조회, 생성, 수정, 삭제, 검색 및 필터링
- **통계 대시보드**: 사용자 통계, 테스트 통계, 문제 통계, 학습 데이터 통계
- **어드민 UI 분리 (필수 요구사항)**: 
  - 어드민 페이지에서는 일반 사용자 메뉴(테스트 시작, 성능 분석 보기, 학습 이력 보기, 프로필 관리)가 표시되지 않음
  - 어드민 전용 헤더 및 레이아웃 사용
  - 일반 사용자 헤더는 어드민 페이지에서 숨김 처리
  - 어드민 전용 네비게이션 메뉴 제공 (대시보드, 사용자 관리, 문제 관리)
  - 어드민 페이지 간 네비게이션 제공
  - 권한 체크 및 비인가 접근 시 리다이렉트
  - 어드민 페이지에서는 일반 사용자 기능과 완전히 분리된 UI 제공

## 프로젝트 범위 (MVP)

### Phase 1: 핵심 기능 (완료)
1. **사용자 관리 시스템**: 기본 회원가입/로그인
2. **JLPT N5 진단 테스트**: 기본적인 진단 기능
3. **결과 표시**: 점수 및 간단한 분석

### Phase 2: 확장 기능 (진행 중)
1. **모든 JLPT 레벨 지원**: N1~N5 완전 지원 ✅
2. **유형별 문제 풀이**: 단일/복수 유형 선택 기능 ✅
3. **개인 데이터 수집**: 상세 답안 이력, 학습 이력, 성능 데이터 수집 ✅
4. **학습 추천 시스템**: AI 기반 맞춤 추천 (데이터 수집 단계)
5. **모의 시험 기능**: 실전 감각 훈련
6. **어드민 관리 기능**: 사용자 관리, 문제 관리, 통계 대시보드 ✅
   - 어드민 인증 및 권한 관리 ✅
   - 사용자 관리 (조회, 수정, 삭제) ✅
   - 문제 관리 (조회, 생성, 수정, 삭제) ✅
   - 통계 대시보드 ✅
   - 어드민 UI 분리 (일반 사용자 메뉴 숨김) ✅

### Phase 3: 고급 기능
1. **ChatGPT 기반 분석**: 수집된 데이터를 ChatGPT API로 분석하여 개인별 학습 추천 및 보완점 분석
2. **주기적 배치 분석**: 일일/주간 자동 분석 및 리포트 생성
3. **학습 커뮤니티**: 사용자 간 정보 공유
4. **프로그레시브 웹 앱**: 오프라인 학습 지원
5. **모바일 앱**: React Native 기반 네이티브 앱

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
- **언어**: Python 3.13+ (타입 힌팅 지원)
- **프레임워크**: FastAPI - 비동기 지원, 자동 API 문서화
- **데이터베이스**: SQLite - 파일 기반, 별도 설치/설정 불필요
- **ORM**: SQLAlchemy Core - 복잡한 기능 제거, 간단한 쿼리 중심
- **인증**: 세션 기반 쿠키 인증 - JWT 복잡성 제거
- **테스트**: pytest - 간단하고 강력한 테스트 프레임워크
- **테스트 커버리지**: pytest-cov (최소 80% 요구, 현재 92%+)

### 프론트엔드
- **프레임워크**: React 19 - 컴포넌트 기반 UI 라이브러리
- **언어**: TypeScript 4.9+ - 타입 안정성 보장
- **빌드 도구**: Create React App (react-scripts 5.0.1)
- **스타일링**: CSS Modules - 컴포넌트별 스타일 격리
- **테스트**: 
  - React Testing Library - 컴포넌트 테스트
  - Playwright - E2E 테스트
  - MSW (Mock Service Worker) - API 목킹
- **타입 체크**: TypeScript 컴파일러 (`tsc --noEmit`)
- **호환성**: 모던 브라우저 (Chrome, Firefox, Safari 최신 버전)

### 개발 도구
- **버전 관리**: Git + GitHub
- **코드 품질**: 
  - 백엔드: Black (포맷팅), flake8 (린팅)
  - 프론트엔드: ESLint (React App 기본 설정)
- **테스트 커버리지**: 
  - 백엔드: pytest-cov (최소 80% 요구)
  - 프론트엔드: Jest Coverage (최소 80% 요구)
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
    is_admin: bool  # 어드민 권한 여부
    created_at: datetime
    updated_at: datetime
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
    question_type_analysis: Dict[str, Dict[str, int]]  # 유형별 분석
```

#### AnswerDetail (문제별 상세 답안 이력)
```python
class AnswerDetail:
    id: int
    result_id: int
    question_id: int
    user_answer: str
    correct_answer: str
    is_correct: bool
    time_spent_seconds: int  # 문제별 소요 시간
    difficulty: int
    question_type: QuestionType
    created_at: datetime
```

#### LearningHistory (학습 이력)
```python
class LearningHistory:
    id: int
    user_id: int
    test_id: int
    result_id: int
    study_date: date  # 학습 날짜
    study_hour: int  # 학습 시간대 (0-23)
    total_questions: int
    correct_count: int
    time_spent_minutes: int
    created_at: datetime
```

#### UserPerformance (사용자 성능 분석 데이터)
```python
class UserPerformance:
    id: int
    user_id: int
    analysis_period_start: date
    analysis_period_end: date
    type_performance: Dict[QuestionType, Dict[str, float]]  # 유형별 성취도
    difficulty_performance: Dict[int, Dict[str, float]]  # 난이도별 성취도
    level_progression: Dict[JLPTLevel, Dict[str, Any]]  # 레벨별 추이
    repeated_mistakes: List[int]  # 반복 오답 문제 ID 리스트
    weaknesses: Dict[str, Any]  # ChatGPT 분석용 원시 데이터
    created_at: datetime
    updated_at: datetime
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

### 도메인 서비스 (Domain Services)

#### LevelRecommendationService
점수 기반 JLPT 레벨 추천 서비스

```python
class LevelRecommendationService:
    def recommend_level(test_level: JLPTLevel, score: float) -> JLPTLevel
```

**추천 규칙**:
- 90점 이상: 다음 레벨로 상향 추천 (N1은 예외로 N1 유지)
- 70-89점: 현재 레벨 유지
- 70점 미만: 이전 레벨로 하향 추천 (N5는 예외로 N5 유지)

**사용 예시**:
- N5 테스트에서 95점 → N4 추천
- N5 테스트에서 80점 → N5 유지
- N5 테스트에서 60점 → N5 유지 (기초 강화)
- N4 테스트에서 65점 → N5로 하향 추천

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
    is_admin INTEGER DEFAULT 0, -- 어드민 권한 (0: 일반 사용자, 1: 어드민)
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
    question_type_analysis TEXT, -- JSON 문자열
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id)
);

-- 문제별 상세 답안 이력
CREATE TABLE answer_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    question_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES results(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 학습 이력
CREATE TABLE learning_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    result_id INTEGER NOT NULL,
    study_date DATE NOT NULL,
    study_hour INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    time_spent_minutes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(id),
    FOREIGN KEY (result_id) REFERENCES results(id)
);

-- 사용자 성능 분석
CREATE TABLE user_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    type_performance TEXT, -- JSON
    difficulty_performance TEXT, -- JSON
    level_progression TEXT, -- JSON
    repeated_mistakes TEXT, -- JSON 배열
    weaknesses TEXT, -- JSON (ChatGPT 분석용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API 설계

### RESTful API 엔드포인트

#### 공통 API
```
GET    /api/v1/health                    # 헬스 체크
POST   /api/v1/auth/login                # 로그인
POST   /api/v1/auth/logout               # 로그아웃
GET    /api/v1/auth/me                   # 현재 사용자 정보
```

#### 사용자 API
```
GET    /api/v1/users                     # 사용자 목록 조회
POST   /api/v1/users                     # 사용자 생성 (회원가입)
GET    /api/v1/users/me                  # 현재 사용자 정보 조회
PUT    /api/v1/users/me                  # 현재 사용자 정보 업데이트
GET    /api/v1/users/{id}                 # 특정 사용자 조회
PUT    /api/v1/users/{id}                 # 특정 사용자 정보 업데이트
GET    /api/v1/users/{id}/performance     # 사용자 성능 분석 데이터 조회
GET    /api/v1/users/{id}/history         # 사용자 학습 이력 조회
```

#### 문제 API
```
GET    /api/v1/questions                 # 문제 목록 조회 (페이지네이션)
GET    /api/v1/questions/{id}            # 특정 문제 조회
```

#### 테스트 API
```
POST   /api/v1/tests                     # 새 시험 생성 (question_types 파라미터로 유형 선택)
GET    /api/v1/tests/{id}                # 시험 정보 조회
POST   /api/v1/tests/{id}/start          # 시험 시작
POST   /api/v1/tests/{id}/submit         # 시험 제출 (상세 답안 이력 자동 저장)
```

#### 결과 API
```
GET    /api/v1/results                   # 결과 목록 조회
GET    /api/v1/results/{id}              # 결과 상세 조회
GET    /api/v1/results/{id}/details      # 결과별 상세 답안 이력 조회
```

#### 어드민 API (어드민 권한 필요)
```
# 사용자 관리
GET    /api/v1/admin/users               # 전체 사용자 목록 조회
GET    /api/v1/admin/users/{user_id}     # 특정 사용자 상세 조회
PUT    /api/v1/admin/users/{user_id}     # 사용자 정보 수정
DELETE /api/v1/admin/users/{user_id}     # 사용자 삭제

# 문제 관리
GET    /api/v1/admin/questions           # 전체 문제 목록 조회
GET    /api/v1/admin/questions/{id}      # 특정 문제 상세 조회
POST   /api/v1/admin/questions           # 문제 생성
PUT    /api/v1/admin/questions/{id}      # 문제 수정
DELETE /api/v1/admin/questions/{id}      # 문제 삭제

# 통계 대시보드
GET    /api/v1/admin/statistics         # 통계 조회 (사용자, 테스트, 문제, 학습 데이터)
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

## 학습 분석 시스템

### 개인 데이터 수집
- **AnswerDetail**: 문제별 상세 답안 이력 (답안, 소요 시간, 정답 여부)
- **LearningHistory**: 날짜별, 시간대별 학습 패턴 추적
- **UserPerformance**: 유형별, 난이도별, 레벨별 성취도 집계

### 분석 서비스
- **AnalysisService**: 사용자 성능 데이터 집계 및 약점 식별
- **ChatGPTAnalysisAdapter**: ChatGPT API 연동 (향후 구현)
- **BatchAnalysisJob**: 주기적 배치 분석 작업

자세한 내용은 [학습 분석 시스템 문서](learning-analytics.md) 참고

## 개발 프로세스

### 1. 문서 작성 → 2. 테스트 작성 → 3. 코드 구현 → 4. 문서 업데이트 → 5. 커밋 → 6. PR → 7. 태스크 업데이트

상세 프로세스는 `DEVELOPMENT_GUIDELINES.md` 참고

## 논의 기록

### 1차 논의 (JLPT 프로젝트 아이디어 확정)
**날짜**: 2024-12-27  
**참여자**: 사용자, AI 어시스턴트  
**주제**: JLPT 자격 검증 프로그램 상세 요구사항 정의  
**상태**: 완료

**논의 내용**:
- JLPT 자격 검증 프로그램의 목적과 범위 정의
- 핵심 기능 및 사용자 요구사항 파악
- 기술 스택 및 아키텍처 결정
- MVP 범위 설정 및 개발 우선순위 정의

**결정사항**:
- ✅ 프로젝트 아이디어: JLPT 자격 검증 프로그램 확정
- ✅ MVP 기능 목록: 사용자 관리 + N5 진단 테스트 + 결과 분석
- ✅ 기술 스택: FastAPI + SQLite 선정
- ✅ 개발 방식: TDD + DDD 준수

### 2차 논의 (유형별 문제 풀이 및 개인 데이터 수집)
**날짜**: 2024-12-27  
**참여자**: 사용자, AI 어시스턴트  
**주제**: 유형별 문제 풀이 기능 및 개인 학습 데이터 수집 요구사항  
**상태**: 완료

**논의 내용**:
- JLPT 유형별 문제 풀이 기능 요구사항 (단일/복수 유형 선택 가능)
- 개인 학습 데이터 수집 범위 및 구조 설계
- ChatGPT 기반 분석을 위한 데이터 준비 방안
- 주기적 배치 분석 시스템 설계

**결정사항**:
- ✅ 유형별 문제 풀이: 여러 유형 조합 가능하도록 구현
- ✅ 개인 데이터 수집: AnswerDetail, LearningHistory, UserPerformance 엔티티 생성
- ✅ 데이터 수집 항목: 문제별 답안, 소요 시간, 난이도별 성취도, 오답 패턴, 학습 이력 등 모두 수집
- ✅ ChatGPT 분석: 주기적 배치 분석으로 구현 (향후 ChatGPT API 연동)
- ✅ 별도 엔티티 생성: 기존 Result와 분리하여 상세 데이터 관리

### 다음 단계
1. 유형별 문제 풀이 기능 구현
2. 개인 데이터 수집 엔티티 및 Repository 구현
3. 데이터 수집 로직 구현 (테스트 제출 시)
4. 분석 서비스 및 배치 작업 구현
5. ChatGPT API 연동 준비 (인터페이스 설계)
