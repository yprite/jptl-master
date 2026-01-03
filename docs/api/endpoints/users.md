# Users API 엔드포인트

## 개요

사용자 관리 API 엔드포인트입니다. 사용자 등록, 조회, 수정, 삭제 기능을 제공합니다.

## Base URL

```
/api/v1/users
```

**참고**: 모든 API 엔드포인트는 `/api/v1` prefix를 사용합니다.

## 엔드포인트 목록

### 1. 사용자 목록 조회

**GET** `/api/v1/users/`

사용자 목록을 조회합니다.

**요청:**
- 쿼리 파라미터: 없음

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user1@example.com",
      "username": "학습자1",
      "target_level": "N5",
      "current_level": "N5",
      "total_tests_taken": 5,
      "study_streak": 3
    },
    {
      "id": 2,
      "email": "user2@example.com",
      "username": "학습자2",
      "target_level": "N4",
      "current_level": null,
      "total_tests_taken": 0,
      "study_streak": 0
    }
  ],
  "message": "사용자 목록 조회 성공"
}
```

**응답 스키마:**
- `success` (boolean): 요청 성공 여부
- `data` (array): 사용자 목록 (UserResponse 배열)
- `message` (string): 응답 메시지

**상태 코드:**
- `200 OK`: 성공

---

### 2. 사용자 등록

**POST** `/api/v1/users/`

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

**GET** `/api/v1/users/me`

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

**PUT** `/api/v1/users/me`

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

**GET** `/api/v1/users/{user_id}`

특정 사용자의 정보를 조회합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
```
GET /api/v1/users/1
```

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

**응답 스키마:**
- `success` (boolean): 요청 성공 여부
- `data` (UserResponse): 사용자 정보
- `message` (string): 응답 메시지

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "사용자를 찾을 수 없습니다"
}
```

---

### 6. 사용자 정보 수정

**PUT** `/api/v1/users/{user_id}`

특정 사용자의 정보를 수정합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

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

**요청:**
```
PUT /api/v1/users/1
```

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

**응답 스키마:**
- `success` (boolean): 요청 성공 여부
- `data` (UserResponse): 업데이트된 사용자 정보
- `message` (string): 응답 메시지

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 사용자명 중복
- `404 Not Found`: 사용자를 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "이미 사용중인 사용자명입니다"
}
```

또는

```json
{
  "detail": "사용자를 찾을 수 없습니다"
}
```

---

### 7. 사용자 삭제

**DELETE** `/api/v1/users/{user_id}`

특정 사용자를 삭제합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
```
DELETE /api/v1/users/1
```

**응답:**
```json
{
  "success": true,
  "message": "사용자가 성공적으로 삭제되었습니다"
}
```

**응답 스키마:**
- `success` (boolean): 요청 성공 여부
- `message` (string): 응답 메시지

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "사용자를 찾을 수 없습니다"
}
```

---

### 8. 사용자 성능 분석 조회

**GET** `/api/v1/users/{user_id}/performance`

특정 사용자의 성능 분석 데이터를 조회합니다. 유형별 성취도, 난이도별 성취도, 반복 오답 문제, 약점 분석 등의 정보를 포함합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**응답:**
```json
{
  "id": 1,
  "user_id": 1,
  "analysis_period_start": "2025-01-01",
  "analysis_period_end": "2025-01-31",
  "type_performance": {
    "vocabulary": {
      "accuracy": 85.0
    },
    "grammar": {
      "accuracy": 70.0
    }
  },
  "difficulty_performance": {
    "1": {
      "accuracy": 90.0
    },
    "2": {
      "accuracy": 75.0
    }
  },
  "level_progression": {
    "N5": {
      "average_score": 80.0
    }
  },
  "repeated_mistakes": [1, 2, 3],
  "weaknesses": {
    "grammar": "기본 문법 이해 부족"
  },
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00"
}
```

**응답 스키마:**
- `id` (int): 성능 분석 ID
- `user_id` (int): 사용자 ID
- `analysis_period_start` (date): 분석 기간 시작일
- `analysis_period_end` (date): 분석 기간 종료일
- `type_performance` (object): 유형별 성취도 (JSON 딕셔너리)
- `difficulty_performance` (object): 난이도별 성취도 (JSON 딕셔너리)
- `level_progression` (object): 레벨별 성취도 추이 (JSON 딕셔너리)
- `repeated_mistakes` (array): 반복 오답 문제 ID 리스트
- `weaknesses` (object): 약점 분석 데이터 (JSON 딕셔너리)
- `created_at` (datetime): 생성 일시
- `updated_at` (datetime): 수정 일시

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자 또는 성능 분석 데이터를 찾을 수 없음

---

### 9. 사용자 학습 이력 조회

**GET** `/api/v1/users/{user_id}/history`

