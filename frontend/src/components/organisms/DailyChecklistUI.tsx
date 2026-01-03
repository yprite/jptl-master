/**
 * 일일 체크리스트 컴포넌트
 * 특정 날짜의 상세 학습 체크리스트
 */

import React, { useState, useEffect } from 'react';
import { DailyTask } from '../../types/study-plan';
import { n5StudyPlan } from '../../data/study-plan-data';
import './DailyChecklistUI.css';

interface DailyChecklistUIProps {
  day: number;
  week: number;
  onStartStudy: (taskType: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'mockTest') => void;
  onBack: () => void;
}

const DailyChecklistUI: React.FC<DailyChecklistUIProps> = ({
  day,
  week,
  onStartStudy,
  onBack,
}) => {
  const [dailyTask, setDailyTask] = useState<DailyTask | null>(null);
  const [completedTasks, setCompletedTasks] = useState<{
    vocabulary: boolean;
    grammar: boolean;
    reading?: boolean;
    listening?: boolean;
    mockTest?: boolean;
  }>({
    vocabulary: false,
    grammar: false,
  });

  useEffect(() => {
    // 해당 주차와 날짜의 태스크 찾기
    const weekPlan = n5StudyPlan.weeks.find(w => w.week === week);
    if (weekPlan) {
      const task = weekPlan.dailyTasks.find(t => t.day === day);
      if (task) {
        setDailyTask(task);
        
        // 로컬 스토리지에서 완료 상태 불러오기
        const saved = localStorage.getItem(`studyPlan_day${day}_completed`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCompletedTasks(parsed);
          } catch (e) {
            // 파싱 실패 시 기본값 유지
          }
        }
      }
    }
  }, [day, week]);

  const handleTaskComplete = (taskType: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'mockTest') => {
    setCompletedTasks(prev => {
      const updated = { ...prev, [taskType]: !prev[taskType] };
      
      // 로컬 스토리지에 저장
      localStorage.setItem(`studyPlan_day${day}_completed`, JSON.stringify(updated));
      
      // 전체 태스크 완료 여부 확인
      const allCompleted = updated.vocabulary && updated.grammar && 
        (!dailyTask?.tasks.reading || updated.reading) &&
        (!dailyTask?.tasks.listening || updated.listening) &&
        (!dailyTask?.tasks.mockTest || updated.mockTest);
      
      if (allCompleted && dailyTask) {
        // 태스크 완료 처리
        dailyTask.completed = true;
        localStorage.setItem(`studyPlan_day${day}_completed`, 'true');
        
        // 현재 날짜 저장
        localStorage.setItem('studyPlan_currentDay', day.toString());
        const week = Math.ceil(day / 7);
        localStorage.setItem('studyPlan_currentWeek', week.toString());
      }
      
      return updated;
    });
  };

  if (!dailyTask) {
    return (
      <div className="daily-checklist">
        <div className="error-message">
          <p>해당 날짜의 학습 계획을 찾을 수 없습니다.</p>
          <button onClick={onBack} className="back-button">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const weekPlan = n5StudyPlan.weeks.find(w => w.week === week);
  const allCompleted = completedTasks.vocabulary && completedTasks.grammar &&
    (!dailyTask.tasks.reading || completedTasks.reading) &&
    (!dailyTask.tasks.listening || completedTasks.listening) &&
    (!dailyTask.tasks.mockTest || completedTasks.mockTest);

  return (
    <div className="daily-checklist">
      <div className="checklist-header">
        <button onClick={onBack} className="back-button">
          ← 돌아가기
        </button>
        <h2>Day {day} 학습 체크리스트</h2>
        <p className="week-info">{week}주차: {weekPlan?.title}</p>
      </div>

      <div className="checklist-content">
        <div className="task-card">
          <div className="task-header">
            <h3>📚 단어 학습</h3>
            <span className="task-count">{dailyTask.tasks.vocabulary}개</span>
          </div>
          <div className="task-actions">
            <button
              className={`task-button ${completedTasks.vocabulary ? 'completed' : ''}`}
              onClick={() => onStartStudy('vocabulary')}
            >
              단어 학습 시작
            </button>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={completedTasks.vocabulary}
                onChange={() => handleTaskComplete('vocabulary')}
              />
              <span>완료</span>
            </label>
          </div>
        </div>

        <div className="task-card">
          <div className="task-header">
            <h3>📖 문법 학습</h3>
            <span className="task-count">{dailyTask.tasks.grammar}개</span>
          </div>
          <div className="task-actions">
            <button
              className={`task-button ${completedTasks.grammar ? 'completed' : ''}`}
              onClick={() => onStartStudy('grammar')}
            >
              문법 학습 시작
            </button>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={completedTasks.grammar}
                onChange={() => handleTaskComplete('grammar')}
              />
              <span>완료</span>
            </label>
          </div>
        </div>

        {dailyTask.tasks.reading && (
          <div className="task-card">
            <div className="task-header">
              <h3>📄 독해 연습</h3>
              <span className="task-count">{dailyTask.tasks.reading}문제</span>
            </div>
            <div className="task-actions">
              <button
                className={`task-button ${completedTasks.reading ? 'completed' : ''}`}
                onClick={() => onStartStudy('reading')}
              >
                독해 연습 시작
              </button>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={completedTasks.reading || false}
                  onChange={() => handleTaskComplete('reading')}
                />
                <span>완료</span>
              </label>
            </div>
          </div>
        )}

        {dailyTask.tasks.listening && (
          <div className="task-card">
            <div className="task-header">
              <h3>🎧 청해 연습</h3>
              <span className="task-count">{dailyTask.tasks.listening}문제</span>
            </div>
            <div className="task-actions">
              <button
                className={`task-button ${completedTasks.listening ? 'completed' : ''}`}
                onClick={() => onStartStudy('listening')}
              >
                청해 연습 시작
              </button>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={completedTasks.listening || false}
                  onChange={() => handleTaskComplete('listening')}
                />
                <span>완료</span>
              </label>
            </div>
          </div>
        )}

        {dailyTask.tasks.mockTest && (
          <div className="task-card">
            <div className="task-header">
              <h3>📝 모의고사</h3>
              <span className="task-count">{dailyTask.tasks.mockTest}회</span>
            </div>
            <div className="task-actions">
              <button
                className={`task-button ${completedTasks.mockTest ? 'completed' : ''}`}
                onClick={() => onStartStudy('mockTest')}
              >
                모의고사 시작
              </button>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={completedTasks.mockTest || false}
                  onChange={() => handleTaskComplete('mockTest')}
                />
                <span>완료</span>
              </label>
            </div>
          </div>
        )}

        {allCompleted && (
          <div className="completion-message">
            <div className="completion-icon">🎉</div>
            <h3>오늘의 학습을 모두 완료했습니다!</h3>
            <p>훌륭합니다. 내일도 화이팅!</p>
          </div>
        )}
      </div>

      <div className="study-tips">
        <h3>💡 학습 팁</h3>
        <ul>
          {weekPlan && weekPlan.studyMethods.grammar.length > 0 && (
            <li>문법: {weekPlan.studyMethods.grammar[0]}</li>
          )}
          {weekPlan && weekPlan.studyMethods.vocabulary.length > 0 && (
            <li>단어: {weekPlan.studyMethods.vocabulary[0]}</li>
          )}
          {weekPlan && weekPlan.studyMethods.practice.length > 0 && (
            <li>연습: {weekPlan.studyMethods.practice[0]}</li>
          )}
        </ul>
        <div className="key-point">
          <strong>이 주차 포인트:</strong> {weekPlan?.keyPoint}
        </div>
      </div>
    </div>
  );
};

export default DailyChecklistUI;

