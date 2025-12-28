# Result API 스키마

## 개요

테스트 결과 관련 API의 요청 및 응답 스키마입니다.

## 응답 스키마

### ResultResponse

상세 결과 응답 스키마입니다.

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

**필드:**
- `id` (integer, required): 결과 ID
- `test_id` (integer, required): 테스트 ID
- `user_id` (integer, required): 사용자 ID
- `score` (number, required): 점수
  - 범위: 0.0-100.0
- `assessed_level` (string, required): 평가된 현재 레벨
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`
- `recommended_level` (string, required): 추천 학습 레벨
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`
- `correct_answers_count` (integer, required): 정답 개수
  - 최소값: 0
- `total_questions_count` (integer, required): 총 문제 개수
  - 최소값: 1
- `time_taken_minutes` (integer, required): 소요 시간 (분)
  - 최소값: 1
- `performance_level` (string, required): 성능 수준
  - 가능한 값: `"excellent"`, `"good"`, `"fair"`, `"needs_improvement"`
- `is_passed` (boolean, required): 합격 여부
- `accuracy_percentage` (number, required): 정확도 백분율
  - 범위: 0.0-100.0
- `time_efficiency` (string, required): 시간 효율성
  - 가능한 값: `"excellent"`, `"good"`, `"fair"`, `"needs_improvement"`
- `level_progression` (string, required): 레벨 진행 상황
  - 가능한 값: `"improved"`, `"maintained"`, `"needs_review"`
- `question_type_analysis` (object, required): 문제 유형별 분석
  - 키: 문제 유형 (string)
  - 값: 분석 결과 (object)
    - `correct` (integer): 정답 개수
    - `total` (integer): 총 문제 수
- `feedback` (object, required): 피드백
  - `overall` (string): 전체 피드백
  - `strength` (string): 강점
  - `weakness` (string): 약점
  - `recommendation` (string): 추천 사항
- `created_at` (string, required): 생성 일시 (ISO 8601 형식)

### ResultListResponse

결과 목록 응답 스키마입니다.

```json
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
```

**필드:**
- `id` (integer, required): 결과 ID
- `test_id` (integer, required): 테스트 ID
- `user_id` (integer, required): 사용자 ID
- `score` (number, required): 점수
- `assessed_level` (string, required): 평가된 현재 레벨
- `recommended_level` (string, required): 추천 학습 레벨
- `performance_level` (string, required): 성능 수준
- `is_passed` (boolean, required): 합격 여부
- `created_at` (string, required): 생성 일시

### AverageScoreResponse

평균 점수 응답 스키마입니다.

```json
{
  "user_id": 1,
  "average_score": 72.5,
  "total_results": 5
}
```

**필드:**
- `user_id` (integer, required): 사용자 ID
- `average_score` (number, required): 평균 점수
  - 범위: 0.0-100.0
- `total_results` (integer, required): 총 결과 수
  - 최소값: 0

### AnalysisReportResponse

결과 분석 리포트 응답 스키마입니다.

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

## 성능 수준

- `"excellent"`: 85점 이상
- `"good"`: 70-84점
- `"fair"`: 60-69점
- `"needs_improvement"`: 60점 미만

## 시간 효율성

- `"excellent"`: 문제당 1분 이하
- `"good"`: 문제당 1-2분
- `"fair"`: 문제당 2-3분
- `"needs_improvement"`: 문제당 3분 초과

## 레벨 진행 상황

- `"improved"`: 추천 레벨이 평가 레벨보다 높음
- `"maintained"`: 추천 레벨과 평가 레벨이 동일
- `"needs_review"`: 추천 레벨이 평가 레벨보다 낮음

## 에러 응답 스키마

### NotFoundError

결과를 찾을 수 없을 때 반환되는 에러 스키마입니다.

```json
{
  "detail": "결과를 찾을 수 없습니다"
}
```

## 예제

### 결과 조회 요청

```bash
curl -X GET "http://localhost:8000/api/results/1" \
  -H "Accept: application/json"
```

### 사용자별 최근 결과 조회 요청

```bash
curl -X GET "http://localhost:8000/api/results/users/1/recent?limit=5" \
  -H "Accept: application/json"
```

### 결과 분석 리포트 요청

```bash
curl -X GET "http://localhost:8000/api/results/1/report" \
  -H "Accept: application/json"
```

## 관련 문서

- [Result API 엔드포인트](../endpoints/results.md)
- [Result 도메인 엔티티](../../architecture/domain/result.md)

