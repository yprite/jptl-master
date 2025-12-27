"""
Post 도메인 엔티티 테스트
TDD 방식으로 Post 엔티티의 비즈니스 로직 검증
"""

import pytest
from datetime import datetime
from backend.domain.entities.post import Post


class TestPost:
    """Post 엔티티 단위 테스트"""

    def test_create_valid_post(self):
        """유효한 Post 생성 테스트"""
        # Given
        post = Post(
            id=1,
            title="테스트 제목",
            content="테스트 내용",
            author_id=1
        )

        # Then
        assert post.id == 1
        assert post.title == "테스트 제목"
        assert post.content == "테스트 내용"
        assert post.author_id == 1
        assert post.published is False
        assert isinstance(post.created_at, datetime)
        assert isinstance(post.updated_at, datetime)

    def test_create_post_with_all_params(self):
        """모든 파라미터로 Post 생성 테스트"""
        # Given
        created_at = datetime(2024, 1, 1, 12, 0, 0)
        updated_at = datetime(2024, 1, 2, 12, 0, 0)

        # When
        post = Post(
            id=1,
            title="테스트 제목",
            content="테스트 내용",
            author_id=1,
            published=True,
            created_at=created_at,
            updated_at=updated_at
        )

        # Then
        assert post.published is True
        assert post.created_at == created_at
        assert post.updated_at == updated_at

    def test_post_creation_validation(self):
        """Post 생성 시 유효성 검증 테스트"""
        # 빈 제목
        with pytest.raises(ValueError, match="제목은 필수 항목입니다"):
            Post(id=1, title="", content="내용", author_id=1)

        # None 제목
        with pytest.raises(ValueError, match="제목은 필수 항목입니다"):
            Post(id=1, title=None, content="내용", author_id=1)

        # 제목이 공백만 있는 경우
        with pytest.raises(ValueError, match="제목은 비어있을 수 없습니다"):
            Post(id=1, title="   ", content="내용", author_id=1)

        # 제목이 200자 초과
        with pytest.raises(ValueError, match="제목은 200자를 초과할 수 없습니다"):
            Post(id=1, title="a" * 201, content="내용", author_id=1)

        # 빈 내용
        with pytest.raises(ValueError, match="내용은 필수 항목입니다"):
            Post(id=1, title="제목", content="", author_id=1)

        # None 내용
        with pytest.raises(ValueError, match="내용은 필수 항목입니다"):
            Post(id=1, title="제목", content=None, author_id=1)

        # 내용이 공백만 있는 경우
        with pytest.raises(ValueError, match="내용은 비어있을 수 없습니다"):
            Post(id=1, title="제목", content="   ", author_id=1)

    def test_publish(self):
        """게시글 공개 테스트"""
        # Given
        post = Post(id=1, title="제목", content="내용", author_id=1, published=False)
        original_updated_at = post.updated_at

        # When
        post.publish()

        # Then
        assert post.published is True
        assert post.updated_at > original_updated_at

    def test_unpublish(self):
        """게시글 비공개 테스트"""
        # Given
        post = Post(id=1, title="제목", content="내용", author_id=1, published=True)
        original_updated_at = post.updated_at
        import time
        time.sleep(0.01)  # 시간 차이를 보장하기 위한 작은 지연

        # When
        post.unpublish()

        # Then
        assert post.published is False
        assert post.updated_at >= original_updated_at

    def test_update_content(self):
        """게시글 내용 수정 테스트"""
        # Given
        post = Post(id=1, title="제목", content="내용", author_id=1)
        original_updated_at = post.updated_at

        # When - 제목만 수정
        post.update_content(title="새 제목")

        # Then
        assert post.title == "새 제목"
        assert post.content == "내용"
        assert post.updated_at > original_updated_at

        # When - 내용만 수정
        original_updated_at = post.updated_at
        post.update_content(content="새 내용")

        # Then
        assert post.title == "새 제목"
        assert post.content == "새 내용"
        assert post.updated_at > original_updated_at

        # When - 둘 다 수정
        original_updated_at = post.updated_at
        post.update_content(title="최종 제목", content="최종 내용")

        # Then
        assert post.title == "최종 제목"
        assert post.content == "최종 내용"
        assert post.updated_at > original_updated_at

    def test_update_content_validation(self):
        """게시글 내용 수정 시 유효성 검증 테스트"""
        # Given
        post = Post(id=1, title="제목", content="내용", author_id=1)

        # 빈 제목으로 수정 시도
        with pytest.raises(ValueError, match="제목은 필수 항목입니다"):
            post.update_content(title="")

        # 제목이 200자 초과
        with pytest.raises(ValueError, match="제목은 200자를 초과할 수 없습니다"):
            post.update_content(title="a" * 201)

        # 빈 내용으로 수정 시도
        with pytest.raises(ValueError, match="내용은 필수 항목입니다"):
            post.update_content(content="")

    def test_post_equality(self):
        """Post 동등성 테스트"""
        # Given
        post1 = Post(id=1, title="제목", content="내용", author_id=1)
        post2 = Post(id=1, title="다른 제목", content="다른 내용", author_id=2)
        post3 = Post(id=2, title="제목", content="내용", author_id=1)

        # Then
        assert post1 == post2  # 같은 ID
        assert post1 != post3  # 다른 ID
        assert post1 != "not a post"  # 다른 타입

    def test_post_hash(self):
        """Post 해시 테스트"""
        # Given
        post1 = Post(id=1, title="제목", content="내용", author_id=1)
        post2 = Post(id=1, title="다른 제목", content="다른 내용", author_id=2)
        post3 = Post(id=2, title="제목", content="내용", author_id=1)

        # Then
        assert hash(post1) == hash(post2)  # 같은 ID
        assert hash(post1) != hash(post3)  # 다른 ID

    def test_post_representation(self):
        """Post 문자열 표현 테스트"""
        # Given
        post = Post(id=1, title="테스트 제목", content="내용", author_id=1, published=True)

        # When & Then
        expected_repr = "Post(id=1, title='테스트 제목', author_id=1, published=True)"
        assert repr(post) == expected_repr

