/**
 * 어드민 대시보드 UI 컴포넌트
 * 통계 데이터를 시각화하여 표시
 */

import React, { useState, useEffect } from 'react';
import { AdminStatistics } from '../../types/api';
import { adminApi, ApiError } from '../../services/api';
import './AdminDashboardUI.css';

interface AdminDashboardUIProps {
  onBack?: () => void;
}

const AdminDashboardUI: React.FC<AdminDashboardUIProps> = ({ onBack }) => {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await adminApi.getStatistics();
      setStatistics(stats);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h2>어드민 대시보드</h2>
          {onBack && <button onClick={onBack}>뒤로</button>}
        </div>
        <div className="admin-dashboard-loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h2>어드민 대시보드</h2>
          {onBack && <button onClick={onBack}>뒤로</button>}
        </div>
        <div className="admin-dashboard-error">
          <p>오류: {error}</p>
          <button onClick={loadStatistics}>다시 시도</button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h2>어드민 대시보드</h2>
          {onBack && <button onClick={onBack}>뒤로</button>}
        </div>
        <div className="admin-dashboard-empty">통계 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h2>어드민 대시보드</h2>
        {onBack && <button onClick={onBack}>뒤로</button>}
      </div>

      <div className="admin-dashboard-content">
        {/* 사용자 통계 */}
        <div className="admin-dashboard-section">
          <h3>사용자 통계</h3>
          <div className="admin-dashboard-stats-grid">
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">전체 사용자</div>
              <div className="admin-dashboard-stat-value">{statistics.users.total_users}</div>
            </div>
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">활성 사용자</div>
              <div className="admin-dashboard-stat-value">{statistics.users.active_users}</div>
            </div>
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">비활성 사용자</div>
              <div className="admin-dashboard-stat-value">
                {statistics.users.total_users - statistics.users.active_users}
              </div>
            </div>
          </div>
        </div>

        {/* 테스트 통계 */}
        <div className="admin-dashboard-section">
          <h3>테스트 통계</h3>
          <div className="admin-dashboard-stats-grid">
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">전체 테스트 수</div>
              <div className="admin-dashboard-stat-value">{statistics.tests.total_tests}</div>
            </div>
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">평균 점수</div>
              <div className="admin-dashboard-stat-value">
                {statistics.tests.average_score.toFixed(1)}점
              </div>
            </div>
          </div>
        </div>

        {/* 문제 통계 */}
        <div className="admin-dashboard-section">
          <h3>문제 통계</h3>
          <div className="admin-dashboard-stats-grid">
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">전체 문제 수</div>
              <div className="admin-dashboard-stat-value">{statistics.questions.total_questions}</div>
            </div>
          </div>
          <div className="admin-dashboard-level-stats">
            <h4>레벨별 문제 수</h4>
            <div className="admin-dashboard-level-grid">
              {Object.entries(statistics.questions.by_level).map(([level, count]) => (
                <div key={level} className="admin-dashboard-level-item">
                  <span className="admin-dashboard-level-label">{level}</span>
                  <span className="admin-dashboard-level-value">{count}개</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 학습 데이터 통계 */}
        <div className="admin-dashboard-section">
          <h3>학습 데이터 통계</h3>
          <div className="admin-dashboard-stats-grid">
            <div className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-label">전체 결과 수</div>
              <div className="admin-dashboard-stat-value">
                {statistics.learning_data.total_results}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-footer">
        <button onClick={loadStatistics}>새로고침</button>
      </div>
    </div>
  );
};

export default AdminDashboardUI;

