/**
 * API 서비스 유닛 테스트
 */

import { testApi, resultApi, userApi, authApi, adminApi, studyApi, vocabularyApi, ApiError } from '../../services/api';

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

    it('should support non-wrapped (raw) API responses', async () => {
      const rawTest = {
        id: 123,
        title: 'N5 진단 테스트',
        level: 'N5',
        status: 'created',
        time_limit_minutes: 30,
        questions: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => rawTest,
      });

      const result = await testApi.createN5DiagnosticTest();
      expect(result).toEqual(rawTest);
    });

    it('should surface FastAPI-style error detail messages', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: 'N5 진단 테스트를 생성하기에 충분한 문제가 없습니다.',
        }),
      });

      const promise = testApi.createN5DiagnosticTest();
      await expect(promise).rejects.toBeInstanceOf(ApiError);
      await expect(promise).rejects.toMatchObject({
        status: 400,
        message: 'N5 진단 테스트를 생성하기에 충분한 문제가 없습니다.',
      });
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

  describe('startTest', () => {
    it('should start test successfully', async () => {
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
            question_type: 'vocabulary',
            question_text: '「こんにちは」の意味は何ですか？',
            choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
            difficulty: 1,
          },
        ],
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

      const result = await testApi.startTest(1);
      expect(result).toEqual(mockTest);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tests/1/start'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        })
      );
    });

    it('should handle start test error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '시험에 등록된 문제가 없습니다. 테스트를 다시 생성해주세요.',
        }),
      });

      try {
        await testApi.startTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(400);
          expect(error.message).toContain('시험에 등록된 문제가 없습니다');
        }
      }
    });

    it('should handle start test 401 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '인증이 필요합니다',
        }),
      });

      try {
        await testApi.startTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(401);
          expect(error.message).toContain('인증이 필요합니다');
        }
      }
    });

    it('should handle start test 500 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '서버 내부 오류가 발생했습니다',
        }),
      });

      try {
        await testApi.startTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(500);
          expect(error.message).toContain('서버 내부 오류가 발생했습니다');
        }
      }
    });

    it('should handle start test network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      try {
        await testApi.startTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(0);
          expect(error.message).toContain('네트워크 오류');
        }
      }
    });
  });

  describe('getTest', () => {
    it('should fetch test by id', async () => {
      const mockTest = {
        id: 1,
        title: 'N5 진단 테스트',
        level: 'N5',
        status: 'created',
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

      const result = await testApi.getTest(1);
      expect(result).toEqual(mockTest);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tests/1'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle get test error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '시험을 찾을 수 없습니다',
        }),
      });

      try {
        await testApi.getTest(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('시험을 찾을 수 없습니다');
        }
      }
    });

    it('should handle get test 401 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '인증이 필요합니다',
        }),
      });

      try {
        await testApi.getTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(401);
          expect(error.message).toContain('인증이 필요합니다');
        }
      }
    });

    it('should handle get test 500 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '서버 내부 오류가 발생했습니다',
        }),
      });

      try {
        await testApi.getTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(500);
          expect(error.message).toContain('서버 내부 오류가 발생했습니다');
        }
      }
    });

    it('should handle get test network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      try {
        await testApi.getTest(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(0);
          expect(error.message).toContain('네트워크 오류');
        }
      }
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

    try {
      await testApi.getTest(999);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toContain('Not found');
        expect(error.status).toBe(404);
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

  it('should handle non-JSON response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => 'text/plain',
      },
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    const result = await testApi.getTest(1);
    expect(result).toEqual({});
  });

  it('should handle non-JSON error response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: () => 'text/plain',
      },
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(500);
      }
    }
  });

  it('should handle JSON parsing error on success response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: async () => {
        throw new Error('JSON parse error');
      },
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toContain('응답 파싱 중 오류');
      }
    }
  });

  it('should handle JSON parsing error on error response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: {
        get: () => 'application/json',
      },
      json: async () => {
        throw new Error('JSON parse error');
      },
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.message).toContain('HTTP 404');
      }
    }
  });

  describe('createTest', () => {
    it('should create test with custom parameters', async () => {
      const mockTest = {
        id: 1,
        title: 'Custom Test',
        level: 'N4',
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

      const result = await testApi.createTest({
        title: 'Custom Test',
        level: 'N4',
        question_count: 10,
        time_limit_minutes: 20,
        question_types: ['vocabulary'],
      });
      expect(result).toEqual(mockTest);
    });
  });
});

