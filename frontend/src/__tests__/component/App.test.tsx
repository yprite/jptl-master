import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../../App';

const mockSubscribe = jest.fn();
const mockInitialize = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../services/roadmap', () => ({
  roadmapApi: {
    getLevels: jest.fn(),
    previewPlan: jest.fn(),
    previewDay: jest.fn(),
    getProfile: jest.fn(),
    getDashboard: jest.fn(),
    getDueReviews: jest.fn(),
    saveProfile: jest.fn(),
    submitReview: jest.fn(),
    importApkg: jest.fn(),
  },
  RoadmapApiError: class RoadmapApiError extends Error {
    status: number;

    constructor(statusCode: number, message: string) {
      super(message);
      this.status = statusCode;
      this.name = 'RoadmapApiError';
    }
  },
}));

jest.mock('../../services/auth', () => ({
  authService: {
    subscribe: (...args: any[]) => mockSubscribe(...args),
    initialize: (...args: any[]) => mockInitialize(...args),
    logout: (...args: any[]) => mockLogout(...args),
  },
}));

jest.mock('../../components/organisms/LoginUI', () => {
  return function MockLoginUI() {
    return <div data-testid="login-ui" />;
  };
});

import { roadmapApi } from '../../services/roadmap';

const mockedRoadmapApi = roadmapApi as jest.Mocked<typeof roadmapApi>;

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockImplementation((listener) => {
    listener(null);
    return jest.fn();
  });
  mockInitialize.mockResolvedValue(undefined);
  mockLogout.mockResolvedValue(undefined);
  mockedRoadmapApi.getLevels.mockResolvedValue([
    {
      level: 'N5',
      vocabulary_count: 744,
      grammar_count: 1207,
      total_count: 1951,
      recommended_daily_new_cards: 22,
      recommended_daily_review_cards: 53,
    },
  ]);
  mockedRoadmapApi.previewPlan.mockResolvedValue({
    level: 'N5',
    start_date: '2026-03-15',
    target_days: 100,
    required_active_days: 90,
    buffer_days: 10,
    recommended_daily_new_cards: 22,
    chosen_daily_new_cards: 22,
    recommended_daily_review_cards: 53,
    totals: {
      vocabulary: 744,
      grammar: 1207,
      total: 1951,
    },
    srs_model: {
      name: 'Anki-inspired staged review',
      review_offsets_days: [1, 3, 7, 14, 30],
      description: 'description',
    },
    milestones: [
      {
        day_number: 1,
        label: 'Day 1',
        progress_percent: 1,
        remaining_cards: 1929,
        focus: '시작 가속',
      },
      {
        day_number: 7,
        label: 'Day 7',
        progress_percent: 7,
        remaining_cards: 1797,
        focus: '기초 패턴 정착',
      },
    ],
    days: Array.from({ length: 100 }, (_, index) => ({
      day_number: index + 1,
      date: `2026-03-${String(index + 15).padStart(2, '0')}`,
      phase: index < 90 ? 'learn' as const : 'buffer' as const,
      focus: index === 0 ? '시작 가속' : '신규 + 복습 균형',
      vocabulary_new: 8,
      grammar_new: 14,
      new_cards: 22,
      review_estimate: index === 0 ? 0 : 18,
      remaining_cards: 1951 - (index + 1) * 22,
      progress_percent: index + 1,
    })),
  });
  mockedRoadmapApi.getProfile.mockResolvedValue(null);
  mockedRoadmapApi.getDashboard.mockResolvedValue({
    profile: {
      user_id: 1,
      level: 'N5',
      start_date: '2026-03-15',
      target_days: 100,
      daily_new_cards: 22,
      recommended_daily_review_cards: 53,
    },
    reference_date: '2026-03-15',
    status: 'active',
    current_day_number: 1,
    days_until_start: 0,
    due_review_count: 0,
    reviewed_today_count: 0,
    new_items_started_today: 0,
    plan: {
      level: 'N5',
      start_date: '2026-03-15',
      target_days: 100,
      required_active_days: 90,
      buffer_days: 10,
      recommended_daily_new_cards: 22,
      recommended_daily_review_cards: 53,
      totals: {
        vocabulary: 744,
        grammar: 1207,
        total: 1951,
      },
    },
    today_assignment: null,
  });
  mockedRoadmapApi.getDueReviews.mockResolvedValue([]);
  mockedRoadmapApi.saveProfile.mockResolvedValue({
    user_id: 1,
    level: 'N5',
    start_date: '2026-03-15',
    target_days: 100,
      daily_new_cards: 22,
      recommended_daily_review_cards: 53,
  });
  mockedRoadmapApi.submitReview.mockResolvedValue({
    item: {
      id: 1,
      title: '12日',
      prompt: '12日',
      answer: '12일',
      reading: 'じゅうににち',
      meaning: '12일',
      example_jp: null,
      example_kr: null,
      extra_text: '조수사',
      source_reference: '12',
    },
    progress: {
      learning_item_id: 1,
      state: 'review',
      due_date: '2026-03-18',
      interval_days: 3,
      ease_factor: 2.5,
      review_count: 2,
      successful_reviews: 2,
      lapse_count: 0,
      last_rating: 'good',
      last_reviewed_at: '2026-03-15T09:00:00',
    },
    rating: 'good',
  });
  mockedRoadmapApi.previewDay.mockResolvedValue({
    summary: {
      day_number: 1,
      date: '2026-03-15',
      phase: 'learn',
      focus: '시작 가속',
      vocabulary_new: 8,
      grammar_new: 14,
      new_cards: 22,
      review_estimate: 0,
      remaining_cards: 1929,
      progress_percent: 1,
    },
    vocabulary: [
      {
        id: 1,
        title: '12日',
        prompt: '12日',
        answer: '12일',
        reading: 'じゅうににち',
        meaning: '12일',
        example_jp: null,
        example_kr: null,
        extra_text: '조수사',
        source_reference: '12',
        source_order: 12,
      },
    ],
    grammar: [
      {
        id: 2,
        title: '사역수동형',
        prompt: '사역수동형',
        answer: '(누가 시켜서, 억지로) 하다',
        reading: null,
        meaning: '(누가 시켜서, 억지로) 하다',
        example_jp: '幼い頃、毎日15分ずつ本を読ませられた。',
        example_kr: '어렸을 적, 어쩔 수 없이 읽었다.',
        extra_text: null,
        source_reference: '4942',
        source_order: 4942,
      },
    ],
  });
});

describe('App', () => {
  it('renders roadmap dashboard with level summary', async () => {
    render(<App />);

    expect(await screen.findByText('레벨별 완주 코스')).toBeInTheDocument();

    expect(screen.getAllByText('N5').length).toBeGreaterThan(0);
    expect(screen.getByText(/1,951 cards/i)).toBeInTheDocument();
    expect(await screen.findByText(/사역수동형/i)).toBeInTheDocument();
    expect(mockedRoadmapApi.previewPlan).toHaveBeenCalled();
    expect(mockedRoadmapApi.previewDay).toHaveBeenCalled();
  });

  it('updates the selected day from the day switcher', async () => {
    render(<App />);

    const dayButtons = await screen.findAllByRole('button', { name: 'Day 7' });

    fireEvent.click(dayButtons[0]);

    await waitFor(() => {
      expect(mockedRoadmapApi.previewDay).toHaveBeenLastCalledWith(
        expect.objectContaining({ day_number: 7 })
      );
    });
  });

  it('opens the login modal for anonymous users', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /로그인 \/ 회원가입/i }));

    expect(await screen.findByTestId('login-ui')).toBeInTheDocument();
  });
});
