/**
 * App 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import App from '../../App';

// authService 모킹
const mockSubscribe = jest.fn((listener) => {
  // 초기 상태 알림
  listener(null);
  return jest.fn(); // unsubscribe 함수
});
const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockGetCurrentUser = jest.fn().mockReturnValue(null);
const mockIsAuthenticated = jest.fn().mockReturnValue(false);

jest.mock('../../services/auth', () => {
  const mockSubscribeFn = jest.fn((listener) => {
    listener(null);
    return jest.fn();
  });
  const mockInitializeFn = jest.fn().mockResolvedValue(undefined);
  const mockGetCurrentUserFn = jest.fn().mockReturnValue(null);
  const mockIsAuthenticatedFn = jest.fn().mockReturnValue(false);
  
  return {
    authService: {
      get subscribe() {
        return mockSubscribeFn;
      },
      get initialize() {
        return mockInitializeFn;
      },
      getCurrentUser: mockGetCurrentUserFn,
      isAuthenticated: mockIsAuthenticatedFn,
    },
  };
});

// fetch 모킹
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
  // authService 모킹 초기화
  mockSubscribe.mockImplementation((listener) => {
    listener(null);
    return jest.fn();
  });
  mockInitialize.mockResolvedValue(undefined);
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

  it('should display user info when user is logged in', () => {
    // authService 모킹 - 사용자 정보 반환
    mockSubscribe.mockImplementationOnce((listener) => {
      listener({ id: 1, username: 'testuser', email: 'test@example.com' });
      return jest.fn();
    });

    render(<App />);
    
    expect(screen.getByText(/안녕하세요, testuser님/i)).toBeInTheDocument();
  });

  it('should handle successful test submission and display result', async () => {
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
      // 테스트 제출 성공
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            test_id: 1,
            result_id: 1,
            score: 80,
            correct_answers: 4,
            total_questions: 5,
            time_taken_minutes: 25,
            assessed_level: 'N5',
            recommended_level: 'N5',
            question_type_analysis: {},
            performance_level: 'good',
            is_passed: true,
            feedback: {},
          },
        }),
      })
      // 결과 조회
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 1,
            test_id: 1,
            user_id: 1,
            score: 80,
            correct_answers_count: 4,
            total_questions_count: 5,
            time_taken_minutes: 25,
            assessed_level: 'N5',
            recommended_level: 'N5',
            question_type_analysis: {},
            performance_level: 'good',
            is_passed: true,
            accuracy_percentage: 80.0,
            time_efficiency: 'efficient',
            level_progression: 'maintained',
            feedback: {},
            created_at: '2024-01-01T00:00:00Z',
          },
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

    // 결과 화면 표시 확인
    await waitFor(() => {
      expect(screen.getByText(/다시 시작/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle restart button click', async () => {
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
      // 테스트 제출 성공
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            test_id: 1,
            result_id: 1,
            score: 80,
            correct_answers: 4,
            total_questions: 5,
            time_taken_minutes: 25,
            assessed_level: 'N5',
            recommended_level: 'N5',
            question_type_analysis: {},
            performance_level: 'good',
            is_passed: true,
            feedback: {},
          },
        }),
      })
      // 결과 조회
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: {
            id: 1,
            test_id: 1,
            user_id: 1,
            score: 80,
            correct_answers_count: 4,
            total_questions_count: 5,
            time_taken_minutes: 25,
            assessed_level: 'N5',
            recommended_level: 'N5',
            question_type_analysis: {},
            performance_level: 'good',
            is_passed: true,
            accuracy_percentage: 80.0,
            time_efficiency: 'efficient',
            level_progression: 'maintained',
            feedback: {},
            created_at: '2024-01-01T00:00:00Z',
          },
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

    // 결과 화면 표시 대기
    await waitFor(() => {
      expect(screen.getByText(/다시 시작/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // 다시 시작 버튼 클릭
    const restartButton = screen.getByRole('button', { name: /다시 시작/i });
    fireEvent.click(restartButton);

    // 초기 화면으로 돌아가는지 확인
    await waitFor(() => {
      expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });
  });

  it('should handle retry button click in error state', async () => {
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

    // 에러 화면 표시 대기
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /오류가 발생했습니다/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // 다시 시도 버튼 클릭
    const retryButton = screen.getByRole('button', { name: /다시 시도/i });
    fireEvent.click(retryButton);

    // 초기 화면으로 돌아가는지 확인
    await waitFor(() => {
      expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });
  });

  it('should handle non-ApiError exception in test start', async () => {
    // 일반 에러 발생 시뮬레이션 (TypeError가 아닌 다른 에러)
    // fetchApi가 모든 에러를 ApiError로 변환하므로, ApiError(500, '알 수 없는 오류가 발생했습니다.')로 변환됨
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Unknown error'));

    render(<App />);

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      const errorHeading = screen.getByRole('heading', { name: /오류가 발생했습니다/i });
      expect(errorHeading).toBeInTheDocument();
      // fetchApi가 일반 에러를 ApiError로 변환하므로 "알 수 없는 오류가 발생했습니다." 메시지 표시
      expect(screen.getByText(/알 수 없는 오류가 발생했습니다/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle non-ApiError exception in test submission', async () => {
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
      // 테스트 제출 시 일반 에러 발생
      // fetchApi가 모든 에러를 ApiError로 변환하므로, ApiError(500, '알 수 없는 오류가 발생했습니다.')로 변환됨
      .mockRejectedValueOnce(new Error('Submission error'));

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
      // fetchApi가 일반 에러를 ApiError로 변환하므로 "알 수 없는 오류가 발생했습니다." 메시지 표시
      expect(screen.getByText(/알 수 없는 오류가 발생했습니다/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

});
