"""
JLPT 레벨 추천 서비스 테스트
TDD 방식으로 레벨 추천 로직 검증
"""

import pytest
from backend.domain.services.level_recommendation_service import LevelRecommendationService
from backend.domain.value_objects.jlpt import JLPTLevel


class TestLevelRecommendationService:
    """LevelRecommendationService 단위 테스트"""

    def test_recommend_level_n5_high_score(self):
        """N5 테스트에서 높은 점수(90점 이상)일 때 N4 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N5
        score = 95.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N4

    def test_recommend_level_n5_medium_score(self):
        """N5 테스트에서 중간 점수(70-89점)일 때 N5 유지"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N5
        score = 80.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N5

    def test_recommend_level_n5_low_score(self):
        """N5 테스트에서 낮은 점수(70점 미만)일 때 N5 유지"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N5
        score = 60.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N5

    def test_recommend_level_n4_high_score(self):
        """N4 테스트에서 높은 점수(90점 이상)일 때 N3 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N4
        score = 92.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N3

    def test_recommend_level_n4_medium_score(self):
        """N4 테스트에서 중간 점수(70-89점)일 때 N4 유지"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N4
        score = 75.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N4

    def test_recommend_level_n4_low_score(self):
        """N4 테스트에서 낮은 점수(70점 미만)일 때 N5로 하향 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N4
        score = 65.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N5

    def test_recommend_level_n3_high_score(self):
        """N3 테스트에서 높은 점수(90점 이상)일 때 N2 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N3
        score = 91.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N2

    def test_recommend_level_n3_medium_score(self):
        """N3 테스트에서 중간 점수(70-89점)일 때 N3 유지"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N3
        score = 78.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N3

    def test_recommend_level_n3_low_score(self):
        """N3 테스트에서 낮은 점수(70점 미만)일 때 N4로 하향 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N3
        score = 68.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N4

    def test_recommend_level_n2_high_score(self):
        """N2 테스트에서 높은 점수(90점 이상)일 때 N1 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N2
        score = 93.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N1

    def test_recommend_level_n2_medium_score(self):
        """N2 테스트에서 중간 점수(70-89점)일 때 N2 유지"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N2
        score = 82.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N2

    def test_recommend_level_n2_low_score(self):
        """N2 테스트에서 낮은 점수(70점 미만)일 때 N3로 하향 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N2
        score = 66.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N3

    def test_recommend_level_n1_high_score(self):
        """N1 테스트에서 높은 점수(90점 이상)일 때 N1 유지 (최고 레벨)"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N1
        score = 95.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N1

    def test_recommend_level_n1_medium_score(self):
        """N1 테스트에서 중간 점수(70-89점)일 때 N1 유지"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N1
        score = 85.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N1

    def test_recommend_level_n1_low_score(self):
        """N1 테스트에서 낮은 점수(70점 미만)일 때 N2로 하향 추천"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N1
        score = 65.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N2

    def test_recommend_level_boundary_90(self):
        """경계값 테스트: 90점 정확히"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N5
        score = 90.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N4

    def test_recommend_level_boundary_70(self):
        """경계값 테스트: 70점 정확히"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N5
        score = 70.0

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N5

    def test_recommend_level_boundary_69(self):
        """경계값 테스트: 69.9점"""
        # Given
        service = LevelRecommendationService()
        test_level = JLPTLevel.N5
        score = 69.9

        # When
        recommended = service.recommend_level(test_level, score)

        # Then
        assert recommended == JLPTLevel.N5

