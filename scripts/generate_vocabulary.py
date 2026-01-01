#!/usr/bin/env python3
"""
단어 대량 생성 스크립트
JLPT 단어를 대량 생성하여 데이터베이스에 저장합니다.
"""

import sys
import os
import argparse

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.domain.services.vocabulary_generator_service import VocabularyGeneratorService
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
from backend.infrastructure.config.database import get_database


def generate_vocabulary(
    level: str,
    count: int = 10,
    interactive: bool = True
):
    """단어 생성 및 데이터베이스에 저장
    
    Args:
        level: JLPT 레벨 (N1-N5)
        count: 생성할 단어 수
        interactive: True이면 진행 상황을 출력
    """
    try:
        jlpt_level = JLPTLevel(level.upper())
    except ValueError:
        print(f"❌ 잘못된 레벨입니다: {level}")
        print("사용 가능한 레벨: N1, N2, N3, N4, N5")
        sys.exit(1)
    
    if interactive:
        print(f"📚 {level} 레벨 단어 생성 중...")
        print(f"   생성할 단어 수: {count}개")
        print()
    
    # 단어 생성
    vocabularies = VocabularyGeneratorService.generate_vocabularies(
        level=jlpt_level,
        count=count
    )
    
    if not vocabularies:
        print("❌ 생성된 단어가 없습니다.")
        sys.exit(1)
    
    # 데이터베이스에 저장
    db = get_database()
    repo = SqliteVocabularyRepository(db)
    
    saved_count = 0
    for i, vocabulary in enumerate(vocabularies, 1):
        try:
            saved_vocabulary = repo.save(vocabulary)
            saved_count += 1
            if interactive:
                print(f"[{i}/{len(vocabularies)}] 단어 추가 완료: {saved_vocabulary.word} ({saved_vocabulary.meaning})")
        except Exception as e:
            if interactive:
                print(f"[{i}/{len(vocabularies)}] 단어 저장 실패: {str(e)}")
            continue
    
    if interactive:
        print()
        print(f"✅ 총 {saved_count}/{len(vocabularies)}개의 단어가 생성되었습니다.")
    else:
        print(f"{saved_count}/{len(vocabularies)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JLPT 단어 대량 생성")
    parser.add_argument(
        "--level",
        type=str,
        required=True,
        help="JLPT 레벨 (N1-N5)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="생성할 단어 수 (기본: 10)",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="대화형 출력 비활성화",
    )
    args = parser.parse_args()

    try:
        generate_vocabulary(
            level=args.level,
            count=args.count,
            interactive=not args.non_interactive,
        )
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

