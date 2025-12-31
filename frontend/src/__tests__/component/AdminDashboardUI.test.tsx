/**
 * AdminDashboardUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import AdminDashboardUI from '../../components/organisms/AdminDashboardUI';
import { AdminStatistics } from '../../types/api';

// fetch 모킹
global.fetch = jest.fn() as jest.Mock;

const mockStatistics: AdminStatistics = {
  users: {
    total_users: 10,
    active_users: 7,
  },
  tests: {
    total_tests: 25,
    average_score: 75.5,
  },
  questions: {
    total_questions: 50,
    by_level: {
      N5: 20,
      N4: 15,
      N3: 10,
      N2: 5,
    },
  },
  learning_data: {
    total_results: 25,
  },
};

describe('AdminDashboardUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockStatistics }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });

  it('should display dashboard on initial load', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('어드민 대시보드')).toBeInTheDocument();
      expect(screen.getByText('사용자 통계')).toBeInTheDocument();
      expect(screen.getByText('테스트 통계')).toBeInTheDocument();
      expect(screen.getByText('문제 통계')).toBeInTheDocument();
      expect(screen.getByText('학습 데이터 통계')).toBeInTheDocument();
    });
  });

  it('should display user statistics correctly', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('전체 사용자')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('활성 사용자')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('비활성 사용자')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should display test statistics correctly', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('전체 테스트 수')).toBeInTheDocument();
      expect(screen.getByText('평균 점수')).toBeInTheDocument();
      expect(screen.getByText('75.5점')).toBeInTheDocument();
    });

    // "25"가 여러 개 있을 수 있으므로 getAllByText 사용
    const testCounts = screen.getAllByText('25');
    expect(testCounts.length).toBeGreaterThan(0);
  });

  it('should display question statistics correctly', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('전체 문제 수')).toBeInTheDocument();
      expect(screen.getByText('레벨별 문제 수')).toBeInTheDocument();
      expect(screen.getByText('N5')).toBeInTheDocument();
      expect(screen.getByText('20개')).toBeInTheDocument();
      expect(screen.getByText('N4')).toBeInTheDocument();
      expect(screen.getByText('15개')).toBeInTheDocument();
    });

    // "50"이 여러 개 있을 수 있으므로 getAllByText 사용
    const questionCounts = screen.getAllByText('50');
    expect(questionCounts.length).toBeGreaterThan(0);
  });

  it('should display learning data statistics correctly', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('전체 결과 수')).toBeInTheDocument();
      // "25"가 여러 개 있을 수 있으므로 getAllByText 사용
      const results = screen.getAllByText('25');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  it('should display loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 무한 대기
    );

    render(<AdminDashboardUI />);

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('should display error state and retry on error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText(/오류:/)).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    // 다시 시도 버튼 클릭
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockStatistics }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('어드민 대시보드')).toBeInTheDocument();
    });
  });

  it('should refresh statistics when refresh button is clicked', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('어드민 대시보드')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('새로고침');
    fireEvent.click(refreshButton);

    // fetch가 다시 호출되는지 확인
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should call onBack when back button is clicked', async () => {
    const onBack = jest.fn();
    render(<AdminDashboardUI onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('어드민 대시보드')).toBeInTheDocument();
    });

    const backButton = screen.getByText('뒤로');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should not display back button when onBack is not provided', async () => {
    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('어드민 대시보드')).toBeInTheDocument();
    });

    expect(screen.queryByText('뒤로')).not.toBeInTheDocument();
  });

  it('should handle empty statistics data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminDashboardUI />);

    await waitFor(() => {
      expect(screen.getByText('통계 데이터가 없습니다.')).toBeInTheDocument();
    });
  });
});

