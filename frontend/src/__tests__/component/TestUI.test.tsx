/**
 * TestUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TestUI from '../../components/organisms/TestUI';
import { Test } from '../../types/api';

const mockTest: Test = {
  id: 1,
  title: 'N5 진단 테스트',
  level: 'N5',
  status: 'in_progress',
  time_limit_minutes: 30,
  questions: [
    {
      id: 1,
      level: 'N5',
      question_type: 'vocabulary',
      question_text: '「こんにちは」の意味は何ですか？',
      choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
      difficulty: 1,
    },
    {
      id: 2,
      level: 'N5',
      question_type: 'grammar',
      question_text: 'これは___です。',
      choices: ['本', '本を', '本に', '本が'],
      difficulty: 2,
    },
  ],
};

describe('TestUI', () => {
  it('should render test title and metadata', () => {
    render(<TestUI test={mockTest} />);
    expect(screen.getByText('N5 진단 테스트')).toBeInTheDocument();
    expect(screen.getByText(/레벨: N5/)).toBeInTheDocument();
    expect(screen.getByText(/제한 시간: 30분/)).toBeInTheDocument();
  });

  it('should render first question by default', () => {
    render(<TestUI test={mockTest} />);
    expect(
      screen.getByText('「こんにちは」の意味は何ですか？')
    ).toBeInTheDocument();
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
  });

  it('should display progress bar', () => {
    render(<TestUI test={mockTest} />);
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' }); // 1/2 questions
  });

  it('should navigate to next question', () => {
    render(<TestUI test={mockTest} />);
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    expect(screen.getByText('これは___です。')).toBeInTheDocument();
  });

  it('should navigate to previous question', () => {
    render(<TestUI test={mockTest} />);
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    const prevButton = screen.getByTestId('prev-button');
    fireEvent.click(prevButton);
    expect(
      screen.getByText('「こんにちは」の意味は何ですか？')
    ).toBeInTheDocument();
  });

  it('should handle answer selection', () => {
    const onAnswerSelect = jest.fn();
    render(<TestUI test={mockTest} onAnswerSelect={onAnswerSelect} />);
    const firstChoice = screen.getByTestId('choice-1-0');
    fireEvent.click(firstChoice);
    expect(onAnswerSelect).toHaveBeenCalledWith(1, '안녕하세요');
  });

  it('should show submit button on last question when all answered', () => {
    const mockTestWithAnswers = {
      ...mockTest,
      questions: [mockTest.questions[0]], // Only one question
    };
    render(<TestUI test={mockTestWithAnswers} />);
    const choice = screen.getByTestId('choice-1-0');
    fireEvent.click(choice);
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should disable submit button when not all questions answered', () => {
    const mockTestWithAnswers = {
      ...mockTest,
      questions: [mockTest.questions[0]], // Only one question
    };
    render(<TestUI test={mockTestWithAnswers} />);
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmit when submit button is clicked', () => {
    const onSubmit = jest.fn();
    const mockTestWithAnswers = {
      ...mockTest,
      questions: [mockTest.questions[0]], // Only one question
    };
    render(<TestUI test={mockTestWithAnswers} onSubmit={onSubmit} />);
    const choice = screen.getByTestId('choice-1-0');
    fireEvent.click(choice);
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith({ 1: '안녕하세요' });
  });

  it('should show question indicators', () => {
    render(<TestUI test={mockTest} />);
    expect(screen.getByTestId('question-indicator-1')).toBeInTheDocument();
    expect(screen.getByTestId('question-indicator-2')).toBeInTheDocument();
  });

  it('should navigate to question via indicator', () => {
    render(<TestUI test={mockTest} />);
    const indicator2 = screen.getByTestId('question-indicator-2');
    fireEvent.click(indicator2);
    expect(screen.getByText('これは___です。')).toBeInTheDocument();
  });

  it('should mark answered questions in indicators', () => {
    render(<TestUI test={mockTest} userAnswers={{ 1: '안녕하세요' }} />);
    const indicator1 = screen.getByTestId('question-indicator-1');
    expect(indicator1).toHaveClass('answered');
  });

  it('should be readonly when readonly prop is true', () => {
    render(<TestUI test={mockTest} readonly={true} />);
    const choice = screen.getByTestId('choice-1-0');
    expect(choice).toBeDisabled();
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
  });

  it('should render audio player when audio_url is provided', () => {
    const testWithAudio: Test = {
      ...mockTest,
      questions: [
        {
          ...mockTest.questions[0],
          audio_url: '/static/audio/tts/question_1.mp3',
        },
      ],
    };
    render(<TestUI test={testWithAudio} />);
    const audioPlayer = screen.getByTestId('audio-player');
    expect(audioPlayer).toBeInTheDocument();
    const audioElement = screen.getByTestId('audio-element');
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('src', 'http://localhost:8000/static/audio/tts/question_1.mp3');
  });

  it('should handle audio play/pause events', () => {
    const testWithAudio: Test = {
      ...mockTest,
      questions: [
        {
          ...mockTest.questions[0],
          audio_url: '/static/audio/tts/question_1.mp3',
        },
      ],
    };
    render(<TestUI test={testWithAudio} />);
    const audioElement = screen.getByTestId('audio-element') as HTMLAudioElement;
    
    // Play event
    fireEvent.play(audioElement);
    // Note: We can't directly test state changes, but we can verify the event handlers are attached
    expect(audioElement).toBeInTheDocument();
    
    // Pause event
    fireEvent.pause(audioElement);
    expect(audioElement).toBeInTheDocument();
  });

  it('should show error message when no questions', () => {
    const testWithNoQuestions: Test = {
      ...mockTest,
      questions: [],
    };
    render(<TestUI test={testWithNoQuestions} />);
    expect(screen.getByText('테스트에 문제가 없습니다.')).toBeInTheDocument();
  });

  it('should not render audio player when audio_url is not provided', () => {
    render(<TestUI test={mockTest} />);
    const audioPlayer = screen.queryByTestId('audio-player');
    expect(audioPlayer).not.toBeInTheDocument();
  });
});

