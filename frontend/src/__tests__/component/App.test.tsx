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
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'RoadmapApiError';
    }
  },
}));

import { roadmapApi } from '../../services/roadmap';

const mockedRoadmapApi = roadmapApi as jest.Mocked<typeof roadmapApi>;

beforeEach(() => {
  jest.clearAllMocks();
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

    await waitFor(() => {
      expect(screen.getByText(/JLPT 100-Day Roadmap/i)).toBeInTheDocument();
    });

    expect(screen.getByText('N5')).toBeInTheDocument();
    expect(screen.getByText(/1,951 cards/i)).toBeInTheDocument();
    expect(screen.getByText(/사역수동형/i)).toBeInTheDocument();
    expect(mockedRoadmapApi.previewPlan).toHaveBeenCalled();
    expect(mockedRoadmapApi.previewDay).toHaveBeenCalled();
  });

  it('updates the selected day from the day switcher', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Day 7/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Day 7/i }));

    await waitFor(() => {
      expect(mockedRoadmapApi.previewDay).toHaveBeenLastCalledWith(
        expect.objectContaining({ day_number: 7 })
      );
    });
  });
});
