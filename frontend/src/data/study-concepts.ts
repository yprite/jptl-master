/**
 * 학습 개념 데이터 (임시 Mock 데이터)
 * 추후 API로 대체 예정
 */

import { StudyConcept } from '../components/organisms/StudyModeUI';
import { Question } from '../types/api';

// 임시 개념 데이터 생성 함수
export const createStudyConcept = (
  id: string,
  title: string,
  description: string,
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening',
  examples: Array<{ text: string; translation?: string; explanation?: string }>,
  questions: Question[]
): StudyConcept => ({
  id,
  title,
  description,
  category,
  examples,
  questions
});

// N5 문법 개념 예시
export const n5GrammarConcepts: StudyConcept[] = [
  createStudyConcept(
    'n5-grammar-1',
    '~です / ~だ (입니다/이다)',
    '~です는 정중한 표현이고, ~だ는 보통체 표현입니다.\n\n명사 뒤에 붙어서 "~입니다"라는 의미를 나타냅니다.\n\n예: 私は学生です (저는 학생입니다)\n\n부정형은 ~ではありません 또는 ~じゃありません입니다.',
    'grammar',
    [
      {
        text: '私は学生です。',
        translation: '저는 학생입니다.',
        explanation: '~です는 정중한 표현으로, 명사 뒤에 붙어 "~입니다"라는 의미를 나타냅니다.'
      },
      {
        text: 'これは本です。',
        translation: '이것은 책입니다.',
        explanation: '~です는 사물의 정체를 나타낼 때도 사용됩니다.'
      },
      {
        text: '私は学生ではありません。',
        translation: '저는 학생이 아닙니다.',
        explanation: '부정형은 ~ではありません 또는 ~じゃありません을 사용합니다.'
      }
    ],
    [
      {
        id: 1,
        level: 'N5',
        question_type: 'grammar',
        question_text: '다음 중 올바른 문장은?',
        choices: [
          '私は学生だ。',
          '私は学生です。',
          '私は学生する。',
          '私は学生ある。'
        ],
        correct_answer: '私は学生です。',
        explanation: '~です는 정중한 표현으로, 명사 뒤에 붙어 "~입니다"라는 의미를 나타냅니다.',
        difficulty: 1
      },
      {
        id: 2,
        level: 'N5',
        question_type: 'grammar',
        question_text: 'これは本___。 빈칸에 들어갈 것은?',
        choices: ['です', 'する', 'ある', 'いる'],
        correct_answer: 'です',
        explanation: '명사 뒤에는 ~です를 붙여서 "~입니다"라는 의미를 만듭니다.',
        difficulty: 1
      },
      {
        id: 3,
        level: 'N5',
        question_type: 'grammar',
        question_text: '私は学生___。 (부정형)',
        choices: [
          'ではありません',
          'じゃないです',
          'じゃありません',
          'すべて正しい'
        ],
        correct_answer: 'すべて正しい',
        explanation: '부정형은 ~ではありません, ~じゃありません, ~じゃないです 모두 사용 가능합니다.',
        difficulty: 2
      },
      {
        id: 4,
        level: 'N5',
        question_type: 'grammar',
        question_text: 'これは___です。 (이것은 책입니다)',
        choices: ['本', '本を', '本に', '本が'],
        correct_answer: '本',
        explanation: '~です 앞에는 조사 없이 명사만 올 수 있습니다.',
        difficulty: 2
      },
      {
        id: 5,
        level: 'N5',
        question_type: 'grammar',
        question_text: '다음 중 보통체 표현은?',
        choices: [
          '私は学生です。',
          '私は学生だ。',
          '私は学生です。',
          '私は学生です。'
        ],
        correct_answer: '私は学生だ。',
        explanation: '~だ는 보통체 표현이고, ~です는 정중한 표현입니다.',
        difficulty: 2
      }
    ]
  ),
  createStudyConcept(
    'n5-grammar-2',
    '~は (주제를 나타내는 조사)',
    '~は는 주제를 나타내는 조사입니다.\n\n"~는/은"이라는 의미로, 문장의 주제를 나타냅니다.\n\n예: 私は学生です (저는 학생입니다)\n\n~が와의 차이: ~は는 대조나 강조의 의미가 있고, ~が는 주어를 나타냅니다.',
    'grammar',
    [
      {
        text: '私は学生です。',
        translation: '저는 학생입니다.',
        explanation: '~は는 주제를 나타내며, "~는/은"이라는 의미입니다.'
      },
      {
        text: 'これは本です。',
        translation: '이것은 책입니다.',
        explanation: '~は는 사물의 주제를 나타낼 때도 사용됩니다.'
      }
    ],
    [
      {
        id: 6,
        level: 'N5',
        question_type: 'grammar',
        question_text: '___は学生です。 (저는 학생입니다)',
        choices: ['私', '私が', '私を', '私に'],
        correct_answer: '私',
        explanation: '~は 앞에는 조사 없이 명사만 올 수 있습니다.',
        difficulty: 1
      },
      {
        id: 7,
        level: 'N5',
        question_type: 'grammar',
        question_text: '~は와 ~が의 차이는?',
        choices: [
          '~は는 주제, ~が는 주어',
          '~は는 주어, ~が는 주제',
          '둘 다 같은 의미',
          '차이 없음'
        ],
        correct_answer: '~は는 주제, ~が는 주어',
        explanation: '~は는 주제를 나타내고, ~が는 주어를 나타냅니다.',
        difficulty: 3
      },
      {
        id: 8,
        level: 'N5',
        question_type: 'grammar',
        question_text: '다음 중 올바른 문장은?',
        choices: [
          '私は本を読みます。',
          '私は本が読みます。',
          '私は本に読みます。',
          '私は本で読みます。'
        ],
        correct_answer: '私は本を読みます。',
        explanation: '~を는 목적어를 나타내는 조사입니다.',
        difficulty: 2
      },
      {
        id: 9,
        level: 'N5',
        question_type: 'grammar',
        question_text: '___は何ですか？ (이것은 무엇입니까?)',
        choices: ['これ', 'これが', 'これを', 'これに'],
        correct_answer: 'これ',
        explanation: '~は 앞에는 조사 없이 명사만 올 수 있습니다.',
        difficulty: 1
      },
      {
        id: 10,
        level: 'N5',
        question_type: 'grammar',
        question_text: '~は의 주요 기능은?',
        choices: [
          '주제를 나타냄',
          '목적어를 나타냄',
          '장소를 나타냄',
          '시간을 나타냄'
        ],
        correct_answer: '주제를 나타냄',
        explanation: '~は는 주제를 나타내는 조사입니다.',
        difficulty: 1
      }
    ]
  )
];

