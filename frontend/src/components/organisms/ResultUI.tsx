/**
 * Result UI 컴포넌트
 * JLPT 테스트 결과를 표시하는 컴포넌트
 */

import React from 'react';
import { Result } from '../../types/api';
import './ResultUI.css';

interface ResultUIProps {
  result: Result;
}

const ResultUI: React.FC<ResultUIProps> = ({ result }) => {
  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return '#4caf50';
      case 'good':
        return '#ff9800';
      case 'needs_improvement':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getPerformanceLabel = (level: string) => {
    switch (level) {
      case 'excellent':
        return '우수';
      case 'good':
        return '양호';
      case 'needs_improvement':
        return '개선 필요';
      default:
        return level;
    }
  };

  const getLevelProgressionLabel = (progression: string) => {
    switch (progression) {
      case 'level_up':
        return '레벨 업';
      case 'level_down':
        return '레벨 다운';
      case 'maintain':
        return '유지';
      default:
        return progression;
    }
  };

  return (
    <div className="result-ui" data-testid="result-ui">
      <div className="result-header">
        <h2 className="result-title">테스트 결과</h2>
        <div
          className={`result-status ${result.is_passed ? 'passed' : 'failed'}`}
          data-testid="result-status"
        >
          {result.is_passed ? '합격' : '불합격'}
        </div>
      </div>

      <div className="result-score-section">
        <div className="score-circle">
          <div className="score-value" data-testid="score-value">
            {result.score.toFixed(1)}
          </div>
          <div className="score-label">점</div>
        </div>
        <div className="score-details">
          <div className="score-item">
            <span className="score-label-text">정답률</span>
            <span className="score-value-text">
              {result.accuracy_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="score-item">
            <span className="score-label-text">정답 수</span>
            <span className="score-value-text">
              {result.correct_answers_count} / {result.total_questions_count}
            </span>
          </div>
          <div className="score-item">
            <span className="score-label-text">소요 시간</span>
            <span className="score-value-text">
              {result.time_taken_minutes}분
            </span>
          </div>
        </div>
      </div>

      <div className="result-performance-section">
        <div className="performance-item">
          <span className="performance-label">성취도</span>
          <span
            className="performance-value"
            style={{ color: getPerformanceColor(result.performance_level) }}
            data-testid="performance-level"
          >
            {getPerformanceLabel(result.performance_level)}
          </span>
        </div>
        <div className="performance-item">
          <span className="performance-label">시간 효율성</span>
          <span className="performance-value">
            {result.time_efficiency === 'efficient' ? '효율적' : '개선 필요'}
          </span>
        </div>
        <div className="performance-item">
          <span className="performance-label">레벨 진전</span>
          <span className="performance-value">
            {getLevelProgressionLabel(result.level_progression)}
          </span>
        </div>
      </div>

      <div className="result-level-section">
        <div className="level-item">
          <span className="level-label">평가 레벨</span>
          <span className="level-value" data-testid="assessed-level">
            {result.assessed_level}
          </span>
        </div>
        <div className="level-item">
          <span className="level-label">추천 레벨</span>
          <span className="level-value" data-testid="recommended-level">
            {result.recommended_level}
          </span>
        </div>
      </div>

      {Object.keys(result.question_type_analysis).length > 0 && (
        <div className="result-analysis-section">
          <h3 className="section-title">문제 유형별 분석</h3>
          <div className="analysis-grid">
            {Object.entries(result.question_type_analysis).map(
              ([type, data]) => {
                const percentage =
                  data.total > 0 ? (data.correct / data.total) * 100 : 0;
                return (
                  <div key={type} className="analysis-item">
                    <div className="analysis-header">
                      <span className="analysis-type">{type}</span>
                      <span className="analysis-percentage">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="analysis-bar">
                      <div
                        className="analysis-bar-fill"
                        style={{ width: `${percentage}%` }}
                        data-testid={`analysis-bar-${type}`}
                      />
                    </div>
                    <div className="analysis-details">
                      {data.correct} / {data.total} 정답
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      <div className="result-feedback-section">
        <h3 className="section-title">피드백</h3>
        <div className="feedback-content">
          <div className="feedback-item">
            <h4 className="feedback-title">전체 성취도</h4>
            <p className="feedback-text">{result.feedback.overall_performance}</p>
          </div>
          <div className="feedback-item">
            <h4 className="feedback-title">시간 관리</h4>
            <p className="feedback-text">{result.feedback.time_management}</p>
          </div>
          <div className="feedback-item">
            <h4 className="feedback-title">레벨 추천</h4>
            <p className="feedback-text">
              {result.feedback.level_recommendation}
            </p>
          </div>
          <div className="feedback-item">
            <h4 className="feedback-title">학습 제안</h4>
            <p className="feedback-text">{result.feedback.study_suggestions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultUI;

