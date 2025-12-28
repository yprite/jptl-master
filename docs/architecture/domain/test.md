# Test 도메인 엔티티

## 개요

`Test` 엔티티는 JLPT 진단 테스트나 모의 시험을 표현하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- 테스트 상태 관리 (생성됨, 진행중, 완료됨)
- 테스트 문제 목록 관리
- 사용자 답안 관리
- 점수 계산 및 결과 생성

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `int` | 고유 식별자 | 양의 정수 |
| `title` | `str` | 테스트 제목 | 1-200자, 공백 불가 |
| `level` | `JLPTLevel` | JLPT 레벨 | N1, N2, N3, N4, N5 |
| `questions` | `List[Question]` | 테스트에 포함된 문제들 | 불변성 보장 |
| `time_limit_minutes` | `int` | 시간 제한 (분) | 1-480분 |
| `status` | `TestStatus` | 테스트 상태 | CREATED, IN_PROGRESS, COMPLETED |
| `user_answers` | `Dict[int, str]` | 사용자 답안 | question_id -> answer |
| `score` | `Optional[float]` | 점수 | 0.0-100.0 또는 None |
| `created_at` | `datetime` | 생성 일시 | 자동 설정 |
| `started_at` | `Optional[datetime]` | 시작 일시 | None 또는 datetime |
| `completed_at` | `Optional[datetime]` | 완료 일시 | None 또는 datetime |

## 주요 메서드

### `start_test()`
테스트를 시작합니다.

**검증:**
- 테스트 상태가 CREATED여야 함
- 이미 시작했거나 완료된 테스트는 시작할 수 없음

**부수 효과:**
- 상태를 IN_PROGRESS로 변경
- `started_at`을 현재 시간으로 설정

### `complete_test(user_answers)`
테스트를 완료합니다.

**파라미터:**
- `user_answers`: Dict[int, str] - 사용자 답안 (question_id -> answer)

**검증:**
- 테스트 상태가 IN_PROGRESS여야 함
- 모든 문제에 대한 답안이 제공되어야 함

**부수 효과:**
- 상태를 COMPLETED로 변경
- `completed_at`을 현재 시간으로 설정
- 점수를 계산하여 `score`에 저장
- `user_answers`에 답안 저장

### `get_score() -> float`
테스트 점수를 계산하여 반환합니다.

**반환값:**
- 0.0-100.0 사이의 점수

**계산 방식:**
- (정답 개수 / 총 문제 수) * 100

### `get_correct_count() -> int`
정답 개수를 반환합니다.

**반환값:**
- 정답 개수 (0 이상)

### `get_remaining_time_minutes() -> Optional[int]`
남은 시간을 분 단위로 반환합니다.

**반환값:**
- `None`: 테스트가 시작되지 않음
- `int`: 남은 시간 (분)

**계산 방식:**
- `time_limit_minutes - (현재 시간 - started_at)`

### `is_time_up() -> bool`
시간이 초과되었는지 확인합니다.

**반환값:**
- `True`: 시간 초과
- `False`: 시간 내

## 비즈니스 규칙

1. **테스트 상태 전이**: CREATED → IN_PROGRESS → COMPLETED 순서로만 전이 가능
2. **시간 제한**: 시간 제한은 1-480분(8시간) 사이여야 합니다.
3. **제목 제약**: 테스트 제목은 1-200자이며 공백만으로 구성될 수 없습니다.
4. **문제 불변성**: 테스트에 포함된 문제 목록은 불변입니다.
5. **답안 검증**: 완료 시 모든 문제에 대한 답안이 제공되어야 합니다.

## 관련 엔티티

- `Question`: 테스트에 포함된 문제들
- `Result`: 테스트 결과
- `User`: 테스트를 응시한 사용자

## 예제

```python
from backend.domain.entities.test import Test
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

# 테스트 생성
test = Test(
    id=1,
    title="N5 진단 테스트",
    level=JLPTLevel.N5,
    questions=[question1, question2, question3],
    time_limit_minutes=60
)

# 테스트 시작
test.start_test()

# 답안 제출
user_answers = {
    1: "안녕하세요",
    2: "감사합니다",
    3: "죄송합니다"
}

# 테스트 완료
test.complete_test(user_answers)

# 점수 확인
score = test.get_score()  # 66.67 (2/3 정답)
correct_count = test.get_correct_count()  # 2
```

