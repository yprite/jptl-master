"""
데이터베이스 설정 및 연결 관리
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# SQLite를 사용한 인메모리 데이터베이스 (개발용)
# 실제 운영에서는 PostgreSQL 등으로 변경
DATABASE_URL = "sqlite+aiosqlite:///./blog.db"

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
    echo=True,  # SQL 쿼리 로깅 (개발용)
)

# 세션 팩토리 생성
async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    """데이터베이스 세션 의존성 주입을 위한 제너레이터"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def create_tables():
    """데이터베이스 테이블 생성"""
    # TODO: SQLAlchemy 메타데이터에서 테이블 생성
    pass

async def drop_tables():
    """데이터베이스 테이블 삭제 (테스트용)"""
    # TODO: SQLAlchemy 메타데이터에서 테이블 삭제
    pass