describe('resultApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getResults', () => {
    it('should fetch results with userId filter', async () => {
      const mockResults = [{ id: 1, test_id: 1, user_id: 1, score: 85.5 }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockResults,
        }),
      });

      const result = await resultApi.getResults(1);
      expect(result).toEqual(mockResults);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/results?user_id=1'),
        expect.any(Object)
      );
    });

    it('should fetch results with testId filter', async () => {
      const mockResults = [{ id: 1, test_id: 1, user_id: 1, score: 85.5 }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockResults,
        }),
      });

      const result = await resultApi.getResults(undefined, 1);
      expect(result).toEqual(mockResults);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/results?test_id=1'),
        expect.any(Object)
      );
    });

    it('should fetch results with both filters', async () => {
      const mockResults = [{ id: 1, test_id: 1, user_id: 1, score: 85.5 }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockResults,
        }),
      });

      const result = await resultApi.getResults(1, 1);
      expect(result).toEqual(mockResults);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/results?user_id=1&test_id=1'),
        expect.any(Object)
      );
    });
  });

  describe('getRecentResultsByUser', () => {
    it('should fetch recent results by user', async () => {
      const mockResults = [{ id: 1, test_id: 1, user_id: 1, score: 85.5 }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockResults,
        }),
      });

      const result = await resultApi.getRecentResultsByUser(1, 5);
      expect(result).toEqual(mockResults);
    });
  });

  describe('getUserAverageScore', () => {
    it('should fetch user average score', async () => {
      const mockData = {
        user_id: 1,
        average_score: 85.5,
        total_results: 10,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockData,
        }),
      });

      const result = await resultApi.getUserAverageScore(1);
      expect(result).toEqual(mockData);
    });
  });

  describe('getResultReport', () => {
    it('should fetch result report', async () => {
      const mockReport = { report: 'test report' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockReport,
        }),
      });

      const result = await resultApi.getResultReport(1);
      expect(result).toEqual(mockReport);
    });
  });
});

describe('userApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
        is_admin: false,
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

      const result = await userApi.getCurrentUser();
      expect(result).toEqual(mockUser);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me'),
        expect.any(Object)
      );
    });
  });

  describe('updateCurrentUser', () => {
    it('should update current user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'updateduser',
        target_level: 'N4',
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

      const result = await userApi.updateCurrentUser({
        username: 'updateduser',
        target_level: 'N4',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserPerformance', () => {
    it('should fetch user performance data', async () => {
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

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockPerformance,
        }),
      });

      const result = await userApi.getUserPerformance(1);
      expect(result).toEqual(mockPerformance);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/1/performance'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle API error when fetching user performance', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: false,
          message: '성능 분석 데이터를 찾을 수 없습니다',
        }),
      });

      try {
        await userApi.getUserPerformance(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('성능 분석 데이터를 찾을 수 없습니다');
        }
      }
    });
  });

  describe('getUserHistory', () => {
    it('should fetch user history data', async () => {
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
        {
          id: 2,
          user_id: 1,
          test_id: 2,
          result_id: 2,
          study_date: '2025-01-04',
          study_hour: 14,
          total_questions: 20,
          correct_count: 18,
          time_spent_minutes: 25,
          accuracy_percentage: 90.0,
          created_at: '2025-01-04T14:30:00',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockHistory,
      });

      const result = await userApi.getUserHistory(1);
      expect(result).toEqual(mockHistory);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/1/history'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle empty history array', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => [],
      });

      const result = await userApi.getUserHistory(1);
      expect(result).toEqual([]);
    });

    it('should handle API error when fetching user history', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '사용자를 찾을 수 없습니다',
        }),
      });

      try {
        await userApi.getUserHistory(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('사용자를 찾을 수 없습니다');
        }
      }
    });
  });
});

