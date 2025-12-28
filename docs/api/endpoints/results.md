# Results API 엔드포인트

## 개요

JLPT 테스트 결과 조회 API 엔드포인트입니다. 결과 목록 조회, 상세 결과 조회, 사용자별 결과 조회, 결과 분석 리포트 생성 기능을 제공합니다.

## Base URL

```
/api/results
```

## 엔드포인트 목록

### 1. 결과 목록 조회

**GET** `/api/results/`

결과 목록을 조회합니다.

**요청:**
- 쿼리 파라미터:
  - `user_id` (int, optional): 사용자 ID로 필터링
  - `test_id` (int, optional): 테스트 ID로 필터링

**요청 예시:**
```
GET /api/results/?user_id=1
GET /api/results/?test_id=1
```

**응답:**
```json
[
  {
    "id": 1,
    "test_id": 1,
    "user_id": 1,
    "score": 75.0,
    "assessed_level": "N3",
    "recommended_level": "N3",
    "performance_level": "good",
    "is_passed": true,
    "created_at": "2025-01-04T10:30:00"
  }
]
```

**상태 코드:**
- `200 OK`: 성공

---

### 2. 상세 결과 조회

**GET** `/api/results/{result_id}`

특정 결과의 상세 정보를 조회합니다.

**경로 파라미터:**
- `result_id` (int, required): 결과 ID

**응답:**
```json
{
  "id": 1,
  "test_id": 1,
  "user_id": 1,
  "score": 75.0,
  "assessed_level": "N3",
  "recommended_level": "N3",
  "correct_answers_count": 15,
  "total_questions_count": 20,
  "time_taken_minutes": 45,
  "performance_level": "good",
  "is_passed": true,
  "accuracy_percentage": 75.0,
  "time_efficiency": "excellent",
  "level_progression": "maintained",
  "question_type_analysis": {
    "VOCABULARY": {"correct": 4, "total": 5},
    "GRAMMAR": {"correct": 3, "total": 5},
    "READING": {"correct": 5, "total": 5},
    "LISTENING": {"correct": 3, "total": 5}
  },
  "feedback": {
    "overall": "전체적으로 좋은 성과를 보였습니다.",
    "strength": "READING 영역에서 우수한 성과를 보였습니다.",
    "weakness": "LISTENING 영역에서 개선이 필요합니다.",
    "recommendation": "LISTENING 문제를 더 많이 연습하세요."
  },
  "created_at": "2025-01-04T10:30:00"
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 결과를 찾을 수 없음

---

### 3. 사용자별 최근 결과 조회

**GET** `/api/results/users/{user_id}/recent`

특정 사용자의 최근 결과를 조회합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**요청:**
- 쿼리 파라미터:
  - `limit` (int, optional): 조회할 결과 개수 (기본값: 10, 최소: 1, 최대: 100)

**요청 예시:**
```
GET /api/results/users/1/recent?limit=5
```

**응답:**
```json
[
  {
    "id": 1,
    "test_id": 1,
    "user_id": 1,
    "score": 75.0,
    "assessed_level": "N3",
    "recommended_level": "N3",
    "performance_level": "good",
    "is_passed": true,
    "created_at": "2025-01-04T10:30:00"
  }
]
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

---

### 4. 사용자 평균 점수 조회

**GET** `/api/results/users/{user_id}/average-score`

특정 사용자의 평균 점수를 조회합니다.

**경로 파라미터:**
- `user_id` (int, required): 사용자 ID

