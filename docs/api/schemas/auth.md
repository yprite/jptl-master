# Authentication API 스키마

## 개요

인증 관련 API의 요청 및 응답 스키마입니다.

## 요청 스키마

### LoginRequest

로그인 요청 스키마입니다.

```json
{
  "email": "user@example.com"
}
```

**필드:**
- `email` (string, required): 이메일 주소
  - 형식: 유효한 이메일 형식
  - 예시: `"user@example.com"`

## 응답 스키마

### LoginResponse

로그인 응답 스키마입니다.

```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "username": "학습자1"
  },
  "message": "로그인 성공"
}
```

**필드:**
- `success` (boolean, required): 성공 여부
- `data` (object, required): 사용자 정보
  - `user_id` (integer, required): 사용자 ID
  - `email` (string, required): 이메일 주소
  - `username` (string, required): 사용자명
- `message` (string, required): 응답 메시지

### LogoutResponse

로그아웃 응답 스키마입니다.

```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

**필드:**
- `success` (boolean, required): 성공 여부
- `message` (string, required): 응답 메시지

## 세션 관리

### 세션 쿠키

로그인 성공 시 세션 쿠키가 자동으로 설정됩니다.

**쿠키 속성:**
- 이름: `session`
- HTTP-only: `true` (XSS 공격 방지)
- Secure: 프로덕션 환경에서 `true` (HTTPS만)
- SameSite: `Lax` 또는 `Strict`

### 세션 데이터

세션에는 다음 정보가 저장됩니다:
- `user_id` (integer): 사용자 ID

## 에러 응답 스키마

### AuthenticationError

인증 실패 시 반환되는 에러 스키마입니다.

```json
{
  "detail": "사용자를 찾을 수 없습니다"
}
```

**가능한 에러 메시지:**
- `"사용자를 찾을 수 없습니다"`: 이메일로 사용자를 찾을 수 없음
- `"로그인이 필요합니다"`: 세션이 없음
- `"유효하지 않은 세션입니다"`: 세션에 저장된 사용자 ID가 유효하지 않음

## 예제

### 로그인 요청

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }' \
  -c cookies.txt
```

### 로그아웃 요청

```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Cookie: session=..." \
  -b cookies.txt
```

## 관련 문서

- [Authentication API 엔드포인트](../endpoints/auth.md)
- [User API 스키마](./user.md)

