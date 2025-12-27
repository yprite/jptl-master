# 학습 분석 시스템 설계

## 개요

JLPT 자격 검증 프로그램의 학습 분석 시스템은 사용자의 학습 데이터를 수집하고 분석하여 개인별 맞춤형 학습 추천 및 보완점 분석을 제공합니다. 향후 ChatGPT API를 활용한 AI 기반 분석을 목표로 하며, 현재는 데이터 수집 및 집계 단계입니다.

## 시스템 목표

1. **개인 데이터 수집**: 문제별 상세 답안, 학습 이력, 성능 데이터 수집
2. **데이터 집계**: 유형별, 난이도별, 레벨별 성취도 분석
3. **약점 식별**: 반복 오답 패턴 및 취약 영역 파악
4. **ChatGPT 분석 준비**: 수집된 데이터를 ChatGPT API로 분석할 수 있도록 구조화

## 아키텍처

### 레이어 구조

```
┌─────────────────────────────────────────┐
│      Presentation Layer                 │
│  - Performance API Controllers          │
│  - Analysis Report DTOs                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Application Layer                  │
│  - AnalysisService (도메인 서비스)      │
│  - BatchAnalysisJob (배치 작업)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Domain Layer                       │
│  - AnswerDetail (엔티티)                │
│  - LearningHistory (엔티티)              │
│  - UserPerformance (엔티티)              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  - AnswerDetailRepository               │
│  - LearningHistoryRepository            │
│  - UserPerformanceRepository            │
│  - ChatGPTAnalysisAdapter (향후 구현)    │
└─────────────────────────────────────────┘
```

## 도메인 모델

### AnswerDetail (문제별 상세 답안 이력)

**목적**: 각 문제에 대한 사용자의 상세 답안 정보를 저장하여 문제별 성취도 및 소요 시간을 분석

**속성**:
- `id`: 고유 식별자
- `result_id`: 결과 ID (어떤 시험 결과인지)
- `question_id`: 문제 ID
- `user_answer`: 사용자가 선택한 답안
- `correct_answer`: 정답
- `is_correct`: 정답 여부
- `time_spent_seconds`: 문제별 소요 시간 (초)
- `difficulty`: 문제 난이도 (1-5)
- `question_type`: 문제 유형 (VOCABULARY, GRAMMAR, READING, LISTENING)
- `created_at`: 생성 일시

**사용 사례**:
- 문제별 정답률 분석
- 난이도별 성취도 분석
- 유형별 소요 시간 분석
- 반복 오답 문제 식별

### LearningHistory (학습 이력)

**목적**: 사용자의 학습 패턴을 날짜별, 시간대별로 추적하여 학습 습관 분석

**속성**:
- `id`: 고유 식별자
- `user_id`: 사용자 ID
- `test_id`: 테스트 ID
- `result_id`: 결과 ID
- `study_date`: 학습 날짜
- `study_hour`: 학습 시간대 (0-23)
- `total_questions`: 총 문제 수
- `correct_count`: 정답 개수
- `time_spent_minutes`: 소요 시간 (분)
- `created_at`: 생성 일시

**사용 사례**:
- 날짜별 학습량 추이 분석
- 시간대별 학습 패턴 분석
- 학습 습관 파악
- 학습 일정 최적화 제안

### UserPerformance (사용자 성능 분석 데이터)

**목적**: 일정 기간 동안의 사용자 성능을 집계하여 종합적인 분석 데이터 제공

**속성**:
- `id`: 고유 식별자
- `user_id`: 사용자 ID
- `analysis_period_start`: 분석 기간 시작일
- `analysis_period_end`: 분석 기간 종료일
- `type_performance`: 유형별 성취도 (JSON)
  ```json
  {
    "vocabulary": {"accuracy": 0.85, "avg_time": 120, "total": 50},
    "grammar": {"accuracy": 0.72, "avg_time": 150, "total": 45}
  }
  ```
