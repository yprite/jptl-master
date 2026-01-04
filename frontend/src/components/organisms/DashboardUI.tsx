import React from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Progress } from '../atoms/Progress';
import { Badge } from '../atoms/Badge';
import './DashboardUI.css';

export interface KPIData {
  recentScore?: number;
  streakDays: number;
  totalStudyCount: number;
  weeklyStudyTime: number;
  weeklyGoalMinutes: number;
  weeklyGoalAchievement: number; // 0-100
}

export interface DashboardAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  badge?: number;
}

export interface DashboardUIProps {
  kpiData: KPIData;
  actions: DashboardAction[];
  onStartStudy: () => void;
}

export const DashboardUI: React.FC<DashboardUIProps> = ({
  kpiData,
  actions,
  onStartStudy
}) => {
  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <section className="dashboard__kpi-section">
        <h2 className="dashboard__section-title">학습 현황</h2>
        <div className="dashboard__kpi-grid">
          <Card className="dashboard__kpi-card" variant="elevated">
            <div className="dashboard__kpi-icon dashboard__kpi-icon--score">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dashboard__kpi-content">
              <p className="dashboard__kpi-label">최근 점수</p>
              <p className="dashboard__kpi-value">
                {kpiData.recentScore !== undefined ? `${kpiData.recentScore}점` : 'N/A'}
              </p>
            </div>
          </Card>

          <Card className="dashboard__kpi-card" variant="elevated">
            <div className="dashboard__kpi-icon dashboard__kpi-icon--streak">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="dashboard__kpi-content">
              <p className="dashboard__kpi-label">연속 학습</p>
              <p className="dashboard__kpi-value">{kpiData.streakDays}일</p>
            </div>
          </Card>

          <Card className="dashboard__kpi-card" variant="elevated">
            <div className="dashboard__kpi-icon dashboard__kpi-icon--study">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 6.253V13.5L15.5 15.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dashboard__kpi-content">
              <p className="dashboard__kpi-label">누적 학습량</p>
              <p className="dashboard__kpi-value">{kpiData.totalStudyCount}개</p>
            </div>
          </Card>

          <Card className="dashboard__kpi-card" variant="elevated">
            <div className="dashboard__kpi-icon dashboard__kpi-icon--time">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 6V12L16 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="dashboard__kpi-content">
              <p className="dashboard__kpi-label">주간 학습 시간</p>
              <p className="dashboard__kpi-value">{kpiData.weeklyStudyTime}분</p>
              <div className="dashboard__kpi-progress">
                <Progress
                  value={kpiData.weeklyGoalAchievement}
                  variant="primary"
                  size="sm"
                />
                <span className="dashboard__kpi-progress-text">
                  목표 달성률 {kpiData.weeklyGoalAchievement}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Action Grid */}
      <section className="dashboard__actions-section">
        <h2 className="dashboard__section-title">오늘의 학습 모드</h2>
        <div className="dashboard__actions-grid">
          {actions.map((action) => (
            <Card
              key={action.id}
              className="dashboard__action-card"
              variant="elevated"
              clickable
              onClick={action.onClick}
            >
              {action.icon && (
                <div className="dashboard__action-icon">{action.icon}</div>
              )}
              <div className="dashboard__action-content">
                <h3 className="dashboard__action-title">
                  {action.title}
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge variant="danger" size="sm">{action.badge}</Badge>
                  )}
                </h3>
                {action.description && (
                  <p className="dashboard__action-description">{action.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="dashboard__cta-section">
        <Card className="dashboard__cta-banner" variant="elevated" padding="lg">
          <div className="dashboard__cta-content">
            <h2 className="dashboard__cta-title">지금 공부를 시작하세요!</h2>
            <p className="dashboard__cta-description">
              오늘의 미션을 완료하고 학습 목표를 달성해보세요.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={onStartStudy}
            >
              학습 시작하기
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

