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

import { roadmapApi, RoadmapApiError } from '../../services/roadmap';

const mockedRoadmapApi = roadmapApi as jest.Mocked<typeof roadmapApi>;

const levelOverview = {
  level: 'N5',
  vocabulary_count: 744,
  grammar_count: 1207,
  total_count: 1951,
  recommended_daily_new_cards: 22,
  recommended_daily_review_cards: 53,
};

const planPreview = {
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
      remaining_cards: 1928,
      focus: '시작 가속',
    },
  ],
  days: Array.from({ length: 100 }, (_, index) => ({
    day_number: index + 1,
    date: `2026-03-${String(index + 1).padStart(2, '0')}`,
    phase: index < 90 ? 'learn' as const : 'buffer' as const,
    focus: index === 0 ? '시작 가속' : '신규 + 복습 균형',
    vocabulary_new: 8,
    grammar_new: 14,
    new_cards: 22,
    review_estimate: index === 0 ? 0 : 18,
    remaining_cards: Math.max(0, 1951 - (index + 1) * 22),
    progress_percent: Math.min(100, index + 1),
  })),
};

const dayAssignment = {
  summary: {
    day_number: 1,
    date: '2026-03-18',
    phase: 'learn' as const,
    focus: '시작 가속',
    vocabulary_new: 8,
    grammar_new: 14,
    new_cards: 22,
    review_estimate: 0,
    remaining_cards: 1928,
    progress_percent: 1,
  },
  vocabulary: [
    {
      id: 11,
      title: '13日',
      prompt: '13日',
      answer: '13일',
      reading: 'じゅうさんにち',
      meaning: '13일',
      example_jp: null,
      example_kr: null,
      extra_text: '조수사',
      source_reference: '13',
      progress: {
        learning_item_id: 11,
        state: 'new' as const,
        due_date: '2026-03-18',
        interval_days: 0,
        ease_factor: 2.5,
        review_count: 0,
        successful_reviews: 0,
        lapse_count: 0,
        last_rating: null,
        last_reviewed_at: null,
      },
    },
  ],
  grammar: [
    {
      id: 12,
      title: '〜たい',
      prompt: '〜たい',
      answer: '~하고 싶다',
      reading: null,
      meaning: '~하고 싶다',
      example_jp: '日本へ行きたいです。',
      example_kr: '일본에 가고 싶습니다.',
      extra_text: null,
      source_reference: '5001',
      progress: {
        learning_item_id: 12,
        state: 'new' as const,
        due_date: '2026-03-18',
        interval_days: 0,
        ease_factor: 2.5,
        review_count: 0,
        successful_reviews: 0,
        lapse_count: 0,
        last_rating: null,
        last_reviewed_at: null,
      },
    },
  ],
};