- `difficulty_performance`: 난이도별 성취도 (JSON)
  ```json
  {
    "1": {"accuracy": 0.95, "total": 20},
    "2": {"accuracy": 0.80, "total": 30},
    "3": {"accuracy": 0.65, "total": 25}
  }
  ```
- `level_progression`: 레벨별 성취도 추이 (JSON)
  ```json
  {
    "N5": {"avg_score": 85.0, "test_count": 5},
    "N4": {"avg_score": 72.0, "test_count": 3}
  }
  ```
- `repeated_mistakes`: 반복 오답 문제 ID 리스트 (JSON 배열)
- `weaknesses`: 약점 분석 데이터 (JSON, ChatGPT 분석용)
  ```json
  {
    "weak_types": ["grammar", "reading"],
    "weak_difficulties": [4, 5],
    "common_mistakes": ["문법 패턴 A", "독해 스킬 B"]
  }
  ```
- `created_at`: 생성 일시
- `updated_at`: 수정 일시

**사용 사례**:
- 종합 성능 리포트 생성
- ChatGPT 분석을 위한 데이터 준비
- 학습 추천 생성
- 약점 영역 식별

## 데이터 수집 프로세스

### 테스트 제출 시 자동 수집

1. **AnswerDetail 생성**
   - 각 문제별로 상세 답안 정보 저장
   - 문제별 소요 시간 기록 (향후 구현 시 문제별 시작/종료 시간 추적)

2. **LearningHistory 생성**
   - 학습 날짜 및 시간대 기록
   - 테스트 결과 요약 정보 저장

3. **UserPerformance 업데이트**
   - 실시간 집계 또는 배치 집계 (선택 가능)
   - 유형별, 난이도별, 레벨별 성취도 계산
   - 반복 오답 문제 식별

### 데이터 수집 시점

- **실시간**: 테스트 제출 시 즉시 AnswerDetail, LearningHistory 저장
- **배치**: 주기적으로 UserPerformance 집계 및 업데이트

## 분석 서비스

### AnalysisService (도메인 서비스)

**책임**: 사용자 성능 데이터 집계 및 분석

**주요 메서드**:

```python
class AnalysisService:
    def aggregate_user_performance(
        self, 
        user_id: int, 
        period_days: int = 30
    ) -> UserPerformance:
        """사용자 성능 데이터 집계"""
        
    def identify_weaknesses(
        self, 
        user_id: int
    ) -> Dict[str, Any]:
        """약점 식별 (ChatGPT 분석용 데이터 준비)"""
        
    def generate_learning_recommendations(
        self, 
        user_id: int
    ) -> Dict[str, Any]:
        """학습 추천 생성 (ChatGPT 분석용 데이터 준비)"""
        
    def calculate_type_performance(
        self, 
        user_id: int, 
        period_days: int
    ) -> Dict[QuestionType, Dict[str, float]]:
        """유형별 성취도 계산"""
        
    def calculate_difficulty_performance(
        self, 
        user_id: int, 
        period_days: int
    ) -> Dict[int, Dict[str, float]]:
        """난이도별 성취도 계산"""
        
    def find_repeated_mistakes(
        self, 
        user_id: int, 
        period_days: int
    ) -> List[int]:
        """반복 오답 문제 식별"""
```

### ChatGPTAnalysisAdapter (인프라스트럭처)

**책임**: ChatGPT API 연동 (향후 구현)

**주요 메서드**:

```python
class ChatGPTAnalysisAdapter:
    def analyze_weaknesses(
        self, 
        performance_data: Dict[str, Any]
    ) -> str:
        """약점 분석 (향후 ChatGPT API 호출)"""
        # 현재는 데이터만 준비
        pass
        
    def generate_recommendations(
        self, 
        performance_data: Dict[str, Any]
    ) -> str:
        """학습 추천 생성 (향후 ChatGPT API 호출)"""
        # 현재는 데이터만 준비
        pass
```

