"""
Public roadmap endpoints for the rebuilt JLPT Anki service.
"""

from __future__ import annotations

from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.application.services.anki_import_service import AnkiApkgImportService
from backend.application.services.roadmap_service import RoadmapService
from backend.infrastructure.config.database import get_database


router = APIRouter()


class ApkgImportRequest(BaseModel):
    file_path: str = Field(..., description="로컬 APKG 경로")
    overwrite: bool = Field(default=True, description="기존 import 데이터를 덮어쓸지 여부")


class PlanPreviewRequest(BaseModel):
    level: str = Field(..., description="JLPT 레벨 (N5~N1)")
    start_date: date | None = Field(default=None, description="학습 시작일")
    target_days: int = Field(default=100, ge=14, le=180, description="목표 완주 일수")
    daily_new_cards: int | None = Field(default=None, ge=1, le=200, description="하루 신규 카드 수")


class DayPreviewRequest(PlanPreviewRequest):
    day_number: int = Field(..., ge=1, le=180, description="조회할 Day 번호")


def get_import_service() -> AnkiApkgImportService:
    return AnkiApkgImportService(get_database())


def get_roadmap_service() -> RoadmapService:
    return RoadmapService(get_database())


@router.get("/levels")
async def list_levels():
    """레벨별 import 현황과 권장 신규 카드 수 조회."""
    roadmap_service = get_roadmap_service()
    return {
        "success": True,
        "data": roadmap_service.list_levels(),
        "message": "레벨별 학습 현황을 조회했습니다.",
    }


@router.post("/imports/apkg")
async def import_apkg(request: ApkgImportRequest):
    """Anki APKG에서 JLPT 어휘/문법 카드를 import."""
    import_service = get_import_service()
    try:
        summary = import_service.import_package(request.file_path, overwrite=request.overwrite)
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "success": True,
        "data": {
            "import_id": summary.import_id,
            "source_name": summary.source_name,
            "source_path": summary.source_path,
            "item_count": summary.item_count,
            "levels": summary.levels,
        },
        "message": "APKG import가 완료되었습니다.",
    }


@router.post("/plans/preview")
async def preview_plan(request: PlanPreviewRequest):
    """100일 완주 플랜 프리뷰 생성."""
    roadmap_service = get_roadmap_service()
    try:
        plan = roadmap_service.build_plan_preview(
            level=request.level,
            start_date=request.start_date,
            target_days=request.target_days,
            daily_new_cards=request.daily_new_cards,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "success": True,
        "data": plan,
        "message": "100일 플랜 프리뷰를 생성했습니다.",
    }


@router.post("/plans/day")
async def preview_day(request: DayPreviewRequest):
    """특정 Day에 배정될 신규 어휘/문법 카드 조회."""
    roadmap_service = get_roadmap_service()
    try:
        assignment = roadmap_service.build_day_assignment(
            level=request.level,
            day_number=request.day_number,
            start_date=request.start_date,
            target_days=request.target_days,
            daily_new_cards=request.daily_new_cards,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "success": True,
        "data": assignment,
        "message": "Day 배정을 조회했습니다.",
    }
