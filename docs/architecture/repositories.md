# SQLite 기반 리포지토리 설계 및 구현

## 개요

이 문서는 JLPT 자격 검증 프로그램의 **Infrastructure Layer**에서 **Repository Pattern**을 구현하기 위한 상세 설계를 정의합니다.

## 아키텍처 원칙

### Repository Pattern
- **도메인 레이어와 인프라 레이어 분리**: 도메인 객체가 데이터 저장소 구현 세부사항에 의존하지 않음
- **인터페이스 기반 설계**: 각 리포지토리는 인터페이스로 정의되고, 구현은 교체 가능
- **단일 책임**: 각 리포지토리는 하나의 엔티티 타입만 담당

### SQLite 선택 이유
- **경량화**: 별도 설치/설정 불필요
- **파일 기반**: 백업 및 배포 용이
- **ACID 트랜잭션**: 데이터 무결성 보장
- **SQL 표준 지원**: 복잡한 쿼리 가능

## 리포지토리 인터페이스 설계

### Base Repository Interface

```python
from abc import ABC, abstractmethod
from typing import List, Optional, Generic, TypeVar

T = TypeVar('T')
ID = TypeVar('ID')

class Repository(ABC, Generic[T, ID]):
    """기본 리포지토리 인터페이스"""

    @abstractmethod
    def save(self, entity: T) -> T:
        """엔티티 저장/업데이트"""
        pass

    @abstractmethod
    def find_by_id(self, id: ID) -> Optional[T]:
        """ID로 엔티티 조회"""
        pass

    @abstractmethod
    def find_all(self) -> List[T]:
        """모든 엔티티 조회"""
        pass

    @abstractmethod
    def delete(self, entity: T) -> None:
        """엔티티 삭제"""
        pass

    @abstractmethod
    def exists_by_id(self, id: ID) -> bool:
        """ID 존재 여부 확인"""
        pass
```

### User Repository Interface

```python
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel

class UserRepository(Repository[User, int]):
    """사용자 리포지토리 인터페이스"""

    def find_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        pass

    def find_by_username(self, username: str) -> Optional[User]:
        """사용자명으로 사용자 조회"""
        pass

    def exists_by_email(self, email: str) -> bool:
        """이메일 존재 여부 확인"""
        pass

    def exists_by_username(self, username: str) -> bool:
        """사용자명 존재 여부 확인"""
        pass
```

### Question Repository Interface

```python
from typing import List
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

class QuestionRepository(Repository[Question, int]):
    """문제 리포지토리 인터페이스"""

    def find_by_level(self, level: JLPTLevel) -> List[Question]:
        """레벨별 문제 조회"""
        pass

    def find_by_type(self, question_type: QuestionType) -> List[Question]:
        """유형별 문제 조회"""
        pass

    def find_by_level_and_type(self, level: JLPTLevel, question_type: QuestionType) -> List[Question]:
        """레벨과 유형으로 문제 조회"""
        pass

    def find_random_by_level(self, level: JLPTLevel, limit: int = 10) -> List[Question]:
        """레벨별 랜덤 문제 조회"""
        pass
```

### Test Repository Interface

```python
from typing import List
from backend.domain.entities.test import Test
from backend.domain.value_objects.jlpt import JLPTLevel, TestStatus

class TestRepository(Repository[Test, int]):
    """테스트 리포지토리 인터페이스"""

    def find_by_level(self, level: JLPTLevel) -> List[Test]:
        """레벨별 테스트 조회"""
        pass

    def find_by_status(self, status: TestStatus) -> List[Test]:
        """상태별 테스트 조회"""
        pass

    def find_active_tests(self) -> List[Test]:
        """활성 테스트 조회 (IN_PROGRESS 상태)"""
        pass

    def update_status(self, test_id: int, status: TestStatus) -> None:
        """테스트 상태 업데이트"""
        pass
```

### Result Repository Interface

```python
from typing import List
from backend.domain.entities.result import Result

class ResultRepository(Repository[Result, int]):
    """결과 리포지토리 인터페이스"""

    def find_by_user_id(self, user_id: int) -> List[Result]:
        """사용자별 결과 조회"""
        pass

    def find_by_test_id(self, test_id: int) -> List[Result]:
        """테스트별 결과 조회"""
        pass

    def find_recent_by_user(self, user_id: int, limit: int = 10) -> List[Result]:
        """사용자의 최근 결과 조회"""
        pass

    def get_user_average_score(self, user_id: int) -> float:
        """사용자의 평균 점수 계산"""
        pass
```

## SQLite 구현 설계

### 데이터베이스 연결 및 설정