describe('authApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
        }),
      });

      await authApi.logout();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/logout'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});

describe('adminApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getUsers', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          username: 'user1',
          target_level: 'N5',
          current_level: null,
          total_tests_taken: 5,
          study_streak: 3,
          is_admin: false,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockUsers,
        }),
      });

      const result = await adminApi.getUsers();
      expect(result).toEqual(mockUsers);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle getUsers 401 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '인증이 필요합니다',
        }),
      });

      try {
        await adminApi.getUsers();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(401);
          expect(error.message).toContain('인증이 필요합니다');
        }
      }
    });

    it('should handle getUsers 403 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '관리자 권한이 필요합니다',
        }),
      });

      try {
        await adminApi.getUsers();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(403);
          expect(error.message).toContain('관리자 권한이 필요합니다');
        }
      }
    });

    it('should handle getUsers 500 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '서버 내부 오류가 발생했습니다',
        }),
      });

      try {
        await adminApi.getUsers();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(500);
          expect(error.message).toContain('서버 내부 오류가 발생했습니다');
        }
      }
    });
  });

  describe('getUser', () => {
    it('should fetch user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'user1@example.com',
        username: 'user1',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 5,
        study_streak: 3,
        is_admin: false,
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

      const result = await adminApi.getUser(1);
      expect(result).toEqual(mockUser);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/1'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle getUser 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '사용자를 찾을 수 없습니다',
        }),
      });

      try {
        await adminApi.getUser(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('사용자를 찾을 수 없습니다');
        }
      }
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const mockUser = {
        id: 1,
        email: 'user1@example.com',
        username: 'updateduser',
        target_level: 'N4',
        current_level: null,
        total_tests_taken: 5,
        study_streak: 3,
        is_admin: false,
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

      const result = await adminApi.updateUser(1, {
        username: 'updateduser',
        target_level: 'N4',
      });
      expect(result).toEqual(mockUser);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            username: 'updateduser',
            target_level: 'N4',
          }),
        })
      );
    });

    it('should handle updateUser 400 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '잘못된 요청입니다',
        }),
      });

      try {
        await adminApi.updateUser(1, { username: '' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(400);
          expect(error.message).toContain('잘못된 요청입니다');
        }
      }
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
        }),
      });

      await adminApi.deleteUser(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle deleteUser 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '사용자를 찾을 수 없습니다',
        }),
      });

      try {
        await adminApi.deleteUser(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('사용자를 찾을 수 없습니다');
        }
      }
    });
  });

  describe('getQuestions', () => {
    it('should fetch all questions', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: '「こんにちは」の意味は何ですか？',
          choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
          correct_answer: '안녕하세요',
          explanation: 'Explanation',
          difficulty: 1,
          audio_url: null,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockQuestions,
        }),
      });

      const result = await adminApi.getQuestions();
      expect(result).toEqual(mockQuestions);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/questions'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle getQuestions 403 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '관리자 권한이 필요합니다',
        }),
      });

      try {
        await adminApi.getQuestions();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(403);
          expect(error.message).toContain('관리자 권한이 필요합니다');
        }
      }
    });
  });

  describe('getQuestion', () => {
    it('should fetch question by id', async () => {
      const mockQuestion = {
        id: 1,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '「こんにちは」の意味は何ですか？',
        choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
        correct_answer: '안녕하세요',
        explanation: 'Explanation',
        difficulty: 1,
        audio_url: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockQuestion,
        }),
      });

      const result = await adminApi.getQuestion(1);
      expect(result).toEqual(mockQuestion);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/questions/1'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle getQuestion 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '문제를 찾을 수 없습니다',
        }),
      });

      try {
        await adminApi.getQuestion(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('문제를 찾을 수 없습니다');
        }
      }
    });
  });

  describe('createQuestion', () => {
    it('should create question', async () => {
      const mockQuestion = {
        id: 1,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '「こんにちは」の意味は何ですか？',
        choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
        correct_answer: '안녕하세요',
        explanation: 'Explanation',
        difficulty: 1,
        audio_url: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockQuestion,
        }),
      });

      const result = await adminApi.createQuestion({
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '「こんにちは」の意味は何ですか？',
        choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
        correct_answer: '안녕하세요',
        explanation: 'Explanation',
        difficulty: 1,
      });
      expect(result).toEqual(mockQuestion);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/questions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            level: 'N5',
            question_type: 'vocabulary',
            question_text: '「こんにちは」の意味は何ですか？',
            choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
            correct_answer: '안녕하세요',
            explanation: 'Explanation',
            difficulty: 1,
          }),
        })
      );
    });

    it('should handle createQuestion 400 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '잘못된 요청입니다',
        }),
      });

      try {
        await adminApi.createQuestion({
          level: 'N5',
          question_type: 'vocabulary',
          question_text: '',
          choices: [],
          correct_answer: '',
          explanation: '',
          difficulty: 1,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(400);
          expect(error.message).toContain('잘못된 요청입니다');
        }
      }
    });
  });

  describe('updateQuestion', () => {
    it('should update question', async () => {
      const mockQuestion = {
        id: 1,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: 'Updated question',
        choices: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: 'Updated explanation',
        difficulty: 2,
        audio_url: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockQuestion,
        }),
      });

      const result = await adminApi.updateQuestion(1, {
        question_text: 'Updated question',
        explanation: 'Updated explanation',
        difficulty: 2,
      });
      expect(result).toEqual(mockQuestion);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/questions/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            question_text: 'Updated question',
            explanation: 'Updated explanation',
            difficulty: 2,
          }),
        })
      );
    });

    it('should handle updateQuestion 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '문제를 찾을 수 없습니다',
        }),
      });

      try {
        await adminApi.updateQuestion(999, { question_text: 'Updated' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('문제를 찾을 수 없습니다');
        }
      }
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
        }),
      });

      await adminApi.deleteQuestion(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/questions/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle deleteQuestion 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '문제를 찾을 수 없습니다',
        }),
      });

      try {
        await adminApi.deleteQuestion(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(404);
          expect(error.message).toContain('문제를 찾을 수 없습니다');
        }
      }
    });
  });

  describe('getStatistics', () => {
    it('should fetch statistics', async () => {
      const mockStatistics = {
        total_users: 10,
        active_users: 5,
        total_tests: 20,
        average_score: 75.5,
        total_questions: 100,
        questions_by_level: {
          N5: 50,
          N4: 30,
          N3: 20,
        },
        learning_data: {
          total_sessions: 50,
          total_answers: 1000,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          success: true,
          data: mockStatistics,
        }),
      });

      const result = await adminApi.getStatistics();
      expect(result).toEqual(mockStatistics);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/statistics'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle getStatistics 403 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({
          detail: '관리자 권한이 필요합니다',
        }),
      });

      try {
        await adminApi.getStatistics();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(403);
          expect(error.message).toContain('관리자 권한이 필요합니다');
        }
      }
    });
  });

  describe('vocabulary management', () => {
    it('should fetch vocabularies with all parameters', async () => {
      const mockVocabularies = [
        {
          id: 1,
          word: 'テスト',
          reading: 'てすと',
          meaning: '테스트',
          level: 'N5',
          memorization_status: 'learning',
          example_sentence: null,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabularies,
        }),
      });

      const result = await adminApi.getVocabularies({
        level: 'N5',
        status: 'learning',
        search: 'テスト',
      });
      expect(result).toEqual(mockVocabularies);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/vocabulary?level=N5&status=learning&search='),
        expect.any(Object)
      );
    });

    it('should fetch vocabulary by id', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
        memorization_status: 'learning',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await adminApi.getVocabulary(1);
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/vocabulary/1'),
        expect.any(Object)
      );
    });

    it('should create vocabulary', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
        memorization_status: 'learning',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await adminApi.createVocabulary({
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
      });
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/vocabulary'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should update vocabulary', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '업데이트된 테스트',
        level: 'N5',
        memorization_status: 'learning',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await adminApi.updateVocabulary(1, {
        meaning: '업데이트된 테스트',
      });
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/vocabulary/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should delete vocabulary', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
        }),
      });

      await adminApi.deleteVocabulary(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/vocabulary/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});

