/**
 * UserHistoryUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import UserHistoryUI from '../../components/organisms/UserHistoryUI';
import { UserHistory } from '../../types/api';

const mockHistory: UserHistory[] = [
  {
    id: 1,
    user_id: 1,
    test_id: 1,
    result_id: 1,
    study_date: '2025-01-04',
    study_hour: 10,
    total_questions: 20,
    correct_count: 15,
    time_spent_minutes: 30,
    accuracy_percentage: 75.0,
    created_at: '2025-01-04T10:30:00',
  },
  {
    id: 2,
    user_id: 1,
    test_id: 2,
    result_id: 2,
    study_date: '2025-01-04',
    study_hour: 14,
    total_questions: 20,
    correct_count: 18,
    time_spent_minutes: 25,
    accuracy_percentage: 90.0,
    created_at: '2025-01-04T14:30:00',
  },
  {
    id: 3,
    user_id: 1,
    test_id: 3,
    result_id: 3,
    study_date: '2025-01-05',
    study_hour: 9,
    total_questions: 20,
    correct_count: 16,
    time_spent_minutes: 35,
    accuracy_percentage: 80.0,
    created_at: '2025-01-05T09:00:00',
  },
];

describe('UserHistoryUI', () => {
  it('should render history title', () => {
    render(<UserHistoryUI history={mockHistory} />);
    expect(screen.getByText('학습 이력')).toBeInTheDocument();
  });

  it('should render overall stats section', () => {
    render(<UserHistoryUI history={mockHistory} />);
    expect(screen.getByText('전체 통계')).toBeInTheDocument();
    const overallStatsSection = screen.getByTestId('overall-stats');
    expect(overallStatsSection).toBeInTheDocument();
    expect(screen.getByText('총 테스트 수')).toBeInTheDocument();
    expect(screen.getByText('3회')).toBeInTheDocument();
    expect(screen.getByText('총 문제 수')).toBeInTheDocument();
    expect(screen.getByText('60문제')).toBeInTheDocument();
    expect(screen.getByText('총 정답 수')).toBeInTheDocument();
    expect(screen.getByText('49문제')).toBeInTheDocument();
    expect(screen.getByText('평균 정확도')).toBeInTheDocument();
    expect(screen.getByText('총 학습 시간')).toBeInTheDocument();
    expect(screen.getByText('90분')).toBeInTheDocument();
  });

  it('should render hourly pattern section', () => {
    render(<UserHistoryUI history={mockHistory} />);
    expect(screen.getByText('시간대별 학습 패턴')).toBeInTheDocument();
    const hourlyPatternSection = screen.getByTestId('hourly-pattern');
    expect(hourlyPatternSection).toBeInTheDocument();
    expect(screen.getByText('9시')).toBeInTheDocument();
    expect(screen.getByText('10시')).toBeInTheDocument();
    expect(screen.getByText('14시')).toBeInTheDocument();
  });

  it('should render date history section', () => {
    render(<UserHistoryUI history={mockHistory} />);
    expect(screen.getByText('날짜별 학습 이력')).toBeInTheDocument();
    const dateHistorySection = screen.getByTestId('date-history');
    expect(dateHistorySection).toBeInTheDocument();
  });

  it('should display no history message when history is empty', () => {
    render(<UserHistoryUI history={[]} />);
    expect(screen.getByText('학습 이력')).toBeInTheDocument();
    expect(screen.getByText('아직 학습 이력이 없습니다.')).toBeInTheDocument();
  });

  it('should calculate average accuracy correctly', () => {
    render(<UserHistoryUI history={mockHistory} />);
    // 평균 정확도: (75.0 + 90.0 + 80.0) / 3 = 81.67%
    expect(screen.getByText(/81\.7%/)).toBeInTheDocument();
  });

  it('should group history by date', () => {
    render(<UserHistoryUI history={mockHistory} />);
    // 2025-01-04에 2개, 2025-01-05에 1개
    expect(screen.getByText(/2회 학습/)).toBeInTheDocument();
  });

  it('should display history details correctly', () => {
    render(<UserHistoryUI history={mockHistory} />);
    expect(screen.getByText(/15\/20 정답/)).toBeInTheDocument();
    expect(screen.getByText(/18\/20 정답/)).toBeInTheDocument();
    expect(screen.getByText(/16\/20 정답/)).toBeInTheDocument();
    expect(screen.getByText(/정확도: 75\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/정확도: 90\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/정확도: 80\.0%/)).toBeInTheDocument();
  });

  it('should handle single history item', () => {
    const singleHistory: UserHistory[] = [mockHistory[0]];
    render(<UserHistoryUI history={singleHistory} />);
    expect(screen.getByText('총 테스트 수')).toBeInTheDocument();
    const overallStatsSection = screen.getByTestId('overall-stats');
    expect(overallStatsSection).toHaveTextContent('1회');
    expect(overallStatsSection).toHaveTextContent('20문제');
    expect(overallStatsSection).toHaveTextContent('15문제');
  });
});

