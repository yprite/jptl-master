# 개발 환경 설정

## 사전 요구사항

- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- Git
- VS Code 또는 Cursor (권장)

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
