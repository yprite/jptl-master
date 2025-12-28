# Tests API 엔드포인트

## 개요

JLPT 시험 관리 API 엔드포인트입니다. 시험 목록 조회, 시험 생성, 시험 시작, 답안 제출 기능을 제공합니다.

## Base URL

```
/api/v1/tests
```

**참고**: 모든 API 엔드포인트는 `/api/v1` prefix를 사용합니다.

## 엔드포인트 목록

### 1. 시험 목록 조회

**GET** `/api/v1/tests/`

시험 목록을 조회합니다.

**요청:**
- 쿼리 파라미터:
  - `level` (JLPTLevel, optional): 레벨로 필터링

**요청 예시:**
```
GET /api/v1/tests/?level=N5
```

**응답:**
```json
[
  {
    "id": 1,
    "title": "N5 진단 테스트",
    "level": "N5",
    "status": "CREATED",
    "time_limit_minutes": 60,
    "question_count": 20
  }
]
```

**상태 코드:**
- `200 OK`: 성공

---

### 2. 특정 시험 정보 조회

**GET** `/api/v1/tests/{test_id}`

특정 시험의 상세 정보를 조회합니다.

**경로 파라미터:**
- `test_id` (int, required): 시험 ID

**응답:**
```json
{
  "id": 1,
  "title": "N5 진단 테스트",
  "level": "N5",
  "status": "CREATED",
  "time_limit_minutes": 60,
  "questions": [
    {
      "id": 1,
      "level": "N5",
      "question_type": "VOCABULARY",
      "question_text": "「こんにちは」の意味は？",
      "choices": ["안녕하세요", "안녕히 가세요", "감사합니다", "죄송합니다"],
      "difficulty": 1
    }
  ],
  "started_at": null,
  "completed_at": null
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 시험을 찾을 수 없음

---

### 3. N5 진단 테스트 생성

**POST** `/api/v1/tests/diagnostic/n5`

N5 진단 테스트를 생성합니다. 기본 설정으로 자동 생성됩니다.

**요청 본문:**
없음 (빈 요청 본문 또는 요청 본문 없음)

**기본 설정:**
- 레벨: N5
- 문제 수: 20개
- 시간 제한: 30분
- 문제 유형: 모든 유형 포함

**응답:**
```json
{
  "id": 1,
  "title": "N5 진단 테스트",
  "level": "N5",
  "status": "CREATED",
  "time_limit_minutes": 60,
  "questions": [...],
  "started_at": null,
  "completed_at": null
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청

---

### 4. 시험 생성

**POST** `/api/v1/tests/`

새로운 시험을 생성합니다.

**요청 본문:**
```json
{
  "title": "N5 모의고사",
  "level": "N5",
  "question_count": 20,
  "time_limit_minutes": 60,
  "question_types": ["VOCABULARY", "GRAMMAR", "READING"]
}
```

**유형별 문제 수 지정 예시:**
```json
{
  "title": "N5 맞춤형 테스트",
  "level": "N5",
  "time_limit_minutes": 60,
  "question_type_counts": {
    "vocabulary": 10,
    "grammar": 5,
    "reading": 5
  }
}
```

**요청 스키마:**
- `title` (string, required): 시험 제목
- `level` (JLPTLevel, required): JLPT 레벨
- `question_count` (int, optional): 문제 개수 (기본값: 20, `question_type_counts` 사용 시 무시됨)
- `time_limit_minutes` (int, optional): 시간 제한 (분, 기본값: 60)
- `question_types` (List[QuestionType], optional): 문제 유형 필터 (`question_type_counts`와 함께 사용 불가)
- `question_type_counts` (Dict[str, int], optional): 유형별 문제 수 지정 (예: `{"vocabulary": 10, "grammar": 5}`)

**참고:**
- `question_type_counts`가 지정되면 각 유형별로 지정된 수만큼 문제가 생성됩니다.
- `question_type_counts`와 `question_types`는 동시에 사용할 수 없습니다.
- `question_type_counts`를 사용하면 `question_count`는 무시됩니다.

**응답:**
```json
{
  "id": 1,
  "title": "N5 모의고사",
  "level": "N5",
  "status": "CREATED",
  "time_limit_minutes": 60,
  "questions": [...],
  "started_at": null,
  "completed_at": null
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청

---

### 5. 시험 시작

**POST** `/api/v1/tests/{test_id}/start`

시험을 시작합니다.

**경로 파라미터:**
- `test_id` (int, required): 시험 ID

**요청 본문:**
```json
{}
```

**응답:**
```json
{
  "id": 1,
  "title": "N5 진단 테스트",
  "level": "N5",
  "status": "IN_PROGRESS",
  "time_limit_minutes": 60,
  "questions": [...],
  "started_at": "2025-01-04T10:00:00",
  "completed_at": null
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 시험을 시작할 수 없는 상태
- `404 Not Found`: 시험을 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "테스트를 시작할 수 없는 상태입니다: COMPLETED"
}
```

---

### 6. 답안 제출

**POST** `/api/v1/tests/{test_id}/submit`

시험 답안을 제출합니다.

**경로 파라미터:**
- `test_id` (int, required): 시험 ID

**요청 본문:**
```json
{
  "answers": {
    "1": "안녕하세요",
    "2": "감사합니다",
    "3": "죄송합니다"
  }
}
```

**요청 스키마:**
- `answers` (Dict[int, str], required): 답안 (question_id -> answer)

**응답:**
```json
{
  "success": true,
  "data": {
    "test_id": 1,
    "result_id": 1,
    "score": 75.0,
    "correct_answers": 15,
    "total_questions": 20,
    "time_taken_minutes": 45,
    "assessed_level": "N5",
    "recommended_level": "N5",
    "question_type_analysis": {
      "VOCABULARY": {"correct": 4, "total": 5},
      "GRAMMAR": {"correct": 3, "total": 5}
    },
    "performance_level": "good",
    "is_passed": true,
    "feedback": {
      "overall": "전체적으로 좋은 성과를 보였습니다.",
      "strength": "VOCABULARY 영역에서 우수한 성과를 보였습니다.",
      "weakness": "GRAMMAR 영역에서 개선이 필요합니다.",
      "recommendation": "GRAMMAR 문제를 더 많이 연습하세요."
    }
  },
  "message": "시험이 성공적으로 제출되었습니다"
}
```

**상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 시험을 찾을 수 없음

**에러 응답:**
```json
{
  "detail": "시험을 시작하지 않았습니다"
}
```

---

## 인증

일부 엔드포인트는 세션 기반 인증이 필요합니다:
- `/api/v1/tests/{test_id}/start` (POST) - 인증 필요
- `/api/v1/tests/{test_id}/submit` (POST) - 인증 필요

## 시험 상태

- `CREATED`: 생성됨 (시작 전)
- `IN_PROGRESS`: 진행중
- `COMPLETED`: 완료됨

## 에러 처리

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

## 관련 문서

- [Test 스키마](../schemas/test.md)
- [Result API](./results.md)

