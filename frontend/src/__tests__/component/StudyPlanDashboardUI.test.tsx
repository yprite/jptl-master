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

  it('should expand and collapse week cards', () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    const weekHeader = screen.getByText(/1주차/i).closest('.week-header');
    expect(weekHeader).toBeInTheDocument();

    if (weekHeader) {
      fireEvent.click(weekHeader);
      
      // 주차 내용이 표시되는지 확인
      waitFor(() => {
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

  it('should call onViewDayDetail when clicking a daily task', () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    // 주차 확장
    const weekHeader = screen.getByText(/1주차/i).closest('.week-header');
    if (weekHeader) {
      fireEvent.click(weekHeader);
    }

    waitFor(() => {
      const dayTask = screen.getByText(/Day 1/i);
      if (dayTask) {
        fireEvent.click(dayTask);
        expect(mockOnViewDayDetail).toHaveBeenCalled();
      }
    });
  });

  it('should display minimum study formula', () => {
    render(
      <StudyPlanDashboardUI
        onStartStudy={mockOnStartStudy}
        onViewDayDetail={mockOnViewDayDetail}
      />
    );

    expect(screen.getByText(/하루 최소 학습 공식/i)).toBeInTheDocument();
    expect(screen.getByText(/단어 20개/i)).toBeInTheDocument();
    expect(screen.getByText(/문법 2개/i)).toBeInTheDocument();
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

    expect(screen.getByText(/Day 5/i)).toBeInTheDocument();
  });
});

