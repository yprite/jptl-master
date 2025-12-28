/**
 * API 서비스 유닛 테스트
 */

import { testApi, resultApi, userApi, authApi, ApiError } from '../../services/api';

// fetch 모킹
global.fetch = jest.fn();

describe('testApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getTests', () => {
    it('should fetch tests list without level filter', async () => {
      const mockTests = [
        { id: 1, title: 'N5 Test', level: 'N5' },
        { id: 2, title: 'N4 Test', level: 'N4' },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockTests,
        }),
      });

      const result = await testApi.getTests();
      expect(result).toEqual(mockTests);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tests'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should fetch tests list with level filter', async () => {
      const mockTests = [{ id: 1, title: 'N5 Test', level: 'N5' }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockTests,
        }),
      });

      const result = await testApi.getTests('N5');
      expect(result).toEqual(mockTests);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tests?level=N5'),
        expect.any(Object)
      );
    });
  });

  describe('createN5DiagnosticTest', () => {
    it('should create N5 diagnostic test', async () => {
      const mockTest = {
        id: 1,
        title: 'N5 진단 테스트',
        level: 'N5',
        status: 'created',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockTest,
        }),
      });

      const result = await testApi.createN5DiagnosticTest();
      expect(result).toEqual(mockTest);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tests/diagnostic/n5'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('submitTest', () => {
    it('should submit test with answers', async () => {
      const mockResult = {
        test_id: 1,
        result_id: 1,
        score: 85.5,
        correct_answers: 17,
        total_questions: 20,
        time_taken_minutes: 25,
        assessed_level: 'N5',
        recommended_level: 'N4',
        question_type_analysis: {},
        performance_level: 'excellent',
        is_passed: true,
        feedback: {},
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockResult,
        }),
      });

      const answers = { 1: 'answer1', 2: 'answer2' };
      const result = await testApi.submitTest(1, answers);
      expect(result).toEqual(mockResult);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tests/1/submit'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ answers }),
        })
      );
    });
  });
});

describe('resultApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getResult', () => {
    it('should fetch result by id', async () => {
      const mockResult = {
        id: 1,
        test_id: 1,
        user_id: 1,
        score: 85.5,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockResult,
        }),
      });

      const result = await resultApi.getResult(1);
      expect(result).toEqual(mockResult);
    });
  });
});

describe('userApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('createUser', () => {
    it('should create user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      const result = await userApi.createUser({
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
      });
      expect(result).toEqual(mockUser);
    });
  });
});

describe('authApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('login', () => {
    it('should login with email', async () => {
      const mockLoginData = {
        user_id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockLoginData,
        }),
      });

      const result = await authApi.login('test@example.com');
      expect(result).toEqual(mockLoginData);
    });
  });
});

describe('ApiError', () => {
  it('should handle API errors correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: {
        get: () => 'application/json',
      },
      json: async () => ({
        success: false,
        message: 'Not found',
        errors: ['Resource not found'],
      }),
    });

    await expect(testApi.getTest(999)).rejects.toThrow(ApiError);
    try {
      await testApi.getTest(999);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toContain('Not found');
      }
    }
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toContain('네트워크 오류');
      }
    }
  });
});

