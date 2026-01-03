# Authentication API 엔드포인트

## 개요

인증 관련 API 엔드포인트입니다. 로그인 및 로그아웃 기능을 제공합니다.

## Base URL

```
/api/v1/auth
```

**참고**: 모든 API 엔드포인트는 `/api/v1` prefix를 사용합니다.

## 엔드포인트 목록

### 1. 로그인

**POST** `/api/v1/auth/login`

사용자 로그인을 수행합니다.

**요청 본문:**
```json
{
  "email": "user@example.com"
}
```

**요청 스키마:**
- `email` (string, required): 이메일 주소

**참고**: 현재 구현은 이메일만 사용하며, 비밀번호 인증은 구현되지 않았습니다.

**응답:**
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

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "사용자를 찾을 수 없습니다"
}
```

**쿠키:**
- 세션 쿠키가 자동으로 설정됩니다.

---

### 2. 로그아웃

**POST** `/api/v1/auth/logout`

사용자 로그아웃을 수행합니다.

**요청:**
- 인증: 세션 기반 인증 필요

**응답:**
```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

**상태 코드:**
- `200 OK`: 성공
- `401 Unauthorized`: 인증되지 않음

**쿠키:**
- 세션 쿠키가 삭제됩니다.

---

## 인증 방식

이 API는 세션 기반 인증을 사용합니다:

1. **로그인**: 이메일과 비밀번호로 로그인하면 세션 쿠키가 설정됩니다.
2. **인증 확인**: 보호된 엔드포인트에 접근할 때 세션 쿠키를 통해 인증됩니다.
3. **로그아웃**: 로그아웃하면 세션 쿠키가 삭제됩니다.

## 어드민 권한 체크

어드민 전용 엔드포인트는 `get_admin_user` 의존성 함수를 사용하여 권한을 확인합니다.

**의존성 함수:**
- `get_current_user`: 현재 로그인된 사용자 조회 (401 에러 발생 가능)
- `get_admin_user`: 어드민 권한이 있는 사용자 조회 (401 또는 403 에러 발생 가능)

**사용 예시:**
```python
from backend.presentation.controllers.auth import get_admin_user

@router.get("/admin/users")
async def get_all_users(admin_user: User = Depends(get_admin_user)):
    # 어드민 권한이 있는 사용자만 접근 가능
    ...
```

**에러 응답:**
- `401 Unauthorized`: 인증되지 않은 경우
- `403 Forbidden`: 어드민 권한이 없는 경우

## 세션 관리

- 세션은 서버 측에서 관리됩니다.
- 세션 쿠키는 HTTP-only로 설정되어 XSS 공격을 방지합니다.
- 세션 만료 시간은 서버 설정에 따라 결정됩니다.

## 에러 처리

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

## 관련 문서

- [User API](./users.md)
- [인증 스키마](../schemas/auth.md)