const dashboardSnapshot = {
  profile: {
    user_id: 1,
    level: 'N5',
    start_date: '2026-03-18',
    target_days: 100,
    daily_new_cards: 22,
    recommended_daily_review_cards: 53,
  },
  reference_date: '2026-03-18',
  status: 'active' as const,
  current_day_number: 1,
  days_until_start: 0,
  due_review_count: 1,
  reviewed_today_count: 0,
  new_items_started_today: 1,
  plan: {
    level: 'N5',
    start_date: '2026-03-18',
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
  today_assignment: dayAssignment,
};

const dueReviewItem = {
  id: 1,
  level: 'N5',
  item_type: 'vocabulary',
  title: '12日',
  prompt: '12日',
  answer: '12일',
  reading: 'じゅうににち',
  meaning: '12일',
  example_jp: null,
  example_kr: null,
  extra_text: '조수사',
  source_reference: '12',
  progress: {
    learning_item_id: 1,
    state: 'learning' as const,
    due_date: '2026-03-18',
    interval_days: 1,
    ease_factor: 2.5,
    review_count: 1,
    successful_reviews: 1,
    lapse_count: 0,
    last_rating: 'good',
    last_reviewed_at: '2026-03-17T09:00:00',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockImplementation((listener) => {
    listener(null);
    return jest.fn();
  });
  mockInitialize.mockResolvedValue(undefined);
  mockLogout.mockResolvedValue(undefined);
  mockedRoadmapApi.getLevels.mockResolvedValue([]);
  mockedRoadmapApi.previewPlan.mockResolvedValue(planPreview);
  mockedRoadmapApi.previewDay.mockResolvedValue(dayAssignment);
  mockedRoadmapApi.getProfile.mockResolvedValue(null);
  mockedRoadmapApi.getDashboard.mockResolvedValue(dashboardSnapshot);
  mockedRoadmapApi.getDueReviews.mockResolvedValue([]);
  mockedRoadmapApi.saveProfile.mockResolvedValue({
    user_id: 1,
    level: 'N5',
    start_date: '2026-03-20',
    target_days: 100,
    daily_new_cards: 22,
    recommended_daily_review_cards: 53,
  });
  mockedRoadmapApi.submitReview.mockResolvedValue({
    item: dueReviewItem,
    progress: {
      ...dueReviewItem.progress,
      state: 'review',
      due_date: '2026-03-21',
      interval_days: 3,
      review_count: 2,
      successful_reviews: 2,
      last_rating: 'good',
      last_reviewed_at: '2026-03-18T09:00:00',
    },
    rating: 'good',
  });
  mockedRoadmapApi.importApkg.mockResolvedValue({
    import_id: 1,
    source_name: 'deck.apkg',
    source_path: '/tmp/deck.apkg',
    item_count: 1951,
  });
});

describe('App roadmap error handling', () => {
  it('renders the empty import state when no levels are available', async () => {
    render(<App />);

    expect(await screen.findByText('아직 import된 JLPT 카드가 없습니다.')).toBeInTheDocument();
    expect(mockedRoadmapApi.previewPlan).not.toHaveBeenCalled();
    expect(mockedRoadmapApi.previewDay).not.toHaveBeenCalled();
  });

  it('shows a validation error when import is requested without a path', async () => {
    render(<App />);

    await screen.findByText('아직 import된 JLPT 카드가 없습니다.');
    fireEvent.click(screen.getByRole('button', { name: /APKG import/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('APKG 경로를 입력하세요.');
    expect(mockedRoadmapApi.importApkg).not.toHaveBeenCalled();
  });

  it('imports an APKG and reloads the roadmap dashboard', async () => {
    mockedRoadmapApi.getLevels
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([levelOverview]);

    render(<App />);

    await screen.findByText('아직 import된 JLPT 카드가 없습니다.');

    fireEvent.change(screen.getByLabelText('apkg-path'), {
      target: { value: '/tmp/deck.apkg' },
    });
    fireEvent.click(screen.getByRole('button', { name: /APKG import/i }));

    await waitFor(() => {
      expect(mockedRoadmapApi.importApkg).toHaveBeenCalledWith({
        file_path: '/tmp/deck.apkg',
        overwrite: true,
      });
    });

    expect(await screen.findByText(/deck\.apkg에서 1,951개 카드를 불러왔습니다\./i)).toBeInTheDocument();
    expect(await screen.findByText('레벨별 완주 코스')).toBeInTheDocument();
    expect(mockedRoadmapApi.previewPlan).toHaveBeenCalledWith({
      level: 'N5',
      target_days: 100,
      daily_new_cards: 22,
    });
  });

  it('shows roadmap API errors from the plan preview request', async () => {
    mockedRoadmapApi.getLevels.mockResolvedValue([levelOverview]);
    mockedRoadmapApi.previewPlan.mockRejectedValue(
      new RoadmapApiError(400, '플랜 생성 실패')
    );

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('플랜 생성 실패');
    expect(mockedRoadmapApi.previewDay).not.toHaveBeenCalled();
  });

  it('loads a saved roadmap profile for authenticated users', async () => {
    mockSubscribe.mockImplementation((listener) => {
      listener({
        id: 1,
        email: 'roadmap@example.com',
        username: '로드맵사용자',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      });
      return jest.fn();
    });
    mockedRoadmapApi.getLevels.mockResolvedValue([levelOverview]);
    mockedRoadmapApi.getProfile.mockResolvedValue({
      user_id: 1,
      level: 'N5',
      start_date: '2026-03-18',
      target_days: 100,
      daily_new_cards: 22,
      recommended_daily_review_cards: 53,
    });

    render(<App />);

    expect(await screen.findByText(/저장된 로드맵을 불러왔습니다\./i)).toBeInTheDocument();
    expect(mockedRoadmapApi.getProfile).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockedRoadmapApi.getDashboard).toHaveBeenCalled();
      expect(mockedRoadmapApi.getDueReviews).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockedRoadmapApi.previewPlan).toHaveBeenCalledWith({
        level: 'N5',
        target_days: 100,
        daily_new_cards: 22,
        start_date: '2026-03-18',
      });
    });
  });

  it('saves the current roadmap profile for authenticated users', async () => {
    mockSubscribe.mockImplementation((listener) => {
      listener({
        id: 1,
        email: 'roadmap@example.com',
        username: '로드맵사용자',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      });
      return jest.fn();
    });
    mockedRoadmapApi.getLevels.mockResolvedValue([levelOverview]);

    render(<App />);

    await screen.findByText('레벨별 완주 코스');
    fireEvent.change(screen.getByLabelText('시작일'), {
      target: { value: '2026-03-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /현재 플랜 저장/i }));

    await waitFor(() => {
      expect(mockedRoadmapApi.saveProfile).toHaveBeenCalledWith({
        level: 'N5',
        start_date: '2026-03-20',
        target_days: 100,
        daily_new_cards: 22,
      });
    });

    await waitFor(() => {
      expect(mockedRoadmapApi.getDashboard).toHaveBeenCalled();
      expect(mockedRoadmapApi.getDueReviews).toHaveBeenCalled();
    });

    expect(await screen.findByText(/로드맵사용자님의 로드맵을 저장했습니다\./i)).toBeInTheDocument();
  });

  it('records a review rating for due cards', async () => {
    mockSubscribe.mockImplementation((listener) => {
      listener({
        id: 1,
        email: 'roadmap@example.com',
        username: '로드맵사용자',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      });
      return jest.fn();
    });
    mockedRoadmapApi.getLevels.mockResolvedValue([levelOverview]);
    mockedRoadmapApi.getProfile.mockResolvedValue({
      user_id: 1,
      level: 'N5',
      start_date: '2026-03-18',
      target_days: 100,
      daily_new_cards: 22,
      recommended_daily_review_cards: 53,
    });
    mockedRoadmapApi.getDueReviews
      .mockResolvedValueOnce([dueReviewItem])
      .mockResolvedValueOnce([]);

    render(<App />);

    expect(await screen.findByText('오늘 복습 큐')).toBeInTheDocument();
    expect(await screen.findByText('12일')).toBeInTheDocument();

    fireEvent.click(await screen.findByLabelText('due-review-1-good'));

    await waitFor(() => {
      expect(mockedRoadmapApi.submitReview).toHaveBeenCalledWith({
        learning_item_id: 1,
        rating: 'good',
      });
    });

    expect(await screen.findByText(/12日 카드를 Good 평가로 기록했습니다\./i)).toBeInTheDocument();
  });

  it('records a review rating for current day assignment cards', async () => {
    mockSubscribe.mockImplementation((listener) => {
      listener({
        id: 1,
        email: 'roadmap@example.com',
        username: '로드맵사용자',
        target_level: 'N5',
        current_level: null,
        total_tests_taken: 0,
        study_streak: 0,
      });
      return jest.fn();
    });
    mockedRoadmapApi.getLevels.mockResolvedValue([levelOverview]);
    mockedRoadmapApi.getProfile.mockResolvedValue(null);
    mockedRoadmapApi.getDueReviews.mockResolvedValue([]);
    mockedRoadmapApi.submitReview.mockResolvedValue({
      item: dayAssignment.vocabulary[0],
      progress: {
        ...dayAssignment.vocabulary[0].progress,
        state: 'learning',
        due_date: '2026-03-19',
        interval_days: 1,
        review_count: 1,
        successful_reviews: 1,
        last_rating: 'good',
        last_reviewed_at: '2026-03-18T10:00:00',
      },
      rating: 'good',
    });

    render(<App />);

    await screen.findByText('레벨별 완주 코스');
    fireEvent.change(screen.getByLabelText('시작일'), {
      target: { value: '2026-03-18' },
    });
    fireEvent.click(screen.getByRole('button', { name: /현재 플랜 저장/i }));

    await waitFor(() => {
      expect(mockedRoadmapApi.getDashboard).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByLabelText('day-review-11-good')).toBeEnabled();
    });

    fireEvent.click(screen.getByLabelText('day-review-11-good'));

    await waitFor(() => {
      expect(mockedRoadmapApi.submitReview).toHaveBeenCalledWith({
        learning_item_id: 11,
        rating: 'good',
      });
    });

    expect(await screen.findByText(/13日 카드를 Good 평가로 기록했습니다\./i)).toBeInTheDocument();
  });
});
