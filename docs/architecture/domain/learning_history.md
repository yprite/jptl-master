# LearningHistory 도메인 엔티티

## 개요

`LearningHistory` 엔티티는 학습 이력을 표현하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- 사용자의 학습 패턴을 날짜별, 시간대별로 추적
- 학습 습관 분석을 위한 데이터 제공
- 학습 통계 집계

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `Optional[int]` | 고유 식별자 | 양의 정수 또는 None |
| `user_id` | `int` | 사용자 ID | 양의 정수 |
| `test_id` | `int` | 테스트 ID | 양의 정수 |
| `result_id` | `int` | 결과 ID | 양의 정수 |
| `study_date` | `date` | 학습 날짜 | 날짜 형식 |
| `study_hour` | `int` | 학습 시간대 (0-23) | 0-23 |
| `total_questions` | `int` | 총 문제 수 | 1 이상 |
| `correct_count` | `int` | 정답 개수 | 0 이상, total_questions 이하 |
| `time_spent_minutes` | `int` | 소요 시간 (분) | 1 이상 |
| `created_at` | `datetime` | 생성 일시 | 자동 설정 |

## 주요 메서드

### `get_accuracy_percentage() -> float`
정확도 백분율을 반환합니다.

**반환값:**
- 0.0-100.0 사이의 정확도

**계산 방식:**
- (정답 개수 / 총 문제 수) * 100

### `get_study_period() -> str`
학습 시간대를 반환합니다.

**반환값:**
- `"morning"`: 6-11시
- `"afternoon"`: 12-17시
- `"evening"`: 18-22시
- `"night"`: 23-5시

## 비즈니스 규칙

1. **시간대 범위**: 학습 시간대는 0-23 사이의 정수여야 합니다.
2. **답안 개수**: 정답 개수는 총 문제 수를 초과할 수 없습니다.
3. **소요 시간**: 소요 시간은 최소 1분이어야 합니다.
4. **총 문제 수**: 총 문제 수는 최소 1개여야 합니다.

## 관련 엔티티

- `User`: 학습 이력을 가진 사용자
- `Test`: 학습한 테스트
- `Result`: 학습 결과

## 예제

```python
from backend.domain.entities.learning_history import LearningHistory
from datetime import date

# 학습 이력 생성
history = LearningHistory(
    id=None,
    user_id=1,
    test_id=1,
    result_id=1,
    study_date=date(2025, 1, 4),
    study_hour=14,  # 오후 2시
    total_questions=20,
    correct_count=15,
    time_spent_minutes=45
)

# 정확도 확인
accuracy = history.get_accuracy_percentage()  # 75.0

# 학습 시간대 확인
period = history.get_study_period()  # "afternoon"
```