## 배치 분석 작업

### BatchAnalysisJob

**목적**: 주기적으로 사용자 성능 데이터를 집계하고 분석

**작업 유형**:

1. **일일 분석**
   - 전날 학습 데이터 집계
   - 일일 학습 리포트 생성
   - 학습 습관 분석

2. **주간 분석**
   - 주간 성능 추이 분석
   - 약점 영역 식별
   - ChatGPT 분석 데이터 준비 (향후)

**스케줄링**:
- APScheduler 또는 cron 사용
- 일일 분석: 매일 새벽 2시
- 주간 분석: 매주 월요일 새벽 3시

## 데이터베이스 스키마

### answer_details 테이블

```sql
CREATE TABLE answer_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    question_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES results(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX idx_answer_details_result_id ON answer_details(result_id);
CREATE INDEX idx_answer_details_user_id ON answer_details(user_id);
CREATE INDEX idx_answer_details_question_type ON answer_details(question_type);
```

### learning_history 테이블

```sql
CREATE TABLE learning_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    result_id INTEGER NOT NULL,
    study_date DATE NOT NULL,
    study_hour INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    time_spent_minutes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(id),
    FOREIGN KEY (result_id) REFERENCES results(id)
);

CREATE INDEX idx_learning_history_user_id ON learning_history(user_id);
CREATE INDEX idx_learning_history_study_date ON learning_history(study_date);
```

### user_performance 테이블

```sql
CREATE TABLE user_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    type_performance TEXT, -- JSON
    difficulty_performance TEXT, -- JSON
    level_progression TEXT, -- JSON
    repeated_mistakes TEXT, -- JSON 배열
    weaknesses TEXT, -- JSON (ChatGPT 분석용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_performance_user_id ON user_performance(user_id);
CREATE INDEX idx_user_performance_period ON user_performance(analysis_period_start, analysis_period_end);
```

## API 엔드포인트

### 성능 분석 API

```
GET    /api/users/{user_id}/performance
       # 사용자 성능 분석 데이터 조회
       Query Parameters:
       - period_days: 분석 기간 (기본값: 30)

GET    /api/users/{user_id}/history
       # 사용자 학습 이력 조회
       Query Parameters:
       - start_date: 시작 날짜
       - end_date: 종료 날짜
       - limit: 조회 개수

GET    /api/results/{result_id}/details
       # 결과별 상세 답안 이력 조회

GET    /api/users/{user_id}/weaknesses
       # 사용자 약점 분석 (ChatGPT 분석용 데이터)
```

## 구현 계획

### Phase 1: 데이터 수집 엔티티 및 Repository
1. AnswerDetail 엔티티 생성
2. LearningHistory 엔티티 생성
3. UserPerformance 엔티티 생성
4. 각 Repository 및 Mapper 구현
5. 데이터베이스 테이블 생성

### Phase 2: 데이터 수집 로직
1. 테스트 제출 시 AnswerDetail 저장
2. 테스트 제출 시 LearningHistory 저장
3. UserPerformance 집계 로직 구현

### Phase 3: 분석 서비스
1. AnalysisService 구현
2. ChatGPTAnalysisAdapter 인터페이스 생성
3. 배치 분석 작업 구현

### Phase 4: ChatGPT API 연동 (향후)
1. ChatGPT API 클라이언트 구현
2. 프롬프트 엔지니어링
3. 분석 결과 저장 및 제공

## 보안 및 개인정보 보호

- 사용자별 데이터 접근 권한 검증
- 개인정보 암호화 저장 (필요 시)
- 데이터 보관 기간 정책 수립
- GDPR 준수 (향후)

## 성능 고려사항

- 대량 데이터 집계 시 인덱스 활용
- 배치 작업은 비피크 시간대 실행
- 캐싱 전략 고려 (자주 조회되는 성능 데이터)
- 데이터 아카이빙 전략 (오래된 데이터는 별도 저장)

