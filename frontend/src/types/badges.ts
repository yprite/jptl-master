/**
 * 배지 타입 정의
 */

export type BadgeType = 
  | 'week_completion'
  | 'streak_3_days'
  | 'streak_7_days'
  | 'streak_14_days'
  | 'streak_30_days'
  | 'program_completion'
  | 'perfect_score'
  | 'first_test'
  | 'vocabulary_master'
  | 'grammar_master';

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string; // 이모지 또는 아이콘
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string; // 획득일 (ISO string)
  progress?: number; // 진행률 (0-100)
  target?: number; // 목표값
  current?: number; // 현재값
}

export const BADGE_DEFINITIONS: Record<BadgeType, Omit<Badge, 'id' | 'earnedAt' | 'progress' | 'current'>> = {
  week_completion: {
    type: 'week_completion',
    name: '주차 완료',
    description: '한 주의 학습을 완료했습니다!',
    icon: '📅',
    rarity: 'common',
    target: 1
  },
  streak_3_days: {
    type: 'streak_3_days',
    name: '3일 연속 학습',
    description: '3일 연속으로 학습했습니다!',
    icon: '🔥',
    rarity: 'common',
    target: 3
  },
  streak_7_days: {
    type: 'streak_7_days',
    name: '7일 연속 학습',
    description: '일주일 연속으로 학습했습니다!',
    icon: '⭐',
    rarity: 'rare',
    target: 7
  },
  streak_14_days: {
    type: 'streak_14_days',
    name: '14일 연속 학습',
    description: '2주 연속으로 학습했습니다!',
    icon: '💎',
    rarity: 'epic',
    target: 14
  },
  streak_30_days: {
    type: 'streak_30_days',
    name: '30일 연속 학습',
    description: '한 달 연속으로 학습했습니다!',
    icon: '👑',
    rarity: 'legendary',
    target: 30
  },
  program_completion: {
    type: 'program_completion',
    name: '6주 완주',
    description: '6주 학습 프로그램을 완료했습니다!',
    icon: '🏆',
    rarity: 'legendary',
    target: 1
  },
  perfect_score: {
    type: 'perfect_score',
    name: '만점',
    description: '테스트에서 만점을 받았습니다!',
    icon: '💯',
    rarity: 'epic',
    target: 100
  },
  first_test: {
    type: 'first_test',
    name: '첫 테스트',
    description: '첫 번째 테스트를 완료했습니다!',
    icon: '🎯',
    rarity: 'common',
    target: 1
  },
  vocabulary_master: {
    type: 'vocabulary_master',
    name: '어휘 마스터',
    description: '어휘 영역에서 100문제를 맞췄습니다!',
    icon: '📚',
    rarity: 'rare',
    target: 100
  },
  grammar_master: {
    type: 'grammar_master',
    name: '문법 마스터',
    description: '문법 영역에서 100문제를 맞췄습니다!',
    icon: '📝',
    rarity: 'rare',
    target: 100
  }
};

export const getBadgeRarityColor = (rarity: Badge['rarity']): string => {
  switch (rarity) {
    case 'common':
      return '#6b7280'; // gray
    case 'rare':
      return '#3b82f6'; // blue
    case 'epic':
      return '#8b5cf6'; // purple
    case 'legendary':
      return '#f59e0b'; // amber
    default:
      return '#6b7280';
  }
};

