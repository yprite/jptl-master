/**
 * UserHistory UI 컴포넌트
 * 사용자 학습 이력을 표시하는 컴포넌트
 */

import React, { useMemo } from 'react';
import { UserHistory } from '../../types/api';
import './UserHistoryUI.css';

interface UserHistoryUIProps {
  history: UserHistory[];
}

const UserHistoryUI: React.FC<UserHistoryUIProps> = ({ history }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatTime = (hour: number) => {
    return `${hour}시`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // 날짜별로 그룹화
  const historyByDate = useMemo(() => {
    const grouped: Record<string, UserHistory[]> = {};
    history.forEach((item) => {
      const date = item.study_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  }, [history]);

  // 시간대별 통계 계산
  const hourlyStats = useMemo(() => {
    const stats: Record<number, { count: number; totalAccuracy: number }> = {};
    history.forEach((item) => {
      const hour = item.study_hour;
      if (!stats[hour]) {
        stats[hour] = { count: 0, totalAccuracy: 0 };
      }
      stats[hour].count += 1;
      stats[hour].totalAccuracy += item.accuracy_percentage;
    });
    return stats;
  }, [history]);

  // 전체 통계 계산
  const overallStats = useMemo(() => {
    if (history.length === 0) {
      return {
        totalTests: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
      };
    }

    const totalTests = history.length;
    const totalQuestions = history.reduce((sum, item) => sum + item.total_questions, 0);
    const totalCorrect = history.reduce((sum, item) => sum + item.correct_count, 0);
    const totalAccuracy = history.reduce((sum, item) => sum + item.accuracy_percentage, 0);
    const averageAccuracy = totalAccuracy / totalTests;
    const totalTimeSpent = history.reduce((sum, item) => sum + item.time_spent_minutes, 0);

    return {
      totalTests,
      totalQuestions,
      totalCorrect,
      averageAccuracy,
      totalTimeSpent,
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="user-history-ui" data-testid="user-history-ui">
        <h2>학습 이력</h2>
        <p className="no-history-message">아직 학습 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="user-history-ui" data-testid="user-history-ui">
      <h2>학습 이력</h2>

      {/* 전체 통계 */}
      <section className="overall-stats-section" data-testid="overall-stats">
        <h3>전체 통계</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">총 테스트 수</div>
            <div className="stat-value">{overallStats.totalTests}회</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">총 문제 수</div>
            <div className="stat-value">{overallStats.totalQuestions}문제</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">총 정답 수</div>
            <div className="stat-value">{overallStats.totalCorrect}문제</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">평균 정확도</div>
            <div className="stat-value">{formatPercentage(overallStats.averageAccuracy)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">총 학습 시간</div>
            <div className="stat-value">{overallStats.totalTimeSpent}분</div>
          </div>
        </div>
      </section>

      {/* 시간대별 학습 패턴 */}
      {Object.keys(hourlyStats).length > 0 && (
        <section className="hourly-pattern-section" data-testid="hourly-pattern">
          <h3>시간대별 학습 패턴</h3>
          <div className="hourly-pattern-grid">
            {Object.entries(hourlyStats)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([hour, stats]) => (
                <div key={hour} className="hourly-pattern-item">
                  <div className="hour-label">{formatTime(Number(hour))}</div>
                  <div className="hour-count">{stats.count}회</div>
                  <div className="hour-accuracy">
                    평균 정확도: {formatPercentage(stats.totalAccuracy / stats.count)}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* 날짜별 학습 이력 */}
      <section className="date-history-section" data-testid="date-history">
        <h3>날짜별 학습 이력</h3>
        <div className="date-history-list">
          {Object.entries(historyByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, items]) => (
              <div key={date} className="date-history-item">
                <div className="date-header">
                  <h4>{formatDate(date)}</h4>
                  <span className="date-count">{items.length}회 학습</span>
                </div>
                <div className="date-history-details">
                  {items.map((item) => (
                    <div key={item.id} className="history-detail-item">
                      <div className="history-time">
                        {formatTime(item.study_hour)} - {item.time_spent_minutes}분
                      </div>
                      <div className="history-questions">
                        {item.correct_count}/{item.total_questions} 정답
                      </div>
                      <div className="history-accuracy">
                        정확도: {formatPercentage(item.accuracy_percentage)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default UserHistoryUI;

