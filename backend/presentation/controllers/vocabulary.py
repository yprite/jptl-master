"""
단어 학습 API 컨트롤러
단어장 및 플래시카드 기능 제공
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel, MemorizationStatus
from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
from backend.infrastructure.repositories.user_vocabulary_repository import SqliteUserVocabularyRepository
from backend.infrastructure.config.database import get_database
from backend.presentation.controllers.auth import get_current_user

router = APIRouter()

# Pydantic 요청/응답 모델
class VocabularyResponse(BaseModel):
    id: int
    word: str
    reading: str
    meaning: str
    level: str
    memorization_status: str
    example_sentence: Optional[str] = None

class VocabularyCreateRequest(BaseModel):
    word: str
    reading: str
    meaning: str
    level: JLPTLevel
    example_sentence: Optional[str] = None

class VocabularyUpdateRequest(BaseModel):
    word: Optional[str] = None
    reading: Optional[str] = None
    meaning: Optional[str] = None
    level: Optional[JLPTLevel] = None
    example_sentence: Optional[str] = None

class VocabularyStudyRequest(BaseModel):
    memorization_status: MemorizationStatus

# 의존성 주입 함수
def get_vocabulary_repository() -> SqliteVocabularyRepository:
    """단어 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteVocabularyRepository(db)

def get_user_vocabulary_repository() -> SqliteUserVocabularyRepository:
    """사용자별 단어 학습 상태 리포지토리 의존성 주입"""
    db = get_database()
    return SqliteUserVocabularyRepository(db)

@router.get("/", response_model=List[VocabularyResponse])
async def get_vocabularies(
    level: Optional[JLPTLevel] = Query(None, description="JLPT 레벨 필터"),
    status: Optional[str] = Query(None, description="암기 상태 필터"),
    search: Optional[str] = Query(None, description="단어 또는 의미 검색"),
    current_user: User = Depends(get_current_user)
):
    """단어 목록 조회 (사용자별 상태 포함)
    
    Args:
        level: JLPT 레벨 필터 (선택적)
        status: 암기 상태 필터 (선택적) - 현재 사용자의 상태 기준
        search: 단어 또는 의미 검색 (선택적)
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        단어 목록 (현재 사용자의 학습 상태 포함)
    """
    vocab_repo = get_vocabulary_repository()
    user_vocab_repo = get_user_vocabulary_repository()
    
    # 단어 목록 조회
    if search:
        # 검색 기능
        by_word = vocab_repo.search_by_word(search)
        by_meaning = vocab_repo.search_by_meaning(search)
        # 중복 제거 (ID 기준)
        vocabularies = {v.id: v for v in by_word + by_meaning}.values()
        vocabularies = list(vocabularies)
    elif level:
        vocabularies = vocab_repo.find_by_level(level)
    else:
        vocabularies = vocab_repo.find_all()
    
    # 상태 필터 적용 (사용자별 상태 기준)
    if status:
        user_vocabs = user_vocab_repo.find_by_user_and_status(
            current_user.id, MemorizationStatus(status)
        )
        vocab_ids_with_status = {uv.vocabulary_id for uv in user_vocabs}
        vocabularies = [v for v in vocabularies if v.id in vocab_ids_with_status]
    
    # 사용자별 상태 조회
    user_vocabs_dict = {
        uv.vocabulary_id: uv.memorization_status
        for uv in user_vocab_repo.find_by_user_id(current_user.id)
    }
    
    return [
        VocabularyResponse(
            id=v.id,
            word=v.word,
            reading=v.reading,
            meaning=v.meaning,
            level=v.level.value,
            memorization_status=user_vocabs_dict.get(v.id, MemorizationStatus.NOT_MEMORIZED).value,
            example_sentence=v.example_sentence
        )
        for v in vocabularies
    ]

@router.get("/{vocabulary_id}", response_model=VocabularyResponse)
async def get_vocabulary(
    vocabulary_id: int,
    current_user: User = Depends(get_current_user)
):
    """특정 단어 조회 (사용자별 상태 포함)
    
    Args:
        vocabulary_id: 단어 ID
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        단어 정보 (현재 사용자의 학습 상태 포함)
    """
    vocab_repo = get_vocabulary_repository()
    user_vocab_repo = get_user_vocabulary_repository()
    
    vocabulary = vocab_repo.find_by_id(vocabulary_id)
    
    if not vocabulary:
        raise HTTPException(status_code=404, detail="단어를 찾을 수 없습니다")
    
    # 사용자별 상태 조회
    user_vocab = user_vocab_repo.find_by_user_and_vocabulary(
        current_user.id, vocabulary_id
    )
    status = user_vocab.memorization_status if user_vocab else MemorizationStatus.NOT_MEMORIZED
    
    return VocabularyResponse(
        id=vocabulary.id,
        word=vocabulary.word,
        reading=vocabulary.reading,
        meaning=vocabulary.meaning,
        level=vocabulary.level.value,
        memorization_status=status.value,
        example_sentence=vocabulary.example_sentence
    )

