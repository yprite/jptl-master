/**
 * UserPerformanceUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPerformanceUI from '../../components/organisms/UserPerformanceUI';
import { UserPerformance } from '../../types/api';

const mockPerformance: UserPerformance = {
  id: 1,
  user_id: 1,
  analysis_period_start: '2025-01-01',
  analysis_period_end: '2025-01-31',
  type_performance: {
    vocabulary: {
      accuracy: 85.0,
    },
    grammar: {
      accuracy: 70.0,
    },
  },
  difficulty_performance: {
    '1': {
      accuracy: 90.0,
    },
    '2': {
      accuracy: 75.0,
    },
  },
  level_progression: {
    N5: {
      average_score: 80.0,
    },
  },
  repeated_mistakes: [1, 2, 3],
  weaknesses: {
    grammar: '기본 문법 이해 부족',
  },
  created_at: '2025-01-04T10:30:00',
  updated_at: '2025-01-04T10:30:00',
};

describe('UserPerformanceUI', () => {
  it('should render performance analysis title', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText('성능 분석')).toBeInTheDocument();
  });

  it('should render analysis period', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText(/분석 기간:/)).toBeInTheDocument();
  });

  it('should render type performance section', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText('유형별 성취도')).toBeInTheDocument();
    const typePerformanceSection = screen.getByTestId('type-performance');
    expect(typePerformanceSection).toBeInTheDocument();
    expect(typePerformanceSection).toHaveTextContent('vocabulary');
    expect(typePerformanceSection).toHaveTextContent('grammar');
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
  });

  it('should render difficulty performance section', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText('난이도별 성취도')).toBeInTheDocument();
    expect(screen.getByText('난이도 1')).toBeInTheDocument();
    expect(screen.getByText('난이도 2')).toBeInTheDocument();
    expect(screen.getByText('90.0%')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('should render level progression section', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText('레벨별 성취도 추이')).toBeInTheDocument();
    expect(screen.getByText('N5')).toBeInTheDocument();
    expect(screen.getByText('평균 점수: 80.0')).toBeInTheDocument();
  });

  it('should render repeated mistakes section when present', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText('반복 오답 문제')).toBeInTheDocument();
    expect(screen.getByText(/반복적으로 틀린 문제 ID:/)).toBeInTheDocument();
    expect(screen.getByText(/1, 2, 3/)).toBeInTheDocument();
  });

  it('should render weaknesses section when present', () => {
    render(<UserPerformanceUI performance={mockPerformance} />);
    expect(screen.getByText('약점 분석')).toBeInTheDocument();
    const weaknessesSection = screen.getByTestId('weaknesses');
    expect(weaknessesSection).toBeInTheDocument();
    expect(weaknessesSection).toHaveTextContent('grammar');
    expect(screen.getByText('기본 문법 이해 부족')).toBeInTheDocument();
  });

  it('should not render repeated mistakes section when empty', () => {
    const performanceWithoutMistakes: UserPerformance = {
      ...mockPerformance,
      repeated_mistakes: [],
    };
    render(<UserPerformanceUI performance={performanceWithoutMistakes} />);
    expect(screen.queryByText('반복 오답 문제')).not.toBeInTheDocument();
  });

  it('should not render weaknesses section when empty', () => {
    const performanceWithoutWeaknesses: UserPerformance = {
      ...mockPerformance,
      weaknesses: {},
    };
    render(<UserPerformanceUI performance={performanceWithoutWeaknesses} />);
    expect(screen.queryByText('약점 분석')).not.toBeInTheDocument();
  });

  it('should handle missing type_performance gracefully', () => {
    const performanceWithoutType: UserPerformance = {
      ...mockPerformance,
      type_performance: {},
    };
    render(<UserPerformanceUI performance={performanceWithoutType} />);
    expect(screen.getByText('유형별 성취도')).toBeInTheDocument();
  });

  it('should handle missing difficulty_performance gracefully', () => {
    const performanceWithoutDifficulty: UserPerformance = {
      ...mockPerformance,
      difficulty_performance: {},
    };
    render(<UserPerformanceUI performance={performanceWithoutDifficulty} />);
    expect(screen.getByText('난이도별 성취도')).toBeInTheDocument();
  });

  it('should handle missing level_progression gracefully', () => {
    const performanceWithoutLevel: UserPerformance = {
      ...mockPerformance,
      level_progression: {},
    };
    render(<UserPerformanceUI performance={performanceWithoutLevel} />);
    expect(screen.getByText('레벨별 성취도 추이')).toBeInTheDocument();
  });
});

