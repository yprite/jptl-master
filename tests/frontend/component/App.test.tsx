/**
 * App 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../../frontend/src/App';
import { server } from '../../../frontend/src/mocks/setup';
import { http, HttpResponse } from 'msw';

// MSW 서버 설정
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
    const user = userEvent.setup();
    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    await user.click(startButton);

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
    const user = userEvent.setup();
    
    // API 실패 시뮬레이션
    server.use(
      http.post(
        'http://localhost:8000/api/v1/tests/diagnostic/n5',
        () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Server Error',
            },
            { status: 500 }
          );
        }
      )
    );

    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });
});