특정 사용자의 학습 이력을 조회합니다. 날짜별, 시간대별 학습 패턴 및 성취도를 포함합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**응답:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "test_id": 1,
    "result_id": 1,
    "study_date": "2025-01-04",
    "study_hour": 10,
    "total_questions": 20,
    "correct_count": 15,
    "time_spent_minutes": 30,
    "accuracy_percentage": 75.0,
    "created_at": "2025-01-04T10:30:00"
  },
  {
    "id": 2,
    "user_id": 1,
    "test_id": 2,
    "result_id": 2,
    "study_date": "2025-01-04",
    "study_hour": 14,
    "total_questions": 20,
    "correct_count": 18,
    "time_spent_minutes": 25,
    "accuracy_percentage": 90.0,
    "created_at": "2025-01-04T14:30:00"
  }
]
```

**응답 스키마:**
- `id` (int): 학습 이력 ID
- `user_id` (int): 사용자 ID
- `test_id` (int): 테스트 ID
- `result_id` (int): 결과 ID
- `study_date` (date): 학습 날짜
- `study_hour` (int): 학습 시간대 (0-23)
- `total_questions` (int): 총 문제 수
- `correct_count` (int): 정답 개수
- `time_spent_minutes` (int): 소요 시간 (분)
- `accuracy_percentage` (float): 정확도 백분율
- `created_at` (datetime): 생성 일시

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

---

### 10. 일일 학습 목표 조회

**GET** `/api/v1/users/{user_id}/daily-goal`

특정 사용자의 일일 학습 목표와 오늘의 학습 통계, 목표 달성률을 조회합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
- 인증: 세션 기반 인증 필요
- 권한: 자신의 목표만 조회 가능

**응답:**
```json
{
  "success": true,
  "data": {
    "goal": {
      "target_questions": 10,
      "target_minutes": 30
    },
    "statistics": {
      "date": "2025-01-05",
      "total_questions": 8,
      "total_minutes": 25,
      "study_sessions": 2
    },
    "achievement": {
      "questions_achievement_rate": 80.0,
      "minutes_achievement_rate": 83.33,
      "overall_achievement_rate": 81.67,
      "is_questions_achieved": false,
      "is_minutes_achieved": false,
      "is_fully_achieved": false,
      "has_goal": true
    }
  },
  "message": "일일 학습 목표 조회 성공"
}
```

**응답 스키마:**
- `goal` (object): 일일 목표
  - `target_questions` (int): 목표 문제 수
  - `target_minutes` (int): 목표 학습 시간 (분)
- `statistics` (object): 일일 학습 통계
  - `date` (string): 조회 날짜 (ISO 형식)
  - `total_questions` (int): 오늘 푼 문제 수
  - `total_minutes` (int): 오늘 학습 시간 (분)
  - `study_sessions` (int): 학습 세션 수
- `achievement` (object): 목표 달성률
  - `questions_achievement_rate` (float): 문제 수 달성률 (0.0 ~ 100.0)
  - `minutes_achievement_rate` (float): 학습 시간 달성률 (0.0 ~ 100.0)
  - `overall_achievement_rate` (float): 전체 달성률 (평균)
  - `is_questions_achieved` (boolean): 문제 수 목표 달성 여부
  - `is_minutes_achieved` (boolean): 학습 시간 목표 달성 여부
  - `is_fully_achieved` (boolean): 모든 목표 달성 여부
  - `has_goal` (boolean): 목표 설정 여부

**상태 코드:**
- `200 OK`: 성공
- `403 Forbidden`: 다른 사용자의 목표 조회 시도
- `404 Not Found`: 사용자를 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "다른 사용자의 목표를 조회할 수 없습니다"
}
```

---

### 11. 일일 학습 목표 설정/업데이트

**PUT** `/api/v1/users/{user_id}/daily-goal`

특정 사용자의 일일 학습 목표를 설정하거나 업데이트합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청 본문:**
```json
{
  "target_questions": 20,
  "target_minutes": 60
}
```

**요청 스키마:**
- `target_questions` (int, optional): 목표 문제 수
- `target_minutes` (int, optional): 목표 학습 시간 (분)

**요청:**
- 인증: 세션 기반 인증 필요
- 권한: 자신의 목표만 수정 가능

**응답:**
```json
{
  "success": true,
  "data": {
    "target_questions": 20,
    "target_minutes": 60
  },
  "message": "일일 학습 목표가 성공적으로 설정되었습니다"
}
```

**응답 스키마:**
- `success` (boolean): 요청 성공 여부
- `data` (DailyGoalResponse): 설정된 일일 목표
  - `target_questions` (int): 목표 문제 수
  - `target_minutes` (int): 목표 학습 시간 (분)
- `message` (string): 응답 메시지

**상태 코드:**
- `200 OK`: 성공
- `403 Forbidden`: 다른 사용자의 목표 수정 시도
- `404 Not Found`: 사용자를 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "다른 사용자의 목표를 수정할 수 없습니다"
}
```

**참고:**
- 목표가 없는 경우 새로 생성됩니다.
- 일부 필드만 제공하면 해당 필드만 업데이트됩니다.
- 목표가 없는 경우 기본값(문제 수: 10, 학습 시간: 30분)이 사용됩니다.

---

## 인증

일부 엔드포인트는 세션 기반 인증이 필요합니다:
- `/api/v1/users/me` (GET, PUT)
- `/api/v1/users/{user_id}/daily-goal` (GET, PUT)

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