describe('studyApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getStudyQuestions', () => {
    it('should fetch study questions with all parameters', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockQuestions,
        }),
      });

      const result = await studyApi.getStudyQuestions({
        level: 'N5',
        question_types: ['vocabulary', 'grammar'],
        question_count: 20,
      });
      expect(result).toEqual(mockQuestions);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/study/questions?level=N5&question_types=vocabulary&question_types=grammar&question_count=20'),
        expect.any(Object)
      );
    });

    it('should fetch study questions with minimal parameters', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockQuestions,
        }),
      });

      const result = await studyApi.getStudyQuestions({
        level: 'N5',
      });
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('submitStudySession', () => {
    it('should submit study session', async () => {
      const mockResponse = {
        success: true,
        data: {
          study_session_id: 1,
          total_questions: 20,
          correct_count: 15,
          accuracy: 75.0,
          time_spent_minutes: 30,
          level: 'N5',
          question_types: ['vocabulary'],
        },
        message: '학습 세션이 제출되었습니다',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockResponse,
      });

      const result = await studyApi.submitStudySession({
        answers: { 1: 'A', 2: 'B' },
        level: 'N5',
        question_types: ['vocabulary'],
        time_spent_minutes: 30,
      });
      // fetchApi가 data를 unwrap하므로 data만 비교
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getWrongAnswerQuestions', () => {
    it('should fetch wrong answer questions', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockQuestions,
        }),
      });

      const result = await studyApi.getWrongAnswerQuestions();
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('getWrongAnswerQuestionsForStudy', () => {
    it('should fetch wrong answer questions for study', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockQuestions,
        }),
      });

      const result = await studyApi.getWrongAnswerQuestionsForStudy(20);
      expect(result).toEqual(mockQuestions);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/study/wrong-answers/questions?question_count=20'),
        expect.any(Object)
      );
    });
  });

  describe('getStudySessions', () => {
    it('should fetch study sessions', async () => {
      const mockSessions = [
        {
          id: 1,
          study_date: '2025-01-01',
          study_hour: 10,
          total_questions: 20,
          correct_count: 15,
          accuracy: 75.0,
          time_spent_minutes: 30,
          level: 'N5',
          question_types: ['vocabulary'],
          question_count: 20,
          created_at: '2025-01-01T10:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockSessions,
        }),
      });

      const result = await studyApi.getStudySessions();
      expect(result).toEqual(mockSessions);
    });
  });

  describe('getStudySessionQuestions', () => {
    it('should fetch study session questions', async () => {
      const mockQuestions = [
        {
          id: 1,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: 'Test question',
          choices: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 1,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockQuestions,
        }),
      });

      const result = await studyApi.getStudySessionQuestions(1);
      expect(result).toEqual(mockQuestions);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/study/sessions/1/questions'),
        expect.any(Object)
      );
    });
  });
});

