# Question 도메인 엔티티

## 개요

`Question` 엔티티는 JLPT 시험 문제를 표현하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- JLPT 문제 정보 관리 (문제 내용, 선택지, 정답, 해설)
- 문제 유형 및 난이도 관리
- 답안 검증 로직

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `int` | 고유 식별자 | 양의 정수 |
| `level` | `JLPTLevel` | JLPT 레벨 | N1, N2, N3, N4, N5 |
| `question_type` | `QuestionType` | 문제 유형 | VOCABULARY, GRAMMAR, READING, LISTENING |
| `question_text` | `str` | 문제 내용 | 1-2000자, 공백 불가 |
| `choices` | `List[str]` | 선택지 목록 | 2-6개, 중복 불가, 각 선택지 1-500자 |
| `correct_answer` | `str` | 정답 | 선택지 중 하나여야 함 |
| `explanation` | `str` | 해설 | 선택적 |
| `difficulty` | `int` | 난이도 | 1-5 |

## 주요 메서드

### `check_answer(user_answer) -> bool`
사용자 답안이 정답인지 확인합니다.

**파라미터:**
- `user_answer`: str - 사용자가 선택한 답안

**반환값:**
- `True`: 정답
- `False`: 오답

**검증:**
- 사용자 답안이 선택지 중 하나인지 확인

### `get_question_info() -> Dict`
문제 정보를 딕셔너리로 반환합니다.

**반환값:**
```python
{
    "id": int,
    "level": str,
    "question_type": str,
    "question_text": str,
    "choices": List[str],
    "difficulty": int
}
```

## 비즈니스 규칙

1. **선택지 제약**: 선택지는 최소 2개, 최대 6개여야 하며 중복될 수 없습니다.
2. **정답 검증**: 정답은 반드시 선택지 중 하나여야 합니다.
3. **문제 내용 제약**: 문제 내용은 1-2000자이며 공백만으로 구성될 수 없습니다.
4. **선택지 길이**: 각 선택지는 1-500자여야 합니다.
5. **난이도 범위**: 난이도는 1-5 사이의 정수여야 합니다.

## 관련 엔티티

- `Test`: 문제가 포함된 시험
- `AnswerDetail`: 문제별 상세 답안 이력

## 예제

```python
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

# 문제 생성
question = Question(
    id=1,
    level=JLPTLevel.N5,
    question_type=QuestionType.VOCABULARY,
    question_text="「こんにちは」の意味は？",
    choices=["안녕하세요", "안녕히 가세요", "감사합니다", "죄송합니다"],
    correct_answer="안녕하세요",
    explanation="「こんにちは」는 낮 인사로 '안녕하세요'를 의미합니다.",
    difficulty=1
)

# 답안 확인
is_correct = question.check_answer("안녕하세요")  # True
is_wrong = question.check_answer("안녕히 가세요")  # False

# 문제 정보 조회
info = question.get_question_info()
```

