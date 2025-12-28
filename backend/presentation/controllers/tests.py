"""
JLPT 시험 관리 API 컨트롤러
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
from pydantic import Field
from datetime import datetime

from backend.domain.entities.test import Test
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, TestStatus, QuestionType
from backend.infrastructure.repositories.test_repository import SqliteTestRepository
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
from backend.infrastructure.config.database import get_database
from backend.presentation.controllers.auth import get_current_user

router = APIRouter()

# Pydantic 요청/응답 모델
class TestCreateRequest(BaseModel):
    title: str
    level: JLPTLevel
    question_count: int = 20
    time_limit_minutes: int = 60
    question_types: Optional[List[QuestionType]] = None  # None이면 모든 유형, 지정하면 해당 유형만
    question_type_counts: Optional[Dict[str, int]] = None  # 유형별 문제 수 지정 (예: {"vocabulary": 10, "grammar": 5})

class TestStartRequest(BaseModel):
    pass  # user_id는 세션에서 가져옴

class TestSubmitRequest(BaseModel):
    answers: Dict[int, str]  # question_id -> answer

class QuestionResponse(BaseModel):
    id: int
    level: str
    question_type: str
    question_text: str
    choices: List[str]
    difficulty: int

class TestResponse(BaseModel):
    id: int
    title: str
    level: str
    status: str
    time_limit_minutes: int
    questions: List[QuestionResponse]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class TestListResponse(BaseModel):
    id: int
    title: str
    level: str
    status: str
    time_limit_minutes: int
    question_count: int

# 의존성 주입 함수
def get_test_repository() -> SqliteTestRepository:
    """테스트 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteTestRepository(db)

