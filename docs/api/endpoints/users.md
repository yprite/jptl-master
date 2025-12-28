# Users API 엔드포인트

## 개요

사용자 관리 API 엔드포인트입니다. 사용자 등록, 조회, 수정, 삭제 기능을 제공합니다.

## Base URL

```
/api/users
```

## 엔드포인트 목록

### 1. 사용자 목록 조회

**GET** `/api/users/`

사용자 목록을 조회합니다.

**요청:**
- 쿼리 파라미터: 없음

**응답:**
```json
{
  "message": "사용자 목록 조회"
}
```

**상태 코드:**
- `200 OK`: 성공

---

### 2. 사용자 등록

**POST** `/api/users/`

새로운 사용자를 등록합니다.

**요청 본문:**
```json
{
  "email": "user@example.com",
  "username": "학습자1",
  "target_level": "N5"
}
```

**요청 스키마:**
- `email` (string, required): 이메일 주소
- `username` (string, required): 사용자명
- `target_level` (JLPTLevel, optional): 목표 JLPT 레벨 (기본값: N5)

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "학습자1",
    "target_level": "N5",
    "current_level": null,
    "total_tests_taken": 0,
    "study_streak": 0
  },
  "message": "사용자가 성공적으로 등록되었습니다"
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 이메일 또는 사용자명 중복

**에러 응답:**
```json
{
  "detail": "이미 등록된 이메일입니다"
}
```

---

### 3. 현재 사용자 정보 조회

**GET** `/api/users/me`

현재 로그인된 사용자의 정보를 조회합니다.

**요청:**
- 인증: 세션 기반 인증 필요

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "학습자1",
    "target_level": "N5",
    "current_level": "N5",
    "total_tests_taken": 5,
    "study_streak": 3
  },
  "message": "사용자 정보 조회 성공"
}
```

**상태 코드:**
- `200 OK`: 성공
- `401 Unauthorized`: 인증되지 않음

---

### 4. 현재 사용자 정보 수정

**PUT** `/api/users/me`

현재 로그인된 사용자의 정보를 수정합니다.

**요청 본문:**
```json
{
  "username": "새로운이름",
  "target_level": "N4"
}
```

**요청 스키마:**
- `username` (string, optional): 새로운 사용자명
- `target_level` (JLPTLevel, optional): 새로운 목표 레벨

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "새로운이름",
    "target_level": "N4",
    "current_level": "N5",
    "total_tests_taken": 5,
    "study_streak": 3
  },
  "message": "사용자 정보가 성공적으로 업데이트되었습니다"
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 사용자명 중복
- `401 Unauthorized`: 인증되지 않음

**에러 응답:**
```json
{
  "detail": "이미 사용중인 사용자명입니다"
}
```

---

### 5. 특정 사용자 조회

**GET** `/api/users/{user_id}`

특정 사용자의 정보를 조회합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
```
GET /api/users/1
```

**응답:**
```json
{
  "message": "사용자 1 조회"
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

---

### 6. 사용자 정보 수정

**PUT** `/api/users/{user_id}`

특정 사용자의 정보를 수정합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
```
PUT /api/users/1
```

**응답:**
```json
{
  "message": "사용자 1 수정"
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

---

### 7. 사용자 삭제

**DELETE** `/api/users/{user_id}`

특정 사용자를 삭제합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
```
DELETE /api/users/1
```

**응답:**
```json
{
  "message": "사용자 1 삭제"
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

---

## 인증

일부 엔드포인트는 세션 기반 인증이 필요합니다:
- `/api/users/me` (GET, PUT)

인증이 필요한 엔드포인트는 세션 쿠키를 통해 인증됩니다.

## 에러 처리

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

## 관련 문서

- [User 스키마](../schemas/user.md)
- [인증 API](./auth.md)

