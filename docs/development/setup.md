# 개발 환경 설정

## 사전 요구사항

- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- Git
- VS Code 또는 Cursor (권장)

## Git 저장소 설정

### 1. Git 초기화
```bash
# 프로젝트 루트에서 Git 저장소 초기화
git init

# 기본 브랜치 설정 (main)
git checkout -b main

# 개발 브랜치 생성
git checkout -b develop
```

### 2. Git 사용자 정보 설정
```bash
# 사용자 정보 설정 (실제 정보로 변경 필요)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 3. .gitignore 파일 생성
프로젝트 루트에 `.gitignore` 파일을 생성하여 불필요한 파일들을 제외합니다.

### 4. 초기 커밋
```bash
# 모든 파일 추가
git add .

# 초기 커밋
git commit -m "chore: 프로젝트 초기 설정"
```

### 5. 원격 리포지토리 연결
```bash
# GitHub 리포지토리 연결 (실제 URL로 변경)
git remote add origin https://github.com/username/repository.git

# 브랜치 푸시
git push -u origin main
git push -u origin develop
```

### 6. 브랜치 전략 확인
```bash
# 브랜치 상태 확인
git branch -a

# 결과 예시:
# * develop
#   main
#   remotes/origin/develop
#   remotes/origin/main
```

## 프로젝트 클론 및 설정

```bash
# 프로젝트 클론
git clone <repository-url>
cd AI_DRIVEN_DEVELOP

# Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 프론트엔드 의존성 설치
cd frontend
npm install
cd ..
```

## 데이터베이스 설정

```bash
# Docker Compose로 PostgreSQL 실행
docker-compose up -d db

# 데이터베이스 마이그레이션
alembic upgrade head
```

## 개발 서버 실행

```bash
# 백엔드 서버
uvicorn app.main:app --reload

# 프론트엔드 서버 (새 터미널)
cd frontend
npm run dev
```

## 테스트 실행

```bash
# 모든 테스트 실행
pytest

# 특정 테스트만 실행
pytest tests/test_user.py

# 커버리지 확인
pytest --cov=app --cov-report=html
```

## 코드 품질 도구

```bash
# 린팅
flake8 app
black app

# 타입 체크 (선택)
mypy app
```

## IDE 설정

### VS Code/Cursor 권장 확장
- Python
- Pylance
- Python Docstring Generator
- GitLens
- Docker
- Thunder Client (API 테스트용)
