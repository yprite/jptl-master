import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Progress } from '../atoms/Progress';
import { Question } from '../../types/api';
import { studyApi } from '../../services/api';
import './SRSReviewListUI.css';

export interface ReviewSchedule {
  questionId: number;
  wrongDate: string; // 처음 틀린 날짜
  reviewDates: string[]; // 복습해야 하는 날짜들 (D+1, D+3, D+7)
  lastReviewedDate?: string;
  reviewCount: number;
  nextReviewDate: string; // 다음 복습 날짜
}

export interface SRSReviewListUIProps {
  onStartReview: (questions: Question[]) => void;
  onBack: () => void;
  dailyLimit?: number; // 일일 복습 제한 (기본값: 30)
}

export const SRSReviewListUI: React.FC<SRSReviewListUIProps> = ({
  onStartReview,
  onBack,
  dailyLimit = 30
}) => {
  const [allWrongQuestions, setAllWrongQuestions] = useState<Question[]>([]);
  const [reviewSchedules, setReviewSchedules] = useState<Map<number, ReviewSchedule>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 오늘 날짜
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 오늘 복습해야 하는 문제 목록
  const dueQuestions = useMemo(() => {
    const due: Question[] = [];
    const schedules: ReviewSchedule[] = [];

    reviewSchedules.forEach((schedule, questionId) => {
      // 다음 복습 날짜가 오늘 이전이거나 오늘인 경우
      if (schedule.nextReviewDate <= today) {
        const question = allWrongQuestions.find(q => q.id === questionId);
        if (question) {
          due.push(question);
          schedules.push(schedule);
        }
      }
    });

    // 우선순위 정렬: 오래된 복습일수록 우선, 복습 횟수가 적을수록 우선
    schedules.sort((a, b) => {
      const dateDiff = new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.reviewCount - b.reviewCount;
    });

    return schedules.map(s => allWrongQuestions.find(q => q.id === s.questionId)).filter(Boolean) as Question[];
  }, [allWrongQuestions, reviewSchedules, today]);

  // 오늘 복습 가능한 문제 (일일 제한 적용)
  const availableQuestions = useMemo(() => {
    return dueQuestions.slice(0, dailyLimit);
  }, [dueQuestions, dailyLimit]);

  // 통계
  const stats = useMemo(() => {
    const totalDue = dueQuestions.length;
    const available = availableQuestions.length;
    const reviewedToday = Array.from(reviewSchedules.values()).filter(
      s => s.lastReviewedDate === today
    ).length;

    return {
      totalDue,
      available,
      reviewedToday,
      remaining: Math.max(0, dailyLimit - reviewedToday)
    };
  }, [dueQuestions, availableQuestions, reviewSchedules, today, dailyLimit]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 모든 틀린 문제 조회
      const questions = await studyApi.getWrongAnswerQuestions();
      setAllWrongQuestions(questions);

      // 복습 스케줄 로드 (localStorage)
      const schedules = loadReviewSchedules(questions);
      setReviewSchedules(schedules);
    } catch (err) {
      setError('복습 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load review data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 복습 스케줄 로드 (localStorage에서)
  const loadReviewSchedules = (questions: Question[]): Map<number, ReviewSchedule> => {
    const schedules = new Map<number, ReviewSchedule>();

    questions.forEach(question => {
      const key = `srs_review_${question.id}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        try {
          const data = JSON.parse(saved);
          schedules.set(question.id, {
            questionId: question.id,
            wrongDate: data.wrongDate || today,
            reviewDates: data.reviewDates || [],
            lastReviewedDate: data.lastReviewedDate,
            reviewCount: data.reviewCount || 0,
            nextReviewDate: data.nextReviewDate || calculateNextReviewDate(data.wrongDate, data.reviewCount || 0, data.lastReviewedDate)
          });
        } catch (e) {
          // 파싱 실패 시 새로 생성
          const schedule = createNewSchedule(question.id);
          schedules.set(question.id, schedule);
        }
      } else {
        // 새로 틀린 문제인 경우 스케줄 생성
        const schedule = createNewSchedule(question.id);
        schedules.set(question.id, schedule);
      }
    });

    return schedules;
  };

  // 새 복습 스케줄 생성
  const createNewSchedule = (questionId: number): ReviewSchedule => {
    const wrongDate = today;
    const reviewDates = [
      addDays(wrongDate, 1),  // D+1
      addDays(wrongDate, 3),  // D+3
      addDays(wrongDate, 7)   // D+7
    ];

    const schedule: ReviewSchedule = {
      questionId,
      wrongDate,
      reviewDates,
      reviewCount: 0,
      nextReviewDate: reviewDates[0]
    };

    // localStorage에 저장
    saveReviewSchedule(schedule);

    return schedule;
  };

  // 다음 복습 날짜 계산
  const calculateNextReviewDate = (wrongDate: string, reviewCount: number, lastReviewedDate?: string): string => {
    if (reviewCount === 0) {
      return addDays(wrongDate, 1); // D+1
    } else if (reviewCount === 1) {
      return addDays(wrongDate, 3); // D+3
    } else if (reviewCount === 2) {
      return addDays(wrongDate, 7); // D+7
    } else {
      // 3회 이상 복습한 경우, 마지막 복습일로부터 7일씩 추가
      const lastReview = lastReviewedDate || wrongDate;
      return addDays(lastReview, 7);
    }
  };

  // 날짜 더하기
  const addDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // 복습 스케줄 저장
  const saveReviewSchedule = (schedule: ReviewSchedule) => {
    const key = `srs_review_${schedule.questionId}`;
    localStorage.setItem(key, JSON.stringify({
      wrongDate: schedule.wrongDate,
      reviewDates: schedule.reviewDates,
      lastReviewedDate: schedule.lastReviewedDate,
      reviewCount: schedule.reviewCount,
      nextReviewDate: schedule.nextReviewDate
    }));
  };

  // 복습 완료 처리
  const handleReviewComplete = (questionId: number) => {
    const schedule = reviewSchedules.get(questionId);
    if (!schedule) return;

    const updated: ReviewSchedule = {
      ...schedule,
      lastReviewedDate: today,
      reviewCount: schedule.reviewCount + 1,
      nextReviewDate: calculateNextReviewDate(schedule.wrongDate, schedule.reviewCount + 1, today)
    };

    const newSchedules = new Map(reviewSchedules);
    newSchedules.set(questionId, updated);
    setReviewSchedules(newSchedules);

    saveReviewSchedule(updated);
  };

  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'vocabulary': return '어휘';
      case 'grammar': return '문법';
      case 'reading': return '독해';
      case 'listening': return '청해';
      default: return type;
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="srs-review-list">
        <div className="srs-review-list__loading">
          <p>복습 리스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="srs-review-list">
        <div className="srs-review-list__error">
          <p>{error}</p>
          <Button onClick={loadData}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="srs-review-list">
      <div className="srs-review-list__header">
        <Button variant="ghost" onClick={onBack} size="sm">
          ← 뒤로가기
        </Button>
        <h1 className="srs-review-list__title">오늘의 복습 리스트</h1>
      </div>

      {/* Statistics */}
      <div className="srs-review-list__stats">
        <Card className="srs-review-list__stat-card" variant="elevated" padding="md">
          <div className="srs-review-list__stat-content">
            <p className="srs-review-list__stat-label">오늘 복습해야 할 문제</p>
            <p className="srs-review-list__stat-value">{stats.totalDue}개</p>
          </div>
        </Card>
        <Card className="srs-review-list__stat-card" variant="elevated" padding="md">
          <div className="srs-review-list__stat-content">
            <p className="srs-review-list__stat-label">오늘 복습한 문제</p>
            <p className="srs-review-list__stat-value">{stats.reviewedToday}개</p>
          </div>
        </Card>
        <Card className="srs-review-list__stat-card" variant="elevated" padding="md">
          <div className="srs-review-list__stat-content">
            <p className="srs-review-list__stat-label">남은 복습 가능</p>
            <p className="srs-review-list__stat-value">{stats.remaining}개</p>
          </div>
        </Card>
      </div>

      {/* Progress */}
      <Card className="srs-review-list__progress-card" variant="elevated" padding="md">
        <div className="srs-review-list__progress-header">
          <span>일일 복습 진행률</span>
          <span>{Math.round((stats.reviewedToday / dailyLimit) * 100)}%</span>
        </div>
        <Progress
          value={(stats.reviewedToday / dailyLimit) * 100}
          variant="primary"
          size="lg"
        />
      </Card>

      {/* Action Buttons */}
      {availableQuestions.length > 0 && (
        <Card className="srs-review-list__actions" variant="elevated" padding="md">
          <div className="srs-review-list__actions-content">
            <div>
              <h3 className="srs-review-list__actions-title">복습 시작하기</h3>
              <p className="srs-review-list__actions-description">
                {availableQuestions.length}개의 문제를 복습할 수 있습니다.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => onStartReview(availableQuestions)}
            >
              복습 시작 ({availableQuestions.length}개)
            </Button>
          </div>
        </Card>
      )}

      {/* Review List */}
      <div className="srs-review-list__list">
        <h2 className="srs-review-list__list-title">복습 예정 문제</h2>
        {availableQuestions.length === 0 ? (
          <Card className="srs-review-list__empty" variant="outlined" padding="lg">
            <p className="srs-review-list__empty-text">
              {stats.reviewedToday >= dailyLimit
                ? '오늘의 복습 한도를 모두 사용했습니다. 내일 다시 시도해주세요.'
                : '오늘 복습해야 할 문제가 없습니다.'}
            </p>
          </Card>
        ) : (
          <div className="srs-review-list__question-grid">
            {availableQuestions.map((question) => {
              const schedule = reviewSchedules.get(question.id);
              return (
                <Card
                  key={question.id}
                  className="srs-review-list__question-card"
                  variant="elevated"
                  padding="md"
                >
                  <div className="srs-review-list__question-header">
                    <Badge variant="primary" size="sm">
                      {getQuestionTypeLabel(question.question_type)}
                    </Badge>
                    {schedule && (
                      <Badge variant="warning" size="sm">
                        복습 {schedule.reviewCount + 1}회차
                      </Badge>
                    )}
                  </div>
                  <p className="srs-review-list__question-text">{question.question_text}</p>
                  {schedule && (
                    <div className="srs-review-list__question-schedule">
                      <span className="srs-review-list__schedule-label">다음 복습:</span>
                      <span className="srs-review-list__schedule-date">
                        {formatDate(schedule.nextReviewDate)}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

