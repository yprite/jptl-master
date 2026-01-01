# Vocabulary 도메인 엔티티

## 개요

`Vocabulary` 엔티티는 JLPT 단어 학습을 위한 단어 정보를 표현하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- JLPT 단어 정보 관리 (단어, 읽기, 의미, 예문)
- JLPT 레벨 관리
- 암기 상태 관리 (미암기/학습중/암기완료)

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `int` | 고유 식별자 | 양의 정수 |
| `word` | `str` | 일본어 단어 | 1-100자, 공백 불가 |
| `reading` | `str` | 읽기 (히라가나/가타카나) | 1-200자, 공백 불가 |
| `meaning` | `str` | 의미 (한국어) | 1-500자, 공백 불가 |
| `level` | `JLPTLevel` | JLPT 레벨 | N1, N2, N3, N4, N5 |
| `memorization_status` | `MemorizationStatus` | 암기 상태 | NOT_MEMORIZED, LEARNING, MEMORIZED |
| `example_sentence` | `Optional[str]` | 예문 | 선택적, 최대 1000자 |

## 주요 메서드

### `update_memorization_status(status: MemorizationStatus) -> None`
암기 상태를 업데이트합니다.

**파라미터:**
- `status`: MemorizationStatus - 새로운 암기 상태

**부수 효과:**
- `memorization_status`를 새로운 상태로 업데이트

## 비즈니스 규칙

1. **단어 제약**: 단어는 1-100자이며 공백만으로 구성될 수 없습니다.
2. **읽기 제약**: 읽기는 1-200자이며 공백만으로 구성될 수 없습니다.
3. **의미 제약**: 의미는 1-500자이며 공백만으로 구성될 수 없습니다.
4. **예문 제약**: 예문은 선택적이며, 제공되는 경우 최대 1000자입니다.
5. **암기 상태**: 기본값은 NOT_MEMORIZED이며, 사용자가 학습하면서 상태를 업데이트할 수 있습니다.

## 관련 엔티티

- `User`: 단어를 학습하는 사용자
- `JLPTLevel`: 단어의 JLPT 레벨

## 예제

```python
from backend.domain.entities.vocabulary import Vocabulary
from backend.domain.value_objects.jlpt import JLPTLevel, MemorizationStatus

# 단어 생성
vocabulary = Vocabulary(
    id=0,
    word="ありがとう",
    reading="ありがとう",
    meaning="감사합니다",
    level=JLPTLevel.N5,
    memorization_status=MemorizationStatus.NOT_MEMORIZED,
    example_sentence="ありがとうございます。"
)

# 암기 상태 업데이트
vocabulary.update_memorization_status(MemorizationStatus.MEMORIZED)
```

