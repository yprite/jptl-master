"""
JLPT 결과 조회 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/")
async def get_results():
    """결과 목록 조회"""
    raise HTTPException(status_code=404, detail="결과 조회 API가 아직 구현되지 않았습니다")

@router.get("/{result_id}")
async def get_result(result_id: int):
    """상세 결과 조회"""
    raise HTTPException(status_code=404, detail="결과 조회 API가 아직 구현되지 않았습니다")
