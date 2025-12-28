# UserPerformanceAnalysisService 도메인 서비스

## 개요

`UserPerformanceAnalysisService`는 사용자 성능 분석을 위한 도메인 서비스입니다. AnswerDetail 데이터를 기반으로 사용자의 성능을 종합적으로 분석합니다.

## 책임

- 유형별 성취도 집계
- 난이도별 성취도 집계
- 반복 오답 문제 식별
- 약점 영역 분석

## 주요 메서드

### `analyze_type_performance(answer_details: List[AnswerDetail]) -> Dict[str, Dict[str, Any]]`

유형별 성취도를 집계합니다.

**파라미터:**
- `answer_details`: 답안 상세 정보 리스트

**반환값:**
```python
{
    "vocabulary": {"correct": 2, "total": 3, "accuracy": 66.67},
    "grammar": {"correct": 1, "total": 2, "accuracy": 50.0},
    ...
}
```

**설명:**
- 각 문제 유형(vocabulary, grammar, reading, listening)별로 정답 수, 전체 수, 정확도를 계산합니다.
- 정확도는 소수점 둘째 자리까지 반올림됩니다.

### `analyze_difficulty_performance(answer_details: List[AnswerDetail]) -> Dict[str, Dict[str, Any]]`

난이도별 성취도를 집계합니다.

**파라미터:**
- `answer_details`: 답안 상세 정보 리스트

**반환값:**
```python
{
    "1": {"correct": 2, "total": 3, "accuracy": 66.67},
    "2": {"correct": 1, "total": 2, "accuracy": 50.0},
    ...
}
```

**설명:**
- 각 난이도(1-5)별로 정답 수, 전체 수, 정확도를 계산합니다.
- 난이도는 문자열로 변환되어 키로 사용됩니다.

### `identify_repeated_mistakes(answer_details: List[AnswerDetail], threshold: int = 2) -> List[int]`

반복 오답 문제를 식별합니다.

**파라미터:**
- `answer_details`: 답안 상세 정보 리스트
- `threshold`: 반복 오답으로 간주할 최소 오답 횟수 (기본값: 2)

**반환값:**
- 반복 오답 문제 ID 리스트

**설명:**
- 같은 문제를 여러 번 틀린 경우를 식별합니다.
- threshold 이상 틀린 문제만 반환됩니다.

### `identify_weaknesses(answer_details: List[AnswerDetail], accuracy_threshold: float = 60.0) -> Dict[str, Dict[str, Any]]`

약점 영역을 분석합니다.

**파라미터:**
- `answer_details`: 답안 상세 정보 리스트
- `accuracy_threshold`: 약점으로 간주할 정확도 임계값 (기본값: 60.0)

**반환값:**
```python
{
    "type_weaknesses": {
        "grammar": {"correct": 1, "total": 2, "accuracy": 50.0},
        ...
    },
    "difficulty_weaknesses": {
        "2": {"correct": 1, "total": 2, "accuracy": 50.0},
        ...
    }
}
```

**설명:**
- 유형별 및 난이도별 성취도가 임계값 이하인 영역을 약점으로 식별합니다.
- `type_weaknesses`: 문제 유형별 약점
- `difficulty_weaknesses`: 난이도별 약점

## 사용 예시

```python
from backend.domain.services.user_performance_analysis_service import UserPerformanceAnalysisService
from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
from datetime import date, timedelta

# 서비스 인스턴스 생성
service = UserPerformanceAnalysisService()

# 기간 내의 모든 AnswerDetail 조회
period_end = date.today()
period_start = period_end - timedelta(days=30)
answer_details = answer_detail_repo.find_by_user_id_and_period(
    user_id, period_start, period_end
)

# 유형별 성취도 집계
type_performance = service.analyze_type_performance(answer_details)

# 난이도별 성취도 집계
difficulty_performance = service.analyze_difficulty_performance(answer_details)

# 반복 오답 문제 식별
repeated_mistakes = service.identify_repeated_mistakes(answer_details, threshold=2)

# 약점 영역 분석
weaknesses = service.identify_weaknesses(answer_details, accuracy_threshold=60.0)
```

## 통합 위치

이 서비스는 `backend/presentation/controllers/tests.py`의 `submit_test` 컨트롤러에서 사용됩니다.

테스트 제출 시:
1. 기간 내의 모든 AnswerDetail을 조회합니다.
2. UserPerformanceAnalysisService를 사용하여 성능을 분석합니다.
3. 분석 결과를 UserPerformance 엔티티에 저장합니다.

## 테스트

모든 메서드는 `tests/unit/domain/services/test_user_performance_analysis_service.py`에서 테스트됩니다.

- 유형별 성취도 집계 테스트
- 난이도별 성취도 집계 테스트
- 반복 오답 문제 식별 테스트
- 약점 영역 분석 테스트
- 빈 리스트 처리 테스트
- 모든 유형 처리 테스트

