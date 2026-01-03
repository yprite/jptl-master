"""
백엔드 전역 예외 핸들러
모든 예외를 일관된 형식으로 처리
"""

import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException

logger = logging.getLogger(__name__)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """요청 검증 에러 핸들러"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "요청 데이터 검증에 실패했습니다",
            "errors": errors
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 예외 핸들러"""
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
    
    # FastAPI 기본 형식과 호환성을 위해 detail 필드 유지
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail) if exc.detail else "요청 처리 중 오류가 발생했습니다"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": detail,
            "success": False,
            "message": detail
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """일반 예외 핸들러 (모든 예외를 처리)"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "서버 내부 오류가 발생했습니다",
            "detail": str(exc) if logger.level == logging.DEBUG else None
        }
    )

