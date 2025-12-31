# 어드민 API 엔드포인트

## 개요

어드민 API는 어드민 권한이 있는 사용자만 접근할 수 있는 관리 기능을 제공합니다.

## Base URL

```
/api/v1/admin
```

## 인증

모든 어드민 API 엔드포인트는 어드민 권한이 필요합니다:

1. `/api/v1/auth/login` 엔드포인트로 어드민 계정으로 로그인
2. 세션 쿠키가 자동으로 설정됨
3. 어드민 API 엔드포인트에 접근 시 어드민 권한이 자동으로 확인됨

**에러 응답:**
- `401 Unauthorized`: 인증되지 않은 경우
- `403 Forbidden`: 어드민 권한이 없는 경우

## 사용자 관리 API

### 전체 사용자 목록 조회

**엔드포인트:** `GET /api/v1/admin/users`

**설명:** 어드민이 전체 사용자 목록을 조회합니다.

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "user",
      "target_level": "N5",
      "current_level": null,
      "total_tests_taken": 0,
      "study_streak": 0,
      "is_admin": false
    }
  ],
  "message": "사용자 목록 조회 성공"
}
```

### 특정 사용자 조회

**엔드포인트:** `GET /api/v1/admin/users/{user_id}`

**설명:** 어드민이 특정 사용자의 상세 정보를 조회합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `user_id` (int): 사용자 ID

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "target_level": "N5",
    "current_level": null,
    "total_tests_taken": 0,
    "study_streak": 0,
    "is_admin": false
  },
  "message": "사용자 정보 조회 성공"
}
```

**에러 응답:**
- `404 Not Found`: 사용자를 찾을 수 없는 경우

### 사용자 정보 수정

**엔드포인트:** `PUT /api/v1/admin/users/{user_id}`

**설명:** 어드민이 사용자 정보를 수정합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `user_id` (int): 사용자 ID

**요청 본문:**

```json
{
  "username": "updated_user",
  "target_level": "N4"
}
```

**요청 필드:**
- `username` (string, optional): 사용자명
- `target_level` (string, optional): 목표 레벨 (N1, N2, N3, N4, N5)

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "updated_user",
    "target_level": "N4",
    "current_level": null,
    "total_tests_taken": 0,
    "study_streak": 0,
    "is_admin": false
  },
  "message": "사용자 정보가 성공적으로 업데이트되었습니다"
}
```

**에러 응답:**
- `400 Bad Request`: 사용자명 중복 등 유효성 검증 실패
- `404 Not Found`: 사용자를 찾을 수 없는 경우

### 사용자 삭제

**엔드포인트:** `DELETE /api/v1/admin/users/{user_id}`

**설명:** 어드민이 사용자를 삭제합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `user_id` (int): 사용자 ID

**응답 예시:**

```json
{
  "success": true,
  "message": "사용자가 성공적으로 삭제되었습니다"
}
```

**에러 응답:**
- `404 Not Found`: 사용자를 찾을 수 없는 경우

## 문제 관리 API

### 전체 문제 목록 조회

**엔드포인트:** `GET /api/v1/admin/questions`

**설명:** 어드민이 전체 문제 목록을 조회합니다.

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "level": "N5",
      "question_type": "vocabulary",
      "question_text": "問題",
      "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correct_answer": "選択肢1",
      "explanation": "説明",
      "difficulty": 1
    }
  ],
  "message": "문제 목록 조회 성공"
}
```

### 문제 생성

**엔드포인트:** `POST /api/v1/admin/questions`

**설명:** 어드민이 새로운 문제를 생성합니다.

**인증:** 어드민 권한 필요

**요청 본문:**

```json
{
  "level": "N5",
  "question_type": "vocabulary",
  "question_text": "新しい問題",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correct_answer": "選択肢1",
  "explanation": "説明",
  "difficulty": 1
}
```

