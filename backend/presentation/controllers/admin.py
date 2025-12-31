"""
JLPT 어드민 관리 API 컨트롤러
어드민 권한이 있는 사용자만 접근 가능한 관리 기능 제공
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List

from backend.domain.entities.user import User
from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
from backend.infrastructure.repositories.test_repository import SqliteTestRepository
from backend.infrastructure.repositories.result_repository import SqliteResultRepository
from backend.infrastructure.config.database import get_database
from backend.presentation.controllers.auth import get_admin_user

router = APIRouter()

# Pydantic 요청/응답 모델
class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    target_level: JLPTLevel
    current_level: Optional[JLPTLevel]
    total_tests_taken: int
    study_streak: int
    is_admin: bool

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    target_level: Optional[JLPTLevel] = None

class QuestionResponse(BaseModel):
    id: int
    level: str
    question_type: str
    question_text: str
    choices: List[str]
    correct_answer: str
    explanation: str
    difficulty: int

class QuestionCreateRequest(BaseModel):
    level: JLPTLevel
    question_type: QuestionType
    question_text: str
    choices: List[str]
    correct_answer: str
    explanation: str
    difficulty: int

class QuestionUpdateRequest(BaseModel):
    level: Optional[JLPTLevel] = None
    question_type: Optional[QuestionType] = None
    question_text: Optional[str] = None
    choices: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[int] = None

# 의존성 주입 함수
def get_user_repository() -> SqliteUserRepository:
    """사용자 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteUserRepository(db)

def get_question_repository() -> SqliteQuestionRepository:
    """문제 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteQuestionRepository(db)

def get_test_repository() -> SqliteTestRepository:
    """테스트 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteTestRepository(db)

def get_result_repository() -> SqliteResultRepository:
    """결과 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteResultRepository(db)

# ========== 어드민 사용자 관리 API ==========

@router.get("/users")
async def get_admin_users(admin_user: User = Depends(get_admin_user)):
    """어드민 전체 사용자 목록 조회"""
    repo = get_user_repository()
    users = repo.find_all()
    
    return {
        "success": True,
        "data": [
            UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                target_level=user.target_level,
                current_level=user.current_level,
                total_tests_taken=user.total_tests_taken,
                study_streak=user.study_streak,
                is_admin=user.is_admin
            )
            for user in users
        ],
        "message": "사용자 목록 조회 성공"
    }

@router.get("/users/{user_id}")
async def get_admin_user_by_id(
    user_id: int,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 특정 사용자 조회"""
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    return {
        "success": True,
        "data": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            target_level=user.target_level,
            current_level=user.current_level,
            total_tests_taken=user.total_tests_taken,
            study_streak=user.study_streak,
            is_admin=user.is_admin
        ),
        "message": "사용자 정보 조회 성공"
    }

