#!/usr/bin/env python3
"""
E2E 테스트 데이터 정리 스크립트
테스트로 생성된 사용자 및 관련 데이터를 삭제합니다.
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


def cleanup_test_users(email_pattern: str = "test-%@example.com"):
    """테스트 사용자 및 관련 데이터 정리
    
    Args:
        email_pattern: 삭제할 사용자 이메일 패턴 (SQL LIKE 패턴)
                      기본값: "test-%@example.com" (test-로 시작하는 이메일)
    """
    db = Database()
    repo = SqliteUserRepository(db=db)
    
    # 테스트 사용자 찾기 (이메일 패턴으로)
    with db.get_connection() as conn:
        cursor = conn.execute(
            "SELECT id, email, username FROM users WHERE email LIKE ?",
            (email_pattern.replace('%', '%%'),)  # SQL LIKE 패턴 이스케이프
        )
        test_users = cursor.fetchall()
    
    if not test_users:
        print(f"✅ 정리할 테스트 사용자가 없습니다. (패턴: {email_pattern})")
        return 0
    
    deleted_count = 0
    
    for user_row in test_users:
        user_id = user_row['id']
        email = user_row['email']
        username = user_row['username']
        
        try:
            # 사용자 찾기
            user = repo.find_by_id(user_id)
            if not user:
                continue
            
            # 관련 데이터 삭제 (외래키 제약조건 때문에 순서 중요)
            with db.get_connection() as conn:
                # 1. answer_details 삭제 (results를 통해)
                conn.execute("""
                    DELETE FROM answer_details 
                    WHERE result_id IN (
                        SELECT id FROM results WHERE user_id = ?
                    )
                """, (user_id,))
                
                # 2. learning_history 삭제
                conn.execute("DELETE FROM learning_history WHERE user_id = ?", (user_id,))
                
                # 3. user_performance 삭제
                conn.execute("DELETE FROM user_performance WHERE user_id = ?", (user_id,))
                
                # 4. results 삭제
                conn.execute("DELETE FROM results WHERE user_id = ?", (user_id,))
                
                # 5. test_attempts에서 test_id를 먼저 가져온 후 삭제 (tests 삭제를 위해)
                cursor = conn.execute("SELECT DISTINCT test_id FROM test_attempts WHERE user_id = ?", (user_id,))
                test_ids = [row[0] for row in cursor.fetchall()]
                
                # test_attempts 삭제
                conn.execute("DELETE FROM test_attempts WHERE user_id = ?", (user_id,))
                
                # 6. tests 삭제 (사용자가 생성한 테스트)
                if test_ids:
                    placeholders = ','.join(['?'] * len(test_ids))
                    conn.execute(f"DELETE FROM tests WHERE id IN ({placeholders})", test_ids)
                
                # 7. users 삭제
                conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
                
                conn.commit()
            
            deleted_count += 1
            print(f"✅ 테스트 사용자 삭제: {email} ({username})")
            
        except Exception as e:
            print(f"❌ 사용자 삭제 실패 ({email}): {e}")
            continue
    
    print(f"\n✅ 총 {deleted_count}명의 테스트 사용자 및 관련 데이터가 삭제되었습니다.")
    return deleted_count


def cleanup_all_test_data():
    """모든 테스트 데이터 정리 (test-로 시작하는 이메일)"""
    return cleanup_test_users("test-%@example.com")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='E2E 테스트 데이터 정리')
    parser.add_argument('--email-pattern', type=str, default='test-%@example.com',
                       help='삭제할 사용자 이메일 패턴 (SQL LIKE 패턴, 기본값: test-%@example.com)')
    parser.add_argument('--all', action='store_true',
                       help='모든 테스트 데이터 정리 (test-로 시작하는 이메일)')
    
    args = parser.parse_args()
    
    try:
        if args.all:
            deleted_count = cleanup_all_test_data()
        else:
            deleted_count = cleanup_test_users(args.email_pattern)
        
        sys.exit(0 if deleted_count >= 0 else 1)
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

