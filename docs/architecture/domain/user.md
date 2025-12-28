# User 도메인 엔티티

## 개요

`User` 엔티티는 JLPT 학습자를 표현하는 핵심 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- 학습자 프로필 관리 (이메일, 사용자명, 목표 레벨)
- 학습 진행 상황 추적 (현재 레벨, 총 시험 응시 수, 연속 학습 일수)
- 선호 문제 유형 관리
- 레벨 평가 및 추천 로직

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `Optional[int]` | 고유 식별자 | 양의 정수 또는 None |
| `email` | `str` | 이메일 주소 | 유효한 이메일 형식 |
| `username` | `str` | 사용자명 | 1-50자, 공백 불가 |
| `target_level` | `JLPTLevel` | 목표 JLPT 레벨 | 기본값: N5 |
| `current_level` | `Optional[JLPTLevel]` | 현재 추정 레벨 | None: 아직 평가되지 않음 |
| `total_tests_taken` | `int` | 응시한 총 시험 수 | 0 이상 |
| `study_streak` | `int` | 연속 학습 일수 | 0 이상 |
| `preferred_question_types` | `List[QuestionType]` | 선호하는 문제 유형들 | 선택적 |
| `created_at` | `datetime` | 생성 일시 | 자동 설정 |
| `updated_at` | `datetime` | 수정 일시 | 자동 업데이트 |

## 주요 메서드

### `update_profile(email, username, target_level, preferred_question_types)`
학습자 프로필을 업데이트합니다.

**파라미터:**
- `email`: Optional[str] - 새로운 이메일
- `username`: Optional[str] - 새로운 사용자명
- `target_level`: Optional[JLPTLevel] - 새로운 목표 레벨
- `preferred_question_types`: Optional[List[QuestionType]] - 새로운 선호 문제 유형들

**검증:**
- 이메일 형식 검증
- 사용자명 길이 및 공백 검증
- 목표 레벨 유효성 검증

### `update_learning_progress(current_level, tests_taken=1)`
학습 진행 상황을 업데이트합니다.

**파라미터:**
- `current_level`: JLPTLevel - 새로 평가된 현재 레벨
- `tests_taken`: int - 추가로 응시한 시험 수 (기본값: 1)

### `increment_study_streak()`
연속 학습 일수를 증가시킵니다.

### `reset_study_streak()`
연속 학습 일수를 초기화합니다.

### `can_take_test(test_level) -> bool`
특정 레벨의 시험을 응시할 수 있는지 확인합니다.

**반환값:**
- `True`: 응시 가능
- `False`: 목표 레벨보다 어려운 레벨이므로 응시 불가

### `get_recommended_level() -> JLPTLevel`
추천 학습 레벨을 반환합니다.

**반환값:**
- 현재 레벨이 있으면: 현재 레벨
- 현재 레벨이 없으면: 목표 레벨

### `is_level_up_candidate(new_assessment_level) -> bool`
레벨 업 후보인지 확인합니다.

**반환값:**
- `True`: 레벨 업 가능
- `False`: 레벨 업 불가

## 비즈니스 규칙

1. **이메일 유효성**: 이메일은 RFC 5322 호환 형식이어야 합니다.
2. **사용자명 제약**: 사용자명은 1-50자이며 공백만으로 구성될 수 없습니다.
3. **레벨 제한**: 목표 레벨보다 어려운(높은) 레벨의 시험은 응시할 수 없습니다.
4. **학습 진행**: 시험 응시 시 `total_tests_taken`이 자동으로 증가합니다.

## 관련 엔티티

- `Test`: 사용자가 응시한 시험들
- `Result`: 사용자의 시험 결과들
- `LearningHistory`: 사용자의 학습 이력
- `UserPerformance`: 사용자의 성능 분석 데이터

## 예제

```python
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

# 사용자 생성
user = User(
    id=None,
    email="user@example.com",
    username="학습자1",
    target_level=JLPTLevel.N5
)

# 프로필 업데이트
user.update_profile(
    username="새로운이름",
    target_level=JLPTLevel.N4
)

# 학습 진행 상황 업데이트
user.update_learning_progress(
    current_level=JLPTLevel.N5,
    tests_taken=1
)

# 시험 응시 가능 여부 확인
can_take = user.can_take_test(JLPTLevel.N5)  # True
cannot_take = user.can_take_test(JLPTLevel.N4)  # False (목표 레벨보다 어려움)
```