**응답:**
```json
{
  "user_id": 1,
  "average_score": 72.5,
  "total_results": 5
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 사용자를 찾을 수 없음

---

### 5. 결과 분석 리포트 생성

**GET** `/api/results/{result_id}/report`

테스트 결과를 기반으로 상세한 분석 리포트를 생성합니다.

**경로 파라미터:**
- `result_id` (int, required): 결과 ID

**응답:**
```json
{
  "summary": {
    "score": 75.0,
    "correct_answers_count": 15,
    "total_questions_count": 20,
    "accuracy_percentage": 75.0,
    "performance_level": "good",
    "is_passed": true,
    "time_taken_minutes": 45,
    "time_efficiency": "excellent",
    "assessed_level": "N3",
    "recommended_level": "N3",
    "level_progression": "maintained"
  },
  "question_type_analysis": {
    "VOCABULARY": {
      "correct": 4,
      "total": 5,
      "accuracy": 80.0,
      "performance": "excellent"
    },
    "GRAMMAR": {
      "correct": 3,
      "total": 5,
      "accuracy": 60.0,
      "performance": "needs_improvement"
    }
  },
  "strengths": [
    {
      "type": "VOCABULARY",
      "accuracy": 80.0,
      "message": "Vocabulary 영역에서 우수한 성과를 보였습니다."
    }
  ],
  "weaknesses": [
    {
      "type": "GRAMMAR",
      "accuracy": 60.0,
      "message": "Grammar 영역에서 개선이 필요합니다."
    }
  ],
  "improvement_areas": [
    {
      "type": "GRAMMAR",
      "current_accuracy": 60.0,
      "target_accuracy": 70.0,
      "recommendation": "Grammar 문제를 더 많이 연습하세요."
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "category": "GRAMMAR",
      "message": "Grammar 문제를 더 많이 연습하세요."
    }
  ],
  "feedback": {
    "overall": "전체적으로 좋은 성과를 보였습니다.",
    "strength": "READING 영역에서 우수한 성과를 보였습니다.",
    "weakness": "LISTENING 영역에서 개선이 필요합니다.",
    "recommendation": "LISTENING 문제를 더 많이 연습하세요."
  }
}
```

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 결과를 찾을 수 없음

---

### 6. 상세 답안 이력 조회

**GET** `/api/results/{result_id}/details`

특정 결과에 대한 모든 문제별 상세 답안 이력을 조회합니다. 각 답안의 정답 여부, 소요 시간, 난이도, 문제 유형 등의 정보를 포함합니다.

**경로 파라미터:**
- `result_id` (int, required): 결과 ID

**응답:**
```json
[
  {
    "id": 1,
    "result_id": 1,
    "question_id": 1,
    "user_answer": "A",
    "correct_answer": "A",
    "is_correct": true,
    "time_spent_seconds": 30,
    "difficulty": 1,
    "question_type": "vocabulary",
    "created_at": "2025-01-04T10:30:00"
  },
  {
    "id": 2,
    "result_id": 1,
    "question_id": 2,
    "user_answer": "B",
    "correct_answer": "C",
    "is_correct": false,
    "time_spent_seconds": 45,
    "difficulty": 2,
    "question_type": "grammar",
    "created_at": "2025-01-04T10:30:00"
  }
]
```

**응답 스키마:**
- `id` (int): 답안 상세 ID
- `result_id` (int): 결과 ID
- `question_id` (int): 문제 ID
- `user_answer` (string): 사용자가 선택한 답안
- `correct_answer` (string): 정답
- `is_correct` (boolean): 정답 여부
- `time_spent_seconds` (int): 문제별 소요 시간 (초)
- `difficulty` (int): 문제 난이도 (1-5)
- `question_type` (string): 문제 유형 (vocabulary, grammar, reading, listening)
- `created_at` (datetime): 생성 일시

**상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 결과를 찾을 수 없음

---

## 성능 수준

- `excellent`: 85점 이상
- `good`: 70-84점
- `fair`: 60-69점
- `needs_improvement`: 60점 미만

## 시간 효율성

- `excellent`: 문제당 1분 이하
- `good`: 문제당 1-2분
- `fair`: 문제당 2-3분
- `needs_improvement`: 문제당 3분 초과

## 레벨 진행 상황

- `improved`: 추천 레벨이 평가 레벨보다 높음
- `maintained`: 추천 레벨과 평가 레벨이 동일
- `needs_review`: 추천 레벨이 평가 레벨보다 낮음

## 에러 처리

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

## 관련 문서

- [Result 스키마](../schemas/result.md)
- [Test API](./tests.md)