**요청 필드:**
- `level` (string, required): JLPT 레벨 (N1, N2, N3, N4, N5)
- `question_type` (string, required): 문제 유형 (vocabulary, grammar, reading, listening)
- `question_text` (string, required): 문제 내용
- `choices` (array, required): 선택지 목록 (최소 2개, 최대 6개)
- `correct_answer` (string, required): 정답 (choices 중 하나여야 함)
- `explanation` (string, required): 해설
- `difficulty` (int, required): 난이도 (1-5)

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "level": "N5",
    "question_type": "vocabulary",
    "question_text": "新しい問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 1,
    "audio_url": null
  },
  "message": "문제가 성공적으로 생성되었습니다"
}
```

**특별 동작:**
- **자동 TTS 생성**: `question_type`이 `listening`인 경우, 문제 생성 시 자동으로 TTS 오디오가 생성되어 `audio_url` 필드에 저장됩니다.
- TTS 생성 실패 시에도 문제 생성은 성공하며, 오디오는 나중에 수동으로 업로드할 수 있습니다.

**에러 응답:**
- `400 Bad Request`: 유효성 검증 실패 (예: 정답이 choices에 없음, 선택지 중복 등)

### 특정 문제 조회

**엔드포인트:** `GET /api/v1/admin/questions/{question_id}`

**설명:** 어드민이 특정 문제의 상세 정보를 조회합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `question_id` (int): 문제 ID

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "level": "N5",
    "question_type": "vocabulary",
    "question_text": "問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 1,
    "audio_url": null
  },
  "message": "문제 정보 조회 성공"
}
```

**에러 응답:**
- `404 Not Found`: 문제를 찾을 수 없는 경우

### 문제 수정

**엔드포인트:** `PUT /api/v1/admin/questions/{question_id}`

**설명:** 어드민이 문제 정보를 수정합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `question_id` (int): 문제 ID

**요청 본문:**

```json
{
  "question_text": "更新された問題",
  "difficulty": 2
}
```

**요청 필드 (모두 optional):**
- `level` (string, optional): JLPT 레벨
- `question_type` (string, optional): 문제 유형
- `question_text` (string, optional): 문제 내용

**특별 동작:**
- **자동 TTS 재생성**: `question_type`이 `listening`으로 변경되거나 `question_text`가 변경된 경우, 자동으로 TTS 오디오가 생성/재생성되어 `audio_url` 필드에 저장됩니다.
- 기존 TTS 파일이 있으면 자동으로 삭제되고 새 파일이 생성됩니다.
- TTS 생성 실패 시에도 문제 수정은 성공하며, 오디오는 나중에 수동으로 업로드할 수 있습니다.
- `choices` (array, optional): 선택지 목록
- `correct_answer` (string, optional): 정답
- `explanation` (string, optional): 해설
- `difficulty` (int, optional): 난이도

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "level": "N5",
    "question_type": "vocabulary",
    "question_text": "更新された問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 2
  },
  "message": "문제가 성공적으로 업데이트되었습니다"
}
```

**에러 응답:**
- `400 Bad Request`: 유효성 검증 실패 (예: 정답이 choices에 없음)
- `404 Not Found`: 문제를 찾을 수 없는 경우

### 문제 삭제

**엔드포인트:** `DELETE /api/v1/admin/questions/{question_id}`

**설명:** 어드민이 문제를 삭제합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `question_id` (int): 문제 ID

**응답 예시:**

```json
{
  "success": true,
  "message": "문제가 성공적으로 삭제되었습니다"
}
```

**에러 응답:**
- `404 Not Found`: 문제를 찾을 수 없는 경우

## 통계 API

### 통계 조회

**엔드포인트:** `GET /api/v1/admin/statistics`

**설명:** 어드민이 전체 시스템 통계를 조회합니다.

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total_users": 10,
      "active_users": 7
    },
    "tests": {
      "total_tests": 25,
      "average_score": 75.5
    },
    "questions": {
      "total_questions": 50,
      "by_level": {
        "N5": 20,
        "N4": 15,
        "N3": 10,
        "N2": 5
      }
    },
    "learning_data": {
      "total_results": 25
    }
  },
  "message": "통계 조회 성공"
}
```

**응답 필드:**
- `users.total_users` (int): 전체 사용자 수
- `users.active_users` (int): 활성 사용자 수 (테스트를 한 번 이상 받은 사용자)
- `tests.total_tests` (int): 전체 테스트 수
- `tests.average_score` (float): 평균 점수
- `questions.total_questions` (int): 전체 문제 수
- `questions.by_level` (object): 레벨별 문제 수 (레벨을 키로 하는 객체)
- `learning_data.total_results` (int): 전체 결과 수

**에러 응답:**
- `401 Unauthorized`: 인증되지 않은 경우
- `403 Forbidden`: 어드민 권한이 없는 경우

## 관련 문서

- [인증 API](./auth.md) - 로그인 및 권한 관리
- [사용자 API](./users.md) - 일반 사용자 API
- [테스트 API](./tests.md) - 테스트 관리 API
- [API 스키마](../schemas/README.md) - 요청/응답 스키마 정의

