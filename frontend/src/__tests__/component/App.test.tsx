/**
 * App 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import App from '../../App';
import { authService } from '../../services/auth';

// authService 모킹
jest.mock('../../services/auth', () => {
  const mockAuthService = {
    subscribe: jest.fn((listener) => {
      // 초기 상태 알림
      listener(null);
      return jest.fn(); // unsubscribe 함수
    }),
    initialize: jest.fn().mockResolvedValue(undefined),
  };
  return {
    authService: mockAuthService,
  };
});

// fetch 모킹
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

describe('App', () => {
  it('should render JLPT app title', () => {
    render(<App />);
    const titleElement = screen.getByText(/JLPT 자격 검증 프로그램/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('should render initial state with start button', () => {
    render(<App />);
    expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /테스트 시작/i })
    ).toBeInTheDocument();
  });

  it('should start test when start button is clicked', async () => {
    
    // API 모킹
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 1,
            title: 'N5 진단 테스트',
            level: 'N5',
            status: 'created',
            time_limit_minutes: 30,
            questions: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 1,
            title: 'N5 진단 테스트',
            level: 'N5',
            status: 'in_progress',
            time_limit_minutes: 30,
            questions: [
              {
                id: 1,
                level: 'N5',
                question_type: 'vocabulary',
                question_text: '「こんにちは」の意味は何ですか？',
                choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
                difficulty: 1,
              },
            ],
          },
        }),
      });

    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    // 로딩 상태 확인
    await waitFor(() => {
      expect(screen.getByText(/테스트를 준비하는 중/i)).toBeInTheDocument();
    });

    // 테스트 UI 표시 확인
    await waitFor(
      () => {
        expect(
          screen.getByText(/「こんにちは」の意味は何ですか？/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should display error message on API failure', async () => {
    
    // API 실패 시뮬레이션 (createN5DiagnosticTest 호출)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: false,
        message: 'Server Error',
      }),
    });

    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      // 에러 메시지가 표시되는지 확인 (h2 태그 사용)
      const errorHeading = screen.getByRole('heading', { name: /오류가 발생했습니다/i });
      expect(errorHeading).toBeInTheDocument();
      // 에러 메시지 내용 확인 (에러 메시지가 표시되는지 확인)
      expect(screen.getByText(/Server Error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle non-ApiError exceptions', async () => {
    // 일반 에러 발생 시뮬레이션 (fetch가 실패하면 ApiError로 변환됨)
    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      const errorHeading = screen.getByRole('heading', { name: /오류가 발생했습니다/i });
      expect(errorHeading).toBeInTheDocument();
      // 네트워크 오류는 ApiError로 변환되어 메시지가 표시됨
      expect(screen.getByText(/네트워크 오류/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle test submission error', async () => {
    // 테스트 생성 및 시작
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 1,
            title: 'N5 진단 테스트',
            level: 'N5',
            status: 'created',
            time_limit_minutes: 30,
            questions: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 1,
            title: 'N5 진단 테스트',
            level: 'N5',
            status: 'in_progress',
            time_limit_minutes: 30,
            questions: [
              {
                id: 1,
                level: 'N5',
                question_type: 'vocabulary',
                question_text: '「こんにちは」の意味は何ですか？',
                choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
                difficulty: 1,
              },
            ],
          },
        }),
      })
      // 테스트 제출 실패
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: false,
          message: 'Submission failed',
        }),
      });

    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    // 테스트 UI 표시 대기
    await waitFor(() => {
      expect(screen.getByText(/「こんにちは」の意味は何ですか？/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // 답안 선택 및 제출
    const answerButton = screen.getByText('안녕하세요');
    fireEvent.click(answerButton);

    const submitButton = screen.getByRole('button', { name: /제출/i });
    fireEvent.click(submitButton);

    // 에러 메시지 표시 확인
    await waitFor(() => {
      const errorHeading = screen.getByRole('heading', { name: /오류가 발생했습니다/i });
      expect(errorHeading).toBeInTheDocument();
      expect(screen.getByText(/Submission failed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

});
