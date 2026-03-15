import { DayAssignment, LevelOverview, PlanPreview } from '../types/roadmap';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1/roadmap';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class RoadmapApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'RoadmapApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.detail || payload?.message || `HTTP ${response.status}`;
    throw new RoadmapApiError(response.status, message);
  }

  const envelope = payload as ApiEnvelope<T>;
  return envelope.data;
}

export const roadmapApi = {
  getLevels(): Promise<LevelOverview[]> {
    return request<LevelOverview[]>('/levels');
  },

  previewPlan(requestBody: {
    level: string;
    target_days: number;
    daily_new_cards?: number;
    start_date?: string;
  }): Promise<PlanPreview> {
    return request<PlanPreview>('/plans/preview', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  previewDay(requestBody: {
    level: string;
    day_number: number;
    target_days: number;
    daily_new_cards?: number;
    start_date?: string;
  }): Promise<DayAssignment> {
    return request<DayAssignment>('/plans/day', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  importApkg(requestBody: {
    file_path: string;
    overwrite?: boolean;
  }): Promise<{
    import_id: number;
    source_name: string;
    source_path: string;
    item_count: number;
  }> {
    return request('/imports/apkg', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },
};
