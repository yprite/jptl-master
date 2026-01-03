# API 엔드포인트 문서

## 개요

이 디렉토리에는 JLPT 자격 검증 프로그램의 모든 REST API 엔드포인트 문서가 포함되어 있습니다.

## Base URL

모든 API 엔드포인트는 다음 Base URL을 사용합니다:

```
/api/v1
```

## 엔드포인트 목록

### 인증 (Authentication)
- [인증 API](./auth.md) - 로그인, 로그아웃

### 사용자 관리 (Users)
- [사용자 API](./users.md) - 사용자 등록, 조회, 수정, 삭제, 성능 분석, 학습 이력

### 테스트 관리 (Tests)
- [테스트 API](./tests.md) - 테스트 생성, 조회, 시작, 제출

### 결과 조회 (Results)
- [결과 API](./results.md) - 결과 조회, 분석 리포트, 상세 답안 이력

### 헬스 체크 (Health)
- [헬스 체크 API](./health.md) - 시스템 상태 확인

### 어드민 관리 (Admin)
- [어드민 API](./admin.md) - 어드민 사용자 관리, 문제 관리, 단어 관리

### 단어 학습 (Vocabulary)
- [단어 학습 API](./vocabulary.md) - 단어 목록 조회, 플래시카드 학습, 암기 상태 관리

## OpenAPI 스펙

FastAPI는 자동으로 OpenAPI 스펙을 생성합니다. 다음 엔드포인트에서 확인할 수 있습니다:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## 인증

대부분의 API 엔드포인트는 세션 기반 인증을 사용합니다:

1. `/api/v1/auth/login` 엔드포인트로 로그인
2. 세션 쿠키가 자동으로 설정됨
3. 보호된 엔드포인트에 접근 시 세션 쿠키를 통해 인증됨

인증이 필요한 엔드포인트는 각 문서에 명시되어 있습니다.

## 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

### 에러 응답

```json
{
  "detail": "에러 메시지"
}
```

## 상태 코드

- `200 OK`: 요청 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

## 관련 문서

- [API 스키마](../schemas/README.md) - 요청/응답 스키마 정의
- [아키텍처 개요](../../architecture/overview.md) - 시스템 아키텍처
- [개발 가이드](../../development/setup.md) - 개발 환경 설정

