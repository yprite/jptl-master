/**
 * FlashcardUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FlashcardUI from '../../components/organisms/FlashcardUI';
import { Vocabulary } from '../../types/api';

const mockVocabularies: Vocabulary[] = [
  {
    id: 1,
    word: 'こんにちは',
    reading: 'こんにちは',
    meaning: '안녕하세요',
    level: 'N5',
    memorization_status: 'not_memorized',
    example_sentence: 'こんにちは、元気ですか？',
  },
  {
    id: 2,
    word: 'ありがとう',
    reading: 'ありがとう',
    meaning: '감사합니다',
    level: 'N5',
    memorization_status: 'learning',
  },
  {
    id: 3,
    word: 'さようなら',
    reading: 'さようなら',
    meaning: '안녕히 가세요',
    level: 'N4',
    memorization_status: 'memorized',
  },
];

describe('FlashcardUI', () => {
  const mockOnStatusUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empty state when no vocabularies', () => {
    render(<FlashcardUI vocabularies={[]} />);

    expect(screen.getByText('학습할 단어가 없습니다.')).toBeInTheDocument();
  });

  it('should display first vocabulary on initial load', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    expect(screen.getByText('플래시카드 학습')).toBeInTheDocument();
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('こんにちは')).toBeInTheDocument(); // reading
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should flip card when clicking on it', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const card = screen.getByText('こんにちは').closest('.flashcard');
    expect(card).toBeInTheDocument();

    fireEvent.click(card!);

    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
  });

  it('should navigate to next vocabulary', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    expect(screen.getByText('ありがとう')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous vocabulary', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    const prevButton = screen.getByText('이전');
    fireEvent.click(prevButton);

    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should disable previous button on first card', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const prevButton = screen.getByText('이전');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last card', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });

  it('should call onStatusUpdate when clicking status button', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} onStatusUpdate={mockOnStatusUpdate} />);

    const memorizedButton = screen.getByText('암기완료');
    fireEvent.click(memorizedButton);

    expect(mockOnStatusUpdate).toHaveBeenCalledWith(1, 'memorized');
  });

  it('should update status for different status buttons', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} onStatusUpdate={mockOnStatusUpdate} />);

    const notMemorizedButton = screen.getByText('미암기');
    fireEvent.click(notMemorizedButton);

    expect(mockOnStatusUpdate).toHaveBeenCalledWith(1, 'not_memorized');

    const learningButton = screen.getByText('학습중');
    fireEvent.click(learningButton);

    expect(mockOnStatusUpdate).toHaveBeenCalledWith(1, 'learning');
  });

  it('should display example sentence when vocabulary has it', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const card = screen.getByText('こんにちは').closest('.flashcard');
    fireEvent.click(card!);

    expect(screen.getByText('예문:')).toBeInTheDocument();
    expect(screen.getByText('こんにちは、元気ですか？')).toBeInTheDocument();
  });

  it('should not display example sentence when vocabulary does not have it', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    const card = screen.getByText('ありがとう').closest('.flashcard');
    fireEvent.click(card!);

    expect(screen.queryByText('예문:')).not.toBeInTheDocument();
  });

  it('should reset flip state when navigating to next card', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const card = screen.getByText('こんにちは').closest('.flashcard');
    fireEvent.click(card!);

    expect(screen.getByText('안녕하세요')).toBeInTheDocument();

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    // 카드가 뒤집히지 않은 상태로 표시되어야 함
    expect(screen.getByText('ありがとう')).toBeInTheDocument();
    expect(screen.queryByText('감사합니다')).not.toBeInTheDocument();
  });

  it('should display progress bar correctly', () => {
    render(<FlashcardUI vocabularies={mockVocabularies} />);

    const progressBar = screen.getByText('1 / 3').previousElementSibling;
    expect(progressBar).toBeInTheDocument();
  });
});

