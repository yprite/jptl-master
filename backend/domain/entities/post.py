"""
Post 도메인 엔티티
블로그 시스템의 게시글 도메인을 표현
"""

from datetime import datetime
from typing import Optional


class Post:
    """
    게시글 엔티티

    DDD에서 Entity로 분류되며, 고유 식별자를 가짐
    """

    def __init__(
        self,
        id: int,
        title: str,
        content: str,
        author_id: int,
        published: bool = False,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        """
        Post 엔티티 초기화

        Args:
            id: 고유 식별자
            title: 게시글 제목
            content: 게시글 내용
            author_id: 작성자 ID
            published: 게시 여부
            created_at: 생성 일시 (미제공 시 현재 시간)
            updated_at: 수정 일시 (미제공 시 현재 시간)

        Raises:
            ValueError: 제목이나 내용이 비어있는 경우
        """
        self._validate_title(title)
        self._validate_content(content)

        self.id = id
        self.title = title
        self.content = content
        self.author_id = author_id
        self.published = published
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def _validate_title(self, title: str) -> None:
        """제목 검증"""
        if not title or not isinstance(title, str):
            raise ValueError("제목은 필수 항목입니다")

        if len(title.strip()) == 0:
            raise ValueError("제목은 비어있을 수 없습니다")

        if len(title) > 200:
            raise ValueError("제목은 200자를 초과할 수 없습니다")

    def _validate_content(self, content: str) -> None:
        """내용 검증"""
        if not content or not isinstance(content, str):
            raise ValueError("내용은 필수 항목입니다")

        if len(content.strip()) == 0:
            raise ValueError("내용은 비어있을 수 없습니다")

    def publish(self) -> None:
        """게시글을 공개 상태로 변경"""
        self.published = True
        self.updated_at = datetime.now()

    def unpublish(self) -> None:
        """게시글을 비공개 상태로 변경"""
        self.published = False
        self.updated_at = datetime.now()

    def update_content(self, title: Optional[str] = None, content: Optional[str] = None) -> None:
        """
        게시글 내용 수정

        Args:
            title: 새로운 제목 (선택)
            content: 새로운 내용 (선택)
        """
        if title is not None:
            self._validate_title(title)
            self.title = title

        if content is not None:
            self._validate_content(content)
            self.content = content

        self.updated_at = datetime.now()

    def __eq__(self, other) -> bool:
        """ID 기반 동등성 비교"""
        if not isinstance(other, Post):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """ID 기반 해시"""
        return hash(self.id)

    def __repr__(self) -> str:
        """문자열 표현"""
        return f"Post(id={self.id}, title='{self.title}', author_id={self.author_id}, published={self.published})"
