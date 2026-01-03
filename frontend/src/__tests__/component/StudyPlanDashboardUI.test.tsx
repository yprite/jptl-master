/**
 * StudyPlanDashboardUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudyPlanDashboardUI from '../../components/organisms/StudyPlanDashboardUI';

// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StudyPlanDashboardUI', () => {
  const mockOnStartStudy = jest.fn();
  const mockOnViewDayDetail = jest.fn();

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should render the study plan dashboard', () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    expect(screen.getByText(/JLPT N5 합격을 위한 6주 학습 계획/i)).toBeInTheDocument();
    expect(screen.getByText(/오늘의 학습/i)).toBeInTheDocument();
  });

  it('should display overall progress', () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    expect(screen.getByText(/전체 진행률/i)).toBeInTheDocument();
  });

  it('should expand and collapse week cards', async () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    // week-header 내부의 week-number를 찾기 위해 getAllByText 사용
    const weekNumbers = screen.getAllByText(/1주차/i);
    const weekHeader = weekNumbers.find(el => 
      el.classList.contains('week-number')
    )?.closest('.week-header');
    
    expect(weekHeader).toBeInTheDocument();

    if (weekHeader) {
      // 이미 확장되어 있을 수 있으므로, 먼저 접기
      const isExpanded = weekHeader.closest('.week-card')?.classList.contains('expanded');
      if (isExpanded) {
        fireEvent.click(weekHeader);
        await waitFor(() => {
          expect(screen.queryByText(/학습 목표/i)).not.toBeInTheDocument();
        });
      }
      
      // 다시 확장
      fireEvent.click(weekHeader);
      
      // 주차 내용이 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByText(/학습 목표/i)).toBeInTheDocument();
      });
    }
  });

  it('should call onStartStudy when clicking start today button', () => {
    localStorageMock.setItem('studyPlan_currentDay', '1');
    localStorageMock.setItem('studyPlan_currentWeek', '1');

    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    const startButton = screen.getByText(/오늘 학습 시작하기/i);
    fireEvent.click(startButton);

    expect(mockOnStartStudy).toHaveBeenCalledWith(1, 1);
  });

  it('should call onViewDayDetail when clicking a daily task', async () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    // 주차 확장 - week-header 내부의 week-number를 찾기 위해 getAllByText 사용
    const weekNumbers = screen.getAllByText(/1주차/i);
    const weekHeader = weekNumbers.find(el => 
      el.classList.contains('week-number')
    )?.closest('.week-header');
    
    // 이미 확장되어 있을 수 있으므로, 확장 상태 확인
    const weekCard = weekHeader?.closest('.week-card');
    const isExpanded = weekCard?.classList.contains('expanded');
    
    if (weekHeader && !isExpanded) {
      fireEvent.click(weekHeader);
    }

    // task-item 내부의 Day 1 찾기 - 주차가 확장될 때까지 대기
    let dayTask: HTMLElement | undefined;
    await waitFor(() => {
      const dayTasks = screen.getAllByText(/Day 1/i);
      dayTask = dayTasks.find(el => 
        el.closest('.task-item') !== null
      );
      expect(dayTask).toBeInTheDocument();
    }, { timeout: 3000 });

    if (dayTask) {
      const taskItem = dayTask.closest('.task-item');
      if (taskItem) {
        fireEvent.click(taskItem);
        await waitFor(() => {
          expect(mockOnViewDayDetail).toHaveBeenCalled();
        });
      }
    }
  });

  it('should display minimum study formula', () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    expect(screen.getByText(/하루 최소 학습 공식/i)).toBeInTheDocument();
    // li 태그 내의 "단어 20개" 찾기
    const vocabularyItems = screen.getAllByText(/단어 20개/i);
    expect(vocabularyItems.length).toBeGreaterThan(0);
    // li 태그 내의 "문법 2개" 찾기
    const grammarItems = screen.getAllByText(/문법 2개/i);
    expect(grammarItems.length).toBeGreaterThan(0);
  });

  it('should load saved progress from localStorage', () => {
    localStorageMock.setItem('studyPlan_currentDay', '5');
    localStorageMock.setItem('studyPlan_currentWeek', '1');

    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    // "오늘의 학습" 섹션의 Day 5 찾기
    expect(screen.getByText(/오늘의 학습 \(Day 5\)/i)).toBeInTheDocument();
  });
});

