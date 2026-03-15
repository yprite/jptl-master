/**
 * 일일 학습 목표 UI 컴포넌트
 * 일일 학습 목표 설정 및 달성률 시각화
 */

import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/api';
import { DailyGoalWithStatistics } from '../../types/api';
import './DailyGoalUI.css';

interface DailyGoalUIProps {
  userId: number;
}

const DailyGoalUI: React.FC<DailyGoalUIProps> = ({ userId }) => {
  const [goalData, setGoalData] = useState<DailyGoalWithStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [targetQuestions, setTargetQuestions] = useState(10);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDailyGoal();
  }, [userId]);

  const loadDailyGoal = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getDailyGoal(userId);
      setGoalData(data);
      setTargetQuestions(data.goal.target_questions);
      setTargetMinutes(data.goal.target_minutes);
    } catch (err: any) {
      setError(err.message || '일일 목표를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await userApi.updateDailyGoal(userId, {
        target_questions: targetQuestions,
        target_minutes: targetMinutes,
      });
      setIsEditing(false);
      await loadDailyGoal();
    } catch (err: any) {
      setError(err.message || '목표 설정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (goalData) {
      setTargetQuestions(goalData.goal.target_questions);
      setTargetMinutes(goalData.goal.target_minutes);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="daily-goal-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error && !goalData) {
    return (
      <div className="daily-goal-container">
        <div className="error">{error}</div>
        <button onClick={loadDailyGoal}>다시 시도</button>
      </div>
    );
  }

  if (!goalData) {
    return null;
  }

  const { goal, statistics, achievement } = goalData;

  return (
    <div className="daily-goal-container">
      <div className="daily-goal-header">
        <h2>일일 학습 목표</h2>
        {!isEditing && (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            목표 수정
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {isEditing ? (
        <div className="daily-goal-edit">
          <div className="form-group">
            <label htmlFor="target-questions">목표 문제 수</label>
            <input
              id="target-questions"
              type="number"
              min="0"
              value={targetQuestions}
              onChange={(e) => setTargetQuestions(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="target-minutes">목표 학습 시간 (분)</label>
            <input
              id="target-minutes"
              type="number"
              min="0"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="form-actions">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              className="cancel-button"
              onClick={handleCancel}
              disabled={saving}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="daily-goal-stats">
            <div className="stat-card">
              <div className="stat-label">목표 문제 수</div>
              <div className="stat-value">{goal.target_questions}개</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">목표 학습 시간</div>
              <div className="stat-value">{goal.target_minutes}분</div>
            </div>
          </div>

          <div className="daily-progress">
            <h3>오늘의 학습 현황</h3>
            
            <div className="progress-section">
              <div className="progress-header">
                <span>문제 수</span>
                <span>
                  {statistics.total_questions} / {goal.target_questions}개
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min(achievement.questions_achievement_rate, 100)}%`,
                    backgroundColor: achievement.is_questions_achieved
                      ? '#4caf50'
                      : '#2196f3',
                  }}
                />
              </div>
              <div className="progress-percentage">
                {achievement.questions_achievement_rate.toFixed(1)}%
                {achievement.is_questions_achieved && ' ✓'}
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>학습 시간</span>
                <span>
                  {statistics.total_minutes} / {goal.target_minutes}분
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min(achievement.minutes_achievement_rate, 100)}%`,
                    backgroundColor: achievement.is_minutes_achieved
                      ? '#4caf50'
                      : '#2196f3',
                  }}
                />
              </div>
              <div className="progress-percentage">
                {achievement.minutes_achievement_rate.toFixed(1)}%
                {achievement.is_minutes_achieved && ' ✓'}
              </div>
            </div>

            <div className="overall-progress">
              <div className="overall-label">전체 달성률</div>
              <div className="overall-value">
                {achievement.overall_achievement_rate.toFixed(1)}%
              </div>
              {achievement.is_fully_achieved && (
                <div className="achievement-badge">🎉 목표 달성!</div>
              )}
            </div>

            <div className="additional-stats">
              <div className="additional-stat">
                <span className="stat-label">학습 세션</span>
                <span className="stat-value">{statistics.study_sessions}회</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyGoalUI;

