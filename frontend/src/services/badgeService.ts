/**
 * 배지 서비스
 * 배지 획득, 진행률 추적, 저장소 관리
 */

import { Badge, BadgeType, BADGE_DEFINITIONS } from '../types/badges';

const STORAGE_KEY = 'jlpt_badges';
const STORAGE_KEY_STREAK = 'jlpt_study_streak';
const STORAGE_KEY_LAST_STUDY_DATE = 'jlpt_last_study_date';

export interface BadgeProgress {
  type: BadgeType;
  current: number;
  target: number;
  earned: boolean;
  earnedAt?: string;
}

class BadgeService {
  /**
   * 모든 배지 가져오기
   */
  getAllBadges(): Badge[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedBadges: Record<string, { earnedAt: string }> = saved ? JSON.parse(saved) : {};

    return Object.values(BADGE_DEFINITIONS).map(def => {
      const saved = savedBadges[def.type];
      return {
        id: def.type,
        ...def,
        earnedAt: saved?.earnedAt,
        progress: this.getBadgeProgress(def.type).progress,
        current: this.getBadgeProgress(def.type).current
      };
    });
  }

  /**
   * 배지 획득 여부 확인
   */
  hasBadge(type: BadgeType): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const savedBadges: Record<string, { earnedAt: string }> = JSON.parse(saved);
    return !!savedBadges[type];
  }

  /**
   * 배지 획득
   */
  earnBadge(type: BadgeType): Badge | null {
    if (this.hasBadge(type)) {
      return null; // 이미 획득한 배지
    }

    const definition = BADGE_DEFINITIONS[type];
    if (!definition) {
      return null;
    }

    const badge: Badge = {
      id: type,
      ...definition,
      earnedAt: new Date().toISOString(),
      progress: 100,
      current: definition.target,
      target: definition.target
    };

    // 저장
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedBadges: Record<string, { earnedAt: string }> = saved ? JSON.parse(saved) : {};
    savedBadges[type] = { earnedAt: badge.earnedAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBadges));

    return badge;
  }

  /**
   * 배지 진행률 가져오기
   */
  getBadgeProgress(type: BadgeType): BadgeProgress {
    const definition = BADGE_DEFINITIONS[type];
    if (!definition) {
      return { type, current: 0, target: 0, earned: false };
    }

    const earned = this.hasBadge(type);
    let current = 0;

    switch (type) {
      case 'streak_3_days':
      case 'streak_7_days':
      case 'streak_14_days':
      case 'streak_30_days':
        current = this.getStudyStreak();
        break;
      case 'week_completion':
        current = this.getCompletedWeeks();
        break;
      case 'program_completion':
        current = this.getCompletedWeeks() >= 6 ? 1 : 0;
        break;
      case 'perfect_score':
        current = this.getPerfectScoreCount();
        break;
      case 'first_test':
        current = this.getTestCount() > 0 ? 1 : 0;
        break;
      case 'vocabulary_master':
        current = this.getCorrectAnswersByType('vocabulary');
        break;
      case 'grammar_master':
        current = this.getCorrectAnswersByType('grammar');
        break;
      default:
        current = 0;
    }

    const progress = definition.target ? Math.min((current / definition.target) * 100, 100) : 0;

    return {
      type,
      current,
      target: definition.target || 0,
      earned,
      earnedAt: earned ? this.getEarnedAt(type) : undefined
    };
  }

  /**
   * 학습 연속일 가져오기
   */
  getStudyStreak(): number {
    const saved = localStorage.getItem(STORAGE_KEY_STREAK);
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * 학습 연속일 업데이트
   */
  updateStudyStreak(): number {
    const lastStudyDate = localStorage.getItem(STORAGE_KEY_LAST_STUDY_DATE);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let streak = this.getStudyStreak();

    if (!lastStudyDate) {
      // 첫 학습
      streak = 1;
    } else if (lastStudyDate === today) {
      // 오늘 이미 학습함
      // streak 유지
    } else if (lastStudyDate === yesterday) {
      // 어제 학습했음 - 연속
      streak += 1;
    } else {
      // 연속이 끊김
      streak = 1;
    }

    localStorage.setItem(STORAGE_KEY_STREAK, streak.toString());
    localStorage.setItem(STORAGE_KEY_LAST_STUDY_DATE, today);

    return streak;
  }

  /**
   * 완료한 주차 수 가져오기
   */
  getCompletedWeeks(): number {
    // TODO: 실제 데이터에서 가져오기
    const saved = localStorage.getItem('studyPlan_completed_weeks');
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * 만점 횟수 가져오기
   */
  getPerfectScoreCount(): number {
    // TODO: 실제 데이터에서 가져오기
    const saved = localStorage.getItem('test_perfect_scores');
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * 테스트 완료 횟수 가져오기
   */
  getTestCount(): number {
    // TODO: 실제 데이터에서 가져오기
    const saved = localStorage.getItem('test_count');
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * 타입별 정답 수 가져오기
   */
  getCorrectAnswersByType(type: string): number {
    // TODO: 실제 데이터에서 가져오기
    const saved = localStorage.getItem(`correct_answers_${type}`);
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * 배지 획득일 가져오기
   */
  getEarnedAt(type: BadgeType): string | undefined {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return undefined;
    const savedBadges: Record<string, { earnedAt: string }> = JSON.parse(saved);
    return savedBadges[type]?.earnedAt;
  }

  /**
   * 배지 체크 및 획득 처리
   * 학습 활동 후 호출하여 배지 획득 여부 확인
   */
  checkAndEarnBadges(activity: {
    type: 'study' | 'test' | 'week_complete';
    score?: number;
    questionType?: string;
  }): Badge[] {
    const earnedBadges: Badge[] = [];

    // 연속 학습 배지 체크
    if (activity.type === 'study' || activity.type === 'test') {
      const streak = this.updateStudyStreak();
      
      if (streak === 3 && !this.hasBadge('streak_3_days')) {
        const badge = this.earnBadge('streak_3_days');
        if (badge) earnedBadges.push(badge);
      }
      if (streak === 7 && !this.hasBadge('streak_7_days')) {
        const badge = this.earnBadge('streak_7_days');
        if (badge) earnedBadges.push(badge);
      }
      if (streak === 14 && !this.hasBadge('streak_14_days')) {
        const badge = this.earnBadge('streak_14_days');
        if (badge) earnedBadges.push(badge);
      }
      if (streak === 30 && !this.hasBadge('streak_30_days')) {
        const badge = this.earnBadge('streak_30_days');
        if (badge) earnedBadges.push(badge);
      }

      // 첫 테스트 배지
      if (activity.type === 'test' && !this.hasBadge('first_test')) {
        const badge = this.earnBadge('first_test');
        if (badge) earnedBadges.push(badge);
      }

      // 만점 배지
      if (activity.type === 'test' && activity.score === 100 && !this.hasBadge('perfect_score')) {
        const badge = this.earnBadge('perfect_score');
        if (badge) earnedBadges.push(badge);
      }
    }

    // 주차 완료 배지
    if (activity.type === 'week_complete') {
      const badge = this.earnBadge('week_completion');
      if (badge) earnedBadges.push(badge);

      // 6주 완주 배지
      const completedWeeks = this.getCompletedWeeks();
      if (completedWeeks >= 6 && !this.hasBadge('program_completion')) {
        const badge = this.earnBadge('program_completion');
        if (badge) earnedBadges.push(badge);
      }
    }

    return earnedBadges;
  }
}

export const badgeService = new BadgeService();

