/**
 * UserPerformance UI 컴포넌트
 * 사용자 성능 분석 데이터를 표시하는 컴포넌트
 */

import React from 'react';
import { UserPerformance } from '../../types/api';
import './UserPerformanceUI.css';

interface UserPerformanceUIProps {
  performance: UserPerformance;
}

const UserPerformanceUI: React.FC<UserPerformanceUIProps> = ({ performance }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="user-performance-ui" data-testid="user-performance-ui">
      <h2>성능 분석</h2>
      
      <div className="performance-period">
        <p>
          분석 기간: {formatDate(performance.analysis_period_start)} ~ {formatDate(performance.analysis_period_end)}
        </p>
      </div>

      {/* 유형별 성취도 */}
      <section className="type-performance-section" data-testid="type-performance">
        <h3>유형별 성취도</h3>
        <div className="type-performance-grid">
          {Object.entries(performance.type_performance || {}).map(([type, data]) => (
            <div key={type} className="type-performance-item">
              <div className="type-name">{type}</div>
              <div className="type-accuracy">{formatPercentage(data.accuracy)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 난이도별 성취도 */}
      <section className="difficulty-performance-section" data-testid="difficulty-performance">
        <h3>난이도별 성취도</h3>
        <div className="difficulty-performance-grid">
          {Object.entries(performance.difficulty_performance || {}).map(([difficulty, data]) => (
            <div key={difficulty} className="difficulty-performance-item">
              <div className="difficulty-level">난이도 {difficulty}</div>
              <div className="difficulty-accuracy">{formatPercentage(data.accuracy)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 레벨별 성취도 추이 */}
      <section className="level-progression-section" data-testid="level-progression">
        <h3>레벨별 성취도 추이</h3>
        <div className="level-progression-grid">
          {Object.entries(performance.level_progression || {}).map(([level, data]) => (
            <div key={level} className="level-progression-item">
              <div className="level-name">{level}</div>
              <div className="level-score">평균 점수: {data.average_score.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 반복 오답 문제 */}
      {performance.repeated_mistakes && performance.repeated_mistakes.length > 0 && (
        <section className="repeated-mistakes-section" data-testid="repeated-mistakes">
          <h3>반복 오답 문제</h3>
          <p>반복적으로 틀린 문제 ID: {performance.repeated_mistakes.join(', ')}</p>
        </section>
      )}

      {/* 약점 분석 */}
      {performance.weaknesses && Object.keys(performance.weaknesses).length > 0 && (
        <section className="weaknesses-section" data-testid="weaknesses">
          <h3>약점 분석</h3>
          <div className="weaknesses-list">
            {Object.entries(performance.weaknesses).map(([area, description]) => (
              <div key={area} className="weakness-item">
                <div className="weakness-area">{area}</div>
                <div className="weakness-description">{description}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default UserPerformanceUI;

