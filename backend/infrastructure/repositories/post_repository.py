"""
SQLite 기반 Post Repository 구현
"""

from typing import List, Optional
from backend.domain.entities.post import Post
from backend.infrastructure.config.database import get_database, Database
from backend.infrastructure.repositories.post_mapper import PostMapper


class SqlitePostRepository:
    """SQLite 기반 Post Repository 구현"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()

    def save(self, post: Post) -> Post:
        """게시글 저장/업데이트"""
        with self.db.get_connection() as conn:
            data = PostMapper.to_dict(post)

            if post.id is None or post.id == 0:
                # 새 게시글 생성
                cursor = conn.execute("""
                    INSERT INTO posts (title, content, author_id, published,
                                     created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    data['title'], data['content'], data['author_id'],
                    data['published'], data['created_at'], data['updated_at']
                ))

                # 생성된 ID를 게시글 객체에 설정
                post.id = cursor.lastrowid
            else:
                # 기존 게시글 업데이트
                conn.execute("""
                    UPDATE posts
                    SET title = ?, content = ?, author_id = ?, published = ?,
                        updated_at = ?
                    WHERE id = ?
                """, (
                    data['title'], data['content'], data['author_id'],
                    data['published'], data['updated_at'], post.id
                ))

            conn.commit()
            return post

    def find_by_id(self, id: int) -> Optional[Post]:
        """ID로 게시글 조회"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM posts WHERE id = ?", (id,))
            row = cursor.fetchone()

            if row:
                return PostMapper.to_entity(row)
            return None

    def find_all(self, published_only: bool = False) -> List[Post]:
        """모든 게시글 조회"""
        with self.db.get_connection() as conn:
            if published_only:
                cursor = conn.execute(
                    "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC"
                )
            else:
                cursor = conn.execute(
                    "SELECT * FROM posts ORDER BY created_at DESC"
                )
            rows = cursor.fetchall()

            return [PostMapper.to_entity(row) for row in rows]

    def find_by_author_id(self, author_id: int, published_only: bool = False) -> List[Post]:
        """작성자 ID로 게시글 조회"""
        with self.db.get_connection() as conn:
            if published_only:
                cursor = conn.execute(
                    "SELECT * FROM posts WHERE author_id = ? AND published = 1 ORDER BY created_at DESC",
                    (author_id,)
                )
            else:
                cursor = conn.execute(
                    "SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC",
                    (author_id,)
                )
            rows = cursor.fetchall()

            return [PostMapper.to_entity(row) for row in rows]

    def delete(self, post: Post) -> None:
        """게시글 삭제"""
        if post.id is None:
            return

        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM posts WHERE id = ?", (post.id,))
            conn.commit()

    def exists_by_id(self, id: int) -> bool:
        """ID 존재 여부 확인"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT 1 FROM posts WHERE id = ? LIMIT 1", (id,))
            return cursor.fetchone() is not None