// N5 어휘 개념 예시
export const n5VocabularyConcepts: StudyConcept[] = [
  createStudyConcept(
    'n5-vocab-1',
    '인사말 (あいさつ)',
    '일본어의 기본 인사말을 배워봅시다.\n\nおはようございます: 좋은 아침입니다\nこんにちは: 안녕하세요 (낮)\nこんばんは: 안녕하세요 (저녁)\nさようなら: 안녕히 가세요\nありがとうございます: 감사합니다',
    'vocabulary',
    [
      {
        text: 'おはようございます',
        translation: '좋은 아침입니다',
        explanation: '아침 인사로 사용됩니다. 친한 사이에서는 おはよう라고 줄여서 말하기도 합니다.'
      },
      {
        text: 'こんにちは',
        translation: '안녕하세요',
        explanation: '낮 시간대 인사로 사용됩니다. は는 조사이지만 여기서는 わ로 발음합니다.'
      },
      {
        text: 'ありがとうございます',
        translation: '감사합니다',
        explanation: '감사 인사로 사용됩니다. 친한 사이에서는 ありがとう라고 줄여서 말하기도 합니다.'
      }
    ],
    [
      {
        id: 11,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '"좋은 아침입니다"는 일본어로?',
        choices: [
          'おはようございます',
          'こんにちは',
          'こんばんは',
          'さようなら'
        ],
        correct_answer: 'おはようございます',
        explanation: 'おはようございます는 아침 인사입니다.',
        difficulty: 1
      },
      {
        id: 12,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '"감사합니다"는 일본어로?',
        choices: [
          'すみません',
          'ありがとうございます',
          'ごめんなさい',
          'いただきます'
        ],
        correct_answer: 'ありがとうございます',
        explanation: 'ありがとうございます는 감사 인사입니다.',
        difficulty: 1
      },
      {
        id: 13,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '낮 시간대 인사는?',
        choices: [
          'おはようございます',
          'こんにちは',
          'こんばんは',
          'おやすみなさい'
        ],
        correct_answer: 'こんにちは',
        explanation: 'こんにちは는 낮 시간대 인사입니다.',
        difficulty: 1
      },
      {
        id: 14,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '"안녕히 가세요"는 일본어로?',
        choices: [
          'さようなら',
          'またね',
          'じゃあね',
          'すべて正しい'
        ],
        correct_answer: 'すべて正しい',
        explanation: '모두 작별 인사로 사용됩니다. さようなら가 가장 정중한 표현입니다.',
        difficulty: 2
      },
      {
        id: 15,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '저녁 시간대 인사는?',
        choices: [
          'おはようございます',
          'こんにちは',
          'こんばんは',
          'おやすみなさい'
        ],
        correct_answer: 'こんばんは',
        explanation: 'こんばんは는 저녁 시간대 인사입니다.',
        difficulty: 1
      }
    ]
  )
];

// 모든 개념 통합
export const allStudyConcepts: StudyConcept[] = [
  ...n5GrammarConcepts,
  ...n5VocabularyConcepts
];

