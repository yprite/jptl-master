import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Progress } from '../atoms/Progress';
import { Badge } from '../atoms/Badge';
import './TodaysMissionUI.css';

export interface DailyMission {
  id: string;
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'test';
  title: string;
  count: number;
  estimatedMinutes: number;
  completed: boolean;
  onClick: () => void;
}

export interface TodaysMissionData {
  week: number;
  day: number;
  totalMissions: number;
  completedMissions: number;
  missions: DailyMission[];
  recoveryPlanAvailable: boolean;
}

export interface TodaysMissionUIProps {
  data: TodaysMissionData;
  onStartMission: (missionId: string) => void;
  onStartRecoveryPlan: () => void;
  onBack: () => void;
}

export const TodaysMissionUI: React.FC<TodaysMissionUIProps> = ({
  data,
  onStartMission,
  onStartRecoveryPlan,
  onBack
}) => {
  const progressPercentage = data.totalMissions > 0 
    ? (data.completedMissions / data.totalMissions) * 100 
    : 0;

  const getMissionIcon = (type: DailyMission['type']) => {
    const iconStyle = { width: 24, height: 24 };
    switch (type) {
      case 'vocabulary':
        return (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'grammar':
        return (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'reading':
        return (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'listening':
        return (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 10V11C19 15.4183 15.4183 19 11 19H10M5 10V11C5 14.866 8.13401 18 12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19V23M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'test':
        return (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className="todays-mission">
      <div className="todays-mission__header">
        <Button variant="ghost" onClick={onBack} size="sm">
          ← 뒤로가기
        </Button>
        <h1 className="todays-mission__title">
          {data.week}주차 {data.day}일차 미션
        </h1>
      </div>

      {/* Progress Overview */}
      <Card className="todays-mission__progress-card" variant="elevated" padding="lg">
        <div className="todays-mission__progress-header">
          <div>
            <h2 className="todays-mission__progress-title">오늘의 학습 진도</h2>
            <p className="todays-mission__progress-subtitle">
              {data.completedMissions} / {data.totalMissions} 완료
            </p>
          </div>
          <Badge variant="primary" size="lg">
            {Math.round(progressPercentage)}%
          </Badge>
        </div>
        <Progress
          value={progressPercentage}
          variant="primary"
          size="lg"
          showLabel={false}
        />
      </Card>

      {/* Recovery Plan Banner */}
      {data.recoveryPlanAvailable && (
        <Card className="todays-mission__recovery-banner" variant="elevated" padding="md">
          <div className="todays-mission__recovery-content">
            <div>
              <h3 className="todays-mission__recovery-title">15분 리커버리 플랜</h3>
              <p className="todays-mission__recovery-description">
                학습이 밀렸나요? 짧은 시간으로 빠르게 따라잡을 수 있는 미니 플랜을 시작하세요.
              </p>
            </div>
            <Button variant="outline" onClick={onStartRecoveryPlan}>
              리커버리 시작
            </Button>
          </div>
        </Card>
      )}

      {/* Mission List */}
      <section className="todays-mission__missions">
        <h2 className="todays-mission__section-title">오늘의 학습 미션</h2>
        <div className="todays-mission__mission-grid">
          {data.missions.map((mission) => (
            <Card
              key={mission.id}
              className={`todays-mission__mission-card ${mission.completed ? 'todays-mission__mission-card--completed' : ''}`}
              variant="elevated"
              clickable={!mission.completed}
              onClick={mission.completed ? undefined : () => onStartMission(mission.id)}
            >
              <div className="todays-mission__mission-icon">
                {getMissionIcon(mission.type)}
              </div>
              <div className="todays-mission__mission-content">
                <div className="todays-mission__mission-header">
                  <h3 className="todays-mission__mission-title">{mission.title}</h3>
                  {mission.completed && (
                    <Badge variant="success" size="sm">완료</Badge>
                  )}
                </div>
                <div className="todays-mission__mission-details">
                  <span className="todays-mission__mission-count">{mission.count}개</span>
                  <span className="todays-mission__mission-separator">•</span>
                  <span className="todays-mission__mission-time">약 {mission.estimatedMinutes}분</span>
                </div>
              </div>
              {mission.completed && (
                <div className="todays-mission__mission-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Empty State */}
      {data.missions.length === 0 && (
        <Card className="todays-mission__empty" variant="outlined" padding="lg">
          <p className="todays-mission__empty-text">
            오늘의 미션이 없습니다. 학습 계획을 확인해주세요.
          </p>
        </Card>
      )}
    </div>
  );
};

