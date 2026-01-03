# Result 도메인 엔티티

## 개요

`Result` 엔티티는 JLPT 테스트 결과를 분석하고 평가하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- 테스트 결과 데이터 관리
- 레벨 평가 및 추천
- 성능 분석 및 피드백 생성
- 문제 유형별 분석

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `int` | 고유 식별자 | 양의 정수 |
| `test_id` | `int` | 테스트 ID | 양의 정수 |
| `user_id` | `int` | 사용자 ID | 양의 정수 |
| `score` | `float` | 점수 | 0.0-100.0 |
| `assessed_level` | `JLPTLevel` | 평가된 현재 레벨 | N1-N5 |
| `recommended_level` | `JLPTLevel` | 추천 학습 레벨 | N1-N5 |
| `correct_answers_count` | `int` | 정답 개수 | 0 이상, total_questions_count 이하 |
| `total_questions_count` | `int` | 총 문제 개수 | 1 이상 |
| `time_taken_minutes` | `int` | 소요 시간 (분) | 1 이상 |
| `question_type_analysis` | `Dict[str, Dict[str, int]]` | 문제 유형별 분석 | 선택적 |
| `created_at` | `datetime` | 생성 일시 | 자동 설정 |

## 주요 메서드

### `get_accuracy_percentage() -> float`
정확도 백분율을 반환합니다.

**반환값:**
- 0.0-100.0 사이의 정확도

**계산 방식:**
- `score`와 동일 (점수 = 정확도)

### `get_performance_level() -> str`
성능 수준을 반환합니다.

**반환값:**
- `"excellent"`: 85점 이상
- `"good"`: 70-84점
- `"fair"`: 60-69점
- `"needs_improvement"`: 60점 미만

### `is_passed() -> bool`
합격 여부를 반환합니다.

**반환값:**
- `True`: 60점 이상 (합격)
- `False`: 60점 미만 (불합격)

### `get_time_efficiency() -> str`
시간 효율성을 반환합니다.

**반환값:**
- `"excellent"`: 문제당 1분 이하
- `"good"`: 문제당 1-2분
- `"fair"`: 문제당 2-3분
- `"needs_improvement"`: 문제당 3분 초과

### `get_level_progression() -> str`
레벨 진행 상황을 반환합니다.

**반환값:**
- `"improved"`: 추천 레벨이 평가 레벨보다 높음
- `"maintained"`: 추천 레벨과 평가 레벨이 동일
- `"needs_review"`: 추천 레벨이 평가 레벨보다 낮음

### `get_detailed_feedback() -> Dict[str, str]`
상세 피드백을 반환합니다.

**반환값:**
```python
{
    "overall": str,  # 전체 피드백
    "strength": str,  # 강점
    "weakness": str,  # 약점
    "recommendation": str  # 추천 사항
}
```

## 비즈니스 규칙

1. **점수 범위**: 점수는 0.0-100.0 사이여야 합니다.
2. **답안 개수**: 정답 개수는 총 문제 수를 초과할 수 없습니다.
3. **소요 시간**: 소요 시간은 최소 1분이어야 합니다.
4. **레벨 평가**: 점수에 따라 `assessed_level`이 결정됩니다.
5. **레벨 추천**: 점수와 문제 유형별 성취도를 기반으로 `recommended_level`이 결정됩니다.

## 레벨 평가 기준

| 점수 범위 | 평가 레벨 |
|----------|----------|
| 90-100 | N1 |
| 80-89 | N2 |
| 70-79 | N3 |
| 60-69 | N4 |
| 0-59 | N5 |

## 관련 엔티티

- `Test`: 결과가 생성된 테스트
- `User`: 결과를 가진 사용자
- `AnswerDetail`: 상세 답안 이력
- `LearningHistory`: 학습 이력

## 예제

```python
from backend.domain.entities.result import Result
from backend.domain.value_objects.jlpt import JLPTLevel

# 결과 생성
result = Result(
    id=1,
    test_id=1,
    user_id=1,
    score=75.0,
    assessed_level=JLPTLevel.N3,
    recommended_level=JLPTLevel.N3,
    correct_answers_count=15,
    total_questions_count=20,
    time_taken_minutes=45,
    question_type_analysis={
        "VOCABULARY": {"correct": 4, "total": 5},
        "GRAMMAR": {"correct": 3, "total": 5},
        "READING": {"correct": 5, "total": 5},
        "LISTENING": {"correct": 3, "total": 5}
    }
)

# 성능 분석
accuracy = result.get_accuracy_percentage()  # 75.0
performance = result.get_performance_level()  # "good"
is_passed = result.is_passed()  # True
time_efficiency = result.get_time_efficiency()  # "excellent"
level_progression = result.get_level_progression()  # "maintained"

# 피드백
feedback = result.get_detailed_feedback()
```

