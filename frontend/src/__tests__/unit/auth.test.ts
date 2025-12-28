/**
 * Auth 서비스 유닛 테스트
 */

import { authService, User } from '../../services/auth';
import { authApi, userApi, ApiError } from '../../services/api';

// API 모킹
jest.mock('../../services/api', () => {
  const mockApiError = class MockApiError extends Error {
    status: number;
    errors?: string[];
    constructor(status: number, message: string, errors?: string[]) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.errors = errors;
    }
  };
  
  return {
    authApi: {
      login: jest.fn(),
      logout: jest.fn(),
    },
    userApi: {
      getCurrentUser: jest.fn(),
    },
    ApiError: mockApiError,
  };
});

describe('AuthService', () => {
  beforeEach(() => {
    // 각 테스트 전에 상태 초기화
    (authApi.login as jest.Mock).mockClear();
    (authApi.logout as jest.Mock).mockClear();
    (userApi.getCurrentUser as jest.Mock).mockClear();
  });

  describe('getCurrentUser', () => {
    it('should return null when not authenticated', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully and update user state', async () => {
      const mockLoginData = {
        user_id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      };

      (authApi.login as jest.Mock).mockResolvedValueOnce(mockLoginData);
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

      const user = await authService.login('test@example.com');
      expect(user).toEqual(mockUser);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should throw error on login failure', async () => {
      const error = new ApiError(401, 'Invalid email');
      (authApi.login as jest.Mock).mockRejectedValueOnce(error);

      await expect(authService.login('invalid@example.com')).rejects.toThrow(
        'Invalid email'
      );
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear user state', async () => {
      // 먼저 로그인
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      };

      (authApi.login as jest.Mock).mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
      await authService.login('test@example.com');

      // 로그아웃
      (authApi.logout as jest.Mock).mockResolvedValueOnce(undefined);
      await authService.logout();

      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should clear user state even if logout API fails', async () => {
      // 먼저 로그인
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      };

      (authApi.login as jest.Mock).mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
      await authService.login('test@example.com');

      // 로그아웃 실패
      (authApi.logout as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(authService.logout()).rejects.toThrow('Network error');
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshUser', () => {
    it('should refresh user information', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      };

      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

      const user = await authService.refreshUser();
      expect(user).toEqual(mockUser);
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should clear user state on 401 error', async () => {
      const error = new ApiError(401, 'Unauthorized');
      (userApi.getCurrentUser as jest.Mock).mockRejectedValueOnce(error);

      const user = await authService.refreshUser();
      expect(user).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', async () => {
      const listener = jest.fn();
      const unsubscribe = authService.subscribe(listener);

      // 초기 상태 알림
      expect(listener).toHaveBeenCalledWith(null);

      // 로그인 시 알림
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      };

      (authApi.login as jest.Mock).mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

      listener.mockClear();
      await authService.login('test@example.com');
      expect(listener).toHaveBeenCalledWith(mockUser);

      // 구독 해제
      unsubscribe();
      listener.mockClear();

      // 로그아웃 시 알림되지 않음
      (authApi.logout as jest.Mock).mockResolvedValueOnce(undefined);
      await authService.logout();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

