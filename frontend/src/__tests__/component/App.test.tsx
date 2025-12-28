/**
 * App 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import App from '../../App';

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
    
    // API 실패 시뮬레이션
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
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });
});
