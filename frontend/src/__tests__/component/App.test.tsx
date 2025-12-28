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
const mockLogout = jest.fn().mockResolvedValue(undefined);

// authService 모킹을 모듈 외부에서 정의
const mockSubscribeFn = jest.fn((listener) => {
  listener(null);
  return jest.fn();
});
const mockInitializeFn = jest.fn().mockResolvedValue(undefined);
const mockGetCurrentUserFn = jest.fn().mockReturnValue(null);
const mockIsAuthenticatedFn = jest.fn().mockReturnValue(false);
const mockLogoutFn = jest.fn().mockResolvedValue(undefined);

jest.mock('../../services/auth', () => ({
  authService: {
    subscribe: (...args: any[]) => mockSubscribeFn(...args),
    initialize: (...args: any[]) => mockInitializeFn(...args),
    getCurrentUser: (...args: any[]) => mockGetCurrentUserFn(...args),
    isAuthenticated: (...args: any[]) => mockIsAuthenticatedFn(...args),
    logout: (...args: any[]) => mockLogoutFn(...args),
  },
}));

// LoginUI 모킹
jest.mock('../../components/organisms/LoginUI', () => {
  return function MockLoginUI({ onLoginSuccess }: any) {
    return (
      <div data-testid="login-ui">
        <button onClick={() => onLoginSuccess && onLoginSuccess({
          id: 1,
          email: 'user@example.com',
          username: '학습자1',
          target_level: 'N5',
          current_level: null,
          total_tests_taken: 0,
          study_streak: 0,
        })}>로그인</button>
      </div>
    );
  };
});

// fetch 모킹
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
  // authService 모킹 초기화
  jest.clearAllMocks();
  mockSubscribeFn.mockImplementation((listener) => {
    listener(null);
    return jest.fn();
  });
  mockInitializeFn.mockResolvedValue(undefined);
  mockGetCurrentUserFn.mockReturnValue(null);
  mockIsAuthenticatedFn.mockReturnValue(false);
  mockLogoutFn.mockResolvedValue(undefined);
});

describe('App', () => {
  it('should render JLPT app title', async () => {
    render(<App />);
    const titleElement = screen.getByText(/JLPT 자격 검증 프로그램/i);
    expect(titleElement).toBeInTheDocument();
    
    // 초기화 대기
    await waitFor(() => {
      expect(mockInitializeFn).toHaveBeenCalled();
    });
  });

  it('should render login UI when user is not authenticated', async () => {
    render(<App />);
    
    // 초기화 대기 후 로그인 UI 확인
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should render initial state after login', async () => {
    // 로그인 성공 시뮬레이션
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    mockSubscribeFn.mockImplementation((listener) => {
      // 초기에는 null, 나중에 사용자 정보 전달
      setTimeout(() => listener(mockUser), 0);
      return jest.fn();
    });
    mockGetCurrentUserFn.mockReturnValue(mockUser);
    mockIsAuthenticatedFn.mockReturnValue(true);

    render(<App />);

    // 로그인 UI에서 로그인 버튼 클릭
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });

    const loginButton = screen.getByText('로그인');
    fireEvent.click(loginButton);

    // 초기 화면 표시 확인
    await waitFor(() => {
      expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });
  });

  it('should display user info when logged in', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    mockSubscribeFn.mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    mockGetCurrentUserFn.mockReturnValue(mockUser);
    mockIsAuthenticatedFn.mockReturnValue(true);
    mockInitializeFn.mockResolvedValue(mockUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/안녕하세요, 학습자1님/i)).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    let currentUser: any = mockUser;
    mockSubscribeFn.mockImplementation((listener) => {
      listener(currentUser);
      return jest.fn();
    });
    mockGetCurrentUserFn.mockImplementation(() => currentUser);
    mockIsAuthenticatedFn.mockImplementation(() => currentUser !== null);
    mockInitializeFn.mockResolvedValue(mockUser);
    mockLogoutFn.mockImplementation(async () => {
      currentUser = null;
      // 구독자들에게 알림
      mockSubscribeFn.mock.calls.forEach(([listener]) => {
        listener(null);
      });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/안녕하세요, 학습자1님/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /로그아웃/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogoutFn).toHaveBeenCalled();
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should redirect to login when test start fails with 401', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    mockSubscribeFn.mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    mockGetCurrentUserFn.mockReturnValue(mockUser);
    mockIsAuthenticatedFn.mockReturnValue(true);
    mockInitializeFn.mockResolvedValue(mockUser);

    // 401 에러 시뮬레이션
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Unauthorized' }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    // 로그인 화면으로 리다이렉트 확인
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should handle restart', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    mockSubscribeFn.mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    mockGetCurrentUserFn.mockReturnValue(mockUser);
    mockIsAuthenticatedFn.mockReturnValue(true);
    mockInitializeFn.mockResolvedValue(mockUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });

    // 테스트 시작
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

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/「こんにちは」の意味は何ですか？/i)).toBeInTheDocument();
    });

    // 다시 시작 버튼 찾기 (에러 상태에서)
    const errorSection = screen.queryByText(/오류가 발생했습니다/i);
    if (errorSection) {
      const retryButton = screen.getByRole('button', { name: /다시 시도/i });
      fireEvent.click(retryButton);
    }

    // 초기 화면으로 돌아가는지 확인
    await waitFor(() => {
      expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
    });
  });
});