@router.post("/", response_model=VocabularyResponse)
async def create_vocabulary(
    request: VocabularyCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """단어 생성
    
    Args:
        request: 단어 생성 요청
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        생성된 단어 정보
    """
    from backend.domain.entities.vocabulary import Vocabulary
    
    repo = get_vocabulary_repository()
    
    vocabulary = Vocabulary(
        id=0,
        word=request.word,
        reading=request.reading,
        meaning=request.meaning,
        level=request.level,
        example_sentence=request.example_sentence
    )
    
    saved_vocabulary = repo.save(vocabulary)
    
    return VocabularyResponse(
        id=saved_vocabulary.id,
        word=saved_vocabulary.word,
        reading=saved_vocabulary.reading,
        meaning=saved_vocabulary.meaning,
        level=saved_vocabulary.level.value,
        memorization_status=MemorizationStatus.NOT_MEMORIZED.value,
        example_sentence=saved_vocabulary.example_sentence
    )

@router.put("/{vocabulary_id}", response_model=VocabularyResponse)
async def update_vocabulary(
    vocabulary_id: int,
    request: VocabularyUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """단어 수정
    
    Args:
        vocabulary_id: 단어 ID
        request: 단어 수정 요청
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        수정된 단어 정보
    """
    repo = get_vocabulary_repository()
    vocabulary = repo.find_by_id(vocabulary_id)
    
    if not vocabulary:
        raise HTTPException(status_code=404, detail="단어를 찾을 수 없습니다")
    
    # 수정할 필드만 업데이트
    if request.word is not None:
        vocabulary.word = request.word
    if request.reading is not None:
        vocabulary.reading = request.reading
    if request.meaning is not None:
        vocabulary.meaning = request.meaning
    if request.level is not None:
        vocabulary.level = request.level
    if request.example_sentence is not None:
        vocabulary.example_sentence = request.example_sentence
    
    updated_vocabulary = repo.save(vocabulary)
    
    # 사용자별 상태 조회
    user_vocab_repo = get_user_vocabulary_repository()
    user_vocab = user_vocab_repo.find_by_user_and_vocabulary(
        current_user.id, vocabulary_id
    )
    status = user_vocab.memorization_status if user_vocab else MemorizationStatus.NOT_MEMORIZED
    
    return VocabularyResponse(
        id=updated_vocabulary.id,
        word=updated_vocabulary.word,
        reading=updated_vocabulary.reading,
        meaning=updated_vocabulary.meaning,
        level=updated_vocabulary.level.value,
        memorization_status=status.value,
        example_sentence=updated_vocabulary.example_sentence
    )

@router.delete("/{vocabulary_id}")
async def delete_vocabulary(
    vocabulary_id: int,
    current_user: User = Depends(get_current_user)
):
    """단어 삭제
    
    Args:
        vocabulary_id: 단어 ID
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        삭제 성공 메시지
    """
    repo = get_vocabulary_repository()
    vocabulary = repo.find_by_id(vocabulary_id)
    
    if not vocabulary:
        raise HTTPException(status_code=404, detail="단어를 찾을 수 없습니다")
    
    repo.delete(vocabulary)
    
    return {"success": True, "message": "단어가 삭제되었습니다"}

@router.post("/{vocabulary_id}/study", response_model=VocabularyResponse)
async def study_vocabulary(
    vocabulary_id: int,
    request: VocabularyStudyRequest,
    current_user: User = Depends(get_current_user)
):
    """단어 학습 (사용자별 암기 상태 업데이트)
    
    Args:
        vocabulary_id: 단어 ID
        request: 학습 요청 (암기 상태)
        current_user: 현재 로그인한 사용자 (인증 필수)
    
    Returns:
        업데이트된 단어 정보 (사용자별 상태 포함)
    """
    vocab_repo = get_vocabulary_repository()
    user_vocab_repo = get_user_vocabulary_repository()
    
    vocabulary = vocab_repo.find_by_id(vocabulary_id)
    
    if not vocabulary:
        raise HTTPException(status_code=404, detail="단어를 찾을 수 없습니다")
    
    # 사용자별 상태 업데이트
    user_vocab_repo.upsert(
        current_user.id, vocabulary_id, request.memorization_status
    )
    
    return VocabularyResponse(
        id=vocabulary.id,
        word=vocabulary.word,
        reading=vocabulary.reading,
        meaning=vocabulary.meaning,
        level=vocabulary.level.value,
        memorization_status=request.memorization_status.value,
        example_sentence=vocabulary.example_sentence
    )