@router.put("/users/{user_id}")
async def update_admin_user(
    user_id: int,
    request: UserUpdateRequest,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 사용자 정보 수정"""
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 업데이트할 필드 적용
    if request.username is not None:
        # 사용자명 중복 확인 (자신 제외)
        if repo.exists_by_username(request.username) and user.username != request.username:
            raise HTTPException(status_code=400, detail="이미 사용중인 사용자명입니다")
        user.username = request.username
    
    if request.target_level is not None:
        user.target_level = request.target_level
    
    # 저장
    updated_user = repo.save(user)
    
    return {
        "success": True,
        "data": UserResponse(
            id=updated_user.id,
            email=updated_user.email,
            username=updated_user.username,
            target_level=updated_user.target_level,
            current_level=updated_user.current_level,
            total_tests_taken=updated_user.total_tests_taken,
            study_streak=updated_user.study_streak,
            is_admin=updated_user.is_admin
        ),
        "message": "사용자 정보가 성공적으로 업데이트되었습니다"
    }

@router.delete("/users/{user_id}")
async def delete_admin_user(
    user_id: int,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 사용자 삭제"""
    repo = get_user_repository()
    user = repo.find_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 사용자 삭제
    repo.delete(user)
    
    return {
        "success": True,
        "message": "사용자가 성공적으로 삭제되었습니다"
    }

# ========== 어드민 문제 관리 API ==========

@router.get("/questions")
async def get_admin_questions(admin_user: User = Depends(get_admin_user)):
    """어드민 전체 문제 목록 조회"""
    repo = get_question_repository()
    questions = repo.find_all()
    
    return {
        "success": True,
        "data": [
            QuestionResponse(
                id=q.id,
                level=q.level.value,
                question_type=q.question_type.value,
                question_text=q.question_text,
                choices=q.choices,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                difficulty=q.difficulty
            )
            for q in questions
        ],
        "message": "문제 목록 조회 성공"
    }

@router.post("/questions")
async def create_admin_question(
    request: QuestionCreateRequest,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 문제 생성"""
    repo = get_question_repository()
    
    # 문제 생성
    question = Question(
        id=0,
        level=request.level,
        question_type=request.question_type,
        question_text=request.question_text,
        choices=request.choices,
        correct_answer=request.correct_answer,
        explanation=request.explanation,
        difficulty=request.difficulty
    )
    
    saved_question = repo.save(question)
    
    return {
        "success": True,
        "data": QuestionResponse(
            id=saved_question.id,
            level=saved_question.level.value,
            question_type=saved_question.question_type.value,
            question_text=saved_question.question_text,
            choices=saved_question.choices,
            correct_answer=saved_question.correct_answer,
            explanation=saved_question.explanation,
            difficulty=saved_question.difficulty
        ),
        "message": "문제가 성공적으로 생성되었습니다"
    }

@router.get("/questions/{question_id}")
async def get_admin_question_by_id(
    question_id: int,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 특정 문제 조회"""
    repo = get_question_repository()
    question = repo.find_by_id(question_id)
    
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
    
    return {
        "success": True,
        "data": QuestionResponse(
            id=question.id,
            level=question.level.value,
            question_type=question.question_type.value,
            question_text=question.question_text,
            choices=question.choices,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            difficulty=question.difficulty
        ),
        "message": "문제 정보 조회 성공"
    }

@router.put("/questions/{question_id}")
async def update_admin_question(
    question_id: int,
    request: QuestionUpdateRequest,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 문제 수정"""
    repo = get_question_repository()
    question = repo.find_by_id(question_id)
    
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
    
    # 업데이트할 필드 적용
    # choices와 correct_answer를 함께 업데이트하는 경우를 고려
    new_choices = request.choices if request.choices is not None else question.choices
    new_correct_answer = request.correct_answer if request.correct_answer is not None else question.correct_answer
    
    # correct_answer가 choices에 포함되는지 확인
    if request.correct_answer is not None or request.choices is not None:
        if new_correct_answer not in new_choices:
            raise HTTPException(status_code=400, detail="정답은 선택지 중 하나여야 합니다")
    
    if request.level is not None:
        question.level = request.level
    
    if request.question_type is not None:
        question.question_type = request.question_type
    
    if request.question_text is not None:
        question.question_text = request.question_text
    
    if request.choices is not None:
        question.choices = request.choices
    
    if request.correct_answer is not None:
        question.correct_answer = request.correct_answer
    
    if request.explanation is not None:
        question.explanation = request.explanation
    
    if request.difficulty is not None:
        question.difficulty = request.difficulty
    
    # Question 엔티티의 유효성 검증을 위해 새 Question 객체 생성
    # (기존 객체의 필드를 직접 수정하면 유효성 검증이 우회될 수 있음)
    try:
        updated_question = Question(
            id=question.id,
            level=question.level,
            question_type=question.question_type,
            question_text=question.question_text,
            choices=question.choices,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            difficulty=question.difficulty
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # 저장
    saved_question = repo.save(updated_question)
    
    return {
        "success": True,
        "data": QuestionResponse(
            id=saved_question.id,
            level=saved_question.level.value,
            question_type=saved_question.question_type.value,
            question_text=saved_question.question_text,
            choices=saved_question.choices,
            correct_answer=saved_question.correct_answer,
            explanation=saved_question.explanation,
            difficulty=saved_question.difficulty
        ),
        "message": "문제가 성공적으로 업데이트되었습니다"
    }

@router.delete("/questions/{question_id}")
async def delete_admin_question(
    question_id: int,
    admin_user: User = Depends(get_admin_user)
):
    """어드민 문제 삭제"""
    repo = get_question_repository()
    question = repo.find_by_id(question_id)
    
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
    
    # 문제 삭제
    repo.delete(question)
    
    return {
        "success": True,
        "message": "문제가 성공적으로 삭제되었습니다"
    }

# ========== 어드민 통계 API ==========

@router.get("/statistics")
async def get_admin_statistics(admin_user: User = Depends(get_admin_user)):
    """어드민 통계 조회"""
    user_repo = get_user_repository()
    question_repo = get_question_repository()
    test_repo = get_test_repository()
    result_repo = get_result_repository()

    # 사용자 통계
    all_users = user_repo.find_all()
    total_users = len(all_users)
    active_users = len([u for u in all_users if u.total_tests_taken > 0])

    # 테스트 통계
    all_tests = test_repo.find_all()
    total_tests = len(all_tests)

    # 결과 통계 (평균 점수)
    all_results = result_repo.find_all()
    total_results = len(all_results)
    if total_results > 0:
        average_score = sum(r.score for r in all_results) / total_results
    else:
        average_score = 0.0

    # 문제 통계
    all_questions = question_repo.find_all()
    total_questions = len(all_questions)
    
    # 레벨별 문제 수
    questions_by_level = {}
    for question in all_questions:
        level = question.level.value
        questions_by_level[level] = questions_by_level.get(level, 0) + 1

    # 학습 데이터 통계
    # AnswerDetail, LearningHistory, UserPerformance는 향후 추가 가능

    return {
        "success": True,
        "data": {
            "users": {
                "total_users": total_users,
                "active_users": active_users
            },
            "tests": {
                "total_tests": total_tests,
                "average_score": round(average_score, 2)
            },
            "questions": {
                "total_questions": total_questions,
                "by_level": questions_by_level
            },
            "learning_data": {
                "total_results": total_results
            }
        },
        "message": "통계 조회 성공"
    }

