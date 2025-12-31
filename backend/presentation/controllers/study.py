"""
학습 모드 API 컨트롤러
테스트 모드와 구분되는 학습 모드 기능 제공
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, date
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
from backend.infrastructure.repositories.study_session_repository import SqliteStudySessionRepository
from backend.infrastructure.config.database import get_database
from backend.presentation.controllers.auth import get_current_user
from backend.domain.entities.study_session import StudySession

router = APIRouter()

# Pydantic 요청/응답 모델
class QuestionResponse(BaseModel):
    id: int
    level: str
    question_type: str
    question_text: str
    choices: List[str]
    difficulty: int
    audio_url: Optional[str] = None
    correct_answer: str  # 학습 모드에서는 정답 표시 필요
    explanation: str  # 학습 모드에서는 해설 표시 필요

class StudySubmitRequest(BaseModel):
    answers: Dict[int, str]  # question_id -> answer
    level: Optional[JLPTLevel] = None
    question_types: Optional[List[QuestionType]] = None
    time_spent_minutes: int

# 의존성 주입 함수
def get_question_repository() -> SqliteQuestionRepository:
    """문제 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteQuestionRepository(db)

def get_study_session_repository() -> SqliteStudySessionRepository:
    """학습 세션 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteStudySessionRepository(db)

@router.get("/questions", response_model=List[QuestionResponse])
async def get_study_questions(
    level: JLPTLevel = Query(..., description="JLPT 레벨"),
    question_types: Optional[List[QuestionType]] = Query(None, description="문제 유형 필터 (복수 선택 가능)"),
    question_count: int = Query(20, ge=1, le=100, description="조회할 문제 수"),
    current_user: User = Depends(get_current_user)
):
    """학습 모드용 문제 조회
    
    테스트 모드와 달리 Test 엔티티를 생성하지 않고, 문제만 조회합니다.
    사용자가 선택한 유형과 레벨에 맞는 문제를 반환합니다.
    
    Args:
        level: JLPT 레벨 (N5, N4, N3, N2, N1)
        question_types: 문제 유형 필터 (선택적, 복수 선택 가능)
        question_count: 조회할 문제 수 (기본값: 20, 최대: 100)
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        문제 목록 (QuestionResponse 리스트)
    """
    question_repo = get_question_repository()
    
    # 유형 필터링이 지정된 경우 해당 유형들만 조회
    if question_types:
        questions = question_repo.find_random_by_level_and_types(
            level, question_types, limit=question_count
        )
        if len(questions) < question_count:
            available_types = ", ".join([qt.value for qt in question_types])
            raise HTTPException(
                status_code=400,
                detail=f"요청한 문제 수({question_count})보다 적은 문제({len(questions)})만 사용 가능합니다. (레벨: {level.value}, 유형: {available_types})"
            )
    # 모든 유형 조회
    else:
        questions = question_repo.find_random_by_level(level, limit=question_count)
        if len(questions) < question_count:
            raise HTTPException(
                status_code=400,
                detail=f"요청한 문제 수({question_count})보다 적은 문제({len(questions)})만 사용 가능합니다. (레벨: {level.value}, 유형: 모든 유형)"
            )
    
    return [
        QuestionResponse(
            id=q.id,
            level=q.level.value,
            question_type=q.question_type.value,
            question_text=q.question_text,
            choices=q.choices,
            difficulty=q.difficulty,
            audio_url=q.audio_url,
            correct_answer=q.correct_answer,
            explanation=q.explanation
        )
        for q in questions
    ]

@router.post("/submit")
async def submit_study_session(
    request: StudySubmitRequest,
    current_user: User = Depends(get_current_user)
):
    """학습 모드 세션 제출
    
    학습 모드에서 문제를 풀고 결과를 저장합니다.
    테스트 모드와 달리 Test와 Result를 생성하지 않고 StudySession만 저장합니다.
    
    Args:
        request: 제출 요청 (답안, 레벨, 유형, 소요 시간)
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        학습 세션 결과 (정확도, 정답 수 등)
    """
    question_repo = get_question_repository()
    study_session_repo = get_study_session_repository()
    
    # 답안 검증 및 정답 확인
    total_questions = len(request.answers)
    correct_count = 0
    
    for question_id, user_answer in request.answers.items():
        question = question_repo.find_by_id(question_id)
        if not question:
            raise HTTPException(
                status_code=404,
                detail=f"문제를 찾을 수 없습니다: {question_id}"
            )
        
        if question.is_correct_answer(user_answer):
            correct_count += 1
    
    # StudySession 생성 및 저장
    study_date = date.today()
    study_hour = datetime.now().hour
    
    study_session = StudySession(
        id=None,
        user_id=current_user.id,
        study_date=study_date,
        study_hour=study_hour,
        total_questions=total_questions,
        correct_count=correct_count,
        time_spent_minutes=request.time_spent_minutes,
        level=request.level,
        question_types=request.question_types
    )
    
    saved_session = study_session_repo.save(study_session)
    
    accuracy = study_session.get_accuracy_percentage()
    
    return {
        "success": True,
        "data": {
            "study_session_id": saved_session.id,
            "total_questions": total_questions,
            "correct_count": correct_count,
            "accuracy": accuracy,
            "time_spent_minutes": request.time_spent_minutes,
            "level": request.level.value if request.level else None,
            "question_types": [qt.value for qt in request.question_types] if request.question_types else None
        },
        "message": "학습 세션이 성공적으로 저장되었습니다"
    }

