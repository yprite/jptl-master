/**
 * DailyChecklistUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyChecklistUI from '../../components/organisms/DailyChecklistUI';

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

describe('DailyChecklistUI', () => {
  const mockOnStartStudy = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should render the daily checklist for day 1', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/Day 1 학습 체크리스트/i)).toBeInTheDocument();
    expect(screen.getByText(/1주차/i)).toBeInTheDocument();
  });

  it('should display vocabulary task', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    // h3 태그 내의 "단어 학습" 찾기
    expect(screen.getByRole('heading', { name: /단어 학습/i })).toBeInTheDocument();
    // task-count 클래스를 가진 요소에서 "20개" 찾기
    const taskCounts = screen.getAllByText(/20개/i);
    const vocabularyCount = taskCounts.find(el => 
      el.classList.contains('task-count') && 
      el.closest('.task-card')?.querySelector('h3')?.textContent?.includes('단어')
    );
    expect(vocabularyCount).toBeInTheDocument();
  });

  it('should display grammar task', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    // h3 태그 내의 "문법 학습" 찾기
    expect(screen.getByRole('heading', { name: /문법 학습/i })).toBeInTheDocument();
  });

  it('should display reading task for week 4', () => {
    render(
      <DailyChecklistUI
        day={22}
        week={4}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    // h3 태그 내의 "독해 연습" 찾기
    expect(screen.getByRole('heading', { name: /독해 연습/i })).toBeInTheDocument();
  });

  it('should display listening task for week 5', () => {
    render(
      <DailyChecklistUI
        day={29}
        week={5}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    // h3 태그 내의 "청해 연습" 찾기
    expect(screen.getByRole('heading', { name: /청해 연습/i })).toBeInTheDocument();
  });

  it('should call onStartStudy when clicking vocabulary button', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    const vocabularyButton = screen.getByText(/단어 학습 시작/i);
    fireEvent.click(vocabularyButton);

    expect(mockOnStartStudy).toHaveBeenCalledWith('vocabulary', 20);
  });

  it('should call onStartStudy when clicking grammar button', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    const grammarButton = screen.getByText(/문법 학습 시작/i);
    fireEvent.click(grammarButton);

    expect(mockOnStartStudy).toHaveBeenCalledWith('grammar', 2);
  });

  it('should call onBack when clicking back button', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByText(/돌아가기/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should toggle task completion when clicking checkbox', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const vocabularyCheckbox = checkboxes.find(cb => 
      cb.closest('label')?.textContent?.includes('완료')
    );

    if (vocabularyCheckbox) {
      fireEvent.click(vocabularyCheckbox);
      expect(vocabularyCheckbox).toBeChecked();
    }
  });

  it('should show completion message when all tasks are completed', async () => {
    localStorageMock.setItem(
      'studyPlan_day1_completed',
      JSON.stringify({
        vocabulary: true,
        grammar: true,
      })
    );

    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/오늘의 학습을 모두 완료했습니다/i)).toBeInTheDocument();
    });
  });

  it('should display study tips', () => {
    render(
      <DailyChecklistUI
        day={1}
        week={1}
        onStartStudy={mockOnStartStudy}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/학습 팁/i)).toBeInTheDocument();
    expect(screen.getByText(/이 주차 포인트/i)).toBeInTheDocument();
  });
});

