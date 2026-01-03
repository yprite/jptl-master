# Test API 스키마

## 개요

시험 관련 API의 요청 및 응답 스키마입니다.

## 요청 스키마

### TestCreateRequest

시험 생성 요청 스키마입니다.

```json
{
  "title": "N5 모의고사",
  "level": "N5",
  "question_count": 20,
  "time_limit_minutes": 60,
  "question_types": ["VOCABULARY", "GRAMMAR", "READING"]
}
```

**필드:**
- `title` (string, required): 시험 제목
  - 길이: 1-200자
  - 공백 불가
- `level` (JLPTLevel, required): JLPT 레벨
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`
- `question_count` (integer, optional): 문제 개수
  - 기본값: `20`
  - 최소값: 1
- `time_limit_minutes` (integer, optional): 시간 제한 (분)
  - 기본값: `60`
  - 최소값: 1
  - 최대값: 480
- `question_types` (array[QuestionType], optional): 문제 유형 필터
  - 기본값: `null` (모든 유형)
  - 가능한 값: `"VOCABULARY"`, `"GRAMMAR"`, `"READING"`, `"LISTENING"`

### TestStartRequest

시험 시작 요청 스키마입니다.

```json
{}
```

**필드:**
- 없음 (빈 객체)

### TestSubmitRequest

답안 제출 요청 스키마입니다.

```json
{
  "answers": {
    "1": "안녕하세요",
    "2": "감사합니다",
    "3": "죄송합니다"
  }
}
```

**필드:**
- `answers` (object, required): 답안
  - 키: 문제 ID (integer)
  - 값: 사용자가 선택한 답안 (string)

## 응답 스키마

### TestResponse

시험 정보 응답 스키마입니다.

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

**필드:**
- `id` (integer, required): 시험 ID
- `title` (string, required): 시험 제목
- `level` (string, required): JLPT 레벨
- `status` (string, required): 시험 상태
  - 가능한 값: `"CREATED"`, `"IN_PROGRESS"`, `"COMPLETED"`
- `time_limit_minutes` (integer, required): 시간 제한 (분)
- `questions` (array[QuestionResponse], required): 문제 목록
- `started_at` (string, nullable): 시작 일시 (ISO 8601 형식)
- `completed_at` (string, nullable): 완료 일시 (ISO 8601 형식)

### TestListResponse

시험 목록 응답 스키마입니다.

```json
{
  "id": 1,
  "title": "N5 진단 테스트",
  "level": "N5",
  "status": "CREATED",
  "time_limit_minutes": 60,
  "question_count": 20
}
```

**필드:**
- `id` (integer, required): 시험 ID
- `title` (string, required): 시험 제목
- `level` (string, required): JLPT 레벨
- `status` (string, required): 시험 상태
- `time_limit_minutes` (integer, required): 시간 제한 (분)
- `question_count` (integer, required): 문제 개수

### QuestionResponse

문제 정보 응답 스키마입니다.

```json
{
  "id": 1,
  "level": "N5",
  "question_type": "VOCABULARY",
  "question_text": "「こんにちは」の意味は？",
  "choices": ["안녕하세요", "안녕히 가세요", "감사합니다", "죄송합니다"],
  "difficulty": 1
}
```

**필드:**
- `id` (integer, required): 문제 ID
- `level` (string, required): JLPT 레벨
- `question_type` (string, required): 문제 유형
  - 가능한 값: `"VOCABULARY"`, `"GRAMMAR"`, `"READING"`, `"LISTENING"`
- `question_text` (string, required): 문제 내용
- `choices` (array[string], required): 선택지 목록
  - 최소 개수: 2
  - 최대 개수: 6
- `difficulty` (integer, required): 난이도
  - 범위: 1-5

## TestStatus 열거형

시험 상태를 나타내는 열거형입니다.

**가능한 값:**
- `"CREATED"`: 생성됨 (시작 전)
- `"IN_PROGRESS"`: 진행중
- `"COMPLETED"`: 완료됨

## QuestionType 열거형

문제 유형을 나타내는 열거형입니다.

**가능한 값:**
- `"VOCABULARY"`: 어휘
- `"GRAMMAR"`: 문법
- `"READING"`: 독해
- `"LISTENING"`: 청해

## 에러 응답 스키마

### ValidationError

유효성 검증 실패 시 반환되는 에러 스키마입니다.

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### BusinessError

비즈니스 로직 에러 시 반환되는 에러 스키마입니다.

```json
{
  "detail": "테스트를 시작할 수 없는 상태입니다: COMPLETED"
}
```

## 예제

### 시험 생성 요청

```bash
curl -X POST "http://localhost:8000/api/v1/tests/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "N5 모의고사",
    "level": "N5",
    "question_count": 20,
    "time_limit_minutes": 60
  }'
```

### 답안 제출 요청

```bash
curl -X POST "http://localhost:8000/api/v1/tests/1/submit" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "answers": {
      "1": "안녕하세요",
      "2": "감사합니다"
    }
  }'
```

## 관련 문서

- [Test API 엔드포인트](../endpoints/tests.md)
- [Test 도메인 엔티티](../../architecture/domain/test.md)

