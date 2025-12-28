/**
 * MSW 핸들러
 * API 목킹을 위한 핸들러 정의
 */

// TextEncoder/TextDecoder polyfill for Node.js (MSW가 필요로 함)
// 반드시 MSW import보다 먼저 실행되어야 함
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

export const handlers = [
  // 테스트 관련 API
  http.get(`${API_BASE_URL}${API_PREFIX}/tests`, ({ request }) => {
    const url = new URL(request.url);
    const level = url.searchParams.get('level');

    const tests = [
      { id: 1, title: 'N5 진단 테스트', level: 'N5' },
      { id: 2, title: 'N4 진단 테스트', level: 'N4' },
    ];

    const filteredTests = level
      ? tests.filter((test) => test.level === level)
      : tests;

    return HttpResponse.json({
      success: true,
      data: filteredTests,
    });
  }),

  http.get(`${API_BASE_URL}${API_PREFIX}/tests/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
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
    });
  }),

  http.post(`${API_BASE_URL}${API_PREFIX}/tests/diagnostic/n5`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        title: 'N5 진단 테스트',
        level: 'N5',
        status: 'created',
        time_limit_minutes: 30,
        questions: [],
      },
    });
  }),

  http.post(`${API_BASE_URL}${API_PREFIX}/tests/:id/start`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
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
    });
  }),

  http.post(`${API_BASE_URL}${API_PREFIX}/tests/:id/submit`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        test_id: Number(id),
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
      },
    });
  }),

  // 결과 관련 API
  http.get(`${API_BASE_URL}${API_PREFIX}/results/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        test_id: 1,
        user_id: 1,
        score: 85.5,
        assessed_level: 'N5',
        recommended_level: 'N4',
        correct_answers_count: 17,
        total_questions_count: 20,
        time_taken_minutes: 25,
        performance_level: 'excellent',
        is_passed: true,
        accuracy_percentage: 85.5,
        time_efficiency: 'efficient',
        level_progression: 'level_up',
        question_type_analysis: {
          vocabulary: { correct: 5, total: 6 },
          grammar: { correct: 6, total: 7 },
        },
        feedback: {
          overall_performance: 'Outstanding performance!',
          time_management: 'Excellent time management.',
          level_recommendation: 'Great progress!',
          study_suggestions: 'Maintain your excellent performance.',
        },
        created_at: '2025-01-03T10:00:00Z',
      },
    });
  }),

  // 인증 관련 API
  http.post(`${API_BASE_URL}${API_PREFIX}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string };
    return HttpResponse.json({
      success: true,
      data: {
        user_id: 1,
        email: body.email,
        username: 'testuser',
      },
    });
  }),

  http.post(`${API_BASE_URL}${API_PREFIX}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      data: {},
    });
  }),

  // 사용자 관련 API
  http.get(`${API_BASE_URL}${API_PREFIX}/users/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      },
    });
  }),
];

