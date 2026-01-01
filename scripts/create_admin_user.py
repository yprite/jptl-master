#!/usr/bin/env python3
"""
어드민 사용자 생성 스크립트
"""

import sys
import os

# 프로젝트 루트를 Python 경로에 추가
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

from backend.infrastructure.config.database import Database
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel


def create_admin_user(email: str = "admin@example.com", username: str = "admin", non_interactive: bool = False):
    """어드민 사용자 생성"""
    db = Database()
    repo = SqliteUserRepository(db=db)
    
    # 이미 존재하는 사용자인지 확인
    existing_user = repo.find_by_email(email)
    if existing_user:
        if not non_interactive:
            print(f"❌ 이미 존재하는 이메일입니다: {email}")
            print(f"   사용자 ID: {existing_user.id}, 사용자명: {existing_user.username}")
        
        # 기존 사용자를 어드민으로 변경할지 물어봄
        if not existing_user.is_admin:
            if non_interactive:
                # 비대화형 모드: 자동으로 어드민으로 변경
                existing_user.is_admin = True
                updated_user = repo.save(existing_user)
                print(f"✅ 기존 사용자를 어드민으로 변경했습니다!")
                print(f"   이메일: {updated_user.email}")
                print(f"   사용자명: {updated_user.username}")
                print(f"   어드민 권한: {updated_user.is_admin}")
                return updated_user
            else:
                print(f"\n기존 사용자를 어드민으로 변경하시겠습니까? (y/n): ", end="")
                response = input().strip().lower()
                if response == 'y':
                    existing_user.is_admin = True
                    updated_user = repo.save(existing_user)
                    print(f"✅ 기존 사용자를 어드민으로 변경했습니다!")
                    print(f"   이메일: {updated_user.email}")
                    print(f"   사용자명: {updated_user.username}")
                    print(f"   어드민 권한: {updated_user.is_admin}")
                    return updated_user
                else:
                    print("취소되었습니다.")
                    return None
        else:
            if not non_interactive:
                print(f"✅ 이미 어드민 권한이 있는 사용자입니다.")
            return existing_user
    
    # 새 어드민 사용자 생성
    admin_user = User(
        id=None,
        email=email,
        username=username,
        target_level=JLPTLevel.N5,
        is_admin=True
    )
    
    saved_user = repo.save(admin_user)
    
    print(f"✅ 어드민 사용자가 생성되었습니다!")
    print(f"   ID: {saved_user.id}")
    print(f"   이메일: {saved_user.email}")
    print(f"   사용자명: {saved_user.username}")
    print(f"   어드민 권한: {saved_user.is_admin}")
    print(f"\n💡 로그인 방법:")
    print(f"   1. 프론트엔드에서 '{saved_user.email}' 이메일로 로그인하세요.")
    print(f"   2. 초기 페이지에서 '어드민 - 대시보드' 버튼이 표시됩니다.")
    
    return saved_user


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='어드민 사용자 생성')
    parser.add_argument('--email', type=str, default='admin@example.com', 
                       help='어드민 사용자 이메일 (기본값: admin@example.com)')
    parser.add_argument('--username', type=str, default='admin',
                       help='어드민 사용자명 (기본값: admin)')
    parser.add_argument('--non-interactive', action='store_true',
                       help='대화형 프롬프트 없이 실행 (자동으로 어드민 권한 부여)')
    
    args = parser.parse_args()
    
    try:
        create_admin_user(email=args.email, username=args.username, non_interactive=args.non_interactive)
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)

