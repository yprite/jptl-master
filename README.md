# JLPT 자격 검증 프로그램

JLPT Skill Assessment Platform - 일본어 학습자를 위한 JLPT 자격 검증 및 실력 향상 지원 플랫폼

## 📋 프로젝트 개요

JLPT 자격 검증 프로그램은 일본어 학습자가 자신의 실력을 평가하고 향상시킬 수 있도록 도와주는 웹 기반 플랫폼입니다. N1부터 N5까지의 모든 레벨에 대한 진단 테스트, 문제 유형별 분석, 학습 추천 기능을 제공합니다.

### 주요 기능

- **사용자 관리**: 학습자 등록, 프로필 관리, 목표 레벨 설정
- **JLPT 진단 테스트**: 레벨별(N1~N5) 진단 테스트 및 문제 유형별 평가
- **결과 분석**: 상세한 성취도 분석, 강점/약점 파악, 개선 방향 제시
- **학습 추적**: 학습 이력 추적 및 성능 데이터 집계
- **웹 UI**: React 기반 사용자 친화적 인터페이스

## 🏗️ 기술 스택

### 백엔드
- **프레임워크**: FastAPI
- **데이터베이스**: SQLite
- **아키텍처**: DDD (Domain-Driven Design) 기반 클린 아키텍처
- **언어**: Python 3.13+

### 프론트엔드
- **프레임워크**: React 19
- **언어**: TypeScript
- **스타일링**: CSS Modules

### 개발 도구
- **테스트**: pytest, React Testing Library
- **코드 품질**: pytest-cov (커버리지 측정)
- **버전 관리**: Git

## 🚀 시작하기

### 사전 요구사항

- Python 3.13 이상
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

#### 백엔드 설정

```bash
# 가상 환경 생성 및 활성화
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 초기화
python -m backend.infrastructure.config.database

# 서버 실행
uvicorn backend.main:app --reload
```

백엔드 API는 `http://localhost:8000`에서 실행됩니다.

#### 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

#### 샘플 데이터 준비

N5 레벨 샘플 문제를 데이터베이스에 추가하려면:

```bash
# 가상 환경 활성화 후
python scripts/seed_n5_questions.py
```

또는 Python 모듈로 직접 실행:

```bash
python -m scripts.seed_n5_questions
```

#### Docker를 사용한 실행 (권장)

```bash
# 프로덕션 환경 실행
docker-compose up -d

# 개발 환경 실행 (핫 리로드 지원)
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose logs -f

# 컨테이너 중지
docker-compose down
```

Docker를 사용하면 백엔드와 프론트엔드가 자동으로 설정되고 실행됩니다.

## 🧪 테스트

### 백엔드 테스트

```bash
# 모든 테스트 실행
./run_tests.sh

# 또는 직접 실행
pytest tests/ --cov=backend --cov-report=html
```

**커버리지 요구사항**: 백엔드 최소 80% (현재 94% 달성)

### 프론트엔드 테스트

```bash
cd frontend
npm test -- --coverage
```

**커버리지 요구사항**: 프론트엔드 최소 70% (현재 80.3% 달성)

## 📁 프로젝트 구조

```
.
├── backend/                 # 백엔드 애플리케이션
│   ├── domain/             # 도메인 레이어 (엔티티, 값 객체)
│   ├── application/        # 애플리케이션 레이어 (유스 케이스)
│   ├── infrastructure/     # 인프라 레이어 (리포지토리, DB)
│   ├── presentation/       # 프레젠테이션 레이어 (API 컨트롤러)
│   └── main.py            # FastAPI 애플리케이션 진입점
├── frontend/               # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── App.tsx        # 메인 앱 컴포넌트
│   └── package.json
├── tests/                  # 테스트 코드
├── docs/                   # 프로젝트 문서
│   ├── architecture/      # 아키텍처 문서
│   ├── api/              # API 문서
│   ├── development/      # 개발 가이드
│   └── task-management/  # 태스크 관리
└── data/                  # 데이터베이스 파일
```

## 📚 문서

자세한 문서는 [docs/](docs/) 디렉토리를 참고하세요:

- [프로젝트 요구사항](docs/requirements.md)
- [아키텍처 개요](docs/architecture/overview.md)
- [개발 환경 설정](docs/development/setup.md)
- [개발 가이드라인](DEVELOPMENT_GUIDELINES.md)
- [태스크 관리](docs/task-management/README.md)

## 🔌 API 엔드포인트

### 사용자 관리
- `POST /api/users` - 사용자 생성
- `GET /api/users/me` - 현재 사용자 조회 (구현 예정)

### 테스트 관리
- `GET /api/tests` - 테스트 목록 조회
- `GET /api/tests/{test_id}` - 테스트 상세 조회
- `POST /api/tests` - 테스트 생성
- `POST /api/tests/{test_id}/start` - 테스트 시작
- `POST /api/tests/{test_id}/submit` - 테스트 제출

### 결과 조회
- `GET /api/results` - 결과 목록 조회
- `GET /api/results/{result_id}` - 결과 상세 조회
- `GET /api/results/users/{user_id}/recent` - 사용자 최근 결과 조회
- `GET /api/results/users/{user_id}/average-score` - 사용자 평균 점수 조회

### 헬스 체크
- `GET /health` - 헬스 체크
- `GET /ready` - 준비 상태 확인

API 문서는 서버 실행 후 `http://localhost:8000/docs`에서 확인할 수 있습니다.

## 🎯 현재 진행 상황

### 완료된 기능
- ✅ 도메인 모델링 (User, Test, Question, Result)
- ✅ TDD 방식 도메인 엔티티 구현
- ✅ SQLite 리포지토리 구현
- ✅ FastAPI REST API 구현
- ✅ 테스트 결과 분석 및 리포트 생성
- ✅ React 기반 프론트엔드 구조 설정
- ✅ 기본 UI 컴포넌트 (Test UI, Result UI)

### 진행 중
- 🔄 세션 인증 구현
- 🔄 API와 프론트엔드 통합

### 계획된 기능
- 📋 기본 테스트 데이터 준비 (N5 문제 샘플)
- 📋 Docker 환경 설정
- 📋 학습 추천 시스템
- 📋 ChatGPT 기반 분석

## 📊 테스트 커버리지

- **백엔드**: 94% (요구사항: 80%)
- **프론트엔드**: 80.3% (요구사항: 70%)

## 🤝 기여하기

이 프로젝트는 TDD(Test-Driven Development)와 DDD(Domain-Driven Design) 원칙을 따릅니다. 기여하기 전에 [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md)를 확인해주세요.

### 개발 규칙
- 모든 코드 변경은 테스트를 먼저 작성 (TDD)
- 커밋은 작고 의미있게 유지 (최대 100라인)
- 모든 커밋 후 즉시 푸시
- 작업 완료 시 PR 생성 필수

## 📝 라이선스

이 프로젝트는 개인 학습 목적으로 개발되었습니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**마지막 업데이트**: 2025-01-03