describe('vocabularyApi', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getVocabularies', () => {
    it('should fetch vocabularies with all parameters', async () => {
      const mockVocabularies = [
        {
          id: 1,
          word: 'テスト',
          reading: 'てすと',
          meaning: '테스트',
          level: 'N5',
          memorization_status: 'learning',
          example_sentence: null,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabularies,
        }),
      });

      const result = await vocabularyApi.getVocabularies({
        level: 'N5',
        status: 'learning',
        search: 'テスト',
      });
      expect(result).toEqual(mockVocabularies);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary?level=N5&status=learning&search='),
        expect.any(Object)
      );
    });

    it('should fetch vocabularies with minimal parameters', async () => {
      const mockVocabularies = [
        {
          id: 1,
          word: 'テスト',
          reading: 'てすと',
          meaning: '테스트',
          level: 'N5',
          memorization_status: 'learning',
          example_sentence: null,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabularies,
        }),
      });

      const result = await vocabularyApi.getVocabularies({ level: 'N5' });
      expect(result).toEqual(mockVocabularies);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary?level=N5'),
        expect.any(Object)
      );
    });

    it('should fetch vocabularies without parameters', async () => {
      const mockVocabularies = [
        {
          id: 1,
          word: 'テスト',
          reading: 'てすと',
          meaning: '테스트',
          level: 'N5',
          memorization_status: 'learning',
          example_sentence: null,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabularies,
        }),
      });

      const result = await vocabularyApi.getVocabularies();
      expect(result).toEqual(mockVocabularies);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary'),
        expect.any(Object)
      );
    });
  });

  describe('getVocabulary', () => {
    it('should fetch vocabulary by id', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
        memorization_status: 'learning',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await vocabularyApi.getVocabulary(1);
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary/1'),
        expect.any(Object)
      );
    });
  });

  describe('createVocabulary', () => {
    it('should create vocabulary', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
        memorization_status: 'learning',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await vocabularyApi.createVocabulary({
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
      });
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('updateVocabulary', () => {
    it('should update vocabulary', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '업데이트된 테스트',
        level: 'N5',
        memorization_status: 'learning',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await vocabularyApi.updateVocabulary(1, {
        meaning: '업데이트된 테스트',
      });
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('deleteVocabulary', () => {
    it('should delete vocabulary', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
        }),
      });

      await vocabularyApi.deleteVocabulary(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('studyVocabulary', () => {
    it('should update vocabulary memorization status', async () => {
      const mockVocabulary = {
        id: 1,
        word: 'テスト',
        reading: 'てすと',
        meaning: '테스트',
        level: 'N5',
        memorization_status: 'mastered',
        example_sentence: null,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: mockVocabulary,
        }),
      });

      const result = await vocabularyApi.studyVocabulary(1, 'mastered');
      expect(result).toEqual(mockVocabulary);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/vocabulary/1/study'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});

describe('fetchApi error handling', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should handle validation error array', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { get: () => 'application/json' },
      json: async () => ({
        detail: [
          { msg: 'Field is required', type: 'value_error' },
          'Another error',
        ],
      }),
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(422);
        expect(error.message).toContain('Field is required');
        expect(error.message).toContain('Another error');
      }
    }
  });

  it('should handle detail object with msg', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      json: async () => ({
        detail: { msg: 'Custom error message' },
      }),
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(400);
        expect(error.message).toContain('Custom error message');
      }
    }
  });

  it('should handle detail as JSON string', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      json: async () => ({
        detail: { complex: 'object', nested: { value: 123 } },
      }),
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(400);
        expect(error.message).toContain('complex');
      }
    }
  });

  it('should handle error response without detail', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(500);
        expect(error.message).toContain('HTTP 500');
      }
    }
  });

  it('should handle non-Error exception', async () => {
    // console.error를 모킹하여 테스트 출력을 깔끔하게 유지
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (fetch as jest.Mock).mockRejectedValueOnce('String error');

    try {
      await testApi.getTest(1);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(500);
        expect(error.message).toContain('알 수 없는 오류');
      }
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

