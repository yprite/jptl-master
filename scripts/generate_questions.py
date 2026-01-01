#!/usr/bin/env python3
"""
문제 대량 생성 스크립트
JLPT 문제를 대량 생성하여 데이터베이스에 저장합니다.
"""

import sys
import os
import argparse

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.domain.services.question_generator_service import QuestionGeneratorService
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
from backend.infrastructure.config.database import get_database


def generate_questions(
    level: str,
    question_type: str = None,
    count: int = 10,
    interactive: bool = True
):
    """문제 생성 및 데이터베이스에 저장
    
    Args:
        level: JLPT 레벨 (N1-N5)
        question_type: 문제 유형 (vocabulary, grammar, reading, listening) 또는 None
        count: 생성할 문제 수
        interactive: True이면 진행 상황을 출력
    """
    try:
        jlpt_level = JLPTLevel(level.upper())
    except ValueError:
        print(f"❌ 잘못된 레벨입니다: {level}")
        print("사용 가능한 레벨: N1, N2, N3, N4, N5")
        sys.exit(1)
    
    q_type = None
    if question_type:
        try:
            q_type = QuestionType(question_type.lower())
        except ValueError:
            print(f"❌ 잘못된 문제 유형입니다: {question_type}")
            print("사용 가능한 유형: vocabulary, grammar, reading, listening")
            sys.exit(1)
    
    if interactive:
        print(f"📝 {level} 레벨 문제 생성 중...")
        if q_type:
            print(f"   문제 유형: {q_type.value}")
        else:
            print(f"   문제 유형: 모든 유형")
        print(f"   생성할 문제 수: {count}개")
        print()
    
    # 문제 생성
    questions = QuestionGeneratorService.generate_questions(
        level=jlpt_level,
        question_type=q_type,
        count=count
    )
    
    if not questions:
        print("❌ 생성된 문제가 없습니다.")
        sys.exit(1)
    
    # 데이터베이스에 저장
    db = get_database()
    repo = SqliteQuestionRepository(db)
    
    saved_count = 0
    for i, question in enumerate(questions, 1):
        try:
            saved_question = repo.save(question)
            saved_count += 1
            if interactive:
                print(f"[{i}/{len(questions)}] 문제 추가 완료: {saved_question.question_text[:50]}...")
        except Exception as e:
            if interactive:
                print(f"[{i}/{len(questions)}] 문제 저장 실패: {str(e)}")
            continue
    
    if interactive:
        print()
        print(f"✅ 총 {saved_count}/{len(questions)}개의 문제가 생성되었습니다.")
        
        # 유형별 통계
        type_counts = {}
        for q in questions:
            q_type = q.question_type.value
            type_counts[q_type] = type_counts.get(q_type, 0) + 1
        
        print("\n유형별 문제 수:")
        for q_type, count in type_counts.items():
            print(f"  - {q_type}: {count}개")
    else:
        print(f"{saved_count}/{len(questions)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JLPT 문제 대량 생성")
    parser.add_argument(
        "--level",
        type=str,
        required=True,
        help="JLPT 레벨 (N1-N5)",
    )
    parser.add_argument(
        "--type",
        type=str,
        default=None,
        help="문제 유형 (vocabulary, grammar, reading, listening). 생략 시 모든 유형",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="생성할 문제 수 (기본: 10)",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="대화형 출력 비활성화",
    )
    args = parser.parse_args()

    try:
        generate_questions(
            level=args.level,
            question_type=args.type,
            count=args.count,
            interactive=not args.non_interactive,
        )
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