def get_question_repository() -> SqliteQuestionRepository:
    """문제 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteQuestionRepository(db)

@router.get("/", response_model=List[TestListResponse])
async def get_tests(level: Optional[JLPTLevel] = None):
    """시험 목록 조회"""
    repo = get_test_repository()

    if level:
        tests = repo.find_by_level(level)
    else:
        tests = repo.find_all()

    return [
        TestListResponse(
            id=test.id,
            title=test.title,
            level=test.level.value,
            status=test.status.value,
            time_limit_minutes=test.time_limit_minutes,
            question_count=len(test.questions)
        )
        for test in tests
    ]

@router.get("/{test_id}", response_model=TestResponse)
async def get_test(test_id: int):
    """특정 시험 정보 조회"""
    repo = get_test_repository()
    test = repo.find_by_id(test_id)

    if not test:
        raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다")

    return TestResponse(
        id=test.id,
        title=test.title,
        level=test.level.value,
        status=test.status.value,
        time_limit_minutes=test.time_limit_minutes,
        questions=[
            QuestionResponse(
                id=q.id,
                level=q.level.value,
                question_type=q.question_type.value,
                question_text=q.question_text,
                choices=q.choices,
                difficulty=q.difficulty
            )
            for q in test.questions
        ],
        started_at=test.started_at,
        completed_at=test.completed_at
    )

@router.post("/diagnostic/n5", response_model=TestResponse)
async def create_n5_diagnostic_test():
    """N5 진단 테스트 생성 (전용 엔드포인트)
    
    기본 설정으로 N5 진단 테스트를 자동 생성합니다:
    - 레벨: N5
    - 문제 수: 20개
    - 시간 제한: 30분
    - 모든 문제 유형 포함
    """
    question_repo = get_question_repository()
    test_repo = get_test_repository()

    # N5 레벨의 모든 유형 문제 조회
    questions = question_repo.find_random_by_level(JLPTLevel.N5, limit=20)

    if len(questions) < 20:
        raise HTTPException(
            status_code=400,
            detail=f"N5 진단 테스트를 생성하기에 충분한 문제가 없습니다. (사용 가능: {len(questions)}개, 필요: 20개)"
        )

    # N5 진단 테스트 생성
    test = Test(
        id=0,
        title="N5 진단 테스트",
        level=JLPTLevel.N5,
        questions=questions,
        time_limit_minutes=30
    )

    saved_test = test_repo.save(test)

    return TestResponse(
        id=saved_test.id,
        title=saved_test.title,
        level=saved_test.level.value,
        status=saved_test.status.value,
        time_limit_minutes=saved_test.time_limit_minutes,
        questions=[
            QuestionResponse(
                id=q.id,
                level=q.level.value,
                question_type=q.question_type.value,
                question_text=q.question_text,
                choices=q.choices,
                difficulty=q.difficulty
            )
            for q in saved_test.questions
        ],
        started_at=saved_test.started_at,
        completed_at=saved_test.completed_at
    )

@router.post("/", response_model=TestResponse)
async def create_test(request: TestCreateRequest):
    """새 시험 생성"""
    question_repo = get_question_repository()
    test_repo = get_test_repository()

    # 유형별 문제 수가 지정된 경우
    if request.question_type_counts:
        # 문자열 키를 QuestionType enum으로 변환
        type_counts = {}
        for type_str, count in request.question_type_counts.items():
            try:
                question_type = QuestionType(type_str)
                type_counts[question_type] = count
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"잘못된 문제 유형: {type_str}. 유효한 유형: {[qt.value for qt in QuestionType]}"
                )
        
        try:
            questions = question_repo.find_random_by_level_and_type_counts(
                request.level, type_counts
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    # 유형 필터링이 지정된 경우 해당 유형들만 조회
    elif request.question_types:
        questions = question_repo.find_random_by_level_and_types(
            request.level, request.question_types, limit=request.question_count
        )
        if len(questions) < request.question_count:
            available_types = ", ".join([qt.value for qt in request.question_types])
            raise HTTPException(
                status_code=400,
                detail=f"요청한 문제 수({request.question_count})보다 적은 문제({len(questions)})만 사용 가능합니다. (레벨: {request.level.value}, 유형: {available_types})"
            )
    # 모든 유형 조회
    else:
        questions = question_repo.find_random_by_level(request.level, limit=request.question_count)
        if len(questions) < request.question_count:
            raise HTTPException(
                status_code=400,
                detail=f"요청한 문제 수({request.question_count})보다 적은 문제({len(questions)})만 사용 가능합니다. (레벨: {request.level.value}, 유형: 모든 유형)"
            )

    # 테스트 생성
    test = Test(
        id=0,
        title=request.title,
        level=request.level,
        questions=questions,
        time_limit_minutes=request.time_limit_minutes
    )

    saved_test = test_repo.save(test)

    return TestResponse(
        id=saved_test.id,
        title=saved_test.title,
        level=saved_test.level.value,
        status=saved_test.status.value,
        time_limit_minutes=saved_test.time_limit_minutes,
        questions=[
            QuestionResponse(
                id=q.id,
                level=q.level.value,
                question_type=q.question_type.value,
                question_text=q.question_text,
                choices=q.choices,
                difficulty=q.difficulty
            )
            for q in saved_test.questions
        ],
        started_at=saved_test.started_at,
        completed_at=saved_test.completed_at
    )

@router.post("/{test_id}/start", response_model=TestResponse)
async def start_test(
    test_id: int,
    request: TestStartRequest,
    current_user: User = Depends(get_current_user)
):
    """시험 시작"""
    repo = get_test_repository()
    test = repo.find_by_id(test_id)

    if not test:
        raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다")

    try:
        test.start_test()
        saved_test = repo.save(test)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return TestResponse(
        id=saved_test.id,
        title=saved_test.title,
        level=saved_test.level.value,
        status=saved_test.status.value,
        time_limit_minutes=saved_test.time_limit_minutes,
        questions=[
            QuestionResponse(
                id=q.id,
                level=q.level.value,
                question_type=q.question_type.value,
                question_text=q.question_text,
                choices=q.choices,
                difficulty=q.difficulty
            )
            for q in saved_test.questions
        ],
        started_at=saved_test.started_at,
        completed_at=saved_test.completed_at
    )

@router.post("/{test_id}/submit")
async def submit_test(
    test_id: int,
    request: TestSubmitRequest,
    current_user: User = Depends(get_current_user)
):
    """시험 제출"""
    from backend.infrastructure.repositories.result_repository import SqliteResultRepository
    from backend.domain.entities.result import Result
    from backend.infrastructure.repositories.user_repository import SqliteUserRepository

    db = get_database()
    test_repo = get_test_repository()
    result_repo = SqliteResultRepository(db=db)
    user_repo = SqliteUserRepository(db=db)

    test = test_repo.find_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다")

    user = current_user

    try:
        # 테스트 완료 처리
        test.complete_test(request.answers)
        saved_test = test_repo.save(test)

        # 결과 분석 및 저장
        score = saved_test.score
        assessed_level = test.level  # 간단히 테스트 레벨을 평가 레벨로 사용
        
        # 점수 기반 레벨 추천
        from backend.domain.services.level_recommendation_service import LevelRecommendationService
        recommendation_service = LevelRecommendationService()
        recommended_level = recommendation_service.recommend_level(test.level, score)

        # 문제 유형별 분석
        question_type_analysis = {}
        for question in test.questions:
            q_type = question.question_type.value
            if q_type not in question_type_analysis:
                question_type_analysis[q_type] = {"correct": 0, "total": 0}
            
            question_type_analysis[q_type]["total"] += 1
            user_answer = request.answers.get(question.id)
            if user_answer and question.is_correct_answer(user_answer):
                question_type_analysis[q_type]["correct"] += 1

        # 소요 시간 계산
        if test.started_at and test.completed_at:
            time_taken_seconds = (test.completed_at - test.started_at).total_seconds()
            time_taken = max(1, int(time_taken_seconds / 60))  # 최소 1분
        else:
            time_taken = test.time_limit_minutes

        # Result 생성 및 저장
        result = Result(
            id=0,
            test_id=test.id,
            user_id=current_user.id,
            score=score,
            assessed_level=assessed_level,
            recommended_level=recommended_level,
            correct_answers_count=saved_test.get_correct_answers_count(),
            total_questions_count=len(test.questions),
            time_taken_minutes=time_taken,
            question_type_analysis=question_type_analysis
        )

        saved_result = result_repo.save(result)

        # 학습 데이터 자동 수집
        from backend.infrastructure.repositories.answer_detail_repository import SqliteAnswerDetailRepository
        from backend.infrastructure.repositories.learning_history_repository import SqliteLearningHistoryRepository
        from backend.infrastructure.repositories.user_performance_repository import SqliteUserPerformanceRepository
        from backend.domain.entities.answer_detail import AnswerDetail
        from backend.domain.entities.learning_history import LearningHistory
        from backend.domain.entities.user_performance import UserPerformance
        from datetime import date, timedelta

        answer_detail_repo = SqliteAnswerDetailRepository(db=db)
        learning_history_repo = SqliteLearningHistoryRepository(db=db)
        user_performance_repo = SqliteUserPerformanceRepository(db=db)

        # 1. AnswerDetail 자동 생성 (각 문제별로)
        total_questions = len(test.questions)
        time_taken_seconds_total = time_taken * 60  # 분을 초로 변환
        avg_time_per_question = max(1, int(time_taken_seconds_total / total_questions)) if total_questions > 0 else 1

        for question in test.questions:
            user_answer = request.answers.get(question.id, "")
            is_correct = question.is_correct_answer(user_answer) if user_answer else False

            answer_detail = AnswerDetail(
                id=None,
                result_id=saved_result.id,
                question_id=question.id,
                user_answer=user_answer,
                correct_answer=question.correct_answer,
                is_correct=is_correct,
                time_spent_seconds=avg_time_per_question,
                difficulty=question.difficulty,
                question_type=question.question_type
            )
            answer_detail_repo.save(answer_detail)

        # 2. LearningHistory 자동 기록
        study_date = date.today()
        study_hour = datetime.now().hour
        correct_count = saved_test.get_correct_answers_count()

        learning_history = LearningHistory(
            id=None,
            user_id=current_user.id,
            test_id=test.id,
            result_id=saved_result.id,
            study_date=study_date,
            study_hour=study_hour,
            total_questions=total_questions,
            correct_count=correct_count,
            time_spent_minutes=time_taken
        )
        learning_history_repo.save(learning_history)

        # 3. UserPerformance 업데이트 (현재 날짜 기준 최근 30일 기간)
        period_end = date.today()
        period_start = period_end - timedelta(days=30)

        # 기존 UserPerformance 조회 (해당 기간에 포함되는 것)
        existing_performances = user_performance_repo.find_by_user_id(current_user.id)
        current_performance = None
        for perf in existing_performances:
            if perf.analysis_period_start <= period_end and perf.analysis_period_end >= period_start:
                current_performance = perf
                break

        if current_performance is None:
            # 새 UserPerformance 생성
            current_performance = UserPerformance(
                id=None,
                user_id=current_user.id,
                analysis_period_start=period_start,
                analysis_period_end=period_end,
                type_performance={},
                difficulty_performance={},
                level_progression={},
                repeated_mistakes=[],
                weaknesses={}
            )

        # 기간 내의 모든 AnswerDetail 조회 (정확한 분석을 위해)
        period_answer_details = answer_detail_repo.find_by_user_id_and_period(
            current_user.id, period_start, period_end
        )

        # UserPerformanceAnalysisService를 사용하여 성능 분석
        from backend.domain.services.user_performance_analysis_service import UserPerformanceAnalysisService
        analysis_service = UserPerformanceAnalysisService()

        # 유형별 성취도 집계
        type_performance = analysis_service.analyze_type_performance(period_answer_details)

        # 난이도별 성취도 집계
        difficulty_performance = analysis_service.analyze_difficulty_performance(period_answer_details)

        # 반복 오답 문제 식별
        repeated_mistakes = analysis_service.identify_repeated_mistakes(period_answer_details, threshold=2)

        # 약점 영역 분석
        weaknesses_data = analysis_service.identify_weaknesses(period_answer_details, accuracy_threshold=60.0)

        # 레벨별 성취도 추이 업데이트
        if current_performance.level_progression is None:
            current_performance.level_progression = {}
        
        level_key = test.level.value
        if level_key not in current_performance.level_progression:
            current_performance.level_progression[level_key] = []
        current_performance.level_progression[level_key].append({
            "date": study_date.isoformat(),
            "score": score
        })

        # UserPerformance 저장
        current_performance.update_performance_data(
            type_performance=type_performance,
            difficulty_performance=difficulty_performance,
            level_progression=current_performance.level_progression,
            repeated_mistakes=repeated_mistakes,
            weaknesses=weaknesses_data
        )
        user_performance_repo.save(current_performance)

        # 사용자 통계 업데이트
        user.total_tests_taken += 1
        user_repo.save(user)

        return {
            "success": True,
            "data": {
                "test_id": saved_test.id,
                "result_id": saved_result.id,
                "score": score,
                "correct_answers": saved_test.get_correct_answers_count(),
                "total_questions": len(test.questions),
                "time_taken_minutes": time_taken,
                "assessed_level": assessed_level.value,
                "recommended_level": recommended_level.value,
                "question_type_analysis": question_type_analysis,
                "performance_level": saved_result.get_performance_level(),
                "is_passed": saved_result.is_passed(),
                "feedback": saved_result.get_detailed_feedback()
            },
            "message": "시험이 성공적으로 제출되었습니다"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
