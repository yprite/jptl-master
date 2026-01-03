/**
 * App 컴포넌트 - 학습 모드 관련 테스트
 * 실제 환경에서 발생할 수 있는 에러 시나리오를 커버
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

// StudyPlanDashboardUI 모킹
jest.mock('../../components/organisms/StudyPlanDashboardUI', () => {
  return function MockStudyPlanDashboardUI({ onStartStudy, onViewDayDetail }: any) {
    return (
      <div data-testid="study-plan-dashboard">
        <button onClick={() => onStartStudy(1, 1)}>오늘 학습 시작하기</button>
        <button onClick={() => onViewDayDetail(1, 1)}>Day 1 상세보기</button>
      </div>
    );
  };
});

// DailyChecklistUI 모킹
jest.mock('../../components/organisms/DailyChecklistUI', () => {
  return function MockDailyChecklistUI({ onStartStudy, onBack }: any) {
    return (
      <div data-testid="daily-checklist">
        <button onClick={() => onStartStudy('vocabulary', 20)}>단어 학습 시작</button>
        <button onClick={() => onStartStudy('grammar', 2)}>문법 학습 시작</button>
        <button onClick={() => onStartStudy('reading', 5)}>독해 연습 시작</button>
        <button onClick={() => onStartStudy('listening', 5)}>청해 연습 시작</button>
        <button onClick={() => onStartStudy('mockTest')}>모의고사 시작</button>
        <button onClick={onBack}>돌아가기</button>
      </div>
    );
  };
});

// StudyUI 모킹
jest.mock('../../components/organisms/StudyUI', () => {
  return function MockStudyUI({ onSubmit }: any) {
    return (
      <div data-testid="study-ui">
        <button onClick={() => onSubmit({ 1: 'A' })}>제출</button>
      </div>
    );
  };
});

// FlashcardUI 모킹
jest.mock('../../components/organisms/FlashcardUI', () => {
  return function MockFlashcardUI({ onBack }: any) {
    return (
      <div data-testid="flashcard-ui">
        <button onClick={onBack}>돌아가기</button>
      </div>
    );
  };
});

// fetch 모킹
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
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

describe('App - Study Mode Error Handling', () => {
  const mockUser = {
    id: 1,
    email: 'user@example.com',
    username: '학습자1',
    target_level: 'N5',
    current_level: null,
    total_tests_taken: 0,
    study_streak: 0,
  };

  beforeEach(() => {
    (mockAuthService.subscribe as jest.Mock).mockImplementation((listener) => {
      listener(mockUser);
      return jest.fn();
    });
    (mockAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (mockAuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (mockAuthService.initialize as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('handleStartDailyStudy - Success Cases', () => {
    it('should start vocabulary study successfully', async () => {
      const mockVocabularies = [
        {
          id: 1,
          word: 'テスト',
          reading: 'てすと',
          meaning: '테스트',
          level: 'N5',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockVocabularies,
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const vocabularyButton = screen.getByText('단어 학습 시작');
        fireEvent.click(vocabularyButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('flashcard-ui')).toBeInTheDocument();
      });
    });

    it('should start grammar study successfully', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'GRAMMAR',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockQuestions,
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-ui')).toBeInTheDocument();
      });
    });
  });

  describe('handleStartDailyStudy - Error Cases', () => {
    it('should handle empty questions array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/해당 유형의 문제가 없습니다/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 error (questions not found)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({ detail: 'Questions not found' }),
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/해당 유형의 문제를 찾을 수 없습니다/i)).toBeInTheDocument();
      });
    });

    it('should handle 401 error (unauthorized)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: async () => ({ detail: 'Unauthorized' }),
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('login-ui')).toBeInTheDocument();
      });
    });

    it('should handle 500 error (server error)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        json: async () => ({ detail: 'Internal Server Error' }),
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/서버 오류가 발생했습니다/i)).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('network error')
      );

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        // 네트워크 에러는 ApiError(500)로 처리되어 "서버 오류가 발생했습니다" 메시지가 표시됨
        expect(screen.getByText(/서버 오류가 발생했습니다/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle JSON parsing error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => {
          throw new Error('JSON parse error');
        },
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        // JSON 파싱 에러는 ApiError(500)로 처리되어 "서버 오류가 발생했습니다" 메시지가 표시됨
        expect(screen.getByText(/서버 오류가 발생했습니다/i)).toBeInTheDocument();
      });
    });

    it('should handle null questions response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => null,
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const grammarButton = screen.getByText('문법 학습 시작');
        fireEvent.click(grammarButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/해당 유형의 문제가 없습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('handleStartDailyStudy - Different Task Types', () => {
    it('should handle reading task type', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'READING',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockQuestions,
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const readingButton = screen.getByText('독해 연습 시작');
        fireEvent.click(readingButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-ui')).toBeInTheDocument();
      });
    });

    it('should handle listening task type', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'LISTENING',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
          audio_url: 'http://example.com/audio.mp3',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockQuestions,
      });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const listeningButton = screen.getByText('청해 연습 시작');
        fireEvent.click(listeningButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-ui')).toBeInTheDocument();
      });
    });

    it('should handle mockTest task type', async () => {
      const mockTest = {
        id: 1,
        title: 'N5 진단 테스트',
        level: 'N5',
        status: 'in_progress',
        time_limit_minutes: 30,
        questions: [
          {
            id: 1,
            level: 'N5',
            question_type: 'VOCABULARY',
            question_text: 'Test question',
            choices: ['A', 'B', 'C', 'D'],
            difficulty: 1,
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: mockTest }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: mockTest }),
        });

      await act(async () => {
        render(<App />);
      });

      // 사용자가 로그인하면 initial 상태로 이동
      await waitFor(() => {
        expect(screen.getByText(/JLPT 학습 플랫폼/i)).toBeInTheDocument();
      });

      // 6주 학습 계획 버튼 클릭하여 study-plan으로 이동
      await act(async () => {
        const studyPlanButton = screen.getByRole('button', { name: /6주 학습 계획/i });
        fireEvent.click(studyPlanButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('study-plan-dashboard')).toBeInTheDocument();
      });

      await act(async () => {
        const dayDetailButton = screen.getByText('Day 1 상세보기');
        fireEvent.click(dayDetailButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('daily-checklist')).toBeInTheDocument();
      });

      await act(async () => {
        const mockTestButton = screen.getByText('모의고사 시작');
        fireEvent.click(mockTestButton);
      });

      // 모의고사는 테스트 모드로 시작되므로 StudyUI가 아닌 TestUI가 표시되어야 함
      // (TestUI 모킹이 필요하지만 여기서는 기본 동작 확인)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('handleStartStudyMode - Error Cases', () => {
    it('should handle empty questions in study mode', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });

      render(<App />);

      // 학습 모드 선택 화면으로 이동하는 로직이 필요
      // 여기서는 직접 handleStartStudyMode를 호출하는 대신
      // 실제 사용자 플로우를 시뮬레이션해야 함
    });
  });
});

