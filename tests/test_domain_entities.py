"""
도메인 엔티티 테스트
TDD 방식으로 User, Post 엔티티 구현
"""

import pytest
from datetime import datetime
from backend.domain.entities.user import User
from backend.domain.entities.post import Post


class TestUser:
    """User 엔티티 테스트"""

    def test_user_creation_with_valid_data(self):
        """유효한 데이터로 User 생성 테스트"""
        # Given
        user_id = 1
        email = "test@example.com"
        username = "testuser"

        # When
        user = User(id=user_id, email=email, username=username)

        # Then
        assert user.id == user_id
        assert user.email == email
        assert user.username == username
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_user_creation_without_id(self):
        """ID 없이 User 생성 시 실패 테스트"""
        # Given & When & Then
        with pytest.raises(TypeError):
            User(email="test@example.com", username="testuser")

    def test_user_creation_with_invalid_email(self):
        """잘못된 이메일 형식으로 User 생성 시 실패 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError):
            User(id=1, email="invalid-email", username="testuser")

    def test_user_creation_with_empty_username(self):
        """빈 사용자명으로 User 생성 시 실패 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError):
            User(id=1, email="test@example.com", username="")

    def test_user_update_timestamp(self):
        """User 정보 수정 시 updated_at 갱신 테스트"""
        # Given
        user = User(id=1, email="test@example.com", username="testuser")
        original_updated_at = user.updated_at

        # When - 1초 대기 후 업데이트 (실제로는 update 메서드 호출)
        import time
        time.sleep(0.001)  # 아주 짧은 대기

        # Then - 실제 구현 시 updated_at이 갱신되는지 확인
        # TODO: update 메서드 구현 후 테스트 추가
        assert user.updated_at >= original_updated_at

    def test_user_equality_by_id(self):
        """ID로 User 동등성 비교 테스트"""
        # Given
        user1 = User(id=1, email="test@example.com", username="testuser")
        user2 = User(id=1, email="different@example.com", username="different")
        user3 = User(id=2, email="test@example.com", username="testuser")

        # Then
        assert user1 == user2  # 같은 ID
        assert user1 != user3  # 다른 ID


class TestPost:
    """Post 엔티티 테스트"""

    def test_post_creation_with_valid_data(self):
        """유효한 데이터로 Post 생성 테스트"""
        # Given
        post_id = 1
        title = "테스트 게시글"
        content = "이것은 테스트 게시글의 내용입니다."
        author_id = 1

        # When
        post = Post(id=post_id, title=title, content=content, author_id=author_id)

        # Then
        assert post.id == post_id
        assert post.title == title
        assert post.content == content
        assert post.author_id == author_id
        assert post.published == False  # 기본값
        assert isinstance(post.created_at, datetime)
        assert isinstance(post.updated_at, datetime)

    def test_post_creation_without_required_fields(self):
        """필수 필드 없이 Post 생성 시 실패 테스트"""
        # Given & When & Then
        with pytest.raises(TypeError):
            Post(id=1, title="제목")  # content와 author_id 누락

    def test_post_creation_with_empty_title(self):
        """빈 제목으로 Post 생성 시 실패 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError):
            Post(id=1, title="", content="내용", author_id=1)

    def test_post_creation_with_empty_content(self):
        """빈 내용으로 Post 생성 시 실패 테스트"""
        # Given & When & Then
        with pytest.raises(ValueError):
            Post(id=1, title="제목", content="", author_id=1)

    def test_post_publish(self):
        """게시글 게시 테스트"""
        # Given
        post = Post(id=1, title="제목", content="내용", author_id=1)
        assert post.published == False

        # When
        post.publish()

        # Then
        assert post.published == True
        assert post.updated_at >= post.created_at

    def test_post_unpublish(self):
        """게시글 게시 취소 테스트"""
        # Given
        post = Post(id=1, title="제목", content="내용", author_id=1, published=True)

        # When
        post.unpublish()

        # Then
        assert post.published == False

    def test_post_update_content(self):
        """게시글 내용 수정 테스트"""
        # Given
        post = Post(id=1, title="원래 제목", content="원래 내용", author_id=1)
        original_updated_at = post.updated_at

        # When
        post.update_content(title="수정된 제목", content="수정된 내용")

        # Then
        assert post.title == "수정된 제목"
        assert post.content == "수정된 내용"
        assert post.updated_at > original_updated_at

    def test_post_equality_by_id(self):
        """ID로 Post 동등성 비교 테스트"""
        # Given
        post1 = Post(id=1, title="제목1", content="내용1", author_id=1)
        post2 = Post(id=1, title="제목2", content="내용2", author_id=2)
        post3 = Post(id=2, title="제목1", content="내용1", author_id=1)

        # Then
        assert post1 == post2  # 같은 ID
        assert post1 != post3  # 다른 ID
