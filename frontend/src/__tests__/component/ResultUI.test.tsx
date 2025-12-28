/**
 * ResultUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultUI from '../../components/organisms/ResultUI';
import { Result } from '../../types/api';

const mockResult: Result = {
  id: 1,
  test_id: 1,
  user_id: 1,
  score: 85.5,
  assessed_level: 'N5',
  recommended_level: 'N4',
  correct_answers_count: 17,
  total_questions_count: 20,
  time_taken_minutes: 25,
  performance_level: 'excellent',
  is_passed: true,
  accuracy_percentage: 85.5,
  time_efficiency: 'efficient',
  level_progression: 'level_up',
  question_type_analysis: {
    vocabulary: { correct: 5, total: 6 },
    grammar: { correct: 6, total: 7 },
    reading: { correct: 4, total: 5 },
    listening: { correct: 2, total: 2 },
  },
  feedback: {
    overall_performance: 'Outstanding performance!',
    time_management: 'Excellent time management.',
    level_recommendation: 'Great progress! Consider advancing to JLPT N4.',
    study_suggestions: 'Maintain your excellent performance.',
  },
  created_at: '2025-01-03T10:00:00Z',
};

describe('ResultUI', () => {
  it('should render result title and status', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByText('테스트 결과')).toBeInTheDocument();
    expect(screen.getByTestId('result-status')).toHaveTextContent('합격');
  });

  it('should display score correctly', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByTestId('score-value')).toHaveTextContent('85.5');
  });

  it('should display accuracy percentage', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByText(/85.5%/)).toBeInTheDocument();
  });

  it('should display correct answers count', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByText(/17 \/ 20/)).toBeInTheDocument();
  });

  it('should display time taken', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByText(/25분/)).toBeInTheDocument();
  });

  it('should display performance level', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByTestId('performance-level')).toHaveTextContent('우수');
  });

  it('should display assessed and recommended levels', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByTestId('assessed-level')).toHaveTextContent('N5');
    expect(screen.getByTestId('recommended-level')).toHaveTextContent('N4');
  });

  it('should display question type analysis', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByText('문제 유형별 분석')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-bar-vocabulary')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-bar-grammar')).toBeInTheDocument();
  });

  it('should display feedback sections', () => {
    render(<ResultUI result={mockResult} />);
    expect(screen.getByText('피드백')).toBeInTheDocument();
    expect(screen.getByText('전체 성취도')).toBeInTheDocument();
    expect(screen.getByText('시간 관리')).toBeInTheDocument();
    expect(screen.getByText('레벨 추천')).toBeInTheDocument();
    expect(screen.getByText('학습 제안')).toBeInTheDocument();
  });

  it('should show failed status when not passed', () => {
    const failedResult = { ...mockResult, is_passed: false, score: 65.0 };
    render(<ResultUI result={failedResult} />);
    expect(screen.getByTestId('result-status')).toHaveTextContent('불합격');
  });

  it('should handle empty question type analysis', () => {
    const resultWithoutAnalysis = {
      ...mockResult,
      question_type_analysis: {},
    };
    render(<ResultUI result={resultWithoutAnalysis} />);
    expect(screen.queryByText('문제 유형별 분석')).not.toBeInTheDocument();
  });

  it('should display good performance level', () => {
    const goodResult = { ...mockResult, performance_level: 'good', score: 75.0 };
    render(<ResultUI result={goodResult} />);
    expect(screen.getByTestId('performance-level')).toHaveTextContent('양호');
  });

  it('should display needs improvement performance level', () => {
    const needsImprovementResult = {
      ...mockResult,
      performance_level: 'needs_improvement',
      score: 60.0,
    };
    render(<ResultUI result={needsImprovementResult} />);
    expect(screen.getByTestId('performance-level')).toHaveTextContent(
      '개선 필요'
    );
  });

  it('should display level down progression', () => {
    const levelDownResult = {
      ...mockResult,
      level_progression: 'level_down',
    };
    render(<ResultUI result={levelDownResult} />);
    expect(screen.getByText('레벨 다운')).toBeInTheDocument();
  });

  it('should display maintain progression', () => {
    const maintainResult = {
      ...mockResult,
      level_progression: 'maintain',
    };
    render(<ResultUI result={maintainResult} />);
    expect(screen.getByText('유지')).toBeInTheDocument();
  });

  it('should display could improve time efficiency', () => {
    const couldImproveResult = {
      ...mockResult,
      time_efficiency: 'could_improve',
    };
    render(<ResultUI result={couldImproveResult} />);
    expect(screen.getByText('개선 필요')).toBeInTheDocument();
  });

  it('should handle default performance level', () => {
    const defaultResult = {
      ...mockResult,
      performance_level: 'unknown',
    };
    render(<ResultUI result={defaultResult} />);
    expect(screen.getByTestId('performance-level')).toHaveTextContent(
      'unknown'
    );
  });

  it('should handle default level progression', () => {
    const defaultResult = {
      ...mockResult,
      level_progression: 'unknown',
    };
    render(<ResultUI result={defaultResult} />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});

