"""
JLPT 레벨 추천 도메인 서비스
점수 기반으로 적절한 JLPT 레벨을 추천하는 비즈니스 로직
"""

from backend.domain.value_objects.jlpt import JLPTLevel


class LevelRecommendationService:
    """
    JLPT 레벨 추천 도메인 서비스
    
    테스트 점수와 테스트 레벨을 기반으로 다음 학습 레벨을 추천합니다.
    """

    def recommend_level(self, test_level: JLPTLevel, score: float) -> JLPTLevel:
        """
        점수 기반 레벨 추천

        Args:
            test_level: 응시한 테스트의 레벨
            score: 테스트 점수 (0.0 ~ 100.0)

        Returns:
            JLPTLevel: 추천 학습 레벨

        추천 규칙:
        - 90점 이상: 다음 레벨로 상향 추천 (N1은 예외로 N1 유지)
        - 70-89점: 현재 레벨 유지
        - 70점 미만: 이전 레벨로 하향 추천 (N5는 예외로 N5 유지)
        """
        if score >= 90.0:
            # 높은 점수: 다음 레벨로 상향 추천
            return self._get_next_level(test_level)
        elif score >= 70.0:
            # 중간 점수: 현재 레벨 유지
            return test_level
        else:
            # 낮은 점수: 이전 레벨로 하향 추천
            return self._get_previous_level(test_level)

    def _get_next_level(self, current_level: JLPTLevel) -> JLPTLevel:
        """
        다음 레벨 반환 (N1은 예외로 N1 유지)

        Args:
            current_level: 현재 레벨

        Returns:
            JLPTLevel: 다음 레벨
        """
        if current_level == JLPTLevel.N1:
            return JLPTLevel.N1  # 최고 레벨이므로 유지
        elif current_level == JLPTLevel.N5:
            return JLPTLevel.N4
        elif current_level == JLPTLevel.N4:
            return JLPTLevel.N3
        elif current_level == JLPTLevel.N3:
            return JLPTLevel.N2
        elif current_level == JLPTLevel.N2:
            return JLPTLevel.N1
        else:
            return current_level

    def _get_previous_level(self, current_level: JLPTLevel) -> JLPTLevel:
        """
        이전 레벨 반환 (N5는 예외로 N5 유지)

        Args:
            current_level: 현재 레벨

        Returns:
            JLPTLevel: 이전 레벨
        """
        if current_level == JLPTLevel.N5:
            return JLPTLevel.N5  # 최하 레벨이므로 유지
        elif current_level == JLPTLevel.N4:
            return JLPTLevel.N5
        elif current_level == JLPTLevel.N3:
            return JLPTLevel.N4
        elif current_level == JLPTLevel.N2:
            return JLPTLevel.N3
        elif current_level == JLPTLevel.N1:
            return JLPTLevel.N2
        else:
            return current_level

