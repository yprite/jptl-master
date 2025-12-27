"""
Post 엔티티와 데이터베이스 행 간 변환 매퍼
"""

import sqlite3
from datetime import datetime
from typing import Dict, Any
from backend.domain.entities.post import Post


class PostMapper:
    """Post 엔티티와 데이터베이스 행 간 변환"""

    @staticmethod
    def to_entity(row: sqlite3.Row) -> Post:
        """데이터베이스 행을 Post 엔티티로 변환"""
        return Post(
            id=row['id'],
            title=row['title'],
            content=row['content'],
            author_id=row['author_id'],
            published=bool(row['published']),
            created_at=PostMapper._parse_datetime(row['created_at']),
            updated_at=PostMapper._parse_datetime(row['updated_at'])
        )

    @staticmethod
    def to_dict(post: Post) -> Dict[str, Any]:
        """Post 엔티티를 데이터베이스 행으로 변환"""
        return {
            'title': post.title,
            'content': post.content,
            'author_id': post.author_id,
            'published': 1 if post.published else 0,
            'created_at': post.created_at.isoformat(),
            'updated_at': post.updated_at.isoformat()
        }

    @staticmethod
    def _parse_datetime(datetime_str: str) -> datetime:
        """ISO 형식의 datetime 문자열을 datetime 객체로 변환"""
        if not datetime_str:
            return datetime.now()
        try:
            return datetime.fromisoformat(datetime_str)
        except (ValueError, TypeError):
            return datetime.now()