```python
import sqlite3
from contextlib import contextmanager
from typing import Generator
import os

class Database:
    """SQLite 데이터베이스 연결 관리"""

    def __init__(self, db_path: str = "data/jlpt.db"):
        self.db_path = db_path
        self._ensure_directory_exists()
        self._create_tables()

    def _ensure_directory_exists(self):
        """데이터베이스 디렉토리 생성"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """데이터베이스 연결 컨텍스트 매니저"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 컬럼명으로 접근 가능
        try:
            yield conn
        finally:
            conn.close()

    def _create_tables(self):
        """테이블 생성"""
        with self.get_connection() as conn:
            # 사용자 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    target_level TEXT NOT NULL,
                    current_level TEXT,
                    total_tests_taken INTEGER DEFAULT 0,
                    study_streak INTEGER DEFAULT 0,
                    preferred_question_types TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 문제 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    level TEXT NOT NULL,
                    question_type TEXT NOT NULL,
                    question_text TEXT NOT NULL,
                    choices TEXT NOT NULL,
                    correct_answer TEXT NOT NULL,
                    explanation TEXT NOT NULL,
                    difficulty INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 테스트 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    level TEXT NOT NULL,
                    question_ids TEXT NOT NULL,
                    time_limit_minutes INTEGER NOT NULL,
                    status TEXT DEFAULT 'created',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP
                )
            """)

            # 테스트 응시 기록 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS test_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    user_answers TEXT,
                    score REAL,
                    time_taken_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (test_id) REFERENCES tests(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            # 결과 분석 테이블
            conn.execute("""
                CREATE TABLE IF NOT EXISTS results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    attempt_id INTEGER NOT NULL,
                    score REAL NOT NULL,
                    assessed_level TEXT NOT NULL,
                    recommended_level TEXT NOT NULL,
                    correct_answers_count INTEGER NOT NULL,
                    total_questions_count INTEGER NOT NULL,
                    time_taken_minutes INTEGER NOT NULL,
                    performance_level TEXT NOT NULL,
                    feedback TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (test_id) REFERENCES tests(id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id)
                )
            """)

            conn.commit()
```

### 엔티티 매핑 전략

#### 도메인 객체 ↔ 데이터베이스 행 변환

```python
import json
from datetime import datetime
from typing import Dict, Any, List
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType

class UserMapper:
    """User 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> User:
        """데이터베이스 행을 User 엔티티로 변환"""
        preferred_types = None
        if row['preferred_question_types']:
            preferred_types = [QuestionType(t) for t in json.loads(row['preferred_question_types'])]

        return User(
            id=row['id'],
            email=row['email'],
            username=row['username'],
            target_level=JLPTLevel(row['target_level']),
            current_level=JLPTLevel(row['current_level']) if row['current_level'] else None,
            total_tests_taken=row['total_tests_taken'],
            study_streak=row['study_streak'],
            preferred_question_types=preferred_types,
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    @staticmethod
    def to_dict(user: User) -> Dict[str, Any]:
        """User 엔티티를 데이터베이스 행으로 변환"""
        data = {
            'email': user.email,
            'username': user.username,
            'target_level': user.target_level.value,
            'current_level': user.current_level.value if user.current_level else None,
            'total_tests_taken': user.total_tests_taken,
            'study_streak': user.study_streak,
            'preferred_question_types': json.dumps([t.value for t in user.preferred_question_types]) if user.preferred_question_types else None,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat()
        }
        return data
```

## 구현 우선순위

### Phase 1: 기본 CRUD 구현
1. **Database 클래스**: 연결 관리 및 테이블 생성
2. **BaseRepository**: 공통 CRUD 로직
3. **UserRepository 구현**: 사용자 관리 기본 기능
4. **단위 테스트**: 각 리포지토리별 테스트

### Phase 2: 고급 기능 추가
1. **QuestionRepository 구현**: 문제 조회 및 필터링
2. **TestRepository 구현**: 테스트 관리 기능
3. **ResultRepository 구현**: 결과 분석 기능
4. **Query 최적화**: 인덱스 추가 및 쿼리 튜닝

### Phase 3: 데이터 마이그레이션
1. **초기 데이터**: N5 문제 샘플 데이터
2. **데이터 검증**: 무결성 확인 스크립트
3. **백업/복원**: 데이터 관리 유틸리티

## 테스트 전략

### 단위 테스트
```python
import pytest
from backend.infrastructure.repositories.user_repository import SqliteUserRepository

class TestSqliteUserRepository:
    def test_save_and_find_user(self):
        # Given
        repo = SqliteUserRepository()
        user = User(id=1, email="test@example.com", username="testuser")

        # When
        saved_user = repo.save(user)
        found_user = repo.find_by_id(1)

        # Then
        assert saved_user.id is not None
        assert found_user is not None
        assert found_user.email == "test@example.com"
```

### 통합 테스트
- 실제 SQLite 파일을 사용한 전체 플로우 테스트
- 트랜잭션 무결성 검증
- 동시성 테스트 (필요시)

## 성능 고려사항

### 인덱스 최적화
```sql
-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_results_user_id ON results(user_id);
```

### 쿼리 최적화
- N+1 문제 방지
- 적절한 JOIN 사용
- 페이지네이션 구현

## 배포 및 운영

### 데이터베이스 파일 관리
- **위치**: `./data/jlpt.db`
- **백업**: 정기적 파일 복사
- **마이그레이션**: 스키마 변경 시 새 파일 생성

### 환경별 설정
- **개발**: 로컬 SQLite 파일
- **프로덕션**: 동일한 SQLite 파일 (단일 서버 가정)

이 설계에 따라 SQLite 기반 리포지토리를 구현하겠습니다.
