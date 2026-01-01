#!/usr/bin/env python3
"""
기출단어 임포트 스크립트
JSON 또는 CSV 파일에서 기출단어를 임포트하여 데이터베이스에 저장합니다.
"""

import sys
import os
import argparse
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.infrastructure.adapters.jlpt_question_importer import JLPTQuestionImporter
from backend.infrastructure.repositories.vocabulary_repository import SqliteVocabularyRepository
from backend.infrastructure.config.database import get_database


def import_vocabulary(
    file_path: str,
    file_type: str = None,
    interactive: bool = True
):
    """기출단어 임포트 및 데이터베이스에 저장
    
    Args:
        file_path: 임포트할 파일 경로
        file_type: 파일 형식 (json, csv). None이면 확장자로 자동 감지
        interactive: True이면 진행 상황을 출력
    """
    path = Path(file_path)
    
    if not path.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        sys.exit(1)
    
    # 파일 형식 확인
    if file_type is None:
        file_ext = path.suffix.lower()
        if file_ext == '.json':
            file_type = 'json'
        elif file_ext == '.csv':
            file_type = 'csv'
        else:
            print(f"❌ 지원하지 않는 파일 형식입니다: {file_ext}")
            print("지원 형식: .json, .csv")
            sys.exit(1)
    
    if interactive:
        print(f"📥 기출단어 임포트 중...")
        print(f"   파일: {file_path}")
        print(f"   형식: {file_type}")
        print()
    
    # 파일에서 단어 임포트
    try:
        if file_type == 'json':
            vocabularies = JLPTQuestionImporter.import_vocabulary_from_json(str(path))
        else:
            vocabularies = JLPTQuestionImporter.import_vocabulary_from_csv(str(path))
    except Exception as e:
        print(f"❌ 파일 임포트 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    if not vocabularies:
        print("❌ 임포트된 단어가 없습니다.")
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
        print(f"✅ 총 {saved_count}/{len(vocabularies)}개의 단어가 임포트되었습니다.")
        
        # 레벨별 통계
        level_counts = {}
        for v in vocabularies:
            level = v.level.value
            level_counts[level] = level_counts.get(level, 0) + 1
        
        print("\n레벨별 단어 수:")
        for level, count in sorted(level_counts.items()):
            print(f"  - {level}: {count}개")
    else:
        print(f"{saved_count}/{len(vocabularies)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="기출단어 임포트")
    parser.add_argument(
        "file",
        type=str,
        help="임포트할 파일 경로 (JSON 또는 CSV)",
    )
    parser.add_argument(
        "--type",
        type=str,
        default=None,
        choices=['json', 'csv'],
        help="파일 형식 (json, csv). 생략 시 확장자로 자동 감지",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="대화형 출력 비활성화",
    )
    args = parser.parse_args()

    try:
        import_vocabulary(
            file_path=args.file,
            file_type=args.type,
            interactive=not args.non_interactive,
        )
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

