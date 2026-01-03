# JLPT API 설계 및 구현

## 개요

이 문서는 JLPT 자격 검증 프로그램의 **Presentation Layer** REST API를 설계하고 구현하기 위한 상세 가이드입니다.

## 아키텍처 원칙

### RESTful API 설계
- **표준 HTTP 메서드** 사용 (GET, POST, PUT, DELETE)
- **명확한 리소스** 식별 및 계층 구조
- **무상태성** 유지 (세션 기반이지만 API 자체는 무상태)
- **일관된 응답 형식** 표준화

### FastAPI 특징 활용
- **비동기 지원**: `async/await` 패턴 사용
- **자동 문서화**: OpenAPI/Swagger 자동 생성
- **타입 힌팅**: Python 타입 시스템 활용
- **의존성 주입**: 클린 아키텍처 패턴 적용

### 보안 고려사항
- **세션 기반 인증**: 쿠키를 통한 사용자 세션 관리
- **CSRF 보호**: POST/PUT/DELETE 요청에 대한 보호
- **입력 검증**: Pydantic 모델을 통한 자동 검증
- **에러 처리**: 사용자 친화적인 에러 응답

## API 엔드포인트 설계

### 1. 헬스 체크 API

#### GET /api/health
시스템 상태 확인용 엔드포인트

**응답:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

### 2. 사용자 관리 API

#### POST /api/users
새 사용자 등록

**요청:**
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "target_level": "N5"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser",
    "target_level": "N5",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /api/users/me
현재 로그인된 사용자 정보 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser",
    "target_level": "N5",
    "current_level": "N4",
    "total_tests_taken": 5,
    "study_streak": 3
  }
}
```

#### PUT /api/users/me
사용자 프로필 업데이트

**요청:**
```json
{
  "username": "newusername",
  "target_level": "N4"
}
```

### 3. 시험 관리 API

#### GET /api/tests
사용 가능한 시험 목록 조회

**쿼리 파라미터:**
- `level`: JLPT 레벨 필터 (N5, N4, N3, N2, N1)
- `limit`: 결과 제한 (기본값: 10)

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "N5 진단 테스트",
      "level": "N5",
      "time_limit_minutes": 30,
      "question_count": 20
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

#### GET /api/tests/{test_id}
특정 시험 정보 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "N5 진단 테스트",
    "level": "N5",
    "time_limit_minutes": 30,
    "status": "created",
    "question_count": 20
  }
}
```

#### POST /api/tests/{test_id}/start
시험 시작

**응답:**
```json
{
  "success": true,
  "data": {
    "test_id": 1,
    "status": "in_progress",
    "started_at": "2024-01-01T12:00:00Z",
    "time_limit_minutes": 30
  }
}
```

#### GET /api/tests/{test_id}/questions
시험 문제 조회 (진행 중인 시험만)

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question_text": "「こんにちは」の意味は何ですか？",
      "choices": ["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
      "question_type": "vocabulary"
    }
  ]
}
```

#### POST /api/tests/{test_id}/submit
시험 제출

**요청:**
```json
{
  "answers": {
    "1": "안녕하세요",
    "2": "감사합니다"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "test_id": 1,
    "score": 85.0,
    "correct_answers_count": 17,
    "total_questions_count": 20,
    "time_taken_minutes": 25,
    "completed_at": "2024-01-01T12:25:00Z"
  }
}
```

### 4. 결과 조회 API

#### GET /api/results
사용자의 시험 결과 목록

**쿼리 파라미터:**
- `limit`: 결과 제한 (기본값: 10)
- `offset`: 건너뛸 결과 수 (기본값: 0)

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "test_id": 1,
      "test_title": "N5 진단 테스트",
      "score": 85.0,
      "assessed_level": "N5",
      "recommended_level": "N4",
      "completed_at": "2024-01-01T12:25:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

#### GET /api/results/{result_id}
상세 결과 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "test_id": 1,
    "test_title": "N5 진단 테스트",
    "score": 85.0,
    "assessed_level": "N5",
    "recommended_level": "N4",
    "correct_answers_count": 17,
    "total_questions_count": 20,
    "time_taken_minutes": 25,
    "performance_level": "excellent",
    "feedback": {
      "overall_performance": "Outstanding performance! You have excellent command of JLPT content.",
      "time_management": "Excellent time management. You completed the test efficiently.",
      "level_recommendation": "Great progress! Consider advancing to JLPT N4.",
      "study_suggestions": "Maintain your excellent performance. Challenge yourself with higher level content."
    },
    "completed_at": "2024-01-01T12:25:00Z"
  }
}
```

## 구현 구조

### 의존성 주입 컨테이너

```python
from fastapi import Depends
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.infrastructure.config.database import get_database

def get_user_repository() -> SqliteUserRepository:
    """사용자 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteUserRepository(db)

# 컨트롤러에서 사용
async def get_current_user(
    user_repo: SqliteUserRepository = Depends(get_user_repository)
):
    # 세션에서 사용자 ID 가져오기
    # 사용자 정보 조회
    pass
```

### 컨트롤러 구조

```python
from fastapi import APIRouter, Depends, HTTPException
from backend.infrastructure.repositories.user_repository import SqliteUserRepository

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me")
async def get_current_user(
    user_repo: SqliteUserRepository = Depends(get_user_repository)
):
    # 현재 사용자 정보 반환
    pass

@router.put("/me")
async def update_current_user(
    update_data: UserUpdateRequest,
    user_repo: SqliteUserRepository = Depends(get_user_repository)
):
    # 사용자 정보 업데이트
    pass
```

### 응답 모델 표준화

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    """표준 API 응답 모델"""
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    errors: Optional[list[str]] = None

class PaginatedResponse(BaseModel, Generic[T]):
    """페이징된 응답 모델"""
    success: bool
    data: list[T]
    meta: dict
```

## 테스트 전략

### API 통합 테스트

```python
import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
class TestUserAPI:
    async def test_get_current_user(self, client: AsyncClient):
        # 로그인 세션 설정
        # API 호출
        response = await client.get("/api/users/me")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "email" in data["data"]
```

### 단위 테스트

```python
def test_user_response_model():
    """응답 모델 검증"""
    response = APIResponse(
        success=True,
        data={"id": 1, "email": "test@example.com"},
        message="사용자 정보 조회 성공"
    )
    assert response.success is True
    assert response.data["email"] == "test@example.com"
```

## 배포 및 운영

### CORS 설정
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트엔드 도메인
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 정적 파일 서빙
```python
from fastapi.staticfiles import StaticFiles

# 프론트엔드 빌드 파일 서빙
app.mount("/", StaticFiles(directory="static", html=True), name="static")
```

이 설계에 따라 FastAPI 기반 REST API를 구현하겠습니다.
