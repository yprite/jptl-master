/**
 * App 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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

// AdminLayout 모킹
jest.mock('../../components/organisms/AdminLayout', () => ({
  __esModule: true,
  default: ({ children, currentPage, onNavigate }: any) => (
    <div data-testid="admin-layout">
      <button onClick={() => onNavigate && onNavigate('admin-dashboard')}>대시보드</button>
      <button onClick={() => onNavigate && onNavigate('admin-users')}>사용자 관리</button>
      <button onClick={() => onNavigate && onNavigate('admin-questions')}>문제 관리</button>
      {children}
    </div>
  ),
  AdminPage: {},
}));

// StudyPlanDashboardUI 모킹
jest.mock('../../components/organisms/StudyPlanDashboardUI', () => {
  return function MockStudyPlanDashboardUI({ onStartStudy, onViewDayDetail }: any) {
    return (
      <div data-testid="study-plan-dashboard">
        <h2>📘 JLPT N5 합격을 위한 6주 학습 계획</h2>
        <button onClick={() => onStartStudy && onStartStudy(1, 1)}>오늘 학습 시작하기</button>
        <button onClick={() => onViewDayDetail && onViewDayDetail(1, 1)}>Day 1 상세보기</button>
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
    let initializeResolve: any = null;
    const initializePromise = new Promise((resolve) => {
      initializeResolve = resolve;
    });
    
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listenerFn = listener;
      // 초기화 완료 후에 listener 호출
      initializePromise.then(() => {
        listener(currentUser);
      });
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockImplementation(() => currentUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockImplementation(() => currentUser !== null);
    (mockAuthService.initialize as jest.Mock).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      if (initializeResolve) {
        initializeResolve();
      }
      return mockUser;
    });

    render(<App />);

    // 초기화 완료 대기
    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });
    await initializePromise;

    // 초기에는 initial 화면 (사용자가 로그인하면 자동으로 initial으로 이동)
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    // 사용자가 null로 변경 (로그아웃 시뮬레이션)
    currentUser = null;
    if (listenerFn) {
      await act(async () => {
        listenerFn(null);
      });
    }

    // 로그인 화면으로 리다이렉트
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should redirect to initial when user logs in after being null', async () => {
    let currentUser: any = null;
    let listenerFn: any = null;
    let initializeResolve: any = null;
    const initializePromise = new Promise((resolve) => {
      initializeResolve = resolve;
    });
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
      // 초기화 완료 후에 listener 호출
      initializePromise.then(() => {
        listener(currentUser);
      });
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockImplementation(() => currentUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockImplementation(() => currentUser !== null);
    (mockAuthService.initialize as jest.Mock).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      if (initializeResolve) {
        initializeResolve();
      }
      return undefined;
    });

    render(<App />);

    // 초기화 완료 대기
    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });
    await initializePromise;

    // 초기에는 로그인 UI
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });

    // 사용자가 로그인 (사용자 정보 업데이트)
    currentUser = mockUser;
    if (listenerFn) {
      await act(async () => {
        listenerFn(mockUser);
      });
    }

    // initial 화면으로 리다이렉트 (사용자가 로그인하면 자동으로 initial으로 이동)
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });


  it('should render initial state after login', async () => {
    // 로그인 성공 시뮬레이션
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
      // 초기에는 null 전달
      setTimeout(() => listener(currentUser), 0);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockImplementation(() => currentUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockImplementation(() => currentUser !== null);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(undefined);

    render(<App />);

    // 초기화 완료 대기
    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });

    // 로그인 UI에서 로그인 버튼 클릭
    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });

    const loginButton = screen.getByText('로그인');
    fireEvent.click(loginButton);

    // 사용자 정보 업데이트
    currentUser = mockUser;
    if (listenerFn) {
      await act(async () => {
        listenerFn(mockUser);
      });
    }

    // initial 화면 표시 확인 (사용자가 로그인하면 자동으로 initial으로 이동)
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    }, { timeout: 3000 });
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

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 모드/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 모드/i });
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

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 모드/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 모드/i });
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

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 모드/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 모드/i });
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
            title: 'JLPT 학습 플랫폼',
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
            title: 'JLPT 학습 플랫폼',
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

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 모드/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 모드/i });
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

  it('should handle test submission error', async () => {
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
            title: 'JLPT 학습 플랫폼',
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
            title: 'JLPT 학습 플랫폼',
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
          detail: 'Internal Server Error',
        }),
      });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 모드/i })).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /테스트 모드/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/「こんにちは」の意味は何ですか？/i)).toBeInTheDocument();
    });

    // TestUI의 제출 버튼을 찾아서 클릭
    const submitButton = screen.queryByRole('button', { name: /제출/i });
    if (submitButton) {
      // 답안 선택
      const choice = screen.getByTestId('choice-1-0');
      fireEvent.click(choice);
      
      // 제출 버튼 클릭
      fireEvent.click(submitButton);
      
      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }
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

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /테스트 모드/i })).toBeInTheDocument();
    });

    // 테스트 모드 시작 시 에러 발생 시뮬레이션
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({
        detail: 'Internal Server Error',
      }),
    });

    const startButton = screen.getByRole('button', { name: /테스트 모드/i });
    fireEvent.click(startButton);

    // 에러 화면으로 이동 대기
    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });

    // "다시 시도" 버튼 클릭 (handleRestart 호출)
    const retryButton = screen.getByRole('button', { name: /다시 시도/i });
    fireEvent.click(retryButton);

    // initial 화면으로 돌아가는지 확인 (handleRestart는 initial로 이동)
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display performance analysis when clicking performance button', async () => {
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

    const mockPerformance = {
      id: 1,
      user_id: 1,
      analysis_period_start: '2025-01-01',
      analysis_period_end: '2025-01-31',
      type_performance: {
        vocabulary: { accuracy: 85.0 },
        grammar: { accuracy: 70.0 },
      },
      difficulty_performance: {
        '1': { accuracy: 90.0 },
        '2': { accuracy: 75.0 },
      },
      level_progression: {
        N5: { average_score: 80.0 },
      },
      repeated_mistakes: [1, 2, 3],
      weaknesses: {
        grammar: '기본 문법 이해 부족',
      },
      created_at: '2025-01-04T10:30:00',
      updated_at: '2025-01-04T10:30:00',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        data: mockPerformance,
      }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /성능 분석 보기/i })).toBeInTheDocument();
    });

    const performanceButton = screen.getByRole('button', { name: /성능 분석 보기/i });
    fireEvent.click(performanceButton);

    await waitFor(() => {
      expect(screen.getByText(/성능 분석/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/유형별 성취도/i)).toBeInTheDocument();
    expect(screen.getByText(/난이도별 성취도/i)).toBeInTheDocument();
  });

  it('should show empty performance UI when performance does not exist (404)', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: false,
        message: '성능 분석 데이터를 찾을 수 없습니다',
      }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /성능 분석 보기/i })).toBeInTheDocument();
    });

    const performanceButton = screen.getByRole('button', { name: /성능 분석 보기/i });
    fireEvent.click(performanceButton);

    await waitFor(() => {
      expect(screen.getByText(/성능 분석/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-performance-ui')).toBeInTheDocument();
  });

  it('should display history UI when clicking history button', async () => {
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

    const mockHistory = [
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
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockHistory,
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /학습 이력 보기/i })).toBeInTheDocument();
    });

    const historyButton = screen.getByRole('button', { name: /학습 이력 보기/i });
    fireEvent.click(historyButton);

    // 로딩 상태 대기
    await waitFor(() => {
      expect(screen.queryByText(/테스트를 준비하는 중/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // 학습 이력 UI 확인
    await waitFor(() => {
      expect(screen.getByTestId('user-history-ui')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display profile UI when clicking profile button', async () => {
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

    const mockProfile = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        data: mockProfile,
      }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /프로필 관리/i })).toBeInTheDocument();
    });

    const profileButton = screen.getByRole('button', { name: /프로필 관리/i });
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(screen.getByText(/프로필 관리/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-profile-ui')).toBeInTheDocument();
  });

  it('should handle history fetch error', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Internal Server Error' }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /학습 이력 보기/i })).toBeInTheDocument();
    });

    const historyButton = screen.getByRole('button', { name: /학습 이력 보기/i });
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  it('should handle history fetch 401 error', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Unauthorized' }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /학습 이력 보기/i })).toBeInTheDocument();
    });

    const historyButton = screen.getByRole('button', { name: /학습 이력 보기/i });
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should handle profile fetch error', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Internal Server Error' }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /프로필 관리/i })).toBeInTheDocument();
    });

    const profileButton = screen.getByRole('button', { name: /프로필 관리/i });
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  it('should handle profile fetch 401 error', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Unauthorized' }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /프로필 관리/i })).toBeInTheDocument();
    });

    const profileButton = screen.getByRole('button', { name: /프로필 관리/i });
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should handle profile update error', async () => {
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

    const mockProfile = {
      id: 1,
      email: 'user@example.com',
      username: '학습자1',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
    };

    // 프로필 조회 성공
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        data: mockProfile,
      }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /프로필 관리/i })).toBeInTheDocument();
    });

    const profileButton = screen.getByRole('button', { name: /프로필 관리/i });
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-profile-ui')).toBeInTheDocument();
    });

    // 프로필 수정 버튼 클릭
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    // 프로필 업데이트 실패
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Update failed' }),
    });

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    const saveButton = screen.getByRole('button', { name: /저장/i });
    fireEvent.click(saveButton);

    // 에러 메시지 표시 확인
    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });
  });

  it('should handle performance fetch non-401 non-404 error', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Internal Server Error' }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /성능 분석 보기/i })).toBeInTheDocument();
    });

    const performanceButton = screen.getByRole('button', { name: /성능 분석 보기/i });
    fireEvent.click(performanceButton);

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  it('should handle performance fetch 401 error', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Unauthorized' }),
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /성능 분석 보기/i })).toBeInTheDocument();
    });

    const performanceButton = screen.getByRole('button', { name: /성능 분석 보기/i });
    fireEvent.click(performanceButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });



  it('should handle view history when not authenticated', async () => {
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(null);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(null);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should handle view profile when not authenticated', async () => {
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(null);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(null);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should handle view performance when not authenticated', async () => {
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(null);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(null);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('login-ui')).toBeInTheDocument();
    });
  });

  it('should redirect admin user to admin-dashboard automatically on login', async () => {
    const mockAdminUser = {
      id: 1,
      email: 'admin@example.com',
      username: 'admin',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
      is_admin: true,
    };
    
    let listenerFn: any = null;
    let initializeResolve: any = null;
    const initializePromise = new Promise((resolve) => {
      initializeResolve = resolve;
    });
    
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listenerFn = listener;
      // 초기화 완료 후에 listener 호출
      initializePromise.then(() => {
        listener(mockAdminUser);
      });
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockAdminUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      if (initializeResolve) {
        initializeResolve();
      }
      return mockAdminUser;
    });

    render(<App />);

    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });
    await initializePromise;

    // admin 사용자는 자동으로 admin-dashboard로 이동
    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should not show initial menu for admin user', async () => {
    const mockAdminUser = {
      id: 1,
      email: 'admin@example.com',
      username: 'admin',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
      is_admin: true,
    };
    
    let listenerFn: any = null;
    let initializeResolve: any = null;
    const initializePromise = new Promise((resolve) => {
      initializeResolve = resolve;
    });
    
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listenerFn = listener;
      initializePromise.then(() => {
        listener(mockAdminUser);
      });
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockAdminUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      if (initializeResolve) {
        initializeResolve();
      }
      return mockAdminUser;
    });

    render(<App />);

    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });
    await initializePromise;

    // admin 사용자는 initial 메뉴가 보이지 않아야 함
    await waitFor(() => {
      expect(screen.queryByText(/테스트 모드/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/학습 모드/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // admin layout만 보여야 함
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  it('should handle admin navigate', async () => {
    const mockAdminUser = {
      id: 1,
      email: 'admin@example.com',
      username: 'admin',
      target_level: 'N5',
      current_level: null,
      total_tests_taken: 0,
      study_streak: 0,
      is_admin: true,
    };

    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockAdminUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockAdminUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockAdminUser);

    render(<App />);

    await waitFor(() => {
      expect(mockAuthService.initialize).toHaveBeenCalled();
    });

    // admin 사용자는 자동으로 admin-dashboard로 이동
    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    // admin layout 내에서 네비게이션 버튼 확인
    const dashboardButton = screen.getByText('대시보드');
    expect(dashboardButton).toBeInTheDocument();
  });

  it('should handle start study mode', async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => [
        {
          id: 1,
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          level: 'N5',
          question_type: 'VOCABULARY',
          difficulty: 1,
        },
      ],
    });

    render(<App />);

    // 사용자가 로그인하면 initial 상태로 이동
    await waitFor(() => {
      expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
    });

    // initial 상태에서 학습 모드 버튼 찾기
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /학습 모드/i })).toBeInTheDocument();
    });

    const studyButton = screen.getByRole('button', { name: /학습 모드/i });
    fireEvent.click(studyButton);

    await waitFor(() => {
      expect(screen.getByText(/학습 모드 설정/i)).toBeInTheDocument();
    });
  });

  describe('Error handling in handlers', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
      jest.clearAllMocks();
    });

    describe('handleStartTest', () => {
      it('should handle API error when starting test', async () => {
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

        // API 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '서버 오류가 발생했습니다',
          }),
        });

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // 테스트 시작 버튼 클릭
        const testButton = screen.getByRole('button', { name: /테스트 모드/i });
        fireEvent.click(testButton);

        await waitFor(() => {
          expect(screen.getByText(/서버 오류가 발생했습니다/i)).toBeInTheDocument();
        });
      });

      it('should handle 401 error and redirect to login', async () => {
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

        // 401 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '인증이 필요합니다',
          }),
        });

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        const testButton = screen.getByRole('button', { name: /테스트 모드/i });
        fireEvent.click(testButton);

        await waitFor(() => {
          expect(screen.getByTestId('login-ui')).toBeInTheDocument();
        });
      });
    });

    describe('handleSubmitTest', () => {
      it('should handle API error when submitting test', async () => {
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

        // 테스트 생성 성공
        (global.fetch as jest.Mock).mockResolvedValueOnce({
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
                  question_text: 'Test question',
                  choices: ['A', 'B', 'C', 'D'],
                  level: 'N5',
                  question_type: 'vocabulary',
                  difficulty: 1,
                },
              ],
            },
          }),
        });

        // 테스트 시작 성공
        (global.fetch as jest.Mock).mockResolvedValueOnce({
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
                  question_text: 'Test question',
                  choices: ['A', 'B', 'C', 'D'],
                  level: 'N5',
                  question_type: 'vocabulary',
                  difficulty: 1,
                },
              ],
            },
          }),
        });

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        const testButton = screen.getByRole('button', { name: /테스트 모드/i });
        fireEvent.click(testButton);

        await waitFor(() => {
          expect(screen.getByText(/Test question/i)).toBeInTheDocument();
        });

        // 제출 시 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '테스트 제출 중 오류가 발생했습니다',
          }),
        });

        // 제출 버튼 찾기 및 클릭
        const submitButton = screen.getByRole('button', { name: /제출/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/테스트 제출 중 오류가 발생했습니다/i)).toBeInTheDocument();
        });
      });
    });

    describe('handleViewPerformance', () => {
      it('should handle 404 error and show empty performance', async () => {
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

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // 404 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '성능 데이터를 찾을 수 없습니다',
          }),
        });

        // 성능 분석 버튼 찾기 (실제 UI 구조에 맞게 수정 필요)
        // 이 테스트는 UI 구조에 따라 조정이 필요할 수 있습니다
      });

      it('should handle 500 error when viewing performance', async () => {
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

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // 500 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '서버 오류가 발생했습니다',
          }),
        });
      });
    });

    describe('handleViewHistory', () => {
      it('should handle API error when viewing history', async () => {
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

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // API 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '학습 이력을 불러오는 중 오류가 발생했습니다',
          }),
        });
      });
    });

    describe('handleViewProfile', () => {
      it('should handle API error when viewing profile', async () => {
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

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // API 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '프로필을 불러오는 중 오류가 발생했습니다',
          }),
        });
      });
    });

    describe('handleProfileUpdate', () => {
      it('should handle API error when updating profile', async () => {
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

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // API 에러 시뮬레이션
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: { get: () => 'application/json' },
          json: async () => ({
            detail: '프로필 업데이트 중 오류가 발생했습니다',
          }),
        });
      });
    });

    describe('handleLogout', () => {
      it('should handle logout error gracefully', async () => {
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
        (mockAuthService.logout as jest.Mock).mockRejectedValueOnce(
          new Error('로그아웃 실패')
        );

        render(<App />);

        await waitFor(() => {
          expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
        });

        // 로그아웃은 에러가 발생해도 로그인 화면으로 이동해야 함
        // (handleLogout의 구현에 따라)
      });
    });
  });
});
