/**
 * API 클라이언트 서비스
 * 백엔드 API와 통신하는 중앙화된 서비스
 */

import { Test, TestList, Result, ResultList, Question, UserPerformance, UserHistory, UserProfile } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

/**
 * API 응답 타입
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API 요청 옵션
 */
interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * 기본 fetch 래퍼 함수
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // 세션 쿠키는 자동으로 전송됨 (credentials: 'include' 필요)
  const config: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include', // 쿠키 포함
  };

  try {
    const response = await fetch(url, config);
    
    // 응답이 JSON이 아닌 경우 처리
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (response.ok) {
        return {} as T;
      }
      throw new ApiError(
        response.status,
        `Unexpected content type: ${contentType}`
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시
      if (!response.ok) {
        throw new ApiError(
          response.status,
          `HTTP ${response.status} ${response.statusText}`
        );
      }
      throw new ApiError(500, '응답 파싱 중 오류가 발생했습니다.');
    }

    if (!response.ok) {
      // 백엔드가 ApiResponse 형태가 아닌 FastAPI 기본 에러 형태({"detail": ...})를
      // 반환하는 경우도 메시지를 최대한 살립니다.
      if (payload && typeof payload === 'object') {
        const anyPayload = payload as any;
        const message =
          anyPayload.message ||
          anyPayload.detail ||
          `HTTP ${response.status} ${response.statusText}`;
        throw new ApiError(response.status, message, anyPayload.errors);
      }
      throw new ApiError(
        response.status,
        `HTTP ${response.status} ${response.statusText}`
      );
    }

    // 성공 응답도 백엔드에 따라 래핑(ApiResponse) 여부가 다를 수 있어 유연하게 처리합니다.
    if (payload && typeof payload === 'object') {
      const anyPayload = payload as any;
      if ('success' in anyPayload && 'data' in anyPayload) {
        return anyPayload.data as T;
      }
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(0, '네트워크 오류가 발생했습니다. 서버에 연결할 수 없습니다.');
    }
    throw new ApiError(500, '알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 테스트 관련 API
 */
export const testApi = {
  /**
   * 테스트 목록 조회
   */
  async getTests(level?: string): Promise<TestList[]> {
    const query = level ? `?level=${level}` : '';
    return fetchApi<TestList[]>(`/tests${query}`, { requireAuth: false });
  },

  /**
   * 특정 테스트 조회
   */
  async getTest(testId: number): Promise<Test> {
    return fetchApi<Test>(`/tests/${testId}`, { requireAuth: false });
  },

  /**
   * N5 진단 테스트 생성
   */
  async createN5DiagnosticTest(): Promise<Test> {
    return fetchApi<Test>('/tests/diagnostic/n5', {
      method: 'POST',
      requireAuth: false,
    });
  },

  /**
   * 테스트 생성
   */
  async createTest(request: {
    title: string;
    level: string;
    question_count?: number;
    time_limit_minutes?: number;
    question_types?: string[];
  }): Promise<Test> {
    return fetchApi<Test>('/tests', {
      method: 'POST',
      body: JSON.stringify(request),
      requireAuth: false,
    });
  },

  /**
   * 테스트 시작
   */
  async startTest(testId: number): Promise<Test> {
    return fetchApi<Test>(`/tests/${testId}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * 테스트 제출
   */
  async submitTest(
    testId: number,
    answers: Record<number, string>
  ): Promise<{
    test_id: number;
    result_id: number;
    score: number;
    correct_answers: number;
    total_questions: number;
    time_taken_minutes: number;
    assessed_level: string;
    recommended_level: string;
    question_type_analysis: Record<string, { correct: number; total: number }>;
    performance_level: string;
    is_passed: boolean;
    feedback: Record<string, string>;
  }> {
    return fetchApi(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
};

/**
 * 결과 관련 API
 */
export const resultApi = {
  /**
   * 결과 목록 조회
   */
  async getResults(userId?: number, testId?: number): Promise<ResultList[]> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (testId) params.append('test_id', testId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ResultList[]>(`/results${query}`, { requireAuth: false });
  },

  /**
   * 특정 결과 조회
   */
  async getResult(resultId: number): Promise<Result> {
    return fetchApi<Result>(`/results/${resultId}`, { requireAuth: false });
  },

  /**
   * 사용자의 최근 결과 조회
   */
  async getRecentResultsByUser(
    userId: number,
    limit: number = 10
  ): Promise<ResultList[]> {
    return fetchApi<ResultList[]>(
      `/results/users/${userId}/recent?limit=${limit}`,
      { requireAuth: false }
    );
  },

  /**
   * 사용자의 평균 점수 조회
   */
  async getUserAverageScore(userId: number): Promise<{
    user_id: number;
    average_score: number;
    total_results: number;
  }> {
    return fetchApi(`/results/users/${userId}/average-score`, {
      requireAuth: false,
    });
  },

  /**
   * 결과 분석 리포트 조회
   */
  async getResultReport(resultId: number): Promise<any> {
    return fetchApi(`/results/${resultId}/report`, { requireAuth: false });
  },
};

/**
 * 사용자 관련 API
 */
export const userApi = {
  /**
   * 사용자 생성
   */
  async createUser(request: {
    email: string;
    username: string;
    target_level?: string;
  }): Promise<{
    id: number;
    email: string;
    username: string;
    target_level: string;
    current_level: string | null;
    total_tests_taken: number;
    study_streak: number;
  }> {
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(request),
      requireAuth: false,
    });
  },

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<{
    id: number;
    email: string;
    username: string;
    target_level: string;
    current_level: string | null;
    total_tests_taken: number;
    study_streak: number;
  }> {
    return fetchApi('/users/me');
  },

  /**
   * 현재 사용자 정보 업데이트
   */
  async updateCurrentUser(request: {
    username?: string;
    target_level?: string;
  }): Promise<{
    id: number;
    email: string;
    username: string;
    target_level: string;
    current_level: string | null;
    total_tests_taken: number;
    study_streak: number;
  }> {
    return fetchApi('/users/me', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * 사용자 성능 분석 조회
   */
  async getUserPerformance(userId: number): Promise<UserPerformance> {
    return fetchApi<UserPerformance>(`/users/${userId}/performance`);
  },

  /**
   * 사용자 학습 이력 조회
   */
  async getUserHistory(userId: number): Promise<UserHistory[]> {
    return fetchApi<UserHistory[]>(`/users/${userId}/history`);
  },
};

/**
 * 인증 관련 API
 */
export const authApi = {
  /**
   * 로그인
   */
  async login(email: string): Promise<{
    user_id: number;
    email: string;
    username: string;
  }> {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requireAuth: false,
    });
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    await fetchApi('/auth/logout', {
      method: 'POST',
    });
  },
};
