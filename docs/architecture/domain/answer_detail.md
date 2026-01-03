# AnswerDetail 도메인 엔티티

## 개요

`AnswerDetail` 엔티티는 문제별 상세 답안 이력을 표현하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- 문제별 상세 답안 정보 저장
- 문제별 성취도 및 소요 시간 분석
- 문제 유형 및 난이도 추적

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `Optional[int]` | 고유 식별자 | 양의 정수 또는 None |
| `result_id` | `int` | 결과 ID | 양의 정수 |
| `question_id` | `int` | 문제 ID | 양의 정수 |
| `user_answer` | `str` | 사용자가 선택한 답안 | 공백 불가 |
| `correct_answer` | `str` | 정답 | 공백 불가 |
| `is_correct` | `bool` | 정답 여부 | True 또는 False |
| `time_spent_seconds` | `int` | 문제별 소요 시간 (초) | 1 이상 |
| `difficulty` | `int` | 문제 난이도 | 1-5 |
| `question_type` | `QuestionType` | 문제 유형 | VOCABULARY, GRAMMAR, READING, LISTENING |
| `created_at` | `datetime` | 생성 일시 | 자동 설정 |

## 주요 메서드

### `get_time_efficiency() -> str`
시간 효율성을 반환합니다.

**반환값:**
- `"excellent"`: 30초 이하
- `"good"`: 30-60초
- `"fair"`: 60-120초
- `"needs_improvement"`: 120초 초과

## 비즈니스 규칙

1. **소요 시간**: 소요 시간은 최소 1초여야 합니다.
2. **난이도 범위**: 난이도는 1-5 사이의 정수여야 합니다.
3. **정답 일치**: `is_correct`는 `user_answer`와 `correct_answer`가 일치하는지에 따라 결정됩니다.
4. **답안 검증**: 사용자 답안과 정답은 공백만으로 구성될 수 없습니다.

## 관련 엔티티

- `Result`: 답안이 속한 결과
- `Question`: 답안이 속한 문제

## 예제

```python
from backend.domain.entities.answer_detail import AnswerDetail
from backend.domain.value_objects.jlpt import QuestionType

# 답안 상세 생성
answer_detail = AnswerDetail(
    id=None,
    result_id=1,
    question_id=1,
    user_answer="안녕하세요",
    correct_answer="안녕하세요",
    is_correct=True,
    time_spent_seconds=45,
    difficulty=1,
    question_type=QuestionType.VOCABULARY
)

# 시간 효율성 확인
efficiency = answer_detail.get_time_efficiency()  # "good"
```

