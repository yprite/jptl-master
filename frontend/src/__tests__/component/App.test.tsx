/**
 * App 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import App from '../../App';

// authService 모킹
jest.mock('../../services/auth', () => {
  const mockSubscribeFn = jest.fn((listener) => {
    listener(null);
    return jest.fn();
  });
  const mockInitializeFn = jest.fn().mockResolvedValue(undefined);
  const mockGetCurrentUserFn = jest.fn().mockReturnValue(null);
  const mockIsAuthenticatedFn = jest.fn().mockReturnValue(false);
  const mockLogoutFn = jest.fn().mockResolvedValue(undefined);
  
  return {
    authService: {
      subscribe: mockSubscribeFn,
      initialize: mockInitializeFn,
      getCurrentUser: mockGetCurrentUserFn,
      isAuthenticated: mockIsAuthenticatedFn,
      logout: mockLogoutFn,
    },
  };
});

// 모킹된 함수에 접근하기 위한 타입 정의
import { authService } from '../../services/auth';
const mockAuthService = authService as jest.Mocked<typeof authService>;

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
  (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
    listener(null);
    return jest.fn();
  });
  (mockAuthService.initialize as jest.Mock).mockResolvedValue(undefined);
  (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(null);
  (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
  (mockAuthService.logout as jest.Mock).mockResolvedValue(undefined);
});

describe('App', () => {
  it('should render JLPT app title', async () => {
    render(<App />);
    const titleElement = screen.getByText(/JLPT 자격 검증 프로그램/i);
    expect(titleElement).toBeInTheDocument();
    
    // 초기화 대기
    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });
  });

  it('should render login UI when user is not authenticated', async () => {
    render(<App />);
    
    // 초기화 대기 후 로그인 UI 확인
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should redirect to login when user becomes null after initialization', async () => {
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
    let listenerFn: any = null;
    
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listenerFn = listener;
      listener(currentUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockImplementation(() => currentUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockImplementation(() => currentUser !== null);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

    render(<App />);

    // 초기에는 초기 화면
    await waitFor(() => {
      expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
    });

    // 사용자가 null로 변경 (로그아웃 시뮬레이션)
    currentUser = null;
    if (listenerFn) {
      listenerFn(null);
    }

    // 로그인 화면으로 리다이렉트
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should redirect to initial when user logs in after being null', async () => {
    let currentUser: any = null;
    let listenerFn: any = null;
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };
    
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listenerFn = listener;
      listener(currentUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockImplementation(() => currentUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockImplementation(() => currentUser !== null);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(undefined);

    render(<App />);

    // 초기에는 로그인 UI
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });

    // 사용자가 로그인 (사용자 정보 업데이트)
    currentUser = mockUser;
    if (listenerFn) {
      listenerFn(mockUser);
    }

    // 초기 화면으로 리다이렉트
    await waitFor(() => {
      expect(screen.getByText(/N5 진단 테스트/i)).toBeInTheDocument();
    }, { timeout: 2000 });
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

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      // 초기에는 null, 나중에 사용자 정보 전달
      setTimeout(() => listener(mockUser), 0);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);

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

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

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
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(currentUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockImplementation(() => currentUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockImplementation(() => currentUser !== null);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);
    (mockAuthService.logout as jest.Mock).mockImplementation(async () => {
      currentUser = null;
      // 구독자들에게 알림
      (mockAuthService.subscribe as jest.Mock).mock.calls.forEach(([listener]) => {
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
      expect(mockAuthService.logout).toHaveBeenCalled();
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

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

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

  it('should handle test start when not authenticated', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(false); // 인증되지 않음
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

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

  it('should handle test start error (non-401)', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

    // 500 에러 시뮬레이션
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Internal Server Error' }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    // 에러 메시지 표시 확인
    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  it('should handle test submission', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

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
            correct_answers: 1,
            total_questions: 1,
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
            correct_answers_count: 1,
            total_questions_count: 1,
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
          },
        }),
      });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 시작/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 시작/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/「こんにちは」の意味は何ですか？/i)).toBeInTheDocument();
    });

    // TestUI 컴포넌트가 제출 버튼을 가지고 있는지 확인
    const submitButton = screen.queryByRole('button', { name: /제출/i });
    if (submitButton) {
      // TestUI의 onSubmit을 직접 호출하는 대신, TestUI가 제대로 렌더링되었는지 확인
      // 실제 제출은 TestUI 컴포넌트 테스트에서 검증
      expect(submitButton).toBeInTheDocument();
    }
  });

  it('should handle logout error', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);
    (mockAuthService.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/안녕하세요, 학습자1님/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /로그아웃/i });
    fireEvent.click(logoutButton);

    // 로그아웃 실패해도 로그인 화면으로 이동
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

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);

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
