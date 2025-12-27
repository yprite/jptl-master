"""
User 도메인 엔티티
블로그 시스템의 사용자 도메인을 표현
"""

from datetime import datetime
import re
from typing import Optional


class User:
    """
    사용자 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    """

    def __init__(
        self,
        id: int,
        email: str,
        username: str,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        """
        User 엔티티 초기화

        Args:
            id: 고유 식별자
            email: 이메일 주소
            username: 사용자명
            created_at: 생성 일시 (미제공 시 현재 시간)
            updated_at: 수정 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 이메일 형식이 잘못되었거나 사용자명이 비어있는 경우
        """
        self._validate_email(email)
        self._validate_username(username)

        self.id = id
        self.email = email
        self.username = username
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def _validate_email(self, email: str) -> None:
        """이메일 형식 검증"""
        if not email or not isinstance(email, str):
            raise ValueError("이메일은 필수 항목입니다")

        # 간단한 이메일 형식 검증
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("올바른 이메일 형식이 아닙니다")

    def _validate_username(self, username: str) -> None:
        """사용자명 검증"""
        if not username or not isinstance(username, str):
            raise ValueError("사용자명은 필수 항목입니다")

        if len(username.strip()) == 0:
            raise ValueError("사용자명은 비어있을 수 없습니다")

        if len(username) > 50:
            raise ValueError("사용자명은 50자를 초과할 수 없습니다")

    def update_profile(self, email: Optional[str] = None, username: Optional[str] = None) -> None:
        """
        사용자 프로필 업데이트

        Args:
            email: 새로운 이메일 (선택)
            username: 새로운 사용자명 (선택)
        """
        if email is not None:
            self._validate_email(email)
            self.email = email

        if username is not None:
            self._validate_username(username)
            self.username = username

        self.updated_at = datetime.now()

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, User):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return f"User(id={self.id}, email='{self.email}', username='{self.username}')"
