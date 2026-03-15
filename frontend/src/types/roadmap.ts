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

export interface RoadmapProfile {
  user_id: number;
  level: string;
  start_date: string;
  target_days: number;
  daily_new_cards: number;
  recommended_daily_review_cards: number;
  required_active_days?: number;
  buffer_days?: number;
  totals?: {
    vocabulary: number;
    grammar: number;
    total: number;
  };
}

export interface RoadmapItemProgress {
  learning_item_id: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  due_date: string | null;
  interval_days: number;
  ease_factor: number;
  review_count: number;
  successful_reviews: number;
  lapse_count: number;
  last_rating: string | null;
  last_reviewed_at: string | null;
}

export interface RoadmapItem {
  id: number;
  level?: string;
  item_type?: string;
  title: string;
  prompt: string;
  answer: string;
  reading: string | null;
  meaning: string | null;
  example_jp: string | null;
  example_kr: string | null;
  extra_text: string | null;
  source_reference: string | null;
  source_order?: number | null;
  progress?: RoadmapItemProgress;
}

export interface DayAssignment {
  summary: PlanDay;
  vocabulary: RoadmapItem[];
  grammar: RoadmapItem[];
}

export type RoadmapStatus = 'scheduled' | 'active' | 'completed';

export type RoadmapReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface RoadmapDashboard {
  profile: RoadmapProfile;
  reference_date: string;
  status: RoadmapStatus;
  current_day_number: number;
  days_until_start: number;
  due_review_count: number;
  reviewed_today_count: number;
  new_items_started_today: number;
  plan: {
    level: string;
    start_date: string;
    target_days: number;
    required_active_days: number;
    buffer_days: number;
    recommended_daily_new_cards: number;
    recommended_daily_review_cards: number;
    totals: {
      vocabulary: number;
      grammar: number;
      total: number;
    };
  };
  today_assignment: DayAssignment | null;
}

export interface RoadmapReviewResult {
  item: RoadmapItem;
  progress: RoadmapItemProgress;
  rating: RoadmapReviewRating;
}
