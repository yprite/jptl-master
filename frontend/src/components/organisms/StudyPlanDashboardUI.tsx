/**
 * 6주 학습 계획 대시보드 컴포넌트
 * 로그인 후 메인 화면으로 표시되는 학습 계획 대시보드
 */

import React, { useState, useEffect } from 'react';
import { StudyPlan, WeekPlan, DailyTask } from '../../types/study-plan';
import { n5StudyPlan } from '../../data/study-plan-data';
import './StudyPlanDashboardUI.css';

interface StudyPlanDashboardUIProps {
  onStartStudy: (day: number, week: number) => void;
  onViewDayDetail: (day: number, week: number) => void;
}

const StudyPlanDashboardUI: React.FC<StudyPlanDashboardUIProps> = ({
  onStartStudy,
  onViewDayDetail,
}) => {
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(() => {
    // 로컬 스토리지에서 완료 상태 불러오기
    const plan = { ...n5StudyPlan };
    plan.weeks.forEach(week => {
      week.dailyTasks.forEach(task => {
        const saved = localStorage.getItem(`studyPlan_day${task.day}_completed`);
        if (saved === 'true') {
          task.completed = true;
        }
      });
    });
    return plan;
  });
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  // 로컬 스토리지에서 진행 상태 불러오기
  useEffect(() => {
    const savedDay = localStorage.getItem('studyPlan_currentDay');
    const savedWeek = localStorage.getItem('studyPlan_currentWeek');
    
    if (savedDay) {
      const day = parseInt(savedDay, 10);
      setCurrentDay(day);
      // 해당 날짜의 주차 계산
      const week = Math.ceil(day / 7);
      setCurrentWeek(week);
      setExpandedWeek(week);
    } else if (savedWeek) {
      const week = parseInt(savedWeek, 10);
      setCurrentWeek(week);
      setExpandedWeek(week);
    }

    // 완료 상태 업데이트를 위한 리스너
    const handleStorageChange = () => {
      const updatedPlan = { ...n5StudyPlan };
      updatedPlan.weeks.forEach(week => {
        week.dailyTasks.forEach(task => {
          const saved = localStorage.getItem(`studyPlan_day${task.day}_completed`);
          task.completed = saved === 'true';
        });
      });
      setStudyPlan(updatedPlan);
    };

    window.addEventListener('storage', handleStorageChange);
    // 같은 탭에서의 변경도 감지하기 위해 주기적으로 확인
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleWeekClick = (week: number) => {
    setExpandedWeek(expandedWeek === week ? null : week);
  };

  const handleDayClick = (day: number, week: number) => {
    onViewDayDetail(day, week);
  };

  const handleStartToday = () => {
    onStartStudy(currentDay, currentWeek);
  };

  const getProgressPercentage = (week: WeekPlan): number => {
    const completedDays = week.dailyTasks.filter(task => task.completed).length;
    return Math.round((completedDays / week.dailyTasks.length) * 100);
  };

  const getOverallProgress = (): number => {
    const totalDays = studyPlan.weeks.reduce((sum, week) => sum + week.dailyTasks.length, 0);
    const completedDays = studyPlan.weeks.reduce(
      (sum, week) => sum + week.dailyTasks.filter(task => task.completed).length,
      0
    );
    return Math.round((completedDays / totalDays) * 100);
  };

  return (
    <div className="study-plan-dashboard">
      <div className="dashboard-header">
        <h2>📘 JLPT N5 합격을 위한 6주 학습 계획</h2>
        <div className="overall-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
          <span className="progress-text">전체 진행률: {getOverallProgress()}%</span>
        </div>
      </div>

      <div className="today-section">
        <div className="today-card">
          <h3>오늘의 학습 (Day {currentDay})</h3>
          <p className="week-info">{currentWeek}주차: {studyPlan.weeks[currentWeek - 1]?.title}</p>
          <button 
            className="start-today-button"
            onClick={handleStartToday}
          >
            오늘 학습 시작하기
          </button>
        </div>
      </div>

      <div className="weeks-section">
        <h3>주차별 학습 계획</h3>
        {studyPlan.weeks.map((week) => (
          <div 
            key={week.week} 
            className={`week-card ${expandedWeek === week.week ? 'expanded' : ''} ${currentWeek === week.week ? 'current' : ''}`}
          >
            <div 
              className="week-header"
              onClick={() => handleWeekClick(week.week)}
            >
              <div className="week-title-section">
                <span className="week-number">{week.week}주차</span>
                <span className="week-title">{week.title}</span>
                <span className="week-progress">{getProgressPercentage(week)}%</span>
              </div>
              <span className="expand-icon">{expandedWeek === week.week ? '▼' : '▶'}</span>
            </div>

            {expandedWeek === week.week && (
              <div className="week-content">
                <div className="learning-goals">
                  <h4>학습 목표</h4>
                  <ul>
                    {week.learningGoals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>

                <div className="study-methods">
                  <div className="method-section">
                    <h4>문법</h4>
                    <ul>
                      {week.studyMethods.grammar.map((method, index) => (
                        <li key={index}>{method}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="method-section">
                    <h4>단어</h4>
                    <ul>
                      {week.studyMethods.vocabulary.map((method, index) => (
                        <li key={index}>{method}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="method-section">
                    <h4>연습</h4>
                    <ul>
                      {week.studyMethods.practice.map((method, index) => (
                        <li key={index}>{method}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="key-point">
                  <strong>이 주차 포인트:</strong> {week.keyPoint}
                </div>

                <div className="daily-tasks">
                  <h4>일일 체크리스트</h4>
                  <div className="tasks-grid">
                    {week.dailyTasks.map((task) => (
                      <div 
                        key={task.day}
                        className={`task-item ${task.completed ? 'completed' : ''} ${task.day === currentDay ? 'today' : ''}`}
                        onClick={() => handleDayClick(task.day, task.week)}
                      >
                        <div className="task-day">Day {task.day}</div>
                        <div className="task-content">
                          <div>단어 {task.tasks.vocabulary}개</div>
                          <div>문법 {task.tasks.grammar}개</div>
                          {task.tasks.reading && <div>독해 {task.tasks.reading}문제</div>}
                          {task.tasks.listening && <div>청해 {task.tasks.listening}문제</div>}
                        </div>
                        {task.completed && <span className="check-icon">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="minimum-study-section">
        <h3>⏱️ 하루 최소 학습 공식 (바쁠 때)</h3>
        <ul>
          <li>단어 20개</li>
          <li>문법 2개</li>
          <li>독해 or 청해 5문제</li>
        </ul>
        <p className="note">👉 이것만 지켜도 N5 합격선 유지</p>
      </div>
    </div>
  );
};

export default StudyPlanDashboardUI;

