import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../../App';

jest.mock('../../services/roadmap', () => ({
  roadmapApi: {
    getLevels: jest.fn(),
    previewPlan: jest.fn(),
    previewDay: jest.fn(),
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
    date: '2026-03-15',
    phase: 'learn' as const,
    focus: '시작 가속',
    vocabulary_new: 8,
    grammar_new: 14,
    new_cards: 22,
    review_estimate: 0,
    remaining_cards: 1928,
    progress_percent: 1,
  },
  vocabulary: [],
  grammar: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRoadmapApi.getLevels.mockResolvedValue([]);
  mockedRoadmapApi.previewPlan.mockResolvedValue(planPreview);
  mockedRoadmapApi.previewDay.mockResolvedValue(dayAssignment);
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
});
