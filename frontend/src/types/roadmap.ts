export interface LevelOverview {
  level: string;
  vocabulary_count: number;
  grammar_count: number;
  total_count: number;
  recommended_daily_new_cards: number;
  recommended_daily_review_cards: number;
}

export interface RoadmapMilestone {
  day_number: number;
  label: string;
  progress_percent: number;
  remaining_cards: number;
  focus: string;
}

export interface PlanDay {
  day_number: number;
  date: string;
  phase: 'learn' | 'buffer';
  focus: string;
  vocabulary_new: number;
  grammar_new: number;
  new_cards: number;
  review_estimate: number;
  remaining_cards: number;
  progress_percent: number;
}

export interface PlanPreview {
  level: string;
  start_date: string;
  target_days: number;
  required_active_days: number;
  buffer_days: number;
  recommended_daily_new_cards: number;
  chosen_daily_new_cards: number;
  recommended_daily_review_cards: number;
  totals: {
    vocabulary: number;
    grammar: number;
    total: number;
  };
  srs_model: {
    name: string;
    review_offsets_days: number[];
    description: string;
  };
  milestones: RoadmapMilestone[];
  days: PlanDay[];
}

export interface RoadmapItem {
  id: number;
  title: string;
  prompt: string;
  answer: string;
  reading: string | null;
  meaning: string | null;
  example_jp: string | null;
  example_kr: string | null;
  extra_text: string | null;
  source_reference: string | null;
  source_order: number | null;
}

export interface DayAssignment {
  summary: PlanDay;
  vocabulary: RoadmapItem[];
  grammar: RoadmapItem[];
}
