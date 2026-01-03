/**
 * StudyUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StudyUI from '../../components/organisms/StudyUI';
import { Question } from '../../types/api';

const mockQuestions: Question[] = [
  {
    id: 1,
    level: 'N5',
    question_type: 'vocabulary',
    question_text: '「こんにちは」の意味は何ですか？',
    choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
    correct_answer: '안녕하세요', // StudyUI는 실제 선택지 텍스트와 비교
    explanation: 'こんにちはは「안녕하세요」という意味です。',
    difficulty: 1,
  },
  {
    id: 2,
    level: 'N5',
    question_type: 'grammar',
    question_text: 'これは___です。',
    choices: ['本', '本を', '本に', '本が'],
    correct_answer: '本', // StudyUI는 실제 선택지 텍스트와 비교
    explanation: 'これは本です。',
    difficulty: 1,
  },
  {
    id: 3,
    level: 'N4',
    question_type: 'listening',
    question_text: '聞いてください。',
    choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
    correct_answer: '選択肢2', // StudyUI는 실제 선택지 텍스트와 비교
    explanation: '正解はBです。',
    difficulty: 2,
    audio_url: '/audio/test.mp3',
  },
];

describe('StudyUI', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empty state when no questions', () => {
    render(<StudyUI questions={[]} />);

    expect(screen.getByText('학습할 문제가 없습니다.')).toBeInTheDocument();
  });

  it('should display first question on initial load', () => {
    render(<StudyUI questions={mockQuestions} />);

    expect(screen.getByText('학습 모드')).toBeInTheDocument();
    expect(screen.getByText('「こんにちは」の意味は何ですか？')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should display question type, level, and difficulty', () => {
    render(<StudyUI questions={mockQuestions} />);

    expect(screen.getByText('vocabulary')).toBeInTheDocument();
    expect(screen.getByText('N5')).toBeInTheDocument();
    expect(screen.getByText('난이도: 1')).toBeInTheDocument();
  });

  it('should display all choices', () => {
    render(<StudyUI questions={mockQuestions} />);

    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
    expect(screen.getByText('감사합니다')).toBeInTheDocument();
  });

  it('should show feedback immediately when selecting an answer', async () => {
    render(<StudyUI questions={mockQuestions} />);

    // name 속성으로 input 찾기
    const choiceAInput = document.querySelector('input[name="question-1"][value="A"]') as HTMLInputElement;
    expect(choiceAInput).toBeInTheDocument();
    
    // onChange 이벤트를 직접 트리거
    await act(async () => {
      fireEvent.change(choiceAInput, { target: { value: 'A', checked: true } });
    });

    await waitFor(() => {
      expect(screen.getByText('정답입니다!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show incorrect feedback when selecting wrong answer', async () => {
    render(<StudyUI questions={mockQuestions} />);

    // name 속성으로 input 찾기
    const choiceBInput = document.querySelector('input[name="question-1"][value="B"]') as HTMLInputElement;
    expect(choiceBInput).toBeInTheDocument();
    
    // onChange 이벤트를 직접 트리거
    await act(async () => {
      fireEvent.change(choiceBInput, { target: { value: 'B', checked: true } });
    });

    await waitFor(() => {
      expect(screen.getByText(/오답입니다\. 정답은 A입니다\./)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display explanation when feedback is shown', async () => {
    render(<StudyUI questions={mockQuestions} />);

    const choiceA = screen.getByText('A.').closest('label');
    expect(choiceA).toBeInTheDocument();
    fireEvent.click(choiceA!);

    await waitFor(() => {
      expect(screen.getByText('해설:')).toBeInTheDocument();
      expect(screen.getByText('こんにちはは「안녕하세요」という意味です。')).toBeInTheDocument();
    });
  });

  it('should highlight correct answer in green', async () => {
    render(<StudyUI questions={mockQuestions} />);

    // name 속성으로 input 찾기
    const choiceAInput = document.querySelector('input[name="question-1"][value="A"]') as HTMLInputElement;
    expect(choiceAInput).toBeInTheDocument();
    
    // onChange 이벤트를 직접 트리거
    await act(async () => {
      fireEvent.change(choiceAInput, { target: { value: 'A', checked: true } });
    });

    await waitFor(() => {
      const correctChoice = screen.getByText('A.').closest('label');
      expect(correctChoice).toHaveClass('correct');
    }, { timeout: 3000 });
  });

  it('should highlight incorrect answer in red', async () => {
    render(<StudyUI questions={mockQuestions} />);

    const choiceB = screen.getByText('B.').closest('label');
    expect(choiceB).toBeInTheDocument();
    fireEvent.click(choiceB!);

    await waitFor(() => {
      const incorrectChoice = screen.getByText('B.').closest('label');
      expect(incorrectChoice).toHaveClass('incorrect');
    });
  });

  it('should disable choices after feedback is shown', async () => {
    render(<StudyUI questions={mockQuestions} />);

    const choiceA = screen.getByText('A.').closest('label');
    expect(choiceA).toBeInTheDocument();
    fireEvent.click(choiceA!);

    await waitFor(() => {
      const input = choiceA!.querySelector('input[type="radio"]');
      expect(input).toBeDisabled();
    });
  });

  it('should navigate to next question', () => {
    render(<StudyUI questions={mockQuestions} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    expect(screen.getByText('これは___です。')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous question', () => {
    render(<StudyUI questions={mockQuestions} />);

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    const prevButton = screen.getByText('이전');
    fireEvent.click(prevButton);

    expect(screen.getByText('「こんにちは」の意味は何ですか？')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should disable previous button on first question', () => {
    render(<StudyUI questions={mockQuestions} />);

    const prevButton = screen.getByText('이전');
    expect(prevButton).toBeDisabled();
  });

  it('should show submit button on last question when all answered', async () => {
    render(<StudyUI questions={mockQuestions} onSubmit={mockOnSubmit} />);

    // 첫 번째 문제 답변
    const choiceA1 = screen.getByText('A.').closest('label');
    expect(choiceA1).toBeInTheDocument();
    fireEvent.click(choiceA1!);

    // 다음 문제로 이동
    await waitFor(() => {
      const nextButton = screen.getByText('다음');
      fireEvent.click(nextButton);
    });

    // 두 번째 문제 답변
    await waitFor(() => {
      const choiceA2 = screen.getByText('A.').closest('label');
      expect(choiceA2).toBeInTheDocument();
      fireEvent.click(choiceA2!);
    });

    // 마지막 문제로 이동
    await waitFor(() => {
      const nextButton2 = screen.getByText('다음');
      fireEvent.click(nextButton2);
    });

    // 마지막 문제 답변
    await waitFor(() => {
      const choiceB = screen.getByText('B.').closest('label');
      expect(choiceB).toBeInTheDocument();
      fireEvent.click(choiceB!);
    });

    await waitFor(() => {
      const submitButton = screen.getByText('제출');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should disable submit button when not all questions answered', async () => {
    render(<StudyUI questions={mockQuestions} onSubmit={mockOnSubmit} />);

    // 첫 번째 문제만 답변
    const choiceA = screen.getByText('A.').closest('label');
    expect(choiceA).toBeInTheDocument();
    fireEvent.click(choiceA!);

    // 마지막 문제로 이동
    await waitFor(() => {
      const nextButton = screen.getByText('다음');
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      const nextButton2 = screen.getByText('다음');
      fireEvent.click(nextButton2);
    });

    await waitFor(() => {
      const submitButton = screen.getByText('제출');
      expect(submitButton).toBeDisabled();
    });
  });

  it('should call onSubmit with all answers when submitting', async () => {
    render(<StudyUI questions={mockQuestions} onSubmit={mockOnSubmit} />);

    // 모든 문제 답변
    const choiceA1 = screen.getByText('A.').closest('label');
    expect(choiceA1).toBeInTheDocument();
    fireEvent.click(choiceA1!);

    await waitFor(() => {
      const nextButton = screen.getByText('다음');
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      const choiceA2 = screen.getByText('A.').closest('label');
      expect(choiceA2).toBeInTheDocument();
      fireEvent.click(choiceA2!);
    });

    await waitFor(() => {
      const nextButton2 = screen.getByText('다음');
      fireEvent.click(nextButton2);
    });

    await waitFor(() => {
      const choiceB = screen.getByText('B.').closest('label');
      expect(choiceB).toBeInTheDocument();
      fireEvent.click(choiceB!);
    });

    await waitFor(() => {
      const submitButton = screen.getByText('제출');
      fireEvent.click(submitButton);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      1: 'A',
      2: 'A',
      3: 'B',
    });
  });

  it('should display audio player when question has audio_url', () => {
    render(<StudyUI questions={mockQuestions} />);

    // 세 번째 문제로 이동 (audio_url 있음)
    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(screen.getByText('聞いてください。')).toBeInTheDocument();
    const audioElement = document.querySelector('audio');
    expect(audioElement).toBeInTheDocument();
  });

  it('should update progress bar correctly', () => {
    render(<StudyUI questions={mockQuestions} />);

    const progressBar = screen.getByText('1 / 3').previousElementSibling;
    expect(progressBar).toBeInTheDocument();
  });
});

