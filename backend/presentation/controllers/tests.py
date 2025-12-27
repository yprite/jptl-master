"""
JLPT 시험 관리 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/")
async def get_tests():
    """시험 목록 조회"""
    raise HTTPException(status_code=404, detail="시험 관리 API가 아직 구현되지 않았습니다")

@router.get("/{test_id}")
async def get_test(test_id: int):
    """특정 시험 정보 조회"""
    raise HTTPException(status_code=404, detail="시험 관리 API가 아직 구현되지 않았습니다")

@router.post("/{test_id}/start")
async def start_test(test_id: int):
    """시험 시작"""
    raise HTTPException(status_code=404, detail="시험 관리 API가 아직 구현되지 않았습니다")

@router.post("/{test_id}/submit")
async def submit_test(test_id: int):
    """시험 제출"""
    raise HTTPException(status_code=404, detail="시험 관리 API가 아직 구현되지 않았습니다")
