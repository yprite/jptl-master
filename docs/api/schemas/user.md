# User API 스키마

## 개요

사용자 관련 API의 요청 및 응답 스키마입니다.

## 요청 스키마

### UserCreateRequest

사용자 등록 요청 스키마입니다.

```json
{
  "email": "user@example.com",
  "username": "학습자1",
  "target_level": "N5"
}
```

**필드:**
- `email` (string, required): 이메일 주소
  - 형식: 유효한 이메일 형식
  - 예시: `"user@example.com"`
- `username` (string, required): 사용자명
  - 길이: 1-50자
  - 공백 불가
  - 예시: `"학습자1"`
- `target_level` (JLPTLevel, optional): 목표 JLPT 레벨
  - 기본값: `"N5"`
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`

### UserUpdateRequest

사용자 정보 수정 요청 스키마입니다.

```json
{
  "username": "새로운이름",
  "target_level": "N4"
}
```

**필드:**
- `username` (string, optional): 새로운 사용자명
  - 길이: 1-50자
  - 공백 불가
- `target_level` (JLPTLevel, optional): 새로운 목표 레벨
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`

## 응답 스키마

### UserResponse

사용자 정보 응답 스키마입니다.

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "학습자1",
  "target_level": "N5",
  "current_level": "N5",
  "total_tests_taken": 5,
  "study_streak": 3
}
```

**필드:**
- `id` (integer, required): 사용자 ID
- `email` (string, required): 이메일 주소
- `username` (string, required): 사용자명
- `target_level` (string, required): 목표 JLPT 레벨
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`
- `current_level` (string, nullable): 현재 추정 레벨
  - 가능한 값: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`, `null`
  - `null`: 아직 평가되지 않음
- `total_tests_taken` (integer, required): 응시한 총 시험 수
  - 최소값: 0
- `study_streak` (integer, required): 연속 학습 일수
  - 최소값: 0

## JLPTLevel 열거형

JLPT 레벨을 나타내는 열거형입니다.

**가능한 값:**
- `"N1"`: 가장 높은 레벨
- `"N2"`: 상급 레벨
- `"N3"`: 중급 레벨
- `"N4"`: 초급 레벨
- `"N5"`: 가장 낮은 레벨

## 에러 응답 스키마

### ValidationError

유효성 검증 실패 시 반환되는 에러 스키마입니다.

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
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
  "detail": "이미 등록된 이메일입니다"
}
```

## 예제

### 사용자 등록 요청

```bash
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "학습자1",
    "target_level": "N5"
  }'
```

### 사용자 정보 수정 요청

```bash
curl -X PUT "http://localhost:8000/api/users/me" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "username": "새로운이름",
    "target_level": "N4"
  }'
```

## 관련 문서

- [User API 엔드포인트](../endpoints/users.md)
- [User 도메인 엔티티](../../architecture/domain/user.md)

