/**
 * JLPT N5 합격을 위한 6주 학습 계획 데이터
 */
import { StudyPlan } from '../types/study-plan';

export const n5StudyPlan: StudyPlan = {
  totalWeeks: 6,
  totalDays: 42,
  weeks: [
    {
      week: 1,
      title: '일본어 문장 구조에 익숙해지기',
      learningGoals: [
        '일본어 기본 문장 형태를 자동으로 이해',
        '조사 역할 감각 잡기',
      ],
      studyMethods: {
        grammar: [
          'です / ます 형태를 중심으로 기본 문장 반복',
          'は / が / を / に / で 를 문장 속에서 비교 학습',
        ],
        vocabulary: [
          '명사 위주로 하루 20개씩 암기',
        ],
        practice: [
          '예문을 읽고 "누가 / 무엇을 / 어디서"만 파악하는 훈련',
        ],
      },
      keyPoint: '"해석"보다 문장 구조 인식',
      dailyTasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        week: 1,
        tasks: {
          vocabulary: 20,
          grammar: 2,
        },
        completed: false,
      })),
    },
    {
      week: 2,
      title: '동사와 형용사 활용 익히기',
      learningGoals: [
        '시제(현재·과거)와 긍정/부정 구분',
        '하고 싶은 것, 상태 표현 가능',
      ],
      studyMethods: {
        grammar: [
          '동사 ます형 → ました / ません 반복 변형',
          'い형용사 / な형용사 문장 만들기',
        ],
        vocabulary: [
          '동사·형용사 포함 하루 20개',
        ],
        practice: [
          '같은 문장을 시제만 바꿔서 3번 읽기',
        ],
      },
      keyPoint: '동사는 "뜻"보다 활용 패턴이 중요',
      dailyTasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 8,
        week: 2,
        tasks: {
          vocabulary: 20,
          grammar: 2,
        },
        completed: false,
      })),
    },
    {
      week: 3,
      title: '의미 확장 & 실수 줄이기',
      learningGoals: [
        '조사와 표현의 미묘한 차이 구분',
        '시험에서 자주 틀리는 유형 제거',
      ],
      studyMethods: {
        grammar: [
          '～も / ～と / ～から / ～まで',
          '～てください / ～てもいいです / ～てはいけません',
        ],
        vocabulary: [
          '일상 표현 중심으로 확장',
        ],
        practice: [
          '같은 뜻처럼 보이는 문장 비교 (は vs が)',
        ],
      },
      keyPoint: '"비슷해 보이는 문장 중 정답 찾기"',
      dailyTasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 15,
        week: 3,
        tasks: {
          vocabulary: 20,
          grammar: 2,
        },
        completed: false,
      })),
    },
    {
      week: 4,
      title: '독해 집중 훈련',
      learningGoals: [
        '독해 파트 안정 점수 확보',
      ],
      studyMethods: {
        grammar: [],
        vocabulary: [],
        practice: [
          '13문장 짧은 글 매일 5~10개',
          '안내문, 일정표, 간단한 메일',
          '모르는 단어가 있어도 끝까지 읽기',
          '숫자·시간·요일 먼저 체크',
        ],
      },
      keyPoint: '독해는 "단어 시험"이 아님 → 구조 + 정보 찾기',
      dailyTasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 22,
        week: 4,
        tasks: {
          vocabulary: 20,
          grammar: 2,
          reading: 5,
        },
        completed: false,
      })),
    },
    {
      week: 5,
      title: '청해 집중 훈련',
      learningGoals: [
        '듣기 공포 제거',
        '핵심 정보 캐치',
      ],
      studyMethods: {
        grammar: [],
        vocabulary: [],
        practice: [
          '짧은 일상 대화 반복 청취',
          '문제와 선택지를 먼저 읽고 듣기',
          '첫 문장에 집중',
          '들린 단어를 머릿속으로 바로 이미지화',
        ],
      },
      keyPoint: '전부 들으려고 하지 말 것 → 정답에 필요한 것만',
      dailyTasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 29,
        week: 5,
        tasks: {
          vocabulary: 20,
          grammar: 2,
          listening: 5,
        },
        completed: false,
      })),
    },
    {
      week: 6,
      title: '실전 대비 & 마무리',
      learningGoals: [
        '실수 최소화',
        '시험 리듬 익히기',
      ],
      studyMethods: {
        grammar: [],
        vocabulary: [],
        practice: [
          '모의고사 2~3회',
          '오답 정리 (조사 / 동사 활용 / 숫자)',
          '자주 틀리는 표현만 압축 복습',
        ],
      },
      keyPoint: '새로 배우지 말고 정리만',
      dailyTasks: [
        // Day 36-37: 기본 학습 + 오답 정리
        { day: 36, week: 6, tasks: { vocabulary: 20, grammar: 2 }, completed: false },
        { day: 37, week: 6, tasks: { vocabulary: 20, grammar: 2 }, completed: false },
        // Day 38: 첫 번째 모의고사
        { day: 38, week: 6, tasks: { vocabulary: 20, grammar: 2, mockTest: 1 }, completed: false },
        // Day 39: 오답 정리
        { day: 39, week: 6, tasks: { vocabulary: 20, grammar: 2 }, completed: false },
        // Day 40: 두 번째 모의고사
        { day: 40, week: 6, tasks: { vocabulary: 20, grammar: 2, mockTest: 1 }, completed: false },
        // Day 41: 오답 정리
        { day: 41, week: 6, tasks: { vocabulary: 20, grammar: 2 }, completed: false },
        // Day 42: 세 번째 모의고사 (선택적)
        { day: 42, week: 6, tasks: { vocabulary: 20, grammar: 2, mockTest: 1 }, completed: false },
      ],
    },
  ],
};

/**
 * 하루 최소 학습 공식 (바쁠 때)
 */
export const minimumDailyStudy = {
  vocabulary: 20,
  grammar: 2,
  readingOrListening: 5,
};

