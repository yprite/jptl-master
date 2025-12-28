# UserPerformance 도메인 엔티티

## 개요

`UserPerformance` 엔티티는 사용자 성능 분석 데이터를 표현하는 도메인 엔티티입니다. DDD(Domain-Driven Design)의 Entity로 분류되며, 고유 식별자를 가집니다.

## 책임

- 일정 기간 동안의 사용자 성능 집계
- 종합적인 분석 데이터 제공
- 유형별, 난이도별 성취도 분석
- 약점 영역 식별

## 속성

| 속성 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| `id` | `Optional[int]` | 고유 식별자 | 양의 정수 또는 None |
| `user_id` | `int` | 사용자 ID | 양의 정수 |
| `analysis_period_start` | `date` | 분석 기간 시작일 | 날짜 형식 |
| `analysis_period_end` | `date` | 분석 기간 종료일 | 종료일 >= 시작일 |
| `type_performance` | `Dict[str, Any]` | 유형별 성취도 | JSON 딕셔너리 |
| `difficulty_performance` | `Dict[str, Any]` | 난이도별 성취도 | JSON 딕셔너리 |
| `level_progression` | `Dict[str, Any]` | 레벨별 성취도 추이 | JSON 딕셔너리 |
| `repeated_mistakes` | `List[int]` | 반복 오답 문제 ID 리스트 | 선택적 |
| `weaknesses` | `Dict[str, Any]` | 약점 분석 데이터 | JSON 딕셔너리 (ChatGPT 분석용) |
| `created_at` | `datetime` | 생성 일시 | 자동 설정 |
| `updated_at` | `datetime` | 수정 일시 | 자동 업데이트 |

## 주요 메서드

### `update_performance_data(type_performance, difficulty_performance, level_progression, repeated_mistakes, weaknesses)`
성능 분석 데이터를 업데이트합니다.

**파라미터:**
- `type_performance`: Optional[Dict[str, Any]] - 유형별 성취도
- `difficulty_performance`: Optional[Dict[str, Any]] - 난이도별 성취도
- `level_progression`: Optional[Dict[str, Any]] - 레벨별 성취도 추이
- `repeated_mistakes`: Optional[List[int]] - 반복 오답 문제 ID 리스트
- `weaknesses`: Optional[Dict[str, Any]] - 약점 분석 데이터

**부수 효과:**
- `updated_at`을 현재 시간으로 업데이트

### `get_analysis_period_days() -> int`
분석 기간의 일수를 반환합니다.

**반환값:**
- 분석 기간의 일수 (종료일 - 시작일 + 1)

## 비즈니스 규칙

1. **분석 기간**: 종료일은 시작일보다 같거나 늦어야 합니다.
2. **데이터 형식**: 모든 성능 데이터는 JSON 형식의 딕셔너리여야 합니다.
3. **반복 오답**: 반복 오답 문제 ID는 양의 정수 리스트여야 합니다.

## 데이터 구조

### `type_performance` 구조
```python
{
    "VOCABULARY": {
        "total": int,
        "correct": int,
        "accuracy": float
    },
    "GRAMMAR": {...},
    "READING": {...},
    "LISTENING": {...}
}
```

### `difficulty_performance` 구조
```python
{
    "1": {"total": int, "correct": int, "accuracy": float},
    "2": {...},
    "3": {...},
    "4": {...},
    "5": {...}
}
```

### `level_progression` 구조
```python
{
    "N5": {"tests": int, "average_score": float},
    "N4": {...},
    "N3": {...},
    "N2": {...},
    "N1": {...}
}
```

### `weaknesses` 구조
```python
{
    "areas": List[str],  # 약점 영역 목록
    "recommendations": List[str],  # 추천 사항 목록
    "priority": str  # "high", "medium", "low"
}
```

## 관련 엔티티

- `User`: 성능 분석 데이터를 가진 사용자
- `AnswerDetail`: 성능 분석에 사용되는 상세 답안 이력
- `LearningHistory`: 성능 분석에 사용되는 학습 이력

## 예제

```python
from backend.domain.entities.user_performance import UserPerformance
from datetime import date

# 성능 분석 데이터 생성
performance = UserPerformance(
    id=None,
    user_id=1,
    analysis_period_start=date(2025, 1, 1),
    analysis_period_end=date(2025, 1, 31),
    type_performance={
        "VOCABULARY": {"total": 50, "correct": 40, "accuracy": 80.0},
        "GRAMMAR": {"total": 50, "correct": 35, "accuracy": 70.0}
    },
    difficulty_performance={
        "1": {"total": 30, "correct": 28, "accuracy": 93.3},
        "2": {"total": 20, "correct": 15, "accuracy": 75.0}
    },
    repeated_mistakes=[5, 12, 23],
    weaknesses={
        "areas": ["GRAMMAR"],
        "recommendations": ["문법 문제를 더 많이 연습하세요"],
        "priority": "high"
    }
)

# 분석 기간 확인
days = performance.get_analysis_period_days()  # 31
```

